#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from 'url';

// Create server instance
const SMS_VERSION = "0.0.10.dev";
const server = new McpServer({
    name: "SquashTM",
    version: SMS_VERSION,
});

// Register tools
import { registerProjectTools } from "./project_tools.js";
import { registerFolderTools } from "./folder_tools.js";
import { registerRequirementTools } from "./requirement_tools.js";
import { registerTestCaseTools } from "./test_case_tools.js";

try {
    registerProjectTools(server);
    registerFolderTools(server);
    registerRequirementTools(server);
    registerTestCaseTools(server);
    console.error("All tools registered successfully");
} catch (error) {
    console.error("Error registering tools:", error);
    throw error;
}

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`SquashTM MCP Server (version ${SMS_VERSION}) running on stdio`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(`Fatal error in main(): ${error}`);
        console.error(error.stack);
        process.exit(1);
    });
}
