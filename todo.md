# Next step

- dans les tests, supprimer les
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;
- gérer https://github.com/lmazure/SMS/security/dependabot/3
- add tests for folders with no description
- add tests for projects with no description
- add tests for projects with no label

# Before merging the branch

# Later on

- when a tool has both project_id and parent_folder_id, we do not verify that the parent_folder_id belongs to the project, or set the two fields as exclusive
- validate code with eslint
- the tests of get_folder should verify all the fields
- test the creation of a project with no label
- spin off dev.md from README.md
    - describe in it how to run the dev version in Claude desktop
- studies
    - format of outputs
        - what should be returned for deletion? (see bug 1)
- add more tests and get the tests more detailled
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
