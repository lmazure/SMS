
import { describe, it, expect, beforeAll } from 'vitest';
import {
    createTestCaseFolderHandler,
    getTestCaseFoldersTreeHandler,
    deleteTestCaseFolderHandler,
    CreateFolderOutputSchema,
    GetFoldersTreeOutputSchema,
    DeleteTestCaseFolderOutputSchema,
    ReturnedFolder
} from '../folder_tools.js';
import {
    createProjectHandler,
    deleteProjectHandler,
    CreateProjectOutputSchema
} from '../project_tools.js';
import { assertResultMatchSchema } from './test_utils.js';

describe('Test Case Folder Hierarchy Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Test Case Folder Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Test Case Folder Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Test Case Folder Test Project ${timestamp}`;
    let projectId: number | undefined;

    beforeAll(async () => {
        // Create a project for testing
        const result = await createProjectHandler({
            name: projectName,
            label: projectLabel,
            description: projectDescription
        });
        assertResultMatchSchema(result, CreateProjectOutputSchema);
        expect(result.structuredContent.id).toBeDefined();

        projectId = result.structuredContent.id;
    });

    it('should create a test case folder structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createTestCaseFolderHandler({
            project_id: projectId,
            name: "Root TC Folder",
            description: "Description of the Root TC Folder",
            children: [
                {
                    name: "Child TC Folder 1",
                    description: "Description of the Child TC Folder 1"
                },
                {
                    name: "Child TC Folder 2",
                    description: "Description of the Child TC Folder 2",
                    children: [
                        {
                            name: "Grandchild TC Folder",
                            description: "Description of the Grandchild TC Folder"
                        }
                    ]
                }
            ]
        });

        assertResultMatchSchema(result, CreateFolderOutputSchema);
        expect(result.structuredContent.folder).toBeDefined();
        expect(result.structuredContent.folder.id).toBeDefined();
        expect(result.structuredContent.folder.name).toBe("Root TC Folder");
        expect(result.structuredContent.folder.children).toBeDefined();
        expect(result.structuredContent.folder.children.length).toBe(2);
        expect(result.structuredContent.folder.children[0].name).toBe("Child TC Folder 1");
        expect(result.structuredContent.folder.children[0].id).toBeDefined();
        expect(result.structuredContent.folder.children[1].name).toBe("Child TC Folder 2");
        expect(result.structuredContent.folder.children[1].id).toBeDefined();
        expect(result.structuredContent.folder.children[1].children).toBeDefined();
        expect(result.structuredContent.folder.children[1].children.length).toBe(1);
        expect(result.structuredContent.folder.children[1].children[0].name).toBe("Grandchild TC Folder");
        expect(result.structuredContent.folder.children[1].children[0].id).toBeDefined();
    });

    it('should retrieve the test case folder tree and verify structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getTestCaseFoldersTreeHandler({
            project_id: projectId
        });
        assertResultMatchSchema(result, GetFoldersTreeOutputSchema);
        expect(result.structuredContent.folders).toBeDefined();

        const rootFolder = result.structuredContent.folders.find((f: ReturnedFolder) => f.name === "Root TC Folder");
        expect(rootFolder).toBeDefined();
        expect(rootFolder.children).toHaveLength(2);

        const child1 = rootFolder.children.find((f: ReturnedFolder) => f.name === "Child TC Folder 1");
        expect(child1).toBeDefined();
        expect(child1.children).toHaveLength(0);

        const child2 = rootFolder.children.find((f: ReturnedFolder) => f.name === "Child TC Folder 2");
        expect(child2).toBeDefined();
        expect(child2.children).toHaveLength(1);
        expect(child2.children[0].name).toBe("Grandchild TC Folder");
    });

    it('should delete the test case folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // First get the ID of the root folder
        const treeResult = await getTestCaseFoldersTreeHandler({ project_id: projectId });
        expect(treeResult).toBeDefined();
        expect(treeResult.structuredContent).toBeDefined();
        const rootFolder = treeResult.structuredContent.folders.find((f: ReturnedFolder) => f.name === "Root TC Folder");
        expect(rootFolder).toBeDefined();

        // Delete it
        const result = await deleteTestCaseFolderHandler({
            folder_id: rootFolder.id
        });

        assertResultMatchSchema(result, DeleteTestCaseFolderOutputSchema);
        expect(result.structuredContent.message).toContain(`Test case folder ${rootFolder.id} deleted successfully`);
    });

    it('should cleanup the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
