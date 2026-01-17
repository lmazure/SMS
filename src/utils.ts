import { appendFileSync } from 'fs';
import { EOL } from 'os';
import "dotenv/config";

const SMS_LOG_FILE: string | undefined = process.env.SMS_LOG_FILE;

// Utility functions
export function generateCorrelationId() {
    return Math.random().toString(36).substring(2, 9);
}

export function logToFileAndConsole(correlationId: string, logLevel: "INFO" | "ERROR", message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${correlationId}: ${logLevel}: ${message}${EOL}`;
    console.error(logMessage);
    if (SMS_LOG_FILE) {
        try {
            appendFileSync(SMS_LOG_FILE, logMessage);
        } catch (error) {
            // Fallback to console if writing to file fails
            console.error(`Failed to write to log file ${SMS_LOG_FILE}: ${error}`);
        }
    }
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
