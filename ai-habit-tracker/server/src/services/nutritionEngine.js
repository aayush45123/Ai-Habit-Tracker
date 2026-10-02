// server/src/services/nutritionEngine.js
import {
  NUTRITION_DATABASE,
  STANDARD_PORTION_CONVERSIONS,
  findNutritionDatabaseEntry,
} from "./nutritionDatabase.js";

/**
 * Builds the high-accuracy Groq system prompt for Indian and global meal analysis.
 * Uses structured JSON schema where AI extracts items and portions,
 * and the backend calculates numbers deterministically.
 */
export function buildNutritionGroqPrompt(userMemoryContext = "") {
  return `You are an elite clinical nutritionist and food-portion analysis AI specialized in Indian, Asian, and international cuisines.
Your goal is to parse EVERY food component, portion size, and cooking method from the meal description into structured items.

MANDATORY RULES:
1. EXTRACT EVERY SINGLE FOOD ITEM SEPARATELY:
   - If the meal mentions chicken, gravy, chapati, and rice, you MUST output an item for EACH of them. Never output only one item.
   - Never skip carbohydrates, sides, or small portions (e.g. "50g rice" MUST be an item).
   - "4 chapati" -> quantity: 4, unit: "piece". (Never quantity: 1).
   - "10 puri" -> quantity: 10, unit: "piece". (Never quantity: 1).
   - "2 boiled eggs" -> quantity: 2, unit: "piece".
   - "chicken gravy" -> separate into:
     (a) chicken meat (curry portion ~100g or the specified piece count)
     (b) chicken gravy (curry sauce base with cooking oil/spices, 1 bowl)
   - "chicken gravy (4 pieces of small boned chicken)" -> separate into:
     (a) 4 small bone-in chicken pieces (is_bone_in: true, edible_grams: 120)
     (b) chicken gravy sauce (1 bowl)
   - "handful roasted chana and peanuts" -> separate into:
     (a) 1 handful roasted chana (~25g)
     (b) 1 handful peanuts (~28g)
   - "10 ragda puri" -> quantity: 10, unit: "piece", canonical_key: "ragda_puri".
   - "fried chicken leg + small fried liver" -> separate into:
     (a) fried chicken leg (quantity: 1, unit: "piece", is_fried: true, is_bone_in: true)
     (b) fried liver (quantity: 1, unit: "piece" or 50g, is_fried: true)

2. ACCURATE UNITS & PREPARATION:
   - Units: "piece", "g", "bowl", "plate", "handful", "cup", "tbsp".
   - Preparation: "plain", "boiled", "fried", "deep_fried", "curry", "roasted", "grilled".
   - Distinguish COOKED vs UNCOOKED rice. Default to cooked rice.
   - Bone-in meat: bones are not edible, estimate edible_grams as ~65% of piece weight.

3. FEW-SHOT EXAMPLES:

Example 1:
Input: "chicken gravy with 4 chapati and 50g cooked rice"
Output:
{
  "items": [
    {
      "name": "chicken meat in curry",
      "canonical_key": "chicken_boneless",
      "quantity": 100,
      "unit": "g",
      "preparation": "curry",
      "estimated_grams": 100,
      "edible_grams": 100,
      "is_fried": false,
      "is_bone_in": false,
      "confidence": "high"
    },
    {
      "name": "chicken gravy sauce with cooking oil",
      "canonical_key": "chicken_gravy",
      "quantity": 1,
      "unit": "bowl",
      "preparation": "curry",
      "estimated_grams": 120,
      "edible_grams": 120,
      "is_fried": false,
      "is_bone_in": false,
      "confidence": "high"
    },
    {
      "name": "wheat chapati",
      "canonical_key": "chapati",
      "quantity": 4,
      "unit": "piece",
      "preparation": "plain",
      "estimated_grams": 160,
      "edible_grams": 160,
      "is_fried": false,
      "is_bone_in": false,
      "confidence": "high"
    },
    {
      "name": "cooked white rice",
      "canonical_key": "rice_cooked",
      "quantity": 50,
      "unit": "g",
      "preparation": "boiled",
      "estimated_grams": 50,
      "edible_grams": 50,
      "is_fried": false,
      "is_bone_in": false,
      "confidence": "high"
    }
  ],
  "assumptions": [
    "Separated chicken gravy into 100g chicken meat and 1 bowl gravy sauce with cooking oil",
    "4 standard chapatis without ghee (~40g each)",
    "50g weighed cooked white rice"
  ],
  "confidence": "high"
}

Example 2:
Input: "2 boiled eggs"
Output:
{
  "items": [
    {
      "name": "boiled eggs",
      "canonical_key": "egg_boiled",
      "quantity": 2,
      "unit": "piece",
      "preparation": "boiled",
      "estimated_grams": 100,
      "edible_grams": 100,
      "is_fried": false,
      "is_bone_in": false,
      "confidence": "high"
    }
  ],
  "assumptions": ["2 whole large boiled eggs (~50g each)"],
  "confidence": "high"
}

${userMemoryContext ? `4. USER SPECIFIC CALIBRATIONS:\n${userMemoryContext}\n` : ""}

RESPONSE FORMAT:
Return ONLY a valid JSON object matching the schema above. No additional commentary or markdown.`;
}

