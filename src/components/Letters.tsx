import { useEffect, useRef, useState } from 'react';

/* A greeting in the page's language, as letters to throw around. Finding them unlocks a star in the Play toy box.
   Words stay together, so a narrow screen wraps between them. */
export default function Letters({ word, label }: { word: string; label: string }) {
  const [offset, setOffset] = useState<Record<number, [number, number]>>({});
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    try { localStorage.setItem('fx-secret', 'true'); } catch { /* storage unavailable */ }
  }, []);
  let n = 0;
  return (
    <div className="letters">
      {word.split(' ').map((part, w) => (
        <span key={w} className="letters-word">
          {[...part].map((letter) => {
            const i = n++;
            return (
              <button key={i} type="button" className={drag === i ? 'drag' : ''} aria-label={label.replace('{l}', letter)}
                style={{ transform: offset[i] ? `translate(${offset[i][0]}px, ${offset[i][1]}px) rotate(${offset[i][0] / 12}deg)` : undefined }}
                onClick={() => { setOffset((o) => ({ ...o, [i]: [0, -40] })); window.setTimeout(() => setOffset((o) => ({ ...o, [i]: [0, 0] })), 160); }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = [e.clientX, e.clientY]; setDrag(i); }}
                onPointerMove={(e) => { if (drag === i) setOffset((o) => ({ ...o, [i]: [e.clientX - start.current[0], e.clientY - start.current[1]] })); }}
                onPointerUp={() => { setDrag(null); setOffset((o) => ({ ...o, [i]: [0, 0] })); }}>{letter}</button>
            );
          })}
        </span>
      ))}
    </div>
  );
}
