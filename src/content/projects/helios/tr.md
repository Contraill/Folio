---
since: Tem 2026
desc: Kaynağı belli NASA/JPL verisi, insan ölçeğinde karşılaştırmalar ve EN/TR desteğiyle etkileşimli 3D Güneş Sistemi gezgini.
case:
  lede: "İnsan ölçeğinde gezegen bilimi: Mars’taki ağırlığın, Venüs’te bir günün uzunluğu, güneş ışığının Neptün’e ulaşma süresi."
  stack: Next.js 16 · React 19 · TypeScript · Three.js / React Three Fiber · Zustand · Tailwind v4 · Zod · Vitest · Playwright
  facts:
    - - "57"
      - detay sayfalı Güneş Sistemi cismi
    - - EN / TR
      - tam iki dil desteği
    - - "2"
      - ölçek modu, biri tamamen doğrusal
  sections:
    - kind: overview
      title: Genel bakış
      paras:
        - "Helios, Güneş Sistemi’nin etkileşimli 3D gezgini. Ürün ve bilim kısıtlarını üretim gereksinimi gibi ele alan bir portfolyo projesi: sayıların kaynağı belli, yaklaşık olan her şey de bunu söylüyor."
    - title: İçinde neler var
      list:
        - - 57 gerçek cisim
          - 57 Güneş Sistemi cismi ve dört bölge için detay sayfaları, ayrıca sekiz özel gezegen sayfası.
        - - Keşif zaman çizelgesi
          - Dünyaları zaman içinde takip et. Hızlandırılmış oynatma yaklaşık olarak etiketli.
        - - İki dünyayı karşılaştır
          - İnsan ölçeğinde bağlam için paylaşılabilir yan yana görünüm.
        - - Görev dizini
          - Görevlerin kaynaklı dizini.
        - - İki ölçek modu
          - Biri okunabilirlik için ayarlı, biri yarıçap ve uzaklıkta tamamen doğrusal.
        - - İngilizce ve Türkçe
          - Ayrı etiketlenmiş galaktik bağlam şeması dahil tam EN/TR desteği.
    - title: Veriler nereden geliyor
      paras:
        - Dinamik veriler sunucuda doğrulanır. Bir kaynak başarısız olursa doğrulanmış bir anlık kopya kullanılır ve bu durum ekranda belirtilir.
      list:
        - - NASA / JPL
          - Fiziksel parametreler ve yaklaşık yörünge elemanları.
        - - JPL Horizons
          - Keşif zaman çizelgesinde seçili tarihler için kaynaklı vektörler.
        - - NASA NeoWs
          - Güncel Dünya’ya yakın cisimler, yalnızca sunucuda tutulan anahtarla.
        - - APOD ve DONKI
          - Anahtarsız public uç noktalar.
    - title: Ekranlar
      gal:
        - - src: /assets/helios_home.webp
            w: 1686
            h: 1039
          - Helios ana sayfası
        - - src: /assets/helios_explore.webp
            w: 1686
            h: 1037
          - Güneş Sistemi’nin keşif görünümü
        - - src: /assets/helios_earth.webp
            w: 1685
            h: 1036
          - Zaman kontrolleriyle keşif görünümünde Dünya
---
