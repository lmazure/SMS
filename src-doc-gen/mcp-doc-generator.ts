import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

interface JSONRPCRequest {
    jsonrpc: '2.0';
    id: number;
    method: string;
    params?: any;
}

interface JSONRPCResponse {
    jsonrpc: '2.0';
    id: number;
    result?: any;
    error?: any;
}

interface Tool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

class MCPClient {
    private process: any;
    private buffer: string = '';
    private requestId: number = 0;
    private pendingRequests: Map<number, (response: any) => void> = new Map();

    constructor(private command: string, private args: string[]) { }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.command, this.args);

            this.process.stdout.on('data', (data: Buffer) => {
                this.buffer += data.toString();
                this.processBuffer();
            });

            this.process.stderr.on('data', (data: Buffer) => {
                console.error('Server stderr:', data.toString());
            });

            this.process.on('error', (error: Error) => {
                reject(error);
            });

            // Give the process a moment to start
            setTimeout(resolve, 100);
        });
    }

    private processBuffer(): void {
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    const message: JSONRPCResponse = JSON.parse(line);
                    const callback = this.pendingRequests.get(message.id);
                    if (callback) {
                        this.pendingRequests.delete(message.id);
                        callback(message);
                    }
                } catch (e) {
                    console.error('Failed to parse message:', line);
                }
            }
        }
    }

    private async sendRequest(method: string, params?: any): Promise<any> {
        const id = this.requestId++;
        const request: JSONRPCRequest = {
            jsonrpc: '2.0',
            id,
            method,
            params: params || {}
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, (response: JSONRPCResponse) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response.result);
                }
            });

            this.process.stdin.write(JSON.stringify(request) + '\n');

            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 5000);
        });
    }

    async initialize(): Promise<void> {
        await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'mcp-doc-generator',
                version: '1.0.0'
            }
        });
    }

    async listTools(): Promise<Tool[]> {
        const result = await this.sendRequest('tools/list');
        return result.tools || [];
    }

    close(): void {
        if (this.process) {
            this.process.kill();
        }
    }
}

function generateMarkdown(tools: Tool[]): string {
    let markdown = '# MCP Server Tools\n\n';
    markdown += `This document lists all available tools in the MCP server.\n\n`;
    markdown += `**Total Tools:** ${tools.length}\n\n`;
    markdown += '---\n\n';

    for (const tool of tools) {
        markdown += `## ${tool.name}\n\n`;

        if (tool.description) {
            markdown += `${tool.description}\n\n`;
        }

        markdown += '### Input Schema\n\n';
        markdown += '```json\n';
        markdown += JSON.stringify(tool.inputSchema, null, 2);
        markdown += '\n```\n\n';

        // Generate a table of parameters if properties exist
        if (tool.inputSchema.properties) {
            markdown += '### Parameters\n\n';
            markdown += '| Parameter | Type | Required | Description |\n';
            markdown += '|-----------|------|----------|-------------|\n';

            const required = tool.inputSchema.required || [];

            for (const [paramName, paramSchema] of Object.entries(tool.inputSchema.properties)) {
                const schema = paramSchema as any;
                const type = schema.type || 'any';
                const isRequired = required.includes(paramName) ? 'Yes' : 'No';
                const description = schema.description || '-';

                markdown += `| \`${paramName}\` | \`${type}\` | ${isRequired} | ${description} |\n`;
            }

            markdown += '\n';
        }

        markdown += '---\n\n';
    }

    return markdown;
}

async function main() {
    console.log('Connecting to MCP server...');

    const client = new MCPClient('node', ['build/index.js']);

    try {
        await client.connect();
        console.log('Connected to MCP server');

        console.log('Initializing...');
        await client.initialize();
        console.log('Initialized');

        console.log('Fetching tools...');
        const tools = await client.listTools();
        console.log(`Found ${tools.length} tools`);

        console.log('Generating Markdown...');
        const markdown = generateMarkdown(tools);

        const outputFile = 'MCP_TOOLS.md';
        writeFileSync(outputFile, markdown);
        console.log(`Documentation generated: ${outputFile}`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

main();
