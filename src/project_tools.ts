import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    SquashTMProject,
    SquashTMPaginatedResponse,
    makeSquashRequest,
} from "./squashtm_rest_api.js";
import {
    generateCorrelationId,
    logToFileAndConsole,
    formatResponse,
} from "./utils.js";

// Zod schemas for validation of the tool inputs and outputs
const ListProjectsInputSchema = z.object({});

export const ListProjectsOutputSchema = z.object({
    projects: z.array(
        z.object({
            id: z.number().describe("The ID of the project"),
            name: z.string().describe("The name of the project"),
            label: z.string().optional().describe("The label of the project"),
            description: z.string().optional().describe("The description of the project (rich text)"),
        }).strict()
    ),
}).strict();

const CreateProjectInputSchema = z.object({
    name: z.string().trim().min(1).describe("The name of the project to create"),
    label: z.string().trim().min(1).optional().describe("The label of the project to create"),
    description: z.string().trim().min(1).optional().describe("The description of the project to create (rich text)"),
}).strict();

export const CreateProjectOutputSchema = z.object({
    id: z.number().describe("The ID of the newly created project"),
}).strict();

const DeleteProjectInputSchema = z.object({
    id: z.number().describe("The ID of the project to delete"),
}).strict();

export const DeleteProjectOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the project"),
}).strict();

// 'list_projects' tool
export const listProjectsHandler = async () => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "list_projects");
    let allProjects: SquashTMProject[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages) {
        const data = await makeSquashRequest<SquashTMPaginatedResponse<SquashTMProject>>(
            correlationId,
            `projects?type=STANDARD&page=${currentPage}&size=50`,
            "GET"
        );

        if (data._embedded?.projects) {
            allProjects.push(...data._embedded.projects);
        }

        if (data.page) {
            totalPages = data.page.totalPages;
            currentPage++;
        } else {
            break;
        }
    }

    const detailedProjects = {
        projects: await Promise.all(
            allProjects.map(async (p) => {
                const details = await makeSquashRequest<SquashTMProject>(
                    correlationId,
                    `projects/${p.id}`,
                    "GET"
                );
                return {
                    id: p.id,
                    name: p.name,
                    ...(details.label && { label: details.label }),
                    ...(details.description && { description: details.description }),
                };
            })
        )
    };

    const returnedData = formatResponse(detailedProjects);

    logToFileAndConsole(correlationId, "INFO", "list_projects returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'create_project' tool
export const createProjectHandler = async (args: z.infer<typeof CreateProjectInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "create_project " + JSON.stringify(args));
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

    const projectData = {
        id: response.id,
    };

    const returnedData = formatResponse(projectData);

    logToFileAndConsole(correlationId, "INFO", "create_project returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_project' tool
export const deleteProjectHandler = async (args: z.infer<typeof DeleteProjectInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_project " + JSON.stringify(args));
    await makeSquashRequest<any>(
        correlationId,
        `projects/${args.id}`,
        "DELETE"
    );

    const projectData = {
        message: `Project ${args.id} deleted successfully`,
    };

    const returnedData = formatResponse(projectData);

    logToFileAndConsole(correlationId, "INFO", "delete_project returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register project management tools
export function registerProjectTools(server: McpServer) {
    server.registerTool(
        "list_projects",
        {
            title: "List Projects",
            description: "Get list of SquashTM projects",
            inputSchema: ListProjectsInputSchema,
            outputSchema: ListProjectsOutputSchema,
        },
        listProjectsHandler
    );

    server.registerTool(
        "create_project",
        {
            title: "Create Project",
            description: "Create a new project in SquashTM",
            inputSchema: CreateProjectInputSchema,
            outputSchema: CreateProjectOutputSchema,
        },
        createProjectHandler
    );

    server.registerTool(
        "delete_project",
        {
            title: "Delete Project",
            description: "Delete a project in SquashTM",
            inputSchema: DeleteProjectInputSchema,
            outputSchema: DeleteProjectOutputSchema,
        },
        deleteProjectHandler
    );
}
