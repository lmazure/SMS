
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    createTestCasesHandler,
    deleteTestCaseHandler,
    getTestCaseFolderContentHandler
} from '../test_cases.js';
import { createTestCaseFoldersHandler } from '../folders.js';
import { createProjectHandler, deleteProjectHandler } from '../projects.js';

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

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.id).toBeDefined();

        projectId = result.structuredContent.id;

        const folderResult = await createTestCaseFoldersHandler({
            project_id: (projectId as number),
            name: "Root Test Case Folder",
        });
        expect(folderResult).toBeDefined();
        expect(folderResult.structuredContent).toBeDefined();
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
                    description: '<p>Description for test case 1</p>',
                    prerequisite: '<p>Prerequisite for test case 1</p>',
                },
                {
                    name: `Test Case 2 for project ${projectId}`,
                    description: '<p>Description for test case 2</p>',
                },
            ],
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(2);

        const [tc1, tc2] = result.structuredContent.test_cases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);

        testCaseToBeDeleted.push(tc1.id);
        testCaseToBeDeleted.push(tc2.id);
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
                    description: '<p>Description for test case 1</p>',
                },
                {
                    name: `Test Case 2 for project ${projectId} in folder ${folderId}`,
                    description: '<p>Description for test case 2</p>',
                },
            ],
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(2);

        const [tc1, tc2] = result.structuredContent.test_cases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${folderId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${folderId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);

        testCaseToBeDeleted.push(tc1.id);
        testCaseToBeDeleted.push(tc2.id);
    });

    it('should get the content of the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getTestCaseFolderContentHandler({ project_id: projectId });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(2);

        const testCases = result.structuredContent.test_cases.toSorted((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
        );
        const [tc1, tc2] = testCases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    it('should get the content of a test case folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await getTestCaseFolderContentHandler({ project_id: projectId, folder_id: folderId });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.test_cases).toBeDefined();
        expect(result.structuredContent.test_cases.length).toBe(2);

        const testCases = result.structuredContent.test_cases.toSorted((a: { name: string; }, b: { name: string; }) =>
            a.name.localeCompare(b.name)
        );
        const [tc1, tc2] = testCases;
        expect(tc1.id).toBeGreaterThan(0);
        expect(tc1.name).toBe(`Test Case 1 for project ${projectId} in folder ${folderId}`);
        expect(tc2.id).toBeGreaterThan(0);
        expect(tc2.name).toBe(`Test Case 2 for project ${projectId} in folder ${folderId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    afterAll(async () => {
        if (!projectId) return;
        for (const testCaseId of testCaseToBeDeleted) {
            await deleteTestCaseHandler({ id: testCaseId });
        }
        await deleteProjectHandler({ id: projectId });
    });
});
