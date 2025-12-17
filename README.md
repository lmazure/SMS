# SMS - SquashTM MCP Server

⚠️☠️ Do not use this server for production. It is a playground for learning MCP.

## Environment variables

- `SQUASHTM_URL`: The URL of the SquashTM server
- `SQUASHTM_API_KEY`: Your API key for SquashTM

## Build
```bash
npm run build
```

## Tools

### list_projects
Get list of SquashTM projects.
- **Input**: None

### create_test_cases
Create test cases in a project in SquashTM.
- **Input**:
  - `project_id` (number): The ID of the project where the test cases will be created.
  - `test_cases` (array): List of test cases to create (minimum 1).
    - `name` (string): The name of the test case.
    - `description` (string): Description of the test case.
    - `steps` (array): List of test steps (minimum 1).
      - `action` (string): The action to perform.
      - `expected_result` (string): The expected result.

## Launch MCP Inspector
```bash
npm run inspect
```
- Option 1
  - Copy the token from the console.
  - If the MCP Inspector runs in WSL2, you can access it at `http://localhost:<port>` instead of `http://127.0.0.1:<port>`.
  - Open the "Configuration" panel and paste the token in the "Proxy Session Token" field.
- Option 2
  - Click on the link  `http://localhost:<port>/?MCP_PROXY_AUTH_TOKEN=<token>` displayed in the console.
