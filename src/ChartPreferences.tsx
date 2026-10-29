import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CHART_PREFERENCES_KEY, parseChartPreferences } from './chartPreferences';
import type { ChartPreferences } from './chartPreferences';
function load() { try { return parseChartPreferences(localStorage.getItem(CHART_PREFERENCES_KEY)); } catch { return parseChartPreferences(null); } }
const Context = createContext<{ preferences: ChartPreferences; setPreference: <K extends 'time' | 'allocation'>(key: K, value: ChartPreferences[K]) => void; notice: string } | null>(null);
export function ChartPreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState(load), [notice, setNotice] = useState('');
    useEffect(() => {
        function sync(event: StorageEvent) { if (event.key === CHART_PREFERENCES_KEY || event.key === null) { setPreferences(load()); setNotice(''); } }
        window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
    }, []);
    function setPreference<K extends 'time' | 'allocation'>(key: K, value: ChartPreferences[K]) {
        let next = { ...preferences, [key]: value };
        try {
            // Merge the latest other preference when another tab has changed it.
            const current = parseChartPreferences(localStorage.getItem(CHART_PREFERENCES_KEY));
            next = { ...current, [key]: value };
            localStorage.setItem(CHART_PREFERENCES_KEY, JSON.stringify(next)); setNotice('');
        } catch { setNotice('Visualização alterada nesta sessão. Não foi possível guardar a preferência neste navegador.'); }
        setPreferences(next);
    }
    return <Context.Provider value={{ preferences, setPreference, notice }}>{children}</Context.Provider>;
}
// Shared by every chart; study data is never written by this preference.
// eslint-disable-next-line react-refresh/only-export-components
export function useChartPreferences() { const context = useContext(Context); if (!context) throw Error('Preferências de gráficos indisponíveis.'); return context; }
export function ChartChoices<T extends string>({ label, value, choices, onChange }: { label: string; value: T; choices: readonly { value: T; name: string; icon: string }[]; onChange: (value: T) => void }) {
    return <div className="chart-choices" role="group" aria-label={label}>{choices.map(choice => <button type="button" key={choice.value} className={choice.value === value ? 'selected' : ''} aria-pressed={choice.value === value} onClick={() => onChange(choice.value)}><span aria-hidden="true">{choice.icon}</span>{choice.name}</button>)}</div>;
}
