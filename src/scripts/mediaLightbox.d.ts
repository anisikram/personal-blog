export type LightboxTarget = HTMLElement | SVGElement;

export interface MediaLightboxOptions {
  targetSelector: string;
  lightboxId: string;
  contentId: string;
  closeSelector?: string;
}

export function initMediaLightbox(options: MediaLightboxOptions): void;

export default initMediaLightbox;
