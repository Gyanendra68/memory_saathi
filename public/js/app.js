const app=document.getElementById("app");
function wait(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}
const state={user:JSON.parse(localStorage.getItem("user")||"null"),view:"home",game:null,lang:localStorage.getItem("lang")||"en"};
const gameMeta={
 face:{icon:"🐶",title:"Face Recognition",desc:"Memorize faces and recognize the ones you saw."},
 sequence:{icon:"🔢",title:"Sequence Recall",desc:"Remember and reproduce a sequence of numbers."},
 cards:{icon:"🟦",title:"Pattern Memory",desc:"Watch a pattern of cells and repeat it in the correct order."},
 nback:{icon:"🧠",title:"N-Back Memory",desc:"Remember letters and identify when the current letter matches one shown 2 steps ago."},
 association:{icon:"🔗",title:"Memory Association",desc:"Memorize word associations and recall the correct match."}
};
function toast(x){const d=document.createElement("div");d.className="toast";d.textContent=x;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function shell(content){
 return `<div class="container"><div class="top"><div class="brand">🧠 <span>MemorySaathi</span></div><div class="row">${navigator.onLine?`<span class="pill">● Online</span>`:`<span class="offline">● Offline</span>`}<button class="btn ghost" onclick="logout()">Logout</button></div></div>${content}</div>`;
}
function login(){
 app.innerHTML=`<div class="container"><div class="card login"><div style="font-size:55px">🧠</div><h1>MemorySaathi</h1><p class="muted">AI-assisted cognitive gaming & memory assistance platform for elderly users.</p>
 <label>Role</label><select id="role"><option value="elderly">Elderly User</option><option value="caregiver">Caregiver</option></select>
 <label>Demo PIN</label><input id="pin" value="demo123" type="password">
 <button class="btn" style="width:100%" onclick="doLogin()">Continue</button>
 <p class="muted" style="font-size:14px;margin-top:15px">Demo: elder / caregiver • PIN: demo123</p></div></div>`;
}
async function doLogin(){try{const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:document.getElementById("role").value,pin:document.getElementById("pin").value})});if(!r.ok)throw 0;state.user=await r.json();localStorage.setItem("user",JSON.stringify(state.user));render()}catch{toast("Login failed")}}
function logout(){localStorage.removeItem("user");state.user=null;login()}
function nav(){
 return `<div class="nav"><button onclick="state.view='home';render()">🏠 Home</button><button onclick="state.view='games';render()">🎮 Games</button><button onclick="state.view='reminders';render()">⏰ Reminders</button>${state.user.role==="caregiver"?`<button onclick="state.view='dashboard';render()">📊 Dashboard</button>`:""}<button onclick="state.view='settings';render()">⚙️ Settings</button></div>`;
}
function home(){
 const c=Object.entries(gameMeta).map(([k,g])=>`<div class="card game-card"><div><div class="game-icon">${g.icon}</div><h3>${g.title}</h3><p class="muted">${g.desc}</p></div><button class="btn" onclick="openGame('${k}')">${t("play")}</button></div>`).join("");
 return shell(nav()+`<div class="hero card"><h1>${t("welcome")}, ${state.user.name} 👋</h1><p class="muted">Take a short, comfortable cognitive activity session. Your performance helps personalize future difficulty; it is not a medical diagnosis.</p><div class="row"><span class="pill">No stressful timer</span><span class="pill">Offline-friendly</span><span class="pill">Large controls</span></div></div><h2>${t("games")}</h2><div class="grid">${c}</div>`);
}
function games(){return home()}
function openGame(k){state.game=k;state.view="play";render()}
function play(){
 const g=gameMeta[state.game];
 return shell(nav()+`<div class="card"><div class="row between"><div><span class="pill">${g.icon} ${g.title}</span><h1>${g.title}</h1><p class="muted">${g.desc}</p></div><div><b>Personalized level</b><div id="levelBadge" class="pill">Level 2</div></div></div><div id="gameArea"></div></div>`);
}
function startGame(){
 if(state.game==="face") window.GameFace.start();
 if(state.game==="sequence") window.GameSequence.start();
 if(state.game==="cards") window.GameCards.start();
 if(state.game==="nback") window.GameNBack.start();
 if(state.game==="association") window.GameAssociation.start();
}
function result(game,score,total,accuracy,details={}){
 const item={userId:state.user.id,game,score,total,accuracy,difficulty:2,details};
 if(navigator.onLine) fetch("/api/sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(item)}).catch(()=>Offline.add(item)); else Offline.add(item);
 const area=document.getElementById("gameArea"); area.innerHTML=`<div class="hero card"><h2>Great job! 🎉</h2><div class="grid"><div><span class="muted">Score</span><div class="stat">${score}/${total}</div></div><div><span class="muted">Accuracy</span><div class="stat">${Math.round(accuracy)}%</div></div></div><p class="muted">Your next recommended level will adapt from recent gameplay performance.</p><button class="btn" onclick="state.view='games';render()">Back to Games</button></div>`;
}
function reminders(){
 return shell(nav()+`<div class="card"><div class="row between"><div><h1>⏰ ${t("reminders")}</h1><p class="muted">Simple daily memory support.</p></div><button class="btn" onclick="addReminder()">+ Add</button></div><div id="reminderList">Loading…</div></div>`);
}
async function loadReminders(){const rs=await fetch("/api/reminders").then(r=>r.json());document.getElementById("reminderList").innerHTML=rs.map(r=>`<div class="card" style="margin-top:12px"><div class="row between"><div><h3>${r.title}</h3><span class="pill">${r.time}</span></div><button class="btn ghost" onclick="toggleReminder('${r.id}',${!r.active})">${r.active?"Disable":"Enable"}</button></div></div>`).join("")||"<p>No reminders.</p>"}
async function toggleReminder(id,a){await fetch("/api/reminders/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:a})});loadReminders()}
async function addReminder(){const title=prompt("Reminder name");if(!title)return;const time=prompt("Time (HH:MM)","18:00");if(!time)return;await fetch("/api/reminders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,time,days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]})});loadReminders()}
function settings(){
 return shell(nav()+`<div class="card"><h1>⚙️ Settings</h1><label>Language</label><select id="lang"><option value="en">English</option><option value="as">অসমীয়া (Assamese)</option><option value="mni">Manipuri</option><option value="kha">Khasi</option><option value="miz">Mizo</option></select><label>Voice assistance</label><select id="voice"><option value="on">On</option><option value="off">Off</option></select><br><button class="btn" onclick="saveSettings()">Save settings</button></div>`);
}
function saveSettings(){const l=document.getElementById("lang").value;localStorage.setItem("lang",l);state.lang=l;toast("Settings saved");render()}
async function dashboard(){
 const d=await fetch("/api/dashboard/elder-1").then(r=>r.json());
 const rows=d.sessions.slice(-20).reverse().map(s=>`<tr><td>${gameMeta[s.game]?.title||s.game}</td><td>${s.score}/${s.total}</td><td>${Math.round(s.accuracy)}%</td><td>${s.difficulty||2}</td><td>${new Date(s.createdAt).toLocaleString()}</td></tr>`).join("");
 return shell(nav()+`<div class="hero card"><h1>📊 Caregiver Dashboard</h1><p class="muted">Observed gameplay performance only — not a clinical diagnosis.</p><div class="grid"><div class="card"><span class="muted">Sessions</span><div class="stat">${d.sessions.length}</div></div><div class="card"><span class="muted">Games tracked</span><div class="stat">5</div></div><div class="card"><span class="muted">Personalization</span><div class="stat">ON</div></div></div></div><div class="card"><h2>Recent performance</h2><div style="overflow:auto"><table><thead><tr><th>Game</th><th>Score</th><th>Accuracy</th><th>Level</th><th>Date</th></tr></thead><tbody>${rows||"<tr><td colspan=5>No sessions yet</td></tr>"}</tbody></table></div></div>`);
}
function render(){
 if(!state.user)return login();
 if(state.view==="play"){app.innerHTML=play();setTimeout(startGame,0);return}
 if(state.view==="reminders"){app.innerHTML=reminders();setTimeout(loadReminders,0);return}
 if(state.view==="settings"){app.innerHTML=settings();setTimeout(()=>document.getElementById("lang").value=state.lang,0);return}
 if(state.view==="dashboard"){dashboard().then(x=>app.innerHTML=x);return}
 app.innerHTML=home();
}
render();
