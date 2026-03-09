// ─────────────────────────────────────────────
// EmailJS Configuration
// ─────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'Ua7PSP1H1H7zgkGOL';
const EMAILJS_SERVICE_ID  = 'service_ids';
const EMAILJS_TEMPLATE_ID = 'template_contact';

// ─────────────────────────────────────────────
// Wait for DOM before doing anything
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Initialise EmailJS
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  // DOM refs — all inside DOMContentLoaded so they're guaranteed to exist
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const successMsg = document.getElementById('form-success');
  const errorMsg   = document.getElementById('form-error');

  if (!form || !submitBtn || !successMsg || !errorMsg) return;

  const btnText = submitBtn.querySelector('.contact-form__btn-text');
  const spinner = submitBtn.querySelector('.contact-form__btn-spinner');

  // Ensure banners are hidden on load regardless of CSS
  successMsg.hidden = true;
  errorMsg.hidden   = true;
  successMsg.classList.remove('is-visible');
  errorMsg.classList.remove('is-visible');

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  function setLoading(loading) {
    submitBtn.disabled    = loading;
    btnText.style.opacity = loading ? '0' : '1';
    spinner.style.display = loading ? 'block' : 'none';
  }

  function showMessage(el) {
    [successMsg, errorMsg].forEach(m => {
      m.hidden = true;
      m.classList.remove('is-visible');
    });
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-visible'));
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function validateForm() {
    let valid = true;
    form.querySelectorAll('[required]').forEach(input => {
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

  // Clear error state as user types
  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('has-error'));
  });

  // ─────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    successMsg.hidden = true;
    errorMsg.hidden   = true;
    successMsg.classList.remove('is-visible');
    errorMsg.classList.remove('is-visible');

    if (!validateForm()) return;

    setLoading(true);

    const templateParams = {
      from_name:  `${form.first_name.value.trim()} ${form.last_name.value.trim()}`,
      from_email: form.email.value.trim(),
      message:    form.message.value.trim(),
      time:       new Date().toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
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

});