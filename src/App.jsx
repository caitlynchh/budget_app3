import { useState, useEffect } from "react";

const DAILY_RATE_GBP = 109.64;
const TAX_PROVISION = 5500;
const LS = "budget_complete";

function getWorkingDays(year, month) {
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const d = date.getDay();
    if (d !== 0 && d !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

function load(key, fallback) {
  try { const r = localStorage.getItem(`${LS}_${key}`); return r !== null ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(`${LS}_${key}`, JSON.stringify(val)); } catch {}
}
function monthKey(year, month) { return `${year}_${String(month).padStart(2,"0")}`; }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fixedExpenses = [
  { id: "rent",          label: "Rent",               amount: 12000,        category: "Housing" },
  { id: "health",        label: "Health Insurance",    amount: 3717,         category: "Insurance" },
  { id: "car_ins",       label: "Car Insurance",       amount: 767.97,       category: "Insurance" },
  { id: "pet_ins",       label: "Pet Insurance",       amount: 567,          category: "Insurance" },
  { id: "gym",           label: "Gym",                 amount: 950,          category: "Wellness" },
  { id: "nutritionist",  label: "Nutritionist",        amount: 1200,         category: "Wellness" },
  { id: "running_coach", label: "Running Coach",       amount: 650,          category: "Wellness" },
  { id: "cleaner",       label: "Cleaner (x2)",        amount: 664,          category: "Home" },
  { id: "adobe",         label: "Adobe",               amount: 673.44,       category: "Subscriptions" },
  { id: "netflix",       label: "Netflix",             amount: 99,           category: "Subscriptions" },
  { id: "strava",        label: "Strava",              amount: 115,          category: "Subscriptions" },
  { id: "phone",         label: "Phone",               amount: 134,          category: "Subscriptions" },
  { id: "google_one",    label: "Google One",          amount: 35,           category: "Subscriptions" },
  { id: "audible",       label: "Audible",             amount: 253,          category: "Subscriptions" },
  { id: "bank",          label: "Monthly Account Fee", amount: 120,          category: "Banking" },
  { id: "savings",       label: "Savings",             amount: 3500,         category: "Savings" },
  { id: "tax",           label: "Tax Provision",       amount: TAX_PROVISION,category: "Tax" },
];

const varCategories = [
  { id: "groceries",     label: "Groceries",        default: 3000 },
  { id: "electricity",   label: "Electricity",      default: 600 },
  { id: "fuel",          label: "Fuel",             default: 350 },
  { id: "takeaways",     label: "Takeaways",        default: 400 },
  { id: "eating_out",    label: "Eating Out",       default: 450 },
  { id: "coffee",        label: "Coffee Shop",      default: 600 },
  { id: "supplements",   label: "Supplements",      default: 750 },
  { id: "pet_food",      label: "Pet Food",         default: 170 },
  { id: "medical",       label: "Medical/Pharmacy", default: 685 },
  { id: "clothing",      label: "Clothing",         default: 1200 },
  { id: "entertainment", label: "Entertainment",    default: 400 },
  { id: "other",         label: "Other",            default: 200 },
];

const CASHFLOW_EVENTS = [
  { id: "salary", label: "Salary",            type: "income", day: 13, month: "salary", note: "Adjust to actual date received" },
  { id: "robbie", label: "Robbie's Transfer", type: "income", day: 29, month: "salary", amount: 6979, note: "~29th each month" },
];

const FIXED_DEFAULTS = {
  rent: {day:1,month:"next"}, health:{day:1,month:"next"}, car_ins:{day:1,month:"next"},
  pet_ins:{day:1,month:"next"}, gym:{day:1,month:"next"}, nutritionist:{day:1,month:"next"},
  running_coach:{day:1,month:"next"}, cleaner:{day:1,month:"next"},
  adobe:{day:22,month:"salary"}, netflix:{day:25,month:"salary"}, strava:{day:19,month:"salary"},
  phone:{day:30,month:"salary"}, bank:{day:23,month:"salary"}, savings:{day:18,month:"salary"},
  tax:{day:13,month:"salary"}, google_one:{day:26,month:"salary"}, audible:{day:26,month:"salary"},
};

const C = {
  bg:"#faf7fc", bgCard:"#ffffff", bgInput:"#f9f5fb", bgMuted:"#f3eef8",
  border:"#e4d9f0", pink:"#e8589a", pinkLight:"#fce7f3",
  purple:"#9333ea", purpleLight:"#f3e8ff", purpleSoft:"#e9d5ff",
  text:"#2d1f3d", textMid:"#6b4e8a", textSoft:"#a07cc0", textMuted:"#c4aad8",
  green:"#16a34a", greenBg:"#f0fdf4", greenLight:"#dcfce7",
  red:"#dc2626", redBg:"#fef2f2", amber:"#d97706", amberBg:"#fffbeb",
};

const BLANK_WI = { label:"", amount:"" };

export default function Budget() {
  const now = new Date();

  // persisted
  const [selectedMonth,  setSelectedMonth]  = useState(() => load("month", now.getMonth()));
  const [selectedYear,   setSelectedYear]   = useState(() => load("year",  now.getFullYear()));
  const [cfMonth,        setCfMonth]        = useState(() => load("cfMonth", now.getMonth()));
  const [cfYear,         setCfYear]         = useState(() => load("cfYear", now.getFullYear()));
  const [bankAmount,     setBankAmount]      = useState(() => load("bankAmount", ""));
  const [workingDays,    setWorkingDays]     = useState(() => load("workingDays", getWorkingDays(now.getFullYear(), now.getMonth())));
  const [varExpenses,    setVarExpenses]     = useState(() => load("varExpenses", Object.fromEntries(varCategories.map(c=>[c.id,c.default]))));
  const [fixedEdits,     setFixedEdits]      = useState(() => load("fixedEdits",  Object.fromEntries(fixedExpenses.map(e=>[e.id,e.amount]))));
  const [cfSalaryDate,   setCfSalaryDate]    = useState(() => load("cfSalaryDate",  13));
  const [cfSalaryAmount, setCfSalaryAmount]  = useState(() => load("cfSalaryAmount",""));
  const [cfStartBalance, setCfStartBalance]  = useState(() => load("cfStartBalance",""));
  const [adHocExpenses,  setAdHocExpenses]   = useState(() => load("adHocExpenses", []));
  const [fixedDates,     setFixedDates]      = useState(() => load("fixedDates", Object.fromEntries(Object.entries(FIXED_DEFAULTS).map(([k,v])=>[k,{...v}]))));
  const [customFixed,    setCustomFixed]     = useState(() => load("customFixed", []));
  const [actuals,        setActuals]         = useState(() => load("actuals", {}));

  // savings tracking
  const [taxFund,        setTaxFund]         = useState(() => load("taxFund", 16188.82));
  const [rainyDayFund,   setRainyDayFund]    = useState(() => load("rainyDayFund", 47588.56));
  const [carRepayFund,   setCarRepayFund]    = useState(() => load("carRepayFund", 0));
  const [ccBalance,      setCcBalance]       = useState(() => load("ccBalance", 28934.74));
  const [taxTransactions, setTaxTransactions] = useState(() => load("taxTransactions", []));
  const [rainTransactions, setRainTransactions] = useState(() => load("rainTransactions", []));
  const [carTransactions,  setCarTransactions]  = useState(() => load("carTransactions", []));

  // non-persisted
  const [activeSection,  setActiveSection]  = useState("fixed");
  const [showAdHocForm,  setShowAdHocForm]  = useState(false);
  const [adHocLabel,     setAdHocLabel]     = useState("");
  const [adHocAmount,    setAdHocAmount]    = useState("");
  const [adHocDay,       setAdHocDay]       = useState("");
  const [adHocMonthType, setAdHocMonthType] = useState("salary");
  const [whatIfFixed,    setWhatIfFixed]    = useState([]);
  const [whatIfVar,      setWhatIfVar]      = useState([]);
  const [newWIF,         setNewWIF]         = useState(BLANK_WI);
  const [newWIV,         setNewWIV]         = useState(BLANK_WI);
  const [showAddFixed,   setShowAddFixed]    = useState(false);
  const [newFixedLabel,  setNewFixedLabel]   = useState("");
  const [newFixedAmount, setNewFixedAmount]  = useState("");
  const [newFixedDay,    setNewFixedDay]     = useState("1");
  const [newFixedMonth,  setNewFixedMonth]   = useState("salary");
  const [fundAmount,     setFundAmount]      = useState("");
  const [fundType,       setFundType]        = useState("+");
  const [fundReason,     setFundReason]      = useState("");

  // persist
  useEffect(()=>{ save("month",selectedMonth); },[selectedMonth]);
  useEffect(()=>{ save("year",selectedYear); },[selectedYear]);
  useEffect(()=>{ save("cfMonth",cfMonth); },[cfMonth]);
  useEffect(()=>{ save("cfYear",cfYear); },[cfYear]);
  useEffect(()=>{ save("bankAmount",bankAmount); },[bankAmount]);
  useEffect(()=>{ save("workingDays",workingDays); },[workingDays]);
  useEffect(()=>{ save("varExpenses",varExpenses); },[varExpenses]);
  useEffect(()=>{ save("fixedEdits",fixedEdits); },[fixedEdits]);
  useEffect(()=>{ save("cfSalaryDate",cfSalaryDate); },[cfSalaryDate]);
  useEffect(()=>{ save("cfSalaryAmount",cfSalaryAmount); },[cfSalaryAmount]);
  useEffect(()=>{ save("cfStartBalance",cfStartBalance); },[cfStartBalance]);
  useEffect(()=>{ save("adHocExpenses",adHocExpenses); },[adHocExpenses]);
  useEffect(()=>{ save("fixedDates",fixedDates); },[fixedDates]);
  useEffect(()=>{ save("customFixed",customFixed); },[customFixed]);
  useEffect(()=>{ save("actuals",actuals); },[actuals]);
  useEffect(()=>{ save("taxFund",taxFund); },[taxFund]);
  useEffect(()=>{ save("rainyDayFund",rainyDayFund); },[rainyDayFund]);
  useEffect(()=>{ save("carRepayFund",carRepayFund); },[carRepayFund]);
  useEffect(()=>{ save("ccBalance",ccBalance); },[ccBalance]);
  useEffect(()=>{ save("taxTransactions",taxTransactions); },[taxTransactions]);
  useEffect(()=>{ save("rainTransactions",rainTransactions); },[rainTransactions]);
  useEffect(()=>{ save("carTransactions",carTransactions); },[carTransactions]);

  useEffect(()=>{ setWorkingDays(getWorkingDays(selectedYear,selectedMonth)); },[selectedMonth,selectedYear]);

  // derived - income section
  const grossGBP       = DAILY_RATE_GBP * workingDays;
  const bankAmountNum  = parseFloat(bankAmount) || 0;
  const impliedRate    = bankAmountNum > 0 ? (bankAmountNum / grossGBP).toFixed(2) : null;
  const totalIncome    = bankAmountNum + 6979;
  const wiFixedTotal   = whatIfFixed.reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const wiVarTotal     = whatIfVar.reduce((a,b)=>a+(parseFloat(b.amount)||0),0);
  const totalFixed     = Object.values(fixedEdits).reduce((a,b)=>a+(parseFloat(b)||0),0)+wiFixedTotal;
  const totalVar       = Object.values(varExpenses).reduce((a,b)=>a+(parseFloat(b)||0),0)+wiVarTotal;
  const totalExpenses  = totalFixed + totalVar;
  const surplus        = totalIncome - totalExpenses;
  const allFixedExpenses = [...fixedExpenses, ...customFixed];
  const categoryGroups = allFixedExpenses.reduce((acc,e)=>{ if(!acc[e.category]) acc[e.category]=[]; acc[e.category].push(e); return acc; },{});
  const years          = [now.getFullYear()-1,now.getFullYear(),now.getFullYear()+1];
  const tabs           = ["fixed","variable","actuals","cash flow","savings","cc tracker","overview"];

  // actuals helpers
  const curKey = monthKey(selectedYear, selectedMonth);
  const curActuals = actuals[curKey] || {};
  const setActual = (id, val) => { setActuals(prev => ({ ...prev, [curKey]: { ...(prev[curKey]||{}), [id]: parseFloat(val)||0 } })); };
  const totalActualsVar = varCategories.reduce((a,c)=>a+(curActuals[c.id]||0),0);
  const totalActualsFixed = fixedExpenses.reduce((a,e)=>a+(curActuals[e.id]!==undefined ? curActuals[e.id] : parseFloat(fixedEdits[e.id])||0),0);
  const totalActuals = totalActualsVar + totalActualsFixed;

  // cash flow - salary arrives in NEXT month
  const salaryMonthIdx    = cfMonth;
  const nextMonthIdx      = (cfMonth+1)%12;
  const nextMonthYear     = cfMonth===11 ? cfYear+1 : cfYear;
  const daysInSalaryMonth = new Date(cfYear, salaryMonthIdx+1, 0).getDate();
  const cfSalaryAmt       = parseFloat(cfSalaryAmount)||bankAmountNum||0;

  const addAdHoc = () => {
    if(!adHocLabel||!adHocAmount||!adHocDay) return;
    setAdHocExpenses(p=>[...p,{id:`adhoc_${Date.now()}`,label:adHocLabel,amount:parseFloat(adHocAmount),day:parseInt(adHocDay),month:adHocMonthType,type:"expense",isAdHoc:true}]);
    setAdHocLabel(""); setAdHocAmount(""); setAdHocDay(""); setAdHocMonthType("salary"); setShowAdHocForm(false);
  };
  const removeAdHoc = id => setAdHocExpenses(p=>p.filter(e=>e.id!==id));

  const fixedAsEvents = allFixedExpenses.map(e=>{
    const d = fixedDates[e.id]||FIXED_DEFAULTS[e.id]||{day:1,month:"next"};
    return { id:e.id, label:e.label, type:"expense", day:d.day, month:d.month, amount:parseFloat(fixedEdits[e.id])||0 };
  });
  const allEvents = [...CASHFLOW_EVENTS,...fixedAsEvents,...adHocExpenses];
  const events = allEvents.map(e=>{
    const isNext     = e.month==="next";
    const rawDay     = e.day;
    const eventDay   = rawDay >= 30 ? Math.min(rawDay, daysInSalaryMonth) : rawDay;
    const eventMonth = isNext ? nextMonthIdx : salaryMonthIdx;
    const eventYear  = isNext ? nextMonthYear : cfYear;
    const dateObj    = new Date(eventYear,eventMonth,eventDay);
    const amount     = e.type==="income" ? (e.id==="salary" ? cfSalaryAmt : (e.amount||6979)) : (e.amount||0);
    return { ...e, dateObj, eventDay, eventMonth, eventYear, amount };
  }).sort((a,b)=>a.dateObj-b.dateObj);

  let running = parseFloat(cfStartBalance)||0;
  const timeline = events.map((e,idx)=>{ 
    running+=e.type==="income"?e.amount:-e.amount; 
    let reqBal = 0;
    for(let i=idx+1; i<events.length; i++){
      if(events[i].type==="expense") reqBal += events[i].amount;
      if(events[i].type==="income") break;
    }
    return{...e,balanceAfter:running,requiredBalance:reqBal}; 
  });
  const today = new Date(); today.setHours(0,0,0,0);

  const addWIF = () => { if(!newWIF.label||!newWIF.amount) return; setWhatIfFixed(p=>[...p,{...newWIF,id:`wif_${Date.now()}`}]); setNewWIF(BLANK_WI); };
  
  const addFixedExpense = () => {
    if(!newFixedLabel||!newFixedAmount) return;
    const newFixed = {
      id: `custom_${Date.now()}`,
      label: newFixedLabel,
      amount: parseFloat(newFixedAmount),
      category: "Custom",
      day: parseInt(newFixedDay)||1,
      month: newFixedMonth
    };
    setCustomFixed(p => [...p, newFixed]);
    setFixedEdits(p => ({...p, [newFixed.id]: newFixed.amount}));
    setFixedDates(p => ({...p, [newFixed.id]: {day: newFixed.day, month: newFixed.month}}));
    setNewFixedLabel("");
    setNewFixedAmount("");
    setNewFixedDay("1");
    setNewFixedMonth("salary");
    setShowAddFixed(false);
  };
  
  const deleteFixedExpense = (id) => {
    setFixedEdits(p => { const newObj = {...p}; delete newObj[id]; return newObj; });
    setFixedDates(p => { const newObj = {...p}; delete newObj[id]; return newObj; });
    setCustomFixed(p => p.filter(e => e.id !== id));
  };

  const applyFundTransaction = (fundName) => {
    if(!fundAmount || !fundReason) return;
    const amount = parseFloat(fundAmount);
    const change = fundType === "+" ? amount : -amount;
    const transaction = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      type: fundType,
      amount: amount,
      reason: fundReason
    };

    if(fundName === "tax") {
      setTaxFund(p => p + change);
      setTaxTransactions(p => [transaction, ...p]);
    } else if(fundName === "rain") {
      setRainyDayFund(p => p + change);
      setRainTransactions(p => [transaction, ...p]);
    } else if(fundName === "car") {
      setCarRepayFund(p => p + change);
      setCarTransactions(p => [transaction, ...p]);
    }

    setFundAmount("");
    setFundReason("");
    setFundType("+");
  };
  const addWIV = () => { if(!newWIV.label||!newWIV.amount) return; setWhatIfVar(p=>[...p,{...newWIV,id:`wiv_${Date.now()}`}]); setNewWIV(BLANK_WI); };

  const WhatIfBadge = () => {
    const t=wiFixedTotal+wiVarTotal; if(!t) return null;
    return <span style={{fontSize:11,background:C.amberBg,color:C.amber,border:`1px solid #fcd34d`,borderRadius:10,padding:"2px 8px",marginLeft:8}}>⚡ what-if: −R{t.toLocaleString("en-ZA",{minimumFractionDigits:2})}</span>;
  };

  const fmt = n => `R${(parseFloat(n)||0).toLocaleString("en-ZA",{minimumFractionDigits:2})}`;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Georgia',serif",color:C.text}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#9333ea,#e8589a)",padding:"28px 40px 24px",position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 20px rgba(147,51,234,0.2)"}}>
        <div style={{maxWidth:980,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.25em",color:"rgba(255,255,255,0.7)",textTransform:"uppercase",marginBottom:4}}>Contractor Budget</div>
            <h1 style={{margin:0,fontSize:26,fontWeight:"normal",color:"#fff",letterSpacing:"-0.01em"}}>Monthly Overview</h1>
          </div>
          <div style={{display:"flex",gap:8}}>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} style={selStyle}>
              {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} style={selStyle}>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{maxWidth:980,margin:"0 auto",padding:"32px 40px"}}>

        {/* Income */}
        <div style={card}>
          <div style={secLabel}>Income</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:20}}>
            <div>
              <div style={fLabel}>Working Days in {MONTHS[selectedMonth]}</div>
              <input type="number" value={workingDays} onChange={e=>setWorkingDays(parseInt(e.target.value)||0)} style={inp} />
              <div style={hint}>Auto-calculated — adjust for leave</div>
            </div>
            <div>
              <div style={fLabel}>Gross Income (GBP)</div>
              <div style={{...inp,background:C.purpleLight,color:C.purple,cursor:"default",fontWeight:"bold"}}>
                £{grossGBP.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}
              </div>
              <div style={hint}>£109.64 × {workingDays} days</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            <div>
              <div style={fLabel}>Amount Landed in Bank (ZAR)</div>
              <input type="number" placeholder="e.g. 45000" value={bankAmount} onChange={e=>setBankAmount(e.target.value)} style={inp} />
              {impliedRate&&<div style={{...hint,color:C.purple}}>Implied rate: R{impliedRate}/£</div>}
            </div>
            <div>
              <div style={fLabel}>Partner Contribution</div>
              <div style={{...inp,background:C.pinkLight,color:C.pink,cursor:"default",fontWeight:"bold"}}>R6,979.00</div>
              <div style={hint}>Fixed monthly transfer ~29th</div>
            </div>
          </div>
          {bankAmountNum>0&&(
            <div style={{marginTop:20,padding:"14px 20px",background:"linear-gradient(135deg,#f3e8ff,#fce7f3)",borderRadius:10,border:`1px solid ${C.purpleSoft}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:C.textMid,fontSize:13}}>Total Monthly Income</span>
              <span style={{fontSize:22,color:C.purple,fontWeight:"bold"}}>{fmt(totalIncome)}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setActiveSection(t)} style={{
              padding:"8px 22px",
              background:activeSection===t?"linear-gradient(135deg,#9333ea,#e8589a)":C.bgCard,
              border:`1px solid ${activeSection===t?"transparent":C.border}`,
              borderRadius:20,color:activeSection===t?"#fff":C.textMid,
              cursor:"pointer",fontSize:13,letterSpacing:"0.04em",textTransform:"capitalize",
              fontFamily:"inherit",boxShadow:activeSection===t?"0 2px 12px rgba(147,51,234,0.25)":"none",
              transition:"all 0.15s",whiteSpace:"nowrap",
            }}>{t}</button>
          ))}
        </div>

        {/* FIXED */}
        {activeSection==="fixed"&&(
          <div>
            <div style={card}>
              <div style={secLabel}>Fixed Expenses</div>
              <div style={{fontSize:12,color:C.textSoft,marginBottom:4}}>Edit amounts and debit dates. Changes reflect in the Cash Flow timeline.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 130px 52px 110px 40px",gap:8,padding:"10px 0 8px",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                {["Expense","Amount (R)","Day","Which Month",""].map((h,i)=>(
                  <div key={h} style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:i===1?"right":"left"}}>{h}</div>
                ))}
              </div>
              {Object.entries(categoryGroups).map(([cat,items])=>(
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",margin:"14px 0 6px",color:C.purple,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:catGrad(cat)}}/>
                    {cat}
                  </div>
                  {items.map(e=>{
                    const d=fixedDates[e.id]||FIXED_DEFAULTS[e.id]||{day:1,month:"next"};
                    const isCustom = e.id.startsWith("custom_");
                    return(
                      <div key={e.id} style={{display:"grid",gridTemplateColumns:"1fr 130px 52px 110px 40px",gap:8,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:14,color:C.text}}>{e.label}</span>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{color:C.textMuted,fontSize:13}}>R</span>
                          <input type="number" value={fixedEdits[e.id]} onChange={ev=>setFixedEdits(p=>({...p,[e.id]:ev.target.value}))} style={{...inp,width:"100%",textAlign:"right",padding:"6px 8px",fontSize:14}}/>
                        </div>
                        <input type="number" min="1" max="31" value={d.day} onChange={ev=>setFixedDates(p=>({...p,[e.id]:{...d,day:parseInt(ev.target.value)||1}}))} style={{...inp,textAlign:"center",padding:"6px 6px",fontSize:14}}/>
                        <select value={d.month} onChange={ev=>setFixedDates(p=>({...p,[e.id]:{...d,month:ev.target.value}}))} style={{...inp,padding:"6px 6px",fontSize:12,cursor:"pointer"}}>
                          <option value="salary">{SHORT_MONTHS[selectedMonth]}</option>
                          <option value="next">{SHORT_MONTHS[(selectedMonth+1)%12]}</option>
                        </select>
                        <button onClick={()=>deleteFixedExpense(e.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:16,padding:"4px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setFixedDates(Object.fromEntries(Object.entries(FIXED_DEFAULTS).map(([k,v])=>[k,{...v}])))} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:12,textDecoration:"underline",fontFamily:"inherit",padding:0}}>Reset all dates to defaults</button>
                <span style={{color:C.pink,fontSize:16,fontWeight:"bold"}}>Total: {fmt(Object.values(fixedEdits).reduce((a,b)=>a+(parseFloat(b)||0),0))}</span>
              </div>
            </div>

            <div style={card}>
              <button onClick={()=>setShowAddFixed(v=>!v)} style={{width:"100%",padding:"12px",background:showAddFixed?C.bgMuted:"linear-gradient(135deg,#9333ea,#e8589a)",border:`1px solid ${showAddFixed?C.border:"transparent"}`,borderRadius:12,color:showAddFixed?C.textMid:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:"bold",marginBottom:showAddFixed?12:0}}>
                {showAddFixed?"Cancel":"+ Add New Fixed Expense"}
              </button>

              {showAddFixed&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 140px",gap:12}}>
                  <div>
                    <div style={fLabel}>Expense Name</div>
                    <input type="text" placeholder="e.g. YouTube Premium" value={newFixedLabel} onChange={e=>setNewFixedLabel(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={fLabel}>Monthly Amount (R)</div>
                    <input type="number" placeholder="0" value={newFixedAmount} onChange={e=>setNewFixedAmount(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={fLabel}>Day</div>
                    <input type="number" min="1" max="31" value={newFixedDay} onChange={e=>setNewFixedDay(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <div style={fLabel}>Month</div>
                    <select value={newFixedMonth} onChange={e=>setNewFixedMonth(e.target.value)} style={{...inp,cursor:"pointer"}}>
                      <option value="salary">{SHORT_MONTHS[selectedMonth]}</option>
                      <option value="next">{SHORT_MONTHS[(selectedMonth+1)%12]}</option>
                    </select>
                  </div>
                </div>
              )}
              
              {showAddFixed&&(
                <button onClick={addFixedExpense} style={{width:"100%",marginTop:12,padding:"10px",background:"linear-gradient(135deg,#9333ea,#e8589a)",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:"bold"}}>
                  Add ✓
                </button>
              )}
            </div>

            <div style={{...card,border:`1.5px dashed #fcd34d`,background:C.amberBg}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:16}}>⚡</span><div style={{...secLabel,marginBottom:0,color:C.amber}}>What-if Planner — Fixed</div></div>
              <div style={{fontSize:12,color:"#92400e",marginBottom:16}}>Test how a new recurring expense would affect your budget. Not saved.</div>
              {whatIfFixed.length>0&&(
                <div style={{marginBottom:16}}>
                  {whatIfFixed.map(e=>(
                    <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid #fde68a`}}>
                      <span style={{fontSize:14,color:"#78350f"}}>{e.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14,color:C.amber,fontWeight:"bold"}}>{fmt(e.amount)}</span>
                        <button onClick={()=>setWhatIfFixed(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.amber,fontSize:16,padding:0}}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:10}}>
                    <span style={{fontSize:12,color:"#92400e"}}>Impact on surplus:</span>
                    <span style={{fontSize:14,fontWeight:"bold",color:C.amber}}>−{fmt(wiFixedTotal)}</span>
                  </div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 130px auto",gap:10,alignItems:"flex-end"}}>
                <div><div style={fLabel}>Expense name</div><input type="text" placeholder="e.g. New subscription" value={newWIF.label} onChange={e=>setNewWIF(p=>({...p,label:e.target.value}))} style={inp}/></div>
                <div><div style={fLabel}>Monthly amount (R)</div><input type="number" placeholder="0" value={newWIF.amount} onChange={e=>setNewWIF(p=>({...p,amount:e.target.value}))} style={inp}/></div>
                <div><div style={{...fLabel,opacity:0}}>.</div><button onClick={addWIF} style={{padding:"10px 16px",background:"#d97706",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:"bold",whiteSpace:"nowrap"}}>+ Test it</button></div>
              </div>
              {whatIfFixed.length>0&&<button onClick={()=>setWhatIfFixed([])} style={{marginTop:12,background:"none",border:"none",cursor:"pointer",color:"#92400e",fontSize:12,textDecoration:"underline",padding:0,fontFamily:"inherit"}}>Clear all</button>}
            </div>
          </div>
        )}

        {/* VARIABLE */}
        {activeSection==="variable"&&(
          <div>
            <div style={card}>
              <div style={secLabel}>Variable Expenses</div>
              <div style={{fontSize:12,color:C.textSoft,marginBottom:20}}>Set your monthly budget for each category.</div>
              {varCategories.map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontSize:14,color:C.text}}>{c.label}</div>
                    {c.id==="fuel"&&<div style={{fontSize:11,color:C.textSoft}}>Approx. every second month</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:C.textMuted,fontSize:13}}>R</span>
                    <input type="number" value={varExpenses[c.id]} onChange={e=>setVarExpenses(p=>({...p,[c.id]:parseFloat(e.target.value)||0}))} style={{...inp,width:120,textAlign:"right",padding:"6px 10px",fontSize:14}} placeholder="0"/>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"flex-end",paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <span style={{color:C.purple,fontSize:16,fontWeight:"bold"}}>Total: {fmt(Object.values(varExpenses).reduce((a,b)=>a+(parseFloat(b)||0),0))}</span>
              </div>
            </div>

            <div style={{...card,border:`1.5px dashed #fcd34d`,background:C.amberBg}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:16}}>⚡</span><div style={{...secLabel,marginBottom:0,color:C.amber}}>What-if Planner — Variable</div></div>
              <div style={{fontSize:12,color:"#92400e",marginBottom:16}}>Test a new variable spend. Not saved.</div>
              {whatIfVar.length>0&&(
                <div style={{marginBottom:16}}>
                  {whatIfVar.map(e=>(
                    <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid #fde68a`}}>
                      <span style={{fontSize:14,color:"#78350f"}}>{e.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14,color:C.amber,fontWeight:"bold"}}>{fmt(e.amount)}</span>
                        <button onClick={()=>setWhatIfVar(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.amber,fontSize:16,padding:0}}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:10}}>
                    <span style={{fontSize:12,color:"#92400e"}}>Impact on surplus:</span>
                    <span style={{fontSize:14,fontWeight:"bold",color:C.amber}}>−{fmt(wiVarTotal)}</span>
                  </div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 130px auto",gap:10,alignItems:"flex-end"}}>
                <div><div style={fLabel}>Spend description</div><input type="text" placeholder="e.g. New gym bag" value={newWIV.label} onChange={e=>setNewWIV(p=>({...p,label:e.target.value}))} style={inp}/></div>
                <div><div style={fLabel}>Amount (R)</div><input type="number" placeholder="0" value={newWIV.amount} onChange={e=>setNewWIV(p=>({...p,amount:e.target.value}))} style={inp}/></div>
                <div><div style={{...fLabel,opacity:0}}>.</div><button onClick={addWIV} style={{padding:"10px 16px",background:"#d97706",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:"bold",whiteSpace:"nowrap"}}>+ Test it</button></div>
              </div>
              {whatIfVar.length>0&&<button onClick={()=>setWhatIfVar([])} style={{marginTop:12,background:"none",border:"none",cursor:"pointer",color:"#92400e",fontSize:12,textDecoration:"underline",padding:0,fontFamily:"inherit"}}>Clear all</button>}
            </div>
          </div>
        )}

        {/* ACTUALS */}
        {activeSection==="actuals"&&(
          <div>
            <div style={{...card,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{...secLabel,marginBottom:4}}>Tracking: {MONTHS[selectedMonth]} {selectedYear}</div>
                <div style={{fontSize:12,color:C.textSoft}}>Enter what you actually spent. Green = under budget · Red = over budget.</div>
              </div>
            </div>

            <div style={card}>
              <div style={secLabel}>Variable — Budget vs Actual</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 120px 120px 90px",gap:8,padding:"0 0 8px",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                {["Category","Budgeted","Actual","Diff"].map((h,i)=>(
                  <div key={h} style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:i>0?"right":"left"}}>{h}</div>
                ))}
              </div>
              {varCategories.map(c=>{
                const budget = parseFloat(varExpenses[c.id])||0;
                const actual = curActuals[c.id]||0;
                const diff   = actual - budget;
                return(
                  <div key={c.id} style={{display:"grid",gridTemplateColumns:"1fr 120px 120px 90px",gap:8,padding:"9px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
                    <span style={{fontSize:14,color:C.text}}>{c.label}</span>
                    <div style={{textAlign:"right",fontSize:13,color:C.textMid}}>{fmt(budget)}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
                      <span style={{color:C.textMuted,fontSize:12}}>R</span>
                      <input type="number" placeholder="0" value={curActuals[c.id]||""} onChange={e=>setActual(c.id,e.target.value)} style={{...inp,width:90,textAlign:"right",padding:"4px 8px",fontSize:13}}/>
                    </div>
                    <div style={{textAlign:"right",fontSize:13,fontWeight:"bold",color:actual===0?C.textMuted:diff>0?C.red:C.green}}>
                      {actual===0?"—":`${diff>0?"+":""}${fmt(diff)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CASH FLOW - CARD BASED */}
        {activeSection==="cash flow"&&(
          <div>
            <div style={{...card,marginBottom:20}}>
              <div style={secLabel}>Cash Flow Settings</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
                <div>
                  <div style={fLabel}>Opening Balance (R)</div>
                  <input type="number" placeholder="e.g. 1200" value={cfStartBalance} onChange={e=>setCfStartBalance(e.target.value)} style={inp}/>
                  <div style={hint}>In account on salary day</div>
                </div>
                <div>
                  <div style={fLabel}>Salary Received Date</div>
                  <input type="number" min="1" max="31" value={cfSalaryDate} onChange={e=>setCfSalaryDate(parseInt(e.target.value)||13)} style={inp}/>
                  <div style={hint}>Default 13th</div>
                </div>
                <div>
                  <div style={fLabel}>Salary Amount (ZAR)</div>
                  <input type="number" placeholder={bankAmountNum>0?bankAmountNum:"e.g. 45000"} value={cfSalaryAmount} onChange={e=>setCfSalaryAmount(e.target.value)} style={inp}/>
                  <div style={hint}>{bankAmountNum>0?`Using ${fmt(bankAmountNum)} from Income`:"Enter or fill Income above"}</div>
                </div>
              </div>
            </div>

            <div style={{...card,marginBottom:20}}>
              <div style={secLabel}>View Salary Cycle</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div>
                  <div style={fLabel}>Month (income earned)</div>
                  <select value={cfMonth} onChange={e=>setCfMonth(parseInt(e.target.value))} style={{...inp,cursor:"pointer"}}>
                    {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
                  </select>
                  <div style={hint}>Salary received next month</div>
                </div>
                <div>
                  <div style={fLabel}>Year</div>
                  <select value={cfYear} onChange={e=>setCfYear(parseInt(e.target.value))} style={{...inp,cursor:"pointer"}}>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginTop:14,padding:"10px 14px",background:C.purpleLight,borderRadius:8,border:`1px solid ${C.purpleSoft}`,fontSize:12,color:C.purple}}>
                Viewing cycle: {cfSalaryDate} {SHORT_MONTHS[cfMonth]} → 12 {SHORT_MONTHS[nextMonthIdx]} {nextMonthYear}
              </div>
            </div>

            {timeline.some(e=>e.balanceAfter<0)&&(
              <div style={{padding:"12px 18px",background:C.redBg,border:"1px solid #fca5a5",borderRadius:10,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>⚠️</span>
                <span style={{color:C.red,fontSize:13}}>Your balance goes negative this cycle.</span>
              </div>
            )}

            <div style={card}>
              <div style={secLabel}>Cash Flow Timeline</div>
              
              {/* Opening balance card */}
              <div style={{background:C.bgMuted,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:11,color:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Opening Balance</div>
                    <div style={{fontSize:14,fontWeight:"bold",color:C.text,marginTop:4}}>Starting amount</div>
                  </div>
                  <div style={{fontSize:18,fontWeight:"bold",color:(parseFloat(cfStartBalance)||0)>=0?C.green:C.red}}>
                    {fmt(parseFloat(cfStartBalance)||0)}
                  </div>
                </div>
              </div>

              {/* Transaction cards */}
              {timeline.map(e=>{
                const isToday=e.dateObj.toDateString()===today.toDateString();
                const isPast=e.dateObj<today;
                const isIn=e.type==="income";
                const bal=e.balanceAfter;
                const req=e.requiredBalance;
                const isEnough=bal>=req;
                
                return(
                  <div key={e.id} style={{background:C.bgCard,border:`1px solid ${isToday?C.purple:C.border}`,borderRadius:12,padding:"16px",marginBottom:12,opacity:isPast?0.7:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <div style={{fontSize:11,color:isToday?C.purple:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:isToday?"bold":"normal"}}>
                          {e.eventDay} {SHORT_MONTHS[e.eventMonth]} {e.eventYear}
                          {isToday&&<span style={{marginLeft:8,background:C.purple,color:"#fff",borderRadius:4,padding:"2px 6px",fontSize:9}}>TODAY</span>}
                        </div>
                        <div style={{fontSize:14,fontWeight:"bold",color:C.text,marginTop:4}}>
                          {e.label}
                          {e.isAdHoc&&<span style={{fontSize:10,color:C.pink,marginLeft:6,background:C.pinkLight,borderRadius:4,padding:"1px 5px"}}>one-off</span>}
                        </div>
                        {e.note&&<div style={{fontSize:11,color:C.textMuted,marginTop:3}}>{e.note}</div>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{isIn?"Income":"Expense"}</div>
                        <div style={{fontSize:16,fontWeight:"bold",color:isIn?C.green:C.pink}}>
                          {isIn?"+":"-"}{fmt(e.amount)}
                        </div>
                      </div>
                    </div>

                    {/* Required & Balance */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Minimum needed for upcoming expenses</div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:18,fontWeight:"bold",color:isEnough?C.green:C.red}}>{isEnough?"✓":"⚠"}</span>
                          <span style={{fontSize:14,fontWeight:"bold",color:C.text}}>{fmt(req)}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Your balance after this</div>
                        <div style={{fontSize:18,fontWeight:"bold",color:bal<0?C.red:bal<2000?C.amber:C.green}}>
                          {fmt(bal)}
                        </div>
                      </div>
                    </div>

                    {e.isAdHoc&&(
                      <button onClick={()=>removeAdHoc(e.id)} style={{marginTop:12,width:"100%",padding:"8px",background:C.redBg,border:`1px solid #fca5a5`,borderRadius:8,color:C.red,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:"bold"}}>
                        Remove one-off
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Ad Hoc */}
              <button onClick={()=>setShowAdHocForm(v=>!v)} style={{width:"100%",padding:"12px",background:showAdHocForm?C.bgMuted:"linear-gradient(135deg,#9333ea,#e8589a)",border:`1px solid ${showAdHocForm?C.border:"transparent"}`,borderRadius:12,color:showAdHocForm?C.textMid:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:"bold",marginTop:12}}>
                {showAdHocForm?"Cancel":"+ Add one-off expense"}
              </button>

              {showAdHocForm&&(
                <div style={{...card,border:`1.5px solid ${C.purpleSoft}`,background:C.purpleLight,marginTop:12}}>
                  <div style={{...secLabel,marginBottom:14}}>New One-Off Expense</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 100px 80px",gap:12,marginBottom:12}}>
                    <div><div style={fLabel}>Label</div><input type="text" placeholder="e.g. Car service" value={adHocLabel} onChange={e=>setAdHocLabel(e.target.value)} style={inp}/></div>
                    <div><div style={fLabel}>Amount (R)</div><input type="number" placeholder="0" value={adHocAmount} onChange={e=>setAdHocAmount(e.target.value)} style={inp}/></div>
                    <div><div style={fLabel}>Day</div><input type="number" min="1" max="31" placeholder="1" value={adHocDay} onChange={e=>setAdHocDay(e.target.value)} style={inp}/></div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={fLabel}>Month</div>
                    <select value={adHocMonthType} onChange={e=>setAdHocMonthType(e.target.value)} style={{...inp,cursor:"pointer"}}>
                      <option value="salary">{SHORT_MONTHS[cfMonth]}</option>
                      <option value="next">{SHORT_MONTHS[nextMonthIdx]}</option>
                    </select>
                  </div>
                  <button onClick={addAdHoc} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#9333ea,#e8589a)",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:"bold"}}>Add ✓</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SAVINGS */}
        {activeSection==="savings"&&(
          <div>
            {/* Tax Fund Card */}
            <div style={{...card,borderLeft:`4px solid ${C.purple}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,letterSpacing:"0.12em",color:C.textSoft,textTransform:"uppercase",marginBottom:4}}>Tax Fund</div>
                  <div style={{fontSize:24,fontWeight:"bold",color:C.purple,letterSpacing:"-0.02em"}}>{fmt(taxFund)}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.textMuted}}>+R5,500/month</div>
              </div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",gap:12,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={fLabel}>Amount</div>
                  <input type="number" placeholder="e.g. 5500" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} style={inp}/>
                </div>
                <div>
                  <div style={fLabel}>Type</div>
                  <select value={fundType} onChange={e=>setFundType(e.target.value)} style={{...inp,cursor:"pointer"}}>
                    <option value="+">+ Add</option>
                    <option value="-">− Subtract</option>
                  </select>
                </div>
                <div>
                  <div style={fLabel}>Reason</div>
                  <input type="text" placeholder="e.g. Monthly transfer" value={fundReason} onChange={e=>setFundReason(e.target.value)} style={inp}/>
                </div>
              </div>
              
              <button onClick={()=>applyFundTransaction("tax")} style={{width:"100%",padding:"10px",background:C.purple,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:"bold",marginBottom:taxTransactions.length > 0 ? 12 : 0}}>Apply Transaction</button>

              {taxTransactions.length > 0 && (
                <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Recent Transactions</div>
                  {taxTransactions.slice(0,5).map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:12,borderBottom:`1px solid ${C.bgMuted}`}}>
                      <div>
                        <span style={{color:C.text,fontWeight:"500"}}>{t.reason}</span>
                        <div style={{fontSize:10,color:C.textMuted}}>{t.date}</div>
                      </div>
                      <span style={{color:t.type==="+"?C.green:C.red,fontWeight:"bold"}}>{t.type}{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rainy Day Fund Card */}
            <div style={{...card,borderLeft:`4px solid ${C.pink}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,letterSpacing:"0.12em",color:C.textSoft,textTransform:"uppercase",marginBottom:4}}>Rainy Day Fund</div>
                  <div style={{fontSize:24,fontWeight:"bold",color:C.pink,letterSpacing:"-0.02em"}}>{fmt(rainyDayFund)}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.textMuted}}>+R3,500/month</div>
              </div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",gap:12,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={fLabel}>Amount</div>
                  <input type="number" placeholder="e.g. 3500" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} style={inp}/>
                </div>
                <div>
                  <div style={fLabel}>Type</div>
                  <select value={fundType} onChange={e=>setFundType(e.target.value)} style={{...inp,cursor:"pointer"}}>
                    <option value="+">+ Add</option>
                    <option value="-">− Subtract</option>
                  </select>
                </div>
                <div>
                  <div style={fLabel}>Reason</div>
                  <input type="text" placeholder="e.g. Monthly transfer" value={fundReason} onChange={e=>setFundReason(e.target.value)} style={inp}/>
                </div>
              </div>
              
              <button onClick={()=>applyFundTransaction("rain")} style={{width:"100%",padding:"10px",background:C.pink,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:"bold",marginBottom:rainTransactions.length > 0 ? 12 : 0}}>Apply Transaction</button>

              {rainTransactions.length > 0 && (
                <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Recent Transactions</div>
                  {rainTransactions.slice(0,5).map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:12,borderBottom:`1px solid ${C.bgMuted}`}}>
                      <div>
                        <span style={{color:C.text,fontWeight:"500"}}>{t.reason}</span>
                        <div style={{fontSize:10,color:C.textMuted}}>{t.date}</div>
                      </div>
                      <span style={{color:t.type==="+"?C.green:C.red,fontWeight:"bold"}}>{t.type}{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Car Repayment Fund Card */}
            <div style={{...card,borderLeft:`4px solid ${C.green}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,letterSpacing:"0.12em",color:C.textSoft,textTransform:"uppercase",marginBottom:4}}>Car Repayment Fund</div>
                  <div style={{fontSize:24,fontWeight:"bold",color:C.green,letterSpacing:"-0.02em"}}>{fmt(carRepayFund)}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.textMuted}}>Target: {fmt(166500)}</div>
              </div>

              {carRepayFund > 0 && (
                <div style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:10,color:C.textSoft,letterSpacing:"0.08em",textTransform:"uppercase"}}>Progress</span>
                    <span style={{fontSize:12,color:C.green,fontWeight:"bold"}}>{((carRepayFund/166500)*100).toFixed(1)}%</span>
                  </div>
                  <div style={{height:6,background:"rgba(0,0,0,0.1)",borderRadius:3}}>
                    <div style={{height:"100%",width:`${Math.min((carRepayFund/166500)*100,100)}%`,background:C.green,borderRadius:3,transition:"width 0.3s ease"}}/>
                  </div>
                </div>
              )}
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",gap:12,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={fLabel}>Amount</div>
                  <input type="number" placeholder="e.g. 2000" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} style={inp}/>
                </div>
                <div>
                  <div style={fLabel}>Type</div>
                  <select value={fundType} onChange={e=>setFundType(e.target.value)} style={{...inp,cursor:"pointer"}}>
                    <option value="+">+ Add</option>
                    <option value="-">− Subtract</option>
                  </select>
                </div>
                <div>
                  <div style={fLabel}>Reason</div>
                  <input type="text" placeholder="e.g. Monthly payment" value={fundReason} onChange={e=>setFundReason(e.target.value)} style={inp}/>
                </div>
              </div>
              
              <button onClick={()=>applyFundTransaction("car")} style={{width:"100%",padding:"10px",background:C.green,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:"bold",marginBottom:carTransactions.length > 0 ? 12 : 0}}>Apply Transaction</button>

              {carTransactions.length > 0 && (
                <div style={{paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.textSoft,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Recent Transactions</div>
                  {carTransactions.slice(0,5).map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",fontSize:12,borderBottom:`1px solid ${C.bgMuted}`}}>
                      <div>
                        <span style={{color:C.text,fontWeight:"500"}}>{t.reason}</span>
                        <div style={{fontSize:10,color:C.textMuted}}>{t.date}</div>
                      </div>
                      <span style={{color:t.type==="+"?C.green:C.red,fontWeight:"bold"}}>{t.type}{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CC TRACKER */}
        {activeSection==="cc tracker"&&(
          <div>
            <div style={card}>
              <div style={secLabel}>Credit Card Debt Tracker</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div>
                  <div style={fLabel}>Current CC Balance (R)</div>
                  <input type="number" value={ccBalance} onChange={e=>setCcBalance(parseFloat(e.target.value)||0)} style={inp} />
                  <div style={hint}>Update each month as you pay down</div>
                </div>
                <div>
                  <div style={fLabel}>Allocated for CC Payoff</div>
                  <div style={{...inp,background:C.greenBg,color:C.green,cursor:"default",fontWeight:"bold"}}>
                    R7,734/month
                  </div>
                  <div style={hint}>From your monthly surplus</div>
                </div>
              </div>

              {ccBalance > 0 && (
                <div style={{marginTop:20}}>
                  <div style={{padding:"12px 16px",background:C.redBg,borderRadius:8,border:`1px solid #fca5a5`,marginBottom:12}}>
                    <div style={{fontSize:10,color:C.red,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Outstanding Balance</div>
                    <div style={{fontSize:24,color:C.red,fontWeight:"bold",letterSpacing:"-0.02em"}}>{fmt(ccBalance)}</div>
                  </div>

                  <div style={{padding:"12px 16px",background:C.greenBg,borderRadius:8,border:`1px solid ${C.greenLight}`}}>
                    <div style={{fontSize:10,color:C.textSoft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Estimated Payoff Timeline</div>
                    {ccBalance > 0 && ccBalance <= 7734 && (
                      <div style={{fontSize:14,color:C.green,fontWeight:"bold"}}>1 month (if you allocate full amount)</div>
                    )}
                    {ccBalance > 7734 && ccBalance <= 15468 && (
                      <div style={{fontSize:14,color:C.green,fontWeight:"bold"}}>~2 months</div>
                    )}
                    {ccBalance > 15468 && ccBalance <= 23202 && (
                      <div style={{fontSize:14,color:C.green,fontWeight:"bold"}}>~3 months</div>
                    )}
                    {ccBalance > 23202 && (
                      <div style={{fontSize:14,color:C.green,fontWeight:"bold"}}>~{Math.ceil(ccBalance/7734)} months</div>
                    )}
                    <div style={{fontSize:11,color:C.textSoft,marginTop:6}}>Based on R7,734/month allocation</div>
                  </div>
                </div>
              )}

              {ccBalance === 0 && (
                <div style={{marginTop:20,padding:"16px",background:C.greenBg,borderRadius:8,border:`1px solid ${C.greenLight}`,textAlign:"center"}}>
                  <div style={{fontSize:18,color:C.green,fontWeight:"bold"}}>✓ Credit card debt paid off!</div>
                  <div style={{fontSize:12,color:C.textSoft,marginTop:6}}>Your R7,734/month is now available for other goals</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {activeSection==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:24}}>
              <StatCard label="Total Income"  value={fmt(totalIncome)}   color={C.purple} bg={C.purpleLight} dim={!bankAmountNum}/>
              <StatCard label="Total Expenses" value={fmt(totalExpenses)} color={C.pink}   bg={C.pinkLight}/>
              <StatCard label={surplus>=0?"Surplus":"Shortfall"} value={fmt(Math.abs(surplus))} color={surplus>=0?C.green:C.red} bg={surplus>=0?C.greenBg:C.redBg} dim={!bankAmountNum}/>
            </div>
            <div style={card}>
              <div style={{display:"flex",alignItems:"center",marginBottom:20}}>
                <div style={secLabel}>Expense Breakdown</div><WhatIfBadge/>
              </div>
              {Object.entries(categoryGroups).map(([cat,items])=>{
                const total=items.reduce((a,e)=>a+(parseFloat(fixedEdits[e.id])||0),0);
                const pct=totalExpenses>0?Math.min((total/totalExpenses)*100,100):0;
                return(
                  <div key={cat} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:12,color:C.textMid,letterSpacing:"0.08em",textTransform:"uppercase"}}>{cat}</span>
                      <span style={{fontSize:13,color:C.text,fontWeight:"500"}}>{fmt(total)}</span>
                    </div>
                    <div style={{height:6,background:C.bgMuted,borderRadius:3}}>
                      <div style={{height:"100%",width:`${pct}%`,background:catGrad(cat),borderRadius:3,transition:"width 0.4s ease"}}/>
                    </div>
                  </div>
                );
              })}
              <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,color:C.textMid,letterSpacing:"0.08em",textTransform:"uppercase"}}>Variable</span>
                  <span style={{fontSize:13,color:C.text,fontWeight:"500"}}>{fmt(totalVar)}</span>
                </div>
                <div style={{height:6,background:C.bgMuted,borderRadius:3}}>
                  <div style={{height:"100%",width:totalExpenses>0?`${Math.min((totalVar/totalExpenses)*100,100)}%`:"0%",background:"linear-gradient(90deg,#c084fc,#e879f9)",borderRadius:3}}/>
                </div>
              </div>
              {(wiFixedTotal+wiVarTotal)>0&&(
                <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:12,color:C.amber,letterSpacing:"0.08em",textTransform:"uppercase"}}>⚡ What-if additions</span>
                    <span style={{fontSize:13,color:C.amber,fontWeight:"500"}}>{fmt(wiFixedTotal+wiVarTotal)}</span>
                  </div>
                  <div style={{height:6,background:C.bgMuted,borderRadius:3}}>
                    <div style={{height:"100%",width:totalExpenses>0?`${Math.min(((wiFixedTotal+wiVarTotal)/totalExpenses)*100,100)}%`:"0%",background:"linear-gradient(90deg,#fcd34d,#f59e0b)",borderRadius:3}}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{fontSize:11,color:C.textMuted,textAlign:"center",marginTop:28,letterSpacing:"0.05em"}}>
          Daily rate: £109.64 · Partner contribution: R6,979/mo · 💾 Data saved in browser
        </div>
      </div>
    </div>
  );
}

function StatCard({label,value,color,bg,dim}) {
  return(
    <div style={{background:bg||"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",opacity:dim?0.45:1,transition:"opacity 0.2s",boxShadow:"0 1px 6px rgba(147,51,234,0.07)"}}>
      <div style={{fontSize:11,letterSpacing:"0.12em",color:C.textSoft,textTransform:"uppercase",marginBottom:8}}>{label}</div>
      <div style={{fontSize:20,fontWeight:"bold",color,letterSpacing:"-0.02em"}}>{value}</div>
    </div>
  );
}

function SavingsCard({label,current,target,monthly,color,bg}) {
  const pct = target ? Math.min((current/target)*100, 100) : null;
  return(
    <div style={{background:bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",boxShadow:"0 1px 6px rgba(147,51,234,0.07)"}}>
      <div style={{fontSize:11,letterSpacing:"0.12em",color:C.textSoft,textTransform:"uppercase",marginBottom:8}}>{label}</div>
      <div style={{fontSize:20,fontWeight:"bold",color,letterSpacing:"-0.02em",marginBottom:6}}>R{(current||0).toLocaleString("en-ZA", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
      <div style={{fontSize:11,color:C.textMid}}>+R{monthly.toLocaleString("en-ZA")}/month {target ? `• Target: R${target.toLocaleString("en-ZA")}` : ''}</div>
      {target && pct !== null && (
        <div style={{marginTop:8,height:4,background:"rgba(0,0,0,0.1)",borderRadius:2}}>
          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transition:"width 0.3s ease"}}/>
        </div>
      )}
    </div>
  );
}

function catGrad(cat) {
  const m={Housing:"linear-gradient(90deg,#f472b6,#e8589a)",Insurance:"linear-gradient(90deg,#c084fc,#a855f7)",Wellness:"linear-gradient(90deg,#f9a8d4,#f472b6)",Home:"linear-gradient(90deg,#d8b4fe,#c084fc)",Subscriptions:"linear-gradient(90deg,#e879f9,#c026d3)",Banking:"linear-gradient(90deg,#c4b5fd,#a78bfa)",Savings:"linear-gradient(90deg,#86efac,#4ade80)",Tax:"linear-gradient(90deg,#f9a8d4,#ec4899)"};
  return m[cat]||"linear-gradient(90deg,#e9d5ff,#c084fc)";
}

const card={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:"28px 32px",marginBottom:20,boxShadow:"0 2px 12px rgba(147,51,234,0.06)"};
const secLabel={fontSize:11,letterSpacing:"0.2em",color:C.textSoft,textTransform:"uppercase",marginBottom:20};
const fLabel={fontSize:12,color:C.textMid,marginBottom:8,letterSpacing:"0.04em"};
const hint={fontSize:11,color:C.textMuted,marginTop:6};
const inp={width:"100%",background:C.bgInput,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px 14px",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
const selStyle={background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:8,color:"#fff",padding:"8px 12px",fontSize:13,fontFamily:"inherit",cursor:"pointer",outline:"none"};
