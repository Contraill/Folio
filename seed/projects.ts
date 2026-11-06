/* Projects as first written, loaded into an empty content store by `pnpm db:seed`. Every project here becomes a
   candidate; only those in PUBLISHED are listed on the site. Public repositories only: never add private work here. */
import type { Img, Project } from '../src/content/schema.ts';
import type { Locale } from '../src/i18n/locale.ts';

export const A = (f: string, w: number, h: number): Img => ({ src: '/assets/' + f, w, h });

export const PROJECTS: Project[] = [
  { id: 'nodesk', name: 'Nodesk', repo: 'Nodesk', d: 2, lang: 'Python', date: '2026-10-28', since: 'Oct 2026', stars: 0, kind: 'img', img: A('card_nodesk.webp', 900, 562), pos: '50% 0%', home: 'https://contraill.github.io/Nodesk/', desc: 'Live network topology map for home networks that runs on a Raspberry Pi and does no port scanning.', topics: ['homelab', 'network-map', 'openwrt', 'tailscale'] },
  { id: 'mochi', name: 'Mochi', repo: 'mochi', d: 3, lang: 'C++', date: '2026-10-23', since: 'Oct 2026', stars: 0, kind: 'pixel', tint: ['#8a5a3c', '#2f3d5c'], desc: 'Animated OLED desk companion on ESP32-C3 that reacts to touch, petting and shaking.', topics: ['esp32-c3', 'arduino', 'oled', 'desk-companion'] },
  { id: 'orbis', name: 'Orbis', repo: 'Orbis', d: 2, lang: 'Python', date: '2026-10-06', since: 'Oct 2026', stars: 0, kind: 'img', img: A('card_orbis.webp', 900, 556), hero: A('hero_orbis.webp', 1683, 1039), pos: '50% 38%', desc: 'Self-hosted cinematic media platform with profiles, adaptive playback, Watch Together and TV launchers.', topics: ['fastapi', 'react', 'docker', 'raspberry-pi'] },
  { id: 'nothing', name: 'Nothing KDE Theme', repo: 'Nothing-Kde-Theme', d: 1, lang: 'QML', date: '2026-09-16', since: 'Sep 2026', stars: 11, kind: 'img', img: A('card_nothing_cc.webp', 700, 394), hero: A('hero_nothing.webp', 1800, 1012), pos: '70% 50%', desc: 'Nothing-inspired KDE Plasma 6 theme suite with glassy styling, custom panels, widgets and light/dark integration.', topics: ['kde-plasma', 'plasma6', 'kvantum', 'aurorae'] },
  { id: 'zen', name: 'zen-polarity', repo: 'zen-polarity', d: 1, lang: 'Shell', date: '2026-09-13', since: 'Sep 2026', stars: 0, kind: 'img', img: A('card_zen.webp', 304, 369), contain: true, desc: 'Minimal Zen Browser mod with native adaptive theming and accent-aware window controls.', topics: ['zen-browser', 'userchrome', 'kde-plasma', 'theme'] },
  { id: 'helios', name: 'Helios', repo: 'Helios', d: 0, lang: 'TypeScript', date: '2026-07-17', since: 'Jul 2026', stars: 0, kind: 'img', img: A('helios_cover.webp', 795, 895), hero: A('hero_helios.webp', 1600, 857), pos: '58% 50%', home: 'https://heliios.vercel.app', desc: 'Interactive 3D solar-system explorer with sourced NASA/JPL data, human-scale comparisons and EN/TR support.', topics: ['react-three-fiber', 'nextjs', 'webgl', 'nasa-api'] },
  { id: 'campuseats', name: 'CampusEats', repo: 'CampusEats', d: 0, lang: 'JavaScript', date: '2026-06-08', since: 'Jun 2026', stars: 0, kind: 'img', img: A('card_campus.webp', 900, 562), pos: '0% 0%', desc: 'Fully local, QR-based campus restaurant ordering with admin and manager panels, live orders and PWA support.', topics: ['react', 'express', 'socket-io', 'sqlite'] },
  { id: 'huepr', name: 'huepr', repo: 'huepr', d: 1, lang: 'JavaScript', date: '2026-03-18', since: 'Mar 2026', stars: 1, kind: 'browser', tint: ['#2f8f8a', '#5a3d8f'], img: A('huepr_aurora.webp', 1086, 804), hero: A('huepr_aurora.webp', 1086, 804), pos: '0% 0%', desc: 'Hyprland wallpaper to browser theme: injects CSS variables into allowlisted sites via Native Messaging.', topics: ['hyprland', 'webextension', 'native-messaging', 'theming'] },
  { id: 'architect', name: 'Architect Office', repo: 'Architect-Office-MGMT-System', d: 4, lang: 'Java', date: '2026-01-05', since: 'Jan 2026', stars: 0, kind: 'img', img: A('card_architect.webp', 900, 568), pos: '50% 0%', desc: 'Java Swing + MySQL desktop app for an architecture office: architects, clients, projects, drawings and payments.', topics: ['java', 'swing', 'mysql', 'flatlaf'] },
  { id: 'grading', name: 'Student Grading', repo: 'Student-Grading-System', d: 4, lang: 'Java', date: '2026-01-04', since: 'Jan 2026', stars: 0, kind: 'img', img: A('card_grading.webp', 900, 568), pos: '50% 0%', desc: 'Java Swing + MySQL desktop app for students, departments, courses, grades and attendance.', topics: ['java', 'swing', 'mysql', 'jdbc'] },
  { id: 'emu', name: 'EMU Event Reporting', repo: 'EMU-Activity-and-Event-Reporting', d: 0, lang: 'PHP', date: '2025-12-27', since: 'Dec 2025', stars: 0, kind: 'img', img: A('card_emu.webp', 900, 567), pos: '50% 0%', desc: 'Bilingual PHP portal for tagging university events with sustainability criteria and exporting reports.', topics: ['php', 'bootstrap5', 'jspdf', 'sdg'] },
  { id: 'schedule', name: 'Syntax Schedule', repo: 'Syntax-Schedule', d: 0, lang: 'HTML', date: '2025-09-27', since: 'Sep 2025', stars: 0, kind: 'img', img: A('card_schedule.webp', 700, 989), pos: '50% 0%', desc: 'Print-ready weekly course schedule in pure HTML and CSS, optimized for A4 and color-coded.', topics: ['html', 'css', 'print'] },
  { id: 'bct', name: 'Breast Cancer Tracker', repo: 'Breast-Cancer-Tracker', d: 0, lang: 'Vue', date: '2025-07-27', since: 'Summer 2025', stars: 0, kind: 'img', img: A('card_bct.webp', 900, 633), pos: '50% 0%', home: 'https://breastcancertracking.web.app', desc: 'Vue + Firebase screening questionnaire with authentication and admin workflows. Started as an internship project.', topics: ['vue', 'firebase', 'firestore', 'internship-project'] },
  { id: 'adventure', name: 'Programming Adventure', repo: 'Programming-Adventure', d: 0, lang: 'HTML', date: '2023-10-15', since: 'Fall 2023', stars: 0, kind: 'img', img: A('card_adventure.webp', 900, 562), pos: '50% 0%', home: 'https://contraill.github.io/Programming-Adventure/', desc: 'Hand-written HTML/CSS/JS personal blog, built as a term project in fall 2023. Where it started.', topics: ['html', 'css', 'javascript', 'static-site'] },
];

