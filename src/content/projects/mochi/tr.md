---
since: Eki 2026
desc: ESP32-C3 üzerinde çalışan animasyonlu OLED masa arkadaşı. Dokunmaya, sevmeye ve sallanmaya tepki verir.
case:
  lede: 128×64 OLED üzerinde, dokunduğunu, sevdiğini ya da kaldırdığını fark eden küçük animasyonlu bir yüz.
  stack: ESP32-C3 SuperMini · Arduino (C++) · U8g2 · ArduinoJson · LittleFS · Python + Pillow tooling · pytest · Playwright
  facts:
    - - "53"
      - animasyonlu yüz
    - - ≈820 KB
      - hepsi birden, MOC3 biçiminde
    - - 128×64
      - piksel SH1106 OLED
  sections:
    - kind: overview
      title: Genel bakış
      paras:
        - Mochi; ESP32-C3, 1,3" SH1106 OLED, dokunma sensörü ve ivmeölçer etrafında kurulu bir masa arkadaşı. Tek hücreli LiPo ile çalışıyor ve kablo gerektirecek her iş için bir web paneli var.
    - title: Neler yapıyor
      list:
        - - 53 animasyonlu yüz
          - Toplamda yaklaşık 820 KB’a sıkıştırılmış.
        - - Dokunma tepkileri
          - Dürtme, sevme ve uzun sevme.
        - - Hareket tepkileri
          - Hafif ve sert sallama, ivme, serbest düşüş, eğme, kaldırma.
        - - Web paneli
          - "İngilizce ya da Türkçe: yüz galerisi, yüklemeler, tepki eşleme, ayarlar, yapılandırma aktarımı."
        - - Güç farkındalığı
          - Pil seviyesi, düşük pil uyarıları, şarj göstergesi ve hafif, derin ve hibrit uyku.
        - - Kendi animasyon biçimi
          - GIF dönüştürücülü MOC3 (delta + RLE).
    - title: Donanım
      list:
        - - ESP32-C3 SuperMini
          - 4 MB flash.
        - - SH1106 OLED
          - 1,3", SPI, 128×64.
        - - TTP223
          - Kapasitif dokunma sensörü.
        - - MMA8452Q
          - I²C üzerinden ivmeölçer.
        - - LiPo + TP4056
          - Şarj kartı ve pil ölçümü için bölücüyle tek hücre.
---
