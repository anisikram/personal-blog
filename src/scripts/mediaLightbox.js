/**
 * @typedef {HTMLElement | SVGElement} LightboxTarget
 */

/**
 * @typedef {Object} MediaLightboxOptions
 * @property {string} targetSelector
 * @property {string} lightboxId
 * @property {string} contentId
 * @property {string} [closeSelector]
 */

/**
 * @typedef {Object} InternalState
 * @property {HTMLElement | SVGElement | null} lastFocusedElement
 */

const DEFAULT_CLOSE_SELECTOR = '[data-close-lightbox]';

/**
 * @param {Element} element
 */
const ensureInteractiveAttributes = element => {
  element.classList.add('cursor-zoom-in');

  if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'button');
  }

  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }

  if (!element.hasAttribute('aria-label')) {
    element.setAttribute('aria-label', 'Agrandir la visualisation');
  }
};

/**
 * @param {SVGElement} svg
 * @returns {SVGElement}
 */
const cloneSvgWithResponsiveDimensions = svg => {
  const clone = svg.cloneNode(true);

  if (!(clone instanceof SVGElement)) {
    return svg;
  }

  clone.removeAttribute('width');
  clone.removeAttribute('height');

  const viewBox = clone.getAttribute('viewBox');
  const padding = 96;
  const maxWidth = Math.max(320, window.innerWidth - padding);
  const maxHeight = Math.max(240, window.innerHeight - padding);

  if (!viewBox) {
    clone.style.width = `${maxWidth}px`;
    clone.style.height = 'auto';
    return clone;
  }

  const parts = viewBox.trim().split(/\s+/);
  const vbWidth = parseFloat(parts[2] ?? '0');
  const vbHeight = parseFloat(parts[3] ?? '0');

  if (vbWidth > 0 && vbHeight > 0) {
    const widthBasedHeight = (maxWidth * vbHeight) / vbWidth;
    if (widthBasedHeight <= maxHeight) {
      clone.style.width = `${maxWidth}px`;
      clone.style.height = `${widthBasedHeight}px`;
    } else {
      const heightBasedWidth = (maxHeight * vbWidth) / vbHeight;
      clone.style.width = `${heightBasedWidth}px`;
      clone.style.height = `${maxHeight}px`;
    }
  } else {
    clone.style.width = `${maxWidth}px`;
    clone.style.height = 'auto';
  }

  return clone;
};

/**
 * @param {LightboxTarget} element
 * @returns {LightboxTarget}
 */
const cloneElementForLightbox = element => {
  if (element instanceof SVGElement) {
    return cloneSvgWithResponsiveDimensions(element);
  }
  return /** @type {HTMLElement} */ (element.cloneNode(true));
};

/**
 * @param {Element} element
 * @returns {boolean}
 */
const isAlreadyBound = element => {
  if ('dataset' in element && element.dataset) {
    return element.dataset.lightboxBound === 'true';
  }
  return element.getAttribute('data-lightbox-bound') === 'true';
};

/**
 * @param {Element} element
 */
const markAsBound = element => {
  if ('dataset' in element && element.dataset) {
    element.dataset.lightboxBound = 'true';
  } else {
    element.setAttribute('data-lightbox-bound', 'true');
  }
};

/**
 * @param {LightboxTarget} element
 * @param {HTMLElement} lightbox
 * @param {HTMLElement} lightboxContent
 * @param {HTMLElement} closeButton
 * @param {InternalState} state
 */
const openLightbox = (element, lightbox, lightboxContent, closeButton, state) => {
  state.lastFocusedElement = element;
  const clone = cloneElementForLightbox(element);

  lightboxContent.innerHTML = '';
  lightboxContent.appendChild(clone);

  lightbox.classList.remove('hidden');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overflow-hidden');
  closeButton.focus();
};

/**
 * @param {HTMLElement} lightbox
 * @param {HTMLElement} lightboxContent
 * @param {HTMLElement} closeButton
 * @param {InternalState} state
 */
const closeLightbox = (lightbox, lightboxContent, closeButton, state) => {
  if (lightbox.classList.contains('hidden')) {
    return;
  }

  lightbox.classList.add('hidden');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxContent.innerHTML = '';
  document.body.classList.remove('overflow-hidden');

  const { lastFocusedElement } = state;
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }

  closeButton.blur();
  state.lastFocusedElement = null;
};

/**
 * @param {Element} element
 * @param {{ open: (target: LightboxTarget) => void }} handlers
 */
const bindMediaElement = (element, handlers) => {
  if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
    return;
  }

  if (isAlreadyBound(element)) {
    return;
  }

  markAsBound(element);
  ensureInteractiveAttributes(element);

  element.addEventListener('click', event => {
    event.stopPropagation();
    handlers.open(element);
  });

  element.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      handlers.open(element);
    }
  });
};

/**
 * @param {MediaLightboxOptions} options
 */
export const initMediaLightbox = ({
  targetSelector,
  lightboxId,
  contentId,
  closeSelector = DEFAULT_CLOSE_SELECTOR,
}) => {
  const lightbox = document.getElementById(lightboxId);
  const lightboxContent = document.getElementById(contentId);
  const closeButton = lightbox?.querySelector(closeSelector);

  if (!lightbox || !lightboxContent || !(closeButton instanceof HTMLElement)) {
    return;
  }

  if (lightbox.dataset.lightboxInitialized === 'true') {
    return;
  }

  lightbox.dataset.lightboxInitialized = 'true';

  /** @type {InternalState} */
  const state = {
    lastFocusedElement: null,
  };

  const handleClose = () => closeLightbox(lightbox, lightboxContent, closeButton, state);
  const handleOpen = element => openLightbox(element, lightbox, lightboxContent, closeButton, state);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      handleClose();
    }
  });

  closeButton.addEventListener('click', handleClose);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      handleClose();
    }
  });

  const mediaElements = document.querySelectorAll(targetSelector);
  mediaElements.forEach(element => bindMediaElement(element, { open: handleOpen }));
};

export default initMediaLightbox;
