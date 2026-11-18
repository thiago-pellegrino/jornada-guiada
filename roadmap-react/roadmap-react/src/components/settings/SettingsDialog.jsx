import { useEffect, useId, useRef, useState } from 'react';
import pkg from '../../../package.json';
import { useOptionalAuth } from '../../auth/AuthContext.jsx';
import { CATALOG_SIZE } from '../../journey/catalog.js';
import { useOptionalJourney } from '../../journey/JourneyContext.jsx';
import { BYOK_PROVIDERS } from '../../settings/byokCatalog.js';
import { clearSecrets, loadSettings, saveSettings } from '../../settings/settingsStore.js';
import { Dialog } from '../notebooks/NotebookDialogs.jsx';
import NotebookIcon from '../notebooks/NotebookIcons.jsx';
import ByokPane from './ByokPane.jsx';
import UserAvatar, { prepararFoto } from '../user/UserAvatar.jsx';

const SECOES = [
  ['geral', 'Geral'],
  ['byok', 'B.Y.O.K.'],
  ['personalizacao', 'Personalização'],
  ['dados', 'Controles de dados'],
  ['notificacoes', 'Notificações'],
  ['navegacao', 'Navegação na Web'],
  ['sobre', 'Sobre'],
  ['fontes', 'Fontes'],
];

function Linha({ titulo, descricao, children, htmlFor }) {
  return (
    <div className="st-row">
      <div className="st-row__text">
        {htmlFor ? <label htmlFor={htmlFor}>{titulo}</label> : <span>{titulo}</span>}
        {descricao ? <p>{descricao}</p> : null}
      </div>
      <div className="st-row__control">{children}</div>
    </div>
  );
}

