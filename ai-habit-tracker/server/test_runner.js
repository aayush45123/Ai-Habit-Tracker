import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { estimateFoodCalories } from "./src/controllers/aiCalorieController.js";

const tests = [
  "2 boiled eggs",
  "4 chapati",
  "50g cooked rice",
  "chicken gravy with 4 chapati and 50g cooked rice",
  "fried chicken leg + small fried liver",
  "handful roasted chana + peanuts",
  "10 ragda puri",
  "chicken gravy (4 pieces of small boned chicken) with 4 chapati",
];

async function run() {
  for (let idx = 0; idx < tests.length; idx++) {
    const t = tests[idx];
    const req = { body: { foodName: t }, user: { _id: null } };
    let jsonResult = null;
    const res = {
      json: (data) => {
        jsonResult = data;
        return res;
      },
      status: (code) => {
        console.log("STATUS:", code);
        return res;
      },
    };
    await estimateFoodCalories(req, res);
    console.log(`\n========================================`);
    console.log(`TEST ${idx + 1}: "${t}"`);
    console.log(`========================================`);
    console.log(`TOTAL: ${jsonResult.calories} kcal | ${jsonResult.protein}g protein | Confidence: ${jsonResult.confidence}`);
    console.log(`ITEMS:`);
    jsonResult.items.forEach((i) =>
      console.log(`  * ${i.foodName} (${i.quantity} ${i.unit || "serving"}) -> ${i.calories} kcal, ${i.protein}g protein`)
    );
    if (jsonResult.assumptions?.length) {
      console.log(`ASSUMPTIONS:`);
      jsonResult.assumptions.forEach((a) => console.log(`  - ${a}`));
    }
  }
}

run().catch(console.error);
