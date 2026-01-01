
import { describe, it, expect, beforeAll } from 'vitest';
import {
    createProjectHandler,
    deleteProjectHandler,
    // @ts-ignore
    createCampaignFoldersHandler,
    // @ts-ignore
    getCampaignFoldersTreeHandler,
    // @ts-ignore
    deleteCampaignFolderHandler
} from '../index.js';

describe('Campaign Folders Integration Tests', () => {
    const timestamp = Date.now();
    const projectName = `Campaign Folder Test Project ${timestamp}`;
    let projectId: number | undefined;

    beforeAll(async () => {
        // Create a project for testing
        const result = await createProjectHandler({
            name: projectName,
            description: "Project for campaign folder tests"
        });
        const match = result.content[0].text.match(/ID: (\d+)/);
        if (match) {
            projectId = parseInt(match[1], 10);
        }
    });

    it('should create a campaign folder structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // @ts-ignore
        const result = await createCampaignFoldersHandler({
            project_id: projectId,
            name: "Root Campaign Folder",
            children: [
                {
                    name: "Child Campaign Folder 1"
                },
                {
                    name: "Child Campaign Folder 2",
                    children: [
                        { name: "Grandchild Campaign Folder" }
                    ]
                }
            ]
        });

        expect(result).toBeDefined();
        expect(result.content[0].text).toContain('Campaign folders created successfully');
    });

    it('should retrieve the campaign folder tree and verify structure', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // @ts-ignore
        const result = await getCampaignFoldersTreeHandler({
            project_id: projectId
        });

        expect(result).toBeDefined();
        const tree = JSON.parse(result.content[0].text);
        const projectNode = tree.find((p: any) => p.id === projectId);
        expect(projectNode).toBeDefined();
        expect(projectNode.folders).toBeDefined();

        const rootFolder = projectNode.folders.find((f: any) => f.name === "Root Campaign Folder");
        expect(rootFolder).toBeDefined();
        expect(rootFolder.children).toHaveLength(2);

        const child2 = rootFolder.children.find((f: any) => f.name === "Child Campaign Folder 2");
        expect(child2).toBeDefined();
        expect(child2.children).toHaveLength(1);
        expect(child2.children[0].name).toBe("Grandchild Campaign Folder");
    });

    it('should delete the campaign folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        // First get the ID of the root folder
        // @ts-ignore
        const treeResult = await getCampaignFoldersTreeHandler({ project_id: projectId });
        const tree = JSON.parse(treeResult.content[0].text);
        const projectNode = tree.find((p: any) => p.id === projectId);
        const rootFolder = projectNode.folders.find((f: any) => f.name === "Root Campaign Folder");
        expect(rootFolder).toBeDefined();

        // Delete it
        // @ts-ignore
        const result = await deleteCampaignFolderHandler({
            folder_id: rootFolder.id
        });

        expect(result).toBeDefined();
        expect(result.content[0].text).toContain(`Campaign folder ${rootFolder.id} deleted successfully`);
    });

    it('should cleanup the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
