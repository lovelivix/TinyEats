// LilEats — Main App
// Data split into src/data/ files for easier maintenance

import { useState, useEffect, useRef, useCallback } from 'react';


import { GLOBAL_CSS, fe, cap, fmtDate, monthsOld, daysSince, REACTIONS, getStatus } from './data/theme.js';
import { BADGES, WEEKS, READINESS_SIGNS } from './data/weeks.js';
import { ALL_FOODS, FOOD_DB, STAGE_LABEL, STAGE_COLOR, ALLERGENS, daysUntilSafe, MEAL_DB } from './data/foods.js';
import { GUIDE_TOPICS, FAQ_ITEMS, EQUIPMENT, RESOURCES, FOODS_TO_AVOID, CHOKING_HAZARDS } from './data/learn.js';

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
const SESSION_KEY = "lileats_session";
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
      body: JSON.stringify({email, babyName, source:"LilEats signup"}),
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
      {/* Pear body */}
      <path d="M24 43C15.2 43 9 36.2 9 28C9 20.5 13.5 16.5 17.5 15C17.5 15 16.5 9.5 19.5 7.5C21 6.5 22.5 7.5 22.5 9C22.5 9 23.2 7.5 24.8 7C27 6.5 28 8.5 27.5 10.5C31 12.5 39 17.5 39 28C39 36.2 32.8 43 24 43Z" fill="#F2B705"/>
      {/* Stem */}
      <path d="M24 7.5C24 7.5 24.8 4 26.5 2.8" stroke="#6B4E1A" strokeWidth="2" strokeLinecap="round"/>
      {/* Leaf */}
      <path d="M25.5 5.5C25.5 5.5 29 2.8 32 4.5C32 4.5 29.5 7.5 26.2 6.8C25.6 6.5 25.5 5.5 25.5 5.5Z" fill="#7FB069"/>
      {/* Eyes */}
      <circle cx="20.5" cy="26" r="1.5" fill="#1A1A2E"/>
      <circle cx="27.5" cy="26" r="1.5" fill="#1A1A2E"/>
      {/* Smile */}
      <path d="M20.5 31C20.5 31 22.5 33.5 27.5 31" stroke="#1A1A2E" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      {/* Cheeks */}
      <ellipse cx="18" cy="29.5" rx="2.2" ry="1.3" fill="#F25F4C" opacity="0.45"/>
      <ellipse cx="30" cy="29.5" rx="2.2" ry="1.3" fill="#F25F4C" opacity="0.45"/>
    </svg>
  );
}

