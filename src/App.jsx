// LilEats — Main App
// Data split into src/data/ files for easier maintenance

import { useState, useEffect, useRef, useCallback } from 'react';


import { GLOBAL_CSS, fe, cap, fmtDate, monthsOld, daysSince, REACTIONS, getStatus } from './data/theme.js';
import { BADGES, WEEKS, READINESS_SIGNS } from './data/weeks.js';
import { ALL_FOODS, FOOD_DB, STAGE_LABEL, STAGE_COLOR, ALLERGENS, daysUntilSafe, MEAL_DB } from './data/foods.js';
import { GUIDE_TOPICS, FAQ_ITEMS, EQUIPMENT, RESOURCES, FOODS_TO_AVOID, CHOKING_HAZARDS } from './data/learn.js';

function defaultProfile() {
  return {weaningStarted:false,weaningStartDate:null,activeWeek:0,foodLog:{},shoppingChecked:{},customFoods:[],earnedBadges:[],seenBadges:[],allergens:{},journal:{},seenMilestones:[]};
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
// DISCLAIMER SPLASH
// ═══════════════════════════════════════════════════════════════
function DisclaimerScreen({onAccept}) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  if (showPrivacy) return <PrivacyScreen onClose={()=>setShowPrivacy(false)}/>;
  if (showTerms) return <TermsScreen onClose={()=>setShowTerms(false)}/>;
  return (
    <div style={{minHeight:"100vh",background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"48px 24px 40px"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/logo-full.png" alt="LilEats" style={{height:44,objectFit:"contain",marginBottom:20,display:"block",marginLeft:"auto",marginRight:"auto"}}/>
          <div style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:6}}>Before you start</div>
          <div style={{fontSize:13,color:"#9CA3AF"}}>Please read this — it only takes a moment</div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          <div style={{display:"flex",gap:12,background:"#F9FAFB",borderRadius:14,padding:"14px"}}>
            <span style={{fontSize:20,flexShrink:0}}>🍐</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E",marginBottom:3}}>Made by a mum, for mums</div>
              <div style={{fontSize:12,color:"#6B7280",lineHeight:1.65}}>LilEats is a free weaning tracker made with love. It is not a medical product or service.</div>
            </div>
          </div>

          <div style={{display:"flex",gap:12,background:"#FFF8F0",borderRadius:14,padding:"14px",border:"1px solid #F2D49A"}}>
            <span style={{fontSize:20,flexShrink:0}}>⚕️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#B8860B",marginBottom:3}}>Not medical advice</div>
              <div style={{fontSize:12,color:"#78350F",lineHeight:1.65}}>Always follow guidance from your GP or health visitor — especially around allergens and reactions. Never delay seeking medical help based on anything in this app.</div>
            </div>
          </div>

          <div style={{display:"flex",gap:12,background:"#FFF1F2",borderRadius:14,padding:"14px",border:"1px solid #FFBDB5"}}>
            <span style={{fontSize:20,flexShrink:0}}>🚨</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#DC2626",marginBottom:3}}>In an emergency, call 999</div>
              <div style={{fontSize:12,color:"#991B1B",lineHeight:1.65}}>If your baby has a serious reaction, difficulty breathing, or you are concerned about their health — call 999 immediately.</div>
            </div>
          </div>
        </div>

        <div style={{fontSize:11,color:"#9CA3AF",lineHeight:1.7,textAlign:"center",marginBottom:8}}>
          By continuing you agree to our{" "}
          <button onClick={()=>setShowPrivacy(true)} style={{background:"none",border:"none",color:"#F25F4C",fontWeight:600,fontSize:11,cursor:"pointer",padding:0,fontFamily:"inherit"}}>Privacy Policy</button>
          {" "}and{" "}
          <button onClick={()=>setShowTerms(true)} style={{background:"none",border:"none",color:"#F25F4C",fontWeight:600,fontSize:11,cursor:"pointer",padding:0,fontFamily:"inherit"}}>Terms of Use</button>.
        </div>
      </div>

      <div style={{width:"100%"}}>
        <button onClick={onAccept} style={{width:"100%",padding:"16px",background:"#F25F4C",color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>
          I understand — let's go! 🍐
        </button>
        <div style={{textAlign:"center",fontSize:11,color:"#D1D5DB"}}>v1.0 · lileats.app</div>
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
  const [showSplash, setShowSplash] = useState(() => {
    try { return !localStorage.getItem("lileats_disclaimer_v1"); } catch { return true; }
  });

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
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    setProfile(p => {
      const newFoodLog = {...p.foodLog, [food]: [...(p.foodLog[food]||[]), {date:now.toISOString(), reaction:rid}]};
      // Auto-create journal entry for today
      const journalEntry = {foods:[food], notes:"", reaction: rid==="reaction", time:now.toISOString(), fromTracker:true};
      const newJournal = {...(p.journal||{}), [todayKey]: [...(p.journal?.[todayKey]||[]), journalEntry]};
      // Auto-start allergen watch
      const foodAllergenId = FOOD_DB[food]?.allergen;
      const allergenId = foodAllergenId;
      const existingAllergen = p.allergens?.[allergenId];
      if (allergenId && !existingAllergen?.introduced) {
        return {
          ...p,
          foodLog: newFoodLog,
          journal: newJournal,
          allergens: {...(p.allergens||{}), [allergenId]: {introduced: now.toISOString(), safe:false, reaction:false, autoStarted:true}},
        };
      }
      return {...p, foodLog: newFoodLog, journal: newJournal};
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

  // Disclaimer splash — shown once only
  if (showSplash) return <DisclaimerScreen onAccept={()=>{
    try { localStorage.setItem("lileats_disclaimer_v1","1"); } catch {}
    setShowSplash(false);
  }}/>;

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
        {screen==="journal"  && <JournalScreen profile={profile} setProfile={setProfile} allFoods={allFoods} baby={baby} />}
        {screen==="learn"    && <LearnScreen />}
        {screen==="wall"     && <FoodsWallScreen profile={profile} allFoods={allFoods} baby={baby} setScreen={setScreen} setOverlay={setOverlay} />}
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
      {overlay?.type==="food"     && <FoodOverlay food={overlay.data} log={profile.foodLog[overlay.data]||[]} onDeleteLast={()=>deleteLastReaction(overlay.data)} onOpenLog={(food)=>setOverlay({type:"logFood",data:food,prev:"food"})} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="logFood"  && (()=>{
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        return <AddJournalEntry
          date={todayKey}
          allFoods={allFoods}
          prefilledFood={overlay.data}
          onSave={(entry) => {
            setProfile(p => {
              const newJournal = {...(p.journal||{}), [todayKey]: [...(p.journal?.[todayKey]||[]), entry]};
              const newFoodLog = {...p.foodLog};
              (entry.foods||[]).forEach(food => {
                newFoodLog[food] = [...(newFoodLog[food]||[]), {date:entry.time||new Date().toISOString(), reaction:entry.reactionType||"good", fromJournal:true}];
                // Auto-start allergen watch if needed
                const allergenId = FOOD_DB[food]?.allergen;
                if (allergenId && !p.allergens?.[allergenId]?.introduced) {
                  p = {...p, allergens:{...(p.allergens||{}), [allergenId]:{introduced:new Date().toISOString(),safe:false,reaction:false,autoStarted:true}}};
                }
              });
              return {...p, journal:newJournal, foodLog:newFoodLog};
            });
            setOverlay(overlay.prev==="food" ? {type:"food",data:overlay.data} : null);
          }}
          onClose={()=>setOverlay(overlay.prev==="food" ? {type:"food",data:overlay.data} : null)}
        />;
      })()}
      {overlay?.type==="addFood"  && <AddFoodSheet onAdd={addCustomFood} onClose={()=>setOverlay(null)} />}
      {overlay?.type==="settings" && <SettingsOverlay state={state} update={update} baby={baby} profile={profile} setProfile={setProfile} onAddBaby={()=>setOverlay({type:"addBaby"})} onClose={()=>setOverlay(null)} onSignOut={signOut} onUpdateBaby={async (id, data) => { await sb.authed(session.token).updateBaby(id, data); }} session={session} onDeleteData={async () => {
        try {
          const api = sb.authed(session.token);
          await api.saveProfile(baby.id, session.userId, {weaningStarted:false,weaningStartDate:null,activeWeek:0,foodLog:{},shoppingChecked:{},customFoods:[],earnedBadges:[],seenBadges:[],allergens:{},journal:{}});
          setProfile(()=>({weaningStarted:false,weaningStartDate:null,activeWeek:0,foodLog:{},shoppingChecked:{},customFoods:[],earnedBadges:[],seenBadges:[],allergens:{},journal:{}}));
        } catch {}
        setOverlay(null);
      }} />}
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
// ─── GAMIFICATION HELPERS ─────────────────────────────────────
const POSITIVE_REACTIONS = ['loved','good','some'];

function getMastery(logs) {
  if (!logs || logs.length === 0) return null;
  const pos = logs.filter(l => POSITIVE_REACTIONS.includes(l.reaction)).length;
  if (logs.length >= 4 && pos >= 3) return 'master';
  if (logs.length >= 2 && pos >= 1) return 'familiar';
  return 'introduced';
}

function computeStreak(journal) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const hasToday = (journal[todayKey]||[]).length > 0;
  let streak = 0;
  const d = new Date(today);
  if (!hasToday) d.setDate(d.getDate() - 1); // allow today not yet logged
  while (true) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if ((journal[k]||[]).length > 0) { streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

const MILESTONES = [
  {n:10,  emoji:"🎉", badge:"First 10!"},
  {n:25,  emoji:"⭐", badge:"25 foods!"},
  {n:50,  emoji:"🏆", badge:"Halfway to 100!"},
  {n:75,  emoji:"🌟", badge:"75 foods!"},
  {n:100, emoji:"👑", badge:"100 foods champion!"},
];

// ─── HOME SCREEN ──────────────────────────────────────────────
function HomeScreen({baby, profile, setProfile, cw, weaningComplete, setScreen, setOverlay, state}) {
  const months = monthsOld(baby.dob);
  const tried = Object.keys(profile.foodLog).filter(f=>profile.foodLog[f]?.length>0);
  const badges = profile.earnedBadges||[];
  const stale = tried.filter(f=>{const l=profile.foodLog[f];return l?.length&&daysSince(l[l.length-1].date)>4;}).slice(0,3);
  const streak = computeStreak(profile.journal||{});
  const [showJournalAdd, setShowJournalAdd] = useState(false);
  const [undoBuffer, setUndoBuffer] = useState(null);
  const undoTimerRef = useRef(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const toggleNote = (idx) => setExpandedNotes(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  const [editingHomeIdx, setEditingHomeIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef(null);
  const [pendingMilestone, setPendingMilestone] = useState(null);
  const confettiColors = ["#F25F4C","#F2B705","#7FB069","#6FA3D2","#C77DFF","#ffffff"];

  const triggerConfetti = () => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    setShowConfetti(true);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3500);
  };
  const allFoods = [...new Set([...ALL_FOODS,...(profile.customFoods||[]),...Object.keys(profile.foodLog)])].sort();
  const todayKey = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

  const deleteHomeEntry = (idx) => {
    const entry = (profile.journal?.[todayKey]||[])[idx];
    setProfile(p => {
      const entries = [...(p.journal?.[todayKey]||[])];
      entries.splice(idx, 1);
      const newJournal = {...(p.journal||{}), [todayKey]: entries};
      if (entries.length === 0) delete newJournal[todayKey];
      return {...p, journal:newJournal};
    });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoBuffer({idx, entry});
    undoTimerRef.current = setTimeout(() => setUndoBuffer(null), 4000);
  };

  const undoHomeDelete = () => {
    if (!undoBuffer) return;
    const {idx, entry} = undoBuffer;
    setProfile(p => {
      const entries = [...(p.journal?.[todayKey]||[])];
      entries.splice(idx, 0, entry);
      return {...p, journal:{...(p.journal||{}), [todayKey]:entries}};
    });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoBuffer(null);
  };

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

      {/* Gamification Hero Card */}
      <div style={{padding:"0 16px 14px"}}>
        <div style={{background:"linear-gradient(135deg,#F25F4C 0%,#F2B705 100%)",borderRadius:22,padding:"16px",display:"flex",alignItems:"center",gap:14,position:"relative",overflow:"hidden",boxShadow:"0 6px 24px rgba(242,95,76,0.3)"}}>
          <div style={{position:"absolute",right:-30,top:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
          <div style={{position:"absolute",right:20,bottom:-20,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
          {/* Baby photo */}
          <div style={{width:64,height:64,borderRadius:"50%",border:"3px solid rgba(255,255,255,0.7)",overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
            {baby.photo ? <img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={baby.name}/> : <span style={{fontSize:30}}>👶</span>}
          </div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:17,fontWeight:800,color:"#fff",marginBottom:1,textShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>{baby.name}</div>
            <div style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.85)",marginBottom:8}}>Week {profile.activeWeek+1} of weaning</div>
            {/* Progress bar toward 100 foods */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:7,background:"rgba(255,255,255,0.3)",borderRadius:10,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,(tried.length/100)*100)}%`,background:"#fff",borderRadius:10,transition:"width 0.6s cubic-bezier(0.16,1,0.3,1)"}}/>
              </div>
              <span style={{fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{tried.length}/100</span>
            </div>
            {/* Streak pill */}
            {streak >= 2 && (
              <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"3px 10px",backdropFilter:"blur(4px)"}}>
                <span style={{fontSize:13}}>🔥</span>
                <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{streak}-day streak!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week pill — compact link to plan */}
      <div style={{padding:"0 16px 14px"}}>
        <button onClick={()=>setScreen("plan")} style={{display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${cw.color}22,${cw.color}11)`,border:`1.5px solid ${cw.color}55`,borderRadius:14,padding:"10px 14px",width:"100%",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:cw.accent,flexShrink:0}}/>
          <span style={{fontSize:12,fontWeight:700,color:cw.accent}}>{cw.title}</span>
          <span style={{fontSize:11,color:"#9CA3AF",marginLeft:"auto"}}>Week {profile.activeWeek+1} of 6</span>
          <span style={{fontSize:12,color:cw.accent}}>→</span>
        </button>
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
      {(()=>{
        const todayEntries = (profile.journal||{})[todayKey] || [];
        return (
          <div style={{padding:"0 16px",marginBottom:16}}>
            <div style={{background:"#FFFFFF",borderRadius:20,boxShadow:"0 4px 20px rgba(26,26,46,0.08)",padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:todayEntries.length>0?12:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E"}}>🍽 What did {baby.name} eat today?</div>
                <button onClick={()=>setShowJournalAdd(true)} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
              </div>
              {todayEntries.length===0 ? (
                <div style={{fontSize:12,color:"#9CA3AF",marginTop:8}}>Nothing logged yet — tap + Add to record today's meals.</div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {todayEntries.map((entry,idx)=>{
                    const rxn = entry.reactionType ? REACTIONS.find(x=>x.id===entry.reactionType) : null;
                    const noteOpen = expandedNotes.has(idx);
                    const firstFood = entry.foods?.[0];
                    const extraCount = (entry.foods?.length||0) - 1;
                    return (
                      <div key={idx} style={{background:entry.reaction?"#FFF5F5":"#F9FAFB",borderRadius:16,padding:"10px 10px 8px",border:entry.reaction?"1.5px solid #FECACA":"1.5px solid #F3F4F6",display:"flex",flexDirection:"column",position:"relative",minHeight:100}}>
                        {/* Edit + Delete */}
                        <div style={{position:"absolute",top:5,right:6,display:"flex",gap:2}}>
                          <button onClick={()=>setEditingHomeIdx(idx)} style={{background:"none",border:"none",fontSize:12,cursor:"pointer",padding:"1px 2px",lineHeight:1}}>✏️</button>
                          <button onClick={()=>deleteHomeEntry(idx)} style={{background:"none",border:"none",color:"#D1D5DB",fontSize:14,cursor:"pointer",padding:"1px 2px",lineHeight:1}}>×</button>
                        </div>
                        {/* Primary emoji */}
                        <span style={{fontSize:38,lineHeight:1,marginBottom:3}}>{fe(firstFood||"")}</span>
                        {/* Food name(s) */}
                        <div style={{fontSize:11,fontWeight:700,color:"#1A1A2E",marginBottom:4,lineHeight:1.3,paddingRight:14}}>
                          {cap(firstFood||"")}
                          {extraCount>0&&<span style={{color:"#9CA3AF",fontWeight:500}}>{" +"+extraCount}</span>}
                        </div>
                        {/* Reaction chip */}
                        {rxn ? (
                          <span style={{background:rxn.color,borderRadius:20,padding:"2px 7px",fontSize:10,fontWeight:600,color:rxn.text,display:"inline-block",marginBottom:3,alignSelf:"flex-start"}}>{rxn.emoji} {rxn.label}</span>
                        ) : entry.reaction ? (
                          <span style={{background:"#FFF1F2",borderRadius:20,padding:"2px 7px",fontSize:10,fontWeight:600,color:"#DC2626",display:"inline-block",marginBottom:3,alignSelf:"flex-start"}}>⚠ Reaction</span>
                        ) : null}
                        {/* Time + note chip */}
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:"auto",paddingTop:2}}>
                          <span style={{fontSize:10,color:"#9CA3AF",flex:1}}>{new Date(entry.time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>
                          {entry.notes&&<button onClick={()=>toggleNote(idx)} style={{background:"none",border:"1px solid #E8EAF0",borderRadius:20,padding:"1px 6px",fontSize:9,fontWeight:600,color:"#9CA3AF",cursor:"pointer"}}>💬</button>}
                        </div>
                        {/* Note — expanded */}
                        {entry.notes&&noteOpen&&(
                          <div style={{fontSize:11,color:"#6B7280",marginTop:5,lineHeight:1.5,padding:"5px 7px",background:"#FFFFFF",borderRadius:8,border:"1px solid #F3F4F6"}}>{entry.notes}</div>
                        )}
                      </div>
                    );
                  })}
                  {undoBuffer&&(
                    <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1A1A2E",borderRadius:12,padding:"10px 14px"}}>
                      <span style={{fontSize:12,color:"#D1D5DB"}}>Entry deleted</span>
                      <button onClick={undoHomeDelete} style={{background:"#F25F4C",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Undo</button>
                    </div>
                  )}
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

      {/* Quick actions */}
      <div style={{padding:"0 16px",marginBottom:16}}>
        {/* Log a meal — primary CTA */}
        <button onClick={()=>setShowJournalAdd(true)} style={{width:"100%",padding:"16px",background:"#F25F4C",color:"#fff",border:"none",borderRadius:18,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 6px 20px rgba(242,95,76,0.4)",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{fontSize:22}}>🍽</span> Log a meal
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <ActionCard emoji="🏆" label="100 Foods Wall" sub={`${tried.length}/100 tried`} onClick={()=>setScreen("wall")} color="#FFF1F2" accent="#F25F4C"/>
          <ActionCard emoji="📊" label="Food Tracker" sub={`${tried.length} tried`} onClick={()=>setScreen("tracker")} color="#EFF6FF" accent="#6FA3D2"/>
          <ActionCard emoji="🥗" label="Meal Ideas" sub="Recipes & ideas" onClick={()=>setScreen("meals")} color="#F0FFF4" accent="#7FB069"/>
          <ActionCard emoji="📚" label="Learn" sub="NHS guide & tips" onClick={()=>setScreen("learn")} color="#FDF4FF" accent="#C77DFF"/>
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
            // Check for brand new foods before saving
            const newFoods = (entry.foods||[]).filter(f => !profile.foodLog[f] || profile.foodLog[f].length === 0);
            const newTriedCount = tried.length + newFoods.length;
            setProfile(p => {
              const newJournal = {...(p.journal||{}), [todayKey]: [...(p.journal?.[todayKey]||[]), entry]};
              const newFoodLog = {...p.foodLog};
              (entry.foods||[]).forEach(food => {
                newFoodLog[food] = [...(newFoodLog[food]||[]), {date:entry.time||new Date().toISOString(), reaction:entry.reactionType||"good", fromJournal:true}];
              });
              // Check milestone and mark as seen
              const seenMs = p.seenMilestones||[];
              const milestone = MILESTONES.find(m => newTriedCount >= m.n && tried.length < m.n && !seenMs.includes(m.n));
              if (milestone) {
                setTimeout(() => setPendingMilestone({...milestone, babyName: baby.name}), 600);
                return {...p, journal:newJournal, foodLog:newFoodLog, seenMilestones:[...seenMs, milestone.n]};
              }
              return {...p, journal:newJournal, foodLog:newFoodLog};
            });
            if (newFoods.length > 0) triggerConfetti();
            setShowJournalAdd(false);
          }}
          onClose={()=>setShowJournalAdd(false)}
        />
      )}

      {editingHomeIdx !== null && ((profile.journal||{})[todayKey]||[])[editingHomeIdx] && (
        <AddJournalEntry
          date={todayKey}
          allFoods={allFoods}
          editEntry={((profile.journal||{})[todayKey]||[])[editingHomeIdx]}
          onSave={(updatedEntry) => {
            setProfile(p => {
              const entries = [...(p.journal?.[todayKey]||[])];
              const originalFoods = entries[editingHomeIdx]?.foods || [];
              entries[editingHomeIdx] = updatedEntry;
              const newFoodLog = {...p.foodLog};
              (updatedEntry.foods||[]).forEach(food => {
                if (!originalFoods.includes(food)) {
                  newFoodLog[food] = [...(newFoodLog[food]||[]), {date:updatedEntry.time||new Date().toISOString(), reaction:updatedEntry.reactionType||"good", fromJournal:true}];
                }
              });
              return {...p, journal:{...(p.journal||{}), [todayKey]:entries}, foodLog:newFoodLog};
            });
            setEditingHomeIdx(null);
          }}
          onClose={()=>setEditingHomeIdx(null)}
        />
      )}

      {/* Confetti burst on new food */}
      {showConfetti && (
        <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
          {Array.from({length:36}).map((_,i) => (
            <div key={i} style={{position:"absolute",top:"-20px",left:`${(i/36)*100}%`,width:i%3===0?10:7,height:i%3===0?10:7,borderRadius:i%2===0?"50%":2,background:confettiColors[i%confettiColors.length],animation:`confetti ${1.8+Math.random()*2}s ${Math.random()*0.6}s ease-in forwards`}}/>
          ))}
        </div>
      )}

      {/* Milestone achievement modal */}
      {pendingMilestone && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1001,padding:24,backdropFilter:"blur(6px)"}} onClick={()=>setPendingMilestone(null)}>
          <div className="popIn" style={{background:"#fff",borderRadius:28,padding:"36px 28px",textAlign:"center",maxWidth:320,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
            {/* Mini confetti inside modal */}
            <div style={{fontSize:56,marginBottom:8,lineHeight:1}}>{pendingMilestone.emoji}</div>
            {baby.photo && (
              <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",margin:"0 auto 16px",border:"4px solid #F25F4C",boxShadow:"0 6px 24px rgba(242,95,76,0.35)"}}>
                <img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={baby.name}/>
              </div>
            )}
            <div style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:8,lineHeight:1.3}}>
              {pendingMilestone.babyName} tried {pendingMilestone.n} foods!
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#FFF1F2",borderRadius:20,padding:"6px 16px",marginBottom:20}}>
              <span style={{fontSize:14}}>{pendingMilestone.emoji}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#F25F4C"}}>{pendingMilestone.badge}</span>
            </div>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:20}}>📸 Screenshot to share with family!</div>
            <button onClick={()=>setPendingMilestone(null)} style={{width:"100%",padding:"15px",background:"#F25F4C",color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(242,95,76,0.4)"}}>Keep going! 🚀</button>
          </div>
        </div>
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
// ═══════════════════════════════════════════════════════════════
// 100 FOODS WALL
// ═══════════════════════════════════════════════════════════════
function FoodsWallScreen({profile, allFoods, baby, setScreen, setOverlay}) {
  const foodLog = profile.foodLog || {};
  const tried = allFoods.filter(f => (foodLog[f]?.length||0) > 0);
  const notTried = allFoods.filter(f => (foodLog[f]?.length||0) === 0);
  // Show tried first, then untried, pad to 100 with placeholder slots
  const wallFoods = [...tried, ...notTried];
  const totalSlots = Math.max(100, wallFoods.length);
  const emptySlots = Math.max(0, 100 - wallFoods.length);
  const pct = Math.min(100, Math.round((tried.length / 100) * 100));

  return (
    <div className="fadeUp">
      {/* Header */}
      <div style={{padding:"22px 20px 14px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setScreen("home")} style={{background:"#F3F4F6",border:"none",borderRadius:10,width:36,height:36,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:"#1A1A2E"}}>100 Foods Wall</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>Goal: introduce 100 foods before age 1</div>
        </div>
      </div>

      {/* Progress hero */}
      <div style={{padding:"0 16px 16px"}}>
        <div style={{background:"linear-gradient(135deg,#F25F4C,#F2B705)",borderRadius:22,padding:"20px",position:"relative",overflow:"hidden",boxShadow:"0 6px 24px rgba(242,95,76,0.3)"}}>
          <div style={{position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            {baby.photo
              ? <div style={{width:56,height:56,borderRadius:"50%",overflow:"hidden",border:"3px solid rgba(255,255,255,0.7)",flexShrink:0,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}><img src={baby.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt={baby.name}/></div>
              : <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:"3px solid rgba(255,255,255,0.5)",flexShrink:0}}>👶</div>
            }
            <div>
              <div style={{fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>{tried.length}<span style={{fontSize:16,fontWeight:600,opacity:0.8}}>/100</span></div>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.9)",marginTop:2}}>{baby.name} has tried {tried.length} food{tried.length!==1?"s":""}</div>
            </div>
          </div>
          <div style={{height:10,background:"rgba(255,255,255,0.3)",borderRadius:10,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:`${pct}%`,background:"#fff",borderRadius:10,transition:"width 0.6s cubic-bezier(0.16,1,0.3,1)"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:600}}>{pct}% of the way there!</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.8)"}}>{100-tried.length} to go</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{padding:"0 16px 12px",display:"flex",gap:12,flexWrap:"wrap"}}>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7280"}}><span style={{width:16,height:16,borderRadius:6,background:"#F25F4C",display:"inline-block"}}/>Tried</span>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7280"}}><span style={{width:16,height:16,borderRadius:6,background:"#E5E7EB",display:"inline-block"}}/>Not yet</span>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7280"}}>⭐ Familiar</span>
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7280"}}>👑 Master</span>
      </div>

      {/* The wall grid */}
      <div style={{padding:"0 16px 32px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {wallFoods.map(f => {
            const log = foodLog[f] || [];
            const isTried = log.length > 0;
            const mastery = getMastery(log);
            const isMaster = mastery === 'master';
            const isFamiliar = mastery === 'familiar';
            return (
              <button key={f} onClick={()=>setOverlay({type:"food",data:f})}
                style={{
                  aspectRatio:"1",
                  minWidth:0,
                  overflow:"hidden",
                  borderRadius:16,
                  border:`2px solid ${isTried?(isMaster?"#F2B705":"#FFD6D0"):"#F3F4F6"}`,
                  background:isTried?(isMaster?"#FFFBEB":"#FFF8F7"):"#F9FAFB",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  gap:2,cursor:"pointer",padding:"4px 2px",position:"relative",
                  boxShadow:isTried?"0 2px 8px rgba(242,95,76,0.12)":"none",
                  opacity:isTried?1:0.45,
                  transition:"transform 0.1s,opacity 0.15s",
                  boxSizing:"border-box",
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.opacity="1";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.opacity=isTried?"1":"0.45";}}>
                {(isMaster||isFamiliar)&&<div style={{position:"absolute",top:3,right:3,fontSize:10,lineHeight:1}}>{isMaster?"👑":"⭐"}</div>}
                <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>{fe(f)}</span>
                <span style={{fontSize:8,fontWeight:700,color:isTried?"#F25F4C":"#9CA3AF",textAlign:"center",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",width:"100%",display:"block",paddingLeft:2,paddingRight:2,boxSizing:"border-box"}}>{f}</span>
              </button>
            );
          })}
          {/* Empty slots to pad to 100 */}
          {Array.from({length:emptySlots}).map((_,i)=>(
            <div key={`empty-${i}`} style={{aspectRatio:"1",minWidth:0,overflow:"hidden",borderRadius:16,border:"2px dashed #E5E7EB",background:"#FAFAFA",display:"flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box"}}>
              <span style={{fontSize:16,opacity:0.25}}>＋</span>
            </div>
          ))}
        </div>
        {tried.length === 100 && (
          <div style={{marginTop:20,background:"linear-gradient(135deg,#F25F4C,#F2B705)",borderRadius:20,padding:"24px",textAlign:"center",boxShadow:"0 8px 32px rgba(242,95,76,0.35)"}}>
            <div style={{fontSize:48,marginBottom:8}}>👑</div>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:4}}>{baby.name} is a 100-food champion!</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.9)"}}>What an incredible weaning journey 🎉</div>
          </div>
        )}
      </div>
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
                {(()=>{const m=getMastery(log);if(m==='master')return<div style={{position:"absolute",top:8,left:10,fontSize:16,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.15))"}}>👑</div>;if(m==='familiar')return<div style={{position:"absolute",top:8,left:10,fontSize:14}}>⭐</div>;return null;})()}
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
function JournalScreen({profile, setProfile, allFoods, baby}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [undoBuffer, setUndoBuffer] = useState(null);
  const undoTimerRef = useRef(null);
  const [editingIdx, setEditingIdx] = useState(null);

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
    const entry = (profile.journal?.[dateKey]||[])[idx];
    setProfile(p => {
      const entries = [...(p.journal?.[dateKey]||[])];
      entries.splice(idx, 1);
      const newJournal = {...(p.journal||{}), [dateKey]: entries};
      if (entries.length === 0) delete newJournal[dateKey];
      return {...p, journal:newJournal};
    });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoBuffer({dateKey, idx, entry});
    undoTimerRef.current = setTimeout(() => setUndoBuffer(null), 4000);
  };

  const undoDelete = () => {
    if (!undoBuffer) return;
    const {dateKey, idx, entry} = undoBuffer;
    setProfile(p => {
      const entries = [...(p.journal?.[dateKey]||[])];
      entries.splice(idx, 0, entry);
      return {...p, journal:{...(p.journal||{}), [dateKey]:entries}};
    });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoBuffer(null);
  };

  return (
    <div className="fadeUp">
      <div style={{padding:"22px 20px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:24,fontWeight:800,color:"#1A1A2E"}}>Food Journal</div>
          <div style={{fontSize:13,color:"#6B7280",marginTop:4}}>Tap a day to see or add entries</div>
        </div>
        <button onClick={()=>setShowExport(true)} style={{display:"flex",alignItems:"center",gap:5,background:"#EFF6FF",border:"none",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,color:"#6FA3D2",cursor:"pointer",marginTop:4,flexShrink:0}}>
          📋 Export
        </button>
      </div>
      {showExport && baby && <ExportSheet baby={baby} profile={profile} onClose={()=>setShowExport(false)}/>}

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
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:(entry.notes||entry.reactionType)?6:0}}>
                      {entry.foods?.map(f=>(
                        <span key={f} style={{background:"#F0FFF4",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#065F46"}}>{fe(f)} {cap(f)}</span>
                      ))}
                      {entry.reactionType ? (()=>{
                        const r = REACTIONS.find(x=>x.id===entry.reactionType);
                        return r ? <span style={{background:r.color,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:r.text}}>{r.emoji} {r.label}</span> : null;
                      })() : entry.reaction ? <span style={{background:"#FFF1F2",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#DC2626"}}>⚠ Reaction</span> : null}
                    </div>
                    {entry.notes && <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{entry.notes}</div>}
                    <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>{formatTime(entry.time)}</div>
                  </div>
                  <div style={{display:"flex",gap:2,flexShrink:0}}>
                    <button onClick={()=>setEditingIdx(idx)} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:14,cursor:"pointer",padding:"0 4px"}}>✏️</button>
                    <button onClick={()=>deleteEntry(selectedDate,idx)} style={{background:"none",border:"none",color:"#D1D5DB",fontSize:18,cursor:"pointer",padding:"0 4px"}}>×</button>
                  </div>
                </div>
              </div>
            ))}
            {undoBuffer && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1A1A2E",borderRadius:12,padding:"10px 14px",marginTop:4}}>
                <span style={{fontSize:12,color:"#D1D5DB"}}>Entry deleted</span>
                <button onClick={undoDelete} style={{background:"#F25F4C",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Undo</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddSheet && (
        <AddJournalEntry
          date={selectedDate}
          allFoods={allFoods}
          onSave={(entry) => {
            setProfile(p => {
              const newJournal = {...(p.journal||{}), [selectedDate]: [...(p.journal?.[selectedDate]||[]), entry]};
              const newFoodLog = {...p.foodLog};
              (entry.foods||[]).forEach(food => {
                newFoodLog[food] = [...(newFoodLog[food]||[]), {date:entry.time||new Date().toISOString(), reaction:entry.reactionType||"good", fromJournal:true}];
              });
              return {...p, journal:newJournal, foodLog:newFoodLog};
            });
            setShowAddSheet(false);
          }}
          onClose={()=>setShowAddSheet(false)}
        />
      )}

      {editingIdx !== null && selectedEntries[editingIdx] && (
        <AddJournalEntry
          date={selectedDate}
          allFoods={allFoods}
          editEntry={selectedEntries[editingIdx]}
          onSave={(updatedEntry) => {
            setProfile(p => {
              const entries = [...(p.journal?.[selectedDate]||[])];
              const originalFoods = entries[editingIdx]?.foods || [];
              entries[editingIdx] = updatedEntry;
              const newJournal = {...(p.journal||{}), [selectedDate]: entries};
              // Add any newly introduced foods to foodLog (don't remove old ones)
              const newFoodLog = {...p.foodLog};
              (updatedEntry.foods||[]).forEach(food => {
                if (!originalFoods.includes(food)) {
                  newFoodLog[food] = [...(newFoodLog[food]||[]), {date:updatedEntry.time||new Date().toISOString(), reaction:updatedEntry.reactionType||"good", fromJournal:true}];
                }
              });
              return {...p, journal:newJournal, foodLog:newFoodLog};
            });
            setEditingIdx(null);
          }}
          onClose={()=>setEditingIdx(null)}
        />
      )}
    </div>
  );
}

function AddJournalEntry({date, allFoods, prefilledFood=null, editEntry=null, onSave, onClose}) {
  const isEditing = !!editEntry;
  const [selectedFoods, setSelectedFoods] = useState(() => {
    if (editEntry) return editEntry.foods || [];
    if (prefilledFood) return [prefilledFood];
    return [];
  });
  const [customFood, setCustomFood] = useState("");
  const [notes, setNotes] = useState(editEntry?.notes || "");
  const [reactionType, setReactionType] = useState(editEntry?.reactionType || null);
  const [time, setTime] = useState(() => {
    if (editEntry?.time) {
      const d = new Date(editEntry.time);
      return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    }
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
    onSave({foods:selectedFoods, notes:notes.trim(), reactionType, reaction: reactionType==="reaction", time:dt.toISOString()});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"flex-end",maxWidth:430,margin:"0 auto"}}>
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",padding:"20px 20px 40px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A1A2E"}}>{isEditing ? "Edit entry" : prefilledFood ? `Log ${cap(prefilledFood)}` : "Log a meal"}</div>
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
          {prefilledFood ? (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              <span style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:"#F25F4C",color:"#fff"}}>
                {fe(prefilledFood)} {cap(prefilledFood)}
              </span>
              {selectedFoods.filter(f=>f!==prefilledFood).map(f=>(
                <button key={f} onClick={()=>toggleFood(f)} style={{padding:"5px 10px",borderRadius:20,fontSize:12,fontWeight:700,background:"#F25F4C",color:"#fff",border:"none",cursor:"pointer"}}>
                  {fe(f)} {cap(f)} ×
                </button>
              ))}
              <button onClick={()=>setSearch(s=>s===""?"\u200b":"")} style={{padding:"5px 10px",borderRadius:20,fontSize:12,background:"#F3F4F6",color:"#6B7280",border:"none",cursor:"pointer"}}>+ add more</button>
            </div>
          ) : (
            <div style={{position:"relative",marginBottom:8}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{width:"100%",padding:"8px 12px 8px 30px",borderRadius:10,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
          )}
          {(!prefilledFood || search) && (
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
          )}

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
          {selectedFoods.filter(f=>!allFoods.includes(f) && f!==prefilledFood).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {selectedFoods.filter(f=>!allFoods.includes(f) && f!==prefilledFood).map(f=>(
                <span key={f} onClick={()=>setSelectedFoods(p=>p.filter(x=>x!==f))} style={{background:"#F0F4FF",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#6FA3D2",cursor:"pointer"}}>✏️ {cap(f)} ×</span>
              ))}
            </div>
          )}
        </div>

        {/* How did it go — reaction type */}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:8}}>How did it go? (optional)</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {REACTIONS.map(r=>(
              <button key={r.id} onClick={()=>setReactionType(rt=>rt===r.id?null:r.id)}
                style={{display:"flex",alignItems:"center",gap:7,background:reactionType===r.id?r.color:"#F9FAFB",border:`1.5px solid ${reactionType===r.id?"transparent":"#E8EAF0"}`,borderRadius:12,padding:"9px 12px",cursor:"pointer",fontFamily:"inherit",boxShadow:reactionType===r.id?"0 2px 8px rgba(26,26,46,0.1)":"none",transition:"all 0.1s"}}>
                <span style={{fontSize:18}}>{r.emoji}</span>
                <span style={{fontSize:12,fontWeight:reactionType===r.id?700:500,color:reactionType===r.id?r.text:"#374151"}}>{r.label}</span>
                {reactionType===r.id&&<span style={{marginLeft:"auto",fontSize:11,color:r.text}}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:700,color:"#6B7280",letterSpacing:"0.08em",textTransform:"uppercase",display:"block",marginBottom:6}}>Notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Pulled a face but ate half. Seemed to enjoy the texture…"
            style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",resize:"none",height:80,fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>

        <button onClick={save} disabled={selectedFoods.length===0} style={{width:"100%",padding:"14px",background:selectedFoods.length>0?"#F25F4C":"#E8EAF0",color:selectedFoods.length>0?"#fff":"#9CA3AF",borderRadius:12,border:"none",fontSize:15,fontWeight:700,cursor:selectedFoods.length>0?"pointer":"default"}}>
          {isEditing ? "Save changes" : "Save entry"}
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
function FoodOverlay({food, log, onDeleteLast, onOpenLog, onClose}) {
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

      {/* Log meal button + recent history */}
      <div style={{padding:"0 16px 14px"}}>
        <button onClick={()=>onOpenLog(food)}
          style={{width:"100%",background:"#F25F4C",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(242,95,76,0.3)",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          📝 Log today's meal
        </button>
        {log.length>0&&(
          <div style={{...css.card,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:11,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Recent</div>
              <button onClick={onDeleteLast} style={{fontSize:11,color:"#F25F4C",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>↩ Undo last</button>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[...log].reverse().slice(0,5).map((e,i)=>{
                const r=REACTIONS.find(x=>x.id===e.reaction);
                return<span key={i} style={{fontSize:11,background:"#F9FAFB",borderRadius:8,padding:"4px 8px",color:"#6B7280",border:"1px solid #F3F4F6"}}>{r?.emoji} {fmtDate(e.date)}</span>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Prep & Recipes */}
      {!db?(
        <div style={{padding:"0 16px 32px"}}>
          <div style={{background:"#FFFFFF",borderRadius:12,padding:"16px",fontSize:13,color:"#6B7280",lineHeight:1.7}}>
            No detailed guide yet for {cap(food)}. Use the button above to log when you offer it.
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
function SettingsOverlay({state, update, baby, profile, setProfile, onAddBaby, onClose, onSignOut, onUpdateBaby, session, onDeleteData}) {
  const [name, setName] = useState(baby.name);
  const [dob, setDob] = useState(baby.dob);
  const [photo, setPhoto] = useState(baby.photo||null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showExport, setShowExport] = useState(false);
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
    <>
    <div style={{position:"fixed",inset:0,background:"#F5F5F5",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:100}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 0 100px"}} className="fadeUp">
        <h2 style={{fontSize:24,fontWeight:800,color:"#1A1A2E",padding:"0 20px 20px"}}>Settings</h2>

        {/* BABY PROFILE */}
        <div style={{padding:"0 16px",marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:4}}>Baby profile</div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            {/* Photo + name row */}
            <div style={{padding:"16px",display:"flex",alignItems:"center",gap:14,borderBottom:"1px solid #F3F4F6"}}>
              <button onClick={()=>fileRef.current?.click()} style={{width:56,height:56,borderRadius:"50%",border:"2px dashed #E8EAF0",background:photo?"transparent":"#F9FAFB",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                {photo?<img src={photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{textAlign:"center"}}><div style={{fontSize:20}}>📷</div><div style={{fontSize:9,color:"#9CA3AF"}}>Change</div></div>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
              <div style={{flex:1}}>
                <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",fontSize:15,fontWeight:700,color:"#1A1A2E",border:"none",outline:"none",background:"transparent",padding:0,fontFamily:"inherit"}} placeholder="Baby's name"/>
                <input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{width:"100%",fontSize:12,color:"#6B7280",border:"none",outline:"none",background:"transparent",padding:0,marginTop:2,fontFamily:"inherit"}}/>
              </div>
              <button onClick={save} style={{background:saved?"#7FB069":"#F25F4C",color:"#fff",border:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                {saved?"✓ Saved":"Save"}
              </button>
            </div>
            {/* Add baby */}
            <button onClick={onAddBaby} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",borderBottom:state.babies.length>1?"1px solid #F3F4F6":"none"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#F0FFF4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>➕</div>
              <span style={{fontSize:14,color:"#065F46",fontWeight:600}}>Add another baby</span>
              <span style={{marginLeft:"auto",color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
            {/* Switch baby */}
            {state.babies.length>1 && state.babies.map(b=>(
              <div key={b.id} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #F3F4F6"}}>
                <div style={{width:32,height:32,borderRadius:"50%",overflow:"hidden",background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {b.photo?<img src={b.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:16}}>👶</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1A1A2E"}}>{b.name}</div>
                  <div style={{fontSize:11,color:"#9CA3AF"}}>{monthsOld(b.dob)} months old</div>
                </div>
                {b.id!==state.activeBabyId
                  ?<button onClick={()=>{ update(s=>({...s,activeBabyId:b.id})); onClose(); }} style={{background:"#F25F4C",color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Switch</button>
                  :<span style={{fontSize:12,color:"#F25F4C",fontWeight:700}}>Active ✓</span>
                }
              </div>
            ))}
            {state.babies.length>1&&(
              <button onClick={()=>{update(s=>{const nb=s.babies.filter(b=>b.id!==baby.id);return{...s,babies:nb,activeBabyId:nb[0]?.id||null};});onClose();}} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <div style={{width:32,height:32,borderRadius:9,background:"#FFF1F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🗑</div>
                <span style={{fontSize:14,color:"#DC2626",fontWeight:600}}>Remove {baby.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* TOOLS */}
        <div style={{padding:"0 16px",marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:4}}>Tools</div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>window.open("https://buy.stripe.com/aFaaEZ3Tw6bHfLx3kq6AM0j","_blank")} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",borderBottom:"1px solid #F3F4F6"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#FFFBEB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>☕</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:"#1A1A2E",fontWeight:600}}>Support LilEats</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>Made by a mum, for mums — buy us a coffee</div>
              </div>
              <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
            <button onClick={()=>setShowExport(true)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:"#1A1A2E",fontWeight:600}}>Export health summary</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>PDF for your GP or health visitor · Free in beta</div>
              </div>
              <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
          </div>
        </div>

        {/* DATA & PRIVACY */}
        <div style={{padding:"0 16px",marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:4}}>Data & privacy</div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>setShowPrivacy(true)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",borderBottom:"1px solid #F3F4F6"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📄</div>
              <span style={{fontSize:14,color:"#1A1A2E",fontWeight:600,flex:1}}>Privacy Policy</span>
              <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
            <button onClick={()=>setShowTerms(true)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",borderBottom:"1px solid #F3F4F6"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📋</div>
              <span style={{fontSize:14,color:"#1A1A2E",fontWeight:600,flex:1}}>Terms of Use</span>
              <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
            {!confirmDelete ? (
              <button onClick={()=>setConfirmDelete(true)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <div style={{width:32,height:32,borderRadius:9,background:"#FFF1F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🗑</div>
                <span style={{fontSize:14,color:"#DC2626",fontWeight:600,flex:1}}>Delete {baby.name}'s data</span>
                <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
              </button>
            ) : (
              <div style={{padding:"14px 16px",background:"#FFF1F2"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#DC2626",marginBottom:6}}>Are you sure?</div>
                <p style={{fontSize:12,color:"#6B7280",lineHeight:1.6,marginBottom:12}}>Permanently deletes all food logs, journal entries, allergen records and progress for {baby.name}. Cannot be undone.</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setConfirmDelete(false)} style={{...css.btnSecondary,flex:1,fontSize:13}}>Cancel</button>
                  <button onClick={onDeleteData} style={{flex:1,padding:"12px",background:"#DC2626",color:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer"}}>Yes, delete</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT */}
        <div style={{padding:"0 16px",marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:4}}>Account</div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <button onClick={()=>{ onClose(); setTimeout(()=>document.dispatchEvent(new CustomEvent("openBugReport")),50); }} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left",borderBottom:"1px solid #F3F4F6"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🐛</div>
              <span style={{fontSize:14,color:"#1A1A2E",fontWeight:600,flex:1}}>Report a bug</span>
              <span style={{color:"#D1D5DB",fontSize:16}}>›</span>
            </button>
            <button onClick={onSignOut} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🚪</div>
              <span style={{fontSize:14,color:"#6B7280",fontWeight:600,flex:1}}>Sign out</span>
            </button>
          </div>
        </div>

        <div style={{textAlign:"center",paddingBottom:20}}>
          <span style={{fontSize:11,color:"#D1D5DB"}}>LilEats · lileats.app · v1.0</span>
        </div>
      </div>
    </div>
    {showPrivacy && <PrivacyScreen onClose={()=>setShowPrivacy(false)}/>}
    {showTerms && <TermsScreen onClose={()=>setShowTerms(false)}/>}
    {showExport && <ExportSheet baby={baby} profile={profile} onClose={()=>setShowExport(false)}/>}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT SHEET
// ═══════════════════════════════════════════════════════════════
function ExportSheet({baby, profile, onClose}) {
  const [notes, setNotes] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  if (showSummary) {
    const log = profile.foodLog||{};
    const tried = Object.keys(log).filter(f=>log[f]?.length>0);
    const confident = tried.filter(f=>(log[f]?.length||0)>=7);
    const allergenData = profile.allergens||{};
    const ALLERGEN_NAMES = {peanut:"Peanut",egg:"Egg",dairy:"Cow's milk",wheat:"Wheat/Gluten",fish:"Fish",shellfish:"Shellfish",sesame:"Sesame",soy:"Soy",treenut:"Tree nuts"};
    const introduced = Object.keys(allergenData);
    const notStarted = Object.keys(ALLERGEN_NAMES).filter(id=>!allergenData[id]);
    const wstart = profile.weaningStartDate ? new Date(profile.weaningStartDate) : null;
    const daysSinceStart = wstart ? Math.floor((Date.now()-wstart)/864e5) : null;
    const flagged = [];
    Object.entries(profile.journal||{}).forEach(([date,entries])=>{
      (entries||[]).forEach(e=>{ if(e.reaction) flagged.push({date,...e}); });
    });

    const s = {
      page:{background:"#FFFFFF",minHeight:"100vh",fontFamily:"Arial,sans-serif",fontSize:"12px",color:"#1A1A2E"},
      header:{background:"#1A1A2E",color:"white",padding:"16px 20px"},
      disc:{background:"#FFF1F2",border:"1px solid #FFBDB5",padding:"10px 16px",margin:"14px 16px",borderRadius:"8px",fontSize:"11px",color:"#991B1B",lineHeight:"1.6"},
      section:{padding:"0 16px",marginTop:"14px"},
      h2:{fontSize:"10px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"0.06em",color:"#6B7280",borderBottom:"1px solid #E5E7EB",paddingBottom:"4px",marginBottom:"8px"},
      table:{width:"100%",borderCollapse:"collapse",fontSize:"11px"},
      th:{background:"#F3F4F6",padding:"5px 8px",textAlign:"left",color:"#6B7280",fontWeight:"600"},
      td:{padding:"5px 8px",borderBottom:"1px solid #F3F4F6"},
    };

    return (
      <div style={{position:"fixed",inset:0,zIndex:300,overflowY:"auto",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <style>{`@media print{.no-print{display:none!important;}body{margin:0;}}`}</style>
        <div className="no-print" style={{background:"#1A1A2E",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
          <button onClick={()=>setShowSummary(false)} style={{background:"none",border:"none",color:"white",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
          <span style={{color:"white",fontSize:"12px",fontWeight:"600"}}>Health Summary</span>
          <button onClick={()=>window.print()} style={{background:"#F25F4C",border:"none",color:"white",borderRadius:"8px",padding:"6px 12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>Save / Print</button>
        </div>

        <div style={s.page}>
          <div style={s.header}>
            <div style={{fontSize:"10px",color:"#9CA3AF",marginBottom:"3px"}}>WEANING HEALTH SUMMARY — BETA</div>
            <div style={{fontSize:"18px",fontWeight:"700",marginBottom:"2px"}}>{baby.name}</div>
            <div style={{fontSize:"10px",color:"#9CA3AF"}}>Generated {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} · lileats.app · v1.0</div>
          </div>

          <div style={s.disc}>
            <strong style={{display:"block",marginBottom:"3px"}}>⚠ IMPORTANT DISCLAIMER</strong>
            This document is not a medical record and has not been verified by a medical professional. It is for informational purposes only. Always consult your GP or health visitor. LilEats accepts no liability for decisions made based on this document. In an emergency call 999.
          </div>

          <div style={s.section}>
            <div style={s.h2}>Baby details</div>
            <table style={s.table}>
              <tbody>
                {[["Name",baby.name],["Date of birth",new Date(baby.dob).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})],["Weaning started",wstart?wstart.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}):"Not recorded"],["Days weaning",daysSinceStart!==null?`${daysSinceStart} days`:"—"],["Current week",`Week ${Math.min((profile.activeWeek||0)+1,6)} of 6`]].map(([k,v])=>(
                  <tr key={k}><td style={{...s.td,color:"#6B7280",width:"40%"}}>{k}</td><td style={{...s.td,fontWeight:"600"}}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s.section}>
            <div style={s.h2}>Food progress</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
              {[[tried.length,"foods tried","#2D6A20"],[confident.length,"confident","#1E40AF"],[flagged.length,"reactions","#DC2626"]].map(([n,l,c])=>(
                <div key={l} style={{flex:1,background:"#F9FAFB",borderRadius:"6px",padding:"8px",textAlign:"center"}}>
                  <div style={{fontSize:"20px",fontWeight:"700",color:c}}>{n}</div>
                  <div style={{fontSize:"10px",color:"#6B7280"}}>{l}</div>
                </div>
              ))}
            </div>
            {tried.length>0 ? (
              <table style={s.table}>
                <thead><tr><th style={s.th}>Food</th><th style={{...s.th,textAlign:"center"}}>Offers</th><th style={s.th}>Status</th><th style={{...s.th,textAlign:"center"}}>Last</th></tr></thead>
                <tbody>
                  {tried.map((food,i)=>{
                    const entries=log[food]||[]; const count=entries.length;
                    const last=entries[entries.length-1];
                    const lastDate=last?new Date(last.date||last).toLocaleDateString("en-GB",{day:"numeric",month:"short"}):"—";
                    const hasR=entries.some(e=>e.reaction==="reaction");
                    const status=hasR?"⚠ Reaction":count>=7?"Confident":count>=4?"Usually accepted":count>=2?"Getting familiar":"First taste";
                    const color=hasR?"#DC2626":count>=7?"#2D6A20":count>=4?"#1E40AF":"#92400E";
                    return <tr key={food} style={{background:i%2===0?"#FAFAFA":"white"}}><td style={s.td}>{food.charAt(0).toUpperCase()+food.slice(1)}</td><td style={{...s.td,textAlign:"center"}}>{count}</td><td style={{...s.td,color,fontWeight:"600"}}>{status}</td><td style={{...s.td,textAlign:"center",color:"#6B7280"}}>{lastDate}</td></tr>;
                  })}
                </tbody>
              </table>
            ) : <p style={{fontSize:"11px",color:"#6B7280"}}>No foods logged yet.</p>}
          </div>

          <div style={s.section}>
            <div style={s.h2}>Allergen log</div>
            {introduced.length>0 ? (
              <table style={s.table}>
                <thead><tr><th style={s.th}>Allergen</th><th style={{...s.th,textAlign:"center"}}>Date introduced</th><th style={s.th}>Outcome</th></tr></thead>
                <tbody>
                  {introduced.map((id,i)=>{
                    const a=allergenData[id];
                    const dateStr=a.introduced?new Date(a.introduced).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—";
                    const outcome=a.reaction?"⚠ Reaction noted":a.safe?"✓ Safely introduced":"Watching";
                    const color=a.reaction?"#DC2626":a.safe?"#2D6A20":"#92400E";
                    return <tr key={id} style={{background:i%2===0?"#FAFAFA":"white"}}><td style={s.td}>{ALLERGEN_NAMES[id]||id}</td><td style={{...s.td,textAlign:"center",color:"#6B7280"}}>{dateStr}</td><td style={{...s.td,color,fontWeight:"600"}}>{outcome}</td></tr>;
                  })}
                </tbody>
              </table>
            ) : <p style={{fontSize:"11px",color:"#6B7280"}}>No allergens introduced yet.</p>}
            {notStarted.length>0 && <p style={{fontSize:"11px",color:"#6B7280",marginTop:"8px"}}><strong>Not yet introduced:</strong> {notStarted.map(id=>ALLERGEN_NAMES[id]).join(", ")}</p>}
          </div>

          {flagged.length>0 && (
            <div style={s.section}>
              <div style={s.h2}>Flagged reactions</div>
              {flagged.map((e,i)=>(
                <div key={i} style={{background:"#FFF1F2",borderRadius:"6px",padding:"10px",marginBottom:"6px",border:"1px solid #FFBDB5"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"#DC2626",marginBottom:"3px"}}>{(e.foods||[]).map(f=>f.charAt(0).toUpperCase()+f.slice(1)).join(", ")} — {new Date(e.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
                  {e.notes && <div style={{fontSize:"11px",color:"#6B7280"}}>{e.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {notes.trim() && (
            <div style={s.section}>
              <div style={s.h2}>Parent notes</div>
              <div style={{background:"#F9FAFB",borderRadius:"6px",padding:"12px",fontSize:"11px",lineHeight:"1.7"}}>{notes}</div>
            </div>
          )}

          <div style={{margin:"20px 16px",paddingTop:"12px",borderTop:"1px solid #E5E7EB",fontSize:"9px",color:"#9CA3AF",lineHeight:"1.6"}}>
            This document was generated automatically by LilEats and has not been verified by a medical professional. It is not a medical record. Always consult your healthcare provider. Contact: tinyeatsapp@gmail.com
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{background:"#FFFFFF",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"22px 18px 48px",animation:"slideUp 0.25s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#E5E7EB",margin:"0 auto 18px"}}/>
        <div style={{fontSize:18,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Export health summary</div>
        <div style={{fontSize:13,color:"#6B7280",marginBottom:16,lineHeight:1.6}}>A summary of {baby.name}'s weaning journey — free during beta 🍐</div>
        <div style={{background:"#FFF8F0",borderRadius:12,padding:"12px 14px",marginBottom:16,border:"1px solid #F2D49A"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:4}}>What's included</div>
          <div style={{fontSize:12,color:"#78350F",lineHeight:1.7}}>• Baby details & weaning timeline<br/>• All foods tried with status & dates<br/>• Full allergen log<br/>• Flagged reactions from journal<br/>• Allergens not yet introduced<br/>• Your notes (below)</div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={css.label}>Parent notes (optional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Saw GP on 10 Mar. Currently avoiding peanuts on advice." style={{width:"100%",padding:"12px",borderRadius:12,border:"1.5px solid #E8EAF0",fontSize:13,outline:"none",resize:"none",height:80,fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>
        <div style={{background:"#FFF1F2",borderRadius:10,padding:"10px 12px",marginBottom:16,fontSize:11,color:"#991B1B",lineHeight:1.6}}>
          ⚠ This is not a medical record. Always consult your GP or health visitor.
        </div>
        <button onClick={()=>setShowSummary(true)} style={{...css.btnPrimary,background:"#6FA3D2",marginBottom:8}}>
          View health summary
        </button>
        <button onClick={onClose} style={css.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}
// PRIVACY POLICY
// ═══════════════════════════════════════════════════════════════
function PrivacyScreen({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:200}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 60px"}} className="fadeUp">
        <h2 style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Privacy Policy</h2>
        <p style={{fontSize:12,color:"#9CA3AF",marginBottom:24}}>Last updated: March 2026</p>

        {[
          {title:"Who we are", body:"LilEats is a baby weaning tracking app available at lileats.app. For any privacy-related questions, contact us at tinyeatsapp@gmail.com."},
          {title:"What data we collect", body:"We collect:\n• Your email address (used to create and access your account)\n• Your baby's name and date of birth\n• Food logs, journal entries and allergen records you enter\n• Baby photos you choose to upload (optional)\n\nWe do not collect any payment information, location data, or device identifiers."},
          {title:"How we use your data", body:"Your data is used solely to provide the LilEats service — specifically to save and sync your baby's weaning progress across your devices. We do not use your data for advertising, profiling, or any commercial purpose."},
          {title:"Who we share it with", body:"We do not sell, rent or share your personal data with any third parties.\n\nYour data is stored securely using Supabase (supabase.com), a third-party database provider. Supabase processes data on our behalf and is bound by a data processing agreement. No other third parties have access to your data."},
          {title:"How long we keep it", body:"We keep your data for as long as you have an active account. You can delete all of your baby's data at any time from Settings → Your data. If you wish to delete your account entirely, email us at tinyeatsapp@gmail.com and we will remove all your data within 30 days."},
          {title:"Your rights", body:"Under UK GDPR, you have the right to:\n• Access the data we hold about you\n• Correct inaccurate data\n• Delete your data\n• Restrict how we process your data\n• Object to processing\n\nTo exercise any of these rights, email tinyeatsapp@gmail.com."},
          {title:"Cookies", body:"LilEats uses minimal cookies necessary for authentication and session management. We use Vercel Analytics to count visitor numbers — this does not track individuals or use advertising cookies."},
          {title:"Children's data", body:"LilEats is used by parents to track their own baby's weaning progress. We do not knowingly collect data directly from children. All data is entered and controlled by the parent or guardian."},
          {title:"Changes to this policy", body:"If we make significant changes to this Privacy Policy, we will notify users via the app. Continued use of LilEats after changes constitutes acceptance of the updated policy."},
        ].map(s=>(
          <div key={s.title} style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:6}}>{s.title}</div>
            <p style={{fontSize:13,color:"#374151",lineHeight:1.8,whiteSpace:"pre-line"}}>{s.body}</p>
          </div>
        ))}
        <div style={{background:"#F9FAFB",borderRadius:12,padding:"14px",marginTop:8}}>
          <p style={{fontSize:12,color:"#6B7280",lineHeight:1.7}}>Questions? Email us at <span style={{color:"#F25F4C",fontWeight:600}}>tinyeatsapp@gmail.com</span></p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TERMS OF USE
// ═══════════════════════════════════════════════════════════════
function TermsScreen({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"#FFFFFF",fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:430,margin:"0 auto",overflowY:"auto",zIndex:200}}>
      <style>{GLOBAL_CSS}</style>
      <button onClick={onClose} style={css.back}>← Back</button>
      <div style={{padding:"0 20px 60px"}} className="fadeUp">
        <h2 style={{fontSize:22,fontWeight:800,color:"#1A1A2E",marginBottom:4}}>Terms of Use</h2>
        <p style={{fontSize:12,color:"#9CA3AF",marginBottom:24}}>Last updated: March 2026</p>

        {[
          {title:"Acceptance of terms", body:"By using LilEats, you agree to these Terms of Use. If you do not agree, please do not use the app. These terms are governed by the laws of England and Wales."},
          {title:"Not medical advice", body:"LilEats is an informational tool to help parents track their baby's weaning journey. It is not a medical device, does not provide medical advice, and should not be used as a substitute for professional medical guidance.\n\nAlways consult a qualified healthcare professional — such as your GP, health visitor, or paediatrician — before making decisions about your baby's diet or health. If your baby has a reaction to any food, seek medical advice immediately. In an emergency, call 999."},
          {title:"Accuracy of content", body:"The weaning guidance in LilEats is based on NHS Start4Life recommendations and publicly available nutritional guidance. We make every effort to keep content accurate and up to date, but we cannot guarantee that all information is complete, current or error-free.\n\nYou are responsible for verifying any information with a healthcare professional before acting on it."},
          {title:"Limitation of liability", body:"To the fullest extent permitted by law, LilEats and its creator are not liable for:\n• Any decisions made based on information in the app\n• Any harm, injury or loss resulting from use of the app\n• Any inaccuracies in the content\n• Any data loss or technical issues\n\nYour use of LilEats is entirely at your own risk."},
          {title:"Your account", body:"You are responsible for maintaining the security of your account and password. You must not share your account with others or use the app on behalf of another person without their consent. You must be 18 or over to create an account."},
          {title:"Your data", body:"You own your data. By using LilEats you grant us a limited licence to store and process your data solely to provide the service. We do not claim any ownership over your baby's information. See our Privacy Policy for full details."},
          {title:"Acceptable use", body:"You agree not to misuse LilEats. You must not attempt to access other users' data, reverse engineer the app, use it for any commercial purpose, or use it in any way that violates applicable law."},
          {title:"Changes to the service", body:"We may update, change or discontinue LilEats at any time. We will give reasonable notice of any significant changes where possible."},
          {title:"Contact", body:"For any questions about these terms, email tinyeatsapp@gmail.com."},
        ].map(s=>(
          <div key={s.title} style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1A1A2E",marginBottom:6}}>{s.title}</div>
            <p style={{fontSize:13,color:"#374151",lineHeight:1.8,whiteSpace:"pre-line"}}>{s.body}</p>
          </div>
        ))}
        <div style={{background:"#F9FAFB",borderRadius:12,padding:"14px",marginTop:8}}>
          <p style={{fontSize:12,color:"#6B7280",lineHeight:1.7}}>Questions? Email us at <span style={{color:"#F25F4C",fontWeight:600}}>tinyeatsapp@gmail.com</span></p>
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
