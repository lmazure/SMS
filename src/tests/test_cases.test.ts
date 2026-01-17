
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
    CreateFolderOutputSchema
} from '../folder_tools.js';
import {
    createProjectHandler,
    deleteProjectHandler,
    CreateProjectOutputSchema
} from '../project_tools.js';
import { assertResultMatchSchema } from './test_utils.js';

describe('Test Cases Integration Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Test Cases Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Test Cases Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Test Cases Test Project ${timestamp}`;
    const testCaseToBeDeleted: Array<number> = [];
    let projectId: number | undefined;
    let folderId: number | undefined;

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
            name: "Root Test Case Folder",
        });
        assertResultMatchSchema(folderResult, CreateFolderOutputSchema);
        expect(folderResult.structuredContent.folder).toBeDefined();
        expect(folderResult.structuredContent.folder.id).toBeDefined();

        folderId = folderResult.structuredContent.folder.id;
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
                },
                {
                    name: `Test Case 2 for project ${projectId}`,
                    reference: `REF-2-${projectId}`,
                    description: '<p>Description for test case 2</p>',
                },
                {
                    name: `Test Case 3 for project ${projectId}`,
                    description: '<p>Description for test case 3</p><br><p>This test case has no reference</p>',
                },
                {
                    name: `Test Case 4 for project ${projectId}`,
                    reference: ``,
                    description: '<p>Description for test case 4</p><br><p>This test case has an empty reference</p>',
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
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await createTestCasesHandler({
            project_id: projectId,
            parent_folder_id: folderId,
            test_cases: [
                {
                    name: `Test Case 1 for project ${projectId} in folder ${folderId}`,
                    reference: `REF-1-${projectId}-${folderId}`,
                    description: '<p>Description for test case 1</p>',
                },
                {
                    name: `Test Case 2 for project ${projectId} in folder ${folderId}`,
                    reference: `REF-2-${projectId}-${folderId}`,
                    description: '<p>Description for test case 2</p>',
                },
                {
                    name: `Test Case 3 for project ${projectId} in folder ${folderId}`,
                    description: '<p>Description for test case 3</p><br><p>This test case has no reference</p>',
                }
            ],
        });

        assertResultMatchSchema(result, CreateTestCasesOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(3);

        const [tc1, tc2, tc3] = result.structuredContent.test_cases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${folderId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}-${folderId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${folderId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}-${folderId}`);
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId} in folder ${folderId}`);
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
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}`);
        expect(tc2.description).toBe('<p>Description for test case 2</p>');
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId}`);
        expect(tc3.reference).toBeUndefined();
        expect(tc3.description).toBe('<p>Description for test case 3</p><br><p>This test case has no reference</p>');
        expect(tc4.id).toBeGreaterThan(0);
        expect(tc4.name).toBe(`Test Case 4 for project ${projectId}`);
        expect(tc4.reference).toBeUndefined();
        expect(tc4.description).toBe('<p>Description for test case 4</p><br><p>This test case has an empty reference</p>');
    });

    it('should get the content of a test case folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await getTestCaseFolderContentHandler({ project_id: projectId, folder_id: folderId });
        assertResultMatchSchema(result, GetTestCaseFolderContentOutputSchema);
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(3);

        const testCases = result.structuredContent.test_cases.toSorted((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
        );
        const [tc1, tc2, tc3] = testCases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${folderId}`);
        expect(tc1.reference).toBe(`REF-1-${projectId}-${folderId}`);
        expect(tc1.description).toBe('<p>Description for test case 1</p>');
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${folderId}`);
        expect(tc2.reference).toBe(`REF-2-${projectId}-${folderId}`);
        expect(tc2.description).toBe('<p>Description for test case 2</p>');
        expect(tc3.id).toBeGreaterThan(0);
        expect(tc3.name).toBe(`Test Case 3 for project ${projectId} in folder ${folderId}`);
        expect(tc3.reference).toBeUndefined();
        expect(tc3.description).toBe('<p>Description for test case 3</p><br><p>This test case has no reference</p>');
    });

    afterAll(async () => {
        if (!projectId) return;
        for (const testCaseId of testCaseToBeDeleted) {
            await deleteTestCaseHandler({ id: testCaseId });
        }
        await deleteProjectHandler({ id: projectId });
    });
});
