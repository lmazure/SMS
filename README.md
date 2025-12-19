# SquashTM MCP Server

A Model Context Protocol (MCP) server for SquashTM that allows AI assistants like Claude to create and manage test cases.

⚠️ **Note:** This is a learning/playground project. Do not use!

## Installation & Configuration

### For Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "squashtm": {
      "command": "npx",
      "args": [
        "-y",
        "github:lmazure/SMS#v0.0.1"
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

## Available Tools

### `list_projects`

Retrieves a list of all SquashTM projects you have access to.

**Input:** None

**Output:** An array of objects, each containing:
- `id` (number): The project ID
- `name` (string): The project name
- `label` (string): The project label
- `description` (string): The project description

### `create_test_cases`

Creates one or more test cases in a specified SquashTM project.

**Input:**
- `project_id` (number): The ID of the target project
- `test_cases` (array): List of test cases to create, each containing:
  - `name` (string): Test case name
  - `description` (string): Test case description
  - `steps` (array): One or more test steps, each with:
    - `action` (string): What action to perform
    - `expected_result` (string): Expected outcome

**Output:** An array of test case objects created in SquashTM, each containing details like ID, name, etc.

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/lmazure/SMS.git
cd SMS

# Install dependencies
npm install

# Build the project
npm run build
```

### Testing with MCP Inspector

The MCP Inspector allows you to test your server locally:

```bash
npm run inspect
```

Then either:
- **Option 1:** Copy the token from the console and paste it in the Inspector's Configuration panel
- **Option 2:** Click the link displayed in the console (format: `http://localhost:<port>/?MCP_PROXY_AUTH_TOKEN=<token>`)

**Note for WSL2 users:** Access at `http://localhost:<port>` instead of `http://127.0.0.1:<port>`

## Project Structure

```
SMS/
├── src/              # Source TypeScript files
├── build/            # Compiled JavaScript (generated)
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```
