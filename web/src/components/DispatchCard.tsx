/**
 * DispatchCard – prompt, target repo, branch, and the submit button.
 */
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap } from 'lucide-react';
import GlowCard from './GlowCard';
import AnimatedInput from './AnimatedInput';
import AnimatedTextarea from './AnimatedTextarea';
import SubmitButton from './SubmitButton';
import { SectionLabel } from './ConfigCard';
import type { FormState, AgentStatus } from '../types';

const EXAMPLE_PROMPTS = [
  'Generate a CONTRIBUTING.md with setup instructions',
  'Add GitHub Actions CI workflow for Python 3.12',
  'Write a comprehensive README from the codebase',
  'Create unit tests for all public functions',
];

interface Props {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  status: AgentStatus;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export default function DispatchCard({ form, errors, status, onChange, onSubmit, onReset }: Props) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit();
  }, [onSubmit]);

  return (
    <GlowCard delay={0.28}>
      <SectionLabel number="02" title="Run AI Agent" />

      {/* Example prompt chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Quick examples
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {EXAMPLE_PROMPTS.map(p => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.04, borderColor: 'rgba(0,212,255,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange('prompt', p)}
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '0.3rem 0.65rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 0.2s',
              }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Prompt */}
        <AnimatedTextarea
          label="Prompt"
          value={form.prompt}
          onChange={e => onChange('prompt', e.target.value)}
          onKeyDown={handleKeyDown}
          required
          spellCheck
          rows={5}
          error={errors.prompt}
          hint="Ctrl+Enter to submit"
        />

        {/* Target repo + branch row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
        }}
          className="dispatch-row"
        >
          <AnimatedInput
            label="Target repository"
            type="text"
            value={form.targetRepo}
            onChange={e => onChange('targetRepo', e.target.value)}
            placeholder="owner/repo"
            required
            autoComplete="off"
            spellCheck={false}
            error={errors.targetRepo}
            hint="Where generated files will be committed."
          />
          <AnimatedInput
            label="Branch"
            type="text"
            value={form.branch}
            onChange={e => onChange('branch', e.target.value)}
            placeholder="main"
            autoComplete="off"
            spellCheck={false}
            icon={<GitBranch size={14} />}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <SubmitButton status={status} onClick={onSubmit} />

          <motion.button
            whileHover={{ scale: 1.03, color: '#e2e8f8' }}
            whileTap={{ scale: 0.97 }}
            onClick={onReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.72rem 1.25rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
          >
            ↺ Reset
          </motion.button>

          {/* Keyboard shortcut hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Zap size={11} style={{ color: '#00d4ff' }} />
            Ctrl+Enter
          </motion.span>
        </div>
      </div>
    </GlowCard>
  );
}
