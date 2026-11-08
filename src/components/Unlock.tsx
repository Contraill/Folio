import { useEffect } from 'react';
import { toast } from 'sonner';
import { type EffectiveSkin, unlockSkin } from '@/lib/store';

/* Unlocks a hidden skin when its page is found, and says so once, quietly: a short note at the bottom, no change to
   the skin in use. The note waits for the toast area, which loads when the browser is idle. */
export default function Unlock({ skin, message }: { skin: EffectiveSkin; message: string }) {
  useEffect(() => {
    if (!unlockSkin(skin)) return;
    let tries = 0;
    const show = () => (document.querySelector('#overlays section[aria-live]') || ++tries > 60 ? toast(message, { duration: 6000 }) : window.setTimeout(show, 150));
    const timer = window.setTimeout(show, 600);
    return () => window.clearTimeout(timer);
  }, [skin, message]);
  return null;
}
