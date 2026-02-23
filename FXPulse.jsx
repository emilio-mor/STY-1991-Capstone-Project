import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────
const RATES_USD = {
  USD:1, EUR:0.9221, GBP:0.7912, JPY:149.72, CAD:1.3621, AUD:1.5330,
  CHF:0.8821, CNY:7.2410, BRL:4.9620, MXN:17.124, INR:83.21, KRW:1321.5,
  SGD:1.3421, HKD:7.8210, SEK:10.432, NOK:10.621, DKK:6.882, NZD:1.643,
  ZAR:18.921, ARS:873.5, CLP:924.3, COP:3952.4, PEN:3.762, HNL:24.71,
  GTQ:7.801, CRC:520.12, DOP:58.42, TRY:32.15, RUB:91.25, THB:35.12,
  IDR:15721, MYR:4.712, PHP:56.32, VND:24870, EGP:48.12, NGN:1570.4,
  KES:129.4, GHS:14.21, AED:3.6725, SAR:3.751, ILS:3.702, QAR:3.641,
  PKR:278.4, BDT:110.12, UAH:39.21, RON:4.582, HUF:357.1, CZK:23.12,
  PLN:4.012, TWD:32.45, MAD:10.021, JOD:0.7092, KWD:0.3069, OMR:0.385,
};

const CURRENCIES = [
  {code:"USD",name:"US Dollar",flag:"🇺🇸",symbol:"$"},
  {code:"EUR",name:"Euro",flag:"🇪🇺",symbol:"€"},
  {code:"GBP",name:"British Pound",flag:"🇬🇧",symbol:"£"},
  {code:"JPY",name:"Japanese Yen",flag:"🇯🇵",symbol:"¥"},
  {code:"CAD",name:"Canadian Dollar",flag:"🇨🇦",symbol:"CA$"},
  {code:"AUD",name:"Australian Dollar",flag:"🇦🇺",symbol:"A$"},
  {code:"CHF",name:"Swiss Franc",flag:"🇨🇭",symbol:"Fr"},
  {code:"CNY",name:"Chinese Yuan",flag:"🇨🇳",symbol:"¥"},
  {code:"BRL",name:"Brazilian Real",flag:"🇧🇷",symbol:"R$"},
  {code:"MXN",name:"Mexican Peso",flag:"🇲🇽",symbol:"$"},
  {code:"INR",name:"Indian Rupee",flag:"🇮🇳",symbol:"₹"},
  {code:"KRW",name:"S. Korean Won",flag:"🇰🇷",symbol:"₩"},
  {code:"SGD",name:"Singapore Dollar",flag:"🇸🇬",symbol:"S$"},
  {code:"HKD",name:"Hong Kong Dollar",flag:"🇭🇰",symbol:"HK$"},
  {code:"SEK",name:"Swedish Krona",flag:"🇸🇪",symbol:"kr"},
  {code:"NOK",name:"Norwegian Krone",flag:"🇳🇴",symbol:"kr"},
  {code:"DKK",name:"Danish Krone",flag:"🇩🇰",symbol:"kr"},
  {code:"NZD",name:"NZ Dollar",flag:"🇳🇿",symbol:"NZ$"},
  {code:"ZAR",name:"South African Rand",flag:"🇿🇦",symbol:"R"},
  {code:"ARS",name:"Argentine Peso",flag:"🇦🇷",symbol:"$"},
  {code:"CLP",name:"Chilean Peso",flag:"🇨🇱",symbol:"$"},
  {code:"COP",name:"Colombian Peso",flag:"🇨🇴",symbol:"$"},
  {code:"PEN",name:"Peruvian Sol",flag:"🇵🇪",symbol:"S/."},
  {code:"HNL",name:"Honduran Lempira",flag:"🇭🇳",symbol:"L"},
  {code:"GTQ",name:"Guatemalan Quetzal",flag:"🇬🇹",symbol:"Q"},
  {code:"CRC",name:"Costa Rican Colón",flag:"🇨🇷",symbol:"₡"},
  {code:"DOP",name:"Dominican Peso",flag:"🇩🇴",symbol:"RD$"},
  {code:"TRY",name:"Turkish Lira",flag:"🇹🇷",symbol:"₺"},
  {code:"RUB",name:"Russian Ruble",flag:"🇷🇺",symbol:"₽"},
  {code:"THB",name:"Thai Baht",flag:"🇹🇭",symbol:"฿"},
  {code:"IDR",name:"Indonesian Rupiah",flag:"🇮🇩",symbol:"Rp"},
  {code:"MYR",name:"Malaysian Ringgit",flag:"🇲🇾",symbol:"RM"},
  {code:"PHP",name:"Philippine Peso",flag:"🇵🇭",symbol:"₱"},
  {code:"VND",name:"Vietnamese Dong",flag:"🇻🇳",symbol:"₫"},
  {code:"EGP",name:"Egyptian Pound",flag:"🇪🇬",symbol:"£"},
  {code:"NGN",name:"Nigerian Naira",flag:"🇳🇬",symbol:"₦"},
  {code:"KES",name:"Kenyan Shilling",flag:"🇰🇪",symbol:"KSh"},
  {code:"GHS",name:"Ghanaian Cedi",flag:"🇬🇭",symbol:"₵"},
  {code:"AED",name:"UAE Dirham",flag:"🇦🇪",symbol:"د.إ"},
  {code:"SAR",name:"Saudi Riyal",flag:"🇸🇦",symbol:"﷼"},
  {code:"ILS",name:"Israeli Shekel",flag:"🇮🇱",symbol:"₪"},
  {code:"QAR",name:"Qatari Riyal",flag:"🇶🇦",symbol:"﷼"},
  {code:"PKR",name:"Pakistani Rupee",flag:"🇵🇰",symbol:"₨"},
  {code:"BDT",name:"Bangladeshi Taka",flag:"🇧🇩",symbol:"৳"},
  {code:"UAH",name:"Ukrainian Hryvnia",flag:"🇺🇦",symbol:"₴"},
  {code:"RON",name:"Romanian Leu",flag:"🇷🇴",symbol:"lei"},
  {code:"HUF",name:"Hungarian Forint",flag:"🇭🇺",symbol:"Ft"},
  {code:"CZK",name:"Czech Koruna",flag:"🇨🇿",symbol:"Kč"},
  {code:"PLN",name:"Polish Zloty",flag:"🇵🇱",symbol:"zł"},
  {code:"TWD",name:"Taiwanese Dollar",flag:"🇹🇼",symbol:"NT$"},
  {code:"MAD",name:"Moroccan Dirham",flag:"🇲🇦",symbol:"MAD"},
  {code:"JOD",name:"Jordanian Dinar",flag:"🇯🇴",symbol:"JD"},
  {code:"KWD",name:"Kuwaiti Dinar",flag:"🇰🇼",symbol:"KD"},
  {code:"OMR",name:"Omani Rial",flag:"🇴🇲",symbol:"﷼"},
];

