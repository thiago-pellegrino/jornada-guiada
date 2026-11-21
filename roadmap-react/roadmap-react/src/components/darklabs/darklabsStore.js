import { useSyncExternalStore } from 'react';
import { MOTORES, ROLES } from '../../domain/darklabs/conteudo.js';
import { latestRevision } from '../../domain/journey/journeyEngine.js';
import { CAP_CONSOLIDAR, lerContextoConsolidado } from '../../domain/darklabs/contexto.js';
import {
  addLog,
  aplicarContexto,
  cenarioDeDemonstracao,
  concluirMetodo,
  consolidar,
  contexto,
  decidir,
  definirProduto,
  iniciar,
  motorAtivo,
  novo,
  prod,
  registrarLaboratorio,
  restaurar,
  triar,
} from '../../domain/darklabs/simulacao.js';
import { lc } from '../../domain/darklabs/formato.js';

const PREFIXO = 'jornada.darklabs.v1';
const VIEW_KEY = 'jornada.darklabs.view';

/** Telas ocultas no menu (o código continua no projeto). Quem pedir uma delas vai para a primeira visível. */
export const TELAS_OCULTAS = new Set(['inicio']);
export const TELA_INICIAL = 'triagem';
const visivel = (v) => (TELAS_OCULTAS.has(v) ? TELA_INICIAL : v);

class Parado extends Error {}

/**
 * Estado da simulação do DarkLabs de um projeto: guarda no navegador, avisa a tela a cada mudança
 * e conduz as partes com tempo (métodos "executando" e o modo apresentação).
 */
class DarklabsStore {
  constructor(projectId, empresaPadrao) {
    this.chave = `${PREFIXO}.${projectId}`;
    this.empresaPadrao = empresaPadrao;
    this.S = this.ler(this.chave) ?? novo(empresaPadrao);
    this.backup = this.ler(`${this.chave}.antes-da-apresentacao`);
    this.versao = 0;
    this.listeners = new Set();
    this.running = {};
    this.ap = { on: false, stop: false, etapa: '' };
    this.filtro = 'todos';
    this.notify = () => {};
    // Última Consolidação de contexto (002) do projeto, lida a cada mudança do projeto.
    this.contextoDisponivel = null;
    this.projeto = null;
    let view = TELA_INICIAL;
    try {
      view = window.sessionStorage.getItem(`${VIEW_KEY}.${projectId}`) || TELA_INICIAL;
    } catch {
      /* sem sessionStorage */
    }
    this.viewKey = `${VIEW_KEY}.${projectId}`;
    this.view = visivel(view);
  }

