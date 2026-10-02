// server/src/services/nutritionDatabase.js

/**
 * Pan-India Nutrition Reference Database
 *
 * Approximate, cooked-as-eaten values per 100g (calories in kcal, protein in g),
 * compiled from typical IFCT / USDA / NIN-style reference ranges and rounded.
 * Home and restaurant recipes vary a lot (oil, ghee, sugar), so treat these as
 * sensible defaults for deterministic backend math, not lab values.
 *
 * Schema (backward compatible with the previous version):
 *   name, aliases, servingType ("piece" | "weight" | "portion"), defaultGrams,
 *   caloriesPer100g, proteinPer100g, caloriesPerUnit, proteinPerUnit,
 *   category, + new: region, diet ("veg" | "egg" | "nonveg"), optional flags
 *   (isFried, isBoneIn, edibleGramsPerUnit).
 *
 * Regions: pan_indian, north, south, east, west, central, northeast, kashmir,
 *          goa_konkan, global
 */

const NON_VEG_CATEGORIES = new Set([
  "poultry", "fried_meat", "organ_meat", "seafood", "red_meat", "meat_curry", "meat_rice",
]);

/**
 * Entry factory. Per-unit values are derived from per-100g values and
 * defaultGrams unless overridden through `extra`.
 */
function f(key, name, aliases, servingType, grams, kcal100, prot100, category, region, extra = {}) {
  const diet =
    extra.diet ||
    (category === "egg" ? "egg" : NON_VEG_CATEGORIES.has(category) ? "nonveg" : "veg");
  return [
    key,
    {
      name,
      aliases,
      servingType,
      defaultGrams: grams,
      caloriesPer100g: kcal100,
      proteinPer100g: prot100,
      caloriesPerUnit: Math.round((kcal100 * grams) / 100),
      proteinPerUnit: Math.round(((prot100 * grams) / 100) * 10) / 10,
      category,
      region,
      diet,
      ...extra,
    },
  ];
}

