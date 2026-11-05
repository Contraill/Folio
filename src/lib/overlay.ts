import { useRef } from 'react';

/* Overlays render into a container that survives page navigations; see Base.astro. */
export const overlays = () => (typeof document === 'undefined' ? undefined : document.getElementById('overlays'));

/** Dialogs opened from anywhere give focus back to whatever opened them, or to the new page's content. */
export function useReturnFocus() {
  const from = useRef<{ el: Element | null; path: string } | null>(null);
  return {
    onOpenAutoFocus: () => { from.current = { el: document.activeElement, path: location.pathname }; },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      const opener = from.current?.path === location.pathname ? from.current.el : null;
      const target = opener instanceof HTMLElement && opener.isConnected ? opener : document.querySelector('main');
      target?.focus({ preventScroll: true });
    },
  };
}