const css = {
  card:   {background:"#FFFFFF",borderRadius:20,boxShadow:"0 4px 20px rgba(26,26,46,0.08)"},
  cardSm: {background:"#FFFFFF",borderRadius:12,boxShadow:"0 2px 8px rgba(26,26,46,0.06)"},
  input:  {width:"100%",padding:"14px 16px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:15,outline:"none",background:"#FFFFFF",color:"#1A1A2E",marginBottom:0,display:"block",boxSizing:"border-box"},
  btnPrimary: {width:"100%",padding:"16px",background:"#F25F4C",color:"#FFFFFF",borderRadius:14,fontSize:16,fontWeight:700,border:"none",cursor:"pointer"},
  btnSecondary: {width:"100%",padding:"14px",background:"#FFFFFF",color:"#1A1A2E",borderRadius:14,fontSize:15,fontWeight:600,border:"1.5px solid #E8EAF0",cursor:"pointer"},
  label:  {fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6},
  back:   {padding:"18px 20px 8px",display:"flex",alignItems:"center",gap:6,background:"none",border:"none",fontSize:15,color:"#F25F4C",fontWeight:700,cursor:"pointer"},
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
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <img src="/logo-full.png" alt="LilEats" style={{height:48,objectFit:"contain"}}/>
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
              <button onClick={submit} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(242,95,76,0.35)",opacity:loading?0.7:1}}>
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
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>📧</div>
      <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:8}}>Check your email</div>
      <div style={{fontSize:15,color:"#6B7280",lineHeight:1.7,marginBottom:8,maxWidth:320}}>
        We've sent a confirmation link to <strong>{email}</strong>
      </div>
      <div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.7,marginBottom:32,maxWidth:320}}>
        Check your spam folder if you don't see it. Tap the link then come back and log in.
      </div>
      <button onClick={()=>{setEmailSent(false);setMode("login");}} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Back to log in
      </button>
    </div>
  );

  // ── Password reset sent screen ───────────────────────────────
  if (resetSent) return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>🔑</div>
      <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:8}}>Reset link sent!</div>
      <div style={{fontSize:15,color:"#6B7280",lineHeight:1.7,marginBottom:8,maxWidth:320}}>
        We've sent a password reset link to <strong>{email}</strong>
      </div>
      <div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.7,marginBottom:32,maxWidth:320}}>
        Check your spam folder if you don't see it. Click the link in the email to set a new password.
      </div>
      <button onClick={()=>{setResetSent(false);setMode("login");}} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:12,padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Back to log in
      </button>
    </div>
  );

  // ── Forgot password screen ───────────────────────────────────
  if (mode === "forgot") return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <img src="/logo-full.png" alt="LilEats" style={{height:48,objectFit:"contain",marginBottom:4}}/>
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
          <button onClick={submitForgot} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(242,95,76,0.35)",opacity:loading?0.7:1}}>
            {loading?"Sending…":"Send reset link →"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#9CA3AF"}}>
          <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:"#F25F4C",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
            ← Back to log in
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <img src="/logo-full.png" alt="LilEats" style={{height:52,objectFit:"contain",marginBottom:4}}/>
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

          <button onClick={submit} disabled={loading} style={{...css.btnPrimary,borderRadius:12,boxShadow:"0 4px 16px rgba(242,95,76,0.35)",opacity:loading?0.7:1}}>
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
          <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{background:"none",border:"none",color:"#F25F4C",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
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
  const [resetToken, setResetToken] = useState(null);
  const [showBugReport, setShowBugReport] = useState(false);

  useEffect(() => {
    const handler = () => setShowBugReport(true);
    document.addEventListener("openBugReport", handler);
    return () => document.removeEventListener("openBugReport", handler);
  }, []);
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
    <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <img src="/logo-full.png" alt="LilEats" style={{height:52,objectFit:"contain",marginBottom:8}}/>
      <div style={{display:"flex",gap:6,marginTop:20}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#F25F4C",animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
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
    <div style={{minHeight:"100vh",background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Badge unlock toast */}
      {newBadges.length > 0 && (
        <BadgeToast badges={newBadges} onClose={() => setNewBadges([])} />
      )}
      {showBugReport && <BugReportSheet session={session} onClose={()=>setShowBugReport(false)} />}

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
  const [step, setStep] = useState(isAdding ? 1 : -3); // -3,-2,-1 = intro slides, 0=email, 1=baby details
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [photo, setPhoto] = useState(null);
  const [emailError, setEmailError] = useState("");
  const fileRef = useRef();

  const INTRO_SLIDES = [
    {
      emoji:"🥦",
      title:"Welcome to LilEats",
      subtitle:"Your calm guide to baby weaning",
      body:"Weaning is one of the most exciting — and nerve-wracking — milestones. LilEats gives you a simple, NHS-safe plan to introduce your baby to food with confidence.",
      cta:"Next →",
    },
    {
      emoji:"🥄",
      title:"Two ways to wean",
      subtitle:"Purée or baby-led — both are great",
      body:"Purée weaning uses smooth blended food on a spoon. Baby-led weaning (BLW) offers soft finger foods for baby to self-feed. Many families combine both — there's no wrong approach!",
      cta:"Next →",
    },
    {
      emoji:"📋",
      title:"How LilEats works",
      subtitle:"Three simple things",
      body:"1. Follow the 6-week plan — foods and textures are introduced in the right order.\n\n2. Log what your baby tries in the food tracker.\n\n3. Check the allergen guide when introducing high-risk foods.",
      cta:"Let's get started →",
    },
  ];

  // Show intro slides
  if (step < 0 && !isAdding) {
    const slide = INTRO_SLIDES[step + 3];
    const isLast = step === -1;
    const progress = step + 3; // 0, 1, 2

    return (
      <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",fontFamily:"'Plus Jakarta Sans',sans-serif",textAlign:"center"}}>
        {/* Progress dots */}
        <div style={{display:"flex",gap:6,marginBottom:40}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:i===progress?24:8,height:8,borderRadius:4,background:i===progress?"#F25F4C":"#E8EAF0",transition:"all 0.3s"}}/>
          ))}
        </div>

        <div style={{fontSize:72,marginBottom:20,lineHeight:1}}>{slide.emoji}</div>
        <div style={{fontSize:26,fontWeight:900,color:"#1A1A2E",letterSpacing:-0.5,marginBottom:8,lineHeight:1.2}}>{slide.title}</div>
        <div style={{fontSize:14,color:"#F25F4C",fontWeight:600,marginBottom:20}}>{slide.subtitle}</div>
        <div style={{fontSize:15,color:"#6B7280",lineHeight:1.8,maxWidth:320,whiteSpace:"pre-line",marginBottom:40}}>{slide.body}</div>

        <button onClick={()=>setStep(step+1)} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:14,padding:"16px 40px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(242,95,76,0.35)",fontFamily:"inherit"}}>
          {slide.cta}
        </button>

        {step===-3&&(
          <button onClick={()=>setStep(1)} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:13,cursor:"pointer",marginTop:16,fontFamily:"inherit"}}>
            Skip intro
          </button>
        )}
      </div>
    );
  }

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
    <div style={{minHeight:"100vh",background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Background blobs */}
      <div style={{position:"absolute",top:-100,right:-100,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,#F25F4C22 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-80,left:-80,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,#6FA3D222 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"40%",left:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,#F2B70522 0%,transparent 70%)",pointerEvents:"none"}}/>

      {onBack && <button onClick={onBack} style={{...css.back,position:"absolute",top:0,left:0}}>← Back</button>}

      <div style={{width:"100%",maxWidth:380,position:"relative",zIndex:1}} className="fadeUp">

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/logo-full.png" alt="LilEats" style={{height:64,objectFit:"contain",marginBottom:8}}/>
          {!isAdding && <p style={{fontSize:15,color:"#6B7280",marginTop:4}}>Your calm guide to baby weaning</p>}
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
              style={{...css.input,marginBottom:emailError?4:16,borderColor:emailError?"#F25F4C":"#E8EAF0"}}
            />
            {emailError && <p style={{fontSize:12,color:"#F25F4C",marginBottom:14}}>{emailError}</p>}
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
              <button onClick={()=>fileRef.current?.click()} style={{width:80,height:80,borderRadius:"50%",border:"2.5px dashed #E8EAF0",background:photo?"transparent":"#FFFFFF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
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
    <div style={{minHeight:"100vh",background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",paddingBottom:32}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{padding:"28px 20px 0",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:4}}>
          <img src="/logo-pear.png" alt="" style={{width:32,height:32,objectFit:"contain"}}/>
        </div>
      </div>
      <div style={{margin:"20px 16px",background:"#FFFFFF",borderRadius:20,padding:"20px",border:"1px solid #FFD6D0",boxShadow:"0 4px 20px rgba(242,95,76,0.08)"}}>
        {baby.photo
          ? <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",margin:"0 auto 8px",border:"3px solid #F25F4C"}}><img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
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
            style={{width:"100%",display:"flex",alignItems:"center",borderRadius:16,padding:"14px",marginBottom:8,border:"none",background:checked[sign.id]?"#FFF1F2":"#FFFFFF",boxShadow:checked[sign.id]?"0 0 0 2px #F25F4C":"0 2px 8px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
            <span style={{fontSize:26,marginRight:12,flexShrink:0}}>{sign.icon}</span>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:2}}>{sign.title}</div>
              <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{sign.desc}</div>
            </div>
            <div style={{width:26,height:26,borderRadius:8,background:checked[sign.id]?"#F25F4C":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:8,transition:"all 0.15s"}}>
              {checked[sign.id]&&<span style={{color:"#fff",fontWeight:700,fontSize:14}}>✓</span>}
            </div>
          </button>
        ))}
        {allChecked && (
          <div className="fadeUp" style={{marginTop:8}}>
            <div style={{background:"#FFF1F2",border:"2px solid #F25F4C",borderRadius:18,padding:"16px",textAlign:"center",marginBottom:12,boxShadow:"0 4px 20px rgba(242,95,76,0.15)"}}>
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
            <img src="/logo-pear.png" alt="" style={{width:30,height:30,objectFit:"contain"}}/>
            <img src="/logo-full.png" alt="LilEats" style={{height:20,objectFit:"contain"}}/>
          </div>
          <p style={{fontSize:13,color:"#6B7280",marginTop:4}}>Hi! Let's feed <strong style={{color:"#1A1A2E"}}>{baby.name}</strong> today 👋</p>
        </div>
        <button onClick={()=>setOverlay({type:"settings"})} style={{width:50,height:50,borderRadius:"50%",border:"3px solid #FFD6D0",background:"#FFFFFF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(242,95,76,0.15)",cursor:"pointer"}}>
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
            <button onClick={()=>setScreen("plan")} style={{width:"100%",display:"flex",alignItems:"center",background:"#F0FFF4",borderRadius:16,padding:"14px",border:"1.5px solid #7FB069",cursor:"pointer",textAlign:"left",gap:10}}>
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
            <div style={{background:"#FFFBF0",borderRadius:16,padding:"14px",border:"1.5px solid #F2B705"}}>
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
                <div style={{fontSize:11,color:"#F25F4C",fontWeight:700,marginTop:4}}>Go to Plan → Allergens to track →</div>
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
                <button onClick={()=>setShowJournalAdd(true)} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
              </div>
              {todayEntries.length===0 ? (
                <div style={{fontSize:12,color:"#9CA3AF",marginTop:8}}>Nothing logged yet — tap + Add to record today's meals.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {todayEntries.map((entry,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:8,background:entry.reaction?"#FFF1F2":"#FFFFFF",borderRadius:10,padding:"8px 10px"}}>
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
          <button onClick={()=>setOverlay({type:"progress"})} style={{background:"#FFF1F2",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(242,95,76,0.12)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#F25F4C",lineHeight:1}}>{tried.length}</div>
            <div style={{fontSize:10,color:"#F25F4C",marginTop:3,fontWeight:700,opacity:0.7}}>foods tried</div>
          </button>
          <button onClick={()=>setOverlay({type:"badges"})} style={{background:"#FFFBEB",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",position:"relative",boxShadow:"0 4px 16px rgba(242,183,5,0.15)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#F59E0B",lineHeight:1}}>{badges.length}</div>
            <div style={{fontSize:10,color:"#F59E0B",marginTop:3,fontWeight:700,opacity:0.7}}>badges {badges.length>0?"🏅":""}</div>
          </button>
          <button onClick={()=>setOverlay({type:"progress"})} style={{background:"#F0FFF4",borderRadius:18,padding:"14px 8px",border:"none",textAlign:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(127,176,105,0.12)"}}>
            <div style={{fontSize:26,fontWeight:900,color:"#16A34A",lineHeight:1}}>{Object.values(profile.foodLog).filter(l=>l.length>=7).length}</div>
            <div style={{fontSize:10,color:"#16A34A",marginTop:3,fontWeight:700,opacity:0.7}}>confident</div>
          </button>
        </div>
      </div>

      {/* This week's foods */}
      <div style={{padding:"0 16px",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Quick actions</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <ActionCard emoji="🥗" label="Make a Meal" sub="Meal ideas" onClick={()=>setScreen("meals")} color="#FFF1F2" accent="#F25F4C"/>
          <ActionCard emoji="📊" label="Food Tracker" sub={`${tried.length} tried`} onClick={()=>setScreen("tracker")} color="#EFF6FF" accent="#6FA3D2"/>
          <ActionCard emoji="📚" label="Learn" sub="NHS guide & tips" onClick={()=>setScreen("learn")} color="#FDF4FF" accent="#C77DFF"/>
          <ActionCard emoji="🏅" label="Badges" sub={`${badges.length} earned`} onClick={()=>setOverlay({type:"badges"})} color="#FFFBEB" accent="#F2B705"/>
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
                  style={{display:"flex",flexDirection:"column",alignItems:"center",background:"#FFFFFF",border:"none",borderRadius:12,padding:"8px",cursor:"pointer",minWidth:62}}>
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
              style={{flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:profile.activeWeek===i?700:500,background:profile.activeWeek===i?"#F25F4C":"#FFFFFF",color:profile.activeWeek===i?"#FFFFFF":"#6B7280",border:"none",boxShadow:profile.activeWeek===i?"0 4px 12px rgba(242,95,76,0.3)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
              W{i+1}
            </button>
          ))}
          {profile.activeWeek===5 && (
            <button onClick={()=>setProfile(p=>({...p,activeWeek:6}))}
              style={{flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:600,background:"#7FB069",color:"#FFFFFF",border:"none",boxShadow:"0 4px 12px rgba(127,176,105,0.3)",whiteSpace:"nowrap"}}>
              ✓ Finish
            </button>
          )}
        </div>
      </div>

      {/* Tip */}
      <div style={{padding:"0 16px 8px"}}>
        <div style={{display:"flex",alignItems:"flex-start",background:"#FFFBEB",borderRadius:18,padding:"14px 16px",boxShadow:"0 4px 16px rgba(245,158,11,0.1)",border:"2px solid #FEF3C722"}}>
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

  const colors = ["#F25F4C","#F2B705","#7FB069","#6FA3D2","#C77DFF"];

  return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",position:"relative",overflow:"hidden"}}>
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
          <h1 style={{fontSize:28,fontWeight:900,color:"#1A1A2E",lineHeight:1.2,letterSpacing:"-0.5px"}}>Weaning complete!<br/><span style={{color:"#F25F4C"}}>Well done {baby.name}!</span></h1>
          <p style={{fontSize:14,color:"#6B7280",lineHeight:1.65,marginTop:10}}>You've finished the 6-week plan. What an incredible journey.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
          {[{n:tried.length,l:"foods tried",c:"#F25F4C"},{n:confident.length,l:"confident",c:"#7FB069"},{n:total,l:"total offers",c:"#6FA3D2"}].map(x=>(
            <div key={x.l} style={{...css.card,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:x.c}}>{x.n}</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{x.l}</div>
            </div>
          ))}
        </div>
        {confident.length>0&&(
          <div style={{...css.card,padding:"16px",marginBottom:16,background:"#F0FFF4"}}>
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
        <button onClick={()=>setProfile(p=>({...p,activeWeek:0}))} style={{...css.btnPrimary,background:"#6FA3D2",marginBottom:10}}>🔄 Restart the plan</button>
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
                  {hasDB&&<div style={{position:"absolute",top:8,right:8,width:6,height:6,borderRadius:"50%",background:"#F25F4C"}}/>}
                  <span style={{fontSize:28,flexShrink:0}}>{fe(f)}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#1A1A2E"}}>{cap(f)}</div>
                    <span style={{...css.chip,background:st.bg,color:st.text,fontSize:10,padding:"2px 7px",marginTop:3}}>{st.label}</span>
                    <div style={{fontSize:10,color:"#6B7280",marginTop:3}}>
                      {profile.activeWeek===0?"🥣 Purée":profile.activeWeek===1?"🥣 Purée or mash":profile.activeWeek===2?"🥄 Mash or soft lumps":profile.activeWeek===3?"✋ Mash + finger food":profile.activeWeek===4?"✋ Chopped or finger food":"✋ Family texture"}
                    </div>
                    {hasDB&&<div style={{fontSize:10,color:"#F25F4C",fontWeight:600,marginTop:2}}>{FOOD_DB[f].recipes.length} recipes →</div>}
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
                style={{...css.btnPrimary,background:"#7FB069"}}>
                ✓ Week {profile.activeWeek+1} done — advance to Week {profile.activeWeek+2}
              </button>
            ) : (
              <button onClick={()=>setProfile(p=>({...p,activeWeek:6}))}
                style={{...css.btnPrimary,background:"#7FB069"}}>
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
            if (isSafe)     { borderColor="#7FB069"; bgColor="#F0FFF4"; badgeText="✓ Safely introduced"; badgeBg="#D1FAE5"; badgeColor="#065F46"; }
            if (isReaction) { borderColor="#F25F4C"; bgColor="#FFF1F2"; badgeText="⚠ Reaction noted"; badgeBg="#FEE2E2"; badgeColor="#DC2626"; }
            if (waiting)    { borderColor="#F2B705"; bgColor="#FFFBF0"; badgeText=daysLeft===0?"✓ Ready to mark safe":`⏳ ${daysLeft} day${daysLeft!==1?"s":""} to go`; badgeBg="#FEF9C3"; badgeColor="#92400E"; }

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
                    <div style={{fontSize:12,color:"#6B7280",lineHeight:1.6,marginBottom:8}}>{a.tip}</div>
                    <div style={{background:"#FFFFFF",borderRadius:10,padding:"8px 10px",marginBottom:10,display:"flex",gap:6,alignItems:"flex-start"}}>
                      <span style={{fontSize:14,flexShrink:0}}>☀️</span>
                      <div style={{fontSize:11,color:"#92400E",lineHeight:1.6}}><strong>Introduce in the morning</strong> — this gives you the whole day to watch for any reactions before bedtime.</div>
                    </div>

                    {!isIntroduced && (
                      <div style={{background:"#FFFFFF",borderRadius:10,padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:12,color:"#9CA3AF"}}>Not started yet.</div>
                        <div style={{fontSize:11,color:"#9CA3AF",marginTop:3}}>Log this food in the tracker or meal plan and the watch will start automatically.</div>
                        <button onClick={()=>startAllergenIntro(a.id)} style={{marginTop:8,background:"none",border:"1.5px solid #E8EAF0",borderRadius:8,padding:"6px 12px",fontSize:11,color:"#9CA3AF",cursor:"pointer"}}>
                          Or start manually
                        </button>
                      </div>
                    )}

                    {status?.autoStarted && waiting && (
                      <div style={{background:"#FFFFFF",borderRadius:10,padding:"8px 10px",marginBottom:8,fontSize:11,color:"#92400E"}}>
                        ✨ Started automatically when you logged this food in the tracker.
                      </div>
                    )}

                    {waiting && daysLeft===0 && (
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#92400E",marginBottom:2}}>3 days have passed — how did it go?</div>
                        <button onClick={()=>markAllergenSafe(a.id)} style={{width:"100%",background:"#7FB069",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✓ No reaction — safely introduced!</button>
                        <button onClick={()=>markAllergenReaction(a.id)} style={{width:"100%",background:"#F25F4C",color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>⚠ Baby had a reaction</button>
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
                <div style={{width:24,height:24,borderRadius:7,background:checked?"#7FB069":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
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
                  <button key={f} onClick={()=>toggle(f)} style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:sel?700:500,background:sel?"#F25F4C":"#F0FFF4",color:sel?"#fff":"#065F46",border:"none",boxShadow:sel?"0 4px 12px rgba(242,95,76,0.25)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
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
                <button key={f} onClick={()=>toggle(f)} style={{display:"flex",alignItems:"center",gap:4,padding:"7px 12px",borderRadius:20,fontSize:13,fontWeight:sel?700:400,background:sel?"#F25F4C":"#FFFFFF",color:sel?"#fff":"#374151",border:"none",boxShadow:sel?"0 4px 12px rgba(242,95,76,0.25)":"0 2px 6px rgba(26,26,46,0.06)",transition:"all 0.15s"}}>
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
          <div style={{background:"#FFFFFF",borderRadius:16,padding:"18px",textAlign:"center"}}>
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
            {missing.length>0&&<span style={{...css.chip,background:"#FFF1F2",color:"#F25F4C",fontSize:10,padding:"2px 8px"}}>+{missing.length} more needed</span>}
          </div>
        </div>
        <span style={{color:"#F25F4C",fontSize:20,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0deg)",flexShrink:0}}>›</span>
      </button>
      {open&&(
        <div style={{borderTop:"1px solid #F3F4F6",padding:"16px"}}>
          {missing.length>0&&(
            <div style={{background:"#FFFFFF",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#92400E"}}>
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
  const [search, setSearch] = useState("");
  const tried    = allFoods.filter(f=>(profile.foodLog[f]?.length||0)>0).length;
  const confident = allFoods.filter(f=>(profile.foodLog[f]?.length||0)>=7).length;
  const filtered = allFoods.filter(f=>{
    const c=profile.foodLog[f]?.length||0;
    if(filter==="tried")return c>0;
    if(filter==="not")return c===0;
    return true;
  }).filter(f=>!search||f.includes(search.toLowerCase()));
  return(
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Food Tracker</div>
          <button onClick={()=>setOverlay({type:"addFood"})} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(242,95,76,0.3)"}}>+ Add food</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[{n:tried,l:"tried",c:"#F25F4C"},{n:confident,l:"confident",c:"#7FB069"},{n:allFoods.length-tried,l:"to try",c:"#6FA3D2"}].map(x=>(
            <div key={x.l} style={{...css.cardSm,padding:"8px 12px",flex:1,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:x.c}}>{x.n}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>{x.l}</div>
            </div>
          ))}
        </div>
        {/* Search bar */}
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search foods…"
            style={{width:"100%",padding:"10px 12px 10px 34px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:14,outline:"none",background:"#FFFFFF",color:"#1A1A2E",boxSizing:"border-box"}}
          />
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:16,color:"#9CA3AF",cursor:"pointer"}}>×</button>}
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
                style={{background:"#FFFFFF",borderRadius:20,display:"flex",flexDirection:"column",padding:"14px",border:`2px solid ${log.length>0?"#FFD6D0":"#F3F4F6"}`,cursor:"pointer",textAlign:"left",position:"relative",boxShadow:"0 4px 16px rgba(26,26,46,0.06)",transition:"transform 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                {hasDB&&<div style={{position:"absolute",top:10,right:10,background:"#FFF1F2",borderRadius:6,padding:"2px 6px",fontSize:9,color:"#F25F4C",fontWeight:700}}>recipe</div>}
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
          <div style={{fontSize:20,fontWeight:800,color:"#7FB069"}}>{safeCount}</div>
          <div style={{fontSize:9,color:"#065F46",fontWeight:600}}>introduced safely</div>
        </div>
        <div style={{background:"#FFF1F2",borderRadius:14,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#DC2626"}}>{reactionCount}</div>
          <div style={{fontSize:9,color:"#DC2626",fontWeight:600}}>had reaction</div>
        </div>
        <div style={{background:"#FFFFFF",borderRadius:14,padding:"10px",textAlign:"center"}}>
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

          if (isSafe)     { borderColor="#7FB069"; bgColor="#F0FFF4"; badgeText="✓ Safely introduced"; badgeBg="#D1FAE5"; badgeColor="#065F46"; }
          if (isReaction) { borderColor="#F25F4C"; bgColor="#FFF1F2"; badgeText="⚠ Reaction noted"; badgeBg="#FEE2E2"; badgeColor="#DC2626"; }
          if (waiting)    { borderColor="#F2B705"; bgColor="#FFFBF0"; badgeText=daysLeft===0?"✓ Ready to mark safe":`⏳ ${daysLeft} day${daysLeft!==1?"s":""} to go`; badgeBg="#FEF9C3"; badgeColor="#92400E"; }

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
                  <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6,marginBottom:8}}>{a.tip}</div>
                  <div style={{background:"#FFFFFF",borderRadius:10,padding:"8px 10px",marginBottom:10,display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontSize:14,flexShrink:0}}>☀️</span>
                    <div style={{fontSize:11,color:"#92400E",lineHeight:1.6}}><strong>Introduce in the morning</strong> — this gives you the whole day to watch for any reactions before bedtime.</div>
                  </div>

                  {!isIntroduced && (
                    <button onClick={()=>startIntro(a.id)} style={{width:"100%",background:"#F25F4C",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                      Start introduction today
                    </button>
                  )}

                  {waiting && daysLeft === 0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#92400E",marginBottom:4}}>3 days have passed — how did it go?</div>
                      <button onClick={()=>markSafe(a.id)} style={{width:"100%",background:"#7FB069",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>✓ No reaction — safely introduced!</button>
                      <button onClick={()=>markReaction(a.id)} style={{width:"100%",background:"#F25F4C",color:"white",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>⚠ Baby had a reaction</button>
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
                background:isSelected?"#F25F4C":isToday?"#FFF1F2":"transparent",
                color:isSelected?"#fff":isToday?"#F25F4C":"#1A1A2E",
                position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {day}
                {hasEntries && !isSelected && (
                  <div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:hasReaction?"#F25F4C":"#7FB069"}}/>
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
          <button onClick={()=>setShowAddSheet(true)} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:12,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button>
        </div>

        {selectedEntries.length === 0 ? (
          <div style={{background:"#FFFFFF",borderRadius:16,padding:"24px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📝</div>
            <div style={{fontSize:13,color:"#9CA3AF"}}>No entries yet — tap + Add to log a food</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {selectedEntries.map((entry, idx) => (
              <div key={idx} style={{background:"#FFFFFF",borderRadius:14,padding:"12px 14px",boxShadow:"0 2px 8px rgba(26,26,46,0.06)",border:entry.reaction?"1.5px solid #F25F4C":"1.5px solid #F3F4F6"}}>
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
                <button key={f} onClick={()=>toggleFood(f)} style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:sel?700:400,background:sel?"#F25F4C":"#F3F4F6",color:sel?"#fff":"#374151",border:"none",cursor:"pointer"}}>
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
              style={{padding:"7px 14px",borderRadius:10,background:"#F25F4C",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",opacity:customFood.trim()?1:0.4}}>
              Add
            </button>
          </div>
          {selectedFoods.filter(f=>!allFoods.includes(f)).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {selectedFoods.filter(f=>!allFoods.includes(f)).map(f=>(
                <span key={f} onClick={()=>setSelectedFoods(p=>p.filter(x=>x!==f))} style={{background:"#F0F4FF",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#6FA3D2",cursor:"pointer"}}>✏️ {cap(f)} ×</span>
              ))}
            </div>
          )}
        </div>

        {/* Reaction toggle */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setReaction(r=>!r)} style={{display:"flex",alignItems:"center",gap:8,background:reaction?"#FFF1F2":"#FFFFFF",border:`1.5px solid ${reaction?"#F25F4C":"#E8EAF0"}`,borderRadius:12,padding:"10px 14px",width:"100%",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:reaction?"#DC2626":"#374151"}}>Mark as reaction</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>Flag this meal if baby had any symptoms</div>
            </div>
            <div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:reaction?"#F25F4C":"#E8EAF0",display:"flex",alignItems:"center",justifyContent:"center"}}>
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

        <button onClick={save} disabled={selectedFoods.length===0} style={{width:"100%",padding:"14px",background:selectedFoods.length>0?"#F25F4C":"#E8EAF0",color:selectedFoods.length>0?"#fff":"#9CA3AF",borderRadius:12,border:"none",fontSize:15,fontWeight:700,cursor:selectedFoods.length>0?"pointer":"default"}}>
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
          {[["guide","📚 Guide"],["safety","⚠️ Safety"],["equipment","🛒 Kit"],["faq","❓ FAQ"],["links","🔗 Links"]].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setExpanded(null);}} style={{flex:1,padding:"8px 2px",border:"none",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t?"#FFFFFF":"transparent",color:tab===t?"#1A1A2E":"#6B7280",boxShadow:tab===t?"0 2px 8px rgba(26,26,46,0.08)":"none",transition:"all 0.15s"}}>{l}</button>
          ))}
        </div>
      </div>

      {tab==="guide"&&(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#FFF1F2",borderRadius:14,padding:"12px 14px",marginBottom:14,border:"1px solid #FFBDB5"}}>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.7}}>All guidance is based on <strong>NHS Start4Life</strong> and peer-reviewed research. Tap any topic.</div>
          </div>
          {GUIDE_TOPICS.map((section,i)=>(
            <div key={section.title} style={{...css.card,marginBottom:8,overflow:"hidden"}}>
              <button onClick={()=>setExpanded(expanded===`g${i}`?null:`g${i}`)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:26,marginRight:12,flexShrink:0}}>{section.icon}</span>
                <span style={{fontSize:14,fontWeight:600,color:"#1A1A2E",flex:1}}>{section.title}</span>
                <span style={{color:"#F25F4C",fontSize:18,transition:"transform 0.2s",transform:expanded===`g${i}`?"rotate(90deg)":"rotate(0deg)"}}>›</span>
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

      {tab==="safety"&&(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#FFF1F2",borderRadius:14,padding:"12px 14px",marginBottom:14,border:"1px solid #FFBDB5",display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.7}}>Based on <strong>NHS guidance</strong>. When in doubt, always check with your health visitor or GP.</div>
          </div>

          <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E",marginBottom:10,marginTop:4}}>Foods to avoid</div>
          {FOODS_TO_AVOID.map((item,i)=>(
            <div key={i} style={{...css.card,marginBottom:8,overflow:"hidden"}}>
              <button onClick={()=>setExpanded(expanded===`avoid${i}`?null:`avoid${i}`)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:24,marginRight:12,flexShrink:0}}>{item.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:2}}>{item.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{...css.chip,background:item.severity==="never"?"#FFF1F2":"#FFFBEB",color:item.severity==="never"?"#DC2626":"#92400E",fontSize:10,padding:"2px 8px"}}>{item.severity==="never"?"❌ Never":"⚠️ Avoid"}</span>
                    <span style={{...css.chip,background:"#F3F4F6",color:"#6B7280",fontSize:10,padding:"2px 8px"}}>{item.age}</span>
                  </div>
                </div>
                <span style={{color:"#F25F4C",fontSize:18,transform:expanded===`avoid${i}`?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block",flexShrink:0}}>›</span>
              </button>
              {expanded===`avoid${i}`&&(
                <div style={{padding:"0 14px 14px"}}>
                  <p style={{fontSize:13,color:"#374151",lineHeight:1.7}}>{item.reason}</p>
                </div>
              )}
            </div>
          ))}

          <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E",marginBottom:10,marginTop:20}}>Choking hazards — how to prepare safely</div>
          {CHOKING_HAZARDS.map((item,i)=>(
            <div key={i} style={{...css.card,marginBottom:8,overflow:"hidden"}}>
              <button onClick={()=>setExpanded(expanded===`choke${i}`?null:`choke${i}`)} style={{width:"100%",display:"flex",alignItems:"center",padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:24,marginRight:12,flexShrink:0}}>{item.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E"}}>{item.name}</div>
                </div>
                <span style={{color:"#F25F4C",fontSize:18,transform:expanded===`choke${i}`?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block",flexShrink:0}}>›</span>
              </button>
              {expanded===`choke${i}`&&(
                <div style={{padding:"0 14px 14px"}}>
                  <p style={{fontSize:13,color:"#374151",lineHeight:1.7}}>{item.prep}</p>
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
                <span style={{color:"#F25F4C",fontSize:18,transition:"transform 0.2s",transform:expanded===`f${i}`?"rotate(90deg)":"rotate(0deg)"}}>›</span>
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
                <button onClick={()=>window.open(res.url,"_blank")} style={{background:"#FFFFFF",border:"1px solid #E8EAF0",borderRadius:8,padding:"7px 12px",fontSize:12,color:"#F25F4C",fontWeight:600,cursor:"pointer"}}>Open website →</button>
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
    <div style={{position:"fixed",inset:0,background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
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
                <button onClick={onDeleteLast} style={{fontSize:11,color:"#F25F4C",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>↩ Undo last</button>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[...log].reverse().slice(0,5).map((e,i)=>{
                  const r=REACTIONS.find(x=>x.id===e.reaction);
                  return<span key={i} style={{fontSize:11,background:"#FFFFFF",borderRadius:8,padding:"3px 8px",color:"#6B7280"}}>{r?.emoji} {fmtDate(e.date)}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prep & Recipes */}
      {!db?(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#FFFFFF",borderRadius:12,padding:"16px",fontSize:13,color:"#6B7280",lineHeight:1.7}}>
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
                    <div style={{width:24,height:24,borderRadius:"50%",background:"#FFF1F2",border:"2px solid #F25F4C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#F25F4C",flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.65,paddingTop:3}}>{step}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:"16px"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#1A1A2E",marginBottom:10}}>🛡️ Safety notes</div>
                {db.safety.map((note,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                    <span style={{color:note.startsWith("⚠️")?"#F25F4C":"#9CA3AF",flexShrink:0,marginTop:1}}>•</span>
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
                    <span style={{color:"#F25F4C",fontSize:20,transition:"transform 0.2s",transform:expandedRecipe===i?"rotate(90deg)":"rotate(0deg)"}}>›</span>
                  </button>
                  {expandedRecipe===i&&(
                    <div style={{borderTop:"1px solid #F3F4F6",padding:"14px 16px"}} className="fadeUp">
                      <div style={css.label}>Ingredients</div>
                      {recipe.ingredients.map((ing,j)=>(
                        <div key={j} style={{display:"flex",gap:7,marginBottom:5}}>
                          <span style={{color:"#F25F4C",fontSize:13}}>•</span>
                          <span style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{ing}</span>
                        </div>
                      ))}
                      <div style={{...css.label,marginTop:12}}>Method</div>
                      {recipe.method.map((step,j)=>(
                        <div key={j} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:"#F25F4C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0,marginTop:1}}>{j+1}</div>
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
    <div style={{position:"fixed",inset:0,background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 32px"}} className="fadeUp">
        <h2 style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Progress</h2>
        <p style={{fontSize:13,color:"#6B7280",marginBottom:20}}>Your baby's weaning journey so far</p>

        {/* Big stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[
            {n:tried.length,l:"Foods tried",c:"#F25F4C",icon:"🍽"},
            {n:confident.length,l:"Confident",c:"#7FB069",icon:"💪"},
            {n:allergensTried.length,l:"Allergens introduced",c:"#6FA3D2",icon:"⭐"},
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
              <div style={{width:`${Math.min(100,(tried.length/allFoods.length)*100)}%`,height:"100%",background:"linear-gradient(90deg,#F25F4C,#F2B705)",borderRadius:99,transition:"width 0.5s"}}/>
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
                <div key={a} style={{display:"flex",alignItems:"center",gap:5,background:done?"#F0FFF4":"#FFFFFF",borderRadius:20,padding:"5px 10px",border:`1px solid ${done?"#7FB069":"#E8EAF0"}`}}>
                  <span style={{fontSize:12}}>{fe(a)}</span>
                  <span style={{fontSize:11,fontWeight:600,color:done?"#065F46":"#9CA3AF"}}>{cap(a)}</span>
                  {done&&<span style={{fontSize:11,color:"#7FB069"}}>✓</span>}
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
        <div style={{background:"#FFFFFF",borderRadius:20,padding:"18px",marginBottom:20,boxShadow:"0 4px 20px rgba(242,95,76,0.08)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1A1A2E"}}>Progress</span>
            <span style={{fontSize:20,fontWeight:900,color:"#F25F4C"}}>{pct}%</span>
          </div>
          <div style={{background:"#F3F4F6",borderRadius:99,height:12,overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#F25F4C,#F2B705)",borderRadius:99,transition:"width 0.6s ease"}}/>
          </div>
          <div style={{fontSize:12,color:"#9CA3AF",marginTop:8}}>{earned.length===BADGES.length?"🎉 You've earned them all!":  `${BADGES.length-earned.length} more to go — keep exploring!`}</div>
        </div>

        {/* Badge grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {BADGES.map(b=>{
            const isEarned=earned.includes(b.id);
            return(
              <div key={b.id} style={{background:isEarned?"#FFFFFF":"#F9FAFB",borderRadius:20,padding:"18px 14px",textAlign:"center",opacity:isEarned?1:0.55,position:"relative",overflow:"hidden",boxShadow:isEarned?"0 4px 20px rgba(242,183,5,0.15)":"none",border:isEarned?"2px solid #F2B70522":"2px solid #F3F4F6"}}>
                {isEarned&&<div style={{position:"absolute",top:0,left:0,right:0,height:4,background:"linear-gradient(90deg,#F2B705,#F25F4C)",borderRadius:"20px 20px 0 0"}}/>}
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
    <div style={{position:"fixed",inset:0,background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 40px"}} className="fadeUp">
        <h2 style={{fontSize:24,fontWeight:800,color:"#1A1A2E",marginBottom:20}}>Settings</h2>

        {state.babies.length>1&&(
          <div style={{marginBottom:22}}>
            <div style={css.label}>Switch baby</div>
            {state.babies.map(b=>(
              <div key={b.id} style={{...css.card,display:"flex",alignItems:"center",padding:"12px 14px",marginBottom:8,border:b.id===state.activeBabyId?"2px solid #F25F4C":"none"}}>
                <div style={{width:40,height:40,borderRadius:"50%",overflow:"hidden",marginRight:12,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {b.photo?<img src={b.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:20}}>👶</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E"}}>{b.name}</div>
                  <div style={{fontSize:11,color:"#6B7280"}}>{monthsOld(b.dob)} months old</div>
                </div>
                {b.id!==state.activeBabyId
                  ?<button onClick={()=>{ update(s=>({...s,activeBabyId:b.id})); onClose(); }} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:8,padding:"5px 11px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Switch</button>
                  :<span style={{fontSize:12,color:"#F25F4C",fontWeight:700}}>Active</span>
                }
              </div>
            ))}
          </div>
        )}

        <div style={{marginBottom:22}}>
          <div style={css.label}>Edit {baby.name}</div>
          <div style={{...css.card,padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <button onClick={()=>fileRef.current?.click()} style={{width:70,height:70,borderRadius:"50%",border:"2.5px dashed #E8EAF0",background:photo?"transparent":"#FFFFFF",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                {photo?<img src={photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:22}}>📷</div><div style={{fontSize:9,color:"#9CA3AF"}}>Change</div></div>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
            </div>
            <label style={css.label}>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={{...css.input,marginBottom:14}}/>
            <label style={css.label}>Date of birth</label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{...css.input,marginBottom:16}}/>
            <button onClick={save} style={{...css.btnPrimary,background:saved?"#7FB069":"#F25F4C"}}>
              {saved?"✓ Saved!":"Save changes"}
            </button>
          </div>
        </div>

        <button onClick={onAddBaby} style={{...css.btnSecondary,marginBottom:10,borderColor:"#7FB069",color:"#065F46",background:"#F0FFF4"}}>+ Add another baby</button>

        {state.babies.length>1&&(
          <button onClick={()=>{update(s=>{const nb=s.babies.filter(b=>b.id!==baby.id);return{...s,babies:nb,activeBabyId:nb[0]?.id||null};});onClose();}} style={{...css.btnSecondary,borderColor:"#FFBDB5",color:"#DC2626",background:"#FFF1F2"}}>
            Remove {baby.name}
          </button>
        )}

        <div style={{borderTop:"1px solid #F3F4F6",marginTop:16,paddingTop:16,display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>{ onClose(); setTimeout(()=>document.dispatchEvent(new CustomEvent("openBugReport")),50); }} style={{...css.btnSecondary,color:"#6B7280",fontSize:14}}>
            🐛 Report a bug
          </button>
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
// ═══════════════════════════════════════════════════════════════
// BUG REPORT
// ═══════════════════════════════════════════════════════════════
function BugReportSheet({session, onClose}) {
  const [description, setDescription] = useState("");
  const [screen, setScreen] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const body = `**Description:**\n${description}\n\n**Screen/area:**\n${screen||"Not specified"}\n\n**User:**\n${session?.email||"Unknown"}\n\n**App:**\nLilEats v1`;
      await fetch("https://api.github.com/repos/lovelivix/TinyEats/issues", {
        method: "POST",
        headers: {"Content-Type":"application/json","Authorization":"token ghp_placeholder"},
        body: JSON.stringify({title:`Bug: ${description.slice(0,60)}`, body, labels:["bug"]}),
      });
      setSent(true);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300,display:"flex",alignItems:"flex-end",maxWidth:430,margin:"0 auto"}}>
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",padding:"20px 20px 40px"}}>
        {sent ? (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontSize:18,fontWeight:800,color:"#1A1A2E",marginBottom:8}}>Bug reported!</div>
            <div style={{fontSize:13,color:"#6B7280",marginBottom:24}}>Thanks — we'll look into it.</div>
            <button onClick={onClose} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:12,padding:"12px 32px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button>
          </div>
        ) : (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:800,color:"#1A1A2E"}}>🐛 Report a bug</div>
              <button onClick={onClose} style={{background:"#F3F4F6",border:"none",borderRadius:8,width:28,height:28,fontSize:16,cursor:"pointer"}}>×</button>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}>What happened?</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe what went wrong…" style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",resize:"none",height:100,fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}>Which screen? (optional)</label>
              <input value={screen} onChange={e=>setScreen(e.target.value)} placeholder="e.g. Food tracker, Journal, Plan…" style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button onClick={submit} disabled={!description.trim()||loading} style={{width:"100%",padding:"14px",background:description.trim()?"#F25F4C":"#E8EAF0",color:description.trim()?"#fff":"#9CA3AF",borderRadius:12,border:"none",fontSize:15,fontWeight:700,cursor:description.trim()?"pointer":"default"}}>
              {loading?"Sending…":"Send report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BadgeToast({badges, onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[]);
  const b = badges[0];
  return(
    <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:300,width:"calc(100% - 32px)",maxWidth:380}} className="popIn">
      <div style={{background:"#1A1A2E",borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(26,26,46,0.3)"}}>
        <div style={{fontSize:36}}>{b.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#F2B705",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Badge unlocked! 🎉</div>
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
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"22px 18px 44px",animation:"slideUp 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
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
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"22px 18px 44px",animation:"slideUp 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
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
            {item.alert&&<div style={{position:"absolute",top:-2,right:-4,width:8,height:8,borderRadius:"50%",background:"#F25F4C",border:"1.5px solid white"}}/>}
          </div>
          <span style={{fontSize:10,fontWeight:screen===item.id?700:500,color:screen===item.id?"#F25F4C":"#9CA3AF"}}>{item.label}</span>
          {screen===item.id&&<div style={{width:16,height:3,borderRadius:2,background:"#F25F4C",marginTop:-2}}/>}
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
      {[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:"#F25F4C",animation:`dot 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}
    </div>
  );
}
