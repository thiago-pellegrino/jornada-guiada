import Icon from '../ui/Icon.jsx';
import arte from '../../assets/darklabs/ciclo-darklabs.webp';
import { DEMOS, GANHOS, PACKS, PROBLEMAS } from '../../domain/darklabs/conteudo.js';
import DarklabMenuIcon from '../darklab/DarklabMenuIcons.jsx';
import { IconeMotor, Secao, corMotor } from './bits.jsx';

const COMO_FUNCIONA = [
  ['Triagem', 'Descreva o desafio, o perfil e o gatilho. O DarkLabs avalia a maturidade e recomenda um produto.', 'search'],
  ['Squad', 'Monte o time de especialistas e veja o investimento estimado e os agentes de IA envolvidos.', 'users'],
  ['Motores', 'Execute os métodos de cada motor. A IA gera os artefatos, o especialista valida e você decide no gate.', 'layers'],
  ['Resultado', 'Receba o dossiê com business case, MVP, hipóteses, recomendação e backlog do futuro.', 'report'],
];


export default function TelaInicio({ loja }) {
  return (
    <div className="dlj-stack">
      <section className="dlj-hero" aria-labelledby="dlj-hero-title">
        <div className="dlj-hero__text">
          <p className="dlj-hero__kicker">DarkLabs by Capgemini · jornada simulada</p>
          <h2 id="dlj-hero-title" className="dlj-hero__title">
            O laboratório de negócios do futuro.
          </h2>
          <p className="dlj-hero__lead">
            Um ambiente onde desafios, oportunidades e incertezas são explorados por especialistas e inteligência artificial para virar produtos,
            serviços, capacidades e novos modelos de crescimento.
          </p>
          <div className="dlj-row">
            <button type="button" className="btn btn--primary dlj-hero__cta" onClick={() => loja.go('triagem')}>
              Iniciar um desafio <Icon name="chevronRight" size={14} />
            </button>
            <button type="button" className="btn dlj-hero__ghost" onClick={() => loja.apresentar()}>
              <Icon name="sparkle" size={15} /> Ver a jornada completa em modo apresentação
            </button>
          </div>
        </div>
        <div className="dlj-hero__art">
          <img src={arte} alt="Ciclo DarkLabs: Discover, Ideate, Build, Experiment, Learn, Evolve e Strategize em torno do símbolo do infinito" />
        </div>
      </section>

      <Secao titulo="O problema" id="dlj-problema">
        <div className="jg-grid jg-grid--3">
          {PROBLEMAS.map(([a, b]) => (
            <div key={a} className="surface dlj-card">
              <h4 className="dlj-card__title">{a}</h4>
              <p className="jg-muted">{b}</p>
            </div>
          ))}
        </div>
        <blockquote className="surface dlj-quote">
          Empresas não precisam de mais inovação. Precisam de uma forma melhor de descobrir, validar e escalar oportunidades antes que elas desapareçam.
        </blockquote>
      </Secao>

      <div className="jg-grid jg-grid--2">
        <section className="surface dlj-card">
          <p className="jg-eyebrow">Proposta</p>
          <h4 className="dlj-card__title">Porque o futuro não é previsto. É experimentado!</h4>
          <p className="jg-muted">
            O DarkLabs transforma a evolução num processo contínuo de descoberta, validação e aprendizado, unindo a criatividade humana à escala da IA,
            num framework conduzido por especialistas.
          </p>
        </section>
        <section className="surface dlj-card">
          <p className="jg-eyebrow">Como fazemos</p>
          <h4 className="dlj-card__title">Produtizamos o processo!</h4>
          <p className="jg-muted">
            Um motor orquestrador de foresight, inovação e criação de negócios que transforma problemas complexos em algo executável e mensurável, com
            especialistas orquestrando humanos e IA em cada ciclo.
          </p>
        </section>
      </div>

      <Secao titulo="Como a jornada funciona" id="dlj-como">
        <div className="jg-grid jg-grid--4">
          {COMO_FUNCIONA.map(([t, s, ic], k) => (
            <div key={t} className="surface dlj-card" style={{ '--mc': corMotor(k * 2 + 1) }}>
              <span className="dlj-ico">
                <Icon name={ic} size={20} />
              </span>
              <h4 className="dlj-card__title">
                {k + 1}. {t}
              </h4>
              <p className="jg-muted">{s}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Principais ganhos" id="dlj-ganhos-inicio">
        <div className="jg-grid jg-grid--4">
          {GANHOS.map(([g, i], k) => (
            <div key={g} className="surface dlj-card dlj-card--accent" style={{ '--mc': corMotor(k * 2 + 1) }}>
              <span className="dlj-ico">{i === 'gate' ? <DarklabMenuIcon name="shield" size={20} /> : <IconeMotor n={Number(i)} size={20} />}</span>
              <h4 className="dlj-card__title">{g}</h4>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Cenários de demonstração" id="dlj-demos">
        <div className="jg-grid jg-grid--3">
          {Object.entries(DEMOS).map(([k, d]) => (
            <button key={k} type="button" className="surface dlj-card dlj-card--click" onClick={() => loja.carregarCenario(k)}>
              <span className="dlj-tag">{PACKS[d.setor].nome}</span>
              <h4 className="dlj-card__title">{d.empresa}</h4>
              <p className="jg-muted">
                {d.ambicao}: {d.problema}.
              </p>
              <span className="dlj-link">
                Carregar cenário <Icon name="chevronRight" size={13} />
              </span>
            </button>
          ))}
        </div>
      </Secao>
    </div>
  );
}
