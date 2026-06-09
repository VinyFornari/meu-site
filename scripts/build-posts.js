// scripts/build-posts.js
// Regenera src/content/posts.json a partir dos arquivos .md em src/content/posts/
const fs   = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const OUT_FILE  = path.join(__dirname, '..', 'src', 'content', 'posts.json');

// Parser de front-matter que lida com valores YAML quebrados em várias linhas
// (line folding). O editor quebra títulos/subtítulos longos em linhas indentadas;
// elas fazem parte do mesmo valor e precisam ser juntadas com espaço.
function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const lines = m[1].split(/\r?\n/);
  const meta = {};
  let curKey = null;

  for (const line of lines) {
    // Linha nova "chave: valor" (sem indentação no início)
    const keyMatch = line.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (keyMatch && !/^\s/.test(line)) {
      curKey = keyMatch[1].trim();
      meta[curKey] = keyMatch[2].trim();
    } else if (curKey && /^\s+\S/.test(line)) {
      // Linha de continuação (indentada) → faz parte do valor anterior
      meta[curKey] += ' ' + line.trim();
    }
  }

  // Remove aspas externas e converte números
  for (const k in meta) {
    let v = meta[k];
    if ((v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
    meta[k] = v;
  }
  return meta;
}

function toSlug(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

if (!fs.existsSync(POSTS_DIR)) {
  console.log('Pasta posts/ nao encontrada, criando posts.json vazio.');
  fs.writeFileSync(OUT_FILE, JSON.stringify({ posts: [] }, null, 2) + '\n');
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
console.log('Encontrados ' + files.length + ' arquivo(s) .md');

const posts = files.map(f => {
  const txt      = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
  const meta     = parseFrontMatter(txt);
  const rawSlug  = meta.slug || meta.title || f.replace(/\.md$/, '');
  const slug     = toSlug(rawSlug);
  const filename = f.replace(/\.md$/, ''); // nome real do arquivo (sem extensão)
  return {
    slug,
    filename,
    title:       meta.title       || '',
    subtitle:    meta.subtitle    || '',
    date:        meta.date        || '',
    category:    meta.category    || '',
    readingTime: meta.readingTime || 5,
    cover:       meta.cover       || ''
  };
}).filter(p => p.title);

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(OUT_FILE, JSON.stringify({ posts }, null, 2) + '\n');
console.log('posts.json atualizado com ' + posts.length + ' post(s).');
