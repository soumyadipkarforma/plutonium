import { useState, useCallback } from 'react';
import type { LogEntry, AgentStatus, AppConfig, DispatchPayload } from '../types';

let logCounter = 0;
const makeId = () => `log-${++logCounter}-${Date.now()}`;
const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });

interface UseGitHubDispatchReturn {
  status: AgentStatus;
  logs: LogEntry[];
  dispatch: (config: AppConfig, payload: DispatchPayload & { pat: string; platformRepo: string }) => Promise<void>;
  clearLogs: () => void;
}

export function useGitHubDispatch(): UseGitHubDispatchReturn {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    setLogs(prev => [...prev, { id: makeId(), ts: timestamp(), message, level }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setStatus('idle');
  }, []);

  const dispatch = useCallback(async (
    config: AppConfig,
    { pat, platformRepo, prompt, targetRepo, branch }: DispatchPayload & { pat: string; platformRepo: string }
  ) => {
    setStatus('loading');
    setLogs([]);

    addLog(`Preparing dispatch to ${platformRepo}…`, 'info');
    addLog(`Event type: ${config.eventType}`, 'info');
    addLog(`Target: ${targetRepo} @ ${branch}`, 'info');

    const url = `${config.apiBase}/repos/${platformRepo}/dispatches`;
    const body = {
      event_type: config.eventType,
      client_payload: { prompt, target_repo: targetRepo, branch },
    };

    try {
      addLog('Sending request to GitHub API…', 'info');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${pat}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 204) {
        addLog('✓ Workflow dispatched successfully!', 'ok');
        addLog(`Monitor at: https://github.com/${platformRepo}/actions`, 'ok');
        addLog(`AI agent is now running on GitHub Actions.`, 'info');
        setStatus('success');
      } else {
        let detail = `HTTP ${response.status}`;
        try {
          const json = await response.json() as { message?: string };
          detail = json.message ?? detail;
        } catch { /* ignore */ }
        addLog(`✗ GitHub API error: ${detail}`, 'err');
        if (response.status === 401) addLog('Check your PAT — authentication failed.', 'warn');
        if (response.status === 404) addLog('Repository not found or PAT lacks "repo" scope.', 'warn');
        if (response.status === 422) addLog('Ensure the PAT has the "workflow" scope.', 'warn');
        setStatus('error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`✗ Network error: ${msg}`, 'err');
      setStatus('error');
    }
  }, [addLog]);

  return { status, logs, dispatch, clearLogs };
}
