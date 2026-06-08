// Blog list page — loads posts.json and renders cards
(function () {
  const listEl = document.getElementById('blog-list');
  const filterEl = document.getElementById('blog-filter');

  let allPosts = [];
  let currentFilter = 'all';

  // Mobile drawer (shared with main site)
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  if (burger && drawer) {
    const openDrawer = () => {
      drawer.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      drawer.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', () => {
      if (drawer.hidden) openDrawer(); else closeDrawer();
    });
    drawer.querySelectorAll('[data-drawer-close]').forEach((el) => {
      el.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function render() {
    if (!allPosts.length) {
      listEl.innerHTML = '<p class="blog-list__empty">Nenhum artigo publicado ainda.</p>';
      return;
    }
    const filtered = currentFilter === 'all'
      ? allPosts
      : allPosts.filter(p => p.category === currentFilter);

    if (!filtered.length) {
      listEl.innerHTML = '<p class="blog-list__empty">Nenhum artigo nesta categoria ainda.</p>';
      return;
    }

    listEl.innerHTML = filtered.map(post => `
      <a class="blog-card" href="post.html?slug=${encodeURIComponent(post.slug)}">
        <div class="blog-card__meta">
          <span class="blog-card__cat">${post.category || ''}</span>
          <span class="blog-card__sep">·</span>
          <span class="blog-card__date">${formatDate(post.date)}</span>
          ${post.readingTime ? `<span class="blog-card__sep">·</span><span class="blog-card__time">${post.readingTime} min de leitura</span>` : ''}
        </div>
        <h2 class="blog-card__title">${post.title}</h2>
        ${post.subtitle ? `<p class="blog-card__sub">${post.subtitle}</p>` : ''}
        <span class="blog-card__cta">
          Ler artigo
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </a>
    `).join('');
  }

  function setFilter(cat) {
    currentFilter = cat;
    filterEl.querySelectorAll('.blog-chip').forEach(chip => {
      chip.classList.toggle('is-active', chip.dataset.cat === cat);
    });
    render();
  }

  filterEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.blog-chip');
    if (!chip) return;
    setFilter(chip.dataset.cat);
  });

  // Fetch posts manifest
  fetch('../content/posts.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(data => {
      allPosts = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      render();
    })
    .catch(() => {
      listEl.innerHTML = '<p class="blog-list__empty">Não foi possível carregar os artigos.</p>';
    });
})();
