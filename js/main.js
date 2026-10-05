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
