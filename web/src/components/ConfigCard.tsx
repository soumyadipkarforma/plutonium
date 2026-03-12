/**
 * ConfigCard – PAT and platform repository inputs.
 * Section label with section-number pill, animated inputs.
 */
import { Key, Github } from 'lucide-react';
import GlowCard from './GlowCard';
import AnimatedInput from './AnimatedInput';
import type { FormState } from '../types';

interface Props {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  onChange: (field: keyof FormState, value: string) => void;
}

export default function ConfigCard({ form, errors, onChange }: Props) {
  return (
    <GlowCard delay={0.15}>
      <SectionLabel number="01" title="Configuration" />

      <p style={{
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
        lineHeight: 1.6,
      }}>
        Your PAT is held in memory only and sent directly to{' '}
        <span style={{ color: 'var(--cyan)' }}>api.github.com</span> — never
        stored or forwarded anywhere else.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <AnimatedInput
          label="GitHub Personal Access Token"
          type="password"
          value={form.pat}
          onChange={e => onChange('pat', e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          required
          autoComplete="off"
          spellCheck={false}
          error={errors.pat}
          hint="Requires repo + workflow scopes."
          icon={<Key size={15} />}
        />

        <AnimatedInput
          label="Platform repository"
          type="text"
          value={form.platformRepo}
          onChange={e => onChange('platformRepo', e.target.value)}
          placeholder="soumyadipkarforma/plutonium"
          required
          autoComplete="off"
          spellCheck={false}
          error={errors.platformRepo}
          hint="The repository hosting this MCP platform."
          icon={<Github size={15} />}
        />
      </div>
    </GlowCard>
  );
}

/* ── Shared section label ── */
export function SectionLabel({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem' }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#00d4ff',
        background: 'rgba(0,212,255,0.1)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 6,
        padding: '0.2rem 0.5rem',
        letterSpacing: '0.05em',
      }}>
        {number}
      </span>
      <h2 style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        margin: 0,
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}
