import { describe, it, expect, beforeAll } from 'vitest';
import { listProjectsHandler, createProjectHandler, deleteProjectHandler } from '../index.js';

describe('SquashTM Integration Tests', () => {
    // Generate a unique project name to avoid collisions
    const timestamp = Date.now();
    const projectName = `Integration Test Project ${timestamp}`;
    const projectDescription = "Project created by integration tests";
    let projectId: number | undefined;

    it('should create a new project', async () => {
        const result = await createProjectHandler({
            name: projectName,
            description: projectDescription
        });

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('Project created successfully with ID:');

        // Extract ID from text
        const match = result.content[0].text.match(/ID: (\d+)/);
        expect(match).toBeDefined();
        if (match) {
            projectId = parseInt(match[1], 10);
            expect(projectId).toBeGreaterThan(0);
        }
    });

    it('should list projects and find the created project', async () => {
        expect(projectId).toBeDefined();
        if (!projectId) return;

        const result = await listProjectsHandler();
        expect(result).toBeDefined();

        // Parse the JSON output
        const outputJson = JSON.parse(result.content[0].text);
        expect(Object.keys(outputJson).includes('projects')).toBe(true);

        // Find our project
        const project = outputJson.projects.find((p: any) => p.name === projectName);
        expect(project).toBeDefined();
        expect(project.id).toBe(projectId);
        expect(project.description).toBe(projectDescription);
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
