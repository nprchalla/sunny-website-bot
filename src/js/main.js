// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('is-active');
    mobileNav.classList.toggle('is-open');
  });

  // Close mobile menu when clicking a link
  const mobileLinks = document.querySelectorAll('.mobile-nav__link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('is-active');
      mobileNav.classList.remove('is-open');
    });
  });
}

// Chat Widget Toggle
const chatTrigger = document.querySelector('.chat-widget__trigger');
const chatWindow = document.querySelector('.chat-widget__window');

if (chatTrigger && chatWindow) {
  chatTrigger.addEventListener('click', () => {
    chatWindow.classList.toggle('is-open');
  });
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    
    // Don't prevent default for empty hash or just "#"
    if (href === '#' || href === '') return;
    
    e.preventDefault();
    
    const target = document.querySelector(href);
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Header background on scroll
const header = document.querySelector('.header');
colorHeaderBg = '#F0F4FF'
colorHeaderBgScrolled = '#F0F4FF'
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.style.backgroundColor = colorHeaderBg;
  } else {
    header.style.backgroundColor = colorHeaderBgScrolled;
  }
  
  lastScroll = currentScroll;
});

// Add animation on scroll (optional enhancement)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements with animation class (you can add this class to elements you want to animate)
document.querySelectorAll('.animate-on-scroll').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});