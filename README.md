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
  scenes/                   boot · intro · creator · overworld · battle
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
