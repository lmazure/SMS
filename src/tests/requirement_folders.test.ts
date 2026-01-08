import { describe, it, expect, beforeAll } from 'vitest';
import {
    createRequirementFoldersHandler,
    getRequirementFoldersTreeHandler,
    deleteRequirementFolderHandler
} from '../folders.js';
import {
    createProjectHandler,
    deleteProjectHandler
} from '../projects.js';

describe('Requirement Folders Integration Tests', () => {
    const timestamp = Date.now();
    const projectName = `Name of the Requirement Folder Test Project ${timestamp}`;
    const projectLabel = `Label of the Requirement Folder Test Project ${timestamp}`;
    const projectDescription = `Description of the Requirement Folder Test Project ${timestamp}`;
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

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    it('should create a requirement folder structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createRequirementFoldersHandler({
            project_id: projectId,
            name: "Root Requirement Folder",
            children: [
                {
                    name: "Child Requirement Folder 1"
                },
                {
                    name: "Child Requirement Folder 2",
                    children: [
                        { name: "Grandchild Requirement Folder" }
                    ]
                }
            ]
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
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

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    it('should retrieve the requirement folder tree and verify structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getRequirementFoldersTreeHandler({
            project_id: projectId
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.folders).toBeDefined();

        const rootFolder = result.structuredContent.folders.find((f: any) => f.name === "Root Requirement Folder");
        expect(rootFolder).toBeDefined();
        expect(rootFolder.children).toHaveLength(2);

        const child1 = rootFolder.children.find((f: any) => f.name === "Child Requirement Folder 1");
        expect(child1).toBeDefined();
        expect(child1.children).toHaveLength(0);

        const child2 = rootFolder.children.find((f: any) => f.name === "Child Requirement Folder 2");
        expect(child2).toBeDefined();
        expect(child2.children).toHaveLength(1);
        expect(child2.children[0].name).toBe("Grandchild Requirement Folder");

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
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

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.message).toContain(`Requirement folder ${rootFolder.id} deleted successfully`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    it('should cleanup the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
