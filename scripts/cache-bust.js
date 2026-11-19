// scripts/cache-bust.js
// Grava ?v=<hash curto do conteúdo> em styles.css e nos JS/JSX do próprio site
// referenciados pelos HTML em src/. A pasta admin fica de fora (Decap CMS).
//
// O Cloudflare Pages publica src/ e o comando de build do projeto é:
//   if [ -f scripts/cache-bust.js ]; then node scripts/cache-bust.js; fi
// Os hashes também ficam commitados, então o site funciona mesmo sem esse passo.
// O passeio inclui todo HTML novo em src/ (landings como ebook-ia/ e como-vender/).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.join(__dirname, '..', 'src');
const ASSET_EXT = /\.(css|js|jsx)$/i;
const TAG_ATTR = /(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["'])([^"']+)\2/gi;

function walkHtml(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'admin' || ent.name === 'content' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, out);
    else if (ent.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function commentRanges(html) {
  const ranges = [];
  const re = /<!--[\s\S]*?-->/g;
  let m;
  while ((m = re.exec(html))) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

function inside(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function versionUrl(url, htmlDir, hashes) {
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('#')) {
    return null;
  }
  const cutAt = [url.indexOf('?'), url.indexOf('#')].filter((i) => i >= 0);
  const pathPart = cutAt.length ? url.slice(0, Math.min.apply(null, cutAt)) : url;
  if (!ASSET_EXT.test(pathPart)) return null;

  const abs = path.resolve(htmlDir, pathPart);
  const root = SRC.endsWith(path.sep) ? SRC : SRC + path.sep;
  if (abs !== SRC && !abs.startsWith(root)) {
    throw new Error('Asset fora de src/: ' + url);
  }
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new Error('Asset local não encontrado: ' + url + ' (' + abs + ')');
  }

  let digest = hashes.get(abs);
  if (!digest) {
    digest = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
    hashes.set(abs, digest);
  }
  return pathPart + '?v=' + digest;
}

function rewrite(html, htmlDir, hashes) {
  const ranges = commentRanges(html);
  let updatedCount = 0;
  let kept = 0;
  const next = html.replace(TAG_ATTR, (match, prefix, quote, url, offset) => {
    if (inside(offset, ranges)) return match;
    const versioned = versionUrl(url, htmlDir, hashes);
    if (!versioned) return match;
    if (versioned === url) {
      kept += 1;
      return match;
    }
    updatedCount += 1;
    return prefix + quote + versioned + quote;
  });
  return { html: next, updated: updatedCount, kept };
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Pasta src/ não encontrada.');
    process.exit(1);
  }

  const hashes = new Map();
  const files = walkHtml(SRC, []);
  if (!files.length) {
    console.error('Nenhum HTML fora de admin/.');
    process.exit(1);
  }

  let changed = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const result = rewrite(before, path.dirname(file), hashes);
    const rel = path.relative(path.join(SRC, '..'), file);
    if (result.html !== before) {
      fs.writeFileSync(file, result.html);
      changed += 1;
      console.log(rel + '  ' + result.updated + ' referência(s) atualizada(s), ' + result.kept + ' já ok');
    } else {
      console.log(rel + '  inalterado (' + result.kept + ' referência(s) com hash)');
    }
  }

  console.log('Hashes:');
  for (const [abs, digest] of hashes) {
    console.log('  ' + path.relative(SRC, abs) + '  ' + digest);
  }
  console.log(changed ? changed + ' HTML(s) gravado(s).' : 'Nada a gravar.');
}

main();
