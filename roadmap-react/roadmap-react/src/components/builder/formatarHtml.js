// Formatação ("pretty print") e realce do HTML gerado pelo Delta Builder, só para exibição na aba
// Código. Funciona também com o HTML incompleto que chega durante a geração em tempo real.
// O HTML original (o que roda na prévia e é copiado/baixado) não é alterado.

const BLOCOS = new Set([
  'html', 'head', 'body', 'header', 'main', 'footer', 'nav', 'section', 'article', 'aside', 'div',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'colgroup', 'col', 'form', 'fieldset', 'figure', 'figcaption', 'blockquote', 'details', 'summary',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'hr', 'title', 'meta', 'link', 'style', 'script',
  'svg', 'g', 'defs', 'canvas', 'template', 'noscript', 'base',
]);
const VAZIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BRUTOS = new Set(['style', 'script']);
const RE_TAG = /<\/?[a-zA-Z][^\s/>]*(?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/y;
const PASSO = '  ';

function nomeDa(tag) {
  return (tag.match(/^<\/?([a-zA-Z][^\s/>]*)/)?.[1] ?? '').toLowerCase();
}

/** Quebra o HTML em uma árvore simples: elementos, textos, comentários e conteúdo bruto (style/script). */
function arvore(html) {
  const raiz = { tipo: 'el', nome: '#raiz', filhos: [] };
  const pilha = [raiz];
  const topo = () => pilha[pilha.length - 1];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      topo().filhos.push({ tipo: 'texto', valor: html.slice(i) });
      break;
    }
    if (lt > i) topo().filhos.push({ tipo: 'texto', valor: html.slice(i, lt) });
    if (html.startsWith('<!--', lt)) {
      const fim = html.indexOf('-->', lt + 4);
      const ate = fim === -1 ? html.length : fim + 3;
      topo().filhos.push({ tipo: 'comentario', valor: html.slice(lt, ate) });
      i = ate;
      continue;
    }
    if (html[lt + 1] === '!' || html[lt + 1] === '?') {
      const fim = html.indexOf('>', lt);
      const ate = fim === -1 ? html.length : fim + 1;
      topo().filhos.push({ tipo: 'decl', valor: html.slice(lt, ate) });
      i = ate;
      continue;
    }
    RE_TAG.lastIndex = lt;
    const m = RE_TAG.exec(html);
    if (!m) {
      // "<" solto ou tag ainda incompleta (chegando durante a geração): vira texto.
      topo().filhos.push({ tipo: 'texto', valor: html.slice(lt, lt + 1) });
      i = lt + 1;
      continue;
    }
    const tag = m[0];
    const nome = nomeDa(tag);
    i = lt + tag.length;
    if (tag[1] === '/') {
      // Fecha o elemento correspondente mais próximo (tolera HTML mal aninhado).
      const pos = pilha.map((n) => n.nome).lastIndexOf(nome);
      if (pos > 0) {
        pilha[pos].fecha = tag;
        pilha.length = pos;
      }
      continue;
    }
    const el = { tipo: 'el', nome, abre: tag, filhos: [], fecha: null };
    topo().filhos.push(el);
    if (VAZIOS.has(nome) || tag.endsWith('/>')) {
      el.vazio = true;
      continue;
    }
    if (BRUTOS.has(nome)) {
      const fim = html.toLowerCase().indexOf(`</${nome}`, i);
      const ate = fim === -1 ? html.length : fim;
      el.bruto = html.slice(i, ate);
      i = ate;
      if (fim !== -1) {
        const gt = html.indexOf('>', fim);
        el.fecha = html.slice(fim, gt === -1 ? html.length : gt + 1);
        i = gt === -1 ? html.length : gt + 1;
      }
      continue;
    }
    pilha.push(el);
  }
  return raiz;
}

const ehBloco = (n) => n.tipo !== 'texto' && (n.tipo !== 'el' || BLOCOS.has(n.nome) || n.bruto !== undefined);
const temBloco = (n) => n.tipo === 'el' && n.filhos.some((f) => ehBloco(f) || temBloco(f));

