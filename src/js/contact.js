// ─────────────────────────────────────────────
// EmailJS Configuration
// Replace these three values with your own from
// https://dashboard.emailjs.com
// ─────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'Ua7PSP1H1H7zgkGOL';   // Account > API Keys
const EMAILJS_SERVICE_ID  = 'service_ids';   // Email Services tab
const EMAILJS_TEMPLATE_ID = 'template_contact';  // Email Templates tab

// ─────────────────────────────────────────────
// Initialise EmailJS
// ─────────────────────────────────────────────
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
const form       = document.getElementById('contact-form');
const submitBtn  = document.getElementById('submit-btn');
const btnText    = submitBtn.querySelector('.contact-form__btn-text');
const spinner    = submitBtn.querySelector('.contact-form__btn-spinner');
const successMsg = document.getElementById('form-success');
const errorMsg   = document.getElementById('form-error');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function setLoading(loading) {
  submitBtn.disabled = loading;
  btnText.style.opacity  = loading ? '0' : '1';
  spinner.style.display  = loading ? 'block' : 'none';
}

function showMessage(el) {
  // Hide both first, then reveal the target
  [successMsg, errorMsg].forEach(m => {
    m.hidden = true;
    m.classList.remove('is-visible');
  });
  el.hidden = false;
  // Slight delay so the browser paints the unhidden state before animating
  requestAnimationFrame(() => el.classList.add('is-visible'));
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validateForm() {
  let valid = true;
  const required = form.querySelectorAll('[required]');

  required.forEach(input => {
    const wrapper = input.closest('.contact-form__field') || input.closest('.contact-form__group');
    input.classList.remove('has-error');

    if (!input.value.trim()) {
      input.classList.add('has-error');
      valid = false;
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      input.classList.add('has-error');
      valid = false;
    }
  });

  return valid;
}

// Clear error highlight on input
form.querySelectorAll('input, textarea').forEach(input => {
  input.addEventListener('input', () => input.classList.remove('has-error'));
});

// ─────────────────────────────────────────────
// Submit handler
// ─────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Hide any previous status messages
  successMsg.hidden = true;
  errorMsg.hidden   = true;
  successMsg.classList.remove('is-visible');
  errorMsg.classList.remove('is-visible');

  if (!validateForm()) return;

  setLoading(true);

  // Build the template params.
  // The keys here must match the {{variables}} in your EmailJS template.
  const templateParams = {
    from_name: `${form.first_name.value.trim()} ${form.last_name.value.trim()}`,
    from_email: form.email.value.trim(),
    message:    form.message.value.trim(),
    time:       new Date().toLocaleString('en-US', {
                                            weekday: 'short', year: 'numeric', month: 'short',
                                            day: 'numeric', hour: '2-digit', minute: '2-digit',
                                          })
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    showMessage(successMsg);
    form.reset();
  } catch (err) {
    console.error('EmailJS error:', err);
    showMessage(errorMsg);
  } finally {
    setLoading(false);
  }
});