import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";

// Validate required environment variables
if (!process.env.SQUASHTM_API_KEY) {
    throw new Error("SQUASHTM_API_KEY environment variable is required");
}

const SQUASHTM_API_URL = (process.env.SQUASHTM_API_URL || "http://localhost:8090/squash").replace(/\/$/, '');

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

// Zod schemas for validation
const ListProjectsSchema = z.object({});

const CreateTestCasesSchema = z.object({
    project_id: z.number().describe("The ID of the project where the test cases will be created"),
    test_cases: z.array(z.object({
        name: z.string().describe("The name of the test case"),
        description: z.string().describe("Description of the test case"),
        steps: z.array(z.object({
            action: z.string().describe("The action to perform"),
            expected_result: z.string().describe("The expected result"),
        })).min(1).describe("List of test steps"),
    })).min(1).describe("List of test cases to create"),
});

async function makeSquashRequest<T>(url: string, method: string, body?: any): Promise<T> {
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
            const text = await response.text();
            console.error(`SquashTM Request failed: ${response.status} ${response.statusText} - ${text}`);
            throw new McpError(
                ErrorCode.InternalError,
                `SquashTM Request failed: ${response.status} ${response.statusText}`
            );
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            return (await response.json()) as T;
        } else {
            const text = await response.text();
            throw new McpError(ErrorCode.InternalError, `Unexpected response format: ${text}`);
        }
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        console.error("Error making SquashTM request:", error);
        throw new McpError(ErrorCode.InternalError, `Error making SquashTM request: ${error}`);
    }
}

// Register list_projects tool
server.registerTool(
    "list_projects",
    {
        title: "List Projects",
        description: "Get list of SquashTM projects",
        inputSchema: ListProjectsSchema,
    },
    async () => {
        const url = `${SQUASHTM_API_URL}/api/rest/latest/projects?type=STANDARD`;
        const data = await makeSquashRequest<SquashProjectsResponse>(url, "GET");

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
                const details = await makeSquashRequest<SquashProject>(detailsUrl, "GET");
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
    }
);

// Register create_test_cases tool
server.registerTool(
    "create_test_cases",
    {
        title: "Create Test Cases",
        description: "Create test cases in a project in SquashTM",
        inputSchema: CreateTestCasesSchema,
    },
    async (args) => {
        const url = `${SQUASHTM_API_URL}/api/rest/latest/test-cases`;

        const createdTestCases = await Promise.all(
            args.test_cases.map(async (testCase) => {
                const payload: any = {
                    _type: "test-case",
                    name: testCase.name,
                    parent: {
                        _type: "project",
                        id: args.project_id,
                    },
                    description: testCase.description,
                    steps: testCase.steps.map((step) => ({
                        _type: "action-step",
                        action: step.action,
                        expected_result: step.expected_result,
                    })),
                };

                return await makeSquashRequest<any>(url, "POST", payload);
            })
        );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(createdTestCases, null, 2),
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