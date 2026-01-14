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
    version: "0.0.3",
});

// Zod schemas for validation of the tool inputs and outputs



import { registerProjectTools } from "./projects.js";
import { registerFolderTools } from "./folders.js";
import { registerRequirementTools } from "./requirements.js";
import { registerTestCaseTools } from "./test_cases.js";

// Register project management tools
registerProjectTools(server);

// Register folder management tools
registerFolderTools(server);

// Register requirement management tools
// Register requirement management tools
registerRequirementTools(server);

// Register test case management tools
registerTestCaseTools(server);

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
