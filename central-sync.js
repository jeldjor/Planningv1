/* Planning-GJsystems v6.1 Kim Stable
   Eén centrale Supabase-planning voor laptop en iPhone.
   De mobiele app leest tijden; de laptop blijft de planner en herstelt ontbrekende tijden. */
(function(){
  'use strict';
  const URL='https://fcnsglahkjvhyfkghnpy.supabase.co';
  const KEY='sb_publishable_dUtfbI9RAAwDCUBKJjjMCQ_kqIeg-ew';
  const client=(window.supabase&&window.supabase.createClient)?window.supabase.createClient(URL,KEY):null;
  let busy=false,timer=null,channel=null;
  const isLaptop=()=>typeof window.dayTimeline==='function'&&typeof window.visitsOn==='function';
  const hhmm=v=>v?String(v).slice(0,5):'';

  async function loadSharedSettings(){
    if(!client||typeof window.db==='undefined')return;
    const [days,abs]=await Promise.all([
      client.from('app_day_settings').select('*'),
      client.from('app_absences').select('*').order('start_date',{ascending:true})
    ]);
    if(!days.error){
      db.dayDepartures=db.dayDepartures||{};
      (days.data||[]).forEach(r=>{if(r.datum&&r.vertrektijd)db.dayDepartures[r.datum]=hhmm(r.vertrektijd)});
    }
    if(!abs.error){
      db.blocks=(abs.data||[]).map(r=>({id:String(r.id),type:r.type||'Overig',start:r.start_date,end:r.end_date||r.start_date,startTime:hhmm(r.start_time),endTime:hhmm(r.end_time),note:r.note||'',fromSupabase:true}));
    }
  }

  async function repairLaptopTimes(){
    if(!client||!isLaptop()||typeof db==='undefined')return;
    const dates=[...new Set((db.visits||[]).filter(v=>v.date&&v.status!=='Uit planning'&&(!v.time||!v.end)).map(v=>v.date))];
    for(const date of dates){
      const timeline=window.dayTimeline(date);
      const visits=window.visitsOn(date);
      for(const v of visits){
        const t=timeline.get(v.id);
        if(!t)continue;
        let changed=false;
        if(!v.time&&t.start){v.time=t.start;changed=true}
        if(!v.end&&t.end){v.end=t.end;changed=true}
        if(changed&&v.id){
          const {error}=await client.from('planning').update({starttijd:v.time?`${v.time}:00`:null,eindtijd:v.end?`${v.end}:00`:null,reistijd_min:t.travel_min??null,route_volgorde:t.order??null,updated_at:new Date().toISOString()}).eq('id',v.id);
          if(error)console.warn('Tijd herstellen mislukt',error.message);
        }
      }
    }
  }

  async function sync(reason){
    if(busy||!client||document.hidden)return;
    busy=true;
    try{
      if(isLaptop()){
        if(typeof window.loadPlanningFromSupabase==='function')await window.loadPlanningFromSupabase();
        await loadSharedSettings();
        await repairLaptopTimes();
        if(typeof window.save==='function')window.save();
        if(typeof window.render==='function')window.render();
      }else if(typeof window.manualSync==='function'){
        await window.manualSync(false);
      }
      console.info('Kim Stable sync:',reason||'sync');
    }catch(e){console.error('Kim Stable sync fout',e)}finally{busy=false}
  }
  function later(reason){clearTimeout(timer);timer=setTimeout(()=>sync(reason),400)}
  function realtime(){
    if(!client||typeof client.channel!=='function')return;
    channel=client.channel('gj-kim-stable-v61')
      .on('postgres_changes',{event:'*',schema:'public',table:'planning'},()=>later('planning'))
      .on('postgres_changes',{event:'*',schema:'public',table:'app_day_settings'},()=>later('daginstellingen'))
      .on('postgres_changes',{event:'*',schema:'public',table:'app_absences'},()=>later('afwezigheid'))
      .on('postgres_changes',{event:'*',schema:'public',table:'visit_history'},()=>later('historie'))
      .subscribe();
  }
  window.addEventListener('load',()=>setTimeout(()=>{sync('start');realtime();setInterval(()=>sync('periodiek'),20000)},1800));
  window.addEventListener('focus',()=>later('focus'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)later('zichtbaar')});
})();
