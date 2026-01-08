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
    makeSquashRequest,
} from "./utils.js";

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "0.0.2",
});

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

import { registerProjectTools } from "./projects.js";
import { registerFolderTools } from "./folders.js";

// Register project management tools
registerProjectTools(server);

// Register folder management tools
registerFolderTools(server);

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
