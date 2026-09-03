/* =========================================================================
 * QW.Record — BEDEL: eylemin kalıcı karşılığı
 *
 * Bu oyunun anlatısı diyalogda değil, MEKANİKTE durur.
 *
 * Karşındaki her şey eşit değildir. Hurda sürüngeni bir makinedir; onu
 * söktüğünde kimse acı çekmez. Ama bazı yaratıkların ZİHNİ vardır: acı
 * duyarlar, bir şey isterler, bir şeyden kaçarlar. Oyun bunları `mind`
 * bayrağıyla işaretler ve ikisini asla karıştırmaz — "hiçbir şeyi öldürme"
 * gibi mutlak bir kural koymaz, yalnızca neyin ağırlığı olduğunu söyler.
 *
 * Zihni olan bir yaratığı iki türlü bitirebilirsin:
 *
 *   ÖLDÜRMEK  — hızlıdır, XP ve ganimet verir, hiçbir şey istemez.
 *   ONARMAK   — yavaştır, malzeme yer, ganimet vermez. Ama o şey yaşar.
 *
 * İkincisi bu oyuna özgüdür: burada merhamet "kibar olmak" değildir.
 * Mühendislik oyunu oynuyorsun; bir yaratığı ARIZAYI TEŞHİS EDİP ONARARAK
 * bağışlarsın. Leviathan'ın sırtındaki çekirdek kıymığını çıkarırsın.
 * Alpha'ya silinen belleğinin yerine veri kristali verirsin. Merhamet bir
 * menü seçeneği değil, bir tamir işidir — ve tamir malzeme ister.
 *
 * Kask kaydı bunların hepsini tutar. NPC'ler kaydı okur, Yansıma kaydı
 * sana geri okur, final kaydın üstüne kurulur. Hiçbir seçim ücretsiz ve
 * hiçbir seçim sessiz değildir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const U = QW.Utils;
  const R = QW.Record = {};

  /* ------------------------------------------------------------------
   * ONARIM TANIMLARI
   * Her zihinli yaratığın bir ARIZASI vardır. `need` o arızayı gideren
   * malzemedir; `tool` varsa o cihaz da elinde olmalıdır (teşhis edemezsen
   * neyi onaracağını bilemezsin — radar/multimetre burada işe yarar).
   * ---------------------------------------------------------------- */
  const RELIEF = {
    boss_lost_leviathan: {
      need: { repair_kit: 1, ti_wire: 2 }, tool: 'multimeter',
      verb: { tr: 'Kıymığı çıkar', en: 'Extract the shard' },
      diag: { tr: 'Sırtındaki şişlik bir yara değil. Altında bir şey var ve nabız gibi atıyor.',
              en: 'The swelling on its back is not a wound. Something under it is beating like a pulse.' },
      done: { tr: 'Kabuğu kablo ilmiğiyle açıyorsun. Çekirdek kıymığı çıktığında yaratık bir kez daha bağırıyor — bu sefer başka bir sesle. Sonra bataklığa dönüp gidiyor.',
              en: 'You open the shell with a cable loop. When the shard comes free the creature cries out once more — a different sound this time. Then it turns back into the marsh.' }
    },
    boss_memory_alpha: {
      need: { data_crystal: 3, pcb: 1 }, tool: 'multimeter',
      verb: { tr: 'Belleğini yerine koy', en: 'Restore its memory' },
      diag: { tr: 'Ninni bozuk çünkü kayıt bozuk. Sildiği her şeyin yerinde bir boşluk çınlıyor.',
              en: 'The lullaby is broken because the record is broken. Every erased thing rings as a gap.' },
      done: { tr: 'Kristalleri tek tek yuvalara oturtuyorsun. Ninni düzeliyor — eksik ama düzgün. Alpha susmuyor; sadece artık çığlık atmıyor.',
              en: 'You seat the crystals one by one. The lullaby steadies — incomplete, but whole. Alpha does not fall silent; it simply stops screaming.' }
    },
    boss_ice_worm: {
      need: { coolant: 2, repair_kit: 1 }, tool: 'air_sensor',
      verb: { tr: 'Termal düzenleyicisini onar', en: 'Repair its thermal regulator' },
      diag: { tr: 'Buzun altında donmuyor — YANIYOR. Isı düzenleyicisi bozulmuş, kendi vücudu onu pişiriyor.',
              en: 'Under the ice it is not freezing — it is burning. Its regulator failed; its own body is cooking it.' },
      done: { tr: 'Soğutucuyu hatta basıyorsun. Solucan buzun altına çekiliyor ve orada, ilk defa, hareketsiz kalıyor.',
              en: 'You push coolant into the line. The worm withdraws under the ice and there, for the first time, goes still.' }
    },
    boss_acid_golem: {
      need: { antirad: 1, titanium: 3 }, tool: 'air_sensor',
      verb: { tr: 'Sızıntıyı mühürle', en: 'Seal the leak' },
      diag: { tr: 'Asit onun silahı değil. Gövdesinden sızıyor ve gittiği her yeri kendi istemeden öldürüyor.',
              en: 'The acid is not its weapon. It leaks from its body and kills everywhere it goes, unwilling.' },
      done: { tr: 'Titanyum plakayı çatlağa perçinliyorsun. Golem duruyor, ellerine bakıyor — artık damlamıyorlar.',
              en: 'You rivet titanium over the crack. The golem stops, looks at its hands — they have stopped dripping.' }
    },
    boss_sand_leviathan: {
      need: { lens_opt: 2, ti_wire: 2 }, tool: 'radar',
      verb: { tr: 'Gözlerini temizle', en: 'Clear its eyes' },
      diag: { tr: 'Kör. Cam tozu optiklerini kazımış; ne saldırdığını görmüyor bile.',
              en: 'It is blind. Glass dust has scoured its optics; it cannot even see what it attacks.' },
      done: { tr: 'Kazınmış lensleri söküp yenilerini oturtuyorsun. Leviathan bir süre kıpırdamadan sana bakıyor. Sonra kumun altına iniyor — bu sefer senden uzağa.',
              en: 'You pull the scoured lenses and seat new ones. The leviathan looks at you a long moment. Then it goes under the sand — this time away from you.' }
    },
    boss_spore_titan: {
      need: { spore_tea: 1, bio_fiber: 4 }, tool: 'air_sensor',
      verb: { tr: 'Miselyum ağını ayır', en: 'Cut it from the network' },
      diag: { tr: 'Kendi başına saldırmıyor. Ormanın altındaki ağ ona ne yapacağını söylüyor ve ağ hasta.',
              en: 'It does not attack on its own. The network under the forest tells it what to do, and the network is sick.' },
      done: { tr: 'Bağlantı köklerini lifle sarıp kesiyorsun. Dev bir an sendeliyor — sonra ilk kez kendi başına bir yöne dönüyor.',
              en: 'You wrap and sever the connecting roots. The titan sways once — then turns, for the first time, of its own accord.' }
    },
    boss_storm_harrier: {
      need: { flight_ctrl: 1, servo: 2 }, tool: 'radar',
      verb: { tr: 'Kanat dengeleyicisini değiştir', en: 'Replace its wing stabiliser' },
      diag: { tr: 'Öfkeli değil. Bir kanadı düzgün çalışmıyor ve düşmemek için durmadan dönmek zorunda.',
              en: 'It is not angry. One wing will not hold trim, and it must keep circling or fall.' },
      done: { tr: 'Dengeleyiciyi yerine takıyorsun. Harrier bir daire çiziyor — bu sefer düzgün — ve yükselip gidiyor.',
              en: 'You fit the stabiliser. The harrier makes one circle — level this time — and climbs away.' }
    }
  };
  R.relief = id => RELIEF[id] || null;

  /* Bu yaratığın zihni var mı? (data.enemies.js'teki `mind` bayrağı) */
  R.hasMind = function (id) {
    const d = QW.Enemies.get(id);
    return !!(d && d.mind);
  };

  /* ------------------------------------------------------------------
   * KAYIT
   * ---------------------------------------------------------------- */
  R.blank = () => ({ killed: {}, spared: {}, kills: 0, spares: 0 });

  function log() {
    const L = QW.Game.log;
    if (!L.rec) L.rec = R.blank();
    return L.rec;
  }
  R.state = log;

  R.noteKill = function (id) {
    if (!R.hasMind(id)) return;                 // makineler kayda girmez
    const r = log();
    r.killed[id] = (r.killed[id] || 0) + 1;
    r.kills++;
    QW.bus.emit('record_changed', { kind: 'kill', id });
  };

  R.noteSpare = function (id) {
    const r = log();
    r.spared[id] = (r.spared[id] || 0) + 1;
    r.spares++;
    QW.bus.emit('record_changed', { kind: 'spare', id });
  };

  R.killed = id => (log().killed[id] || 0) > 0;
  R.spared = id => (log().spared[id] || 0) > 0;

  /* Toplam zihinli yaratık sayısı — bandın paydası */
  R.total = () => QW.Enemies.all().filter(R.hasMind).length;

  /* ------------------------------------------------------------------
   * BEDEL BANDI
   *
   * Dünya bu üç banda göre tepki verir. Eşikler oranla değil SAYIYLA
   * belirlenir: tek bir zihni olan şeyi öldürmek "biraz kötü" değildir,
   * ölçülebilir bir olaydır ve kayıtta öyle durur.
   * ---------------------------------------------------------------- */
  R.band = function () {
    const r = log();
    if (r.kills === 0 && r.spares > 0) return 'mender';   // hiçbirini öldürmedin
    if (r.kills === 0) return 'clean';                    // hiçbiriyle karşılaşmadın
    if (r.kills <= 2) return 'marked';                    // birkaçı
    return 'butcher';                                     // yolun üstündeki her şey
  };

  /* Bandın oyuncuya görünen adı ve tek cümlelik özeti */
  R.bandText = function () {
    const b = R.band(), r = log();
    return QW.t('rec_' + b, { k: r.kills, s: r.spares });
  };

  /* ------------------------------------------------------------------
   * YANSIMANIN GÜCÜ
   * Yansıma senin kaydından beslenir. Çok öldürdüysen o da vurur; çok
   * onardıysan vuracak bir şeyi kalmaz ve savaş başka türlü biter.
   * ---------------------------------------------------------------- */
  R.echoProfile = function () {
    const r = log();
    return {
      atkMul: 1 + Math.min(0.6, r.kills * 0.12),
      hpMul: 1 + Math.min(0.5, r.kills * 0.10),
      hollow: r.kills === 0                     // vuracak bir şeyi yok
    };
  };

  /* ------------------------------------------------------------------
   * KAYIT DÖKÜMÜ — Kask Kaydı panelinde ve finalde okunur
   * ---------------------------------------------------------------- */
  R.entries = function () {
    const r = log();
    const ids = new Set(Object.keys(r.killed).concat(Object.keys(r.spared)));
    return Array.from(ids).map(id => ({
      id, def: QW.Enemies.get(id),
      killed: r.killed[id] || 0, spared: r.spared[id] || 0
    })).filter(e => e.def);
  };

  /* Kaydı kayda yaz / kayıttan oku */
  R.serialize = () => U.deepCopy(log());
  R.load = function (d) {
    QW.Game.log.rec = d && d.killed ? d : R.blank();
  };

})(window.QW);

