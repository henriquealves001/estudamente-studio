import { useEffect, useState } from 'react';
export const THEME_KEY = 'estudamente-studio-6-theme';
export type ThemePreference = 'light' | 'dark' | 'system';
function loadTheme(): ThemePreference { try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' || t === 'system' ? t : 'system';
}
catch {
    return 'system';
} }
export default function ThemeToggle({ onError }: {
    onError: (s: string) => void;
}) { const [preference, setPreference] = useState<ThemePreference>(loadTheme); useEffect(() => { const query = window.matchMedia('(prefers-color-scheme: dark)'); function apply() { document.documentElement.dataset.theme = preference === 'system' ? (query.matches ? 'dark' : 'light') : preference; } apply(); query.addEventListener('change', apply); return () => query.removeEventListener('change', apply); }, [preference]); return <label className="theme-control"><span className="sr-only">Aparência</span><select aria-label="Aparência" value={preference} onChange={e => { const value = e.target.value as ThemePreference; setPreference(value); try {
    localStorage.setItem(THEME_KEY, value);
}
catch {
    onError('O tema mudou nesta sessão, mas a preferência não pôde ser guardada.');
} }}><option value="light">☀ Claro</option><option value="dark">☾ Escuro</option><option value="system">◐ Sistema</option></select></label>; }
