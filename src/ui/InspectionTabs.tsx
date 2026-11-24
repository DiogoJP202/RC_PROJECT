import type { KeyboardEvent } from 'react';

type InspectionTab = 'structure' | 'evidence';

export function InspectionTabs({ value, onChange, prefix = '', count, label }: {
  value: InspectionTab; onChange: (tab: InspectionTab) => void; prefix?: string; count?: number; label: string;
}) {
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const other = value === 'structure' ? 'evidence' : 'structure';
    const destinations: Partial<Record<string, InspectionTab>> = { ArrowLeft: other, ArrowRight: other, Home: 'structure', End: 'evidence' };
    const next = destinations[event.key];
    if (!next) return;
    event.preventDefault();
    onChange(next);
    document.getElementById(`${prefix}${next}-tab`)?.focus();
  };
  return <div className="inspection-tabs" role="tablist" aria-label={label} onKeyDown={move}>
    <button id={`${prefix}structure-tab`} role="tab" tabIndex={value === 'structure' ? 0 : -1}
      aria-selected={value === 'structure'} aria-controls={`${prefix}inspection-content`} onClick={() => onChange('structure')}>Estrutura</button>
    <button id={`${prefix}evidence-tab`} data-testid={prefix === 'micro-' ? 'micro-evidence' : undefined}
      role="tab" tabIndex={value === 'evidence' ? 0 : -1} aria-selected={value === 'evidence'}
      aria-controls={`${prefix}inspection-content`} onClick={() => onChange('evidence')}>Evidências {count === undefined ? null : <span>{count.toString().padStart(2, '0')}</span>}</button>
  </div>;
}
