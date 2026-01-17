import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    makeSquashRequest,
    SquashTMFolderDetails,
    SquashTMProjectTree,
    FolderStructure,
} from "./squashtm_rest_api.js";
import {
    generateCorrelationId,
    logToFileAndConsole,
    formatResponse,
} from "./utils.js";

type FolderDetails = {
    id: number;
    name: string;
    description?: string;
    parent_folder_id?: number;
    created_by: string;
    created_on: string;
    modified_by?: string;
    modified_on?: string;
}

// Zod schemas for validation of the tool inputs and outputs

const ReturnedFolderSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.number().describe("The ID of the folder"),
        name: z.string().describe("The name of the folder"),
        description: z.string().optional().describe("The description of the folder (rich text) (absent if the folder has no description)"),
        created_by: z.string().describe("The user who created the folder"),
        created_on: z.string().describe("The date when the folder was created"),
        modified_by: z.string().optional().describe("The user who last modified the folder (absent if the folder has never been modified)"),
        modified_on: z.string().optional().describe("The date when the folder was last modified (absent if the folder has never been modified)"),
        children: z.array(ReturnedFolderSchema).describe("Subfolders"),
    }).strict()
);

type ReturnedFolder = z.infer<typeof ReturnedFolderSchema>;

export const GetFoldersTreeOutputSchema = z.object({
    folders: z.array(ReturnedFolderSchema).describe("List of folders"),
}).strict();

const GetRequirementFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the requirement folders tree for"),
}).strict();

const GetTestCaseFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the test case folders tree for"),
}).strict();

const GetCampaignFoldersTreeInputSchema = z.object({
    project_id: z.number().describe("Project ID to retrieve the campaign folders tree for"),
}).strict();

const FolderStructureSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("Name of the folder"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders"),
}).describe("Folder structure").strict());

const CreateRequirementFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the requirement folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    description: z.string().optional().describe("Description of the folder (rich text)"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
}).strict();

export const CreateFoldersOutputSchema: z.ZodType<any> = z.lazy(() => z.object({
    name: z.string().describe("Name of the folder"),
    id: z.number().describe("ID of the folder"),
    children: z.array(CreateFoldersOutputSchema).optional().describe("Subfolders"),
}).describe("Folder structure").strict());

export type CreateFoldersOutput = z.infer<typeof CreateFoldersOutputSchema>;

const DeleteRequirementFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the requirement folder to delete")
}).strict();

export const DeleteRequirementFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the requirement folder"),
}).strict();

const CreateTestCaseFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the test case folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    description: z.string().optional().describe("Description of the folder (rich text)"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
}).strict();

const DeleteTestCaseFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the test case folder to delete")
}).strict();

export const DeleteTestCaseFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the test case folder"),
}).strict();

const CreateCampaignFoldersInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the campaign folder"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new folders (optional, if not specified, the folders will be created at the root level)"),
    name: z.string().describe("Name of the folder"),
    description: z.string().optional().describe("Description of the folder (rich text)"),
    children: z.array(FolderStructureSchema).optional().describe("Subfolders")
}).strict();

const DeleteCampaignFolderInputSchema = z.object({
    folder_id: z.number().describe("The ID of the campaign folder to delete")
}).strict();

export const DeleteCampaignFolderOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the campaign folder"),
}).strict();

// Get folder details
async function getFolderDetails(correlationId: string, folderID: number, type: "requirement-folder" | "test-case-folder" | "campaign-folder"): Promise<FolderDetails> {
    const details = await makeSquashRequest<SquashTMFolderDetails>(
        correlationId,
        `${type}s/${folderID}`,
        "GET"
    );
    return {
        id: folderID,
        name: details.name,
        ...(details.description && { description: details.description }),
        ...(details.parent._type === type && { parent_folder_id: details.parent.id }),
        created_by: details.created_by,
        created_on: details.created_on,
        ...(details.last_modified_by && { modified_by: details.last_modified_by }),
        ...(details.last_modified_on && { modified_on: details.last_modified_on }),
    };
}

// Build the folder tree
function buildFolderTree(folders: FolderDetails[]): ReturnedFolder[] {

    // Create a map for quick lookup
    const folderMap = new Map<number, ReturnedFolder>();

    // Initialize all folders with empty children arrays
    folders.forEach(folder => {
        folderMap.set(folder.id, {
            id: folder.id,
            name: folder.name,
            description: folder.description,
            created_by: folder.created_by,
            created_on: folder.created_on,
            modified_by: folder.modified_by,
            modified_on: folder.modified_on,
            children: []
        });
    });

    // Build the tree by assigning children to parents
    const roots: ReturnedFolder[] = [];

    folders.forEach(folder => {
        const node = folderMap.get(folder.id)!;

        if (folder.parent_folder_id === undefined) {
            // This is a root folder
            roots.push(node);
        } else {
            // This is a child folder - add it to its parent
            const parent = folderMap.get(folder.parent_folder_id);
            if (parent) {
                parent.children.push(node);
            } else {
                // Parent not found - treat as root
                roots.push(node);
            }
        }
    });

    return roots;
}

