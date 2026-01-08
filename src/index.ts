#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "dotenv/config";
import { fileURLToPath } from 'url';
import {
    generateCorrelationId,
    logToFile,
    logErrorToConsole,
    formatResponse,
    makeSquashRequest,
    SquashTMProject,
    SquashTMPaginatedResponse
} from "./utils.js";

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "0.0.2",
});

// structures of the SquashTM API responses (not exported - internal to this module)
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

// Zod schemas for validation of the tool inputs and outputs

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

const ReturnedFolderSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.number().describe("The ID of the folder"),
        name: z.string().describe("The name of the folder"),
        description: z.string().describe("The description of the folder"),
        created_by: z.string().describe("The user who created the folder"),
        created_on: z.string().describe("The date when the folder was created"),
        modified_by: z.string().optional().describe("The user who last modified the folder"),
        modified_on: z.string().optional().describe("The date when the folder was last modified"),
        children: z.array(ReturnedFolderSchema).describe("Subfolders"),
    })
);

type ReturnedFolder = z.infer<typeof ReturnedFolderSchema>;

const GetFoldersTreeOutputSchema = z.object({
    folders: z.array(ReturnedFolderSchema).describe("List of folders"),
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

const GetRequirementFolderContentInputSchema = z.object({
    folder_id: z.number().describe("The ID of the requirement folder to retrieve content for"),
});

const GetTestCaseFolderContentInputSchema = z.object({
    folder_id: z.number().describe("The ID of the test case folder to retrieve content for"),
});

const FolderStructureSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders"),
}).describe("Folder structure"));

const CreateRequirementFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the requirement folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
});

const CreateFoldersOutputSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("Name of the folder"),
    id: z.number().describe("ID of the folder"),
    children: z.array(CreateFoldersOutputSchema).optional().describe("Subfolders"),
}).describe("Folder structure"));

type CreateFoldersOutput = z.infer<typeof CreateFoldersOutputSchema>;

const DeleteRequirementFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the requirement folder to delete")
});

const DeleteRequirementFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the requirement folder"),
});

const CreateTestCaseFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the test case folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
});

const DeleteTestCaseFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the test case folder to delete")
});

const DeleteTestCaseFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the test case folder"),
});

const CreateCampaignFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the campaign folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
});

const DeleteCampaignFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the campaign folder to delete")
});

const DeleteCampaignFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the campaign folder"),
});

interface FolderStructure {
    name: string;
    children?: FolderStructure[];
}


import { registerProjectTools } from "./projects.js";

// Register project management tools
registerProjectTools(server);


// Get folder details
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
            ...(details.last_modified_by && { modified_by: details.last_modified_by }),
            ...(details.last_modified_on && { modified_on: details.last_modified_on }),
            children: await getDetailedFolders(correlationId, folder.children || [], type)
        };
    }));
}

