import * as Dialog from '@radix-ui/react-dialog';
import { Maximize2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Pages } from '@/content/pages';
import type { Img as ImgT, Project } from '@/content/projects';
import { overlays, useReturnFocus } from '@/lib/overlay';
import { Cover } from './Cover';
import { Cut, Img } from './kit';
import { MochiDevice } from './mochi';

export default function CaseMedia({ p, gallery, c, stage, mochi, close }: { p: Project; gallery: [ImgT, string][]; c: Pages['case']; stage: Pages['stage']; mochi: Pages['mochi']; close: string }) {
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState<number | null>(null);
  const returnFocus = useReturnFocus();
  // The collage further down the page is static markup and opens the same lightbox.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.<HTMLElement>('[data-lightbox]');
      if (el) setZoomed(Number(el.dataset.lightbox));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  const item = gallery[current];
  return (
    <>
      <Cut className="cmedia">
        <div className="cut-fill" suppressHydrationWarning>
          {p.kind === 'pixel'
            ? <><div className="kit-bg" /><div style={{ position: 'absolute', left: '50%', top: '50%', width: 'min(78%, 420px)', transform: 'translate(-50%,-50%)' }}><MochiDevice c={mochi} /></div></>
            : item && (p.kind === 'img' || current > 0)
              ? <Img key={item[0].src} im={item[0]} alt={item[1]} pos={current === 0 ? p.pos : '50% 50%'} contain={p.contain} eager />
              : <Cover p={p} variant="hero" eager c={stage} altSuffix={c.screenshot} />}
        </div>
        {gallery.length > 1 && (
          <div className="dock thumbs" data-cut role="group" aria-label={c.screensGroup}>
            {gallery.map(([im, caption], i) => <button key={im.src} type="button" aria-pressed={i === current} aria-label={c.show.replace('{n}', caption)} onClick={() => setCurrent(i)}><img src={im.src} width={im.w} height={im.h} alt="" loading="lazy" /></button>)}
          </div>
        )}
        {gallery.length > 0 && <div className="dock zoom" data-cut><button type="button" className="circle" aria-label={c.enlargeScreen} onClick={() => setZoomed(current)}><Maximize2 size={16} aria-hidden="true" /></button></div>}
      </Cut>
      <Dialog.Root open={zoomed !== null} onOpenChange={(open) => { if (!open) setZoomed(null); }}>
        <Dialog.Portal container={overlays()}>
          <Dialog.Overlay className="ov-scrim" />
          <Dialog.Content className="ov-dialog ov-lightbox" {...returnFocus}>
            <Dialog.Title className="sr">{zoomed !== null ? gallery[zoomed]?.[1] : ''}</Dialog.Title>
            <Dialog.Description className="sr">{c.enlarged}</Dialog.Description>
            {zoomed !== null && gallery[zoomed] && <img src={gallery[zoomed][0].src} width={gallery[zoomed][0].w} height={gallery[zoomed][0].h} alt={gallery[zoomed][1]} />}
            <Dialog.Close className="ov-close"><X aria-hidden="true" /><span className="sr">{close}</span></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
