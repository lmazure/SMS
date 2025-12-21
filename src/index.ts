#!/usr/bin/env node

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
if (!process.env.SQUASHTM_URL) {
    throw new Error("SQUASHTM_URL environment variable is required");
}
const SQUASHTM_API_KEY = process.env.SQUASHTM_API_KEY;
const SQUASHTM_URL = process.env.SQUASHTM_URL.replace(/\/$/, '');
const SQUASHTM_API_URL = `${SQUASHTM_URL}/api/rest/latest`;

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "0.0.1",
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

interface SquashPaginatedResponse<T> {
    _embedded?: {
        [key: string]: T[];
    };
    page: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}

// Zod schemas for validation
const ListProjectsSchema = z.object({});

const CreateProjectSchema = z.object({
    name: z.string().describe("The name of the project"),
    label: z.string().optional().describe("The label of the project"),
    description: z.string().optional().describe("The description of the project (HTML allowed)"),
});

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

const GetRequirementFoldersTreeSchema = z.object({
    project_ids: z.array(z.number()).min(1).describe("List of project IDs to retrieve the requirement folders tree for"),
});

const GetTestCaseFoldersTreeSchema = z.object({
    project_ids: z.array(z.number()).min(1).describe("List of project IDs to retrieve the test case folders tree for"),
});

const GetCampaignFoldersTreeSchema = z.object({
    project_ids: z.array(z.number()).min(1).describe("List of project IDs to retrieve the campaign folders tree for"),
});

const GetTestCaseFolderContentSchema = z.object({
    folder_id: z.number().describe("The ID of the test case folder to retrieve content for"),
});

interface SquashFolder {
    _type: string;
    id: number;
    name: string;
    url: string;
    children: SquashFolder[];
}

