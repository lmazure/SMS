import { describe, it, expect, beforeAll } from 'vitest';
import {
    createRequirementFoldersHandler,
    getRequirementFoldersTreeHandler,
    deleteRequirementFolderHandler,
    CreateFoldersOutputSchema,
    GetFoldersTreeOutputSchema,
    DeleteRequirementFolderOutputSchema
} from '../folder_tools.js';
import {
    createProjectHandler,
    deleteProjectHandler,
    CreateProjectOutputSchema
} from '../project_tools.js';
import { assertResultMatchSchema } from './test_utils.js';

describe('Requirement Folder Hierarchy Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Requirement Folder Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Requirement Folder Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Requirement Folder Test Project ${timestamp}`;
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

    it('should create a requirement folder structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createRequirementFoldersHandler({
            project_id: projectId,
            name: "Root Requirement Folder",
            description: "Description of the Root Requirement Folder",
            children: [
                {
                    name: "Child Requirement Folder 1",
                    description: "Description of the Child Requirement Folder 1",
                },
                {
                    name: "Child Requirement Folder 2",
                    description: "Description of the Child Requirement Folder 2",
                    children: [
                        {
                            name: "Grandchild Requirement Folder",
                            description: "Description of the Grandchild Requirement Folder"
                        }
                    ]
                }
            ]
        });

        assertResultMatchSchema(result, CreateFoldersOutputSchema);
        expect(result.structuredContent.folder).toBeDefined();
        expect(result.structuredContent.folder.id).toBeDefined();
        expect(result.structuredContent.folder.name).toBe("Root Requirement Folder");
        expect(result.structuredContent.folder.children).toBeDefined();
        expect(result.structuredContent.folder.children.length).toBe(2);
        expect(result.structuredContent.folder.children[0].name).toBe("Child Requirement Folder 1");
        expect(result.structuredContent.folder.children[0].id).toBeDefined();
        expect(result.structuredContent.folder.children[1].name).toBe("Child Requirement Folder 2");
        expect(result.structuredContent.folder.children[1].id).toBeDefined();
        expect(result.structuredContent.folder.children[1].children).toBeDefined();
        expect(result.structuredContent.folder.children[1].children.length).toBe(1);
        expect(result.structuredContent.folder.children[1].children[0].name).toBe("Grandchild Requirement Folder");
        expect(result.structuredContent.folder.children[1].children[0].id).toBeDefined();
    });

    it('should retrieve the requirement folder tree and verify structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getRequirementFoldersTreeHandler({
            project_id: projectId
        });

        assertResultMatchSchema(result, GetFoldersTreeOutputSchema);
        expect(result.structuredContent.folders).toBeDefined();

        const rootFolder = result.structuredContent.folders.find((f: any) => f.name === "Root Requirement Folder");
        expect(rootFolder).toBeDefined();
        expect(rootFolder.id).toBeDefined();
        expect(rootFolder.description).toBe("Description of the Root Requirement Folder");
        expect(rootFolder.children).toHaveLength(2);

        const child1 = rootFolder.children.find((f: any) => f.name === "Child Requirement Folder 1");
        expect(child1).toBeDefined();
        expect(child1.id).toBeDefined();
        expect(child1.description).toBe("Description of the Child Requirement Folder 1");
        expect(child1.children).toHaveLength(0);

        const child2 = rootFolder.children.find((f: any) => f.name === "Child Requirement Folder 2");
        expect(child2).toBeDefined();
        expect(child2.id).toBeDefined();
        expect(child2.description).toBe("Description of the Child Requirement Folder 2");
        expect(child2.children).toHaveLength(1);
        expect(child2.children[0].id).toBeDefined();
        expect(child2.children[0].name).toBe("Grandchild Requirement Folder");
        expect(child2.children[0].description).toBe("Description of the Grandchild Requirement Folder");
    });

    it('should delete the requirement folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // First get the ID of the root folder
        const treeResult = await getRequirementFoldersTreeHandler({ project_id: projectId });
        expect(treeResult).toBeDefined();
        expect(treeResult.structuredContent).toBeDefined();
        const rootFolder = treeResult.structuredContent.folders.find((f: any) => f.name === "Root Requirement Folder");
        expect(rootFolder).toBeDefined();

        // Delete it
        const result = await deleteRequirementFolderHandler({
            folder_id: rootFolder.id
        });

        assertResultMatchSchema(result, DeleteRequirementFolderOutputSchema);
        expect(result.structuredContent.message).toContain(`Requirement folder ${rootFolder.id} deleted successfully`);
    });

    it('should cleanup the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
