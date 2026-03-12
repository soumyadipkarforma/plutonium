/**
 * App.tsx – root component for the Plutonium MCP Platform UI.
 *
 * Wires together:
 *  • Global background (ParticleField + ambient gradient blobs)
 *  • Header
 *  • ConfigCard  → form state section 01
 *  • DispatchCard → form state section 02
 *  • StatusPanel  → log output section 03
 *  • Footer
 *
 * All validation, GitHub API calls, and log state live in hooks so the
 * component tree stays declarative and easy to test.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import './App.css';

import ParticleField    from './components/ParticleField';
import Header           from './components/Header';
import ConfigCard       from './components/ConfigCard';
import DispatchCard     from './components/DispatchCard';
import StatusPanel      from './components/StatusPanel';
import Footer           from './components/Footer';
import { useGitHubDispatch } from './hooks/useGitHubDispatch';
import type { AppConfig, FormState } from './types';

const REPO_RE = /^[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+$/;

const DEFAULT_FORM: FormState = {
  pat:          '',
  platformRepo: 'soumyadipkarforma/plutonium',
  prompt:       '',
  targetRepo:   '',
  branch:       'main',
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>({
    defaultRepo: 'soumyadipkarforma/plutonium',
    eventType:   'run_mcp_agent',
    apiBase:     'https://api.github.com',
  });

  const [form, setForm]     = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { status, logs, dispatch, clearLogs } = useGitHubDispatch();

  /* ── Load config.json ── */
  useEffect(() => {
    fetch('./config.json')
      .then(r => r.ok ? r.json() : null)
      .then((data: Partial<AppConfig> | null) => {
        if (data) {
          setConfig(prev => ({ ...prev, ...data }));
          if (data.defaultRepo) {
            setForm(prev => ({ ...prev, platformRepo: data.defaultRepo! }));
          }
        }
      })
      .catch(() => { /* use defaults */ });
  }, []);

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  /* ── Validation ── */
  const validate = useCallback((): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.pat.trim())           e.pat          = 'GitHub PAT is required.';
    if (!REPO_RE.test(form.platformRepo)) e.platformRepo = 'Must be owner/repo format.';
    if (!form.prompt.trim())        e.prompt       = 'Prompt is required.';
    if (!form.targetRepo.trim())    e.targetRepo   = 'Target repository is required.';
    else if (!REPO_RE.test(form.targetRepo)) e.targetRepo = 'Must be owner/repo format.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    await dispatch(config, {
      pat:          form.pat,
      platformRepo: form.platformRepo,
      prompt:       form.prompt,
      targetRepo:   form.targetRepo,
      branch:       form.branch || 'main',
    });
  }, [validate, dispatch, config, form]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setForm(prev => ({ ...DEFAULT_FORM, platformRepo: prev.platformRepo, pat: prev.pat }));
    setErrors({});
    clearLogs();
  }, [clearLogs]);

  return (
    <div className="app">
      {/* Layered background */}
      <ParticleField />
      <AmbientBlobs />

      {/* Content */}
      <Header />

      <main className="page-content" style={{ position: 'relative', zIndex: 5 }}>
        <ConfigCard  form={form} errors={errors} onChange={handleChange} />
        <DispatchCard
          form={form} errors={errors} status={status}
          onChange={handleChange} onSubmit={handleSubmit} onReset={handleReset}
        />
        <StatusPanel logs={logs} />
      </main>

      <Footer />
    </div>
  );
}

/* ── Ambient gradient blobs ── */
function AmbientBlobs() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Top-left purple blob */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Bottom-right cyan blob */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Centre pink blob */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        style={{
          position: 'absolute', top: '40%', left: '45%',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,121,249,0.05) 0%, transparent 70%)',
          filter: 'blur(70px)',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
