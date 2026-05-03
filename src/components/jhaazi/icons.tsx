export const ChevLeft = ({ s = "var(--color-text-secondary)" }: { s?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Bell = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 0 0-4 4v2l-1 2h10l-1-2V6a4 4 0 0 0-4-4Z" stroke="var(--color-text-secondary)" strokeWidth="1"/><path d="M6.5 12a1.5 1.5 0 0 0 3 0" stroke="var(--color-text-secondary)" strokeWidth="1"/></svg>
);
export const Check = ({ s = "var(--color-text-success)", w = 24 }: { s?: string; w?: number }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Bag = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 7h12l-1 10H5L4 7Z" stroke={active ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} strokeWidth="1.2"/><path d="M7 7V5a3 3 0 016 0v2" stroke={active ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} strokeWidth="1.2"/></svg>
);
export const Heart = ({ active }: { active?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17s-6-4-6-9a3.5 3.5 0 016-2.4A3.5 3.5 0 0116 8c0 5-6 9-6 9Z" stroke={active ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} strokeWidth="1.2"/></svg>
);
