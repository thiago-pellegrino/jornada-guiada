import { useEffect, useId, useRef } from 'react';
import { listRevisions } from '../../domain/journey/journeyEngine.js';
import { Dialog } from '../notebooks/NotebookDialogs.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { MOTOR_ICON, motorNames } from './MotorsJourney.jsx';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dia(at) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}
function hora(at) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function curta(at) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Tom visual de cada item: ícone no trilho e cor do selo. */
const TOM = {
  ok: { icon: 'check' },
  prod: { icon: null },
  pend: { icon: 'shield' },
  run: { icon: 'refresh' },
  next: { icon: 'refresh' },
  fail: { icon: 'close' },
  muted: { icon: null },
};

/**
 * Monta a cronologia de um motor em ordem de acontecimento: cada execução (com o resumo e as fontes
 * citadas no resultado), cada revisão e, por último, o que vem agora.
 */
export function cronologiaDoMotor({ project, cap, eventos, situacao, motivo, seguinte }) {
  const revisoes = listRevisions(project, cap.id);
  const ultima = revisoes.reduce((m, r) => Math.max(m, r.revision), 0);
  const porRev = new Map(revisoes.map((r) => [r.revision, r]));
  const fontes = new Map((project.sources ?? []).map((s) => [s.id, s.name]));
  const itens = [];

  eventos.forEach((e, origem) => {
    if (e.tipo === 'revisao') {
      const aceito = e.estado === 'aceito';
      itens.push({
        origem,
        at: e.at,
        tom: aceito ? 'ok' : e.estado === 'revisado' ? 'pend' : 'muted',
        selo: aceito ? 'Aceito' : e.estado === 'revisado' ? 'Revisado · aceite pendente' : 'Reaberto',
        titulo: aceito ? `Aceite formal do resultado R${e.revision}` : `Resultado R${e.revision} ${e.estado === 'revisado' ? 'revisado' : 'reaberto'} pelo time`,
        texto: aceito
          ? `Registrado por ${e.papel}. ${seguinte ? `A partir daqui, R${e.revision} é insumo de ${seguinte}.` : 'O resultado retroalimenta o AS IS e o TO BE.'}`
          : e.estado === 'revisado'
            ? `Conferido por ${e.papel}. Falta o aceite formal de um Aprovador ou Administrador para virar referência do projeto.`
            : `Voltou para revisão por ${e.papel}.`,
        docs: [{ revision: e.revision, label: `Resultado R${e.revision}` }],
      });
      return;
    }
    const origemTxt = e.turbo ? 'Modo Turbo' : 'Execução avulsa';
    if (e.status === 'succeeded' && e.revision) {
      const rev = porRev.get(e.revision);
      const env = rev?.envelope ?? {};
      const estado = rev?.reviewState;
      const substituida = e.revision < ultima && estado !== 'aceito';
      const refs = env.evidenceRefs ?? [];
      const vistas = new Set();
      const citadas = refs.filter((r) => (vistas.has(r.sourceId) ? false : vistas.add(r.sourceId)));
      const gaps = env.gaps?.length ?? 0;
      const conflitos = env.conflicts?.length ?? 0;
      itens.push({
        origem,
        at: e.at,
        tom: estado === 'aceito' ? 'ok' : substituida ? 'muted' : estado === 'revisado' ? 'pend' : 'prod',
        selo: estado === 'aceito' ? 'Executado e aceito' : substituida ? `Substituído por R${ultima}` : estado === 'revisado' ? 'Aceite pendente' : 'Produzido · aceite pendente',
        titulo: `${origemTxt} gerou o resultado R${e.revision}`,
        texto: env.summary ?? 'Resultado gerado pelo motor.',
        fatos: [
          `${refs.length} evidência${refs.length === 1 ? '' : 's'} citada${refs.length === 1 ? '' : 's'}`,
          `${gaps} lacuna${gaps === 1 ? '' : 's'} aberta${gaps === 1 ? '' : 's'}`,
          conflitos ? `${conflitos} conflito${conflitos === 1 ? '' : 's'}` : null,
          env.coverage?.coveragePct != null ? `cobertura ${Math.round(env.coverage.coveragePct * 100)}%` : null,
        ].filter(Boolean),
        docs: [
          { revision: e.revision, label: `Resultado R${e.revision} · ${curta(rev?.generatedAt ?? e.at)}` },
          ...citadas.map((r) => ({ label: `${fontes.get(r.sourceId) ?? r.sourceId} · ${r.locator}` })),
        ],
      });
      return;
    }
    itens.push({
      origem,
      at: e.at,
      tom: e.status === 'failed' ? 'fail' : e.status === 'running' ? 'run' : 'muted',
      selo: e.status === 'failed' ? 'Falhou' : e.status === 'running' ? 'Em andamento' : e.status === 'cancelled' ? 'Cancelado' : 'Pulado',
      titulo: e.status === 'failed' ? `${origemTxt} não concluída` : e.status === 'running' ? `${origemTxt} em curso` : `${origemTxt}: motor pulado`,
      texto: e.detalhe ?? (e.status === 'failed' ? 'A execução terminou com erro; nenhum resultado novo foi gravado.' : 'Nenhum resultado novo foi gravado.'),
      docs: [],
    });
  });

  itens.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  const agora = {
    andamento: ['run', 'Em andamento', 'Execução em curso', 'O motor está rodando agora; o resultado aparece aqui assim que terminar.'],
    produzido: ['next', 'Próximo passo', `Revisar o resultado R${ultima}`, 'Conferir o resultado e marcar como revisado; depois um Aprovador ou Administrador registra o aceite formal.'],
    pendente: ['next', 'Próximo passo', `Obter o aceite formal de R${ultima}`, 'O time já revisou. Falta o aceite de um Aprovador ou Administrador para o resultado alimentar os próximos motores.'],
    aceito: ['next', 'Próximo passo', seguinte ? `Alimentar ${seguinte}` : 'Retroalimentar o ciclo', seguinte ? `O resultado aceito já pode ser lido por ${seguinte}. Uma nova execução gera R${ultima + 1} e pede novo aceite.` : 'Aprendizados e novas evidências voltam para o AS IS e o TO BE.'],
    dependencia: ['fail', 'Dependência aberta', 'Aguardando a etapa anterior', motivo ?? 'O motor fica bloqueado até a dependência ser concluída.'],
    nao: ['next', 'Próximo passo', 'Gerar o primeiro resultado', 'Sem dependências abertas: rode o motor na aba Execução ou pelo Modo Turbo.'],
  }[situacao];
  if (agora) itens.push({ origem: null, at: null, agora: true, tom: agora[0], selo: agora[1], titulo: agora[2], texto: agora[3], docs: [] });
  return itens;
}

