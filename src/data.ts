/* Everything the site says that isn't a project write-up. Facts come from the CV (public/cv/*.pdf); keep them in step. */
export type Locale = 'en' | 'tr';
type T = Record<Locale, string>;

export const EMAIL = 'izzet@oztozlu.dev';
export const GITHUB = 'https://github.com/Contraill';
export const LINKEDIN = 'https://www.linkedin.com/in/izzetcanoztozlu';

export const ui = {
  en: {
    title: 'İzzet Can Öztozlu, full-stack developer',
    description: 'Portfolio of full-stack developer İzzet Can Öztozlu: web apps built with React, TypeScript, Node.js and Python, and shipped with tests, CI and Docker.',
    skip: 'Skip to content',
    navLabel: 'Sections',
    nav: { work: 'Work', experience: 'Experience', about: 'About', cv: 'CV' },
    contactButton: 'Contact',
    home: 'Home',
    language: 'Türkçe',
    role: 'Full-stack developer',
    lede: 'I build web apps with React, TypeScript, Node.js and Python, and ship them with tests, CI and Docker.',
    downloadCv: 'Download CV',
    viewCv: 'View CV',
    emailMe: 'Email me',
    portraitAlt: 'İzzet Can Öztozlu, seated at a café table in the evening',
    mochi: 'Mochi, a desk companion I built. Press to poke it.',
    mochiCaption: 'Mochi, my desk companion. Poke it.',
    work: 'Selected work',
    workNote: 'Four projects that show the whole job: design, code, tests and deployment.',
    also: 'Also built',
    allRepos: 'Every project is public on GitHub',
    caseStudy: 'Read the case study',
    live: 'Live',
    code: 'Code',
    experience: 'Experience and education',
    skills: 'Skills',
    about: 'About',
    contact: 'Let’s talk.',
    contactNote: 'Email is the fastest way to reach me.',
    copy: 'Copy email address',
    copied: 'Copied',
    allWork: 'All work',
    stack: 'Stack',
    next: 'Next project',
    back: 'Back to top',
    cvTitle: 'Curriculum vitae',
    cvNote: 'One page, in English and Turkish. The text can be selected and searched, and the links work.',
    cvLanguage: 'CV language',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit',
    zoom: 'Zoom',
    openPdf: 'Open PDF',
    downloadPdf: 'Download PDF',
    cvPage: 'CV in {lang}, page {n}',
    languages: { en: 'English', tr: 'Türkçe' },
    feedHint: 'Press the water around this card to feed the koi.',
    petLabel: 'Mochi, following along. Press to poke it.',
    notFound: { title: 'Not found', heading: 'This page doesn’t exist.', error: 'cd: no such file or directory:', note: 'It may have moved, or there’s a typo in the address.', projects: 'Projects', suggest: ['fish: Did you mean', '?'] },
  },
  tr: {
    title: 'İzzet Can Öztozlu, full-stack geliştirici',
    description: 'Full-stack geliştirici İzzet Can Öztozlu’nun portfolyosu: React, TypeScript, Node.js ve Python ile geliştirip testler, CI ve Docker ile yayına aldığı web uygulamaları.',
    skip: 'İçeriğe atla',
    navLabel: 'Bölümler',
    nav: { work: 'Projeler', experience: 'Deneyim', about: 'Hakkımda', cv: 'CV' },
    contactButton: 'İletişim',
    home: 'Ana sayfa',
    language: 'English',
    role: 'Full-stack geliştirici',
    lede: 'React, TypeScript, Node.js ve Python ile web uygulamaları geliştiriyorum ve bunları testler, CI ve Docker ile yayına alıyorum.',
    downloadCv: 'CV’yi indir',
    viewCv: 'CV’yi görüntüle',
    emailMe: 'E-posta gönder',
    portraitAlt: 'İzzet Can Öztozlu, akşam bir kafede masada otururken',
    mochi: 'Mochi, tasarladığım masaüstü evcil hayvanı. Dürtmek için tıklayın.',
    mochiCaption: 'Mochi, masaüstü evcil hayvanım. Dürtmeyi deneyin.',
    work: 'Öne çıkan projeler',
    workNote: 'Bir işin baştan sona nasıl yürüdüğünü gösteren dört proje: tasarım, kod, test ve yayın.',
    also: 'Diğer projeler',
    allRepos: 'Tüm projelerim GitHub’da herkese açık',
    caseStudy: 'Projeyi incele',
    live: 'Canlı',
    code: 'Kaynak kod',
    experience: 'Deneyim ve eğitim',
    skills: 'Teknik beceriler',
    about: 'Hakkımda',
    contact: 'Tanışalım.',
    contactNote: 'Bana ulaşmanın en hızlı yolu e-posta.',
    copy: 'E-posta adresini kopyala',
    copied: 'Kopyalandı',
    allWork: 'Tüm projeler',
    stack: 'Teknolojiler',
    next: 'Sonraki proje',
    back: 'Başa dön',
    cvTitle: 'Özgeçmiş',
    cvNote: 'Tek sayfa, Türkçe ve İngilizce. Metni seçip arayabilir, bağlantılara tıklayabilirsiniz.',
    cvLanguage: 'CV dili',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    fit: 'Sığdır',
    zoom: 'Yakınlaştırma',
    openPdf: 'PDF’i aç',
    downloadPdf: 'PDF’i indir',
    cvPage: 'CV ({lang}), sayfa {n}',
    languages: { en: 'İngilizce', tr: 'Türkçe' },
    feedHint: 'Koi balıklarını beslemek için kartın boş bir yerine tıklayın.',
    petLabel: 'Mochi sizi takip ediyor. Dürtmek için tıklayın.',
    notFound: { title: 'Sayfa bulunamadı', heading: 'Bu sayfa yok.', error: 'cd: böyle bir dosya ya da dizin yok:', note: 'Taşınmış olabilir ya da adreste bir yazım hatası var.', projects: 'Projeler', suggest: ['fish: Bunu mu demek istediniz:', '?'] },
  },
} as const;

