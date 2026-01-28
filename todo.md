# Before merging the branch

# Next steps

## in the agent session


## in the branch

# Later on

- add "npm run docs" to generate the documentation (=tools.md)
- modify .agent/skills/generate-release/SKILL.md to ask for the merge commit message
- modify .agent/skills/generate-release/SKILL.md to generate the doc and commit it
- use a schema instead of `const response = await makeSquashRequest<any>(...)`
- test requirement deletion
- test test case deletion
- add tests for folders with no description
- add tests for projects with no description
- add tests for projects with no label
- create dev documentation
    - explaining how to run a dev version of the MCP Server in Claude desktop
    - (?) move the rationale for input output format in it
- support call steps
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
    - importance, type, and nature - probably optional

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
    ],
        "verified_requirement_ids": [],
        "datasets": {
            "parameter_names": ["param1", "param2"],
            "datasets": [
                {
                    "name": "Dataset 1",
                    "parameters_values": ["val1_1", "val1_2"]
                },
                {
                    "name": "Dataset 2",
                    "parameters_values": ["val2_1", "val2_2"]
                }
            ]
        }
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
