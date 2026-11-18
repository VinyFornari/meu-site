// Reveal-on-scroll + cookie banner + mobile drawer
(function () {
  // Reveal on scroll — auto-tag main blocks
  const revealSelectors = [
    '.hero__content',
    '.hero__meta',
    '.bio-intro__left',
    '.bio-intro__right',
    '.bio-full__head',
    '.bio-full__body',
    '.bio-full__sign',
    '.exp__head',
    '.exp-card',
    '.mats__head',
    '.mat-card',
    '.ft__top'
  ];
  const targets = [];
  revealSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = (i * 40) + 'ms';
      targets.push(el);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  targets.forEach((el) => io.observe(el));

  // Cookie banner
  const banner = document.getElementById('cookies');
  if (banner) {
    const consent = localStorage.getItem('vmf_cookies');
    if (!consent) {
      setTimeout(() => { banner.hidden = false; }, 1600);
    }
    const close = (val) => {
      localStorage.setItem('vmf_cookies', val);
      banner.style.transition = 'opacity 0.3s, transform 0.3s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(() => { banner.hidden = true; }, 320);
    };
    document.getElementById('cookies-accept')?.addEventListener('click', () => close('accept'));
    document.getElementById('cookies-deny')?.addEventListener('click', () => close('deny'));
  }

  // ====== MOBILE DRAWER ======
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

})();
