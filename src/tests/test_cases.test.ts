
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    createTestCasesHandler,
    deleteTestCaseHandler,
    getTestCaseFolderContentHandler,
    CreateTestCasesOutputSchema,
    GetTestCaseFolderContentOutputSchema
} from '../test_case_tools.js';
import {
    createTestCaseFolderHandler,
    CreateFolderOutputSchema,
    createRequirementFolderHandler
} from '../folder_tools.js';
import {
    createProjectHandler,
    deleteProjectHandler,
    CreateProjectOutputSchema
} from '../project_tools.js';
import {
    createRequirementsHandler,
    CreateRequirementsOutputSchema,
    deleteRequirementHandler
} from '../requirement_tools.js';
import { assertResultMatchSchema } from './test_utils.js';

describe('Test Cases Integration Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Test Cases Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Test Cases Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Test Cases Test Project ${timestamp}`;
    const testCaseToBeDeleted: Array<number> = [];
    const requirementToBeDeleted: Array<number> = [];
    let projectId: number | undefined;
    let testCaseFolderId: number | undefined;
    let requirementFolderId: number | undefined;
    let requirementId: number | undefined;

    beforeAll(async () => {
        const result = await createProjectHandler({
            name: projectName,
            label: projectLabel,
            description: projectDescription,
        });

        assertResultMatchSchema(result, CreateProjectOutputSchema);
        expect(result.structuredContent.id).toBeDefined();

        projectId = result.structuredContent.id;

        const folderResult = await createTestCaseFolderHandler({
            project_id: (projectId as number),
            name: "Top Level Test Case Folder",
        });
        assertResultMatchSchema(folderResult, CreateFolderOutputSchema);
        expect(folderResult.structuredContent.folder).toBeDefined();
        expect(folderResult.structuredContent.folder.id).toBeDefined();

        testCaseFolderId = folderResult.structuredContent.folder.id;

        const requirementFolderResult = await createRequirementFolderHandler({
            project_id: (projectId as number),
            name: "Top Level Requirement Folder",
        });
        assertResultMatchSchema(requirementFolderResult, CreateFolderOutputSchema);
        expect(requirementFolderResult.structuredContent.folder).toBeDefined();
        expect(requirementFolderResult.structuredContent.folder.id).toBeDefined();

        requirementFolderId = requirementFolderResult.structuredContent.folder.id;

        const requirementResult = await createRequirementsHandler({
            project_id: (projectId as number),
            parent_folder_id: requirementFolderId,
            requirements: [
                {
                    name: `Requirement 1 for project ${projectId} in folder ${requirementFolderId}`,
                    reference: `REF-1-${projectId}-${requirementFolderId}`,
                    description: '<p>Description for requirement 1</p>',
                },
            ],
        });

        assertResultMatchSchema(requirementResult, CreateRequirementsOutputSchema);
        expect(requirementResult.structuredContent.requirements).toBeDefined();
        expect(requirementResult.structuredContent.requirements.length).toBe(1);
        expect(requirementResult.structuredContent.requirements[0].id).toBeDefined();

        requirementId = requirementResult.structuredContent.requirements[0].id;
        if (requirementId) {
            requirementToBeDeleted.push(requirementId);
        }
    });

    it('should create test cases in the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createTestCasesHandler({
            project_id: projectId,
            test_cases: [
                {
                    name: `Test Case 1 for project ${projectId}`,
                    reference: `REF-1-${projectId}`,
                    description: '<p>Description for test case 1</p>',
                    prerequisite: '<p>Prerequisite for test case 1</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 1</p>',
                            expected_result: '<p>Expected result 1 for test case 1</p>',
                        },
                        {
                            action: '<p>Action 2 for test case 1</p>',
                            expected_result: '<p>Expected result 2 for test case 1</p>',
                        },
                    ],
                    verified_requirement_ids: [
                        (requirementId as number),
                    ],
                },
                {
                    name: `Test Case 2 for project ${projectId}`,
                    reference: `REF-2-${projectId}`,
                    description: '<p>Description for test case 2</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 2</p>',
                            expected_result: '<p>Expected result 1 for test case 2</p>',
                        },
                        {
                            action: '<p>Action 2 for test case 2</p>',
                            expected_result: '<p>Expected result 2 for test case 2</p>',
                        },
                    ],
                    verified_requirement_ids: [
                    ],
                },
                {
                    name: `Test Case 3 for project ${projectId}`,
                    description: '<p>Description for test case 3</p><br><p>This test case has no reference</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 3</p>',
                            expected_result: '<p>Expected result 1 for test case 3</p>',
                        },
                    ],
                    verified_requirement_ids: [
                    ],
                },
                {
                    name: `Test Case 4 for project ${projectId}`,
                    reference: ``,
                    description: '<p>Description for test case 4</p><br><p>This test case has an empty reference</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 4</p>',
                            expected_result: '<p>Expected result 1 for test case 4</p>',
                        },
                    ],
                    verified_requirement_ids: [
                    ],
                },
            ],
        });

        assertResultMatchSchema(result, CreateTestCasesOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(4);

        const [tc1, tc2, tc3, tc4] = result.structuredContent.test_cases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}`);
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId}`);
        expect(tc3.reference).toBeUndefined();
        expect(tc4.id).toBeGreaterThan(0);
        expect(tc4.name).toBe(`Test Case 4 for project ${projectId}`);
        expect(tc4.reference).toBeUndefined();

        testCaseToBeDeleted.push(tc1.id);
        testCaseToBeDeleted.push(tc2.id);
        testCaseToBeDeleted.push(tc3.id);
        testCaseToBeDeleted.push(tc4.id);
    });

    it('should create test cases in a folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(testCaseFolderId).toBeDefined();
        if (!testCaseFolderId) return;

        const result = await createTestCasesHandler({
            project_id: projectId,
            parent_folder_id: testCaseFolderId,
            test_cases: [
                {
                    name: `Test Case 1 for project ${projectId} in folder ${testCaseFolderId}`,
                    reference: `REF-1-${projectId}-${testCaseFolderId}`,
                    prerequisite: '<p>Prerequisite for test case 1</p>',
                    description: '<p>Description for test case 1</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 1</p>',
                            expected_result: '<p>Expected result 1 for test case 1</p>',
                        },
                        {
                            action: '<p>Action 2 for test case 1</p>',
                            expected_result: '<p>Expected result 2 for test case 1</p>',
                        },
                    ],
                    verified_requirement_ids: [
                        (requirementId as number),
                    ],
                },
                {
                    name: `Test Case 2 for project ${projectId} in folder ${testCaseFolderId}`,
                    reference: `REF-2-${projectId}-${testCaseFolderId}`,
                    description: '<p>Description for test case 2</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 2</p>',
                            expected_result: '<p>Expected result 1 for test case 2</p>',
                        },
                    ],
                    verified_requirement_ids: [
                        (requirementId as number),
                    ],
                },
                {
                    name: `Test Case 3 for project ${projectId} in folder ${testCaseFolderId}`,
                    description: '<p>Description for test case 3</p><br><p>This test case has no reference</p>',
                    steps: [
                        {
                            action: '<p>Action 1 for test case 3</p>',
                            expected_result: '<p>Expected result 1 for test case 3</p>',
                        }
                    ],
                    verified_requirement_ids: [
                    ],
                }
            ],
        });

        assertResultMatchSchema(result, CreateTestCasesOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(3);

        const [tc1, tc2, tc3] = result.structuredContent.test_cases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}-${testCaseFolderId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}-${testCaseFolderId}`);
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc3.reference).toBeUndefined();

        testCaseToBeDeleted.push(tc1.id);
        testCaseToBeDeleted.push(tc2.id);
        testCaseToBeDeleted.push(tc3.id);
    });

    it('should get the content of the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getTestCaseFolderContentHandler({ project_id: projectId });
        assertResultMatchSchema(result, GetTestCaseFolderContentOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(4);

        const testCases = result.structuredContent.test_cases.toSorted((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
        );
        const [tc1, tc2, tc3, tc4] = testCases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}`);
        expect(tc1.description).toBe('<p>Description for test case 1</p>');
        expect(tc1.prerequisite).toBe('<p>Prerequisite for test case 1</p>');
        expect(tc1.steps).toBeDefined();
        expect(tc1.steps.length).toBe(2);
        expect(tc1.steps[0].action).toBe('<p>Action 1 for test case 1</p>');
        expect(tc1.steps[0].expected_result).toBe('<p>Expected result 1 for test case 1</p>');
        expect(tc1.steps[1].action).toBe('<p>Action 2 for test case 1</p>');
        expect(tc1.steps[1].expected_result).toBe('<p>Expected result 2 for test case 1</p>');
        expect(tc1.verified_requirements).toBeDefined();
        expect(tc1.verified_requirements.length).toBe(1);
        expect(tc1.verified_requirements[0]).toBe(requirementId);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}`);
        expect(tc2.description).toBe('<p>Description for test case 2</p>');
        expect(tc2.prerequisite).toBeUndefined();
        expect(tc2.steps).toBeDefined();
        expect(tc2.steps.length).toBe(2);
        expect(tc2.steps[0].action).toBe('<p>Action 1 for test case 2</p>');
        expect(tc2.steps[0].expected_result).toBe('<p>Expected result 1 for test case 2</p>');
        expect(tc2.steps[1].action).toBe('<p>Action 2 for test case 2</p>');
        expect(tc2.steps[1].expected_result).toBe('<p>Expected result 2 for test case 2</p>');
        expect(tc2.verified_requirements).toBeDefined();
        expect(tc2.verified_requirements.length).toBe(0);
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId}`);
        expect(tc3.reference).toBeUndefined();
        expect(tc3.description).toBe('<p>Description for test case 3</p><br><p>This test case has no reference</p>');
        expect(tc3.prerequisite).toBeUndefined();
        expect(tc3.steps).toBeDefined();
        expect(tc3.steps.length).toBe(1);
        expect(tc3.steps[0].action).toBe('<p>Action 1 for test case 3</p>');
        expect(tc3.steps[0].expected_result).toBe('<p>Expected result 1 for test case 3</p>');
        expect(tc4.id).toBeGreaterThan(0);
        expect(tc4.name).toBe(`Test Case 4 for project ${projectId}`);
        expect(tc4.reference).toBeUndefined();
        expect(tc4.description).toBe('<p>Description for test case 4</p><br><p>This test case has an empty reference</p>');
        expect(tc4.prerequisite).toBeUndefined();
        expect(tc4.steps).toBeDefined();
        expect(tc4.steps.length).toBe(1);
        expect(tc4.steps[0].action).toBe('<p>Action 1 for test case 4</p>');
        expect(tc4.steps[0].expected_result).toBe('<p>Expected result 1 for test case 4</p>');
        expect(tc4.verified_requirements).toBeDefined();
        expect(tc4.verified_requirements.length).toBe(0);
    });

    it('should get the content of a test case folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(testCaseFolderId).toBeDefined();
        if (!testCaseFolderId) return;

        const result = await getTestCaseFolderContentHandler({ project_id: projectId, folder_id: testCaseFolderId });
        assertResultMatchSchema(result, GetTestCaseFolderContentOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(3);

        const testCases = result.structuredContent.test_cases.toSorted((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
        );
        const [tc1, tc2, tc3] = testCases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}-${testCaseFolderId}`);
        expect(tc1.description).toBe('<p>Description for test case 1</p>');
        expect(tc1.prerequisite).toBe('<p>Prerequisite for test case 1</p>');
        expect(tc1.steps).toBeDefined();
        expect(tc1.steps.length).toBe(2);
        expect(tc1.steps[0].action).toBe('<p>Action 1 for test case 1</p>');
        expect(tc1.steps[0].expected_result).toBe('<p>Expected result 1 for test case 1</p>');
        expect(tc1.steps[1].action).toBe('<p>Action 2 for test case 1</p>');
        expect(tc1.steps[1].expected_result).toBe('<p>Expected result 2 for test case 1</p>');
        expect(tc1.verified_requirements).toBeDefined();
        expect(tc1.verified_requirements.length).toBe(1);
        expect(tc1.verified_requirements[0]).toBe(requirementId);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}-${testCaseFolderId}`);
        expect(tc2.description).toBe('<p>Description for test case 2</p>');
        expect(tc2.prerequisite).toBeUndefined();
        expect(tc2.steps).toBeDefined();
        expect(tc2.steps.length).toBe(1);
        expect(tc2.steps[0].action).toBe('<p>Action 1 for test case 2</p>');
        expect(tc2.steps[0].expected_result).toBe('<p>Expected result 1 for test case 2</p>');
        expect(tc2.verified_requirements).toBeDefined();
        expect(tc2.verified_requirements.length).toBe(1);
        expect(tc2.verified_requirements[0]).toBe(requirementId);
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId} in folder ${testCaseFolderId}`);
        expect(tc3.reference).toBeUndefined();
        expect(tc3.description).toBe('<p>Description for test case 3</p><br><p>This test case has no reference</p>');
        expect(tc3.prerequisite).toBeUndefined();
        expect(tc3.steps).toBeDefined();
        expect(tc3.steps.length).toBe(1);
        expect(tc3.steps[0].action).toBe('<p>Action 1 for test case 3</p>');
        expect(tc3.steps[0].expected_result).toBe('<p>Expected result 1 for test case 3</p>');
        expect(tc3.verified_requirements).toBeDefined();

    });

    it('should create test cases with datasets', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createTestCasesHandler({
            project_id: projectId,
            test_cases: [
                {
                    name: `Test Case with Datasets for project ${projectId}`,
                    description: '<p>Description for test case with datasets</p>',
                    steps: [
                        {
                            action: '<p>Action 1</p>',
                            expected_result: '<p>Expected result 1</p>',
                        },
                    ],
                    verified_requirement_ids: [],
                    datasets: {
                        parameter_names: ["param1", "param2"],
                        datasets: [
                            {
                                name: "Dataset 1",
                                parameters_values: ["val1_1", "val1_2"]
                            },
                            {
                                name: "Dataset 2",
                                parameters_values: ["val2_1", "val2_2"]
                            }
                        ]
                    }
                },
            ],
        });

        assertResultMatchSchema(result, CreateTestCasesOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(1);
        const tc = result.structuredContent.test_cases[0];
        expect(tc.name).toBe(`Test Case with Datasets for project ${projectId}`);

        testCaseToBeDeleted.push(tc.id);
    });

    afterAll(async () => {
        if (!projectId) return;
        for (const requirementId of requirementToBeDeleted) {
            await deleteRequirementHandler({ id: requirementId });
        }
        for (const testCaseId of testCaseToBeDeleted) {
            await deleteTestCaseHandler({ id: testCaseId });
        }
        await deleteProjectHandler({ id: projectId });
    });
});
