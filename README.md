# SquashTM MCP Server

A Model Context Protocol (MCP) server for SquashTM that allows AI assistants like Claude to create and manage test cases.

⚠️ This is a learning/playground project. **Do not use!**

## Installation & Configuration

### Prerequisites

- Node.js (>= 18.0.0)
- Environment variables:
    - `SQUASHTM_URL`: URL of your SquashTM instance
    - `SQUASHTM_API_KEY`: SquashTM API key for authentication
    - `SMS_LOG_FILE` (optional): Path to the log file

### For Claude Desktop

Add this configuration to your Claude Desktop config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "squashtm": {
      "command": "npx",
      "args": [
        "-y",
        "github:lmazure/SMS#v0.0.11"
      ],
      "env": {
        "SQUASHTM_URL": "https://your-squashtm-instance.com/squash",
        "SQUASHTM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `your-squashtm-instance.com` and `your-api-key-here` with your actual SquashTM URL and API key.

In case of problem when trying to access the SMS MCP Server, check the logs in the Claude Desktop application.
- main log file
    - Windows: `%APPDATA%\Claude\logs\main.log`
    - macOS: `~/Library/Logs/Claude/main.log`
- SMS log file
    - Windows: `%APPDATA%\Claude\logs\mcp-server-squashtm.log`
    - macOS: `~/Library/Logs/Claude/mcp-server-squashtm.log`

## Available Tools

See [tools.md](tools.md).

## Development

See [dev.md](dev.md).
