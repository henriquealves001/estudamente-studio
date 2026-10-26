import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
export default function Charts({ data, kind }: {
    data: {
        dia: string;
        horas: number;
        meta: number;
    }[];
    kind: 'bar' | 'area';
}) {
    if (kind === 'bar')
        return <ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="dia"/><YAxis /><Tooltip formatter={v => Number(v) > 0 && Number(v) < 1 ? `${fmt(Number(v) * 60)} min` : `${fmt(Number(v))} h`}/><Bar dataKey="meta" name="Disponível" fill="#e1def9" radius={[4, 4, 0, 0]}/><Bar dataKey="horas" name="Estudado" fill="#8275ef" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer>;
    return <ResponsiveContainer><AreaChart data={data}><defs><linearGradient id="study" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8275ef" stopOpacity={.35}/><stop offset="100%" stopColor="#8275ef" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="dia" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} width={30}/><Tooltip formatter={v => Number(v) > 0 && Number(v) < 1 ? `${fmt(Number(v) * 60)} min` : `${fmt(Number(v))} h`}/><Area type="monotone" dataKey="horas" name="Estudado" stroke="#8275ef" strokeWidth={3} fill="url(#study)"/></AreaChart></ResponsiveContainer>;
}
