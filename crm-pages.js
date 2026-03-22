// ─── DASHBOARD ───
function renderDashboard(){
const master=isMaster(),admin=isAdmin();
const activeAgents=agentsData.filter(a=>a.status==='Active'||a.status==='active').length;
const totalClients=clientsData.length;
const activePolicies=policiesData.filter(p=>['active','Active','issued','Issued','Complete'].includes(p.status)).length;
const newLeads=leadsData.filter(l=>l.status==='new'||l.status==='Not Contacted Yet').length;
const paidComm=commissionsData.filter(c=>c.status==='paid').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const pendComm=commissionsData.filter(c=>c.status==='pending').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const lb=document.getElementById('leadBadge');
if(newLeads>0){lb.textContent=newLeads;lb.style.display='inline'}else{lb.style.display='none'}
let h='';
if(admin||master){
h=`<div class="stat"><div class="stat-label">Agents</div><div class="stat-val">${activeAgents}</div></div>
<div class="stat"><div class="stat-label">Individuals</div><div class="stat-val">${totalClients}</div></div>
<div class="stat"><div class="stat-label">Active policies</div><div class="stat-val">${activePolicies}</div></div>
<div class="stat"><div class="stat-label">Commissions paid</div><div class="stat-val money">${fmtMoney(paidComm)}</div><div class="stat-sub">${fmtMoney(pendComm)} pending</div></div>`;
}else{
h=`<div class="stat"><div class="stat-label">My clients</div><div class="stat-val">${totalClients}</div></div>
<div class="stat"><div class="stat-label">Active policies</div><div class="stat-val">${activePolicies}</div></div>
<div class="stat"><div class="stat-label">New leads</div><div class="stat-val"${newLeads>0?' style="color:var(--err)"':''}>${newLeads}</div></div>
<div class="stat"><div class="stat-label">Earned</div><div class="stat-val money">${fmtMoney(paidComm)}</div><div class="stat-sub">${fmtMoney(pendComm)} pending</div></div>`;
}
document.getElementById('dashStats').innerHTML=h;
let alerts='';
if(newLeads>0)alerts+=`<div class="alert alert-warn"><strong>${newLeads} new lead${newLeads>1?'s':''}</strong> — contact within 5 minutes for best conversion.</div>`;
document.getElementById('dashAlerts').innerHTML=alerts;
// Mini pipeline
const stageCounts={};STAGES.forEach(s=>stageCounts[s]=0);
oppsData.forEach(o=>{if(stageCounts[o.stage]!==undefined)stageCounts[o.stage]++});
document.getElementById('dashPipeline').innerHTML=`<div class="tbl-wrap"><table><thead><tr><th>Stage</th><th>Count</th><th>Value</th></tr></thead><tbody>${STAGES.map(s=>{
const count=oppsData.filter(o=>o.stage===s).length;
const val=oppsData.filter(o=>o.stage===s).reduce((sum,o)=>sum+(parseFloat(o.estimated_premium)||0),0);
return `<tr><td>${STAGE_LABELS[s]}</td><td>${count}</td><td class="money">${fmtMoney(val)}</td></tr>`}).join('')}</tbody></table></div>`;
// Activities due
const openAct=activitiesData.filter(a=>a.status!=='completed'&&a.status!=='done').slice(0,5);
document.getElementById('dashAct').innerHTML=openAct.length?openAct.map(a=>`<tr>
<td class="name-bold">${esc(a.subject||'—')}</td>
<td style="color:var(--text-s)">${clientName(a.client_id)}</td>
<td>${badgeHtml(a.priority||'normal')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${a.due_date||'—'}</td>
<td>${badgeHtml(a.status||'open')}</td>
</tr>`).join(''):'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-s)">No activities due</td></tr>';
}
// ─── PIPELINE KANBAN ───
function renderPipeline(){
document.getElementById('kanbanBoard').innerHTML=STAGES.map(stage=>{
const items=oppsData.filter(o=>o.stage===stage);
const total=items.reduce((s,o)=>s+(parseFloat(o.estimated_premium)||0),0);
const hdClass=stage==='closed-won'?'green':stage==='closed-lost'?'red':'';
return `<div class="kanban-col"><div class="kanban-hd ${hdClass}">${STAGE_LABELS[stage]} <span class="count">${items.length}</span></div>
<div class="kanban-body">${items.map(o=>`<div class="kanban-card" onclick="openModal('editOpp','${o.id}')">
<div class="kc-name">${clientName(o.client_id)}</div>
<div class="kc-product">${esc(o.product_type||'')}</div>
<div class="kc-val">${fmtMoney(o.estimated_premium)}</div>
</div>`).join('')}</div>
<div class="kanban-total">Total: ${fmtMoney(total)}</div></div>`}).join('');
}
// ─── OPPORTUNITIES ───
function filterOpps(f){oppFilter=f;renderOpps()}
function renderOpps(){
filterBar('oppFilters',[{value:'all',label:'All'},...STAGES.map(s=>({value:s,label:STAGE_LABELS[s]}))],oppFilter,'filterOpps');
const search=(v('oppSearch')||'').toLowerCase();
let filtered=oppsData;
if(oppFilter!=='all')filtered=filtered.filter(o=>o.stage===oppFilter);
if(search)filtered=filtered.filter(o=>(clientName(o.client_id)+' '+o.product_type+' '+o.carrier).toLowerCase().includes(search));
document.getElementById('oppEmpty').style.display=filtered.length?'none':'block';
document.getElementById('oppTable').innerHTML=filtered.map(o=>`<tr>
<td class="name-bold">${clientName(o.client_id)}</td>
<td style="color:var(--text-s)">${esc(o.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(o.carrier||'—')}</td>
<td>${badgeHtml(o.stage)}</td>
<td class="money">${fmtMoney(o.estimated_premium)}</td>
<td style="color:var(--text-s);font-size:0.76rem">${o.expected_close||'—'}</td>
<td><button class="link-btn" onclick="openModal('editOpp','${o.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── AGENTS ───
function renderAgents(){
const search=(v('agentSearch')||'').toLowerCase();
let filtered=agentsData.filter(a=>a.agent_role!=='master_admin');
if(search)filtered=filtered.filter(a=>(a.first_name+' '+a.last_name+' '+a.agent_number+' '+a.email).toLowerCase().includes(search));
document.getElementById('agentEmpty').style.display=filtered.length?'none':'block';
document.getElementById('agentTable').innerHTML=filtered.map(a=>{
const cc=clientsData.filter(c=>c.agent_id===a.id).length;
const pc=policiesData.filter(p=>p.agent_id===a.id).length;
return `<tr>
<td class="agent-num">${esc(a.agent_number||'—')}</td>
<td class="name-bold">${esc(a.first_name)} ${esc(a.last_name)}</td>
<td style="color:var(--text-s)">${esc(a.email||'')}</td>
<td style="color:var(--text-s)">${esc(a.phone||'—')}</td>
<td>${badgeHtml(a.agent_role||'agent')}</td>
<td>${cc}</td><td>${pc}</td>
<td>${badgeHtml(a.status||'active')}</td>
</tr>`}).join('');
}
// ─── CLIENTS / INDIVIDUALS ───
function filterClients(f){clientFilter=f;renderClients()}
function renderClients(){
filterBar('clientFilters',[{value:'all',label:'All'},...INDIVIDUAL_STATUSES.map(s=>({value:s.toLowerCase().replace(/\s+/g,'-'),label:s}))],clientFilter,'filterClients');
const search=(v('clientSearch')||'').toLowerCase();
let filtered=clientsData;
if(clientFilter!=='all')filtered=filtered.filter(c=>(c.status||'').toLowerCase().replace(/\s+/g,'-')===clientFilter);
if(search)filtered=filtered.filter(c=>(c.first_name+' '+c.last_name+' '+c.email+' '+c.phone).toLowerCase().includes(search));
document.getElementById('clientEmpty').style.display=filtered.length?'none':'block';
document.getElementById('clientTable').innerHTML=filtered.map(c=>`<tr>
<td class="name-bold">${esc(c.first_name)} ${esc(c.last_name)}</td>
<td style="color:var(--text-s)">${esc(c.type||'Client')}</td>
<td>${badgeHtml(c.status||'prospect')}</td>
<td style="color:var(--text-s)">${esc(c.lead_source||'—')}</td>
<td style="color:var(--text-s)">${esc(c.phone||'—')}</td>
<td style="color:var(--text-s)">${esc(c.email||'—')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${agentName(c.agent_id)}</td>
<td><button class="link-btn" onclick="openModal('editClient','${c.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── POLICIES ───
function filterPolicies(f){policyFilter=f;renderPolicies()}
function renderPolicies(){
filterBar('policyFilters',[{value:'all',label:'All'},...POLICY_STATUSES.map(s=>({value:s.toLowerCase().replace(/\s+/g,'-'),label:s}))],policyFilter,'filterPolicies');
const search=(v('policySearch')||'').toLowerCase();
let filtered=policiesData;
if(policyFilter!=='all')filtered=filtered.filter(p=>(p.status||'').toLowerCase().replace(/\s+/g,'-')===policyFilter);
if(search)filtered=filtered.filter(p=>(clientName(p.client_id)+' '+p.policy_number+' '+p.carrier+' '+p.product_type).toLowerCase().includes(search));
document.getElementById('policyEmpty').style.display=filtered.length?'none':'block';
document.getElementById('policyTable').innerHTML=filtered.map(p=>`<tr>
<td class="agent-num">${esc(p.policy_number||'—')}</td>
<td class="name-bold">${clientName(p.client_id)}</td>
<td style="color:var(--text-s)">${esc(p.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(p.carrier||'—')}</td>
<td class="money">${p.premium_amount?fmtMoney(p.premium_amount)+(p.premium_frequency?'/'+p.premium_frequency:''):'—'}</td>
<td>${badgeHtml(p.status||'pending')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${p.effective_date||'—'}</td>
<td><button class="link-btn" onclick="openModal('editPolicy','${p.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── LEADS ───
function filterLeads(f){leadFilter=f;renderLeads()}
function renderLeads(){
filterBar('leadFilters',[{value:'all',label:'All'},{value:'not-contacted',label:'Not Contacted'},{value:'in-progress',label:'In Progress'},{value:'qualified',label:'Qualified'},{value:'enrolled',label:'Enrolled'},{value:'lost',label:'Lost'}],leadFilter,'filterLeads');
const search=(v('leadSearch')||'').toLowerCase();
let filtered=leadsData;
if(leadFilter!=='all')filtered=filtered.filter(l=>(l.status||'').toLowerCase().replace(/\s+/g,'-')===leadFilter);
if(search)filtered=filtered.filter(l=>(l.first_name+' '+l.last_name+' '+l.phone).toLowerCase().includes(search));
document.getElementById('leadEmpty').style.display=filtered.length?'none':'block';
document.getElementById('leadTable').innerHTML=filtered.map(l=>`<tr>
<td class="name-bold">${esc(l.first_name)} ${esc(l.last_name)}</td>
<td style="color:var(--text-s)">${esc(l.phone||'—')}</td>
<td style="color:var(--text-s)">${esc(l.product_interest||'—')}</td>
<td style="color:var(--text-s)">${esc(l.source||'—')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${agentName(l.agent_id)}</td>
<td>${badgeHtml(l.status||'new')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${fmtDate(l.created_at)}</td>
<td><button class="link-btn" onclick="openModal('editLead','${l.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── COMMISSIONS ───
function filterComm(f){commFilter=f;renderCommissions()}
function renderCommissions(){
filterBar('commFilters',[{value:'all',label:'All'},{value:'paid',label:'Paid'},{value:'pending',label:'Pending'},{value:'chargeback',label:'Chargeback'}],commFilter,'filterComm');
let filtered=commissionsData;
if(commFilter!=='all')filtered=filtered.filter(c=>c.status===commFilter);
const paid=commissionsData.filter(c=>c.status==='paid').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const pend=commissionsData.filter(c=>c.status==='pending').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
const cb=commissionsData.filter(c=>c.status==='chargeback').reduce((s,c)=>s+(parseFloat(c.commission_amount)||0),0);
document.getElementById('commStats').innerHTML=`<div class="stat"><div class="stat-label">Paid</div><div class="stat-val money">${fmtMoney(paid)}</div></div>
<div class="stat"><div class="stat-label">Pending</div><div class="stat-val" style="color:var(--warn)">${fmtMoney(pend)}</div></div>
<div class="stat"><div class="stat-label">Chargebacks</div><div class="stat-val" style="color:var(--err)">${fmtMoney(cb)}</div></div>
<div class="stat"><div class="stat-label">Net earned</div><div class="stat-val money">${fmtMoney(paid-cb)}</div></div>`;
document.getElementById('commEmpty').style.display=filtered.length?'none':'block';
document.getElementById('commTable').innerHTML=filtered.map(c=>`<tr>
<td style="color:var(--text-s);font-size:0.76rem">${agentName(c.agent_id)}</td>
<td class="name-bold">${esc(c.client_name||'—')}</td>
<td style="color:var(--text-s)">${esc(c.product_type||'—')}</td>
<td style="color:var(--text-s)">${esc(c.carrier||'—')}</td>
<td class="money">${fmtMoney(c.commission_amount)}</td>
<td style="color:var(--text-s)">${esc(c.commission_type||'—')}</td>
<td>${badgeHtml(c.status||'pending')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${c.pay_date||'—'}</td>
</tr>`).join('');
}
// ─── ACTIVITIES ───
function filterAct(f){actFilter=f;renderActivities()}
function renderActivities(){
filterBar('actFilters',[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'overdue',label:'Overdue'},{value:'completed',label:'Completed'}],actFilter,'filterAct');
const search=(v('actSearch')||'').toLowerCase();
let filtered=activitiesData;
if(actFilter==='open')filtered=filtered.filter(a=>a.status!=='completed'&&a.status!=='done');
else if(actFilter==='completed')filtered=filtered.filter(a=>a.status==='completed'||a.status==='done');
else if(actFilter==='overdue')filtered=filtered.filter(a=>a.due_date&&new Date(a.due_date)<new Date()&&a.status!=='completed');
if(search)filtered=filtered.filter(a=>(a.subject+' '+clientName(a.client_id)).toLowerCase().includes(search));
document.getElementById('actEmpty').style.display=filtered.length?'none':'block';
document.getElementById('actTable').innerHTML=filtered.map(a=>`<tr>
<td class="name-bold">${esc(a.subject||'—')}</td>
<td style="color:var(--text-s)">${esc(a.type||'—')}</td>
<td style="color:var(--text-s)">${clientName(a.client_id)}</td>
<td>${badgeHtml(a.priority||'normal')}</td>
<td style="color:var(--text-s);font-size:0.76rem">${a.due_date||'—'}</td>
<td>${badgeHtml(a.status||'open')}</td>
<td><button class="link-btn" onclick="openModal('editActivity','${a.id}')">Edit</button></td>
</tr>`).join('');
}
// ─── AGENCIES ───
function renderAgencies(){
document.getElementById('agencyTable').innerHTML=agenciesData.map(a=>{
const ac=agentsData.filter(x=>x.agency_id===a.id).length;
const cc=clientsData.filter(x=>x.agency_id===a.id).length;
const pc=policiesData.filter(x=>x.agency_id===a.id).length;
return `<tr><td class="name-bold">${esc(a.name)}</td><td>${ac}</td><td>${cc}</td><td>${pc}</td><td>${badgeHtml(a.status||'active')}</td><td><button class="link-btn" onclick="openModal('editAgency','${a.id}')">Edit</button></td></tr>`}).join('');
}
// ─── MODAL BUILDER ───
function buildModal(type,id){
const T=document.getElementById('modalTitle'),B=document.getElementById('modalBody');
const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const agSel=isAdmin()||isMaster()?`<div><label>Assign to agent</label><select id="mAg">${agentOpts()}</select></div>`:'';
if(type==='addAgent'){T.textContent='Add agent';B.innerHTML=`<div class="fg">
<div><label>First name <span class="req">*</span></label><input id="mF"></div>
<div><label>Last name <span class="req">*</span></label><input id="mL"></div>
<div><label>Email <span class="req">*</span></label><input id="mE" type="email"></div>
<div><label>Phone</label><input id="mP"></div>
<div><label>Agent number <span class="req">*</span></label><input id="mN" placeholder="A365-0001"></div>
<div><label>Role</label><select id="mR"><option value="agent">Agent</option><option value="team_manager">Team Manager</option><option value="principal">Principal</option></select></div>
<div><label>Status</label><select id="mSt">${optHtml(AGENT_STATUSES,'Not Contacted')}</select></div>
<div><label>Agency</label><select id="mAgency">${agenciesData.map(a=>`<option value="${a.id}"${a.id===aId?' selected':''}>${a.name}</option>`).join('')}</select></div>
<div class="full" style="background:var(--gold-l);padding:10px;border-radius:8px"><p style="font-size:0.74rem;color:var(--navy)"><strong>Default password:</strong> Agent number</p></div>
</div><button class="modal-submit" onclick="saveAgent()">Add agent</button>`}
if(type==='addClient'){T.textContent='New individual';B.innerHTML=`<div class="fg">
<div><label>First name <span class="req">*</span></label><input id="mCF"></div>
<div><label>Last name <span class="req">*</span></label><input id="mCL"></div>
<div><label>Type</label><select id="mCT">${optHtml(INDIVIDUAL_TYPES,'Client')}</select></div>
<div><label>Status</label><select id="mCS">${optHtml(INDIVIDUAL_STATUSES,'Not Contacted Yet')}</select></div>
<div><label>Email</label><input id="mCE" type="email"></div>
<div><label>Phone <span class="req">*</span></label><input id="mCP"></div>
<div class="full"><label>Address</label><input id="mCAd"></div>
<div><label>Date of birth</label><input id="mCD" type="date"></div>
<div><label>Lead source</label><select id="mCLs"><option value="">Select</option>${optHtml(LEAD_SOURCES)}</select></div>
<div><label>Product interest</label><select id="mCPr"><option value="">Select</option>${optHtml(PRODUCTS)}</select></div>
${agSel}
<div class="full"><label>Notes</label><textarea id="mCN"></textarea></div>
</div><button class="modal-submit" onclick="saveClient()">Save</button>`}
if(type==='editClient'){const c=clientsData.find(x=>x.id===id);if(!c)return;T.textContent='Edit individual';B.innerHTML=`<div class="fg">
<div><label>First name</label><input id="mCF" value="${esc(c.first_name)}"></div>
<div><label>Last name</label><input id="mCL" value="${esc(c.last_name)}"></div>
<div><label>Type</label><select id="mCT">${optHtml(INDIVIDUAL_TYPES,c.type||'Client')}</select></div>
<div><label>Status</label><select id="mCS">${optHtml(INDIVIDUAL_STATUSES,c.status||'Not Contacted Yet')}</select></div>
<div><label>Email</label><input id="mCE" value="${esc(c.email||'')}"></div>
<div><label>Phone</label><input id="mCP" value="${esc(c.phone||'')}"></div>
<div class="full"><label>Address</label><input id="mCAd" value="${esc(c.address||'')}"></div>
<div><label>DOB</label><input id="mCD" type="date" value="${c.dob||''}"></div>
<div><label>Lead source</label><select id="mCLs"><option value="">Select</option>${optHtml(LEAD_SOURCES,c.lead_source)}</select></div>
<div><label>Product interest</label><select id="mCPr"><option value="">Select</option>${optHtml(PRODUCTS,c.product_interest)}</select></div>
<div class="full"><label>Notes</label><textarea id="mCN">${esc(c.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateClient('${c.id}')">Update</button>`}
if(type==='addPolicy'){T.textContent='Add policy';B.innerHTML=`<div class="fg">
<div><label>Client <span class="req">*</span></label><select id="mPCl">${clientOpts()}</select></div>
${agSel?agSel.replace('mAg','mPAg'):''}
<div><label>Policy number</label><input id="mPNum"></div>
<div><label>Product <span class="req">*</span></label><select id="mPPr"><option value="">Select</option>${optHtml(PRODUCTS)}</select></div>
<div><label>Carrier <span class="req">*</span></label><select id="mPCa"><option value="">Select</option>${optHtml(CARRIERS)}</select></div>
<div><label>Premium</label><input id="mPAm" type="number" step="0.01"></div>
<div><label>Frequency</label><select id="mPFr"><option value="mo">Monthly</option><option value="qtr">Quarterly</option><option value="yr">Annual</option><option value="single">Single</option></select></div>
<div><label>Status</label><select id="mPSt">${optHtml(POLICY_STATUSES,'Pending Application')}</select></div>
<div><label>Effective date</label><input id="mPEf" type="date"></div>
<div><label>Expiration</label><input id="mPEx" type="date"></div>
<div class="full"><label>Notes</label><textarea id="mPNo"></textarea></div>
</div><button class="modal-submit" onclick="savePolicy()">Save policy</button>`}
if(type==='editPolicy'){const p=policiesData.find(x=>x.id===id);if(!p)return;T.textContent='Edit policy';B.innerHTML=`<div class="fg">
<div class="full"><label>Client</label><input disabled value="${clientName(p.client_id)}"></div>
<div><label>Policy #</label><input id="mPNum" value="${esc(p.policy_number||'')}"></div>
<div><label>Product</label><select id="mPPr"><option value="">Select</option>${optHtml(PRODUCTS,p.product_type)}</select></div>
<div><label>Carrier</label><select id="mPCa"><option value="">Select</option>${optHtml(CARRIERS,p.carrier)}</select></div>
<div><label>Premium</label><input id="mPAm" type="number" value="${p.premium_amount||''}"></div>
<div><label>Frequency</label><select id="mPFr"><option value="mo"${p.premium_frequency==='mo'?' selected':''}>Monthly</option><option value="qtr"${p.premium_frequency==='qtr'?' selected':''}>Quarterly</option><option value="yr"${p.premium_frequency==='yr'?' selected':''}>Annual</option><option value="single"${p.premium_frequency==='single'?' selected':''}>Single</option></select></div>
<div><label>Status</label><select id="mPSt">${optHtml(POLICY_STATUSES,p.status)}</select></div>
<div><label>Effective</label><input id="mPEf" type="date" value="${p.effective_date||''}"></div>
<div><label>Expiration</label><input id="mPEx" type="date" value="${p.expiration_date||''}"></div>
<div class="full"><label>Notes</label><textarea id="mPNo">${esc(p.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updatePolicy('${p.id}')">Update</button>`}
if(type==='addOpp'){T.textContent='New opportunity';B.innerHTML=`<div class="fg">
<div><label>Client <span class="req">*</span></label><select id="mOCl">${clientOpts()}</select></div>
<div><label>Product</label><select id="mOPr"><option value="">Select</option>${optHtml(PRODUCTS)}</select></div>
<div><label>Carrier</label><select id="mOCa"><option value="">Select</option>${optHtml(CARRIERS)}</select></div>
<div><label>Stage</label><select id="mOSt">${STAGES.map(s=>`<option value="${s}">${STAGE_LABELS[s]}</option>`).join('')}</select></div>
<div><label>Estimated premium</label><input id="mOAm" type="number" step="0.01"></div>
<div><label>Expected close</label><input id="mODt" type="date"></div>
${agSel?agSel.replace('mAg','mOAg'):''}
<div class="full"><label>Notes</label><textarea id="mONo"></textarea></div>
</div><button class="modal-submit" onclick="saveOpp()">Save</button>`}
if(type==='editOpp'){const o=oppsData.find(x=>x.id===id);if(!o)return;T.textContent='Edit opportunity';B.innerHTML=`<div class="fg">
<div><label>Client</label><select id="mOCl">${clientOpts(o.client_id)}</select></div>
<div><label>Product</label><select id="mOPr"><option value="">Select</option>${optHtml(PRODUCTS,o.product_type)}</select></div>
<div><label>Carrier</label><select id="mOCa"><option value="">Select</option>${optHtml(CARRIERS,o.carrier)}</select></div>
<div><label>Stage</label><select id="mOSt">${STAGES.map(s=>`<option value="${s}"${s===o.stage?' selected':''}>${STAGE_LABELS[s]}</option>`).join('')}</select></div>
<div><label>Estimated premium</label><input id="mOAm" type="number" value="${o.estimated_premium||''}"></div>
<div><label>Expected close</label><input id="mODt" type="date" value="${o.expected_close||''}"></div>
<div class="full"><label>Notes</label><textarea id="mONo">${esc(o.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateOpp('${o.id}')">Update</button>`}
if(type==='addLead'){T.textContent='Add lead';B.innerHTML=`<div class="fg">
<div><label>First name <span class="req">*</span></label><input id="mLF"></div>
<div><label>Last name <span class="req">*</span></label><input id="mLL"></div>
<div><label>Email</label><input id="mLE" type="email"></div>
<div><label>Phone <span class="req">*</span></label><input id="mLP"></div>
<div><label>Product interest</label><select id="mLPr"><option value="">Select</option>${optHtml(PRODUCTS)}</select></div>
<div><label>Source</label><select id="mLSo"><option value="">Select</option>${optHtml(LEAD_SOURCES)}</select></div>
<div><label>Assign to agent <span class="req">*</span></label><select id="mLAg">${agentOpts()}</select></div>
<div><label>Status</label><select id="mLSt">${optHtml(INDIVIDUAL_STATUSES,'Not Contacted Yet')}</select></div>
<div class="full"><label>Notes</label><textarea id="mLNo"></textarea></div>
</div><button class="modal-submit" onclick="saveLead()">Save lead</button>`}
if(type==='editLead'){const l=leadsData.find(x=>x.id===id);if(!l)return;T.textContent='Edit lead';
const agField=isAdmin()||isMaster()?`<div><label>Agent</label><select id="mLAg">${agentOpts(l.agent_id)}</select></div>`:'';
B.innerHTML=`<div class="fg">
<div><label>First name</label><input id="mLF" value="${esc(l.first_name)}"></div>
<div><label>Last name</label><input id="mLL" value="${esc(l.last_name)}"></div>
<div><label>Email</label><input id="mLE" value="${esc(l.email||'')}"></div>
<div><label>Phone</label><input id="mLP" value="${esc(l.phone||'')}"></div>
<div><label>Product</label><select id="mLPr"><option value="">Select</option>${optHtml(PRODUCTS,l.product_interest)}</select></div>
<div><label>Source</label><input disabled value="${esc(l.source||'')}"></div>
${agField}
<div><label>Status</label><select id="mLSt">${optHtml(INDIVIDUAL_STATUSES,l.status)}</select></div>
<div class="full"><label>Notes</label><textarea id="mLNo">${esc(l.notes||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateLead('${l.id}')">Update</button>`}
if(type==='addCommission'){T.textContent='Log commission';B.innerHTML=`<div class="fg">
<div><label>Agent <span class="req">*</span></label><select id="mMag">${agentOpts()}</select></div>
<div><label>Client name <span class="req">*</span></label><input id="mMcl"></div>
<div><label>Product</label><select id="mMpr"><option value="">Select</option>${optHtml(PRODUCTS)}</select></div>
<div><label>Carrier</label><select id="mMca"><option value="">Select</option>${optHtml(CARRIERS)}</select></div>
<div><label>Amount <span class="req">*</span></label><input id="mMam" type="number" step="0.01"></div>
<div><label>Type</label><select id="mMty"><option>First Year</option><option>Renewal</option><option>Override</option><option>Bonus</option></select></div>
<div><label>Status</label><select id="mMst"><option value="pending">Pending</option><option value="paid">Paid</option><option value="chargeback">Chargeback</option></select></div>
<div><label>Pay date</label><input id="mMdt" type="date"></div>
</div><button class="modal-submit" onclick="saveCommission()">Log commission</button>`}
if(type==='addActivity'){T.textContent='New activity';B.innerHTML=`<div class="fg">
<div class="full"><label>Subject <span class="req">*</span></label><input id="mAS"></div>
<div><label>Type</label><select id="mAT">${optHtml(ACTIVITY_TYPES,'Call')}</select></div>
<div><label>Client</label><select id="mACl"><option value="">Select</option>${clientOpts()}</select></div>
<div><label>Priority</label><select id="mAPr">${optHtml(PRIORITIES,'Normal')}</select></div>
<div><label>Due date</label><input id="mADt" type="date"></div>
<div><label>Status</label><select id="mASt"><option value="open">Open</option><option value="in-progress">In Progress</option><option value="waiting">Waiting</option><option value="completed">Completed</option></select></div>
<div class="full"><label>Description</label><textarea id="mADe"></textarea></div>
</div><button class="modal-submit" onclick="saveActivity()">Save</button>`}
if(type==='editActivity'){const a=activitiesData.find(x=>x.id===id);if(!a)return;T.textContent='Edit activity';B.innerHTML=`<div class="fg">
<div class="full"><label>Subject</label><input id="mAS" value="${esc(a.subject||'')}"></div>
<div><label>Type</label><select id="mAT">${optHtml(ACTIVITY_TYPES,a.type)}</select></div>
<div><label>Client</label><select id="mACl"><option value="">Select</option>${clientOpts(a.client_id)}</select></div>
<div><label>Priority</label><select id="mAPr">${optHtml(PRIORITIES,a.priority||'Normal')}</select></div>
<div><label>Due date</label><input id="mADt" type="date" value="${a.due_date||''}"></div>
<div><label>Status</label><select id="mASt"><option value="open"${a.status==='open'?' selected':''}>Open</option><option value="in-progress"${a.status==='in-progress'?' selected':''}>In Progress</option><option value="waiting"${a.status==='waiting'?' selected':''}>Waiting</option><option value="completed"${a.status==='completed'?' selected':''}>Completed</option></select></div>
<div class="full"><label>Description</label><textarea id="mADe">${esc(a.description||'')}</textarea></div>
</div><button class="modal-submit" onclick="updateActivity('${a.id}')">Update</button>`}
if(type==='addAgency'){T.textContent='New agency';B.innerHTML=`<div class="fg">
<div class="full"><label>Agency name <span class="req">*</span></label><input id="mAgN"></div>
<div><label>Phone</label><input id="mAgP"></div>
<div><label>Email</label><input id="mAgE"></div>
<div><label>Website</label><input id="mAgW"></div>
<div><label>Brand color</label><input id="mAgC" type="color" value="#1B5E20"></div>
<div class="full"><label>Address</label><input id="mAgAd"></div>
</div><button class="modal-submit" onclick="saveAgency()">Create agency</button>`}
}
// ─── SAVE FUNCTIONS ───
async function saveAgent(){const f=v('mF'),l=v('mL'),e=v('mE').toLowerCase(),n=v('mN');if(!f||!l||!e||!n){toast('Fill required fields','err');return}
const d={id:uid('agent'),agent_number:n,email:e,first_name:f,last_name:l,phone:v('mP'),role:v('mR')==='principal'?'admin':'agent',agent_role:v('mR'),status:v('mSt'),agency_id:v('mAgency')};
const{error}=await sb.from('agents').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast(f+' added!','succ');await loadData();renderAgents()}
async function saveClient(){const f=v('mCF'),l=v('mCL'),p=v('mCP');if(!f||!l||!p){toast('Fill name and phone','err');return}
const agId=(isAdmin()||isMaster())?v('mAg'):currentUser.id;const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('client'),agent_id:agId,agency_id:aId,first_name:f,last_name:l,type:v('mCT'),status:v('mCS'),email:v('mCE'),phone:p,address:v('mCAd'),dob:v('mCD'),lead_source:v('mCLs'),product_interest:v('mCPr'),notes:v('mCN')};
const{error}=await sb.from('clients').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast(f+' added!','succ');await loadData();renderClients()}
async function updateClient(id){const{error}=await sb.from('clients').update({first_name:v('mCF'),last_name:v('mCL'),type:v('mCT'),status:v('mCS'),email:v('mCE'),phone:v('mCP'),address:v('mCAd'),dob:v('mCD'),lead_source:v('mCLs'),product_interest:v('mCPr'),notes:v('mCN'),updated_at:new Date().toISOString()}).eq('id',id);
if(error){toast(error.message,'err');return}closeModal();toast('Updated!','succ');await loadData();renderClients()}
async function savePolicy(){const cl=v('mPCl'),pr=v('mPPr'),ca=v('mPCa');if(!cl||!pr||!ca){toast('Select client, product, carrier','err');return}
const agId=(isAdmin()||isMaster())&&document.getElementById('mPAg')?v('mPAg'):currentUser.id;const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('policy'),client_id:cl,agent_id:agId,agency_id:aId,policy_number:v('mPNum'),product_type:pr,carrier:ca,premium_amount:parseFloat(v('mPAm'))||null,premium_frequency:v('mPFr'),status:v('mPSt'),effective_date:v('mPEf'),expiration_date:v('mPEx'),notes:v('mPNo')};
const{error}=await sb.from('policies').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast('Policy added!','succ');await loadData();renderPolicies()}
async function updatePolicy(id){const{error}=await sb.from('policies').update({policy_number:v('mPNum'),product_type:v('mPPr'),carrier:v('mPCa'),premium_amount:parseFloat(v('mPAm'))||null,premium_frequency:v('mPFr'),status:v('mPSt'),effective_date:v('mPEf'),expiration_date:v('mPEx'),notes:v('mPNo')}).eq('id',id);
if(error){toast(error.message,'err');return}closeModal();toast('Updated!','succ');await loadData();renderPolicies()}
async function saveOpp(){const cl=v('mOCl');if(!cl){toast('Select a client','err');return}
const agId=(isAdmin()||isMaster())&&document.getElementById('mOAg')?v('mOAg'):currentUser.id;const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('opp'),client_id:cl,agent_id:agId,agency_id:aId,product_type:v('mOPr'),carrier:v('mOCa'),stage:v('mOSt'),estimated_premium:parseFloat(v('mOAm'))||null,expected_close:v('mODt'),notes:v('mONo')};
const{error}=await sb.from('opportunities').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast('Opportunity created!','succ');await loadData();renderPipeline();renderOpps()}
async function updateOpp(id){const{error}=await sb.from('opportunities').update({client_id:v('mOCl'),product_type:v('mOPr'),carrier:v('mOCa'),stage:v('mOSt'),estimated_premium:parseFloat(v('mOAm'))||null,expected_close:v('mODt'),notes:v('mONo'),updated_at:new Date().toISOString()}).eq('id',id);
if(error){toast(error.message,'err');return}closeModal();toast('Updated!','succ');await loadData();renderPipeline();renderOpps()}
async function saveLead(){const f=v('mLF'),l=v('mLL'),p=v('mLP'),ag=v('mLAg');if(!f||!l||!p||!ag){toast('Fill required fields','err');return}
const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('lead'),agent_id:ag,agency_id:aId,first_name:f,last_name:l,email:v('mLE'),phone:p,product_interest:v('mLPr'),source:v('mLSo'),status:v('mLSt'),notes:v('mLNo'),assigned_at:new Date().toISOString()};
const{error}=await sb.from('leads').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast('Lead added!','succ');await loadData();renderLeads()}
async function updateLead(id){const updates={first_name:v('mLF'),last_name:v('mLL'),email:v('mLE'),phone:v('mLP'),product_interest:v('mLPr'),status:v('mLSt'),notes:v('mLNo')};
if((isAdmin()||isMaster())&&document.getElementById('mLAg'))updates.agent_id=v('mLAg');
const{error}=await sb.from('leads').update(updates).eq('id',id);if(error){toast(error.message,'err');return}
closeModal();toast('Updated!','succ');await loadData();renderLeads()}
async function saveCommission(){const ag=v('mMag'),cl=v('mMcl'),am=v('mMam');if(!ag||!cl||!am){toast('Fill required fields','err');return}
const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('comm'),agent_id:ag,agency_id:aId,client_name:cl,product_type:v('mMpr'),carrier:v('mMca'),commission_amount:parseFloat(am),commission_type:v('mMty'),status:v('mMst'),pay_date:v('mMdt')};
const{error}=await sb.from('commissions').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast('Commission logged!','succ');await loadData();renderCommissions()}
async function saveActivity(){const s=v('mAS');if(!s){toast('Enter a subject','err');return}
const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
const d={id:uid('act'),agent_id:currentUser.id,agency_id:aId,client_id:v('mACl')||null,type:v('mAT'),subject:s,description:v('mADe'),priority:v('mAPr'),due_date:v('mADt'),status:v('mASt')};
const{error}=await sb.from('activities').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast('Activity created!','succ');await loadData();renderActivities()}
async function updateActivity(id){const{error}=await sb.from('activities').update({subject:v('mAS'),type:v('mAT'),client_id:v('mACl')||null,priority:v('mAPr'),due_date:v('mADt'),status:v('mASt'),description:v('mADe'),completed_date:v('mASt')==='completed'?new Date().toISOString():null}).eq('id',id);
if(error){toast(error.message,'err');return}closeModal();toast('Updated!','succ');await loadData();renderActivities()}
async function saveAgency(){const n=v('mAgN');if(!n){toast('Enter agency name','err');return}
const d={id:uid('agency'),name:n,phone:v('mAgP'),email:v('mAgE'),website:v('mAgW'),primary_color:v('mAgC'),address:v('mAgAd')};
const{error}=await sb.from('agencies').insert(d);if(error){toast(error.message,'err');return}
closeModal();toast(n+' created!','succ');await loadAgencies();renderAgencies();
const sw=document.getElementById('agencySwitcher');if(sw)sw.innerHTML='<option value="all">All agencies</option>'+agenciesData.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
// ─── CSV IMPORT ───
let importType='',importData=[];
function startImport(type){importType=type;importData=[];document.getElementById('importArea').style.display='block';document.getElementById('importLabel').textContent='Drop '+type+' CSV here or click';document.getElementById('importPreview').innerHTML='';document.getElementById('importActions').style.display='none'}
function handleCSV(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=function(ev){
const lines=ev.target.result.split('\n').filter(l=>l.trim());if(lines.length<2){toast('CSV appears empty','err');return}
const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
importData=lines.slice(1).map(line=>{const vals=line.match(/(".*?"|[^,]*)/g)||[];const row={};headers.forEach((h,i)=>{row[h]=vals[i]?vals[i].trim().replace(/^"|"$/g,''):''});return row});
let preview='<div style="max-height:200px;overflow:auto;margin-bottom:12px"><table style="font-size:0.72rem"><thead><tr>'+headers.map(h=>'<th style="padding:6px 8px;background:var(--navy);color:white">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>';
importData.slice(0,5).forEach(row=>{preview+='<tr>'+headers.map(h=>'<td style="padding:4px 8px;border:1px solid var(--border)">'+esc(row[h]||'')+'</td>').join('')+'</tr>'});
preview+='</tbody></table></div>';
preview+='<p style="font-size:0.78rem;color:var(--text-s)">Showing first 5 of '+importData.length+' records</p>';
document.getElementById('importPreview').innerHTML=preview;
document.getElementById('importBtn').textContent='Import '+importData.length+' records';
document.getElementById('importActions').style.display='block'};reader.readAsText(file)}
async function executeImport(){if(!importData.length){toast('No data to import','err');return}
const aId=viewAgencyId==='all'?'agency_our365':viewAgencyId;
let count=0;
if(importType==='clients'){for(const row of importData){
const d={id:uid('client'),agency_id:aId,first_name:row['First Name']||row['first_name']||row['Name']||'',last_name:row['Last Name']||row['last_name']||'',email:row['Email']||row['email']||'',phone:row['Home Phone']||row['Cell Phone']||row['Phone']||row['phone']||'',address:(row['Street']||'')+(row['City, State Zip']?' '+row['City, State Zip']:''),dob:row['Date of Birth']||row['dob']||'',status:row['Status']||row['status']||'Not Contacted Yet',type:row['Type']||row['type']||'Client',lead_source:row['Lead Source']||row['lead_source']||'',product_interest:row['Product Interest']||row['Policy Coverage Type']||'',notes:''};
if(!d.first_name&&!d.last_name)continue;
const{error}=await sb.from('clients').insert(d);if(!error)count++}}
if(importType==='agents'){for(const row of importData){
const d={id:uid('agent'),agency_id:aId,agent_number:'A365-'+String(count+1).padStart(4,'0'),email:row['Email']||row['email']||'',first_name:row['First Name']||row['Name']?.split(',')[1]?.trim()||'',last_name:row['Last Name']||row['Name']?.split(',')[0]?.trim()||'',phone:row['Business Phone']||row['Phone']||row['phone']||'',role:'agent',agent_role:'agent',status:row['Status']||row['status']||'Not Contacted'};
if(!d.first_name&&!d.last_name)continue;
const{error}=await sb.from('agents').insert(d);if(!error)count++}}
if(importType==='policies'){for(const row of importData){
const d={id:uid('policy'),agency_id:aId,policy_number:row['Policy Number']||row['policy_number']||'',product_type:row['Coverage Type']||row['Product']||row['product_type']||'',carrier:row['Carrier']||row['carrier']||'',premium_amount:parseFloat(row['Premium']||row['premium_amount'])||null,premium_frequency:row['Pay Frequency']||'mo',status:row['Status']||row['status']||'Pending',effective_date:row['Effective Date']||row['effective_date']||'',notes:row['Notes']||''};
const{error}=await sb.from('policies').insert(d);if(!error)count++}}
toast(count+' records imported!','succ');importData=[];
document.getElementById('importArea').style.display='none';
await loadData();nav('dashboard')}
