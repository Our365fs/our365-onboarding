const SB_URL='https://ezcyhxvloltdtbuwltry.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y3loeHZsb2x0ZHRidXdsdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTY1MTEsImV4cCI6MjA4OTE5MjUxMX0.e8fqOaSJWBrAElKq30s293k6jpkQI0YhxdqOL6bxuVM';
let sb=null;
try{sb=window.supabase.createClient(SB_URL,SB_KEY)}catch(e){}
let currentUser=null;
let agentsData=[],clientsData=[],policiesData=[],leadsData=[],commissionsData=[];
let policyFilter='all',leadFilter='all',commFilter='all';
// ─── AUTH ───
async function doLogin(){
const email=document.getElementById('loginEmail').value.trim().toLowerCase();
const pass=document.getElementById('loginPass').value;
if(!email||!pass){showLoginErr('Please enter email and password.');return}
if(sb){
try{
const{data,error}=await sb.from('agents').select('*').eq('email',email).single();
if(error||!data){showLoginErr('Account not found. Contact your agency principal.');return}
const ok=(data.role==='admin'&&pass==='Our365Admin')||(pass===data.agent_number);
if(!ok){showLoginErr('Incorrect password.');return}
currentUser={id:data.id,email:data.email,role:data.role||'agent',agent_number:data.agent_number,first_name:data.first_name,last_name:data.last_name};
sessionStorage.setItem('crm_user',JSON.stringify(currentUser));
showApp();return;
}catch(e){console.warn('Login error:',e)}
}
showLoginErr('Unable to connect. Please try again.');
}
function showLoginErr(m){const e=document.getElementById('loginErr');e.textContent=m;e.style.display='block'}
function doLogout(){currentUser=null;sessionStorage.removeItem('crm_user');document.getElementById('app').style.display='none';document.getElementById('loginWrap').style.display='flex';document.getElementById('loginPass').value='';document.getElementById('loginErr').style.display='none'}
const saved=sessionStorage.getItem('crm_user');
if(saved){currentUser=JSON.parse(saved);showApp()}
async function showApp(){
document.getElementById('loginWrap').style.display='none';
document.getElementById('app').style.display='block';
const isAdmin=currentUser.role==='admin';
const badge=document.getElementById('roleBadge');
badge.textContent=isAdmin?'Admin':'Agent';
badge.className='topbar-badge '+(isAdmin?'badge-admin':'badge-agent');
document.getElementById('userName').textContent=currentUser.first_name+' '+currentUser.last_name;
document.getElementById('userAvatar').textContent=((currentUser.first_name[0]||'')+(currentUser.last_name[0]||'')).toUpperCase();
document.querySelectorAll('.admin-only').forEach(el=>{el.style.display=isAdmin?'flex':'none'});
document.getElementById('clientsTitle').textContent=isAdmin?'All Clients':'My Clients';
document.getElementById('leadsTitle').textContent=isAdmin?'All Leads':'My Leads';
document.getElementById('policiesTitle').textContent=isAdmin?'All Policies':'My Policies';
document.getElementById('commissionsTitle').textContent=isAdmin?'All Commissions':'My Commissions';
await loadData();
nav('dashboard');
}
async function loadData(){
if(!sb)return;
try{
const{data:a}=await sb.from('agents').select('*').order('created_at',{ascending:false});
agentsData=a||[];
const isAdmin=currentUser.role==='admin';
let cq=sb.from('clients').select('*').order('created_at',{ascending:false});
if(!isAdmin)cq=cq.eq('agent_id',currentUser.id);
const{data:c}=await cq;
clientsData=c||[];
let pq=sb.from('policies').select('*').order('created_at',{ascending:false});
if(!isAdmin)pq=pq.eq('agent_id',currentUser.id);
const{data:p}=await pq;
policiesData=p||[];
let lq=sb.from('leads').select('*').order('created_at',{ascending:false});
if(!isAdmin)lq=lq.eq('agent_id',currentUser.id);
const{data:l}=await lq;
leadsData=l||[];
let mq=sb.from('commissions').select('*').order('created_at',{ascending:false});
if(!isAdmin)mq=mq.eq('agent_id',currentUser.id);
const{data:m}=await mq;
commissionsData=m||[];
}catch(e){console.warn('Load error:',e)}
}
// ─── NAV ───
function nav(page){
document.querySelectorAll('.page').forEach(p=>p.classList.remove('visible'));
document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
document.getElementById('pg-'+page).classList.add('visible');
const navEl=document.querySelector(`.nav-item[data-page="${page}"]`);
if(navEl)navEl.classList.add('active');
if(page==='dashboard')renderDashboard();
if(page==='agents')renderAgents();
if(page==='clients')renderClients();
if(page==='policies')renderPolicies();
if(page==='leads')renderLeads();
if(page==='commissions')renderCommissions();
}
// ─── DASHBOARD ───
function renderDashboard(){
const isAdmin=currentUser.role==='admin';
const activeAgents=agentsData.filter(a=>a.status==='active'&&a.role!=='admin').length;
const totalClients=clientsData.length;
const activePolicies=policiesData.filter(p=>p.status==='active'||p.status==='issued').length;
const newLeads=leadsData.filter(l=>l.status==='new').length;
const totalComm=commissionsData.filter(c=>c.status==='paid').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const pendingComm=commissionsData.filter(c=>c.status==='pending').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const leadBadge=document.getElementById('leadBadge');
if(newLeads>0){leadBadge.textContent=newLeads;leadBadge.style.display='inline'}else{leadBadge.style.display='none'}
let html='';
if(isAdmin){
html=`<div class="stat"><div class="stat-label">Active Agents</div><div class="stat-val">${activeAgents}</div></div>
<div class="stat"><div class="stat-label">Total Clients</div><div class="stat-val">${totalClients}</div></div>
<div class="stat"><div class="stat-label">Active Policies</div><div class="stat-val">${activePolicies}</div></div>
<div class="stat"><div class="stat-label">Paid Commissions</div><div class="stat-val money">$${totalComm.toLocaleString()}</div></div>`;
}else{
html=`<div class="stat"><div class="stat-label">My Clients</div><div class="stat-val">${totalClients}</div></div>
<div class="stat"><div class="stat-label">Active Policies</div><div class="stat-val">${activePolicies}</div></div>
<div class="stat"><div class="stat-label">New Leads</div><div class="stat-val" style="color:${newLeads>0?'var(--err)':'var(--navy)'}">${newLeads}</div></div>
<div class="stat"><div class="stat-label">Earned Commissions</div><div class="stat-val money">$${totalComm.toLocaleString()}</div><div class="stat-sub">$${pendingComm.toLocaleString()} pending</div></div>`;
}
document.getElementById('dashStats').innerHTML=html;
// Alerts
let alerts='';
if(newLeads>0)alerts+=`<div class="alert alert-warn">You have <strong>${newLeads} new lead${newLeads>1?'s':''}</strong> — contact within 5 minutes for best conversion.</div>`;
document.getElementById('dashAlerts').innerHTML=alerts;
// Recent policies table
const recent=policiesData.slice(0,5);
if(recent.length===0){
document.getElementById('dashTable').innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-s)">No recent activity. Add clients and policies to get started.</td></tr>';
}else{
document.getElementById('dashTable').innerHTML=recent.map(p=>{
const client=clientsData.find(c=>c.id===p.client_id);
const cname=client?client.first_name+' '+client.last_name:'—';
return `<tr>
<td class="name-bold">${esc(cname)}</td>
<td style="color:var(--text-s)">${esc(p.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(p.carrier||'—')}</td>
<td><span class="badge b-${p.status||'pending'}">${ucfirst(p.status||'pending')}</span></td>
<td class="money">${p.premium_amount?'$'+parseFloat(p.premium_amount).toLocaleString():'—'}</td>
<td style="color:var(--text-s);font-size:0.78rem">${fmtDate(p.created_at)}</td>
</tr>`}).join('');
}
}
// ─── AGENTS ───
function renderAgents(){
const search=(document.getElementById('agentSearch')?.value||'').toLowerCase();
let filtered=agentsData.filter(a=>a.role!=='admin');
if(search)filtered=filtered.filter(a=>(a.first_name+' '+a.last_name+' '+a.agent_number+' '+a.email).toLowerCase().includes(search));
document.getElementById('agentEmpty').style.display=filtered.length===0?'block':'none';
document.getElementById('agentTable').innerHTML=filtered.map(a=>{
const cCount=clientsData.filter(c=>c.agent_id===a.id).length;
const pCount=policiesData.filter(p=>p.agent_id===a.id).length;
return `<tr>
<td class="agent-num">${esc(a.agent_number||'—')}</td>
<td class="name-bold">${esc(a.first_name)} ${esc(a.last_name)}</td>
<td style="color:var(--text-s)">${esc(a.email)}</td>
<td style="color:var(--text-s)">${esc(a.phone||'—')}</td>
<td>${cCount}</td>
<td>${pCount}</td>
<td><span class="badge b-${a.status||'active'}">${ucfirst(a.status||'active')}</span></td>
</tr>`}).join('');
}
// ─── CLIENTS ───
function renderClients(){
const search=(document.getElementById('clientSearch')?.value||'').toLowerCase();
let filtered=clientsData;
if(search)filtered=filtered.filter(c=>(c.first_name+' '+c.last_name+' '+c.email+' '+c.phone).toLowerCase().includes(search));
document.getElementById('clientEmpty').style.display=filtered.length===0?'block':'none';
document.getElementById('clientTable').innerHTML=filtered.map(c=>`<tr>
<td class="name-bold">${esc(c.first_name)} ${esc(c.last_name)}</td>
<td style="color:var(--text-s)">${esc(c.email||'—')}</td>
<td style="color:var(--text-s)">${esc(c.phone||'—')}</td>
<td style="color:var(--text-s)">${esc(c.product_interest||'—')}</td>
<td><span class="badge b-${c.status||'prospect'}">${ucfirst(c.status||'prospect')}</span></td>
<td style="color:var(--text-s);font-size:0.78rem">${fmtDate(c.created_at)}</td>
<td><button class="link-btn" onclick="openModal('editClient','${c.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── POLICIES ───
function filterPolicies(f){
policyFilter=f;
document.querySelectorAll('#policyFilters .filter-btn').forEach(b=>b.classList.remove('active'));
event.target.classList.add('active');
renderPolicies();
}
function renderPolicies(){
const search=(document.getElementById('policySearch')?.value||'').toLowerCase();
let filtered=policiesData;
if(policyFilter!=='all')filtered=filtered.filter(p=>p.status===policyFilter);
if(search)filtered=filtered.filter(p=>{
const client=clientsData.find(c=>c.id===p.client_id);
const cname=client?client.first_name+' '+client.last_name:'';
return (cname+' '+p.policy_number+' '+p.carrier+' '+p.product_type).toLowerCase().includes(search);
});
document.getElementById('policyEmpty').style.display=filtered.length===0?'block':'none';
document.getElementById('policyTable').innerHTML=filtered.map(p=>{
const client=clientsData.find(c=>c.id===p.client_id);
const cname=client?client.first_name+' '+client.last_name:'—';
const freq=p.premium_frequency?'/'+p.premium_frequency:'';
return `<tr>
<td class="agent-num">${esc(p.policy_number||'—')}</td>
<td class="name-bold">${esc(cname)}</td>
<td style="color:var(--text-s)">${esc(p.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(p.carrier||'—')}</td>
<td class="money">${p.premium_amount?'$'+parseFloat(p.premium_amount).toLocaleString()+freq:'—'}</td>
<td><span class="badge b-${p.status||'pending'}">${ucfirst(p.status||'pending')}</span></td>
<td style="color:var(--text-s);font-size:0.78rem">${p.effective_date||'—'}</td>
<td><button class="link-btn" onclick="openModal('editPolicy','${p.id}')">Edit</button></td>
</tr>`}).join('');
}
// ─── LEADS ───
function filterLeads(f){
leadFilter=f;
document.querySelectorAll('#leadFilters .filter-btn').forEach(b=>b.classList.remove('active'));
event.target.classList.add('active');
renderLeads();
}
function renderLeads(){
const search=(document.getElementById('leadSearch')?.value||'').toLowerCase();
let filtered=leadsData;
if(leadFilter!=='all')filtered=filtered.filter(l=>l.status===leadFilter);
if(search)filtered=filtered.filter(l=>(l.first_name+' '+l.last_name+' '+l.phone+' '+l.email).toLowerCase().includes(search));
document.getElementById('leadEmpty').style.display=filtered.length===0?'block':'none';
document.getElementById('leadTable').innerHTML=filtered.map(l=>{
const agent=agentsData.find(a=>a.id===l.agent_id);
const aname=agent?agent.first_name+' '+agent.last_name:'Unassigned';
return `<tr>
<td class="name-bold">${esc(l.first_name)} ${esc(l.last_name)}</td>
<td style="color:var(--text-s)">${esc(l.phone||'—')}</td>
<td style="color:var(--text-s)">${esc(l.product_interest||'—')}</td>
<td style="color:var(--text-s)">${esc(l.source||'—')}</td>
<td style="color:var(--text-s);font-size:0.78rem">${esc(aname)}</td>
<td><span class="badge b-${l.status||'new'}">${ucfirst(l.status||'new')}</span></td>
<td style="color:var(--text-s);font-size:0.78rem">${fmtDate(l.created_at)}</td>
<td><button class="link-btn" onclick="openModal('editLead','${l.id}')">Edit</button></td>
</tr>`}).join('');
}
// ─── COMMISSIONS ───
function filterComm(f){
commFilter=f;
document.querySelectorAll('#commFilters .filter-btn').forEach(b=>b.classList.remove('active'));
event.target.classList.add('active');
renderCommissions();
}
function renderCommissions(){
let filtered=commissionsData;
if(commFilter!=='all')filtered=filtered.filter(c=>c.status===commFilter);
const paid=commissionsData.filter(c=>c.status==='paid').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const pending=commissionsData.filter(c=>c.status==='pending').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const chargebacks=commissionsData.filter(c=>c.status==='chargeback').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
document.getElementById('commStats').innerHTML=`
<div class="stat"><div class="stat-label">Paid</div><div class="stat-val money">$${paid.toLocaleString()}</div></div>
<div class="stat"><div class="stat-label">Pending</div><div class="stat-val" style="color:var(--warn)">$${pending.toLocaleString()}</div></div>
<div class="stat"><div class="stat-label">Chargebacks</div><div class="stat-val" style="color:var(--err)">$${chargebacks.toLocaleString()}</div></div>
<div class="stat"><div class="stat-label">Net Earned</div><div class="stat-val money">$${(paid-chargebacks).toLocaleString()}</div></div>`;
document.getElementById('commEmpty').style.display=filtered.length===0?'block':'none';
document.getElementById('commTable').innerHTML=filtered.map(c=>{
const agent=agentsData.find(a=>a.id===c.agent_id);
const aname=agent?agent.first_name+' '+agent.last_name:'—';
return `<tr>
<td style="color:var(--text-s);font-size:0.78rem">${esc(aname)}</td>
<td class="name-bold">${esc(c.client_name||'—')}</td>
<td style="color:var(--text-s)">${esc(c.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(c.carrier||'—')}</td>
<td class="money">${c.commission_amount?'$'+parseFloat(c.commission_amount).toLocaleString():'—'}</td>
<td style="color:var(--text-s)">${esc(c.commission_type||'—')}</td>
<td><span class="badge b-${c.status||'pending'}">${ucfirst(c.status||'pending')}</span></td>
<td style="color:var(--text-s);font-size:0.78rem">${c.pay_date||'—'}</td>
</tr>`}).join('');
}
// ─── PRODUCT & CARRIER OPTIONS ───
const PRODUCTS=['Term Life','Whole Life','Universal Life','IUL','Final Expense','Group Life','Health (ACA)','Short-Term Health','Group Health','Medicare Supplement','Medicare Advantage','Dental','Vision','Hospital Indemnity','Cancer/Critical Illness','Disability','Fixed Annuity','Fixed Indexed Annuity','Other'];
const CARRIERS=['ACA Carriers','Aetna','Aetna Senior Products','Aflac','AIG','Allstate Healthcare','Ambetter','American Equity','American General','American National','Americo','Anthem','Anthem ACA','Assurity','Athene','Avmed ACA','Avmed Medicare','Banner Life','Bestow','Blue Cross Blue Shield','Brighthouse Financial','Careington','CHUBB','Cigna','Colonial Penn','CVS Health / Aetna','Delta Dental','Devoted','Fidelity & Guaranty','Florida Blue','Foresters Financial','Gerber Life','GlicRX','Globe Life','Gold Kidney','Guardian Life','HealthFirst','HealthMarkets','HealthSun','Humana','Humana Dental','IMG (International Medical Travel)','Jackson National','John Hancock','Kaiser Permanente','Legal & General','Liberty Mutual','Lincoln Financial','Lumeris','Manhattan Life','MassMutual','MetLife','Midland National','Modern Woodmen','Molina','Mutual of Omaha','National Life','National Western Life','Nationwide','NCD','New York Life','North American','Northwestern Mutual','OneMain Financial','Oscar','Pacific Life','Penn Mutual','Physicians Mutual','Pivot Healthcare','Principal Financial','Protective Life','Prudential','Renaissance Dental','Sammons Financial','Security Benefit','Simply','Solis','Solstice','State Farm','Sun Life','Symetra','The Hartford','Transamerica','United Healthcare','United Healthcare ACA','USAA','Unum','VSP','WellCare','Zurich','Other'];
function optionsHtml(arr,selected){return arr.map(o=>`<option value="${o}"${selected===o?' selected':''}>${o}</option>`).join('')}
// ─── AGENT OPTIONS ───
function agentOpts(selectedId){
return agentsData.filter(a=>a.role!=='admin').map(a=>
`<option value="${a.id}"${a.id===selectedId?' selected':''}>${a.first_name} ${a.last_name} (${a.agent_number})</option>`
).join('');
}
// ─── MODALS ───
function openModal(type,id){
const title=document.getElementById('modalTitle');
const body=document.getElementById('modalBody');
document.getElementById('modalBg').classList.add('open');
if(type==='addAgent'){
title.textContent='Add New Agent';
body.innerHTML=`<div class="fg">
<div><label>First Name <span class="req">*</span></label><input id="mF" type="text"></div>
<div><label>Last Name <span class="req">*</span></label><input id="mL" type="text"></div>
<div><label>Email <span class="req">*</span></label><input id="mE" type="email"></div>
<div><label>Phone</label><input id="mP" type="tel"></div>
<div><label>Agent Number <span class="req">*</span></label><input id="mN" placeholder="e.g., A365-0001"></div>
<div><label>Role</label><select id="mR"><option value="agent">Agent</option><option value="admin">Admin</option></select></div>
<div class="full" style="background:var(--gold-l);padding:10px;border-radius:8px"><p style="font-size:0.76rem;color:var(--navy)"><strong>Default password:</strong> Agent Number (e.g., A365-0001)</p></div>
</div><button class="modal-submit" onclick="saveAgent()">Add Agent</button>`;
}
if(type==='addClient'){
title.textContent='Add New Client';
const agentSel=currentUser.role==='admin'?`<div class="full"><label>Assign to Agent <span class="req">*</span></label><select id="mCA">${agentOpts()}</select></div>`:'';
body.innerHTML=`<div class="fg">
<div><label>First Name <span class="req">*</span></label><input id="mCF" type="text"></div>
<div><label>Last Name <span class="req">*</span></label><input id="mCL" type="text"></div>
<div><label>Email</label><input id="mCE" type="email"></div>
<div><label>Phone <span class="req">*</span></label><input id="mCP" type="tel"></div>
<div class="full"><label>Address</label><input id="mCAd" type="text"></div>
<div><label>Date of Birth</label><input id="mCD" type="date"></div>
<div><label>Product Interest</label><select id="mCPr"><option value="">Select</option>${optionsHtml(PRODUCTS)}</select></div>
<div><label>Status</label><select id="mCS"><option value="prospect">Prospect</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="active">Active Client</option></select></div>
${agentSel}
<div class="full"><label>Notes</label><textarea id="mCN"></textarea></div>
</div><button class="modal-submit" onclick="saveClient()">Save Client</button>`;
}
if(type==='editClient'){
const c=clientsData.find(x=>x.id===id);if(!c)return;
title.textContent='Edit Client';
body.innerHTML=`<div class="fg">
<div><label>First Name <span class="req">*</span></label><input id="mCF" type="text" value="${esc(c.first_name)}"></div>
<div><label>Last Name <span class="req">*</span></label><input id="mCL" type="text" value="${esc(c.last_name)}"></div>
<div><label>Email</label><input id="mCE" type="email" value="${esc(c.email||'')}"></div>
<div><label>Phone</label><input id="mCP" type="tel" value="${esc(c.phone||'')}"></div>
<div class="full"><label>Address</label><input id="mCAd" type="text" value="${esc(c.address||'')}"></div>
<div><label>Date of Birth</label><input id="mCD" type="date" value="${c.dob||''}"></div>
<div><label>Product Interest</label><select id="mCPr"><option value="">Select</option>${optionsHtml(PRODUCTS,c.product_interest)}</select></div>
<div><label>Status</label><select id="mCS"><option value="prospect"${c.status==='prospect'?' selected':''}>Prospect</option><option value="contacted"${c.status==='contacted'?' selected':''}>Contacted</option><option value="quoted"${c.status==='quoted'?' selected':''}>Quoted</option><option value="active"${c.status==='active'?' selected':''}>Active Client</option></select></div>
<div class="full"><label>Notes</label><textarea id="mCN">${esc(c.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateClient('${c.id}')">Update Client</button>`;
}
if(type==='addPolicy'){
title.textContent='Add Policy';
const clientOpts=clientsData.map(c=>`<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join('');
const agentSel=currentUser.role==='admin'?`<div><label>Agent <span class="req">*</span></label><select id="mPAg">${agentOpts()}</select></div>`:'';
body.innerHTML=`<div class="fg">
<div><label>Client <span class="req">*</span></label><select id="mPCl">${clientOpts}</select></div>
${agentSel}
<div><label>Policy Number</label><input id="mPNum"></div>
<div><label>Product Type <span class="req">*</span></label><select id="mPPr"><option value="">Select</option>${optionsHtml(PRODUCTS)}</select></div>
<div><label>Carrier <span class="req">*</span></label><select id="mPCa"><option value="">Select</option>${optionsHtml(CARRIERS)}</select></div>
<div><label>Premium Amount</label><input id="mPAm" type="number" step="0.01" placeholder="0.00"></div>
<div><label>Premium Frequency</label><select id="mPFr"><option value="mo">Monthly</option><option value="qtr">Quarterly</option><option value="yr">Annual</option><option value="single">Single Premium</option></select></div>
<div><label>Status</label><select id="mPSt"><option value="pending">Pending</option><option value="issued">Issued</option><option value="active">Active</option><option value="lapsed">Lapsed</option><option value="cancelled">Cancelled</option></select></div>
<div><label>Effective Date</label><input id="mPEf" type="date"></div>
<div><label>Expiration Date</label><input id="mPEx" type="date"></div>
<div class="full"><label>Notes</label><textarea id="mPNo"></textarea></div>
</div><button class="modal-submit" onclick="savePolicy()">Save Policy</button>`;
}
if(type==='editPolicy'){
const p=policiesData.find(x=>x.id===id);if(!p)return;
const client=clientsData.find(c=>c.id===p.client_id);
title.textContent='Edit Policy';
body.innerHTML=`<div class="fg">
<div class="full"><label>Client</label><input disabled value="${client?client.first_name+' '+client.last_name:'—'}"></div>
<div><label>Policy Number</label><input id="mPNum" value="${esc(p.policy_number||'')}"></div>
<div><label>Product Type</label><select id="mPPr"><option value="">Select</option>${optionsHtml(PRODUCTS,p.product_type)}</select></div>
<div><label>Carrier</label><select id="mPCa"><option value="">Select</option>${optionsHtml(CARRIERS,p.carrier)}</select></div>
<div><label>Premium Amount</label><input id="mPAm" type="number" step="0.01" value="${p.premium_amount||''}"></div>
<div><label>Premium Frequency</label><select id="mPFr"><option value="mo"${p.premium_frequency==='mo'?' selected':''}>Monthly</option><option value="qtr"${p.premium_frequency==='qtr'?' selected':''}>Quarterly</option><option value="yr"${p.premium_frequency==='yr'?' selected':''}>Annual</option><option value="single"${p.premium_frequency==='single'?' selected':''}>Single Premium</option></select></div>
<div><label>Status</label><select id="mPSt"><option value="pending"${p.status==='pending'?' selected':''}>Pending</option><option value="issued"${p.status==='issued'?' selected':''}>Issued</option><option value="active"${p.status==='active'?' selected':''}>Active</option><option value="lapsed"${p.status==='lapsed'?' selected':''}>Lapsed</option><option value="cancelled"${p.status==='cancelled'?' selected':''}>Cancelled</option></select></div>
<div><label>Effective Date</label><input id="mPEf" type="date" value="${p.effective_date||''}"></div>
<div><label>Expiration Date</label><input id="mPEx" type="date" value="${p.expiration_date||''}"></div>
<div class="full"><label>Notes</label><textarea id="mPNo">${esc(p.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updatePolicy('${p.id}')">Update Policy</button>`;
}
if(type==='addLead'){
title.textContent='Add Lead';
body.innerHTML=`<div class="fg">
<div><label>First Name <span class="req">*</span></label><input id="mLF" type="text"></div>
<div><label>Last Name <span class="req">*</span></label><input id="mLL" type="text"></div>
<div><label>Email</label><input id="mLE" type="email"></div>
<div><label>Phone <span class="req">*</span></label><input id="mLP" type="tel"></div>
<div><label>Product Interest</label><select id="mLPr"><option value="">Select</option>${optionsHtml(PRODUCTS)}</select></div>
<div><label>Source</label><select id="mLSo"><option value="">Select</option><option value="Google Ads">Google Ads</option><option value="Facebook Ads">Facebook Ads</option><option value="Referral">Referral</option><option value="Website">Website</option><option value="Walk-In">Walk-In</option><option value="Cold Call">Cold Call</option><option value="Other">Other</option></select></div>
<div><label>Assign to Agent <span class="req">*</span></label><select id="mLAg">${agentOpts()}</select></div>
<div><label>Status</label><select id="mLSt"><option value="new">New</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="sold">Sold</option><option value="lost">Lost</option></select></div>
<div class="full"><label>Notes</label><textarea id="mLNo"></textarea></div>
</div><button class="modal-submit" onclick="saveLead()">Save Lead</button>`;
}
if(type==='editLead'){
const l=leadsData.find(x=>x.id===id);if(!l)return;
title.textContent='Edit Lead';
const agentSel=currentUser.role==='admin'?`<div><label>Assigned Agent</label><select id="mLAg">${agentOpts(l.agent_id)}</select></div>`:'';
body.innerHTML=`<div class="fg">
<div><label>First Name</label><input id="mLF" type="text" value="${esc(l.first_name)}"></div>
<div><label>Last Name</label><input id="mLL" type="text" value="${esc(l.last_name)}"></div>
<div><label>Email</label><input id="mLE" type="email" value="${esc(l.email||'')}"></div>
<div><label>Phone</label><input id="mLP" type="tel" value="${esc(l.phone||'')}"></div>
<div><label>Product Interest</label><select id="mLPr"><option value="">Select</option>${optionsHtml(PRODUCTS,l.product_interest)}</select></div>
<div><label>Source</label><input id="mLSo" value="${esc(l.source||'')}" disabled></div>
${agentSel}
<div><label>Status</label><select id="mLSt"><option value="new"${l.status==='new'?' selected':''}>New</option><option value="contacted"${l.status==='contacted'?' selected':''}>Contacted</option><option value="quoted"${l.status==='quoted'?' selected':''}>Quoted</option><option value="sold"${l.status==='sold'?' selected':''}>Sold</option><option value="lost"${l.status==='lost'?' selected':''}>Lost</option></select></div>
<div class="full"><label>Notes</label><textarea id="mLNo">${esc(l.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateLead('${l.id}')">Update Lead</button>`;
}
if(type==='addCommission'){
title.textContent='Log Commission';
body.innerHTML=`<div class="fg">
<div><label>Agent <span class="req">*</span></label><select id="mMag">${agentOpts()}</select></div>
<div><label>Client Name <span class="req">*</span></label><input id="mMcl"></div>
<div><label>Product Type</label><select id="mMpr"><option value="">Select</option>${optionsHtml(PRODUCTS)}</select></div>
<div><label>Carrier</label><select id="mMca"><option value="">Select</option>${optionsHtml(CARRIERS)}</select></div>
<div><label>Commission Amount <span class="req">*</span></label><input id="mMam" type="number" step="0.01" placeholder="0.00"></div>
<div><label>Commission Type</label><select id="mMty"><option value="First Year">First Year</option><option value="Renewal">Renewal</option><option value="Override">Override</option><option value="Bonus">Bonus</option></select></div>
<div><label>Status</label><select id="mMst"><option value="pending">Pending</option><option value="paid">Paid</option><option value="chargeback">Chargeback</option></select></div>
<div><label>Pay Date</label><input id="mMdt" type="date"></div>
</div><button class="modal-submit" onclick="saveCommission()">Log Commission</button>`;
}
}
function closeModal(){document.getElementById('modalBg').classList.remove('open')}
// ─── SAVE FUNCTIONS ───
async function saveAgent(){
const f=v('mF'),l=v('mL'),e=v('mE').toLowerCase(),p=v('mP'),n=v('mN'),r=v('mR');
if(!f||!l||!e||!n){toast('Fill all required fields.','err');return}
const id='agent_'+Date.now()+'_'+rnd();
if(sb){const{error}=await sb.from('agents').insert({id,agent_number:n,email:e,first_name:f,last_name:l,phone:p,role:r,status:'active'});if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast(f+' '+l+' added!','succ');await loadData();renderAgents();
}
async function saveClient(){
const f=v('mCF'),l=v('mCL'),p=v('mCP');
if(!f||!l||!p){toast('Fill name and phone.','err');return}
const agentId=currentUser.role==='admin'?v('mCA'):currentUser.id;
const id='client_'+Date.now()+'_'+rnd();
if(sb){const{error}=await sb.from('clients').insert({id,agent_id:agentId,first_name:f,last_name:l,email:v('mCE'),phone:p,address:v('mCAd'),dob:v('mCD'),product_interest:v('mCPr'),status:v('mCS'),notes:v('mCN')});if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast(f+' '+l+' added!','succ');await loadData();renderClients();renderDashboard();
}
async function updateClient(id){
const f=v('mCF'),l=v('mCL');
if(!f||!l){toast('Name is required.','err');return}
if(sb){const{error}=await sb.from('clients').update({first_name:f,last_name:l,email:v('mCE'),phone:v('mCP'),address:v('mCAd'),dob:v('mCD'),product_interest:v('mCPr'),status:v('mCS'),notes:v('mCN'),updated_at:new Date().toISOString()}).eq('id',id);if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Client updated!','succ');await loadData();renderClients();renderDashboard();
}
async function savePolicy(){
const cl=v('mPCl'),pr=v('mPPr'),ca=v('mPCa');
if(!cl||!pr||!ca){toast('Select client, product, and carrier.','err');return}
const agentId=currentUser.role==='admin'?(document.getElementById('mPAg')?v('mPAg'):currentUser.id):currentUser.id;
const id='policy_'+Date.now()+'_'+rnd();
if(sb){const{error}=await sb.from('policies').insert({id,client_id:cl,agent_id:agentId,policy_number:v('mPNum'),product_type:pr,carrier:ca,premium_amount:parseFloat(v('mPAm'))||null,premium_frequency:v('mPFr'),status:v('mPSt'),effective_date:v('mPEf'),expiration_date:v('mPEx'),notes:v('mPNo')});if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Policy added!','succ');await loadData();renderPolicies();renderDashboard();
}
async function updatePolicy(id){
if(sb){const{error}=await sb.from('policies').update({policy_number:v('mPNum'),product_type:v('mPPr'),carrier:v('mPCa'),premium_amount:parseFloat(v('mPAm'))||null,premium_frequency:v('mPFr'),status:v('mPSt'),effective_date:v('mPEf'),expiration_date:v('mPEx'),notes:v('mPNo')}).eq('id',id);if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Policy updated!','succ');await loadData();renderPolicies();renderDashboard();
}
async function saveLead(){
const f=v('mLF'),l=v('mLL'),p=v('mLP'),ag=v('mLAg');
if(!f||!l||!p||!ag){toast('Fill name, phone, and agent.','err');return}
const id='lead_'+Date.now()+'_'+rnd();
if(sb){const{error}=await sb.from('leads').insert({id,agent_id:ag,first_name:f,last_name:l,email:v('mLE'),phone:p,product_interest:v('mLPr'),source:v('mLSo'),status:v('mLSt'),notes:v('mLNo'),assigned_at:new Date().toISOString()});if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Lead added!','succ');await loadData();renderLeads();renderDashboard();
}
async function updateLead(id){
const updates={first_name:v('mLF'),last_name:v('mLL'),email:v('mLE'),phone:v('mLP'),product_interest:v('mLPr'),status:v('mLSt'),notes:v('mLNo')};
if(currentUser.role==='admin'&&document.getElementById('mLAg'))updates.agent_id=v('mLAg');
if(sb){const{error}=await sb.from('leads').update(updates).eq('id',id);if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Lead updated!','succ');await loadData();renderLeads();renderDashboard();
}
async function saveCommission(){
const ag=v('mMag'),cl=v('mMcl'),am=v('mMam');
if(!ag||!cl||!am){toast('Fill agent, client, and amount.','err');return}
const id='comm_'+Date.now()+'_'+rnd();
if(sb){const{error}=await sb.from('commissions').insert({id,agent_id:ag,client_name:cl,product_type:v('mMpr'),carrier:v('mMca'),commission_amount:parseFloat(am),commission_type:v('mMty'),status:v('mMst'),pay_date:v('mMdt')});if(error){toast('Error: '+error.message,'err');return}}
closeModal();toast('Commission logged!','succ');await loadData();renderCommissions();renderDashboard();
}
// ─── UTILITIES ───
function v(id){const e=document.getElementById(id);return e?e.value.trim():''}
function esc(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML}
function ucfirst(s){return s?s.charAt(0).toUpperCase()+s.slice(1):''}
function fmtDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function rnd(){return Math.random().toString(36).slice(2,6)}
function toast(msg,type){const existing=document.querySelector('.toast');if(existing)existing.remove();const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3000)}
