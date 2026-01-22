import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    createRequirementsHandler,
    deleteRequirementHandler,
    getRequirementFolderContentHandler,
    CreateRequirementsOutputSchema,
    GetRequirementFolderContentOutputSchema,
} from '../requirement_tools.js';
import {
    createRequirementFolderHandler
} from '../folder_tools.js';
import {
    createProjectHandler,
    deleteProjectHandler
} from '../project_tools.js';
import { assertResultMatchSchema } from './test_utils.js';
import z from 'zod';

type GetRequirementFolderContentOutput = z.infer<typeof GetRequirementFolderContentOutputSchema>;
type ReturnedRequirement = GetRequirementFolderContentOutput['requirements'][number];

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

        const folderResult = await createRequirementFolderHandler({
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
                    reference: `REF-1-${projectId}`,
                    description: '<p>Description for requirement 1</p>',
                },
                {
                    name: `Requirement 2 for project ${projectId}`,
                    reference: `REF-2-${projectId}`,
                    description: '<p>Description for requirement 2</p>',
                },
                {
                    name: `Requirement 3 for project ${projectId}`,
                    description: '<p>Description for requirement 3</p><br><p>This requirement has no reference</p>',
                },
                {
                    name: `Requirement 4 for project ${projectId}`,
                    reference: ``,
                    description: '<p>Description for requirement 4</p><br><p>This requirement has an empty reference</p>',
                },
            ],
        });

        assertResultMatchSchema(result, CreateRequirementsOutputSchema);

        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(4);

        const [req1, req2, req3, req4] = result.structuredContent.requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId}`);
        expect(req1.reference).toBe(`REF-1-${projectId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId}`);
        expect(req2.reference).toBe(`REF-2-${projectId}`);
        expect(req3.id).toBeGreaterThan(0);
        expect(req3.name).toBe(`Requirement 3 for project ${projectId}`);
        expect(req3.reference).toBeUndefined();
        expect(req4.id).toBeGreaterThan(0);
        expect(req4.name).toBe(`Requirement 4 for project ${projectId}`);
        expect(req4.reference).toBeUndefined();

        requirementToBeDeleted.push(req1.id);
        requirementToBeDeleted.push(req2.id);
        requirementToBeDeleted.push(req3.id);
        requirementToBeDeleted.push(req4.id);
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
                    reference: `REF-1-${projectId}-${folderId}`,
                    description: '<p>Description for requirement 1</p>',
                },
                {
                    name: `Requirement 2 for project ${projectId} in folder ${folderId}`,
                    reference: `REF-2-${projectId}-${folderId}`,
                    description: '<p>Description for requirement 2</p>',
                },
                {
                    name: `Requirement 3 for project ${projectId} in folder ${folderId}`,
                    description: '<p>Description for requirement 3</p><br><p>This requirement has no reference</p>',
                },
            ],
        });

        assertResultMatchSchema(result, CreateRequirementsOutputSchema);

        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(3);

        const [req1, req2, req3] = result.structuredContent.requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId} in folder ${folderId}`);
        expect(req1.reference).toBe(`REF-1-${projectId}-${folderId}`);
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId} in folder ${folderId}`);
        expect(req2.reference).toBe(`REF-2-${projectId}-${folderId}`);
        expect(req3.id).toBeGreaterThan(0);
        expect(req3.name).toBe(`Requirement 3 for project ${projectId} in folder ${folderId}`);
        expect(req3.reference).toBeUndefined();

        requirementToBeDeleted.push(req1.id);
        requirementToBeDeleted.push(req2.id);
        requirementToBeDeleted.push(req3.id);
    });

    it('should get the content of the project root', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await getRequirementFolderContentHandler({ project_id: projectId });
        assertResultMatchSchema(result, GetRequirementFolderContentOutputSchema);
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(4);

        const requirements = result.structuredContent.requirements.toSorted((a: ReturnedRequirement, b: ReturnedRequirement) =>
            a.name.localeCompare(b.name)
        );
        const [req1, req2, req3, req4] = requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId}`);
        expect(req1.reference).toBe(`REF-1-${projectId}`);
        expect(req1.description).toBe('<p>Description for requirement 1</p>');
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId}`);
        expect(req2.reference).toBe(`REF-2-${projectId}`);
        expect(req2.description).toBe('<p>Description for requirement 2</p>');
        expect(req3.id).toBeGreaterThan(0);
        expect(req3.name).toBe(`Requirement 3 for project ${projectId}`);
        expect(req3.reference).toBeUndefined();
        expect(req3.description).toBe('<p>Description for requirement 3</p><br><p>This requirement has no reference</p>');
        expect(req4.id).toBeGreaterThan(0);
        expect(req4.name).toBe(`Requirement 4 for project ${projectId}`);
        expect(req4.reference).toBeUndefined();
        expect(req4.description).toBe('<p>Description for requirement 4</p><br><p>This requirement has an empty reference</p>');
    });

    it('should get the content of a requirement folder', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;
        expect(folderId).toBeDefined();
        if (!folderId) return;

        const result = await getRequirementFolderContentHandler({ project_id: projectId, folder_id: folderId });
        assertResultMatchSchema(result, GetRequirementFolderContentOutputSchema);
        expect(result.structuredContent.requirements).toBeDefined();
        expect(result.structuredContent.requirements.length).toBe(3);

        const requirements = result.structuredContent.requirements.toSorted((a: ReturnedRequirement, b: ReturnedRequirement) =>
            a.name.localeCompare(b.name)
        );
        const [req1, req2, req3] = requirements;
        expect(req1.id).toBeGreaterThan(0);
        expect(req1.name).toBe(`Requirement 1 for project ${projectId} in folder ${folderId}`);
        expect(req1.reference).toBe(`REF-1-${projectId}-${folderId}`);
        expect(req1.description).toBe('<p>Description for requirement 1</p>');
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toBe(`Requirement 2 for project ${projectId} in folder ${folderId}`);
        expect(req2.reference).toBe(`REF-2-${projectId}-${folderId}`);
        expect(req2.description).toBe('<p>Description for requirement 2</p>');
        expect(req3.id).toBeGreaterThan(0);
        expect(req3.name).toBe(`Requirement 3 for project ${projectId} in folder ${folderId}`);
        expect(req3.reference).toBeUndefined();
        expect(req3.description).toBe('<p>Description for requirement 3</p><br><p>This requirement has no reference</p>');

    });

    afterAll(async () => {
        if (!projectId) return;
        for (const requirementId of requirementToBeDeleted) {
            await deleteRequirementHandler({ id: requirementId });
        }
        await deleteProjectHandler({ id: projectId });
    });
});