const FOREX_PAIRS = [
  {base:"USD",target:"EUR",change:+0.23},
  {base:"USD",target:"GBP",change:-0.14},
  {base:"USD",target:"JPY",change:+0.41},
  {base:"USD",target:"CAD",change:-0.07},
  {base:"USD",target:"AUD",change:+0.18},
];

const CRYPTO = [
  {symbol:"BTC",name:"Bitcoin",price:67420.50,change:+2.14,cap:1320,icon:"₿",color:"#F7931A"},
  {symbol:"ETH",name:"Ethereum",price:3521.80,change:+3.41,cap:423,icon:"Ξ",color:"#627EEA"},
  {symbol:"BNB",name:"BNB",price:598.30,change:+1.22,cap:87.5,icon:"⬡",color:"#F3BA2F"},
  {symbol:"SOL",name:"Solana",price:182.40,change:+5.67,cap:81.2,icon:"◎",color:"#9945FF"},
  {symbol:"XRP",name:"XRP",price:0.5921,change:+0.89,cap:33.4,icon:"✕",color:"#346AA9"},
];

const getRate = (from, to) => (RATES_USD[to] || 1) / (RATES_USD[from] || 1);

const genHistory = (from, to, days) => {
  const rate = getRate(from, to);
  const seed = from.charCodeAt(0) * 31 + to.charCodeAt(0);
  const rng = (i) => Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5;
  return Array.from({length: days + 1}, (_, i) => {
    const volatility = rate * 0.025;
    const drift = Array.from({length: i}, (_, j) => (rng(j) - 0.5) * volatility).reduce((a,b) => a+b, 0);
    return {
      date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString("en-US",{month:"short",day:"numeric"}),
      rate: +(rate + drift).toFixed(6)
    };
  });
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const G = {
  bg: "#06080f",
  surface: "#0b0f1a",
  surface2: "#101525",
  surface3: "#141929",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  accent: "#00e8b8",
  accentDim: "rgba(0,232,184,0.12)",
  accentGlow: "rgba(0,232,184,0.25)",
  gold: "#f5c842",
  coral: "#ff5f5f",
  purple: "#8b7cf8",
  text: "#dde1f0",
  muted: "#4a5270",
  up: "#00e8b8",
  down: "#ff5f5f",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { color-scheme: dark; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Outfit', sans-serif; overflow: hidden; height: 100vh; }
  #root { height: 100vh; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }
  input, select, button { font-family: inherit; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.92)} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px ${G.accentGlow}} 50%{box-shadow:0 0 40px ${G.accentGlow},0 0 80px rgba(0,232,184,0.1)} }
