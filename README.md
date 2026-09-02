# Kuantum Enkazı · Quantum Wreck

Mobil odaklı, 8-bit bir uzay/hayatta kalma RPG'si. Vanilla JavaScript, HTML5
Canvas ve CSS3 dışında hiçbir bağımlılığı yoktur — motor, harita, spritelar ve
müzik dâhil her şey tarayıcıda kod ile üretilir. Tek bir dosyayı açmak yeterlidir.

*A mobile-first 8-bit space survival RPG. No dependencies beyond vanilla
JavaScript, HTML5 Canvas and CSS3 — the engine, world, sprites and music are all
generated in code at runtime. Open one file and play.*

---

## Çalıştırma · Running

```bash
# Doğrudan aç / open directly
xdg-open index.html          # veya tarayıcıya sürükleyip bırakın

# Ya da yerel bir sunucu ile / or serve locally
python3 -m http.server 8000  # http://localhost:8000
```

Derleme adımı, paket yöneticisi ve varlık (asset) dosyası yoktur.
*No build step, no package manager, no asset files.*

---

## Kontroller · Controls

| Dokunmatik | Klavye | İşlev / Action |
|---|---|---|
| Sanal D-Pad (analog, sürüklenebilir) | Ok tuşları / WASD | Hareket · Move |
| **A** | `Z` · `Boşluk` · `Enter` | Etkileşim, onay · Interact, confirm |
| **B** (basılı tut) | `X` · `C` · `Shift` | Koşu (dayanıklılık harcar) · Sprint |
| ☰ · ⚒ · ◈ | `Esc` · `E` · `M` | Menü · Tezgâh · Harita |

D-Pad çok dokunuşludur: sol elle yön verirken sağ elle aksiyon tuşlarına
basabilirsiniz. Tüm dokunmatik hedefler en az 44×44 pikseldir. Arayüz hem dikey
hem yatay ekrana uyarlanır.

*The D-pad is multi-touch and analogue (drag inside it to steer). Every touch
target is at least 44×44 px. The UI adapts to both portrait and landscape.*

---

## Oyun Sistemleri · Game Systems

### Dünya · World
384×384 tile'lık bir gezegen, Perlin/fbm gürültüsünden deterministik olarak
üretilir. Doku gürültüsü **dünya piksel koordinatından** türetildiği için harita
tile sınırlarında kopmaz; biyom sınırları Bayer taramasıyla harmanlanır — sonuç
dikişsiz (seamless) kayan gerçek bir 8-bit arazidir.

Biyomlar: Kül Ovaları, Cam Çölü, Buzul, Mantar Ormanı, Zehirli Bataklık, Kanyon,
Kaya Sırtları, Kıyı ve Kuantum Denizi.

### Gün döngüsü ve hava · Day cycle and weather
Bir oyun günü ~6 dakikadır. Gece düşman havuzunu ve stres artışını değiştirir.
Hava olayları — radyasyon fırtınası, asit yağmuru, tipi, kum fırtınası, spor
bulutu — biyoma göre gelir, kuşamınızı aşındırır ve **cihazlarınızı bozabilir**.
Bir *hava kalitesi sensörü* ürettiyseniz fırtına gelmeden dakikalar önce uyarı
alırsınız; üretmediyseniz habersiz yakalanırsınız.

### Mühendislik tabanlı crafting
Çalışma masasında basit aletler değil, spesifik cihazlar üretilir:

- **ESP32 mikrodenetleyici** — diğer tüm cihazların beyni (kuvars osilatör + telsiz katmanı)
- **Hava kalitesi sensörü** — partikül ve iyonizasyon okur, fırtına tahminini açar
- **Ultrasonik radar** — yankı haritalama; savaşta düşmanın zayıf noktasını bulur
- **Multimetre** — bozulan cihazların arıza tespiti için şart
- **İletişim modülü, uçuş kontrolcüsü, kalkan modülü, kamp feneri**

