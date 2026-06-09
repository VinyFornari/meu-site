// Individual post page — reads ?slug=, fetches markdown, renders
(function () {
  // Mobile drawer (shared)
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  if (burger && drawer) {
    const openDrawer = () => { drawer.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; };
    const closeDrawer = () => { drawer.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    burger.addEventListener('click', () => { if (drawer.hidden) openDrawer(); else closeDrawer(); });
    drawer.querySelectorAll('[data-drawer-close]').forEach(el => el.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    document.getElementById('post-h1').textContent = 'Artigo não encontrado';
    document.getElementById('post-body').innerHTML = '<p>Volte para o <a href="./">blog</a> e escolha um artigo.</p>';
    return;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // Parse front-matter (--- YAML ---) from markdown
  function parseFrontMatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!m) return { meta: {}, body: text };
    const meta = {};
    m[1].split(/\r?\n/).forEach(line => {
      const i = line.indexOf(':');
      if (i === -1) return;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith('[') && val.endsWith(']')) {
        try { val = JSON.parse(val.replace(/'/g, '"')); } catch (_) { val = []; }
      }
      meta[key] = val;
    });
    return { meta, body: m[2] };
  }

  function renderShareLinks(url, title) {
    const enc = encodeURIComponent;
    document.getElementById('share-linkedin').href =
      `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;
    document.getElementById('share-whatsapp').href =
      `https://wa.me/?text=${enc(title + ' — ' + url)}`;
    const copyBtn = document.getElementById('share-copy');
    const copyLbl = document.getElementById('share-copy-label');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyLbl.textContent = 'Copiado!';
        setTimeout(() => { copyLbl.textContent = 'Copiar link'; }, 2000);
      } catch (_) {
        copyLbl.textContent = 'Erro ao copiar';
      }
    });
  }

  function renderSidebar(posts, currentSlug) {
    // Categories
    const cats = {};
    posts.forEach(p => {
      if (p.category) cats[p.category] = (cats[p.category] || 0) + 1;
    });
    const catsEl = document.getElementById('aside-cats');
    catsEl.innerHTML = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) =>
        `<li><a href="./?cat=${encodeURIComponent(cat)}"><span>${cat}</span><span class="count">${n}</span></a></li>`
      ).join('');

    // Recent (exclude current)
    const recent = posts
      .filter(p => p.slug !== currentSlug)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
    const recentEl = document.getElementById('aside-recent');
    recentEl.innerHTML = recent.length
      ? recent.map(p =>
          `<li><a href="post.html?slug=${encodeURIComponent(p.slug)}">
            <span class="rec-date">${formatDate(p.date)}</span>
            <span class="rec-title">${p.title}</span>
          </a></li>`
        ).join('')
      : '<li class="empty">Nenhum outro artigo ainda.</li>';
  }

  function renderNextPrev(posts, currentSlug) {
    const sorted = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const idx = sorted.findIndex(p => p.slug === currentSlug);
    if (idx === -1) return;
    const newer = idx > 0 ? sorted[idx - 1] : null;
    const older = idx < sorted.length - 1 ? sorted[idx + 1] : null;
    const navEl = document.getElementById('post-nav');
    navEl.innerHTML = `
      ${older ? `
        <a class="post-nav__item post-nav__item--prev" href="post.html?slug=${encodeURIComponent(older.slug)}">
          <span class="post-nav__dir">← Artigo anterior</span>
          <span class="post-nav__title">${older.title}</span>
        </a>
      ` : '<span></span>'}
      ${newer ? `
        <a class="post-nav__item post-nav__item--next" href="post.html?slug=${encodeURIComponent(newer.slug)}">
          <span class="post-nav__dir">Próximo artigo →</span>
          <span class="post-nav__title">${newer.title}</span>
        </a>
      ` : '<span></span>'}
    `;
  }

  // Configure marked
  if (window.marked && marked.setOptions) {
    marked.setOptions({ breaks: false, gfm: true });
  }

  // Fetch markdown + manifest in parallel
  // First get manifest to resolve the real filename, then fetch markdown
  fetch('../content/posts.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(manifest => {
      const posts = manifest.posts || [];
      const postMeta = posts.find(p => p.slug === slug);
      // Use filename from manifest if available, otherwise fall back to slug
      const mdFile = (postMeta && postMeta.filename) ? postMeta.filename : slug;
      return Promise.all([
        fetch(`../content/posts/${encodeURIComponent(mdFile)}.md`, { cache: 'no-cache' }).then(r => {
          if (!r.ok) throw new Error('not found');
          return r.text();
        }),
        Promise.resolve(manifest)
      ]);
    })
    .then(([md, manifest]) => {
      const { meta, body } = parseFrontMatter(md);
      const posts = manifest.posts || [];
      const postMeta = posts.find(p => p.slug === slug) || meta;
      const title = postMeta.title || meta.title || 'Artigo';
      const subtitle = postMeta.subtitle || meta.subtitle || '';
      const category = postMeta.category || meta.category || '';
      const date = postMeta.date || meta.date || '';
      const readingTime = postMeta.readingTime || meta.readingTime || '';
      const cover = postMeta.cover || meta.cover || '';

      // Head meta
      document.title = `${title} · Blog Vinícius M. Fornari`;
      document.getElementById('post-title').textContent = document.title;
      document.getElementById('post-description').setAttribute('content', subtitle);
      document.getElementById('og-title').setAttribute('content', title);
      document.getElementById('og-description').setAttribute('content', subtitle);
      if (cover) document.getElementById('og-image').setAttribute('content', cover);

      // Header
      document.getElementById('post-category').textContent = category;
      document.getElementById('post-h1').textContent = title;
      document.getElementById('post-subtitle').textContent = subtitle;
      document.getElementById('post-date').textContent = formatDate(date);
      document.getElementById('post-reading-time').textContent = readingTime ? `${readingTime} min de leitura` : '';

      // Body
      const html = window.marked ? marked.parse(body) : body;
      document.getElementById('post-body').innerHTML = html;

      // Sidebar + nav
      renderSidebar(posts, slug);
      renderNextPrev(posts, slug);

      // Share
      renderShareLinks(window.location.href, title);
    })
    .catch((err) => {
      document.getElementById('post-h1').textContent = 'Artigo não encontrado';
      document.getElementById('post-body').innerHTML = `<p>Esse artigo não existe ou foi removido. Volte para o <a href="./">blog</a>.</p>`;
    });
})();
