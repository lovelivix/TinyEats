// ─────────────────────────────────────────────────────────────
// TinyEats — Main App
// Modular structure: data in tinyeats-data.js (imported inline)
// Storage layer abstracted — swap localStorage for Supabase later
// Auth-ready: email captured at signup, Supabase stub in storage layer
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";

// ─── INLINE DATA (merged from tinyeats-data.js for single-file build) ────────

const THEME = {
  primary:"#FF6B6B", secondary:"#FFD93D", green:"#6BCB77",
  blue:"#4D96FF", purple:"#C77DFF",
  white:"#FFFFFF", bg:"#F8F9FF", surface:"#FFFFFF",
  text:"#1A1A2E", textSoft:"#6B7280", border:"#E8EAF0",
  shadow:"0 4px 20px rgba(26,26,46,0.08)", shadowSm:"0 2px 8px rgba(26,26,46,0.06)",
  radius:20, radiusSm:12,
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  html,body{background:#F8F9FF;font-family:'Plus Jakarta Sans',sans-serif;}
  ::-webkit-scrollbar{display:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
  @keyframes popIn{0%{transform:scale(0.7);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}
  @keyframes dot{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}
  @keyframes confetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1;}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
  .fadeUp{animation:fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both;}
  .popIn{animation:popIn 0.4s cubic-bezier(0.16,1,0.3,1) both;}
  button{cursor:pointer;font-family:inherit;border:none;}
  input{font-family:inherit;}
`;

// ─── helpers ─────────────────────────────────────────────────
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const fmtDate = iso => new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const monthsOld = dob => Math.floor((Date.now()-new Date(dob))/(30.44*864e5));
const daysSince = iso => Math.floor((Date.now()-new Date(iso))/864e5);

const FOOD_EMOJI = {
  broccoli:"🥦",carrot:"🥕",parsnip:"🌿","sweet potato":"🍠","butternut squash":"🎃",
  pea:"🫛",courgette:"🥒",banana:"🍌",avocado:"🥑",pear:"🍐",apple:"🍎",
  mango:"🥭",peach:"🍑",plum:"🍇",chicken:"🍗",lentils:"🫘","full fat yoghurt":"🥛",
  oats:"🌾",fish:"🐟",tofu:"🫙",egg:"🥚",toast:"🍞",pasta:"🍝",rice:"🍚",
  cheese:"🧀",porridge:"🥣",hummus:"🫙",pitta:"🫓","peanut butter":"🥜",
  salmon:"🐟",tomato:"🍅",cucumber:"🥒",cauliflower:"🥬","sweet corn":"🌽",
  blueberry:"🫐",strawberry:"🍓",spinach:"🥬",beef:"🥩",lamb:"🥩",
};
const fe = f => FOOD_EMOJI[(f||"").toLowerCase()] || "🍽";

const REACTIONS = [
  {id:"loved",  label:"Loved it",   emoji:"😍",color:"#D1FAE5",text:"#065F46"},
  {id:"good",   label:"Ate well",   emoji:"😋",color:"#D1FAE5",text:"#065F46"},
  {id:"some",   label:"Ate some",   emoji:"🙂",color:"#FEF9C3",text:"#713F12"},
  {id:"tasted", label:"Tasted it",  emoji:"👅",color:"#FEF9C3",text:"#713F12"},
  {id:"refused",label:"Refused",    emoji:"🙅",color:"#FEE2E2",text:"#991B1B"},
  {id:"spat",   label:"Spat out",   emoji:"💨",color:"#F1F5F9",text:"#475569"},
  {id:"reaction",label:"Reaction ⚠️",emoji:"🚨",color:"#FEE2E2",text:"#991B1B"},
];

const STATUS_LEVELS = [
  {min:0,max:0, label:"Not tried",        color:"#E5E7EB",bg:"#F9FAFB",text:"#6B7280"},
  {min:1,max:1, label:"First taste! 🌱",  color:"#FFD93D",bg:"#FFFBEB",text:"#92400E"},
  {min:2,max:3, label:"Getting familiar", color:"#6BCB77",bg:"#F0FFF4",text:"#065F46"},
  {min:4,max:6, label:"Usually accepted", color:"#4D96FF",bg:"#EFF6FF",text:"#1E40AF"},
  {min:7,max:99,label:"Confident eater!", color:"#FF6B6B",bg:"#FFF1F2",text:"#9F1239"},
];
const getStatus = count => STATUS_LEVELS.find(s=>count>=s.min&&count<=s.max)||STATUS_LEVELS[0];

const BADGES = [
  {id:"first_taste",   emoji:"🌱",name:"First Taste",      desc:"Offered the very first food",             check:p=>Object.values(p.foodLog).some(l=>l.length>0)},
  {id:"three_foods",   emoji:"🥄",name:"Explorer",         desc:"Tried 3 different foods",                  check:p=>Object.keys(p.foodLog).filter(f=>p.foodLog[f].length>0).length>=3},
  {id:"five_veg",      emoji:"🥦",name:"Veggie Hero",      desc:"Tried 5 vegetables",                       check:p=>["broccoli","carrot","parsnip","sweet potato","pea","courgette","butternut squash","cauliflower","spinach"].filter(v=>p.foodLog[v]?.length>0).length>=5},
  {id:"five_fruit",    emoji:"🍓",name:"Fruit Lover",      desc:"Tried 5 fruits",                           check:p=>["banana","avocado","pear","apple","mango","peach","plum","blueberry","strawberry"].filter(v=>p.foodLog[v]?.length>0).length>=5},
  {id:"first_protein", emoji:"🍗",name:"Protein Pioneer",  desc:"Tried a protein food",                     check:p=>["chicken","fish","egg","lentils","tofu","beef","lamb"].some(v=>p.foodLog[v]?.length>0)},
  {id:"allergen_brave",emoji:"⭐",name:"Allergen Brave",   desc:"Introduced first allergen",                check:p=>["egg","fish","peanut butter","oats","full fat yoghurt","toast","pasta","cheese","hummus","tofu"].some(v=>p.foodLog[v]?.length>0)},
  {id:"ten_foods",     emoji:"🎯",name:"10 Foods!",        desc:"Tried 10 different foods",                 check:p=>Object.keys(p.foodLog).filter(f=>p.foodLog[f].length>0).length>=10},
  {id:"confident_one", emoji:"💪",name:"Confident Eater",  desc:"One food reached confident status",        check:p=>Object.values(p.foodLog).some(l=>l.length>=7)},
  {id:"week_one",      emoji:"🏅",name:"Week 1 Complete",  desc:"Completed the first week",                 check:p=>p.activeWeek>=1},
  {id:"week_six",      emoji:"🏆",name:"Weaning Graduate", desc:"Completed all 6 weeks",                    check:p=>p.activeWeek>=6},
  {id:"twenty_foods",  emoji:"🌟",name:"Food Adventurer",  desc:"Tried 20 different foods",                 check:p=>Object.keys(p.foodLog).filter(f=>p.foodLog[f].length>0).length>=20},
];

const WEEKS = [
  {week:1,title:"First Tastes",subtitle:"One small taste a day",color:"#FFF8E7",accent:"#FFB800",
   mealsPerDay:"1 small taste",texture:"Smooth purées only",
   reassurance:"Milk is still everything. These tiny tastes are purely about discovery.",
   foods:["broccoli","carrot","parsnip","sweet potato","butternut squash","pea","courgette"],
   allergens:[],
   allergenNote:null,tip:"Offer mid-morning, after a milk feed. Never when hungry or tired."},
  {week:2,title:"Adding Fruit",subtitle:"Building variety",color:"#FFF0F0",accent:"#FF6B6B",
   mealsPerDay:"1–2 small tastes",texture:"Smooth purée or soft mash",
   reassurance:"It can take 10–15 tries before a food is accepted. Every refusal is still learning.",
   foods:["banana","avocado","pear","apple","mango","peach","plum"],
   allergens:[],
   allergenNote:null,tip:"Let baby touch and smear food — messy play counts as learning."},
  {week:3,title:"Introducing Protein",subtitle:"Growing foods",color:"#F0FFF4",accent:"#6BCB77",
   mealsPerDay:"2 small meals",texture:"Soft mash, a few small lumps",
   reassurance:"Baby's gut is ready for more variety. Protein supports all that rapid growth.",
   foods:["chicken","lentils","full fat yoghurt","oats","fish","tofu","egg"],
   allergens:["egg","fish","dairy"],
   allergenNote:"Start introducing allergens this week — one at a time, 3 days apart.",
   tip:"Offer water from an open cup or free-flow beaker with meals from now on."},
  {week:4,title:"Building Texture",subtitle:"Getting chunkier",color:"#EFF6FF",accent:"#4D96FF",
   mealsPerDay:"2–3 small meals",texture:"Mash with lumps + first finger foods",
   reassurance:"Moving to lumps early helps reduce fussiness later.",
   foods:["toast","pasta","rice","cheese","broccoli","banana","egg"],
   allergens:["wheat","soy"],
   allergenNote:"Introduce wheat and soy this week — one at a time, 3 days apart.",
   tip:"Finger foods now: soft-cooked carrot sticks, banana halved lengthways, toast fingers."},
  {week:5,title:"Family Foods Begin",subtitle:"Eating together",color:"#FAF5FF",accent:"#C77DFF",
   mealsPerDay:"3 small meals",texture:"Minced, chopped or soft finger foods",
   reassurance:"You've made it to week five — you're doing brilliantly.",
   foods:["porridge","hummus","pitta","sweet potato","chicken","full fat yoghurt","courgette"],
   allergens:["sesame","shellfish"],
   allergenNote:"Introduce sesame and shellfish this week — one at a time, 3 days apart.",
   tip:"Try eating together when you can. Babies learn by watching."},
  {week:6,title:"Expanding Allergens",subtitle:"Building protection",color:"#FFF1F2",accent:"#FF6B6B",
   mealsPerDay:"3 meals",texture:"Soft chopped pieces, varied textures",
   reassurance:"Early allergen introduction reduces allergy risk. Reactions are rare. Stay calm.",
   foods:["peanut butter","fish","egg","full fat yoghurt","oats","cheese","pasta"],
   allergens:["peanut","treenut"],
   allergenNote:"Introduce peanut and tree nuts this week — smooth butters only, never whole nuts.",
   tip:"Keep a note of each new allergen and the date you introduced it."},
];

const ALL_FOODS = [...new Set([
  "broccoli","carrot","parsnip","sweet potato","butternut squash","pea","courgette",
  "banana","avocado","pear","apple","mango","peach","plum","blueberry","strawberry",
  "chicken","lentils","full fat yoghurt","oats","fish","tofu","egg","salmon","beef","lamb",
  "toast","pasta","rice","cheese","porridge","hummus","pitta","peanut butter",
  "tomato","cucumber","cauliflower","sweet corn","spinach",
])].sort();

const FOOD_DB = {
  broccoli:{allergen:null,
    prep:["Wash florets under cold running water.","Cut into large florets — leave a long stalk as a natural handle.","Steam 8–12 minutes until completely soft.","Never add salt or seasoning."],
    safety:["Must be completely soft — hard broccoli is a choking risk.","Large florets are safer than tiny pieces.","Stalks can be stringy — check before serving."],
    recipes:[
      {name:"Broccoli Purée",emoji:"🥦",stage:1,time:"15 min",serves:"4–6",ingredients:["1 head broccoli","Breast milk or formula"],method:["Steam 10–12 mins.","Blend smooth.","Add milk to thin."],tip:"Freeze in ice cube trays."},
      {name:"Broccoli & Sweet Potato",emoji:"🥦🍠",stage:2,time:"20 min",serves:"3–4",ingredients:["½ head broccoli","1 small sweet potato"],method:["Steam sweet potato 10 mins, add broccoli for final 8.","Mash together.","Add milk to loosen."],tip:"A great veg and carb combo."},
      {name:"Broccoli Finger Florets",emoji:"🥦✋",stage:3,time:"12 min",serves:"1",ingredients:["3–4 large florets"],method:["Steam 10–12 mins.","Cool to room temperature.","Serve whole — stalk is the handle."],tip:"Let baby squash it — builds sensory confidence."},
    ]},
  carrot:{allergen:null,
    prep:["Peel and wash thoroughly.","Chop into chunks for puréeing or thick batons for finger food.","Steam or boil 15–20 mins until completely soft.","Test with a fork — should mash with almost no pressure."],
    safety:["Raw carrot is a serious choking hazard — always cook.","Use large batons for finger food — never thin coins.","Never add salt."],
    recipes:[
      {name:"Carrot Purée",emoji:"🥕",stage:1,time:"20 min",serves:"4–6",ingredients:["3 medium carrots","Milk to thin"],method:["Steam 15–18 mins.","Blend smooth.","Add milk to thin."],tip:"Naturally sweet and well tolerated."},
      {name:"Carrot & Lentil Soup",emoji:"🥕🫘",stage:2,time:"30 min",serves:"4",ingredients:["3 carrots","50g red lentils","400ml no-salt stock"],method:["Simmer 20–25 mins.","Blend smooth."],tip:"Red lentils are an excellent source of iron."},
      {name:"Carrot Baton Finger Food",emoji:"🥕✋",stage:3,time:"20 min",serves:"1",ingredients:["1 large carrot"],method:["Cut into thick batons.","Steam 15–20 mins.","Cool and serve."],tip:"Baby should be able to squash between gums."},
    ]},
  egg:{allergen:"Egg",
    prep:["Always cook thoroughly — fully set white and yolk.","Use UK Lion-stamped eggs.","Introduce alone, wait 30 minutes.","Watch for: rash, hives, swelling, vomiting."],
    safety:["⚠️ Egg is a top 14 allergen — introduce carefully.","Never serve runny or raw egg under 12 months.","Seek medical advice if any reaction occurs."],
    recipes:[
      {name:"Scrambled Egg",emoji:"🥚",stage:2,time:"5 min",serves:"1",ingredients:["1 egg","Knob unsalted butter","Splash whole milk"],method:["Beat egg with milk.","Melt butter low heat.","Stir until just set. No salt."],tip:"One of the best first egg introductions."},
      {name:"Mini Egg Muffins",emoji:"🥚🫐",stage:3,time:"25 min",serves:"6",ingredients:["2 eggs","2 tbsp milk","Soft cooked veg","1 tbsp grated cheese"],method:["Whisk eggs with milk.","Stir in veg and cheese.","Bake at 180°C for 15–18 mins."],tip:"Great batch cook — keeps 2 days in fridge."},
    ]},
  banana:{allergen:null,
    prep:["Use a ripe banana — look for brown spots.","No cooking required.","Score the surface to help baby grip."],
    safety:["Ripe banana becomes slippery — score the cut surface.","Do not freeze raw banana.","Overripe is perfectly fine."],
    recipes:[
      {name:"Banana Purée",emoji:"🍌",stage:1,time:"2 min",serves:"1",ingredients:["1 ripe banana","Splash breast milk"],method:["Mash thoroughly.","Add tiny splash of milk.","Serve immediately."],tip:"One of the fastest purées you can make."},
      {name:"Banana Fingers",emoji:"🍌✋",stage:3,time:"1 min",serves:"1",ingredients:["1 ripe banana"],method:["Peel and cut in half lengthways.","Score the cut surface.","Serve as finger food."],tip:"Lengthways halves are much easier to grip."},
    ]},
  "sweet potato":{allergen:null,
    prep:["Scrub well, then peel.","Chop into even chunks.","Steam 15 mins or bake at 200°C for 45 mins.","Check temperature carefully — retains heat very well."],
    safety:["Always thin with milk for early stages.","Sweet potato retains heat — always test.","Remove skin for first purées."],
    recipes:[
      {name:"Sweet Potato Purée",emoji:"🍠",stage:1,time:"20 min",serves:"4–6",ingredients:["1 large sweet potato","Breast milk to thin"],method:["Steam 15 mins.","Blend smooth.","Add milk to thin."],tip:"Batch and freeze in ice cube trays."},
      {name:"Sweet Potato Wedges",emoji:"🍠✋",stage:3,time:"35 min",serves:"1–2",ingredients:["1 sweet potato","Tiny drizzle olive oil"],method:["Cut into long thick wedges.","Roast at 200°C for 25–30 mins.","Cool completely."],tip:"Soft enough to gum, easy to hold."},
    ]},
  chicken:{allergen:null,
    prep:["Remove skin and fat.","Cook thoroughly — no pink meat.","Poaching in no-salt stock keeps it moist."],
    safety:["Must be fully cooked — no pink meat.","Remove all bones.","Blend with liquid to prevent drying out."],
    recipes:[
      {name:"Chicken Purée",emoji:"🍗",stage:1,time:"25 min",serves:"3–4",ingredients:["1 small chicken breast","150ml no-salt stock"],method:["Poach in stock 15–20 mins.","Blend with cooking liquid."],tip:"Never refreeze defrosted chicken."},
      {name:"Chicken & Veg Casserole",emoji:"🍗🥕",stage:2,time:"40 min",serves:"4",ingredients:["1 chicken breast","1 carrot","1 courgette","200ml no-salt stock"],method:["Cook chicken.","Add veg and stock.","Simmer 25–30 mins.","Mash to texture."],tip:"Freeze in portions — brilliant batch cook."},
    ]},
  "peanut butter":{allergen:"Peanut",
    prep:["⚠️ Always smooth — never crunchy.","No salt, no sugar.","Thin with water for first intro.","Introduce alone, wait 30 mins."],
    safety:["⚠️ Peanut is a top 14 allergen.","NEVER give whole peanuts.","Consult GP if family history of allergy.","Watch for: rash, hives, swelling."],
    recipes:[
      {name:"PB Purée Swirl",emoji:"🥜",stage:1,time:"3 min",serves:"1",ingredients:["¼ tsp smooth PB","2 tsp warm water","2 tbsp purée"],method:["Thin PB with warm water.","Swirl through purée."],tip:"Tiny amount only — watch for 30 minutes."},
      {name:"PB Toast Fingers",emoji:"🥜🍞",stage:3,time:"5 min",serves:"1",ingredients:["1 slice toast","1 tsp smooth PB"],method:["Toast lightly.","Spread a THIN layer.","Cut into fingers."],tip:"Thin, even spread — thick globs are difficult to swallow."},
    ]},
  oats:{allergen:"Gluten/Oats",
    prep:["Plain rolled oats only — not instant sachets.","Cook low and slow.","Cool several minutes — porridge holds heat."],
    safety:["⚠️ Oats contain gluten — introduce as new food.","Never use flavoured sachets.","Test temperature on inner wrist."],
    recipes:[
      {name:"Baby Porridge",emoji:"🥣",stage:1,time:"10 min",serves:"1",ingredients:["3 tbsp rolled oats","150ml whole milk"],method:["Cook stirring 5–7 mins.","Cool to safe temperature."],tip:"A brilliant first breakfast."},
      {name:"Banana Porridge",emoji:"🥣🍌",stage:2,time:"10 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","½ banana, mashed"],method:["Cook oats.","Stir in banana off heat."],tip:"Natural sweetness — no added sugar needed."},
      {name:"Oat Pancakes",emoji:"🥞",stage:3,time:"20 min",serves:"6",ingredients:["50g oats (blended)","1 egg","75ml milk","1 banana"],method:["Blend oats.","Mix everything.","Fry small spoonfuls in butter.","Cool completely."],tip:"Naturally sweetened — great finger food."},
    ]},
  lentils:{allergen:null,
    prep:["Red lentils are best — quick and smooth.","Rinse thoroughly.","Simmer 20–25 mins until very soft."],
    safety:["Always cook thoroughly.","Introduce gradually — can cause wind."],
    recipes:[
      {name:"Red Lentil Purée",emoji:"🫘",stage:1,time:"25 min",serves:"4",ingredients:["100g red lentils","300ml water"],method:["Simmer 20–25 mins.","Blend smooth."],tip:"One of the best plant-based iron sources."},
      {name:"Lentil & Carrot Dhal",emoji:"🫘🥕",stage:2,time:"30 min",serves:"4",ingredients:["100g red lentils","2 carrots","1 tsp turmeric","400ml no-salt stock"],method:["Simmer all together 25 mins.","Mash chunky."],tip:"Turmeric is safe from 6 months — tiny pinch."},
    ]},
  "full fat yoghurt":{allergen:"Milk/Dairy",
    prep:["Full-fat plain yoghurt only.","Greek yoghurt is ideal.","No prep needed."],
    safety:["⚠️ Dairy is a top 14 allergen.","Never use flavoured or sweetened yoghurt.","Full-fat is essential for brain development."],
    recipes:[
      {name:"Yoghurt with Fruit",emoji:"🥛🍓",stage:1,time:"3 min",serves:"1",ingredients:["3 tbsp full-fat yoghurt","1–2 tbsp fruit purée"],method:["Spoon yoghurt into bowl.","Swirl through fruit purée."],tip:"Introduce plain first to establish dairy."},
      {name:"Yoghurt Dip",emoji:"🥛🥦",stage:3,time:"5 min",serves:"1",ingredients:["3 tbsp full-fat yoghurt","Soft cooked veg fingers"],method:["Place yoghurt in bowl.","Serve with veg fingers."],tip:"Dipping builds independence and motor skills."},
    ]},

  parsnip:{allergen:null,
    prep:["Peel and wash thoroughly.","Chop into chunks or thick batons.","Steam or boil 15–20 mins until completely soft.","Test with fork — should mash with almost no pressure."],
    safety:["Always cook thoroughly — raw parsnip is hard and a choking risk.","Remove any woody core from larger parsnips.","Never add salt or seasoning."],
    recipes:[
      {name:"Parsnip Purée",emoji:"🫚",stage:1,time:"20 min",serves:"4–6",ingredients:["2 large parsnips","Breast milk or formula"],method:["Peel and chop into chunks.","Steam 18–20 mins until very soft.","Blend smooth, add milk to thin."],tip:"Naturally sweet — great first food."},
      {name:"Parsnip & Carrot Mash",emoji:"🫚🥕",stage:2,time:"25 min",serves:"3–4",ingredients:["1 large parsnip","2 carrots"],method:["Chop and steam both together 18–20 mins.","Mash well together.","Add a little milk to loosen."],tip:"A comforting, sweet combination."},
      {name:"Parsnip Batons",emoji:"🫚✋",stage:3,time:"20 min",serves:"1",ingredients:["1 parsnip"],method:["Peel and cut into thick batons.","Steam 18–20 mins until soft.","Cool and serve as finger food."],tip:"Longer than a baby's fist so they can grip easily."},
    ]},

  "sweet potato":{allergen:null,
    prep:["Wash and peel the sweet potato.","Chop into chunks for purée or wedges for finger food.","Steam or bake — baking intensifies the sweetness.","Always cook until completely soft."],
    safety:["Always cook thoroughly — raw sweet potato is a choking hazard.","For finger food, cut into large wedges — not small pieces.","Never add salt or butter."],
    recipes:[
      {name:"Sweet Potato Purée",emoji:"🍠",stage:1,time:"25 min",serves:"4–6",ingredients:["1 large sweet potato","Breast milk or formula"],method:["Peel and chop.","Steam 20 mins or bake 45 mins at 180°C.","Blend smooth, add milk to thin."],tip:"Freeze in ice cube trays for quick meals."},
      {name:"Sweet Potato Mash",emoji:"🍠",stage:2,time:"25 min",serves:"2–3",ingredients:["1 sweet potato","2 tbsp milk"],method:["Steam until soft.","Mash with a fork.","Add milk to reach desired texture."],tip:"Pairs brilliantly with chicken or lentils."},
      {name:"Sweet Potato Wedges",emoji:"🍠✋",stage:3,time:"35 min",serves:"1–2",ingredients:["1 sweet potato"],method:["Peel and cut into thick wedges.","Bake at 180°C for 30–35 mins.","Cool before serving."],tip:"Soft enough to squish — great for BLW."},
    ]},

  "butternut squash":{allergen:null,
    prep:["Peel carefully — the skin is tough.","Scoop out seeds and stringy flesh.","Chop into chunks.","Steam or roast until very soft."],
    safety:["Ensure completely soft before serving.","Remove all seeds thoroughly.","Never add salt."],
    recipes:[
      {name:"Butternut Squash Purée",emoji:"🎃",stage:1,time:"25 min",serves:"4–6",ingredients:["½ butternut squash","Breast milk or formula"],method:["Peel, deseed and chop.","Steam 20 mins.","Blend smooth, thin with milk."],tip:"Naturally sweet and silky — popular with babies."},
      {name:"Squash & Lentil Mash",emoji:"🎃",stage:2,time:"30 min",serves:"3–4",ingredients:["½ butternut squash","100g red lentils","300ml water"],method:["Simmer lentils 20 mins.","Steam squash separately.","Mash together."],tip:"Great source of iron and beta-carotene."},
      {name:"Squash Fingers",emoji:"🎃✋",stage:3,time:"35 min",serves:"1–2",ingredients:["¼ butternut squash"],method:["Cut into thick fingers.","Roast at 180°C 30 mins.","Cool to room temperature."],tip:"Roasting creates a slightly firmer texture good for gripping."},
    ]},

  pea:{allergen:null,
    prep:["Use frozen peas — just as nutritious as fresh, more convenient.","Cook from frozen in boiling water 3–4 mins.","For purée, blend well — pea skins can be tough.","For older babies, serve whole when soft."],
    safety:["Whole peas are a choking risk until baby can chew confidently — blend or lightly crush first.","Always cook from frozen, not raw.","Never add salt."],
    recipes:[
      {name:"Pea Purée",emoji:"🫛",stage:1,time:"10 min",serves:"4",ingredients:["100g frozen peas","Breast milk or formula"],method:["Cook peas 3–4 mins.","Blend smooth — sieve if needed for smoothness.","Thin with milk."],tip:"Vivid green — great for introducing colour variety."},
      {name:"Pea & Mint Mash",emoji:"🫛",stage:2,time:"10 min",serves:"2",ingredients:["100g frozen peas","Small sprig fresh mint"],method:["Cook peas 3 mins.","Blend with mint leaf.","Mash to desired texture."],tip:"Mint is a gentle flavour babies often enjoy."},
      {name:"Peas with Pasta",emoji:"🫛🍝",stage:3,time:"15 min",serves:"2",ingredients:["50g small pasta","50g frozen peas"],method:["Cook pasta per pack.","Add peas for final 3 mins.","Drain and serve — lightly crush peas."],tip:"Lightly squash peas to reduce choking risk."},
    ]},

  courgette:{allergen:null,
    prep:["Wash well — no need to peel for purée, peel for finger food.","Slice into rounds or sticks.","Steam 8–10 mins until soft.","Very high water content — blend will be thin."],
    safety:["Cook until very soft — raw courgette is tough.","For finger food, cut into thick sticks not thin rounds.","Never add salt."],
    recipes:[
      {name:"Courgette Purée",emoji:"🥒",stage:1,time:"15 min",serves:"3–4",ingredients:["1 courgette","Small amount breast milk"],method:["Slice and steam 8–10 mins.","Blend smooth.","Add very little milk — courgette is watery."],tip:"Combine with carrot for a sweeter flavour."},
      {name:"Courgette & Cheese",emoji:"🥒🧀",stage:2,time:"15 min",serves:"2",ingredients:["1 courgette","1 tbsp grated cheese"],method:["Steam courgette 8 mins.","Mash with fork.","Stir in grated cheese."],tip:"Cheese adds creaminess and calcium."},
      {name:"Courgette Sticks",emoji:"🥒✋",stage:3,time:"15 min",serves:"1",ingredients:["½ courgette"],method:["Peel and cut into thick sticks.","Steam 10–12 mins until soft.","Cool before serving."],tip:"Keep the skin on one side for grip."},
    ]},

  avocado:{allergen:null,
    prep:["Choose a ripe avocado — it should give slightly when pressed.","Halve, remove stone, scoop out flesh.","No cooking required — serve raw.","Mash with a fork — very quick first food."],
    safety:["Only serve ripe — unripe avocado is hard and difficult to swallow.","Remove stone completely before serving.","Introduce at room temperature or slightly warmed."],
    recipes:[
      {name:"Avocado Purée",emoji:"🥑",stage:1,time:"3 min",serves:"1",ingredients:["½ ripe avocado","Breast milk (optional)"],method:["Scoop flesh into bowl.","Mash until smooth.","Add a little milk if needed to thin."],tip:"One of the fastest, easiest first foods."},
      {name:"Avocado & Banana Mash",emoji:"🥑🍌",stage:2,time:"3 min",serves:"1",ingredients:["¼ ripe avocado","½ ripe banana"],method:["Mash both together in a bowl.","Serve immediately — it browns quickly."],tip:"Banana sweetens it — great combination of healthy fats."},
      {name:"Avocado Slices",emoji:"🥑✋",stage:3,time:"2 min",serves:"1",ingredients:["½ ripe avocado"],method:["Peel and slice into thick fingers.","Serve immediately."],tip:"Very slippery — roll in crushed oats to help baby grip."},
    ]},

  pear:{allergen:null,
    prep:["Peel and core the pear.","For younger babies, steam until soft.","Ripe pears can be mashed raw without cooking.","Remove all seeds."],
    safety:["Raw hard pear is a choking risk — always cook for younger babies.","Remove core and seeds completely.","Ripe pears only for raw serving."],
    recipes:[
      {name:"Pear Purée",emoji:"🍐",stage:1,time:"15 min",serves:"4",ingredients:["2 ripe pears","Water"],method:["Peel, core and chop.","Steam 8–10 mins.","Blend smooth."],tip:"Naturally sweet — no need to add anything."},
      {name:"Pear & Oat Breakfast",emoji:"🍐",stage:2,time:"10 min",serves:"1",ingredients:["1 ripe pear","3 tbsp oats","150ml milk"],method:["Cook oats with milk 3–4 mins.","Peel and grate ripe pear on top.","Stir through."],tip:"Pear can be grated raw into warm porridge."},
      {name:"Pear Fingers",emoji:"🍐✋",stage:3,time:"15 min",serves:"1",ingredients:["1 pear"],method:["Peel, core and cut into thick wedges.","Steam 8 mins until just soft.","Cool before serving."],tip:"Leave slightly firmer than purée so baby can grip."},
    ]},

  apple:{allergen:null,
    prep:["Peel, core and remove all seeds.","Chop into chunks for steaming.","Steam 10–12 mins until completely soft for young babies.","Ripe, very soft apples can be grated raw for older babies."],
    safety:["Raw apple is a choking hazard under 12 months — always cook or grate very finely.","Remove all seeds and core — apple seeds contain trace cyanide compounds.","Never serve large chunks."],
    recipes:[
      {name:"Apple Purée",emoji:"🍎",stage:1,time:"15 min",serves:"4–6",ingredients:["2 apples","Water"],method:["Peel, core, chop.","Steam 10–12 mins.","Blend smooth."],tip:"Classic first fruit — freeze in ice cube trays."},
      {name:"Apple & Cinnamon Porridge",emoji:"🍎",stage:2,time:"12 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","½ apple","Pinch cinnamon"],method:["Cook oats with milk.","Steam apple chunks 8 mins.","Stir into porridge with cinnamon."],tip:"Cinnamon is safe from 6 months — avoid nutmeg and mixed spice."},
      {name:"Baked Apple",emoji:"🍎✋",stage:3,time:"25 min",serves:"1–2",ingredients:["1 apple"],method:["Peel, core and halve.","Bake at 180°C for 20 mins.","Cool and slice into wedges."],tip:"Baking softens apple all the way through."},
    ]},

  mango:{allergen:null,
    prep:["Choose a ripe mango — it should smell sweet and give slightly.","Peel and remove stone completely.","No cooking needed for ripe mango.","Blend or mash the flesh."],
    safety:["Mango stone and skin are choking hazards — remove completely.","Only serve ripe — unripe mango is very fibrous.","Some babies are sensitive to mango skin — always peel."],
    recipes:[
      {name:"Mango Purée",emoji:"🥭",stage:1,time:"5 min",serves:"2",ingredients:["½ ripe mango"],method:["Peel and remove stone.","Blend flesh smooth.","Sieve if fibrous."],tip:"Tropical flavour broadens baby's palate."},
      {name:"Mango & Yoghurt",emoji:"🥭🥛",stage:2,time:"5 min",serves:"1",ingredients:["¼ ripe mango","3 tbsp full-fat yoghurt"],method:["Mash mango with fork.","Stir into yoghurt."],tip:"Great way to combine fruit and dairy."},
      {name:"Mango Slices",emoji:"🥭✋",stage:3,time:"5 min",serves:"1",ingredients:["½ ripe mango"],method:["Peel and cut into thick slices.","Serve immediately."],tip:"Very slippery — cut into thick 'hedgehog' style cubes for grip."},
    ]},

  peach:{allergen:null,
    prep:["Choose very ripe peaches — they should be soft to touch.","Peel by blanching in boiling water 30 seconds then cold water — skin slips off easily.","Remove stone completely.","Blend or mash flesh."],
    safety:["Peach stone is a serious choking hazard — remove completely.","Peach skin can be a choking risk for young babies — always peel.","Only serve ripe — hard peach is difficult to swallow."],
    recipes:[
      {name:"Peach Purée",emoji:"🍑",stage:1,time:"10 min",serves:"2–3",ingredients:["2 ripe peaches"],method:["Blanch to remove skin.","Remove stone.","Blend smooth."],tip:"Naturally sweet — mixes well with yoghurt."},
      {name:"Peach & Banana",emoji:"🍑🍌",stage:2,time:"5 min",serves:"1",ingredients:["1 ripe peach","½ banana"],method:["Peel peach, remove stone.","Mash both together."],tip:"No cooking needed — great quick meal."},
      {name:"Soft Peach Pieces",emoji:"🍑✋",stage:3,time:"5 min",serves:"1",ingredients:["1 ripe peach"],method:["Peel and remove stone.","Cut into thick wedges.","Serve immediately."],tip:"Only when very ripe and soft."},
    ]},

  plum:{allergen:null,
    prep:["Choose ripe, soft plums.","Wash, halve and remove stone.","Steam 5–8 mins for younger babies.","Blend or mash well — skin can be tough."],
    safety:["Remove stone completely — it is a choking hazard.","Plum skin can be tough — peel for young babies or blend well.","High in vitamin C and fibre."],
    recipes:[
      {name:"Plum Purée",emoji:"🫐",stage:1,time:"12 min",serves:"3",ingredients:["3 ripe plums"],method:["Halve, stone and steam 6–8 mins.","Blend smooth.","Sieve to remove skin bits."],tip:"Slightly tart — mix with sweeter fruit to start."},
      {name:"Plum & Apple",emoji:"🫐🍎",stage:2,time:"18 min",serves:"3",ingredients:["2 plums","1 apple"],method:["Stone plums, core apple.","Steam together 12–15 mins.","Mash to texture."],tip:"Apple balances the tartness of plum."},
      {name:"Soft Plum Wedges",emoji:"🫐✋",stage:3,time:"8 min",serves:"1",ingredients:["1 very ripe plum"],method:["Halve, remove stone.","Steam 5–6 mins if needed.","Serve in wedges."],tip:"Only serve when very ripe and soft."},
    ]},

  blueberry:{allergen:null,
    prep:["Wash well.","For babies under 9 months, always mash or blend — whole blueberries are a choking hazard.","For older babies who can chew, halve or quarter.","Can be served raw when ripe."],
    safety:["Whole blueberries are a choking hazard — always mash, quarter or blend for young babies.","Blueberry juice stains everything — use a bib!","High in antioxidants — very nutritious."],
    recipes:[
      {name:"Blueberry Purée",emoji:"🫐",stage:1,time:"8 min",serves:"3",ingredients:["100g blueberries"],method:["Wash and place in pan.","Heat gently 3–4 mins until skins burst.","Blend and sieve for smoothness."],tip:"Mix with yoghurt or porridge."},
      {name:"Blueberry Porridge",emoji:"🫐",stage:2,time:"10 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","50g blueberries"],method:["Cook oats with milk.","Warm blueberries separately.","Mash and stir through."],tip:"Mash blueberries well before adding."},
      {name:"Squished Blueberries",emoji:"🫐✋",stage:3,time:"3 min",serves:"1",ingredients:["50g blueberries"],method:["Wash blueberries.","Halve or quarter each one.","Serve as finger food."],tip:"Quarter until baby has good pincer grip and chewing ability."},
    ]},

  strawberry:{allergen:null,
    prep:["Wash well and remove hull.","For young babies, blend or mash — whole strawberries can be a choking risk.","For older babies, quarter or slice thinly.","Can be served raw — no cooking needed."],
    safety:["Strawberries are not a top allergen but can occasionally cause mild rashes in sensitive babies — introduce one at a time and observe.","Remove hull completely.","Halve or mash for young babies — whole strawberries are a choking risk."],
    recipes:[
      {name:"Strawberry Purée",emoji:"🍓",stage:1,time:"5 min",serves:"2",ingredients:["100g strawberries"],method:["Hull and wash.","Blend smooth.","Sieve to remove seeds."],tip:"Mixes beautifully with yoghurt."},
      {name:"Strawberry & Banana",emoji:"🍓🍌",stage:2,time:"5 min",serves:"1",ingredients:["4 strawberries","½ banana"],method:["Hull and quarter strawberries.","Mash banana.","Mash together."],tip:"No cooking needed — a great quick lunch."},
      {name:"Strawberry Halves",emoji:"🍓✋",stage:3,time:"3 min",serves:"1",ingredients:["5 strawberries"],method:["Hull and halve each one.","Serve on tray."],tip:"Quarter for very young babies. Halve when confident with chewing."},
    ]},

  // ⚠️ DOUBLE-CHECK FLAG: Fish guidance
  // Please verify against NHS Start4Life and First Steps Nutrition before publishing.
  // Key areas to verify: recommended fish types for babies, mercury guidance for UK (differs from US),
  // whether smoked fish is appropriate, frequency recommendations.
  fish:{allergen:"fish",
    prep:["Use fresh or frozen white fish — cod, haddock, pollock or coley are ideal.","Remove ALL bones before cooking — run fingers along flesh carefully.","Steam, bake or poach — never fry for young babies.","Flake carefully after cooking and check again for bones."],
    safety:["Remove every bone — fish bones are a serious choking hazard. Check twice.","Do not give shark, swordfish or marlin — too high in mercury. Limit tuna to 2 portions per week.","Smoked fish is very high in salt — avoid under 1 year.","Fish is a top allergen — introduce alone and wait for reactions."],
    recipes:[
      {name:"White Fish Purée",emoji:"🐟",stage:1,time:"15 min",serves:"2",ingredients:["100g white fish fillet","Breast milk or formula"],method:["Steam or poach fish 8–10 mins.","Remove all bones carefully.","Blend smooth with milk."],tip:"Cod and haddock are mild and well tolerated."},
      {name:"Fish & Sweet Potato Mash",emoji:"🐟🍠",stage:2,time:"25 min",serves:"2",ingredients:["100g white fish","1 small sweet potato"],method:["Steam sweet potato 20 mins.","Poach fish separately 8 mins.","Flake fish carefully, mash together."],tip:"Check twice for bones before mixing."},
      {name:"Fish Flakes with Veg",emoji:"🐟✋",stage:3,time:"20 min",serves:"1",ingredients:["100g white fish fillet","Soft cooked veg"],method:["Steam or bake fish.","Flake into large pieces — check for bones.","Serve with soft veg."],tip:"Large flakes are safer than small pieces for self-feeding."},
    ]},

  tofu:{allergen:"soy",
    prep:["Use firm tofu for finger food, silken tofu for purée.","Pat dry with kitchen paper before cooking.","Can be served as is or lightly pan-fried without oil.","Cut into sticks or cubes appropriate for age."],
    safety:["Tofu is made from soy — a top allergen. Introduce alone and observe for 30 minutes.","Choose unsalted tofu — some commercial tofu contains added salt.","Firm tofu fingers should be soft enough to squish between fingers."],
    recipes:[
      {name:"Silken Tofu Purée",emoji:"🫘",stage:1,time:"5 min",serves:"2",ingredients:["100g silken tofu","Breast milk (optional)"],method:["Scoop tofu into bowl.","Blend until smooth.","Thin with milk if needed."],tip:"Silken tofu is already very smooth — minimal prep needed."},
      {name:"Tofu & Veg Mash",emoji:"🫘",stage:2,time:"20 min",serves:"2",ingredients:["100g firm tofu","1 courgette","1 carrot"],method:["Steam veg until soft.","Crumble tofu.","Mash all together."],tip:"Good source of plant-based protein."},
      {name:"Tofu Fingers",emoji:"🫘✋",stage:3,time:"12 min",serves:"1",ingredients:["100g firm tofu"],method:["Pat dry and cut into thick sticks.","Bake at 180°C for 10 mins or pan-fry briefly.","Cool before serving."],tip:"Baking firms up the texture making it easier to grip."},
    ]},

  salmon:{allergen:"fish",
    prep:["Use fresh or frozen salmon.","Remove ALL bones — check thoroughly.","Steam, bake or poach — do not add salt.","Flake carefully after cooking and check again for bones."],
    safety:["Remove every bone — salmon pin bones are thin and very difficult to spot. Check twice.","Smoked salmon is very high in salt — avoid completely under 1 year.","Fish is a top allergen — introduce alone and observe.","Salmon is oily fish — limit to 2 portions per week due to pollutants (NHS guidance)."],
    recipes:[
      {name:"Salmon Purée",emoji:"🐟",stage:1,time:"15 min",serves:"2",ingredients:["100g salmon fillet","Breast milk"],method:["Steam or poach 10 mins.","Remove all bones.","Blend smooth with milk."],tip:"Rich in omega-3 — great for brain development."},
      {name:"Salmon & Pea Mash",emoji:"🐟🫛",stage:2,time:"20 min",serves:"2",ingredients:["100g salmon","50g frozen peas"],method:["Poach salmon 10 mins.","Cook peas 3 mins.","Flake salmon (check bones), mash together."],tip:"Classic combination — nutritionally excellent."},
      {name:"Salmon Flakes",emoji:"🐟✋",stage:3,time:"15 min",serves:"1",ingredients:["100g salmon fillet"],method:["Bake at 180°C 12 mins.","Flake into large pieces.","Check carefully for bones."],tip:"Large flakes are safer for self-feeding than small pieces."},
    ]},

  beef:{allergen:null,
    prep:["Choose lean minced beef or tender cuts like braising steak.","Cook thoroughly — no pink meat for babies.","For purée, use slow-cooked beef — much easier to blend.","Always ensure completely cooked through."],
    safety:["Beef must be thoroughly cooked — no pink meat.","Remove all bones, gristle and sinew.","Beef is an excellent source of iron — particularly important for weaning babies.","Never add salt or stock cubes with salt."],
    recipes:[
      {name:"Beef & Root Veg Purée",emoji:"🥩",stage:1,time:"45 min",serves:"4",ingredients:["100g lean minced beef","1 carrot","1 parsnip","200ml no-salt stock"],method:["Brown mince thoroughly.","Add veg and stock.","Simmer 30 mins.","Blend smooth."],tip:"Slow cooking makes beef much easier to blend smoothly."},
      {name:"Beef & Sweet Potato Mash",emoji:"🥩🍠",stage:2,time:"40 min",serves:"3",ingredients:["100g lean mince","1 sweet potato","150ml no-salt stock"],method:["Cook mince thoroughly.","Steam sweet potato separately.","Mash together with stock to loosen."],tip:"Great source of iron and complex carbohydrates."},
      {name:"Soft Beef Pieces",emoji:"🥩✋",stage:3,time:"60 min",serves:"2",ingredients:["150g braising beef","200ml no-salt stock"],method:["Slow cook beef in stock 1 hour until very tender.","Shred into pieces.","Serve with soft veg."],tip:"Slow-cooked beef shreds easily and is safe for self-feeding."},
    ]},

  lamb:{allergen:null,
    prep:["Choose lean minced lamb or tender cuts.","Cook thoroughly — no pink meat.","Remove all fat, bones and gristle.","For purée, slow cooking produces the best texture."],
    safety:["Lamb must be thoroughly cooked — no pink meat.","Remove all bones and gristle.","Lamb is iron-rich — excellent for weaning.","Never add salt, stock cubes or seasoning."],
    recipes:[
      {name:"Lamb & Veg Purée",emoji:"🥩",stage:1,time:"40 min",serves:"4",ingredients:["100g lean minced lamb","1 carrot","1 courgette","200ml no-salt stock"],method:["Brown mince thoroughly.","Add veg and stock.","Simmer 25 mins.","Blend smooth."],tip:"Lamb has a distinctive flavour — great for broadening palate."},
      {name:"Lamb & Lentil Mash",emoji:"🥩",stage:2,time:"40 min",serves:"3",ingredients:["100g minced lamb","50g red lentils","200ml no-salt stock"],method:["Brown lamb.","Add lentils and stock.","Simmer 25 mins.","Mash to texture."],tip:"Lentils add iron and fibre."},
      {name:"Slow-cooked Lamb Pieces",emoji:"🥩✋",stage:3,time:"70 min",serves:"2",ingredients:["150g lamb shoulder","200ml no-salt stock"],method:["Slow cook in stock 60 mins.","Shred into pieces.","Serve with soft veg."],tip:"Must be very tender — test by pressing between fingers."},
    ]},

  toast:{allergen:"wheat",
    prep:["Use plain wholemeal or white bread — no added seeds, nuts or honey.","Toast until lightly golden — not too hard.","Cut into thick fingers (soldiers) for easy gripping.","Never add butter, jam or honey."],
    safety:["Toast is a wheat/gluten allergen — introduce alone and observe.","Ensure soft enough to gum — very hard toast is a choking risk.","Never add honey — risk of botulism under 1 year.","Avoid bread with seeds, which can be choking hazards."],
    recipes:[
      {name:"Toast Soldiers",emoji:"🍞",stage:2,time:"5 min",serves:"1",ingredients:["1 slice bread"],method:["Toast lightly.","Cut into 3–4 thick finger strips.","Cool slightly before serving."],tip:"Toast fingers are a classic first self-feeding food."},
      {name:"Toast with Avocado",emoji:"🍞🥑",stage:2,time:"8 min",serves:"1",ingredients:["1 slice toast","¼ ripe avocado"],method:["Toast bread lightly.","Mash avocado and spread thinly.","Cut into fingers."],tip:"Avocado adds healthy fats and makes toast easier to swallow."},
      {name:"Toast with Nut Butter",emoji:"🍞🥜",stage:3,time:"5 min",serves:"1",ingredients:["1 slice toast","Thin spread smooth nut butter"],method:["Toast bread.","Spread a very thin layer of smooth nut butter.","Cut into fingers."],tip:"Nut butter must be smooth, very thinly spread — never whole nuts."},
    ]},

  pasta:{allergen:"wheat",
    prep:["Use small pasta shapes — orzo, small shells or tiny spirals are ideal.","Cook 2–3 minutes longer than packet says for young babies.","Pasta should be completely soft — not al dente.","Rinse briefly after cooking to stop sticking."],
    safety:["Pasta is a wheat/gluten allergen — introduce alone and observe.","Must be soft enough to squish easily between fingers.","Never add salt to cooking water.","Avoid pasta with seeds or whole spices."],
    recipes:[
      {name:"Simple Pasta with Sauce",emoji:"🍝",stage:2,time:"20 min",serves:"2",ingredients:["50g small pasta","2 tbsp no-salt tomato purée","1 tbsp grated cheese"],method:["Cook pasta very soft.","Mix with purée.","Top with cheese."],tip:"Tomato purée (not tinned tomatoes) has lower salt."},
      {name:"Pasta with Veg",emoji:"🍝🥕",stage:2,time:"25 min",serves:"2",ingredients:["50g small pasta","1 carrot","½ courgette"],method:["Cook pasta very soft.","Steam veg, chop finely.","Toss together."],tip:"Use smallest pasta shapes available."},
      {name:"Pasta Finger Food",emoji:"🍝✋",stage:3,time:"15 min",serves:"1",ingredients:["50g penne or fusilli"],method:["Cook very soft — 2 mins extra.","Drain and cool.","Serve plain or with mild sauce."],tip:"Larger shapes are easier for babies to pick up."},
    ]},

  rice:{allergen:null,
    prep:["Use white rice — easier to digest than brown for young babies.","Cook with extra water until very soft.","Rinse before cooking.","For purée, blend cooked rice with milk or veg."],
    safety:["Rice should be very soft for young babies — not firm.","Baby rice can be constipating if over-relied on — vary grains.","Never add salt.","Cooked rice must be used immediately or refrigerated within 1 hour — bacteria risk."],
    recipes:[
      {name:"Rice Porridge",emoji:"🍚",stage:1,time:"20 min",serves:"2",ingredients:["3 tbsp white rice","150ml breast milk or formula","200ml water"],method:["Cook rice in water 18 mins.","Blend smooth.","Add milk to thin."],tip:"Very soothing and gentle on baby's tummy."},
      {name:"Rice with Veg",emoji:"🍚🥕",stage:2,time:"25 min",serves:"2",ingredients:["50g white rice","1 carrot","½ courgette","150ml no-salt stock"],method:["Cook rice very soft.","Steam veg separately.","Mash veg into rice with stock."],tip:"Stock adds flavour without salt — make your own or use no-salt varieties."},
      {name:"Soft Rice Meal",emoji:"🍚✋",stage:3,time:"20 min",serves:"1",ingredients:["50g white rice","Protein and veg of choice"],method:["Cook rice very soft.","Serve alongside soft pieces of protein and veg."],tip:"Sticky rice varieties are easier for self-feeding."},
    ]},

  cheese:{allergen:"dairy",
    prep:["Choose mild, full-fat cheese — mild cheddar, cream cheese or ricotta.","Grate or crumble for young babies — easier to manage.","No need to cook — serve at room temperature.","Avoid very salty or mature cheeses."],
    safety:["Cheese is a dairy allergen — introduce alone and observe.","Choose pasteurised cheese — avoid brie, camembert, blue cheese and unpasteurised varieties under 1 year.","Full-fat varieties only — babies need the fat for brain development.","Cheese is salty — use small amounts and do not add more salt."],
    recipes:[
      {name:"Cheese on Toast",emoji:"🧀",stage:2,time:"8 min",serves:"1",ingredients:["1 slice toast","2 tbsp grated mild cheddar"],method:["Toast bread.","Sprinkle cheese.","Grill until melted and bubbling.","Cool and cut into fingers."],tip:"Melted cheese is easier to chew than cold."},
      {name:"Cheese & Veg Mash",emoji:"🧀🥦",stage:2,time:"20 min",serves:"2",ingredients:["2 tbsp grated cheese","1 potato","½ head broccoli"],method:["Steam potato and broccoli.","Mash well.","Stir in cheese while warm."],tip:"Cheese adds calcium and flavour."},
      {name:"Cheese Cubes",emoji:"🧀✋",stage:3,time:"2 min",serves:"1",ingredients:["30g mild cheddar"],method:["Cut into small cubes.","Serve on tray."],tip:"Soft enough to gum — a great high-protein snack."},
    ]},

  porridge:{allergen:"wheat",
    prep:["Use plain rolled oats — not instant sachets which contain added sugar and salt.","Cook with breast milk, formula or whole milk.","Cook longer than you think — should be very smooth and thick.","Cool well before serving — retains heat."],
    safety:["Oats can contain gluten traces — if concerned about coeliac risk, choose certified gluten-free oats.","Never add sugar, honey or salt.","Allow to cool thoroughly — porridge holds heat and can burn.","Instant or flavoured sachets contain too much sugar and salt for babies."],
    recipes:[
      {name:"Simple Baby Porridge",emoji:"🥣",stage:1,time:"8 min",serves:"1",ingredients:["3 tbsp rolled oats","150ml breast milk or formula"],method:["Combine oats and milk in pan.","Cook 5–6 mins, stirring.","Cool to room temperature."],tip:"Test temperature on your wrist before serving."},
      {name:"Fruit Porridge",emoji:"🥣🍌",stage:2,time:"10 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","½ banana or pear"],method:["Make porridge.","Mash fruit separately.","Stir through or swirl on top."],tip:"Mashed banana adds natural sweetness."},
      {name:"Porridge with Nut Butter",emoji:"🥣🥜",stage:3,time:"8 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","½ tsp smooth nut butter"],method:["Make porridge.","Stir in tiny amount of smooth nut butter."],tip:"A small amount of smooth nut butter adds protein and flavour."},
    ]},

  hummus:{allergen:"sesame",
    prep:["Choose plain, full-fat hummus — no added garlic or spices initially.","Serve as a dip or spread on toast or veg fingers.","Homemade is best — shop-bought often contains too much salt.","Introduce alongside something familiar."],
    safety:["Hummus contains sesame (tahini) — a top allergen. Introduce alone and observe.","Shop-bought hummus can be high in salt — use sparingly or make your own.","Chickpeas can cause wind in some babies — introduce gradually.","Never offer hummus on hard crackers — choking risk."],
    recipes:[
      {name:"Hummus with Toast",emoji:"🫙",stage:2,time:"5 min",serves:"1",ingredients:["2 tbsp hummus","1 slice toast"],method:["Toast and cut into fingers.","Spread thin layer of hummus.","Serve warm."],tip:"A thin spread only — hummus can be thick and sticky."},
      {name:"Hummus Dip",emoji:"🫙🥕",stage:2,time:"5 min",serves:"1",ingredients:["2 tbsp hummus","Soft cooked veg fingers"],method:["Place hummus in small bowl.","Serve alongside soft veg fingers."],tip:"Dipping is great for motor skills development."},
      {name:"Homemade Baby Hummus",emoji:"🫙",stage:2,time:"10 min",serves:"6",ingredients:["400g tin chickpeas (no salt)","1 tbsp tahini","2 tsp lemon juice","2 tbsp olive oil","Water to thin"],method:["Drain and rinse chickpeas.","Blend all ingredients.","Add water to reach smooth consistency."],tip:"Homemade means no added salt — much better for babies."},
    ]},

  pitta:{allergen:"wheat",
    prep:["Choose plain white or wholemeal pitta — no seeds.","Warm briefly in toaster — should be soft not crunchy.","Cut into fingers or small triangles.","Serve with soft dips like hummus or mashed avocado."],
    safety:["Pitta is a wheat/gluten allergen — introduce alone.","Ensure soft — hard or crispy pitta is a choking risk.","Avoid pittas with seeds.","Check ingredients — some contain added salt."],
    recipes:[
      {name:"Pitta Fingers",emoji:"🫓",stage:2,time:"5 min",serves:"1",ingredients:["½ plain pitta"],method:["Warm pitta briefly.","Cut into fingers.","Serve with soft dip."],tip:"Warm pitta is much softer and safer than cold."},
      {name:"Pitta with Hummus",emoji:"🫓🫙",stage:2,time:"5 min",serves:"1",ingredients:["½ pitta","2 tbsp hummus"],method:["Warm pitta.","Spread hummus thinly.","Cut into fingers."],tip:"Thin spread only — thick hummus can be sticky."},
      {name:"Pitta Pizza",emoji:"🫓🧀",stage:3,time:"12 min",serves:"1",ingredients:["½ pitta","2 tbsp no-salt tomato purée","2 tbsp grated cheese"],method:["Spread purée on pitta.","Add cheese.","Grill 5 mins until melted.","Cool and cut into pieces."],tip:"A fun way to offer wheat, dairy and tomato together."},
    ]},

  // ⚠️ DOUBLE-CHECK FLAG: Peanut butter guidance
  // Please verify against NHS Start4Life, LEAP study guidance, and Allergy UK before publishing.
  // Key areas to verify: recommended age for introduction, LEAP study protocol for high-risk babies,
  // consistency/thickness safety, whether any specific brands are recommended.
  "peanut butter":{allergen:"peanut",
    prep:["Use smooth peanut butter only — never crunchy or whole peanuts.","Thin with water or breast milk before serving to young babies — thick nut butter is a choking risk.","Start with a very small amount — half a teaspoon.","Introduce alone without other new foods."],
    safety:["Peanut is a top allergen — introduce alone and wait 30 minutes before offering other foods. Observe for 2 hours.","NEVER give whole peanuts or crunchy peanut butter under 5 years — choking hazard.","Smooth peanut butter must be thinned for young babies — thick nut butter can stick in throat.","If baby has severe eczema or existing egg allergy, speak to GP or allergy specialist before introducing.","Signs of reaction: rash around mouth, hives, swelling, vomiting. Call 999 if breathing affected."],
    recipes:[
      {name:"Thinned Peanut Purée",emoji:"🥜",stage:1,time:"3 min",serves:"1",ingredients:["½ tsp smooth peanut butter","2 tsp warm water"],method:["Mix peanut butter with water.","Stir until thin and runny.","Offer on tip of spoon."],tip:"First introduction only — thin enough to drip off spoon."},
      {name:"Peanut Butter Porridge",emoji:"🥜🥣",stage:2,time:"10 min",serves:"1",ingredients:["3 tbsp oats","150ml milk","1 tsp smooth peanut butter"],method:["Make porridge.","Stir in peanut butter while warm.","Mix thoroughly."],tip:"Porridge dilutes the nut butter — safer texture."},
      {name:"Peanut Butter Toast",emoji:"🥜🍞",stage:3,time:"5 min",serves:"1",ingredients:["1 slice toast","1 tsp smooth peanut butter"],method:["Toast bread.","Spread very thin layer.","Cut into fingers."],tip:"A thin scrape only — never a thick layer."},
    ]},

  tomato:{allergen:null,
    prep:["For young babies, blend or pass through sieve — raw tomato skin and seeds can be hard to swallow.","Cooking softens tomato and actually increases lycopene content.","Remove skin by blanching: score base, pour boiling water over 30 seconds, then cold water — skin slips off.","Remove seeds for younger babies."],
    safety:["Tomato is acidic — may cause temporary rash around mouth in sensitive babies. Not a true allergy.","Raw tomato skin is a choking risk for young babies — always cook or blend initially.","Halve or quarter cherry tomatoes — whole ones are a choking hazard at any age.","Tinned tomatoes often have added salt — check label or use no-salt varieties."],
    recipes:[
      {name:"Simple Tomato Sauce",emoji:"🍅",stage:1,time:"15 min",serves:"4",ingredients:["4 ripe tomatoes or 400g tin no-salt tomatoes","1 tsp olive oil"],method:["Blend tomatoes.","Heat in pan 10 mins.","Sieve to remove skin/seeds."],tip:"Mix into pasta, rice or use as dipping sauce."},
      {name:"Tomato & Veg Mash",emoji:"🍅🥕",stage:2,time:"25 min",serves:"3",ingredients:["2 tomatoes","1 carrot","1 courgette"],method:["Blanch and skin tomatoes.","Steam veg until soft.","Mash all together."],tip:"Vitamin C in tomatoes helps absorb iron from veg."},
      {name:"Halved Cherry Tomatoes",emoji:"🍅✋",stage:3,time:"3 min",serves:"1",ingredients:["8 cherry tomatoes"],method:["Wash and halve each tomato.","Quarter if large.","Serve on tray."],tip:"Always halve — whole cherry tomatoes are a choking hazard."},
    ]},

  cucumber:{allergen:null,
    prep:["Wash well.","For young babies, peel and remove seeds.","For older babies and finger food, leave skin on — provides texture and grip.","No cooking needed — serve raw."],
    safety:["Whole cucumber rounds are a choking risk — cut into spears or long sticks.","For young babies, peel and deseed — the watery interior is fine.","Very high water content — not very nutritious as a main food but good for variety and texture.","Introduce at room temperature."],
    recipes:[
      {name:"Cucumber Sticks",emoji:"🥒",stage:3,time:"3 min",serves:"1",ingredients:["¼ cucumber"],method:["Peel if preferred.","Cut into long, thick spears.","Chill slightly before serving."],tip:"Cool cucumber can be soothing on gums — great for teething."},
      {name:"Cucumber & Yoghurt Dip",emoji:"🥒🥛",stage:3,time:"5 min",serves:"1",ingredients:["¼ cucumber","3 tbsp full-fat yoghurt"],method:["Grate cucumber finely.","Stir into yoghurt.","Serve with soft dippers."],tip:"A gentle baby-friendly tzatziki."},
      {name:"Cucumber in Salad",emoji:"🥒",stage:3,time:"5 min",serves:"1",ingredients:["¼ cucumber","Other soft veg or fruit"],method:["Peel and finely dice.","Combine with other soft pieces.","Serve as part of a finger food plate."],tip:"Good introduction to varied textures."},
    ]},

  cauliflower:{allergen:null,
    prep:["Wash florets well.","Cut into large florets.","Steam 10–12 mins until completely soft.","For purée, blend with milk for a creamy result."],
    safety:["Must be completely soft — hard cauliflower is a choking risk.","Can cause wind in some babies — introduce gradually.","Never add salt or seasoning.","Large florets are safer than small pieces for finger food."],
    recipes:[
      {name:"Cauliflower Purée",emoji:"🥬",stage:1,time:"15 min",serves:"4",ingredients:["½ cauliflower","Breast milk or formula"],method:["Break into florets.","Steam 10–12 mins.","Blend smooth with milk."],tip:"Very creamy texture — babies often love it."},
      {name:"Cauliflower Cheese",emoji:"🥬🧀",stage:2,time:"20 min",serves:"2",ingredients:["½ cauliflower","3 tbsp grated cheese","2 tbsp whole milk"],method:["Steam cauliflower 10 mins.","Mash with milk.","Stir in cheese while warm."],tip:"Cauliflower cheese is a great way to combine two allergens."},
      {name:"Cauliflower Florets",emoji:"🥬✋",stage:3,time:"12 min",serves:"1",ingredients:["4–5 florets"],method:["Steam 10–12 mins.","Cool to room temperature.","Serve whole floret — stalk is the handle."],tip:"Same principle as broccoli — stalk makes a natural grip."},
    ]},

  "sweet corn":{allergen:null,
    prep:["Use tinned sweetcorn (no added salt or sugar) or cooked fresh.","Whole sweetcorn kernels are a choking hazard under 12 months — blend or mash.","Blend well — corn skin is hard to swallow.","Mix into other foods rather than serving alone."],
    safety:["Whole corn kernels are a choking hazard for young babies — always blend or crush well.","Even for older babies, kernels pass through undigested — this is normal.","Use no-added-salt tinned sweetcorn only.","Do not give corn on the cob to young babies."],
    recipes:[
      {name:"Sweetcorn Purée",emoji:"🌽",stage:1,time:"10 min",serves:"3",ingredients:["100g no-salt tinned sweetcorn","Breast milk"],method:["Drain and rinse corn.","Blend with milk.","Sieve for smoothness."],tip:"Mix with sweet potato for a sweeter combination."},
      {name:"Sweetcorn & Potato Mash",emoji:"🌽",stage:2,time:"25 min",serves:"2",ingredients:["100g sweetcorn","1 medium potato"],method:["Steam potato until soft.","Blend corn separately.","Mash potato and mix corn through."],tip:"Good combination of carbohydrates and sweetness."},
      {name:"Corn with Pasta",emoji:"🌽🍝",stage:3,time:"15 min",serves:"1",ingredients:["50g small pasta","50g sweetcorn"],method:["Cook pasta very soft.","Drain and mix in sweetcorn.","Lightly mash corn kernels."],tip:"Lightly mash kernels before adding — reduces choking risk."},
    ]},

  spinach:{allergen:null,
    prep:["Use fresh young leaf spinach — less bitter than mature leaves.","Wash thoroughly.","Wilt in a pan with a tiny amount of water — takes just 1–2 mins.","Blend well — spinach has strings that can be hard to swallow."],
    safety:["High in oxalates — do not serve spinach as a main food every day, vary with other vegetables.","Blend thoroughly — stringy texture can be a choking risk.","Never add salt.","Baby spinach leaves are finer and easier to blend than mature spinach."],
    recipes:[
      {name:"Spinach Purée",emoji:"🥬",stage:1,time:"10 min",serves:"3",ingredients:["100g fresh spinach","Breast milk"],method:["Wash and wilt spinach 2 mins.","Squeeze out excess water.","Blend smooth with milk."],tip:"Combine with sweet potato or banana to balance the flavour."},
      {name:"Spinach & Lentil Dhal",emoji:"🥬",stage:2,time:"30 min",serves:"3",ingredients:["100g red lentils","50g spinach","200ml no-salt stock"],method:["Simmer lentils in stock 20 mins.","Stir in spinach last 2 mins.","Blend or mash to texture."],tip:"Great source of iron and folate."},
      {name:"Spinach in Pasta Sauce",emoji:"🥬🍝",stage:3,time:"20 min",serves:"2",ingredients:["50g spinach","150ml no-salt tomato sauce","50g small pasta"],method:["Cook pasta very soft.","Wilt spinach into warm sauce.","Blend spinach into sauce.","Combine."],tip:"Blending spinach into sauce is a great way to add nutrients."},
    ]},
};

const GUIDE_TOPICS = [
  {icon:"🌱",title:"Why 6 months?",body:"Before 6 months, babies' guts, kidneys and digestive systems are still developing. Introducing food too early can increase the risk of allergies, obesity and infections.\n\nThe NHS recommends around 6 months — never before 17 weeks (4 months). At 6 months, breast milk or formula still provides most of baby's nutrition. Food at this stage is about learning, not calories."},
  {icon:"🥄",title:"How much will they eat?",body:"Much less than you expect! Start with 1–2 teaspoons once a day. By 9 months, three small meals a day is the target. By 12 months, baby should be eating family foods.\n\nThere are no set amounts — your baby signals when they've had enough. Always follow their lead and never force feed."},
  {icon:"🍼",title:"What about milk feeds?",body:"Milk remains the main nutrition source for the whole first year. You don't need to reduce milk feeds when starting weaning.\n\nGradually, as baby eats more food, they'll naturally reduce milk intake. Formula-fed babies generally have around 500–600ml per day by 12 months."},
  {icon:"✋",title:"Baby-led vs purée",body:"Both approaches are safe and effective. Many families combine both. The NHS supports either approach.\n\nWhat matters most is offering a variety of flavours, textures, and nutrients — not the method you use."},
  {icon:"🩸",title:"Iron: most important nutrient",body:"Iron is the most critical nutrient in early weaning. Babies' iron stores from birth last around 6 months — which is one reason weaning starts then.\n\nIron-rich foods: red meat, chicken, fish, eggs, lentils, beans, fortified cereals. Vitamin C helps absorb plant-based iron — serve them together."},
  {icon:"⚠️",title:"The top 14 allergens",body:"The top 14 allergens: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat/gluten, soya, sesame, mustard, celery, lupin, molluscs, sulphites.\n\nNHS recommends introducing each one individually from around 6 months. Early introduction reduces allergy risk. Signs of reaction: rash, hives, swelling, vomiting, breathing difficulty. Call 999 if breathing is affected."},
  {icon:"🫁",title:"Gagging is normal",body:"Gagging is a normal and protective reflex. Young babies have their gag reflex further forward in the mouth — a safety feature that moves back as they develop.\n\nGagging is loud and baby recovers quickly. Choking is different: silent, baby cannot cough, cry or breathe. Act immediately and call 999."},
  {icon:"🥣",title:"Why texture matters",body:"Moving through textures — smooth purées to soft lumps to chopped pieces — is important for development. Babies who stay on smooth food too long can become resistant to lumps.\n\nTexture progression also supports speech development, as chewing uses the same muscles as talking."},
];

const FAQ_ITEMS = [
  {icon:"🫁",q:"Gagging vs choking",a:"Gagging is normal, loud and protective. Choking is silent and serious. If baby cannot cough, cry or breathe — act immediately and call 999.",nhs:true},
  {icon:"🥄",q:"How much should baby eat?",a:"Start with 1–2 teaspoons once a day. No set amounts — follow baby's lead. A refused meal is fine. Milk is still the main nutrition until 12 months. Never force feed.",nhs:true},
  {icon:"😤",q:"Baby keeps spitting food out",a:"Completely normal. The tongue-thrust reflex fades gradually. Spitting is also how babies explore. Keep offering — it can take 8–15+ exposures.",nhs:true},
  {icon:"⚠️",q:"When to introduce allergens",a:"NHS recommends introducing the top 14 allergens one at a time from around 6 months. One at a time, wait ~30 mins, watch for reactions. Early introduction reduces long-term allergy risk.",nhs:true},
  {icon:"🧂",q:"Salt and sugar rules",a:"No added salt under 1 year — baby kidneys cannot cope. No honey under 1 year (botulism risk). Avoid processed foods and high-salt takeaways.",nhs:true},
  {icon:"💧",q:"What can baby drink?",a:"Breast milk or formula is the main drink. Cooled boiled water with meals from 6 months. Open cup or free-flow beaker — not a bottle. No juice or squash.",nhs:true},
  {icon:"🛡️",q:"Reducing choking risk",a:"Always sit upright. Never leave alone during meals. Halve grapes and tomatoes. Remove ALL fish bones. Cook veg until very soft. No whole nuts under 5 years.",nhs:true},
  {icon:"🙅",q:"Refusing all food",a:"Very common. Keep meals short, relaxed, pressure-free. It can take 15+ exposures. Every offer counts — even when nothing is eaten.",nhs:false},
];

const EQUIPMENT = [
  {category:"✅ Recommended",color:"#F0FFF4",border:"#6BCB77",items:[
    {icon:"🪑",name:"High chair with footrest",note:"Essential — aids core stability and swallowing. IKEA Antilop is widely recommended."},
    {icon:"🥛",name:"Open cup or free-flow beaker",note:"For water from 6 months. Better for teeth than valved sippy cups."},
    {icon:"🥄",name:"Soft silicone spoons",note:"Short-handled, soft head — gentler on gums. Let baby hold one too."},
    {icon:"🍜",name:"Suction bowl",note:"Sticks to highchair tray — reduces mess, helps baby learn to scoop."},
    {icon:"🧹",name:"Splash mat",note:"Under the highchair. Weaning is messy — protect your floor and your stress levels."},
    {icon:"🧺",name:"Silicone bib with catch pocket",note:"Front pocket catches falling food — saves laundry."},
    {icon:"🍳",name:"Stick blender",note:"A simple hand blender is perfectly sufficient for purées."},
    {icon:"🧊",name:"Silicone ice cube trays",note:"For batch cooking and freezing purée portions."},
  ]},
  {category:"⚠️ Not necessary",color:"#FFFBEB",border:"#FFD93D",items:[
    {icon:"🥤",name:"Baby food pouches",note:"Convenient occasionally but bypass sensory experience. Overuse can cause texture issues later."},
    {icon:"🍶",name:"Dedicated baby food maker",note:"Not needed — a standard blender and steamer do exactly the same job."},
    {icon:"🕸️",name:"Mesh feeders",note:"Don't develop self-feeding skills. Use sparingly if at all."},
  ]},
  {category:"❌ Avoid",color:"#FFF1F2",border:"#FF6B6B",items:[
    {icon:"🚫",name:"Valved sippy cups",note:"NHS advises against these — the suck action doesn't help the transition to normal drinking."},
    {icon:"🧃",name:"Juice for babies under 1",note:"Even diluted juice damages emerging teeth. Cooled boiled water only."},
    {icon:"⚠️",name:"Cereals with added sugar/salt",note:"Many commercial baby cereals contain hidden sugar or salt. Plain oats are always better."},
  ]},
];

const RESOURCES = [
  {name:"NHS Start4Life Weaning Guide",url:"https://www.nhs.uk/start4life/weaning/",desc:"The official NHS guide — evidence-based, clear, and free.",tag:"NHS"},
  {name:"NHS – What to feed young children",url:"https://www.nhs.uk/conditions/baby/weaning-and-feeding/what-to-feed-young-children/",desc:"Safe foods, foods to avoid, and building a balanced diet.",tag:"NHS"},
  {name:"First Steps Nutrition",url:"https://www.firststepsnutrition.org",desc:"Independent, NHS-endorsed nutrition charity. No commercial bias.",tag:"Science"},
  {name:"British Dietetic Association",url:"https://www.bda.uk.com",desc:"Professional body for UK dietitians. Peer-reviewed guidance.",tag:"Science"},
  {name:"Allergy UK",url:"https://www.allergyuk.org",desc:"Leading UK allergy charity. Essential for allergen introduction.",tag:"Allergy"},
  {name:"The LEAP Study",url:"https://www.leapstudy.co.uk",desc:"The landmark study proving early peanut intro reduces allergy risk.",tag:"Research"},
];

const READINESS_SIGNS = [
  {id:"sit",icon:"🪑",title:"Sits upright with support",desc:"Can hold their head steady — needed to swallow safely."},
  {id:"interest",icon:"👀",title:"Shows interest in food",desc:"Watches you eat, reaches for food, or opens their mouth."},
  {id:"tongue",icon:"👅",title:"Tongue thrust has reduced",desc:"No longer automatically pushes everything out of their mouth."},
];

const STAGE_LABEL = {1:"Purée",2:"Mash/Lumps",3:"Finger Food"};
const STAGE_COLOR = {1:"#FEF9C3",2:"#DBEAFE",3:"#DCFCE7"};

function defaultProfile() {
  return {weaningStarted:false,weaningStartDate:null,activeWeek:0,foodLog:{},shoppingChecked:{},customFoods:[],earnedBadges:[],seenBadges:[],allergens:{},journal:{}};
}

// ─── STORAGE LAYER (swap localStorage → Supabase here later) ─
// ─── SUPABASE CLIENT ──────────────────────────────────────────
const SUPABASE_URL = "https://ddvakukrswdxqenogsgo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdmFrdWtyc3dkeHFlbm9nc2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5ODAsImV4cCI6MjA4ODk5Nzk4MH0.dqywgaLzShU2RlizujG0K4GllFH789WPP-fi9QXsWMg";

// Minimal Supabase client (no SDK needed)
const sb = {
  headers: { "Content-Type":"application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },

  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:"POST", headers: this.headers,
      body: JSON.stringify({email, password}),
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:"POST", headers: this.headers,
      body: JSON.stringify({email, password}),
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method:"POST", headers: {...this.headers, "Authorization":`Bearer ${token}`},
    });
  },

  async getUser(token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {...this.headers, "Authorization":`Bearer ${token}`},
    });
    return r.json();
  },

  authed(token) {
    const h = {...this.headers, "Authorization":`Bearer ${token}`};
    return {
      async getBabies() {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/babies?select=*&order=created_at`, {headers:h});
        return r.json();
      },
      async createBaby(data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/babies`, {
          method:"POST", headers:{...h,"Prefer":"return=representation"},
          body: JSON.stringify(data),
        });
        return r.json();
      },
      async updateBaby(id, data) {
        await fetch(`${SUPABASE_URL}/rest/v1/babies?id=eq.${id}`, {
          method:"PATCH", headers:h, body: JSON.stringify(data),
        });
      },
      async deleteBaby(id) {
        await fetch(`${SUPABASE_URL}/rest/v1/babies?id=eq.${id}`, {method:"DELETE", headers:h});
      },
      async getProfile(babyId) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/baby_profiles?baby_id=eq.${babyId}&select=*`, {headers:h});
        const rows = await r.json();
        return rows[0] || null;
      },
      async saveProfile(babyId, userId, data) {
        await fetch(`${SUPABASE_URL}/rest/v1/baby_profiles?on_conflict=baby_id`, {
          method:"POST",
          headers:{...h,"Prefer":"resolution=merge-duplicates,return=minimal"},
          body: JSON.stringify({baby_id:babyId, user_id:userId, data, updated_at:new Date().toISOString()}),
        });
      },
    };
  },
};

