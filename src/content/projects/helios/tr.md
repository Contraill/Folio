---
since: Tem 2026
desc: Başka dünyaların nasıl hissettireceğini gösteren bir 3D Güneş Sistemi gezgini. NASA/JPL verisiyle çalışıyor ve her yaklaşık değeri belirtiyor.
case:
  lede: 'İnsan ölçeğinde gezegen bilimi: Mars’taki ağırlığınız, Venüs’te bir günün uzunluğu, güneş ışığının Neptün’e ulaşma süresi.'
  stack: Next.js 16 · React 19 · TypeScript · Three.js / React Three Fiber · Tailwind v4 · Zod · Vitest · Playwright
  facts:
  - - '57'
    - detay sayfası olan Güneş Sistemi cismi
  - - EN / TR
    - her sayfa iki dilde
  - - '2'
    - ölçek modu, biri tamamen doğrusal
  sections:
  - title: Genel bakış
    paras:
    - 'Helios, Güneş Sistemi’ni etkileşimli bir 3D sahnede gezdiren bir uygulama. Her dünyayı insanın kendisiyle ilişkilendirebileceği bilgilerle anlatıyor: yerçekimi, bir günün ve bir yılın uzunluğu, ışığın oraya ne kadar sürede ulaştığı. Tüm sayılar NASA/JPL kaynaklı.'
  - title: Neden yaptım
    paras:
    - 'Güneş Sistemi uygulamalarının çoğu ya okunması zor simülatörlere dönüşüyor ya da zayıf veriyi gösterişli görsellerin arkasına saklıyor. Ben hem özgürce gezilebilen hem de güvenilir bir sahne istedim. Bu yüzden bilimsel doğruluğu bir ürün gereksinimi olarak ele aldım: her sayının bir kaynağı var, yaklaşık olan her şey de ekranda bunu belirtiyor.'
  - title: Neler yaptım
    list:
    - - Kamera ve zaman tek elde
      - Gezegenler yalnızca seçildiklerini bildiriyor; odağa ve zamana tek bir kamera düzeneği ile tek bir simülasyon saati karar veriyor. Hiçbir bileşen kamerayı kendi başına hareket ettiremiyor, bir tarihe geri dönüldüğünde de aynı sahne yeniden kuruluyor.
    - - İki ölçek modu
      - Biri her şeyin görünebilmesi için cisimleri büyütüp uzaklıkları kısaltıyor; diğeri yarıçaplar ve uzaklıklar için tek bir doğrusal oran kullanıyor. İkisi de aynı sistemler üzerinde çalıştığı için birbiriyle uyumlu tutulması gereken ikinci bir uygulama yok.
    - - Kaynağını gösteren veri
      - Sunucu tarafındaki adaptörler NASA/JPL, JPL Horizons, NeoWs, APOD ve DONKI yanıtlarını Zod ile doğruluyor ve her servisi ayrı önbelleğe alıyor. Bir kaynak yanıt vermezse doğrulanmış bir anlık kopya devreye giriyor ve sayfa bunu belirtiyor.
    - - 3D olmadan da bilgi
      - Cisim sayfaları ve karşılaştırma tabloları sunucuda üretilen HTML; WebGL’i olmayan cihazlar için de yedek bir görünüm var. 3D görünüm bilgiye ulaşmanın tek yolu değil, bilgiye eklenen bir katman.
  - title: En zor kısım
    paras:
    - Asıl zorluk; akıcı hareket, fiziksel doğruluk ve okunabilirlik arasındaki dengeydi.
    list:
    - - Akıcı hareket ve gerçek yörüngeler
      - 'Animasyonun akıcı olması gerekiyor, ama yörünge verisi yalnızca belirli tarihler için kesin. İkisini ayrı tuttum: JPL Horizons’tan gelen konumlar, ortalama yörünge elemanları ve hızlandırılmış önizlemeler ayrı ayrı etiketleniyor; eksik değerler de tahminle doldurulmak yerine boş bırakılıyor.'
    - - Açılışta beklememek
      - 'İlk sürümde bir gezegenin dokuları o gezegen seçildiğinde yükleniyordu. Bunu aşamalı yüklemeye çevirdim: önce Güneş, sonra sekiz gezegen yükleniyor; küçük cisimler bir zamanlayıcıyla sonradan geliyor ve açılışı hiç bekletmiyor. Dokular en fazla 2K çözünürlükte.'
    - - React’in dışında kalan kareler
      - Sahne her karede React state’ine yazmak yerine Three.js nesnelerini doğrudan güncelliyor; böylece animasyon yeniden render’a yol açmıyor.
  - title: Sonuç
    paras:
    - '1.0.0 sürümü Vercel’de yayında. Canlıya her dağıtım; lint, tip denetimi, birim testleri ve tarayıcılar arası Playwright testleri geçtikten sonra yapılıyor. Bu projeden çıkardığım ders: ölçek, zaman, veri ve görseller için konan net kurallar büyüyen bir görsel projeyi tutarlı tutuyor; 3D’siz sürüm de projeyi daha çok kişi için kullanışlı hale getiriyor.'
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
      - Keşif görünümünde zaman kontrolleriyle Dünya
---
