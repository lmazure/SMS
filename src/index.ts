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

async function makeSquashRequest<T>(url: string): Promise<T> {
    const headers = {
        Authorization: `Bearer ${process.env.SQUASHTM_API_KEY}`,
        Accept: "application/json",
    };

    try {
        const response = await fetch(url, { headers });
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SquashTM MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