function Interruptor({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`st-switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="st-switch__thumb" />
    </button>
  );
}

function Geral({ theme, onThemeChange, fontScale, onFontDecrease, onFontIncrease, onOpenDelta }) {
  const auth = useOptionalAuth();
  const [nome, setNome] = useState(auth?.session?.name ?? '');
  const id = useId();
  const salvarNome = () => nome.trim() && nome.trim() !== auth?.session?.name && auth?.updateName(nome);
  const fotoRef = useRef(null);
  const [erroFoto, setErroFoto] = useState('');
  return (
    <div className="st-pane">
      <h3 className="st-section">Preferências</h3>
      <Linha titulo="Foto do perfil" descricao={erroFoto || 'A mesma imagem aparece na barra superior e no menu do DarkLabs.'}>
        <UserAvatar size={44} label="" />
        <input
          ref={fotoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = '';
            if (!arquivo) return;
            try {
              auth?.updateAvatar(await prepararFoto(arquivo));
              setErroFoto('');
            } catch (err) {
              setErroFoto(err.message);
            }
          }}
        />
        <button type="button" className="st-btn" onClick={() => fotoRef.current?.click()}>
          Alterar foto
        </button>
        {auth?.session?.avatar ? (
          <button type="button" className="st-link" onClick={() => auth.updateAvatar(null)}>
            Remover
          </button>
        ) : null}
      </Linha>
      <Linha titulo="Nome" descricao="Como você aparece no menu, nos notebooks e no histórico." htmlFor={`${id}-nome`}>
        <input
          id={`${id}-nome`}
          className="st-textinput"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={salvarNome}
          onKeyDown={(e) => e.key === 'Enter' && salvarNome()}
          maxLength={60}
        />
      </Linha>
      <Linha titulo="Tema" htmlFor={`${id}-tema`}>
        <select id={`${id}-tema`} className="st-select" value={theme?.preference ?? 'system'} onChange={(e) => onThemeChange?.(e.target.value)}>
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
      </Linha>
      <Linha titulo="Tamanho da fonte" descricao="O mesmo ajuste dos botões A− e A+ da barra superior.">
        <span className="st-stepper">
          <button type="button" className="st-btn" onClick={onFontDecrease} disabled={!fontScale?.canDecrease} aria-label="Diminuir fonte">
            A−
          </button>
          <span className="st-stepper__value tabular">{fontScale?.percentLabel ?? '100%'}</span>
          <button type="button" className="st-btn" onClick={onFontIncrease} disabled={!fontScale?.canIncrease} aria-label="Aumentar fonte">
            A+
          </button>
        </span>
      </Linha>
      <Linha titulo="Idioma" descricao="Outros idiomas chegam com a versão com backend.">
        <select className="st-select" value="pt-BR" disabled aria-label="Idioma">
          <option value="pt-BR">Português (Brasil)</option>
        </select>
      </Linha>

      <h3 className="st-section">Como você inicia o Delta</h3>
      <Linha titulo="Abrir o Delta pela barra superior" descricao="O assistente abre ao lado da página que você está vendo.">
        <button type="button" className="st-btn" onClick={onOpenDelta}>
          <NotebookIcon name="chat" size={15} /> Exibir
        </button>
      </Linha>
      <Linha titulo="Fechar o Delta" descricao="Pressione Esc com o painel aberto.">
        <kbd className="st-kbd">Esc</kbd>
      </Linha>
    </div>
  );
}

function Personalizacao({ settings, onChange }) {
  const p = settings.personalizacao;
  const id = useId();
  const set = (patch) => onChange({ ...settings, personalizacao: { ...p, ...patch } });
  return (
    <div className="st-pane">
      <h3 className="st-section">Personalização</h3>
      <div className="st-field">
        <label htmlFor={`${id}-instr`}>Instruções para o Delta</label>
        <textarea
          id={`${id}-instr`}
          className="st-textarea"
          rows={5}
          value={p.instrucoes}
          onChange={(e) => set({ instrucoes: e.target.value })}
          placeholder="Ex.: responda em tópicos curtos, cite sempre a fonte (SRC-NNN) e use termos do setor de seguros."
          maxLength={1500}
        />
        <span className="st-hint">{p.instrucoes.length}/1500 · usadas em todas as conversas e criações dos notebooks.</span>
      </div>
      <Linha titulo="Tom das respostas" htmlFor={`${id}-tom`}>
        <select id={`${id}-tom`} className="st-select" value={p.tom} onChange={(e) => set({ tom: e.target.value })}>
          <option value="objetivo">Objetivo</option>
          <option value="equilibrado">Equilibrado</option>
          <option value="detalhado">Detalhado</option>
        </select>
      </Linha>
    </div>
  );
}

function ControlesDeDados({ settings, onChange }) {
  const journey = useOptionalJourney();
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState('');
  function exportar() {
    let jornada = null;
    try {
      jornada = JSON.parse(window.localStorage.getItem('jornada.v1') ?? 'null');
    } catch {
      jornada = null;
    }
    const blob = new Blob([JSON.stringify({ exportadoEm: new Date().toISOString(), jornada, configuracoes: settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jornada-guiada-dados.json';
    a.click();
    URL.revokeObjectURL(url);
    setAviso('Arquivo exportado (sem chaves de API).');
  }
  return (
    <div className="st-pane">
      <h3 className="st-section">Controles de dados</h3>
      <Linha titulo="Exportar meus dados" descricao="Projetos, notebooks e preferências deste navegador, em JSON. Chaves de API nunca são exportadas.">
        <button type="button" className="st-btn" onClick={exportar}>
          Exportar
        </button>
      </Linha>
      <Linha titulo="Esquecer chaves de API desta sessão" descricao="Remove da memória as chaves informadas no B.Y.O.K.">
        <button
          type="button"
          className="st-btn"
          onClick={() => {
            BYOK_PROVIDERS.forEach((p) => clearSecrets(p.id));
            onChange({ ...settings, byok: { ...settings.byok, ativo: null } });
            setAviso('Chaves removidas. O Delta volta ao modelo padrão.');
          }}
        >
          Esquecer chaves
        </button>
      </Linha>
      <Linha titulo="Apagar projetos simulados" descricao="Apaga projetos, notebooks e execuções guardados neste navegador.">
        {confirmar ? (
          <span className="st-confirm">
            <button
              type="button"
              className="st-btn st-btn--danger"
              onClick={() => {
                journey?.resetJourney();
                setConfirmar(false);
                setAviso('Projetos simulados apagados.');
              }}
            >
              Apagar tudo
            </button>
            <button type="button" className="st-link" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button type="button" className="st-btn st-btn--danger" onClick={() => setConfirmar(true)} disabled={!journey}>
            Apagar
          </button>
        )}
      </Linha>
      <p className="st-result st-result--ok" role="status" aria-live="polite">
        {aviso}
      </p>
    </div>
  );
}

function Toggles({ titulo, chave, itens, settings, onChange }) {
  const valores = settings[chave];
  return (
    <div className="st-pane">
      <h3 className="st-section">{titulo}</h3>
      {itens.map(([k, t, d]) => (
        <Linha key={k} titulo={t} descricao={d}>
          <Interruptor checked={Boolean(valores[k])} label={t} onChange={(v) => onChange({ ...settings, [chave]: { ...valores, [k]: v } })} />
        </Linha>
      ))}
      <p className="st-note">Preferências guardadas neste navegador; passam a valer para o envio de avisos e para o Delta na versão com backend.</p>
    </div>
  );
}

function Sobre() {
  const journey = useOptionalJourney();
  return (
    <div className="st-pane">
      <h3 className="st-section">Sobre</h3>
      <Linha titulo="Aplicação">Jornada Guiada · Capgemini + DarkLabs</Linha>
      <Linha titulo="Versão">
        <span className="tabular">{pkg.version}</span>
      </Linha>
      <Linha titulo="Modo">Protótipo navegável, sem backend</Linha>
      <Linha titulo="Capacidades carregadas">
        <span className="tabular">{CATALOG_SIZE} especificações</span>
      </Linha>
      <Linha titulo="Projetos neste navegador">
        <span className="tabular">{journey?.state.projects.length ?? 0}</span>
      </Linha>
    </div>
  );
}

const CONECTORES = [
  ['onedrive', 'OneDrive', 'Arquivos pessoais para os notebooks'],
  ['sharepoint', 'SharePoint', 'Bibliotecas de documentos do projeto'],
  ['gdrive', 'Google Drive', 'Pastas compartilhadas'],
  ['confluence', 'Confluence', 'Páginas e especificações'],
];

function Fontes() {
  return (
    <div className="st-pane">
      <h3 className="st-section">Fontes</h3>
      <p className="st-text">Conecte repositórios para adicionar referências aos notebooks sem baixar arquivos.</p>
      {CONECTORES.map(([k, nome, desc]) => (
        <Linha key={k} titulo={nome} descricao={desc}>
          <button type="button" className="st-btn" disabled title="Disponível na versão com backend">
            Conectar
          </button>
        </Linha>
      ))}
      <p className="st-note">As conexões usam o login corporativo (OAuth) e ficam disponíveis com o backend.</p>
    </div>
  );
}

/** Configurações do usuário: navegação à esquerda e o conteúdo da seção à direita. */
export default function SettingsDialog({ onClose, initialSection = 'geral', ...geralProps }) {
  const [secao, setSecao] = useState(initialSection);
  const [settings, setSettings] = useState(loadSettings);
  const id = useId();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  let conteudo;
  if (secao === 'geral') conteudo = <Geral {...geralProps} />;
  else if (secao === 'byok') conteudo = <ByokPane settings={settings} onChange={setSettings} />;
  else if (secao === 'personalizacao') conteudo = <Personalizacao settings={settings} onChange={setSettings} />;
  else if (secao === 'dados') conteudo = <ControlesDeDados settings={settings} onChange={setSettings} />;
  else if (secao === 'notificacoes')
    conteudo = (
      <Toggles
        titulo="Notificações"
        chave="notificacoes"
        settings={settings}
        onChange={setSettings}
        itens={[
          ['execucoes', 'Execuções concluídas', 'Avisar quando um agente ou o Modo Turbo terminar.'],
          ['revisoes', 'Revisões pendentes', 'Avisar quando um artefato aguardar sua revisão ou aceite.'],
          ['mencoes', 'Menções em notebooks', 'Avisar quando alguém do projeto mencionar você.'],
          ['resumoDiario', 'Resumo diário por e-mail', 'Um e-mail por dia com o andamento dos seus projetos.'],
        ]}
      />
    );
  else if (secao === 'navegacao')
    conteudo = (
      <Toggles
        titulo="Navegação na Web"
        chave="navegacao"
        settings={settings}
        onChange={setSettings}
        itens={[
          ['pesquisaWeb', 'Permitir pesquisa na web', 'O Delta pode buscar informações públicas para complementar as referências.'],
          ['citarFontes', 'Sempre citar as fontes da web', 'Respostas com conteúdo da web trazem os links usados.'],
        ]}
      />
    );
  else if (secao === 'sobre') conteudo = <Sobre />;
  else conteudo = <Fontes />;

  return (
    <Dialog labelledBy={`${id}-t`} onClose={onClose} className="st-dialog">
      <header className="st-head">
        <h2 id={`${id}-t`} className="st-title">
          Configurações
        </h2>
        <button type="button" className="nb-iconbtn" onClick={onClose} aria-label="Fechar configurações">
          <NotebookIcon name="close" size={20} />
        </button>
      </header>
      <div className="st-body">
        <nav className="st-nav" aria-label="Seções das configurações">
          {SECOES.map(([valor, rotulo]) => (
            <button key={valor} type="button" className={`st-nav__item ${secao === valor ? 'is-selected' : ''}`} aria-current={secao === valor ? 'page' : undefined} onClick={() => setSecao(valor)}>
              {rotulo}
              {valor === 'byok' ? <span className="st-nav__sub">Bring your own key</span> : null}
            </button>
          ))}
        </nav>
        <div className="st-content">{conteudo}</div>
      </div>
    </Dialog>
  );
}