`;

// ─── Mini Sparkline (SVG) ─────────────────────────────────────────────────────
function Spark({ data, up, w = 70, h = 28 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.rate);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = up ? G.up : G.down;
  return (
    <svg width={w} height={h} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id={`sg${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg${up})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", confirm:"" });
  const [err, setErr] = useState("");
  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fx_users") || "[]"); } catch { return []; }
  });

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const submit = () => {
    setErr("");
    if (mode === "login") {
      const u = users.find(u => (u.email === form.email || u.name === form.email) && u.password === form.password);
      if (!u && !(form.email === "demo" && form.password === "demo123")) {
        setErr("Invalid credentials. Try demo / demo123"); return;
      }
      onLogin(u || {name:"Demo User", email:"demo@example.com"});
    } else {
      if (!form.name || !form.email || !form.password) { setErr("All fields are required"); return; }
      if (form.password !== form.confirm) { setErr("Passwords don't match"); return; }
      if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
      if (users.find(u => u.email === form.email)) { setErr("Email already registered"); return; }
      const newUsers = [...users, {name: form.name, email: form.email, password: form.password}];
      setUsers(newUsers);
      try { localStorage.setItem("fx_users", JSON.stringify(newUsers)); } catch {}
      onLogin({name: form.name, email: form.email});
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:`radial-gradient(ellipse at 15% 25%, rgba(0,232,184,0.07) 0%, transparent 50%),
                  radial-gradient(ellipse at 85% 75%, rgba(139,124,248,0.07) 0%, transparent 50%),
                  ${G.bg}`,position:"relative",overflow:"hidden"}}>

      {/* Grid lines */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${G.border} 1px,transparent 1px),linear-gradient(90deg,${G.border} 1px,transparent 1px)`,backgroundSize:"60px 60px",opacity:0.4}}/>

      {/* Floating orbs */}
      {[["-100px","20%","400px",G.accent,0.05,"6s"],["80%","-80px","300px",G.purple,0.05,"9s"]].map(([l,t,s,c,o,d],i)=>(
        <div key={i} style={{position:"absolute",left:l,top:t,width:s,height:s,borderRadius:"50%",
          background:`radial-gradient(circle,${c} 0%,transparent 70%)`,opacity:o,animation:`float ${d} ease-in-out infinite`}}/>
      ))}

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:440,padding:"0 20px",animation:"fadeUp 0.5s ease"}}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
            width:56,height:56,borderRadius:16,
            background:`linear-gradient(135deg,${G.accent},${G.purple})`,
            fontSize:22,fontWeight:900,color:G.bg,marginBottom:16,
            boxShadow:`0 0 32px ${G.accentGlow}`,animation:"glow 3s ease-in-out infinite"}}>FX</div>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:"-1.5px"}}>
            FX<span style={{color:G.accent}}>Pulse</span>
          </div>
          <div style={{fontSize:13,color:G.muted,marginTop:4,letterSpacing:"0.5px"}}>Real-time Exchange Intelligence</div>
        </div>

        {/* Card */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:24,padding:36,
          boxShadow:`0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(0,232,184,0.05)`}}>

          {/* Tabs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:G.surface2,borderRadius:12,padding:4,marginBottom:28}}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{setMode(m);setErr("");setForm({email:"",password:"",name:"",confirm:""})}}
                style={{padding:"10px",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13,
                  letterSpacing:"0.3px",transition:"all 0.2s",
                  background: mode===m ? G.accent : "transparent",
                  color: mode===m ? G.bg : G.muted}}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {err && <div style={{background:"rgba(255,95,95,0.1)",border:"1px solid rgba(255,95,95,0.25)",
            borderRadius:10,padding:"12px 14px",fontSize:13,color:G.down,marginBottom:18,animation:"fadeIn 0.2s"}}>⚠ {err}</div>}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {mode === "register" && <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="John Doe"/>}
            <Input label={mode==="register"?"Email":"Email or Username"} value={form.email} onChange={set("email")} placeholder="you@example.com" type="email"/>
            <Input label="Password" value={form.password} onChange={set("password")} placeholder="••••••••" type="password"/>
            {mode === "register" && <Input label="Confirm Password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" type="password"/>}
          </div>

          <button onClick={submit}
            onKeyDown={e => e.key==="Enter" && submit()}
            style={{width:"100%",marginTop:22,padding:"15px",border:"none",borderRadius:12,
              background:`linear-gradient(135deg,${G.accent},#00c49a)`,
              color:G.bg,fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:"0.3px",
              transition:"transform 0.15s,box-shadow 0.2s",
              boxShadow:`0 4px 20px ${G.accentGlow}`}}
            onMouseEnter={e=>{e.target.style.transform="translateY(-1px)";e.target.style.boxShadow=`0 8px 32px ${G.accentGlow}`}}
            onMouseLeave={e=>{e.target.style.transform="";e.target.style.boxShadow=`0 4px 20px ${G.accentGlow}`}}>
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          {mode === "login" && (
            <div style={{marginTop:16,background:`rgba(0,232,184,0.06)`,border:`1px solid rgba(0,232,184,0.15)`,
              borderRadius:10,padding:"10px 14px",textAlign:"center",fontSize:12,color:G.muted,fontFamily:"'DM Mono',monospace"}}>
              Demo: <span style={{color:G.accent}}>demo</span> / <span style={{color:G.accent}}>demo123</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({label, ...props}) {
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:7}}>{label}</div>
      <input {...props} style={{width:"100%",padding:"13px 16px",background:G.surface2,
        border:`1px solid ${G.border}`,borderRadius:10,color:G.text,fontSize:14,outline:"none",
        transition:"border-color 0.2s,box-shadow 0.2s"}}
        onFocus={e=>{e.target.style.borderColor=G.accent;e.target.style.boxShadow=`0 0 0 3px ${G.accentDim}`}}
        onBlur={e=>{e.target.style.borderColor=G.border;e.target.style.boxShadow=""}}/>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",icon:"⬡",label:"Dashboard"},
  {id:"converter",icon:"⇄",label:"Convert"},
  {id:"trends",icon:"↗",label:"Trends"},
  {id:"favorites",icon:"★",label:"Favorites"},
  {id:"alerts",icon:"⏰",label:"Alerts"},
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [favorites, setFavorites] = useState(["EUR","GBP","JPY","BRL","HNL"]);
  const [alerts, setAlerts] = useState([
    {id:1,base:"USD",target:"EUR",condition:"above",rate:0.95,active:true,triggered:false},
    {id:2,base:"USD",target:"JPY",condition:"below",rate:145,active:true,triggered:false},
  ]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3500);
  };

  const toggleFav = (code) => {
    setFavorites(f => f.includes(code) ? f.filter(c=>c!==code) : [...f,code]);
    showToast(favorites.includes(code) ? `${code} removed from favorites` : `${code} added to favorites`);
  };

  if (!user) return (
    <>
      <style>{css}</style>
      <AuthScreen onLogin={u=>{setUser(u);showToast(`Welcome back, ${u.name.split(" ")[0]}!`)}}/>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{display:"flex",height:"100vh",background:G.bg,overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:200,background:G.surface,borderRight:`1px solid ${G.border}`,
          display:"flex",flexDirection:"column",padding:"20px 12px",flexShrink:0,
          backdropFilter:"blur(20px)"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,paddingLeft:6}}>
            <div style={{width:36,height:36,borderRadius:10,
              background:`linear-gradient(135deg,${G.accent},${G.purple})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:13,fontWeight:900,color:G.bg,flexShrink:0}}>FX</div>
            <span style={{fontSize:18,fontWeight:900,letterSpacing:"-0.5px"}}>FX<span style={{color:G.accent}}>Pulse</span></span>
          </div>

          {/* Nav */}
          <nav style={{display:"flex",flexDirection:"column",gap:3,flex:1}}>
            {NAV.map(n => {
              const active = page === n.id;
              const alertCount = n.id==="alerts" ? notifications.filter(x=>!x.read).length : 0;
              return (
                <button key={n.id} onClick={()=>setPage(n.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
                    borderRadius:11,border:"none",cursor:"pointer",fontFamily:"inherit",
                    fontWeight:600,fontSize:14,textAlign:"left",transition:"all 0.18s",position:"relative",
                    background: active ? G.accentDim : "transparent",
                    color: active ? G.accent : G.muted}}>
                  <span style={{fontSize:16,width:20,textAlign:"center"}}>{n.icon}</span>
                  {n.label}
                  {alertCount > 0 && <span style={{marginLeft:"auto",background:G.coral,color:"white",
                    fontSize:9,fontWeight:800,minWidth:16,height:16,borderRadius:8,
                    display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{alertCount}</span>}
                  {active && <div style={{position:"absolute",left:0,top:"25%",bottom:"25%",width:3,
                    borderRadius:"0 3px 3px 0",background:G.accent}}/>}
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div style={{borderTop:`1px solid ${G.border}`,paddingTop:16,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
              background:`linear-gradient(135deg,${G.purple},${G.accent})`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"white"}}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:10,color:G.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
            </div>
            <button onClick={()=>setUser(null)} title="Logout"
              style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:16,padding:4,
                transition:"color 0.2s"}}
              onMouseEnter={e=>e.target.style.color=G.down}
              onMouseLeave={e=>e.target.style.color=G.muted}>⏻</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {/* Ticker */}
          <Ticker/>
          {/* Content */}
          <div style={{flex:1,overflow:"auto",padding:"28px 32px"}}>
            {page==="dashboard" && <Dashboard favorites={favorites} toggleFav={toggleFav}/>}
            {page==="converter" && <Converter/>}
            {page==="trends" && <Trends/>}
            {page==="favorites" && <FavoritesPage favorites={favorites} toggleFav={toggleFav}/>}
            {page==="alerts" && <AlertsPage alerts={alerts} setAlerts={setAlerts} notifications={notifications} setNotifications={setNotifications} showToast={showToast}/>}
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,
            background: toast.type==="success" ? `rgba(0,232,184,0.12)` : `rgba(255,95,95,0.12)`,
            border:`1px solid ${toast.type==="success" ? G.accent : G.down}`,
            color: toast.type==="success" ? G.accent : G.down,
            borderRadius:12,padding:"14px 20px",fontSize:14,fontWeight:600,
            backdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            animation:"slideDown 0.3s ease",maxWidth:320}}>
            {toast.type==="success" ? "✓" : "⚠"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [...FOREX_PAIRS.map(p=>({label:`${p.base}/${p.target}`,value:(RATES_USD[p.target]/RATES_USD[p.base]).toFixed(4),up:p.change>0,chg:p.change})),
    ...CRYPTO.map(c=>({label:`${c.symbol}/USD`,value:`$${c.price.toLocaleString()}`,up:c.change>0,chg:c.change}))];
  const doubled = [...items,...items];
  return (
    <div style={{background:G.surface,borderBottom:`1px solid ${G.border}`,overflow:"hidden",
      display:"flex",alignItems:"center",height:36,flexShrink:0}}>
      <div style={{display:"flex",animation:"ticker 25s linear infinite",whiteSpace:"nowrap"}}>
        {doubled.map((item,i) => (
          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"0 28px",fontSize:12,fontFamily:"'DM Mono',monospace",borderRight:`1px solid ${G.border}`}}>
            <span style={{color:G.muted}}>{item.label}</span>
            <span style={{fontWeight:700}}>{item.value}</span>
            <span style={{color:item.up?G.up:G.down,fontSize:11}}>{item.up?"▲":"▼"}{Math.abs(item.chg).toFixed(2)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ favorites, toggleFav }) {
  const hour = new Date().getHours();
  const greet = hour<12?"morning":hour<18?"afternoon":"evening";
  const sparkData = useRef({});
  FOREX_PAIRS.forEach(p => {
    const key = `${p.base}${p.target}`;
    if (!sparkData.current[key]) sparkData.current[key] = genHistory(p.base,p.target,14);
  });

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.8px"}}>Good {greet} 👋</h1>
          <p style={{color:G.muted,fontSize:13,marginTop:4}}>Market overview · {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:G.accentDim,
          border:`1px solid ${G.accent}40`,borderRadius:20,padding:"7px 14px"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:G.accent,animation:"pulse 2s ease infinite",display:"inline-block"}}/>
          <span style={{fontSize:11,fontWeight:700,color:G.accent,letterSpacing:"1px"}}>LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          {icon:"💱",label:"World Currencies",val:"53",sub:"Tracked globally"},
          {icon:"₿",label:"Crypto Tracked",val:"5",sub:"By market cap"},
          {icon:"★",label:"Your Favorites",val:favorites.length,sub:"Quick access"},
          {icon:"⏰",label:"Active Alerts",val:"2",sub:"Rate monitoring"},
        ].map((s,i) => (
          <div key={i} style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:16,padding:20,
            transition:"border-color 0.2s,transform 0.2s",cursor:"default"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=G.borderHover;e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.transform=""}}>
            <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"1px",color:G.muted,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"-1px"}}>{s.val}</div>
            <div style={{fontSize:11,color:G.muted,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {/* Forex */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>🌍 Top Forex Pairs</div>
            <div style={{fontSize:11,color:G.muted}}>vs USD · 24h</div>
          </div>
          {FOREX_PAIRS.map((p,i) => {
            const rate = getRate(p.base,p.target).toFixed(4);
            const up = p.change >= 0;
            const cur = CURRENCIES.find(c=>c.code===p.target);
            const hist = sparkData.current[`${p.base}${p.target}`];
            const isFav = favorites.includes(p.target);
            return (
              <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 0",
                borderBottom: i<4 ? `1px solid ${G.border}` : "none",gap:10,
                transition:"background 0.15s",cursor:"pointer",borderRadius:8,margin:"0 -8px",padding:"10px 8px"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontSize:18,letterSpacing:-2}}>{cur?.flag}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700}}>{p.base}/{p.target}</div>
                  <div style={{fontSize:10,color:G.muted}}>{cur?.name}</div>
                </div>
                <Spark data={hist} up={up}/>
                <div style={{textAlign:"right",minWidth:70}}>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{rate}</div>
                  <div style={{fontSize:11,fontWeight:700,color:up?G.up:G.down}}>{up?"▲":"▼"}{Math.abs(p.change).toFixed(2)}%</div>
                </div>
                <button onClick={e=>{e.stopPropagation();toggleFav(p.target)}}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:15,
                    color:isFav?G.gold:G.muted,transition:"color 0.2s,transform 0.15s",padding:4}}
                  onMouseEnter={e=>e.target.style.transform="scale(1.2)"}
                  onMouseLeave={e=>e.target.style.transform=""}>★</button>
              </div>
            );
          })}
        </div>

        {/* Crypto */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>🪙 Crypto vs USD</div>
            <div style={{fontSize:11,color:G.muted}}>24h change</div>
          </div>
          {CRYPTO.map((c,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 8px",
              borderBottom:i<4?`1px solid ${G.border}`:"none",borderRadius:8,margin:"0 -8px",
              transition:"background 0.15s",cursor:"default"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:36,height:36,borderRadius:10,background:`${c.color}22`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:700,color:c.color,marginRight:12,flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700}}>{c.symbol}</div>
                <div style={{fontSize:10,color:G.muted}}>{c.name} · ${c.cap}B cap</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${c.price.toLocaleString("en",{minimumFractionDigits:c.price<1?4:2})}</div>
                <div style={{fontSize:11,fontWeight:700,color:c.change>=0?G.up:G.down}}>{c.change>=0?"▲":"▼"}{Math.abs(c.change).toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites strip */}
      {favorites.length > 0 && (
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:20}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:14}}>★ Your Favorites</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {favorites.map(code => {
              const cur = CURRENCIES.find(c=>c.code===code);
              const rate = getRate("USD",code);
              return (
                <div key={code} style={{background:G.surface2,border:`1px solid ${G.border}`,
                  borderRadius:14,padding:"14px 18px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:90,
                  transition:"border-color 0.2s,transform 0.2s",cursor:"default"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${G.accent}40`;e.currentTarget.style.transform="translateY(-2px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.transform=""}}>
                  <span style={{fontSize:22,marginBottom:4}}>{cur?.flag}</span>
                  <span style={{fontSize:13,fontWeight:800}}>{code}</span>
                  <span style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:G.accent,marginTop:2}}>{rate.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Converter ────────────────────────────────────────────────────────────────
function Converter() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("1");
  const rate = getRate(from, to);
  const result = parseFloat(amount || 0) * rate;
  const fromC = CURRENCIES.find(c=>c.code===from);
  const toC = CURRENCIES.find(c=>c.code===to);
  const multiples = [1,5,10,25,50,100,500,1000];

  const swap = () => { setFrom(to); setTo(from); };

  const selStyle = {
    width:"100%",padding:"12px 14px",background:G.surface2,
    border:`1px solid ${G.border}`,borderRadius:10,color:G.text,fontSize:14,
    outline:"none",cursor:"pointer",appearance:"none",
  };

  return (
    <div style={{animation:"fadeUp 0.4s ease",maxWidth:680}}>
      <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.8px",marginBottom:6}}>Currency Converter</h1>
      <p style={{color:G.muted,fontSize:13,marginBottom:28}}>Convert between 53 world currencies instantly</p>

      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:20,padding:28,marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:14,alignItems:"end",marginBottom:20}}>
          {/* From */}
          <div>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:8}}>From</div>
            <select value={from} onChange={e=>setFrom(e.target.value)} style={selStyle}>
              {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>)}
            </select>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
              style={{...selStyle,marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,padding:"14px"}}
              placeholder="1.00"
              onFocus={e=>{e.target.style.borderColor=G.accent;e.target.style.boxShadow=`0 0 0 3px ${G.accentDim}`}}
              onBlur={e=>{e.target.style.borderColor=G.border;e.target.style.boxShadow=""}}/>
          </div>

          {/* Swap */}
          <div style={{paddingBottom:6}}>
            <button onClick={swap}
              style={{width:48,height:48,borderRadius:"50%",border:`1px solid ${G.border}`,
                background:G.surface2,color:G.accent,fontSize:20,cursor:"pointer",
                transition:"all 0.25s",display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.background=G.accentDim;e.currentTarget.style.transform="rotate(180deg)"}}
              onMouseLeave={e=>{e.currentTarget.style.background=G.surface2;e.currentTarget.style.transform=""}}>⇄</button>
          </div>

          {/* To */}
          <div>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:8}}>To</div>
            <select value={to} onChange={e=>setTo(e.target.value)} style={selStyle}>
              {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</option>)}
            </select>
            <div style={{...selStyle,marginTop:10,fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,
              padding:"14px",color:G.accent,background:`${G.accentDim}`,border:`1px solid ${G.accent}30`,minHeight:56,
              display:"flex",alignItems:"center"}}>
              {amount ? result.toLocaleString("en",{maximumFractionDigits:6}) : "—"}
            </div>
          </div>
        </div>

        {/* Result box */}
        {parseFloat(amount) > 0 && (
          <div style={{background:`linear-gradient(135deg,rgba(0,232,184,0.06),rgba(139,124,248,0.06))`,
            border:`1px solid rgba(0,232,184,0.18)`,borderRadius:14,padding:20,textAlign:"center"}}>
            <div style={{fontSize:13,color:G.muted,marginBottom:8}}>
              {fromC?.flag} <span style={{fontWeight:700,color:G.text}}>{parseFloat(amount).toLocaleString()} {from}</span> equals
            </div>
            <div style={{fontSize:32,fontWeight:900,fontFamily:"'DM Mono',monospace",color:G.accent,letterSpacing:"-1px"}}>
              {toC?.flag} {result.toLocaleString("en",{maximumFractionDigits:4})} {to}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:14,fontSize:12,color:G.muted}}>
              <span>1 {from} = <span style={{color:G.text,fontFamily:"'DM Mono',monospace"}}>{rate.toFixed(6)}</span> {to}</span>
              <span>1 {to} = <span style={{color:G.text,fontFamily:"'DM Mono',monospace"}}>{(1/rate).toFixed(6)}</span> {from}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick reference */}
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:20,padding:24}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:16}}>Quick Reference</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {multiples.map(m => (
            <div key={m} style={{background:G.surface2,borderRadius:10,padding:"12px 14px",cursor:"default",
              transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=G.surface3}
              onMouseLeave={e=>e.currentTarget.style.background=G.surface2}>
              <div style={{fontSize:11,color:G.muted,marginBottom:4}}>{m} {from}</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{(m*rate).toLocaleString("en",{maximumFractionDigits:4})} {to}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular pairs */}
      <div style={{marginTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["USD","EUR"],["USD","GBP"],["USD","JPY"],["BRL","HNL"],["EUR","BRL"],["GBP","JPY"],["USD","BRL"],["HNL","USD"]].map(([f,t])=>(
          <button key={f+t} onClick={()=>{setFrom(f);setTo(t)}}
            style={{padding:"8px 16px",background: from===f&&to===t ? G.accentDim : G.surface,
              border:`1px solid ${from===f&&to===t ? G.accent : G.border}`,
              borderRadius:20,color:from===f&&to===t?G.accent:G.muted,fontSize:12,fontWeight:600,
              cursor:"pointer",transition:"all 0.18s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=G.accent}
            onMouseLeave={e=>!e.currentTarget.style.background.includes("accentDim") && (e.currentTarget.style.borderColor=G.border)}>
            {f} / {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Trends ───────────────────────────────────────────────────────────────────
function Trends() {
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("EUR");
  const [days, setDays] = useState(30);
  const data = genHistory(base, target, days);
  const cur = getRate(base, target);
  const first = data[0]?.rate || cur;
  const changePct = ((cur - first) / first * 100).toFixed(2);
  const up = parseFloat(changePct) >= 0;
  const high = Math.max(...data.map(d=>d.rate));
  const low = Math.min(...data.map(d=>d.rate));

  const selS = {background:G.surface2,border:`1px solid ${G.border}`,borderRadius:10,
    color:G.text,fontSize:13,padding:"10px 14px",outline:"none",cursor:"pointer",appearance:"none",fontFamily:"inherit"};

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.8px",marginBottom:6}}>Currency Trends</h1>
      <p style={{color:G.muted,fontSize:13,marginBottom:24}}>Historical rates & analysis</p>

      {/* Pair selector */}
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:16,padding:20,marginBottom:20,
        display:"flex",gap:14,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>Base</div>
          <select value={base} onChange={e=>setBase(e.target.value)} style={selS}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
        </div>
        <div style={{fontSize:18,color:G.muted,paddingBottom:10}}>vs</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>Target</div>
          <select value={target} onChange={e=>setTarget(e.target.value)} style={selS}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>Period</div>
          <div style={{display:"flex",gap:6}}>
            {[7,14,30,60,90].map(d=>(
              <button key={d} onClick={()=>setDays(d)}
                style={{padding:"10px 14px",border:"none",borderRadius:9,fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",
                  background:days===d?G.accent:G.surface2,color:days===d?G.bg:G.muted,transition:"all 0.18s"}}>
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Current Rate",val:cur.toFixed(6),color:G.text},
          {label:`${days}d Change`,val:`${up?"▲":"▼"} ${Math.abs(changePct)}%`,color:up?G.up:G.down},
          {label:"Period High",val:high.toFixed(6),color:G.up},
          {label:"Period Low",val:low.toFixed(6),color:G.down},
        ].map((s,i)=>(
          <div key={i} style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"1px",color:G.muted,marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:17,fontWeight:800,fontFamily:"'DM Mono',monospace",color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontSize:20,fontWeight:900}}>{base} / {target}</div>
            <div style={{fontSize:13,color:G.muted,marginTop:3}}>
              {CURRENCIES.find(c=>c.code===base)?.flag} {CURRENCIES.find(c=>c.code===base)?.name} →{" "}
              {CURRENCIES.find(c=>c.code===target)?.flag} {CURRENCIES.find(c=>c.code===target)?.name}
            </div>
          </div>
          <div style={{background:up?`rgba(0,232,184,0.1)`:`rgba(255,95,95,0.1)`,
            border:`1px solid ${up?G.up:G.down}40`,borderRadius:20,
            padding:"7px 14px",fontSize:13,fontWeight:700,color:up?G.up:G.down}}>
            {up?"▲":"▼"} {Math.abs(changePct)}%
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{top:5,right:0,left:0,bottom:5}}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={up?G.up:G.down} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={up?G.up:G.down} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fill:G.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}
              axisLine={false} tickLine={false} interval={Math.floor(data.length/6)}/>
            <YAxis tick={{fill:G.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}
              axisLine={false} tickLine={false} width={70}
              tickFormatter={v=>v.toFixed(4)} domain={["auto","auto"]}/>
            <Tooltip
              contentStyle={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:10,
                fontFamily:"'DM Mono',monospace",fontSize:12}}
              labelStyle={{color:G.muted,marginBottom:4}}
              itemStyle={{color:up?G.up:G.down,fontWeight:700}}
              formatter={v=>[v.toFixed(6),`${base}/${target}`]}/>
            <Area type="monotone" dataKey="rate" stroke={up?G.up:G.down} strokeWidth={2}
              fill="url(#trendGrad)" dot={false} activeDot={{r:4,fill:up?G.up:G.down}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:14}}>Historical Data</div>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr>
                {["Date",`Rate (${base}→${target})`,"Change"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"8px 12px",fontSize:10,
                    textTransform:"uppercase",letterSpacing:"1px",color:G.muted,
                    borderBottom:`1px solid ${G.border}`,position:"sticky",top:0,background:G.surface}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d,i,arr) => {
                const prev = arr[i+1]?.rate || d.rate;
                const chg = ((d.rate-prev)/prev*100).toFixed(4);
                const chgUp = parseFloat(chg) >= 0;
                return (
                  <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.02)`}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={{padding:"9px 12px",color:G.muted}}>{d.date}</td>
                    <td style={{padding:"9px 12px",fontFamily:"'DM Mono',monospace",fontWeight:600}}>{d.rate.toFixed(6)}</td>
                    <td style={{padding:"9px 12px",fontFamily:"'DM Mono',monospace",color:i===data.length-1?G.muted:chgUp?G.up:G.down}}>
                      {i===data.length-1?"—":`${chgUp?"▲":"▼"} ${Math.abs(chg)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Favorites ────────────────────────────────────────────────────────────────
function FavoritesPage({ favorites, toggleFav }) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.8px",marginBottom:6}}>Favorite Currencies</h1>
      <p style={{color:G.muted,fontSize:13,marginBottom:24}}>Pin currencies for quick access on your dashboard</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
        {/* Current favorites */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:16}}>
            ★ Your Favorites ({favorites.length})
          </div>
          {favorites.length === 0 ? (
            <div style={{textAlign:"center",padding:"48px 0",color:G.muted}}>
              <div style={{fontSize:40,marginBottom:12}}>★</div>
              <div style={{fontWeight:700,marginBottom:6}}>No favorites yet</div>
              <div style={{fontSize:13}}>Add currencies from the list →</div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {favorites.map(code => {
                const cur = CURRENCIES.find(c=>c.code===code);
                const rate = getRate("USD",code);
                return (
                  <div key={code} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
                    background:G.surface2,borderRadius:12,border:`1px solid ${G.border}`,
                    transition:"border-color 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=`${G.accent}40`}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
                    <span style={{fontSize:24}}>{cur?.flag}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700}}>{code}</div>
                      <div style={{fontSize:11,color:G.muted}}>{cur?.name}</div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:G.accent}}>
                      {rate.toFixed(4)}
                    </div>
                    <button onClick={()=>toggleFav(code)}
                      style={{background:"rgba(255,95,95,0.1)",border:"1px solid rgba(255,95,95,0.2)",
                        borderRadius:8,padding:"6px 12px",color:G.down,fontSize:11,fontWeight:700,
                        cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,95,95,0.2)"}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,95,95,0.1)"}>
                      ✕ Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All currencies browser */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:12}}>
            + Add Currency
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍  Search by code or name..."
            style={{width:"100%",padding:"11px 14px",background:G.surface2,border:`1px solid ${G.border}`,
              borderRadius:10,color:G.text,fontSize:13,outline:"none",marginBottom:12,fontFamily:"inherit"}}
            onFocus={e=>{e.target.style.borderColor=G.accent}}
            onBlur={e=>{e.target.style.borderColor=G.border}}/>
          <div style={{maxHeight:460,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
            {filtered.map(cur => {
              const isFav = favorites.includes(cur.code);
              return (
                <div key={cur.code} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                  borderRadius:9,transition:"background 0.15s",opacity:isFav?0.55:1}}
                  onMouseEnter={e=>e.currentTarget.style.background=G.surface2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:18}}>{cur.flag}</span>
                  <div style={{flex:1}}>
                    <span style={{fontWeight:700,fontSize:13}}>{cur.code}</span>
                    <span style={{color:G.muted,fontSize:11,marginLeft:6}}>{cur.name}</span>
                  </div>
                  {isFav ? (
                    <span style={{fontSize:11,color:G.accent,background:G.accentDim,
                      padding:"4px 10px",borderRadius:20,fontWeight:700}}>★ Added</span>
                  ) : (
                    <button onClick={()=>toggleFav(cur.code)}
                      style={{background:"rgba(0,232,184,0.08)",border:"1px solid rgba(0,232,184,0.2)",
                        borderRadius:8,padding:"5px 12px",color:G.accent,fontSize:11,fontWeight:700,
                        cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=G.accentDim}
                      onMouseLeave={e=>e.currentTarget.style.background="rgba(0,232,184,0.08)"}>
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
function AlertsPage({ alerts, setAlerts, notifications, setNotifications, showToast }) {
  const [form, setForm] = useState({base:"USD",target:"EUR",condition:"above",rate:""});
  const nextId = useRef(10);

  const createAlert = () => {
    if (!form.rate || isNaN(parseFloat(form.rate))) { showToast("Please enter a valid rate","error"); return; }
    const alert = {...form,id:nextId.current++,active:true,triggered:false,rate:parseFloat(form.rate),createdAt:new Date()};
    setAlerts(a=>[alert,...a]);
    showToast(`Alert created for ${form.base}/${form.target}`);
    setForm(f=>({...f,rate:""}));
  };

  const deleteAlert = id => { setAlerts(a=>a.filter(x=>x.id!==id)); showToast("Alert deleted"); };
  const unread = notifications.filter(n=>!n.read).length;

  // Simulate trigger check
  useEffect(() => {
    const t = setInterval(() => {
      setAlerts(prev => prev.map(a => {
        if (!a.active || a.triggered) return a;
        const cur = getRate(a.base, a.target);
        const triggered = a.condition==="above" ? cur >= a.rate : cur <= a.rate;
        if (triggered) {
          const msg = `${a.base}/${a.target} has ${a.condition==="above"?"risen above":"dropped below"} ${a.rate.toFixed(4)}. Current: ${cur.toFixed(4)}`;
          setNotifications(n=>[{id:Date.now(),msg,pair:`${a.base}/${a.target}`,read:false,time:new Date()},...n]);
        }
        return triggered ? {...a,triggered:true,triggeredAt:new Date()} : a;
      }));
    }, 8000);
    return ()=>clearInterval(t);
  }, []);

  const selS = {background:G.surface2,border:`1px solid ${G.border}`,borderRadius:10,
    color:G.text,fontSize:13,padding:"11px 14px",outline:"none",cursor:"pointer",
    appearance:"none",fontFamily:"inherit",width:"100%"};

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-0.8px"}}>Rate Alerts</h1>
          <p style={{color:G.muted,fontSize:13,marginTop:4}}>Get notified when rates hit your targets</p>
        </div>
        {unread > 0 && (
          <div style={{background:`rgba(255,95,95,0.12)`,border:`1px solid rgba(255,95,95,0.25)`,
            borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:700,color:G.down}}>
            {unread} unread
          </div>
        )}
      </div>

      <div style={{marginBottom:24,marginTop:24}}>
        {/* Create alert */}
        <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24,marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:18}}>+ Create Alert</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:7}}>Base</div>
              <select value={form.base} onChange={e=>setForm(f=>({...f,base:e.target.value}))} style={selS}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:7}}>Target</div>
              <select value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))} style={selS}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:7}}>Condition</div>
              <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} style={selS}>
                <option value="above">▲ Goes Above</option>
                <option value="below">▼ Goes Below</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:7}}>Target Rate</div>
              <input type="number" value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))}
                placeholder="e.g. 1.1000" style={{...selS,fontFamily:"'DM Mono',monospace"}}
                onFocus={e=>{e.target.style.borderColor=G.accent}}
                onBlur={e=>{e.target.style.borderColor=G.border}}/>
            </div>
            <button onClick={createAlert}
              style={{padding:"11px 20px",background:G.accent,border:"none",borderRadius:10,
                color:G.bg,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",
                transition:"all 0.15s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px ${G.accentGlow}`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
              Set Alert ⏰
            </button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {/* Active alerts */}
          <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted,marginBottom:16}}>
              Active Alerts ({alerts.filter(a=>!a.triggered).length})
            </div>
            {alerts.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 0",color:G.muted}}>
                <div style={{fontSize:36,marginBottom:10}}>⏰</div>
                <div style={{fontWeight:700}}>No alerts yet</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {alerts.map(a => {
                  const cur = getRate(a.base, a.target);
                  const condUp = a.condition === "above";
                  return (
                    <div key={a.id} style={{background:G.surface2,border:`1px solid ${a.triggered?"rgba(0,232,184,0.15)":G.border}`,
                      borderRadius:12,padding:16,opacity:a.triggered?0.6:1,transition:"opacity 0.3s"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:16,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{a.base}/{a.target}</span>
                        <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,
                          background:a.triggered?"rgba(0,232,184,0.1)":"rgba(255,255,255,0.05)",
                          color:a.triggered?G.up:G.muted}}>
                          {a.triggered ? "✓ TRIGGERED" : "● ACTIVE"}
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800,letterSpacing:"0.5px",
                          background:condUp?"rgba(0,232,184,0.1)":"rgba(255,95,95,0.1)",
                          color:condUp?G.up:G.down}}>
                          {condUp?"▲ ABOVE":"▼ BELOW"}
                        </span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700}}>{a.rate.toFixed(4)}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:11,color:G.muted}}>Current: <span style={{color:G.text,fontFamily:"'DM Mono',monospace"}}>{cur.toFixed(6)}</span></span>
                        <button onClick={()=>deleteAlert(a.id)}
                          style={{background:"none",border:"1px solid rgba(255,95,95,0.2)",borderRadius:8,
                            padding:"4px 10px",color:G.down,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                            transition:"all 0.15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,95,95,0.1)"}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notification log */}
          <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:18,padding:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.5px",color:G.muted}}>Notification Log</div>
              {notifications.length > 0 && (
                <button onClick={()=>setNotifications(n=>n.map(x=>({...x,read:true})))}
                  style={{background:"none",border:"none",color:G.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",
                    textDecoration:"underline"}}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 0",color:G.muted}}>
                <div style={{fontSize:36,marginBottom:10}}>📭</div>
                <div style={{fontWeight:700}}>No notifications yet</div>
                <div style={{fontSize:12,marginTop:6}}>Triggered alerts appear here</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
                {notifications.map(n => (
                  <div key={n.id} style={{display:"flex",gap:10,padding:"12px",borderRadius:10,
                    background:n.read?"transparent":G.accentDim,
                    border:`1px solid ${n.read?G.border:"rgba(0,232,184,0.15)"}`,
                    transition:"background 0.2s"}}
                    onClick={()=>setNotifications(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}
                    style={{cursor:"pointer"}}>
                    <span style={{fontSize:18,flexShrink:0}}>🔔</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,lineHeight:1.4,marginBottom:4}}>{n.msg}</div>
                      <div style={{fontSize:10,color:G.muted}}>{n.time?.toLocaleTimeString()}</div>
                    </div>
                    {!n.read && <div style={{width:8,height:8,borderRadius:"50%",background:G.accent,flexShrink:0,marginTop:4}}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