Karmaşık şemaların bir arıza ihtimali vardır. Arızalı bir kart **multimetre
mini-oyunuyla** onarılır: seri devrede gerilim düğüm düğüm düşer, arızalı
düğümden sonrası `0.00 V` ve `OL` okur. Üç prob hakkınızla ikili arama yaparak
arızayı bulmanız gerekir — yanlış düğümü işaretlerseniz kart yanar.

### Araçlar ve keşif (Metroidvania)
- **Arazi Rover'ı** — dağ bisikleti dinamikleriyle: tekli aynakol (dar-geniş diş
  profili zinciri arazi darbelerinde tutar, ön aktarıcı yok), yüksek sürtünmeli
  **mekanik disk fren** (kablo sahada değiştirilir, hidrolik hat patlamaz) ve
  geniş tırtıklı lastikler. Zehirli bataklığı ve gevşek kumu geçer.
- **Keşif İHA'sı** — **önden çekişli (puller) pervane** konfigürasyonu gövdeyi
  bozulmamış havada tutar; batarya optimizasyonu menzili belirler. Kanyonları
  aşar ve bölgeyi tarar.

Bataklık rover olmadan zırhınızı yer, kanyon İHA olmadan geçilmez.

### Karakter ve kuşam
Ağır uzay zırhının altına giyilen kıyafetler dayanıklılık (stamina) statını
belirler: geniş kesim (boxy-fit) tişört omuz hareketini serbest bırakır, teri
kılcal kanallarla dışarı taşıyan **Dri-Fit** teknik kumaş nemin zırh içinde
birikmesini önleyip yenilenmeyi hızlandırır, kalın ara tabanlı **yastıklamalı
keşif botları** zorlu zeminde darbeyi emer.

### Game feel · Juice
Vuruşun teknik olarak isabet etmesi yetmez; **isabet ettiği hissedilmelidir.**
Her darbede birlikte çalışan katman: **hit-stop** (darbe anında 50–130 ms
donma), ekran sarsıntısı, siluetine maskelenmiş beyaz flaş, geri savrulma,
yerçekimli partikül saçılması ve büyüyerek yükselen hasar sayısı. Hiçbiri hasar
hesabına dokunmaz — Swink'in tanımıyla "altındaki simülasyonu değiştirmeden
etkileşimi güçlendiren cila". Ayrıca müzik dışındaki **her ses ±%12 perde
rastgeleliğiyle** çalınır, böylece tekrar eden efektler kulakta yorulmaz.

### Sinerjiler — kombinasyon ekonomisi
Taktikler tek başına toplanır; **sinerjiler onları birbiriyle çarpar.** Doğru
iki cihazı aynı anda taşımak, tek tek toplamlarından belirgin biçimde güçlüdür:

| Sinerji | Gerekenler | Etki |
|---|---|---|
| Üçgenleme | Radar + İletişim Modülü | Zayıf nokta çarpanı 1.6 → **2.3**, hedefin isabeti kalıcı düşer |
| Yük Biriktirme | Kalkan Modülü + Kondansatör | Aşırı yükleme beklenen her tur için ×1.25 birikir (3 tur = **×1.76**) |
| Hedef İşaretleme | Radar + İHA | Dronla dikkat dağıtma aynı anda zayıf noktayı da açar |
| Erken Uyarı | Hava Sensörü + İletişim Modülü | Savaşa ilk tur sende başlar, düşman sersem |
| Devre Kısası | Multimetre + ESP32 | Parazit düşmanın kalkanını da sıfırlar |
| Çarpma Girişi | Rover + Kalkan Modülü | Savaşa ×1.8 açılış darbesiyle girilir |
| Kırılgan Aşınma | Soğutucu + Asit Kesesi | Soğutulmuş hedefte asit iki kat işler |

