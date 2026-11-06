/* Case studies as first written, loaded with each project by `pnpm db:seed`. Sections map onto the planned content blocks. */
import type { Case } from '../src/content/schema.ts';
import type { Locale } from '../src/i18n/locale.ts';
import { A } from './projects.ts';

const EN: Record<string, Case> = {
  helios: {
    lede: 'Planetary science at human scale: your weight on Mars, the length of a day on Venus, the time sunlight needs to reach Neptune.',
    stack: 'Next.js 16 · React 19 · TypeScript · Three.js / React Three Fiber · Zustand · Tailwind v4 · Zod · Vitest · Playwright',
    facts: [['57', 'Solar System bodies with detail pages'], ['EN / TR', 'full bilingual support'], ['2', 'scale modes, one strictly linear']],
    sections: [
      { kind: 'overview', title: 'Overview', paras: ['Helios is an interactive 3D explorer of the Solar System, built as a portfolio project that treats its product and scientific constraints as production requirements: numbers are sourced, and anything approximate says so.'] },
      { title: 'What’s inside', list: [['57 real bodies', 'Detail pages for 57 Solar System bodies and four regions, plus eight custom planet pages.'], ['Explore timeline', 'Follow worlds through time. Accelerated playback is labeled approximate.'], ['Compare two worlds', 'A shareable side-by-side for human-scale context.'], ['Missions index', 'A sourced index of missions.'], ['Two scale modes', 'One tuned for legibility, one strictly linear for radii and distance.'], ['English and Turkish', 'Full EN/TR support, including a separately labeled galactic context schematic.']] },
      { title: 'Where the data comes from', paras: ['Dynamic data is validated on the server. When a source fails, a verified snapshot is used and the fallback is labeled on screen.'], list: [['NASA / JPL', 'Physical parameters and approximate orbital elements.'], ['JPL Horizons', 'Sourced vectors for selected dates in the Explore timeline.'], ['NASA NeoWs', 'Current near-Earth objects, through a server-only key.'], ['APOD and DONKI', 'Keyless public endpoints.']] },
      { title: 'Screens', gal: [[A('helios_home.webp', 1686, 1039), 'Helios home page'], [A('helios_explore.webp', 1686, 1037), 'Explore view of the Solar System'], [A('helios_earth.webp', 1685, 1036), 'Earth in Explore with time controls']] },
      { title: 'What I learned', todo: true, paras: ['[What was the hardest decision, and what would you do differently next time?]'] },
    ],
  },
  mochi: {
    lede: 'A small animated face on a 128×64 OLED that notices when you touch it, pet it or pick it up.',
    stack: 'ESP32-C3 SuperMini · Arduino (C++) · U8g2 · ArduinoJson · LittleFS · Python + Pillow tooling · pytest · Playwright',
    facts: [['53', 'animated faces'], ['≈820 KB', 'for all of them, in MOC3'], ['128×64', 'pixels of SH1106 OLED']],
    sections: [
      { kind: 'overview', title: 'Overview', paras: ['Mochi is a desk companion built around an ESP32-C3, a 1.3" SH1106 OLED, a touch sensor and an accelerometer. It runs on a single-cell LiPo and has a web panel for everything you would otherwise need a cable for.'] },
      { title: 'What it does', list: [['53 animated faces', 'Compressed to about 820 KB in total.'], ['Touch reactions', 'Poke, petting and deep petting.'], ['Motion reactions', 'Soft and hard shake, acceleration, free-fall, tilt, pick-up.'], ['Web panel', 'English or Turkish: face gallery, uploads, reaction mapping, settings, config import/export.'], ['Power aware', 'Battery level, low-battery warnings, charging indicator and light, deep and hybrid sleep.'], ['Own animation format', 'MOC3 (delta + RLE) with a GIF converter.']] },
      { title: 'Hardware', list: [['ESP32-C3 SuperMini', '4 MB flash.'], ['SH1106 OLED', '1.3", SPI, 128×64.'], ['TTP223', 'Capacitive touch sensor.'], ['MMA8452Q', 'Accelerometer over I²C.'], ['LiPo + TP4056', 'Single cell with charger board and a divider for battery measurement.']] },
      { title: 'What I learned', todo: true, paras: ['[A firmware lesson worth sharing, for example the HTML parser bug that hid part of the web panel.]'] },
    ],
  },
  huepr: {
    lede: 'Change the Hyprland wallpaper and the websites you use change with it.',
    stack: 'WebExtension (Manifest V2) · JavaScript · Python Native Messaging host · Shell installer · web-ext',
    facts: [['6', 'theming features'], ['2', 'browsers: Firefox and Zen'], ['0', 'sites themed without your allowlist']],
    sections: [
      { kind: 'overview', title: 'Overview', paras: ['huepr is a Linux theming tool for Firefox and Zen Browser on Hyprland. When the wallpaper changes, a small native host tells the extension, which injects CSS variables into the sites you allowed.'] },
      { title: 'Features', list: [['Wallpaper-driven theming', 'The theme switches automatically with the wallpaper.'], ['Per-site variable mapping', 'Map a site’s own variables to theme variables.'], ['Per-site override', 'Pin a theme to one site and ignore the wallpaper.'], ['Custom CSS', 'Per-site rules for hard-coded colors.'], ['Auto-detect', 'Scan the active tab for variables worth mapping.'], ['Palette from an image', 'Seed a new theme from any picture.']] },
      { title: 'Screens', gal: [[A('huepr_aurora.webp', 1086, 804), 'GitHub themed with the Aurora palette'], [A('huepr_latte.webp', 1086, 804), 'GitHub themed with the Latte palette'], [A('huepr_hero.webp', 1086, 730), 'The huepr repository on GitHub']] },
      { title: 'What I learned', todo: true, paras: ['[What surprised you about Native Messaging or about theming sites you don’t control?]'] },
    ],
  },
};