interface SquashFolderDetail {
    _type: string;
    id: number;
    name: string;
    description: string;
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

interface SquashTestCaseDetail {
    id: number;
    name: string;
    description: string;
    prerequisite: string;
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

interface SquashProjectTree {
    _type: string;
    id: number;
    name: string;
    folders: SquashFolder[];
}

interface SimplifiedFolder {
    id: number;
    name: string;
    description: string;
    created_by: string;
    created_on: string;
    modified_by: string;
    modified_on: string;
    children: SimplifiedFolder[];
}

interface SimplifiedProjectTree {
    id: number;
    name: string;
    folders: SimplifiedFolder[];
}

async function makeSquashRequest<T>(endpoint: string, method: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${SQUASHTM_API_KEY}`,
        Accept: "application/json",
    };

    if (body) {
        headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(SQUASHTM_API_URL + "/" + endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`SquashTM Request failed: ${response.status} - ${text}`);
            // if the response is JSON, extract the message from the "message" field
            // otherwise, use the text
            let message = text;
            try {
                const json = JSON.parse(text);
                message = json.message || text;
            } catch {
                // Not JSON
            }
            throw new McpError(
                ErrorCode.InternalError,
                `SquashTM Request failed:\nstatus=${response.status}\nerror=${message}`
            );
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            return (await response.json()) as T;
        } else {
            const text = await response.text();
            console.error(`Unexpected response format: ${text}`);
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
        let allProjects: SquashProject[] = [];
        let currentPage = 0;
        let totalPages = 1;

        while (currentPage < totalPages) {
            const data = await makeSquashRequest<SquashPaginatedResponse<SquashProject>>(
                `projects?type=STANDARD&page=${currentPage}&size=50`,
                "GET"
            );

            if (data?._embedded?.projects) {
                allProjects.push(...data._embedded.projects);
            }

            if (data?.page) {
                totalPages = data.page.totalPages;
                currentPage++;
            } else {
                break;
            }
        }

        if (allProjects.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No projects found.",
                    },
                ],
            };
        }

        const detailedProjects = await Promise.all(
            allProjects.map(async (p) => {
                const details = await makeSquashRequest<SquashProject>(`projects/${p.id}`, "GET");
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

async function getDetailedFolders(folders: SquashFolder[], type: "requirement-folders" | "test-case-folders" | "campaign-folders"): Promise<SimplifiedFolder[]> {
    return Promise.all(folders.map(async folder => {
        const details = await makeSquashRequest<SquashFolderDetail>(`${type}/${folder.id}`, "GET");
        return {
            id: folder.id,
            name: folder.name,
            description: details.description,
            created_by: details.created_by,
            created_on: details.created_on,
            modified_by: details.last_modified_by,
            modified_on: details.last_modified_on,
            children: await getDetailedFolders(folder.children || [], type)
        };
    }));
}

// Register get_requirement_folders_tree tool
server.registerTool(
    "get_requirement_folders_tree",
    {
        title: "Get Requirement Folders Tree",
        description: "Get the requirement folders tree for specified projects with detailed folder info",
        inputSchema: GetRequirementFoldersTreeSchema,
    },
    async (args) => {
        const ids = args.project_ids.join(",");
        const data = await makeSquashRequest<SquashProjectTree[]>(`requirement-folders/tree/${ids}`, "GET");

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve requirement folders tree.",
                    },
                ],
            };
        }

        const simplifiedData: SimplifiedProjectTree[] = await Promise.all(data.map(async project => ({
            id: project.id,
            name: project.name,
            folders: await getDetailedFolders(project.folders || [], "requirement-folders")
        })));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplifiedData, null, 2),
                },
            ],
        };
    }
);

// Register get_test_case_folder_tree tool
server.registerTool(
    "get_test_case_folder_tree",
    {
        title: "Get Test Case Folders Tree",
        description: "Get the test case folders tree for specified projects with detailed folder info",
        inputSchema: GetTestCaseFoldersTreeSchema,
    },
    async (args) => {
        const ids = args.project_ids.join(",");
        const data = await makeSquashRequest<SquashProjectTree[]>(`test-case-folders/tree/${ids}`, "GET");

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve test case folders tree.",
                    },
                ],
            };
        }

        const simplifiedData: SimplifiedProjectTree[] = await Promise.all(data.map(async project => ({
            id: project.id,
            name: project.name,
            folders: await getDetailedFolders(project.folders || [], "test-case-folders")
        })));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplifiedData, null, 2),
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

                return await makeSquashRequest<any>("test-cases", "POST", payload);
            })
        );

        return {
            content: [],
        };
    }
);

// Register create_project tool
server.registerTool(
    "create_project",
    {
        title: "Create Project",
        description: "Create a new project in SquashTM",
        inputSchema: CreateProjectSchema,
    },
    async (args) => {
        const payload = {
            _type: "project",
            name: args.name,
            label: args.label,
            description: args.description,
        };

        const response = await makeSquashRequest<any>("projects", "POST", payload);

        return {
            content: [
                {
                    type: "text",
                    text: `Project created successfully with ID: ${response.id}`,
                },
            ],
        };
    }
);

// Register get_test_case_folder_content tool
server.registerTool(
    "get_test_case_folder_content",
    {
        title: "Get Test Case Folder Content",
        description: "Get the test cases of a test-case-folder (only includes items of type 'test-case')",
        inputSchema: GetTestCaseFolderContentSchema,
    },
    async (args) => {
        let allTestCases: any[] = [];
        let currentPage = 0;
        let totalPages = 1;

        while (currentPage < totalPages) {
            const data = await makeSquashRequest<SquashPaginatedResponse<any>>(
                `test-case-folders/${args.folder_id}/content?page=${currentPage}&size=50`,
                "GET"
            );

            if (!data || !data._embedded || !data._embedded.content) {
                break;
            }

            const testCases = data._embedded.content.filter((item: any) => item._type === "test-case");
            allTestCases.push(...testCases);

            if (data.page) {
                totalPages = data.page.totalPages;
                currentPage++;
            } else {
                break;
            }
        }

        if (allTestCases.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No test cases found in the specified folder.",
                    },
                ],
            };
        }

        const detailedTestCases = await Promise.all(
            allTestCases.map(async (tc) => {
                const details = await makeSquashRequest<SquashTestCaseDetail>(`test-cases/${tc.id}`, "GET");
                return {
                    id: details.id,
                    name: details.name,
                    prerequisite: details.prerequisite,
                    description: details.description,
                    created_by: details.created_by,
                    created_on: details.created_on,
                    last_modified_by: details.last_modified_by,
                    last_modified_on: details.last_modified_on,
                };
            })
        );

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(detailedTestCases, null, 2),
                },
            ],
        };
    }
);

// Register get_campaign_folder_tree tool
server.registerTool(
    "get_campaign_folder_tree",
    {
        title: "Get Campaign Folders Tree",
        description: "Get the campaign folders tree for specified projects with detailed folder info",
        inputSchema: GetCampaignFoldersTreeSchema,
    },
    async (args) => {
        const ids = args.project_ids.join(",");
        const data = await makeSquashRequest<SquashProjectTree[]>(`campaign-folders/tree/${ids}`, "GET");

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve campaign folders tree.",
                    },
                ],
            };
        }

        const simplifiedData: SimplifiedProjectTree[] = await Promise.all(data.map(async project => ({
            id: project.id,
            name: project.name,
            folders: await getDetailedFolders(project.folders || [], "campaign-folders")
        })));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplifiedData, null, 2),
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