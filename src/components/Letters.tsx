import { useEffect, useRef, useState } from 'react';

/* The letters from the old coming-soon page. Finding them also unlocks a star in the Play toy box. */
export default function Letters({ label }: { label: string }) {
  const [offset, setOffset] = useState<Record<number, [number, number]>>({});
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<[number, number]>([0, 0]);
  useEffect(() => { try { localStorage.setItem('fx-secret', 'true'); } catch { /* storage unavailable */ } }, []);
  return (
    <div className="letters">
      {[...'IZZET'].map((letter, i) => (
        <button key={i} type="button" className={drag === i ? 'drag' : ''} aria-label={label.replace('{l}', letter)}
          style={{ transform: offset[i] ? `translate(${offset[i][0]}px, ${offset[i][1]}px) rotate(${offset[i][0] / 12}deg)` : undefined }}
          onClick={() => { setOffset((o) => ({ ...o, [i]: [0, -40] })); window.setTimeout(() => setOffset((o) => ({ ...o, [i]: [0, 0] })), 160); }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = [e.clientX, e.clientY]; setDrag(i); }}
          onPointerMove={(e) => { if (drag === i) setOffset((o) => ({ ...o, [i]: [e.clientX - start.current[0], e.clientY - start.current[1]] })); }}
          onPointerUp={() => { setDrag(null); setOffset((o) => ({ ...o, [i]: [0, 0] })); }}>{letter}</button>
      ))}
    </div>
  );
}
