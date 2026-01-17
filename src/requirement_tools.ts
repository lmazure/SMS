import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    makeSquashRequest,
    SquashTMPaginatedResponse,
    SquashTMRequirementDetails,
} from "./squashtm_rest_api.js";
import {
    generateCorrelationId,
    logToFileAndConsole,
    formatResponse,
} from "./utils.js";

// Zod schemas for validation of the tool inputs and outputs

const GetRequirementFolderContentInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to retrieve the requirement folder content"),
    folder_id: z.number().optional().describe("The ID of the requirement folder to retrieve content for (optional, if not specified, the requirements of the project root will be retrieved)"),
}).strict();

export const GetRequirementFolderContentOutputSchema = z.object({
    requirements: z.array(
        z.object({
            id: z.number().describe("The ID of the requirement"),
            name: z.string().describe("The name of the requirement"),
            reference: z.string().optional().describe("The reference of the requirement (absent if the requirement has no reference)"),
            description: z.string().describe("The description of the requirement (rich text)"),
            created_by: z.string().describe("Who created the requirement"),
            created_on: z.string().describe("Creation timestamp"),
            last_modified_by: z.string().describe("Who last modified the requirement"),
            last_modified_on: z.string().describe("Last modification timestamp"),
        }).strict()
    ),
}).strict();

const CreateRequirementsInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the requirements"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new requirements (optional, if not specified, the requirements will be created at the root level)"),
    requirements: z.array(
        z.object({
            name: z.string().trim().min(1).describe("The name of the requirement"),
            reference: z.string().trim().min(1).optional().describe("The reference of the requirement (absent if the requirement has no reference)"),
            description: z.string().trim().min(1).describe("The description of the requirement (rich text)"),
        })
    ).min(1).describe("The list of requirements to create"),
}).strict();

export const CreateRequirementsOutputSchema = z.object({
    requirements: z.array(
        z.object({
            id: z.number().describe("The ID of the created requirement"),
            name: z.string().describe("The name of the created requirement"),
            reference: z.string().optional().describe("The reference of the created requirement (absent if the requirement has no reference)"),
        }).strict()
    ),
}).strict();

const DeleteRequirementInputSchema = z.object({
    id: z.number().describe("The ID of the requirement to delete"),
}).strict();

export const DeleteRequirementOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the requirement"),
}).strict();

// 'get_requirement_folder_content' tool
export const getRequirementFolderContentHandler = async (args: z.infer<typeof GetRequirementFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "get_requirement_folder_content " + JSON.stringify(args));

    const endpoint = args.folder_id ? `requirement-folders/${args.folder_id}/content` : `projects/${args.project_id}/requirements-library/content`;
    const answerFieldName = args.folder_id ? "content" : "requirement-library-content";

    let allRequirements: any[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashTMPaginatedResponse<any>>(
            correlationId,
            endpoint + `?page=${currentPage}&size=50`,
            "GET"
        );

        if (!data || !data._embedded || !data._embedded[answerFieldName]) {
            break;
        }

        const requirements = data._embedded[answerFieldName].filter((item: any) => item._type === "requirement");
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
            const details = await makeSquashRequest<SquashTMRequirementDetails>(
                correlationId,
                `requirements/${req.id}`,
                "GET"
            );
            return {
                id: details.id,
                name: details.name,
                ...details.current_version.reference && { reference: details.current_version.reference },
                description: details.current_version.description,
                created_by: details.current_version.created_by,
                created_on: details.current_version.created_on,
                last_modified_by: details.current_version.last_modified_by,
                last_modified_on: details.current_version.last_modified_on,
            };
        })
    );

    const returnedData = formatResponse({ requirements: detailedRequirements });

    logToFileAndConsole(correlationId, "INFO", "get_requirement_folder_content returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'create_requirements' tool
export const createRequirementsHandler = async (args: z.infer<typeof CreateRequirementsInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "create_requirements " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "requirement-folder" : "project";

    const createdRequirements: { id: number; name: string }[] = [];

    for (const req of args.requirements) {
        const payload: any = {
            _type: "requirement",
            current_version: {
                _type: "requirement-version",
                reference: req.reference,
                name: req.name,
                criticality: "UNDEFINED",
                category: {
                    code: "CAT_UNDEFINED",
                },
                status: "WORK_IN_PROGRESS",
                description: req.description,
            },
            parent: {
                _type: parentType,
                id: parentId,
            },
        };

        const response = await makeSquashRequest<any>(
            correlationId,
            "requirements",
            "POST",
            payload
        );

        createdRequirements.push({
            id: response.id,
            name: req.name,
            ...req.reference && { reference: req.reference },
        });
    }

    const returnedData = formatResponse({ requirements: createdRequirements });

    logToFileAndConsole(correlationId, "INFO", "create_requirements returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_requirement' tool
export const deleteRequirementHandler = async (args: z.infer<typeof DeleteRequirementInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_requirement " + JSON.stringify(args));
    await makeSquashRequest<any>(
        correlationId,
        `requirements/${args.id}`,
        "DELETE"
    );

    const requirementData = {
        message: `Requirement ${args.id} deleted successfully`,
    };

    const returnedData = formatResponse(requirementData);

    logToFileAndConsole(correlationId, "INFO", "delete_requirement returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register requirement management tools
export function registerRequirementTools(server: McpServer) {
    server.registerTool(
        "get_requirement_folder_content",
        {
            title: "Get Requirement Folder Content",
            description: "Get the requirements of a requirement folder (only includes the requirements, not the subfolders) in SquashTM",
            inputSchema: GetRequirementFolderContentInputSchema,
            outputSchema: GetRequirementFolderContentOutputSchema,
        },
        getRequirementFolderContentHandler
    );

    server.registerTool(
        "create_requirements",
        {
            title: "Create Requirements",
            description: "Create requirements in a project or folder in SquashTM",
            inputSchema: CreateRequirementsInputSchema,
            outputSchema: CreateRequirementsOutputSchema,
        },
        createRequirementsHandler
    );

    server.registerTool(
        "delete_requirement",
        {
            title: "Delete Requirement",
            description: "Delete a requirement in SquashTM",
            inputSchema: DeleteRequirementInputSchema,
            outputSchema: DeleteRequirementOutputSchema,
        },
        deleteRequirementHandler
    );
}
