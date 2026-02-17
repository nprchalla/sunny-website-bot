// Accordion functionality
document.addEventListener('DOMContentLoaded', () => {
  const accordionHeaders = document.querySelectorAll('.accordion__header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const content = item.querySelector('.accordion__content');
      const icon = header.querySelector('.accordion__icon');
      
      // Check if this item is already open
      const isOpen = content.classList.contains('is-open');
      
      // Close all accordion items
      document.querySelectorAll('.accordion__content').forEach(c => {
        c.classList.remove('is-open');
        c.style.maxHeight = null;
      });
      
      document.querySelectorAll('.accordion__item').forEach(i => {
        i.classList.remove('is-open');
      });
      
      // If the item wasn't open, open it
      if (!isOpen) {
        content.classList.add('is-open');
        item.classList.add('is-open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
});