function emLinha(n) {
  if (n.tipo === 'texto') return n.valor.replace(/\s+/g, ' ');
  if (n.tipo !== 'el') return n.valor;
  return `${n.abre}${n.filhos.map(emLinha).join('')}${n.fecha ?? ''}`;
}

// "a,b" → "a, b" fora de textos entre aspas.
const virgulas = (v) => v.replace(/("[^"]*"|'[^']*')|,\s*/g, (t, q) => q ?? ', ');

/** Formata CSS: uma declaração por linha, chaves indentadas, "prop: valor". */
export function formatarCss(css, base = '') {
  const linhas = [];
  let nivel = 0;
  let atual = '';
  let aspas = null;
  let parenteses = 0;
  const empurra = (t) => {
    const s = t.trim().replace(/\s+/g, ' ');
    if (s) linhas.push(base + PASSO.repeat(nivel) + s);
  };
  const declaracao = (t) => {
    const s = t.trim();
    const m = s.match(/^(--[\w-]+|[-\w]+)\s*:\s*([\s\S]*)$/);
    return m ? `${m[1]}: ${virgulas(m[2].trim())}` : s;
  };
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (aspas) {
      atual += c;
      if (c === aspas && css[i - 1] !== '\\') aspas = null;
      continue;
    }
    if (c === '"' || c === "'") {
      aspas = c;
      atual += c;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') {
      const fim = css.indexOf('*/', i + 2);
      const ate = fim === -1 ? css.length : fim + 2;
      empurra(atual);
      atual = '';
      empurra(css.slice(i, ate));
      i = ate - 1;
      continue;
    }
    if (c === '(') parenteses += 1;
    if (c === ')') parenteses = Math.max(0, parenteses - 1);
    if (parenteses) {
      atual += c;
      continue;
    }
    if (c === '{') {
      empurra(`${atual.trim().replace(/\s*,\s*/g, ', ')} {`);
      atual = '';
      nivel += 1;
    } else if (c === ';') {
      empurra(`${declaracao(atual)};`);
      atual = '';
    } else if (c === '}') {
      if (atual.trim()) empurra(`${declaracao(atual)};`);
      atual = '';
      nivel = Math.max(0, nivel - 1);
      empurra('}');
    } else {
      atual += c;
    }
  }
  empurra(atual);
  return linhas;
}

function formatarScript(js, base) {
  const linhas = js.replace(/\r/g, '').split('\n');
  while (linhas.length && !linhas[0].trim()) linhas.shift();
  while (linhas.length && !linhas[linhas.length - 1].trim()) linhas.pop();
  const recuo = Math.min(...linhas.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length), Infinity);
  return linhas.map((l) => (l.trim() ? base + l.slice(Number.isFinite(recuo) ? recuo : 0).trimEnd() : ''));
}

function renderizar(no, nivel, saida) {
  const base = PASSO.repeat(nivel);
  // Agrupa textos e elementos de linha consecutivos numa mesma linha.
  let linha = '';
  const fechaLinha = () => {
    const s = linha.replace(/\s+/g, ' ').trim();
    if (s) saida.push(base + s);
    linha = '';
  };
  for (const f of no.filhos) {
    if (!ehBloco(f) && !temBloco(f)) {
      linha += emLinha(f);
      continue;
    }
    fechaLinha();
    if (f.tipo !== 'el') {
      saida.push(base + f.valor.trim());
    } else if (f.vazio) {
      saida.push(base + f.abre);
    } else if (f.bruto !== undefined) {
      const conteudo = f.nome === 'style' ? formatarCss(f.bruto, base + PASSO) : formatarScript(f.bruto, base + PASSO);
      if (!conteudo.length) saida.push(`${base}${f.abre}${f.fecha ?? ''}`);
      else {
        saida.push(base + f.abre, ...conteudo);
        if (f.fecha) saida.push(base + f.fecha);
      }
    } else if (!temBloco(f)) {
      saida.push(base + emLinha(f).replace(/\s+/g, ' ').trim());
    } else {
      saida.push(base + f.abre);
      renderizar(f, nivel + 1, saida);
      if (f.fecha) saida.push(base + f.fecha);
    }
  }
  fechaLinha();
}