// ─── LOCAL SESSION CACHE ──────────────────────────────────────
const SESSION_KEY = "tinyeats_session";
const sessionCache = {
  get: () => { try { const r=localStorage.getItem(SESSION_KEY); return r?JSON.parse(r):null; } catch { return null; } },
  set: (s) => { try { localStorage.setItem(SESSION_KEY,JSON.stringify(s)); } catch {} },
  clear: () => { try { localStorage.removeItem(SESSION_KEY); } catch {} },
};

// ─── EMAIL CAPTURE (Formspree) ────────────────────────────────
const FORMSPREE_ID = "mdawdada";
async function captureEmail(email, babyName) {
  try {
    await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email, babyName, source:"TinyEats signup"}),
    });
  } catch {}
}

// ─── INITIAL STATE ────────────────────────────────────────────
const INITIAL_STATE = {babies:[], activeBabyId:null, profiles:{}};

// ─── SHARED STYLE HELPERS ─────────────────────────────────────
// ─── LOGO COMPONENT ───────────────────────────────────────────
function SpoonLogo({size=48}) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="15" rx="10" ry="12" fill="#FF6B6B"/>
      <rect x="21.5" y="25" width="5" height="16" rx="2.5" fill="#FF6B6B"/>
      <ellipse cx="24" cy="15" rx="7" ry="9" fill="#FF9B9B" opacity="0.5"/>
    </svg>
  );
}

