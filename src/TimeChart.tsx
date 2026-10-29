import Charts from './Charts';
import type { TimeChartRow } from './Charts';
import { ChartChoices, useChartPreferences } from './ChartPreferencesContext';
import { timeChartSummary, timeLabel } from './chartPreferences';
export default function TimeChart({ data }: { data: TimeChartRow[] }) {
    const { preferences, setPreference, notice } = useChartPreferences(), summary = timeChartSummary(data);
    return <><ChartChoices label="Formato do gráfico semanal" value={preferences.time} onChange={v => setPreference('time', v)} choices={[{value:'bar',name:'Colunas',icon:'▥'},{value:'line',name:'Linhas',icon:'⌁'},{value:'area',name:'Área',icon:'◩'}]}/>
    <p className="chart-summary">{timeLabel(summary.studied)} estudadas · {timeLabel(summary.available)} disponíveis na semana</p>
    {summary.empty ? <p className="empty">Ainda não há horas registradas nem horários definidos nesta semana.</p> : <div className="chart" aria-label="Horas estudadas e disponíveis por dia"><Charts data={data} kind={preferences.time}/></div>}
    <div className="chart-key"><span><i style={{background:'#8275ef'}}/>Estudado</span><span><i style={{background:'#aba5d6'}}/>Disponível</span></div>
    <details className="chart-help"><summary>Ver valores e preferência</summary><p>Esta escolha vale para os gráficos semanais do painel e de Meu progresso, neste navegador. Os valores permanecem iguais em todos os formatos.</p><div className="preview-table-wrap"><table className="preview-table"><caption>Horas por dia</caption><thead><tr><th>Dia</th><th>Estudado</th><th>Disponível</th></tr></thead><tbody>{data.map(d=><tr key={d.dia}><th scope="row">{d.dia}</th><td>{timeLabel(d.horas)}</td><td>{timeLabel(d.meta)}</td></tr>)}</tbody></table></div></details>{notice&&<p role="status">{notice}</p>}</>;
}