/** Modal "Cronologia do motor": o que aconteceu e o que vem agora. `foco` destaca o evento clicado. */
export function MotorChronologyDialog({ cap, itens, foco = null, onOpenResult, onClose }) {
  const id = useId();
  const lista = useRef(null);
  const { nome, verbo } = motorNames(cap);
  useEffect(() => {
    const alvo = lista.current?.querySelector('.is-focus');
    alvo?.scrollIntoView?.({ block: 'center' });
  }, []);

  return (
    <Dialog labelledBy={`${id}-t`} onClose={onClose} className="mj-chrono-dialog">
      <header className="mj-chrono__head">
        <span className="mj-chrono__badge" aria-hidden="true">
          <DarklabMenuIcon name={MOTOR_ICON[cap.number]} size={20} />
        </span>
        <div>
          <p className="mj-chrono__eyebrow">Cronologia do motor · {cap.number} · {verbo}</p>
          <h2 id={`${id}-t`} className="mj-chrono__title">
            O que aconteceu e o que vem agora
          </h2>
          <p className="mj-chrono__sub">{nome}</p>
        </div>
        <button type="button" className="nb-iconbtn mj-chrono__close" onClick={onClose} aria-label="Fechar" data-autofocus>
          <DarklabMenuIcon name="close" size={18} />
        </button>
      </header>

      <ol ref={lista} className="mj-chrono">
        {itens.map((it, k) => (
          <li key={k} className={`mj-chrono__item mj-chrono__item--${it.tom} ${foco != null && it.origem === foco ? 'is-focus' : ''}`}>
            <span className="mj-chrono__rail" aria-hidden="true">
              {TOM[it.tom].icon ? <DarklabMenuIcon name={TOM[it.tom].icon} size={14} /> : <span className="mj-chrono__dot" />}
            </span>
            <article className="mj-chrono__card">
              <div className="mj-chrono__top">
                <span className="mj-chrono__date">{it.agora ? 'Agora' : `${dia(it.at)} · ${hora(it.at)}`}</span>
                <span className="mj-chrono__pill">
                  <span className="mj-chrono__pilldot" aria-hidden="true">
                    {TOM[it.tom].icon ? <DarklabMenuIcon name={TOM[it.tom].icon} size={11} /> : null}
                  </span>
                  {it.selo}
                </span>
              </div>
              <h3 className="mj-chrono__name">{it.titulo}</h3>
              <p className="mj-chrono__text">{it.texto}</p>
              {it.fatos?.length ? <p className="mj-chrono__facts">{it.fatos.join(' · ')}</p> : null}
              {it.docs.length ? (
                <span className="mj-chrono__docs">
                  {it.docs.map((d) =>
                    d.revision ? (
                      <button key={d.label} type="button" className="mj-acc__doc" onClick={() => onOpenResult(d.revision)}>
                        <DarklabMenuIcon name="file" size={15} /> {d.label}
                      </button>
                    ) : (
                      <span key={d.label} className="mj-acc__doc mj-acc__doc--static" title="Fonte citada como evidência no resultado">
                        <DarklabMenuIcon name="file" size={15} /> {d.label}
                      </span>
                    ),
                  )}
                </span>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}