Sinerji paneli **"bir adım kaldı"** bölümüyle eksik tek parçayı gösterir —
oyuncuya kuralı anlatmak yerine kancayı sezdiren signposting.

### Kask kaydı — başarısızlık içerik üretir
Ölüm saf ceza değildir. Her karşılaşma ve her yenilgi **kask kaydına** yazılır:

- Üç karşılaşma veya bir yenilgi → o yaratığın zayıf noktasının **yeri** öğrenilir
  (×1.25). Radar hâlâ gerekli: tam açığa çıkarma (×1.6) ve Üçgenleme (×2.3)
  aracın işidir — bilgi aracın yerini almaz.
- Her yenilgi %10, her üç karşılaşma %5 **adaptasyon** (tavan %25) — o yaratığa
  karşı kalıcı hasar artışı. Üç kez yenilmek yaklaşık **+%57** güç demektir.
- Ölüm ekranı bir ceza ekranı değil, bir kayıt ekranıdır: ne öğrenildiğini ve
  toplam ölüm sayısını gösterir. "Ölüm sayın öğrenme sayındır."

### Yardım modu
Ayarlardan istenen an açılıp kapanır: gelen hasar yarıya iner, oksijen yavaş
tükenir, ölünce malzeme kaybedilmez. Hiçbir içeriği kilitlemez, hiçbir şeyi
"kolay" diye işaretlemez.

### Savaş
Haritadaki tehditlere çarpınca büyük mobil butonlu, sıra tabanlı bir savaş
ekranına geçilir. Saldırı silahla sınırlı değildir — taktikler ürettiğiniz
donanıma bağlıdır:

| Taktik | Gerekli donanım |
|---|---|
| Sensörle zayıf nokta bul | Ultrasonik radar |
| Dronla dikkat dağıt | Keşif İHA'sı (+ batarya) |
| Kalkan modülünü aşırı yükle | Kalkan modülü |
| İletişim moduyla parazit | İletişim modülü |
| Plazmayı aşırı ısıt / Soğutucu / Asit kesesi | Silah ve sarf malzemeleri |

Her biyomun sonunda, iklimine uygun bir **bölge hâkimi** vardır — Buz Solucanı,
Asit Golemi, Kum Leviathanı, Spor Devi, Fırtına Harrier'ı. Her biri kendi
direnç/zafiyet profiliyle savaşır ve yenildiğinde bir **Kuantum Çekirdeği
parçası** düşürür. Beş parçayı enkazdaki yuvaya takmak oyunu bitirir.

### Çevresel anlatım · Environmental storytelling
Oyun sana ne yapman gerektiğini söylemez. Enkazın etrafında yanıp sönen kırmızı
oksijen panelleri aciliyeti anlatır; rüzgârın taşıdığı mekanik bir ninni seni
Çöken Arşiv'e götürür; kıyıda suya uzanırken taşlaşmış hayvan siluetleri vahada
ne olduğunu tek kelime etmeden söyler.

**Analog fotoğraf makinesi.** İlk adımlarını atarken küllerin arasında çatlak
lensli, kavrulmuş bir fotoğraf makinesi bulursun. İçinde tek bir kare vardır:
siyah-beyaz bir dünya fotoğrafı, arkasında soluk bir el yazısı. Eşya tabanlı
irfan (item-based lore) buradan işler — makineyi istediğin zaman açabilirsin ve
oyunun ortasındaki açığa çıkışın ardından okuduğun metin değişir.

**Uyarlanabilir müzik.** 8-bit dizileyici stres seviyene, canına, havaya ve
gecenin ağırlığına göre üç gerilim bandı arasında geçer: tempo yükselir, panik
bandında tritona yakın disonan bir gölge katman eklenir. Hologram sahnesinde ise
müzik tamamen susar — sessizlik orada anlatının kendisidir.

