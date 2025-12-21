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
- `description` (string): The project description (rich text)

### `create_project`

Creates a new project in SquashTM.

**Input:**
- `name` (string): The name of the project
- `label` (string, optional): The label of the project
- `description` (string, optional): The description of the project (rich text)

**Output:** A success message containing the ID of the newly created project.

### `delete_project`

Deletes a project in SquashTM.

**Input:**
- `id` (number): The ID of the project to delete

**Output:** A success message.

### `get_requirement_folders_tree`

Retrieves a detailed tree of requirement folders for specified projects.

**Input:**
- `project_ids` (array of numbers): List of project IDs

**Output:** A simplified tree structure for each project, where each folder includes:
- `id` (number): The folder ID
- `name` (string): The folder name
- `description` (string): The folder description (rich text)
- `created_by` (string): Who created the folder
- `created_on` (string): Creation timestamp
- `modified_by` (string): Who last modified the folder
- `modified_on` (string): Last modification timestamp
- `children` (array): Nested child folders

### `get_test_case_folder_tree`

Retrieves a detailed tree of test case folders for specified projects.

**Input:**
- `project_ids` (array of numbers): List of project IDs

**Output:** A simplified tree structure for each project, where each folder includes:
- `id` (number): The folder ID
- `name` (string): The folder name
- `description` (string): The folder description (rich text)
- `created_by` (string): Who created the folder
- `created_on` (string): Creation timestamp
- `modified_by` (string): Who last modified the folder
- `modified_on` (string): Last modification timestamp
- `children` (array): Nested child folders

### `get_test_case_folder_content`

Retrieves the list of test cases within a specific test case folder. Only items of type `test-case` are returned.

**Input:**
- `folder_id` (number): The ID of the test case folder

**Output:** An array of test case objects, each containing:
- `id` (number): The test case ID
- `name` (string): The test case name
- `prerequisite` (string): The test case prerequisite (rich text)
- `description` (string): The test case description (rich text)
- `created_by` (string): Who created the test case
- `created_on` (string): Creation timestamp
- `last_modified_by` (string): Who last modified the test case
- `last_modified_on` (string): Last modification timestamp

### `create_test_cases`

Creates one or more test cases in a specified SquashTM project.

**Input:**
- `project_id` (number): The ID of the target project
- `test_cases` (array): List of test cases to create, each containing:
  - `name` (string): Test case name
  - `description` (string): Test case description (rich text)
  - `steps` (array): One or more test steps, each with:
    - `action` (string): What action to perform (rich text)
    - `expected_result` (string): Expected outcome (rich text)

**Output:** None

### `get_campaign_folder_tree`

Retrieves a detailed tree of campaign folders for specified projects.

**Input:**
- `project_ids` (array of numbers): List of project IDs

**Output:** A simplified tree structure for each project, where each folder includes:
- `id` (number): The folder ID
- `name` (string): The folder name
- `description` (string): The folder description (rich text)
- `created_by` (string): Who created the folder
- `created_on` (string): Creation timestamp
- `modified_by` (string): Who last modified the folder
- `modified_on` (string): Last modification timestamp
- `children` (array): Nested child folders

### Note : Rich text

Rich text is a subset of HTML.

Allowed elements are: `a`, `b`, `blockquote`, `br`, `caption`, `center`, `cite`, `code`, `col`, `colgroup`, `dd`,
`del`, `div`, `dl`, `dt`, `em`, `figure`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `i`, `img`, `ins`, `li`, `ol`, `p`,
`pre`, `q`, `s`, `small`, `span`, `strike`, `strong`, `sub`, `sup`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`,
`u`, and `ul`.

Allowed attributes for all elements are: `align`, `aria-hidden`, `border`, `cellpadding`, `cellspacing`,
`class`, `dir`, `height`, `id`, `lang`, `rel`, `role`, `style`, `tabindex`, `title`, and `width`.

Additionally, some elements support specific attributes. These are listed below:

| Element      | Attributes                                               |
|--------------|----------------------------------------------------------|
| `a`          | `accesskey`, `charset`, `href`, `name`, `target`, `type` |
| `blockquote` | `cite`                                                   |
| `col`        | `span`                                                   |
| `del`        | `cite`                                                   |
| `figure`     | `longdesc`                                               |
| `font`       | `color`, `face`, `size`                                  |
| `img`        | `longdesc`, `alt`, `src`                                 |
| `ins`        | `cite`                                                   |
| `ol`         | `start`, `type`                                          |
| `q`          | `cite`                                                   |
| `table`      | `border`, `cellpadding`, `cellspacing`, `summary`        |
| `td`         | `abbr`, `axis`, `colspan`, `rowspan`                     |
| `th`         | `abbr`, `axis`, `colspan`, `rowspan`, `scope`            |
| `ul`         | `type`                                                   |

Allowed protocols for URI attributes are:

| Element      | Attribute | Protocols                        |
|--------------|-----------|----------------------------------|
| `a`          | `href`    | `ftp`, `http`, `https`, `mailto` |
| `blockquote` | `cite`    | `http`, `https`                  |
| `del`        | `cite`    | `http`, `https`                  |
| `img`        | `src`     | `cid`, `data`, `http`, `https`   |
| `ins`        | `cite`    | `http`, `https`                  |
| `q`          | `cite`    | `http`, `https`                  |

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
