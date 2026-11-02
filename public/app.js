function hopeai(){
 const messages=Array.isArray(s.aiMessages)?s.aiMessages:[];
 return `<section class="ai-heading"><div><div class="eyebrow">YOUR CREATIVE & THINKING PARTNER</div><h1>HopeAI</h1><p>A general-purpose assistant for ideas, code, learning, planning and everyday questions.</p></div><span class="pill">Provider connection: server-side</span></section>
 <div class="ai-layout"><aside class="ai-aside card"><div class="ai-avatar">✦</div><h3>Welcome to HopeAI</h3><p>Ask naturally. Explore an idea. Get help untangling a problem or building something new.</p><h3>Try asking</h3><div class="prompt-list"><button class="prompt-chip" data-prompt="Help me plan the next useful feature for the Crypto Bazaar.">Build the Bazaar</button><button class="prompt-chip" data-prompt="Teach me a practical Web3 concept with an example.">Learn Web3</button><button class="prompt-chip" data-prompt="Help me debug a JavaScript problem.">Debug code</button><button class="prompt-chip" data-prompt="Help me organize my day into a few manageable steps.">Plan my day</button></div><button id="ai-clear" class="btn">Clear conversation</button></aside>
 <section class="ai-chat card"><div class="chat-top"><div><strong>HopeAI Assistant</strong><small>General AI chat · private browser history</small></div><span class="online-dot">● Connection on demand</span></div>
 <div id="ai-messages" class="ai-messages" aria-live="polite">${messages.length?messages.map(m=>`<article class="chat-message ${m.role==='user'?'from-user':'from-ai'}"><span>${m.role==='user'?'YOU':'HOPEAI'}</span><p>${e(m.content)}</p></article>`).join(''):'<div class="ai-welcome"><div class="welcome-star">✦</div><h2>What’s on your mind?</h2><p>Ask me anything. I’ll be clear about what I know and what I can’t do.</p></div>'}</div>
 <div id="ai-status" class="ai-status" role="status">Messages are saved only in this browser. An AI provider must be configured by the operator before replies can be generated.</div>
 <form id="ai-form" class="ai-compose"><textarea id="ai-input" maxlength="8000" rows="2" placeholder="Message HopeAI…" aria-label="Message HopeAI" required></textarea><button id="ai-send" class="btn primary" type="submit">Send ↑</button></form><small class="chat-disclaimer">HopeAI can make mistakes. Don’t enter passwords, seed phrases or private keys.</small>
 </section></div>`;
}
import { enhanceWorkspaces } from "./workspaces-ui.mjs";
import { normalizeLocalPosts, createLocalPost, editLocalPost, deleteLocalPost, toggleLocalLike, addLocalReply, deleteLocalReply } from "./social.mjs";
import { createHopePlan } from "./workflows.mjs";
import { STUDY_QUESTIONS, scoreStudyCheck, recordStudyAttempt, studyProgress } from "./education.mjs";
import { renderLaunchpad, bindLaunchpad } from "./launchpad-ui.mjs";
import { renderRealtimeChatSection, bindRealtimeChat, renderServicePaymentSection, bindServicePayments } from "./realtime-chat-ui.mjs";
import { renderTokenDeployment, bindTokenDeployment } from "./token-deploy-ui.mjs";
const A=[['overview','Overview'],['hopeai','HopeAI'],['impact','HopeAI Impact'],['social','Social'],['market','Marketplace'],['games','Games'],['edu','Education'],['crypto','Wallet / Crypto'],['launchpad','CryptoChat Launchpad'],['security','Security'],['ops','Release Ops']];
const K='sky4-beta-v3',D=()=>({hope:[],aiMessages:[],impact:[],studyHistory:[],posts:[],cart:[],game:1000,watch:[],testnetDeployments:[],launchpad:{tokens:[],offerings:[],messages:[]},listings:[{id:'1',title:'Creator icon pack',price:9,desc:'Original digital icon set.'},{id:'2',title:'Study planner',price:4,desc:'Printable study planner.'}]});
let s=(()=>{try{return {...D(),...JSON.parse(localStorage.getItem(K)||'{}')}}catch{return D()}})();
let latestStudyResult = null;
const save=()=>localStorage.setItem(K,JSON.stringify(s)),e=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])),uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,p=()=>location.hash.slice(2)||'overview',go=x=>location.hash=`#/${x}`;
const bad=/\b(fentanyl|heroin|cocaine|meth|lsd|mdma|ecstasy|oxycodone|hydrocodone|xanax|adderall|gun|firearm|ammo|silencer|explosive|stolen\s+(account|card|credential|goods?)|cvv|fullz|malware|ransomware|spyware|keylogger|botnet|fake\s+id|counterfeit\s+currency)\b/i;
const hero=(k,t,d)=>`<section class=\"hero-card\"><div class=\"eyebrow\">${k}</div><h1 style=\"font-size:clamp(34px,5vw,56px)\">${t}</h1><p>${d}</p></section>`;
function shell(c){let q=p(),n=A.map(([i,l])=>`<button data-r="${i}" class="${q===i?'active':''}">${l}</button>`).join('');return `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">SK</div><div>SKYCOIN4444<small>THE CRYPTO BAZAAR</small></div></div><div class="sidebar-label">EXPLORE</div><nav class="nav">${n}</nav><div class="sidebar-footer"><span class="footer-mark">✦</span><strong>Build your world.</strong><br>One connected digital destination.<small>Engineering beta · no paid services enabled</small></div></aside><div class="main"><header class="topbar"><div class="topbar-title"><span class="mobile-brand">SK✦</span><strong>${A.find(x=>x[0]===q)?.[1]||'Crypto Bazaar'}</strong></div><div class="topbar-right"><span class="badge">BETA PREVIEW</span><button class="topbar-avatar" data-r="hopeai" aria-label="Open HopeAI">✦</button></div></header><main id="main" class="content">${c}</main></div><nav class="mobile-nav">${n}</nav></div>`}function overview(){
 const districts=[
  ['hopeai','✦','HopeAI','Your AI companion','Ask, create, plan and learn','LIVE CHAT · PROVIDER REQUIRED'],
  ['social','◎','Social District','People & communities','Share ideas and find your corner','LOCAL BETA'],
  ['market','▦','Creator Market','Discover & collect','Digital goods, creator listings and carts','LOCAL BETA'],
  ['games','◈','Arcade','Play something','Quick games and skill challenges','DEMO CREDITS'],
  ['edu','⌘','SkySchool','Learn by doing','Web3, security and practical skills','PRACTICE'],
  ['crypto','₿','Trading Floor','Markets & portfolio','Watch-only assets and research tools','WATCH-ONLY'],
  ['launchpad','◇','CryptoChat','Build & connect','Community rooms and testnet tools','TESTNET / BETA'],
  ['impact','♡','Hope & Impact','Make a difference','Organize ideas and volunteer plans','PLANNING']
 ];
 return `<section class="bazaar-hero">
  <div class="bazaar-copy"><div class="eyebrow">WELCOME TO THE DIGITAL CITY</div>
   <h1>One world.<br><span>Infinite possibilities.</span></h1>
   <p>Explore the Crypto Bazaar — a connected place to create, discover, learn, play and build with Web3.</p>
   <div class="actions"><button class="btn primary" data-r="hopeai">Talk to HopeAI</button><button class="btn" data-r="market">Explore the market</button></div>
   <div class="hero-foot"><span>✦ Creator-first</span><span>◈ Community-powered</span><span>⌁ Built to explore</span></div>
  </div>
  <div class="bazaar-orbit" aria-label="Crypto Bazaar districts illustration"><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-core">SK<span>4444</span></div><b class="orbit-node node-a">AI</b><b class="orbit-node node-b">WEB3</b><b class="orbit-node node-c">PLAY</b><b class="orbit-node node-d">CREATE</b></div>
 </section>
 <section class="section-head"><div><div class="eyebrow">THE DISTRICTS</div><h2>Find your next thing.</h2></div><span class="pill">8 destinations · one Bazaar</span></section>
 <section class="district-grid">${districts.map(([id,icon,title,sub,desc,status])=>`<button class="district-card" data-r="${id}"><span class="district-icon">${icon}</span><span class="district-status">${status}</span><strong>${title}</strong><span class="district-sub">${sub}</span><small>${desc}</small><span class="district-arrow">↗</span></button>`).join('')}</section>
 <section class="bazaar-bottom"><div><div class="eyebrow">YOUR SPACE, YOUR PACE</div><h2>Make something. Meet people. Keep exploring.</h2><p>Start with a conversation, a game, a lesson or a creator listing. Your local beta activity stays on this device.</p></div><button class="btn primary" data-r="hopeai">Open HopeAI →</button></section>
 <div class="notice info">Engineering beta: social posts, listings, carts and game credits are local demos. HopeAI requires a configured server-side provider. Crypto tools are watch-only; no real-money gambling or trading execution.</div>`;
}
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
function market(){
 const cartItems=s.cart.map(id=>s.listings.find(item=>item.id===id)).filter(Boolean);
 const total=cartItems.reduce((sum,item)=>sum+Math.max(0,Number(item.price)||0),0);
 const categories=[...new Set(s.listings.map(item=>item.category||'Digital goods'))].sort();
 return `${hero('Creator marketplace','Discover. Collect. Build your storefront.','A curated local marketplace for lawful digital goods and creator products. Checkout is intentionally disabled in this beta.')}
 <div class="notice danger">Restricted goods and services are blocked. No payments, escrow, shipping, seller verification or crypto settlement are enabled.</div>
 <section class="grid two">
 <form id="listing" class="card"><h2>Publish a listing</h2><label>Product title<input id="lt" maxlength="120" required placeholder="What are you offering?"></label><label>Category<select id="lc"><option>Digital goods</option><option>Art & design</option><option>Education</option><option>Software</option><option>Collectibles</option><option>Services</option></select></label><label>Price USD<input id="lp" type="number" min="0" max="100000" step=".01" required></label><label>Description<textarea id="ld" maxlength="2000" required placeholder="Describe the product clearly…"></textarea></label><button class="btn primary">Review & publish locally</button><p class="muted">Listings are visible only in this browser.</p></form>
 <div class="card"><div class="item-row"><h2>Your cart</h2><span class="pill">${cartItems.length} items</span></div>
 ${cartItems.length?cartItems.map((item,index)=>`<div class="item item-row"><div><strong>${e(item.title)}</strong><p>$${Number(item.price).toFixed(2)}</p></div><button class="btn danger" data-cart-remove="${index}">Remove</button></div>`).join(''):'<div class="empty">Your cart is empty. Find something worth collecting.</div>'}
 <div class="item-row"><strong>Subtotal</strong><strong>$${total.toFixed(2)}</strong></div><p class="muted">Demo cart only — no charge or order is created.</p><button id="cc" class="btn" ${cartItems.length?'':'disabled'}>Clear cart</button></div></section>
 <section class="section-head"><div><div class="eyebrow">THE BAZAAR</div><h2>Explore creator goods</h2></div><span class="pill">${s.listings.length} local listings</span></section>
 <div class="market-toolbar"><label class="market-search">Search listings<input id="market-search" type="search" placeholder="Try art, planner, software…"></label><label>Category<select id="market-category"><option value="all">All categories</option>${categories.map(category=>`<option value="${e(category)}">${e(category)}</option>`).join('')}</select></label><label>Sort<select id="market-sort"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="az">Name: A to Z</option></select></label></div>
 <section id="market-results" class="grid market-results" aria-live="polite">${s.listings.map(item=>marketCard(item)).join('')}</section>`;
}
function marketCard(item){return `<article class="card market-card"><div class="market-card-top"><span class="pill">${e(item.category||'Digital goods')}</span><span class="muted">LOCAL</span></div><h3>${e(item.title)}</h3><p>${e(item.desc)}</p><div class="item-row"><strong class="market-price">$ ${Number(item.price).toFixed(2)}</strong><button class="btn primary" data-cart="${e(item.id)}">Add to cart</button></div></article>`}
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
 if(q==='hopeai'){
   const form=$('ai-form'),input=$('ai-input'),messages=$('ai-messages'),status=$('ai-status'),send=$('ai-send');
   const draw=()=>{messages.innerHTML=s.aiMessages.length?s.aiMessages.map(m=>`<article class="chat-message ${m.role==='user'?'from-user':'from-ai'}"><span>${m.role==='user'?'YOU':'HOPEAI'}</span><p>${e(m.content)}</p></article>`).join(''):'<div class="ai-welcome"><div class="welcome-star">✦</div><h2>What’s on your mind?</h2><p>Ask me anything. I’ll be clear about what I know and what I can’t do.</p></div>';messages.scrollTop=messages.scrollHeight};
   form.onsubmit=async event=>{
     event.preventDefault();const text=input.value.trim();if(!text)return;
     s.aiMessages=Array.isArray(s.aiMessages)?s.aiMessages:[];s.aiMessages.push({role:'user',content:text});s.aiMessages=s.aiMessages.slice(-24);save();input.value='';draw();send.disabled=true;send.textContent='…';status.textContent='Connecting to HopeAI…';
     try{
       const response=await fetch('/api/hopeai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:s.aiMessages.slice(-24)})});
       const data=await response.json();
       if(!response.ok)throw new Error(data.message||'HopeAI is temporarily unavailable.');
       s.aiMessages.push({role:'assistant',content:data.message});s.aiMessages=s.aiMessages.slice(-24);save();status.textContent='Reply received from configured AI provider.';
     }catch(error){status.textContent=error.message||'Could not connect to HopeAI.'}
     finally{send.disabled=false;send.textContent='Send ↑';draw();input.focus()}
   };
   document.querySelectorAll('[data-prompt]').forEach(button=>button.onclick=()=>{input.value=button.dataset.prompt;input.focus()});
   $('ai-clear').onclick=()=>{if(confirm('Clear this browser’s HopeAI conversation?')){s.aiMessages=[];save();status.textContent='Conversation cleared from this browser.';draw()}};
   draw();
 }
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
 if(q==='market'){
  const results=$('market-results');
  const updateResults=()=>{
    const query=$('market-search').value.trim().toLowerCase(),category=$('market-category').value,sort=$('market-sort').value;
    let items=s.listings.filter(item=>(category==='all'||(item.category||'Digital goods')===category)&&(!query||`${item.title} ${item.desc} ${item.category||''}`.toLowerCase().includes(query)));
    if(sort==='low')items.sort((a,b)=>Number(a.price)-Number(b.price));
    if(sort==='high')items.sort((a,b)=>Number(b.price)-Number(a.price));
    if(sort==='az')items.sort((a,b)=>a.title.localeCompare(b.title));
    results.innerHTML=items.length?items.map(marketCard).join(''):'<div class="empty">No listings match. Try another search or category.</div>';
  };
  $('listing').onsubmit=event=>{
    event.preventDefault();const title=$('lt').value.trim(),desc=$('ld').value.trim(),price=Number($('lp').value),category=$('lc').value;
    if(!title||bad.test(`${title}\n${desc}`))return alert('Listing blocked by restricted-item filter.');
    if(!Number.isFinite(price)||price<0||price>100000)return alert('Enter a valid price.');
    if(s.listings.length>=100)return alert('Local beta limit: 100 listings.');
    s.listings.push({id:uid(),title,price,desc,category});save();render();
  };
  $('market-search').oninput=updateResults;$('market-category').onchange=updateResults;$('market-sort').onchange=updateResults;
  results.onclick=event=>{const button=event.target.closest('[data-cart]');if(!button)return;const item=s.listings.find(x=>x.id===button.dataset.cart);if(!item)return;if(s.cart.length>=50)return alert('Cart limit reached.');s.cart.push(item.id);save();render()};
  document.querySelectorAll('[data-cart-remove]').forEach(button=>button.onclick=()=>{s.cart.splice(Number(button.dataset.cartRemove),1);save();render()});
  $('cc').onclick=()=>{s.cart=[];save();render()};
 }
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
