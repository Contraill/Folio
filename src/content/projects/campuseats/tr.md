---
since: Haz 2026
desc: 'Tek bilgisayarda çalışan, kampüs restoranları için QR ile sipariş sistemi: müşteriler masalarından telefonla sipariş veriyor, personel de siparişleri, masaları ve ödemeleri canlı olarak takip ediyor. Bireysel bitirme projem.'
case:
  lede: Masadaki kodu okutun, telefondan sipariş verin ve siparişinizi mutfaktan masanıza kadar takip edin.
  stack: React 19 · Vite · PWA · Node.js · Express · Socket.IO · SQLite (better-sqlite3) · JWT · node:test
  facts:
  - - '3'
    - 'rol: müşteri, yönetici ve admin'
  - - '1'
    - bilgisayar ve tek veritabanı dosyası
  - - '0'
    - 'gerçek ödeme: kart ve IBAN simüle ediliyor'
  sections:
  - title: Genel bakış
    paras:
    - CampusEats, kafeteryalar için QR ile sipariş sistemi. Her masadaki sabit QR kod menüyü müşterinin telefonunda açıyor; personel de siparişleri, masaları, menüyü ve ödemeleri tek bir canlı panelden yönetiyor. Her şey tek bilgisayarda, tek bir SQLite dosyasıyla çalışıyor.
  - title: Neden yaptım
    paras:
    - 'Kampüs kafeteryaları yoğun saatlerde kalabalık oluyor: insanlar menü için, sipariş vermek için ve hesap için bekliyor; personel de siparişleri kâğıt üzerinde takip ediyor. CampusEats’i bu beklemeleri ortadan kaldırmak için, Doğu Akdeniz Üniversitesi’ndeki bireysel bitirme projem olarak geliştirdim.'
  - title: Neler yaptım
    list:
    - - Müşteri uygulaması
      - 'Masadaki koddan açılan bir mobil web uygulaması (PWA): not eklenebilen sepet, aynı masadan birden fazla sipariş, canlı durum takibi, beklemedeki siparişi iptal etme ve garson çağırma.'
    - - Yönetici paneli
      - Masalara göre gruplanmış günün siparişleri ve toplu durum değişikliği, masalar ve QR kodları, menü, ayrıca ciroyu ve en çok satanları gösteren bir özet ekranı.
    - - Admin paneli
      - Restoranları ve yönetici hesaplarını oluşturuyor.
    - - Değişiklikler için tek yol
      - Her değişiklik REST API üzerinden yapılıyor, Socket.IO yalnızca güncellemeleri iletiyor. Böylece yetki kontrolü iki yerde değil, tek bir yerde.
  - title: En zor kısım
    paras:
    - Canlı güncellemelerde verinin yanlış kişiye gitmesi çok kolay; bu yüzden özellikleri yazmadan önce kimin neyi alabileceğine karar verdim.
    list:
    - - Odalar
      - Bir yönetici yalnızca kendi restoranının odasına katılabiliyor; JWT bağlantı kurulurken doğrulanıyor. Müşterilerin hesabı yok; bu yüzden siparişin rastgele kimliği o siparişin odasına giriş anahtarı oluyor ve müşteri yalnızca sipariş ekranının ihtiyaç duyduğu alanları alıyor.
    - - Değişebilen roller
      - Yalnızca token’a güvenilseydi, silinen ya da başka bir restorana taşınan bir yöneticinin token’ı çalışmaya devam ederdi. Sunucu kullanıcının rolünü ve restoranını her istekte veritabanından okuyor; böylece bu tür değişiklikler anında geçerli oluyor.
    - - Güvenli anahtar
      - Yerel demo hiçbir ayar gerektirmiyor; ama canlı ortamda ya da herkese açık bir adresin arkasında sunucu, güçlü bir JWT anahtarı olmadan başlamayı reddediyor.
    - - Her misafire aynı kod
      - Masalardaki basılı QR kod hiç değişmiyor. Ödeme onaylanınca masanın oturumu temizleniyor ve bir sonraki müşteri sıfırdan başlıyor.
  - title: Sonuç
    paras:
    - 'Node’un test çalıştırıcısı; yetkilendirmeyi, odaları, sipariş akışını ve ödemeleri bellek içi bir veritabanında test ediyor, testler CI’da Node 20, 22 ve 24 üzerinde çalışıyor. Bir ödeme sağlayıcısı yok: onun yerine kart ve IBAN ödemeleri otomatik onaylanıyor, nakit ödeme ise yöneticinin onayını bekliyor. Arayüz için henüz otomatik test yok.'
  - title: Ekranlar
    gal:
    - - src: /assets/campus_orders.webp
        w: 1440
        h: 900
      - 'Yönetici paneli: masalara göre günün siparişleri'
    - - src: /assets/campus_admin.webp
        w: 1440
        h: 900
      - 'Admin paneli: restoranlar ve yönetici hesapları'
    - - src: /assets/campus_tables.webp
        w: 1440
        h: 900
      - Masalar ve sabit QR kodları
---