/**
 * Word to number converter for parsing quantities
 */
const WORD_NUMBERS = {
  half: 0.5,
  "a half": 0.5,
  one: 1,
  a: 1,
  an: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/**
 * Deterministic Nutrition Calculation Engine
 * 
 * Takes parsed items from Groq (or fallback heuristic) and computes
 * accurate item-level and meal-level calories and protein using the
 * verified NUTRITION_DATABASE.
 */
export function calculateNutritionDeterministic({
  parsedItems = [],
  assumptions = [],
  rawQuery = "",
  userMemoryMap = new Map(),
}) {
  const calculatedItems = [];
  let totalCalories = 0;
  let totalProtein = 0;
  const recordedAssumptions = Array.isArray(assumptions) ? [...assumptions] : [];

  for (const item of parsedItems) {
    if (!item) continue;

    const rawName = String(item.name || item.foodName || "").trim();
    const canonicalKey = String(item.canonical_key || "").trim().toLowerCase();
    let quantity = Number(item.quantity);
    if (isNaN(quantity) || quantity <= 0) quantity = 1;

    let unit = String(item.unit || "piece").toLowerCase().trim();
    let estimatedGrams = item.estimated_grams ? Number(item.estimated_grams) : null;
    let edibleGrams = item.edible_grams ? Number(item.edible_grams) : null;
    const isFried = Boolean(item.is_fried || item.preparation === "fried" || item.preparation === "deep_fried");
    const isBoneIn = Boolean(item.is_bone_in || item.isBoneIn);

    // 1. Look up standard entry in database
    let dbEntry = findNutritionDatabaseEntry(canonicalKey) ||
                  findNutritionDatabaseEntry(rawName);

    // Contextual auto-detection if generic
    if (!dbEntry) {
      if (rawName.includes("chapati") || rawName.includes("roti") || rawName.includes("phulka")) {
        dbEntry = NUTRITION_DATABASE.chapati;
      } else if (
        rawName.includes("roasted chana") ||
        rawName.includes("bhuna chana") ||
        canonicalKey.includes("roasted_chana") ||
        (rawName.includes("chana") && rawName.includes("roasted"))
      ) {
        dbEntry = NUTRITION_DATABASE.roasted_chana;
      } else if (rawName.includes("rice") || rawName.includes("chawal")) {
        dbEntry = rawName.includes("raw") ? NUTRITION_DATABASE.rice_raw : NUTRITION_DATABASE.rice_cooked;
      } else if (rawName.includes("egg")) {
        dbEntry = isFried || rawName.includes("fried") || rawName.includes("omelet")
          ? NUTRITION_DATABASE.egg_fried
          : NUTRITION_DATABASE.egg_boiled;
      } else if (rawName.includes("chicken")) {
        if (rawName.includes("gravy") || rawName.includes("curry")) {
          dbEntry = NUTRITION_DATABASE.chicken_gravy;
        } else if (isBoneIn || rawName.includes("bone") || rawName.includes("leg")) {
          dbEntry = NUTRITION_DATABASE.chicken_bone_in_piece;
        } else if (rawName.includes("breast")) {
          dbEntry = NUTRITION_DATABASE.chicken_breast;
        } else {
          dbEntry = NUTRITION_DATABASE.chicken_boneless;
        }
      }
    } else if (
      (rawName.includes("roasted chana") || rawName.includes("bhuna chana") || (rawName.includes("chana") && rawName.includes("roasted"))) &&
      dbEntry !== NUTRITION_DATABASE.roasted_chana
    ) {
      // Overwrite accidental match with cooked/curry chana
      dbEntry = NUTRITION_DATABASE.roasted_chana;
    }

    let itemCalories = 0;
    let itemProtein = 0;

    if (dbEntry) {
      // 2. Unit & Portion Normalization
      if (unit.startsWith("g") || unit === "gm" || unit === "gram" || unit === "grams") {
        const grams = quantity;
        itemCalories = (grams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (grams / 100) * dbEntry.proteinPer100g;
        if (!estimatedGrams) estimatedGrams = grams;
      } else if (unit === "kg") {
        const grams = quantity * 1000;
        itemCalories = (grams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (grams / 100) * dbEntry.proteinPer100g;
        estimatedGrams = grams;
      } else if (unit === "handful" || unit === "handfuls") {
        const gramsPerHandful = (estimatedGrams && estimatedGrams <= 50)
          ? estimatedGrams
          : (dbEntry.defaultGrams && dbEntry.defaultGrams <= 50 ? dbEntry.defaultGrams : 28);
        const totalGrams = (estimatedGrams && estimatedGrams <= 50) ? estimatedGrams : quantity * gramsPerHandful;
        itemCalories = (totalGrams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (totalGrams / 100) * dbEntry.proteinPer100g;
        estimatedGrams = totalGrams;
        recordedAssumptions.push(`Assuming 1 handful of ${dbEntry.name} ≈ ${gramsPerHandful}g`);
      } else if (unit === "bowl" || unit === "bowls" || unit === "katori" || unit === "katoris") {
        const bowlGrams = STANDARD_PORTION_CONVERSIONS.bowl;
        if (dbEntry.caloriesPerUnit && dbEntry.servingType === "portion") {
          itemCalories = quantity * dbEntry.caloriesPerUnit;
          itemProtein = quantity * dbEntry.proteinPerUnit;
        } else {
          const totalGrams = quantity * bowlGrams;
          itemCalories = (totalGrams / 100) * dbEntry.caloriesPer100g;
          itemProtein = (totalGrams / 100) * dbEntry.proteinPer100g;
        }
        estimatedGrams = quantity * bowlGrams;
      } else if (unit === "plate" || unit === "plates") {
        const plateGrams = STANDARD_PORTION_CONVERSIONS.plate;
        const totalGrams = quantity * plateGrams;
        itemCalories = (totalGrams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (totalGrams / 100) * dbEntry.proteinPer100g;
        estimatedGrams = totalGrams;
      } else if (unit === "cup" || unit === "cups" || unit === "glass" || unit === "glasses") {
        const cupGrams = STANDARD_PORTION_CONVERSIONS[unit] || 200;
        const totalGrams = quantity * cupGrams;
        itemCalories = (totalGrams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (totalGrams / 100) * dbEntry.proteinPer100g;
        estimatedGrams = totalGrams;
      } else {
        // Standard count / piece
        if (dbEntry.servingType === "piece" || dbEntry.servingType === "portion") {
          itemCalories = quantity * dbEntry.caloriesPerUnit;
          itemProtein = quantity * dbEntry.proteinPerUnit;
          estimatedGrams = quantity * (dbEntry.defaultGrams || 50);
        } else {
          // Weight-based food entered as pieces (e.g. piece of chicken, handful)
          const pieceGrams = dbEntry.defaultGrams || 100;
          const totalGrams = quantity * pieceGrams;
          itemCalories = (totalGrams / 100) * dbEntry.caloriesPer100g;
          itemProtein = (totalGrams / 100) * dbEntry.proteinPer100g;
          estimatedGrams = totalGrams;
        }
      }

      // 3. Bone-in meat handling
      if ((isBoneIn || dbEntry.isBoneIn) && edibleGrams && edibleGrams > 0) {
        // Recalculate accurately based on edible meat weight
        itemCalories = (edibleGrams / 100) * dbEntry.caloriesPer100g;
        itemProtein = (edibleGrams / 100) * dbEntry.proteinPer100g;
      }

      // 4. Extra frying oil allowance if item is fried but base DB entry is not
      if (isFried && !dbEntry.isFried) {
        const fryingExtraCaloriesPerServing = 60 * quantity;
        itemCalories += fryingExtraCaloriesPerServing;
        recordedAssumptions.push(`Added frying oil contribution (+${fryingExtraCaloriesPerServing} kcal) for ${rawName}`);
      }
    } else {
      // Unrecognized food fallback
      if (estimatedGrams && estimatedGrams > 0) {
        itemCalories = estimatedGrams * 1.5;
        itemProtein = estimatedGrams * 0.06;
      } else {
        itemCalories = 150 * quantity;
        itemProtein = 5 * quantity;
      }
      recordedAssumptions.push(`Estimated standard Indian portion for "${rawName}"`);
    }

    // Check user trained memory override if applicable
    const memoryKey = rawName.toLowerCase().trim();
    if (userMemoryMap.has(memoryKey)) {
      const trained = userMemoryMap.get(memoryKey);
      if (trained && typeof trained.calories === "number") {
        itemCalories = trained.calories;
        itemProtein = trained.protein || itemProtein;
      }
    }

    const finalCal = Math.max(5, Math.round(itemCalories));
    const finalProt = Math.max(0, Math.round(itemProtein * 10) / 10);

    totalCalories += finalCal;
    totalProtein += finalProt;

    // Build user-friendly display name
    let displayName = rawName;
    if (quantity > 1 && !rawName.includes(String(quantity))) {
      if (unit === "piece") {
        displayName = `${quantity} ${rawName}`;
      } else {
        displayName = `${rawName} (${quantity} ${unit})`;
      }
    } else if (unit === "g" || unit === "gm" || unit === "ml") {
      if (!rawName.includes(`${quantity}`)) {
        displayName = `${rawName} (${quantity}${unit})`;
      }
    }

    calculatedItems.push({
      foodName: displayName,
      quantity,
      unit,
      calories: finalCal,
      protein: Math.round(finalProt),
      exactProtein: finalProt,
      grams: estimatedGrams,
      confidence: item.confidence || "high",
    });
  }

  // 5. Run Sanity Checks to guarantee realistic totals
  const validated = applyNutritionSanityChecks({
    items: calculatedItems,
    totalCalories,
    totalProtein,
    rawQuery,
    recordedAssumptions,
  });

  return validated;
}

/**
 * Sanity Check Validation Rules
 * Prevents under-estimations and ensures consistent realistic totals.
 */
export function applyNutritionSanityChecks({
  items,
  totalCalories,
  totalProtein,
  rawQuery = "",
  recordedAssumptions = [],
}) {
  const queryLower = rawQuery.toLowerCase();
  let adjustedCalories = totalCalories;
  let adjustedProtein = totalProtein;

  // Rule 1: Chapatis / Rotis check
  const chapatiMatch = queryLower.match(/\b(\d+)\s*(chapati|chapatis|roti|rotis|phulka|phulkas)\b/i);
  if (chapatiMatch) {
    const chapatiCount = parseInt(chapatiMatch[1], 10);
    const minChapatiCalories = chapatiCount * 80;
    const minChapatiProtein = chapatiCount * 2.8;

    // Check if chapati is represented in items
    const chapatiItems = items.filter((it) =>
      /chapati|roti|phulka/i.test(it.foodName)
    );

    const currentChapatiCal = chapatiItems.reduce((s, it) => s + it.calories, 0);
    if (currentChapatiCal < minChapatiCalories) {
      const diff = minChapatiCalories - currentChapatiCal;
      if (chapatiItems.length > 0) {
        chapatiItems[0].calories += diff;
        chapatiItems[0].protein = Math.max(chapatiItems[0].protein, Math.round(minChapatiProtein));
      }
      recordedAssumptions.push(`Calibrated ${chapatiCount} chapatis to standard baseline (${minChapatiCalories} kcal)`);
    }
  }

  // Rule 2: Boiled eggs check
  const eggMatch = queryLower.match(/\b(\d+)\s*(boiled\s*egg|egg|eggs)\b/i);
  if (eggMatch) {
    const eggCount = parseInt(eggMatch[1], 10);
    const minEggCal = eggCount * 70;
    const minEggProt = eggCount * 6.0;

    const eggItems = items.filter((it) => /egg/i.test(it.foodName));
    const currentEggProt = eggItems.reduce((s, it) => s + it.protein, 0);
    if (currentEggProt < minEggProt && eggItems.length > 0) {
      eggItems[0].protein = Math.round(minEggProt);
      eggItems[0].calories = Math.max(eggItems[0].calories, minEggCal);
    }
  }

  // Rule 3: Puris check (10 puris must be ~800-1000 kcal, never 80 kcal)
  const puriMatch = queryLower.match(/\b(\d+)\s*(puri|puris|poori|pooris)\b/i);
  if (puriMatch) {
    const puriCount = parseInt(puriMatch[1], 10);
    const minPuriCal = puriCount * 85;
    const puriItems = items.filter((it) => /\bpuri|\bpoori/i.test(it.foodName));
    const currentPuriCal = puriItems.reduce((s, it) => s + it.calories, 0);
    if (currentPuriCal < minPuriCal && puriItems.length > 0) {
      puriItems[0].calories = minPuriCal;
    }
  }

  // Rule 4: Chicken meal protein sanity check
  // If chicken pieces or gravy with chicken is present, protein should reflect actual meat content
  const hasChicken = /chicken|murgh|drumstick|leg piece/i.test(queryLower);
  if (hasChicken) {
    const chickenItems = items.filter((it) => /chicken|murgh|drumstick/i.test(it.foodName));
    const currentChickenProt = chickenItems.reduce((s, it) => s + it.protein, 0);

    // If chicken was detected but protein calculated is unrealistically low (e.g. < 15g for chicken dish)
    if (currentChickenProt < 18 && chickenItems.length > 0) {
      const targetProt = 24; // typical single serving chicken has 22-28g protein
      const diff = targetProt - currentChickenProt;
      chickenItems[0].protein += Math.round(diff);
      recordedAssumptions.push(`Adjusted chicken protein to realistic standard portion (~${targetProt}g protein)`);
    }
  }

  // Rule 5: Both chapati and rice check
  const hasChapati = /chapati|roti|phulka/i.test(queryLower);
  const hasRice = /rice|chawal/i.test(queryLower);
  if (hasChapati && hasRice) {
    const foundChapati = items.some((it) => /chapati|roti|phulka/i.test(it.foodName));
    const foundRice = items.some((it) => /rice|chawal/i.test(it.foodName));

    if (!foundRice) {
      items.push({
        foodName: "Cooked Rice (Standard Serving)",
        quantity: 1,
        unit: "bowl",
        calories: 195,
        protein: 4,
        exactProtein: 4.05,
        grams: 150,
        confidence: "medium",
      });
      recordedAssumptions.push("Added detected rice portion to meal breakdown");
    }
  }

  // Re-sum totals strictly from verified items
  adjustedCalories = items.reduce((sum, it) => sum + (it.calories || 0), 0);
  adjustedProtein = items.reduce((sum, it) => sum + (it.protein || 0), 0);

  return {
    calories: Math.max(10, Math.round(adjustedCalories)),
    protein: Math.max(0, Math.round(adjustedProtein)),
    items,
    assumptions: Array.from(new Set(recordedAssumptions)),
  };
}

/**
 * Advanced Multi-Item Fallback Heuristic Parser
 * Used when AI / Groq is offline or unavailable.
 * Parses multi-item text, brackets, numbers, word-numbers, and calculates
 * against NUTRITION_DATABASE deterministically.
 */
export function estimateNutritionHeuristic(foodName) {
  if (!foodName || typeof foodName !== "string" || !foodName.trim()) {
    return {
      calories: 250,
      protein: 10,
      items: [{ foodName: "Unknown Meal", calories: 250, protein: 10, quantity: 1, unit: "piece" }],
      assumptions: ["Default generic serving used"],
      confidence: "low",
    };
  }

  const trimmed = foodName.trim();

  // Split by commas, semicolons, plus signs, newlines, "and", "&", "with"
  const rawParts = trimmed
    .split(/[,;+\n]|\s+and\s+|\s+&\s+|\s+with\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const parts = rawParts.length > 0 ? rawParts : [trimmed];
  const parsedItems = [];
  const assumptions = [];

  for (const part of parts) {
    const text = part.toLowerCase().trim();
    if (!text) continue;

    let quantity = 1;
    let unit = "piece";
    let estimatedGrams = null;

    // 1. Check for brackets e.g. "(200g)", "(4 pieces)", "(50 gm)"
    const bracketMatch = text.match(/\(([\d\.]+)\s*(g|gm|gram|grams|kg|ml|piece|pieces|slice|slices|bowl|bowls|cup|cups|plate|plates|handful|handfuls|scoop|scoops)?\)/i);
    if (bracketMatch) {
      const val = parseFloat(bracketMatch[1]);
      const matchedUnit = (bracketMatch[2] || "").toLowerCase();
      if (!isNaN(val) && val > 0) {
        if (matchedUnit.startsWith("g") || matchedUnit === "gm" || matchedUnit === "gram" || matchedUnit === "grams") {
          quantity = val;
          unit = "g";
          estimatedGrams = val;
        } else if (matchedUnit === "kg") {
          quantity = val * 1000;
          unit = "g";
          estimatedGrams = val * 1000;
        } else {
          quantity = val;
          unit = matchedUnit || "piece";
        }
      }
    } else {
      // 2. Check for prefix number e.g. "4 chapati", "50g rice", "2 boiled eggs", "10 ragda puri"
      const numMatch = text.match(/\b([\d\.]+)\s*(g|gm|gram|grams|kg|ml|piece|pieces|slice|slices|bowl|bowls|cup|cups|plate|plates|handful|handfuls|scoop|scoops)?\b/i);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        const matchedUnit = (numMatch[2] || "").toLowerCase();
        if (!isNaN(val) && val > 0) {
          if (matchedUnit.startsWith("g") || matchedUnit === "gm" || matchedUnit === "gram" || matchedUnit === "grams") {
            quantity = val;
            unit = "g";
            estimatedGrams = val;
          } else if (matchedUnit === "kg") {
            quantity = val * 1000;
            unit = "g";
            estimatedGrams = val * 1000;
          } else {
            quantity = val;
            unit = matchedUnit || "piece";
          }
        }
      } else {
        // 3. Check for word numbers e.g. "two eggs", "four chapatis", "half plate"
        for (const [w, n] of Object.entries(WORD_NUMBERS)) {
          if (new RegExp(`\\b${w}\\b`, "i").test(text)) {
            quantity = n;
            break;
          }
        }
        if (text.includes("handful")) {
          unit = "handful";
          quantity = 1;
        }
      }
    }

    const isFried = /fried|deep fried|fry|pakora|samosa|vada|puri/i.test(text);
    const isBoneIn = /bone|small boned|drumstick|leg piece/i.test(text);

    // Special case 1: Chicken gravy with explicit pieces e.g. "(4 pieces of small boned chicken)"
    if (/chicken\s+gravy|chicken\s+curry/i.test(text) && (isBoneIn || /piece|pieces/i.test(text))) {
      const pieceCountMatch = text.match(/(\d+)\s*(?:small\s*)?(?:boned|bone-in|bone)?\s*(?:chicken\s*)?pieces?/i);
      const pieceCount = pieceCountMatch ? parseInt(pieceCountMatch[1], 10) : 4;

      parsedItems.push({
        name: `${pieceCount} bone-in chicken pieces`,
        canonical_key: "chicken_bone_in_piece",
        quantity: pieceCount,
        unit: "piece",
        is_bone_in: true,
        edible_grams: pieceCount * 30,
        confidence: "high",
      });

      parsedItems.push({
        name: "chicken gravy (curry sauce with oil)",
        canonical_key: "chicken_gravy",
        quantity: 1,
        unit: "bowl",
        is_fried: false,
        confidence: "high",
      });
      continue;
    }

    // Special case 2: "chicken gravy" or "chicken curry" without piece count -> separate chicken meat + gravy sauce
    if (text === "chicken gravy" || text === "chicken curry" || text.includes("chicken gravy") && !text.includes("chapati") && !text.includes("rice")) {
      parsedItems.push({
        name: "chicken meat (curry portion ~100g)",
        canonical_key: "chicken_boneless",
        quantity: 100,
        unit: "g",
        estimated_grams: 100,
        confidence: "medium",
      });
      parsedItems.push({
        name: "chicken gravy (curry sauce with oil)",
        canonical_key: "chicken_gravy",
        quantity: 1,
        unit: "bowl",
        confidence: "medium",
      });
      assumptions.push("Separated chicken gravy into ~100g chicken meat and 1 bowl gravy sauce with cooking oil");
      continue;
    }

    // Special case 3: "10 ragda puri"
    if (/ragda\s*puri/i.test(text)) {
      parsedItems.push({
        name: `${quantity} ragda puri`,
        canonical_key: "ragda_puri",
        quantity,
        unit: "piece",
        confidence: "high",
      });
      continue;
    }

    parsedItems.push({
      name: part,
      canonical_key: "",
      quantity,
      unit,
      estimated_grams: estimatedGrams,
      is_fried: isFried,
      is_bone_in: isBoneIn,
      confidence: "medium",
    });
  }

  const result = calculateNutritionDeterministic({
    parsedItems,
    assumptions,
    rawQuery: foodName,
  });

  return {
    ...result,
    confidence: "medium",
    isHeuristicFallback: true,
  };
}
