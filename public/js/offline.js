window.Offline={
 key:"memorysaathi_queue",
 queue(){try{return JSON.parse(localStorage.getItem(this.key)||"[]")}catch{return[]}},
 add(item){const q=this.queue();q.push(item);localStorage.setItem(this.key,JSON.stringify(q));},
 async sync(){if(!navigator.onLine)return;const q=this.queue();if(!q.length)return;try{const r=await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:q})});if(r.ok)localStorage.removeItem(this.key)}catch(e){}}
};
window.addEventListener("online",()=>Offline.sync());