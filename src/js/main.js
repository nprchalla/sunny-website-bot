// Import global styles so Vite bundles SCSS into dist/assets/*.css
import "../scss/main.scss";

// ---------------------------
// Mobile Menu Toggle
// ---------------------------
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("is-active");
    mobileNav.classList.toggle("is-open");
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll(".mobile-nav__link").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("is-active");
      mobileNav.classList.remove("is-open");
    });
  });
}

// ---------------------------
// Chat Widget Toggle
// NOTE: Your HTML doesn't include .chat-widget__window (it's commented out).
// So we toggle the ElevenLabs widget element if present.
// ---------------------------
const chatTrigger = document.querySelector(".chat-widget__trigger");
const elevenWidget = document.querySelector("elevenlabs-convai");

if (chatTrigger && elevenWidget) {
  chatTrigger.addEventListener("click", () => {
    elevenWidget.classList.toggle("is-open");
  });
}

// Optional: If you prefer toggling the entire widget container instead,
// replace the above with toggling ".chat-widget".

// ---------------------------
// Smooth Scrolling for Anchor Links
// ---------------------------
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");

    // Don't prevent default for empty hash or just "#"
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  });
});

// ---------------------------
// Header background on scroll
// ---------------------------
const header = document.querySelector(".header");
const colorHeaderBg = "#F0F4FF";
const colorHeaderBgScrolled = "#F0F4FF";

if (header) {
  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
      header.style.backgroundColor = colorHeaderBg;
    } else {
      header.style.backgroundColor = colorHeaderBgScrolled;
    }
  });
}

// ---------------------------
// Animation on scroll (optional enhancement)
// ---------------------------
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(el);
});