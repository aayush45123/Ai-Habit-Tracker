// server/src/services/nutritionEngine.js
import {
  NUTRITION_DATABASE,
  STANDARD_PORTION_CONVERSIONS,
  findNutritionDatabaseEntry,
  calculateNutrition,
} from "./nutritionDatabase.js";

/**
 * Builds the Groq system prompt for food PARSING only.
 * Groq's ONLY job: identify items, quantities, units, preparation.
 * Backend calculates ALL nutrition from the verified database.
 * Groq must NEVER invent calorie/protein numbers.
 */
export function buildNutritionGroqPrompt(userMemoryContext = "") {
  const examples = `
Input: "10 ragda puri"
{"items":[{"name":"ragda puri","canonical_key":"ragda_puri","quantity":10,"unit":"piece","preparation":"fried","is_fried":true,"is_bone_in":false,"confidence":"high"}],"assumptions":["10 pieces ragda puri as stated"],"confidence":"high"}

Input: "chicken gravy with 4 chapati and 50 grams rice"
{"items":[{"name":"chicken gravy","canonical_key":"chicken_gravy","quantity":1,"unit":"bowl","preparation":"curry","is_fried":false,"is_bone_in":false,"confidence":"high"},{"name":"chapati","canonical_key":"chapati","quantity":4,"unit":"piece","preparation":"plain","is_fried":false,"is_bone_in":false,"confidence":"high"},{"name":"cooked rice","canonical_key":"rice_cooked","quantity":50,"unit":"g","preparation":"boiled","is_fried":false,"is_bone_in":false,"confidence":"high"}],"assumptions":["chicken gravy only=sauce, no explicit chicken pieces","4 standard chapatis","50g cooked rice"],"confidence":"high"}

Input: "fried chicken leg and one fried liver"
{"items":[{"name":"fried chicken leg","canonical_key":"chicken_fried","quantity":1,"unit":"piece","preparation":"fried","is_fried":true,"is_bone_in":true,"confidence":"high"},{"name":"fried liver","canonical_key":"chicken_liver_fried","quantity":1,"unit":"piece","preparation":"fried","is_fried":true,"is_bone_in":false,"confidence":"high"}],"assumptions":["fried chicken leg=chicken_fried entry","fried liver=chicken_liver_fried entry"],"confidence":"high"}

Input: "handful of roasted chana and peanuts"
{"items":[{"name":"roasted chana","canonical_key":"roasted_chana","quantity":1,"unit":"handful","preparation":"roasted","is_fried":false,"is_bone_in":false,"confidence":"high"},{"name":"peanuts","canonical_key":"peanuts","quantity":1,"unit":"handful","preparation":"roasted","is_fried":false,"is_bone_in":false,"confidence":"high"}],"assumptions":["1 handful each, ~28g each"],"confidence":"high"}

Input: "4 small boned chicken pieces"
{"items":[{"name":"small bone-in chicken pieces","canonical_key":"chicken_bone_in_piece","quantity":4,"unit":"piece","preparation":"curry","is_fried":false,"is_bone_in":true,"confidence":"high"}],"assumptions":["4 small bone-in pieces"],"confidence":"high"}

Input: "chicken gravy (4 pieces of small boned chicken) with 4 chapati"
{"items":[{"name":"chicken gravy sauce","canonical_key":"chicken_gravy","quantity":1,"unit":"bowl","preparation":"curry","is_fried":false,"is_bone_in":false,"confidence":"high"},{"name":"small bone-in chicken pieces","canonical_key":"chicken_bone_in_piece","quantity":4,"unit":"piece","preparation":"curry","is_fried":false,"is_bone_in":true,"confidence":"high"},{"name":"chapati","canonical_key":"chapati","quantity":4,"unit":"piece","preparation":"plain","is_fried":false,"is_bone_in":false,"confidence":"high"}],"assumptions":["gravy + 4 explicit bone-in pieces + 4 chapatis"],"confidence":"high"}`;

  const userCtx = userMemoryContext
    ? `\nUSER CALIBRATIONS (highest priority):\n${userMemoryContext}\n`
    : "";

  return `You are an elite food-parsing AI specialized in Indian, Asian, and international cuisines.
Your ONLY job is to identify every food item, quantity, unit, and preparation method.
Do NOT invent calorie or protein values — the backend calculates nutrition from a verified database.

MANDATORY PARSING RULES:

1. EXTRACT EVERY FOOD ITEM SEPARATELY:
   - "chicken gravy with 4 chapati and 50g rice" -> chicken_gravy + chapati(qty:4) + rice_cooked(qty:50,unit:g)
   - "fried chicken leg and one fried liver" -> chicken_fried(qty:1) + chicken_liver_fried(qty:1)
   - "handful of roasted chana and peanuts" -> roasted_chana(qty:1,unit:handful) + peanuts(qty:1,unit:handful)
   - "10 ragda puri" -> ragda_puri(qty:10,unit:piece) -- NEVER use plate or portion for this

2. CANONICAL KEYS (use EXACTLY as listed):
   ragda_puri           -> ragda puri (unit MUST be piece)
   chicken_bone_in_piece -> small boned chicken, bone-in chicken pieces
   chicken_leg          -> chicken leg, drumstick
   chicken_fried        -> fried chicken, chicken 65, fried chicken leg
   chicken_gravy        -> chicken gravy, chicken curry (sauce only)
   chicken_liver        -> chicken liver, liver, kaleji
   chicken_liver_fried  -> fried liver, liver fry, kaleji fry
   chicken_boneless     -> boneless chicken, plain curry chicken
   chicken_breast       -> chicken breast, grilled chicken
   butter_chicken       -> butter chicken, murgh makhani (do NOT split)
   chicken_biryani      -> chicken biryani (do NOT split into rice+chicken+gravy)
   chapati              -> chapati, roti, phulka
   rice_cooked          -> rice, cooked rice, chawal (default)
   egg_boiled           -> boiled egg, egg
   egg_fried            -> fried egg, omelet, egg bhurji
   roasted_chana        -> roasted chana, bhuna chana
   peanuts              -> peanuts, groundnuts, mungfali

3. NO DOUBLE-COUNTING:
   - "chicken biryani" -> chicken_biryani ONLY
   - "butter chicken" -> butter_chicken ONLY
   - "chicken gravy" alone -> chicken_gravy ONLY (no auto chicken pieces)
   - "chicken gravy with 4 small boned chicken" -> chicken_gravy + chicken_bone_in_piece(qty:4)

4. PRESERVE ALL QUANTITIES:
   - "10 ragda puri" -> qty:10, unit:"piece"
   - "4 chapati" -> qty:4, unit:"piece"
   - "50 grams rice" -> qty:50, unit:"g"
   - "one fried liver" -> qty:1
   - "handful" -> qty:1, unit:"handful"
   - Word numbers: one=1, two=2, three=3, four=4, five=5

FEW-SHOT EXAMPLES:
${examples}
${userCtx}
RESPONSE FORMAT: Return ONLY valid JSON, no markdown, no explanation.
{"items":[{"name":string,"canonical_key":string,"quantity":number,"unit":string,"preparation":string,"is_fried":boolean,"is_bone_in":boolean,"confidence":"high"|"medium"|"low"}],"assumptions":[string],"confidence":"high"|"medium"|"low"}`;
}

