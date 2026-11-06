---
since: Mar 2026
desc: "Hyprland duvar kâğıdından tarayıcı temasına: izin verilen sitelere Native Messaging ile CSS değişkenleri ekler."
case:
  lede: Hyprland duvar kâğıdını değiştir, kullandığın web siteleri de onunla değişsin.
  stack: WebExtension (Manifest V2) · JavaScript · Python Native Messaging host · Shell installer · web-ext
  facts:
    - - "6"
      - tema özelliği
    - - "2"
      - "tarayıcı: Firefox ve Zen"
    - - "0"
      - izin listende olmayan temalı site
  sections:
    - kind: overview
      title: Genel bakış
      paras:
        - huepr, Hyprland üzerinde Firefox ve Zen Browser için bir Linux tema aracı. Duvar kâğıdı değişince küçük bir yerel uygulama eklentiye haber verir, eklenti de izin verdiğin sitelere CSS değişkenleri ekler.
    - title: Özellikler
      list:
        - - Duvar kâğıdına bağlı tema
          - Tema, duvar kâğıdıyla birlikte kendiliğinden değişir.
        - - Siteye özel değişken eşleme
          - Bir sitenin kendi değişkenlerini tema değişkenlerine eşle.
        - - Siteye özel tema
          - Bir siteye tema sabitle, duvar kâğıdını yok say.
        - - Özel CSS
          - Sabit kodlanmış renkler için siteye özel kurallar.
        - - Otomatik algılama
          - Etkin sekmede eşlenmeye değer değişkenleri tara.
        - - Görselden palet
          - Herhangi bir görselden yeni tema üret.
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
          - GitHub’daki huepr reposu
    - title: Ne öğrendim
      todo: true
      paras:
        - "[Native Messaging ya da kontrol etmediğin siteleri temalamak konusunda seni ne şaşırttı?]"
---
