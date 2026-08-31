/* =========================================================================
 * QW.I18N — iki dilli metin katmanı (TR / EN)
 *  - t('key', {a:1})      : arayüz metni
 *  - L({tr:'', en:''})    : veri dosyalarındaki iki dilli alanlar
 * Yeni içerik eklemek için sadece STR sözlüğüne satır eklemek yeterlidir.
 * ========================================================================= */
(function (QW) {
  'use strict';

  const STR = {
    /* --- genel --- */
    lang_name:        { tr: 'Türkçe',            en: 'English' },
    ok:               { tr: 'Tamam',             en: 'OK' },
    cancel:           { tr: 'Vazgeç',            en: 'Cancel' },
    close:            { tr: 'Kapat',             en: 'Close' },
    back:             { tr: 'Geri',              en: 'Back' },
    yes:              { tr: 'Evet',              en: 'Yes' },
    no:               { tr: 'Hayır',             en: 'No' },
    none:             { tr: 'yok',               en: 'none' },
    confirm:          { tr: 'Onayla',            en: 'Confirm' },
    continue:         { tr: 'Devam',             en: 'Continue' },

    /* --- başlangıç / menü --- */
    game_title:       { tr: 'KUANTUM ENKAZI',    en: 'QUANTUM WRECK' },
    game_sub:         { tr: 'kuantum anomalisinde bir hayatta kalma kaydı',
                        en: 'a survival log from inside the quantum anomaly' },
    new_game:         { tr: 'Yeni Oyun',         en: 'New Game' },
    load_game:        { tr: 'Kayıtlı Oyunu Yükle', en: 'Load Save' },
    language:         { tr: 'Dil / Language',    en: 'Language / Dil' },
    delete_save:      { tr: 'Kaydı Sil',         en: 'Delete Save' },
    delete_save_q:    { tr: 'Kayıt tamamen silinsin mi?', en: 'Delete the save permanently?' },
    saved:            { tr: 'Kaydedildi',        en: 'Saved' },
    save_deleted:     { tr: 'Kayıt silindi',     en: 'Save deleted' },
    no_save:          { tr: 'Kayıt bulunamadı',  en: 'No save found' },
    tap_to_start:     { tr: 'Başlamak için dokun', en: 'Tap to begin' },
    audio_on:         { tr: 'Ses: Açık',         en: 'Sound: On' },
    audio_off:        { tr: 'Ses: Kapalı',       en: 'Sound: Off' },

    /* --- giriş sekansı --- */
    intro_1:  { tr: 'SEYİR KAYDI 07 — "ARGOS" KARGO GEMİSİ',
                en: 'FLIGHT LOG 07 — CARGO SHIP "ARGOS"' },
    intro_2:  { tr: 'Yerçekimi okuması sıfırlandı.\nRota dışı sapma: %840.\nBu bir çekim alanı değil... bir yırtık.',
                en: 'Gravity reading has collapsed.\nCourse deviation: 840%.\nThis is not a gravity well... it is a tear.' },
    intro_3:  { tr: 'KUANTUM ÇEKİRDEĞİ KRİTİK\nBÜTÜNLÜK KAYBI · PARÇALANMA',
                en: 'QUANTUM CORE CRITICAL\nINTEGRITY LOST · FRAGMENTING' },
    intro_4:  { tr: 'Çekirdek beş parçaya ayrıldı ve gezegene saçıldı.\nGeminin geri kalanı seninle birlikte düştü.',
                en: 'The core split into five fragments scattered across the planet.\nWhat is left of the ship fell with you.' },
    intro_5:  { tr: 'Kask içi hoparlörde tek bir cümle dönüyor:\n"Parçaları topla. Yırtığı kapat. Eve dön."',
                en: 'One line loops inside your helmet speaker:\n"Collect the fragments. Close the tear. Go home."' },
    wake_up:  { tr: 'UYAN',                       en: 'WAKE UP' },

    /* --- öğretici --- */
    tut_move:   { tr: 'D-Pad ile hareket et',                 en: 'Move with the D-Pad' },
    tut_a:      { tr: 'A tuşu ile etkileşime gir',            en: 'Press A to interact' },
    tut_leak:   { tr: 'Oksijen sızıntısını durdur',           en: 'Seal the oxygen leak' },
    tut_boot:   { tr: 'Mini haritayı boot et',                en: 'Boot the mini-map' },
    tut_leak_done: { tr: 'Sızıntı yamandı. O2 stabil.',       en: 'Leak patched. O2 stable.' },
    tut_boot_done: { tr: 'Mini harita çevrimiçi.',            en: 'Mini-map online.' },
    tut_free:   { tr: 'Enkazdan uzaklaş ve gezegeni keşfet',  en: 'Leave the wreck and explore the planet' },

    /* --- karakter oluşturucu --- */
    creator_title:  { tr: 'MÜRETTEBAT KAYDI',    en: 'CREW REGISTRATION' },
    cc_name:        { tr: 'İsim',                en: 'Name' },
    cc_body:        { tr: 'Ten tonu',            en: 'Skin tone' },
    cc_hair:        { tr: 'Saç',                 en: 'Hair' },
    cc_shirt:       { tr: 'Tişört (zırh altı)',  en: 'T-shirt (under-armor)' },
    cc_fabric:      { tr: 'Kumaş',               en: 'Fabric' },
    cc_boots:       { tr: 'Keşif botu',          en: 'Exploration boots' },
    cc_visor:       { tr: 'Vizör rengi',         en: 'Visor colour' },
    cc_start:       { tr: 'Düşüşe hazırım',      en: 'Ready for the drop' },
    cc_stats:       { tr: 'Kuşam etkileri',      en: 'Loadout effects' },
    cc_randomize:   { tr: 'Rastgele',            en: 'Randomise' },

    /* --- statlar --- */
    st_hp:      { tr: 'Can',            en: 'Health' },
    st_o2:      { tr: 'Oksijen',        en: 'Oxygen' },
    st_stamina: { tr: 'Dayanıklılık',   en: 'Stamina' },
    st_stress:  { tr: 'Stres',          en: 'Stress' },
    st_energy:  { tr: 'Enerji',         en: 'Energy' },
    st_atk:     { tr: 'Saldırı',        en: 'Attack' },
    st_def:     { tr: 'Zırh',           en: 'Armour' },
    st_spd:     { tr: 'Hız',            en: 'Speed' },
    st_credits: { tr: 'Enerji Kredisi', en: 'Energy Credits' },
    st_regen:   { tr: 'Yenilenme',      en: 'Regen' },
    st_heat:    { tr: 'Isı yalıtımı',   en: 'Thermal insulation' },

    /* --- HUD / dünya --- */
    day:        { tr: 'Gün',            en: 'Day' },
    night:      { tr: 'Gece',           en: 'Night' },
    dawn:       { tr: 'Şafak',          en: 'Dawn' },
    dusk:       { tr: 'Alacakaranlık',  en: 'Dusk' },
    hud_day:    { tr: 'G{n}',           en: 'D{n}' },

    /* --- paneller --- */
    p_menu:     { tr: 'MENÜ',           en: 'MENU' },
    p_inventory:{ tr: 'ENVANTER',       en: 'INVENTORY' },
    p_craft:    { tr: 'ÇALIŞMA MASASI', en: 'WORKBENCH' },
    p_map:      { tr: 'HARİTA',         en: 'MAP' },
    p_char:     { tr: 'KARAKTER',       en: 'CHARACTER' },
    p_quest:    { tr: 'GÖREVLER',       en: 'QUESTS' },
    p_trade:    { tr: 'TAKAS',          en: 'TRADE' },
    p_codex:    { tr: 'ARŞİV',          en: 'CODEX' },
    p_settings: { tr: 'AYARLAR',        en: 'SETTINGS' },
    p_garage:   { tr: 'HANGAR',         en: 'HANGAR' },
    p_repair:   { tr: 'ARIZA TESPİTİ',  en: 'DIAGNOSTICS' },
    p_rest:     { tr: 'KAMP ATEŞİ',     en: 'CAMPFIRE' },

    tab_all:    { tr: 'Hepsi',          en: 'All' },
    tab_res:    { tr: 'Hammadde',       en: 'Raw' },
    tab_comp:   { tr: 'Parça',          en: 'Parts' },
    tab_dev:    { tr: 'Cihaz',          en: 'Devices' },
    tab_gear:   { tr: 'Kuşam',          en: 'Gear' },
    tab_use:    { tr: 'Sarf',           en: 'Consumable' },
    tab_media:  { tr: 'Medya',          en: 'Media' },
    tab_key:    { tr: 'Görev',          en: 'Key' },

    /* --- envanter / eşya --- */
    inv_empty:  { tr: 'Envanter boş.',  en: 'Inventory is empty.' },
    inv_use:    { tr: 'Kullan',         en: 'Use' },
    inv_equip:  { tr: 'Kuşan',          en: 'Equip' },
    inv_unequip:{ tr: 'Çıkar',          en: 'Unequip' },
    inv_drop:   { tr: 'At',             en: 'Drop' },
    inv_read:   { tr: 'Oku',            en: 'Read' },
    equipped:   { tr: 'KUŞANILI',       en: 'EQUIPPED' },
    got_item:   { tr: '+{n} {name}',    en: '+{n} {name}' },
    lost_item:  { tr: '-{n} {name}',    en: '-{n} {name}' },
    inv_full:   { tr: 'Taşıma kapasitesi doldu!', en: 'Carry capacity full!' },
    weight:     { tr: 'Yük',            en: 'Load' },

    /* --- crafting --- */
    craft_make:     { tr: 'Üret',                    en: 'Build' },
    craft_need:     { tr: 'Gerekenler',              en: 'Requires' },
    craft_missing:  { tr: 'Malzeme eksik',           en: 'Missing materials' },
    craft_noskill:  { tr: 'Şema kilitli',            en: 'Schematic locked' },
    craft_done:     { tr: '{name} üretildi',         en: '{name} built' },
    craft_locked_hint:{ tr: 'Şemayı bir NPC ile takastan veya keşiften edin.',
                        en: 'Obtain this schematic by trading with an NPC or by exploring.' },
    craft_tab_elec: { tr: 'Elektronik',              en: 'Electronics' },
    craft_tab_gear: { tr: 'Kuşam',                   en: 'Gear' },
    craft_tab_veh:  { tr: 'Araç',                    en: 'Vehicles' },
    craft_tab_med:  { tr: 'Kimya',                   en: 'Chemistry' },
    craft_bench_hint:{ tr: 'Çalışma masası her yerde açılabilir; bazı şemalar İstasyon tezgâhı ister.',
                       en: 'The workbench is portable; some schematics require the Station bench.' },

    /* --- multimetre mini oyunu --- */
    mm_intro:   { tr: 'Multimetre ile arızalı düğümü bul. Her ölçüm 1 prob hakkı harcar.',
                  en: 'Find the faulty node with the multimeter. Each reading costs one probe.' },
    mm_probes:  { tr: 'Prob hakkı: {n}',         en: 'Probes left: {n}' },
    mm_measure: { tr: 'Ölç',                     en: 'Measure' },
    mm_accuse:  { tr: 'Arızalı olarak işaretle', en: 'Flag as faulty' },
    mm_win:     { tr: 'Arıza giderildi! Cihaz onarıldı.', en: 'Fault cleared! Device repaired.' },
    mm_lose:    { tr: 'Yanlış düğüm. Devre yandı, parça kaybedildi.', en: 'Wrong node. The board burned out, parts lost.' },
    mm_node:    { tr: 'DÜĞÜM {n}',               en: 'NODE {n}' },
    mm_volt:    { tr: 'V',                       en: 'V' },
    mm_ohm:     { tr: 'Ω',                       en: 'Ω' },
    mm_unmeasured:{ tr: '— ölçülmedi —',         en: '— unmeasured —' },
    mm_howto:   { tr: 'Ölçmek için düğüme dokun. Ölçülmüş bir düğüme tekrar dokunursan onu arızalı olarak işaretlersin.',
                  en: 'Tap a node to measure it. Tap an already-measured node again to flag it as the fault.' },
    repair_none:{ tr: 'Onarım bekleyen cihaz yok.', en: 'No devices awaiting repair.' },
    device_broke:{ tr: '{name} arızalandı!',     en: '{name} has failed!' },

    /* --- araçlar --- */
    veh_none:     { tr: 'Hangar boş.',            en: 'Hangar is empty.' },
    veh_mount:    { tr: 'Bin',                    en: 'Mount' },
    veh_dismount: { tr: 'İn',                     en: 'Dismount' },
    veh_deploy:   { tr: 'Konuşlandır',            en: 'Deploy' },
    veh_recall:   { tr: 'Geri çağır',             en: 'Recall' },
    veh_battery:  { tr: 'Batarya',                en: 'Battery' },
    veh_dura:     { tr: 'Dayanıklılık',           en: 'Durability' },
    veh_no_bat:   { tr: 'Batarya bitti.',         en: 'Battery depleted.' },
    veh_mounted:  { tr: '{name} sürülüyor.',      en: 'Riding {name}.' },
    veh_broken:   { tr: '{name} bozuk — onarım gerekli.', en: '{name} is broken — repair required.' },
    drone_scan:   { tr: 'Dron bölgeyi tarıyor...', en: 'Drone scanning the area...' },
    drone_glide:  { tr: 'Dron seni kanyonun karşısına taşıdı.', en: 'The drone carried you across the canyon.' },

    /* --- dünya engelleri --- */
    block_water:  { tr: 'Kuantum denizi geçilemez.',                    en: 'The quantum sea cannot be crossed.' },
    block_cliff:  { tr: 'Dik kaya. Tırmanılmaz.',                       en: 'Sheer rock. Not climbable.' },
    block_chasm:  { tr: 'Kanyon çok geniş — bir İHA gerekiyor.',        en: 'The canyon is too wide — a UAV is required.' },
    block_swamp:  { tr: 'Zehirli bataklık — bir rover olmadan girilmez.',en: 'Toxic marsh — do not enter without a rover.' },
    swamp_warn:   { tr: 'Asit çamuru zırhını yiyor!',                   en: 'Acid mud is eating through your armour!' },
    need_drone:   { tr: 'Keşif İHA’sı gerekli.',                        en: 'An exploration UAV is required.' },
    need_rover:   { tr: 'Arazi rover’ı gerekli.',                       en: 'A terrain rover is required.' },

    /* --- hava / gün döngüsü --- */
    w_clear:      { tr: 'Açık',                en: 'Clear' },
    w_rad:        { tr: 'Radyasyon fırtınası', en: 'Radiation storm' },
    w_acid:       { tr: 'Asit yağmuru',        en: 'Acid rain' },
    w_bliz:       { tr: 'Tipi',                en: 'Blizzard' },
    w_sand:       { tr: 'Kum fırtınası',       en: 'Sandstorm' },
    w_spore:      { tr: 'Spor bulutu',         en: 'Spore bloom' },
    w_incoming:   { tr: 'SENSÖR: {w} yaklaşıyor ({n} dk)', en: 'SENSOR: {w} incoming ({n} min)' },
    w_started:    { tr: '{w} başladı!',        en: '{w} has begun!' },
    w_ended:      { tr: 'Hava sakinleşti.',    en: 'The weather has calmed.' },
    w_need_sensor:{ tr: 'Hava kalitesi sensörü olmadan tahmin yapılamaz.',
                    en: 'Forecasting requires an air-quality sensor.' },
    w_shielded:   { tr: 'Kuşamın seni koruyor.', en: 'Your loadout protects you.' },

    /* --- biyomlar --- */
    b_sea:      { tr: 'Kuantum Denizi',   en: 'Quantum Sea' },
    b_shore:    { tr: 'Kıyı',             en: 'Shore' },
    b_desert:   { tr: 'Cam Çölü',         en: 'Glass Desert' },
    b_plains:   { tr: 'Kül Ovaları',      en: 'Ash Plains' },
    b_forest:   { tr: 'Mantar Ormanı',    en: 'Mycelium Forest' },
    b_glacier:  { tr: 'Buzul',            en: 'Glacier' },
    b_swamp:    { tr: 'Zehirli Bataklık', en: 'Toxic Marsh' },
    b_canyon:   { tr: 'Kanyon',           en: 'Canyon' },
    b_mountain: { tr: 'Kaya Sırtları',    en: 'Rock Ridges' },
    b_wreck:    { tr: 'Enkaz Sahası',     en: 'Wreck Site' },

    /* --- etkileşim --- */
    act_gather: { tr: 'Topla',             en: 'Gather' },
    act_talk:   { tr: 'Konuş',             en: 'Talk' },
    act_enter:  { tr: 'Gir',               en: 'Enter' },
    act_search: { tr: 'Araştır',           en: 'Search' },
    act_rest:   { tr: 'Dinlen',            en: 'Rest' },
    act_trade:  { tr: 'Takas yap',         en: 'Trade' },
    act_nothing:{ tr: 'Burada bir şey yok.', en: 'Nothing here.' },
    found:      { tr: 'Buldun:',           en: 'Found:' },
    depleted:   { tr: 'Kaynak tükendi.',   en: 'Resource depleted.' },

    /* --- kamp / dinlenme --- */
    rest_title:  { tr: 'Kamp ateşi yakıldı.',      en: 'The campfire is lit.' },
    rest_sleep:  { tr: 'Sabaha kadar uyu',         en: 'Sleep until morning' },
    rest_read:   { tr: 'Arşivden bir şey oku',     en: 'Read from the archive' },
    rest_leave:  { tr: 'Ateşi söndür',             en: 'Put out the fire' },
    rest_slept:  { tr: 'Dinlendin. Can ve dayanıklılık yenilendi.', en: 'You rested. Health and stamina restored.' },
    rest_read_ok:{ tr: '{name} okundu. Stres -{n}.', en: 'Read {name}. Stress -{n}.' },
    rest_nomedia:{ tr: 'Okunacak bir arşivin yok. Tome ile takas yap.',
                   en: 'You have nothing to read. Trade with Tome.' },
    stress_high: { tr: 'Stres kritik — eller titriyor, isabet düşüyor.',
                   en: 'Stress critical — your hands shake, accuracy drops.' },

    /* --- takas --- */
    trade_buy:      { tr: 'Al',                    en: 'Buy' },
    trade_sell:     { tr: 'Sat',                   en: 'Sell' },
    trade_barter:   { tr: 'Takas',                 en: 'Barter' },
    trade_give:     { tr: 'Ver',                   en: 'Give' },
    trade_get:      { tr: 'Al',                    en: 'Receive' },
    trade_done:     { tr: 'Takas tamamlandı.',     en: 'Trade complete.' },
    trade_cant:     { tr: 'Yeterli malzemen yok.', en: 'You lack the goods.' },
    trade_nocredit: { tr: 'Yeterli kredin yok.',   en: 'Not enough credits.' },
    trade_nostock:  { tr: 'Stok tükendi.',         en: 'Out of stock.' },
    trade_price:    { tr: '{n} EC',                en: '{n} EC' },
    trade_wants:    { tr: 'Aradığı: {list}',       en: 'Wants: {list}' },

    /* --- görevler --- */
    q_active:    { tr: 'Aktif',      en: 'Active' },
    q_done:      { tr: 'Tamamlandı', en: 'Complete' },
    q_new:       { tr: 'YENİ GÖREV: {name}', en: 'NEW QUEST: {name}' },
    q_complete:  { tr: 'GÖREV TAMAM: {name}', en: 'QUEST COMPLETE: {name}' },
    q_reward:    { tr: 'Ödül',      en: 'Reward' },
    q_none:      { tr: 'Aktif görev yok.', en: 'No active quests.' },
    q_progress:  { tr: 'İlerleme: {a}/{b}', en: 'Progress: {a}/{b}' },

    /* --- savaş --- */
    cb_start:     { tr: '{name} saldırıyor!',   en: '{name} attacks!' },
    cb_attack:    { tr: 'Saldır',               en: 'Attack' },
    cb_tactic:    { tr: 'Taktik',               en: 'Tactic' },
    cb_item:      { tr: 'Eşya',                 en: 'Item' },
    cb_flee:      { tr: 'Kaç',                  en: 'Flee' },
    cb_hit:       { tr: '{a} → {b}: {n} hasar', en: '{a} → {b}: {n} damage' },
    cb_miss:      { tr: '{a} ıskaladı.',        en: '{a} missed.' },
    cb_crit:      { tr: 'KRİTİK! ',             en: 'CRITICAL! ' },
    cb_weak:      { tr: 'Zayıf nokta vuruldu!', en: 'Weak point struck!' },
    cb_def_up:    { tr: '{name} savunmaya geçti.', en: '{name} braces.' },
    cb_win:       { tr: 'Zafer! +{xp} XP, +{ec} EC', en: 'Victory! +{xp} XP, +{ec} EC' },
    cb_lose:      { tr: 'Bilincini yitirdin...', en: 'You black out...' },
    cb_fled:      { tr: 'Kaçmayı başardın.',    en: 'You got away.' },
    cb_nofled:    { tr: 'Kaçamadın!',           en: 'You could not escape!' },
    cb_loot:      { tr: 'Ganimet: {list}',      en: 'Loot: {list}' },
    cb_noenergy:  { tr: 'Enerji yetersiz.',     en: 'Not enough energy.' },
    cb_cooldown:  { tr: 'Hazır değil ({n} tur).', en: 'Not ready ({n} turns).' },
    cb_need_dev:  { tr: '{name} gerekli.',      en: 'Requires {name}.' },
    cb_lvlup:     { tr: 'SEVİYE {n}!',          en: 'LEVEL {n}!' },
    cb_boss:      { tr: 'BÖLGE HÂKİMİ',         en: 'BIOME WARDEN' },
    cb_frag:      { tr: 'Kuantum Çekirdeği parçası düştü!', en: 'A Quantum Core fragment drops!' },
    cb_stun:      { tr: '{name} sersemledi.',   en: '{name} is stunned.' },
    cb_shielded:  { tr: '{name} kalkan aldı.',  en: '{name} gains a shield.' },
    cb_burn:      { tr: '{name} yanıyor ({n}).', en: '{name} burns ({n}).' },
    cb_turn:      { tr: 'Tur {n}',              en: 'Turn {n}' },
    cb_revive:    { tr: 'Acil durum modülü seni ayağa kaldırdı.', en: 'The emergency module brings you back up.' },

    /* --- ölüm --- */
    death_title:  { tr: 'SİNYAL KESİLDİ',        en: 'SIGNAL LOST' },
    death_text:   { tr: 'Kask sistemi seni enkazda yeniden başlattı.\nMalzemelerin bir kısmı kayboldu.',
                    en: 'Your suit rebooted you back at the wreck.\nSome of your materials were lost.' },
    death_ok:     { tr: 'Enkazda uyan',          en: 'Wake at the wreck' },

    /* --- final --- */
    end_title:    { tr: 'YIRTIK KAPANIYOR',      en: 'THE TEAR CLOSES' },
    end_text:     { tr: 'Beş parça yerine oturdu. Çekirdek yeniden atıyor.\nAnomali kapanırken gezegen sana son bir sinyal gönderiyor:\n"Hoşça kal, gezgin."',
                    en: 'Five fragments lock into place. The core beats again.\nAs the anomaly closes the planet sends one last signal:\n"Farewell, traveller."' },
    end_stats:    { tr: 'Gün: {d} · Seviye: {l} · Yenilen hâkim: {b}/5',
                    en: 'Days: {d} · Level: {l} · Wardens defeated: {b}/5' },
    end_again:    { tr: 'Ana menüye dön',        en: 'Return to main menu' },
    core_ready:   { tr: 'Beş parça tamam! Enkazdaki çekirdek yuvasına dön.',
                    en: 'All five fragments! Return to the core cradle in the wreck.' },
    core_insert:  { tr: 'Parçaları yuvaya yerleştir', en: 'Insert the fragments' },
    core_need:    { tr: 'Eksik parça: {n}',      en: 'Fragments missing: {n}' },

    /* --- ayarlar --- */
    set_lang:      { tr: 'Dil',                  en: 'Language' },
    set_sound:     { tr: 'Ses',                  en: 'Sound' },
    set_music:     { tr: 'Müzik',                en: 'Music' },
    set_shake:     { tr: 'Ekran sarsıntısı',     en: 'Screen shake' },
    set_scanline:  { tr: 'Tarama çizgileri',     en: 'Scanlines' },
    set_autosave:  { tr: 'Otomatik kayıt',       en: 'Autosave' },
    set_touch:     { tr: 'Dokunmatik kontroller',en: 'Touch controls' },
    set_on:        { tr: 'Açık',                 en: 'On' },
    set_off:       { tr: 'Kapalı',               en: 'Off' },
    set_save_now:  { tr: 'Şimdi kaydet',         en: 'Save now' },
    set_to_menu:   { tr: 'Ana menü',             en: 'Main menu' },
    set_to_menu_q: { tr: 'Ana menüye dönülsün mü? Kaydedilmemiş ilerleme kaybolur.',
                     en: 'Return to main menu? Unsaved progress is lost.' },
    keys_hint:     { tr: 'Klavye: ok tuşları / WASD, A = Z veya Boşluk, B = X, Menü = Esc',
                     en: 'Keyboard: arrows / WASD, A = Z or Space, B = X, Menu = Esc' },

    /* --- codex --- */
    codex_none:   { tr: 'Henüz kayıt yok.',      en: 'No entries yet.' },
    codex_new:    { tr: 'ARŞİV GÜNCELLENDİ: {name}', en: 'CODEX UPDATED: {name}' }
  };

  const I = QW.I18N = {
    lang: 'tr',
    langs: ['tr', 'en'],

    setLang(l) {
      if (this.langs.indexOf(l) < 0) return;
      this.lang = l;
      document.documentElement.lang = l;
      try { localStorage.setItem('qw_lang', l); } catch (e) {}
      QW.bus.emit('lang', l);
    },

    initLang() {
      let l = null;
      try { l = localStorage.getItem('qw_lang'); } catch (e) {}
      if (!l) {
        const nav = (navigator.language || 'en').toLowerCase();
        l = nav.indexOf('tr') === 0 ? 'tr' : 'en';
      }
      this.lang = this.langs.indexOf(l) >= 0 ? l : 'en';
      document.documentElement.lang = this.lang;
    },

    /* Arayüz metni */
    t(key, vars) {
      const e = STR[key];
      let s = e ? (e[this.lang] || e.en || key) : key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
      return s;
    },

    /* Veri dosyalarındaki {tr,en} nesneleri */
    L(obj) {
      if (obj == null) return '';
      if (typeof obj === 'string') return obj;
      return obj[this.lang] || obj.en || obj.tr || '';
    },

    has(key) { return !!STR[key]; },

    /* Sonradan içerik paketi eklemek için */
    extend(more) { Object.keys(more).forEach(k => { STR[k] = more[k]; }); }
  };

  QW.t = (k, v) => I.t(k, v);
  QW.L = o => I.L(o);

})(window.QW);
