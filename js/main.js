// Keep navigation behavior explicit so it can later be extended with active-section states.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

/* Mobile navigation uses the existing links and leaves desktop layout intact. */
const menuHeader = document.querySelector(".hero__header");
const menuToggle = document.querySelector(".hero__menu-toggle");
const primaryNavigation = document.getElementById("primary-navigation");
const mobileNavigation = window.matchMedia("(max-width: 620px)");

if (menuHeader && menuToggle && primaryNavigation) {
  function setMobileMenuOpen(open, restoreFocus = false) {
    if (open) {
      // Reserve exactly the existing header/brand dimensions for the dropdown.
      menuHeader.style.setProperty("--menu-header-height", `${menuHeader.getBoundingClientRect().height}px`);
      menuHeader.style.setProperty("--menu-brand-width", `${menuHeader.querySelector(".brand").getBoundingClientRect().width}px`);
    }

    menuHeader.classList.toggle("is-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (!open) {
      menuHeader.style.removeProperty("--menu-header-height");
      menuHeader.style.removeProperty("--menu-brand-width");
      if (restoreFocus) menuToggle.focus({ preventScroll: true });
    }
  }

  menuHeader.classList.add("hero__header--menu-ready");

  menuToggle.addEventListener("click", () => {
    if (mobileNavigation.matches) {
      setMobileMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    }
  });

  primaryNavigation.addEventListener("click", (event) => {
    if (mobileNavigation.matches && event.target.closest("a")) setMobileMenuOpen(false, true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      setMobileMenuOpen(false, true);
    }
  });

  // Closing on outside focus also prevents conflicts with the video dialog.
  for (const eventName of ["click", "focusin"]) {
    document.addEventListener(eventName, (event) => {
      if (menuToggle.getAttribute("aria-expanded") === "true" &&
          !menuToggle.contains(event.target) && !primaryNavigation.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    });
  }

  window.addEventListener("resize", () => {
    if (menuToggle.getAttribute("aria-expanded") === "true") {
      setMobileMenuOpen(false, mobileNavigation.matches);
    }
  });
}

/* =========================================
   PORTFOLIO VIDEO MODAL
========================================= */

const videoModal = document.getElementById("video-modal");
const videoPlayer = document.getElementById("video-modal-player");
const videoTriggers = document.querySelectorAll("[data-video-src]");
const videoCloseButtons = document.querySelectorAll("[data-video-close]");
const videoCloseButton = videoModal?.querySelector(".video-modal__close");
const pageContent = document.querySelector("main");
let videoOpener = null;
let pageWasInert = false;

function openVideoModal(videoSrc, trigger) {
  if (!videoModal || !videoPlayer || !videoCloseButton) return;

  if (!videoModal.classList.contains("is-open")) {
    videoOpener = trigger;
    pageWasInert = pageContent?.inert ?? false;
  }

  videoPlayer.src = videoSrc;

  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");
  videoModal.inert = false;

  document.body.classList.add("video-modal-open");
  videoCloseButton.focus({ preventScroll: true });
  if (pageContent) pageContent.inert = true;

  videoPlayer.play().catch(() => {
    // Autoplay may be blocked; controls remain available.
  });
}

function closeVideoModal() {
  if (!videoModal || !videoPlayer || !videoModal.classList.contains("is-open")) return;

  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  // Stop focus entering the controls while the closing transition finishes.
  videoModal.inert = true;
  if (pageContent) pageContent.inert = pageWasInert;
  document.body.classList.remove("video-modal-open");
  if (videoOpener?.isConnected) videoOpener.focus({ preventScroll: true });
  videoOpener = null;

  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");
}

// Boundary guards preserve Tab access to the browser's native video controls.
// Intercepting every Tab on <video> would skip those internal controls.
videoModal?.querySelectorAll("[data-video-focus]").forEach((guard) => {
  guard.addEventListener("focus", () => {
    if (!videoModal.classList.contains("is-open")) return;
    const target = guard.dataset.videoFocus === "start" ? videoPlayer : videoCloseButton;
    target?.focus({ preventScroll: true });
  });
});

videoTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const videoSrc = trigger.dataset.videoSrc;

    if (videoSrc) {
      openVideoModal(videoSrc, trigger);
    }
  });
});

