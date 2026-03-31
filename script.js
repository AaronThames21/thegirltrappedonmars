const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const overlay = $("#enterOverlay");
const enterBtn = $("#enterButton");

// audio
const introMusic = $("#introMusic");
const beepSound = $("#beepSound");
const audioState = $("#audioState");
const audioHint = $("#audioHint");
const muteToggle = $("#muteToggle");

let muted = false;
let musicStarted = false;
let restartTimer = null;

// nav
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

// slideshow modal
const deckModal = $("#deckModal");
const openPitchDeck = $("#openPitchDeck");
const openPitchDeck2 = $("#openPitchDeck2");
const closeModalBtn = $("#closeModal");
const prevPageBtn = $("#prevPage");
const nextPageBtn = $("#nextPage");
const pageCounter = $("#pageCounter");
const slideImage = $("#slideImage");

let currentSlide = 1;
const totalSlides = 18;

// fundraising
const copyFundLinkBtn = $("#copyFundLink");
const fundFill = $("#fundFill");
const fundText = $("#fundText");

let raised = 10000;
const goal = 35000;

// close page
const closePageBtn = $("#closePage");
const closeMsg = $("#closeMsg");

// year
const year = $("#year");

// AUDIO
function setAudioUI(stateText, showHint = false) {
  if (audioState) audioState.textContent = stateText;
  if (audioHint) audioHint.style.display = showHint ? "inline" : "none";
}

function clearRestartTimer() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

// no restart needed
function scheduleRestartAfterDelay() {
  // intentionally empty
}

function attachAudioHandlers() {
  if (!introMusic) return;

  introMusic.loop = false;
  introMusic.volume = 0.75;

introMusic.addEventListener("ended", () => {
  setAudioUI("COMPLETE");
});

  introMusic.addEventListener("play", () => {
    musicStarted = true;
    clearRestartTimer();
    setAudioUI("PLAYING");
  });

  introMusic.addEventListener("pause", () => {
    clearRestartTimer();
    if (!muted) setAudioUI("PAUSED");
  });
}

async function tryAutoplay() {
  if (!introMusic || muted) return;

  try {
    await introMusic.play();
    musicStarted = true;
    setAudioUI("PLAYING");
  } catch {
    setAudioUI("AUDIO LOCKED", true);
  }
}

function enableAudioOnOverlayGesture() {
  if (!overlay || !introMusic) return;

  const handler = async () => {
    if (muted || musicStarted) return;
    try {
      await introMusic.play();
      musicStarted = true;
      setAudioUI("PLAYING");
      overlay.removeEventListener("pointerdown", handler);
      overlay.removeEventListener("mousedown", handler);
      overlay.removeEventListener("touchstart", handler);
    } catch {
      setAudioUI("AUDIO LOCKED", true);
    }
  };

  overlay.addEventListener("pointerdown", handler, { passive: true });
  overlay.addEventListener("mousedown", handler, { passive: true });
  overlay.addEventListener("touchstart", handler, { passive: true });
}

function initMuteToggle() {
  if (!muteToggle || !introMusic) return;

  const updateBtn = () => {
    muteToggle.textContent = muted ? "🔇 Muted" : "🔊 Sound";
    muteToggle.setAttribute("aria-pressed", String(muted));
  };

  updateBtn();

  muteToggle.addEventListener("click", () => {
    muted = !muted;
    introMusic.muted = muted;

    if (muted) {
      clearRestartTimer();
      introMusic.pause();
      introMusic.currentTime = 0;
      setAudioUI("MUTED");
    } else {
      setAudioUI("CONNECTING…");
      tryAutoplay();
    }

    updateBtn();
  });
}

function playBeep() {
  if (!beepSound || muted) return;

  try {
    const b = beepSound.cloneNode(true);
    b.volume = 0.12;
    b.play().catch(() => {});
  } catch {
    // ignore
  }
}

// MISSION REPORT
async function typeLine(el, text, speed = 18) {
  if (!el) return;

  el.textContent = "";
  el.classList.add("typing");

  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await new Promise((r) => setTimeout(r, speed));
  }

  el.classList.remove("typing");
}

async function runMissionReport() {
  const lines = $$("[data-report]");
  if (!lines.length) return;

  const original = lines.map((el) => el.textContent.trim());
  lines.forEach((el) => (el.textContent = ""));

  for (let i = 0; i < lines.length; i++) {
    playBeep();
    const speed = i === 0 ? 22 : (i === lines.length - 1 ? 14 : 16);
    await typeLine(lines[i], original[i], speed);
    await new Promise((r) => setTimeout(r, 140));
  }
}

// ENTER OVERLAY
function enterSite() {
  if (!overlay) return;
  overlay.classList.add("is-hidden");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "auto";
  $(".nav__link")?.focus?.();
}

