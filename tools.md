# MCP Server Tools

This document lists all available tools in the MCP server.

**Total Tools:** 18

## Table of Contents

- [list_projects](#list_projects) - Get list of SquashTM projects
- [create_project](#create_project) - Create a new project in SquashTM
- [delete_project](#delete_project) - Delete a project in SquashTM
- [get_requirement_folders_tree](#get_requirement_folders_tree) - Get the requirement folders tree for specified project with detailed folder info in SquashTM
- [get_test_case_folder_tree](#get_test_case_folder_tree) - Get the test case folders tree for specified project with detailed folder info in SquashTM
- [get_campaign_folder_tree](#get_campaign_folder_tree) - Get the campaign folders tree for specified project with detailed folder info 
- [create_requirement_folder](#create_requirement_folder) - Create requirement folders recursively in SquashTM
- [delete_requirement_folder](#delete_requirement_folder) - Delete a requirement folder and its content in SquashTM
- [create_test_case_folder](#create_test_case_folder) - Create test case folders recursively in SquashTM
- [delete_test_case_folder](#delete_test_case_folder) - Delete a test case folder and its content in SquashTM
- [create_campaign_folder](#create_campaign_folder) - Create campaign folders recursively in SquashTM
- [delete_campaign_folder](#delete_campaign_folder) - Delete a campaign folder and its content in SquashTM
- [get_requirement_folder_content](#get_requirement_folder_content) - Get the requirements of a requirement folder (only includes the requirements, not the subfolders) in SquashTM
- [create_requirements](#create_requirements) - Create requirements in a project or folder in SquashTM
- [delete_requirement](#delete_requirement) - Delete a requirement in SquashTM
- [get_test_case_folder_content](#get_test_case_folder_content) - Get the test cases of a test case folder (only includes items of type 'test-case') in SquashTM
- [create_test_cases](#create_test_cases) - Create test cases in a project or folder in SquashTM
- [delete_test_case](#delete_test_case) - Delete a test case in SquashTM

---

## list_projects

Get list of SquashTM projects

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the project"
          },
          "name": {
            "type": "string",
            "description": "The name of the project"
          },
          "label": {
            "type": "string",
            "description": "The label of the project"
          },
          "description": {
            "type": "string",
            "description": "The description of the project (rich text)"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "projects"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projects` | `array of object` | Yes | - |
| `projects[].id` | `number` | Yes | The ID of the project |
| `projects[].name` | `string` | Yes | The name of the project |
| `projects[].label` | `string` | No | The label of the project |
| `projects[].description` | `string` | No | The description of the project (rich text) |

---

## create_project

Create a new project in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "The name of the project to create"
    },
    "label": {
      "type": "string",
      "minLength": 1,
      "description": "The label of the project to create"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "description": "The description of the project to create (rich text)"
    }
  },
  "required": [
    "name"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | The name of the project to create |
| `label` | `string` | No | The label of the project to create |
| `description` | `string` | No | The description of the project to create (rich text) |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "The ID of the newly created project"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | The ID of the newly created project |

---

## delete_project

Delete a project in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "The ID of the project to delete"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | The ID of the project to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the project"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the project |

---

## get_requirement_folders_tree

Get the requirement folders tree for specified project with detailed folder info in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Project ID to retrieve the requirement folders tree for"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | Project ID to retrieve the requirement folders tree for |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the folder"
          },
          "name": {
            "type": "string",
            "description": "The name of the folder"
          },
          "description": {
            "type": "string",
            "description": "The description of the folder (rich text) (absent if the folder has no description)"
          },
          "created_by": {
            "type": "string",
            "description": "The user who created the folder"
          },
          "created_on": {
            "type": "string",
            "description": "The date when the folder was created"
          },
          "modified_by": {
            "type": "string",
            "description": "The user who last modified the folder (absent if the folder has never been modified)"
          },
          "modified_on": {
            "type": "string",
            "description": "The date when the folder was last modified (absent if the folder has never been modified)"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/folders/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "id",
          "name",
          "created_by",
          "created_on",
          "children"
        ],
        "additionalProperties": false
      },
      "description": "List of folders"
    }
  },
  "required": [
    "folders"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folders` | `array of object` | Yes | List of folders |
| `folders[].id` | `number` | Yes | The ID of the folder |
| `folders[].name` | `string` | Yes | The name of the folder |
| `folders[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folders[].children[].id` | `number` | Yes | The ID of the folder |
| `folders[].children[].name` | `string` | Yes | The name of the folder |
| `folders[].children[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].children[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].children[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].children[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].children[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## get_test_case_folder_tree

Get the test case folders tree for specified project with detailed folder info in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Project ID to retrieve the test case folders tree for"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | Project ID to retrieve the test case folders tree for |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the folder"
          },
          "name": {
            "type": "string",
            "description": "The name of the folder"
          },
          "description": {
            "type": "string",
            "description": "The description of the folder (rich text) (absent if the folder has no description)"
          },
          "created_by": {
            "type": "string",
            "description": "The user who created the folder"
          },
          "created_on": {
            "type": "string",
            "description": "The date when the folder was created"
          },
          "modified_by": {
            "type": "string",
            "description": "The user who last modified the folder (absent if the folder has never been modified)"
          },
          "modified_on": {
            "type": "string",
            "description": "The date when the folder was last modified (absent if the folder has never been modified)"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/folders/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "id",
          "name",
          "created_by",
          "created_on",
          "children"
        ],
        "additionalProperties": false
      },
      "description": "List of folders"
    }
  },
  "required": [
    "folders"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folders` | `array of object` | Yes | List of folders |
| `folders[].id` | `number` | Yes | The ID of the folder |
| `folders[].name` | `string` | Yes | The name of the folder |
| `folders[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folders[].children[].id` | `number` | Yes | The ID of the folder |
| `folders[].children[].name` | `string` | Yes | The name of the folder |
| `folders[].children[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].children[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].children[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].children[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].children[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## get_campaign_folder_tree

Get the campaign folders tree for specified project with detailed folder info 

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Project ID to retrieve the campaign folders tree for"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | Project ID to retrieve the campaign folders tree for |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folders": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the folder"
          },
          "name": {
            "type": "string",
            "description": "The name of the folder"
          },
          "description": {
            "type": "string",
            "description": "The description of the folder (rich text) (absent if the folder has no description)"
          },
          "created_by": {
            "type": "string",
            "description": "The user who created the folder"
          },
          "created_on": {
            "type": "string",
            "description": "The date when the folder was created"
          },
          "modified_by": {
            "type": "string",
            "description": "The user who last modified the folder (absent if the folder has never been modified)"
          },
          "modified_on": {
            "type": "string",
            "description": "The date when the folder was last modified (absent if the folder has never been modified)"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/folders/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "id",
          "name",
          "created_by",
          "created_on",
          "children"
        ],
        "additionalProperties": false
      },
      "description": "List of folders"
    }
  },
  "required": [
    "folders"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folders` | `array of object` | Yes | List of folders |
| `folders[].id` | `number` | Yes | The ID of the folder |
| `folders[].name` | `string` | Yes | The name of the folder |
| `folders[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folders[].children[].id` | `number` | Yes | The ID of the folder |
| `folders[].children[].name` | `string` | Yes | The name of the folder |
| `folders[].children[].description` | `string` | No | The description of the folder (rich text) (absent if the folder has no description) |
| `folders[].children[].created_by` | `string` | Yes | The user who created the folder |
| `folders[].children[].created_on` | `string` | Yes | The date when the folder was created |
| `folders[].children[].modified_by` | `string` | No | The user who last modified the folder (absent if the folder has never been modified) |
| `folders[].children[].modified_on` | `string` | No | The date when the folder was last modified (absent if the folder has never been modified) |
| `folders[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## create_requirement_folder

Create requirement folders recursively in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to create the requirement folder"
    },
    "parent_folder_id": {
      "type": "number",
      "description": "The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Name of the folder"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "description": "Description of the folder (rich text)"
    },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the folder"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/children/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "name"
        ],
        "additionalProperties": false,
        "description": "Folder structure"
      },
      "description": "Subfolders"
    }
  },
  "required": [
    "project_id",
    "name"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to create the requirement folder |
| `parent_folder_id` | `number` | No | The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level) |
| `name` | `string` | Yes | Name of the folder |
| `description` | `string` | No | Description of the folder (rich text) |
| `children` | `array of object` | No | Subfolders |
| `children[].name` | `string` | Yes | Name of the folder |
| `children[].children` | `array of object (recursive)` | No | Subfolders |
| `children[].children[].name` | `string` | Yes | Name of the folder |
| `children[].children[].children` | `array of object (recursive)` | No | Subfolders |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "ID of the folder"
        },
        "name": {
          "type": "string",
          "description": "Name of the folder"
        },
        "children": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "ID of the folder"
              },
              "name": {
                "type": "string",
                "description": "Name of the folder"
              },
              "children": {
                "type": "array",
                "items": {
                  "$ref": "#/properties/folder/properties/children/items"
                },
                "description": "Subfolders"
              }
            },
            "required": [
              "id",
              "name",
              "children"
            ],
            "additionalProperties": false
          },
          "description": "Subfolders"
        }
      },
      "required": [
        "id",
        "name",
        "children"
      ],
      "additionalProperties": false,
      "description": "Created folder"
    }
  },
  "required": [
    "folder"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder` | `object` | Yes | Created folder |
| `folder.id` | `number` | Yes | ID of the folder |
| `folder.name` | `string` | Yes | Name of the folder |
| `folder.children` | `array of object` | Yes | Subfolders |
| `folder.children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folder.children[].children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## delete_requirement_folder

Delete a requirement folder and its content in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "number",
      "description": "The ID of the requirement folder to delete"
    }
  },
  "required": [
    "folder_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | `number` | Yes | The ID of the requirement folder to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the requirement folder"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the requirement folder |

---

## create_test_case_folder

Create test case folders recursively in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to create the test case folder"
    },
    "parent_folder_id": {
      "type": "number",
      "description": "The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Name of the folder"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "description": "Description of the folder (rich text)"
    },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the folder"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/children/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "name"
        ],
        "additionalProperties": false,
        "description": "Folder structure"
      },
      "description": "Subfolders"
    }
  },
  "required": [
    "project_id",
    "name"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to create the test case folder |
| `parent_folder_id` | `number` | No | The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level) |
| `name` | `string` | Yes | Name of the folder |
| `description` | `string` | No | Description of the folder (rich text) |
| `children` | `array of object` | No | Subfolders |
| `children[].name` | `string` | Yes | Name of the folder |
| `children[].children` | `array of object (recursive)` | No | Subfolders |
| `children[].children[].name` | `string` | Yes | Name of the folder |
| `children[].children[].children` | `array of object (recursive)` | No | Subfolders |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "ID of the folder"
        },
        "name": {
          "type": "string",
          "description": "Name of the folder"
        },
        "children": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "ID of the folder"
              },
              "name": {
                "type": "string",
                "description": "Name of the folder"
              },
              "children": {
                "type": "array",
                "items": {
                  "$ref": "#/properties/folder/properties/children/items"
                },
                "description": "Subfolders"
              }
            },
            "required": [
              "id",
              "name",
              "children"
            ],
            "additionalProperties": false
          },
          "description": "Subfolders"
        }
      },
      "required": [
        "id",
        "name",
        "children"
      ],
      "additionalProperties": false,
      "description": "Created folder"
    }
  },
  "required": [
    "folder"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder` | `object` | Yes | Created folder |
| `folder.id` | `number` | Yes | ID of the folder |
| `folder.name` | `string` | Yes | Name of the folder |
| `folder.children` | `array of object` | Yes | Subfolders |
| `folder.children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folder.children[].children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## delete_test_case_folder

Delete a test case folder and its content in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "number",
      "description": "The ID of the test case folder to delete"
    }
  },
  "required": [
    "folder_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | `number` | Yes | The ID of the test case folder to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the test case folder"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the test case folder |

---

## create_campaign_folder

Create campaign folders recursively in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to create the campaign folder"
    },
    "parent_folder_id": {
      "type": "number",
      "description": "The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "Name of the folder"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "description": "Description of the folder (rich text)"
    },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the folder"
          },
          "children": {
            "type": "array",
            "items": {
              "$ref": "#/properties/children/items"
            },
            "description": "Subfolders"
          }
        },
        "required": [
          "name"
        ],
        "additionalProperties": false,
        "description": "Folder structure"
      },
      "description": "Subfolders"
    }
  },
  "required": [
    "project_id",
    "name"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to create the campaign folder |
| `parent_folder_id` | `number` | No | The ID of an existing folder into which create the new folder (optional, if not specified, the folders will be created at the root level) |
| `name` | `string` | Yes | Name of the folder |
| `description` | `string` | No | Description of the folder (rich text) |
| `children` | `array of object` | No | Subfolders |
| `children[].name` | `string` | Yes | Name of the folder |
| `children[].children` | `array of object (recursive)` | No | Subfolders |
| `children[].children[].name` | `string` | Yes | Name of the folder |
| `children[].children[].children` | `array of object (recursive)` | No | Subfolders |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number",
          "description": "ID of the folder"
        },
        "name": {
          "type": "string",
          "description": "Name of the folder"
        },
        "children": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "number",
                "description": "ID of the folder"
              },
              "name": {
                "type": "string",
                "description": "Name of the folder"
              },
              "children": {
                "type": "array",
                "items": {
                  "$ref": "#/properties/folder/properties/children/items"
                },
                "description": "Subfolders"
              }
            },
            "required": [
              "id",
              "name",
              "children"
            ],
            "additionalProperties": false
          },
          "description": "Subfolders"
        }
      },
      "required": [
        "id",
        "name",
        "children"
      ],
      "additionalProperties": false,
      "description": "Created folder"
    }
  },
  "required": [
    "folder"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder` | `object` | Yes | Created folder |
| `folder.id` | `number` | Yes | ID of the folder |
| `folder.name` | `string` | Yes | Name of the folder |
| `folder.children` | `array of object` | Yes | Subfolders |
| `folder.children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children` | `array of object (recursive)` | Yes | Subfolders |
| `folder.children[].children[].id` | `number` | Yes | ID of the folder |
| `folder.children[].children[].name` | `string` | Yes | Name of the folder |
| `folder.children[].children[].children` | `array of object (recursive)` | Yes | Subfolders |

---

## delete_campaign_folder

Delete a campaign folder and its content in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "number",
      "description": "The ID of the campaign folder to delete"
    }
  },
  "required": [
    "folder_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | `number` | Yes | The ID of the campaign folder to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the campaign folder"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the campaign folder |

---

## get_requirement_folder_content

Get the requirements of a requirement folder (only includes the requirements, not the subfolders) in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to retrieve the requirement folder content"
    },
    "folder_id": {
      "type": "number",
      "description": "The ID of the requirement folder to retrieve content for (optional, if not specified, the requirements of the project root will be retrieved)"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to retrieve the requirement folder content |
| `folder_id` | `number` | No | The ID of the requirement folder to retrieve content for (optional, if not specified, the requirements of the project root will be retrieved) |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the requirement"
          },
          "name": {
            "type": "string",
            "description": "The name of the requirement"
          },
          "reference": {
            "type": "string",
            "description": "The reference of the requirement (absent if the requirement has no reference)"
          },
          "description": {
            "type": "string",
            "description": "The description of the requirement (rich text)"
          },
          "created_by": {
            "type": "string",
            "description": "Who created the requirement"
          },
          "created_on": {
            "type": "string",
            "description": "Creation timestamp"
          },
          "last_modified_by": {
            "type": "string",
            "description": "Who last modified the requirement (absent if the requirement has not been modified since creation)"
          },
          "last_modified_on": {
            "type": "string",
            "description": "Last modification timestamp (absent if the requirement has not been modified since creation)"
          }
        },
        "required": [
          "id",
          "name",
          "description",
          "created_by",
          "created_on"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "requirements"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requirements` | `array of object` | Yes | - |
| `requirements[].id` | `number` | Yes | The ID of the requirement |
| `requirements[].name` | `string` | Yes | The name of the requirement |
| `requirements[].reference` | `string` | No | The reference of the requirement (absent if the requirement has no reference) |
| `requirements[].description` | `string` | Yes | The description of the requirement (rich text) |
| `requirements[].created_by` | `string` | Yes | Who created the requirement |
| `requirements[].created_on` | `string` | Yes | Creation timestamp |
| `requirements[].last_modified_by` | `string` | No | Who last modified the requirement (absent if the requirement has not been modified since creation) |
| `requirements[].last_modified_on` | `string` | No | Last modification timestamp (absent if the requirement has not been modified since creation) |

---

## create_requirements

Create requirements in a project or folder in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to create the requirements"
    },
    "parent_folder_id": {
      "type": "number",
      "description": "The ID of an existing folder into which create the new requirements (optional, if not specified, the requirements will be created at the root level)"
    },
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "description": "The name of the requirement"
          },
          "reference": {
            "type": "string",
            "minLength": 1,
            "description": "The reference of the requirement (absent if the requirement has no reference)"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "description": "The description of the requirement (rich text)"
          }
        },
        "required": [
          "name",
          "description"
        ],
        "additionalProperties": false
      },
      "minItems": 1,
      "description": "The list of requirements to create"
    }
  },
  "required": [
    "project_id",
    "requirements"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to create the requirements |
| `parent_folder_id` | `number` | No | The ID of an existing folder into which create the new requirements (optional, if not specified, the requirements will be created at the root level) |
| `requirements` | `array of object` | Yes | The list of requirements to create |
| `requirements[].name` | `string` | Yes | The name of the requirement |
| `requirements[].reference` | `string` | No | The reference of the requirement (absent if the requirement has no reference) |
| `requirements[].description` | `string` | Yes | The description of the requirement (rich text) |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the created requirement"
          },
          "name": {
            "type": "string",
            "description": "The name of the created requirement"
          },
          "reference": {
            "type": "string",
            "description": "The reference of the created requirement (absent if the requirement has no reference)"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "requirements"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requirements` | `array of object` | Yes | - |
| `requirements[].id` | `number` | Yes | The ID of the created requirement |
| `requirements[].name` | `string` | Yes | The name of the created requirement |
| `requirements[].reference` | `string` | No | The reference of the created requirement (absent if the requirement has no reference) |

---

## delete_requirement

Delete a requirement in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "The ID of the requirement to delete"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | The ID of the requirement to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the requirement"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the requirement |

---

## get_test_case_folder_content

Get the test cases of a test case folder (only includes items of type 'test-case') in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to retrieve the test case folder content"
    },
    "folder_id": {
      "type": "number",
      "description": "The ID of the test case folder to retrieve content for (optional, if not specified, the test cases of the project root will be retrieved)"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to retrieve the test case folder content |
| `folder_id` | `number` | No | The ID of the test case folder to retrieve content for (optional, if not specified, the test cases of the project root will be retrieved) |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "test_cases": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the test case"
          },
          "name": {
            "type": "string",
            "description": "The name of the test case"
          },
          "reference": {
            "type": "string",
            "description": "The reference of the test case (absent if the test case has no reference)"
          },
          "description": {
            "type": "string",
            "description": "The description of the test case (rich text)"
          },
          "prerequisite": {
            "type": "string",
            "description": "The prerequisite of the test case (rich text)"
          },
          "created_by": {
            "type": "string",
            "description": "Who created the test case"
          },
          "created_on": {
            "type": "string",
            "description": "Creation timestamp"
          },
          "last_modified_by": {
            "type": "string",
            "description": "Who last modified the test case (absent if the test case has not been modified since creation)"
          },
          "last_modified_on": {
            "type": "string",
            "description": "Last modification timestamp (absent if the test case has not been modified since creation)"
          },
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "action": {
                  "type": "string",
                  "description": "The action to perform"
                },
                "expected_result": {
                  "type": "string",
                  "description": "The expected result"
                }
              },
              "required": [
                "action",
                "expected_result"
              ],
              "additionalProperties": false
            },
            "description": "List of test steps"
          },
          "verified_requirements": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "description": "Ids of the requirements verified by this test case"
          },
          "datasets": {
            "type": "object",
            "properties": {
              "parameter_names": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "Names of the parameters"
                }
              },
              "datasets": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": "Name of the dataset"
                    },
                    "parameters_values": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      },
                      "description": "Values for each parameter, in order"
                    }
                  },
                  "required": [
                    "name",
                    "parameters_values"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "parameter_names",
              "datasets"
            ],
            "additionalProperties": false,
            "description": "Datasets associated with the test case"
          }
        },
        "required": [
          "id",
          "name",
          "description",
          "created_by",
          "created_on",
          "steps",
          "verified_requirements"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "test_cases"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `test_cases` | `array of object` | Yes | - |
| `test_cases[].id` | `number` | Yes | The ID of the test case |
| `test_cases[].name` | `string` | Yes | The name of the test case |
| `test_cases[].reference` | `string` | No | The reference of the test case (absent if the test case has no reference) |
| `test_cases[].description` | `string` | Yes | The description of the test case (rich text) |
| `test_cases[].prerequisite` | `string` | No | The prerequisite of the test case (rich text) |
| `test_cases[].created_by` | `string` | Yes | Who created the test case |
| `test_cases[].created_on` | `string` | Yes | Creation timestamp |
| `test_cases[].last_modified_by` | `string` | No | Who last modified the test case (absent if the test case has not been modified since creation) |
| `test_cases[].last_modified_on` | `string` | No | Last modification timestamp (absent if the test case has not been modified since creation) |
| `test_cases[].steps` | `array of object` | Yes | List of test steps |
| `test_cases[].steps[].action` | `string` | Yes | The action to perform |
| `test_cases[].steps[].expected_result` | `string` | Yes | The expected result |
| `test_cases[].verified_requirements` | `array of number` | Yes | Ids of the requirements verified by this test case |
| `test_cases[].datasets` | `object` | No | Datasets associated with the test case |
| `test_cases[].datasets.parameter_names` | `array of string` | Yes | - |
| `test_cases[].datasets.datasets` | `array of object` | Yes | - |
| `test_cases[].datasets.datasets[].name` | `string` | Yes | Name of the dataset |
| `test_cases[].datasets.datasets[].parameters_values` | `array of string` | Yes | Values for each parameter, in order |

---

## create_test_cases

Create test cases in a project or folder in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "The ID of the project in which to create the test cases"
    },
    "parent_folder_id": {
      "type": "number",
      "description": "The ID of an existing folder into which create the new test cases (optional, if not specified, the test cases will be created at the root level)"
    },
    "test_cases": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "description": "The name of the test case"
          },
          "reference": {
            "type": "string",
            "minLength": 1,
            "description": "The reference of the test case (absent if the test case has no reference)"
          },
          "description": {
            "type": "string",
            "minLength": 1,
            "description": "The description of the test case (rich text)"
          },
          "prerequisite": {
            "type": "string",
            "minLength": 1,
            "description": "The prerequisite of the test case (rich text)"
          },
          "steps": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "action": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The action to perform"
                },
                "expected_result": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The expected result"
                }
              },
              "required": [
                "action",
                "expected_result"
              ],
              "additionalProperties": false
            },
            "minItems": 1,
            "description": "List of test steps"
          },
          "verified_requirement_ids": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "description": "Ids of the requirements verified by this test case"
          },
          "datasets": {
            "type": "object",
            "properties": {
              "parameter_names": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1,
                  "description": "The name of the parameter"
                },
                "minItems": 1,
                "description": "The list of parameter names"
              },
              "datasets": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string",
                      "minLength": 1,
                      "description": "The name of the dataset"
                    },
                    "parameters_values": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "description": "The value of the parameter"
                      },
                      "minItems": 1,
                      "description": "The values of the parameters, in the same order as parameter_names"
                    }
                  },
                  "required": [
                    "name",
                    "parameters_values"
                  ],
                  "additionalProperties": false
                },
                "minItems": 1,
                "description": "The list of datasets"
              }
            },
            "required": [
              "parameter_names",
              "datasets"
            ],
            "additionalProperties": false,
            "description": "datasets to add to the test case"
          }
        },
        "required": [
          "name",
          "description",
          "verified_requirement_ids"
        ],
        "additionalProperties": false
      },
      "minItems": 1,
      "description": "The list of test cases to create"
    }
  },
  "required": [
    "project_id",
    "test_cases"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | `number` | Yes | The ID of the project in which to create the test cases |
| `parent_folder_id` | `number` | No | The ID of an existing folder into which create the new test cases (optional, if not specified, the test cases will be created at the root level) |
| `test_cases` | `array of object` | Yes | The list of test cases to create |
| `test_cases[].name` | `string` | Yes | The name of the test case |
| `test_cases[].reference` | `string` | No | The reference of the test case (absent if the test case has no reference) |
| `test_cases[].description` | `string` | Yes | The description of the test case (rich text) |
| `test_cases[].prerequisite` | `string` | No | The prerequisite of the test case (rich text) |
| `test_cases[].steps` | `array of object` | No | List of test steps |
| `test_cases[].steps[].action` | `string` | Yes | The action to perform |
| `test_cases[].steps[].expected_result` | `string` | Yes | The expected result |
| `test_cases[].verified_requirement_ids` | `array of number` | Yes | Ids of the requirements verified by this test case |
| `test_cases[].datasets` | `object` | No | datasets to add to the test case |
| `test_cases[].datasets.parameter_names` | `array of string` | Yes | The list of parameter names |
| `test_cases[].datasets.datasets` | `array of object` | Yes | The list of datasets |
| `test_cases[].datasets.datasets[].name` | `string` | Yes | The name of the dataset |
| `test_cases[].datasets.datasets[].parameters_values` | `array of string` | Yes | The values of the parameters, in the same order as parameter_names |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "test_cases": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "The ID of the created test case"
          },
          "name": {
            "type": "string",
            "description": "The name of the created test case"
          },
          "reference": {
            "type": "string",
            "description": "The reference of the created test case (absent if the test case has no reference)"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "test_cases"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `test_cases` | `array of object` | Yes | - |
| `test_cases[].id` | `number` | Yes | The ID of the created test case |
| `test_cases[].name` | `string` | Yes | The name of the created test case |
| `test_cases[].reference` | `string` | No | The reference of the created test case (absent if the test case has no reference) |

---

## delete_test_case

Delete a test case in SquashTM

### Input Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "The ID of the test case to delete"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `number` | Yes | The ID of the test case to delete |

### Output Parameters

<details>
<summary>Click to see schema</summary>

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message indicating success of the deletion of the test case"
    }
  },
  "required": [
    "message"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

</details><br>

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | `string` | Yes | Message indicating success of the deletion of the test case |

---