/** Devolve o HTML indentado, uma tag de bloco por linha, com o CSS do <style> formatado. */
export function formatarHtml(html) {
  if (!html) return '';
  const saida = [];
  renderizar(arvore(String(html).replace(/\r\n?/g, '\n')), 0, saida);
  return saida.join('\n');
}

/**
 * Quebra o código formatado em trechos com classe de realce: tag, atributo, valor, comentário,
 * propriedade CSS, seletor CSS e texto. Devolve uma lista de linhas, cada uma uma lista de trechos.
 */
export function realcar(codigo) {
  const linhas = [];
  let emStyle = false;
  for (const linha of codigo.split('\n')) {
    const partes = [];
    const add = (t, c) => {
      if (!t) return;
      const ult = partes[partes.length - 1];
      if (ult && ult.c === c) ult.t += t;
      else partes.push({ t, c });
    };
    const fimStyle = /^\s*<\/style/i.test(linha);
    if (emStyle && !fimStyle) {
      const m = linha.match(/^(\s*)(--[\w-]+|[-\w]+)(:\s?)(.*)$/);
      if (/^\s*\/\*/.test(linha)) add(linha, 'cm');
      else if (m && !/\{\s*$/.test(linha)) {
        add(m[1], '');
        add(m[2], 'pr');
        add(m[3], 'pn');
        add(m[4].replace(/;$/, ''), 'vl');
        if (m[4].endsWith(';')) add(';', 'pn');
      } else if (/[{}]\s*$/.test(linha)) {
        const sel = linha.replace(/\s*[{}]\s*$/, '');
        add(sel, 'sl');
        add(linha.slice(sel.length), 'pn');
      } else add(linha, '');
      linhas.push(partes);
      continue;
    }
    let i = 0;
    while (i < linha.length) {
      if (linha.startsWith('<!--', i)) {
        const fim = linha.indexOf('-->', i);
        const ate = fim === -1 ? linha.length : fim + 3;
        add(linha.slice(i, ate), 'cm');
        i = ate;
        continue;
      }
      if (linha[i] === '<' && /[a-zA-Z/!]/.test(linha[i + 1] ?? '')) {
        const nome = linha.slice(i).match(/^<\/?!?[a-zA-Z][^\s/>]*/)[0];
        add(nome.match(/^<\/?!?/)[0], 'pn');
        add(nome.replace(/^<\/?!?/, ''), 'tg');
        i += nome.length;
        // Atributos até o ">" da tag.
        while (i < linha.length && linha[i] !== '>') {
          const resto = linha.slice(i);
          const ws = resto.match(/^\s+/);
          const attr = resto.match(/^[^\s=>/"']+/);
          const val = resto.match(/^=\s*("[^"]*"?|'[^']*'?|[^\s>]+)/);
          if (ws) { add(ws[0], ''); i += ws[0].length; }
          else if (val) { add('=', 'pn'); add(val[1], 'vl'); i += val[0].length; }
          else if (attr) { add(attr[0], 'at'); i += attr[0].length; }
          else { add(linha[i], 'pn'); i += 1; }
        }
        if (linha[i] === '>') { add('>', 'pn'); i += 1; }
        continue;
      }
      const prox = linha.indexOf('<', i + 1);
      const ate = prox === -1 ? linha.length : prox;
      add(linha.slice(i, ate), 'tx');
      i = ate;
    }
    if (/^\s*<style\b/i.test(linha) && !/<\/style/i.test(linha)) emStyle = true;
    if (fimStyle) emStyle = false;
    linhas.push(partes);
  }
  return linhas;
}
