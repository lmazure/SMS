import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";

const SQUASHTM_API_URL = process.env.SQUASHTM_API_URL || "http://localhost:8090/squash";

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "1.0.0",
});

interface SquashProject {
    _type: string;
    id: number;
    name: string;
    description: string;
    label: string;
    _links: {
        self: {
            href: string;
        };
    };
}

interface SquashProjectsResponse {
    _embedded?: {
        projects?: SquashProject[];
    };
}

async function makeSquashRequest<T>(url: string, method: string = "GET", body?: any): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${process.env.SQUASHTM_API_KEY}`,
        Accept: "application/json",
    };

    if (body) {
        headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            console.error(`SquashTM Request failed: ${response.status} ${response.statusText}`);
            throw new McpError(ErrorCode.InternalError, `SquashTM Request failed: ${response.status} ${response.statusText}`);
        }
        return (await response.json()) as T;
    } catch (error) {
        // Re-throw McpErrors as-is
        if (error instanceof McpError) {
            throw error;
        }
        console.error("Error making SquashTM request:", error);
        throw new McpError(ErrorCode.InternalError, `Error making SquashTM request: ${error}`);
    }
}

server.tool(
    "list_projects",
    "Get list of SquashTM projects",
    {},
    async () => {
        const url = `${SQUASHTM_API_URL}/api/rest/latest/projects?type=STANDARD`;
        const data = await makeSquashRequest<SquashProjectsResponse>(url);

        if (!data || !data._embedded || !data._embedded.projects) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve projects or no projects found.",
                    },
                ],
            };
        }

        const projects = data._embedded.projects;

        const detailedProjects = await Promise.all(
            projects.map(async (p) => {
                const detailsUrl = `${SQUASHTM_API_URL}/api/rest/latest/projects/${p.id}`;
                const details = await makeSquashRequest<SquashProject>(detailsUrl);
                return {
                    id: p.id,
                    name: p.name,
                    label: details.label,
                    description: details.description,
                };
            })
        );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(detailedProjects, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "create_test_case",
    "Create a new test case in SquashTM",
    {
        project_id: z.number().describe("The ID of the project where the test case will be created"),
        name: z.string().describe("The name of the test case"),
        description: z.string().describe("Description of the test case"),
    },
    async ({ project_id, name, description }) => {
        const url = `${SQUASHTM_API_URL}/api/rest/latest/test-cases`;

        const payload = {
            _type: "test-case",
            name: name,
            parent: {
                _type: "project",
                id: project_id,
            },
            description: description,
        };

        const createdTestCase = await makeSquashRequest(url, "POST", payload);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(createdTestCase, null, 2),
                },
            ],
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SquashTM MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