/* The four projects the CV leads with, in its order, then the smaller ones it lists under "More". */
export const featured: { id: string; kicker: T; stack: string[]; point: T }[] = [
  {
    id: 'helios',
    kicker: { en: 'Interactive Solar System explorer', tr: 'Etkileşimli Güneş Sistemi gezgini' },
    stack: ['Next.js', 'React', 'TypeScript', 'Three.js', 'Playwright'],
    point: { en: 'Production deploys wait for lint, type checks, unit tests and a cross-browser Playwright suite.', tr: 'Canlıya her dağıtımdan önce lint, tip denetimi, birim testleri ve tarayıcılar arası Playwright testleri çalışıyor.' },
  },
  {
    id: 'campuseats',
    kicker: { en: 'QR table ordering · graduation project', tr: 'Masadan QR ile sipariş sistemi · bitirme projesi' },
    stack: ['React', 'Node.js', 'Express', 'Socket.IO', 'SQLite', 'JWT'],
    point: { en: 'Role-based JWT auth and per-restaurant Socket.IO rooms, tested on Node 20, 22 and 24 in CI.', tr: 'Rol tabanlı JWT yetkilendirmesi ve her restorana ayrı Socket.IO odası; testler CI’da Node 20, 22 ve 24 üzerinde çalışıyor.' },
  },
  {
    id: 'orbis',
    kicker: { en: 'Self-hosted multi-profile media platform', tr: 'Self-hosted, çok profilli medya platformu' },
    stack: ['FastAPI', 'SQLAlchemy', 'React', 'TypeScript', 'Docker'],
    point: { en: 'Runs on a Raspberry Pi 5 at home; the API and database migrations are covered by pytest in CI.', tr: 'Evdeki bir Raspberry Pi 5’te çalışıyor; API ve veritabanı migration’ları CI’da pytest ile test ediliyor.' },
  },
  {
    id: 'nodesk',
    kicker: { en: 'Homelab and multi-site network monitoring', tr: 'Homelab ve çok konumlu ağ izleme' },
    stack: ['Python', 'Raspberry Pi', 'Tailscale', 'OpenWrt', 'Docker'],
    point: { en: 'Push-based agents map devices without port scanning and send ntfy or Telegram alerts.', tr: 'Push tabanlı ajanlar cihazları port taraması yapmadan haritalıyor, ntfy ya da Telegram üzerinden bildirim gönderiyor.' },
  },
];
export const also = ['mochi', 'nothing', 'huepr'];
/* Every project has a case study page, in this order. */
export const caseOrder = ['helios', 'campuseats', 'orbis', 'nodesk', 'bct', 'mochi', 'nothing', 'huepr'];

