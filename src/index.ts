#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from 'url';

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "0.0.9",
});

// Register tools
import { registerProjectTools } from "./projects.js";
import { registerFolderTools } from "./folders.js";
import { registerRequirementTools } from "./requirements.js";
import { registerTestCaseTools } from "./test_cases.js";

try {
    registerProjectTools(server);
    registerFolderTools(server);
    registerRequirementTools(server);
    registerTestCaseTools(server);
    console.error("All tools registered successfully");
} catch (error) {
    console.error("Error registering tools:", error);
    throw error;
}

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SquashTM MCP Server running on stdio");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(`Fatal error in main(): ${error}`);
        console.error(error.stack);
        process.exit(1);
    });
}