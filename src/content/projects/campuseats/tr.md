---
since: Haz 2026
desc: "Tek makinede çalışan, kampüs restoranı için QR ile sipariş: müşteri masasından telefonla sipariş verir, yönetici siparişleri, masaları ve ödemeleri canlı izler. Bireysel bitirme projesi."
case:
  lede: "Masadaki kodu okut, telefonundan sipariş ver ve siparişini mutfaktan masaya kadar izle."
  stack: "React 19 · Vite · PWA · Node.js · Express · Socket.IO · SQLite (better-sqlite3) · JWT · node:test"
  facts:
    - - "3"
      - "rol: müşteri, yönetici ve sistem yöneticisi"
    - - "1"
      - "makine ve tek bir veritabanı dosyası"
    - - "0"
      - "gerçek ödeme: kart ve IBAN benzetim"
  sections:
    - kind: overview
      title: "Genel bakış"
      paras:
        - "CampusEats, Doğu Akdeniz Üniversitesi’nde bireysel bir bitirme projesi; yoğun saatlerde menü, sipariş ve hesap için beklenen kafeteryalar için. Her masanın sabit QR kodu menüyü müşterinin telefonunda açar, personel tek bir canlı panelden çalışır; hepsi tek bir makinede."
    - title: "Üç rol"
      list:
        - - "Müşteri"
          - "Menüyü masadaki koddan açar, notlarla sipariş verir, her siparişi canlı izler, beklemedeyken iptal eder ve garson çağırır."
        - - "Yönetici"
          - "Masaya göre gruplanmış günün siparişleri ve toplu durum değişikliği, masalar ve QR kodları, menü, gelir ve en çok satanların panosu."
        - - "Sistem yöneticisi"
          - "Restoranları ve yönetici hesaplarını oluşturur."
    - title: "Canlı ve yalnızca doğru kişiye"
      paras:
        - "Her değişiklik REST API’den geçer; Socket.IO yalnızca güncellemeleri iletir."
      list:
        - - "Jetonlar"
          - "Yönetici ve sistem yöneticisi yolları JWT ister; kullanıcının rolü ve restoranı her istekte veritabanından okunur."
        - - "Odalar"
          - "Yönetici yalnızca kendi restoranının odasına katılabilir. Müşteri, anahtar olarak siparişin rastgele kimliğiyle yalnızca kendi siparişinin odasına girer ve yalnızca sipariş ekranının ihtiyaç duyduğunu alır."
        - - "Gizli anahtar"
          - "Herkese açık bir adreste ya da üretimde, güçlü bir gizli anahtar yoksa sunucu açılmayı reddeder."
        - - "Masa oturumları"
          - "Ödemenin onaylanması masanın oturumunu temizler; aynı QR kodu sıradaki müşteriye hizmet eder."
        - - "Testler"
          - "Node’un test çalıştırıcısı bellek içi bir veritabanında yetkilendirmeyi, odaları, sipariş akışını ve ödemeleri sınar; CI’da Node 20, 22 ve 24 üzerinde."
    - title: "Sınırlar"
      paras:
        - "Bir ödeme sağlayıcısı yok: kart ve IBAN ödemeleri onun yerine kendiliğinden onaylanır, nakit ise yöneticiyi bekler. Ön yüzün otomatik arayüz testleri yok."
    - title: "Ekranlar"
      gal:
        - - src: /assets/campus_orders.webp
            w: 1440
            h: 900
          - "Yönetici paneli: masaya göre günün siparişleri"
        - - src: /assets/campus_admin.webp
            w: 1440
            h: 900
          - "Sistem yöneticisi paneli: restoranlar ve yönetici hesapları"
        - - src: /assets/campus_tables.webp
            w: 1440
            h: 900
          - "Masalar ve sabit QR kodları"
---
