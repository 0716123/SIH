let activeModal = null;

export function openModal({ title, content, footer = '', size = 'md', onClose = null }) {
  closeModal();

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

  backdrop.innerHTML = `
    <div class="modal-dialog ${sizeClass}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn btn-icon-sm btn-outline close-btn" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  if (typeof content !== 'string' && content instanceof HTMLElement) {
    backdrop.querySelector('.modal-body').appendChild(content);
  }

  modalRoot.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('active'));

  const close = () => {
    backdrop.classList.remove('active');
    setTimeout(() => {
      backdrop.remove();
      if (onClose) onClose();
      activeModal = null;
    }, 250);
  };

  backdrop.querySelector('.close-btn').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', onKeydown);
    }
  };
  window.addEventListener('keydown', onKeydown);

  activeModal = { backdrop, close };
  return activeModal;
}

export function closeModal() {
  if (activeModal) {
    activeModal.close();
    activeModal = null;
  }
}
