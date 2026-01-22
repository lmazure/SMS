import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    makeSquashRequest,
    SquashTMTestCaseDetails,
    SquashTMPaginatedResponse,
    SquashTMDataset,
    SquashTMParameter
} from "./squashtm_rest_api.js";
import {
    generateCorrelationId,
    logToFileAndConsole,
    formatResponse,
} from "./utils.js";

// Zod schemas

const GetTestCaseFolderContentInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to retrieve the test case folder content"),
    folder_id: z.number().optional().describe("The ID of the test case folder to retrieve content for (optional, if not specified, the test cases of the project root will be retrieved)"),
}).strict();

export const GetTestCaseFolderContentOutputSchema = z.object({
    test_cases: z.array(
        z.object({
            id: z.number().describe("The ID of the test case"),
            name: z.string().describe("The name of the test case"),
            reference: z.string().optional().describe("The reference of the test case (absent if the test case has no reference)"),
            description: z.string().describe("The description of the test case (rich text)"),
            prerequisite: z.string().optional().describe("The prerequisite of the test case (rich text)"),
            created_by: z.string().describe("Who created the test case"),
            created_on: z.string().describe("Creation timestamp"),
            last_modified_by: z.string().optional().describe("Who last modified the test case (absent if the test case has not been modified since creation)"),
            last_modified_on: z.string().optional().describe("Last modification timestamp (absent if the test case has not been modified since creation)"),
            steps: z.array(
                z.object({
                    action: z.string().describe("The action to perform"),
                    expected_result: z.string().describe("The expected result"),
                }).strict()
            ).describe("List of test steps"),
            verified_requirements: z.array(z.number()).describe("Ids of the requirements verified by this test case"),
            datasets: z.object({
                parameter_names: z.array(z.string().describe("Names of the parameters")),
                datasets: z.array(z.object({
                    name: z.string().describe("Name of the dataset"),
                    parameters_values: z.array(z.string()).describe("Values for each parameter, in order")
                }))
            }).optional().describe("Datasets associated with the test case"),
        }).strict()
    ),
}).strict();

const CreateTestCasesInputSchema = z.object({
    project_id: z.number().describe("The ID of the project in which to create the test cases"),
    parent_folder_id: z.number().optional().describe("The ID of an existing folder into which create the new test cases (optional, if not specified, the test cases will be created at the root level)"),
    test_cases: z.array(
        z.object({
            name: z.string().trim().min(1).describe("The name of the test case"),
            reference: z.string().trim().min(1).optional().describe("The reference of the test case (absent if the test case has no reference)"),
            description: z.string().trim().min(1).describe("The description of the test case (rich text)"),
            prerequisite: z.string().trim().min(1).optional().describe("The prerequisite of the test case (rich text)"),
            steps: z.array(z.object({
                action: z.string().trim().min(1).describe("The action to perform"),
                expected_result: z.string().trim().min(1).describe("The expected result"),
            })).min(1).optional().describe("List of test steps"),
            verified_requirement_ids: z.array(z.number()).describe("Ids of the requirements verified by this test case"),
            datasets: z.object({
                parameter_names: z.array(z.string().trim().min(1).describe("The name of the parameter")).min(1).describe("The list of parameter names"),
                datasets: z.array(z.object({
                    name: z.string().trim().min(1).describe("The name of the dataset"),
                    parameters_values: z.array(z.string().describe("The value of the parameter")).min(1).describe("The values of the parameters, in the same order as parameter_names")
                })).min(1).describe("The list of datasets")
            }).optional().describe("datasets to add to the test case"),
        }).strict()
    ).min(1).describe("The list of test cases to create"),
}).strict();

export const CreateTestCasesOutputSchema = z.object({
    test_cases: z.array(
        z.object({
            id: z.number().describe("The ID of the created test case"),
            name: z.string().describe("The name of the created test case"),
            reference: z.string().optional().describe("The reference of the created test case (absent if the test case has no reference)"),
        }).strict()
    ),
}).strict();

const DeleteTestCaseInputSchema = z.object({
    id: z.number().describe("The ID of the test case to delete"),
}).strict();

