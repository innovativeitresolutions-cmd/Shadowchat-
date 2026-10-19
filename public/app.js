import { enhanceWorkspaces } from "./workspaces-ui.mjs";
import { normalizeLocalPosts, createLocalPost, editLocalPost, deleteLocalPost, toggleLocalLike, addLocalReply, deleteLocalReply } from "./social.mjs";
import { createHopePlan } from "./workflows.mjs";
import { STUDY_QUESTIONS, scoreStudyCheck, recordStudyAttempt, studyProgress } from "./education.mjs";
import { renderLaunchpad, bindLaunchpad } from "./launchpad-ui.mjs";
import { renderRealtimeChatSection, bindRealtimeChat, renderServicePaymentSection, bindServicePayments } from "./realtime-chat-ui.mjs";
import { renderTokenDeployment, bindTokenDeployment } from "./token-deploy-ui.mjs";
const A=[['overview','Overview'],['hopeai','HopeAI'],['impact','HopeAI Impact'],['social','Social'],['market','Marketplace'],['games','Games'],['edu','Education'],['crypto','Wallet / Crypto'],['launchpad','CryptoChat Launchpad'],['security','Security'],['ops','Release Ops']];
const K='sky4-beta-v3',D=()=>({hope:[],impact:[],studyHistory:[],posts:[],cart:[],game:1000,watch:[],testnetDeployments:[],launchpad:{tokens:[],offerings:[],messages:[]},listings:[{id:'1',title:'Creator icon pack',price:9,desc:'Original digital icon set.'},{id:'2',title:'Study planner',price:4,desc:'Printable study planner.'}]});
let s=(()=>{try{return {...D(),...JSON.parse(localStorage.getItem(K)||'{}')}}catch{return D()}})();
let latestStudyResult = null;
const save=()=>localStorage.setItem(K,JSON.stringify(s)),e=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])),uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,p=()=>location.hash.slice(2)||'overview',go=x=>location.hash=`#/${x}`;
const bad=/\b(fentanyl|heroin|cocaine|meth|lsd|mdma|ecstasy|oxycodone|hydrocodone|xanax|adderall|gun|firearm|ammo|silencer|explosive|stolen\s+(account|card|credential|goods?)|cvv|fullz|malware|ransomware|spyware|keylogger|botnet|fake\s+id|counterfeit\s+currency)\b/i;
const hero=(k,t,d)=>`<section class=\"hero-card\"><div class=\"eyebrow\">${k}</div><h1 style=\"font-size:clamp(34px,5vw,56px)\">${t}</h1><p>${d}</p></section>`;
function shell(c){let q=p(),n=A.map(([i,l])=>`<button data-r=\"${i}\" class=\"${q===i?'active':''}\">${l}</button>`).join('');return `<div class=\"shell\"><aside class=\"sidebar\"><div class=\"brand\"><div class=\"brand-mark\">SK</div><div>SKYCOIN4444<small>ShadowChat · engineering beta</small></div></div><nav class=\"nav\">${n}</nav><div class=\"sidebar-footer\">HopeAI is the single public Hope brand.<br>External actions fail closed.</div></aside><div class=\"main\"><header class=\"topbar\"><strong>${A.find(x=>x[0]===q)?.[1]||'Overview'}</strong><span class=\"badge\">Engineering beta</span></header><main id=\"main\" class=\"content\">${c}</main></div><nav class=\"mobile-nav\">${n}</nav></div>`}
function overview(){let x=[['hopeai','HopeAI','Local planner; provider unavailable by default.'],['impact','HopeAI Impact','Planning only; no donation execution.'],['social','Social','Local feed with honest delivery state.'],['market','Marketplace','Lawful listings and restricted-item blocking.'],['games','Games','Demo credits only; no real-money value.'],['edu','Education','Skill checks; no accreditation.'],['crypto','Wallet / Crypto','Watch-only; no private keys or signing.'],['launchpad','CryptoChat Launchpad','Local token blueprints, ICO/IPO drafts and discussion; no token sale or deployment.'],['security','Security','Privacy controls and fail-closed boundaries.'],['ops','Release Ops','Health plus unresolved hosted gates.']];return `${hero('Quality first','One coherent ecosystem.','Usable flagship journeys, responsive navigation, deterministic tests and truthful degraded states.')}<div class=\"notice\">No production, payment, custody, charity verification, regulated gambling, accreditation, identity verification or compliance certification claim.</div><section class=\"grid\">${x.map(([i,n,d])=>`<article class=\"card clickable\" tabindex=\"0\" data-r=\"${i}\"><span class=\"pill\">${i}</span><h3>${n}</h3><p>${d}</p></article>`).join('')}</section>`}
function hopeai(){return `${hero('Priority 1','HopeAI','Private-first planning. No external model is represented as connected.')}<div class=\"notice info\">Build plan uses deterministic local steps and stores drafts only in this browser.</div><form id=\"hope\" class=\"card\"><label>Goal<textarea id=\"hopeText\" maxlength=\"500\" required></textarea></label><button class=\"btn primary\">Build local plan</button></form><section class=\"card\"><h2>Plans</h2>${s.hope.length?s.hope.map(x=>`<div class=\"item\"><strong>${e(x.t)}</strong><ol>${x.steps.map(y=>`<li>${e(y)}</li>`).join('')}</ol></div>`).join(''):'<div class=\"empty\">No plans yet.</div>'}</section>`}
function impact(){return `${hero('HopeAI Impact','Plan impact truthfully.','Campaign goals and pledge intent are planning metadata only.')}<div class=\"notice\">No donation, settlement, receipt, charity verification or tax determination occurs.</div><form id=\"impact\" class=\"card\"><label>Title<input id=\"it\" required maxlength=\"120\"></label><label>Goal<textarea id=\"ig\" required maxlength=\"500\"></textarea></label><label>Pledge intent USD<input id=\"ip\" type=\"number\" min=\"0\" value=\"0\"></label><button class=\"btn primary\">Save plan</button></form><section class=\"card\">${s.impact.length?s.impact.map(x=>`<div class=\"item\"><strong>${e(x.t)}</strong><p>${e(x.g)}</p><span class=\"pill\">$${x.p} intent · money moved: no</span></div>`).join(''):'<div class=\"empty\">No impact plans.</div>'}</section>`}
function social(){
  s.posts=normalizeLocalPosts(s.posts);
  const items=s.posts.map(post=>{
    const replies=post.replies.length
      ? '<ul class="social-replies">'+post.replies.map(reply=>
        '<li><div class="social-reply"><p>'+e(reply.text)+'</p>'+
        '<button class="btn danger" type="button" data-social-reply-delete="'+e(post.id)+'" data-reply-id="'+e(reply.id)+'" aria-label="Remove this local reply">Remove</button></div></li>'
      ).join('')+'</ul>'
      : '<p class="muted">No local replies.</p>';
    return '<article class="item social-post" data-post="'+e(post.id)+'">'+
      '<div class="item-row"><span class="pill">Local draft · only you</span><span class="muted">'+
      e(post.createdAt ? post.createdAt.slice(0,10) : 'Saved before upgrade')+'</span></div>'+
      '<p class="social-post-text">'+e(post.text)+'</p>'+
      '<div class="social-actions"><button type="button" class="btn" data-social-like="'+e(post.id)+'" aria-pressed="'+post.likedByMe+'">'+
      (post.likedByMe?'♥ Remove my reaction':'♡ React locally')+'</button>'+
      '<button type="button" class="btn" data-social-edit-open="'+e(post.id)+'">Edit</button>'+
      '<button type="button" class="btn danger" data-social-delete="'+e(post.id)+'">Delete</button></div>'+
      '<form class="social-edit-form" data-social-edit="'+e(post.id)+'" hidden>'+
      '<label>Edit this local post<textarea name="edit" maxlength="500" required>'+e(post.text)+'</textarea></label>'+
      '<div class="social-actions"><button class="btn primary" type="submit">Save edit</button>'+
      '<button class="btn" type="button" data-social-edit-cancel="'+e(post.id)+'">Cancel</button></div></form>'+
      '<div class="social-thread"><h3>Replies · '+post.replies.length+' local</h3>'+replies+
      '<form data-social-reply="'+e(post.id)+'" class="social-reply-form">'+
      '<label>Write a local reply<textarea name="reply" maxlength="280" required></textarea></label>'+
      '<button type="submit" class="btn">Add reply</button></form></div></article>';
  }).join('');
  return hero('ShadowChat','Your private local feed.',
    'Write, edit and delete posts, react privately, and build local reply threads.')+
    '<div class="notice info">Browser-only: no remote delivery, verified profiles, public audience, external moderation or notifications.</div>'+
    '<form id="post" class="card social-compose"><label>New local post<textarea id="pb" maxlength="500" required></textarea></label>'+
    '<button type="submit" class="btn primary">Save on this device</button><p class="muted">Maximum 100 local posts, 20 replies per post. Everything stays in this browser.</p>'+
    '<p class="bad" role="alert" id="social-error" hidden></p></form>'+
    '<section id="socialFeed" class="card social-feed"><h2>My local feed</h2>'+
    (items || '<div class="empty">No posts yet. Create your first private local draft.</div>')+'</section>';
}
function market(){return `${hero('Lawful marketplace','Trust and safety before settlement.','Search/listing/cart UI is local. Payments, escrow, seller verification and crypto settlement are disabled.')}<div class=\"notice danger\">Controlled substances, weapons, stolen credentials/goods, malware, forged IDs and counterfeit currency are blocked.</div><section class=\"grid two\"><form id=\"listing\" class=\"card\"><label>Title<input id=\"lt\" required></label><label>Price USD<input id=\"lp\" type=\"number\" min=\"0\" step=\".01\" required></label><label>Description<textarea id=\"ld\" required></textarea></label><button class=\"btn primary\">Moderate & publish</button></form><div class=\"card\"><h2>Cart</h2><div class=\"kpi\">${s.cart.length}</div><p>No charge, transfer, escrow, shipment or payout occurs.</p><button id=\"cc\" class=\"btn\">Clear cart</button></div></section><section class=\"grid\">${s.listings.map(x=>`<article class=\"card\"><h3>${e(x.title)}</h3><p>${e(x.desc)}</p><strong>$${Number(x.price).toFixed(2)}</strong><div class=\"actions\"><button class=\"btn\" data-cart=\"${x.id}\">Add</button></div></article>`).join('')}</section>`}
function games(){return `${hero('Games','Playable demo, no real-money value.','Credits are local and non-redeemable. No deposits, withdrawals, custody, prizes or regulated wagering.')}<section class=\"grid two\"><div class=\"card\"><div class=\"kpi\">${s.game}</div><p>demo credits</p><label>Stake<input id=\"stake\" type=\"number\" min=\"1\" max=\"100\" value=\"10\"></label><div class=\"actions\"><button class=\"btn primary\" data-g=\"low\">Low</button><button class=\"btn primary\" data-g=\"high\">High</button></div></div><div class=\"card\"><p>Each click uses a local deterministic-style demo roll. It is not represented as cryptographic randomness.</p></div></section>`}
function edu(){
  const progress=studyProgress(s.studyHistory);
  const result=latestStudyResult;
  const questions=STUDY_QUESTIONS.map((q,index)=>
    '<fieldset class="item"><legend><strong>'+(index+1)+'. '+e(q.prompt)+
    '</strong></legend>'+q.choices.map(option=>
      '<label><input type="radio" style="width:auto" name="'+e(q.id)+
      '" value="'+e(option.id)+'"> '+e(option.text)+'</label>'
    ).join('')+'</fieldset>'
  ).join('');
  const feedback=result
    ? '<section class="card" aria-live="polite"><h2>Latest practice feedback</h2><p role="status"><strong>'+
      result.correct+'/'+result.total+' · '+result.percent+
      '%</strong> · For practice only</p><div class="stack">'+
      result.results.map(entry=>
        '<div class="item"><strong class="'+(entry.correct?'good':'bad')+'">'+
        (entry.correct?'Correct':'Review')+': '+e(entry.topic)+
        '</strong><p>'+e(entry.prompt)+'</p><p>'+e(entry.explanation)+'</p></div>'
      ).join('')+'</div>'+
      (result.missedTopics.length
        ? '<button class="btn primary" id="edu-hope">Create HopeAI plan for weak topics</button>'
        : '<p class="good">All topics correct in this practice check.</p>')+'</section>'
    : '';
  const focus=progress.focusTopics.length
    ? progress.focusTopics.map(t=>e(t)).join(', ') : 'No missed topics recorded';
  return hero('Education','SkySchool practice & progress.',
    'Eight security, wallet, blockchain and privacy questions. Local study aid; no accreditation or credential.')+
    '<div class="notice info">Results stay on this device only. Do not enter passwords or personal secrets.</div>'+
    '<section class="card"><h2>Study progress</h2><p>Attempts: '+progress.attempts+
    ' · Latest: '+(progress.recentPercent===null?'—':progress.recentPercent+'%')+
    ' · Best: '+(progress.bestPercent===null?'—':progress.bestPercent+'%')+
    '</p><p>Topics to revisit: '+focus+'</p></section>'+
    '<form id="quiz" class="card"><h2>Security & Web3 practice check</h2>'+
    questions+'<button type="submit" class="btn primary">Score practice check</button></form>'+
    feedback;
}
function cryptoPage(){return `${hero('Crypto boundary','Wallet / Crypto is watch-only.','No seed phrases, private keys, signing, broadcasting, swaps, staking, mining, NFT minting, custody or token deployment.')}<div class=\"notice\">Legacy source uses both SKY4 and SKY444 with conflicting economic constants; this repo makes no canonical live-token supply, price, yield or liquidity claim.</div><form id=\"watch\" class=\"card\"><label>Network<select id=\"wc\"><option>ethereum</option><option>polygon</option><option>base</option><option>bsc</option><option>solana</option></select></label><label>Public address<input id=\"wa\" required></label><button class=\"btn primary\">Add watch-only</button></form><section class=\"card\">${s.watch.length?s.watch.map(x=>`<div class=\"item\"><strong>${e(x.c)}</strong><p><code>${e(x.a)}</code></p></div>`).join(''):'<div class=\"empty\">No public addresses saved.</div>'}</section>`}
function security(){return `${hero('Security','Fail closed and minimize secrets.','Server security headers plus browser-local data controls; not a security or compliance certification.')}<section class=\"grid two\"><div class=\"card\"><h2>Local data</h2><button id=\"export\" class=\"btn\">Export JSON</button> <button id=\"wipe\" class=\"btn danger\">Clear beta data</button></div><div class=\"card\"><h2>Not claimed</h2><p>Identity verification, KYC/AML completion, custody-grade key storage, certification, or production incident response.</p></div></section>`}
function ops(){return `${hero('Release Ops','Evidence first.','Local tests do not prove hosted persistence, backup/restore, load resilience, cross-system operation or deployed alerting.')}<section class=\"grid two\"><div class=\"card\"><h2>Runtime</h2><div id=\"health\" class=\"empty\">Not checked.</div><button id=\"hc\" class=\"btn primary\">Check /api/healthz</button></div><div class=\"card\"><h2>P1 gates</h2><p>Invited-session persistence: not evidenced</p><p>Backup/restore RPO/RTO: not evidenced</p><p>Dependency failures: partial</p><p>Cross-system integration: local only</p><p>Telemetry/alerting: not evidenced</p></div></section>`}
function render(){let q=p(),f={overview,hopeai,impact,social,market,games,edu,crypto:cryptoPage,launchpad:()=>renderLaunchpad(s)+renderTokenDeployment(s)+renderRealtimeChatSection()+renderServicePaymentSection(),security,ops}[q]||overview;document.querySelector('#app').innerHTML=shell(f());document.querySelectorAll('[data-r]').forEach(x=>x.onclick=()=>go(x.dataset.r));bind(q)}
function bind(q){
 const $=id=>document.getElementById(id);
 if(q==='hopeai')$('hope').onsubmit=x=>{x.preventDefault();let t=$('hopeText').value.trim();if(t){s.hope.push({t,steps:['Define a useful outcome.','List required information or tools.','Take one reversible action.','Review the result.']});save();render()}};
 if(q==='impact')$('impact').onsubmit=x=>{x.preventDefault();if($('it').value.trim()&&$('ig').value.trim()){s.impact.push({t:$('it').value.trim(),g:$('ig').value.trim(),p:Math.max(0,Number($('ip').value)||0),moneyMoved:false,charityVerified:false});save();render()}};
 if(q==='social'){
   const feed=$('socialFeed');
   const newId=()=>crypto.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
   function showSocialError(error){
     const display=$('social-error');
     display.hidden=false;
     display.textContent=error instanceof Error ? error.message : 'Unable to update local feed.';
   }
   function applySocial(operation){
     try { s.posts=operation(s.posts);save();render(); } catch(error) { showSocialError(error); }
   }
   $('post').onsubmit=event=>{
     event.preventDefault();
     applySocial(posts=>createLocalPost(posts,$('pb').value,newId(),new Date().toISOString()));
   };
   feed.onclick=event=>{
     const control=event.target.closest('button');
     if(!control)return;
     const data=control.dataset;
     if(data.socialEditOpen){
       const form=feed.querySelectorAll('[data-social-edit]');
       const target=[...form].find(item=>item.dataset.socialEdit===data.socialEditOpen);
       if(target){target.hidden=false;target.elements.namedItem('edit').focus();}
     }
     else if(data.socialEditCancel){
       const form=[...feed.querySelectorAll('[data-social-edit]')].find(item=>item.dataset.socialEdit===data.socialEditCancel);
       if(form)form.hidden=true;
     }
     else if(data.socialLike)applySocial(posts=>toggleLocalLike(posts,data.socialLike));
     else if(data.socialDelete && window.confirm('Delete this local post and its replies?'))
       applySocial(posts=>deleteLocalPost(posts,data.socialDelete));
     else if(data.socialReplyDelete)
       applySocial(posts=>deleteLocalReply(posts,data.socialReplyDelete,data.replyId));
   };
   feed.onsubmit=event=>{
     const form=event.target;
     if(!form.matches('form'))return;
     event.preventDefault();
     if(form.dataset.socialReply){
       applySocial(posts=>addLocalReply(posts,form.dataset.socialReply,
         form.elements.namedItem('reply').value,newId(),new Date().toISOString()));
     }else if(form.dataset.socialEdit){
       applySocial(posts=>editLocalPost(posts,form.dataset.socialEdit,
         form.elements.namedItem('edit').value));
     }
   };
 }
 if(q==='market'){$('listing').onsubmit=x=>{x.preventDefault();let t=$('lt').value.trim(),d=$('ld').value.trim(),v=Number($('lp').value);if(!t||bad.test(`${t}\n${d}`))return alert('Listing blocked by restricted-item filter.');if(Number.isFinite(v)&&v>=0){s.listings.push({id:uid(),title:t,price:v,desc:d});save();render()}};document.querySelectorAll('[data-cart]').forEach(x=>x.onclick=()=>{s.cart.push(x.dataset.cart);save();render()});$('cc').onclick=()=>{s.cart=[];save();render()}}
 if(q==='games')document.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{let n=Math.min(100,Math.max(1,Number($('stake').value)||10)),r=(Date.now()%100)+1,w=x.dataset.g==='high'?r>50:r<=50;s.game=Math.max(0,s.game+(w?n:-n));save();alert(`Roll ${r}: ${w?'win':'loss'} ${n} demo credits`);render()});
 if(q==='edu'){
   $('quiz').onsubmit=event=>{
     event.preventDefault();
     const answers=Object.fromEntries(new FormData($('quiz')).entries());
     latestStudyResult=scoreStudyCheck(answers);
     s.studyHistory=recordStudyAttempt(s.studyHistory,latestStudyResult);
     save();render();
   };
   if($('edu-hope'))$('edu-hope').onclick=()=>{
     if(!latestStudyResult?.missedTopics.length)return;
     s.hope=Array.isArray(s.hope)?s.hope:[];
     const topics=latestStudyResult.missedTopics.join(', ');
     s.hope.unshift(createHopePlan('Review SkySchool topics: '+topics,
       'learning',uid(),new Date().toISOString()));
     save();go('hopeai');
   };
 }
 if(q==='crypto')$('watch').onsubmit=x=>{x.preventDefault();let c=$('wc').value,a=$('wa').value.trim(),ok=['ethereum','polygon','base','bsc'].includes(c)?/^0x[a-fA-F0-9]{40}$/.test(a):/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);if(!ok)return alert('Invalid public-address format.');s.watch.push({c,a});save();render()};
 if(q==='security'){$('wipe').onclick=()=>{if(confirm('Clear browser-local beta data?')){localStorage.removeItem(K);s=D();render()}};$('export').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}));a.download='skycoin4444-local.json';a.click()}};
 if(q==='ops')$('hc').onclick=async()=>{let h=$('health');h.textContent='Checking…';try{let r=await fetch('/api/healthz'),d=await r.json();h.innerHTML=`<strong class=\"${r.ok?'good':'bad'}\">${e(d.status)}</strong><p>database: ${e(d.database)} · provider: ${e(d.providerConnectivity)} · production ready: ${e(d.productionReady)}</p>`}catch{h.innerHTML='<strong class=\"bad\">Health check failed</strong>'}};
 if(q==='launchpad') { bindLaunchpad({state:s,save,render,uid}); bindTokenDeployment({state:s,save,render}); bindRealtimeChat(); bindServicePayments(); }
 enhanceWorkspaces(q, {state:s, save, render, uid, go, escapeHtml:e});
}
addEventListener('hashchange',render);render();
