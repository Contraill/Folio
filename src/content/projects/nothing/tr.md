---
since: Eyl 2026
desc: "KDE Plasma 6 için Nothing esintili paket: üstte bir ada, bir dock, on dokuz masaüstü widget’ı ve Glassy stili."
case:
  lede: "Nothing telefonlarının görünümü bir Linux masaüstünde: üstte bir ada, altta bir dock ve noktalarla çizilmiş widget’lar."
  stack: "QML · KDE Plasma 6 · Qt 6 · KDE Frameworks 6 · Kvantum · Aurorae · Python · Shell · gettext · CMake"
  facts:
    - - "19"
      - "masaüstü widget’ı"
    - - "2"
      - "dil: Türkçe ve İngilizce"
    - - "0"
      - "kendine ait arka plan servisi"
  sections:
    - kind: overview
      title: "Genel bakış"
      paras:
        - "Nothing KDE, KDE Plasma 6 için Nothing’in tasarım dilinde bir tema paketi. Plasma’nın kendi bileşenleriyle çalışır, kendine ait bir servisi yoktur; tek bir betik onu kurar, günceller ve yeniden kaldırır."
    - title: "Neler ekliyor"
      list:
        - - "Ada"
          - "Üstte çalışma alanları, hava durumu, saat, oynatıcı ve canlı etkinlikler; açılınca Wi-Fi, Bluetooth, ses, parlaklık, güç profilleri, sistem durumu ve bildirimler."
        - - "Dock"
          - "Meta+1’den Meta+9’a kadar uygulamaları açar ya da aralarında gezer, tekerlek pencereler arasında dolaşır, simgeye bırakılan dosya o uygulamada açılır, simgeler rozet ve ilerleme gösterir."
        - - "Masaüstü widget’ları"
          - "Saatlerden, hava durumundan ve odak sayacından, müziğin ritmiyle yanıp sönen bir glyph ışığına ve nokta matrisli bir evcil hayvana kadar on dokuz widget."
        - - "Glassy"
          - "KDE’nin renklerini izleyen, kendi ayarları olan bir Kvantum stili ve Aurorae pencere dekorasyonu."
        - - "Vurgu bağlantıları"
          - "KDE vurgu rengi Starship’e, Fastfetch’e, libadwaita uygulamalarına, Kitty’ye ve Dolphin’e ulaşır."
        - - "Açılış ve ses"
          - "Vurgu rengiyle yeniden çizilen bir Plymouth animasyonu ve noktalardan sentezlenmiş bir ses teması."
    - title: "Geri alınabilir"
      paras:
        - "Paketin bir sistemde değiştirdiği her şey geri alınabilir."
      list:
        - - "Kurulum"
          - "install.sh kurar ya da günceller, kendi panel düzenini uygulamadan önce eskisini yedekler; uninstall.sh kurduğu her şeyi kaldırır."
        - - "Vurgu bağlantıları"
          - "Her bağlantı kullanıcının kendi ayarını korur ve ~/.config/nothing-kde/ altında yedekler."
        - - "Bildirim görünümü"
          - "Yalnızca Plasma’nın bildirim kodu beklenen hâldeyse kurulur; değilse KDE’nin kendi görünümü kalır."
        - - "Gizlilik düğmeleri"
          - "Adadaki kamera düğmesi USB kameraları engeller; birini yeniden açmak her zaman parola ister."
        - - "Testler"
          - "CI her push’ta her widget stilini koyu ve açık temada gerçek Plasma ile ekran dışında çizer, QML ve Python testlerini çalıştırır."
    - title: "Emeği geçenler"
      paras:
        - "Ada, Omar’ın Nothing Island’ı olarak başladı; birkaç widget nothing-kde-widgets’tan uyarlandı ve birçok widget stili EveryThing-UI’ın tasarımlarından geliyor, hepsi MIT lisanslı. Resmî bir Nothing ürünü değil."
    - title: "Ekranlar"
      gal:
        - - src: /assets/nothing_desktop.webp
            w: 1600
            h: 900
          - "Ada, masaüstü widget’ları ve dock"
        - - src: /assets/nothing_island.webp
            w: 1600
            h: 900
          - "Açılmış ada"
---
