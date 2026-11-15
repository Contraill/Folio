---
since: Mar 2026
desc: 'İzin verdiğiniz siteleri her Hyprland duvar kâğıdıyla yeniden renklendiriyor: yerel bir yardımcı değişikliği fark ediyor, eklenti de sitelerin CSS değişkenlerini değiştiriyor.'
case:
  lede: Hyprland’de duvar kâğıdını değiştirin, kullandığınız siteler de onunla birlikte değişsin.
  stack: WebExtension (Manifest V2) · JavaScript · Python Native Messaging host · Shell installer · web-ext
  facts:
  - - '6'
    - tema özelliği
  - - '2'
    - 'tarayıcı: Firefox ve Zen'
  - - '0'
    - izniniz olmadan temalanan site
  sections:
  - title: Genel bakış
    paras:
    - huepr, Hyprland kullanan Linux sistemleri için küçük bir yerel yardımcıyla çalışan bir Firefox ve Zen Browser eklentisi. Duvar kâğıdı değiştiğinde yardımcı bunu eklentiye bildiriyor, eklenti de izin verdiğiniz sitelere, sayfayı yenilemeden yeni CSS değişkenleri uyguluyor.
  - title: Neden yaptım
    paras:
    - Hyprland kurulumumda masaüstünün renkleri her duvar kâğıdıyla değişiyordu, ama kullandığım siteler hep aynı kalıyordu. huepr, duvar kâğıdının temasını seçtiğiniz sitelere de taşıyor.
  - title: Neler yaptım
    list:
    - - Duvar kâğıdına göre tema
      - Her duvar kâğıdının adı bir tema seçiyor; tema da kısa bir geçişle kendiliğinden değişiyor.
    - - Siteye özel eşleştirme
      - Bir sitenin kendi CSS değişkenlerini temanın değişkenleriyle eşleştirebilir ya da bir siteye, duvar kâğıdından bağımsız sabit bir tema atayabilirsiniz.
    - - Özel CSS
      - Sitelerin koda gömdüğü renkler için siteye özel kurallar.
    - - Otomatik algılama ve palet
      - Açık sekmede eşleştirmeye değer değişkenleri bulur ve herhangi bir görselden yeni bir tema oluşturur.
  - title: En zor kısım
    list:
    - - Tarayıcı duvar kâğıdını göremiyor
      - Eklentilerin masaüstüne erişimi yok. Bir duvar kâğıdı kancası yeni dosya yolunu adlandırılmış bir kanala (named pipe) yazıyor; tarayıcının başlattığı küçük bir Python yardımcısı bunu okuyup adı Native Messaging ile eklentiye iletiyor. Eklenti de izin verilen her sekmeyi güncelliyor.
    - - Varsayılan olarak hiçbir site
      - '2.1 sürümünden önce eklenti tüm sitelere erişim istiyordu. Artık hiçbir siteye erişimi olmadan başlıyor: her siteye ayrı ayrı izin veriyorsunuz ve renkleri uygulayan betik yalnızca o sitelerde çalışıyor. Hiçbir ağ isteği yapmıyor, sayfa içeriğini hiçbir yere göndermiyor.'
    - - İmzalı, zorlamasız
      - İlk kurulum betikleri eklentiyi yükleyebilmek için Firefox’un imza denetimini kapatıyordu. Artık eklenti addons.mozilla.org üzerinden imzalanıyor ve kurulum betiği eski ayarı kaldırıyor.
  - title: Sonuç
    paras:
    - 'huepr, Firefox Eklentileri’nde yayında ve güncellemelerini oradan alıyor; kaldırma betiği de sistemde yaptığı her değişikliği geri alıyor. Sınırları: yalnızca Linux’ta çalışıyor, Chromium tabanlı tarayıcıları desteklemiyor ve CSS değişkeni kullanmayan siteler için özel kurallar gerekiyor.'
  - title: Ekranlar
    gal:
    - - src: /assets/huepr_aurora.webp
        w: 1086
        h: 804
      - Aurora paletiyle temalanmış GitHub
    - - src: /assets/huepr_latte.webp
        w: 1086
        h: 804
      - Latte paletiyle temalanmış GitHub
    - - src: /assets/huepr_hero.webp
        w: 1086
        h: 730
      - GitHub’daki huepr deposu
---
