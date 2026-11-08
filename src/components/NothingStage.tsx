import { type CSSProperties, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import type { Pages } from '@/content/schema';
import { reducedMotion } from '@/lib/motion';

type Focus = { x: number; y: number; s?: number };
type Copy = Pages['stage']['nothing'];

/* Nothing KDE's own hero: a working miniature of what the theme puts on a Plasma desktop. The island at the top opens
   into its control centre (Wi-Fi, Bluetooth, sound, brightness, power profile); a volume change briefly takes the
   clock's place, as it does in the theme; the dot-matrix clock and the date tile are the theme's desktop widgets.
   It keeps the theme's black glass whatever Folio's skin. The clock ticks only while this slide is shown. */

// 5 × 7 dot-matrix digits, as the theme's clock draws them.
const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};
function Dots({ text }: { text: string }) {
  return (
    <span className="nk-dots" aria-hidden="true">
      {[...text].map((ch, i) => ch === ':'
        ? <span key={i} className="nk-colon"><i /><i /></span>
        : <span key={i} className="nk-digit">{(DIGITS[ch] ?? BLANK).join('').split('').map((b, j) => <i key={j} className={b === '1' ? 'on' : ''} />)}</span>)}
    </span>
  );
}
// Before the visitor's time is known (the build, hydration): an unlit cell.
const BLANK = Array<string>(7).fill('00000');
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function NothingStage({ active = true, focus, c, locale }: { active?: boolean; focus: Focus; c: Copy; locale: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(false);
  const [volume, setVolume] = useState(64);
  const [light, setLight] = useState(100);
  const [profile, setProfile] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const volumeTimer = useRef(0);
  const panel = useId();

  // The time is the visitor's, filled in after hydration; it ticks only while this slide is shown.
  useEffect(() => {
    setNow(new Date());
    if (!active) return;
    const t = window.setInterval(() => setNow(new Date()), reducedMotion() ? 60_000 : 5_000);
    return () => window.clearInterval(t);
  }, [active]);
  useEffect(() => { if (!active) setOpen(false); }, [active]);

  const changeVolume = (v: number) => {
    setVolume(v);
    setShowVolume(true);
    window.clearTimeout(volumeTimer.current);
    volumeTimer.current = window.setTimeout(() => setShowVolume(false), 1400);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); } };
  const day = now ? new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(now).replace('.', '') : '';
  const date = now ? String(now.getDate()) : '';
  const time = now ? hhmm(now) : '--:--';
  const vars = { '--fx': `${focus.x * 100}%`, '--fy': `${focus.y * 100}%`, '--ns': focus.s ?? 1, '--light': light / 100 } as CSSProperties;

  return (
    <div className={'nk' + (active && !reducedMotion() ? ' is-live' : '')} style={vars} onKeyDown={onKey} role="group" aria-label={c.label}>
      <div className="nk-wall" aria-hidden="true"><i className="g1" /><i className="g2" /><i className="g3" /></div>
      <div className="nk-scene">
        <div className="nk-island-wrap">
          <button type="button" className={'nk-island' + (open ? ' open' : '')} aria-expanded={open} aria-controls={panel} onClick={() => setOpen((x) => !x)}>
            <span className="nk-ws" aria-hidden="true"><b /><i /><i /></span>
            <span className="nk-time tnum">{showVolume ? <span className="nk-vol"><span style={{ width: `${volume}%` }} /></span> : time}</span>
            <span className="nk-tray" aria-hidden="true"><i className={wifi ? 'on' : ''} /><i className={bt ? 'on' : ''} /></span>
            <span className="sr">{open ? c.close : c.open}</span>
          </button>
          <div id={panel} className="nk-cc" hidden={!open}>
            <div className="nk-cc-head"><Dots text={time} /><span>{c.island}</span></div>
            <div className="nk-tiles">
              <button type="button" className="nk-tile" aria-pressed={wifi} onClick={() => setWifi((x) => !x)}><b>Wi-Fi</b><span>{wifi ? c.on : c.off}</span></button>
              <button type="button" className="nk-tile" aria-pressed={bt} onClick={() => setBt((x) => !x)}><b>Bluetooth</b><span>{bt ? c.on : c.off}</span></button>
            </div>
            <label className="nk-slide"><span>{c.sound}</span><input type="range" min={0} max={100} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} /></label>
            <label className="nk-slide"><span>{c.brightness}</span><input type="range" min={30} max={100} value={light} onChange={(e) => setLight(Number(e.target.value))} /></label>
            <div className="nk-profiles" role="group" aria-label={c.profiles}>
              {[c.saver, c.balanced, c.performance].map((name, i) => <button key={name} type="button" aria-pressed={profile === i} onClick={() => setProfile(i)}>{name}</button>)}
            </div>
          </div>
        </div>
        <div className="nk-clock" aria-hidden="true"><Dots text={time} /></div>
        <div className="nk-date" aria-hidden="true"><span>{day}</span><b>{date}</b></div>
        <div className="nk-dock" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
      </div>
    </div>
  );
}
