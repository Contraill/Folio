/** Top-level sections, in menu order. Page transitions move sideways along this order. */
export const MENU = ['projects', 'lab', 'play', 'about', 'cv'] as const;
export type MenuItem = (typeof MENU)[number];

const ORDER = ['home', 'projects', 'project', 'lab', 'play', 'about', 'cv', 'uses', 'now', 'secret', 'missing'];

export function sectionOf(pathname: string): string {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (!first) return 'home';
  if (first === 'projects' && second) return 'project';
  return ORDER.includes(first) ? first : 'missing';
}

/** Vertical rise to and from Home, sideways along the menu everywhere else. */
export function directionOf(from: string, to: string): 'up' | 'fwd' | 'back' {
  const a = sectionOf(from);
  const b = sectionOf(to);
  if (a === 'home' || b === 'home') return 'up';
  return ORDER.indexOf(b) >= ORDER.indexOf(a) ? 'fwd' : 'back';
}

/** Which menu entry is highlighted on a given page, if any. */
export function currentMenuItem(pathname: string): string {
  const section = sectionOf(pathname);
  return section === 'project' ? 'projects' : section;
}
