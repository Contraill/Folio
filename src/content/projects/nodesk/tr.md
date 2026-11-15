---
since: Eki 2026
desc: Ev ağının, uzaktaki evlerin, sunucuların ve Tailscale ağının canlı haritası. Hiç port taraması yapmayan bir Raspberry Pi üzerinde çalışıyor; cihazları, kendileri hakkında duyurdukları bilgilerden tanıyor.
case:
  lede: Hangi ağda ne var, çalışıyor mu, ne değişti; tek bir port taraması yapmadan.
  stack: Python (standard library) · Raspberry Pi · Tailscale · OpenWrt · Docker · nginx · ntfy / Telegram
  facts:
  - - '0'
    - port taraması
  - - '5'
    - dakikada bir ajan raporu
  - - '2'
    - 'ajan: OpenWrt router’lar ve Linux sunucular'
  sections:
  - title: Genel bakış
    paras:
    - Nodesk; bir ev ağının, OpenWrt router’ın arkasındaki uzak bir evin, bulut sunucularının ve bir Tailscale ağının canlı, tek sayfalık haritası. Bir Raspberry Pi üzerinde çalışıyor ve hangi cihazın nerede olduğunu, çevrim içi olup olmadığını, hangi servislerin çalıştığını ve makinelerin birbirine nasıl ulaştığını gösteriyor. Arayüz İngilizce ve Türkçe.
  - title: Neden yaptım
    paras:
    - Bir ağı haritalamanın alışılmış yolu her cihazı taramak; bu hem ağda gürültü yaratıyor hem de çoğu zaman router’ın markasına bağlı kalıyor. Ben her modem, menzil genişletici ve router ile çalışan, gösterdiği cihazlara hiçbir zaman bağlanmayan bir harita istedim.
  - title: Neler yaptım
    list:
    - - Dinleyerek tanıma
      - Cihazlar, ağa katılırken (DHCP) ve ağda (mDNS, SSDP) duyurdukları bilgilerden ve Pi’nin kendi ARP tablosundan tanınıyor. Adını duyurmayan cihazlara günde yalnızca bir kez ad sorgusu gönderiliyor.
    - - Veriyi kendisi gönderen ajanlar
      - Uzaktaki router’lar ve sunucular kendi verilerini beş dakikada bir, bir anahtarla Pi’ye gönderiyor ve yeni sürümleri de Pi’den kendileri alıyor. Pi onlara hiçbir zaman bağlantı açmıyor.
    - - Tailscale ağı
      - Kim kime doğrudan, kim bir aktarıcı (DERP) üzerinden ulaşıyor ve kim hangi çıkış düğümünü kullanıyor.
    - - Bildirimler
      - Yeni cihazlar, çöken servisler, sessizleşen ajanlar ve çıkış düğümü değişiklikleri için isteğe bağlı ntfy ya da Telegram mesajları.
    - - Bağımlılık yok
      - Python’ın standart kütüphanesi ve tek dosyalık bir web arayüzü; arayüzü bir container’daki nginx sunuyor.
  - title: En zor kısım
    list:
    - - Adresini değiştiren telefonlar
      - Telefonlar her Wi-Fi ağında farklı, rastgele bir MAC adresi kullanıyor; bu yüzden tek bir telefon birkaç farklı cihaz gibi görünebiliyor. Nodesk, aynı adı duyuran (fabrika çıkışı adlar sayılmıyor) ya da yapılandırmada aynı adı taşıyan adresleri tek cihaz sayıyor; bir cihaz kaybolup hemen ardından başka biri belirdiğinde de kullanıcıya soruyor.
    - - İki kez sayılan cihazlar
      - Hem kabloyla hem Wi-Fi ile bağlı bir cihaz ya da iki MAC adresi olan bir menzil genişletici iki kez görünebiliyordu. Nodesk bunların her birini bir kez gösteriyor; MAC adresini değiştiren genişleticilerin arkasındaki cihazları ise yanlışlıkla birleştirmemek için ayrı tutuyor.
  - title: Sonuç
    paras:
    - 'Uydurma verilerle çalışan canlı bir demo GitHub Pages’te yayında. Birim, API, betik ve arayüz testleri tek bir komutla çalışıyor; harita da üst üste binen kartları ve kesişen çizgileri kendi kendine denetliyor. Öğrendiğim şey: bir ağ, üzerindeki cihazlara dokunmadan, yalnızca dinleyerek de iyi haritalanabiliyor.'
---
