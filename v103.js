/* Planning-GJsystems v10.3 additions, built on v10.5-corrected. */
(()=>{
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 /* De mobiele basis riep deze functie aan zonder implementatie. */
 window.renderOverview=function renderOverview(){
   const list=$('overviewList');if(!list)return;
   let data={customers:[],visits:[]};try{data=JSON.parse(localStorage.getItem('gj_mobile_v56_data_'+(sessionStorage.getItem('gj_workspace_storage_id')||'guest'))||'null')||data}catch(_){ }
   const q=String($('search')?.value||'').trim().toLowerCase();
   const customers=(data.customers||[]).filter(c=>!q||[c.name,c.chain,c.city,c.postal].some(v=>String(v||'').toLowerCase().includes(q)));
   list.innerHTML=customers.length?customers.map(c=>{
     const visits=(data.visits||[]).filter(v=>String(v.customerId)===String(c.id)&&v.status!=='Uit planning').sort((a,b)=>String(a.date).localeCompare(String(b.date)));
     const next=visits.find(v=>v.date>=new Date().toISOString().slice(0,10));
     return `<div class="card"><strong>${esc(c.name||'Klant')}</strong><div class="muted">${esc([c.city,c.postal].filter(Boolean).join(' · '))}</div><div>${next?esc(next.date+' · '+(next.status||'Gepland')):esc((window.t?window.t('noCustomers'):'Niet ingepland'))}</div></div>`;
   }).join(''):'<div class="card empty">'+esc(window.t?window.t('noCustomers'):'Geen klanten gevonden.')+'</div>';
 };

 function addUserActions(){
   document.querySelectorAll('.adminUser').forEach(card=>{
     const action=card.querySelector('[data-id]');const id=action?.dataset.id;if(!id)return;
     const box=card.querySelector('.adminUserActions')||card;
     if(!box.querySelector('.v103EditUser')){const b=document.createElement('button');b.type='button';b.className='v103EditUser';b.dataset.id=id;b.textContent='Gebruiker bewerken';box.appendChild(b)}
     if(!box.querySelector('.v103Impersonate')&&!card.textContent.includes(GJ_AUTH?.profile?.email||'__self__')){const b=document.createElement('button');b.type='button';b.className='v103Impersonate';b.dataset.id=id;b.textContent='Voordoen als gebruiker';box.appendChild(b)}
   });
 }
 async function adminCall(body){const {data,error}=await GJ_AUTH.sb.functions.invoke('admin-users',{body});if(error)throw error;if(data?.error)throw new Error(data.error);return data}
 document.addEventListener('click',async e=>{
   const as=e.target.closest('.v103Impersonate');if(as){sessionStorage.setItem('gj_impersonate_user_v102',as.dataset.id);location.reload();return}
   const edit=e.target.closest('.v103EditUser');if(!edit)return;
   const card=edit.closest('.adminUser');const current=card?.querySelector('strong')?.textContent||'';const parts=current.trim().split(/\s+/);const first=prompt('Voornaam',parts.shift()||'');if(first===null)return;const last=prompt('Achternaam',parts.join(' '));if(last===null)return;
   try{const full=[first.trim(),last.trim()].filter(Boolean).join(' ');const {error}=await GJ_AUTH.sb.from('profiles').update({first_name:first.trim(),last_name:last.trim(),full_name:full,updated_at:new Date().toISOString()}).eq('id',edit.dataset.id);if(error)throw error;alert('Gebruiker is bijgewerkt.');$('mAdminRefreshUsers')?.click();$('btnAdminRefreshUsers')?.click()}catch(err){alert('Gebruiker bewerken mislukt: '+err.message)}
 });
 function setVersion(){document.title=document.title.replace(/v10\.5/g,'v10.3');document.querySelectorAll('.version,.productVersion,.settingsVersion').forEach(e=>{e.innerHTML=e.innerHTML.replace(/v10\.5/g,'v10.3').replace(/v9\.0/g,'v10.3')})}
 function moveDataManagementToSettings(){
   const settings=$('settings'),grid=$('adminPaneSystem')?.querySelector('.beheerGrid');if(!settings||!grid||settings.querySelector('.v103UserDataManagement'))return;
   const box=document.createElement('section');box.className='v103UserDataManagement settingsBlock';box.innerHTML='<h3>Gegevens beheren</h3><p class="muted">Beheer je eigen planning, database, historie, routecache en back-up. Voor verwijderen moet je altijd exact BEVESTIG typen.</p>';
   box.appendChild(grid);settings.appendChild(box);
 }
 window.addEventListener('gj-auth-ready',()=>{setVersion();moveDataManagementToSettings();setTimeout(addUserActions,500);new MutationObserver(addUserActions).observe(document.body,{subtree:true,childList:true})});
})();
