import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Pages } from '@/content/schema';
import { reducedMotion } from '@/lib/motion';
import { Pet, type Mood } from '@/lib/pet';
import { useStore } from '@/lib/store';
import { useLoop } from './kit';

const PIXEL: Record<string, string> = { graphite: '#eaf2ff', paper: '#f3f6ff', blueprint: '#8fd8ff', terminal: '#7dffa8' };

export function PetCanvas({ interactive = false, mood, onMood, petRef, label }: { interactive?: boolean; mood?: Mood; onMood?: (mood: Mood) => void; petRef?: { current: Pet | null }; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pet = useRef<Pet | null>(null);
  const effective = useStore((s) => s.effective);
  const color = useRef(PIXEL[effective]);
  color.current = PIXEL[effective];
  useEffect(() => {
    if (!ref.current) return;
    pet.current = new Pet(ref.current, (m) => onMood?.(m));
    if (mood) pet.current.set(mood);
    if (petRef) petRef.current = pet.current;
  }, [mood, onMood, petRef]);
  useLoop(ref, (now) => pet.current?.tick(now, color.current), reducedMotion() ? 4 : 30);
  if (!interactive) return <canvas ref={ref} width={128} height={64} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={!label || undefined} />;
  const relative = (e: PointerEvent) => { const b = ref.current!.getBoundingClientRect(); return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]; };
  return (
    <canvas ref={ref} width={128} height={64} role="img" aria-label={label}
      onPointerMove={(e) => { const [x, y] = relative(e); pet.current?.lookAt(x * 2 - 1, y * 2 - 1); if (e.buttons || e.pointerType === 'touch') pet.current?.move(e.clientX); }}
      onPointerDown={() => pet.current?.poke()}
      onPointerLeave={() => { pet.current?.leave(); pet.current?.lookAt(0, 0); }} />
  );
}

export function MochiDevice({ compact = false, c }: { compact?: boolean; c: Pages['mochi'] }) {
  const [mood, setMood] = useState<Mood>('idle');
  const pet = useRef<Pet | null>(null);
  const stroke = useCallback(() => {
    let i = 0;
    const timer = window.setInterval(() => { pet.current?.move(i % 2 ? 0 : 40); if (++i > 16) window.clearInterval(timer); }, 90);
  }, []);
  return (
    <div className="pet-dev">
      <PetCanvas interactive onMood={setMood} petRef={pet} label={compact ? c.shortLabel : c.label} />
      <div className="pet-row">
        <span className="mood" aria-live="polite">Mochi · {c.moods[mood]}</span>
        {!compact && <span className="btns"><button type="button" onClick={() => pet.current?.poke()}>{c.poke}</button><button type="button" onClick={stroke}>{c.pet}</button></span>}
      </div>
    </div>
  );
}

/** Mochi on its own, for pages that are otherwise static. */
export default function Mochi({ c, compact = false }: { c: Pages['mochi']; compact?: boolean }) {
  return <MochiDevice c={c} compact={compact} />;
}

export function DizzyMochi({ label }: { label: string }) {
  return <PetCanvas mood="dizzy" label={label} />;
}