videoCloseButtons.forEach((button) => {
  button.addEventListener("click", closeVideoModal);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    videoModal?.classList.contains("is-open")
  ) {
    closeVideoModal();
  }
});

/* =========================================
   MOTION — isolated from navigation and the shared video dialog
========================================= */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 901px)');
  const ambientEnabled = window.matchMedia('(min-width: 621px)');
  const cleanups = [];
  let pageActive = true;

  /* HERO MOTION: finite CSS entrances, never replayed on scroll or preference changes. */
  const hero = document.querySelector('.hero');
  hero?.addEventListener('animationend', (event) => {
    if (event.animationName === 'motion-dot') root.classList.remove('motion-hero');
  });

  /* SCROLL REVEALS: one observer, grouped copy, no per-character markup. */
  function setupReveals() {
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return () => {};
    const groups = [
      ['.section-header, .project-number, .project__topline, .verdon-header, .creative-work-header, .about-header, .contact-header', ''],
      ['.project-title, .elan-heading__title, .verdon-title, .creative-work-title, .about-title > span', 'motion-reveal--title'],
      ['.project-category, .project-description, .project-subtitle, .role-grid, .elan-heading__category, .project__copy, .verdon-category, .verdon-description, .verdon-role, .creative-work-category, .about-copy, .about-services, .about-tools-title, .about-tool-group, .contact-heading, .contact-details', ''],
      ['.project-image, .output-feature, .creative-output-card, .project__visual, .project__gallery, .verdon-mobile, .verdon-desktop, .creative-feature-card, .creative-small-card', 'motion-reveal--scale'],
      ['.contact-portrait', 'motion-reveal--right'],
    ];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.14 });
    const targets = [];
    groups.forEach(([selector, variant]) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.classList.add('motion-reveal');
        if (variant) element.classList.add(variant);
        targets.push(element);
        observer.observe(element);
      });
    });
    document.querySelectorAll('.project-image + .project-image, .creative-output-card:nth-child(even), .creative-small-card + .creative-small-card, .about-title > span + span, .about-tool-group + .about-tool-group')
      .forEach((element) => element.classList.add('motion-delay-1'));
    const revealFocused = (event) => {
      const element = event.target.closest('.motion-reveal');
      if (element) {
        element.classList.add('is-revealed', 'motion-focused');
        observer.unobserve(element);
      }
    };
    document.addEventListener('focusin', revealFocused);
    root.classList.add('motion-ready');
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', revealFocused);
      root.classList.remove('motion-ready');
      targets.forEach((element) => element.classList.add('is-revealed'));
    };
  }
  const stopReveals = setupReveals();
  cleanups.push(stopReveals);
  document.querySelectorAll('.project-image, .output-feature, .creative-output-card, .project__visual, .project__gallery, .verdon-mobile, .verdon-desktop')
    .forEach((element) => element.classList.add('motion-visual'));

  /* PARALLAX: only two large visuals; <=16px travel, read then write once per frame. */
  function setupParallax() {
    if (!('IntersectionObserver' in window)) return () => {};
    const targets = [...document.querySelectorAll('.output-feature, .verdon-desktop')];
    const visible = new Set();
    let frame = 0;
    targets.forEach((element) => element.classList.add('motion-parallax'));
    const enabled = () => desktop.matches && !reducedMotion.matches && !document.hidden && pageActive;
    function update() {
      frame = 0;
      if (!enabled()) return;
      const height = window.innerHeight;
      const positions = [...visible].map((element) => {
        const rect = element.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (height - rect.top) / (height + rect.height)));
        return [element, (progress - 0.5) * 16];
      });
      positions.forEach(([element, y]) => element.style.setProperty('--parallax-y', `${y.toFixed(2)}px`));
    }
    function schedule() {
      if (enabled() && visible.size && !frame) frame = requestAnimationFrame(update);
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visible.add(target);
        else { visible.delete(target); target.style.removeProperty('--parallax-y'); }
      });
      schedule();
    });
    targets.forEach((element) => observer.observe(element));
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!enabled()) targets.forEach((element) => element.style.removeProperty('--parallax-y'));
      else schedule();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    cleanups.push(() => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', sync);
    });
    return sync;
  }
  const syncParallax = setupParallax();

  /* LIONIQ AMBIENT CANVAS: a bounded 1100px intro area, never the entire long case study. */
  function setupLionIQ() {
    const canvas = document.querySelector('.lioniq-ambient');
    const context = canvas?.getContext('2d');
    if (!context || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return () => {};
    let visible = false;
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let particles = [];
    const enabled = () => visible && ambientEnabled.matches && !reducedMotion.matches && !document.hidden && pageActive;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: desktop.matches ? 22 : 15 }, (_, index) => ({
        x: Math.random() * width, y: Math.random() * height,
        phase: Math.random() * Math.PI * 2,
        radius: 1 + Math.random() * 1.4,
        gold: index % 3 === 0,
      }));
      sync();
    }
    function draw(time) {
      frame = 0;
      if (!enabled()) return;
      elapsed += previousTime ? Math.min(time - previousTime, 50) : 0;
      previousTime = time;
      context.clearRect(0, 0, width, height);
      const seconds = elapsed / 1000;
      const positions = particles.map((particle) => ({
        ...particle,
        x: particle.x + Math.sin(seconds * 0.065 + particle.phase) * 18,
        y: particle.y + Math.cos(seconds * 0.05 + particle.phase) * 14,
      }));
      // At most four faint links; proximity and a slow fade make them occasional.
      let links = 0;
      for (let i = 0; i < positions.length; i += 1) {
        const point = positions[i];
        for (let j = i + 1; j < positions.length && links < 4; j += 1) {
          const other = positions[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          const fade = Math.max(0, Math.sin(seconds * 0.12 + point.phase));
          if (distance < 150 && fade > 0) {
            context.strokeStyle = `rgba(12, 40, 84, ${(1 - distance / 150) * fade * 0.075})`;
            context.lineWidth = 0.7;
            context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(other.x, other.y); context.stroke();
            links += 1;
          }
        }
        context.fillStyle = point.gold ? 'rgba(222, 195, 133, 0.045)' : 'rgba(12, 40, 84, 0.025)';
        context.beginPath(); context.arc(point.x, point.y, point.radius * 4, 0, Math.PI * 2); context.fill();
        context.fillStyle = point.gold ? 'rgba(222, 195, 133, 0.30)' : 'rgba(12, 40, 84, 0.18)';
        context.beginPath(); context.arc(point.x, point.y, point.radius, 0, Math.PI * 2); context.fill();
      }
      frame = requestAnimationFrame(draw);
    }
    function sync() {
      if (enabled() && width && height) {
        if (!frame) frame = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        if (reducedMotion.matches || !ambientEnabled.matches) context.clearRect(0, 0, width, height);
      }
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    cleanups.push(() => { observer.disconnect(); resizeObserver.disconnect(); cancelAnimationFrame(frame); });
    return sync;
  }
  const syncLionIQ = setupLionIQ();

  /* CREATIVE WORK AMBIENT: CSS radial washes, paused outside the viewport. */
  const creative = document.querySelector('.creative-work-section');
  let creativeVisible = false;
  if (creative && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => { creativeVisible = entry.isIntersecting; syncMotion(); });
    observer.observe(creative);
    cleanups.push(() => observer.disconnect());
  }
  function syncMotion() {
    if (reducedMotion.matches) {
      root.classList.remove('motion-hero');
      stopReveals();
    }
    syncParallax();
    syncLionIQ();
    creative?.classList.toggle('ambient-running', creativeVisible && ambientEnabled.matches && !reducedMotion.matches && !document.hidden && pageActive);
  }
  [reducedMotion, desktop, ambientEnabled].forEach((query) => query.addEventListener('change', syncMotion));
  document.addEventListener('visibilitychange', syncMotion);
  // Suspend for BFCache; release observers/listeners when the document is discarded.
  window.addEventListener('pagehide', (event) => {
    pageActive = false;
    syncMotion();
    if (!event.persisted) {
      cleanups.forEach((cleanup) => cleanup());
      [reducedMotion, desktop, ambientEnabled].forEach((query) => query.removeEventListener('change', syncMotion));
      document.removeEventListener('visibilitychange', syncMotion);
    }
  });
  window.addEventListener('pageshow', () => { pageActive = true; syncMotion(); });
  syncMotion();
})();