/* Explicit choices, never derived from GitHub. PUBLISHED: what the site lists, in this order. */
export const PUBLISHED = ['huepr', 'helios', 'nothing', 'orbis', 'campuseats', 'bct', 'mochi'];
export const FEATURED = ['helios', 'huepr', 'mochi'];
export const SELECTED = ['orbis', 'campuseats', 'bct', 'nothing'];

export const TR: Record<string, { desc: string; since: string }> = {
  nodesk: { since: 'Eki 2026', desc: 'Ev ağları için canlı ağ topolojisi haritası. Raspberry Pi üzerinde çalışır, port taraması yapmaz.' },
  mochi: { since: 'Eki 2026', desc: 'ESP32-C3 üzerinde çalışan animasyonlu OLED masa arkadaşı. Dokunmaya, sevmeye ve sallanmaya tepki verir.' },
  orbis: { since: 'Eki 2026', desc: 'Profiller, uyarlanabilir oynatma, Watch Together ve TV arayüzleri olan self-hosted medya platformu.' },
  nothing: { since: 'Eyl 2026', desc: 'KDE Plasma 6 için Nothing esintili tema paketi: cam görünüm, özel paneller, widget’lar ve açık/koyu uyumu.' },
  zen: { since: 'Eyl 2026', desc: 'Yerel uyarlanabilir tema ve vurgu rengine uyan pencere kontrolleri sunan sade bir Zen Browser modu.' },
  helios: { since: 'Tem 2026', desc: 'Kaynağı belli NASA/JPL verisi, insan ölçeğinde karşılaştırmalar ve EN/TR desteğiyle etkileşimli 3D Güneş Sistemi gezgini.' },
  campuseats: { since: 'Haz 2026', desc: 'Tamamen yerel, QR tabanlı kampüs restoranı sipariş sistemi: yönetici panelleri, canlı siparişler ve PWA desteği.' },
  huepr: { since: 'Mar 2026', desc: 'Hyprland duvar kâğıdından tarayıcı temasına: izin verilen sitelere Native Messaging ile CSS değişkenleri ekler.' },
  architect: { since: 'Oca 2026', desc: 'Mimarlık ofisi için Java Swing + MySQL masaüstü uygulaması: mimarlar, müşteriler, projeler, çizimler ve ödemeler.' },
  grading: { since: 'Oca 2026', desc: 'Öğrenciler, bölümler, dersler, notlar ve devamsızlık için Java Swing + MySQL masaüstü uygulaması.' },
  emu: { since: 'Ara 2025', desc: 'Üniversite etkinliklerini sürdürülebilirlik ölçütleriyle etiketleyip rapor üreten iki dilli PHP portalı.' },
  schedule: { since: 'Eyl 2025', desc: 'Saf HTML ve CSS ile yazılmış, A4 için ayarlanmış, renk kodlu ve yazdırmaya hazır haftalık ders programı.' },
  bct: { since: 'Yaz 2025', desc: 'Kimlik doğrulama ve yönetici akışları olan Vue + Firebase tarama anketi. Staj projesi olarak başladı.' },
  adventure: { since: 'Güz 2023', desc: 'Güz 2023’te dönem projesi olarak elle yazılmış HTML/CSS/JS kişisel blog. Her şey burada başladı.' },
};
/** Keeps only the published projects, in their order. */
export const pickPublished = (all: Project[], ids: string[]) => ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Project => !!p);

const localized = (p: Project, locale: Locale): Project => (locale === 'tr' && TR[p.id] ? { ...p, ...TR[p.id] } : p);
/** What the site listed before the content store, kept to check the store against. */
export const publishedProjects = (locale: Locale) => pickPublished(PROJECTS, PUBLISHED).map((p) => localized(p, locale));