**Leitmotif — "Eve Dönüş".** Dört notalık tek bir cümle oyunun her dönüm
noktasında dönüşerek geri gelir: fotoğraf makinesinde saf hâliyle, Alpha'nın
sessiz sonunda ağıt olarak (üçlü indirilmiş), ters köşede bozulmuş ve detune,
Kuantum Yansıması'nda **tersten**, "silmek" finalinde her nota bir öncekinden
alçak sönerek, "bırakmak" finalinde bir oktav yukarı açılarak. Aynı melodiyi
tanımak, oyuncunun hikâyeyi duymasıdır.

### Anlatı hattı · The story
- **Çöken Arşiv** — yarı gömülü bir kubbe. İçeride titrek mavi bir hologram,
  gökyüzüne bakarak bekleyen bir halkı sessiz bir pandomimle gösterir ve döngü
  bozulup baştan başlar. **Hafıza Bekçisi Alpha** yok edilmesi gereken bir
  canavar değil, belleği radyasyonla gün gün silindikçe acı çeken bir yapay
  zekâdır; saldırıları silah değil bozulmuş ninnilerdir. Craft ettiğin devrelerle
  **pasifist bir çözüm** üretip sistemini devre dışı bırakabilirsin. İki yol da
  aynı yere çıkar: patlama olmaz, optik lenslerinin ışığı yavaşça söner.
- **Kuruyan Vaha** — merkezine saplanan bir çekirdek parçasının asit gölüne
  çevirdiği havza. **Kayıp Leviathan** sana saldırmak istemez, sadece acıyı
  durdurmak ister. Devrildiğinde asit toprağa çekilir ve çatlaklardan temiz su
  yükselir; vaha kalıcı olarak iyileşir ve bir dinlenme noktasına dönüşür.
- **Ters köşe** — Alpha'nın bıraktığı kilitli veri diski çözüldüğünde yıldız
  haritaları tanıdık çıkar. Bu yabancı gezegen yabancı değildir.
- **Kuantum Yansıması** — son çekirdek yuvaya oturduğunda karşında devasa bir
  canavar değil, kendi siluetin belirir. Rastgele saldırmaz: **senin son
  hamleni tekrarlar.** Vurursan vurur, iyileşirsen iyileşir, sensörle zayıf
  nokta ararsan seninkini bulur, siper alırsan siper alır. Bu bir güç sınavı
  değil, kendi alışkanlıklarını fark etme sınavıdır.
- **İki son** — çekirdeği onarıp zamanı bükerek Dünya'nın bu karanlık sonunu
  tamamen silmek, ya da parçaları toprağa gömüp yaralı ekosistemin küllerinden
  evrimleşmesine izin vermek. Seçim geri alınmaz ve kayıt oyun bitince silinir.

### NPC'ler ve takas ekonomisi
Kamplar her yeni oyunda rastgele konumlanır.

- **Eko** (Yeraltı Sinyalcisi) — Sanyo tarzı manyetik kaset mekanizmalarını ve
  antika CD okuyucu lenslerini onarır; karşılığında zırhınıza iletişim modülü verir.
- **Valkyrie** (Hava Keşifçisi) — uçurumlarda yaşar; aerodinamik uçuş verisi
  karşılığında gelişmiş uçuş kontrolcü şemaları sağlar.
- **Krank** (Göçebe Tamirci) — araç dayanıklılık modüllerini yalnızca işlenmiş
  titanyum kablo karşılığında satar.
- **Tome** (Kayıp Arşivci) — yıkık kütüphanelerde bulunur; veri kristalleri
  karşılığında kare kare renklendirilmiş fantastik manga serileri ve dijital
  çizgi roman arşivleri verir. Bunlar kamp ateşinde okununca stresi düşürür.
- **Merkez İstasyon** — Levazımcı Vela ve Simsar Odd; Enerji Kredisi (EC) ile
  temel ihtiyaçlar, şemalar ve istasyon tezgâhı.

