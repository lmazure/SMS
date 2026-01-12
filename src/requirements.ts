import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    makeSquashRequest,
    formatResponse,
    generateCorrelationId,
    logToFile,
} from "./utils.js";

// Zod schemas for validation of the tool inputs and outputs
const CreateRequirementsInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the requirements"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new requirements(optional, if not specified, the requirements will be created at the root level)"),
    requirements: z.array(
        z.object({
            name: z.string().describe("The name of the requirement"),
            description: z.string().describe("The description of the requirement (rich text)"),
        })
    ).min(1).describe("The list of requirements to create"),
});

const CreateRequirementsOutputSchema = z.object({
    requirements: z.array(
        z.object({
            id: z.number().describe("The ID of the created requirement"),
            name: z.string().describe("The name of the created requirement"),
        })
    ),
});

// 'create_requirements' tool
export const createRequirementsHandler = async (args: z.infer<typeof CreateRequirementsInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFile(correlationId, "create_requirements " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "requirement-folder" : "project";

    const createdRequirements: { id: number; name: string }[] = [];

    for (const req of args.requirements) {
        const payload: any = {
            _type: "requirement",
            current_version: {
                _type: "requirement-version",
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
            name: response.name,
        });
    }

    const returnedData = formatResponse({ requirements: createdRequirements });

    logToFile(correlationId, "create_requirements returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register requirement management tools
export function registerRequirementTools(server: McpServer) {
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
}
