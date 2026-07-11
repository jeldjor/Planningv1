(function(){
const URL='https://fcnsglahkjvhyfkghnpy.supabase.co';
const KEY='sb_publishable_dUtfbI9RAAwDCUBKJjjMCQ_kqIeg-ew';
const sb=window.supabase?.createClient(URL,KEY);
window.GJ_AUTH={sb,profile:null,isAdmin:false};
const REMEMBER_KEY='gj_login_remember_v1';
const SESSION_KEY='gj_app_open_session';
const saved=(()=>{try{return JSON.parse(localStorage.getItem(REMEMBER_KEY)||'null')}catch{return null}})();
const AUTH_LANG=localStorage.getItem('gj_app_language')||'nl';
const AUTH_TX={nl:{sub:'Log in om verder te gaan',email:'E-mailadres',password:'Wachtwoord',remember:'E-mailadres en wachtwoord onthouden',login:'Inloggen',reset:'Wachtwoord vergeten',security:'De onthouden gegevens worden alleen op dit apparaat opgeslagen.'},en:{sub:'Sign in to continue',email:'Email address',password:'Password',remember:'Remember email address and password',login:'Sign in',reset:'Forgot password',security:'Remembered details are stored only on this device.'},de:{sub:'Anmelden, um fortzufahren',email:'E-Mail-Adresse',password:'Passwort',remember:'E-Mail-Adresse und Passwort speichern',login:'Anmelden',reset:'Passwort vergessen',security:'Die gespeicherten Daten werden nur auf diesem Gerät abgelegt.'}};
const AX=AUTH_TX[AUTH_LANG]||AUTH_TX.nl;
const css=`<style>
#gjAuthGate{position:fixed;inset:0;z-index:999999;background:linear-gradient(145deg,#123b73 0%,#082b63 58%,#061f49 100%);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif}
#gjAuthCard{width:min(420px,100%);background:#fff;border:1px solid #d9e0e8;border-radius:22px;padding:24px;box-shadow:0 25px 70px #001a3d99}
.gjLogo{display:block;width:138px;max-height:124px;object-fit:contain;margin:0 auto 14px;filter:drop-shadow(0 8px 18px rgba(0,0,0,.20))}
.gjTitle{display:none!important}.gjSub{text-align:center;color:#667085;margin:2px 0 20px;font-weight:700}
.gjField{display:grid;gap:6px;margin:11px 0;font-weight:800;color:#102a43}.gjField input{font:inherit;padding:12px;border:1px solid #cbd5e1;border-radius:11px;outline:none}.gjField input:focus{border-color:#123b73;box-shadow:0 0 0 3px #123b731a}
.gjRemember{display:flex;align-items:center;gap:8px;margin:10px 0 4px;color:#334155;font-size:14px;font-weight:700}.gjRemember input{width:18px;height:18px;accent-color:#123b73}
.gjBtn{width:100%;border:1px solid #d9e0e8;border-radius:12px;padding:12px;font:inherit;font-weight:900;background:#123b73;color:#fff;margin-top:8px}.gjBtn.secondary{background:#f8fafc;color:#123b73}
.gjMsg{min-height:22px;color:#b42318;margin-top:10px;text-align:center}.gjSecurity{font-size:11px;color:#64748b;text-align:center;margin-top:8px;line-height:1.35}
.gjUserBar{display:none!important}.gjAdminOnly{display:none!important}body:not(.gj-admin) .gjAdminOnly{display:none!important}body.gj-admin #menuPanel button.gjAdminOnly{display:grid!important}body.gj-admin #adminNavBtn.gjAdminOnly{display:flex!important}
</style>`;
document.head.insertAdjacentHTML('beforeend',css);
document.body.insertAdjacentHTML('beforeend',`<div id="gjAuthGate"><div id="gjAuthCard"><img src="logo-login.png" class="gjLogo" alt="GJ Systems"><div class="gjSub">${AX.sub}</div><label class="gjField">${AX.email}<input id="gjEmail" type="email" autocomplete="username"></label><label class="gjField">${AX.password}<input id="gjPassword" type="password" autocomplete="current-password"></label><label class="gjRemember"><input id="gjRemember" type="checkbox"> ${AX.remember}</label><button id="gjLogin" class="gjBtn">${AX.login}</button><button id="gjReset" class="gjBtn secondary">${AX.reset}</button><div id="gjMsg" class="gjMsg"></div><div class="gjSecurity">${AX.security}</div></div></div>`);
const emailEl=document.getElementById('gjEmail');
const passwordEl=document.getElementById('gjPassword');
const rememberEl=document.getElementById('gjRemember');
if(saved?.remember){emailEl.value=saved.email||'';passwordEl.value=saved.password||'';rememberEl.checked=true}
const msg=t=>document.getElementById('gjMsg').textContent=t||'';
async function profileFor(user){let {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;if(!data){const m=user.user_metadata||{};const role=(user.email||'').toLowerCase()==='georgio_jejanan@hotmail.com'?'admin':'user';const row={id:user.id,email:user.email,first_name:m.first_name||'',last_name:m.last_name||'',full_name:m.full_name||user.email,role,is_active:true};const up=await sb.from('profiles').upsert(row).select().single();if(up.error)throw up.error;data=up.data}return data}
async function openApp(session){const p=await profileFor(session.user);if(p.is_active===false){await sb.auth.signOut();throw new Error('Dit account is uitgeschakeld.')}GJ_AUTH.profile=p;GJ_AUTH.isAdmin=p.role==='admin';document.body.classList.toggle('gj-admin',GJ_AUTH.isAdmin);document.getElementById('gjAuthGate').style.display='none';document.querySelectorAll('.gjUserBar').forEach(x=>x.remove());const st=await sb.rpc('get_tomtom_status');window.GJ_TOMTOM_ENABLED=!!(st.data===true||st.data?.enabled===true);window.dispatchEvent(new CustomEvent('gj-auth-ready',{detail:{profile:p}}))}
async function boot(){if(!sb){msg('Supabase kon niet worden geladen.');return}const allowed=sessionStorage.getItem(SESSION_KEY)==='1';const {data}=await sb.auth.getSession();if(allowed&&data.session){try{await openApp(data.session)}catch(e){msg(e.message)}}else if(data.session){await sb.auth.signOut()}}
document.getElementById('gjLogin').onclick=async()=>{try{msg('Bezig met inloggen...');const email=emailEl.value.trim();const password=passwordEl.value;const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;if(rememberEl.checked){localStorage.setItem(REMEMBER_KEY,JSON.stringify({remember:true,email,password}))}else{localStorage.removeItem(REMEMBER_KEY)}sessionStorage.setItem(SESSION_KEY,'1');await openApp(data.session)}catch(e){msg(e.message)}};
document.getElementById('gjReset').onclick=async()=>{try{const email=emailEl.value.trim();if(!email)throw new Error('Vul eerst je e-mailadres in.');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;msg('Herstellink is verstuurd.')}catch(e){msg(e.message)}};
boot();
})();