export const NUTRITION_DATABASE = Object.fromEntries([
  // ═══════════════ BREADS & ROTIS ═══════════════
  f("chapati", "Chapati / Roti / Phulka", ["chapati", "chapatis", "roti", "rotis", "phulka", "phulkas", "fulka", "fulkas", "chapatti", "poli"], "piece", 40, 225, 8.0, "bread", "pan_indian"),
  f("tandoori_roti", "Tandoori Roti", ["tandoori roti", "tandoori rotis", "tawa roti"], "piece", 60, 250, 8.5, "bread", "north"),
  f("rumali_roti", "Rumali Roti", ["rumali roti", "roomali roti"], "piece", 40, 260, 8.0, "bread", "north"),
  f("missi_roti", "Missi Roti (Besan + Atta)", ["missi roti", "missi rotis"], "piece", 55, 245, 10.0, "bread", "north"),
  f("makki_roti", "Makki di Roti (Maize)", ["makki roti", "makki di roti", "corn roti", "makai roti"], "piece", 70, 220, 5.0, "bread", "north"),
  f("bajra_roti", "Bajra Roti / Bhakri", ["bajra roti", "bajra rotla", "bajre ki roti", "pearl millet roti", "bajra bhakri"], "piece", 55, 230, 8.0, "bread", "west"),
  f("jowar_roti", "Jowar Bhakri / Jolada Rotti", ["jowar roti", "jowar bhakri", "jolada rotti", "bhakri", "jwari roti", "sorghum roti", "jowar rotla"], "piece", 50, 215, 6.5, "bread", "west"),
  f("ragi_roti", "Ragi / Nachni Roti (Finger Millet)", ["ragi roti", "nachni roti", "nachni bhakri", "finger millet roti", "ragi rotti"], "piece", 50, 210, 5.5, "bread", "south"),
  f("thepla", "Thepla (Methi / Plain, Gujarati)", ["thepla", "theplas", "methi thepla", "dudhi thepla"], "piece", 40, 290, 8.0, "bread", "west"),
  f("thalipeeth", "Thalipeeth (Multigrain Flatbread)", ["thalipeeth", "thalipith"], "piece", 70, 245, 8.0, "bread", "west"),
  f("khakhra", "Khakhra (Roasted Gujarati Cracker)", ["khakhra", "khakra"], "piece", 15, 400, 12.0, "snack", "west"),
  f("paratha_plain", "Plain Paratha (Ghee/Oil)", ["paratha", "paranthas", "parantha", "plain paratha", "lachha paratha", "tawa paratha"], "piece", 70, 315, 6.8, "bread", "pan_indian"),
  f("paratha_stuffed", "Stuffed Paratha (Aloo/Paneer/Gobi/Mooli)", ["aloo paratha", "paneer paratha", "gobi paratha", "stuffed paratha", "mooli paratha", "methi paratha"], "piece", 110, 255, 5.9, "bread", "north"),
  f("malabar_parotta", "Kerala / Malabar Parotta (Maida, Layered)", ["parotta", "porotta", "malabar parotta", "kerala parotta", "veechu parotta", "kothu parotta"], "piece", 80, 330, 6.5, "bread", "south"),
  f("puri", "Puri / Poori (Deep Fried)", ["puri", "puris", "poori", "pooris"], "piece", 28, 340, 7.5, "fried_bread", "pan_indian", { isFried: true }),
  f("luchi", "Luchi (Bengali Maida Puri)", ["luchi", "luchis", "loochi"], "piece", 30, 350, 7.0, "fried_bread", "east", { isFried: true }),
  f("bhatura", "Bhatura (Fermented Deep Fried Bread)", ["bhatura", "bhature", "bhatoora", "chole bhatura bread"], "piece", 90, 330, 7.5, "fried_bread", "north", { isFried: true }),
  f("naan", "Naan / Butter Naan / Kulcha", ["naan", "butter naan", "garlic naan", "kulcha", "amritsari kulcha", "plain naan"], "piece", 90, 290, 8.3, "bread", "north"),
  f("sheermal", "Sheermal (Sweet Saffron Bread)", ["sheermal", "sheer mal"], "piece", 80, 330, 8.0, "bread", "central"),
  f("litti", "Litti (Sattu Stuffed, Baked)", ["litti", "littis", "baati", "bati", "dal baati"], "piece", 80, 280, 8.5, "bread", "east"),
  f("puran_poli", "Puran Poli / Obbattu / Holige (Sweet Stuffed)", ["puran poli", "puranpoli", "obbattu", "holige", "bobbatlu", "vedmi"], "piece", 80, 300, 6.0, "sweet", "west"),
  f("bread_slice", "Bread Slice (White/Brown/Whole Wheat)", ["bread", "bread slice", "toast", "slice of bread", "brown bread", "white bread", "sandwich bread"], "piece", 30, 250, 9.3, "bread", "global"),
  f("pav", "Pav / Ladi Pav (Bread Roll)", ["pav", "ladi pav", "bun", "dinner roll"], "piece", 40, 270, 8.0, "bread", "west"),

  // ═══════════════ RICE, GRAINS & ONE-POT MEALS ═══════════════
  f("rice_cooked", "Steamed / Cooked White Rice", ["rice", "cooked rice", "steamed rice", "chawal", "white rice", "boiled rice", "bhaat", "bhat", "sadam", "annam", "kuchchi", "ukda rice", "red rice", "matta rice"], "weight", 150, 130, 2.7, "grain", "pan_indian"),
  f("rice_raw", "Raw / Uncooked Rice", ["uncooked rice", "raw rice"], "weight", 100, 360, 7.1, "grain", "pan_indian"),
  f("rice_brown_cooked", "Cooked Brown Rice", ["brown rice", "cooked brown rice"], "weight", 150, 112, 2.6, "grain", "global"),
  f("panta_bhat", "Panta Bhat (Fermented Rice, Bengal/Odisha/Assam)", ["panta bhat", "pakhala", "pakhala bhata", "poita bhat"], "portion", 250, 70, 1.5, "grain", "east"),
  f("jeera_rice", "Jeera Rice / Ghee Rice", ["jeera rice", "ghee rice", "neychoru"], "portion", 180, 165, 3.0, "grain", "north"),
  f("biryani", "Chicken / Mutton / Veg Biryani", ["biryani", "chicken biryani", "mutton biryani", "veg biryani", "hyderabadi biryani", "dum biryani", "egg biryani", "kolkata biryani", "thalassery biryani", "ambur biryani"], "portion", 300, 175, 6.5, "meat_rice", "pan_indian", { diet: "nonveg" }),
  f("pulao", "Pulao / Veg Pulao / Fried Rice", ["pulao", "pulav", "veg pulao", "matar pulao", "fried rice", "tehri", "vangi bath"], "portion", 250, 160, 3.5, "grain", "pan_indian"),
  f("khichdi", "Moong Dal Khichdi", ["khichdi", "khichri", "khichuri", "dal khichdi", "masala khichdi", "bhogi khichuri"], "portion", 250, 110, 4.2, "grain", "pan_indian"),
  f("pongal", "Ven Pongal (Rice + Moong Dal, Ghee)", ["pongal", "ven pongal", "khara pongal", "huggi"], "portion", 200, 130, 3.5, "breakfast", "south"),
  f("curd_rice", "Curd Rice / Thayir Sadam / Daddojanam", ["curd rice", "thayir sadam", "dahi chawal", "daddojanam", "perugu annam", "mosaranna"], "portion", 220, 120, 3.5, "grain", "south"),
  f("lemon_rice", "Lemon Rice / Chitranna", ["lemon rice", "chitranna", "elumichai sadam", "nimmakaya pulihora"], "portion", 180, 165, 3.5, "grain", "south"),
  f("tamarind_rice", "Tamarind Rice / Puliyogare / Pulihora", ["tamarind rice", "puliyogare", "pulihora", "puliyodharai", "pulisaadham"], "portion", 180, 170, 3.0, "grain", "south"),
  f("bisibelebath", "Bisi Bele Bath (Karnataka)", ["bisi bele bath", "bisibelebath", "bisibele bhath"], "portion", 250, 135, 4.5, "grain", "south"),
  f("rajma_chawal", "Rajma Chawal (Plate)", ["rajma chawal", "rajma rice"], "portion", 350, 135, 4.8, "grain", "north"),
  f("poha", "Poha (Flattened Rice with Peanuts & Seasoning)", ["poha", "pohe", "flattened rice", "aval", "chivda poha", "kanda poha", "batata poha", "avalakki"], "portion", 160, 160, 3.5, "breakfast", "west"),
  f("upma", "Upma (Semolina / Rava)", ["upma", "rava upma", "uppittu", "uppuma", "kharabath"], "portion", 160, 150, 3.8, "breakfast", "south"),
  f("sabudana_khichdi", "Sabudana Khichdi (Sago + Peanuts, Fasting Food)", ["sabudana khichdi", "sabudana", "sago khichdi", "sabakki"], "portion", 150, 180, 2.5, "breakfast", "west"),
  f("oats_cooked", "Cooked Oatmeal / Porridge", ["oats", "oatmeal", "porridge", "oats in milk", "oats in water"], "portion", 200, 80, 3.2, "breakfast", "global"),
  f("dalia", "Dalia / Broken Wheat Porridge", ["dalia", "daliya", "broken wheat", "lapsi", "godhuma rava"], "portion", 200, 105, 3.5, "breakfast", "north"),
  f("ragi_mudde", "Ragi Mudde / Ragi Sankati / Kali (Finger Millet Ball)", ["ragi mudde", "ragi sankati", "ragi ball", "ragi kali", "kali", "ragi mudda"], "piece", 150, 120, 3.0, "grain", "south"),
  f("ragi_porridge", "Ragi Porridge / Ambali / Koozh", ["ragi porridge", "ragi java", "ragi ambali", "ragi koozh", "kezhvaragu koozh"], "portion", 200, 65, 1.8, "breakfast", "south"),
  f("jowar_upma", "Millet Upma / Millet Khichdi", ["millet upma", "millet khichdi", "foxtail millet", "kodo millet"], "portion", 180, 140, 4.0, "grain", "south"),

  // ═══════════════ SOUTH INDIAN TIFFIN ═══════════════
  f("idli", "Idli (Steamed Rice & Urad Dal Cake)", ["idli", "idlis", "steamed idli", "thatte idli", "rava idli"], "piece", 45, 144, 4.9, "breakfast", "south"),
  f("dosa_plain", "Plain Dosa", ["dosa", "plain dosa", "sada dosa", "dose", "dosai"], "piece", 90, 167, 3.9, "breakfast", "south"),
  f("dosa_masala", "Masala Dosa (Potato Filling)", ["masala dosa", "alu dosa", "mysore masala dosa", "set dosa masala"], "piece", 160, 175, 3.4, "breakfast", "south"),
  f("dosa_rava", "Rava Dosa / Onion Rava Dosa", ["rava dosa", "onion rava dosa", "sooji dosa"], "piece", 100, 190, 4.5, "breakfast", "south"),
  f("neer_dosa", "Neer Dosa (Coastal Karnataka, Thin Rice Crepe)", ["neer dosa", "neer dose"], "piece", 50, 130, 2.5, "breakfast", "south"),
  f("pesarattu", "Pesarattu (Green Moong Dosa, Andhra)", ["pesarattu", "pesara dosa", "moong dosa"], "piece", 100, 150, 7.0, "breakfast", "south"),
  f("uttapam", "Uttapam / Oothappam", ["uttapam", "uthappam", "oothappam", "onion uttapam"], "piece", 120, 160, 4.5, "breakfast", "south"),
  f("appam", "Appam / Palappam (Fermented Rice Hopper)", ["appam", "palappam", "vellayappam", "hoppers"], "piece", 60, 140, 2.5, "breakfast", "south"),
  f("idiyappam", "Idiyappam / String Hoppers / Sevai", ["idiyappam", "string hoppers", "nool puttu", "sevai", "semiya idiyappam", "shavige"], "piece", 40, 130, 2.5, "breakfast", "south"),
  f("puttu", "Puttu (Steamed Rice-Coconut Cylinder)", ["puttu", "kerala puttu", "ragi puttu"], "portion", 100, 150, 3.5, "breakfast", "south"),
  f("medu_vada", "Medu Vada (Urad Dal, Deep Fried)", ["medu vada", "vada", "vadai", "ulundu vada", "garelu", "uddina vade"], "piece", 50, 300, 8.4, "fried_snack", "south", { isFried: true }),
  f("sambar", "Sambar (Lentil-Vegetable Stew)", ["sambar", "sambhar", "tiffin sambar", "arachuvitta sambar"], "portion", 150, 60, 3.0, "dal", "south"),
  f("rasam", "Rasam / Saaru / Charu", ["rasam", "saaru", "charu", "pepper rasam", "tomato rasam"], "portion", 150, 25, 1.0, "dal", "south"),
  f("kootu", "Kootu / Dalma-style Veg-Dal", ["kootu", "dalma", "koottu curry"], "portion", 150, 95, 4.0, "dal", "south"),
  f("poriyal", "Poriyal / Thoran / Palya (Dry Stir-fried Vegetables)", ["poriyal", "thoran", "palya", "palyam", "kari", "upperi", "beans poriyal", "cabbage thoran"], "portion", 100, 90, 2.5, "vegetables", "south"),
  f("avial", "Avial (Mixed Veg in Coconut-Curd)", ["avial", "aviyal"], "portion", 150, 100, 2.5, "vegetables", "south"),
  f("coconut_chutney", "Coconut Chutney", ["coconut chutney", "nariyal chutney", "thengai chutney", "chutney"], "portion", 30, 150, 2.5, "condiment", "south"),
  f("mysore_pak", "Mysore Pak", ["mysore pak"], "piece", 40, 520, 5.0, "sweet", "south"),
  f("payasam", "Payasam / Kheer-style (Vermicelli / Rice / Dal)", ["payasam", "payasa", "semiya payasam", "paal payasam", "pradhaman", "ada pradhaman"], "portion", 150, 150, 3.0, "sweet", "south"),

  // ═══════════════ WEST: MAHARASHTRA, GUJARAT, RAJASTHAN, GOA ═══════════════
  f("dhokla", "Dhokla (Khaman, Steamed Gram Flour)", ["dhokla", "khaman", "khaman dhokla", "nylon khaman", "idada"], "piece", 60, 160, 6.0, "snack", "west"),
  f("khandvi", "Khandvi", ["khandvi", "patuli"], "portion", 80, 170, 6.5, "snack", "west"),
  f("handvo", "Handvo (Baked Lentil-Rice Cake)", ["handvo"], "piece", 100, 190, 6.0, "snack", "west"),
  f("fafda", "Fafda (Fried Gram Flour Strips)", ["fafda"], "piece", 20, 480, 12.0, "fried_snack", "west", { isFried: true }),
  f("vada_pav", "Vada Pav (Batata Vada in Pav)", ["vada pav", "wada pav", "batata vada pav"], "piece", 120, 250, 6.0, "fried_snack", "west", { isFried: true }),
  f("pav_bhaji", "Pav Bhaji (Bhaji only, with butter)", ["pav bhaji", "bhaji", "pav bhaji bhaji"], "portion", 200, 150, 4.0, "vegetables", "west"),
  f("misal_pav", "Misal (Sprout Curry with Farsan, w/o Pav)", ["misal", "misal pav", "kolhapuri misal", "puneri misal", "usal"], "portion", 250, 160, 7.0, "legumes", "west"),
  f("sabudana_vada", "Sabudana Vada (Fried)", ["sabudana vada", "sago vada"], "piece", 40, 290, 3.0, "fried_snack", "west", { isFried: true }),
  f("kothimbir_vadi", "Kothimbir Vadi (Coriander Gram Flour Fritter)", ["kothimbir vadi", "kothimbir wadi"], "piece", 30, 270, 7.0, "fried_snack", "west", { isFried: true }),
  f("kadhi", "Kadhi (Gujarati / Punjabi Yogurt-Besan Curry)", ["kadhi", "kadhi pakora", "gujarati kadhi", "punjabi kadhi", "majjiga pulusu", "mor kuzhambu", "moru curry", "kadhi chawal"], "portion", 150, 80, 3.0, "curry", "pan_indian"),
  f("undhiyu", "Undhiyu (Gujarati Mixed Winter Vegetables)", ["undhiyu", "undhiya"], "portion", 150, 150, 3.5, "vegetables", "west"),
  f("dal_dhokli", "Dal Dhokli", ["dal dhokli", "dalia dhokli"], "portion", 250, 120, 4.5, "dal", "west"),
  f("gatte_ki_sabzi", "Gatte ki Sabzi (Rajasthani Gram Flour Dumplings)", ["gatte ki sabzi", "gatta curry", "gatte"], "portion", 150, 160, 6.0, "curry", "west"),
  f("ker_sangri", "Ker Sangri (Rajasthani Desert Beans)", ["ker sangri", "kair sangri"], "portion", 100, 130, 3.0, "vegetables", "west"),
  f("dal_baati_churma", "Churma (Sweet Crumbled Wheat)", ["churma"], "portion", 80, 450, 7.0, "sweet", "west"),
  f("laal_maas", "Laal Maas (Rajasthani Mutton Curry)", ["laal maas", "lal maas", "safed maas", "junglee maas"], "portion", 150, 250, 17.0, "red_meat", "west"),
  f("pork_vindaloo", "Pork Vindaloo / Sorpotel / Pork Sausage (Goan)", ["pork vindaloo", "vindaloo", "sorpotel", "goan sausage", "chouricos", "pork curry"], "portion", 150, 240, 15.0, "red_meat", "goa_konkan"),
  f("goan_fish_curry", "Goan / Konkani Fish Curry (Coconut-based)", ["goan fish curry", "xitt codi", "fish curry rice curry", "malvani fish curry", "ambot tik", "kokum fish curry", "fish ambat"], "portion", 150, 130, 12.0, "seafood", "goa_konkan"),
  f("sol_kadhi", "Sol Kadhi (Kokum-Coconut Drink)", ["sol kadhi", "solkadhi"], "portion", 200, 55, 1.0, "beverage", "goa_konkan"),
  f("bebinca", "Bebinca (Goan Layered Dessert)", ["bebinca"], "piece", 60, 380, 5.0, "sweet", "goa_konkan"),

  // ═══════════════ NORTH & CENTRAL ═══════════════
  f("chole", "Chole / Chana Masala (Punjabi)", ["chole", "choole", "chana masala", "chhole", "punjabi chole", "pindi chole", "chole masala"], "portion", 150, 150, 7.5, "legumes", "north"),
  f("rajma", "Rajma Masala (Kidney Bean Curry)", ["rajma", "rajma masala", "kidney beans", "rajmah"], "portion", 150, 135, 7.0, "legumes", "north"),
  f("chana_cooked", "Boiled / Cooked Chana (Kala Chana, Chickpeas)", ["chana", "chickpeas", "kala chana", "boiled chana", "sundal", "chana sundal", "ghugni", "brown chana"], "portion", 150, 150, 7.5, "legumes", "pan_indian"),
  f("lobia", "Lobia / Black-eyed Peas Curry", ["lobia", "chawli", "black eyed peas", "alasande", "karamani", "chora"], "portion", 150, 120, 6.5, "legumes", "pan_indian"),
  f("sprouts", "Sprouts (Moong / Mixed, Boiled or Raw)", ["sprouts", "moong sprouts", "mixed sprouts", "sprouted moong", "matki usal", "sprout salad"], "portion", 100, 100, 8.0, "legumes", "pan_indian"),
  f("ragda", "Ragda (Cooked White Vatana Gravy)", ["ragda", "safed vatana", "vatana", "white peas curry", "matar kulcha", "dried peas curry"], "portion", 150, 115, 5.5, "legumes", "west"),
  f("dal_makhani", "Dal Makhani (Black Dal, Butter-Cream)", ["dal makhani", "dal makhni", "maa ki dal", "kaali dal"], "portion", 150, 140, 5.5, "dal", "north"),
  f("dal", "Dal / Lentil Curry (Toor, Moong, Masoor with Tadka)", ["dal", "daal", "dhal", "dal tadka", "dal fry", "lentils", "toor dal", "arhar dal", "moong dal", "masoor dal", "pappu", "paruppu", "tuvar dal", "varan", "amti", "dalma dal", "chana dal", "urad dal", "gujarati dal", "mixed dal", "panchmel dal"], "portion", 150, 110, 5.5, "dal", "pan_indian"),
  f("sarson_saag", "Sarson da Saag (Mustard Greens)", ["sarson ka saag", "sarson da saag", "saag", "sarson saag"], "portion", 150, 95, 3.5, "vegetables", "north"),
  f("palak_dal", "Palak Dal / Dal Palak / Keerai Masiyal", ["palak dal", "dal palak", "keerai masiyal", "keerai kootu", "spinach dal"], "portion", 150, 100, 5.0, "dal", "pan_indian"),
  f("aloo_sabzi", "Aloo Sabzi (Dry / Jeera Aloo / Aloo Gobi)", ["aloo sabzi", "aloo", "aloo gobi", "jeera aloo", "dum aloo", "aloo matar", "batata bhaji", "aloo curry", "bombay potato"], "portion", 150, 115, 2.5, "vegetables", "pan_indian"),
  f("bhindi", "Bhindi Masala / Okra Fry", ["bhindi", "okra", "bhindi masala", "bendakaya fry", "vendakkai"], "portion", 120, 100, 2.5, "vegetables", "pan_indian"),
  f("baingan_bharta", "Baingan Bharta / Gutti Vankaya", ["baingan bharta", "baingan", "brinjal curry", "gutti vankaya", "vangi bharit", "begun bhaja", "ennai kathirikai"], "portion", 150, 90, 2.0, "vegetables", "pan_indian"),
  f("veg_curry", "Vegetable Curry / Sabzi (Mixed Veg)", ["sabzi", "sabji", "veg curry", "vegetables", "mix veg", "mixed veg", "lauki sabzi", "tinda", "turai", "cabbage sabzi", "gobi sabzi", "shaak", "shak", "bhaji sabzi", "ghonto", "dalna"], "portion", 150, 95, 2.5, "vegetables", "pan_indian"),
  f("kathal_sabzi", "Kathal (Jackfruit) Sabzi", ["kathal", "jackfruit curry", "kathal sabzi", "chakka curry", "panasa"], "portion", 150, 120, 2.8, "vegetables", "pan_indian"),
  f("mushroom_curry", "Mushroom Curry / Matar Mushroom", ["mushroom curry", "mushroom masala", "matar mushroom"], "portion", 150, 85, 3.5, "vegetables", "pan_indian"),
  f("paneer_curry", "Paneer Butter Masala / Palak Paneer / Kadai Paneer", ["paneer curry", "paneer butter masala", "kadai paneer", "palak paneer", "shahi paneer", "matar paneer", "paneer masala", "paneer tikka masala", "chilli paneer gravy"], "portion", 200, 175, 7.5, "curry", "north"),
  f("paneer_raw", "Paneer (Fresh / Raw)", ["paneer", "cottage cheese", "raw paneer", "paneer tikka", "grilled paneer"], "weight", 100, 275, 18.5, "dairy", "north"),
  f("tofu", "Tofu (Firm)", ["tofu", "bean curd"], "weight", 100, 76, 8.0, "soy", "global"),
  f("soya_chunks", "Soya Chunks / Nutrela (Cooked)", ["soya chunks", "soy chunks", "nutrela", "meal maker", "soya chunk curry"], "weight", 100, 120, 14.0, "soy", "pan_indian"),
  f("soya_chunks_dry", "Soya Chunks (Dry, Uncooked)", ["dry soya chunks", "raw soya chunks"], "weight", 30, 345, 52.0, "soy", "pan_indian"),
  f("sattu_powder", "Sattu Powder (Roasted Gram Flour)", ["sattu", "sattu powder", "chhatua"], "weight", 30, 410, 20.0, "grain", "east"),
  f("sattu_drink", "Sattu Sharbat / Drink (30g in water)", ["sattu drink", "sattu sharbat", "sattu ka sharbat"], "portion", 250, 50, 2.5, "beverage", "east"),

  // ═══════════════ EAST & NORTHEAST ═══════════════
  f("macher_jhol", "Macher Jhol / Bengali Fish Curry (Rohu/Katla)", ["macher jhol", "bengali fish curry", "rui macher jhol", "katla curry", "maacher jhol", "fish jhol"], "portion", 150, 120, 14.0, "seafood", "east"),
  f("shorshe_ilish", "Shorshe Ilish / Hilsa Curry", ["ilish", "hilsa", "shorshe ilish", "ilish bhapa", "hilsa curry", "pulasa"], "portion", 120, 260, 19.0, "seafood", "east"),
  f("chingri_malai", "Chingri Malai Curry / Prawn Curry", ["chingri malai curry", "prawn curry", "prawns", "shrimp curry", "chingri", "jhinga", "prawn masala", "kolambi", "eral thokku"], "portion", 150, 110, 12.0, "seafood", "east"),
  f("fish_cooked", "Cooked / Curry Fish (generic)", ["fish", "fish curry", "machli", "machhi", "meen curry", "meen kuzhambu", "salmon", "pomfret", "rohu", "tilapia", "surmai", "kingfish", "seer fish", "mackerel", "bangda", "basa", "catfish"], "weight", 100, 170, 22.0, "seafood", "pan_indian"),
  f("fish_fried", "Fried Fish / Fish Fry / Tawa Fish", ["fried fish", "fish fry", "tawa fish", "rava fry fish", "meen varuval", "bombil fry", "bombay duck", "fish tikka", "amritsari fish"], "weight", 100, 240, 20.0, "seafood", "pan_indian", { isFried: true }),
  f("sardine_curry", "Sardine / Mathi / Tarli Curry", ["sardine", "mathi", "chaala", "tarli", "mathi curry", "oil sardine"], "portion", 120, 150, 18.0, "seafood", "south"),
  f("crab_curry", "Crab Curry / Crab Masala", ["crab", "crab curry", "kekda", "njandu", "nandu"], "portion", 150, 100, 14.0, "seafood", "pan_indian"),
  f("dim_curry", "Egg Curry / Dimer Dalna / Mutta Curry", ["egg curry", "dim curry", "dimer dalna", "mutta curry", "anda curry", "egg masala", "mutta roast"], "portion", 180, 130, 8.0, "egg", "pan_indian"),
  f("aloo_posto", "Aloo Posto (Potato in Poppy Seed Paste)", ["aloo posto", "alu posto", "posto"], "portion", 150, 150, 3.0, "vegetables", "east"),
  f("shukto", "Shukto / Bitter-Veg Medley", ["shukto", "shukto veg"], "portion", 150, 80, 2.5, "vegetables", "east"),
  f("rasgulla", "Rasgulla (in Syrup)", ["rasgulla", "rosogolla", "rasagolla", "rasagulla"], "piece", 50, 186, 3.8, "sweet", "east"),
  f("sandesh", "Sandesh / Chhena Sweets", ["sandesh", "sondesh", "chhena poda", "chenna poda", "chhena gaja"], "piece", 30, 310, 11.0, "sweet", "east"),
  f("mishti_doi", "Mishti Doi / Sweet Curd", ["mishti doi", "misti doi", "bhapa doi", "payodhi"], "portion", 100, 140, 4.0, "dairy", "east"),
  f("pitha", "Pitha / Patishapta / Chakuli / Pooda", ["pitha", "patishapta", "chakuli pitha", "enduri pitha", "peethe"], "piece", 60, 220, 3.5, "sweet", "east"),
  f("momo_steamed", "Momos (Steamed, Veg/Chicken)", ["momo", "momos", "steamed momos", "dumplings", "chicken momos", "veg momos", "dim sum", "khinkali"], "piece", 30, 150, 7.0, "snack", "northeast"),
  f("momo_fried", "Momos (Fried / Kothey)", ["fried momos", "kothey momos", "pan fried momos"], "piece", 35, 220, 7.0, "fried_snack", "northeast", { isFried: true }),
  f("thukpa", "Thukpa / Thenthuk (Himalayan Noodle Soup)", ["thukpa", "thenthuk", "gyathuk"], "portion", 350, 85, 5.0, "noodle", "northeast"),
  f("jadoh", "Jadoh (Meghalaya Rice-Pork Dish)", ["jadoh", "jadoh pork"], "portion", 250, 190, 9.0, "meat_rice", "northeast"),
  f("smoked_pork_naga", "Smoked Pork with Bamboo Shoot (Naga)", ["smoked pork", "naga pork", "bamboo shoot pork", "axone pork", "pork with akhuni"], "portion", 120, 280, 18.0, "red_meat", "northeast"),
  f("masor_tenga", "Masor Tenga (Assamese Sour Fish Curry)", ["masor tenga", "masor tenga fish"], "portion", 150, 100, 12.0, "seafood", "northeast"),
  f("khar", "Khar / Assamese Alkaline Dish with Papaya", ["khar", "assamese khar"], "portion", 150, 70, 3.0, "vegetables", "northeast"),
  f("eromba", "Eromba (Manipuri Fermented Fish Veg Mash)", ["eromba", "singju", "iromba", "chamthong"], "portion", 120, 80, 5.0, "vegetables", "northeast"),
  f("bamboo_shoot_curry", "Bamboo Shoot Curry", ["bamboo shoot", "bamboo shoot curry"], "portion", 120, 50, 2.5, "vegetables", "northeast"),
  f("pumpkin_sikkim_sel", "Sel Roti (Nepali / Sikkim Rice Ring Bread)", ["sel roti", "selroti"], "piece", 50, 330, 4.0, "fried_bread", "northeast", { isFried: true }),

  // ═══════════════ KASHMIR / HIMALAYAN ═══════════════
  f("rogan_josh", "Rogan Josh / Kashmiri Mutton Curry", ["rogan josh", "roghan josh", "kashmiri mutton"], "portion", 150, 210, 16.0, "red_meat", "kashmir"),
  f("goshtaba", "Goshtaba / Rista (Kashmiri Meatballs)", ["goshtaba", "rista", "gushtaba", "tabak maaz", "kashmiri meatballs"], "piece", 80, 220, 14.0, "red_meat", "kashmir"),
  f("dum_aloo_kashmiri", "Kashmiri Dum Aloo", ["kashmiri dum aloo"], "portion", 150, 140, 2.5, "vegetables", "kashmir"),
  f("haak", "Haak / Kashmiri Collard Greens", ["haak", "haakh", "monji haak"], "portion", 120, 60, 3.0, "vegetables", "kashmir"),
  f("kahwa", "Kahwa / Noon Chai (Kashmiri Tea)", ["kahwa", "noon chai", "sheer chai", "kashmiri tea"], "portion", 150, 25, 0.5, "beverage", "kashmir"),
  f("siddu", "Siddu (Himachali Steamed Bread)", ["siddu", "babru", "chha gosht"], "piece", 80, 220, 6.5, "bread", "north"),

  // ═══════════════ EGGS ═══════════════
  f("egg_boiled", "Boiled Egg (Whole)", ["boiled egg", "boiled eggs", "hard boiled egg", "soft boiled egg", "egg", "eggs", "anda", "muttai", "kodi guddu"], "piece", 50, 155, 12.6, "egg", "global", { caloriesPerUnit: 78, proteinPerUnit: 6.3 }),
  f("egg_white", "Egg White (Boiled)", ["egg white", "egg whites", "boiled egg white"], "piece", 33, 52, 10.9, "egg", "global", { caloriesPerUnit: 17, proteinPerUnit: 3.6 }),
  f("egg_fried", "Fried Egg / Omelet / Bhurji", ["fried egg", "fried eggs", "omelet", "omelette", "egg bhurji", "scrambled egg", "half fry", "sunny side up", "masala omelette", "anda bhurji", "podimas", "muttai poriyal"], "piece", 60, 208, 11.6, "egg", "global", { isFried: true, caloriesPerUnit: 125, proteinPerUnit: 7.0 }),

  // ═══════════════ CHICKEN & POULTRY ═══════════════
  f("chicken_breast", "Chicken Breast (Cooked / Grilled, Skinless & Boneless)", ["chicken breast", "grilled chicken breast", "boiled chicken breast"], "weight", 100, 165, 31.0, "poultry", "global"),
  f("chicken_boneless", "Boneless Chicken (Cooked / Curry Meat)", ["boneless chicken", "chicken pieces boneless", "chicken tikka", "chicken malai tikka", "tandoori chicken boneless", "chicken kebab"], "weight", 100, 185, 27.0, "poultry", "pan_indian"),
  f("chicken_bone_in_piece", "Small Bone-in Chicken Piece (Cooked)", ["chicken piece", "chicken pieces", "bone-in chicken", "small boned chicken", "chicken with bone"], "piece", 45, 200, 25.0, "poultry", "pan_indian", { isBoneIn: true, edibleGramsPerUnit: 30, caloriesPerUnit: 65, proteinPerUnit: 8.0 }),
  f("chicken_leg", "Chicken Leg / Drumstick (Cooked)", ["chicken leg", "chicken leg piece", "drumstick", "chicken drumstick", "tangdi", "tandoori chicken", "tangdi kebab"], "piece", 100, 205, 25.0, "poultry", "pan_indian", { isBoneIn: true, edibleGramsPerUnit: 65, caloriesPerUnit: 135, proteinPerUnit: 16.5 }),
  f("chicken_thigh", "Chicken Thigh (Cooked, Edible portion)", ["chicken thigh", "chicken thighs"], "piece", 110, 215, 24.5, "poultry", "global", { edibleGramsPerUnit: 75, caloriesPerUnit: 165, proteinPerUnit: 18.5 }),
  f("chicken_fried", "Fried Chicken / Fried Drumstick", ["fried chicken", "deep fried chicken", "crispy chicken", "chicken 65", "chicken lollipop", "chicken fry", "kozhi varuval", "chicken pakora"], "piece", 90, 275, 23.0, "fried_meat", "pan_indian", { isFried: true, caloriesPerUnit: 240, proteinPerUnit: 19.0 }),
  f("butter_chicken", "Butter Chicken / Murgh Makhani (Gravy + Meat)", ["butter chicken", "murgh makhani", "chicken makhani", "chicken tikka masala"], "portion", 200, 175, 11.0, "poultry", "north"),
  f("chicken_chettinad", "Chettinad Chicken / Andhra Chicken / Kerala Chicken Roast", ["chettinad chicken", "andhra chicken", "kerala chicken roast", "chicken roast", "chicken sukka", "kozhi curry", "natu kodi", "pepper chicken", "chicken ghee roast", "kori gassi", "kori rotti"], "portion", 150, 190, 18.0, "poultry", "south"),
  f("chicken_gravy", "Chicken Gravy / Curry (Sauce Base with oil, spices & onion-tomato)", ["chicken gravy", "chicken curry", "murgh curry", "gravy", "curry gravy", "chicken masala gravy", "kadai chicken", "chicken do pyaza", "chicken kolhapuri", "chicken saagwala", "dhaba chicken"], "portion", 120, 125, 2.5, "gravy", "pan_indian", { caloriesPerUnit: 150, proteinPerUnit: 3.0 }),
  f("chicken_liver", "Chicken Liver (Cooked)", ["chicken liver", "liver", "kaleji", "boti"], "weight", 100, 170, 24.5, "organ_meat", "pan_indian"),
  f("chicken_liver_fried", "Fried Chicken Liver / Fried Kaleji", ["fried liver", "fried chicken liver", "liver fry", "kaleji fry", "gurda kapoora"], "weight", 100, 235, 24.0, "fried_meat", "pan_indian", { isFried: true }),
  f("keema", "Keema / Kheema (Minced Mutton / Chicken)", ["keema", "kheema", "mutton keema", "chicken keema", "keema matar", "keema pav", "kima"], "portion", 150, 220, 18.0, "red_meat", "pan_indian"),

  // ═══════════════ MUTTON, BEEF, PORK ═══════════════
  f("mutton_curry", "Mutton Curry / Lamb Curry", ["mutton", "mutton curry", "lamb", "goat meat", "gosht", "kosha mangsho", "mamsam", "mutton masala", "mutton kolhapuri", "mutton sukka", "nihari", "mutton korma", "keema curry"], "portion", 150, 230, 18.0, "red_meat", "pan_indian"),
  f("haleem", "Haleem (Hyderabadi Meat-Wheat Porridge)", ["haleem", "harees", "hyderabadi haleem"], "portion", 250, 150, 9.0, "red_meat", "south"),
  f("beef_fry", "Beef Fry / Beef Ularthiyathu (Kerala)", ["beef fry", "beef roast", "beef ularthiyathu", "beef curry", "beef", "beef dry fry"], "portion", 100, 220, 24.0, "red_meat", "south"),
  f("seekh_kebab", "Seekh / Shami / Galouti Kebab", ["seekh kebab", "shami kebab", "galouti kebab", "kakori kebab", "mutton kebab", "mutton seekh", "chapli kebab"], "piece", 50, 240, 17.0, "red_meat", "north"),
  f("kathi_roll", "Kathi Roll / Frankie (Egg/Chicken/Paneer)", ["kathi roll", "frankie", "egg roll", "chicken roll", "paneer roll", "kolkata roll"], "piece", 180, 230, 9.0, "fried_snack", "east"),

  // ═══════════════ SNACKS & STREET FOOD ═══════════════
  f("samosa", "Samosa (Potato Filling, Deep Fried)", ["samosa", "samosas", "aloo samosa", "punjabi samosa", "singara", "shingara"], "piece", 85, 305, 5.3, "fried_snack", "pan_indian", { isFried: true }),
  f("kachori", "Kachori (Dal / Pyaz / Raj Kachori, Fried)", ["kachori", "kachoris", "dal kachori", "pyaaz kachori", "khasta kachori", "mawa kachori", "hing kachori"], "piece", 60, 380, 8.0, "fried_snack", "north", { isFried: true }),
  f("pakora", "Pakora / Bhajiya / Bhaji (Deep Fried Fritter)", ["pakora", "pakoda", "pakoras", "bhajiya", "bhajji", "onion pakoda", "mirchi bajji", "kanda bhaji", "bonda", "aloo bonda", "mangalore bajji", "chop"], "piece", 30, 270, 6.5, "fried_snack", "pan_indian", { isFried: true }),
  f("pani_puri", "Pani Puri / Golgappa / Puchka (with Filling & Water)", ["pani puri", "golgappa", "gol gappa", "puchka", "gup chup", "phuchka", "pani ke batashe", "batasha"], "piece", 25, 120, 2.0, "chaat", "pan_indian"),
  f("sev_puri", "Sev Puri / Papdi Chaat / Dahi Puri", ["sev puri", "papdi chaat", "dahi puri", "dahi papdi chaat", "aloo tikki chaat", "chaat", "dahi vada", "dahi bhalla"], "piece", 40, 190, 4.0, "chaat", "pan_indian"),
  f("bhel_puri", "Bhel Puri / Jhal Muri / Sev Murmura", ["bhel puri", "bhel", "jhal muri", "churmuri", "sukha bhel", "sev murmura", "kolkata jhalmuri"], "portion", 100, 165, 4.0, "chaat", "pan_indian"),
  f("ragda_puri", "Ragda Puri (Puri stuffed with hot ragda & chutneys)", ["ragda puri", "ragda puris", "ragda patties", "ragda pattice"], "piece", 35, 150, 4.0, "chaat", "west", { isFried: true, caloriesPerUnit: 52, proteinPerUnit: 1.4 }),
  f("aloo_tikki", "Aloo Tikki (Shallow Fried)", ["aloo tikki", "tikki", "ragda patty"], "piece", 60, 180, 3.0, "snack", "north"),
  f("dabeli", "Dabeli (Kutchi, with Pav)", ["dabeli", "kutchi dabeli"], "piece", 120, 260, 6.0, "fried_snack", "west"),
  f("murukku", "Murukku / Chakli / Thenkuzhal", ["murukku", "chakli", "chakri", "thenkuzhal", "kodubale", "janthikalu"], "piece", 20, 480, 9.0, "fried_snack", "south", { isFried: true }),
  f("mathri", "Mathri / Namak Para / Shakarpara", ["mathri", "namak para", "shakarpara", "papdi snack", "nimki"], "piece", 15, 450, 7.0, "fried_snack", "north", { isFried: true }),
  f("bhujia_namkeen", "Bhujia / Sev / Namkeen / Mixture / Chivda", ["bhujia", "sev", "namkeen", "mixture", "chivda", "chiwda", "bikaneri bhujia", "ratlami sev", "farsan", "kara boondi", "boondi"], "weight", 28, 540, 14.0, "fried_snack", "pan_indian", { isFried: true }),
  f("papad", "Papad / Appalam (Roasted)", ["papad", "papadum", "appalam", "pappadam", "poppadom", "papadam"], "piece", 12, 300, 20.0, "snack", "pan_indian"),
  f("papad_fried", "Papad (Fried)", ["fried papad", "masala papad"], "piece", 15, 450, 18.0, "fried_snack", "pan_indian", { isFried: true }),
  f("makhana", "Makhana / Phool Makhana / Lotus Seeds (Roasted)", ["makhana", "phool makhana", "fox nuts", "lotus seeds", "makhane"], "weight", 30, 350, 10.0, "snack", "north"),
  f("popcorn_chivda", "Murmura / Puffed Rice / Kurmura", ["murmura", "puffed rice", "kurmura", "muri", "pori", "mamra"], "weight", 25, 375, 7.0, "snack", "pan_indian"),
  f("chikki", "Chikki (Peanut / Til / Dry-fruit Jaggery Bar)", ["chikki", "peanut chikki", "til chikki", "gajak", "rewri", "groundnut bar", "kadalai mittai"], "piece", 25, 480, 12.0, "sweet", "west"),
  f("peanuts", "Peanuts (Roasted / Salted / Raw)", ["peanuts", "peanut", "groundnuts", "mungfali", "moongphali", "singdana", "verkadalai", "nelakadalai", "shenga", "kadlekai"], "weight", 28, 567, 25.8, "nuts", "pan_indian"),
  f("roasted_chana", "Roasted Chana / Bhuna Chana (Roasted Bengal Gram)", ["roasted chana", "bhuna chana", "futana", "roasted chickpeas", "roasted gram", "pottukadalai", "putnalu", "hurigadale", "dalia chana"], "weight", 25, 375, 22.5, "legumes", "pan_indian"),
  f("almonds", "Almonds / Badam", ["almond", "almonds", "badam"], "weight", 28, 579, 21.2, "nuts", "pan_indian"),
  f("cashew", "Cashew Nuts / Kaju", ["cashew", "cashews", "kaju", "cashew nuts", "mundiri", "godambi"], "weight", 28, 553, 18.2, "nuts", "pan_indian"),
  f("walnut", "Walnuts / Akhrot", ["walnut", "walnuts", "akhrot"], "weight", 28, 654, 15.2, "nuts", "kashmir"),
  f("pistachio", "Pistachios / Pista", ["pistachio", "pistachios", "pista"], "weight", 28, 560, 20.2, "nuts", "pan_indian"),
  f("dates_dried", "Dates / Khajoor", ["dates", "khajoor", "khajur", "date", "kharjuram"], "piece", 8, 282, 2.5, "fruit", "pan_indian"),
  f("raisins", "Raisins / Kishmish / Dry Grapes", ["raisins", "kishmish", "dry grapes", "munakka", "unakka draksha"], "weight", 15, 300, 3.1, "fruit", "pan_indian"),
  f("flax_chia_seeds", "Flax / Chia / Pumpkin Seeds", ["flax seeds", "flaxseed", "alsi", "chia seeds", "pumpkin seeds", "sunflower seeds", "sesame seeds", "til"], "weight", 15, 520, 20.0, "nuts", "global"),

  // ═══════════════ DAIRY & BEVERAGES ═══════════════
  f("curd", "Curd / Dahi / Plain Yogurt", ["curd", "dahi", "yogurt", "plain curd", "greek yogurt", "thayir", "perugu", "mosaru", "doi", "dohi", "raita", "boondi raita"], "portion", 150, 65, 3.5, "dairy", "pan_indian"),
  f("milk", "Cow Milk (Toned / Standardized)", ["milk", "doodh", "cow milk", "whole milk", "toned milk", "buffalo milk", "paal", "haalu", "pal"], "portion", 200, 64, 3.3, "dairy", "pan_indian"),
  f("chaas", "Chaas / Buttermilk / Mor / Majjiga / Taak", ["chaas", "buttermilk", "mor", "majjiga", "taak", "chhas", "neer mor", "masala chaas", "spiced buttermilk"], "portion", 200, 30, 1.5, "beverage", "pan_indian"),
  f("lassi_sweet", "Sweet Lassi / Mango Lassi", ["lassi", "sweet lassi", "punjabi lassi", "mango lassi", "kesar lassi"], "portion", 250, 100, 3.0, "beverage", "north"),
  f("chai", "Masala Chai / Tea with Milk & Sugar", ["chai", "tea", "masala chai", "cutting chai", "milk tea", "adrak chai", "doodh patti", "kadak chai", "irani chai", "kullad chai", "chaya"], "portion", 150, 55, 1.8, "beverage", "pan_indian"),
  f("filter_coffee", "Filter Coffee (Milk & Sugar)", ["filter coffee", "kaapi", "south indian coffee", "kapi", "coffee", "kumbakonam degree coffee"], "portion", 150, 60, 2.0, "beverage", "south"),
  f("coconut_water", "Tender Coconut Water", ["coconut water", "nariyal pani", "elaneer", "ilaneer", "tender coconut", "young coconut"], "portion", 200, 19, 0.7, "beverage", "pan_indian"),
  f("sugarcane_juice", "Sugarcane Juice", ["sugarcane juice", "ganne ka ras", "ganna juice", "karumbu juice"], "portion", 250, 70, 0.2, "beverage", "pan_indian"),
  f("nimbu_pani", "Nimbu Pani / Shikanji (Sweet)", ["nimbu pani", "shikanji", "lemonade", "lemon juice sweet", "jaljeera", "aam panna", "kokum sherbet", "bael sharbat"], "portion", 250, 40, 0.2, "beverage", "pan_indian"),
  f("whey_protein", "Whey Protein Powder", ["whey", "protein powder", "whey protein", "protein shake", "scoop of whey", "isolate", "plant protein"], "piece", 30, 410, 80.0, "supplement", "global", { caloriesPerUnit: 125, proteinPerUnit: 25.0 }),
  f("ghee_butter", "Ghee / Butter", ["ghee", "butter", "makhan", "clarified butter", "tup", "neyyi", "nei", "tuppa"], "portion", 14, 884, 0.0, "fat", "pan_indian", { caloriesPerUnit: 120, proteinPerUnit: 0 }),
  f("cooking_oil", "Cooking Oil", ["oil", "cooking oil", "mustard oil", "sunflower oil", "coconut oil", "groundnut oil", "sesame oil", "gingelly oil", "olive oil", "rice bran oil", "refined oil"], "portion", 14, 884, 0.0, "fat", "pan_indian", { caloriesPerUnit: 120, proteinPerUnit: 0 }),

  // ═══════════════ SWEETS & DESSERTS ═══════════════
  f("gulab_jamun", "Gulab Jamun / Kala Jamun / Lal Mohan (in Syrup)", ["gulab jamun", "gulab jamuns", "kala jamun", "lal mohan", "pantua", "ledikeni"], "piece", 40, 300, 4.0, "sweet", "pan_indian"),
  f("jalebi", "Jalebi / Imarti", ["jalebi", "jilapi", "imarti", "jangiri", "jilebi"], "piece", 30, 380, 2.0, "sweet", "pan_indian", { isFried: true }),
  f("laddu_besan", "Besan / Motichoor / Boondi Laddu", ["laddu", "ladoo", "besan laddu", "motichoor laddu", "boondi laddu", "rava laddu", "tirupati laddu", "til laddu", "coconut laddu"], "piece", 40, 420, 8.0, "sweet", "pan_indian"),
  f("barfi_peda", "Barfi / Peda / Kaju Katli / Milk Sweets", ["barfi", "burfi", "peda", "pedha", "kaju katli", "kaju barfi", "milk cake", "kalakand", "mysore barfi", "khoya barfi", "dharwad peda", "kunda", "basundi sweet"], "piece", 30, 400, 7.0, "sweet", "pan_indian"),
  f("halwa_suji", "Suji / Sheera / Rava Kesari Halwa", ["suji halwa", "sheera", "rava kesari", "kesari bath", "sooji halwa", "halwa", "kesari", "mohanthal", "badam halwa"], "portion", 100, 330, 4.0, "sweet", "pan_indian"),
  f("gajar_halwa", "Gajar Halwa (Carrot Halwa)", ["gajar halwa", "carrot halwa", "gajrela", "doodhi halwa", "lauki halwa", "moong dal halwa"], "portion", 100, 190, 4.0, "sweet", "north"),
  f("kheer", "Kheer / Phirni / Rice Pudding", ["kheer", "phirni", "payesh", "rice pudding", "sheer khurma", "seviyan", "paramannam", "kheer kadam"], "portion", 150, 130, 3.5, "sweet", "pan_indian"),
  f("rabri_malai", "Rabri / Rasmalai / Basundi", ["rabri", "rasmalai", "ras malai", "basundi", "malpua", "kulfi", "falooda", "shrikhand", "amrakhand"], "portion", 100, 220, 6.0, "sweet", "pan_indian"),
  f("ice_cream", "Ice Cream / Kulfi (Generic)", ["ice cream", "gelato"], "portion", 100, 207, 3.5, "sweet", "global"),
  f("jaggery_sugar", "Sugar / Jaggery / Gur / Bellam / Vellam", ["sugar", "jaggery", "gur", "bellam", "vellam", "shakkar", "misri", "honey", "gud"], "portion", 10, 390, 0.0, "sugar", "pan_indian"),

  // ═══════════════ FRUITS (COMMON INDIAN) ═══════════════
  f("banana", "Banana (Medium)", ["banana", "bananas", "kela", "vazhaipazham", "nendran banana", "raw banana"], "piece", 118, 89, 1.1, "fruit", "pan_indian"),
  f("mango", "Mango / Aam (Ripe)", ["mango", "aam", "alphonso", "hapus", "mangoes", "kesar mango", "mamidi", "maambazham"], "portion", 150, 60, 0.8, "fruit", "pan_indian"),
  f("papaya", "Papaya", ["papaya", "papita", "pappali", "parangi"], "portion", 150, 43, 0.5, "fruit", "pan_indian"),
  f("guava", "Guava / Amrood", ["guava", "amrood", "peru", "jaam", "koyya"], "piece", 100, 68, 2.6, "fruit", "pan_indian"),
  f("apple_orange", "Apple / Orange / Mosambi / Pear", ["apple", "orange", "mosambi", "pear", "santra", "sweet lime", "pomegranate", "anar", "watermelon", "tarbooz", "muskmelon", "grapes", "pineapple", "chikoo", "sapota", "jackfruit ripe", "custard apple", "sitaphal", "lychee", "jamun", "ber"], "portion", 150, 55, 0.8, "fruit", "pan_indian"),
  f("coconut_fresh", "Fresh Coconut / Nariyal", ["coconut", "fresh coconut", "nariyal", "kobbari", "thengai", "narkel", "khobra"], "weight", 30, 354, 3.3, "nuts", "pan_indian"),

  // ═══════════════ CONDIMENTS ═══════════════
  f("green_chutney", "Green / Mint / Coriander Chutney", ["green chutney", "mint chutney", "pudina chutney", "dhania chutney", "tamarind chutney", "imli chutney", "tomato chutney", "peanut chutney", "dry garlic chutney", "chutney powder", "podi", "gunpowder"], "portion", 20, 80, 2.5, "condiment", "pan_indian"),
  f("pickle", "Pickle / Achar / Thokku", ["pickle", "achar", "achaar", "avakaya", "uppinakayi", "lonche", "thokku", "lime pickle", "mango pickle"], "portion", 10, 200, 1.5, "condiment", "pan_indian"),
]);

