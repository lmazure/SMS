# Before merging the branch

# Next step

- manage test case reference
- manage traceability
- test requirement deletion
- test test case deletion

- add tests for folders with no description
- add tests for projects with no description
- add tests for projects with no label
- manage test case datasets
- create dev documentation
    - explaining how to run a dev version of the MCP Server in Claude desktop
    - (?) move the rationale for input output format in it

# Later on

- add more tests  
  get the tests more detailled → all return fields should be checked
- manage requirements / test cases traceability
- manage high level requirements
- manage BDD test cases
- manage Gherkin test cases
- when a tool has both project_id and parent_folder_id, we do not verify that the parent_folder_id belongs to the project, or set the two fields as exclusive
- validate code with eslint
- spin off dev.md from README.md
    - describe in it how to run the dev version in Claude desktop
- is it possible to properly sort the tool list (in MCP Inspector)?
- create a rules.md (?)
    - complete/update README.md in case a tool is modified
    - complete/update unit tests in case a tool is modified
- complete create_test_cases tool with
    - reference - probably optional - not present in the doc!!
    - importance, type, and nature - probably optional
    - datasets
    - verified requirements

# Bugs



# SquashTM bugs

get_requirement_folders_tree is buggy for a hierarchy a-b-c-d !!

/api/rest/latest/requirement-folders does not accept a description

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
