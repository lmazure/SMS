import { describe, it, expect, beforeAll } from 'vitest';
import { listProjectsHandler, createProjectHandler, deleteProjectHandler } from '../index.js';

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
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId)?.name).toBe(projectName);
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId)?.label).toBe(projectLabel);
        expect(result.structuredContent.projects.find((p: any) => p.id === projectId)?.description).toBe(projectDescription);
    });

    it('should delete the project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await deleteProjectHandler({ id: projectId });
        expect(result).toBeDefined();
        expect(result.content[0].text).toContain(`Project ${projectId} deleted successfully`);
    });

    it('should verify the project is deleted', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await listProjectsHandler();
        const outputJson = JSON.parse(result.content[0].text);

        if (Array.isArray(outputJson)) {
            const project = outputJson.find((p: any) => p.id === projectId);
            expect(project).toBeUndefined();
        } else {
            // If no projects found, output might be text message "No projects found."
            // Assuming listProjectsHandler returns either JSON array or "No projects found." text
            // Logic in handler: if empty, returns "No projects found."
        }
    });
});