// Get the folder tree from SquashTM
async function getFoldersTree(
    correlationId: string,
    projectId: number,
    folderType: "requirement-folder" | "test-case-folder" | "campaign-folder",
    resource: "requirement-folders" | "test-case-folders" | "campaign-folders",
): Promise<ReturnType<typeof formatResponse>> {

    const data = await makeSquashRequest<SquashTMProjectTree[]>(
        correlationId,
        `${resource}/tree/${projectId}`,
        "GET"
    );

    // the hierarchy returned by SquashTM is garbage, we need to rebuild it

    const allFolderIds = data.flatMap(project =>
        project.folders.flatMap(function flatten(folder): number[] {
            const id = folder._type === folderType ? [folder.id] : [];
            return [...id, ...folder.children.flatMap(flatten)];
        }));

    const allFolderDetails = await Promise.all(allFolderIds.map(id => getFolderDetails(correlationId, id, folderType)));

    const resultData = { folders: buildFolderTree(allFolderDetails) };

    return formatResponse(resultData);
}


// 'get_requirement_folders_tree' tool
export const getRequirementFoldersTreeHandler = async (args: z.infer<typeof GetRequirementFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "get_requirement_folders_tree " + JSON.stringify(args));
    const returnedData = await getFoldersTree(
        correlationId,
        args.project_id,
        "requirement-folder",
        "requirement-folders",
    );

    logToFileAndConsole(correlationId, "INFO", "get_requirement_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'get_test_case_folders_tree' tool
export const getTestCaseFoldersTreeHandler = async (args: z.infer<typeof GetTestCaseFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "get_test_case_folders_tree " + JSON.stringify(args));
    const returnedData = await getFoldersTree(
        correlationId,
        args.project_id,
        "test-case-folder",
        "test-case-folders",
    );

    logToFileAndConsole(correlationId, "INFO", "get_test_case_folders_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};



// 'get_campaign_folders_tree' tool
export const getCampaignFoldersTreeHandler = async (args: z.infer<typeof GetCampaignFoldersTreeInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "get_campaign_folder_tree " + JSON.stringify(args));
    const returnedData = await getFoldersTree(
        correlationId,
        args.project_id,
        "campaign-folder",
        "campaign-folders",
    );

    logToFileAndConsole(correlationId, "INFO", "get_campaign_folder_tree returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// recursive folder creation helper
async function createFolderRecursive(
    correlationId: string,
    projectId: number,
    name: string,
    description: string | undefined,
    parentId: number,
    parentType: "project" | "requirement-folder" | "test-case-folder" | "campaign-folder",
    folderType: "requirement-folder" | "test-case-folder" | "campaign-folder",
    endpoint: string,
    children?: FolderStructure[]
): Promise<CreateFoldersOutput> {
    const payload = {
        _type: folderType,
        name: name,
        description: description,
        parent: {
            _type: parentType,
            id: parentId
        }
    };

    logToFileAndConsole(correlationId, "INFO", `Creating folder: ${name} under ${parentType} ${parentId}`);

    const response = await makeSquashRequest<any>(
        correlationId,
        endpoint,
        "POST",
        payload
    );
    const newId = response.id;

    const childIds: any[] = [];
    if (children && children.length > 0) {
        // Recursively create children
        // Parent is now the folder we just created
        for (const child of children) {
            const c = await createFolderRecursive(
                correlationId,
                projectId,
                child.name,
                child.description,
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
    logToFileAndConsole(correlationId, "INFO", "create_requirement_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "requirement-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            args.description,
            parentId,
            parentType,
            "requirement-folder",
            "requirement-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFileAndConsole(correlationId, "INFO", "create_requirement_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_requirement_folder' tool
export const deleteRequirementFolderHandler = async (args: z.infer<typeof DeleteRequirementFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_requirement_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `requirement-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Requirement folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFileAndConsole(correlationId, "INFO", "delete_requirement_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'create_test_case_folders' tool
export const createTestCaseFoldersHandler = async (args: z.infer<typeof CreateTestCaseFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "create_test_case_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "test-case-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            args.description,
            parentId,
            parentType,
            "test-case-folder",
            "test-case-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFileAndConsole(correlationId, "INFO", "create_test_case_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_test_case_folder' tool
export const deleteTestCaseFolderHandler = async (args: z.infer<typeof DeleteTestCaseFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_test_case_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `test-case-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Test case folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFileAndConsole(correlationId, "INFO", "delete_test_case_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'create_campaign_folders' tool
export const createCampaignFoldersHandler = async (args: z.infer<typeof CreateCampaignFoldersInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "create_campaign_folders " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "campaign-folder" : "project";

    const folderData = {
        folder: await createFolderRecursive(
            correlationId,
            args.project_id,
            args.name,
            args.description,
            parentId,
            parentType,
            "campaign-folder",
            "campaign-folders",
            args.children
        )
    };

    const returnedData = formatResponse(folderData);
    logToFileAndConsole(correlationId, "INFO", "create_campaign_folders returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_campaign_folder' tool
export const deleteCampaignFolderHandler = async (args: z.infer<typeof DeleteCampaignFolderInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_campaign_folder " + JSON.stringify(args));

    await makeSquashRequest<any>(
        correlationId,
        `campaign-folders/${args.folder_id}`,
        "DELETE"
    );

    const folderData = {
        message: `Campaign folder ${args.folder_id} deleted successfully`,
    };
    const returnedData = formatResponse(folderData);

    logToFileAndConsole(correlationId, "INFO", "delete_campaign_folder returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register folder management tools
export function registerFolderTools(server: McpServer) {
    server.registerTool(
        "get_requirement_folders_tree",
        {
            title: "Get Requirement Folders Tree",
            description: "Get the requirement folders tree for specified project with detailed folder info in SquashTM",
            inputSchema: GetRequirementFoldersTreeInputSchema,
            outputSchema: GetFoldersTreeOutputSchema,
        },
        getRequirementFoldersTreeHandler
    );

    server.registerTool(
        "get_test_case_folder_tree",
        {
            title: "Get Test Case Folders Tree",
            description: "Get the test case folders tree for specified project with detailed folder info in SquashTM",
            inputSchema: GetTestCaseFoldersTreeInputSchema,
            outputSchema: GetFoldersTreeOutputSchema,
        },
        getTestCaseFoldersTreeHandler
    );



    server.registerTool(
        "get_campaign_folder_tree",
        {
            title: "Get Campaign Folders Tree",
            description: "Get the campaign folders tree for specified project with detailed folder info ",
            inputSchema: GetCampaignFoldersTreeInputSchema,
            outputSchema: GetFoldersTreeOutputSchema,
        },
        getCampaignFoldersTreeHandler
    );

    server.registerTool(
        "create_requirement_folders",
        {
            title: "Create Requirement Folders",
            description: "Create requirement folders recursively in SquashTM",
            inputSchema: CreateRequirementFoldersInputSchema,
            outputSchema: CreateFoldersOutputSchema,
        },
        createRequirementFoldersHandler
    );

    server.registerTool(
        "delete_requirement_folder",
        {
            title: "Delete Requirement Folder",
            description: "Delete a requirement folder and its content in SquashTM",
            inputSchema: DeleteRequirementFolderInputSchema,
            outputSchema: DeleteRequirementFolderOutputSchema,
        },
        deleteRequirementFolderHandler
    );

    server.registerTool(
        "create_test_case_folders",
        {
            title: "Create Test Case Folders",
            description: "Create test case folders recursively in SquashTM",
            inputSchema: CreateTestCaseFoldersInputSchema,
            outputSchema: CreateFoldersOutputSchema,
        },
        createTestCaseFoldersHandler
    );

    server.registerTool(
        "delete_test_case_folder",
        {
            title: "Delete Test Case Folder",
            description: "Delete a test case folder and its content in SquashTM",
            inputSchema: DeleteTestCaseFolderInputSchema,
            outputSchema: DeleteTestCaseFolderOutputSchema,
        },
        deleteTestCaseFolderHandler
    );

    server.registerTool(
        "create_campaign_folders",
        {
            title: "Create Campaign Folders",
            description: "Create campaign folders recursively in SquashTM",
            inputSchema: CreateCampaignFoldersInputSchema,
            outputSchema: CreateFoldersOutputSchema,
        },
        createCampaignFoldersHandler
    );

    server.registerTool(
        "delete_campaign_folder",
        {
            title: "Delete Campaign Folder",
            description: "Delete a campaign folder and its content in SquashTM",
            inputSchema: DeleteCampaignFolderInputSchema,
            outputSchema: DeleteCampaignFolderOutputSchema,
        },
        deleteCampaignFolderHandler
    );
}
