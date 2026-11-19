import { useEffect, useMemo, useRef, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import AgentIcon from '../journey/AgentIcon.jsx';
import Icon, { CopilotMark } from '../ui/Icon.jsx';
import { abrirConfiguracoes } from '../user/UserAvatar.jsx';
import { montarDossie, resumoDoDossie } from './builderData.js';
import { formatarHtml, realcar } from './formatarHtml.js';
import { SUGESTOES, blindar, extrairHtml, gerarComModelo, gerarLocal, montarPedido, motorAtivo } from './builderEngine.js';

const kB = (texto) => `${(new Blob([texto]).size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kB`;
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/**
 * Delta Builder: o usuário descreve uma tela e a IA a gera em tempo real com os dados processados
 * de toda a jornada do projeto selecionado. A tela aparece numa prévia isolada (sem acesso à rede).
 */
export default function DeltaBuilder({ scenario, result }) {
  const { catalog, project } = useJourney();
  const [pedido, setPedido] = useState('');
  const [partirDaAtual, setPartirDaAtual] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [texto, setTexto] = useState('');
  const [previa, setPrevia] = useState('');
  const [versoes, setVersoes] = useState([]);
  const [atual, setAtual] = useState(-1);
  const [aba, setAba] = useState('visual');
  const [erro, setErro] = useState(null);
  const [cheia, setCheia] = useState(false);
  const [, setTick] = useState(0);
  const controle = useRef(null);
  const ultimaPrevia = useRef(0);

  const dossie = useMemo(() => montarDossie({ project, catalog, result, scenario }), [project, catalog, result, scenario]);
  const numeros = resumoDoDossie(dossie);
  const motor = motorAtivo();
  const usaModelo = motor && !motor.semChave;
  const versao = atual >= 0 ? versoes[atual] : null;

  // Relê o modelo do B.Y.O.K. quando a janela volta ao foco (ex.: depois de configurar a chave).
  useEffect(() => {
    const reler = () => setTick((t) => t + 1);
    window.addEventListener('focus', reler);
    return () => window.removeEventListener('focus', reler);
  }, []);
  useEffect(() => () => controle.current?.abort(), []);
  useEffect(() => {
    if (!cheia) return undefined;
    const esc = (e) => e.key === 'Escape' && setCheia(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [cheia]);

  async function gerar(textoDoPedido = pedido) {
    const p = textoDoPedido.trim();
    if (!p || gerando) return;
    setPedido(p);
    setErro(null);
    setGerando(true);
    setTexto('');
    setAba('visual');
    const ctrl = new AbortController();
    controle.current = ctrl;
    let acumulado = '';
    const onTexto = (t) => {
      acumulado += t;
      setTexto(acumulado);
      const agora = performance.now();
      // Atualiza a prévia aos poucos (no máximo ~2× por segundo) enquanto o HTML chega.
      if (agora - ultimaPrevia.current > 450 && /<body/i.test(acumulado)) {
        ultimaPrevia.current = agora;
        setPrevia(blindar(extrairHtml(acumulado)));
      }
    };
    try {
      const m = motorAtivo();
      const anterior = partirDaAtual && versao ? versao.html : null;
      if (m && !m.semChave) {
        const { sistema, usuario } = montarPedido({ pedido: p, dossie, anterior });
        await gerarComModelo(m, { sistema, usuario, onTexto, signal: ctrl.signal });
      } else {
        await gerarLocal({ dossie, pedido: p, onTexto, signal: ctrl.signal });
      }
      const html = extrairHtml(acumulado);
      if (!/<html|<body|<div|<section|<main/i.test(html)) throw new Error('O modelo não devolveu uma tela em HTML. Tente reformular o pedido.');
      const nova = {
        id: `v${versoes.length + 1}`,
        pedido: p,
        html,
        motor: m && !m.semChave ? `${m.provider.name} · ${m.modelo?.name ?? m.cfg.model}` : 'Demonstração local',
        at: new Date().toISOString(),
      };
      setVersoes((v) => [...v, nova]);
      setAtual(versoes.length);
      setPrevia(blindar(html));
      setPedido('');
    } catch (e) {
      if (e?.name === 'AbortError') setErro('Geração interrompida.');
      else setErro(e?.message ?? 'Não foi possível gerar a tela.');
      if (versao) setPrevia(blindar(versao.html));
    } finally {
      setGerando(false);
      controle.current = null;
    }
  }

  function abrirVersao(i) {
    if (gerando) return;
    setAtual(i);
    setPrevia(blindar(versoes[i].html));
    setTexto(versoes[i].html);
  }

  function baixar() {
    if (!versao) return;
    const blob = new Blob([versao.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delta-builder-${project?.code ?? 'jornada'}-${versao.id}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const codigo = gerando ? texto : (versao?.html ?? '');
  // Código formatado e realçado só para leitura; a prévia, a cópia e o download usam o HTML original.
  const codigoRealcado = useMemo(() => (aba === 'codigo' && codigo ? realcar(formatarHtml(extrairHtml(codigo) || codigo)) : null), [aba, codigo]);

  return (
    <div className="jg-page">
      <ProjectBar current="builder" />
      <div className={`dbx ${cheia ? 'is-full' : ''} ${!previa && !gerando && !versao ? 'is-vazio' : ''}`}>
        <aside className="dbx-side" aria-label="Pedido ao Delta Builder" onMouseEnter={() => setTick((t) => t + 1)}>
          <header className="dbx-side__head">
            <span className="dbx-side__mark" aria-hidden="true">
              <CopilotMark size={26} />
            </span>
            <div>
              <h2 className="dbx-title">Delta Builder</h2>
              <p className="dbx-sub">Descreva a tela e a IA monta na hora com os dados da jornada{project ? ` de ${project.code}` : ''}.</p>
            </div>
          </header>

          <div className={`dbx-motor ${usaModelo ? 'is-real' : ''}`}>
            <Icon name={usaModelo ? 'sparkle' : 'info'} size={15} />
            <span>
              {usaModelo ? (
                <>
                  Gerando com <strong>{motor.provider.name} · {motor.modelo?.name ?? motor.cfg.model}</strong> (sua chave B.Y.O.K.)
                </>
              ) : motor?.semChave ? (
                <>
                  <strong>{motor.provider.name}</strong> está selecionado, mas a chave não está nesta sessão. Usando a demonstração local.
                </>
              ) : (
                <>Demonstração local: telas montadas no navegador com os dados reais da jornada. Para gerar com IA, configure uma chave.</>
              )}
            </span>
            <button type="button" className="btn btn--sm" onClick={() => abrirConfiguracoes('byok')}>
              B.Y.O.K.
            </button>
          </div>

          <section className="dbx-data" aria-label="Dados da jornada usados na geração">
            <h3>Dados da jornada</h3>
            <dl className="dbx-data__grid">
              {[
                ['Fontes', numeros.fontes, 'fileText'],
                ['Contexto', numeros.contexto, 'layers'],
                ['Motores', numeros.motores, 'gauge'],
                ['Ficha', numeros.ficha, 'report'],
                ['Squads', numeros.squads, 'users'],
                ['Features', numeros.features, 'grid'],
              ].map(([rotulo, valor, icone]) => (
                <div key={rotulo} className={`dbx-data__cell ${typeof valor === 'string' && !/\d/.test(valor) ? 'is-text' : ''}`}>
                  <dt>
                    <Icon name={icone} size={13} /> {rotulo}
                  </dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
            {!project ? <p className="dbx-hint">Sem projeto selecionado: a tela usa só a simulação das squads. Crie um projeto no Contexto para incluir a jornada.</p> : null}
          </section>

          <form
            className="dbx-form"
            onSubmit={(e) => {
              e.preventDefault();
              gerar();
            }}
          >
            <label htmlFor="dbx-pedido" className="dbx-label">
              Que tela você quer?
            </label>
            <textarea
              id="dbx-pedido"
              rows={4}
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) gerar();
              }}
              placeholder="Ex.: um painel para o comitê com o andamento dos motores, as lacunas de impacto alto e a capacidade das squads até o Freezing"
              disabled={gerando}
            />
            {versao && usaModelo ? (
              <label className="dbx-check">
                <input type="checkbox" checked={partirDaAtual} onChange={(e) => setPartirDaAtual(e.target.checked)} />
                Ajustar a partir da versão atual ({versao.id})
              </label>
            ) : null}
            <div className="dbx-actions">
              {gerando ? (
                <button type="button" className="btn" onClick={() => controle.current?.abort()}>
                  <Icon name="stop" size={14} /> Parar
                </button>
              ) : null}
              <button type="submit" className="btn btn--primary" disabled={gerando || !pedido.trim()}>
                <AgentIcon size={15} /> {gerando ? 'Gerando…' : versao && partirDaAtual && usaModelo ? 'Ajustar tela' : 'Gerar tela'}
              </button>
            </div>
          </form>

          <section className="dbx-sugs" aria-label="Sugestões de telas">
            <h3>Sugestões</h3>
            <div>
              {SUGESTOES.map((s) => (
                <button key={s} type="button" className="dbx-chip" disabled={gerando} onClick={() => gerar(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          {versoes.length ? (
            <section className="dbx-versions" aria-label="Versões geradas">
              <h3>Versões</h3>
              <ol>
                {versoes.map((v, i) => (
                  <li key={v.id}>
                    <button type="button" className={`dbx-version ${i === atual ? 'is-current' : ''}`} onClick={() => abrirVersao(i)} disabled={gerando}>
                      <strong>{v.id}</strong>
                      <span>{v.pedido}</span>
                      <em>
                        {hora(v.at)} · {v.motor}
                      </em>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </aside>

        <section className="dbx-stage" aria-label="Tela gerada">
          <div className="dbx-toolbar">
            <div className="dbx-tabs" role="tablist" aria-label="Modo de exibição">
              <button type="button" role="tab" aria-selected={aba === 'visual'} className={aba === 'visual' ? 'is-on' : ''} onClick={() => setAba('visual')}>
                <Icon name="monitor" size={14} /> Visualização
              </button>
              <button type="button" role="tab" aria-selected={aba === 'codigo'} className={aba === 'codigo' ? 'is-on' : ''} onClick={() => setAba('codigo')}>
                <Icon name="fileText" size={14} /> Código
              </button>
            </div>
            <span className="dbx-status" aria-live="polite">
              {gerando ? (
                <>
                  <span className="dbx-dot" aria-hidden="true" /> Gerando em tempo real · {kB(texto)}
                </>
              ) : versao ? (
                `${versao.id} · ${kB(versao.html)} · ${versao.motor}`
              ) : (
                'Nenhuma tela gerada ainda'
              )}
            </span>
            <div className="dbx-tools">
              <button type="button" className="icon-btn" onClick={() => navigator.clipboard?.writeText(versao?.html ?? '')} disabled={!versao} aria-label="Copiar o código" title="Copiar o código">
                <Icon name="fileExport" size={16} />
              </button>
              <button type="button" className="icon-btn" onClick={baixar} disabled={!versao} aria-label="Baixar HTML" title="Baixar HTML">
                <Icon name="download" size={16} />
              </button>
              <button type="button" className="icon-btn" onClick={() => setCheia((v) => !v)} aria-pressed={cheia} aria-label={cheia ? 'Sair da tela cheia' : 'Tela cheia'} title={cheia ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}>
                <Icon name={cheia ? 'collapse' : 'expand'} size={16} />
              </button>
            </div>
          </div>

          {erro ? (
            <p className="dbx-error" role="alert">
              <Icon name="warning" size={15} /> {erro}
            </p>
          ) : null}

          <div className="dbx-canvas">
            {aba === 'codigo' ? (
              <pre className="dbx-code" aria-label="Código da tela, formatado">
                {codigoRealcado ? (
                  <code>
                    {codigoRealcado.map((partes, n) => (
                      <span key={n} className="dbx-ln">
                        {partes.map((p, k) => (p.c ? <span key={k} className={`hl-${p.c}`}>{p.t}</span> : p.t))}
                        {'\n'}
                      </span>
                    ))}
                  </code>
                ) : (
                  <code className="dbx-code__vazio">{'<!-- O código da tela aparece aqui enquanto é gerado. -->'}</code>
                )}
              </pre>
            ) : previa ? (
              <iframe className="dbx-frame" title="Prévia da tela gerada" sandbox="allow-scripts" srcDoc={previa} />
            ) : (
              <div className="dbx-empty">
                <span className="dbx-empty__mark" aria-hidden="true">
                  <CopilotMark size={44} />
                </span>
                <h3>{gerando ? 'Montando a tela…' : 'Que tela você quer ver?'}</h3>
                <p>
                  Peça qualquer visualização — painel, linha do tempo, matriz, gráfico, relatório — e o Delta Builder monta a tela em tempo real com os dados
                  processados da jornada: fontes, Contexto, motores do DarkLabs, ficha, execuções e a simulação das squads.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