export const cv = {
  en: {
    job: { company: 'Up&Running Cloud IT Services', role: 'Web Developer Intern', when: 'Jul – Aug 2025', where: 'Istanbul, Türkiye (hybrid)', project: 'bct', projectLabel: 'The project: Breast Cancer Tracker' },
    duties: [
      'Built a Vue 3 + Firebase web app (Authentication, Cloud Firestore, Hosting) for a breast-cancer screening questionnaire, with a participant flow and an admin review panel.',
      'Developed reusable UI components with PrimeVue and client-side routing with Vue Router.',
      'Set up GitHub Actions to deploy to Firebase Hosting on every merge and to open preview channels for pull requests.',
      'Kept improving it after the internship: moved authorization into Firestore Security Rules, removed client-side admin escalation and added emulator-based security tests that gate every deploy.',
    ],
    school: { name: 'Eastern Mediterranean University', where: 'Famagusta, North Cyprus', degree: 'B.Sc. Information Systems and Technologies', when: 'Sep 2022 – Jan 2027' },
    schoolNotes: ['75% academic merit scholarship', 'Coursework: Data Structures and Algorithms, Database Systems, Software Development, Web Development'],
    extras: [['Activities', 'IEEE Xtreme 19 participant'], ['Languages', 'Turkish (native), English (B2)']],
    skills: [
      ['Languages', 'TypeScript, JavaScript, Python, Java, C/C++, PHP, SQL, HTML, CSS, Bash'],
      ['Frontend', 'React, Next.js (App Router), Vue 3, Three.js / React Three Fiber, Tailwind CSS, Vite, PWA, i18n'],
      ['Backend & data', 'Node.js, Express, FastAPI, REST APIs, WebSockets (Socket.IO), JWT, SQLAlchemy, Alembic, SQLite, MySQL, Firebase'],
      ['Testing & DevOps', 'Vitest, Playwright, pytest, GitHub Actions (CI/CD), Docker, Docker Compose, Vercel, Firebase Hosting, Git'],
      ['Infrastructure', 'Linux (Arch, Debian), Raspberry Pi, Tailscale, OpenWrt, nginx, CasaOS, Oracle Cloud'],
    ],
  },
  tr: {
    job: { company: 'Up&Running Cloud IT Services', role: 'Web Geliştirici Stajyer', when: 'Tem – Ağu 2025', where: 'İstanbul, Türkiye (hibrit)', project: 'bct', projectLabel: 'Proje: Breast Cancer Tracker' },
    duties: [
      'Meme kanseri tarama anketi için katılımcı akışı ve yönetici inceleme paneli olan bir Vue 3 + Firebase web uygulaması geliştirdim (Authentication, Cloud Firestore, Hosting).',
      'PrimeVue ile yeniden kullanılabilir UI bileşenleri ve Vue Router ile istemci tarafı yönlendirme geliştirdim.',
      'Her merge’de Firebase Hosting’e dağıtan ve her pull request için önizleme kanalı açan GitHub Actions iş akışlarını kurdum.',
      'Projeyi staj sonrasında da sürdürdüm: yetkilendirmeyi Firestore Security Rules’a taşıdım, istemci tarafındaki yetki yükseltme açığını kapattım ve her dağıtımı koşula bağlayan emulator tabanlı güvenlik testleri ekledim.',
    ],
    school: { name: 'Doğu Akdeniz Üniversitesi', where: 'Gazimağusa, KKTC', degree: 'Lisans, Bilişim Sistemleri ve Teknolojileri', when: 'Eyl 2022 – Oca 2027' },
    schoolNotes: ['%75 akademik başarı bursu', 'Dersler: Veri Yapıları ve Algoritmalar, Veritabanı Sistemleri, Yazılım Geliştirme, Web Geliştirme'],
    extras: [['Etkinlikler', 'IEEE Xtreme 19 katılımcısı'], ['Diller', 'Türkçe (ana dil), İngilizce (B2)']],
    skills: [
      ['Diller', 'TypeScript, JavaScript, Python, Java, C/C++, PHP, SQL, HTML, CSS, Bash'],
      ['Frontend', 'React, Next.js (App Router), Vue 3, Three.js / React Three Fiber, Tailwind CSS, Vite, PWA, i18n'],
      ['Backend ve veri', 'Node.js, Express, FastAPI, REST API, WebSocket (Socket.IO), JWT, SQLAlchemy, Alembic, SQLite, MySQL, Firebase'],
      ['Test ve DevOps', 'Vitest, Playwright, pytest, GitHub Actions (CI/CD), Docker, Docker Compose, Vercel, Firebase Hosting, Git'],
      ['Altyapı', 'Linux (Arch, Debian), Raspberry Pi, Tailscale, OpenWrt, nginx, CasaOS, Oracle Cloud'],
    ],
  },
};

