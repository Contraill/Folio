import { Maximize2, Minimize2, Play } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Arrow } from './kit';

type Copy = { start: string; newTab: string; fullscreen: string; exitFullscreen: string; loading: string; slow: string; noEmbed: string; frameLabel: string };
type Props = { name: string; path: string; embed: boolean; aspect: string; locale: string; poster?: string; c: Copy };

/* A game or lab app framed in the page. It loads only when asked to (nothing runs until then), and the same link
   opens it in its own tab, also without JavaScript. The app is this site's own files at /<kind>/<id>/app/, told the
   visitor's language and skin in its address (`?folio=1&lang=…&skin=…`). Being the same origin, its storage is the
   site's: saved games and lab runs survive in the frame and in a tab alike. The sandbox keeps it to what an app
   needs (no top navigation, no forms); with the same origin it is not a security boundary, which is why only the
   owner's own repositories, built and checked by the controller, are ever served here. */
export default function AppFrame({ name, path, embed, aspect, locale, poster, c }: Props) {
  const skin = useStore((s) => s.effective);
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'slow' | 'running'>('idle');
  const [full, setFull] = useState(false);
  const [canFull, setCanFull] = useState(false);
  const fill = (text: string) => text.replace('{n}', name);
  const [w, h] = aspect.split(':').map(Number);

  useEffect(() => {
    setCanFull(!!document.fullscreenEnabled);
    const onChange = () => setFull(document.fullscreenElement === shell.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (state !== 'loading') return;
    const late = window.setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), 10_000);
    return () => window.clearTimeout(late);
  }, [state]);

  const src = () => {
    const address = new URL(path, location.href);
    address.searchParams.set('folio', '1');
    address.searchParams.set('lang', locale);
    address.searchParams.set('skin', skin);
    return address.href;
  };

  return (
    // Full screen takes the frame and its buttons, so leaving it is a button away on every device.
    <div ref={shell} className="app-frame" data-state={state}>
      <div className="app-box" style={{ '--ar': `${w} / ${h}` } as CSSProperties}>
        {state === 'idle' ? (
          <a className="app-poster" href={path} target="_blank" rel="noreferrer"
            onClick={(e) => { if (!embed) return; e.preventDefault(); setState('loading'); }}>
            {poster && <img src={poster} alt="" loading="lazy" decoding="async" />}
            <span className="app-start">
              <span className="app-play" aria-hidden="true">{embed ? <Play size={22} /> : <Arrow size={22} />}</span>
              <span>{embed ? fill(c.start) : fill(c.noEmbed)}</span>
            </span>
          </a>
        ) : (
          <iframe ref={frame} src={src()} title={fill(c.frameLabel)} allow="fullscreen; gamepad; autoplay; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-downloads allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => { setState('running'); frame.current?.focus(); }} />
        )}
        {(state === 'loading' || state === 'slow') && <p className="app-note" role="status">{state === 'slow' ? c.slow : fill(c.loading)}</p>}
      </div>
      <div className="app-bar">
        {canFull && state !== 'idle' && (
          <button type="button" className="btn btn-2 btn-sm" onClick={() => (full ? document.exitFullscreen() : shell.current?.requestFullscreen())}>
            {full ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />} {full ? c.exitFullscreen : c.fullscreen}
          </button>
        )}
        <a className="btn btn-2 btn-sm" href={path} target="_blank" rel="noreferrer">{c.newTab} <Arrow size={15} /></a>
      </div>
    </div>
  );
}