function initOverlay() {
  if (!overlay) return;

  document.body.style.overflow = "hidden";

  enterBtn?.addEventListener("click", enterSite);

  window.addEventListener("keydown", (e) => {
    if (overlay.getAttribute("aria-hidden") === "true") return;
    if (e.key === "Enter") enterSite();
  });
}

// MOBILE NAV
function initMobileNav() {
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  $$(".nav__link").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ACTIVE SECTION
function initActiveSection() {
  const links = $$(".nav__link");
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        links.forEach((l) => {
          l.classList.toggle("is-active", l.getAttribute("href") === `#${id}`);
        });
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((s) => obs.observe(s));
}

// SLIDESHOW
function getSlideSrc(num) {
  return `images/pitch/${num}.png`;
}

function updateSlideCounter() {
  if (pageCounter) {
    pageCounter.textContent = `${currentSlide} / ${totalSlides}`;
  }
}

function showSlide(num) {
  if (!slideImage) return;

  currentSlide = Math.max(1, Math.min(totalSlides, num));
  slideImage.classList.add("fade");

  setTimeout(() => {
    slideImage.src = getSlideSrc(currentSlide);
    slideImage.alt = `Pitch Deck Slide ${currentSlide}`;
    slideImage.classList.remove("fade");
    updateSlideCounter();
  }, 150);
}

function preloadSlides() {
  for (let i = 1; i <= totalSlides; i++) {
    const img = new Image();
    img.src = getSlideSrc(i);
  }
}

function openDeck() {
  if (!deckModal) return;

  deckModal.classList.add("is-open");
  deckModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  showSlide(1);
}

function closeDeck() {
  if (!deckModal) return;

  deckModal.classList.remove("is-open");
  deckModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow =
    overlay?.getAttribute("aria-hidden") === "false" ? "hidden" : "auto";
}

function initSlideModal() {
  openPitchDeck?.addEventListener("click", openDeck);
  openPitchDeck2?.addEventListener("click", openDeck);
  closeModalBtn?.addEventListener("click", closeDeck);

  deckModal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.dataset?.close === "true") closeDeck();
  });

  prevPageBtn?.addEventListener("click", () => showSlide(currentSlide - 1));
  nextPageBtn?.addEventListener("click", () => showSlide(currentSlide + 1));

  slideImage?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
  });

  window.addEventListener("keydown", (e) => {
    if (!deckModal?.classList.contains("is-open")) return;
    if (e.key === "Escape") closeDeck();
    if (e.key === "ArrowLeft") showSlide(currentSlide - 1);
    if (e.key === "ArrowRight") showSlide(currentSlide + 1);
  });
}

// FUNDRAISING
function updateFundUI(animated = true) {
  if (!fundFill || !fundText) return;

  const pct = Math.max(0, Math.min(100, (raised / goal) * 100));
  fundText.textContent = `$${raised.toLocaleString()} / $${goal.toLocaleString()}`;

  if (animated) {
    fundFill.style.transition = "width 700ms ease";
  } else {
    fundFill.style.transition = "none";
  }

  fundFill.style.width = `${pct}%`;
}

window.setRaised = function (amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    console.warn("setRaised expects a number");
    return;
  }

  raised = Math.max(0, Math.min(goal, Math.floor(amount)));
  updateFundUI(true);
};

function initFundraising() {
  copyFundLinkBtn?.addEventListener("click", async () => {
    const link = copyFundLinkBtn.dataset.link || "https://www.gofundme.com/";
    try {
      await navigator.clipboard.writeText(link);
      copyFundLinkBtn.textContent = "Copied!";
      setTimeout(() => {
        copyFundLinkBtn.textContent = "Copy Link";
      }, 1200);
    } catch {
      alert("Copy failed. Please copy manually:\n" + link);
    }
  });

  updateFundUI(false);
}

// CREW RAIL
function initCrewRail() {
  const rail = $("#crewRail");
  if (!rail) return;

  const scrollAmount = 360;

  $$("[data-crew-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-crew-nav");
      rail.scrollBy({
        left: dir === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
      rail.focus({ preventScroll: true });
    });
  });
}

// CLOSE + YEAR
function initClosePage() {
  closePageBtn?.addEventListener("click", () => {
    window.close();
    if (closeMsg) {
      closeMsg.textContent =
        "If the page didn’t close, your browser blocked it. You can safely close this tab.";
    }
  });
}

function initYear() {
  if (year) year.textContent = String(new Date().getFullYear());
}

// INIT
(function init() {
  initOverlay();
  initMobileNav();
  initActiveSection();
  initSlideModal();
  initFundraising();
  initCrewRail();
  initClosePage();
  initYear();

  preloadSlides();
  setTimeout(runMissionReport, 900);

  attachAudioHandlers();
  initMuteToggle();
  setAudioUI("CONNECTING…");
  tryAutoplay();
  enableAudioOnOverlayGesture();
})();