/**
 * Regional metadata (useful for UI filters / LLM prompt hints).
 */
export const REGION_LABELS = {
  pan_indian: "Pan-India",
  north: "North India (Punjab, Haryana, Delhi, UP, Uttarakhand, HP)",
  south: "South India (Tamil Nadu, Kerala, Karnataka, Andhra, Telangana)",
  east: "East India (West Bengal, Odisha, Bihar, Jharkhand)",
  west: "West India (Maharashtra, Gujarat, Rajasthan)",
  central: "Central India (MP, Chhattisgarh)",
  northeast: "North-East India (Assam, Manipur, Nagaland, Meghalaya, Sikkim, etc.)",
  kashmir: "Jammu, Kashmir & Ladakh",
  goa_konkan: "Goa & Konkan Coast",
  global: "Global / Common",
};

/**
 * Standard ambiguous portion conversions (Indian household context).
 * Values are grams (or ml ≈ g) per unit.
 */
export const STANDARD_PORTION_CONVERSIONS = {
  // Countable
  piece: 1, pieces: 1, pc: 1, pcs: 1, nos: 1, no: 1, slice: 1, slices: 1,
  roti: 1, rotis: 1, chapati: 1, chapatis: 1, puri: 1, puris: 1,

  // Weights
  g: 1, gm: 1, gms: 1, gram: 1, grams: 1, kg: 1000, mg: 0.001,
  oz: 28.35, lb: 453.6,

  // Volumes
  ml: 1, l: 1000, litre: 1000, liter: 1000,

  // Household containers
  bowl: 150, bowls: 150,
  katori: 150, katoris: 150, vati: 150, vatti: 150, vaati: 150,
  small_bowl: 100, large_bowl: 250,
  cup: 200, cups: 200,
  glass: 250, glasses: 250,
  chai_cup: 150, kulhad: 150,
  steel_glass: 200,
  plate: 300, plates: 300, thali: 600, thalis: 600,
  half_plate: 150, quarter_plate: 75, full_plate: 300,
  half_bowl: 75,
  ladle: 60, ladles: 60, kadchi: 60, karchi: 60, gharat: 60,
  handful: 28, handfuls: 28, mutthi: 28, mushti: 28,
  pinch: 0.5,
  tbsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  scoop: 30, scoops: 30,
};