export const about = {
  en: {
    lede: 'I like software that reaches into the real world: web apps built on sourced data, Linux desktops that follow the wallpaper, services that run at home and tiny devices with a personality. Most of it is public on GitHub, with the hard parts written down.',
    principles: [
      ['Numbers should be sourced', 'Helios validates its data and labels anything approximate on screen, including the fallbacks.', 'helios'],
      ['Local first', 'CampusEats runs fully on a local network, Orbis is self-hosted, and Nodesk maps a network without port scanning.', 'campuseats'],
      ['Small hardware, real personality', 'Mochi fits 53 animated faces into about 820 KB and reacts to touch, petting and shaking.', 'mochi'],
    ],
  },
  tr: {
    lede: 'Gerçek dünyaya uzanan yazılımları seviyorum: kaynağı belli veriyle çalışan web uygulamaları, duvar kâğıdını takip eden Linux masaüstleri, evde çalışan servisler ve kişiliği olan küçük cihazlar. Çoğu GitHub’da açık, zor kısımları da yazılı.',
    principles: [
      ['Sayıların kaynağı olmalı', 'Helios verilerini doğruluyor; yedek veriler dahil, yaklaşık olan her şeyi ekranda belirtiyor.', 'helios'],
      ['Önce yerel', 'CampusEats tamamen yerel ağda çalışıyor, Orbis self-hosted, Nodesk ise port taraması yapmadan ağı haritalıyor.', 'campuseats'],
      ['Küçük donanım, gerçek kişilik', 'Mochi 53 animasyonlu yüzü yaklaşık 820 KB’a sığdırıyor; dokunmaya, sevmeye ve sallanmaya tepki veriyor.', 'mochi'],
    ],
  },
};

export const localePath = (locale: Locale, path: string) => (locale === 'tr' ? '/tr' + (path === '/' ? '' : path) : path);

/* The skills as my fastfetch prints its system: two boxes, a coloured bar and icon per row, keys in the
   terminal's cyan, blue and magenta. Same facts as the CV's skills. */
type Row = { icon: string; key: string; value: string; color: 'cyan' | 'blue' | 'magenta' };
export const fetch: Record<Locale, { title: string; boxes: { title: string; rows: Row[] }[] }> = {
  en: {
    title: 'izzet@oztozlu',
    boxes: [
      { title: 'Stack', rows: [
        { icon: 'code', key: 'Languages', value: 'TypeScript, JavaScript, Python, Java, C/C++, PHP, SQL, HTML, CSS, Bash', color: 'cyan' },
        { icon: 'window', key: 'Frontend', value: 'React, Next.js (App Router), Vue 3, Three.js / React Three Fiber, Tailwind CSS, Vite, PWA, i18n', color: 'cyan' },
        { icon: 'db', key: 'Backend', value: 'Node.js, Express, FastAPI, REST APIs, WebSockets (Socket.IO), JWT, SQLAlchemy, Alembic, SQLite, MySQL, Firebase', color: 'cyan' },
      ] },
      { title: 'Delivery / Status', rows: [
        { icon: 'flask', key: 'Testing', value: 'Vitest, Playwright, pytest', color: 'blue' },
        { icon: 'gear', key: 'CI/CD', value: 'GitHub Actions, Docker, Docker Compose, Vercel, Firebase Hosting, Git', color: 'blue' },
        { icon: 'server', key: 'Infra', value: 'Linux (Arch, Debian), Raspberry Pi, Tailscale, OpenWrt, nginx, CasaOS, Oracle Cloud', color: 'cyan' },
        { icon: 'globe', key: 'Speaks', value: 'Turkish (native), English (B2)', color: 'magenta' },
        { icon: 'clock', key: 'Uptime', value: 'writing code since the first semester', color: 'magenta' },
      ] },
    ],
  },
  tr: {
    title: 'izzet@oztozlu',
    boxes: [
      { title: 'Teknolojiler', rows: [
        { icon: 'code', key: 'Programlama', value: 'TypeScript, JavaScript, Python, Java, C/C++, PHP, SQL, HTML, CSS, Bash', color: 'cyan' },
        { icon: 'window', key: 'Frontend', value: 'React, Next.js (App Router), Vue 3, Three.js / React Three Fiber, Tailwind CSS, Vite, PWA, i18n', color: 'cyan' },
        { icon: 'db', key: 'Backend', value: 'Node.js, Express, FastAPI, REST API, WebSocket (Socket.IO), JWT, SQLAlchemy, Alembic, SQLite, MySQL, Firebase', color: 'cyan' },
      ] },
      { title: 'Dağıtım / Durum', rows: [
        { icon: 'flask', key: 'Test', value: 'Vitest, Playwright, pytest', color: 'blue' },
        { icon: 'gear', key: 'CI/CD', value: 'GitHub Actions, Docker, Docker Compose, Vercel, Firebase Hosting, Git', color: 'blue' },
        { icon: 'server', key: 'Altyapı', value: 'Linux (Arch, Debian), Raspberry Pi, Tailscale, OpenWrt, nginx, CasaOS, Oracle Cloud', color: 'cyan' },
        { icon: 'globe', key: 'Dil', value: 'Türkçe (ana dil), İngilizce (B2)', color: 'magenta' },
        { icon: 'clock', key: 'Uptime', value: 'ilk sömestrden beri kod yazıyor', color: 'magenta' },
      ] },
    ],
  },
};

