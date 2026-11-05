import { useState } from 'react';

const two = (n: number) => String(n).padStart(2, '0');

export default function MasterDetail({ items, paras }: { items: [string, string][]; paras?: string[] }) {
  const [active, setActive] = useState(0);
  const [title, text] = items[active];
  return (
    <div className="md">
      <div>
        <div className="big-idx tnum" aria-hidden="true">/{two(active + 1)}</div>
        <h3 style={{ fontSize: 26, margin: '0 0 10px', fontWeight: 600 }}>{title}</h3>
        <p className="lede" style={{ maxWidth: '40ch' }}>{text}</p>
        {paras?.map((p) => <p key={p} className="small" style={{ marginTop: 22, maxWidth: '52ch' }}>{p}</p>)}
      </div>
      <ul className="acc">
        {items.map(([t], i) => <li key={t}><button type="button" aria-expanded={i === active} onClick={() => setActive(i)}>{t}<span className="mono tnum" style={{ fontSize: 12, opacity: .7 }}>{two(i + 1)}</span></button></li>)}
      </ul>
    </div>
  );
}
