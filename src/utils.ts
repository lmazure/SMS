import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import { appendFileSync } from 'fs';
import { EOL } from 'os';

// Environment variables (exported for use in other modules)
if (!process.env.SQUASHTM_API_KEY) {
    throw new Error("SQUASHTM_API_KEY environment variable is required");
}
if (!process.env.SQUASHTM_URL) {
    throw new Error("SQUASHTM_URL environment variable is required");
}
export const SQUASHTM_API_KEY = process.env.SQUASHTM_API_KEY;
export const SQUASHTM_URL = process.env.SQUASHTM_URL.replace(/\/$/, '');
export const SQUASHTM_API_URL = `${SQUASHTM_URL}/api/rest/latest`;
const LOG_FILE = 'sms.log';

// Utility functions
export function generateCorrelationId() {
    return Math.random().toString(36).substring(2, 9);
}

export function logToFile(correlationId: string, message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${correlationId}: ${message}${EOL}`;
    try {
        appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
        // Fallback to console if writing to file fails
        console.error(`Failed to write to log file: ${error}`);
    }
}

export function logErrorToConsole(correlationId: string, message: string) {
    console.error(message);
    logToFile(correlationId, message);
}

// Format the response to be returned to the MCP client
export function formatResponse(data: any) {
    return {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(data, null, 2),
            },
        ],
        structuredContent: data,
    };
}

// SquashTM API type definitions
export interface SquashTMProject {
    _type: string;
    id: number;
    name: string;
    description: string;
    label: string;
    _links: {
        self: {
            href: string;
        };
    };
}

export interface SquashTMFolder {
    _type: string;
    id: number;
    name: string;
    url: string;
    children: SquashTMFolder[];
}

export interface SquashTMFolderDetails {
    _type: string;
    id: number;
    name: string;
    description: string;
    parent: {
        _type: string;
        id: number;
    };
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

export interface SquashTMTestCaseDetails {
    id: number;
    name: string;
    description: string;
    prerequisite: string;
    created_by: string;
    created_on: string;
    last_modified_by: string;
    last_modified_on: string;
}

export interface SquashTMRequirementDetails {
    id: number;
    name: string;
    current_version: {
        created_by: string;
        created_on: string;
        last_modified_by: string;
        last_modified_on: string;
        description: string;
        reference: string;
        version_number: number;
        criticality: string;
        category: {
            code: string;
        };
        status: string;
    };
}

export interface SquashTMProjectTree {
    _type: string;
    id: number;
    name: string;
    description: string;
    folders: SquashTMFolder[];
}

export interface FolderStructure {
    name: string;
    description: string | undefined;
    children?: FolderStructure[];
}

export interface SquashTMPaginatedResponse<T> {
    _embedded: {
        [key: string]: T[];
    };
    page: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}

// Make a request to the SquashTM REST API
let requestCounter = 0;
export async function makeSquashRequest<T>(correlationId: string, endpoint: string, method: "GET" | "POST" | "DELETE" | "PATCH", body?: any): Promise<T> {
    const requestId = `${correlationId}#${++requestCounter}`;

    const headers: Record<string, string> = {
        Authorization: `Bearer ${SQUASHTM_API_KEY}`,
        Accept: "application/json",
    };

    if (body) {
        headers["Content-Type"] = "application/json";
    }

    logToFile(requestId, `SquashTM REST API Request: method=${method} endpoint=${endpoint} body=${body ? JSON.stringify(body) : "<empty>"}`);

    try {
        const response = await fetch(SQUASHTM_API_URL + "/" + endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const text = await response.text();
            logErrorToConsole(requestId, `SquashTM REST API Response Status: ${response.status} Payload: ${text}`);
            // if the response is JSON, extract the message from the "message" field
            // otherwise, use the text
            let message = text;
            try {
                const json = JSON.parse(text);
                message = json.message || text;
            } catch {
                // Not JSON
            }
            throw new McpError(
                ErrorCode.InternalError,
                `Request failed:\nstatus=${response.status}\nerror=${message}`
            );
        }

        if (response.status === 204) {
            logToFile(requestId, `SquashTM REST API Response: Status: ${response.status}`);
            return {} as T;
        }

        const text = await response.text();
        logToFile(requestId, `SquashTM REST API Response: Status: ${response.status} Payload: ${text}`);

        if (text.length === 0) {
            return {} as T;
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            try {
                return JSON.parse(text) as T;
            } catch (e) {
                const m = `Failed to parse SquashTM REST API JSON response: ${text}`;
                logErrorToConsole(requestId, m);
                throw new McpError(ErrorCode.InternalError, m);
            }
        } else {
            const m = `Unexpected SquashTM REST API response format: ${text}`;
            logErrorToConsole(requestId, m);
            throw new McpError(ErrorCode.InternalError, m);
        }
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        const m = `Error making SquashTM REST API request: ${error}`;
        logErrorToConsole(requestId, m);
        throw new McpError(ErrorCode.InternalError, m);
    }
}
