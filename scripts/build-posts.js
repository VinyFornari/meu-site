// scripts/build-posts.js
// Regenera src/content/posts.json a partir dos arquivos .md em src/content/posts/
const fs   = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const OUT_FILE  = path.join(__dirname, '..', 'src', 'content', 'posts.json');

function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const i = line.indexOf(':');
    if (i === -1) return;
    const key = line.slice(0, i).trim();
    let val   = line.slice(i + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
    meta[key] = val;
  });
  return meta;
}

if (!fs.existsSync(POSTS_DIR)) {
  console.log('Pasta posts/ não encontrada, criando posts.json vazio.');
  fs.writeFileSync(OUT_FILE, JSON.stringify({ posts: [] }, null, 2) + '\n');
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
console.log(`Encontrados ${files.length} arquivo(s) .md`);

const posts = files.map(f => {
  const txt  = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
  const meta = parseFrontMatter(txt);
  return {
    slug:        meta.slug        || f.replace(/\.md$/, ''),
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
console.log(`posts.json atualizado com ${posts.length} post(s).`);
