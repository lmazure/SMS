import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequirementsHandler,
         deleteRequirementHandler,
         getRequirementFolderContentHandler } from '../requirements.js';
import { createRequirementFoldersHandler } from '../folders.js';
import { createProjectHandler, deleteProjectHandler } from '../projects.js';

describe('Requirements Integration Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Requirements Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Requirements Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Requirements Test Project ${timestamp}`;
    const requirementToBeDeleted: Array<number> = [];
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

        const folderResult = await createRequirementFoldersHandler({
            project_id: (projectId as number),
            name: "Root Folder",
        });
        expect(folderResult).toBeDefined();
        expect(folderResult.structuredContent).toBeDefined();
        expect(folderResult.structuredContent.folder).toBeDefined();
        expect(folderResult.structuredContent.folder.id).toBeDefined();

        folderId = folderResult.structuredContent.folder.id;
    });

    it('should create requirements in the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await createRequirementsHandler({
            project_id: projectId,
            requirements: [
                {
                    name: `Requirement 1 for project ${projectId}`,
                    description: '<p>Description for requirement 1</p>',
                },
                {
                    name: `Requirement 2 for project ${projectId}`,
                    description: '<p>Description for requirement 2</p>',
                },
            ],
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(2);

        const [req1, req2] = result.structuredContent.requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
        
        requirementToBeDeleted.push(req1.id);
        requirementToBeDeleted.push(req2.id);
    });

    it('should create requirements in a folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await createRequirementsHandler({
            project_id: projectId,
            parent_folder_id: folderId,
            requirements: [
                {
                    name: `Requirement 1 for project ${projectId} in folder ${folderId}`,
                    description: '<p>Description for requirement 1</p>',
                },
                {
                    name: `Requirement 2 for project ${projectId} in folder ${folderId}`,
                    description: '<p>Description for requirement 2</p>',
                },
            ],
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(2);

        const [req1, req2] = result.structuredContent.requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId} in folder ${folderId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId} in folder ${folderId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
        
        requirementToBeDeleted.push(req1.id);
        requirementToBeDeleted.push(req2.id);
    });

    it ('should get the content of the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await getRequirementFolderContentHandler({ project_id: projectId });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(2);

        const requirements = result.structuredContent.requirements.toSorted((a: { name: string; }, b: { name: string; }) => 
            a.name.localeCompare(b.name)
        );
        const [req1, req2] = requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
     });

     it ('should get the content of a requirement folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await getRequirementFolderContentHandler({ project_id: projectId, folder_id: folderId });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(2);

        const requirements = result.structuredContent.requirements.toSorted((a: { name: string; }, b: { name: string; }) => 
            a.name.localeCompare(b.name)
        );
        const [req1, req2] = requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId} in folder ${folderId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId} in folder ${folderId}`);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    afterAll(async () => {
        if (!projectId) return;
        for (const requirementId of requirementToBeDeleted) {
            await deleteRequirementHandler({ id: requirementId });
        }
        await deleteProjectHandler({ id: projectId });
    });
});
