# How to develop

## Setup

```bash
# Clone the repository
git clone https://github.com/lmazure/SMS.git
cd SMS

# Install dependencies
npm install

# Build the project
npm run build

# Run the tests
npm run test
```

## Testing with MCP Inspector

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) allows you to test your server locally:

```bash
npm run inspect
```

Then either:
- **Option 1:** Copy the token from the console and paste it in the Inspector's Configuration panel
- **Option 2:** Click the link displayed in the console (format: `http://localhost:<port>/?MCP_PROXY_AUTH_TOKEN=<token>`)

**Note for WSL2 users:** Access at `http://localhost:<port>` instead of `http://127.0.0.1:<port>`

## Declare your local SMS in Claude Desktop

```json
{
  "mcpServers": {
    "squashtm": {
      "command": "node",
      "args": [
        "/path_to_your_local_repository/SMS/build/index.js"
      ],
      "env": {
        "SQUASHTM_URL": "https://your-squashtm-instance.com/squash",
        "SQUASHTM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Example of a complete configuration file (mine…):
```json
{
  "mcpServers": {
    "squashtm": {
      "command": "node",
      "args": [
        "\\\\wsl.localhost\\Ubuntu-22.04\\home\\laurent\\code\\GitHub\\lmazure\\SMS\\build\\index.js"
      ],
      "env": {
        "SQUASHTM_URL": "http://localhost:8090/squash",
        "SQUASHTM_API_KEY": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidXVpZCI6IjU2M2RlNTExLWFmZjItNGIxZi1hNDQ2LTk3MzBiZmMwM2Y5OCIsInBlcm1pc3Npb25zIjoiUkVBRF9XUklURSIsImlhdCI6MTc2NjkxNjA1MCwiZXhwIjoxNzk4MzI5NjAwfQ.HynOVSP3JVZlEw8yzHCsVKreCrKJw5JB_icvEh4IxdXdfzR2Z1f6-HF8uc8lw4YtyzpH-IImphAeOuqyHy9xIQ"
      }
    }
  },
  "preferences": {
    "menuBarEnabled": false,
    "legacyQuickEntryEnabled": false
  },
  "globalShortcut": ""
}
```

## Project Structure

```
SMS/
├── src/                  # Source TypeScript files
│   └── tests/            # Test files   
├── build/                # Compiled JavaScript (generated)
├── dev.md                # Development documentation
├── package.json          # Dependencies and scripts
├── README.md             # Project documentation
├── tools.md              # Description of tools provided by this MCP Server
├── tsconfig.json         # TypeScript configuration
└── vitest.config.ts      # Vitest configuration
```
## Architecture

Many tools are simple wrappers around SquashTM REST API.

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant SMS as SMS (MCP Server)
    participant API as SquashTM REST API

    Client->>SMS: call tool
    activate SMS
    Note over SMS: transform request
    SMS->>API: GET/POST/PATCH/DELETE endpoint
    activate API
    API-->>SMS: return result
    deactivate API
    Note over SMS: transform result
    SMS-->>Client: return result
    deactivate SMS
```

Some tools are completing the information of each entity returned by SquashTM REST API.

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant SMS as SMS (MCP Server)
    participant API as SquashTM REST API

    Client->>SMS: call tool
    activate SMS
    Note over SMS: transform request
    SMS->>API: GET endpoint 1
    activate API
    API-->>SMS: return result
    deactivate API
    loop for each returned entity
        SMS->>API: GET additional endpoint 2
        activate API
        API-->>SMS: return entity details
        deactivate API
        Note over SMS: complete entity information
    end
    SMS-->>Client: return result
    deactivate SMS
```

## How to release

1) Update the release number in:
    - `README.md` where is describe how to declare SMS in Claude Desktop config file
    - `package.json`
    - `src/index.ts` where is created the `McpServer` instance
2) Push the last commits on GitHub
3) Merge (and squash) the issue branch on the `main` branch
4) Tag the release:
    ```bash
    git switch main
    git pull
    git tag -a v0.0.4 -m "Release v0.0.4"
    ```
5) Push the tag on GitHub:
    ```bash
    git push origin v0.0.4
    ```
