# Next step

- add a tool to create requirement folders
- add a tool to delete requirement folders
- create integration tests for create_requirement_folder, list_requirement_folders, and delete_requirement_folder
- add a tool to create test case folders
- add a tool to delete test case folders
- create integration tests for create_test_case_folder, list_test_case_folders, and delete_test_case_folder
- add a tool to create campaign folders
- add a tool to delete campaign folders
- create integration tests for create_campaign_folder, list_campaign_folders, and delete_campaign_folder

# Before merging the branch




# Later on

- add a tool to delete test cases
- create integration tests for create_test_case, list_test_cases, and delete_test_case
- is it possible to properly sort the tool list (in MCP Inspector)?
- we are mixing `id` and `project_id`
- create a rules.md (?)
    - complete/update README.md in case a tool is modified
    - complete/update unit tests in case a tool is modified
- complete create_test_cases tool with
    - reference - probably optional - not present in the doc!!
    - importance, type, and nature - probably optional
    - datasets
    - verified requirements
- add tool get_project_requirements

# Bug

when running the tests while there is no project
```
 FAIL  src/integration.test.ts > SquashTM Integration Tests > should verify the project is deleted
SyntaxError: Unexpected token 'N', "No projects found." is not valid JSON
 ❯ src/integration.test.ts:62:33
     60|
     61|         const result = await listProjectsHandler();
     62|         const outputJson = JSON.parse(result.content[0].text);
       |                                 ^
     63|
     64|         if (Array.isArray(outputJson)) {
```
This is related to the question of the format of error case and corner cases.

# SquashTM bugs

get_requirement_folders_tree is buggy for a hierarchy a-b-c-d !!

REST API doc: "An test plan item represents a test case that has been planned"

# Test data

example of payload when creating test cases
```json
[
  {
    "name": "test alpha",
    "description": "description test alpha",
    "steps": [
      {
        "action": "do it",
        "expected_result": "it is done"
      }
    ]
  },
  {
    "name": "test beta",
    "description": "description test beta",
    "steps": [
      {
        "action": "do A",
        "expected_result": "A is done"
      },
      {
        "action": "do B",
        "expected_result": "B is done"
      },
      {
        "action": "do C",
        "expected_result": "C is done"
      }
    ]
  }
]
```