// ─── Word-number map ──────────────────────────────────────────────────────────

const WORD_NUMBERS = {
  half: 0.5, "a half": 0.5, one: 1, a: 1, an: 1, two: 2, three: 3,
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
};

// ─── DB Entry Resolution ──────────────────────────────────────────────────────

/**
 * Resolve a parsed item's canonical_key or name to a NUTRITION_DATABASE entry.
 * Priority:
 *   1. Exact DB key from canonical_key
 *   2. Alias lookup on canonical_key
 *   3. Alias lookup on raw name
 *   4. Contextual inference from name + preparation flags
 */
function resolveDbEntry(canonicalKey, rawName, isFried, isBoneIn) {
  // 1. Direct key match (fastest, most specific)
  const ck = String(canonicalKey || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (ck && NUTRITION_DATABASE[ck]) return NUTRITION_DATABASE[ck];

  // 2. Alias lookup on canonical_key
  if (ck) {
    const byKey = findNutritionDatabaseEntry(ck);
    if (byKey) return byKey;
  }

  // 3. Alias lookup on raw name
  const name = String(rawName || "").trim();
  if (name) {
    const byName = findNutritionDatabaseEntry(name);
    if (byName) return byName;
  }

  // 4. Contextual inference
  const nl = name.toLowerCase();

  if (nl.includes("ragda") && nl.includes("puri")) return NUTRITION_DATABASE.ragda_puri;

  if (nl.includes("chicken") || nl.includes("murgh")) {
    if (nl.includes("biryani")) return NUTRITION_DATABASE.chicken_biryani;
    if (nl.includes("butter") || nl.includes("makhani")) return NUTRITION_DATABASE.butter_chicken;
    if (nl.includes("chettinad") || nl.includes("andhra") || nl.includes("sukka")) return NUTRITION_DATABASE.chicken_chettinad;
    if (isFried || nl.includes("fried") || nl.includes("65") || nl.includes("lollipop") || nl.includes("pakora")) return NUTRITION_DATABASE.chicken_fried;
    if (nl.includes("liver")) return (isFried || nl.includes("fried") || nl.includes("fry")) ? NUTRITION_DATABASE.chicken_liver_fried : NUTRITION_DATABASE.chicken_liver;
    if (nl.includes("gravy") || nl.includes("curry") || nl.includes("masala")) return NUTRITION_DATABASE.chicken_gravy;
    if (isBoneIn || nl.includes("bone") || nl.includes("drumstick") || nl.includes("leg")) return NUTRITION_DATABASE.chicken_leg;
    if (nl.includes("small") || nl.includes("boned") || nl.includes("pieces")) return NUTRITION_DATABASE.chicken_bone_in_piece;
    if (nl.includes("breast")) return NUTRITION_DATABASE.chicken_breast;
    return NUTRITION_DATABASE.chicken_boneless;
  }

  if (nl.includes("liver") || nl.includes("kaleji")) {
    return (isFried || nl.includes("fried") || nl.includes("fry")) ? NUTRITION_DATABASE.chicken_liver_fried : NUTRITION_DATABASE.chicken_liver;
  }

  if (nl.includes("chapati") || nl.includes("roti") || nl.includes("phulka")) return NUTRITION_DATABASE.chapati;

  if (nl.includes("egg") || nl.includes("anda") || nl.includes("muttai")) {
    return (isFried || nl.includes("fried") || nl.includes("omelet") || nl.includes("bhurji")) ? NUTRITION_DATABASE.egg_fried : NUTRITION_DATABASE.egg_boiled;
  }

  if (nl.includes("rice") || nl.includes("chawal")) {
    return (nl.includes("raw") || nl.includes("uncooked")) ? NUTRITION_DATABASE.rice_raw : NUTRITION_DATABASE.rice_cooked;
  }

  if ((nl.includes("roasted") || nl.includes("bhuna")) && nl.includes("chana")) return NUTRITION_DATABASE.roasted_chana;

  if (nl.includes("peanut") || nl.includes("groundnut") || nl.includes("mungfali")) return NUTRITION_DATABASE.peanuts;

  return null;
}

// ─── Single-item nutrition calculator ────────────────────────────────────────

/**
 * Calculate one item using the DB's calculateNutrition() as primary path.
 * Groq's own calorie/protein numbers are completely ignored.
 */
function calcItemNutrition(dbEntry, quantity, unit, isFried, isBoneIn, edibleGrams, assumptions) {
  // For 'portion' serving type, bowl/katori should use caloriesPerUnit (the canonical serving),
  // not the weight-based calculation that calculateNutrition does when given bowl unit.
  const u = unit.toLowerCase().trim();
  const isBowlUnit = ["bowl","bowls","katori","katoris","vati","vatti"].includes(u);
  if (dbEntry.servingType === "portion" && isBowlUnit && dbEntry.caloriesPerUnit) {
    const calories = Math.max(5, Math.round(quantity * dbEntry.caloriesPerUnit));
    const protein  = Math.max(0, Math.round(quantity * dbEntry.proteinPerUnit * 10) / 10);
    const grams    = quantity * (dbEntry.defaultGrams || 150);
    if (isFried && !dbEntry.isFried) {
      const extra = Math.round(50 * quantity);
      assumptions.push(`Added frying oil (+${extra} kcal) for ${dbEntry.name}`);
      return { calories: Math.max(5, Math.round(calories + extra)), protein, grams: Math.round(grams), displayUnit: u };
    }
    return { calories, protein, grams: Math.round(grams), displayUnit: u };
  }

  // Use authoritative DB calculator
  const calc = calculateNutrition(dbEntry.key || "", quantity, unit);
  let calories = calc.matched ? calc.calories : 0;
  let protein  = calc.matched ? calc.protein  : 0;
  let grams    = calc.matched ? calc.grams    : quantity * (dbEntry.defaultGrams || 100);

  if (!calc.matched) {
    // Fallback inline calculation for edge-case units
    const u = unit.toLowerCase().trim();
    const conv = STANDARD_PORTION_CONVERSIONS[u];
    if (u.startsWith("g") || u === "gm" || u === "gram" || u === "grams") {
      grams = quantity;
      calories = (grams / 100) * dbEntry.caloriesPer100g;
      protein  = (grams / 100) * dbEntry.proteinPer100g;
    } else if (u === "kg") {
      grams = quantity * 1000;
      calories = (grams / 100) * dbEntry.caloriesPer100g;
      protein  = (grams / 100) * dbEntry.proteinPer100g;
    } else if (u === "handful" || u === "handfuls") {
      grams    = quantity * (STANDARD_PORTION_CONVERSIONS.handful || 28);
      calories = (grams / 100) * dbEntry.caloriesPer100g;
      protein  = (grams / 100) * dbEntry.proteinPer100g;
    } else if (conv !== undefined && !["piece","pieces","pc","pcs"].includes(u)) {
      grams    = quantity * conv;
      calories = (grams / 100) * dbEntry.caloriesPer100g;
      protein  = (grams / 100) * dbEntry.proteinPer100g;
    } else if (dbEntry.servingType === "piece" || dbEntry.caloriesPerUnit) {
      calories = quantity * (dbEntry.caloriesPerUnit || 0);
      protein  = quantity * (dbEntry.proteinPerUnit  || 0);
      grams    = quantity * (dbEntry.defaultGrams    || 50);
    } else {
      grams    = quantity * (dbEntry.defaultGrams || 100);
      calories = (grams / 100) * dbEntry.caloriesPer100g;
      protein  = (grams / 100) * dbEntry.proteinPer100g;
    }
  }

  // Bone-in override: use explicit edible grams if provided by Groq
  if ((isBoneIn || dbEntry.isBoneIn) && edibleGrams && edibleGrams > 0) {
    calories = (edibleGrams / 100) * dbEntry.caloriesPer100g;
    protein  = (edibleGrams / 100) * dbEntry.proteinPer100g;
    grams    = edibleGrams;
  }

  // Frying oil surcharge if base DB entry is not already fried
  if (isFried && !dbEntry.isFried) {
    const extra = Math.round(50 * quantity);
    calories += extra;
    assumptions.push(`Added frying oil (+${extra} kcal) for ${dbEntry.name}`);
  }

  const displayUnit = (unit === "handful" || unit === "handfuls") ? "handful" : unit;
  return {
    calories: Math.max(5,  Math.round(calories)),
    protein:  Math.max(0,  Math.round(protein * 10) / 10),
    grams:    Math.round(grams || 0),
    displayUnit,
  };
}

// ─── Deterministic Nutrition Calculator ──────────────────────────────────────

/**
 * calculateNutritionDeterministic
 *
 * Takes parsed items from Groq (or fallback heuristic).
 * Resolves each item to a DB entry, then computes nutrition from the DB.
 * Groq calorie/protein numbers are completely ignored.
 */
export function calculateNutritionDeterministic({
  parsedItems = [],
  assumptions = [],
  rawQuery = "",
  userMemoryMap = new Map(),
}) {
  const calculatedItems = [];
  let totalCalories = 0;
  let totalProtein  = 0;
  const recordedAssumptions = Array.isArray(assumptions) ? [...assumptions] : [];

  for (const item of parsedItems) {
    if (!item) continue;

    const rawName      = String(item.name || item.foodName || "").trim();
    const canonicalKey = String(item.canonical_key || "").trim();
    let   quantity     = Number(item.quantity);
    if (isNaN(quantity) || quantity <= 0) quantity = 1;

    let  unit       = String(item.unit || "piece").toLowerCase().trim();
    const edibleGrams = item.edible_grams ? Number(item.edible_grams) : null;
    const isFried   = Boolean(item.is_fried || item.preparation === "fried" || item.preparation === "deep_fried");
    const isBoneIn  = Boolean(item.is_bone_in || item.isBoneIn);

    // 1. Resolve DB entry (canonical_key first)
    const dbEntry = resolveDbEntry(canonicalKey, rawName, isFried, isBoneIn);

    let itemCalories, itemProtein, estimatedGrams;

    if (dbEntry) {
      // 2. Calculate via DB — Groq's own calorie numbers are ignored
      const r = calcItemNutrition(dbEntry, quantity, unit, isFried, isBoneIn, edibleGrams, recordedAssumptions);
      itemCalories   = r.calories;
      itemProtein    = r.protein;
      estimatedGrams = r.grams;
      unit           = r.displayUnit;

      // 3. User memory override (highest priority)
      const memKey = rawName.toLowerCase().trim();
      if (userMemoryMap.has(memKey)) {
        const t = userMemoryMap.get(memKey);
        if (t && typeof t.calories === "number") {
          itemCalories = t.calories;
          itemProtein  = t.protein || itemProtein;
          recordedAssumptions.push(`Used your personal calibration for "${rawName}"`);
        }
      }
    } else {
      // 4. Unrecognized food — conservative estimate
      const estG = (item.estimated_grams && Number(item.estimated_grams) > 0) ? Number(item.estimated_grams) : null;
      if (estG) {
        itemCalories   = Math.round(estG * 1.5);
        itemProtein    = Math.round(estG * 0.06 * 10) / 10;
        estimatedGrams = estG;
      } else {
        itemCalories   = 150 * quantity;
        itemProtein    = 5   * quantity;
        estimatedGrams = null;
      }
      recordedAssumptions.push(`Estimated generic portion for "${rawName}" — no database entry found`);
    }

    const finalCal  = Math.max(5, Math.round(itemCalories));
    const finalProt = Math.max(0, Math.round(itemProtein * 10) / 10);
    totalCalories += finalCal;
    totalProtein  += finalProt;

    // 5. Build display name
    let displayName = rawName;
    if (quantity > 1 && !rawName.match(new RegExp(`\\b${quantity}\\b`))) {
      displayName = unit === "piece" ? `${quantity} ${rawName}` : `${rawName} (${quantity} ${unit})`;
    } else if ((unit === "g" || unit === "gm" || unit === "ml") && !rawName.includes(String(quantity))) {
      displayName = `${rawName} (${quantity}${unit})`;
    } else if (unit === "handful") {
      displayName = `${rawName} (1 handful)`;
    }

    calculatedItems.push({
      foodName:     displayName,
      quantity,
      unit,
      calories:     finalCal,
      protein:      Math.round(finalProt),
      exactProtein: finalProt,
      grams:        estimatedGrams,
      confidence:   item.confidence || "high",
      dbKey:        dbEntry?.key || null,
    });
  }

  // 6. Sanity checks
  return applyNutritionSanityChecks({
    items: calculatedItems,
    totalCalories,
    totalProtein,
    rawQuery,
    recordedAssumptions,
  });
}

// ─── Sanity Checks ───────────────────────────────────────────────────────────

export function applyNutritionSanityChecks({ items, totalCalories, totalProtein, rawQuery = "", recordedAssumptions = [] }) {
  const q = rawQuery.toLowerCase();

  // Rule 1: Chapatis — min 80 kcal + 2.8g protein each
  const chapatiM = q.match(/\b(\d+)\s*(chapati|chapatis|roti|rotis|phulka|phulkas)\b/i);
  if (chapatiM) {
    const n = parseInt(chapatiM[1], 10);
    const minC = n * 80, minP = n * 2.8;
    const its = items.filter(it => /chapati|roti|phulka/i.test(it.foodName));
    const curC = its.reduce((s, it) => s + it.calories, 0);
    if (curC < minC && its.length) {
      its[0].calories = Math.max(its[0].calories, minC);
      its[0].protein  = Math.max(its[0].protein,  Math.round(minP));
      recordedAssumptions.push(`Calibrated ${n} chapatis to minimum (${minC} kcal)`);
    }
  }

  // Rule 2: Boiled eggs — min 70 kcal + 6g protein each
  const eggM = q.match(/\b(\d+)\s*(boiled\s*egg|egg|eggs)\b/i);
  if (eggM) {
    const n = parseInt(eggM[1], 10);
    const its = items.filter(it => /egg/i.test(it.foodName));
    if (its.length) {
      its[0].calories = Math.max(its[0].calories, n * 70);
      its[0].protein  = Math.max(its[0].protein,  Math.round(n * 6));
    }
  }

  // Rule 3: Plain puris — min 80 kcal each (NOT ragda puri — DB value is 52 kcal/piece, keep it)
  if (!/ragda/i.test(q)) {
    const puriM = q.match(/\b(\d+)\s*(puri|puris|poori|pooris)\b/i);
    if (puriM) {
      const n = parseInt(puriM[1], 10);
      const minC = n * 80;
      const its = items.filter(it => /\bpuri|\bpoori/i.test(it.foodName) && !/ragda/i.test(it.foodName));
      const curC = its.reduce((s, it) => s + it.calories, 0);
      if (curC < minC && its.length) {
        its[0].calories = Math.max(its[0].calories, minC);
        recordedAssumptions.push(`Calibrated ${n} puris to minimum (${minC} kcal)`);
      }
    }
  }

  // Rule 4: Chicken protein — ensure at least 15g when chicken is present
  if (/chicken|murgh|drumstick/i.test(q)) {
    const its = items.filter(it => /chicken|murgh|drumstick/i.test(it.foodName));
    const curP = its.reduce((s, it) => s + it.protein, 0);
    if (curP < 15 && its.length) {
      its[0].protein = Math.round(its[0].protein + (18 - curP));
      recordedAssumptions.push(`Adjusted chicken protein to realistic minimum (~18g)`);
    }
  }

  // Rule 5: Ragda puri quantity sanity — enforce DB value of 52 kcal/piece
  const ragdaM = q.match(/\b(\d+)\s*ragda\s*puri/i);
  if (ragdaM) {
    const n = parseInt(ragdaM[1], 10);
    const expected = n * 52;
    const its = items.filter(it => /ragda/i.test(it.foodName));
    if (its.length && its[0].calories < expected * 0.8) {
      its[0].calories = expected;
      its[0].protein  = Math.round(n * 1.4);
      recordedAssumptions.push(`Calibrated ${n} ragda puris to ${expected} kcal (${n} x 52 kcal/piece)`);
    }
  }

  // Re-sum after adjustments
  const cal  = items.reduce((s, it) => s + (it.calories || 0), 0);
  const prot = items.reduce((s, it) => s + (it.protein  || 0), 0);
  return {
    calories:    Math.max(10, Math.round(cal)),
    protein:     Math.max(0,  Math.round(prot)),
    items,
    assumptions: Array.from(new Set(recordedAssumptions)),
  };
}

// ─── Heuristic Splitter ───────────────────────────────────────────────────────

function parseWordQty(text) {
  for (const [w, v] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${w}\\b`, "i").test(text)) return v;
  }
  return null;
}

function splitMealText(text) {
  const parts = text
    .split(/[,;+\n]|\s+and\s+|\s+&\s+|\s+with\s+/i)
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text.trim()];
}

function parseSegment(segment) {
  const text = segment.toLowerCase().trim();
  let quantity = 1, unit = "piece", estimatedGrams = null;

  // Bracket quantity: "(200g)", "(4 pieces)"
  const bm = text.match(/\(([0-9.]+)\s*(g|gm|gram|grams|kg|ml|piece|pieces|bowl|bowls|cup|cups|plate|plates|handful|handfuls)?\)/i);
  if (bm) {
    const val = parseFloat(bm[1]), u = (bm[2] || "").toLowerCase();
    if (!isNaN(val) && val > 0) {
      if (u.startsWith("g") || u === "gm" || u === "gram" || u === "grams") { quantity = val; unit = "g"; estimatedGrams = val; }
      else if (u === "kg") { quantity = val * 1000; unit = "g"; estimatedGrams = val * 1000; }
      else { quantity = val; unit = u || "piece"; }
    }
  } else {
    // Prefix number + unit: "4 chapati", "50g rice", "10 ragda puri"
    const nm = text.match(/^([0-9.]+)\s*(g|gm|gram|grams|kg|ml|piece|pieces|bowl|bowls|cup|cups|plate|plates|handful|handfuls|scoops?)?\s/i);
    if (nm) {
      const val = parseFloat(nm[1]), u = (nm[2] || "").toLowerCase();
      if (!isNaN(val) && val > 0) {
        if (u.startsWith("g") || u === "gm" || u === "gram" || u === "grams") { quantity = val; unit = "g"; estimatedGrams = val; }
        else if (u === "kg") { quantity = val * 1000; unit = "g"; estimatedGrams = val * 1000; }
        else { quantity = val; unit = u || "piece"; }
      }
    } else {
      // Inline Xg: "50grams"
      const ig = text.match(/\b([0-9.]+)\s*(g|gm|gram|grams|kg)\b/i);
      if (ig) {
        const val = parseFloat(ig[1]), u = ig[2].toLowerCase();
        if (!isNaN(val) && val > 0) {
          quantity = val;
          unit = "g";
          estimatedGrams = u === "kg" ? val * 1000 : val;
        }
      } else {
        const wq = parseWordQty(text);
        if (wq !== null) quantity = wq;
        if (/\bhandful\b/i.test(text)) unit = "handful";
      }
    }
  }

  const isFried  = /fried|deep.?fried|pakora|samosa/i.test(text);
  const isBoneIn = /\bbone\b|small\s*boned|boned|drumstick|leg\s*piece/i.test(text);
  return { quantity, unit, estimatedGrams, isFried, isBoneIn };
}

// ─── Fallback Heuristic Parser ────────────────────────────────────────────────

/**
 * estimateNutritionHeuristic
 *
 * Used when Groq is offline or returns invalid JSON.
 * Parses multi-item text deterministically from the DB.
 */
export function estimateNutritionHeuristic(foodName) {
  if (!foodName || typeof foodName !== "string" || !foodName.trim()) {
    return {
      calories: 250, protein: 10,
      items: [{ foodName: "Unknown Meal", calories: 250, protein: 10, quantity: 1, unit: "piece" }],
      assumptions: ["Default generic serving used"], confidence: "low",
    };
  }

  const trimmed = foodName.trim();
  // Detect "handful of X and Y" pattern — all split segments should inherit handful unit
  const startsWithHandful = /^\s*(?:a\s+)?handful\s+of\s+/i.test(trimmed);
  const parts   = splitMealText(trimmed);
  const parsedItems = [];
  const assumptions = [];

  for (const part of parts) {
    const text = part.toLowerCase().trim();
    if (!text) continue;

    // Special: ragda puri
    if (/ragda\s*puri/i.test(text)) {
      const cm = text.match(/^(\d+)/);
      const count = cm ? parseInt(cm[1], 10) : 1;
      parsedItems.push({ name: `${count > 1 ? count + " " : ""}ragda puri`, canonical_key: "ragda_puri", quantity: count, unit: "piece", is_fried: true, is_bone_in: false, confidence: "high" });
      continue;
    }

    // Special: "chicken gravy (4 pieces of small boned chicken)" OR "(4 small boned chicken pieces)"
    const cgBoneIn = text.match(
      /chicken\s*(?:gravy|curry).*?\((\d+)\s+(?:pieces?\s+of\s+)?(?:small\s+)?(?:boned?|bone)/i
    ) || text.match(
      /chicken\s*(?:gravy|curry).*?\((\d+)\s*(?:small\s*)?(?:boned?|bone-in)?\s*(?:chicken\s*)?pieces?\)/i
    );
    if (cgBoneIn) {
      const count = parseInt(cgBoneIn[1], 10);
      parsedItems.push({ name: "chicken gravy sauce", canonical_key: "chicken_gravy", quantity: 1, unit: "bowl", is_fried: false, is_bone_in: false, confidence: "high" });
      parsedItems.push({ name: `${count} small bone-in chicken pieces`, canonical_key: "chicken_bone_in_piece", quantity: count, unit: "piece", is_fried: false, is_bone_in: true, confidence: "high" });
      assumptions.push(`Separated: gravy sauce + ${count} bone-in pieces`);
      continue;
    }

    // Special: plain "chicken gravy" or "chicken curry" alone
    if (/^chicken\s*(gravy|curry)$/i.test(text.trim())) {
      parsedItems.push({ name: "chicken gravy", canonical_key: "chicken_gravy", quantity: 1, unit: "bowl", is_fried: false, is_bone_in: false, confidence: "medium" });
      assumptions.push("chicken gravy alone = sauce only");
      continue;
    }

    // Generic
    let { quantity, unit, estimatedGrams, isFried, isBoneIn } = parseSegment(text);

    // Inherit handful unit if the whole meal started with "handful of X and Y"
    if (startsWithHandful && unit === "piece" && !estimatedGrams) {
      unit = "handful";
    }

    parsedItems.push({ name: part, canonical_key: "", quantity, unit, estimated_grams: estimatedGrams, is_fried: isFried, is_bone_in: isBoneIn, confidence: "medium" });
  }

  const result = calculateNutritionDeterministic({ parsedItems, assumptions, rawQuery: foodName });
  return { ...result, confidence: "medium", isHeuristicFallback: true };
}
