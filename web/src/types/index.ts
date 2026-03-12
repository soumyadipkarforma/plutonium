/** Shared TypeScript types for the Plutonium MCP Platform UI */

export interface AppConfig {
  defaultRepo: string;
  eventType: string;
  apiBase: string;
}

export type LogLevel = 'info' | 'ok' | 'warn' | 'err';

export interface LogEntry {
  id: string;
  ts: string;
  message: string;
  level: LogLevel;
}

export type AgentStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DispatchPayload {
  prompt: string;
  targetRepo: string;
  branch: string;
}

export interface FormState {
  pat: string;
  platformRepo: string;
  prompt: string;
  targetRepo: string;
  branch: string;
}
