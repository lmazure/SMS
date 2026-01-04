#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";
import { fileURLToPath } from 'url';
import { appendFileSync } from 'fs';
import { EOL } from 'os';

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
const LOG_FILE = 'sms.log';

function generateCorrelationId() {
    return Math.random().toString(36).substring(2, 9);
}

function logToFile(correlationId: string, message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${correlationId}: ${message}${EOL}`;
    try {
        appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
        // Fallback to console if writing to file fails
        console.error(`Failed to write to log file: ${error}`);
    }
}

function logErrorToConsole(correlationId: string, message: string) {
    console.error(message);
    logToFile(correlationId, message);
}

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
const ListProjectsInputSchema = z.object({});

const CreateProjectInputSchema = z.object({
    name: z.string().describe("The name of the project"),
    label: z.string().optional().describe("The label of the project"),
    description: z.string().optional().describe("The description of the project (HTML allowed)"),
});

const DeleteProjectInputSchema = z.object({
    id: z.number().describe("The ID of the project to delete"),
});

const CreateTestCasesInputSchema = z.object({
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

const GetRequirementFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the requirement folders tree for"),
});

const GetTestCaseFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the test case folders tree for"),
});

const GetCampaignFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the campaign folders tree for"),
});

const GetTestCaseFolderContentInputSchema = z.object({
    folder_id: z.number().describe("The ID of the test case folder to retrieve content for"),
});

const GetRequirementFolderContentInputSchema = z.object({
    folder_id: z.number().describe("The ID of the requirement folder to retrieve content for"),
});

// Recursive schema for folder structure
const FolderStructureSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders"),
}).describe("Folder structure"));

const CreateRequirementFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Array of subfolders")
});

const DeleteRequirementFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the folder to delete")
});

const CreateTestCaseFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Array of subfolders")
});

const DeleteTestCaseFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the folder to delete")
});

const CreateCampaignFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Array of subfolders")
});

const DeleteCampaignFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the folder to delete")
});

interface FolderStructure {
    name: string;
    children?: FolderStructure[];
}

interface SquashTMFolder {
    _type: string;
    id: number;
    name: string;
    url: string;
    children: SquashTMFolder[];
}

interface SquashTMFolderDetail {
    _type: string;
    id: number;
    name: string;
    description: string;
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

interface SquashTMTestCaseDetail {
    id: number;
    name: string;
    description: string;
    prerequisite: string;
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

interface SquashTMRequirementDetail {
    id: number;
    name: string;
    current_version: {
        created_by: string;
        created_on: string;
        last_modified_by: string;
        last_modified_on: string;
        description: string;
        reference: string;
        version_number: number;
        criticality: string;
        category: {
            code: string;
        };
        status: string;
    };
}

interface SquashTMProjectTree {
    _type: string;
    id: number;
    name: string;
    folders: SquashTMFolder[];
}

interface ReturnedFolder {
    id: number;
    name: string;
    description: string;
    created_by: string;
    created_on: string;
    modified_by: string;
    modified_on: string;
    children: ReturnedFolder[];
}

interface ReturnedProjectTree {
    id: number;
    name: string;
    folders: ReturnedFolder[];
}

export async function makeSquashRequest<T>(correlationId: string, endpoint: string, method: "GET" | "POST" | "DELETE" | "PATCH", body?: any): Promise<T> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${SQUASHTM_API_KEY}`,
        Accept: "application/json",
    };

    if (body) {
        headers["Content-Type"] = "application/json";
    }

    logToFile(correlationId, `SquashTM REST API Request: method=${method} endpoint=${endpoint} body=${body ? JSON.stringify(body) : "<empty>"}`);

    try {
        const response = await fetch(SQUASHTM_API_URL + "/" + endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text();
            logErrorToConsole(correlationId, `SquashTM REST API Response Status: ${response.status} Payload: ${text}`);
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
                `Request failed:\nstatus=${response.status}\nerror=${message}`
            );
        }

        if (response.status === 204) {
            return {} as T;
        }

        const text = await response.text();
        logToFile(correlationId, `REST API Response Status: ${response.status} Payload: ${text}`);

        if (text.length === 0) {
            return {} as T;
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            try {
                return JSON.parse(text) as T;
            } catch (e) {
                const m = `Failed to parse SquashTM REST API JSON response: ${text}`;
                logErrorToConsole(correlationId, m);
                throw new McpError(ErrorCode.InternalError, m);
            }
        } else {
            const m = `Unexpected SquashTM REST API response format: ${text}`;
            logErrorToConsole(correlationId, m);
            throw new McpError(ErrorCode.InternalError, m);
        }
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        const m = `Error making SquashTM REST API request: ${error}`;
        logErrorToConsole(correlationId, m);
        throw new McpError(ErrorCode.InternalError, m);
    }
}

