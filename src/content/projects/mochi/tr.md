---
since: Eki 2026
desc: Küçük bir OLED ekranda 53 animasyonlu yüzü olan, ESP32-C3 tabanlı bir masaüstü evcil hayvanı. Dürtmeye, sevmeye ve sallanmaya tepki veriyor; telefondan açılan bir web paneliyle ayarlanıyor.
case:
  lede: 128×64 bir OLED ekranda yaşayan; dokunduğunuzda, sevdiğinizde ya da onu kaldırdığınızda bunu fark eden küçük, animasyonlu bir yüz.
  stack: ESP32-C3 SuperMini · Arduino (C++) · U8g2 · ArduinoJson · LittleFS · Python + Pillow tooling · pytest · Playwright
  facts:
  - - '53'
    - animasyonlu yüz
  - - ≈820 KB
    - hepsi birden, kendi MOC3 formatımda
  - - 128×64
    - piksellik SH1106 OLED
  sections:
  - title: Genel bakış
    paras:
    - Mochi; bir ESP32-C3, 1,3 inçlik bir SH1106 OLED, kapasitif bir dokunma sensörü ve bir ivmeölçer etrafında kurulmuş, tek hücreli LiPo pille çalışan bir masaüstü evcil hayvanı. Yüzler, tepkiler ve ayarlar, telefondan açılan İngilizce ya da Türkçe bir web panelinden yönetiliyor.
  - title: Neden yaptım
    paras:
    - 'Amaç, canlıymış gibi hissettiren küçük bir cihazdı: dokunmaya ve harekete tepki vermeli, pille çalışmalı ve kabloyla değil telefondan ayarlanabilmeliydi.'
  - title: Neler yaptım
    list:
    - - Yazılım (firmware)
      - Yüzler, dokunma ve hareket tepkileri, yakın zamanda oynatılanları tekrar etmeyen rastgele bekleme animasyonları ve hafif, derin ve hibrit uyku modları için Arduino C++.
    - - Tepkiler
      - Dokunma sensöründen dürtme, sevme ve uzun sevme; ivmeölçerden hafif ve sert sallama, ivmelenme, serbest düşme, eğilme ve kaldırılma.
    - - Web paneli
      - Yüz galerisi ve yükleme, tepki eşleştirme, ayarlar ve yapılandırmayı içe ya da dışa aktarma; cihaz paneli kendi Wi-Fi erişim noktası üzerinden sunuyor.
    - - Araçlar
      - GIF’leri kendi animasyon formatıma dönüştüren ve yazdığı her dosyayı yeniden çözerek denetleyen bir Python dönüştürücüsü.
  - title: En zor kısım
    list:
    - - Küçük bir belleğe 53 yüz
      - 'Sıkıştırılmadan saklansa yüzler 2,4 MB’lık dosya sisteminin yaklaşık 2,3 MB’ını kaplardı. MOC3 adında bir format tasarladım: her kare bir öncekiyle XOR’lanıyor, böylece değişmeyen pikseller sıfıra dönüşüyor; sonuç da run-length encoding ile sıkıştırılıyor. 53 yüzün hepsi artık yaklaşık 820 KB, yani ham boyutun %36’sı. Kareler bir yüz yüklenirken bir kez çözülüyor, böylece oynatma işlemciye yük bindirmiyor; bunun bedeli, bir animasyonun ne kadar uzun olabileceğini depolamanın değil RAM’in belirlemesi.'
    - - Kartın okuyamadığı sensör
      - Prototip kartta pinin dijital girişi, dokunma sensörünün 2,9 V’luk çıkışını artık yüksek olarak algılamıyordu. Sensörü bunun yerine histerezis ve debounce ile ADC üzerinden okudum; bu yöntem sağlam kartlarda da çalışıyor.
    - - Çakışan hareketler
      - On hızlı dokunuş Wi-Fi’ı açıyor, beş dokunuş pil seviyesini gösteriyor; yani Wi-Fi hareketinin ilk beş dokunuşu pil hareketiyle de eşleşiyor. Pil hareketi kısa bir duraklamayı bekliyor, ikisi birden eşleşirse Wi-Fi kazanıyor ve bir hareketi tamamlayan dokunuş ayrıca dürtme sayılmıyor.
    - - Gevşek bir kablo
      - İvmeölçerin kesme sinyali saniyede 30’dan fazla tetiklenirse, ki gevşek bir kabloda böyle oluyor, yazılım yoklama (polling) moduna geçiyor; böylece cihazın geri kalanı yanıt vermeye devam ediyor.
  - title: Sonuç
    paras:
    - CI’da iki firmware sürümü derleniyor ve bölüm boyutuna sığıp sığmadıkları denetleniyor; dönüştürücü ve tüm hazır yüzler test ediliyor, İngilizce ve Türkçe sürümlerin uyumlu kaldığı kontrol ediliyor, iki web paneli de sahte bir cihaza karşı başsız bir tarayıcıda çalıştırılıyor. Bu proje bana yalnızca veri sayfasındaki karta göre değil, beklendiği gibi davranmayan donanıma göre de plan yapmayı öğretti.
---
