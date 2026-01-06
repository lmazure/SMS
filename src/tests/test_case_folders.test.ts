
import { describe, it, expect, beforeAll } from 'vitest';
import {
    createProjectHandler,
    deleteProjectHandler,
    createTestCaseFoldersHandler,
    getTestCaseFoldersTreeHandler,
    deleteTestCaseFolderHandler
} from '../index.js';

describe('Test Case Folders Integration Tests', () => {
    const timestamp = Date.now();
    const projectName = `Name of the Test Case Folder Test Project ${timestamp}`;
    const projectLabel = `Label of the Test Case Folder Test Project ${timestamp}`;
    const projectDescription = `Description of the Test Case Folder Test Project ${timestamp}`;
    let projectId: number | undefined;

    beforeAll(async () => {
        // Create a project for testing
        const result = await createProjectHandler({
            name: projectName,
            label: projectLabel,
            description: projectDescription
        });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.id).toBeDefined();
        projectId = result.structuredContent.id;
    });

    it('should create a test case folder structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // @ts-ignore
        const result = await createTestCaseFoldersHandler({
            project_id: projectId,
            name: "Root TC Folder",
            children: [
                {
                    name: "Child TC Folder 1"
                },
                {
                    name: "Child TC Folder 2",
                    children: [
                        { name: "Grandchild TC Folder" }
                    ]
                }
            ]
        });

        expect(result).toBeDefined();
        // Adjust expectation based on actual return value, assuming text confirmation
        expect(result.content[0].text).toContain('Test case folders created successfully');
    });

    it('should retrieve the test case folder tree and verify structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // @ts-ignore
        const result = await getTestCaseFoldersTreeHandler({
            project_id: projectId
        });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.folders).toBeDefined();

        const rootFolder = result.structuredContent.folders.find((f: any) => f.name === "Root TC Folder");
        expect(rootFolder).toBeDefined();
        expect(rootFolder?.children).toHaveLength(2);

        const child2 = rootFolder?.children.find((f: any) => f.name === "Child TC Folder 2");
        expect(child2).toBeDefined();
        expect(child2?.children).toHaveLength(1);
        expect(child2?.children[0].name).toBe("Grandchild TC Folder");
    });

    it('should delete the test case folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // First get the ID of the root folder
        const treeResult = await getTestCaseFoldersTreeHandler({ project_id: projectId });
        expect(treeResult).toBeDefined();
        expect(treeResult.structuredContent).toBeDefined();
        const rootFolder = treeResult.structuredContent.folders.find((f: any) => f.name === "Root TC Folder");
        expect(rootFolder).toBeDefined();

        // Delete it
        const result = await deleteTestCaseFolderHandler({
            folder_id: rootFolder.id
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.message).toContain(`Test case folder ${rootFolder.id} deleted successfully`);
    });

    it('should cleanup the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