export const DeleteTestCaseOutputSchema = z.object({
    message: z.string().describe("Message indicating success of the deletion of the test case"),
}).strict();

// 'get_test_case_folder_content' tool
export const getTestCaseFolderContentHandler = async (args: z.infer<typeof GetTestCaseFolderContentInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "get_test_case_folder_content " + JSON.stringify(args));

    const endpoint = args.folder_id ? `test-case-folders/${args.folder_id}/content` : `projects/${args.project_id}/test-cases-library/content`;
    const answerFieldName = args.folder_id ? "content" : "test-case-library-content";

    let allTestCases: any[] = [];
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

        const testCases = data._embedded[answerFieldName].filter((item: any) => item._type === "test-case");
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
            const details = await makeSquashRequest<SquashTMTestCaseDetails>(
                correlationId,
                `test-cases/${tc.id}`,
                "GET"
            );
            const baseDetails = {
                id: details.id,
                name: details.name,
                ...(details.reference && { reference: details.reference }),
                ...(details.prerequisite && { prerequisite: details.prerequisite }),
                description: details.description,
                created_by: details.created_by,
                created_on: details.created_on,
                ...(details.last_modified_by && { last_modified_by: details.last_modified_by }),
                ...(details.last_modified_on && { last_modified_on: details.last_modified_on }),
                steps: details.steps.map((step: any) => ({
                    action: step.action,
                    expected_result: step.expected_result,
                })),
                verified_requirements: details.verified_requirements
                    .filter((req: any) => req._type === "requirement-version")
                    .map((req: any) => req.id),
                datasets: undefined as any
            };

            const datasetsResponse = await makeSquashRequest<SquashTMPaginatedResponse<SquashTMDataset>>(
                correlationId,
                `test-cases/${tc.id}/datasets`,
                "GET"
            );

            if (datasetsResponse._embedded && datasetsResponse._embedded.datasets && datasetsResponse._embedded.datasets.length > 0) {
                const datasetsInfo = datasetsResponse._embedded.datasets;
                // Assuming all datasets have the same parameters structure, we take the first one to get names
                // The API returns 'parameters' array in dataset object which contains definitions.
                // We can also rely on parameter_values having parameter_name.

                // Let's use the first dataset to extract parameter names order
                const firstDataset = datasetsInfo[0];
                let parameterNames: string[] = [];

                if (firstDataset.parameters && firstDataset.parameters.length > 0) {
                    parameterNames = firstDataset.parameters.map(p => p.name);
                } else if (firstDataset.parameter_values && firstDataset.parameter_values.length > 0) {
                    // Fallback to parameter_values order if parameters definition is missing
                    parameterNames = firstDataset.parameter_values.map(pv => pv.parameter_name);
                }

                if (parameterNames.length > 0) {
                    const formattedDatasets = datasetsInfo.map(ds => {
                        // Map values based on parameter names order
                        // Create a map for quick lookup
                        const valueMap = new Map<string, string>();
                        ds.parameter_values.forEach(pv => {
                            valueMap.set(pv.parameter_name, pv.parameter_value);
                        });

                        const orderedValues = parameterNames.map(name => valueMap.get(name) || "");

                        return {
                            name: ds.name,
                            parameters_values: orderedValues
                        };
                    });

                    return {
                        ...baseDetails,
                        datasets: {
                            parameter_names: parameterNames,
                            datasets: formattedDatasets
                        }
                    };
                }
            }

            return {
                ...baseDetails,
                datasets: undefined
            };
        })
    );

    const returnedData = formatResponse({ test_cases: detailedTestCases });

    logToFileAndConsole(correlationId, "INFO", "get_test_case_folder_content returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'create_test_cases' tool
export const createTestCasesHandler = async (args: z.infer<typeof CreateTestCasesInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "create_test_cases " + JSON.stringify(args));

    const parentId = args.parent_folder_id || args.project_id;
    const parentType = args.parent_folder_id ? "test-case-folder" : "project";

    const createdTestCases: { id: number; name: string }[] = [];

    for (const tc of args.test_cases) {
        const payload: any = {
            _type: "test-case",
            name: tc.name,
            ...(tc.reference && { reference: tc.reference }),
            description: tc.description,
            prerequisite: tc.prerequisite,
            parent: {
                _type: parentType,
                id: parentId,
            },
            steps: tc.steps ? tc.steps.map((step) => ({
                _type: "action-step",
                action: step.action,
                expected_result: step.expected_result,
            })) : [],
        };

        const response = await makeSquashRequest<any>(
            correlationId,
            "test-cases",
            "POST",
            payload
        );

        if (tc.verified_requirement_ids.length > 0) {
            await makeSquashRequest<any>(
                correlationId,
                `test-cases/${response.id}/coverages/${tc.verified_requirement_ids.join(",")}`,
                "POST",
            );
        }

        if (tc.datasets) {
            const paramIdMap = new Map<string, number>();
            for (const paramName of tc.datasets.parameter_names) {
                const paramPayload = {
                    _type: "parameter",
                    name: paramName,
                    description: "",
                    test_case: {
                        _type: "test-case",
                        id: response.id
                    }
                };
                const paramResponse = await makeSquashRequest<SquashTMParameter>(
                    correlationId,
                    "parameters",
                    "POST",
                    paramPayload
                );
                paramIdMap.set(paramName, paramResponse.id);
            }

            for (const dataset of tc.datasets.datasets) {
                const parameterValues = tc.datasets.parameter_names.map((name, index) => ({
                    parameter_test_case_id: response.id,
                    parameter_id: paramIdMap.get(name),
                    parameter_name: name,
                    parameter_value: dataset.parameters_values[index]
                }));

                const datasetPayload = {
                    _type: "dataset",
                    name: dataset.name,
                    test_case: {
                        _type: "test-case",
                        id: response.id
                    },
                    parameter_values: parameterValues
                };

                await makeSquashRequest<SquashTMDataset>(
                    correlationId,
                    "datasets",
                    "POST",
                    datasetPayload
                );
            }
        }

        createdTestCases.push({
            id: response.id,
            name: tc.name,
            ...(tc.reference && { reference: tc.reference }),
        });
    }

    const returnedData = formatResponse({ test_cases: createdTestCases });

    logToFileAndConsole(correlationId, "INFO", "create_test_cases returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// 'delete_test_case' tool
export const deleteTestCaseHandler = async (args: z.infer<typeof DeleteTestCaseInputSchema>) => {
    const correlationId = generateCorrelationId();
    logToFileAndConsole(correlationId, "INFO", "delete_test_case " + JSON.stringify(args));
    await makeSquashRequest<any>(
        correlationId,
        `test-cases/${args.id}`,
        "DELETE"
    );

    const testCaseData = {
        message: `Test case ${args.id} deleted successfully`,
    };

    const returnedData = formatResponse(testCaseData);

    logToFileAndConsole(correlationId, "INFO", "delete_test_case returned: " + JSON.stringify(returnedData, null, 2));
    return returnedData;
};

// Register test case management tools
export function registerTestCaseTools(server: McpServer) {
    server.registerTool(
        "get_test_case_folder_content",
        {
            title: "Get Test Case Folder Content",
            description: "Get the test cases of a test case folder (only includes items of type 'test-case') in SquashTM",
            inputSchema: GetTestCaseFolderContentInputSchema,
            outputSchema: GetTestCaseFolderContentOutputSchema,
        },
        getTestCaseFolderContentHandler
    );

    server.registerTool(
        "create_test_cases",
        {
            title: "Create Test Cases",
            description: "Create test cases in a project or folder in SquashTM",
            inputSchema: CreateTestCasesInputSchema,
            outputSchema: CreateTestCasesOutputSchema,
        },
        createTestCasesHandler
    );

    server.registerTool(
        "delete_test_case",
        {
            title: "Delete Test Case",
            description: "Delete a test case in SquashTM",
            inputSchema: DeleteTestCaseInputSchema,
            outputSchema: DeleteTestCaseOutputSchema,
        },
        deleteTestCaseHandler
    );
}
