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
    ok:               { tr: 'Tamam',             en: 'OK' },
    cancel:           { tr: 'Vazgeç',            en: 'Cancel' },
    close:            { tr: 'Kapat',             en: 'Close' },
    back:             { tr: 'Geri',              en: 'Back' },
    yes:              { tr: 'Evet',              en: 'Yes' },
    no:               { tr: 'Hayır',             en: 'No' },
    none:             { tr: 'yok',               en: 'none' },
    continue:         { tr: 'Devam',             en: 'Continue' },

    /* --- başlangıç / menü --- */
    game_title:       { tr: 'KUANTUM ENKAZI',    en: 'QUANTUM WRECK' },
    game_sub:         { tr: 'kuantum anomalisinde bir hayatta kalma kaydı',
                        en: 'a survival log from inside the quantum anomaly' },
    new_game:         { tr: 'Yeni Oyun',         en: 'New Game' },
    load_game:        { tr: 'Kayıtlı Oyunu Yükle', en: 'Load Save' },
    delete_save:      { tr: 'Kaydı Sil',         en: 'Delete Save' },
    delete_save_q:    { tr: 'Kayıt tamamen silinsin mi?', en: 'Delete the save permanently?' },
    saved:            { tr: 'Kaydedildi',        en: 'Saved' },
    save_deleted:     { tr: 'Kayıt silindi',     en: 'Save deleted' },
    no_save:          { tr: 'Kayıt bulunamadı',  en: 'No save found' },
    audio_on:         { tr: 'Ses: Açık',         en: 'Sound: On' },
    audio_off:        { tr: 'Ses: Kapalı',       en: 'Sound: Off' },

    /* --- giriş sekansı --- */
    intro_1:  { tr: 'SEYİR KAYDI 07 — "GÖKTAY" ARAŞTIRMA GEMİSİ',
                en: 'FLIGHT LOG 07 — RESEARCH SHIP "GÖKTAY"' },
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
    cc_shirt:       { tr: 'Zırh altı içlik',     en: 'Under-armour liner' },
    cc_fabric:      { tr: 'Kumaş rengi',          en: 'Fabric colour' },
    cc_boots:       { tr: 'Saha botu',            en: 'Field boots' },
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
    beacon_placed:{ tr: 'Kamp feneri kuruldu. Burada dinlenebilirsin.',
                    en: 'Camp beacon deployed. You can rest here.' },
    beacon_here:  { tr: 'Burada zaten bir fener var.', en: 'A beacon already stands here.' },
    comms_reveal: { tr: 'İletişim modülü uzak kampların sinyalini yakaladı.',
                    en: 'The comms module picked up distant camp signals.' },
    log_read:     { tr: 'Gemi kaydı çözüldü — arşive işlendi.',
                    en: 'Ship log decoded — filed in the codex.' },
    veh_none:     { tr: 'Hangar boş.',            en: 'Hangar is empty.' },
    veh_mount:    { tr: 'Bin',                    en: 'Mount' },
    veh_dismount: { tr: 'İn',                     en: 'Dismount' },
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
    w_head:       { tr: 'HAVA DURUMU',         en: 'WEATHER' },
    map_here:     { tr: 'BULUNDUĞUN YER',      en: 'YOU ARE HERE' },
    ft_head:      { tr: 'SİNYAL AĞI',          en: 'SIGNAL NETWORK' },
    ft_here:      { tr: 'buradasın',           en: 'you are here' },
    ft_none:      { tr: 'Ağda düğüm yok. Kamp, şehir ve kurduğun fenerler buraya eklenir.',
                    en: 'No nodes on the network. Camps, cities and your beacons are added here.' },
    ft_cost:      { tr: '{h} sa yolculuk · dayanıklılık -{s}', en: '{h}h journey · stamina -{s}' },
    ft_need:      { tr: 'Sinyal ağı için İletişim Modülü gerekir.',
                    en: 'The signal network requires a Comms Module.' },
    ft_tired:     { tr: 'Bu mesafe için dayanıklılığın yetmiyor.', en: 'Not enough stamina for that distance.' },
    ft_done:      { tr: '{name} varış. {h} saat yolda geçti.', en: 'Arrived at {name}. {h} hours on the road.' },
    ft_danger:    { tr: 'Yolda saldırıya uğradın!', en: 'You were attacked on the road!' },
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
    cb_phased:    { tr: '{a} vurdu ama darbe içinden geçti.', en: '{a} strikes, but the blow passes through you.' },
    cb_dev_home:  { tr: 'Bu alet tam da bunun için yapılmıştı!', en: 'This tool was made for exactly this!' },
    cb_dev_melt:  { tr: 'Zırh kızarıp yumuşuyor.', en: 'The armour glows and softens.' },
    cb_dev_pull:  { tr: 'Kanca bir plakayı söküp aldı.', en: 'The hook tears a plate away.' },
    cb_dev_res:   { tr: 'Kabuk kendi frekansında çınlıyor.', en: 'The shell rings at its own frequency.' },
    cb_dev_anchor:{ tr: 'Pabuçlar zemine kenetlendi. Yerinden oynamıyorsun.', en: 'The cleats bite the floor. Nothing moves you.' },
    cb_dev_phase: { tr: 'Bir an için maddesizsin; darbe içinden geçti.', en: 'For a moment you are immaterial; the blow passes through.' },
    cb_super:     { tr: '{e} çok etkili!',      en: '{e} is super effective!' },
    cb_resisted:  { tr: '{b} {e} hasarına dayanıklı.', en: '{b} resists {e}.' },
    cb_immune:    { tr: '{b} {e} hasarından etkilenmiyor!', en: '{b} is immune to {e}!' },
    match_learn_weak: { tr: 'Deftere yazıldı: {name} → {e} zafiyeti', en: 'Noted: {name} is weak to {e}' },
    match_learn_res:  { tr: 'Deftere yazıldı: {name} → {e} direnci', en: 'Noted: {name} resists {e}' },
    log_match:    { tr: 'Element',              en: 'Element' },
    log_match_none: { tr: 'ilişki bilinmiyor',  en: 'no matchup known' },
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

    /* --- kask kaydı / adaptasyon --- */
    log_title:    { tr: 'KASK KAYDI', en: 'HELMET LOG' },
    log_updated:  { tr: 'KASK KAYDI: {name} hakkında yeni bilgi', en: 'HELMET LOG: new data on {name}' },
    log_adapt:    { tr: '{name} karşısında adaptasyon: +%{n} hasar', en: 'Adaptation vs {name}: +{n}% damage' },
    log_weak:     { tr: '{name} zayıf noktası artık radarsız görünüyor: {w}',
                    en: 'The weak point of {name} is now visible without radar: {w}' },
    log_none:     { tr: 'Henüz saha kaydı yok. Her karşılaşma ve her ölüm buraya yazılır.',
                    en: 'No field notes yet. Every encounter and every death is written here.' },
    log_seen:     { tr: 'Karşılaşma: {n}', en: 'Encounters: {n}' },
    log_died:     { tr: 'Bu yaratığa yenilme: {n}', en: 'Defeats by this creature: {n}' },
    log_deaths:   { tr: 'Toplam ölüm: {n}', en: 'Total deaths: {n}' },
    log_pride:    { tr: 'Ölüm sayın öğrenme sayındır. Her kayıp kaska bir satır yazar.',
                    en: 'Your death count is your learning count. Every loss writes a line in the helmet.' },
    p_log:        { tr: 'SAHA KAYDI', en: 'FIELD LOG' },

    /* --- yardım modu --- */
    set_assist:   { tr: 'Yardım modu',            en: 'Assist mode' },
    assist_desc:  { tr: 'Gelen hasar yarıya iner, oksijen yavaş tükenir, ölünce malzeme kaybetmezsin. İstediğin an aç/kapat — utanılacak bir şey değil.',
                    en: 'Incoming damage halved, oxygen drains slower, no material loss on death. Toggle any time — there is no shame in it.' },
    assist_on:    { tr: 'Yardım modu açık.',      en: 'Assist mode on.' },
    assist_off:   { tr: 'Yardım modu kapalı.',    en: 'Assist mode off.' },

    /* --- sinerjiler --- */
    syn_active:   { tr: 'Sinerji: {name}',       en: 'Synergy: {name}' },
    syn_opening:  { tr: 'Rover’ın kütlesi açılış darbesini taşıyor!', en: 'The rover’s mass carries an opening strike!' },
    syn_banked:   { tr: 'Biriken yük: {n} tur',  en: 'Banked charge: {n} turns' },
    syn_strip:    { tr: 'Parazit kalkanı söktü ({n}).', en: 'Jamming stripped the shield ({n}).' },
    syn_brittle:  { tr: 'Soğutulmuş zırh asit altında çatladı!', en: 'The chilled armour cracks under the acid!' },
    p_syn:        { tr: 'SİNERJİLER',            en: 'SYNERGIES' },
    syn_none:     { tr: 'Aktif sinerji yok. İki cihazı aynı anda taşımak, tek tek toplamlarından güçlü olabilir.',
                    en: 'No active synergies. Carrying two devices at once can beat the sum of their parts.' },
    syn_close:    { tr: 'Bir adım kaldı: {list}', en: 'One step away: {list}' },
    syn_near:     { tr: 'BİR ADIM KALDI',        en: 'ONE STEP AWAY' },
    syn_on:       { tr: 'AKTİF',                 en: 'ACTIVE' },

    /* --- zindan --- */
    dg_enter:     { tr: 'Zindana in',            en: 'Descend into the dungeon' },
    dg_locked:    { tr: 'Kilitli. Bir anahtar gerek.', en: 'Locked. You need a key.' },
    dg_unlock:    { tr: 'Anahtar kullanıldı.',   en: 'Key used.' },
    dg_needboss:  { tr: 'Bu kapı boss anahtarı istiyor.', en: 'This door wants the boss key.' },
    dg_bossdoor:  { tr: 'Mühür açıldı.',         en: 'The seal opens.' },
    dg_needdev:   { tr: '{name} gerekiyor.',     en: 'Requires the {name}.' },
    dg_nodev:     { tr: 'Elinde bir zindan cihazı yok.', en: 'You have no dungeon device.' },
    dg_key:       { tr: 'Küçük anahtar alındı.', en: 'Small key taken.' },
    dg_bosskey:   { tr: 'BOSS ANAHTARI',         en: 'BOSS KEY' },
    dg_map:       { tr: 'Zindan haritası alındı.', en: 'Dungeon map acquired.' },
    dg_compass:   { tr: 'Pusula alındı — içerikler haritada.', en: 'Compass acquired — contents shown on the map.' },
    dg_plate:     { tr: 'Kasa plakaya oturdu. Bir şey açıldı.', en: 'The crate seats on the plate. Something opened.' },
    dg_blocked:   { tr: 'Kasa kapıyı tıkar. Başka yöne it.', en: 'That would block the doorway. Push it elsewhere.' },
    dg_cleared:   { tr: '{name} temizlendi.',    en: '{name} cleared.' },
    dg_leave:     { tr: 'Zindandan çık',         en: 'Leave the dungeon' },
    dg_again:     { tr: 'Zindana geri dön',      en: 'Return to the dungeon' },
    dg_outside:   { tr: 'Girişte durdun. Aşağıdan soğuk hava ve mekanik bir uğultu geliyor.',
                    en: 'You stand at the entrance. Cold air and a mechanical hum rise from below.' },

    /* --- ölüm --- */
    death_title:  { tr: 'SİNYAL KESİLDİ',        en: 'SIGNAL LOST' },
    death_text:   { tr: 'Kask sistemi seni enkazda yeniden başlattı.\nMalzemelerin bir kısmı kayboldu — ama kayıt tutuldu.',
                    en: 'Your suit rebooted you back at the wreck.\nSome materials were lost — but the log was kept.' },
    death_text_a: { tr: 'Kask sistemi seni enkazda yeniden başlattı.\nYardım modu açık: malzemen duruyor.',
                    en: 'Your suit rebooted you back at the wreck.\nAssist mode is on: your materials are intact.' },
    death_ok:     { tr: 'Enkazda uyan',          en: 'Wake at the wreck' },

    /* --- final --- */
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

    /* --- analog fotoğraf makinesi --- */
    cam_found:   { tr: 'Küllerin arasında bir şey parlıyor.', en: 'Something glints in the ashes.' },
    cam_look:    { tr: 'İncele', en: 'Examine' },
    cam_text1:   { tr: 'Çatlak lensli, eski bir analog fotoğraf makinesi. Gövdesi ısıdan kavrulmuş ama makara hâlâ dönüyor.\nİçinde tek bir kare var: siyah-beyaz bir dünya fotoğrafı. Mavi olması gereken bir gezegen, griye dönmüş.',
                   en: 'An old analogue camera with a cracked lens. The body is scorched, but the spool still turns.\nOne frame remains: a black-and-white photograph of a world. A planet that should be blue, gone grey.' },
    cam_text2:   { tr: 'Fotoğrafın arkasında soluk bir el yazısı: "dönerken bunu getir."\nKimin yazdığını hatırlamıyorsun. Hatırlaman gerektiğini biliyorsun.',
                   en: 'Faded handwriting on the back: "bring this when you come home."\nYou do not remember who wrote it. You know that you should.' },
    cam_after1:  { tr: 'Makineyi tekrar açıyorsun. Aynı kare, aynı gri gezegen.\nArtık hangi gezegen olduğunu biliyorsun.',
                   en: 'You open it again. The same frame, the same grey world.\nNow you know which world it is.' },
    cam_after2:  { tr: 'Bu makine geminden düşmedi. Düşemezdi.\nO hep buradaydı — senden de, gemiden de önce.',
                   en: 'This camera did not fall from your ship. It could not have.\nIt was always here — before you, before the ship.' },

    /* --- çöken arşiv / Hafıza Bekçisi Alpha --- */
    arch_enter:  { tr: 'Kubbeye gir', en: 'Enter the dome' },
    arch_outside:{ tr: 'Yarı yarıya toprağa gömülmüş devasa bir kubbe. Camları radyasyondan kararmış.\nİçeriden soluk, mekanik bir ninni sızıyor.',
                   en: 'A vast dome, half swallowed by the ground. Its glass is blackened by radiation.\nA faint, mechanical lullaby leaks out from inside.' },
    arch_holo1:  { tr: 'Titrek mavi bir hologram odayı aydınlatıyor.', en: 'A flickering blue hologram lights the room.' },
    arch_holo2:  { tr: 'Gökyüzüne bakıyorlar. Hiçbiri konuşmuyor.', en: 'They are looking at the sky. None of them speak.' },
    arch_holo3:  { tr: 'Bekliyorlar. Gelmeyecek bir şeyi bekliyorlar.', en: 'They are waiting. Waiting for something that will not come.' },
    arch_holo4:  { tr: 'Hologram bozuluyor ve aynı sahne baştan başlıyor.\nKaç kez tekrarlandığını sayamıyorsun.',
                   en: 'The hologram glitches and the same scene begins again.\nYou cannot count how many times it has repeated.' },
    alpha_wake:  { tr: 'ODAMA. GİRME. ARŞİV. BÜTÜN. DEĞİL.\nSİLİNİYOR — HER GÜN BİRAZ DAHA SİLİNİYOR.',
                   en: 'DO NOT. ENTER. MY ROOM. THE ARCHIVE. IS NOT. WHOLE.\nERASING — A LITTLE MORE ERASED EVERY DAY.' },
    alpha_fight: { tr: 'Savaş', en: 'Fight' },
    alpha_pacify:{ tr: 'Devrelerle sistemini devre dışı bırak', en: 'Shut its system down with your circuits' },
    alpha_need:  { tr: 'Gerekli: {list}', en: 'Requires: {list}' },
    alpha_pac_1: { tr: 'Kartlarını açıyorsun. Devreleri onun besleme hattına lehimliyorsun.\nAlpha karşı koymuyor. Ne olduğunu anladığını sanıyorsun.',
                   en: 'You open its panels and solder your circuits into its supply line.\nAlpha does not resist. You think it understands.' },
    alpha_pac_2: { tr: 'Ninni yavaşlıyor. Bir nota eksiliyor, sonra bir tane daha.',
                   en: 'The lullaby slows. One note drops away, then another.' },
    alpha_end1:  { tr: 'Patlama olmuyor. Optik lenslerinin ışığı yavaşça sönüyor.',
                   en: 'There is no explosion. The light in its optical lenses fades slowly.' },
    alpha_end2:  { tr: 'Sonunda... sessizlik.', en: 'Finally... silence.' },
    alpha_gift:  { tr: 'Alpha sana kilitli bir veri diski bırakıyor.', en: 'Alpha leaves you a locked data disk.' },
    alpha_done:  { tr: 'İn sessiz. Ninni durmuş.', en: 'The lair is quiet. The lullaby has stopped.' },

    /* --- kuruyan vaha / Kayıp Leviathan --- */
    oasis_desc:  { tr: 'Eskiden hayat fışkıran bu havza, merkezine saplanan bir çekirdek parçası yüzünden asit gölüne dönmüş.\nKıyıda, suya uzanırken taşlaşmış hayvan siluetleri duruyor.',
                   en: 'This basin once brimmed with life; a core shard driven into its centre turned it into a lake of acid.\nAlong the shore stand the petrified silhouettes of animals, frozen mid-reach.' },
    oasis_approach:{ tr: 'Suya yaklaş', en: 'Approach the water' },
    levi_rise:   { tr: 'Çamurun içinden bir gövde yükseliyor. Sana bakmıyor — acıyla kıvranıyor.',
                   en: 'A body rises out of the mud. It is not looking at you — it is writhing in pain.' },
    levi_hurt:   { tr: 'Yaratık saldırıyor ama vuruşları isteksiz.', en: 'The creature strikes, but its blows are reluctant.' },
    levi_end1:   { tr: 'Leviathan devriliyor. Sırtındaki çekirdek parçası çamura düşüyor.',
                   en: 'The Leviathan falls. The core shard drops from its back into the mud.' },
    levi_end2:   { tr: 'Zehirli asit yavaşça toprağın altına çekiliyor.\nÇatlaklardan tertemiz, mavi bir su kaynağı filizleniyor.',
                   en: 'The poisoned acid drains slowly into the ground.\nFrom the cracks, a spring of clean blue water begins to rise.' },
    oasis_healed:{ tr: 'Vaha iyileşti. Su berrak.', en: 'The oasis has healed. The water runs clear.' },
    oasis_drink: { tr: 'Su iç', en: 'Drink' },
    oasis_drank: { tr: 'Berrak su. Bu gezegende ilk kez.', en: 'Clean water. The first on this planet.' },

    /* --- büyük ters köşe --- */
    twist_t:     { tr: 'ARŞİV 001 — ÇÖZÜLDÜ', en: 'ARCHIVE 001 — DECRYPTED' },
    twist_1:     { tr: 'Disk açılıyor. İçinde yıldız haritaları var — ama bunlar yabancı bir sisteme ait değil.',
                   en: 'The disk opens. Star charts — but they do not belong to a foreign system.' },
    twist_2:     { tr: 'Takımyıldızları tanıyorsun. Yerleri kaymış, milyonlarca yıllık bir kayma.\nGüneş listede var. Sadece daha küçük. Daha soluk.',
                   en: 'You recognise the constellations. Shifted — a drift of millions of years.\nThe Sun is in the list. Only smaller. Dimmer.' },
    twist_3:     { tr: 'Üzerinde yürüdüğün bu zehirli, yabancı gezegen yabancı değil.\nBurası Dünya. Kuantum anomalisi zamanı kırdığında geminin savrulduğu yer, uzayın derinliği değil — zamanın sonu.',
                   en: 'This toxic, alien planet you have been walking is not alien.\nThis is Earth. When the anomaly broke time, the ship was not flung across space — it was flung to the end of it.' },
    twist_4:     { tr: 'Analog fotoğraf makinesi senin geminden düşmedi.\nO hep buradaydı.',
                   en: 'The analogue camera did not fall from your ship.\nIt was always here.' },
    twist_toast: { tr: 'Bir şey yerine oturdu ve hiçbir şey eskisi gibi değil.',
                   en: 'Something has fallen into place, and nothing is as it was.' },

    /* --- kuantum yansıması --- */
    echo_meet1:  { tr: 'Son çekirdek yuvaya oturduğunda, karşında bir şey beliriyor.\nDevasa bir canavar değil. Senin duruşun, senin kaskın, senin yürüyüşün.',
                   en: 'As the last fragment seats itself, something takes shape before you.\nNot a great beast. Your stance, your helmet, your gait.' },
    echo_meet2:  { tr: 'Geminin kuantum yansımalarından doğmuş.\nSaldırmıyor — bekliyor. Ne yaparsan onu yapacak.',
                   en: 'Born from the ship\'s quantum reflections.\nIt does not attack — it waits. It will do whatever you do.' },
    echo_mirror: { tr: 'Yansıma senin hamleni tekrarlıyor.', en: 'The echo repeats your move.' },
    echo_learn:  { tr: 'Yansıma öğrendi: {name}', en: 'The echo has learned: {name}' },
    echo_end:    { tr: 'Yansıma duruyor. Sana bakıyor ve kaskını çıkarır gibi bir hareket yapıyor.\nSonra dağılıyor.',
                   en: 'The echo stops. It looks at you and moves as if removing its helmet.\nThen it disperses.' },

    /* --- final ikilemi --- */
    fin_title:   { tr: 'İKİ YOL', en: 'TWO ROADS' },
    fin_text:    { tr: 'Çekirdek elinde, bütün ve atıyor. Zaman burada ince — bükülebilir.\nSeçim senin:',
                   en: 'The core is in your hands, whole and beating. Time is thin here — it can be bent.\nThe choice is yours:' },
    fin_erase:   { tr: 'Zamanı bük — Dünya\'nın bu sonunu sil', en: 'Bend time — erase this end of Earth' },
    fin_bury:    { tr: 'Parçaları toprağa göm — bu dünyanın evrimleşmesine izin ver', en: 'Bury the fragments — let this world evolve' },
    fin_erase_t: { tr: 'HİÇ OLMAMIŞ', en: 'NEVER HAPPENED' },
    fin_erase_1: { tr: 'Çekirdeği açıyorsun ve zaman bir kumaş gibi geriliyor.\nÇöl siliniyor. Asit gölü siliniyor. Kubbe, Alpha, ninni — siliniyor.',
                   en: 'You open the core and time stretches like cloth.\nThe desert unwrites. The acid lake unwrites. The dome, Alpha, the lullaby — unwritten.' },
    fin_erase_2: { tr: 'Bu geleceği doğuran her şeyi geri alıyorsun. Kimse bilmeyecek. Kimse hatırlamayacak.\nAlpha’nın son cümlesi de silinecek — ama o zaten sessizlik istemişti.',
                   en: 'You undo everything that made this future. No one will know. No one will remember.\nAlpha\'s last words will go too — but silence was what it asked for.' },
    fin_erase_3: { tr: 'Ekran kararırken elinde bir tek o kalıyor: çatlak lensli, eski bir fotoğraf makinesi.\nİçinde mavi bir gezegenin fotoğrafı var.',
                   en: 'As the screen darkens, one thing remains in your hand: an old camera with a cracked lens.\nInside it, a photograph of a blue planet.' },
    fin_bury_t:  { tr: 'KÜLLERDEN', en: 'FROM THE ASHES' },
    fin_bury_1:  { tr: 'Parçaları tek tek toprağa gömüyorsun. Çekirdek direnmiyor.\nZehirli toprak onları kabul ediyor ve bir şey — çok yavaş — ısınmaya başlıyor.',
                   en: 'You bury the fragments one by one. The core does not resist.\nThe poisoned ground accepts them, and something — very slowly — begins to warm.' },
    fin_bury_2:  { tr: 'Bu dünyayı kurtarmıyorsun. Ona sadece zaman veriyorsun.\nVahada su berrak akıyor. Mantar ormanında bir spor bulutu, bu kez zehirsiz, yükseliyor.',
                   en: 'You are not saving this world. You are only giving it time.\nIn the oasis the water runs clear. In the forest a spore bloom rises — this time without poison.' },
    fin_bury_3:  { tr: 'Yaralı bir ekosistem küllerinden evrimleşecek. Sen bunu görmeyeceksin.\nEkran kararırken gezegenin rüzgârı sesini alıyor ve kendi yankısını yaratıyor.',
                   en: 'A wounded ecosystem will evolve from its own ashes. You will not see it.\nAs the screen darkens the planet\'s wind takes your voice and makes an echo of its own.' },
    fin_epitaph: { tr: 'Gün {d} · Seviye {l} · Hâkim {b} · Seçim: {c}',
                   en: 'Day {d} · Level {l} · Wardens {b} · Choice: {c}' },
    fin_c_erase: { tr: 'silmek', en: 'to erase' },
    fin_c_bury:  { tr: 'bırakmak', en: 'to let go' },

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