// 'get_requirement_folder_content' tool
export const getRequirementFolderContentHandler = async (args: z.infer<typeof GetRequirementFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_requirement_folder_content " + JSON.stringify(args));
    let allRequirements: any[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashTMPaginatedResponse<any>>(
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
server.registerTool(
    "get_requirement_folder_content",
    {
        title: "Get Requirement Folder Content",
        description: "Get the requirements of a requirement folder (only includes the requirements, not the subfolders)",
        inputSchema: GetRequirementFolderContentInputSchema,
    },
    getRequirementFolderContentHandler
);

// 'get_requirement_folders_tree' tool
export const getRequirementFoldersTreeHandler = async (args: z.infer<typeof GetRequirementFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_requirement_folders_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `requirement-folders/tree/${args.project_id}`,
        "GET"
    );

    const resultData = {
        folders: await getDetailedFolders(correlationId, data[0].folders, "requirement-folders")
    };

    const returnedData = formatResponse(resultData);

    logToFile(correlationId, "get_requirement_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "get_requirement_folders_tree",
    {
        title: "Get Requirement Folders Tree",
        description: "Get the requirement folders tree for specified project with detailed folder info",
        inputSchema: GetRequirementFoldersTreeInputSchema,
        outputSchema: GetFoldersTreeOutputSchema,
    },
    getRequirementFoldersTreeHandler
);

// 'get_test_case_folders_tree' tool
export const getTestCaseFoldersTreeHandler = async (args: z.infer<typeof GetTestCaseFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_test_case_folders_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `test-case-folders/tree/${args.project_id}`,
        "GET"
    );

    const resultData = {
        folders: await getDetailedFolders(correlationId, data[0].folders, "test-case-folders")
    };

    const returnedData = formatResponse(resultData);

    logToFile(correlationId, "get_test_case_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "get_test_case_folder_tree",
    {
        title: "Get Test Case Folders Tree",
        description: "Get the test case folders tree for specified project with detailed folder info",
        inputSchema: GetTestCaseFoldersTreeInputSchema,
        outputSchema: GetFoldersTreeOutputSchema,
    },
    getTestCaseFoldersTreeHandler
);

// 'create_test_cases' tool
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

// 'get_test_case_folder_content' tool
export const getTestCaseFolderContentHandler = async (args: z.infer<typeof GetTestCaseFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_test_case_folder_content " + JSON.stringify(args));
    let allTestCases: any[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashTMPaginatedResponse<any>>(
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
server.registerTool(
    "get_test_case_folder_content",
    {
        title: "Get Test Case Folder Content",
        description: "Get the test cases of a test case folder (only includes items of type 'test-case')",
        inputSchema: GetTestCaseFolderContentInputSchema,
    },
    getTestCaseFolderContentHandler
);

// 'get_campaign_folders_tree' tool
export const getCampaignFoldersTreeHandler = async (args: z.infer<typeof GetCampaignFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "get_campaign_folder_tree " + JSON.stringify(args));
    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `campaign-folders/tree/${args.project_id}`,
        "GET"
    );

    const resultData = {
        folders: await getDetailedFolders(correlationId, data[0].folders, "campaign-folders")
    };

    const returnedData = formatResponse(resultData);

    logToFile(correlationId, "get_campaign_folder_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "get_campaign_folder_tree",
    {
        title: "Get Campaign Folders Tree",
        description: "Get the campaign folders tree for specified project with detailed folder info",
        inputSchema: GetCampaignFoldersTreeInputSchema,
        outputSchema: GetFoldersTreeOutputSchema,
    },
    getCampaignFoldersTreeHandler
);

// recursive folder creation helper
async function createFolderRecursive(
    correlationId: string,
    projectId: number,
    name: string,
    parentId: number,
    parentType: "project" | "requirement-folder" | "test-case-folder" | "campaign-folder",
    folderType: "requirement-folder" | "test-case-folder" | "campaign-folder",
    endpoint: string,
    children?: FolderStructure[]
): Promise<CreateFoldersOutput> {
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

    const childIds: number[] = [];
    if (children && children.length > 0) {
        // Recursively create children
        // Parent is now the folder we just created
        for (const child of children) {
            const c = await createFolderRecursive(
                correlationId,
                projectId,
                child.name,
                newId,
                folderType, // Parent is now this folder type
                folderType,
                endpoint,
                child.children
            );
            childIds.push(c);
        }
    }
    return {
        name: name,
        id: newId,
        children: childIds
    };
}

// 'create_requirement_folders' tool
export const createRequirementFoldersHandler = async (args: z.infer<typeof CreateRequirementFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_requirement_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "requirement-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            parentId,
            parentType,
            "requirement-folder",
            "requirement-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFile(correlationId, "create_requirement_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "create_requirement_folders",
    {
        title: "Create Requirement Folders",
        description: "Create requirement folders recursively",
        inputSchema: CreateRequirementFoldersInputSchema,
        outputSchema: CreateFoldersOutputSchema,
    },
    createRequirementFoldersHandler
);

// 'delete_requirement_folder' tool
export const deleteRequirementFolderHandler = async (args: z.infer<typeof DeleteRequirementFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_requirement_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `requirement-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Requirement folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFile(correlationId, "delete_requirement_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "delete_requirement_folder",
    {
        title: "Delete Requirement Folder",
        description: "Delete a requirement folder and its content",
        inputSchema: DeleteRequirementFolderInputSchema,
        outputSchema: DeleteRequirementFolderOutputSchema,
    },
    deleteRequirementFolderHandler
);

// 'create_test_case_folders' tool
export const createTestCaseFoldersHandler = async (args: z.infer<typeof CreateTestCaseFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_test_case_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "test-case-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            parentId,
            parentType,
            "test-case-folder",
            "test-case-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFile(correlationId, "create_test_case_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "create_test_case_folders",
    {
        title: "Create Test Case Folders",
        description: "Create test case folders recursively",
        inputSchema: CreateTestCaseFoldersInputSchema,
        outputSchema: CreateFoldersOutputSchema,
    },
    createTestCaseFoldersHandler
);

// 'delete_test_case_folder' tool
export const deleteTestCaseFolderHandler = async (args: z.infer<typeof DeleteTestCaseFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_test_case_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `test-case-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Test case folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFile(correlationId, "delete_test_case_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "delete_test_case_folder",
    {
        title: "Delete Test Case Folder",
        description: "Delete a test case folder and its content",
        inputSchema: DeleteTestCaseFolderInputSchema,
        outputSchema: DeleteTestCaseFolderOutputSchema,
    },
    deleteTestCaseFolderHandler
);

// 'create_campaign_folders' tool
export const createCampaignFoldersHandler = async (args: z.infer<typeof CreateCampaignFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_campaign_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "campaign-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            parentId,
            parentType,
            "campaign-folder",
            "campaign-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFile(correlationId, "create_campaign_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "create_campaign_folders",
    {
        title: "Create Campaign Folders",
        description: "Create campaign folders recursively",
        inputSchema: CreateCampaignFoldersInputSchema,
        outputSchema: CreateFoldersOutputSchema,
    },
    createCampaignFoldersHandler
);

// 'delete_campaign_folder' tool
export const deleteCampaignFolderHandler = async (args: z.infer<typeof DeleteCampaignFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "delete_campaign_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `campaign-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Campaign folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFile(correlationId, "delete_campaign_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};
server.registerTool(
    "delete_campaign_folder",
    {
        title: "Delete Campaign Folder",
        description: "Delete a campaign folder and its content",
        inputSchema: DeleteCampaignFolderInputSchema,
        outputSchema: DeleteCampaignFolderOutputSchema,
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
