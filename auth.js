(function(){
const URL='https://fcnsglahkjvhyfkghnpy.supabase.co';
const KEY='sb_publishable_dUtfbI9RAAwDCUBKJjjMCQ_kqIeg-ew';
const sb=window.supabase?.createClient(URL,KEY);
window.GJ_AUTH={sb,profile:null,isAdmin:false};
const css=`<style>
#gjAuthGate{position:fixed;inset:0;z-index:999999;background:linear-gradient(145deg,#34206f,#7040c8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif}
#gjAuthCard{width:min(420px,100%);background:#fff;border-radius:24px;padding:26px;box-shadow:0 25px 70px #0006}.gjLogo{display:block;width:84px;margin:0 auto 10px}.gjTitle{text-align:center;font-size:26px;font-weight:800;margin:0}.gjSub{text-align:center;color:#667085;margin:7px 0 22px}.gjField{display:grid;gap:6px;margin:12px 0;font-weight:700}.gjField input{font:inherit;padding:13px;border:1px solid #ccd3df;border-radius:12px}.gjBtn{width:100%;border:0;border-radius:13px;padding:13px;font:inherit;font-weight:800;background:#6738c7;color:#fff;margin-top:8px}.gjMsg{min-height:22px;color:#b42318;margin-top:10px;text-align:center}.gjUserBar{position:fixed;right:14px;bottom:14px;z-index:90000;background:#fff;border:1px solid #ddd;border-radius:999px;padding:7px 10px;box-shadow:0 5px 20px #0002;font:600 12px Arial;display:flex;gap:8px;align-items:center}.gjUserBar button{border:0;background:#eee;border-radius:999px;padding:6px 9px;font-weight:700}.gjAdminOnly{display:none!important}body.gj-admin .gjAdminOnly{display:initial!important}body:not(.gj-admin) .dangerZone{display:none!important}
</style>`;
document.head.insertAdjacentHTML('beforeend',css);
document.body.insertAdjacentHTML('beforeend',`<div id="gjAuthGate"><div id="gjAuthCard"><img src="logo.png" class="gjLogo"><h1 class="gjTitle">Planning-GJsystems</h1><div class="gjSub">Log in om verder te gaan</div><label class="gjField">E-mailadres<input id="gjEmail" type="email" autocomplete="username"></label><label class="gjField">Wachtwoord<input id="gjPassword" type="password" autocomplete="current-password"></label><button id="gjLogin" class="gjBtn">Inloggen</button><button id="gjReset" class="gjBtn" style="background:#eee;color:#333">Wachtwoord vergeten</button><div id="gjMsg" class="gjMsg"></div></div></div>`);
function msg(t){document.getElementById('gjMsg').textContent=t||''}
async function profileFor(user){
 let {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
 if(error) throw error;
 if(!data){
   const meta=user.user_metadata||{};
   const role=(user.email||'').toLowerCase()==='georgio_jejanan@hotmail.com'?'admin':'user';
   const row={id:user.id,email:user.email,first_name:meta.first_name||'',last_name:meta.last_name||'',full_name:meta.full_name||user.email,role,is_active:true};
   const up=await sb.from('profiles').upsert(row).select().single(); if(up.error)throw up.error; data=up.data;
 }
 return data;
}
async function openApp(session){
 const p=await profileFor(session.user);
 if(p.is_active===false){await sb.auth.signOut();throw new Error('Dit account is uitgeschakeld.')}
 GJ_AUTH.profile=p;GJ_AUTH.isAdmin=p.role==='admin';
 document.body.classList.toggle('gj-admin',GJ_AUTH.isAdmin);
 document.getElementById('gjAuthGate').style.display='none';
 const name=p.full_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||p.email;
 document.body.insertAdjacentHTML('beforeend',`<div class="gjUserBar"><span>${name} · ${p.role==='admin'?'Beheerder':'Gebruiker'}</span><button id="gjLogout">Uitloggen</button></div>`);
 document.getElementById('gjLogout').onclick=async()=>{await sb.auth.signOut();location.reload()};
 const st=await sb.rpc('get_tomtom_status');
 window.GJ_TOMTOM_ENABLED=!!(st.data===true || st.data?.enabled===true);
 window.dispatchEvent(new CustomEvent('gj-auth-ready',{detail:{profile:p}}));
}
async function boot(){
 if(!sb){msg('Supabase kon niet worden geladen.');return}
 const {data}=await sb.auth.getSession();
 if(data.session){try{await openApp(data.session)}catch(e){msg(e.message)} }
}
document.getElementById('gjLogin').onclick=async()=>{try{msg('Bezig met inloggen...');const {data,error}=await sb.auth.signInWithPassword({email:gjEmail.value.trim(),password:gjPassword.value});if(error)throw error;await openApp(data.session)}catch(e){msg(e.message)}};
document.getElementById('gjReset').onclick=async()=>{try{const email=gjEmail.value.trim();if(!email)throw new Error('Vul eerst je e-mailadres in.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;msg('Herstellink is verstuurd.')}catch(e){msg(e.message)}};
boot();
})();
