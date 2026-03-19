export const ALL_FOODS = [...new Set([
  "broccoli","carrot","parsnip","sweet potato","butternut squash","pea","courgette",
  "banana","avocado","pear","apple","mango","peach","plum","blueberry","strawberry",
  "chicken","lentils","full fat yoghurt","oats","fish","tofu","egg","salmon","beef","lamb",
  "toast","pasta","rice","cheese","porridge","hummus","pitta","peanut butter",
  "tomato","cucumber","cauliflower","sweet corn","spinach",
])].sort();


export const FOOD_DB = {
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


export const STAGE_LABEL = {1:"Purée",2:"Mash/Lumps",3:"Finger Food"};
export const STAGE_COLOR = {1:"#FEF9C3",2:"#DBEAFE",3:"#DCFCE7"};

function defaultProfile() {
  return {weaningStarted:false,weaningStartDate:null,activeWeek:0,foodLog:{},shoppingChecked:{},customFoods:[],earnedBadges:[],seenBadges:[],allergens:{},journal:{}};

export const ALLERGENS = [
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

export const ALLERGEN_WAIT_DAYS = 3;
export function daysAgo(isoDate) { return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000*60*60*24)); }
export function daysUntilSafe(isoDate) { return Math.max(0, ALLERGEN_WAIT_DAYS - daysAgo(isoDate)); }

// ═══════════════════════════════════════════════════════════════
// ─── MEAL DATABASE ────────────────────────────────────────────

export const MEAL_DB = [
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