/* =========================================================================
 * QW.Bonds — NPC yayları, sırları ve duruşları
 *
 * Önceki hâlde her NPC bir otomattı: üç selamlama cümlesi, bir takas
 * tablosu, sonsuza kadar tekrar. Ticaret yapıyordun ama kimseyi
 * TANIMIYORDUN.
 *
 * Burada her karakterin üç şeyi var:
 *   İSTEK  — takas masasındaki şey (zaten vardı)
 *   SIR    — o şeyi NEDEN istediği (yoktu)
 *   DURUŞ  — finaldeki iki yoldan hangisini savunduğu (yoktu)
 *
 * Yay, oyuncunun dünyada ilerlemesiyle açılır: konuşma sayısı değil,
 * BAŞARDIĞI ŞEYLER kapıyı açar. Böylece karakterler oyuncunun yolculuğuna
 * eşlik eder, onun yerine saymaz.
 *
 * Duruşlar önemlidir: final artık bir menü değil, aylardır birlikte
 * çalıştığın iki insanın anlaşamadığı bir sorudur. Eko silmeni ister
 * çünkü kimse cevap vermedi. Tome gömmeni ister çünkü kayıt hayattır.
 * Hangisini seçersen seç, birini kırarsın.
 * ======================================================================= */
(function (QW) {
  'use strict';

  const B = QW.Bonds = {};

  /* gate: bu aşamanın açılma koşulu. Hepsi isteğe bağlı, hepsi VE'lenir. */
  const S = {

    /* ================================================================
     * EKO — Yeraltı Sinyalcisi · DURUŞ: SİL
     * 31 yıldır tek bir mesajı tekrar tekrar kaydedip yayınlıyor. Her
     * kopyalamada biraz daha kayboluyor. Artık neredeyse yalnızca hışırtı.
     * ============================================================== */
    eko: {
      stance: 'erase',
      stages: [
        { gate: {},
          lines: [
            { tr: 'Sinyali duydun mu? Hayır, duyamazsın. Ben duyuyorum çünkü dinlemeyi biliyorum.',
              en: 'Did you hear the signal? No, you cannot. I hear it because I know how to listen.' },
            { tr: 'Bana kaset mekanizması getir. Sanyo tarzı olanlardan — makara motoru dönüyorsa gerisini ben hallederim.',
              en: 'Bring me cassette decks. The Sanyo kind — if the reel motor turns, I handle the rest.' }
          ] },
        { gate: { barters: 1 },
          lines: [
            { tr: 'Neden bu kadar kayıt cihazı istiyorum, sormuyorsun. İyi. Soranlara anlatmıyorum zaten.',
              en: 'You do not ask why I want so many recorders. Good. I do not tell the ones who ask.' },
            { tr: 'Yayın yapıyorum. Aşağı yukarı otuz bir yıldır. Aynı mesaj, her gün, aynı frekans.',
              en: 'I broadcast. For about thirty-one years. The same message, every day, the same frequency.' }
          ] },
        { gate: { item: 'comms_module' },
          lines: [
            { tr: 'Modülü yapmışsın. Öyleyse dinleyebilirsin. Otur.',
              en: 'You built the module. Then you can listen. Sit.' },
            { tr: '[Bant dönüyor. Otuz saniye hışırtı. Ortasında bir yerde, bir kadın sesi olabilecek bir şey — ya da olmayabilecek.]',
              en: '[The tape turns. Thirty seconds of hiss. Somewhere in the middle, something that could be a woman’s voice — or could not.]' },
            { tr: 'Ablam. İlkay. Öteki gemideydi. İlk yıl sesi netti. Her kopyalamada biraz gitti.',
              en: 'My sister. İlkay. She was on the other ship. The first year her voice was clear. Every copy took a little.' }
          ] },
        { gate: { flag: 'twist_revealed' },
          lines: [
            { tr: 'Diskteki yıldız haritasını gördün demek. Ben on yıl önce gördüm. Söylemedim çünkü kimse inanmıyordu.',
              en: 'So you have seen the star chart on the disc. I saw it ten years ago. I said nothing because nobody believed it.' },
            { tr: 'Bir mesajı otuz bir yıl üst üste kaydedersen geriye mesaj kalmaz — gürültü kalır. Bu dünya da öyle. Kendi kopyasının kopyası.',
              en: 'Record a message over itself for thirty-one years and no message remains — only noise. This world is the same. A copy of its own copy.' },
            { tr: 'Çekirdeği bulduğunda bana gel. Sana ne yapman gerektiğini söyleyeceğim ve hoşuna gitmeyecek.',
              en: 'When you have the core, come to me. I will tell you what to do and you will not like it.' }
          ] },
        { gate: { fragments: 5 },
          lines: [
            { tr: 'Elinde. Hissediyorum, cihazlarım titriyor.',
              en: 'You have it. I can feel it; my instruments are shaking.' },
            { tr: 'Sil. Bu sonu sil. İlkay\'ın sesi otuz bir yıl önce vardı ve ben onu kendi ellerimle hışırtıya çevirdim. Bu gezegen de öyle — kimse onu kurtarmadı, sadece üstünden defalarca geçildi.',
              en: 'Erase it. Erase this end. İlkay’s voice existed thirty-one years ago and I turned it into hiss with my own hands. This planet is the same — nobody saved it, it was simply recorded over, again and again.' },
            { tr: 'Merhametli olmak istiyorsan hışırtıyı durdur. Devam ettirmek merhamet değil, inat.',
              en: 'If you want to be merciful, stop the hiss. Continuing it is not mercy, it is stubbornness.' }
          ] }
      ],
      toll: {
        mender: { tr: 'Hiçbirini öldürmemişsin. Kayıtları okudum — evet, kaskının kaydını okuyabiliyorum, sinyalci olmanın faydası. Bu ya çok saf ya çok inatçı olduğunu gösterir.',
                  en: 'You killed none of them. I read the logs — yes, I can read your helmet, a signalman’s privilege. That makes you either very naive or very stubborn.' },
        butcher:{ tr: 'Kaydın gürültülü. Yolunun üstündeki her şeyi kapattın. Kızmıyorum — ben de otuz bir yıldır aynı şeyi bir banda yapıyorum.',
                  en: 'Your log is loud. You closed everything that stood in your way. I am not angry — I have been doing the same to a tape for thirty-one years.' }
      }
    },

    /* ================================================================
     * TOME — Arşivci · DURUŞ: GÖM
     * Her şeyi kaydeder. Seni de. Kaydedilmiş olmanın yaşamış olmak
     * demek olduğuna inanır.
     * ============================================================== */
    tome: {
      stance: 'bury',
      stages: [
        { gate: {},
          lines: [
            { tr: 'Veri kristali getir, sana renklendirilmiş cilt vereyim. Kamp ateşinde okunacak bir şey olmadan insan çözülür.',
              en: 'Bring data crystals, I will give you colourised volumes. Without something to read at the campfire a person comes apart.' }
          ] },
        { gate: { barters: 1 },
          lines: [
            { tr: 'Sana verdiklerim kopya. Asılları bende kalıyor. Kırılma, bu bir güvensizlik değil — bir yöntem.',
              en: 'What I give you are copies. I keep the originals. Do not take offence, it is not distrust — it is method.' },
            { tr: 'Bir de senin dosyan var. Gireceğin her kapıyı, öldürdüğün her şeyi yazıyorum. Hayır, izin istemedim.',
              en: 'There is also a file on you. Every door you enter, everything you kill. No, I did not ask permission.' }
          ] },
        { gate: { talks: 4 },
          lines: [
            { tr: 'Ne arşivlediğimi soruyorsun. Son kütüphaneyi. Gerçek anlamda son olanı.',
              en: 'You ask what I archive. The last library. The last one in the literal sense.' },
            { tr: 'Kimse için değil. Okuyacak kimse kalmayabilir. Ama kaydedilmemiş bir şey iki kere ölür ve ben ikincisine izin vermem.',
              en: 'Not for anyone. There may be no one left to read. But a thing unrecorded dies twice, and I do not permit the second death.' }
          ] },
        { gate: { flag: 'twist_revealed' },
          lines: [
            { tr: 'Demek Dünya. Otuz yıldır yabancı bir gezegenin arşivini tuttuğumu sanıyordum.',
              en: 'So it is Earth. For thirty years I thought I was keeping the archive of an alien planet.' },
            { tr: 'Bu her şeyi değiştirir ve hiçbir şeyi değiştirmez. Arşiv artık bir mezar değil — bir tohum.',
              en: 'That changes everything and nothing. The archive is not a tomb now — it is a seed.' }
          ] },
        { gate: { fragments: 5 },
          lines: [
            { tr: 'Eko sana ne dediğini biliyorum. Yanılıyor ve bunu ona söyleyemiyorum çünkü haklı olduğu bir kısım var.',
              en: 'I know what Eko told you. He is wrong, and I cannot tell him so, because there is a part where he is right.' },
            { tr: 'Sil dersen bu dünyanın acısı biter. Ama İlkay\'ın sesi de biter. Alpha\'nın ninnisi de. Senin buraya geldiğin de.',
              en: 'Erase, and this world’s pain ends. So does İlkay’s voice. So does Alpha’s lullaby. So does your having come here.' },
            { tr: 'Parçaları göm. Toprak zehirli ama toprak. Bir şeyin kaydı varsa yaşamıştır; bir şey yaşıyorsa devam edebilir.',
              en: 'Bury the fragments. The soil is poisoned, but it is soil. If a thing is recorded it lived; if a thing lives it can go on.' }
          ] }
      ],
      toll: {
        mender: { tr: 'Dosyanda tuhaf bir sütun var: onardıkların. İlk defa böyle bir sütun açmam gerekti.',
                  en: 'There is an odd column in your file: the ones you repaired. It is the first time I have had to open such a column.' },
        butcher:{ tr: 'Dosyan kalınlaşıyor ve içindekilerin çoğu ölüm. Yargılamıyorum. Kaydediyorum. Aradaki farkı bilirsin.',
                  en: 'Your file is thickening and most of it is deaths. I do not judge. I record. You know the difference.' }
      }
    },

    /* ================================================================
     * KRANK — Tamirci · DURUŞ: yok, ama bedeli en sert o okur
     * Yıllardır bir vinç yapıyor. Uçurumdan bir rover çıkarmak için.
     * İçindekinin öldüğünü biliyor. Durmak, bunu kabul etmek olurdu.
     * ============================================================== */
    krank: {
      stance: null,
      stages: [
        { gate: {},
          lines: [
            { tr: 'Kablo. İşlenmiş titanyum. Başka para tanımıyorum.',
              en: 'Cable. Drawn titanium. I recognise no other currency.' }
          ] },
        { gate: { barters: 2 },
          lines: [
            { tr: 'Bu kadar kabloyu ne yaptığımı merak ediyorsun. Vinç. Büyük bir vinç.',
              en: 'You wonder what I do with all this cable. A winch. A big winch.' },
            { tr: 'Kanyonun dibinde bir rover var. Dört yıldır orada. Çıkaracağım.',
              en: 'There is a rover at the bottom of the canyon. Four years now. I will bring it up.' }
          ] },
        { gate: { talks: 5 },
          lines: [
            { tr: 'İçinde Sevgi var. Ortağımdı. Fren hattı patladı, ben de "hidrolik kullanma" diyen adamım.',
              en: 'Sevgi is inside it. My partner. The brake line burst, and I am the man who says never use hydraulics.' },
            { tr: 'Hayır, hayatta olduğunu düşünmüyorum. Aptal değilim. Ama vinç bitmeden durursam, o zaman gerçekten bitmiş olur.',
              en: 'No, I do not think she is alive. I am not stupid. But if I stop before the winch is done, then it is truly over.' }
          ] },
        { gate: { flag: 'krank_winch' },
          lines: [
            { tr: 'Çıkardık. Sen ve ben. Kabin boştu — kemer çözülmüş. Demek ki yürüyerek çıkmayı denemiş.',
              en: 'We brought it up. You and I. The cabin was empty — the belt was unbuckled. So she tried to walk out.' },
            { tr: 'Dört yıl yanlış şeyi çektim. Ama çektim. Şimdi ne yapacağımı bilmiyorum ve bu, bilmemenin iyi türü.',
              en: 'For four years I hauled the wrong thing. But I hauled it. Now I do not know what to do, and this is the good kind of not knowing.' }
          ] }
      ],
      toll: {
        mender: { tr: 'Buz Solucanı\'nı onarmışsın. Termal düzenleyici, değil mi? Ben olsam da onu yapardım. Kimse inanmaz ama tamirci böyle düşünür.',
                  en: 'You repaired the Ice Worm. The thermal regulator, was it? I would have done the same. Nobody believes it, but that is how a mechanic thinks.' },
        butcher:{ tr: 'Bozuk bir şeyi tamir etmek yerine söküyorsun. Bu bir yöntem. Benim yöntemim değil.',
                  en: 'You take broken things apart instead of fixing them. That is a method. It is not mine.' }
      }
    },

    /* ================================================================
     * VALKYRIE — Hava Keşifçisi
     * Gökyüzünün bitip bitmediğini görecek kadar yükseğe çıkmak istiyor.
     * Haklı çıkacak.
     * ============================================================== */
    valkyrie: {
      stance: null,
      stages: [
        { gate: {},
          lines: [
            { tr: 'Uçurum rüzgârlarından türbülans profili istiyorum. Kanyona in, kaydet, getir.',
              en: 'I want turbulence profiles from the cliff winds. Go down into the canyon, record, bring them back.' }
          ] },
        { gate: { barters: 1 },
          lines: [
            { tr: 'Yükseklik rekoru peşinde değilim. Bir şeyi doğrulamaya çalışıyorum.',
              en: 'I am not after an altitude record. I am trying to confirm something.' },
            { tr: 'Yukarı çıktıkça ufuk düzleşmiyor. Kıvrılıyor. Yanlış yöne kıvrılıyor.',
              en: 'The higher I go, the horizon does not flatten. It curves. It curves the wrong way.' }
          ] },
        { gate: { item: 'drone' },
          lines: [
            { tr: 'Dronu uçurdum. On bir kilometre. Telemetriyi üç kez kontrol ettim.',
              en: 'I flew the drone. Eleven kilometres. I checked the telemetry three times.' },
            { tr: 'Bu gezegen sandığımızdan küçük değil — sandığımızdan ESKİ. Atmosfer yorulmuş. Böyle bir şeyi ancak milyarlarca yıl yapar.',
              en: 'This planet is not smaller than we thought — it is OLDER. The atmosphere is tired. Only billions of years do that.' }
          ] },
        { gate: { flag: 'twist_revealed' },
          lines: [
            { tr: 'Diski açtığını duydum. Ben de aynı sonuca uçarak vardım. İki farklı yoldan aynı yere çıkmak, doğru olduğunun kanıtıdır.',
              en: 'I heard you opened the disc. I reached the same conclusion by flying. Two roads to one place is how you know it is true.' },
            { tr: 'Bir de şu var: eğer burası Dünya\'ysa, ben bir keşifçi değilim. Eve dönmüş biriyim ve evi tanıyamadım.',
              en: 'And there is this: if this is Earth, I am not an explorer. I am someone who came home and did not recognise the house.' }
          ] }
      ],
      toll: {
        mender: { tr: 'Harrier\'ı indirmemişsin. Kanat dengeleyicisi, değil mi? Onu havada gördüm — düzgün uçuyor. Sana borçluyum, tanımasan da.',
                  en: 'You did not bring the Harrier down. The wing stabiliser, yes? I saw it up there — flying level. I owe you, even if you do not know it.' },
        butcher:{ tr: 'Gökyüzü senden sonra sessizleşti. Bunu bir suçlama olarak söylemiyorum, bir gözlem olarak söylüyorum.',
                  en: 'The sky went quiet after you. I do not say that as an accusation. I say it as an observation.' }
      }
    },

    /* ================================================================
     * VELA — Levazımcı · kurumsal akıl
     * ============================================================== */
    station_quartermaster: {
      stance: null,
      stages: [
        { gate: {},
          lines: [
            { tr: 'Merkez İstasyon. Kayıt yaptır, envanterini beyan et, kimseyi vurma. Bu sırayla.',
              en: 'Central Station. Register, declare your inventory, shoot no one. In that order.' } ] },
        { gate: { talks: 3 },
          lines: [
            { tr: 'İstasyon ayakta çünkü kimse burada kimseye bir şey borçlu değil. Duygusal gelmiyor, biliyorum. Otuz yıl dayandı.',
              en: 'The station stands because nobody here owes anybody anything. It is not sentimental. It has lasted thirty years.' } ] },
        { gate: { fragments: 3 },
          lines: [
            { tr: 'Kaç parça topladığını biliyorum. Herkes biliyor. İstasyonda iki kamp var artık — silinsin diyenler ve kalsın diyenler.',
              en: 'I know how many fragments you carry. Everyone does. There are two camps in the station now — erase, and remain.' },
            { tr: 'Ben taraf tutmuyorum. Levazımcıyım. Ama gece nöbetinde ikisini de düşünüyorum.',
              en: 'I take no side. I am the quartermaster. But on night watch I think about both.' } ] }
      ],
      toll: {
        butcher:{ tr: 'Kapıda seni arattırıyorum artık. Kişisel değil. Kayıt böyle.',
                  en: 'I have you searched at the gate now. Nothing personal. The record is the record.' }
      }
    },

    /* ================================================================
     * ODD — Simsar · bilerek değişmeyen tek karakter
     * ============================================================== */
    station_broker: {
      stance: null,
      stages: [
        { gate: {},
          lines: [
            { tr: 'Alırım, satarım, sormam. Üçüncüsü hizmetin asıl kısmı.',
              en: 'I buy, I sell, I do not ask. The third is the actual service.' } ] },
        { gate: { fragments: 5 },
          lines: [
            { tr: 'Herkes sana bir şey söylemeye çalışıyor. Ben söylemeyeceğim. Fiyatlarım iki uçta da aynı.',
              en: 'Everyone is trying to tell you something. I will not. My prices are the same at either end.' },
            { tr: 'Dünya silinirse borcum siliniyor. Kalırsa tahsil ederim. Gördüğün gibi kaybetmem.',
              en: 'If the world is erased my debts go with it. If it remains I collect. As you see, I do not lose.' } ] }
      ],
      toll: {}
    }
  };

  B.def = id => S[id] || null;

  /* Bu aşamanın kapısı açık mı? */
  function gateOpen(g, st) {
    if (!g) return true;
    const G = QW.Game;
    if (g.talks && st.talks < g.talks) return false;
    if (g.barters && (st.doneBarters || []).length < g.barters) return false;
    if (g.flag && !G.flags[g.flag]) return false;
    if (g.item && !QW.Inventory.has(g.item)) return false;
    if (g.fragments && QW.Inventory.count('core_fragment') < g.fragments) return false;
    return true;
  }

  /* Oyuncunun ulaştığı EN İLERİ aşama — konuşma sayısı değil, dünyadaki
     ilerlemesi belirler. Karakter oyuncuya eşlik eder, onu saymaz. */
  B.stageOf = function (npcId) {
    const d = S[npcId]; if (!d) return null;
    const st = QW.NPCState.of(npcId);
    let best = null, bestIx = -1;
    d.stages.forEach((s, i) => { if (gateOpen(s.gate, st)) { best = s; bestIx = i; } });
    return best ? { stage: best, index: bestIx } : null;
  };

  /* Konuşma metni.
     Bir aşamayı İLK kez açtığında bütün satırlarını okursun — orası
     karakterin sana bir şey anlattığı andır. Sonraki uğrayışlarda yalnızca
     son satır gelir: tüccara her gidişinde üç sayfa ilerlemek zorunda
     kalmak, karakteri derinleştirmez, yalnızca yorar. */
  B.linesFor = function (npcId) {
    const r = B.stageOf(npcId);
    if (!r) return null;
    const st = QW.NPCState.of(npcId);
    const first = st.seenStage === undefined || st.seenStage < r.index;
    if (first) {
      st.seenStage = r.index;
      return r.stage.lines.slice();
    }
    return [r.stage.lines[r.stage.lines.length - 1]];
  };

  /* Bedele verilen tepki — bandı değiştiğinde bir kez söylenir */
  B.tollLine = function (npcId) {
    const d = S[npcId]; if (!d || !d.toll) return null;
    const band = QW.Record.band();
    const st = QW.NPCState.of(npcId);
    if (st.tollSaid === band) return null;
    const line = d.toll[band];
    if (!line) return null;
    st.tollSaid = band;
    return line;
  };

  B.stance = id => (S[id] ? S[id].stance : null);
  B.withStance = v => Object.keys(S).filter(k => S[k].stance === v);

})(window.QW);
