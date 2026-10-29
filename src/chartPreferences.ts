export const CHART_PREFERENCES_KEY = 'estudamente-chart-preferences-v1';
export const timeChartTypes = ['bar', 'line', 'area'] as const;
export const allocationChartTypes = ['pie', 'bar', 'stacked'] as const;
export type TimeChartType = typeof timeChartTypes[number];
export type AllocationChartType = typeof allocationChartTypes[number];
export type ChartPreferences = { version: 1; time: TimeChartType; allocation: AllocationChartType };
export const defaultChartPreferences: ChartPreferences = { version: 1, time: 'area', allocation: 'pie' };
export function parseChartPreferences(raw: string | null): ChartPreferences {
    if (!raw) return { ...defaultChartPreferences };
    try {
        const p = JSON.parse(raw);
        if (!p || p.version !== 1) return { ...defaultChartPreferences };
        return { version: 1, time: timeChartTypes.includes(p.time) ? p.time : defaultChartPreferences.time, allocation: allocationChartTypes.includes(p.allocation) ? p.allocation : defaultChartPreferences.allocation };
    } catch { return { ...defaultChartPreferences }; }
}
export type AllocationInput = { id: string; name: string; color: string; target: number };
export function allocationChartData(rows: AllocationInput[], capacity: number) {
    const total = rows.reduce((n, r) => n + Math.max(0, r.target), 0), denominator = Math.max(capacity, total, 0), free = Math.max(0, capacity - total);
    const values = rows.map(r => ({ id: r.id, name: r.name, color: r.color, minutes: Math.max(0, r.target) }));
    if (free) values.push({ id: 'reserve', name: 'Tempo livre / reserva', color: '#7d8698', minutes: free });
    return { total, free, denominator, over: Math.max(0, total - capacity), rows: values.map(r => ({ ...r, percent: denominator ? r.minutes / denominator * 100 : 0 })) };
}
export function timeChartSummary(data: { dia: string; horas: number; meta: number }[]) {
    const studied = data.reduce((n, d) => n + d.horas, 0), available = data.reduce((n, d) => n + d.meta, 0);
    return { studied, available, empty: studied === 0 && available === 0 };
}

export function timeLabel(n: number) { const fmt = (v:number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v); return n > 0 && n < 1 ? `${fmt(n * 60)} min` : `${fmt(n)} h`; }
