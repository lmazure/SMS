# Available Tools

## Projects

### `list_projects`

Retrieves a list of all SquashTM projects you have access to.

**Input:** None

**Output:** An array of objects, each containing:
- `id` (number): The project ID
- `name` (string): The project name
- `label` (string, optional): The project label
- `description` (string, optional): The project description (rich text)

### `create_project`

Creates a new project in SquashTM.

**Input:**
- `name` (string): The name of the project
- `label` (string, optional): The label of the project
- `description` (string, optional): The description of the project (rich text)

**Output:** An object containing:
- `id` (number): The ID of the newly created project

### `delete_project`

Deletes a project in SquashTM.

**Input:**
- `id` (number): The ID of the project to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the project

## Requirements

### `get_requirement_folders_tree`

Retrieves a detailed tree of requirement folders for a specified project.

**Input:**
- `project_id` (number): The project ID

**Output:** An object containing:
- `folders` (array): List of folders, where each folder includes:
  - `id` (number): The folder ID
  - `name` (string): The folder name
  - `description` (string, optional): The folder description (rich text) (absent if the folder has no description)
  - `created_by` (string): Who created the folder
  - `created_on` (string): Creation timestamp
  - `modified_by` (string, optional): Who last modified the folder (absent if the folder has never been modified)
  - `modified_on` (string, optional): Last modification timestamp (absent if the folder has never been modified)
  - `children` (array): Nested child folders

### `create_requirements`

Creates one or more requirements in a specified SquashTM project.

**Input:**
- `project_id` (number): The project ID in which to create the requirements
- `parent_folder_id` (number, optional): The ID of an existing folder into which create the new requirements (optional, if not specified, the requirements will be created at the root level)
- `requirements` (array): List of requirements to create, each containing:
  - `name` (string): Requirement name
  - `reference` (string, optional): Requirement reference
  - `description` (string): Requirement description (rich text)

**Output:** An object containing:
- `requirements` (array): List of requirements, where each requirement includes:
  - `id` (number): The requirement ID
  - `name` (string): The requirement name
  - `reference` (string, optional): The requirement reference (absent if the requirement has no reference)

### `delete_requirement`

**Input:**
- `id` (number): The ID of the requirement to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the requirement

### `get_requirement_folder_content`

Retrieves the list of requirements within a specific requirement folder.

**Input:**
- `project_id` (number): The project ID from which to retrieve the requirements
- `parent_folder_id` (number, optional): The ID of an existing folder from which to retrieve the requirements (optional, if not specified, the requirements will be retrieved from the root level)

**Output:** An object containing:
- `requirements` (array): List of requirements, where each requirement includes:
  - `id` (number): The requirement ID
  - `reference` (string, optional): The requirement reference (absent if the requirement has no reference)
  - `name` (string): The requirement name
  - `description` (string): The requirement description (rich text)
  - `created_by` (string): Who created the requirement
  - `created_on` (string): Creation timestamp
  - `last_modified_by` (string): Who last modified the requirement
  - `last_modified_on` (string): Last modification timestamp

### `create_requirement_folder`

Creates requirement folder.

**Input:**
- `project_id` (number): The ID of the project in which to create the folder
- `parent_folder_id` (number, optional): The ID of an existing folder into which create the new folder
- `name` (string): Name of the folder
- `description` (string, optional): Description of the folder (rich text)
- `children` (array): Array of subfolders, each containing `name`, `id`, and `children`

**Output:** An object containing:
- `folder` (object): The created folder structure with:
  - `name` (string): Name of the folder
  - `id` (number): ID of the folder
  - `children` (array): Subfolders

### `delete_requirement_folder`

Deletes a requirement folder and its content.

**Input:**
- `folder_id` (number): The ID of the folder to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the requirement folder


## Test Cases

### `get_test_case_folder_tree`

Retrieves a detailed tree of test case folders for a specified project.

**Input:**
- `project_id` (number): The project ID

**Output:** An object containing:
- `folders` (array): List of folders, where each folder includes:
  - `id` (number): The folder ID
  - `name` (string): The folder name
  - `description` (string, optional): The folder description (rich text) (absent if the folder has no description)
  - `created_by` (string): Who created the folder
  - `created_on` (string): Creation timestamp
  - `modified_by` (string, optional): Who last modified the folder (absent if the folder has never been modified)
  - `modified_on` (string, optional): Last modification timestamp (absent if the folder has never been modified)
  - `children` (array): Nested child folders

### `get_test_case_folder_content`

Retrieves the list of test cases within a specific test case folder. Only items of type `test-case` are returned. The other types of test cases are not returned.

**Input:**
- `project_id` (number): The project ID from which to retrieve the test cases
- `folder_id` (number, optional): The ID of an existing folder from which to retrieve the test cases (optional, if not specified, the test cases will be retrieved from the root level)

**Output:** An array of test case objects, each containing:
- `id` (number): The test case ID
- `name` (string): The test case name
- `reference` (string, optional): The test case reference (absent if the test case has no reference)
- `prerequisite` (string): The test case prerequisite (rich text)
- `description` (string): The test case description (rich text)
- `steps` (array): List of test steps, each containing:
  - `action` (string): What action to perform (rich text)
  - `expected_result` (string): Expected outcome (rich text)
