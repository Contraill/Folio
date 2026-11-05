import * as Dialog from '@radix-ui/react-dialog';
import { navigate } from 'astro:transitions/client';
import { Command } from 'cmdk';
import { FileText, FolderOpen, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Messages } from '@/i18n/messages';
import { overlays, useReturnFocus } from '@/lib/overlay';
import { setSearchOpen, useStore } from '@/lib/store';

export type SearchIndex = {
  projects: { href: string; name: string; meta: string; terms: string }[];
  pages: { href: string; label: string; note: string }[];
};

export default function SearchPalette({ t }: { t: Messages }) {
  const open = useStore((s) => s.searchOpen);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  useEffect(() => { if (!open) setQ(''); }, [open]);
  useEffect(() => {
    if (!open || index) return;
    fetch('/search-index.json').then((r) => r.json()).then(setIndex).catch(() => setIndex({ projects: [], pages: [] }));
  }, [open, index]);
  const returnFocus = useReturnFocus();
  const go = (href: string) => { setSearchOpen(false); navigate(href); };
  return (
    <Dialog.Root open={open} onOpenChange={setSearchOpen}>
      <Dialog.Portal container={overlays()}>
        <Dialog.Overlay className="ov-scrim" />
        <Dialog.Content className="ov-dialog ov-palette" {...returnFocus}>
          <Dialog.Title className="sr">{t.searchTitle}</Dialog.Title>
          <Dialog.Description className="sr">{t.searchHint}</Dialog.Description>
          <Command>
            <div cmdk-input-wrapper="">
              <Search aria-hidden="true" />
              <Command.Input aria-label={t.searchPlaceholder} placeholder={t.searchPlaceholder} value={q} onValueChange={setQ} />
            </div>
            <Command.List>
              {index && <Command.Empty>{t.searchEmpty.replace('{q}', q)}</Command.Empty>}
              <Command.Group heading={t.searchProjects}>
                {index?.projects.map((p) => (
                  <Command.Item key={p.href} value={`${p.name} ${p.terms}`} onSelect={() => go(p.href)}>
                    <FolderOpen aria-hidden="true" /><span style={{ flex: 1 }}>{p.name}</span><span className="mono" style={{ fontSize: 12, opacity: .6 }}>{p.meta}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading={t.searchPages}>
                {index?.pages.map((p) => (
                  <Command.Item key={p.href} value={`${p.label} ${p.note}`} onSelect={() => go(p.href)}>
                    <FileText aria-hidden="true" /><span style={{ flex: 1 }}>{p.label}</span><span style={{ fontSize: 12, opacity: .6 }}>{p.note}</span>
                  </Command.Item>
                ))}
                {/* An easter egg, not a listing: it only ever shows for this exact word. */}
                {q.trim().toLowerCase() === 'secret' && (
                  <Command.Item value="secret" onSelect={() => go('/secret')}><FileText aria-hidden="true" /><span style={{ flex: 1 }}>/secret</span></Command.Item>
                )}
              </Command.Group>
            </Command.List>
          </Command>
          <Dialog.Close className="ov-close"><X aria-hidden="true" /><span className="sr">{t.close}</span></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
