import {groundedProjectAnswer,validateProjectNotes} from "./trust.mjs";
/**
 * HopeAI Chat UI — real multi-turn language model running in a browser Worker.
 * No paid API or simulated response. Conversations are not persisted or uploaded.
 */
import {MAX_INPUT,resolveLocalModel,exportLocalTranscript} from "./local-ai-core.mjs";
const el = id => document.getElementById(id);
const start=el("local-ai-start"), stop=el("local-ai-stop");
const newChat=el("local-ai-new"), exportChat=el("local-ai-export"), better=el("local-ai-better");
const form=el("local-ai-form"), status=el("local-ai-status");
const messages=el("local-ai-messages"), prompt=el("local-ai-prompt"), submit=el("local-ai-send");
const modelPicker=el("local-ai-model"), modePicker=el("local-ai-mode"), gpu=el("local-ai-gpu");
const suggestions=el("local-ai-suggestions");
const projectNotes=el("local-ai-notes");
let worker=null,ready=false,busy=false,sequence=0,currentId=0;
let turns=[],pending=null,chosenModel="quick";
function setStatus(value){ status.textContent=String(value).slice(0,240); }
function scrollToLast(){messages.scrollTop=messages.scrollHeight;}
function append(role,text,label){
  const item=document.createElement("div");
  item.className="local-ai-message "+role;
  const header=document.createElement("strong");
  header.textContent=label||(role==="user"?"You":"HopeAI • "+resolveLocalModel(chosenModel).label);
  const body=document.createElement("div");
  body.textContent=text;
  item.append(header,body);messages.append(item);scrollToLast();
  return {item,body};
}
function updateControls(){
  start.hidden=Boolean(worker);
  start.disabled=Boolean(worker);
  stop.hidden=!worker;
  newChat.hidden=!ready;
  newChat.disabled=busy;
  exportChat.hidden=!ready;
  exportChat.disabled=turns.length===0||busy;
  better.hidden=!ready||chosenModel!=="quick";
  better.disabled=busy;
  modelPicker.disabled=Boolean(worker);
  gpu.disabled=Boolean(worker);
  modePicker.disabled=busy;
  form.hidden=!ready;
  submit.disabled=!ready||busy;
  prompt.disabled=!ready||busy;
  suggestions.hidden=!ready||turns.length>0;
}
function clearConversation(){
  turns=[];pending=null;messages.replaceChildren();
  if(ready)setStatus("Fresh chat ready. Your previous in-tab conversation is cleared.");
  updateControls();
}
function unload(){
  if(worker)worker.terminate();
  worker=null;ready=false;busy=false;pending=null;
  clearConversation();
  prompt.value="";projectNotes.value="";sequence++;currentId=sequence;
  setStatus("Model unloaded. In-tab chat cleared; downloaded model files may remain in browser cache.");
  updateControls();
}
function fail(message){
  const notice=String(message||"Unknown runtime error").slice(0,180);
  if(!ready){unload();setStatus("Could not load local AI: "+notice+" Try a laptop or use Wi-Fi and sufficient memory.");}
  else{
    if(pending){
      pending.assistant.item.remove(); // never show an unverified partial answer
      pending=null;
    }
    busy=false;updateControls();
    setStatus("Could not generate a reply: "+notice+" Try again, or unload and restart the model.");
    prompt.focus();
  }
}
function onWorkerMessage(instance,data){
  if(instance!==worker)return;
  if(data.type==="status"){
    // Discard stale callbacks from previous requests or cancelled sessions.
    if(data.id===currentId)setStatus(data.message);
    return;
  }
  if(data.id!==currentId)return;
  if(data.type==="ready"){
    ready=true;busy=false;updateControls();
    setStatus("Ready: real "+resolveLocalModel(chosenModel).label+" model loaded. Ask anything.");
    prompt.focus();
  }else if(data.type==="delta"){
    if(!pending||!busy)return;
    const part=typeof data.text==="string"?data.text:"";
    if(!part)return;
    pending.partial=(pending.partial+part).slice(0,4000);
    pending.assistant.body.textContent=pending.partial;
    scrollToLast();
  }else if(data.type==="reply"){
    if(!pending||!busy)return;
    const answer=typeof data.text==="string"?data.text.trim():"";
    if(!answer){fail("Model generated an empty answer.");return;}
    pending.assistant.body.textContent=answer;
    turns.push({role:"user",content:pending.question},
      {role:"assistant",content:answer});
    pending=null;busy=false;
    prompt.value="";updateControls();scrollToLast();
    setStatus("Response generated entirely on your device. Check important facts.");
    prompt.focus();
  }else if(data.type==="error"){
    fail(data.description);
  }
}
start.addEventListener("click",()=>{
  if(worker)return;
  chosenModel=modelPicker.value;
  try{resolveLocalModel(chosenModel);}catch{setStatus("Choose a supported model.");return;}
  let instance;
  try{instance=new Worker("/local-ai-worker.mjs",{
    type:"module",name:"hopeai-real-local-chat"
  });}
  catch{setStatus("This browser does not support module workers.");return;}
  worker=instance;ready=false;busy=true;
  const id=++sequence;currentId=id;
  instance.onmessage=e=>onWorkerMessage(instance,e.data||{});
  instance.onerror=e=>{
    e.preventDefault?.();
    if(instance===worker)fail("Local AI runtime could not load in this browser.");
  };
  updateControls();
  setStatus("Downloading "+resolveLocalModel(chosenModel).label+" model. Do not close this tab.");
  instance.postMessage({type:"start",id,model:chosenModel,preferGpu:gpu.checked});
});
form.addEventListener("submit",event=>{
  event.preventDefault();
  if(!worker||!ready||busy)return;
  const question=prompt.value.trim();
  if(!question||question.length>MAX_INPUT){setStatus("Enter a message up to "+MAX_INPUT+" characters.");return;}
  let notes;
  try{ notes=validateProjectNotes(projectNotes.value); }
  catch{ setStatus("Project notes must contain 600 or fewer printable characters.");return; }
  const source=groundedProjectAnswer(question);
  if(source){
    append("user",question);
    append("assistant",source.answer,source.label);
    turns.push({role:"user",content:question},{role:"assistant",content:source.answer});
    prompt.value="";updateControls();scrollToLast();
    setStatus("Answered from disclosed SKYCOIN4444 project information, not a model guess.");
    return;
  }
  busy=true;
  const id=++sequence;currentId=id;
  const prior=turns.slice(-6).map(t=>({
    role:t.role,content:t.content.slice(0,MAX_INPUT)
  }));
  append("user",question);
  pending={question,partial:"",assistant:append("assistant","Thinking…")};
  updateControls();
  setStatus("Generating a real answer locally…");
  worker.postMessage({type:"generate",id,model:chosenModel,message:question,
    mode:modePicker.value,history:prior,notes});
});
better.addEventListener("click",()=>{
  if(!ready||busy||chosenModel!=="quick")return;
  unload();
  modelPicker.value="capable";
  setStatus("Better-quality 360M model selected. Requires ~386 MB download and more device memory. Press Download & start to switch.");
  modelPicker.focus();
});
newChat.addEventListener("click",()=>{
  if(!ready||busy)return;
  clearConversation();prompt.value="";prompt.focus();
});
stop.addEventListener("click",unload);
exportChat.addEventListener("click",()=>{
  if(!turns.length||busy)return;
  const transcript=exportLocalTranscript(turns,chosenModel);
  const blob=new Blob([transcript],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="hopeai-chat.txt";
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  setStatus("Conversation exported on this device. No chat copy was sent to a server.");
});
document.querySelectorAll("[data-local-suggestion]").forEach(button=>{
  button.addEventListener("click",()=>{
    if(!ready||busy)return;
    prompt.value=button.dataset.localSuggestion||"";
    prompt.focus();
  });
});
prompt.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
    event.preventDefault();
    if(!busy)form.requestSubmit();
  }
});
updateControls();
