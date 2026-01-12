import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequirementsHandler } from '../requirements.js';
import { createProjectHandler, deleteProjectHandler } from '../projects.js';

describe('Requirements Integration Tests', () => {
    const timestamp: number = Date.now();
    const projectName: string = `Name of the Requirements Test Project ${timestamp}`;
    const projectLabel: string = `Label of the Requirements Test Project ${timestamp}`;
    const projectDescription: string = `Description of the Requirements Test Project ${timestamp}`;
    let projectId: number | undefined;

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

        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
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
        expect(req1.name).toContain('Requirement 1');
        expect(req2.id).toBeGreaterThan(0);
        expect(req2.name).toContain('Requirement 2');

        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    afterAll(async () => {
        if (!projectId) return;
        await deleteProjectHandler({ id: projectId });
    });
});
