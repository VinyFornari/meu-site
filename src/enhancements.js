// Reveal-on-scroll + cookie banner + modal
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

  // ====== MODAL ======
  let lastFocus = null;
  function openModal(id) {
    const modal = document.querySelector(`[data-modal="${id}"]`);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    // focus first input
    setTimeout(() => {
      const first = modal.querySelector('input, button');
      first?.focus();
    }, 50);
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    // reset success/form state for next open
    const form = modal.querySelector('form');
    const success = modal.querySelector('.modal__success');
    if (form && success) {
      form.hidden = false;
      success.hidden = true;
      form.reset();
    }
    lastFocus?.focus?.();
  }
  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.getAttribute('data-modal-open'));
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(btn.closest('.modal'));
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal:not([hidden])').forEach(closeModal);
    }
  });

  // Notify form
  const notifyForm = document.getElementById('book-notify-form');
  if (notifyForm) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(notifyForm);
      const data = {
        name: fd.get('name')?.toString().trim(),
        email: fd.get('email')?.toString().trim(),
        phone: fd.get('phone')?.toString().trim(),
        ts: new Date().toISOString(),
        book: 'Alta Performance em Vendas B2B',
      };
      if (!data.name || !data.email || !data.phone) return;
      // Persist locally — production wiring would POST to a backend / Mailchimp / etc.
      try {
        const list = JSON.parse(localStorage.getItem('vmf_book_notify') || '[]');
        list.push(data);
        localStorage.setItem('vmf_book_notify', JSON.stringify(list));
      } catch (_) {}
      const modal = notifyForm.closest('.modal');
      const success = modal?.querySelector('.modal__success');
      if (success) {
        notifyForm.hidden = true;
        success.hidden = false;
      }
    });
  }
})();