### Kayıt · Saving
Konum, envanter, kuşam, görev ilerlemesi, dünya keşfi, kurulan fenerler, araçlar
ve NPC stokları 20 saniyede bir ve sahne geçişlerinde LocalStorage'a yazılır.

### Dil · Language
Türkçe ve İngilizce. İlk açılışta tarayıcı diline göre seçilir; ana menüden veya
Ayarlar panelinden anında değiştirilebilir.

---

## Kod Yapısı · Code Structure

```
index.html
css/style.css               Mobil arayüz, D-Pad, CRT/glitch efektleri
js/
  core/
    utils.js                Matematik, deterministik RNG, Perlin/fbm, olay veriyolu
    i18n.js                 İki dilli metin katmanı (t / L)
    audio.js                Web Audio sentezi: SFX + adım dizileyici müzik
    input.js                Sanal D-Pad (analog, çok dokunuşlu), A/B, klavye
    pixel.js                Ekran ölçekleme, piksel çizim, 3x5 bitmap font
    scene.js                Sahne yığını ve ana döngü
    save.js                 LocalStorage kayıt katmanı (sürümlü şema)
  game/
    data.items.js           Eşya veritabanı
    data.craft.js           Şemalar
    data.enemies.js         Düşmanlar ve bölge hâkimleri
    data.npc.js             NPC'ler, takas ağı, diyaloglar
    data.quests.js          Görevler ve arşiv (codex)
    data.synergy.js         Cihaz sinerjileri (kombinasyon ekonomisi)
    path.js                 Izgara tabanlı A* yol bulma (yığın + görüş hattı)
    world.js                Üretim, biyomlar, chunk çizimi, POI'ler, zaman
    weather.js              Dinamik hava ve parçacıklar
    sprites.js              Tüm görsellerin prosedürel üretimi
    player.js               Statlar, hareket, kuşam etkileri, tehlikeler
    inventory.js            Taşıma, kuşanma, kullanma
    crafting.js             Üretim, şema kilitleri, multimetre mini-oyunu
    vehicles.js             Rover ve İHA
    entities.js             Gezinen düşmanlar, doğma/silinme
    combat.js               Sıra tabanlı savaş motoru
    quests.js               Görev motoru (olay tabanlı)
  ui/                       HUD, diyalog kutusu, tam ekran paneller
  scenes/                   boot · intro · creator · overworld · hologram · battle
  main.js                   Açılış, oyun durumu, ölüm ve final
```

### İçerik eklemek · Adding content
Veri dosyaları saf tablodur; her modül bir `add()` fonksiyonu açar. Yeni bir
biyom, düşman, NPC, şema ya da eşya eklemek motoru değiştirmeyi gerektirmez:

```js
QW.Items.add('plasma_coil', { cat: 'comp', value: 40, w: 0.3,
  icon: { s: 'coil', c: '#ff8f4d', c2: '#7a3a10' },
  name: { tr: 'Plazma Bobini', en: 'Plasma Coil' },
  desc: { tr: '...', en: '...' } });

QW.Recipes.add('r_plasma_coil', { cat: 'elec',
  need: { copper: 4, quartz: 1 }, out: { id: 'plasma_coil', n: 1 },
  name: { tr: 'Plazma Bobini', en: 'Plasma Coil' } });
```

Arayüz metinleri için `QW.I18N.extend({ key: { tr: '...', en: '...' } })`.

---

## Kütüphane Değerlendirmesi · Library Assessment

Proje bilinçli olarak bağımlılıksızdır. Aşağıdaki kütüphaneler değerlendirildi;
kararlar tahminle değil, tarayıcıda yapılan ölçümlerle verildi.