  ler(chave) {
    try {
      const raw = window.localStorage.getItem(chave);
      return raw ? restaurar(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.versao;

  emit() {
    this.versao += 1;
    this.listeners.forEach((fn) => fn());
  }

  salvar() {
    try {
      window.localStorage.setItem(this.chave, JSON.stringify(this.S));
    } catch {
      /* armazenamento cheio ou indisponível: segue só na memória */
    }
  }

  /** Aplica uma mudança no estado, salva e redesenha. */
  mudar(fn) {
    fn(this.S);
    this.salvar();
    this.emit();
  }

  go(view) {
    view = visivel(view);
    this.view = view;
    try {
      window.sessionStorage.setItem(this.viewKey, view);
    } catch {
      /* ignora */
    }
    this.emit();
  }

  setFiltro(f) {
    this.filtro = f;
    this.emit();
  }

  /* ── Integração com o Contexto ─────────────────────────────────────────── */

  /** Situação do vínculo com o contexto: 'sem-contexto' · 'vinculado' · 'desatualizado' · 'disponivel' · 'em-andamento'. */
  situacaoContexto() {
    const c = this.contextoDisponivel;
    if (!c) return 'sem-contexto';
    const S = this.S;
    if (S.contexto && S.contexto.revisao === c.revisao && S.contexto.geradoEm === c.geradoEm) return 'vinculado';
    if (S.iniciada && !S.concluida) return 'em-andamento';
    return S.contexto ? 'desatualizado' : 'disponivel';
  }

  /**
   * Chamado quando o projeto muda. Preenche a triagem sozinho quando a simulação já estava vinculada a
   * uma revisão anterior ou ainda está vazia; se o desafio foi digitado ou veio de um cenário de
   * demonstração, só avisa e deixa o botão "Preencher com o contexto".
   */
  sincronizarContexto(projeto) {
    this.projeto = projeto;
    const rev = latestRevision(projeto, CAP_CONSOLIDAR);
    const ctx = rev ? lerContextoConsolidado(rev) : null;
    const antes = this.contextoDisponivel;
    this.contextoDisponivel = ctx;
    const situacao = this.situacaoContexto();
    const vazio = !this.S.desafio.ambicao && !this.S.desafio.problema && !this.S.iniciada;
    if (ctx && !this.ap.on && (situacao === 'desatualizado' || (situacao === 'disponivel' && vazio))) {
      this.mudar((S) => aplicarContexto(S, ctx, projeto));
      return;
    }
    if (antes?.revisao !== ctx?.revisao || antes?.geradoEm !== ctx?.geradoEm) this.emit();
  }

  preencherComContexto() {
    const ctx = this.contextoDisponivel;
    if (!ctx) return;
    if (this.S.iniciada && !this.S.concluida) {
      this.notify('Há uma jornada em andamento. O contexto novo entra na triagem quando o ciclo terminar.');
      return;
    }
    this.mudar((S) => aplicarContexto(S, ctx, this.projeto));
    this.notify(`Triagem preenchida com a Consolidação de contexto R${ctx.revisao}.`);
    this.go('triagem');
  }

  /* ── Ações com mensagens ────────────────────────────────────────────────── */

  triar() {
    this.mudar((S) => triar(S));
    this.notify(`Triagem concluída: ${prod(this.S).nome}.`);
    this.go('prateleira');
  }

  escolherProduto(id) {
    if (this.S.produto === id && !this.S.concluida) {
      this.go('squad');
      return;
    }
    let erro = null;
    this.mudar((S) => {
      erro = definirProduto(S, id);
    });
    if (erro) this.notify(erro);
    else this.go('squad');
  }

  proximoCiclo(id) {
    let erro = null;
    this.mudar((S) => {
      erro = definirProduto(S, id);
    });
    if (erro) {
      this.notify(erro);
      return;
    }
    this.notify(`Ciclo ${this.S.ciclo} preparado: ${prod(this.S).nome}.`);
    this.go('squad');
  }

  iniciar() {
    this.mudar((S) => iniciar(S, ROLES));
    this.notify('Jornada iniciada.');
    this.go('jornada');
  }

  consolidar(m) {
    this.mudar((S) => consolidar(S, m));
    this.notify('Saídas consolidadas. Revise e decida no gate.');
  }

  registrarLaboratorio() {
    this.mudar((S) => registrarLaboratorio(S));
    this.notify('Resultados registrados e hipóteses classificadas.');
  }

  decidir(m, decisao) {
    let r = null;
    this.mudar((S) => {
      r = decidir(S, m, decisao);
    });
    if (r.tipo === 'ajustar') this.notify('Ajuste registrado. Refaça os métodos que precisar e consolide as saídas de novo.');
    else if (r.tipo === 'interromper') this.go('dossie');
    else if (r.tipo === 'avancar') {
      this.notify(`Motor ${m} concluído. Motor ${r.proximo} liberado.`);
      if (!this.ap.on) this.go(`motor-${r.proximo}`);
    } else {
      this.notify('Ciclo concluído. Veja o dossiê de resultado.');
      this.go('dossie');
    }
  }

  carregarCenario(id, { navegar = true } = {}) {
    this.S = cenarioDeDemonstracao(id);
    this.running = {};
    this.salvar();
    this.emit();
    if (navegar) {
      this.notify(`Cenário carregado: ${this.S.desafio.empresa}.`);
      this.go('triagem');
    }
  }

  importar(texto) {
    let obj = null;
    try {
      obj = restaurar(JSON.parse(texto));
    } catch {
      obj = null;
    }
    if (!obj) return false;
    this.S = obj;
    this.salvar();
    this.notify('Simulação importada.');
    this.go(obj.iniciada ? 'jornada' : 'triagem');
    return true;
  }

  reiniciar() {
    this.S = novo(this.empresaPadrao);
    this.running = {};
    if (this.contextoDisponivel) aplicarContexto(this.S, this.contextoDisponivel, this.projeto);
    this.salvar();
    this.notify('Simulação reiniciada.');
    this.go('inicio');
  }

  restaurarBackup() {
    if (!this.backup) return;
    this.S = this.backup;
    this.backup = null;
    try {
      window.localStorage.removeItem(`${this.chave}.antes-da-apresentacao`);
    } catch {
      /* ignora */
    }
    this.salvar();
    this.notify('Sua simulação foi restaurada.');
    this.go(this.S.iniciada ? 'jornada' : 'inicio');
  }

  descartarBackup() {
    this.backup = null;
    try {
      window.localStorage.removeItem(`${this.chave}.antes-da-apresentacao`);
    } catch {
      /* ignora */
    }
    this.emit();
  }

  /* ── Métodos com o agente "trabalhando" ─────────────────────────────────── */

  sleep(ms) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => (this.ap.on && this.ap.stop ? reject(new Parado()) : resolve()), ms);
    });
  }

  async executarMetodo(m, i) {
    const chave = `${m}-${i}`;
    if (!motorAtivo(this.S, m) || this.running[chave]) return;
    const mo = MOTORES[m - 1];
    const [nome, ia] = mo.metodos[i];
    this.running[chave] = true;
    this.mudar((S) => {
      S.motores[m].status = 'andamento';
      addLog(S, m, `🤖 ${mo.agente} · ${nome}: ${lc(ia)}…`);
    });
    try {
      await this.sleep(this.ap.on ? 520 : 750);
      this.mudar((S) => addLog(S, m, `🤖 ${mo.agente} · síntese pronta, ${contexto(S, m, i).n(3, 9)} fontes cruzadas`));
      await this.sleep(this.ap.on ? 320 : 420);
    } catch (e) {
      delete this.running[chave];
      this.emit();
      throw e;
    }
    delete this.running[chave];
    // Se a simulação foi trocada no meio (cenário carregado, reinício), o resultado é descartado.
    if (!motorAtivo(this.S, m)) {
      this.emit();
      return;
    }
    this.mudar((S) => concluirMetodo(S, m, i));
  }

  async executarTodos(m) {
    const mo = MOTORES[m - 1];
    for (let i = 0; i < mo.metodos.length; i++) {
      if (!this.S.motores[m]?.metodos[i]) await this.executarMetodo(m, i);
    }
  }

  /* ── Modo apresentação ──────────────────────────────────────────────────── */

  async apresentar() {
    if (this.ap.on) return;
    // A apresentação usa o cenário de varejo; uma simulação em andamento fica guardada para ser restaurada.
    if (this.S.iniciada || this.S.memoria.length) {
      this.backup = JSON.parse(JSON.stringify(this.S));
      try {
        window.localStorage.setItem(`${this.chave}.antes-da-apresentacao`, JSON.stringify(this.backup));
      } catch {
        /* ignora */
      }
    }
    this.ap = { on: true, stop: false, etapa: '' };
    const etapa = (t) => {
      this.ap.etapa = t;
      this.emit();
    };
    try {
      this.carregarCenario('varejo', { navegar: false });
      etapa('1/7 · Triagem do desafio');
      this.go('triagem');
      await this.sleep(4400);
      this.mudar((S) => triar(S));
      etapa('2/7 · Recomendação na prateleira de serviços');
      this.go('prateleira');
      await this.sleep(5200);
      this.mudar((S) => definirProduto(S, 'completa'));
      etapa('3/7 · Montagem do squad');
      this.go('squad');
      await this.sleep(4400);
      this.mudar((S) => iniciar(S, ROLES));
      etapa('4/7 · Painel da jornada');
      this.go('jornada');
      await this.sleep(4400);
      for (const m of prod(this.S).motores) {
        etapa(`5/7 · Motor ${m}: ${MOTORES[m - 1].nome}`);
        this.go(`motor-${m}`);
        await this.sleep(1800);
        this.mudar((S) => {
          MOTORES[m - 1].entrada.forEach((_, i) => {
            S.motores[m].entrada[i] = true;
          });
        });
        await this.sleep(600);
        if (m === 6) {
          this.mudar((S) => {
            S.exp.v = 10.6;
            registrarLaboratorio(S);
          });
          await this.sleep(2800);
        }
        await this.executarTodos(m);
        this.mudar((S) => consolidar(S, m));
        await this.sleep(2200);
        this.mudar((S) => {
          S.motores[m].just = 'Evidências suficientes para avançar (modo apresentação).';
        });
        this.decidir(m, 'avancar');
        await this.sleep(1400);
      }
      etapa('6/7 · Dossiê de resultado');
      this.go('dossie');
      await this.sleep(7600);
      etapa('7/7 · Painel de ganhos');
      this.go('ganhos');
      await this.sleep(5000);
    } catch (e) {
      if (!(e instanceof Parado)) console.error(e);
    }
    const parada = this.ap.stop;
    this.ap = { on: false, stop: false, etapa: '' };
    this.emit();
    this.notify(parada ? 'Apresentação interrompida.' : 'Apresentação concluída.');
  }

  parar() {
    if (this.ap.on) {
      this.ap.stop = true;
      this.emit();
    }
  }
}

const lojas = new Map();

function lojaDoProjeto(projectId, empresa) {
  const id = projectId || 'sem-projeto';
  if (!lojas.has(id)) lojas.set(id, new DarklabsStore(id, empresa || ''));
  return lojas.get(id);
}

/** Simulação do DarkLabs do projeto selecionado (uma por projeto, guardada no navegador). */
export function useDarklabs(projectId, empresa) {
  const loja = lojaDoProjeto(projectId, empresa);
  useSyncExternalStore(loja.subscribe, loja.getSnapshot);
  return loja;
}
