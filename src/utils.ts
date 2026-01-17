import { appendFileSync } from 'fs';
import { EOL } from 'os';

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
