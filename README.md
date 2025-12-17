# SMS - SquashTM MCP Server

⚠️☠️ Do not use this server for production. It is a playground for learning MCP.

## Environment variables

- `SQUASHTM_URL`: The URL of the SquashTM server
- `SQUASHTM_API_KEY`: Your API key for SquashTM

## Build
```bash
npm run build
```

## Launch MCP Inspector
```bash
npm run inspect
```
- Option 1
  - Copy the token from the console.
  - If the MCP Inspector runs in WSL2, you can access it at [http://localhost:\<port>]() instead of [http://127.0.0.1:\<port>]().
  - Open the "Configuration" panel and paste the token in the "Proxy Session Token" field.
- Option 2
  - Click on the link  [http://localhost:\<port>/?MCP_PROXY_AUTH_TOKEN=\<token>]() displayed in the console.
