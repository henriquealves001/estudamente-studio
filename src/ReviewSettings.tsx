import { useState } from 'react';
import type { Contest } from './domain';

export default function ReviewSettings({ c }: { c: Contest }) {
    const [mode, setMode] = useState(c.reviewMode || 'custom');
    return <section aria-label="Preferências de revisão">
        <h3>Revisão espaçada</h3>
        <label>Como definir os intervalos?<select name="reviewMode" value={mode} onChange={e => setMode(e.target.value === 'automatic' ? 'automatic' : 'custom')}>
            <option value="automatic">Automático · padrão do EstudaMente</option>
            <option value="custom">Personalizar os intervalos</option>
        </select></label>
        <p>{mode === 'automatic' ? 'Você registra como foi a recuperação; o sistema calcula a próxima data e considera o prazo da prova.' : 'Seus ajustes anteriores estão preservados. Ao escolher Automático e salvar, serão usados os parâmetros padrão nas próximas sugestões.'}</p>
        {mode === 'custom' && <div className="form-grid">
            <label>Intervalo inicial (dias)<input name="reviewDays" type="number" min="1" max="365" required defaultValue={c.reviewDays}/></label>
            <label>Crescimento após lembrar bem<input name="reviewGrowth" type="number" min="1" max="5" step="0.1" required defaultValue={c.reviewGrowth}/></label>
            <label>Intervalo máximo (dias)<input name="reviewMax" type="number" min="1" max="365" required defaultValue={c.reviewMax}/></label>
        </div>}
        <details><summary>Por que o sistema recomenda revisões espaçadas?</summary>
            <p>Distribuir o estudo no tempo e tentar lembrar antes de consultar a resposta são práticas apoiadas por pesquisas. Os valores de 1 dia inicial, crescimento ×2 e teto de 60 dias são pontos de partida do aplicativo, ajustados ao resultado e limitados ao período anterior à prova. Não são uma fórmula universal.</p>
            <p><a href="https://doi.org/10.1177/1529100612453266" target="_blank" rel="noopener noreferrer">Dunlosky e colaboradores (2013) ↗</a> · <a href="https://doi.org/10.1111/j.1467-9280.2008.02209.x" target="_blank" rel="noopener noreferrer">Cepeda e colaboradores (2008) ↗</a></p>
            <p>Com questões informadas, menos de 50% de acertos reinicia o intervalo; de 50% a menos de 80% impede expansão. Estes limites são escolhas do aplicativo. Sua avaliação pode antecipar a retomada.</p>
            <p>No cronograma, cada revisão recebe uma estimativa de 5 a 15 minutos conforme o tempo disponível. A duração real pode ser ajustada ao registrar. Essa faixa é uma escolha de organização do aplicativo.</p>
            <p>Personalizar muda as próximas sugestões. Revisões e resultados já registrados continuam no histórico.</p>
        </details>
    </section>;
}
