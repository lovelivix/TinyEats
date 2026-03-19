export const THEME = {
  primary:"#F25F4C", secondary:"#F2B705", green:"#7FB069",
  blue:"#6FA3D2", purple:"#C77DFF",
  white:"#FFFFFF", bg:"#FFFFFF", surface:"#FFFFFF",
  text:"#1A1A2E", textSoft:"#6B7280", border:"#E8EAF0",
  shadow:"0 4px 20px rgba(26,26,46,0.08)", shadowSm:"0 2px 8px rgba(26,26,46,0.06)",
  radius:20, radiusSm:12,
};

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  html,body{background:#FFFFFF;font-family:'Plus Jakarta Sans',sans-serif;}
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

export const FOOD_EMOJI = {
  broccoli:"🥦",carrot:"🥕",parsnip:"🌿","sweet potato":"🍠","butternut squash":"🎃",
  pea:"🫛",courgette:"🥒",banana:"🍌",avocado:"🥑",pear:"🍐",apple:"🍎",
  mango:"🥭",peach:"🍑",plum:"🍇",chicken:"🍗",lentils:"🫘","full fat yoghurt":"🥛",
  oats:"🌾",fish:"🐟",tofu:"🫙",egg:"🥚",toast:"🍞",pasta:"🍝",rice:"🍚",
  cheese:"🧀",porridge:"🥣",hummus:"🫙",pitta:"🫓","peanut butter":"🥜",
  salmon:"🐟",tomato:"🍅",cucumber:"🥒",cauliflower:"🥬","sweet corn":"🌽",
  blueberry:"🫐",strawberry:"🍓",spinach:"🥬",beef:"🥩",lamb:"🥩",
};
export const fe = f => FOOD_EMOJI[(f||"").toLowerCase()] || "🍽";
export const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
export const fmtDate = iso => new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
export const monthsOld = dob => Math.floor((Date.now()-new Date(dob))/(30.44*864e5));
export const daysSince = iso => Math.floor((Date.now()-new Date(iso))/864e5);

export const REACTIONS = [
  {id:"loved",  label:"Loved it",   emoji:"😍",color:"#D1FAE5",text:"#065F46"},
  {id:"good",   label:"Ate well",   emoji:"😋",color:"#D1FAE5",text:"#065F46"},
  {id:"some",   label:"Ate some",   emoji:"🙂",color:"#FEF9C3",text:"#713F12"},
  {id:"tasted", label:"Tasted it",  emoji:"👅",color:"#FEF9C3",text:"#713F12"},
  {id:"refused",label:"Refused",    emoji:"🙅",color:"#FEE2E2",text:"#991B1B"},
  {id:"spat",   label:"Spat out",   emoji:"💨",color:"#F1F5F9",text:"#475569"},
  {id:"reaction",label:"Reaction ⚠️",emoji:"🚨",color:"#FEE2E2",text:"#991B1B"},
];

export const STATUS_LEVELS = [
  {min:0,max:0, label:"Not tried",        color:"#E5E7EB",bg:"#F9FAFB",text:"#6B7280"},
  {min:1,max:1, label:"First taste! 🌱",  color:"#F2B705",bg:"#FFFBEB",text:"#92400E"},
  {min:2,max:3, label:"Getting familiar", color:"#7FB069",bg:"#F0FFF4",text:"#065F46"},
  {min:4,max:6, label:"Usually accepted", color:"#6FA3D2",bg:"#EFF6FF",text:"#1E40AF"},
  {min:7,max:99,label:"Confident eater!", color:"#F25F4C",bg:"#FFF1F2",text:"#9F1239"},
];
export const getStatus = count => STATUS_LEVELS.find(s=>count>=s.min&&count<=s.max)||STATUS_LEVELS[0];