const css = {
  card:   {background:"#FFFFFF",borderRadius:20,boxShadow:"0 4px 20px rgba(26,26,46,0.08)"},
  cardSm: {background:"#FFFFFF",borderRadius:12,boxShadow:"0 2px 8px rgba(26,26,46,0.06)"},
  input:  {width:"100%",padding:"14px 16px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:15,outline:"none",background:"#FFFFFF",color:"#1A1A2E",marginBottom:0,display:"block",boxSizing:"border-box"},
  btnPrimary: {width:"100%",padding:"16px",background:"#FF6B6B",color:"#FFFFFF",borderRadius:14,fontSize:16,fontWeight:700,border:"none",cursor:"pointer"},
  btnSecondary: {width:"100%",padding:"14px",background:"#F8F9FF",color:"#1A1A2E",borderRadius:14,fontSize:15,fontWeight:600,border:"1.5px solid #E8EAF0",cursor:"pointer"},
  label:  {fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6},
  back:   {padding:"18px 20px 8px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",fontSize:15,color:"#FF6B6B",fontWeight:700,cursor:"pointer"},
  chip:   {display:"inline-flex",alignItems:"center",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600},
};

// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
function NewPasswordScreen({token, onDone}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method:"PUT",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`},
        body: JSON.stringify({password}),
      });
      if (r.ok) { setSuccess(true); setTimeout(onDone, 2000); }
      else { const d = await r.json(); setError(d?.message || "Something went wrong."); }
    } catch { setError("Connection error — please try again."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF5F5 0%,#F8F9FF 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><SpoonLogo size={56}/></div>
        <div style={{fontSize:34,fontWeight:900,color:"#1A1A2E",letterSpacing:-1}}>Tiny<span style={{color:"#FF6B6B"}}>Eats</span></div>
      </div>
      <div style={{width:"100%",maxWidth:380,boxSizing:"border-box"}}>
        <div style={{background:"#FFFFFF",borderRadius:24,boxShadow:"0 8px 40px rgba(26,26,46,0.10)",padding:"28px",boxSizing:"border-box"}}>
          {success ? (
            <div style={{textAlign:"center",padding:"16px 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div style={{fontSize:18,fontWeight:800,color:"#1A1A2E"}}>Password updated!</div>
              <div style={{fontSize:14,color:"#9CA3AF",marginTop:8}}>Taking you to log in…</div>
            </div>
          ) : (
            <>
              <div style={{fontSize:20,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>Set new password</div>
              <div style={{fontSize:14,color:"#9CA3AF",marginBottom:24}}>Choose a new password for your account.</div>
              <div style={{marginBottom:14}}>
                <label style={css.label}>New password</label>
                <input style={{...css.input,border:"1.5px solid #E8EAF0",borderRadius:12,background:"#FAFAFA",boxSizing:"border-box"}} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={css.label}>Confirm password</label>
                <input style={{...css.input,border:"1.5px solid #E8EAF0",borderRadius:12,background:"#FAFAFA",boxSizing:"border-box"}} type="password" placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              </div>
              {error&&<div style={{background:"#FFF1F2",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:16}}>{error}</div>}
              <button onClick={submit} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(255,107,107,0.35)",opacity:loading?0.7:1}}>
                {loading?"Saving…":"Set new password →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({onAuth}) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const submit = async () => {
    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email and password (min 6 characters).");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = mode === "signup" ? await sb.signUp(email, password) : await sb.signIn(email, password);
      if (res.error || res.error_description) {
        setError(res.error_description || res.error?.message || "Something went wrong. Please try again.");
      } else if (mode === "signup" && !res.access_token) {
        const loginRes = await sb.signIn(email, password);
        if (loginRes.access_token) {
          const token = loginRes.access_token;
          const userId = loginRes.user?.id || (await sb.getUser(token)).id;
          sessionCache.set({token, userId, email});
          onAuth({token, userId, email});
        } else {
          setEmailSent(true);
        }
      } else {
        const token = res.access_token;
        const userId = res.user?.id || (await sb.getUser(token)).id;
        sessionCache.set({token, userId, email});
        onAuth({token, userId, email});
      }
    } catch { setError("Connection error — please check your internet and try again."); }
    setLoading(false);
  };

  const submitForgot = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({email}),
      });
      // Supabase returns 200 even if email doesn't exist (security)
      if (r.status === 200 || r.status === 204) {
        setResetSent(true);
      } else {
        const data = await r.json();
        setError(data?.message || "Couldn't send reset email. Please try again.");
      }
    } catch { setError("Connection error — please try again."); }
    setLoading(false);
  };

  // ── Email confirmation sent screen ───────────────────────────
  if (emailSent) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF5F5 0%,#F8F9FF 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>📧</div>
      <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:8}}>Check your email</div>
      <div style={{fontSize:15,color:"#6B7280",lineHeight:1.7,marginBottom:8,maxWidth:320}}>
        We've sent a confirmation link to <strong>{email}</strong>
      </div>
      <div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.7,marginBottom:32,maxWidth:320}}>
        Check your spam folder if you don't see it. Tap the link then come back and log in.
      </div>
      <button onClick={()=>{setEmailSent(false);setMode("login");}} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Back to log in
      </button>
    </div>
  );

  // ── Password reset sent screen ───────────────────────────────
  if (resetSent) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF5F5 0%,#F8F9FF 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>🔑</div>
      <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:8}}>Reset link sent!</div>
      <div style={{fontSize:15,color:"#6B7280",lineHeight:1.7,marginBottom:8,maxWidth:320}}>
        We've sent a password reset link to <strong>{email}</strong>
      </div>
      <div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.7,marginBottom:32,maxWidth:320}}>
        Check your spam folder if you don't see it. Click the link in the email to set a new password.
      </div>
      <button onClick={()=>{setResetSent(false);setMode("login");}} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Back to log in
      </button>
    </div>
  );

  // ── Forgot password screen ───────────────────────────────────
  if (mode === "forgot") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF5F5 0%,#F8F9FF 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><SpoonLogo size={56}/></div>
        <div style={{fontSize:34,fontWeight:900,color:"#1A1A2E",letterSpacing:-1,marginBottom:4}}>
          Tiny<span style={{color:"#FF6B6B"}}>Eats</span>
        </div>
      </div>
      <div style={{width:"100%",maxWidth:380,boxSizing:"border-box"}}>
        <div style={{background:"#FFFFFF",borderRadius:24,boxShadow:"0 8px 40px rgba(26,26,46,0.10)",padding:"28px",boxSizing:"border-box"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>Forgot your password?</div>
          <div style={{fontSize:14,color:"#9CA3AF",marginBottom:24,lineHeight:1.6}}>Enter your email and we'll send you a reset link.</div>
          <div style={{marginBottom:20}}>
            <label style={css.label}>Email</label>
            <input style={{...css.input,border:"1.5px solid #E8EAF0",borderRadius:12,background:"#FAFAFA",boxSizing:"border-box"}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitForgot()}/>
          </div>
          {error&&<div style={{background:"#FFF1F2",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:16,lineHeight:1.5}}>{error}</div>}
          <button onClick={submitForgot} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(255,107,107,0.35)",opacity:loading?0.7:1}}>
            {loading?"Sending…":"Send reset link →"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#9CA3AF"}}>
          <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:"#FF6B6B",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
            ← Back to log in
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#FFF5F5 0%,#F8F9FF 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><SpoonLogo size={56}/></div>
        <div style={{fontSize:34,fontWeight:900,color:"#1A1A2E",letterSpacing:-1,marginBottom:4}}>
          Tiny<span style={{color:"#FF6B6B"}}>Eats</span>
        </div>
        <div style={{fontSize:14,color:"#9CA3AF"}}>Your calm guide to baby weaning</div>
      </div>

      <div style={{width:"100%",maxWidth:380,boxSizing:"border-box"}}>
        <div style={{background:"#FFFFFF",borderRadius:24,boxShadow:"0 8px 40px rgba(26,26,46,0.10)",padding:"28px",boxSizing:"border-box"}}>
          {/* Tab switcher */}
          <div style={{display:"flex",gap:6,marginBottom:24,background:"#F3F4F6",borderRadius:12,padding:4}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:9,border:"none",fontWeight:700,fontSize:14,cursor:"pointer",transition:"all 0.2s",background:mode===m?"#FFFFFF":"transparent",color:mode===m?"#1A1A2E":"#9CA3AF",boxShadow:mode===m?"0 2px 8px rgba(26,26,46,0.08)":"none",fontFamily:"inherit"}}>
                {m==="login"?"Log in":"Sign up"}
              </button>
            ))}
          </div>

          <div style={{marginBottom:14}}>
            <label style={css.label}>Email</label>
            <input style={{...css.input,border:"1.5px solid #E8EAF0",borderRadius:12,background:"#FAFAFA",boxSizing:"border-box"}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>
          <div style={{marginBottom:8}}>
            <label style={css.label}>Password {mode==="signup"&&<span style={{fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:11}}>(min 6 characters)</span>}</label>
            <input style={{...css.input,border:"1.5px solid #E8EAF0",borderRadius:12,background:"#FAFAFA",boxSizing:"border-box"}} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </div>

          {mode==="login"&&(
            <div style={{textAlign:"right",marginBottom:16}}>
              <button onClick={()=>{setMode("forgot");setError("");}} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                Forgot password?
              </button>
            </div>
          )}

          {error&&<div style={{background:"#FFF1F2",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:16,lineHeight:1.5}}>{error}</div>}

          <button onClick={submit} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(255,107,107,0.35)",opacity:loading?0.7:1}}>
            {loading?"Please wait…":mode==="login"?"Log in →":"Create account →"}
          </button>

          {mode==="signup"&&(
            <div style={{fontSize:12,color:"#9CA3AF",textAlign:"center",marginTop:14,lineHeight:1.6}}>
              Your data is stored securely and never shared.
            </div>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#9CA3AF"}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{background:"none",border:"none",color:"#FF6B6B",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
            {mode==="login"?"Sign up free":"Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(INITIAL_STATE);
  const [screen, setScreen] = useState("home");
  const [overlay, setOverlay] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [appLoading, setAppLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null); // for password reset flow
  const saveTimer = useRef(null);

  // ── Boot: restore session and load data ──────────────────────
  useEffect(() => {
    // Check if this is a password reset link (token in URL hash)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const token = params.get("access_token");
      if (token) {
        setResetToken(token);
        window.history.replaceState(null, "", window.location.pathname);
        setAppLoading(false);
        return;
      }
    }

    const cached = sessionCache.get();
    const timeout = setTimeout(() => { setAppLoading(false); }, 5000);
    if (cached?.token) {
      setSession(cached);
      loadData(cached).finally(() => { clearTimeout(timeout); setAppLoading(false); });
    } else {
      clearTimeout(timeout);
      setAppLoading(false);
    }
  }, []);

  const loadData = async (sess) => {
    try {
      const api = sb.authed(sess.token);
      const babies = await api.getBabies();
      if (!Array.isArray(babies)) { sessionCache.clear(); setSession(null); return; }
      const profiles = {};
      for (const baby of babies) {
        const row = await api.getProfile(baby.id);
        profiles[baby.id] = row?.data || defaultProfile();
      }
      const activeBabyId = babies[0]?.id || null;
      setState({babies, activeBabyId, profiles});
    } catch {}
  };

  const onAuth = async (sess) => {
    setSession(sess);
    setAppLoading(true);
    await loadData(sess);
    setAppLoading(false);
  };

  const signOut = async () => {
    if (session) await sb.signOut(session.token);
    sessionCache.clear();
    setSession(null);
    setState(INITIAL_STATE);
    setScreen("home");
    setOverlay(null);
  };

  const update = useCallback(fn => setState(prev => typeof fn === "function" ? fn(prev) : {...prev,...fn}), []);

  const baby = state.babies.find(b => b.id === state.activeBabyId);
  const profile = baby ? (state.profiles[baby.id] || defaultProfile()) : null;

  // ── Auto-save profile to Supabase ────────────────────────────
  useEffect(() => {
    if (!session || !state.activeBabyId || !profile) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await sb.authed(session.token).saveProfile(state.activeBabyId, session.userId, profile);
      } catch {}
    }, 1500);
  }, [profile]);

  const setProfile = useCallback(fn => update(s => ({
    ...s,
    profiles: {
      ...s.profiles,
      [s.activeBabyId]: typeof fn === "function"
        ? fn(s.profiles[s.activeBabyId] || defaultProfile())
        : {...(s.profiles[s.activeBabyId] || defaultProfile()), ...fn},
    },
  })), [update]);

  // Badge checker
  useEffect(() => {
    if (!profile) return;
    const newly = BADGES.filter(b => !profile.earnedBadges?.includes(b.id) && b.check(profile));
    if (newly.length > 0) {
      setProfile(p => ({...p, earnedBadges:[...(p.earnedBadges||[]), ...newly.map(b=>b.id)]}));
      setNewBadges(newly);
    }
  }, [profile?.foodLog, profile?.activeWeek]);

  const logReaction = useCallback((food, rid) => {
    setProfile(p => {
      const newFoodLog = {...p.foodLog, [food]: [...(p.foodLog[food]||[]), {date:new Date().toISOString(), reaction:rid}]};
      // Auto-start allergen watch if this food is an allergen and not yet introduced
      const allergenMatch = ALLERGENS.find(a => a.id !== "dairy" && food === a.id || 
        (a.id === "egg" && food === "egg") ||
        (a.id === "fish" && (food === "fish" || food === "salmon")) ||
        (a.id === "wheat" && (food === "toast" || food === "pasta" || food === "porridge" || food === "pitta")) ||
        (a.id === "dairy" && (food === "full fat yoghurt" || food === "cheese")) ||
        (a.id === "peanut" && food === "peanut butter") ||
        (a.id === "soy" && food === "tofu") ||
        (a.id === "sesame" && food === "hummus") ||
        (a.id === "treenut" && food === "peanut butter")
      );
      // Simpler: check FOOD_DB allergen field
      const foodAllergenId = FOOD_DB[food]?.allergen;
      const allergenId = foodAllergenId;
      const existingAllergen = p.allergens?.[allergenId];
      if (allergenId && !existingAllergen?.introduced) {
        return {
          ...p,
          foodLog: newFoodLog,
          allergens: {...(p.allergens||{}), [allergenId]: {introduced: new Date().toISOString(), safe:false, reaction:false, autoStarted:true}},
        };
      }
      return {...p, foodLog: newFoodLog};
    });
    setOverlay(null);
  }, [setProfile]);

  const deleteLastReaction = useCallback((food) => {
    setProfile(p => {
      const log = [...(p.foodLog[food]||[])];
      if (log.length === 0) return p;
      log.pop();
      // If this food triggered an auto-started allergen watch and log is now empty, remove the watch
      const allergenId = FOOD_DB[food]?.allergen;
      const allergenEntry = p.allergens?.[allergenId];
      if (allergenId && allergenEntry?.autoStarted && log.length === 0) {
        const newAllergens = {...(p.allergens||{})};
        delete newAllergens[allergenId];
        return {...p, foodLog:{...p.foodLog, [food]:log}, allergens:newAllergens};
      }
      return {...p, foodLog:{...p.foodLog, [food]:log}};
    });
  }, [setProfile]);

  const addCustomFood = useCallback(name => {
    const clean = name.trim().toLowerCase();
    if (!clean) return;
    setProfile(p => ({...p, customFoods:[...(p.customFoods||[]), clean]}));
    setOverlay(null);
  }, [setProfile]);

  const addBaby = useCallback(async (babyData) => {
    try {
      const api = sb.authed(session.token);
      const result = await api.createBaby({...babyData, user_id: session.userId});
      const newBaby = Array.isArray(result) ? result[0] : result;
      const prof = defaultProfile();
      await api.saveProfile(newBaby.id, session.userId, prof);
      update(s => ({
        ...s,
        babies: [...s.babies, newBaby],
        activeBabyId: newBaby.id,
        profiles: {...s.profiles, [newBaby.id]: prof},
      }));
    } catch {}
    setOverlay(null);
  }, [session, update]);

  // Loading screen
  if (appLoading) return (
    <div style={{minHeight:"100vh",background:"#F8F9FF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><SpoonLogo size={64}/></div>
      <div style={{fontSize:28,fontWeight:900,color:"#1A1A2E"}}>Tiny<span style={{color:"#FF6B6B"}}>Eats</span></div>
      <div style={{display:"flex",gap:6,marginTop:20}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#FF6B6B",animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
      </div>
    </div>
  );

  // Password reset flow
  if (resetToken) return <NewPasswordScreen token={resetToken} onDone={() => { setResetToken(null); }} />;

  // Not logged in
  if (!session) return <AuthScreen onAuth={onAuth}/>;

  // No babies yet — show onboarding
  if (!state.babies.length) {
    return <OnboardingScreen onComplete={addBaby} onEmailCapture={email => captureEmail(email, "")} />;
  }

  const months = monthsOld(baby.dob);
  if (!profile.weaningStarted && months < 6) {
    return <ReadinessScreen baby={baby} months={months} onStart={async () => {
      const updated = {...profile, weaningStarted:true, weaningStartDate:new Date().toISOString()};
      setProfile(()=>updated);
      try { await sb.authed(session.token).saveProfile(baby.id, session.userId, updated); } catch {}
    }} />;
  }

  const cw = WEEKS[Math.min(profile.activeWeek, 5)];
  const weaningComplete = profile.weaningStarted && profile.activeWeek >= 6;
  const allFoods = [...new Set([...ALL_FOODS,...(profile.customFoods||[]),...Object.keys(profile.foodLog)])].sort();

  return (
    <div style={{minHeight:"100vh",background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Badge unlock toast */}
      {newBadges.length > 0 && (
        <BadgeToast badges={newBadges} onClose={() => setNewBadges([])} />
      )}

      <div style={{paddingBottom:80}}>
        {screen==="home"    && <HomeScreen    baby={baby} profile={profile} setProfile={setProfile} cw={cw} weaningComplete={weaningComplete} setScreen={setScreen} setOverlay={setOverlay} state={state} />}
        {screen==="plan"    && !weaningComplete && <PlanScreen profile={profile} setProfile={setProfile} cw={cw} setOverlay={setOverlay} session={session} baby={baby} />}
        {screen==="meals"   && <MealsScreen profile={profile} />}
        {screen==="tracker"  && <TrackerScreen profile={profile} allFoods={allFoods} setOverlay={setOverlay} />}
        {screen==="journal"  && <JournalScreen profile={profile} setProfile={setProfile} allFoods={allFoods} />}
        {screen==="learn"    && <LearnScreen />}
      </div>

      <BottomNav screen={screen} setScreen={setScreen} weaningComplete={weaningComplete} allergenAlert={
        profile && (() => {
          const allergenData = profile.allergens || {};
          const hasReady = ALLERGENS.some(a => { const s=allergenData[a.id]; return s?.introduced&&!s.safe&&!s.reaction&&daysUntilSafe(s.introduced)===0; });
          const hasThisWeek = (cw.allergens||[]).some(id => !allergenData[id]?.introduced);
          return hasReady || hasThisWeek;
        })()
      } />

      {/* Overlays */}
      {overlay?.type==="food"     && <FoodOverlay food={overlay.data} log={profile.foodLog[overlay.data]||[]} onLog={logReaction} onDeleteLast={()=>deleteLastReaction(overlay.data)} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="reaction" && <ReactionSheet food={overlay.data} log={profile.foodLog[overlay.data]||[]} onLog={logReaction} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="addFood"  && <AddFoodSheet onAdd={addCustomFood} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="settings" && <SettingsOverlay state={state} update={update} baby={baby} setProfile={setProfile} onAddBaby={()=>setOverlay({type:"addBaby"})} onClose={()=>setOverlay(null)} onSignOut={signOut} onUpdateBaby={async (id, data) => { await sb.authed(session.token).updateBaby(id, data); }} />}
      {overlay?.type==="addBaby"  && <OnboardingScreen onComplete={addBaby} isAdding onBack={()=>setOverlay({type:"settings"})} />}
      {overlay?.type==="badges"   && <BadgesOverlay profile={profile} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="progress" && <ProgressOverlay profile={profile} allFoods={allFoods} onClose={()=>setOverlay(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════
function OnboardingScreen({onComplete, isAdding, onBack, onEmailCapture}) {
  const [step, setStep] = useState(isAdding ? 1 : 0); // skip email step when adding second baby
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [photo, setPhoto] = useState(null);
  const [emailError, setEmailError] = useState("");
  const fileRef = useRef();

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleEmailContinue = async () => {
    if (!email.includes("@") || !email.includes(".")) { setEmailError("Please enter a valid email address"); return; }
    await captureEmail(email, "");
    onEmailCapture?.(email);
    setStep(1);
  };

  const handleComplete = async () => {
    if (!name.trim() || !dob) return;
    // Update Formspree submission with baby name now we have it
    if (email) await captureEmail(email, name.trim());
    onComplete({name:name.trim(), dob, photo});
  };

  return (
    <div style={{minHeight:"100vh",background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Background blobs */}
      <div style={{position:"absolute",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,#FF6B6B22 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-80,left:-80,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,#4D96FF22 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"40%",left:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,#FFD93D22 0%,transparent 70%)",pointerEvents:"none"}}/>

      {onBack && <button onClick={onBack} style={{...css.back,position:"absolute",top:0,left:0}}>← Back</button>}

      <div style={{width:"100%",maxWidth:380,position:"relative",zIndex:1}} className="fadeUp">

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#FF6B6B,#FF9B9B)",boxShadow:"0 8px 24px rgba(255,107,107,0.35)",marginBottom:12}}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="18" cy="12" rx="8" ry="9.5" fill="white" opacity="0.95"/>
                <rect x="16" y="20.5" width="4" height="12" rx="2" fill="white" opacity="0.95"/>
              </svg>
            </div>
          <h1 style={{fontSize:38,fontWeight:900,color:"#1A1A2E",letterSpacing:"-1.5px",lineHeight:1}}>
            Tiny<span style={{color:"#FF6B6B"}}>Eats</span>
          </h1>
          {!isAdding && <p style={{fontSize:15,color:"#6B7280",marginTop:8}}>Your calm guide to baby weaning</p>}
        </div>

        {/* Step 0: Email capture */}
        {step === 0 && (
          <div style={{...css.card,padding:"28px 24px"}} className="fadeUp">
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:32,marginBottom:8}}>👋</div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>Let's get started!</h2>
              <p style={{fontSize:14,color:"#6B7280",lineHeight:1.6}}>Enter your email so we can save your progress and keep you updated with weaning tips.</p>
            </div>
            <label style={css.label}>Your email</label>
            <input
              type="email"
              value={email}
              onChange={e=>{setEmail(e.target.value);setEmailError("");}}
              placeholder="you@example.com"
              style={{...css.input,marginBottom:emailError?4:16,borderColor:emailError?"#FF6B6B":"#E8EAF0"}}
            />
            {emailError && <p style={{fontSize:12,color:"#FF6B6B",marginBottom:14}}>{emailError}</p>}
            <button onClick={handleEmailContinue} style={css.btnPrimary}>Continue →</button>

            <p style={{textAlign:"center",fontSize:11,color:"#9CA3AF",marginTop:12}}>No spam. No sharing. Unsubscribe any time.</p>
          </div>
        )}

        {/* Step 1: Baby details */}
        {step === 1 && (
          <div style={{...css.card,padding:"28px 24px"}} className="fadeUp">
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:32,marginBottom:8}}>👶</div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>
                {isAdding ? "Add a baby" : "Tell us about your baby"}
              </h2>
            </div>

            {/* Photo upload */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
              <button onClick={()=>fileRef.current?.click()} style={{width:80,height:80,borderRadius:"50%",border:"2.5px dashed #E8EAF0",background:photo?"transparent":"#F8F9FF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
                {photo
                  ? <img src={photo} alt="Baby" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{textAlign:"center"}}><div style={{fontSize:24}}>📷</div><div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>Add photo</div></div>
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
            </div>

            <label style={css.label}>Baby's name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rosie" style={{...css.input,marginBottom:16}}/>

            <label style={css.label}>Date of birth</label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{...css.input,marginBottom:20}}/>

            <button
              onClick={handleComplete}
              disabled={!name.trim()||!dob}
              style={{...css.btnPrimary,opacity:name.trim()&&dob?1:0.4}}
            >
              {isAdding ? "Add baby 🌿" : "Let's begin! 🌿"}
            </button>
            <p style={{textAlign:"center",fontSize:11,color:"#9CA3AF",marginTop:12}}>Your data is saved securely to your account and syncs across all your devices.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// READINESS
// ═══════════════════════════════════════════════════════════════
function ReadinessScreen({baby, months, onStart}) {
  const [checked, setChecked] = useState({});
  const allChecked = READINESS_SIGNS.every(s => checked[s.id]);
  return (
    <div style={{minHeight:"100vh",background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",paddingBottom:32}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{padding:"28px 20px 0",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#FF6B6B,#FF9B9B)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="24" cy="15" rx="10" ry="12" fill="white"/>
                <rect x="21.5" y="25" width="5" height="16" rx="2.5" fill="white"/>
              </svg>
            </div>
          <span style={{fontSize:24,fontWeight:900,letterSpacing:"-0.5px"}}><span style={{color:"#1A1A2E"}}>Tiny</span><span style={{color:"#FF6B6B"}}>Eats</span></span>
        </div>
      </div>
      <div style={{margin:"20px 16px",background:"linear-gradient(135deg,#fff,#FFF0F0)",borderRadius:20,padding:"20px",border:"1px solid #FFE0E0",boxShadow:"0 4px 20px rgba(255,107,107,0.08)"}}>
        {baby.photo
          ? <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",margin:"0 auto 8px",border:"3px solid #FF6B6B"}}><img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
          : <div style={{fontSize:48,textAlign:"center",marginBottom:4}}>👶</div>
        }
        <div style={{fontSize:22,fontWeight:800,color:"#1A1A2E",textAlign:"center"}}>{baby.name}</div>
        <div style={{fontSize:14,color:"#6B7280",textAlign:"center",marginTop:2}}>{months} months old</div>
        <div style={{marginTop:12,background:"rgba(255,255,255,0.8)",borderRadius:12,padding:"12px",fontSize:13,color:"#374151",lineHeight:1.65,textAlign:"center"}}>
          <strong>NHS recommends starting at around 6 months.</strong><br/>
          {months<5?"A little time yet — spot the signs below!":"Nearly there — check all three signs."}
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>3 signs to look for</div>
        {READINESS_SIGNS.map(sign => (
          <button key={sign.id} onClick={()=>setChecked(c=>({...c,[sign.id]:!c[sign.id]}))}
            style={{width:"100%",display:"flex",alignItems:"center",borderRadius:16,padding:"14px",marginBottom:8,border:"none",background:checked[sign.id]?"#FFF1F2":"#FFFFFF",boxShadow:checked[sign.id]?"0 0 0 2px #FF6B6B":"0 2px 8px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
            <span style={{fontSize:26,marginRight:12,flexShrink:0}}>{sign.icon}</span>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:2}}>{sign.title}</div>
              <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{sign.desc}</div>
            </div>
            <div style={{width:26,height:26,borderRadius:8,background:checked[sign.id]?"#FF6B6B":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:8,transition:"all 0.15s"}}>
              {checked[sign.id]&&<span style={{color:"#fff",fontWeight:700,fontSize:14}}>✓</span>}
            </div>
          </button>
        ))}
        {allChecked && (
          <div className="fadeUp" style={{marginTop:8}}>
            <div style={{background:"#FFF1F2",border:"2px solid #FF6B6B",borderRadius:18,padding:"16px",textAlign:"center",marginBottom:12,boxShadow:"0 4px 20px rgba(255,107,107,0.15)"}}>
              <div style={{fontSize:28,marginBottom:6}}>🎉</div>
              <div style={{fontSize:16,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>{baby.name} looks ready!</div>
              <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6}}>Chat to your health visitor to confirm, then press below.</div>
            </div>
            <button onClick={onStart} style={css.btnPrimary}>Start weaning {baby.name} 🌿</button>
          </div>
        )}
        <div style={{textAlign:"center",marginTop:14}}>
          <button onClick={onStart} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>Skip and start anyway</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════
function HomeScreen({baby, profile, setProfile, cw, weaningComplete, setScreen, setOverlay, state}) {
  const months = monthsOld(baby.dob);
  const tried = Object.keys(profile.foodLog).filter(f=>profile.foodLog[f]?.length>0);
  const badges = profile.earnedBadges||[];
  const stale = tried.filter(f=>{const l=profile.foodLog[f];return l?.length&&daysSince(l[l.length-1].date)>4;}).slice(0,3);
  const [showJournalAdd, setShowJournalAdd] = useState(false);
  const allFoods = [...new Set([...ALL_FOODS,...(profile.customFoods||[]),...Object.keys(profile.foodLog)])].sort();
  const todayKey = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

  if (weaningComplete) return <CompleteScreen baby={baby} profile={profile} setProfile={setProfile} setScreen={setScreen} />;

  return (
    <div className="fadeUp">
      {/* Header */}
      <div style={{padding:"20px 20px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
            <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#FF6B6B,#FF9B9B)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 10px rgba(255,107,107,0.4)"}}>
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="24" cy="15" rx="10" ry="12" fill="white"/>
                <rect x="21.5" y="25" width="5" height="16" rx="2.5" fill="white"/>
              </svg>
            </div>
            <span style={{fontSize:20,fontWeight:900,letterSpacing:"-0.5px"}}><span style={{color:"#1A1A2E"}}>Tiny</span><span style={{color:"#FF6B6B"}}>Eats</span></span>
          </div>
          <p style={{fontSize:13,color:"#6B7280",marginTop:4}}>Hi! Let's feed <strong style={{color:"#1A1A2E"}}>{baby.name}</strong> today 👋</p>
        </div>
        <button onClick={()=>setOverlay({type:"settings"})} style={{width:50,height:50,borderRadius:"50%",border:"3px solid #FFE4E4",background:"#FFFFFF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(255,107,107,0.15)",cursor:"pointer"}}>
          {baby.photo
            ? <img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={baby.name}/>
            : <span style={{fontSize:24}}>👶</span>
          }
        </button>
      </div>

      {/* Week hero card */}
      <div style={{padding:"0 16px",marginBottom:16}}>
        <div style={{background:`linear-gradient(135deg,${cw.color},white)`,borderRadius:22,padding:"20px",position:"relative",overflow:"hidden",boxShadow:"0 4px 20px rgba(26,26,46,0.08)"}}>
          <div style={{position:"absolute",top:-20,right:-10,fontSize:80,opacity:0.12}}>🌿</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.8)",borderRadius:20,padding:"3px 10px",marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:cw.accent}}/>
            <span style={{fontSize:11,fontWeight:700,color:cw.accent,letterSpacing:"0.06em",textTransform:"uppercase"}}>Week {profile.activeWeek+1} of 6</span>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",lineHeight:1.2,marginBottom:4}}>{cw.title}</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:12}}>{cw.subtitle}</div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.7,background:"rgba(255,255,255,0.65)",borderRadius:12,padding:"10px 12px",marginBottom:12}}>{cw.reassurance}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{...css.chip,background:"rgba(255,255,255,0.8)",color:"#374151"}}>🍽 {cw.mealsPerDay}</span>
            <span style={{...css.chip,background:"rgba(255,255,255,0.8)",color:"#374151"}}>🥄 {cw.texture.split(",")[0]}</span>
          </div>
        </div>
      </div>

      {/* Smart allergen banner */}
      {(() => {
        const allergenData = profile.allergens || {};
        // All allergens ready to mark safe (3 days up)
        const readyAllergens = ALLERGENS.filter(a => {
          const s = allergenData[a.id];
          return s?.introduced && !s.safe && !s.reaction && daysUntilSafe(s.introduced) === 0;
        });
        // All allergens currently being watched
        const watchingAllergens = ALLERGENS.filter(a => {
          const s = allergenData[a.id];
          return s?.introduced && !s.safe && !s.reaction && daysUntilSafe(s.introduced) > 0;
        });
        // This week's allergens not yet started
        const thisWeekAllergens = (cw.allergens||[]).filter(id => !allergenData[id]?.introduced);

        if (readyAllergens.length > 0) return (
          <div style={{padding:"0 16px",marginBottom:14}}>
            <button onClick={()=>setScreen("plan")} style={{width:"100%",display:"flex",alignItems:"center",background:"#F0FFF4",borderRadius:16,padding:"14px",border:"1.5px solid #6BCB77",cursor:"pointer",textAlign:"left",gap:10}}>
              <span style={{fontSize:22,flexShrink:0}}>✅</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#065F46",marginBottom:2}}>
                  3 days are up for {readyAllergens.map(a=>a.name).join(" & ")}!
                </div>
                <div style={{fontSize:12,color:"#6B7280"}}>Tap to mark as safely introduced or note a reaction →</div>
              </div>
            </button>
          </div>
        );

        if (watchingAllergens.length > 0) return (
          <div style={{padding:"0 16px",marginBottom:14}}>
            <div style={{background:"#FFFBF0",borderRadius:16,padding:"14px",border:"1.5px solid #FFD93D"}}>
              {watchingAllergens.map(a => {
                const daysLeft = daysUntilSafe(allergenData[a.id].introduced);
                return (
                  <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:watchingAllergens.length>1?"8px":0}}>
                    <span style={{fontSize:20,flexShrink:0}}>⏳</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#92400E"}}>Watching {a.name}</div>
                      <div style={{fontSize:11,color:"#6B7280"}}>Check back in {daysLeft} day{daysLeft!==1?"s":""} — watch for reactions.</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

        if (thisWeekAllergens.length > 0 && cw.allergenNote) return (
          <div style={{padding:"0 16px",marginBottom:14}}>
            <button onClick={()=>setScreen("plan")} style={{width:"100%",display:"flex",alignItems:"center",background:"#FFFBEB",borderRadius:16,padding:"14px",border:"1.5px solid #FDE68A",cursor:"pointer",textAlign:"left",gap:10}}>
              <span style={{fontSize:22,flexShrink:0}}>🛡️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:2}}>Allergens to introduce this week</div>
                <div style={{fontSize:12,color:"#78350F",lineHeight:1.5}}>{cw.allergenNote}</div>
                <div style={{fontSize:11,color:"#FF6B6B",fontWeight:700,marginTop:4}}>Go to Plan → Allergens to track →</div>
              </div>
            </button>
          </div>
        );

        return null;
      })()}

      {/* Today's food */}
      {(() => {
        const todayEntries = (profile.journal||{})[todayKey] || [];
        const deleteEntry = (idx) => {
          setProfile(p => {
            const entries = [...(p.journal?.[todayKey]||[])];
            entries.splice(idx,1);
            const newJournal = {...(p.journal||{}), [todayKey]: entries};
            if (entries.length===0) delete newJournal[todayKey];
            return {...p, journal:newJournal};
          });
        };
        return (
          <div style={{padding:"0 16px",marginBottom:16}}>
            <div style={{background:"#FFFFFF",borderRadius:20,boxShadow:"0 4px 20px rgba(26,26,46,0.08)",padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:todayEntries.length>0?10:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E"}}>🍽 What did {baby.name} eat today?</div>
                <button onClick={()=>setShowJournalAdd(true)} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
              </div>
              {todayEntries.length===0 ? (
                <div style={{fontSize:12,color:"#9CA3AF",marginTop:8}}>Nothing logged yet — tap + Add to record today's meals.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {todayEntries.map((entry,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:8,background:entry.reaction?"#FFF1F2":"#F8F9FF",borderRadius:10,padding:"8px 10px"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:entry.notes?3:0}}>
                          {entry.foods?.map(f=>(
                            <span key={f} style={{fontSize:12,fontWeight:600,color:entry.reaction?"#DC2626":"#1A1A2E"}}>{fe(f)} {cap(f)}</span>
                          ))}
                          {entry.reaction&&<span style={{fontSize:11,color:"#DC2626",fontWeight:600}}>⚠ Reaction</span>}
                        </div>
                        {entry.notes&&<div style={{fontSize:11,color:"#9CA3AF"}}>{entry.notes}</div>}
                        <div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>{new Date(entry.time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                      <button onClick={()=>deleteEntry(idx)} style={{background:"none",border:"none",color:"#D1D5DB",fontSize:16,cursor:"pointer",padding:"0 2px",flexShrink:0}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Stats row */}
      <div style={{padding:"0 16px",marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <button onClick={()=>setOverlay({type:"progress"})} style={{background:"linear-gradient(135deg,#FFF1F2,#FFE4E4)",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(255,107,107,0.12)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#FF6B6B",lineHeight:1}}>{tried.length}</div>
            <div style={{fontSize:10,color:"#FF6B6B",marginTop:3,fontWeight:700,opacity:0.7}}>foods tried</div>
          </button>
          <button onClick={()=>setOverlay({type:"badges"})} style={{background:"linear-gradient(135deg,#FFFBEB,#FFF3C4)",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",position:"relative",boxShadow:"0 4px 16px rgba(255,217,61,0.15)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#F59E0B",lineHeight:1}}>{badges.length}</div>
            <div style={{fontSize:10,color:"#F59E0B",marginTop:3,fontWeight:700,opacity:0.7}}>badges {badges.length>0?"🏅":""}</div>
          </button>
          <button onClick={()=>setOverlay({type:"progress"})} style={{background:"linear-gradient(135deg,#F0FFF4,#DCFCE7)",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(107,203,119,0.12)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#16A34A",lineHeight:1}}>{Object.values(profile.foodLog).filter(l=>l.length>=7).length}</div>
            <div style={{fontSize:10,color:"#16A34A",marginTop:3,fontWeight:700,opacity:0.7}}>confident</div>
          </button>
        </div>
      </div>

      {/* This week's foods */}
      <div style={{padding:"0 16px",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Quick actions</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <ActionCard emoji="🥗" label="Make a Meal" sub="Meal ideas" onClick={()=>setScreen("meals")} color="#FFF1F2" accent="#FF6B6B"/>
          <ActionCard emoji="📊" label="Food Tracker" sub={`${tried.length} tried`} onClick={()=>setScreen("tracker")} color="#EFF6FF" accent="#4D96FF"/>
          <ActionCard emoji="📚" label="Learn" sub="NHS guide & tips" onClick={()=>setScreen("learn")} color="#FDF4FF" accent="#C77DFF"/>
          <ActionCard emoji="🏅" label="Badges" sub={`${badges.length} earned`} onClick={()=>setOverlay({type:"badges"})} color="#FFFBEB" accent="#FFD93D"/>
        </div>
      </div>

      {/* Try again nudge */}
      {stale.length>0 && (
        <div style={{padding:"0 16px",marginBottom:14}}>
          <div style={{...css.card,padding:"16px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:4}}>⏰ Time to try again</div>
            <p style={{fontSize:13,color:"#6B7280",marginBottom:10,lineHeight:1.5}}>Not offered in a few days — repetition builds acceptance!</p>
            <div style={{display:"flex",gap:8}}>
              {stale.map(f=>(
                <button key={f} onClick={()=>setOverlay({type:"food",data:f})}
                  style={{display:"flex",flexDirection:"column",alignItems:"center",background:"#F8F9FF",border:"none",borderRadius:12,padding:"8px",cursor:"pointer",minWidth:62}}>
                  <span style={{fontSize:24}}>{fe(f)}</span>
                  <span style={{fontSize:10,color:"#1A1A2E",marginTop:3,fontWeight:600}}>{cap(f)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week selector */}
      <div style={{padding:"0 16px",marginBottom:6}}>
        <div style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Jump to week</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
          {WEEKS.map((w,i)=>(
            <button key={i} onClick={()=>setProfile(p=>({...p,activeWeek:i}))}
              style={{flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:profile.activeWeek===i?700:500,background:profile.activeWeek===i?"#FF6B6B":"#FFFFFF",color:profile.activeWeek===i?"#FFFFFF":"#6B7280",border:"none",boxShadow:profile.activeWeek===i?"0 4px 12px rgba(255,107,107,0.3)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
              W{i+1}
            </button>
          ))}
          {profile.activeWeek===5 && (
            <button onClick={()=>setProfile(p=>({...p,activeWeek:6}))}
              style={{flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:600,background:"#6BCB77",color:"#FFFFFF",border:"none",boxShadow:"0 4px 12px rgba(107,203,119,0.3)",whiteSpace:"nowrap"}}>
              ✓ Finish
            </button>
          )}
        </div>
      </div>

      {/* Tip */}
      <div style={{padding:"0 16px 8px"}}>
        <div style={{display:"flex",alignItems:"flex-start",background:"linear-gradient(135deg,#FFFBEB,#FFF8E1)",borderRadius:18,padding:"14px 16px",boxShadow:"0 4px 16px rgba(245,158,11,0.1)",border:"2px solid #FEF3C722"}}>
          <span style={{fontSize:22,marginRight:10,flexShrink:0}}>💡</span>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Today's tip</div>
            <span style={{fontSize:13,color:"#78350F",lineHeight:1.6}}>{cw.tip}</span>
          </div>
        </div>
      </div>

      {showJournalAdd && (
        <AddJournalEntry
          date={todayKey}
          allFoods={allFoods}
          onSave={(entry) => {
            setProfile(p => ({
              ...p,
              journal: {...(p.journal||{}), [todayKey]: [...(p.journal?.[todayKey]||[]), entry]},
            }));
            setShowJournalAdd(false);
          }}
          onClose={()=>setShowJournalAdd(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE SCREEN
// ═══════════════════════════════════════════════════════════════
function CompleteScreen({baby, profile, setProfile, setScreen}) {
  const log = profile.foodLog;
  const tried = Object.keys(log).filter(f=>log[f]?.length>0);
  const confident = tried.filter(f=>(log[f]?.length||0)>=7);
  const total = tried.reduce((a,f)=>a+(log[f]?.length||0),0);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(()=>{ const t=setTimeout(()=>setShowConfetti(false),4000); return ()=>clearTimeout(t); },[]);

  const colors = ["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#C77DFF"];

  return (
    <div style={{minHeight:"100vh",background:"#F8F9FF",position:"relative",overflow:"hidden"}}>
      {showConfetti && (
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:200}}>
          {[...Array(30)].map((_,i)=>(
            <div key={i} style={{position:"absolute",top:"-20px",left:`${Math.random()*100}%`,width:8,height:8,borderRadius:2,background:colors[i%colors.length],animation:`confetti ${2+Math.random()*3}s ${Math.random()*2}s ease-in forwards`}}/>
          ))}
        </div>
      )}
      <div style={{padding:"32px 20px"}} className="fadeUp">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:72,marginBottom:8}}>🎓</div>
          <h1 style={{fontSize:28,fontWeight:900,color:"#1A1A2E",lineHeight:1.2,letterSpacing:"-0.5px"}}>Weaning complete!<br/><span style={{color:"#FF6B6B"}}>Well done {baby.name}!</span></h1>
          <p style={{fontSize:14,color:"#6B7280",lineHeight:1.65,marginTop:10}}>You've finished the 6-week plan. What an incredible journey.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
          {[{n:tried.length,l:"foods tried",c:"#FF6B6B"},{n:confident.length,l:"confident",c:"#6BCB77"},{n:total,l:"total offers",c:"#4D96FF"}].map(x=>(
            <div key={x.l} style={{...css.card,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:x.c}}>{x.n}</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{x.l}</div>
            </div>
          ))}
        </div>
        {confident.length>0&&(
          <div style={{...css.card,padding:"16px",marginBottom:16,background:"linear-gradient(135deg,#F0FFF4,#DCFCE7)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#065F46",marginBottom:8}}>🌟 Confidently eating</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {confident.map(f=><span key={f} style={{fontSize:12,background:"rgba(255,255,255,0.8)",borderRadius:20,padding:"3px 10px",color:"#065F46",fontWeight:600}}>{fe(f)} {cap(f)}</span>)}
            </div>
          </div>
        )}
        <div style={{...css.card,padding:"18px",marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1A1A2E",marginBottom:10}}>What happens next?</div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.8}}>
            • Offer 3 meals a day + 1–2 snacks<br/>
            • Keep introducing new foods and flavours<br/>
            • Continue milk feeds until 12 months<br/>
            • Keep repeating foods that were refused<br/>
            • From 12 months, switch to full-fat cow's milk
          </div>
        </div>
        <button onClick={()=>setProfile(p=>({...p,activeWeek:0}))} style={{...css.btnPrimary,background:"#4D96FF",marginBottom:10}}>🔄 Restart the plan</button>
        <button onClick={()=>setScreen("tracker")} style={css.btnSecondary}>📊 View full food tracker</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLAN SCREEN
// ═══════════════════════════════════════════════════════════════
function PlanScreen({profile, setProfile, cw, setOverlay, session, baby}) {
  const [tab, setTab] = useState("guide");
  const [expandedAllergen, setExpandedAllergen] = useState(null);
  const allergens = profile.allergens || {};

  const startAllergenIntro = (id) => {
    const updated = {...profile, allergens:{...(profile.allergens||{}), [id]:{introduced:new Date().toISOString(), safe:false, reaction:false, autoStarted:false}}};
    setProfile(()=>updated);
    if (session) sb.authed(session.token).saveProfile(baby.id, session.userId, updated).catch(()=>{});
    setExpandedAllergen(null);
  };
  const markAllergenSafe = (id) => {
    const updated = {...profile, allergens:{...(profile.allergens||{}), [id]:{...(profile.allergens||{})[id], safe:true}}};
    setProfile(()=>updated);
    if (session) sb.authed(session.token).saveProfile(baby.id, session.userId, updated).catch(()=>{});
    setExpandedAllergen(null);
  };
  const markAllergenReaction = (id) => {
    const updated = {...profile, allergens:{...(profile.allergens||{}), [id]:{...(profile.allergens||{})[id], reaction:true}}};
    setProfile(()=>updated);
    if (session) sb.authed(session.token).saveProfile(baby.id, session.userId, updated).catch(()=>{});
    setExpandedAllergen(null);
  };

  return (
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:cw.accent}}/>
          <div style={{fontSize:12,fontWeight:700,color:cw.accent,textTransform:"uppercase",letterSpacing:"0.06em"}}>Week {profile.activeWeek+1}</div>
        </div>
        <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginTop:2}}>{cw.title}</div>
      </div>
      <div style={{padding:"0 16px 0"}}>
        <div style={{display:"flex",background:"#F3F4F6",borderRadius:14,padding:4,marginBottom:16}}>
          {["guide","allergens","shopping"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t?"#FFFFFF":"transparent",color:tab===t?"#1A1A2E":"#6B7280",boxShadow:tab===t?"0 2px 8px rgba(26,26,46,0.08)":"none",transition:"all 0.15s",position:"relative"}}>
              {t==="guide"?"📋 Guide":t==="allergens"?"🛡️ Allergens":"🛒 Shopping"}
            </button>
          ))}
        </div>
      </div>

      {tab==="guide" && (
        <div style={{padding:"0 16px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{...css.card,padding:"12px"}}><div style={css.label}>Meals / day</div><div style={{fontSize:14,color:"#1A1A2E",fontWeight:600}}>{cw.mealsPerDay}</div></div>
            <div style={{...css.card,padding:"12px"}}><div style={css.label}>Texture</div><div style={{fontSize:14,color:"#1A1A2E",fontWeight:600}}>{cw.texture.split(",")[0]}</div></div>
          </div>
          <div style={{background:"#F0FFF4",borderRadius:16,padding:"14px",marginBottom:12,border:"1px solid #A7F3D0"}}>
            <div style={{fontSize:13,color:"#065F46",lineHeight:1.7}}>{cw.reassurance}</div>
          </div>
          {cw.allergens?.length>0&&(
            <div style={{background:"#FFFBEB",borderRadius:14,padding:"12px 14px",marginBottom:12,border:"1px solid #FDE68A",display:"flex",alignItems:"flex-start",gap:8}}>
              <span style={{fontSize:18,flexShrink:0}}>🛡️</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Allergens this week</div>
                <div style={{fontSize:13,color:"#78350F",lineHeight:1.5}}>{cw.allergenNote}</div>
                <button onClick={()=>setTab("allergens")} style={{marginTop:8,background:"#FDE68A",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#92400E",cursor:"pointer"}}>Track introductions →</button>
              </div>
            </div>
          )}
          <div style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Foods this week</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {cw.foods.map(f=>{
              const count=profile.foodLog[f]?.length||0;
              const st=getStatus(count);
              const hasDB=!!FOOD_DB[f];
              return(
                <button key={f} onClick={()=>setOverlay({type:"food",data:f})}
                  style={{...css.cardSm,display:"flex",alignItems:"center",gap:10,padding:"12px",border:"none",cursor:"pointer",textAlign:"left",position:"relative"}}>
                  {hasDB&&<div style={{position:"absolute",top:8,right:8,width:6,height:6,borderRadius:"50%",background:"#FF6B6B"}}/>}
                  <span style={{fontSize:28,flexShrink:0}}>{fe(f)}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#1A1A2E"}}>{cap(f)}</div>
                    <span style={{...css.chip,background:st.bg,color:st.text,fontSize:10,padding:"2px 7px",marginTop:3}}>{st.label}</span>
                    {hasDB&&<div style={{fontSize:10,color:"#FF6B6B",fontWeight:600,marginTop:3}}>{FOOD_DB[f].recipes.length} recipes →</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{display:"flex",alignItems:"flex-start",background:"#FFFFFF",borderRadius:12,padding:"12px 14px",marginTop:14,boxShadow:"0 2px 8px rgba(26,26,46,0.06)"}}>
            <span style={{fontSize:16,marginRight:8}}>💡</span>
            <span style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{cw.tip}</span>
          </div>
          <div style={{marginTop:16}}>
            {profile.activeWeek < 5 ? (
              <button onClick={()=>setProfile(p=>({...p,activeWeek:p.activeWeek+1}))}
                style={{...css.btnPrimary,background:"#6BCB77"}}>
                ✓ Week {profile.activeWeek+1} done — advance to Week {profile.activeWeek+2}
              </button>
            ) : (
              <button onClick={()=>setProfile(p=>({...p,activeWeek:6}))}
                style={{...css.btnPrimary,background:"#6BCB77"}}>
                🎓 Complete the 6-week plan!
              </button>
            )}
          </div>
        </div>
      )}

      {tab==="allergens" && (
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#EFF6FF",borderRadius:14,padding:"12px 14px",marginBottom:14,fontSize:12,color:"#1E40AF",lineHeight:1.6}}>
            💡 Introduce one allergen at a time. Wait <strong>3 days</strong> before introducing the next. Stop and contact your GP if baby has a reaction.
          </div>
          {ALLERGENS.map(a => {
            const status = allergens[a.id];
            const isIntroduced = !!status?.introduced;
            const isSafe = !!status?.safe;
            const isReaction = !!status?.reaction;
            const waiting = isIntroduced && !isSafe && !isReaction;
            const daysLeft = waiting ? daysUntilSafe(status.introduced) : 0;
            const isExpanded = expandedAllergen === a.id;
            const isThisWeek = cw.allergens?.includes(a.id);

            let borderColor = "#E8EAF0";
            let bgColor = "#FFFFFF";
            let badgeText = "Not started";
            let badgeBg = "#F3F4F6";
            let badgeColor = "#9CA3AF";

            if (isThisWeek && !isIntroduced) { borderColor="#FFB800"; bgColor="#FFFBF0"; badgeText="⭐ This week"; badgeBg="#FEF9C3"; badgeColor="#92400E"; }
            if (isSafe)     { borderColor="#6BCB77"; bgColor="#F0FFF4"; badgeText="✓ Safely introduced"; badgeBg="#D1FAE5"; badgeColor="#065F46"; }
            if (isReaction) { borderColor="#FF6B6B"; bgColor="#FFF1F2"; badgeText="⚠ Reaction noted"; badgeBg="#FEE2E2"; badgeColor="#DC2626"; }
            if (waiting)    { borderColor="#FFD93D"; bgColor="#FFFBF0"; badgeText=daysLeft===0?"✓ Ready to mark safe":`⏳ ${daysLeft} day${daysLeft!==1?"s":""} to go`; badgeBg="#FEF9C3"; badgeColor="#92400E"; }

            return (
              <div key={a.id} style={{marginBottom:8}}>
                <button onClick={()=>setExpandedAllergen(isExpanded?null:a.id)} style={{width:"100%",background:bgColor,border:`1.5px solid ${borderColor}`,borderRadius:isExpanded?"16px 16px 0 0":16,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
                  <span style={{fontSize:24,flexShrink:0}}>{a.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E",marginBottom:2}}>{a.name}</div>
                    <div style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:600,background:badgeBg,color:badgeColor}}>{badgeText}</div>
                  </div>
                  <span style={{color:"#9CA3AF",fontSize:16,transform:isExpanded?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block"}}>›</span>
                </button>
                {isExpanded && (
                  <div style={{background:bgColor,border:`1.5px solid ${borderColor}`,borderTop:"none",borderRadius:"0 0 16px 16px",padding:"10px 14px 14px"}}>
                    <div style={{fontSize:12,color:"#6B7280",lineHeight:1.6,marginBottom:10}}>{a.tip}</div>

                    {!isIntroduced && (
                      <div style={{background:"#F8F9FF",borderRadius:10,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:12,color:"#9CA3AF"}}>Not started yet.</div>
                        <div style={{fontSize:11,color:"#9CA3AF",marginTop:3}}>Log this food in the tracker or meal plan and the watch will start automatically.</div>
                        <button onClick={()=>startAllergenIntro(a.id)} style={{marginTop:8,background:"none",border:"1.5px solid #E8EAF0",borderRadius:8,padding:"6px 12px",fontSize:11,color:"#9CA3AF",cursor:"pointer"}}>
                          Or start manually
                        </button>
                      </div>
                    )}

                    {status?.autoStarted && waiting && (
                      <div style={{background:"#FFF8F0",borderRadius:10,padding:"8px 10px",marginBottom:8,fontSize:11,color:"#92400E"}}>
                        ✨ Started automatically when you logged this food in the tracker.
                      </div>
                    )}

                    {waiting && daysLeft===0 && (
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#92400E",marginBottom:2}}>3 days have passed — how did it go?</div>
                        <button onClick={()=>markAllergenSafe(a.id)} style={{width:"100%",background:"#6BCB77",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ No reaction — safely introduced!</button>
                        <button onClick={()=>markAllergenReaction(a.id)} style={{width:"100%",background:"#FF6B6B",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>⚠ Baby had a reaction</button>
                      </div>
                    )}
                    {waiting && daysLeft>0 && (
                      <div style={{background:"#FEF9C3",borderRadius:10,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:12,color:"#92400E",fontWeight:600}}>Keep watching for reactions</div>
                        <div style={{fontSize:11,color:"#A16207",marginTop:3}}>Come back in {daysLeft} day{daysLeft!==1?"s":""} to mark as safe.</div>
                      </div>
                    )}
                    {isReaction && (
                      <div style={{background:"#FEE2E2",borderRadius:10,padding:"10px"}}>
                        <div style={{fontSize:12,color:"#DC2626",fontWeight:700,marginBottom:4}}>⚠ What to do:</div>
                        <div style={{fontSize:11,color:"#991B1B",lineHeight:1.7}}>• Mild reaction (rash, runny nose): contact your GP<br/>• Severe (swelling, breathing difficulty): call 999 immediately</div>
                      </div>
                    )}
                    {(isIntroduced) && (
                      <button onClick={()=>{
                        const updated = {...profile, allergens:{...(profile.allergens||{})}};
                        delete updated.allergens[a.id];
                        setProfile(()=>updated);
                        if(session) sb.authed(session.token).saveProfile(baby.id, session.userId, updated).catch(()=>{});
                        setExpandedAllergen(null);
                      }} style={{width:"100%",background:"none",color:"#9CA3AF",border:"1.5px solid #E8EAF0",borderRadius:10,padding:"8px",fontSize:12,cursor:"pointer",marginTop:8}}>
                        Undo / reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab==="shopping" && (
        <div style={{padding:"0 16px 32px"}}>
          <p style={{fontSize:13,color:"#6B7280",marginBottom:14,lineHeight:1.6}}>Tap to tick items off as you shop.</p>
          {cw.foods.map(f=>{
            const key=`${profile.activeWeek}_${f}`;
            const checked=profile.shoppingChecked?.[key];
            return(
              <button key={f} onClick={()=>setProfile(p=>({...p,shoppingChecked:{...p.shoppingChecked,[key]:!checked}}))}
                style={{width:"100%",display:"flex",alignItems:"center",...css.cardSm,padding:"12px 14px",marginBottom:8,border:"none",cursor:"pointer"}}>
                <span style={{fontSize:26,marginRight:12}}>{fe(f)}</span>
                <span style={{flex:1,fontSize:14,color:checked?"#9CA3AF":"#1A1A2E",textDecoration:checked?"line-through":"none",fontWeight:checked?400:500}}>{cap(f)}</span>
                <div style={{width:24,height:24,borderRadius:7,background:checked?"#6BCB77":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                  {checked&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MEALS SCREEN
// ─── ALLERGENS ────────────────────────────────────────────────
const ALLERGENS = [
  {id:"peanut",    name:"Peanut",       emoji:"🥜", tip:"Try smooth peanut butter thinned with water or breast milk. Never whole nuts."},
  {id:"egg",       name:"Egg",          emoji:"🥚", tip:"Start with well-cooked scrambled egg or hard boiled. Avoid runny egg."},
  {id:"dairy",     name:"Cow's milk",   emoji:"🥛", tip:"Full fat yoghurt or cheese is ideal. Cow's milk as a drink from 12 months only."},
  {id:"wheat",     name:"Wheat/Gluten", emoji:"🌾", tip:"Try baby porridge, soft bread, or pasta well cooked. Start small."},
  {id:"fish",      name:"Fish",         emoji:"🐟", tip:"White fish like cod or haddock, well cooked and flaked. Check for bones."},
  {id:"shellfish", name:"Shellfish",    emoji:"🦐", tip:"Introduce carefully — high allergen. Try a tiny amount of cooked prawn."},
  {id:"sesame",    name:"Sesame",       emoji:"🫙", tip:"Tahini (sesame paste) thinned with water is an easy way to introduce this."},
  {id:"soy",       name:"Soy",          emoji:"🫘", tip:"Try tofu or a small amount of soy sauce in cooking. Choose low-salt varieties."},
  {id:"treenut",   name:"Tree nuts",    emoji:"🌰", tip:"Smooth almond or cashew butter thinned with water. Never whole nuts."},
];

const ALLERGEN_WAIT_DAYS = 3;
function daysAgo(isoDate) { return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000*60*60*24)); }
function daysUntilSafe(isoDate) { return Math.max(0, ALLERGEN_WAIT_DAYS - daysAgo(isoDate)); }

// ═══════════════════════════════════════════════════════════════
// ─── MEAL DATABASE ────────────────────────────────────────────
const MEAL_DB = [
  {name:"Broccoli Purée",emoji:"🥦",stage:"Purée",time:"15 min",ingredients:["broccoli"],how:"Steam florets 10–12 mins until completely soft. Blend smooth, add breast milk or formula to reach a thin, pourable consistency.",safety:"Must be completely smooth — no lumps for first tastes. Never add salt.",allergen:null},
  {name:"Carrot Purée",emoji:"🥕",stage:"Purée",time:"20 min",ingredients:["carrot"],how:"Peel, chop and steam carrot chunks 15–18 mins. Blend completely smooth, add milk to thin.",safety:"Always cook thoroughly — raw carrot is a choking hazard. Test temperature before serving.",allergen:null},
  {name:"Sweet Potato Purée",emoji:"🍠",stage:"Purée",time:"20 min",ingredients:["sweet potato"],how:"Peel, cube and steam for 15 mins until very soft. Blend smooth. Add breast milk to thin to desired consistency.",safety:"Sweet potato retains heat intensely — always test temperature carefully.",allergen:null},
  {name:"Butternut Squash Purée",emoji:"🎃",stage:"Purée",time:"30 min",ingredients:["butternut squash"],how:"Peel, cube and steam for 20–25 mins. Blend until completely smooth, adding a little water or milk to thin.",safety:"Test temperature carefully — squash holds heat well.",allergen:null},
  {name:"Parsnip Purée",emoji:"🌿",stage:"Purée",time:"20 min",ingredients:["parsnip"],how:"Peel, chop and steam parsnip 15 mins until very soft. Blend completely smooth with a little milk.",safety:"Naturally sweet — no added sugar needed. No salt.",allergen:null},
  {name:"Pea Purée",emoji:"🫛",stage:"Purée",time:"8 min",ingredients:["pea"],how:"Cook frozen peas in boiling water 3 mins. Drain and blend until very smooth. Pass through a sieve for extra smoothness.",safety:"Blend very smooth for early weaning — pea skins can be a texture challenge.",allergen:null},
  {name:"Banana Purée",emoji:"🍌",stage:"Purée",time:"2 min",ingredients:["banana"],how:"Mash a ripe banana thoroughly with a fork. Add a tiny splash of breast milk to loosen. Serve immediately.",safety:"Use a ripe banana — look for brown spots. Serve straight away as banana browns quickly.",allergen:null},
  {name:"Avocado Purée",emoji:"🥑",stage:"Purée",time:"2 min",ingredients:["avocado"],how:"Scoop out ripe avocado flesh and mash until completely smooth. A splash of breast milk helps with consistency.",safety:"Use fully ripe avocado only. Serve immediately — browns quickly once cut.",allergen:null},
  {name:"Apple Purée",emoji:"🍎",stage:"Purée",time:"15 min",ingredients:["apple"],how:"Peel, core and chop apple. Simmer in a little water 10 mins until very soft. Blend smooth.",safety:"Always cook until completely soft — raw apple is a choking hazard.",allergen:null},
  {name:"Pear Purée",emoji:"🍐",stage:"Purée",time:"12 min",ingredients:["pear"],how:"Peel, core and chop ripe pear. Simmer 8 mins in a little water until soft. Blend smooth.",safety:"Pear can be softer than apple — check it's fully cooked before blending.",allergen:null},
  {name:"Courgette Purée",emoji:"🥒",stage:"Purée",time:"12 min",ingredients:["courgette"],how:"Chop courgette into chunks. Steam 8–10 mins until very soft. Blend smooth.",safety:"No salt. Courgette has high water content — blend will be naturally thin.",allergen:null},
  {name:"Mango Purée",emoji:"🥭",stage:"Purée",time:"5 min",ingredients:["mango"],how:"Peel ripe mango, remove stone and blend flesh until completely smooth. No cooking needed.",safety:"Use fully ripe mango. Remove all skin and stone.",allergen:null},
  {name:"Broccoli & Sweet Potato Mash",emoji:"🥦🍠",stage:"Purée/Mash",time:"20 min",ingredients:["broccoli","sweet potato"],how:"Steam both until very soft. Mash together with a little breast milk to reach desired consistency.",safety:"Check temperature before serving. Both should be completely soft.",allergen:null},
  {name:"Carrot & Lentil Purée",emoji:"🥕🫘",stage:"Purée",time:"25 min",ingredients:["carrot","lentils"],how:"Simmer rinsed red lentils with chopped carrot in water for 20–25 mins. Blend until smooth.",safety:"Red lentils must be fully cooked and completely soft. No salt.",allergen:null},
  {name:"Banana & Avocado Mash",emoji:"🍌🥑",stage:"Purée",time:"3 min",ingredients:["banana","avocado"],how:"Mash ripe banana and avocado together until smooth. No cooking needed. Serve immediately.",safety:"Use ripe fruit only. Serve immediately — both brown quickly.",allergen:null},
  {name:"Apple & Pear Purée",emoji:"🍎🍐",stage:"Purée",time:"15 min",ingredients:["apple","pear"],how:"Peel, core and chop both fruits. Simmer in a little water for 10 mins until soft. Blend smooth.",safety:"Cook until completely soft — raw apple and pear are choking hazards under 12 months.",allergen:null},
  {name:"Sweet Potato & Lentil Dhal",emoji:"🍠🫘",stage:"Purée/Mash",time:"30 min",ingredients:["sweet potato","lentils"],how:"Simmer cubed sweet potato and rinsed red lentils with a tiny pinch of turmeric for 25 mins. Mash or blend.",safety:"Must be thoroughly cooked. Tiny pinch of turmeric only — no other spices, no salt.",allergen:null},
  {name:"Carrot, Parsnip & Lentil Soup",emoji:"🥕🌿🫘",stage:"Purée",time:"30 min",ingredients:["carrot","parsnip","lentils"],how:"Simmer rinsed red lentils with diced carrot and parsnip in water for 25 mins. Blend smooth.",safety:"No salt or stock cubes. Fully cook until all ingredients are very soft.",allergen:null},
  {name:"Butternut Squash & Carrot Blend",emoji:"🎃🥕",stage:"Purée",time:"25 min",ingredients:["butternut squash","carrot"],how:"Steam both together until very soft. Blend smooth — naturally sweet and vibrant orange.",safety:"Both must be very soft. Test temperature — squash holds heat well.",allergen:null},
  {name:"Pea & Broccoli Purée",emoji:"🫛🥦",stage:"Purée",time:"12 min",ingredients:["pea","broccoli"],how:"Steam broccoli 10 mins. Add peas for final 3 mins. Blend very smooth together.",safety:"Both must be completely smooth — blend thoroughly and pass through sieve if needed.",allergen:null},
  {name:"Mango & Banana",emoji:"🥭🍌",stage:"Purée",time:"3 min",ingredients:["mango","banana"],how:"Blend or mash ripe mango with ripe banana until completely smooth. No cooking required.",safety:"Use only fully ripe fruit. Serve immediately.",allergen:null},
  {name:"Chicken & Carrot Purée",emoji:"🍗🥕",stage:"Purée",time:"30 min",ingredients:["chicken","carrot"],how:"Poach chicken breast in water until fully cooked. Steam carrot separately until soft. Blend together with cooking liquid.",safety:"Chicken must have no pink meat remaining. Remove all fat and skin before blending.",allergen:null},
  {name:"Chicken & Parsnip Mash",emoji:"🍗🌿",stage:"Mash",time:"30 min",ingredients:["chicken","parsnip"],how:"Steam parsnip until very soft. Poach chicken until fully cooked. Mash parsnip, shred chicken finely, combine.",safety:"No pink meat in chicken. Parsnip must be completely soft.",allergen:null},
  {name:"Chicken & Sweet Potato",emoji:"🍗🍠",stage:"Purée/Mash",time:"30 min",ingredients:["chicken","sweet potato"],how:"Poach chicken and steam sweet potato simultaneously. Blend together for purée or mash for older babies.",safety:"Chicken must be fully cooked with no pink. Test temperature — sweet potato holds heat.",allergen:null},
  {name:"Lentil & Courgette Mash",emoji:"🫘🥒",stage:"Mash",time:"25 min",ingredients:["lentils","courgette"],how:"Simmer red lentils until soft. Steam courgette separately. Mash together with a little cooking water.",safety:"Both must be very soft. No salt or seasoning.",allergen:null},
  {name:"Fish & Sweet Potato Mash",emoji:"🐟🍠",stage:"Purée/Mash",time:"25 min",ingredients:["fish","sweet potato"],how:"Steam or bake white fish until cooked. Steam sweet potato until soft. Mash together with a little milk.",safety:"⚠️ Fish allergen. Check carefully for ALL bones before mashing. Cook fish until it flakes easily.",allergen:"Contains fish and dairy"},
  {name:"Scrambled Egg",emoji:"🥚",stage:"Mash",time:"5 min",ingredients:["egg"],how:"Whisk one egg with a splash of whole milk. Cook in unsalted butter over low heat, stirring gently until just set.",safety:"⚠️ Egg allergen — introduce carefully. Cook egg fully until no runny parts remain. No salt.",allergen:"Contains egg and dairy"},
  {name:"Red Lentil Purée",emoji:"🫘",stage:"Purée",time:"25 min",ingredients:["lentils"],how:"Rinse 100g red lentils thoroughly. Simmer in 300ml water for 20–25 mins until very soft. Blend smooth.",safety:"Always cook red lentils thoroughly. One of the best plant-based iron sources.",allergen:null},
  {name:"Salmon & Broccoli Mash",emoji:"🐟🥦",stage:"Mash",time:"20 min",ingredients:["salmon","broccoli"],how:"Bake or steam salmon until cooked through. Steam broccoli until soft. Flake salmon carefully, mash with broccoli.",safety:"⚠️ Fish allergen. Check meticulously for ALL bones. Cook salmon until fully opaque.",allergen:"Contains fish"},
  {name:"Baby Porridge",emoji:"🥣",stage:"Purée/Mash",time:"10 min",ingredients:["oats"],how:"Cook 3 tbsp rolled oats with 150ml whole milk, stirring for 5–7 mins until smooth and thick. Cool before serving.",safety:"⚠️ Oats allergen. Always test temperature — porridge holds heat intensely. No salt or sugar.",allergen:"Contains oats/gluten and dairy"},
  {name:"Porridge with Banana",emoji:"🥣🍌",stage:"Purée/Mash",time:"10 min",ingredients:["oats","banana"],how:"Cook oats with whole milk to make smooth porridge. Stir in mashed ripe banana off the heat for natural sweetness.",safety:"⚠️ Oats allergen. Cool thoroughly before serving. No added sugar ever.",allergen:"Contains oats/gluten and dairy"},
  {name:"Yoghurt with Mashed Banana",emoji:"🥛🍌",stage:"Purée",time:"3 min",ingredients:["full fat yoghurt","banana"],how:"Spoon full-fat plain yoghurt into a bowl. Mash in ripe banana and stir well.",safety:"⚠️ Dairy allergen — introduce carefully. Plain full-fat yoghurt only — never flavoured.",allergen:"Contains dairy"},
  {name:"Mango & Yoghurt",emoji:"🥭🥛",stage:"Purée",time:"5 min",ingredients:["mango","full fat yoghurt"],how:"Blend or mash ripe mango until smooth. Swirl through full-fat plain yoghurt.",safety:"⚠️ Dairy allergen. Use ripe mango only. Plain yoghurt only.",allergen:"Contains dairy"},
  {name:"Cheese on Toast",emoji:"🧀🍞",stage:"Finger Food",time:"8 min",ingredients:["cheese","toast"],how:"Lightly toast bread, grate mild cheese on top, grill until just melted. Cool and cut into finger strips.",safety:"⚠️ Dairy and wheat allergens. Use mild cheese only. Cool fully before serving.",allergen:"Contains dairy and wheat"},
  {name:"Broccoli & Cheese Sauce",emoji:"🥦🧀",stage:"Purée/Mash",time:"20 min",ingredients:["broccoli","cheese"],how:"Steam broccoli until soft. Melt grated cheese in whole milk to make a simple sauce. Combine and mash or blend.",safety:"⚠️ Dairy allergen. Ensure broccoli is completely soft. Serve warm, not hot.",allergen:"Contains dairy"},
  {name:"Scrambled Egg on Toast",emoji:"🥚🍞",stage:"Finger Food",time:"8 min",ingredients:["egg","toast"],how:"Whisk egg, cook gently in unsalted butter until just set. Serve on lightly toasted bread cut into fingers.",safety:"⚠️ Egg and wheat allergens. Cook egg fully. Cut toast into safe finger-sized strips.",allergen:"Contains egg and wheat"},
  {name:"Avocado on Toast",emoji:"🥑🍞",stage:"Finger Food",time:"5 min",ingredients:["avocado","toast"],how:"Mash ripe avocado and spread generously on toast. Cut into finger strips.",safety:"⚠️ Wheat allergen in toast. Use fully ripe avocado only. Cut into safe strips.",allergen:"Contains wheat"},
  {name:"Banana Fingers",emoji:"🍌✋",stage:"Finger Food",time:"1 min",ingredients:["banana"],how:"Peel a ripe banana and cut in half lengthways. Score the cut surface to improve grip. Serve as is.",safety:"Score the surface — ripe banana becomes slippery. Lengthways halves are much safer than coins.",allergen:null},
  {name:"Carrot & Courgette Batons",emoji:"🥕🥒",stage:"Finger Food",time:"20 min",ingredients:["carrot","courgette"],how:"Cut into thick batons. Steam carrot 15 mins, courgette 8 mins. Test — both should squash easily between your fingers.",safety:"Must be soft enough to squash between fingers before serving. Never serve raw.",allergen:null},
  {name:"Sweet Potato Wedges",emoji:"🍠✋",stage:"Finger Food",time:"35 min",ingredients:["sweet potato"],how:"Cut into long thick wedges. Drizzle with a tiny amount of olive oil. Roast at 200°C for 25–30 mins until soft. Cool completely.",safety:"Cool completely before serving — sweet potato holds heat intensely.",allergen:null},
  {name:"Broccoli Florets",emoji:"🥦✋",stage:"Finger Food",time:"12 min",ingredients:["broccoli"],how:"Steam large florets 10–12 mins until very soft but still holding shape. Cool to room temperature. Stalk is the handle.",safety:"Must be completely soft — squash test with fingers before serving. Large florets only.",allergen:null},
  {name:"Oat Pancakes",emoji:"🥞",stage:"Finger Food",time:"20 min",ingredients:["oats","banana","egg"],how:"Blend oats to flour. Mix with mashed banana and beaten egg. Fry small spoonfuls in unsalted butter until set. Cool completely.",safety:"⚠️ Egg and oats allergens. Cook thoroughly. Cool completely before serving.",allergen:"Contains egg and oats/gluten"},
  {name:"Egg & Vegetable Mini Muffins",emoji:"🥚🥦",stage:"Finger Food",time:"25 min",ingredients:["egg","broccoli"],how:"Whisk 2 eggs with a splash of milk. Mix in tiny soft-cooked broccoli pieces. Bake in mini muffin tin at 180°C for 15 mins.",safety:"⚠️ Egg allergen. Must be fully cooked through. Cool completely before serving.",allergen:"Contains egg"},
  {name:"Banana Porridge Fingers",emoji:"🥣✋",stage:"Finger Food",time:"25 min",ingredients:["oats","banana"],how:"Make thick porridge with oats and mashed banana. Spread 1cm thick on baking tray, chill 1 hour until firm, cut into fingers.",safety:"⚠️ Oats allergen. Ensure porridge is fully cooled and firm before cutting.",allergen:"Contains oats/gluten and dairy"},
  {name:"Hummus with Soft Veg",emoji:"🫙🥕",stage:"Finger Food",time:"15 min",ingredients:["hummus","carrot"],how:"Steam carrot batons until very soft. Serve alongside hummus for dipping.",safety:"⚠️ Sesame allergen in hummus. Carrot must be very soft — must squash between fingers.",allergen:"Contains sesame"},
  {name:"Peanut Butter Toast Fingers",emoji:"🥜🍞",stage:"Finger Food",time:"5 min",ingredients:["peanut butter","toast"],how:"Lightly toast bread. Spread a THIN layer of smooth peanut butter. Cut into finger strips.",safety:"⚠️ Peanut and wheat allergens. Smooth PB only — never crunchy. Thin layer only.",allergen:"Contains peanut and wheat"},
  {name:"Peanut Butter Porridge",emoji:"🥜🥣",stage:"Purée/Mash",time:"10 min",ingredients:["oats","peanut butter"],how:"Cook oats with milk to make smooth porridge. Remove from heat, stir in ¼ tsp smooth peanut butter.",safety:"⚠️ Peanut and oat allergens. Introduce peanut butter separately first. Smooth PB only.",allergen:"Contains peanut, oats/gluten and dairy"},
  {name:"Chicken, Carrot & Lentil Stew",emoji:"🍗🥕🫘",stage:"Mash",time:"40 min",ingredients:["chicken","carrot","lentils"],how:"Poach diced chicken with carrot and rinsed red lentils in water for 30 mins until everything is very soft. Mash to texture.",safety:"Chicken must be fully cooked — no pink meat. Freeze well in portions.",allergen:null},
  {name:"Salmon, Sweet Potato & Pea",emoji:"🐟🍠🫛",stage:"Mash",time:"25 min",ingredients:["salmon","sweet potato","pea"],how:"Bake salmon and steam sweet potato simultaneously. Cook peas separately. Flake salmon carefully, mash everything together.",safety:"⚠️ Fish allergen. Check for ALL bones meticulously — even one is dangerous.",allergen:"Contains fish"},
  {name:"Egg Fried Rice",emoji:"🥚🍚",stage:"Mash/Finger Food",time:"15 min",ingredients:["egg","rice"],how:"Cook rice until very soft. Scramble egg separately in unsalted butter. Combine gently. Serve in small soft pieces.",safety:"⚠️ Egg allergen. Cook egg fully. Rice should be very soft. No soy sauce.",allergen:"Contains egg"},
  {name:"Avocado & Yoghurt Dip with Veg",emoji:"🥑🥛🥕",stage:"Finger Food",time:"15 min",ingredients:["avocado","full fat yoghurt","carrot"],how:"Mash ripe avocado with a spoonful of yoghurt to make a dip. Serve with steamed soft carrot batons.",safety:"⚠️ Dairy allergen. Carrot must be very soft. Avocado dip browns — make fresh.",allergen:"Contains dairy"},
];

function getMealSuggestions(selected) {
  if (!selected.length) return [];
  const scored = MEAL_DB.map(meal => {
    const matches = meal.ingredients.filter(i => selected.includes(i)).length;
    const total = meal.ingredients.length;
    const pct = matches / total;
    return {...meal, matches, pct};
  })
  .filter(m => m.matches > 0 && m.pct >= 0.5)
  .sort((a,b) => b.pct - a.pct || b.matches - a.matches)
  .slice(0, 8);
  return scored;
}

function MealsScreen({profile}) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const tried = Object.keys(profile?.foodLog||{}).filter(f=>(profile.foodLog[f]?.length||0)>0);
  const toggle = f => setSelected(p=>p.includes(f)?p.filter(x=>x!==f):[...p,f]);
  const suggestions = getMealSuggestions(selected);
  const filteredFoods = ALL_FOODS.filter(f=>!tried.includes(f) && (search===""||f.includes(search.toLowerCase())));

  return (
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Meal Ideas</div>
        <div style={{fontSize:13,color:"#6B7280",marginTop:4}}>Tick what you have — get instant NHS-safe meal ideas</div>
      </div>
      <div style={{padding:"0 16px 32px"}}>
        {tried.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Already tried ✓</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {tried.map(f=>{
                const sel=selected.includes(f);
                return(
                  <button key={f} onClick={()=>toggle(f)} style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:sel?700:500,background:sel?"#FF6B6B":"#F0FFF4",color:sel?"#fff":"#065F46",border:"none",boxShadow:sel?"0 4px 12px rgba(255,107,107,0.25)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
                    {fe(f)} {cap(f)} {sel?"✓":""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em"}}>All ingredients A–Z</div>
          <div style={{fontSize:11,color:"#9CA3AF"}}>{ALL_FOODS.length} total</div>
        </div>
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search ingredients…"
            style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:14,outline:"none",background:"#FFFFFF",color:"#1A1A2E",boxSizing:"border-box"}}
          />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:16,color:"#9CA3AF",cursor:"pointer",lineHeight:1}}>×</button>}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
          {filteredFoods.length===0
            ? <div style={{fontSize:13,color:"#9CA3AF",padding:"8px 0"}}>No ingredients found for "{search}"</div>
            : filteredFoods.map(f=>{
              const sel=selected.includes(f);
              return(
                <button key={f} onClick={()=>toggle(f)} style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:sel?700:400,background:sel?"#FF6B6B":"#FFFFFF",color:sel?"#fff":"#374151",border:"none",boxShadow:sel?"0 4px 12px rgba(255,107,107,0.25)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
                  {fe(f)} {cap(f)}
                </button>
              );
            })
          }
        </div>
        {selected.length===0&&(
          <div style={{textAlign:"center",padding:"24px 0",color:"#9CA3AF"}}>
            <div style={{fontSize:40,marginBottom:8}}>👆</div>
            <div style={{fontSize:14,fontWeight:600}}>Tap ingredients above</div>
            <div style={{fontSize:13,marginTop:4}}>Meal ideas appear instantly</div>
          </div>
        )}
        {selected.length>0&&suggestions.length===0&&(
          <div style={{background:"#FFF8E7",borderRadius:16,padding:"18px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>🤔</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:4}}>No matches yet</div>
            <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6}}>Try selecting a few more ingredients — most meals need 2–3 to match.</div>
          </div>
        )}
        {suggestions.length>0&&(
          <>
            <div style={{fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>
              {suggestions.length} meal idea{suggestions.length!==1?"s":""} 🍽
            </div>
            {suggestions.map((meal,i)=>(
              <MealCard key={i} meal={meal} selected={selected}/>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MealCard({meal, selected}) {
  const [open, setOpen] = useState(false);
  const missing = meal.ingredients.filter(i=>!selected.includes(i));
  return(
    <div style={{...css.card,marginBottom:12,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",padding:"16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:12}}>
        <span style={{fontSize:36,flexShrink:0}}>{meal.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:"#1A1A2E",marginBottom:5}}>{meal.name}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <span style={{...css.chip,background:"#FEF9C3",color:"#713F12",fontSize:10,padding:"2px 8px"}}>{meal.stage}</span>
            <span style={{...css.chip,background:"#F3F4F6",color:"#6B7280",fontSize:10,padding:"2px 8px"}}>⏱ {meal.time}</span>
            {missing.length>0&&<span style={{...css.chip,background:"#FFF1F2",color:"#FF6B6B",fontSize:10,padding:"2px 8px"}}>+{missing.length} more needed</span>}
          </div>
        </div>
        <span style={{color:"#FF6B6B",fontSize:20,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0deg)",flexShrink:0}}>›</span>
      </button>
      {open&&(
        <div style={{borderTop:"1px solid #F3F4F6",padding:"16px"}}>
          {missing.length>0&&(
            <div style={{background:"#FFF8E7",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#92400E"}}>
              You'll also need: {missing.map(f=>`${fe(f)} ${cap(f)}`).join(", ")}
            </div>
          )}
          <div style={css.label}>How to make</div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.7,marginBottom:12}}>{meal.how}</div>
          <div style={css.label}>Safety</div>
          <div style={{fontSize:13,color:"#374151",lineHeight:1.7,marginBottom:meal.allergen?12:0}}>{meal.safety}</div>
          {meal.allergen&&(
            <div style={{display:"flex",gap:8,background:"#FFFBEB",borderRadius:10,padding:"10px 12px",border:"1px solid #FDE68A"}}>
              <span>⚠️</span>
              <span style={{fontSize:12,color:"#92400E",lineHeight:1.6}}>{meal.allergen}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRACKER SCREEN
// ═══════════════════════════════════════════════════════════════
function TrackerScreen({profile, allFoods, setOverlay}) {
  const [filter, setFilter] = useState("all");
  const tried    = allFoods.filter(f=>(profile.foodLog[f]?.length||0)>0).length;
  const confident = allFoods.filter(f=>(profile.foodLog[f]?.length||0)>=7).length;
  const filtered = allFoods.filter(f=>{
    const c=profile.foodLog[f]?.length||0;
    if(filter==="tried")return c>0;
    if(filter==="not")return c===0;
    return true;
  });
  return(
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Food Tracker</div>
          <button onClick={()=>setOverlay({type:"addFood"})} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(255,107,107,0.3)"}}>+ Add food</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{n:tried,l:"tried",c:"#FF6B6B"},{n:confident,l:"confident",c:"#6BCB77"},{n:allFoods.length-tried,l:"to try",c:"#4D96FF"}].map(x=>(
            <div key={x.l} style={{...css.cardSm,padding:"8px 12px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:x.c}}>{x.n}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px 32px"}}>
        <div style={{display:"flex",background:"#F3F4F6",borderRadius:14,padding:4,marginBottom:14}}>
          {[["all","All"],["tried","Tried"],["not","Not tried"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{flex:1,padding:"9px",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",background:filter===v?"#FFFFFF":"transparent",color:filter===v?"#1A1A2E":"#6B7280",boxShadow:filter===v?"0 2px 8px rgba(26,26,46,0.08)":"none",transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {filtered.map(f=>{
            const log=profile.foodLog[f]||[];
            const st=getStatus(log.length);
            const last=log[log.length-1];
            const days=last?daysSince(last.date):null;
            const lr=last?REACTIONS.find(r=>r.id===last.reaction):null;
            const hasDB=!!FOOD_DB[f];
            return(
              <button key={f} onClick={()=>setOverlay({type:"food",data:f})}
                style={{background:"#FFFFFF",borderRadius:20,display:"flex",flexDirection:"column",padding:"14px",border:`2px solid ${log.length>0?"#FFE4E4":"#F3F4F6"}`,cursor:"pointer",textAlign:"left",position:"relative",boxShadow:"0 4px 16px rgba(26,26,46,0.06)",transition:"transform 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                {hasDB&&<div style={{position:"absolute",top:10,right:10,background:"#FFF1F2",borderRadius:6,padding:"2px 6px",fontSize:9,color:"#FF6B6B",fontWeight:700}}>recipe</div>}
                <div style={{fontSize:38,marginBottom:8}}>{fe(f)}</div>
                <div style={{fontSize:13,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>{cap(f)}</div>
                <span style={{...css.chip,background:st.bg,color:st.text,fontSize:10,padding:"3px 10px",marginBottom:log.length>0?4:0,borderRadius:8,fontWeight:700}}>{st.label}</span>
                {log.length>0&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>{log.length}× {days===0?"today":`${days}d ago`} {lr?.emoji}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEARN SCREEN
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// ALLERGEN SCREEN
// ═══════════════════════════════════════════════════════════════
function AllergenScreen({profile, setProfile}) {
  const [selected, setSelected] = useState(null);
  const allergens = profile.allergens || {};

  const startIntro = (id) => {
    setProfile(p => ({...p, allergens:{...p.allergens, [id]:{introduced: new Date().toISOString(), safe:false, reaction:false}}}));
    setSelected(null);
  };

  const markSafe = (id) => {
    setProfile(p => ({...p, allergens:{...p.allergens, [id]:{...p.allergens[id], safe:true}}}));
    setSelected(null);
  };

  const markReaction = (id) => {
    setProfile(p => ({...p, allergens:{...p.allergens, [id]:{...p.allergens[id], reaction:true}}}));
    setSelected(null);
  };

  const reset = (id) => {
    setProfile(p => { const a={...p.allergens}; delete a[id]; return {...p, allergens:a}; });
    setSelected(null);
  };

  const safeCount = ALLERGENS.filter(a => allergens[a.id]?.safe).length;
  const reactionCount = ALLERGENS.filter(a => allergens[a.id]?.reaction).length;

  return (
    <div className="fadeUp">
      <div style={{padding:"22px 20px 8px"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Allergen Tracker</div>
        <div style={{fontSize:13,color:"#6B7280",marginTop:4,lineHeight:1.6}}>Introduce the top 9 allergens one at a time. Wait 3 days between each to spot any reactions.</div>
      </div>

      {/* Summary row */}
      <div style={{padding:"10px 16px 4px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <div style={{background:"#F0FFF4",borderRadius:14,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#6BCB77"}}>{safeCount}</div>
          <div style={{fontSize:9,color:"#065F46",fontWeight:600}}>introduced safely</div>
        </div>
        <div style={{background:"#FFF1F2",borderRadius:14,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#DC2626"}}>{reactionCount}</div>
          <div style={{fontSize:9,color:"#DC2626",fontWeight:600}}>had reaction</div>
        </div>
        <div style={{background:"#F8F9FF",borderRadius:14,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#6B7280"}}>{9-safeCount-reactionCount}</div>
          <div style={{fontSize:9,color:"#6B7280",fontWeight:600}}>remaining</div>
        </div>
      </div>

      {/* NHS tip */}
      <div style={{margin:"10px 16px",background:"#EFF6FF",borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18,flexShrink:0}}>💡</span>
        <div style={{fontSize:12,color:"#1E40AF",lineHeight:1.6}}>NHS guidance: introduce allergens from around 6 months. Introduce one at a time and wait 3 days before trying the next. If baby has eczema or existing allergies, speak to your GP first.</div>
      </div>

      {/* Allergen cards */}
      <div style={{padding:"4px 16px 32px",display:"flex",flexDirection:"column",gap:8}}>
        {ALLERGENS.map(a => {
          const status = allergens[a.id];
          const isIntroduced = !!status?.introduced;
          const isSafe = !!status?.safe;
          const isReaction = !!status?.reaction;
          const waiting = isIntroduced && !isSafe && !isReaction;
          const daysLeft = waiting ? daysUntilSafe(status.introduced) : 0;
          const isExpanded = selected === a.id;

          let borderColor = "#E8EAF0";
          let bgColor = "#FFFFFF";
          let badgeText = "Not started";
          let badgeBg = "#F3F4F6";
          let badgeColor = "#9CA3AF";

          if (isSafe)     { borderColor="#6BCB77"; bgColor="#F0FFF4"; badgeText="✓ Safely introduced"; badgeBg="#D1FAE5"; badgeColor="#065F46"; }
          if (isReaction) { borderColor="#FF6B6B"; bgColor="#FFF1F2"; badgeText="⚠ Reaction noted"; badgeBg="#FEE2E2"; badgeColor="#DC2626"; }
          if (waiting)    { borderColor="#FFD93D"; bgColor="#FFFBF0"; badgeText=daysLeft===0?"✓ Ready to mark safe":`⏳ ${daysLeft} day${daysLeft!==1?"s":""} to go`; badgeBg="#FEF9C3"; badgeColor="#92400E"; }

          return (
            <div key={a.id}>
              <button onClick={()=>setSelected(isExpanded?null:a.id)} style={{width:"100%",background:bgColor,border:`1.5px solid ${borderColor}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:28,flexShrink:0}}>{a.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:3}}>{a.name}</div>
                  <div style={{display:"inline-block",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:badgeBg,color:badgeColor}}>{badgeText}</div>
                </div>
                <span style={{color:"#9CA3AF",fontSize:18,transition:"transform 0.2s",display:"inline-block",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>›</span>
              </button>

              {isExpanded && (
                <div style={{background:bgColor,border:`1.5px solid ${borderColor}`,borderTop:"none",borderRadius:"0 0 16px 16px",padding:"12px 16px 16px",marginTop:-8}}>
                  <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6,marginBottom:12}}>{a.tip}</div>

                  {!isIntroduced && (
                    <button onClick={()=>startIntro(a.id)} style={{width:"100%",background:"#FF6B6B",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                      Start introduction today
                    </button>
                  )}

                  {waiting && daysLeft === 0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#92400E",marginBottom:4}}>3 days have passed — how did it go?</div>
                      <button onClick={()=>markSafe(a.id)} style={{width:"100%",background:"#6BCB77",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>✓ No reaction — safely introduced!</button>
                      <button onClick={()=>markReaction(a.id)} style={{width:"100%",background:"#FF6B6B",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>⚠ Baby had a reaction</button>
                    </div>
                  )}

                  {waiting && daysLeft > 0 && (
                    <div style={{background:"#FEF9C3",borderRadius:12,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:13,color:"#92400E",fontWeight:600}}>Keep watching for reactions</div>
                      <div style={{fontSize:12,color:"#A16207",marginTop:4}}>Come back in {daysLeft} day{daysLeft!==1?"s":""} to mark as safe or note a reaction.</div>
                    </div>
                  )}

                  {isReaction && (
                    <div style={{background:"#FEE2E2",borderRadius:12,padding:"12px",marginBottom:8}}>
                      <div style={{fontSize:13,color:"#DC2626",fontWeight:700,marginBottom:4}}>⚠ What to do:</div>
                      <div style={{fontSize:12,color:"#991B1B",lineHeight:1.7}}>• Mild symptoms (rash, runny nose): contact your GP<br/>• Severe symptoms (swelling, breathing difficulty): call 999 immediately<br/>• Don't reintroduce without medical advice</div>
                    </div>
                  )}

                  {(isSafe || isReaction) && (
                    <button onClick={()=>reset(a.id)} style={{width:"100%",background:"none",color:"#9CA3AF",border:"1.5px solid #E8EAF0",borderRadius:12,padding:"10px",fontSize:13,cursor:"pointer",marginTop:8}}>
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// JOURNAL SCREEN
// ═══════════════════════════════════════════════════════════════
function JournalScreen({profile, setProfile, allFoods}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [showAddSheet, setShowAddSheet] = useState(false);

  const journal = profile.journal || {};

  function toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit"});
  }

  function formatDateDisplay(key) {
    const [y,m,d] = key.split("-").map(Number);
    const date = new Date(y, m-1, d);
    const todayKey = toDateKey(today);
    if (key === todayKey) return "Today";
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    if (key === toDateKey(yesterday)) return "Yesterday";
    return date.toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long"});
  }

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 0).getDate();
  const firstDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7; // Mon=0

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1));

  const selectedEntries = journal[selectedDate] || [];

  const deleteEntry = (dateKey, idx) => {
    setProfile(p => {
      const entries = [...(p.journal?.[dateKey]||[])];
      entries.splice(idx, 1);
      const newJournal = {...(p.journal||{}), [dateKey]: entries};
      if (entries.length === 0) delete newJournal[dateKey];
      return {...p, journal:newJournal};
    });
  };

  return (
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Food Journal</div>
        <div style={{fontSize:13,color:"#6B7280",marginTop:4}}>Tap a day to see or add entries</div>
      </div>

      {/* Calendar */}
      <div style={{margin:"0 16px",background:"#FFFFFF",borderRadius:20,boxShadow:"0 4px 20px rgba(26,26,46,0.08)",padding:"16px",marginBottom:16}}>
        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={prevMonth} style={{background:"#F3F4F6",border:"none",borderRadius:10,width:32,height:32,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <div style={{fontSize:15,fontWeight:700,color:"#1A1A2E"}}>
            {viewDate.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}
          </div>
          <button onClick={nextMonth} style={{background:"#F3F4F6",border:"none",borderRadius:10,width:32,height:32,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {["M","T","W","T","F","S","S"].map((d,i)=>(
            <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#9CA3AF",paddingBottom:4}}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1;
            const dateKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday = dateKey === toDateKey(today);
            const isSelected = dateKey === selectedDate;
            const hasEntries = (journal[dateKey]||[]).length > 0;
            const hasReaction = (journal[dateKey]||[]).some(e=>e.reaction);

            return (
              <button key={day} onClick={()=>setSelectedDate(dateKey)} style={{
                aspectRatio:"1",borderRadius:10,border:"none",cursor:"pointer",
                fontSize:12,fontWeight:isSelected||isToday?700:400,
                background:isSelected?"#FF6B6B":isToday?"#FFF1F2":"transparent",
                color:isSelected?"#fff":isToday?"#FF6B6B":"#1A1A2E",
                position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {day}
                {hasEntries && !isSelected && (
                  <div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:hasReaction?"#FF6B6B":"#6BCB77"}}/>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      <div style={{padding:"0 16px 100px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E"}}>{formatDateDisplay(selectedDate)}</div>
          <button onClick={()=>setShowAddSheet(true)} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button>
        </div>

        {selectedEntries.length === 0 ? (
          <div style={{background:"#F8F9FF",borderRadius:16,padding:"24px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📝</div>
            <div style={{fontSize:13,color:"#9CA3AF"}}>No entries yet — tap + Add to log a food</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {selectedEntries.map((entry, idx) => (
              <div key={idx} style={{background:"#FFFFFF",borderRadius:14,padding:"12px 14px",boxShadow:"0 2px 8px rgba(26,26,46,0.06)",border:entry.reaction?"1.5px solid #FF6B6B":"1.5px solid #F3F4F6"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:entry.notes?6:0}}>
                      {entry.foods?.map(f=>(
                        <span key={f} style={{background:"#F0FFF4",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#065F46"}}>{fe(f)} {cap(f)}</span>
                      ))}
                      {entry.reaction && <span style={{background:"#FFF1F2",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#DC2626"}}>⚠ Reaction</span>}
                    </div>
                    {entry.notes && <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{entry.notes}</div>}
                    <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>{formatTime(entry.time)}</div>
                  </div>
                  <button onClick={()=>deleteEntry(selectedDate,idx)} style={{background:"none",border:"none",color:"#D1D5DB",fontSize:18,cursor:"pointer",padding:"0 4px",flexShrink:0}}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddSheet && (
        <AddJournalEntry
          date={selectedDate}
          allFoods={allFoods}
          onSave={(entry) => {
            setProfile(p => ({
              ...p,
              journal: {...(p.journal||{}), [selectedDate]: [...(p.journal?.[selectedDate]||[]), entry]},
            }));
            setShowAddSheet(false);
          }}
          onClose={()=>setShowAddSheet(false)}
        />
      )}
    </div>
  );
}

function AddJournalEntry({date, allFoods, onSave, onClose}) {
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [customFood, setCustomFood] = useState("");
  const [notes, setNotes] = useState("");
  const [reaction, setReaction] = useState(false);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  });
  const [search, setSearch] = useState("");

  const toggleFood = f => setSelectedFoods(p => p.includes(f) ? p.filter(x=>x!==f) : [...p,f]);
  const filtered = allFoods.filter(f => !search || f.includes(search.toLowerCase()));

  const save = () => {
    if (selectedFoods.length === 0) return;
    const [h,m] = time.split(":").map(Number);
    const [y,mo,d] = date.split("-").map(Number);
    const dt = new Date(y, mo-1, d, h, m);
    onSave({foods:selectedFoods, notes:notes.trim(), reaction, time:dt.toISOString()});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"flex-end",maxWidth:430,margin:"0 auto"}}>
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",padding:"20px 20px 40px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A1A2E"}}>Log a meal</div>
          <button onClick={onClose} style={{background:"#F3F4F6",border:"none",borderRadius:8,width:28,height:28,fontSize:16,cursor:"pointer"}}>×</button>
        </div>

        {/* Time */}
        <div style={{marginBottom:14}}>
          <label style={{...{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}}>Time</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)}
            style={{width:"100%",padding:"10px 14px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:15,outline:"none",boxSizing:"border-box"}}/>
        </div>

        {/* Foods */}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}>Foods tried</label>
          <div style={{position:"relative",marginBottom:8}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              style={{width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:140,overflowY:"auto"}}>
            {filtered.map(f=>{
              const sel = selectedFoods.includes(f);
              return (
                <button key={f} onClick={()=>toggleFood(f)} style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:sel?700:400,background:sel?"#FF6B6B":"#F3F4F6",color:sel?"#fff":"#374151",border:"none",cursor:"pointer"}}>
                  {fe(f)} {cap(f)}
                </button>
              );
            })}
          </div>

          {/* Custom food */}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <input
              value={customFood}
              onChange={e=>setCustomFood(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){
                  e.preventDefault();
                  const clean=customFood.trim().toLowerCase();
                  if(clean && !selectedFoods.includes(clean)) setSelectedFoods(p=>[...p,clean]);
                  setCustomFood("");
                }
              }}
              placeholder="Add unlisted food…"
              style={{flex:1,padding:"7px 12px",borderRadius:10,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",boxSizing:"border-box"}}
            />
            <button
              onPointerDown={e=>{
                e.preventDefault();
                const clean=customFood.trim().toLowerCase();
                if(clean && !selectedFoods.includes(clean)) setSelectedFoods(p=>[...p,clean]);
                setCustomFood("");
              }}
              style={{padding:"7px 14px",borderRadius:10,background:"#FF6B6B",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",opacity:customFood.trim()?1:0.4}}>
              Add
            </button>
          </div>
          {selectedFoods.filter(f=>!allFoods.includes(f)).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {selectedFoods.filter(f=>!allFoods.includes(f)).map(f=>(
                <span key={f} onClick={()=>setSelectedFoods(p=>p.filter(x=>x!==f))} style={{background:"#F0F4FF",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#4D96FF",cursor:"pointer"}}>✏️ {cap(f)} ×</span>
              ))}
            </div>
          )}
        </div>

        {/* Reaction toggle */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setReaction(r=>!r)} style={{display:"flex",alignItems:"center",gap:8,background:reaction?"#FFF1F2":"#F8F9FF",border:`1.5px solid ${reaction?"#FF6B6B":"#E8EAF0"}`,borderRadius:12,padding:"10px 14px",width:"100%",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:reaction?"#DC2626":"#374151"}}>Mark as reaction</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>Flag this meal if baby had any symptoms</div>
            </div>
            <div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:reaction?"#FF6B6B":"#E8EAF0",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {reaction&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
            </div>
          </button>
        </div>

        {/* Notes */}
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}>Notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Pulled a face but ate half. Seemed to enjoy the texture…"
            style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",resize:"none",height:80,fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>

        <button onClick={save} disabled={selectedFoods.length===0} style={{width:"100%",padding:"14px",background:selectedFoods.length>0?"#FF6B6B":"#E8EAF0",color:selectedFoods.length>0?"#fff":"#9CA3AF",borderRadius:12,border:"none",fontSize:15,fontWeight:700,cursor:selectedFoods.length>0?"pointer":"default"}}>
          Save entry
        </button>
      </div>
    </div>
  );
}

function LearnScreen() {
  const [tab, setTab] = useState("guide");
  const [expanded, setExpanded] = useState(null);
  return(
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Learn & Guide</div>
        <div style={{fontSize:13,color:"#6B7280",marginTop:4}}>Evidence-based weaning support</div>
      </div>
      <div style={{padding:"0 16px 0"}}>
        <div style={{display:"flex",background:"#F3F4F6",borderRadius:14,padding:4,marginBottom:14}}>
          {[["guide","📚 Guide"],["equipment","🛒 Kit"],["faq","❓ FAQ"],["links","🔗 Links"]].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setExpanded(null);}} style={{flex:1,padding:"8px 2px",border:"none",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t?"#FFFFFF":"transparent",color:tab===t?"#1A1A2E":"#6B7280",boxShadow:tab===t?"0 2px 8px rgba(26,26,46,0.08)":"none",transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
      </div>

      {tab==="guide"&&(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#FFF1F2",borderRadius:14,padding:"12px 14px",marginBottom:14,border:"1px solid #FFC9C9"}}>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.7}}>All guidance is based on <strong>NHS Start4Life</strong> and peer-reviewed research. Tap any topic.</div>
          </div>
          {GUIDE_TOPICS.map((section,i)=>(
            <div key={section.title} style={{...css.card,marginBottom:8,overflow:"hidden"}}>
              <button onClick={()=>setExpanded(expanded===`g${i}`?null:`g${i}`)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26,marginRight:12,flexShrink:0}}>{section.icon}</span>
                <span style={{fontSize:14,fontWeight:600,color:"#1A1A2E",flex:1}}>{section.title}</span>
                <span style={{color:"#FF6B6B",fontSize:18,transition:"transform 0.2s",transform:expanded===`g${i}`?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              </button>
              {expanded===`g${i}`&&(
                <div style={{borderTop:"1px solid #F3F4F6",padding:"14px 16px"}} className="fadeUp">
                  <p style={{fontSize:13,color:"#374151",lineHeight:1.8,whiteSpace:"pre-line"}}>{section.body}</p>
                  <div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1E40AF",marginTop:10}}>✓ NHS Start4Life & peer-reviewed guidance</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="equipment"&&(
        <div style={{padding:"0 16px 32px"}}>
          {EQUIPMENT.map(cat=>(
            <div key={cat.category} style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:800,color:"#1A1A2E",marginBottom:10}}>{cat.category}</div>
              {cat.items.map(item=>(
                <div key={item.name} style={{background:cat.color,border:`1.5px solid ${cat.border}`,borderRadius:14,padding:"12px 14px",marginBottom:7,display:"flex",alignItems:"flex-start",gap:10}}>
                  <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E",marginBottom:3}}>{item.name}</div>
                    <div style={{fontSize:12,color:"#6B7280",lineHeight:1.6}}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab==="faq"&&(
        <div style={{padding:"0 16px 32px"}}>
          {FAQ_ITEMS.map((item,i)=>(
            <div key={item.q} style={{...css.card,marginBottom:8,overflow:"hidden"}}>
              <button onClick={()=>setExpanded(expanded===`f${i}`?null:`f${i}`)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:24,marginRight:12,flexShrink:0}}>{item.icon}</span>
                <span style={{fontSize:14,fontWeight:600,color:"#1A1A2E",flex:1}}>{item.q}</span>
                <span style={{color:"#FF6B6B",fontSize:18,transition:"transform 0.2s",transform:expanded===`f${i}`?"rotate(90deg)":"rotate(0deg)"}}>›</span>
              </button>
              {expanded===`f${i}`&&(
                <div style={{borderTop:"1px solid #F3F4F6",padding:"14px 16px"}} className="fadeUp">
                  <p style={{fontSize:13,color:"#374151",lineHeight:1.8}}>{item.a}</p>
                  {item.nhs&&<div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1E40AF",marginTop:10}}>✓ NHS Start4Life aligned</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="links"&&(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#EFF6FF",borderRadius:12,padding:"12px 14px",marginBottom:14,border:"1px solid #BFDBFE"}}>
            <div style={{fontSize:13,color:"#1E40AF",lineHeight:1.7}}>Resources NHS dietitians and weaning specialists recommend — all free, independent, and science-based.</div>
          </div>
          {RESOURCES.map(res=>{
            const tagColor={NHS:"#EFF6FF",Science:"#F0FFF4",Allergy:"#FFF1F2",Research:"#FAF5FF"}[res.tag]||"#F3F4F6";
            const tagText={NHS:"#1E40AF",Science:"#065F46",Allergy:"#9F1239",Research:"#6B21A8"}[res.tag]||"#374151";
            return(
              <div key={res.name} style={{...css.card,padding:"14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",flex:1,lineHeight:1.3,paddingRight:8}}>{res.name}</div>
                  <span style={{...css.chip,background:tagColor,color:tagText,fontSize:10,flexShrink:0}}>{res.tag}</span>
                </div>
                <div style={{fontSize:12,color:"#6B7280",lineHeight:1.6,marginBottom:10}}>{res.desc}</div>
                <button onClick={()=>window.open(res.url,"_blank")} style={{background:"#F8F9FF",border:"1px solid #E8EAF0",borderRadius:8,padding:"7px 12px",fontSize:12,color:"#FF6B6B",fontWeight:600,cursor:"pointer"}}>Open website →</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOD OVERLAY (full screen)
// ═══════════════════════════════════════════════════════════════
function FoodOverlay({food, log, onLog, onDeleteLast, onClose}) {
  const [tab, setTab] = useState("prep");
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const db = FOOD_DB[food];
  const st = getStatus(log.length);
  const last = log[log.length-1];
  const days = last ? daysSince(last.date) : null;
  const lastReaction = last ? REACTIONS.find(r=>r.id===last.reaction) : null;
  return(
    <div style={{position:"fixed",inset:0,background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 20px",textAlign:"center"}} className="fadeUp">
        <div style={{fontSize:64,lineHeight:1,marginBottom:10}}>{fe(food)}</div>
        <h1 style={{fontSize:28,fontWeight:900,color:"#1A1A2E",letterSpacing:"-0.5px"}}>{cap(food)}</h1>
        {db?.allergen&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#FFFBEB",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#92400E",fontWeight:700,marginTop:6,border:"1px solid #FDE68A"}}>
            ⚠️ Allergen: {db.allergen}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10,flexWrap:"wrap"}}>
          <span style={{...css.chip,background:st.bg,color:st.text,fontSize:11}}>{st.label}</span>
          {log.length>0&&<span style={{...css.chip,background:"#F3F4F6",color:"#6B7280",fontSize:11}}>Offered {log.length}× {days===0?"today":`· ${days}d ago`} {lastReaction?.emoji}</span>}
        </div>
      </div>

      {/* Log reaction */}
      <div style={{padding:"0 16px 14px"}}>
        <div style={{...css.card,padding:"14px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>How did it go today?</div>
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
            {REACTIONS.map(r=>(
              <button key={r.id} onClick={()=>onLog(food,r.id)}
                style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:r.color,borderRadius:10,padding:"8px 8px",border:"none",cursor:"pointer",minWidth:52,transition:"transform 0.1s"}}>
                <span style={{fontSize:20}}>{r.emoji}</span>
                <span style={{fontSize:9,fontWeight:600,color:r.text,whiteSpace:"nowrap",textAlign:"center",lineHeight:1.2}}>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Recent log with undo */}
          {log.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>Recent</div>
                <button onClick={onDeleteLast} style={{fontSize:11,color:"#FF6B6B",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>↩ Undo last</button>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[...log].reverse().slice(0,5).map((e,i)=>{
                  const r=REACTIONS.find(x=>x.id===e.reaction);
                  return<span key={i} style={{fontSize:11,background:"#F8F9FF",borderRadius:8,padding:"3px 8px",color:"#6B7280"}}>{r?.emoji} {fmtDate(e.date)}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prep & Recipes */}
      {!db?(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#F8F9FF",borderRadius:12,padding:"16px",fontSize:13,color:"#6B7280",lineHeight:1.7}}>
            No detailed guide yet for {cap(food)}. Use the log above to track when you offer it.
          </div>
        </div>
      ):(
        <>
          <div style={{padding:"0 16px",marginBottom:14}}>
            <div style={{display:"flex",background:"#F3F4F6",borderRadius:14,padding:4}}>
              {[["prep","🥄 Preparation"],["recipes","👩‍🍳 Recipes"]].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",background:tab===t?"#FFFFFF":"transparent",color:tab===t?"#1A1A2E":"#6B7280",boxShadow:tab===t?"0 2px 8px rgba(26,26,46,0.08)":"none",transition:"all 0.15s"}}>{l}</button>
              ))}
            </div>
          </div>

          {tab==="prep"&&(
            <div style={{padding:"0 16px 32px"}}>
              <div style={{...css.card,padding:"18px",marginBottom:12}}>
                <div style={{fontSize:15,fontWeight:800,color:"#1A1A2E",marginBottom:12}}>How to prepare</div>
                {db.prep.map((step,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:"#FFF1F2",border:"2px solid #FF6B6B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#FF6B6B",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.65,paddingTop:3}}>{step}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:"16px"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#1A1A2E",marginBottom:10}}>🛡️ Safety notes</div>
                {db.safety.map((note,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                    <span style={{color:note.startsWith("⚠️")?"#FF6B6B":"#9CA3AF",flexShrink:0,marginTop:1}}>•</span>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.65}}>{note.replace("⚠️ ","")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="recipes"&&(
            <div style={{padding:"0 16px 32px"}}>
              <p style={{fontSize:13,color:"#6B7280",marginBottom:14,lineHeight:1.6}}>{db.recipes.length} recipe{db.recipes.length!==1?"s":""} — from first purées to finger foods. Tap to expand.</p>
              {db.recipes.map((recipe,i)=>(
                <div key={i} style={{...css.card,marginBottom:10,overflow:"hidden"}}>
                  <button onClick={()=>setExpandedRecipe(expandedRecipe===i?null:i)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",gap:10}}>
                    <span style={{fontSize:32,flexShrink:0}}>{recipe.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700,color:"#1A1A2E",marginBottom:4}}>{recipe.name}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <span style={{...css.chip,background:STAGE_COLOR[recipe.stage],fontSize:10,padding:"2px 7px"}}>{STAGE_LABEL[recipe.stage]}</span>
                        <span style={{...css.chip,background:"#F3F4F6",color:"#6B7280",fontSize:10,padding:"2px 7px"}}>⏱ {recipe.time}</span>
                        <span style={{...css.chip,background:"#F3F4F6",color:"#6B7280",fontSize:10,padding:"2px 7px"}}>🍼 {recipe.serves}</span>
                      </div>
                    </div>
                    <span style={{color:"#FF6B6B",fontSize:20,transition:"transform 0.2s",transform:expandedRecipe===i?"rotate(90deg)":"rotate(0deg)"}}>›</span>
                  </button>
                  {expandedRecipe===i&&(
                    <div style={{borderTop:"1px solid #F3F4F6",padding:"14px 16px"}} className="fadeUp">
                      <div style={css.label}>Ingredients</div>
                      {recipe.ingredients.map((ing,j)=>(
                        <div key={j} style={{display:"flex",gap:7,marginBottom:5}}>
                          <span style={{color:"#FF6B6B",fontSize:13}}>•</span>
                          <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{ing}</span>
                        </div>
                      ))}
                      <div style={{...css.label,marginTop:12}}>Method</div>
                      {recipe.method.map((step,j)=>(
                        <div key={j} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:"#FF6B6B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0,marginTop:1}}>{j+1}</div>
                          <div style={{fontSize:13,color:"#374151",lineHeight:1.65}}>{step}</div>
                        </div>
                      ))}
                      {recipe.tip&&(
                        <div style={{display:"flex",gap:7,background:"#FFFBEB",borderRadius:10,padding:"10px",marginTop:8}}>
                          <span>💡</span>
                          <span style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{recipe.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS OVERLAY
// ═══════════════════════════════════════════════════════════════
function ProgressOverlay({profile, allFoods, onClose}) {
  const log = profile.foodLog;
  const tried = allFoods.filter(f=>(log[f]?.length||0)>0);
  const confident = allFoods.filter(f=>(log[f]?.length||0)>=7);
  const allergens = ["egg","fish","peanut butter","oats","full fat yoghurt","toast","pasta","cheese","hummus","tofu"];
  const allergensTried = allergens.filter(a=>(log[a]?.length||0)>0);

  const categories = [
    {label:"Vegetables 🥦",foods:["broccoli","carrot","parsnip","sweet potato","butternut squash","pea","courgette","cauliflower","spinach","sweet corn","cucumber","tomato"]},
    {label:"Fruit 🍓",foods:["banana","avocado","pear","apple","mango","peach","plum","blueberry","strawberry"]},
    {label:"Protein 🍗",foods:["chicken","fish","egg","lentils","tofu","beef","lamb","salmon"]},
    {label:"Dairy & Grains 🥛",foods:["full fat yoghurt","cheese","oats","porridge","toast","pasta","rice","pitta","hummus"]},
  ];

  return(
    <div style={{position:"fixed",inset:0,background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 32px"}} className="fadeUp">
        <h2 style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Progress</h2>
        <p style={{fontSize:13,color:"#6B7280",marginBottom:20}}>Your baby's weaning journey so far</p>

        {/* Big stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[
            {n:tried.length,l:"Foods tried",c:"#FF6B6B",icon:"🍽"},
            {n:confident.length,l:"Confident",c:"#6BCB77",icon:"💪"},
            {n:allergensTried.length,l:"Allergens introduced",c:"#4D96FF",icon:"⭐"},
            {n:allFoods.length-tried.length,l:"Still to try",c:"#C77DFF",icon:"🌱"},
          ].map(x=>(
            <div key={x.l} style={{...css.card,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:4}}>{x.icon}</div>
              <div style={{fontSize:32,fontWeight:900,color:x.c}}>{x.n}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{x.l}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{...css.card,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:10}}>Overall progress</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{flex:1,background:"#F3F4F6",borderRadius:99,height:12,overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,(tried.length/allFoods.length)*100)}%`,height:"100%",background:"linear-gradient(90deg,#FF6B6B,#FFD93D)",borderRadius:99,transition:"width 0.5s"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:"#1A1A2E",flexShrink:0}}>{Math.round((tried.length/allFoods.length)*100)}%</span>
          </div>
          <div style={{fontSize:12,color:"#6B7280"}}>{tried.length} of {allFoods.length} foods tried</div>
        </div>

        {/* Allergen progress */}
        <div style={{...css.card,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:12}}>Allergen introduction</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {allergens.map(a=>{
              const done=(log[a]?.length||0)>0;
              return(
                <div key={a} style={{display:"flex",alignItems:"center",gap:5,background:done?"#F0FFF4":"#F8F9FF",borderRadius:20,padding:"5px 10px",border:`1px solid ${done?"#6BCB77":"#E8EAF0"}`}}>
                  <span style={{fontSize:12}}>{fe(a)}</span>
                  <span style={{fontSize:11,fontWeight:600,color:done?"#065F46":"#9CA3AF"}}>{cap(a)}</span>
                  {done&&<span style={{fontSize:11,color:"#6BCB77"}}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* By category */}
        {categories.map(cat=>{
          const catTried = cat.foods.filter(f=>(log[f]?.length||0)>0);
          return(
            <div key={cat.label} style={{...css.card,padding:"16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E"}}>{cat.label}</div>
                <span style={{fontSize:12,color:"#6B7280",fontWeight:600}}>{catTried.length}/{cat.foods.length}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {cat.foods.map(f=>{
                  const c=(log[f]?.length||0);
                  const st=getStatus(c);
                  return(
                    <div key={f} style={{display:"flex",alignItems:"center",gap:4,background:st.bg,borderRadius:20,padding:"3px 9px",border:`1px solid ${st.color}`}}>
                      <span style={{fontSize:12}}>{fe(f)}</span>
                      <span style={{fontSize:10,fontWeight:600,color:st.text}}>{cap(f)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BADGES OVERLAY
// ═══════════════════════════════════════════════════════════════
function BadgesOverlay({profile, onClose}) {
  const earned = profile.earnedBadges||[];
  const pct = Math.round((earned.length/BADGES.length)*100);
  return(
    <div style={{position:"fixed",inset:0,background:"#FFF8F5",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 32px"}} className="fadeUp">
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:52,marginBottom:8}}>🏅</div>
          <h2 style={{fontSize:26,fontWeight:900,color:"#1A1A2E",marginBottom:4}}>Your Badges</h2>
          <p style={{fontSize:13,color:"#9CA3AF"}}>{earned.length} of {BADGES.length} unlocked</p>
        </div>

        {/* Progress bar */}
        <div style={{background:"#FFFFFF",borderRadius:20,padding:"18px",marginBottom:20,boxShadow:"0 4px 20px rgba(255,107,107,0.08)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1A1A2E"}}>Progress</span>
            <span style={{fontSize:20,fontWeight:900,color:"#FF6B6B"}}>{pct}%</span>
          </div>
          <div style={{background:"#F3F4F6",borderRadius:99,height:12,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#FF6B6B,#FFD93D)",borderRadius:99,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{fontSize:12,color:"#9CA3AF",marginTop:8}}>{earned.length===BADGES.length?"🎉 You've earned them all!":  `${BADGES.length-earned.length} more to go — keep exploring!`}</div>
        </div>

        {/* Badge grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {BADGES.map(b=>{
            const isEarned=earned.includes(b.id);
            return(
              <div key={b.id} style={{background:isEarned?"#FFFFFF":"#F9FAFB",borderRadius:20,padding:"18px 14px",textAlign:"center",opacity:isEarned?1:0.55,position:"relative",overflow:"hidden",boxShadow:isEarned?"0 4px 20px rgba(255,217,61,0.15)":"none",border:isEarned?"2px solid #FFD93D22":"2px solid #F3F4F6"}}>
                {isEarned&&<div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#FFD93D,#FF6B6B)",borderRadius:"20px 20px 0 0"}}/>}
                <div style={{fontSize:42,marginBottom:8,filter:isEarned?"none":"grayscale(1) opacity(0.4)"}}>{b.emoji}</div>
                <div style={{fontSize:13,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>{b.name}</div>
                <div style={{fontSize:11,color:"#6B7280",lineHeight:1.5}}>{b.desc}</div>
                {isEarned&&<div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,background:"#F0FFF4",borderRadius:8,padding:"3px 10px",fontSize:11,color:"#16A34A",fontWeight:700}}>✓ Earned!</div>}
                {!isEarned&&<div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,background:"#F3F4F6",borderRadius:8,padding:"3px 10px",fontSize:11,color:"#9CA3AF",fontWeight:600}}>🔒 Locked</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS OVERLAY
// ═══════════════════════════════════════════════════════════════
function SettingsOverlay({state, update, baby, setProfile, onAddBaby, onClose, onSignOut, onUpdateBaby}) {
  const [name, setName] = useState(baby.name);
  const [dob, setDob] = useState(baby.dob);
  const [photo, setPhoto] = useState(baby.photo||null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    update(s=>({...s,babies:s.babies.map(b=>b.id===baby.id?{...b,name:name.trim(),dob,photo}:b)}));
    try { await onUpdateBaby(baby.id, {name:name.trim(), dob, photo}); } catch {}
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#F8F9FF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 40px"}} className="fadeUp">
        <h2 style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:20}}>Settings</h2>

        {state.babies.length>1&&(
          <div style={{marginBottom:22}}>
            <div style={css.label}>Switch baby</div>
            {state.babies.map(b=>(
              <div key={b.id} style={{...css.card,display:"flex",alignItems:"center",padding:"12px 14px",marginBottom:8,border:b.id===state.activeBabyId?"2px solid #FF6B6B":"none"}}>
                <div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",marginRight:12,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {b.photo?<img src={b.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:20}}>👶</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E"}}>{b.name}</div>
                  <div style={{fontSize:11,color:"#6B7280"}}>{monthsOld(b.dob)} months old</div>
                </div>
                {b.id!==state.activeBabyId
                  ?<button onClick={()=>{ update(s=>({...s,activeBabyId:b.id})); onClose(); }} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:8,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Switch</button>
                  :<span style={{fontSize:12,color:"#FF6B6B",fontWeight:700}}>Active</span>
                }
              </div>
            ))}
          </div>
        )}

        <div style={{marginBottom:22}}>
          <div style={css.label}>Edit {baby.name}</div>
          <div style={{...css.card,padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <button onClick={()=>fileRef.current?.click()} style={{width:70,height:70,borderRadius:"50%",border:"2.5px dashed #E8EAF0",background:photo?"transparent":"#F8F9FF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                {photo?<img src={photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:22}}>📷</div><div style={{fontSize:9,color:"#9CA3AF"}}>Change</div></div>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </div>
            <label style={css.label}>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={{...css.input,marginBottom:14}}/>
            <label style={css.label}>Date of birth</label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{...css.input,marginBottom:16}}/>
            <button onClick={save} style={{...css.btnPrimary,background:saved?"#6BCB77":"#FF6B6B"}}>
              {saved?"✓ Saved!":"Save changes"}
            </button>
          </div>
        </div>

        <button onClick={onAddBaby} style={{...css.btnSecondary,marginBottom:10,borderColor:"#6BCB77",color:"#065F46",background:"#F0FFF4"}}>+ Add another baby</button>

        {state.babies.length>1&&(
          <button onClick={()=>{update(s=>{const nb=s.babies.filter(b=>b.id!==baby.id);return{...s,babies:nb,activeBabyId:nb[0]?.id||null};});onClose();}} style={{...css.btnSecondary,borderColor:"#FFC9C9",color:"#DC2626",background:"#FFF1F2"}}>
            Remove {baby.name}
          </button>
        )}

        <div style={{borderTop:"1px solid #F3F4F6",marginTop:16,paddingTop:16}}>
          <button onClick={onSignOut} style={{...css.btnSecondary,color:"#6B7280",fontSize:14}}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BADGE TOAST
// ═══════════════════════════════════════════════════════════════
function BadgeToast({badges, onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  const b = badges[0];
  return(
    <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:300,width:"calc(100% - 32px)",maxWidth:380}} className="popIn">
      <div style={{background:"#1A1A2E",borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(26,26,46,0.3)"}}>
        <div style={{fontSize:36}}>{b.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#FFD93D",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Badge unlocked! 🎉</div>
          <div style={{fontSize:15,fontWeight:700,color:"#FFFFFF"}}>{b.name}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:1}}>{b.desc}</div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM SHEETS
// ═══════════════════════════════════════════════════════════════
function ReactionSheet({food, log, onLog, onClose}) {
  const st = getStatus(log.length);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:"#F8F9FF",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"22px 18px 44px",animation:"slideUp 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 18px"}}/>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:52}}>{fe(food)}</div>
          <div style={{fontSize:22,fontWeight:800,color:"#1A1A2E"}}>{cap(food)}</div>
          <span style={{...css.chip,background:st.bg,color:st.text,fontSize:11,marginTop:6}}>{st.label} · {log.length} offer{log.length!==1?"s":""}</span>
        </div>
        <div style={css.label}>How did it go today?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {REACTIONS.map(r=>(
            <button key={r.id} onClick={()=>onLog(food,r.id)} style={{background:r.color,border:"none",borderRadius:14,padding:"13px 8px",fontSize:14,color:r.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontWeight:600}}>
              {r.emoji}{r.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{...css.btnSecondary}}>Cancel</button>
      </div>
    </div>
  );
}

function AddFoodSheet({onAdd, onClose}) {
  const [name, setName] = useState("");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{background:"#F8F9FF",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"22px 18px 44px",animation:"slideUp 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 18px"}}/>
        <div style={{fontSize:20,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Add a custom food</div>
        <p style={{fontSize:13,color:"#6B7280",marginBottom:16,lineHeight:1.6}}>Can't find a food in the list? Add it here and track it like any other.</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. papaya, lamb, kale..." style={{...css.input,marginBottom:14}}/>
        <button onClick={()=>{onAdd(name);setName("");}} disabled={!name.trim()} style={{...css.btnPrimary,opacity:name.trim()?1:0.4,marginBottom:8}}>Add food</button>
        <button onClick={onClose} style={css.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════
function BottomNav({screen, setScreen, weaningComplete, allergenAlert}) {
  const items = [
    {id:"home",    label:"Home",    emoji:"🏠"},
    {id:"plan",    label:"Plan",    emoji:"📋", hide:weaningComplete, alert:allergenAlert},
    {id:"meals",   label:"Meals",   emoji:"🥗"},
    {id:"tracker", label:"Tracker", emoji:"📊"},
    {id:"journal", label:"Journal", emoji:"📅"},
    {id:"learn",   label:"Learn",   emoji:"📚"},
  ].filter(x=>!x.hide);
  return(
    <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#FFFFFF",borderTop:"1px solid #F3F4F6",display:"flex",zIndex:50,boxShadow:"0 -4px 20px rgba(26,26,46,0.06)"}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>setScreen(item.id)} style={{flex:1,padding:"10px 4px 14px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.1s"}}>
          <div style={{position:"relative",display:"inline-block"}}>
            <span style={{fontSize:20}}>{item.emoji}</span>
            {item.alert&&<div style={{position:"absolute",top:-2,right:-4,width:8,height:8,borderRadius:"50%",background:"#FF6B6B",border:"1.5px solid white"}}/>}
          </div>
          <span style={{fontSize:10,fontWeight:screen===item.id?700:500,color:screen===item.id?"#FF6B6B":"#9CA3AF"}}>{item.label}</span>
          {screen===item.id&&<div style={{width:16,height:3,borderRadius:2,background:"#FF6B6B",marginTop:-2}}/>}
        </button>
      ))}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
function ActionCard({emoji, label, sub, onClick, color, accent}) {
  return(
    <button onClick={onClick} style={{background:color,borderRadius:20,padding:"18px 16px",display:"flex",flexDirection:"column",alignItems:"flex-start",border:`2px solid ${accent}22`,cursor:"pointer",boxShadow:`0 4px 20px ${accent}22`,textAlign:"left",transition:"transform 0.15s, box-shadow 0.15s",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px ${accent}44`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 4px 20px ${accent}22`;}}>
      <div style={{position:"absolute",bottom:-10,right:-10,fontSize:56,opacity:0.1,lineHeight:1,pointerEvents:"none"}}>{emoji}</div>
      <div style={{width:42,height:42,borderRadius:13,background:accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:12,boxShadow:`0 4px 12px ${accent}55`}}>{emoji}</div>
      <span style={{fontSize:14,fontWeight:800,color:"#1A1A2E",marginBottom:3}}>{label}</span>
      <span style={{fontSize:11,color:"#6B7280",fontWeight:500}}>{sub}</span>
    </button>
  );
}

function LoadingDots() {
  return(
    <div style={{display:"flex",gap:7,justifyContent:"center",padding:"18px 0"}}>
      {[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:"#FF6B6B",animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
    </div>
  );
}
