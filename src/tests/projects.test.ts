import { describe, it, expect, beforeAll } from 'vitest';
import { listProjectsHandler, createProjectHandler, deleteProjectHandler } from '../projects.js';

describe('SquashTM Integration Tests', () => {
    // Generate a unique project name to avoid collisions
    const timestamp = Date.now();
    const projectName = `Name of the Integration Tests Project ${timestamp}`;
    const projectLabel = `Label of the Integration Tests Project ${timestamp}`;
    const projectDescription = `Description of the Integration Tests Project ${timestamp}`;
    let projectId: number | undefined;

    it('should create a new project', async () => {
        const result = await createProjectHandler({
            name: projectName,
            label: projectLabel,
            description: projectDescription
        });

        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.id).toBeDefined();
        expect(result.structuredContent.id).toBeGreaterThan(0);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);

        projectId = result.structuredContent.id;
    });

    it('should list projects and find the created project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await listProjectsHandler();
        expect(result).toBeDefined();

        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.projects).toBeDefined();
        expect(result.structuredContent.projects.length).toBeGreaterThan(0);
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId)).toBeDefined();
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId).name).toBe(projectName);
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId).label).toBe(projectLabel);
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId).description).toBe(projectDescription);

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });

    it('should delete the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await deleteProjectHandler({ id: projectId });
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.message).toEqual(`Project ${projectId} deleted successfully`);
    });

    it('should verify the project is deleted', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await listProjectsHandler();
        expect(result).toBeDefined();
        expect(result.structuredContent).toBeDefined();
        expect(result.structuredContent.projects).toBeDefined();
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId)).toBeUndefined();

        // ensure the text and the structured content are the same
        const outputJson = JSON.parse(result.content[0].text);
        expect(outputJson).toEqual(result.structuredContent);
    });
});
