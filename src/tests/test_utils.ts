import { expect } from 'vitest';
import { ZodSchema } from 'zod';

export function assertResultMatchSchema(result: any, schema: ZodSchema) {
    // ensure that the structured (JSON) respect the output schema
    expect(result).toBeDefined();
    expect(result.structuredContent).toBeDefined();
    const parseResult = schema.safeParse(result.structuredContent);
    if (!parseResult.success) {
        console.error("Schema validation failed:", JSON.stringify(parseResult.error.format(), null, 2));
    }
    expect(parseResult.success).toBe(true);

    // ensure the text and the structured content are the same
    expect(result.content).toBeDefined();
    expect(result.content.length).toBe(1);
    expect(result.content[0]).toBeDefined();
    expect(result.content[0].text).toBeDefined();
    const outputJson = JSON.parse(result.content[0].text);
    expect(outputJson).toEqual(result.structuredContent);
}
