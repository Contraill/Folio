---
since: Yaz 2025
desc: Admin paneli olan, Vue ve Firebase ile yazılmış bir tarama anketi. 2025’teki stajımda geliştirdim; sonra Firestore kuralları, sunucu tarafından verilen admin rolü ve emulator testleriyle güvenli hale getirdim.
case:
  lede: Üç haftalık bir stajda başlayan, sonra kimin neyi göreceğine tarayıcının değil sunucunun karar vermesi için yeniden düzenlenen bir tarama anketi.
  stack: Vue 3 · Vue Router · PrimeVue · Vite · Firebase Auth · Cloud Firestore · Firebase Hosting · Firestore Rules · Firebase Emulator Suite · GitHub Actions
  facts:
  - - '3'
    - haftalık staj, 27 Temmuz – 15 Ağustos 2025
  - - '1'
    - 'erişime karar veren tek yer: Firestore Rules'
  - - AA
    - metin ve butonlarda WCAG kontrastı
  sections:
  - title: Genel bakış
    paras:
    - 'Katılımcı bir hesap açıp meme kanseri tarama anketini dolduruyor, yöneticiler de cevapları bir panelden inceliyor. Bu bir tıbbi cihaz değil: teşhis, skor ya da tavsiye vermiyor; depoda da yalnızca sentetik veri var.'
  - title: Neden yaptım
    paras:
    - 'Proje 2025 yazındaki stajımda başladı: staj yaptığım şirket, projelerinden birinden esinlenerek kendi versiyonumu geliştirmemi istedi; koda bir katkıları olmadı. Staj bittikten sonra da üzerinde çalışmaya devam ettim, çünkü staj sürümünde admin yetkisine tarayıcı karar veriyordu.'
  - title: Stajda neler yaptım
    list:
    - - Hesaplar
      - Onaylı kayıt, e-posta doğrulama, uygulama içinde parola sıfırlama ve değiştirme; kimin hesabı olduğunu ele vermeyen genel hata mesajları.
    - - Anket
      - Kişisel bilgiler, HRT ve menopoz, BRCA genleri, aile öyküsü, alerjiler, sigara, elektronik sigara ve alkol; koşullu alanlar ve anlık doğrulama ile.
    - - Admin paneli
      - Arama, kullanıcı ayrıntıları, toplu istatistikler, CSV dışa aktarma ve kaydı açıp kapatma.
    - - Dağıtım
      - GitHub Actions her merge’de Firebase Hosting’e dağıtıyor ve her pull request için bir önizleme kanalı açıyor.
  - title: En zor kısım
    paras:
    - 'Staj sürümünde admin yetkisine tarayıcıda karar veriliyordu: koda yazılmış bir e-posta listesi, ortam değişkenleri ve ilk ziyaretçiyi admin yapan bir acil durum modu. Tarayıcıda çalışan kodu herkes değiştirebildiği için bu bir yetki yükseltme riskiydi. Arayüzü yeniden tasarlamadan bütün kararları sunucuya taşıdım:'
    list:
    - - Firestore Rules
      - Kullanıcı yalnızca kendi kaydını okuyup yazabiliyor ve kaydın yapısı denetleniyor; adminler kayıtları okuyabiliyor ama kimsenin cevaplarını değiştiremiyor.
    - - Admin rolü
      - İlk admin yalnızca tarayıcının dışında, Admin SDK ile oluşturulabiliyor; bir admin kendi yetkisini kaldıramıyor.
    - - Tarayıcı yalnızca gösteriyor
      - Koda yazılı liste, ortam değişkenleri ve acil durum modu kaldırıldı. Tarayıcıdaki kontroller artık yalnızca arayüzde neyin görüneceğini belirliyor; asıl kararı kurallar veriyor.
    - - Emulator testleri
      - Kural ve smoke testleri, gerçek bir projeye asla ulaşamayan bir demo projesiyle Firebase Emulator üzerinde çalışıyor.
    - - Dağıtım kapıları
      - Hosting dağıtımları testleri bekliyor; testleri başarısız olan kurallar dağıtılamıyor.
  - title: Sonuç
    paras:
    - 'Uygulama kullanıcılar için aynı şekilde çalışıyor, ama kimin neyi göreceğine artık sunucu karar veriyor. Ardından arayüz varsayılan mavi ve yeşilden, tek bir token setinde tutulan yumuşak bir gül rengi paletine geçti; renkler gereken yerlerde WCAG AA’yı karşılayacak kadar koyulaştırıldı. Çıkardığım ders: bir şeyi arayüzde gizlemek güvenlik değil; güvenliği sunucudaki kurallar sağlıyor.'
  - title: Ekranlar
    gal:
    - - src: /assets/bct_form.webp
        w: 1280
        h: 900
      - Anket
    - - src: /assets/bct_signin.webp
        w: 1280
        h: 900
      - Giriş
    - - src: /assets/bct_admin.webp
        w: 1280
        h: 900
      - Sentetik hesaplarla admin paneli
---
