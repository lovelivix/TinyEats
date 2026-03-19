export const GUIDE_TOPICS = [
  {icon:"🌱",title:"Why 6 months?",body:"Before 6 months, babies' guts, kidneys and digestive systems are still developing. Introducing food too early can increase the risk of allergies, obesity and infections.\n\nThe NHS recommends around 6 months — never before 17 weeks (4 months). At 6 months, breast milk or formula still provides most of baby's nutrition. Food at this stage is about learning, not calories."},
  {icon:"🥄",title:"How much will they eat?",body:"Much less than you expect! Start with 1–2 teaspoons once a day. By 9 months, three small meals a day is the target. By 12 months, baby should be eating family foods.\n\nThere are no set amounts — your baby signals when they've had enough. Always follow their lead and never force feed."},
  {icon:"🍼",title:"What about milk feeds?",body:"Milk remains the main nutrition source for the whole first year. You don't need to reduce milk feeds when starting weaning.\n\nGradually, as baby eats more food, they'll naturally reduce milk intake. Formula-fed babies generally have around 500–600ml per day by 12 months."},
  {icon:"✋",title:"Baby-led vs purée",body:"Both approaches are safe and effective. Many families combine both. The NHS supports either approach.\n\nWhat matters most is offering a variety of flavours, textures, and nutrients — not the method you use."},
  {icon:"🩸",title:"Iron: most important nutrient",body:"Iron is the most critical nutrient in early weaning. Babies' iron stores from birth last around 6 months — which is one reason weaning starts then.\n\nIron-rich foods: red meat, chicken, fish, eggs, lentils, beans, fortified cereals. Vitamin C helps absorb plant-based iron — serve them together."},
  {icon:"⚠️",title:"The top 14 allergens",body:"The top 14 allergens: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat/gluten, soya, sesame, mustard, celery, lupin, molluscs, sulphites.\n\nNHS recommends introducing each one individually from around 6 months. Early introduction reduces allergy risk. Signs of reaction: rash, hives, swelling, vomiting, breathing difficulty. Call 999 if breathing is affected."},
  {icon:"🫁",title:"Gagging is normal",body:"Gagging is a normal and protective reflex. Young babies have their gag reflex further forward in the mouth — a safety feature that moves back as they develop.\n\nGagging is loud and baby recovers quickly. Choking is different: silent, baby cannot cough, cry or breathe. Act immediately and call 999."},
  {icon:"🥣",title:"Why texture matters",body:"Moving through textures — smooth purées to soft lumps to chopped pieces — is important for development. Babies who stay on smooth food too long can become resistant to lumps.\n\nTexture progression also supports speech development, as chewing uses the same muscles as talking."},
];

export const FAQ_ITEMS = [
  {icon:"🫁",q:"Gagging vs choking",a:"Gagging is normal, loud and protective. Choking is silent and serious. If baby cannot cough, cry or breathe — act immediately and call 999.",nhs:true},
  {icon:"🥄",q:"How much should baby eat?",a:"Start with 1–2 teaspoons once a day. No set amounts — follow baby's lead. A refused meal is fine. Milk is still the main nutrition until 12 months. Never force feed.",nhs:true},
  {icon:"😤",q:"Baby keeps spitting food out",a:"Completely normal. The tongue-thrust reflex fades gradually. Spitting is also how babies explore. Keep offering — it can take 8–15+ exposures.",nhs:true},
  {icon:"⚠️",q:"When to introduce allergens",a:"NHS recommends introducing the top 14 allergens one at a time from around 6 months. One at a time, wait ~30 mins, watch for reactions. Early introduction reduces long-term allergy risk.",nhs:true},
  {icon:"🧂",q:"Salt and sugar rules",a:"No added salt under 1 year — baby kidneys cannot cope. No honey under 1 year (botulism risk). Avoid processed foods and high-salt takeaways.",nhs:true},
  {icon:"💧",q:"What can baby drink?",a:"Breast milk or formula is the main drink. Cooled boiled water with meals from 6 months. Open cup or free-flow beaker — not a bottle. No juice or squash.",nhs:true},
  {icon:"🛡️",q:"Reducing choking risk",a:"Always sit upright. Never leave alone during meals. Halve grapes and tomatoes. Remove ALL fish bones. Cook veg until very soft. No whole nuts under 5 years.",nhs:true},
  {icon:"🙅",q:"Refusing all food",a:"Very common. Keep meals short, relaxed, pressure-free. It can take 15+ exposures. Every offer counts — even when nothing is eaten.",nhs:false},
];

