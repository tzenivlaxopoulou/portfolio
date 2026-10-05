// Keep navigation behavior explicit so it can later be extended with active-section states.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* =========================================
   PORTFOLIO VIDEO MODAL
========================================= */

const videoModal = document.getElementById("video-modal");
const videoPlayer = document.getElementById("video-modal-player");
const videoTriggers = document.querySelectorAll("[data-video-src]");
const videoCloseButtons = document.querySelectorAll("[data-video-close]");

function openVideoModal(videoSrc) {
  if (!videoModal || !videoPlayer) return;

  videoPlayer.src = videoSrc;

  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("video-modal-open");

  videoPlayer.play().catch(() => {
    // Autoplay may be blocked; controls remain available.
  });
}

function closeVideoModal() {
  if (!videoModal || !videoPlayer) return;

  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  videoPlayer.removeAttribute("src");
  videoPlayer.load();

  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("video-modal-open");
}

videoTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const videoSrc = trigger.dataset.videoSrc;

    if (videoSrc) {
      openVideoModal(videoSrc);
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