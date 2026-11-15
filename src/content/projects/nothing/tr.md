---
since: Eyl 2026
desc: 'KDE Plasma 6 için Nothing esintili bir paket: üstte bir ada, bir dock, on dokuz masaüstü widget’ı ve Glassy stili; hepsi tek bir betikle kaldırılabiliyor.'
case:
  lede: 'Nothing telefonlarının görünümü bir Linux masaüstünde: üstte bir ada, altta bir dock ve noktalarla çizilmiş widget’lar.'
  stack: QML · KDE Plasma 6 · Qt 6 · KDE Frameworks 6 · Kvantum · Aurorae · Python · Shell · gettext · CMake
  facts:
  - - '19'
    - masaüstü widget’ı
  - - '2'
    - 'dil: İngilizce ve Türkçe'
  - - '0'
    - kendine ait arka plan servisi
  sections:
  - title: Genel bakış
    paras:
    - Nothing KDE, Nothing telefonlarının tasarım dilini KDE Plasma 6’ya taşıyan bir tema paketi. Plasma’nın kendi bileşenleri üzerine kurulu, kendine ait bir arka plan servisi çalıştırmıyor; tek bir betik onu kuruyor, güncelliyor ve yeniden kaldırıyor.
  - title: Neden yaptım
    paras:
    - 'Amaç, Nothing’in görünümünü kendi masaüstümde, sisteme saygılı tek bir paket olarak kullanmaktı: elle değiştirilmiş bir yığın ayar yerine temiz biçimde kurulup güncellenebilen ve kaldırılabilen bir şey.'
  - title: Neler yaptım
    list:
    - - Ada
      - Üstte çalışma alanları, hava durumu, saat, oynatıcı ve canlı etkinlikler; genişletildiğinde Wi-Fi, Bluetooth, ses, parlaklık, güç profilleri, sistem istatistikleri ve bildirimler.
    - - Dock
      - Meta+1 ile Meta+9 arası uygulamaları açıyor ya da pencereleri arasında geçiş yapıyor; fare tekerleği pencereler arasında dolaşıyor, bir simgenin üstüne bırakılan dosyalar o uygulamada açılıyor, simgeler de rozet ve ilerleme gösteriyor.
    - - Masaüstü widget’ları
      - Saatlerden, hava durumundan ve odaklanma sayacından ritimle yanıp sönen bir glyph ışığına ve nokta matrisli bir evcil hayvana kadar on dokuz widget.
    - - Glassy ve vurgu rengi bağlantıları
      - KDE’nin renklerini izleyen bir Kvantum stili ve Aurorae pencere dekorasyonu; ayrıca KDE vurgu rengini Starship, Fastfetch, libadwaita uygulamaları, Kitty ve Dolphin’e taşıyan bağlantılar.
    - - Açılış ve ses
      - Vurgu rengiyle yeniden çizilen bir açılış animasyonu ve noktalardan sentezlenmiş bir ses teması.
  - title: En zor kısım
    paras:
    - 'Panelleri, yapılandırma dosyalarını ve açılış ekranını değiştiren bir tema, sistemi bozuk ya da temizlenemez halde bırakabilir. Her değişikliği geri alınabilecek şekilde tasarladım:'
    list:
    - - Önce yedek
      - install.sh kendi düzenini uygulamadan önce eski panel düzenini yedekliyor, her vurgu rengi bağlantısı kullanıcının kendi yapılandırmasını ~/.config/nothing-kde/ altına yedekliyor, uninstall.sh de paketin kurduğu her şeyi kaldırıyor.
    - - Plasma güncellemeleri
      - Özel bildirim görünümü Plasma’nın iç koduna bağlı; bu yüzden yalnızca o kod beklenen haldeyse kuruluyor. Değilse, bir güncellemeden sonra bozulmak yerine KDE’nin kendi görünümü kalıyor.
    - - Yalnızca gereken yerde root
      - Vurgu rengi değiştiğinde açılış animasyonu yeniden çiziliyor ve initramfs arka planda yeniden oluşturuluyor; bunu, yalnızca bu işe izin veren ve başka hiçbir şeye izin vermeyen bir polkit kuralı sağlıyor.
    - - Gizlilik düğmeleri
      - Adadaki kamera düğmesi USB kameraları engelliyor; kamerayı yeniden açmak her zaman parola istiyor.
  - title: Sonuç
    paras:
    - CI, her widget stilini koyu ve açık temada gerçek Plasma ile ekran dışında çiziyor ve her push’ta QML ve Python testlerini çalıştırıyor; sürümler bir etiketten yayınlanıyor.
    - 'Emeği geçenler: ada, Omar’ın Nothing Island’ı olarak başladı; birkaç widget nothing-kde-widgets’tan uyarlandı, birçok widget stili de EveryThing-UI tasarımlarına dayanıyor; hepsi MIT lisanslı. Bu, resmi bir Nothing ürünü değildir.'
  - title: Ekranlar
    gal:
    - - src: /assets/nothing_desktop.webp
        w: 1600
        h: 900
      - Ada, masaüstü widget’ları ve dock
    - - src: /assets/nothing_island.webp
        w: 1600
        h: 900
      - Genişletilmiş ada
---
