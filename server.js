const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data", "db.json");

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname, "public")));

function readDB(){
  // Ensure the local data directory exists before creating the first database.
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  if(!fs.existsSync(DATA)){
    const db={users:[
      {id:"elder-1",name:"Demo Elder",role:"elderly",pin:"demo123"},
      {id:"caregiver-1",name:"Demo Caregiver",role:"caregiver",pin:"demo123"}
    ],sessions:[],reminders:[
      {id:"r1",title:"Morning medicine",time:"08:00",days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],active:true},
      {id:"r2",title:"Drink water",time:"11:00",days:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],active:true}
    ],settings:{language:"en",voice:true}};
    fs.writeFileSync(DATA, JSON.stringify(db,null,2));
  }
  return JSON.parse(fs.readFileSync(DATA,"utf8"));
}
function writeDB(db){
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(db,null,2));
}

const GAMES = {
  cards:{name:"Connect Cards",domain:"Memory + Attention",levels:5},
  face:{name:"Face Recognizing",domain:"Recognition + Attention",levels:5},
  sequence:{name:"Connect the Sequence",domain:"Executive Function + Sequencing",levels:5},
  association:{name:"Memory Association",domain:"Semantic + Associative Memory",levels:5}
};

app.post("/api/login",(req,res)=>{
  const db=readDB(), {role,pin}=req.body||{};
  const u=db.users.find(x=>x.role===role && x.pin===pin);
  if(!u) return res.status(401).json({error:"Invalid demo login"});
  res.json({id:u.id,name:u.name,role:u.role});
});

app.get("/api/games",(req,res)=>res.json(GAMES));

app.get("/api/dashboard/:userId",(req,res)=>{
  const db=readDB(), sessions=db.sessions.filter(s=>s.userId===req.params.userId);
  const by={};
  Object.keys(GAMES).forEach(k=>{by[k]=sessions.filter(s=>s.game===k).slice(-10)});
  res.json({sessions,by,games:GAMES});
});

app.get("/api/reminders",(req,res)=>res.json(readDB().reminders));
app.post("/api/reminders",(req,res)=>{
  const db=readDB(), r={id:crypto.randomUUID(),...req.body,active:true};
  db.reminders.push(r); writeDB(db); res.json(r);
});
app.patch("/api/reminders/:id",(req,res)=>{
  const db=readDB(), r=db.reminders.find(x=>x.id===req.params.id);
  if(!r) return res.status(404).json({error:"Not found"});
  Object.assign(r,req.body); writeDB(db); res.json(r);
});
app.delete("/api/reminders/:id",(req,res)=>{
  const db=readDB(); db.reminders=db.reminders.filter(x=>x.id!==req.params.id);
  writeDB(db); res.json({ok:true});
});

app.post("/api/sessions",(req,res)=>{
  const db=readDB(), body=req.body||{};
  const s={id:crypto.randomUUID(),createdAt:new Date().toISOString(),...body};
  db.sessions.push(s); writeDB(db);
  res.json({ok:true,id:s.id});
});

app.post("/api/sync",(req,res)=>{
  const db=readDB(), items=Array.isArray(req.body?.items)?req.body.items:[];
  for(const item of items) db.sessions.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...item});
  writeDB(db); res.json({ok:true,synced:items.length});
});

app.get("*",(req,res)=>{
  if(req.path.startsWith("/api/")) return res.status(404).json({error:"API route not found"});
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,()=>console.log(`SIH platform running at http://localhost:${PORT}`));