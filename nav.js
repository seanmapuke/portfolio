/* Site nav: top bar + menu drawer, shared by every page.
   Load right after <body> opens so the bar is there on first paint. */
(function () {
  const CASES = [
    { id: 'pluralsight',    title: 'Pluralsight', desc: 'Enterprise content strategy' },
    { id: 'spottr',         title: 'Spottr',      desc: 'iOS workout app' },
    { id: 'digital-divide', title: 'UNT Thesis',  desc: 'Accessibility research' },
  ];

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="sn-bar">
      <a class="sn-home" href="/" aria-label="Home"><img src="/nav/monogram.svg" alt=""></a>
      <button class="sn-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="sn-drawer">
        <img src="/nav/menu.svg" alt="">
      </button>
    </div>
    <div class="sn-scrim"></div>
    <div class="sn-drawer" id="sn-drawer" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="sn-top">
        <p class="sn-label">Menu</p>
        <button class="sn-close" type="button" aria-label="Close menu"><img src="/nav/close.svg" alt=""></button>
      </div>
      <div class="sn-links">
        <a class="sn-link" href="/">Home</a>
        <a class="sn-link" href="/work">Work</a>
        <div class="sn-work">
          <p class="sn-label">Case studies</p>
          <div class="sn-cases">
            ${CASES.map(c => `
            <a class="sn-case" href="/work/${c.id}" data-case="${c.id}">
              <span class="sn-case-t">${c.title}</span>
              <span class="sn-case-d">${c.desc}</span>
            </a>`).join('')}
          </div>
        </div>
        <a class="sn-link" href="/about.html">About</a>
        <a class="sn-link" href="/contact.html">Contact</a>
      </div>
    </div>`);

  const root   = document.documentElement;
  const burger = document.querySelector('.sn-burger');
  const drawer = document.getElementById('sn-drawer');
  const scrim  = document.querySelector('.sn-scrim');
  const close  = drawer.querySelector('.sn-close');
  const isOpen = () => root.classList.contains('sn-open');

  function openMenu() {
    root.classList.add('sn-open', 'sn-lock');
    burger.setAttribute('aria-expanded', 'true');
    close.focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!isOpen()) return;
    root.classList.remove('sn-open', 'sn-lock');
    burger.setAttribute('aria-expanded', 'false');
    burger.focus({ preventScroll: true });
  }

  // After scrolling past the top, hide the monogram and keep only the hamburger.
  // Capture phase catches inner scrollers too (Work gallery, case studies).
  const SCROLL_HIDE_PX = 40;
  const setScrolled = on => root.classList.toggle('sn-scrolled', !!on);
  document.addEventListener('scroll', e => {
    const el = e.target === document ? document.scrollingElement : e.target;
    if (el && !el.closest?.('.sn-drawer')) setScrolled(el.scrollTop > SCROLL_HIDE_PX);
  }, { capture: true, passive: true });
  window.siteNavSetScrolled = setScrolled;   // for pages that swap scrollers (Work's case overlay)

  burger.addEventListener('click', openMenu);
  close.addEventListener('click', closeMenu);
  scrim.addEventListener('click', closeMenu);

  // Capture phase so Escape closes the menu without also closing an open case study
  window.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); closeMenu(); return; }
    if (e.key === 'Tab') {   // keep focus inside the drawer
      const items = drawer.querySelectorAll('a, button');
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  // On the Work page, case studies open in place instead of reloading
  drawer.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const id = link.dataset.case;
    if (id && typeof window.siteNavOpenCase === 'function' && window.siteNavOpenCase(id)) {
      e.preventDefault();
    }
    root.classList.remove('sn-open', 'sn-lock');
    burger.setAttribute('aria-expanded', 'false');
  });
})();