const TR: Record<string, Case> = {
  helios: {
    lede: 'İnsan ölçeğinde gezegen bilimi: Mars’taki ağırlığın, Venüs’te bir günün uzunluğu, güneş ışığının Neptün’e ulaşma süresi.',
    stack: EN.helios.stack,
    facts: [['57', 'detay sayfalı Güneş Sistemi cismi'], ['EN / TR', 'tam iki dil desteği'], ['2', 'ölçek modu, biri tamamen doğrusal']],
    sections: [
      { kind: 'overview', title: 'Genel bakış', paras: ['Helios, Güneş Sistemi’nin etkileşimli 3D gezgini. Ürün ve bilim kısıtlarını üretim gereksinimi gibi ele alan bir portfolyo projesi: sayıların kaynağı belli, yaklaşık olan her şey de bunu söylüyor.'] },
      { title: 'İçinde neler var', list: [['57 gerçek cisim', '57 Güneş Sistemi cismi ve dört bölge için detay sayfaları, ayrıca sekiz özel gezegen sayfası.'], ['Keşif zaman çizelgesi', 'Dünyaları zaman içinde takip et. Hızlandırılmış oynatma yaklaşık olarak etiketli.'], ['İki dünyayı karşılaştır', 'İnsan ölçeğinde bağlam için paylaşılabilir yan yana görünüm.'], ['Görev dizini', 'Görevlerin kaynaklı dizini.'], ['İki ölçek modu', 'Biri okunabilirlik için ayarlı, biri yarıçap ve uzaklıkta tamamen doğrusal.'], ['İngilizce ve Türkçe', 'Ayrı etiketlenmiş galaktik bağlam şeması dahil tam EN/TR desteği.']] },
      { title: 'Veriler nereden geliyor', paras: ['Dinamik veriler sunucuda doğrulanır. Bir kaynak başarısız olursa doğrulanmış bir anlık kopya kullanılır ve bu durum ekranda belirtilir.'], list: [['NASA / JPL', 'Fiziksel parametreler ve yaklaşık yörünge elemanları.'], ['JPL Horizons', 'Keşif zaman çizelgesinde seçili tarihler için kaynaklı vektörler.'], ['NASA NeoWs', 'Güncel Dünya’ya yakın cisimler, yalnızca sunucuda tutulan anahtarla.'], ['APOD ve DONKI', 'Anahtarsız public uç noktalar.']] },
      { title: 'Ekranlar', gal: [[EN.helios.sections[3].gal![0][0], 'Helios ana sayfası'], [EN.helios.sections[3].gal![1][0], 'Güneş Sistemi’nin keşif görünümü'], [EN.helios.sections[3].gal![2][0], 'Zaman kontrolleriyle keşif görünümünde Dünya']] },
      { title: 'Ne öğrendim', todo: true, paras: ['[En zor karar neydi, bir dahakine neyi farklı yapardın?]'] },
    ],
  },
  mochi: {
    lede: '128×64 OLED üzerinde, dokunduğunu, sevdiğini ya da kaldırdığını fark eden küçük animasyonlu bir yüz.',
    stack: EN.mochi.stack,
    facts: [['53', 'animasyonlu yüz'], ['≈820 KB', 'hepsi birden, MOC3 biçiminde'], ['128×64', 'piksel SH1106 OLED']],
    sections: [
      { kind: 'overview', title: 'Genel bakış', paras: ['Mochi; ESP32-C3, 1,3" SH1106 OLED, dokunma sensörü ve ivmeölçer etrafında kurulu bir masa arkadaşı. Tek hücreli LiPo ile çalışıyor ve kablo gerektirecek her iş için bir web paneli var.'] },
      { title: 'Neler yapıyor', list: [['53 animasyonlu yüz', 'Toplamda yaklaşık 820 KB’a sıkıştırılmış.'], ['Dokunma tepkileri', 'Dürtme, sevme ve uzun sevme.'], ['Hareket tepkileri', 'Hafif ve sert sallama, ivme, serbest düşüş, eğme, kaldırma.'], ['Web paneli', 'İngilizce ya da Türkçe: yüz galerisi, yüklemeler, tepki eşleme, ayarlar, yapılandırma aktarımı.'], ['Güç farkındalığı', 'Pil seviyesi, düşük pil uyarıları, şarj göstergesi ve hafif, derin ve hibrit uyku.'], ['Kendi animasyon biçimi', 'GIF dönüştürücülü MOC3 (delta + RLE).']] },
      { title: 'Donanım', list: [['ESP32-C3 SuperMini', '4 MB flash.'], ['SH1106 OLED', '1,3", SPI, 128×64.'], ['TTP223', 'Kapasitif dokunma sensörü.'], ['MMA8452Q', 'I²C üzerinden ivmeölçer.'], ['LiPo + TP4056', 'Şarj kartı ve pil ölçümü için bölücüyle tek hücre.']] },
      { title: 'Ne öğrendim', todo: true, paras: ['[Paylaşmaya değer bir firmware dersi, örneğin web panelinin bir kısmını gizleyen HTML ayrıştırıcı hatası.]'] },
    ],
  },
  huepr: {
    lede: 'Hyprland duvar kâğıdını değiştir, kullandığın web siteleri de onunla değişsin.',
    stack: EN.huepr.stack,
    facts: [['6', 'tema özelliği'], ['2', 'tarayıcı: Firefox ve Zen'], ['0', 'izin listende olmayan temalı site']],
    sections: [
      { kind: 'overview', title: 'Genel bakış', paras: ['huepr, Hyprland üzerinde Firefox ve Zen Browser için bir Linux tema aracı. Duvar kâğıdı değişince küçük bir yerel uygulama eklentiye haber verir, eklenti de izin verdiğin sitelere CSS değişkenleri ekler.'] },
      { title: 'Özellikler', list: [['Duvar kâğıdına bağlı tema', 'Tema, duvar kâğıdıyla birlikte kendiliğinden değişir.'], ['Siteye özel değişken eşleme', 'Bir sitenin kendi değişkenlerini tema değişkenlerine eşle.'], ['Siteye özel tema', 'Bir siteye tema sabitle, duvar kâğıdını yok say.'], ['Özel CSS', 'Sabit kodlanmış renkler için siteye özel kurallar.'], ['Otomatik algılama', 'Etkin sekmede eşlenmeye değer değişkenleri tara.'], ['Görselden palet', 'Herhangi bir görselden yeni tema üret.']] },
      { title: 'Ekranlar', gal: [[EN.huepr.sections[2].gal![0][0], 'Aurora paletiyle temalanmış GitHub'], [EN.huepr.sections[2].gal![1][0], 'Latte paletiyle temalanmış GitHub'], [EN.huepr.sections[2].gal![2][0], 'GitHub’daki huepr reposu']] },
      { title: 'Ne öğrendim', todo: true, paras: ['[Native Messaging ya da kontrol etmediğin siteleri temalamak konusunda seni ne şaşırttı?]'] },
    ],
  },
};

export const casesFor = (locale: Locale) => (locale === 'tr' ? TR : EN);
