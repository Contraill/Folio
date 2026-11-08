---
since: Eki 2026
desc: "Bir ev için Raspberry Pi 5 üzerinde medya sunucusu: kendi dili ve ilerlemesi olan profiller, Watch Together odaları ve TV başlatıcıları; oynatma, sahibinin kurduğu sağlayıcılardan gelir."
case:
  lede: "Bir evin kendi izleme yeri: herkesin bir profili var, bir oda kodu da birkaç kişinin birlikte izlemesini sağlıyor."
  stack: "FastAPI · SQLAlchemy · Alembic · SQLite · React · TypeScript · Vite · Shaka Player · Docker Compose · webOS / Tizen"
  facts:
    - - "6"
      - "haneli Watch Together oda kodları"
    - - "2"
      - "TV başlatıcısı: LG webOS ve Samsung Tizen"
    - - "0"
      - "hazır gelen yayın sağlayıcısı: sahibi kendisininkini kurar"
  sections:
    - kind: overview
      title: "Genel bakış"
      paras:
        - "Orbis, küçük bir ev için Raspberry Pi 5 üzerinde Docker ile çalışan, kendi sunucunda barındırılan bir medya arayüzü. Katalog TMDB’den, oynatma ise sahibinin kurduğu sağlayıcı bağdaştırıcılarından gelir: Orbis genel yayın için hiçbir sağlayıcıyla gelmez."
    - title: "Neler yapıyor"
      list:
        - - "Profiller"
          - "Her profil kendi dilini, listesini, ilerlemesini ve izleme geçmişini tutar; Türkçe ya da İngilizce."
        - - "Keşif"
          - "Her profile göre şekillenen ana sayfa, film ve dizi rafları; yerel tam metin araması."
        - - "Oynatma"
          - "Sağlayıcıyı ve kaynağı kendisi seçer, biri çalışmazsa diğerine geçer; kalite, ses ve altyazıyı izleyen seçer."
        - - "Watch Together"
          - "Altı haneli bir kodla girilen odalar: oynatma başlayana kadar herkes kendi gezinir, sonra oynatma, duraklatma ve zaman çizgisi eşit kalır."
        - - "Yönetim"
          - "Yalnızca sahip profilinin parolası var; sağlayıcılar, ayarlar, tanılama ve oturumlar için."
        - - "TV başlatıcıları"
          - "Aynı web arayüzünü televizyonda açan isteğe bağlı LG webOS ve Samsung Tizen kabukları."
    - title: "Parçalar nasıl birleşiyor"
      paras:
        - "Tarayıcılar ve TV başlatıcıları aynı React arayüzünü açar; geri kalan her şey FastAPI arka ucunun işi."
      list:
        - - "Ön yüz"
          - "nginx arkasında React, TypeScript ve Vite; Shaka Player yalnızca oynatma sayfalarında yüklenir."
        - - "Arka uç"
          - "SQLAlchemy’li FastAPI, açılışta uygulanan Alembic geçişleri; profilleri, ilerlemeyi ve arama dizinini SQLite tutar."
        - - "Sağlayıcılar"
          - "Yönetim panelinden kurulup sürümlenen, repo dışında tutulan güvenilir Python modülleri; korumalı alanda değil, sahibinin kodu olarak çalışırlar."
        - - "Vekil oynatma"
          - "Medyayı arka uç aktarır; kaynak adresleri ve başlıkları tarayıcıya hiç ulaşmaz."
        - - "Testler"
          - "pytest; API’yi, geçişleri, oynatmayı, sağlayıcıları, önerileri ve Watch Together’ı sentetik verilerle sınar; hiçbir test gerçek bir sağlayıcıya ihtiyaç duymaz."
    - title: "Sınırlar"
      paras:
        - "Watch Together odaları arka ucun belleğinde yaşar ve yeniden başlatınca kapanır; sohbet, sesli konuşma, indirme ya da ebeveyn denetimi yok. TV başlatıcıları CI’da derlenip test ediliyor, gerçek bir televizyonda değil. Orbis güvenilir bir ev ağı için tasarlandı."
---