export const EQUIPMENT = [
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

export const RESOURCES = [
  {name:"NHS Start4Life Weaning Guide",url:"https://www.nhs.uk/start4life/weaning/",desc:"The official NHS guide — evidence-based, clear, and free.",tag:"NHS"},
  {name:"NHS – What to feed young children",url:"https://www.nhs.uk/conditions/baby/weaning-and-feeding/what-to-feed-young-children/",desc:"Safe foods, foods to avoid, and building a balanced diet.",tag:"NHS"},
  {name:"First Steps Nutrition",url:"https://www.firststepsnutrition.org",desc:"Independent, NHS-endorsed nutrition charity. No commercial bias.",tag:"Science"},
  {name:"British Dietetic Association",url:"https://www.bda.uk.com",desc:"Professional body for UK dietitians. Peer-reviewed guidance.",tag:"Science"},
  {name:"Allergy UK",url:"https://www.allergyuk.org",desc:"Leading UK allergy charity. Essential for allergen introduction.",tag:"Allergy"},
  {name:"The LEAP Study",url:"https://www.leapstudy.co.uk",desc:"The landmark study proving early peanut intro reduces allergy risk.",tag:"Research"},
];

export const FOODS_TO_AVOID = [
  {emoji:"🍯",name:"Honey",severity:"never",age:"Under 1 year",reason:"Risk of infant botulism — a rare but serious form of food poisoning. Honey can contain Clostridium botulinum spores that a baby's immature gut cannot fight. This includes raw, cooked and pasteurised honey."},
  {emoji:"🧂",name:"Added salt",severity:"never",age:"Under 1 year",reason:"Baby kidneys cannot process salt. No added salt to cooking, and avoid salty foods like crisps, bacon, processed meats, stock cubes, soy sauce and ready meals. Keep under 1g salt per day."},
  {emoji:"🍬",name:"Added sugar",severity:"never",age:"Under 1 year",reason:"Damages emerging teeth and encourages a sweet preference. Avoid sweet biscuits, cakes, sweets and sugary drinks. Fruit is fine — its natural sugar is packaged with fibre and nutrients."},
  {emoji:"🐟",name:"Shark, swordfish & marlin",severity:"never",age:"Under 16 years",reason:"These fish contain high levels of mercury which can harm a developing nervous system. Avoid completely. Tuna is fine in moderation — max 2 portions per week."},
  {emoji:"🥛",name:"Unpasteurised dairy",severity:"never",age:"Under 1 year",reason:"Unpasteurised (raw) milk and cheese can contain harmful bacteria including Listeria, Salmonella and E. coli. Always choose pasteurised products. Avoid brie, camembert, soft blue cheeses."},
  {emoji:"🍚",name:"Rice milk",severity:"never",age:"Under 5 years",reason:"Rice milk contains inorganic arsenic which is harmful to young children. Do not use as a milk alternative for under 5s. Oat, soya or unsweetened almond milk are safer alternatives after 1 year."},
  {emoji:"🧃",name:"Fruit juice & smoothies",severity:"avoid",age:"Under 1 year",reason:"Even unsweetened juice is high in free sugars and damages teeth. If given to older toddlers, dilute heavily (1 part juice to 10 parts water) and only with meals. Whole fruit is always better."},
  {emoji:"🍵",name:"Tea & coffee",severity:"never",age:"Under 1 year",reason:"Tannins in tea reduce iron absorption. Caffeine affects sleep and development. Never add to food or give as a drink."},
  {emoji:"🧀",name:"Mould-ripened & blue cheese",severity:"avoid",age:"Under 1 year",reason:"Soft cheeses like brie, camembert and blue varieties may contain Listeria. Hard pasteurised cheeses (cheddar, edam) and pasteurised soft cheeses (cream cheese, cottage cheese) are fine."},
  {emoji:"🥚",name:"Raw or runny eggs",severity:"avoid",age:"Under 1 year",reason:"Only UK Lion-stamped eggs can be given runny or lightly cooked. All other eggs must be fully cooked with set white and yolk. Never give raw egg in any form."},
  {emoji:"🫘",name:"Whole nuts",severity:"never",age:"Under 5 years",reason:"A serious choking hazard. Smooth nut butters are fine from 6 months when thinned with water. Never give whole or roughly chopped nuts to under 5s."},
];

export const CHOKING_HAZARDS = [
  {emoji:"🍇",name:"Whole grapes & cherries",prep:"Always halve lengthways. For under 2s, quarter them. Remove stones completely. The round shape and slippery skin make whole grapes one of the highest-risk choking foods."},
  {emoji:"🫛",name:"Whole peas",prep:"Lightly mash or crush before serving to young babies. The round shape is a choking risk. Older babies with good chewing can manage whole peas, but always watch closely."},
  {emoji:"🍒",name:"Cherry tomatoes",prep:"Always halve or quarter. Never serve whole. The skin is slippery and the shape is exactly the wrong size for a baby's airway."},
  {emoji:"🥕",name:"Raw hard veg",prep:"Raw carrot, apple, celery and similar hard foods must always be cooked until soft or finely grated. Never serve as hard chunks or sticks."},
  {emoji:"🌽",name:"Popcorn",prep:"Never give to under 5s. Irregular shape, hard pieces and fluffy texture make it impossible to chew safely. A serious choking hazard at any young age."},
  {emoji:"🍬",name:"Hard sweets & boiled sweets",prep:"Never give to babies or toddlers. Hard round sweets are one of the most common choking hazards in children."},
  {emoji:"🥜",name:"Whole nuts & seeds",prep:"Never whole under 5 years. Smooth butters are fine from 6 months when properly thinned. Avoid seeded bread for young babies."},
  {emoji:"🐟",name:"Fish with bones",prep:"Always remove every single bone before serving. Run fingers along the flesh and check twice. Pin bones in salmon are particularly small and hard to spot."},
  {emoji:"🍓",name:"Large pieces of fruit",prep:"Cut into small pieces appropriate for age. Avoid large wedges of hard fruit. Melon and watermelon should be cut small with rind removed."},
  {emoji:"🍞",name:"Thick blobs of sticky food",prep:"Thick nut butter, large lumps of cheese or sticky dried fruit can stick in the throat. Always thin nut butters, cut cheese small, and avoid whole dried fruit like raisins for young babies."},
];