export const listProjectsHandler = async () => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "list_projects");
    let allProjects: SquashProject[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashPaginatedResponse<SquashProject>>(
            correlationId,
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
        const returnedData = {
            content: [
                {
                    type: "text" as const,
                    text: "No projects found.",
                },
            ],
        };
        logToFile(correlationId, "list_projects returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }

    const detailedProjects = await Promise.all(
        allProjects.map(async (p) => {
            const details = await makeSquashRequest<SquashProject>(
                correlationId,
                `projects/${p.id}`,
                "GET"
            );
            return {
                id: p.id,
                name: p.name,
                label: details.label,
                description: details.description,
            };
        })
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(detailedProjects, null, 2),
            },
        ],
    };

    logToFile(correlationId, "list_projects returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register list_projects tool
server.registerTool(
    "list_projects",
    {
        title: "List Projects",
        description: "Get list of SquashTM projects",
        inputSchema: ListProjectsInputSchema,
    },
    listProjectsHandler
);

export const createProjectHandler = async (args: z.infer<typeof CreateProjectInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_project " + JSON.stringify(args));
    const payload = {
        _type: "project",
        name: args.name,
        label: args.label,
        description: args.description,
    };

    const response = await makeSquashRequest<any>(
        correlationId,
        "projects",
        "POST",
        payload
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: `Project created successfully with ID: ${response.id}`,
            },
        ],
    };

    logToFile(correlationId, "create_project returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register create_project tool
server.registerTool(
    "create_project",
    {
        title: "Create Project",
        description: "Create a new project in SquashTM",
        inputSchema: CreateProjectInputSchema,
    },
    createProjectHandler
);

export const deleteProjectHandler = async (args: z.infer<typeof DeleteProjectInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_project " + JSON.stringify(args));
    await makeSquashRequest<any>(
        correlationId,
        `projects/${args.id}`,
        "DELETE"
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: `Project ${args.id} deleted successfully`,
            },
        ],
    };

    logToFile(correlationId, "delete_project returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register delete_project tool
server.registerTool(
    "delete_project",
    {
        title: "Delete Project",
        description: "Delete a project in SquashTM",
        inputSchema: DeleteProjectInputSchema,
    },
    deleteProjectHandler
);

async function getDetailedFolders(correlationId: string, folders: SquashTMFolder[], type: "requirement-folders" | "test-case-folders" | "campaign-folders"): Promise<ReturnedFolder[]> {
    return Promise.all(folders.map(async folder => {
        const details = await makeSquashRequest<SquashTMFolderDetail>(
            correlationId,
            `${type}/${folder.id}`,
            "GET"
        );
        return {
            id: folder.id,
            name: folder.name,
            description: details.description,
            created_by: details.created_by,
            created_on: details.created_on,
            modified_by: details.last_modified_by,
            modified_on: details.last_modified_on,
            children: await getDetailedFolders(correlationId, folder.children || [], type)
        };
    }));
}

export const getRequirementFolderContentHandler = async (args: z.infer<typeof GetRequirementFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_requirement_folder_content " + JSON.stringify(args));
    let allRequirements: any[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashPaginatedResponse<any>>(
            correlationId,
            `requirement-folders/${args.folder_id}/content?page=${currentPage}&size=50`,
            "GET"
        );

        if (!data || !data._embedded || !data._embedded.content) {
            break;
        }

        const requirements = data._embedded.content.filter((item: any) => item._type === "requirement");
        allRequirements.push(...requirements);

        if (data.page) {
            totalPages = data.page.totalPages;
            currentPage++;
        } else {
            break;
        }
    }

    if (allRequirements.length === 0) {
        const returnedData = {
            content: [
                {
                    type: "text" as const,
                    text: "No requirements found in the specified folder.",
                },
            ],
        };
        logToFile(correlationId, "get_requirement_folder_content returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }

    const detailedRequirements = await Promise.all(
        allRequirements.map(async (req) => {
            const details = await makeSquashRequest<SquashTMRequirementDetail>(
                correlationId,
                `requirements/${req.id}`,
                "GET"
            );
            return {
                id: details.id,
                name: details.name,
                reference: details.current_version.reference,
                version: details.current_version.version_number,
                description: details.current_version.description,
                created_by: details.current_version.created_by,
                created_on: details.current_version.created_on,
                last_modified_by: details.current_version.last_modified_by,
                last_modified_on: details.current_version.last_modified_on,
                criticality: details.current_version.criticality,
                category: details.current_version.category?.code,
                status: details.current_version.status,
            };
        })
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(detailedRequirements, null, 2),
            },
        ],
    };

    logToFile(correlationId, "get_requirement_folder_content returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register get_requirement_folder_content tool
server.registerTool(
    "get_requirement_folder_content",
    {
        title: "Get Requirement Folder Content",
        description: "Get the requirements of a requirement folder (only includes the requirements, not the subfolders)",
        inputSchema: GetRequirementFolderContentInputSchema,
    },
    getRequirementFolderContentHandler
);

export const getRequirementFoldersTreeHandler = async (args: z.infer<typeof GetRequirementFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_requirement_folders_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `requirement-folders/tree/${args.project_id}`,
        "GET"
    );

    if (!data) {
        const returnedData = {
            content: [
                {
                    type: "text" as const,
                    text: "Failed to retrieve requirement folders tree.",
                },
            ],
        };

        logToFile(correlationId, "get_requirement_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }

    const resultData: ReturnedProjectTree[] = await Promise.all(data.map(async project => ({
        id: project.id,
        name: project.name,
        folders: await getDetailedFolders(correlationId, project.folders || [], "requirement-folders")
    })));

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(resultData, null, 2),
            },
        ],
    };

    logToFile(correlationId, "get_requirement_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register get_requirement_folders_tree tool
server.registerTool(
    "get_requirement_folders_tree",
    {
        title: "Get Requirement Folders Tree",
        description: "Get the requirement folders tree for specified projects with detailed folder info",
        inputSchema: GetRequirementFoldersTreeInputSchema,
    },
    getRequirementFoldersTreeHandler
);

// Register get_test_case_folder_tree tool
export const getTestCaseFoldersTreeHandler = async (args: z.infer<typeof GetTestCaseFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_test_case_folders_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `test-case-folders/tree/${args.project_id}`,
        "GET"
    );

    if (!data) {
        const returnedData = {
            content: [
                {
                    type: "text" as const,
                    text: "Failed to retrieve test case folders tree.",
                },
            ],
        };

        logToFile(correlationId, "get_test_case_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }

    const resultData: ReturnedProjectTree[] = await Promise.all(data.map(async project => ({
        id: project.id,
        name: project.name,
        folders: await getDetailedFolders(correlationId, project.folders || [], "test-case-folders")
    })));

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(resultData, null, 2),
            },
        ],
    };

    logToFile(correlationId, "get_test_case_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register get_test_case_folder_tree tool
server.registerTool(
    "get_test_case_folder_tree",
    {
        title: "Get Test Case Folders Tree",
        description: "Get the test case folders tree for specified projects with detailed folder info",
        inputSchema: GetTestCaseFoldersTreeInputSchema,
    },
    getTestCaseFoldersTreeHandler
);
// Register create_test_cases tool
server.registerTool(
    "create_test_cases",
    {
        title: "Create Test Cases",
        description: "Create test cases in a project in SquashTM",
        inputSchema: CreateTestCasesInputSchema,
    },
    async (args) => {
        const correlationId = generateCorrelationId();
        logToFile(correlationId, "create_test_cases " + JSON.stringify(args));
        await Promise.all(
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

                const returnedData = await makeSquashRequest<any>(
                    correlationId,
                    "test-cases",
                    "POST",
                    payload
                );

                logToFile(correlationId, "create_test_cases returned: " + JSON.stringify(returnedData, null, 2));
                return returnedData;
            })
        );

        const returnedData = {
            content: [],
        };

        logToFile(correlationId, "create_test_cases returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }
);

export const getTestCaseFolderContentHandler = async (args: z.infer<typeof GetTestCaseFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_test_case_folder_content " + JSON.stringify(args));
    let allTestCases: any[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashPaginatedResponse<any>>(
            correlationId,
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
        const returnedData = {
            content: [
                {
                    type: "text" as const,
                    text: "No test cases found in the specified folder.",
                },
            ],
        };

        logToFile(correlationId, "get_test_case_folder_content returned: " + JSON.stringify(returnedData, null, 2));
        return returnedData;
    }

    const detailedTestCases = await Promise.all(
        allTestCases.map(async (tc) => {
            const details = await makeSquashRequest<SquashTMTestCaseDetail>(
                correlationId,
                `test-cases/${tc.id}`,
                "GET"
            );
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

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(detailedTestCases, null, 2),
            },
        ],
    };

    logToFile(correlationId, "get_test_case_folder_content returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register get_test_case_folder_content tool
server.registerTool(
    "get_test_case_folder_content",
    {
        title: "Get Test Case Folder Content",
        description: "Get the test cases of a test case folder (only includes items of type 'test-case')",
        inputSchema: GetTestCaseFolderContentInputSchema,
    },
    getTestCaseFolderContentHandler
);

export const getCampaignFoldersTreeHandler = async (args: z.infer<typeof GetCampaignFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_campaign_folder_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `campaign-folders/tree/${args.project_id}`,
        "GET"
    );

    if (!data) {
        return {
            content: [
                {
                    type: "text" as const,
                    text: "Failed to retrieve campaign folders tree.",
                },
            ],
        };
    }

    const resultData: ReturnedProjectTree[] = await Promise.all(data.map(async project => ({
        id: project.id,
        name: project.name,
        folders: await getDetailedFolders(correlationId, project.folders || [], "campaign-folders")
    })));

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(resultData, null, 2),
            },
        ],
    };

    logToFile(correlationId, "get_campaign_folder_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register get_campaign_folder_tree tool
server.registerTool(
    "get_campaign_folder_tree",
    {
        title: "Get Campaign Folders Tree",
        description: "Get the campaign folders tree for specified projects with detailed folder info",
        inputSchema: GetCampaignFoldersTreeInputSchema,
    },
    getCampaignFoldersTreeHandler
);

// Helper for recursive folder creation
async function createFolderRecursive(
    correlationId: string,
    projectId: number,
    name: string,
    parentId: number,
    parentType: "project" | "requirement-folder" | "test-case-folder" | "campaign-folder",
    folderType: "requirement-folder" | "test-case-folder" | "campaign-folder",
    endpoint: string,
    children?: FolderStructure[]
): Promise<void> {
    const payload = {
        _type: folderType,
        name: name,
        parent: {
            _type: parentType,
            id: parentId
        }
    };

    logToFile(correlationId, `Creating folder: ${name} under ${parentType} ${parentId}`);

    const response = await makeSquashRequest<any>(
        correlationId,
        endpoint,
        "POST",
        payload
    );
    const newId = response.id;

    if (children && children.length > 0) {
        // Recursively create children
        // Parent is now the folder we just created
        for (const child of children) {
            await createFolderRecursive(
                correlationId,
                projectId,
                child.name,
                newId,
                folderType, // Parent is now this folder type
                folderType,
                endpoint,
                child.children
            );;
        }
    }
}

// Handler for creating requirement folders
export const createRequirementFoldersHandler = async (args: z.infer<typeof CreateRequirementFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_requirement_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "requirement-folder" : "project";

    await createFolderRecursive(
        correlationId,
        args.project_id,
        args.name,
        parentId,
        parentType,
        "requirement-folder",
        "requirement-folders",
        args.children
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: "Requirement folders created successfully",
            },
        ],
    };
    logToFile(correlationId, "create_requirement_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register create_requirement_folders
server.registerTool(
    "create_requirement_folders",
    {
        title: "Create Requirement Folders",
        description: "Create requirement folders recursively",
        inputSchema: CreateRequirementFoldersInputSchema,
    },
    createRequirementFoldersHandler
);

// Handler for deleting requirement folder
export const deleteRequirementFolderHandler = async (args: z.infer<typeof DeleteRequirementFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_requirement_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `requirement-folders/${args.folder_id}`,
        "DELETE"
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: `Requirement folder ${args.folder_id} deleted successfully`,
            },
        ],
    };
    logToFile(correlationId, "delete_requirement_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register delete_requirement_folder
server.registerTool(
    "delete_requirement_folder",
    {
        title: "Delete Requirement Folder",
        description: "Delete a requirement folder and its content",
        inputSchema: DeleteRequirementFolderInputSchema,
    },
    deleteRequirementFolderHandler
);

// Handler for creating test case folders
export const createTestCaseFoldersHandler = async (args: z.infer<typeof CreateTestCaseFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_test_case_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "test-case-folder" : "project";

    await createFolderRecursive(
        correlationId,
        args.project_id,
        args.name,
        parentId,
        parentType,
        "test-case-folder",
        "test-case-folders",
        args.children
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: "Test case folders created successfully",
            },
        ],
    };
    logToFile(correlationId, "create_test_case_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register create_test_case_folders
server.registerTool(
    "create_test_case_folders",
    {
        title: "Create Test Case Folders",
        description: "Create test case folders recursively",
        inputSchema: CreateTestCaseFoldersInputSchema,
    },
    createTestCaseFoldersHandler
);

// Handler for deleting test case folder
export const deleteTestCaseFolderHandler = async (args: z.infer<typeof DeleteTestCaseFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_test_case_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `test-case-folders/${args.folder_id}`,
        "DELETE"
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: `Test case folder ${args.folder_id} deleted successfully`,
            },
        ],
    };
    logToFile(correlationId, "delete_test_case_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register delete_test_case_folder
server.registerTool(
    "delete_test_case_folder",
    {
        title: "Delete Test Case Folder",
        description: "Delete a test case folder and its content",
        inputSchema: DeleteTestCaseFolderInputSchema,
    },
    deleteTestCaseFolderHandler
);

// Handler for creating campaign folders
export const createCampaignFoldersHandler = async (args: z.infer<typeof CreateCampaignFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_campaign_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "campaign-folder" : "project";

    await createFolderRecursive(
        correlationId,
        args.project_id,
        args.name,
        parentId,
        parentType,
        "campaign-folder",
        "campaign-folders",
        args.children
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: "Campaign folders created successfully",
            },
        ],
    };
    logToFile(correlationId, "create_campaign_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register create_campaign_folders
server.registerTool(
    "create_campaign_folders",
    {
        title: "Create Campaign Folders",
        description: "Create campaign folders recursively",
        inputSchema: CreateCampaignFoldersInputSchema,
    },
    createCampaignFoldersHandler
);

// Handler for deleting campaign folder
export const deleteCampaignFolderHandler = async (args: z.infer<typeof DeleteCampaignFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_campaign_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `campaign-folders/${args.folder_id}`,
        "DELETE"
    );

    const returnedData = {
        content: [
            {
                type: "text" as const,
                text: `Campaign folder ${args.folder_id} deleted successfully`,
            },
        ],
    };
    logToFile(correlationId, "delete_campaign_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register delete_campaign_folder
server.registerTool(
    "delete_campaign_folder",
    {
        title: "Delete Campaign Folder",
        description: "Delete a campaign folder and its content",
        inputSchema: DeleteCampaignFolderInputSchema,
    },
    deleteCampaignFolderHandler
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logErrorToConsole("", "SquashTM MCP Server running on stdio");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        logErrorToConsole("", `Fatal error in main(): ${error}`);
        process.exit(1);
    });
}
