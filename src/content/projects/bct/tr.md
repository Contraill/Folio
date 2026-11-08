---
since: Yaz 2025
desc: "Yönetim paneli olan bir Vue ve Firebase tarama anketi; 2025’teki bir stajda yazıldı, sonra Firestore kuralları, sunucunun verdiği yönetici rolü ve emülatör testleriyle güvenli hâle getirildi."
case:
  lede: "Üç haftalık bir stajda başlayan, sonra kimin neyi göreceğine tarayıcı değil sunucu karar versin diye yeniden kurulan bir tarama anketi."
  stack: "Vue 3 · Vue Router · PrimeVue · Vite · Firebase Auth · Cloud Firestore · Firebase Hosting · Firestore Rules · Firebase Emulator Suite · GitHub Actions"
  facts:
    - - "3"
      - "haftalık staj, 27 Temmuz – 15 Ağustos 2025"
    - - "1"
      - "erişime karar veren yer: Firestore kuralları"
    - - "AA"
      - "metin ve düğmelerde WCAG kontrastı"
  sections:
    - kind: overview
      title: "Genel bakış"
      paras:
        - "Katılımcı bir hesap açar ve bir meme kanseri tarama anketini yanıtlar, yöneticiler de yanıtları bir panelde inceler. Tıbbi bir cihaz değildir: teşhis, puan ya da tavsiye vermez; repoda yalnızca sentetik veri var."
    - title: "Stajda yapılanlar"
      list:
        - - "Hesaplar"
          - "Onaylı kayıt, e-posta doğrulama, uygulama içinde parola sıfırlama ve değiştirme, kimin hesabı olduğunu belli etmeyen genel hata mesajları."
        - - "Anket"
          - "Kişisel bilgiler, HRT ve menopoz, BRCA genleri, aile öyküsü, alerjiler, sigara, elektronik sigara ve alkol; koşullu alanlar ve anlık doğrulamayla."
        - - "Yönetim paneli"
          - "Arama, kullanıcı ayrıntıları, toplu istatistikler, CSV dışa aktarımı ve kaydı açıp kapatan bir düğme."
        - - "Mobil"
          - "Dokunmatik ekranlar için ayarlanmış düzen, tarih seçici ve seçim kontrolleri."
    - title: "Sonradan güvenli hâle getirildi"
      paras:
        - "Staj sürümü yönetici yetkisine tarayıcıda karar veriyordu. Sonraki çalışma, arayüzü yeniden tasarlamadan her kararı sunucuya taşıdı."
      list:
        - - "Firestore kuralları"
          - "Kullanıcı yalnızca kendi kaydını okur ve yazar, kaydın biçimi denetlenir; yöneticiler kayıtları okuyabilir ama kimsenin yanıtını değiştiremez."
        - - "Yönetici rolü"
          - "İlk yönetici yalnızca Admin SDK ile, tarayıcının dışında oluşturulabilir; bir yönetici kendi yetkisini kaldıramaz."
        - - "Tarayıcıdan yükselme yok"
          - "Koda gömülü yönetici listesi, ortam anahtarları ve acil durum yönetici modu kaldırıldı."
        - - "Emülatör testleri"
          - "Kural ve smoke testleri, gerçek bir projeye asla ulaşamayan demo bir projeyle Firebase Emulator’da çalışır."
        - - "Dağıtım kapıları"
          - "Hosting dağıtımları testleri bekler; testleri başarısızken kurallar dağıtılamaz."
    - title: "Daha sakin bir arayüz"
      paras:
        - "Arayüz varsayılan mavi ve yeşilden, tek bir token setinde tutulan yumuşak bir gül paletine geçti; WCAG AA’yı geçmesi için gereken yerlerde koyulaştırıldı ve her kontrolde görünür bir odak çerçevesi var."
    - title: "Ekranlar"
      gal:
        - - src: /assets/bct_form.webp
            w: 1280
            h: 900
          - "Anket"
        - - src: /assets/bct_signin.webp
            w: 1280
            h: 900
          - "Giriş"
        - - src: /assets/bct_admin.webp
            w: 1280
            h: 900
          - "Sentetik hesaplarla yönetim paneli"
---