// ─── Lookup Index (built once at module load) ───

const ALIAS_INDEX = new Map();
for (const [key, entry] of Object.entries(NUTRITION_DATABASE)) {
  entry.key = key;
  const names = [...entry.aliases, entry.name];
  for (const alias of names) {
    const a = alias.toLowerCase().trim();
    if (!ALIAS_INDEX.has(a)) ALIAS_INDEX.set(a, entry);
    else if (process.env.NODE_ENV !== "production" && ALIAS_INDEX.get(a) !== entry) {
      console.warn(`[nutritionDatabase] duplicate alias "${a}" in "${key}" (kept "${ALIAS_INDEX.get(a).key}")`);
    }
  }
}

// Longest aliases first, so "chicken biryani" beats "chicken" and "curd rice" beats "curd".
const SORTED_ALIASES = [...ALIAS_INDEX.keys()]
  .sort((a, b) => b.length - a.length)
  .map((alias) => ({
    alias,
    entry: ALIAS_INDEX.get(alias),
    // Whole-word match so "egg" does not match "eggplant" and "rice" does not match "price"
    regex: new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`),
  }));

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[()\[\],.;:!?"']/g, " ")
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds the best database entry for free text like "2 small katori chicken biryani".
 * Order: key -> exact alias -> singular form -> whole-word longest-alias match.
 */
export function findNutritionDatabaseEntry(keyOrText) {
  if (!keyOrText || typeof keyOrText !== "string") return null;
  const normalized = normalize(keyOrText);
  if (!normalized) return null;

  const cleanKey = normalized.replace(/\s+/g, "_");
  if (NUTRITION_DATABASE[cleanKey]) return NUTRITION_DATABASE[cleanKey];

  if (ALIAS_INDEX.has(normalized)) return ALIAS_INDEX.get(normalized);

  // naive plural handling: "dosas" -> "dosa", "pakoras" -> "pakora"
  if (normalized.endsWith("s") && ALIAS_INDEX.has(normalized.slice(0, -1))) {
    return ALIAS_INDEX.get(normalized.slice(0, -1));
  }

  for (const { regex, entry } of SORTED_ALIASES) {
    if (regex.test(normalized)) return entry;
  }
  return null;
}

/** All entries of a region (or pan_indian + global if region omitted). */
export function getEntriesByRegion(region) {
  return Object.values(NUTRITION_DATABASE).filter((e) => !region || e.region === region);
}

/** All entries by diet: "veg" | "egg" | "nonveg". */
export function getEntriesByDiet(diet) {
  return Object.values(NUTRITION_DATABASE).filter((e) => e.diet === diet);
}

/**
 * Deterministic nutrition calculation.
 *
 * @param {string} food       e.g. "chicken biryani", "ragi mudde"
 * @param {number} quantity   e.g. 2
 * @param {string} unit       e.g. "piece", "katori", "g", "plate"
 * @returns {{matched:boolean, name?:string, grams?:number, calories?:number, protein?:number, note?:string}}
 */
export function calculateNutrition(food, quantity = 1, unit = "piece") {
  const entry = findNutritionDatabaseEntry(food);
  if (!entry) return { matched: false, note: `No database entry for "${food}"` };

  const u = String(unit || "piece").toLowerCase().trim().replace(/\s+/g, "_");
  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const conv = STANDARD_PORTION_CONVERSIONS[u];
  const isCountUnit = ["piece", "pieces", "pc", "pcs", "nos", "no", "slice", "slices", "roti", "rotis", "chapati", "chapatis", "puri", "puris"].includes(u);

  let calories;
  let protein;
  let grams;

  if (entry.servingType === "piece" && (isCountUnit || conv === undefined)) {
    // Countable item: use per-unit values directly
    calories = entry.caloriesPerUnit * qty;
    protein = entry.proteinPerUnit * qty;
    grams = (entry.isBoneIn ? entry.edibleGramsPerUnit : entry.defaultGrams) * qty;
  } else if (["g", "gm", "gms", "gram", "grams", "kg", "mg", "oz", "lb", "ml", "l", "litre", "liter"].includes(u)) {
    // Explicit weight: scale by per-100g values
    grams = qty * conv;
    if (entry.isBoneIn && entry.edibleGramsPerUnit) {
      grams *= entry.edibleGramsPerUnit / entry.defaultGrams; // total weight -> edible weight
    }
    calories = (entry.caloriesPer100g * grams) / 100;
    protein = (entry.proteinPer100g * grams) / 100;
  } else if (entry.servingType !== "piece" && conv !== undefined && !isCountUnit) {
    // Household container (bowl, katori, glass, plate, tbsp, handful...)
    grams = qty * conv;
    calories = (entry.caloriesPer100g * grams) / 100;
    protein = (entry.proteinPer100g * grams) / 100;
  } else {
    // Piece-type item with a container unit (e.g. "1 plate idli"): fall back to default servings
    calories = entry.caloriesPerUnit * qty;
    protein = entry.proteinPerUnit * qty;
    grams = entry.defaultGrams * qty;
  }

  return {
    matched: true,
    name: entry.name,
    region: entry.region,
    diet: entry.diet,
    grams: Math.round(grams),
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
  };
}