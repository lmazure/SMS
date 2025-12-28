- integration tests are failing
- is it possible to properly sort the tool list (in MCP Inspector)

- we are mixing `id` and `project_id`
- create a rules.md (?)
    - complete/update README.md in case a tool is modified
    - complete/update unit tests in case a tool is modified
- handle the deployment and complete the README.md file to describe the deployment process
- add unit tests
- complete create_test_cases tool with
    - reference - probably optional - not present in the doc!!
    - importance, type, and nature - probably optional
    - datasets
    - verified requirements
- add tool get_project_requirements

------
SquasTM bugs:

get_requirement_folders_tree is buggy for a hierarchy a-b-c-d !!

REST API doc: "An test plan item represents a test case that has been planned"

------
test data:

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