- `verified_requirement_ids` (array): List of requirement IDs verified by this test case
- `created_by` (string): Who created the test case
- `created_on` (string): Creation timestamp
- `last_modified_by` (string): Who last modified the test case
- `last_modified_on` (string): Last modification timestamp
- `datasets` (object, optional): Datasets associated with the test case
  - `parameter_names` (array of strings): Names of the parameters
  - `datasets` (array of objects): List of datasets, each containing:
    - `name` (string): Name of the dataset
    - `parameters_values` (array of strings): Values for each parameter, in order

### `create_test_cases`

Creates one or more test cases in a specified SquashTM project.

**Input:**
- `project_id` (number): The ID of the target project
- `parent_folder_id` (number, optional): The ID of an existing folder into which create the new test cases (optional, if not specified, the test cases will be created at the root level)
- `test_cases` (array): List of test cases to create, each containing:
  - `name` (string): Test case name
  - `reference` (string, optional): Test case reference (absent if the test case has no reference)
  - `description` (string): Test case description (rich text)
  - `prerequisite` (string, optional): Test case prerequisite (rich text)
  - `steps` (array, optional): One or more test steps, each with:
    - `action` (string): What action to perform (rich text)
    - `expected_result` (string): Expected outcome (rich text)
  - `verified_requirement_ids` (array): List of requirement IDs verified by this test case
  - `datasets` (object, optional): Datasets to add to the test case
    - `parameter_names` (array of strings): The list of parameter names
    - `datasets` (array of objects): The list of datasets
      - `name` (string): The name of the dataset
      - `parameters_values` (array of strings): The values of the parameters, in the same order as parameter_names

**Output:** An object containing:
- `test_cases` (array): List of test cases, where each test case includes:
  - `id` (number): The test case ID
  - `name` (string): The test case name
  - `reference` (string, optional): The test case reference (absent if the test case has no reference)

### `delete_test_case`

**Input:**
- `id` (number): The ID of the test case to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the test case

### `create_test_case_folder`

Creates test case folder.

**Input:**
- `project_id` (number): The ID of the project in which to create the folder
- `parent_folder_id` (number, optional): The ID of an existing folder into which create the new folder
- `name` (string): Name of the folder
- `description` (string, optional): Description of the folder (rich text)
- `children` (array): Array of subfolders, each containing `name`, `id`, and `children`

**Output:** An object containing:
- `folder` (object): The created folder structure with:
  - `name` (string): Name of the folder
  - `id` (number): ID of the folder
  - `children` (array): Subfolders

### `delete_test_case_folder`

Deletes a test case folder and its content.

**Input:**
- `folder_id` (number): The ID of the folder to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the test case folder

## Campaigns

### `get_campaign_folder_tree`

Retrieves a detailed tree of campaign folders for a specified project.

**Input:**
- `project_id` (number): The project ID

**Output:** An object containing:
- `folders` (array): List of folders, where each folder includes:
  - `id` (number): The folder ID
  - `name` (string): The folder name
  - `description` (string, optional): The folder description (rich text) (absent if the folder has no description)
  - `created_by` (string): Who created the folder
  - `created_on` (string): Creation timestamp
  - `modified_by` (string, optional): Who last modified the folder (absent if the folder has never been modified)
  - `modified_on` (string, optional): Last modification timestamp (absent if the folder has never been modified)
  - `children` (array): Nested child folders

### `create_campaign_folder`

Creates campaign folder.

**Input:**
- `project_id` (number): The ID of the project in which to create the folder
- `parent_folder_id` (number, optional): The ID of an existing folder into which create the new folder
- `name` (string): Name of the folder
- `description` (string, optional): Description of the folder (rich text)
- `children` (array): Array of subfolders, each containing `name`, `id`, and `children`

**Output:** An object containing:
- `folder` (object): The created folder structure with:
  - `name` (string): Name of the folder
  - `id` (number): ID of the folder
  - `children` (array): Subfolders

### `delete_campaign_folder`

Deletes a campaign folder and its content.

**Input:**
- `folder_id` (number): The ID of the folder to delete

**Output:** An object containing:
- `message` (string): Message indicating success of the deletion of the campaign folder


## Note 1: Rich text

Rich text is a subset of HTML.

Allowed elements are: `a`, `b`, `blockquote`, `br`, `caption`, `center`, `cite`, `code`, `col`, `colgroup`, `dd`, `del`, `div`, `dl`, `dt`, `em`, `figure`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `hr`, `i`, `img`, `ins`, `li`, `ol`, `p`, `pre`, `q`, `s`, `small`, `span`, `strike`, `strong`, `sub`, `sup`, `table`, `tbody`, `td`, `tfoot`, `th`, `thead`, `tr`, `u`, and `ul`.

Allowed attributes for all elements are: `align`, `aria-hidden`, `border`, `cellpadding`, `cellspacing`, `class`, `dir`, `height`, `id`, `lang`, `rel`, `role`, `style`, `tabindex`, `title`, and `width`.

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

## Note 2: Input/output parameters

- Input parameters are always JSON objects.

- We are using structured content (see [MCP documentation](https://modelcontextprotocol.io/specification/draft/server/tools#structured-content)): output parameters are always JSON objects. 
  - For creations, the output payload contains the id(s) of the created object(s).
  - For reads, the output payload contains the object(s) read.
  - For deletions, the output payload contains a `message` field indicating success of the deletion.