/* What the hero's terminal prints (scripts/terminal.ts). Commands stay in English, like a real shell. */
export const term = {
  en: {
    label: 'Terminal: type a command, or help',
    hint: 'type help',
    help: [
      ['help', 'this list'], ['whoami', 'who this is'], ['ls', 'the projects'], ['open <name>', 'a project, e.g. open helios'],
      ['cv', 'the CV'], ['contact', 'how to reach me'], ['fastfetch', 'skills'],
      ['mochi', 'poke Mochi'], ['lang', 'Türkçe'], ['clear', 'clear the screen'],
    ],
    openUsage: 'Usage: open <project>. Type ls to see them.',
    noProject: 'No project called “{p}”. Type ls to see them.',
    noFile: 'No such file or directory',
    opening: 'Opening {p}…',
    cv: 'Opening the CV…',
    fastfetch: '↑ printed again',
    hidden: '…and a few that aren’t listed.',
    gitUsage: 'usage: git log',
    pong: 'pong',
    rm: 'rm: refusing to remove ‘/’: this portfolio is load-bearing',
    vim: 'You can check out any time you like, but you can never leave. (:q! works here, though.)',
    closed: 'Connection to oztozlu.dev closed.',
    reopened: '…and reopened. Welcome back.',
    mochiHi: 'hi, I’m Mochi',
    mochi: 'Mochi says hi.',
    lang: 'Switching to Turkish…',
    notFound: 'fish: Unknown command: {c}',
    tryHelp: 'Type help to see what works here.',
    sudo: ['[sudo] password for recruiter: ••••••••', 'Permission granted. Opening a new email…'],
  },
  tr: {
    label: 'Terminal: bir komut yazın (yardım için help)',
    hint: 'help yazın',
    help: [
      ['help', 'bu liste'], ['whoami', 'ben kimim'], ['ls', 'projeleri listeler'], ['open <ad>', 'bir projeyi açar, örn. open helios'],
      ['cv', 'özgeçmişi açar'], ['contact', 'iletişim bilgileri'], ['fastfetch', 'teknik beceriler'],
      ['mochi', 'Mochi’yi dürter'], ['lang', 'English'], ['clear', 'ekranı temizler'],
    ],
    openUsage: 'Kullanım: open <proje>. Projeleri görmek için ls yazın.',
    noProject: '“{p}” adında bir proje yok. Projeleri görmek için ls yazın.',
    noFile: 'Böyle bir dosya ya da dizin yok',
    opening: '{p} açılıyor…',
    cv: 'Özgeçmiş açılıyor…',
    fastfetch: '↑ yeniden yazdırıldı',
    hidden: '…ve listede olmayan birkaç komut daha.',
    gitUsage: 'kullanım: git log',
    pong: 'pong',
    rm: 'rm: ‘/’ silinemez: bu portfolyo taşıyıcı duvar.',
    vim: 'Girmek kolay, çıkmak imkânsız. (Gerçi burada :q! işe yarıyor.)',
    closed: 'oztozlu.dev bağlantısı kapatıldı.',
    reopened: '…ve yeniden açıldı. Tekrar hoş geldiniz.',
    mochiHi: 'merhaba, ben Mochi',
    mochi: 'Mochi selam söylüyor.',
    lang: 'İngilizceye geçiliyor…',
    notFound: 'fish: Bilinmeyen komut: {c}',
    tryHelp: 'Kullanılabilen komutlar için help yazın.',
    sudo: ['[sudo] recruiter için parola: ••••••••', 'İzin verildi. Yeni bir e-posta açılıyor…'],
  },
} as const;
