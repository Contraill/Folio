---
since: Eki 2026
desc: 'Raspberry Pi 5’te çalışan, tek bir hane için medya sunucusu: kendi dili ve izleme ilerlemesi olan profiller, Birlikte İzle odaları ve TV uygulamaları. Oynatma, sahibinin kurduğu sağlayıcılar üzerinden yapılıyor.'
case:
  lede: 'Bir hanenin kendi izleme alanı: herkesin kendi profili var, bir oda koduyla da birkaç kişi birlikte izleyebiliyor.'
  stack: FastAPI · SQLAlchemy · Alembic · SQLite · React · TypeScript · Vite · Shaka Player · Docker Compose · webOS / Tizen
  facts:
  - - '6'
    - haneli Birlikte İzle oda kodu
  - - '2'
    - 'TV uygulaması: LG webOS ve Samsung Tizen'
  - - '0'
    - 'hazır yayın sağlayıcısı: sahibi kendisininkini kuruyor'
  sections:
  - title: Genel bakış
    paras:
    - Orbis, küçük bir hane için kendi sunucunuzda çalışan bir medya arayüzü; Docker ile bir Raspberry Pi 5 üzerinde çalışıyor. Katalog TMDB’den geliyor, oynatma ise sahibinin kurduğu sağlayıcı adaptörleri üzerinden yapılıyor; Orbis genel yayın için hiçbir sağlayıcıyla birlikte gelmiyor.
  - title: Neden yaptım
    paras:
    - Amaç; evde herkesin kendi profili, listesi ve izleme ilerlemesi olan, televizyonda da açılan ve birkaç kişinin aynı şeyi eş zamanlı izleyebildiği tek bir yer kurmaktı.
  - title: Neler yaptım
    list:
    - - Profiller
      - Her profilin kendi dili, listesi, ilerlemesi ve geçmişi var. Yalnızca sahibin profilinin, yönetim alanı için bir parolası var.
    - - Keşif
      - Her profile göre şekillenen ana sayfa, film ve dizi rafları; ayrıca yerel tam metin arama.
    - - Birlikte İzle
      - 'Altı haneli bir kodla katılınan odalar: oynatma başlayana kadar herkes kendi başına geziniyor, sonra oynatma, duraklatma ve zaman çizelgesi eş zamanlı kalıyor.'
    - - TV uygulamaları
      - Yalnızca sunucu adresini saklayıp aynı web arayüzünü açan LG webOS ve Samsung Tizen uygulamaları; böylece bakımı yapılacak tek bir arayüz var.
  - title: En zor kısım
    list:
    - - Kendini toparlayan oynatma
      - Kaynaklar farklı şekillerde başarısız olabiliyor. Sağlayıcı adaptörleri yalnızca kaynağı buluyor; kaynağın nasıl iletileceğine backend’in ayrı bir bölümü karar veriyor. Oynatma başarısız olursa oynatıcı hatayı o anki konumla birlikte bildiriyor, backend de sıradaki seçeneği deniyor; böylece izleme kaldığı yerden devam ediyor.
    - - Başlıklar sunucuda kalıyor
      - Özel istek başlıkları gerektiren kaynaklar backend üzerinden aktarılıyor; böylece bu başlıklar hiçbir zaman tarayıcıya ulaşmıyor.
    - - Kodun dışında kalan sağlayıcılar
      - Sağlayıcılar, yönetim alanından kurulup sürümlenen ve depoda tutulmayan güvenilir Python modülleri. Testler sentetik verilerle çalışıyor; hiçbiri gerçek bir sağlayıcıya ihtiyaç duymuyor.
  - title: Sonuç
    paras:
    - 'CI’da pytest; API’yi, veritabanı migration’larını, oynatmayı, sağlayıcıları, önerileri ve Birlikte İzle’yi test ediyor. Sınırları: Birlikte İzle odaları backend’in belleğinde tutuluyor ve backend yeniden başladığında kapanıyor, TV uygulamaları fiziksel bir televizyonda değil CI’da test ediliyor, Orbis de güvenilir bir ev ağı için tasarlandı. Sağlayıcılara tek bir iş vermek, yani yalnızca kaynağı bulmak, oynatma mantığını tek bir yerde tuttu.'
---