| Kütüphane | Karar | Gerekçe (ölçüm) |
|---|---|---|
| **PathFinding.js** | ✅ Fikir alındı, ~150 satır A* projeye gömüldü | Gerçek bir kusuru işaret ediyordu: düşmanlar engele çarpınca hızlarını ters çeviriyordu. Engelli 50 senaryoda oyuncuya ulaşma 26 → 34 çıktı, kare maliyeti ~0.4 ms. Kütüphane yerine ızgaraya özel, önbellekli bir uygulama yazıldı. |
| **simplex-noise.js** | ❌ Alınmadı | Ölçüldü: bu oyunda Perlin'den **%50 daha yavaş**. Simplex'in asıl avantajı 3B/4B'de (O(n²) vs O(2ⁿ)); 2B'de 4 yerine 3 köşe kazancı, ek kurulum maliyetini karşılamıyor. 400k örnekte 67 ms (Perlin) / 100 ms (Simplex). |
| **LocalForage** | ❌ Gerek yok | Ölçüldü: harita %100 keşfedilmiş + 4000 hasat kaydıyla en kötü durum **129 KB** — LocalStorage'ın ~5 MB sınırının %2.5'i. IndexedDB'ye geçmek sorunu olmayan bir yeri karmaşıklaştırırdı. Bunun yerine keşif ızgarası bit maskesi + base64 ile saklandı: **129 KB → 43 KB**, kayıpsız. |
| **Howler.js** | ❌ Uygun değil | Howler örneklenmiş ses *dosyalarını* çalmak için tasarlandı. Bu oyunda hiç ses dosyası yok; tüm müzik ve efektler Web Audio osilatörleriyle anlık sentezleniyor. Howler bu işe hiçbir şey katmaz, yalnızca ağırlık ekler. |
| **Tiled** | ❌ Şimdilik gereksiz | Haritanın tamamı Perlin ile üretiliyor; elle çizilmiş tek bir tile yok. Yeni bölümler (kubbe içi, vaha) da prosedürel çiziliyor. Elle tasarlanmış iç mekânlar eklenirse yeniden değerlendirilmeli. |
| **Vite** | ❌ Varsayılan olarak hayır | Derleme adımı eklemek "index.html'i aç ve oyna" özelliğini bitirir; bu, projenin ilk gereksinimiydi. Script sırası bağımlılığı gerçek bir kırılganlık, ancak 25 dosya bu ölçekte yönetilebilir. İstenirse eklenebilir. |

Ölçüm ortamı: Chromium 1194, 390×844 mobil görünüm, `file://` üzerinden.

---

## Tasarım Ölçütleri · Design Metrics

Oyun tasarımı literatüründeki ölçütler nereye oturuyor — tahmin değil, ölçüm:

| Ölçüt | Önce | Sonra | Yöntem |
|---|---|---|---|
| **Siluet ayırt ediciliği** — en karışabilir yaratık çifti (IoU) | 0.91 | **0.75** | Blackout testi: her yaratık alfa maskesine indirgenip ikili Jaccard benzerliği ölçüldü |
| Riskli çift sayısı (IoU > 0.75) | 10 | **2** | aynı |
| Ortalama ikili IoU | 0.511 | **0.468** | aynı |
| **Zayıf nokta çarpanı** — bilgi / radar / sinerji | 1.6 (tek) | **1.25 / 1.6 / 2.3** | Savaş motorunda ölçülen hasar |
| **Adaptasyon** — 3 yenilgi sonrası hasar artışı | yok | **+%57** | 200 vuruşluk ortalama |
| **Yük biriktirme** — 3 tur beklemenin getirisi | yok | **×1.76** | Anlık vs biriktirilmiş aşırı yükleme |
| **Kare süresi** (medyan / p99) | 16.7 / 17.3 ms | **16.7 / 17.5 ms** | 10 sn kesintisiz yürüyüş, 570 kare |

Siluet testi `scratchpad/silhouette.js` mantığıyla tekrar üretilebilir: her
yaratık 24×16 tuvale çizilir, alfa > 40 olan pikseller siluet sayılır ve tüm
çiftler için kesişim/birleşim oranı hesaplanır. 0.75 üzeri, oyun içinde
karıştırılma riski demektir.
