#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { fileURLToPath } from 'url';
import {
    logErrorToConsole,
} from "./utils.js";

// Create server instance
const server = new McpServer({
    name: "SquashTM",
    version: "0.0.4",
});

// Register tools
import { registerProjectTools } from "./projects.js";
import { registerFolderTools } from "./folders.js";
import { registerRequirementTools } from "./requirements.js";
import { registerTestCaseTools } from "./test_cases.js";

registerProjectTools(server);
registerFolderTools(server);
registerRequirementTools(server);
registerTestCaseTools(server);

// Start server
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
