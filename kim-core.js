/* Planning-GJsystems v6.2 Kim Working
   Centrale planning, tijden, routevelden en afwezigheden voor laptop + iPhone. */
(function(){
'use strict';
const URL='https://fcnsglahkjvhyfkghnpy.supabase.co';
const KEY='sb_publishable_dUtfbI9RAAwDCUBKJjjMCQ_kqIeg-ew';
const client=(window.supabase&&window.supabase.createClient)?window.supabase.createClient(URL,KEY):null;
const hhmm=v=>v?String(v).slice(0,5):'';
const sqlTime=v=>v?(String(v).length===5?String(v)+':00':String(v)):null;
const isLaptop=()=>typeof window.dayTimeline==='function'&&typeof window.visitsOn==='function';
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''));
let syncing=false, channel=null;
function minute(v){if(!v)return 0;const p=String(v).slice(0,5).split(':').map(Number);return p[0]*60+p[1]}
function clock(n){n=Math.max(0,Math.round(n));return String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function dayIndex(date){return new Date(date+'T12:00:00').getDay()}
function openingFor(c,date){
  if(isLaptop()&&typeof window.getOpeningWindow==='function')return window.getOpeningWindow(c,date);
  const raw=c?.opening??c?.Openingstijden??'';
  if(raw&&typeof raw==='object'){
    const keys=['zo','ma','di','wo','do','vr','za']; const x=raw[keys[dayIndex(date)]]||raw[String(dayIndex(date))];
    if(x){if(typeof x==='string'){const m=x.match(/(\d{1,2}[:.]\d{2}).*?(\d{1,2}[:.]\d{2})/);if(m)return{open:m[1].replace('.',':'),close:m[2].replace('.',':')}};if(x.open||x.van)return{open:hhmm(x.open||x.van),close:hhmm(x.close||x.tot)}}
  }
  const text=typeof raw==='string'?raw:'';
  const names=[['zo','zondag'],['ma','maandag'],['di','dinsdag'],['wo','woensdag'],['do','donderdag'],['vr','vrijdag'],['za','zaterdag']][dayIndex(date)];
  for(const part of text.split(/[;\n|]+/)){
    if(!names.some(n=>part.toLowerCase().includes(n))&&!/elke dag|dagelijks|alle dagen/i.test(part))continue;
    const m=part.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);if(m)return{open:m[1].replace('.',':'),close:m[2].replace('.',':')};
  }
  const m=text.match(/(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})/);if(m)return{open:m[1].replace('.',':'),close:m[2].replace('.',':')};
  return dayIndex(date)===0?{open:'',close:''}:{open:'10:00',close:'18:00'};
}
function permutations(a){if(a.length<2)return[a.slice()];const out=[];a.forEach((x,i)=>permutations(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>out.push([x].concat(p))));return out}
function laptopLeg(a,b,first){
  try{
    const mode=(!first&&typeof km==='function'&&km(a,b)!==null&&km(a,b)*1000<=Number(db.settings?.walk||300))?'walk':'car';
    const r=(typeof hasCoords==='function'&&hasCoords(a)&&hasCoords(b)&&db.routeCache?.[routeKey(a,b,mode)])||fallbackRoute(a,b,mode);
    return{mode,min:Number(r?.min||0)+(mode==='car'?Number(db.settings?.parking||15):0),driveMin:Number(r?.min||0),km:Number(r?.km||0),live:!!(r?.live||r?.source==='Live'||r?.source==='TomTom')};
  }catch(e){return{mode:'car',min:first?30:20,driveMin:first?30:20,km:0,live:false}}
}
function simulateLaptop(date,order){
  const base=minute(typeof effectiveDepartureFor==='function'?effectiveDepartureFor(date):(db.settings?.depart||'08:30'));
  let dep=base,cur=base,wait=0,invalid=0,totalKm=0,totalTravel=0; const rows=[];
  if(!order.length)return{score:0,dep,rows};
  const firstC=getC(order[0].customerId)||{};const firstLeg=laptopLeg(startPoint(),firstC,true);const firstOpen=minute(openingFor(firstC,date).open);
  if(firstOpen)dep=Math.max(base,firstOpen-firstLeg.min);
  cur=dep;
  order.forEach((v,i)=>{
    const c=getC(v.customerId)||{}; const prev=i?getC(order[i-1].customerId):startPoint(); const leg=laptopLeg(prev,c,i===0);
    cur+=leg.min;totalTravel+=leg.min;totalKm+=leg.km;
    const ow=openingFor(c,date),open=minute(ow.open),close=minute(ow.close),dur=Number(v.duration||c.Bezoektijd||60);
    if(!open||!close){invalid+=100000;rows.push({v,leg,start:cur,end:cur+dur,ow});cur+=dur;return}
    if(cur<open){wait+=open-cur;cur=open}
    const start=cur,end=start+dur;if(end>close)invalid+=100000+(end-close)*100;
    rows.push({v,leg,start,end,ow});cur=end;
  });
  const back=laptopLeg(getC(order[order.length-1].customerId)||{},startPoint(),false);cur+=back.min;totalKm+=back.km;totalTravel+=back.min;
  const home=minute(db.settings?.home||'18:00');if(cur>home)invalid+=(cur-home)*1000;
  return{score:invalid+wait*100+totalTravel+totalKm,dep,rows,back,wait,invalid,homeAt:cur};
}
function optimizeLaptopDay(date){
  const visits=window.visitsOn(date).filter(v=>v.status!=='Uit planning');if(!visits.length)return null;
  const candidates=visits.length<=7?permutations(visits):[visits];let best=null;
  for(const p of candidates){const s=simulateLaptop(date,p);if(!best||s.score<best.score)best=s}
  if(!best)return null;
  best.rows.forEach((r,i)=>{r.v.order=i+1;r.v.time=clock(r.start);r.v.end=clock(r.end);r.v.reistijd_min=r.leg.min;r.v.afstand_km=r.leg.km;r.v.route_mode=r.leg.mode;r.v.route_live=r.leg.live});
  db.dayDepartures=db.dayDepartures||{};db.dayDepartures[date]=clock(best.dep);
  if(typeof save==='function')save();return best;
}
async function customerMaps(){
  const {data,error}=await client.from('customers').select('id,klantnummer');if(error)throw error;
  const byLocal=new Map(),byId=new Map();(data||[]).forEach(r=>{byId.set(String(r.id),String(r.klantnummer||r.id));byLocal.set(String(r.id),String(r.id));if(r.klantnummer)byLocal.set(String(r.klantnummer),String(r.id))});return{byLocal,byId};
}
async function persistLaptopDay(date){
  const sim=optimizeLaptopDay(date);if(!sim)return;
  const maps=await customerMaps();
  await client.from('app_day_settings').upsert({datum:date,vertrektijd:sqlTime(clock(sim.dep)),pauze_actief:typeof breakEnabled==='function'?breakEnabled(date):true,updated_at:new Date().toISOString()},{onConflict:'datum'});
  const localIds=[];
  for(const r of sim.rows){
    const v=r.v,c=getC(v.customerId)||{},cid=maps.byLocal.get(String(v.customerId));if(!cid)continue;
    const row={customer_id:cid,datum:date,starttijd:sqlTime(v.time),eindtijd:sqlTime(v.end),status:v.status||'Gepland',vast:v.status==='Vast',uitgevoerd:v.status==='Bezocht'||v.status==='Uitgevoerd',route_volgorde:v.order,reistijd_min:Math.round(r.leg.min),bezoekduur_min:Number(v.duration||c.Bezoektijd||60),afstand_km:Number(r.leg.km||0),route_mode:r.leg.mode,route_live:!!r.leg.live,updated_at:new Date().toISOString(),notities:v.note||v.notes||''};
    let res;if(isUuid(v.id))res=await client.from('planning').update(row).eq('id',v.id).select('id').maybeSingle();else res=await client.from('planning').upsert(row,{onConflict:'customer_id,datum'}).select('id').single();
    if(res.error)throw res.error;if(res.data?.id){v.id=String(res.data.id);v.planningId=String(res.data.id);localIds.push(String(res.data.id))}
  }
  return true;
}
async function loadLaptop(){
  const maps=await customerMaps();const [p,d,a]=await Promise.all([client.from('planning').select('*').not('datum','is',null).order('datum').order('route_volgorde'),client.from('app_day_settings').select('*'),client.from('app_absences').select('*').order('start_date')]);if(p.error)throw p.error;
  const loaded=(p.data||[]).map(r=>({id:String(r.id),planningId:String(r.id),customerId:maps.byId.get(String(r.customer_id))||String(r.customer_id),date:r.datum,time:hhmm(r.starttijd),end:hhmm(r.eindtijd),status:r.status||'Gepland',duration:Number(r.bezoekduur_min||60),order:Number(r.route_volgorde||999),reistijd_min:Number(r.reistijd_min||0),afstand_km:Number(r.afstand_km||0),route_mode:r.route_mode||'car',route_live:!!r.route_live,supabase:true}));
  db.visits=(db.visits||[]).filter(v=>!v.supabase&&v.status==='Uit planning').concat(loaded);
  db.dayDepartures={};if(!d.error)(d.data||[]).forEach(r=>{if(r.datum)db.dayDepartures[r.datum]=hhmm(r.vertrektijd)});
  if(!a.error)db.blocks=(a.data||[]).map(r=>({id:String(r.id),type:r.type||'Overig',start:r.start_date,end:r.end_date||r.start_date,startTime:hhmm(r.start_time),endTime:hhmm(r.end_time),note:r.note||'',supabase:true}));
  save();render();return true;
}
function mobileCustomer(r){return{id:String(r.id),name:r.winkel||r.naam||r.klantnaam||r.keten||'Klant',chain:r.keten||'',street:r.straat||r.adres||'',nr:r.huisnr||r.huisnummer||'',postal:r.postcode||'',city:r.plaats||'',country:r.land||'',lat:r.latitude,lng:r.longitude,opening:r.openingstijden||'',visitDuration:Number(r.bezoektijd||30)}}
async function loadMobile(){
  const [p,d,a]=await Promise.all([client.from('planning').select('*').not('datum','is',null).order('datum').order('route_volgorde'),client.from('app_day_settings').select('*'),client.from('app_absences').select('*').order('start_date')]);if(p.error)throw p.error;
  const ids=[...new Set((p.data||[]).map(r=>r.customer_id).filter(Boolean))];let cr={data:[],error:null};if(ids.length)cr=await client.from('customers').select('*').in('id',ids);if(cr.error)throw cr.error;
  db.customers=(cr.data||[]).map(mobileCustomer);
  db.visits=(p.data||[]).map(r=>{const mode=r.route_mode||'car',km=Number(r.afstand_km||0),tm=Number(r.reistijd_min||0);return{id:String(r.id),planningId:String(r.id),customerId:String(r.customer_id),date:r.datum,time:hhmm(r.starttijd),end:hhmm(r.eindtijd),status:r.status||'Gepland',order:Number(r.route_volgorde||999),travel:tm,duration:Number(r.bezoekduur_min||30),mode,leg:(mode==='walk'?'🚶 ':'🚗 ')+(tm?tm+' min':'')+(km?' • '+(km<1?Math.round(km*1000)+' m':km.toFixed(1)+' km'):''),distanceKm:km,fromSupabase:true}});
  db.dayDepartures={};if(!d.error)(d.data||[]).forEach(r=>{if(r.datum)db.dayDepartures[r.datum]=hhmm(r.vertrektijd)});
  db.blocks=a.error?[]:(a.data||[]).map(r=>({id:String(r.id),type:r.type||'Overig',start:r.start_date,end:r.end_date||r.start_date,startTime:hhmm(r.start_time),endTime:hhmm(r.end_time),note:r.note||'',fromSupabase:true}));
  save();return true;
}
async function persistMobileVisit(v){const row={starttijd:sqlTime(v.time),eindtijd:sqlTime(v.end),route_volgorde:Number(v.order||999),status:v.status||'Gepland',updated_at:new Date().toISOString()};const {error}=await client.from('planning').update(row).eq('id',v.planningId||v.id);if(error)throw error}
async function persistMobileOrder(){const rows=(db.visits||[]).filter(v=>v.date===todayIso()&&v.status!=='Uit planning').sort((a,b)=>a.order-b.order);for(let i=0;i<rows.length;i++){rows[i].order=i+1;await persistMobileVisit(rows[i])}}
async function recalcMobileDeparture(date,value){
  db.dayDepartures=db.dayDepartures||{};db.dayDepartures[date]=value;let cur=minute(value);
  const rows=(db.visits||[]).filter(v=>v.date===date&&v.status!=='Uit planning').sort((a,b)=>a.order-b.order);
  for(const v of rows){cur+=Number(v.travel||0);const c=(db.customers||[]).find(x=>x.id===v.customerId)||{},ow=openingFor(c,date),op=minute(ow.open),cl=minute(ow.close),dur=Number(v.duration||c.visitDuration||30);if(op&&cur<op)cur=op;v.time=clock(cur);v.end=clock(cur+dur);if(cl&&cur+dur>cl)throw new Error((c.name||'Klant')+' past niet binnen openingstijd '+ow.open+'-'+ow.close);cur+=dur}
  const {error}=await client.from('app_day_settings').upsert({datum:date,vertrektijd:sqlTime(value),updated_at:new Date().toISOString()},{onConflict:'datum'});if(error)throw error;for(const v of rows)await persistMobileVisit(v);save();renderAll();
}
async function saveAbsence(b){const row={type:b.type||'Overig',start_date:b.start,end_date:b.end||b.start,start_time:sqlTime(b.startTime),end_time:sqlTime(b.endTime),note:b.note||'',updated_at:new Date().toISOString()};let q;if(isUuid(b.id))q=await client.from('app_absences').update(row).eq('id',b.id).select('*').single();else q=await client.from('app_absences').insert(row).select('*').single();if(q.error)throw q.error;b.id=String(q.data.id);return b}
async function syncNow(){if(syncing||!client||document.hidden)return;syncing=true;try{if(isLaptop())await loadLaptop();else{await loadMobile();if(typeof renderAll==='function')renderAll()}}finally{syncing=false}}
function installLaptop(){
  window.loadPlanningFromSupabase=loadLaptop;window.gjPersistDay=persistLaptopDay;
  const bind=()=>{const btn=document.getElementById('btnRunPlanning');if(!btn||btn.__kim62)return;const old=btn.onclick;btn.onclick=async function(e){if(old)await old.call(this,e);const from=typeof parseDisplayDate==='function'?parseDisplayDate(document.getElementById('planFrom')?.value):'',to=typeof parseDisplayDate==='function'?parseDisplayDate(document.getElementById('planTo')?.value):'';const dates=[...new Set((db.visits||[]).filter(v=>v.date&&(!from||v.date>=from)&&(!to||v.date<=to)&&v.status!=='Uit planning').map(v=>v.date))];for(const d of dates)await persistLaptopDay(d);await loadLaptop();alert('Planning correct opgeslagen en gesynchroniseerd met iPhone.');};btn.__kim62=true};
  window.addEventListener('load',()=>{setTimeout(bind,300);setTimeout(bind,1500)});
  const oldRefresh=window.refreshChangedDays;if(typeof oldRefresh==='function')window.refreshChangedDays=async function(dates){const r=await oldRefresh.apply(this,arguments);for(const d of [...new Set(dates||[])])await persistLaptopDay(d);return r};
}
function installMobile(){
  window.loadPlanningFromSupabase=loadMobile;window.manualSync=async(show)=>{try{await loadMobile();renderAll();if(show)alert('Planning gesynchroniseerd.')}catch(e){console.error(e);if(show)alert('Synchroniseren mislukt: '+e.message)}};
  window.syncPlanningToSupabase=async()=>{for(const v of (db.visits||[]).filter(v=>v.fromSupabase))await persistMobileVisit(v)};
  window.saveVisitOrderToSupabase=persistMobileOrder;
  window.saveDepartureToSupabase=recalcMobileDeparture;
  window.saveAbsenceToSupabase=saveAbsence;
}
function realtime(){if(!client?.channel)return;channel=client.channel('gj-kim-v62').on('postgres_changes',{event:'*',schema:'public',table:'planning'},syncNow).on('postgres_changes',{event:'*',schema:'public',table:'app_day_settings'},syncNow).on('postgres_changes',{event:'*',schema:'public',table:'app_absences'},syncNow).subscribe()}
if(client){if(isLaptop())installLaptop();else installMobile();window.addEventListener('load',()=>setTimeout(()=>{syncNow();realtime();setInterval(syncNow,20000)},1600));window.addEventListener('focus',syncNow);document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncNow()})}
})();
