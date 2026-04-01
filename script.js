let tasks = JSON.parse(localStorage.getItem('pt_tasks') || '[]');
let currentView = 'matrix';
let currentFilter = 'all';
let focusTaskId = null;

function getQuadrant(u,i){
  if(u==='urgent'&&i==='important')return'q1';
  if(u==='not-urgent'&&i==='important')return'q2';
  if(u==='urgent'&&i==='not-important')return'q3';
  return'q4';
}
function quadrantLabel(q){return{q1:'Do First',q2:'Schedule',q3:'Delegate',q4:'Eliminate'}[q];}
function quadrantStyle(q){return{q1:'background:#FFF0EB;color:#C1401A;',q2:'background:#E8F7F2;color:#0F6E56;',q3:'background:#FFF8E0;color:#7A5C00;',q4:'background:#F2F2F2;color:#5A5A5A;'}[q];}

function addTask(){
  const input=document.getElementById('task-input');
  const text=input.value.trim();
  if(!text){input.focus();input.style.borderColor='var(--accent)';setTimeout(()=>input.style.borderColor='',600);return;}
  const task={id:Date.now(),text,urgency:document.getElementById('urgency-select').value,importance:document.getElementById('importance-select').value,effort:document.getElementById('effort-select').value,done:false,created:new Date().toISOString()};
  task.quadrant=getQuadrant(task.urgency,task.importance);
  tasks.unshift(task);save();input.value='';render();updateFocusBanner();
}
function toggleDone(id){const t=tasks.find(t=>t.id===id);if(t){t.done=!t.done;save();render();updateFocusBanner();}}
function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);if(focusTaskId===id)focusTaskId=null;save();render();updateFocusBanner();}
function clearDone(){tasks=tasks.filter(t=>!t.done);save();render();updateFocusBanner();}
function setFilter(f){currentFilter=f;['all','pending','done'].forEach(x=>document.getElementById('filter-'+x).classList.toggle('active',x===f));render();}
function filteredTasks(){if(currentFilter==='pending')return tasks.filter(t=>!t.done);if(currentFilter==='done')return tasks.filter(t=>t.done);return tasks;}

function updateFocusBanner(){
  const q1=tasks.filter(t=>t.quadrant==='q1'&&!t.done);
  const banner=document.getElementById('focus-banner');
  if(q1.length>0){focusTaskId=q1[0].id;document.getElementById('focus-task-text').textContent=q1[0].text;banner.classList.add('show');}
  else{banner.classList.remove('show');focusTaskId=null;}
}
function markFocusDone(){if(focusTaskId)toggleDone(focusTaskId);}

function render(){
  const ft=filteredTasks();
  document.getElementById('s-total').textContent=tasks.length;
  document.getElementById('s-q1').textContent=tasks.filter(t=>t.quadrant==='q1'&&!t.done).length;
  document.getElementById('s-q2').textContent=tasks.filter(t=>t.quadrant==='q2'&&!t.done).length;
  document.getElementById('s-q3').textContent=tasks.filter(t=>t.quadrant==='q3'&&!t.done).length;
  document.getElementById('s-done').textContent=tasks.filter(t=>t.done).length;
  document.getElementById('total-count').textContent=tasks.length+' task'+(tasks.length!==1?'s':'');

  ['q1','q2','q3','q4'].forEach(q=>{
    const qTasks=ft.filter(t=>t.quadrant===q);
    document.getElementById(q+'-count').textContent=qTasks.filter(t=>!t.done).length;
    const list=document.getElementById(q+'-list');
    const emp={q1:['✓','No tasks here — great!'],q2:['📅','Plan your goals here'],q3:['🔁','Tasks to hand off'],q4:['🗑️','Drop or ignore these']};
    if(qTasks.length===0){list.innerHTML=`<div class="empty-state"><div class="empty-icon">${emp[q][0]}</div><span>${emp[q][1]}</span></div>`;}
    else{list.innerHTML=qTasks.map(t=>`<div class="task-item${t.done?' done':''}"><div class="task-check" onclick="toggleDone(${t.id})"></div><div class="task-body"><div class="task-text">${escHtml(t.text)}</div><div class="task-meta"><span class="tag tag-effort-${t.effort}">${t.effort} effort</span></div></div><button class="task-delete" onclick="deleteTask(${t.id})">✕</button></div>`).join('');}
  });

  const lb=document.getElementById('list-body');
  if(ft.length===0){lb.innerHTML=`<div class="empty-state" style="padding:2rem;">No tasks to show.</div>`;}
  else{lb.innerHTML=ft.map(t=>`<div class="list-row${t.done?' done':''}"><span class="task-name">${escHtml(t.text)}</span><span><span class="quadrant-badge" style="${quadrantStyle(t.quadrant)}">${quadrantLabel(t.quadrant)}</span></span><span style="font-size:0.8rem;color:var(--muted);text-transform:capitalize;">${t.effort}</span><span><span class="tag" style="${t.done?'background:#E8F7F2;color:#0F6E56':'background:#FFF0EB;color:#C1401A'}">${t.done?'Done':'Pending'}</span></span><span style="display:flex;gap:4px;"><button onclick="toggleDone(${t.id})" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted);">${t.done?'↩':'✓'}</button><button onclick="deleteTask(${t.id})" style="background:none;border:none;cursor:pointer;font-size:14px;color:var(--muted);">✕</button></span></div>`).join('');}
}

function switchView(v){
  currentView=v;
  document.getElementById('matrix-view').style.display=v==='matrix'?'block':'none';
  document.getElementById('list-view').style.display=v==='list'?'block':'none';
  document.getElementById('btn-matrix').classList.toggle('active',v==='matrix');
  document.getElementById('btn-list').classList.toggle('active',v==='list');
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function save(){localStorage.setItem('pt_tasks',JSON.stringify(tasks));}

function exportTasks(){
  const lines=['Task,Quadrant,Effort,Status'];
  tasks.forEach(t=>lines.push(`"${t.text}","${quadrantLabel(t.quadrant)}","${t.effort}","${t.done?'Done':'Pending'}"`));
  const blob=new Blob([lines.join('\n')],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tasks-PrioritizeTasks.csv';a.click();
}

document.getElementById('task-input').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});

if(tasks.length===0){
  const samples=[
    {text:'Prepare client presentation for Monday',urgency:'urgent',importance:'important',effort:'high'},
    {text:'Review team Q2 performance metrics',urgency:'not-urgent',importance:'important',effort:'medium'},
    {text:'Reply to non-critical Slack messages',urgency:'urgent',importance:'not-important',effort:'low'},
    {text:'Reorganize desktop files',urgency:'not-urgent',importance:'not-important',effort:'low'},
  ];
  samples.forEach(s=>{const t={id:Date.now()+Math.random(),...s,done:false,created:new Date().toISOString()};t.quadrant=getQuadrant(t.urgency,t.importance);tasks.push(t);});
  save();
}

render();
updateFocusBanner();

/* ════════════════════════════════════════
   TEMPLATE ENGINE — live tasks + blank + wallpaper sizes
════════════════════════════════════════ */

let tplMode = 'tasks'; // 'tasks' | 'blank'

function setTemplateMode(m) {
  tplMode = m;
  document.getElementById('btn-mode-tasks').classList.toggle('active', m==='tasks');
  document.getElementById('btn-mode-blank').classList.toggle('active', m==='blank');
  document.getElementById('filter-ctrl').style.opacity = m==='blank'?'0.35':'1';
  document.getElementById('filter-ctrl').style.pointerEvents = m==='blank'?'none':'auto';
  renderAllTemplates();
}

function getCanvasSize() {
  const v = document.getElementById('tpl-size').value;
  const [w,h] = v.split('x').map(Number);
  return {w, h};
}

function onSizeChange() {
  const {w,h} = getCanvasSize();
  document.getElementById('tpl-size-info').textContent =
    `Images will download at ${w}×${h}px — wallpaper quality.`;
  renderAllTemplates();
}

function getFilteredLines(max) {
  if (tplMode === 'blank') return [];
  const q = document.getElementById('tpl-filter').value;
  let src = q === 'all'
    ? tasks.filter(t => !t.done)
    : tasks.filter(t => t.quadrant === q && !t.done);
  return src.slice(0, max).map(t => t.text);
}

/* ── Drawing helpers ── */

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0,-1);
  return t + '…';
}

function drawNoise(ctx, w, h) {
  const img = ctx.getImageData(0,0,w,h);
  for (let i=0;i<img.data.length;i+=4) {
    const n = (Math.random()-0.5)*28;
    img.data[i]   = Math.min(255,Math.max(0,img.data[i]+n));
    img.data[i+1] = Math.min(255,Math.max(0,img.data[i+1]+n));
    img.data[i+2] = Math.min(255,Math.max(0,img.data[i+2]+n));
  }
  ctx.putImageData(img,0,0);
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function drawDogEar(ctx, x, y, w, h, r, fold) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-fold,y);
  ctx.lineTo(x+w,y+fold); ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

/* scale helpers — all rendering coords are in "base" 800×520 space,
   then we scale the canvas context to the target size */
function scaleCtx(ctx, W, H, baseW, baseH) {
  ctx.scale(W/baseW, H/baseH);
}

/* ── CHECKLIST template ── */
function renderChecklist(canvas, blank) {
  const {w:W,h:H} = getCanvasSize();
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const BW=800, BH=520; // base coords
  ctx.save(); scaleCtx(ctx,W,H,BW,BH);

  ctx.fillStyle = '#3A9B6F'; ctx.fillRect(0,0,BW,BH);
  drawNoise(ctx,BW,BH);

  // decorative circle
  ctx.beginPath(); ctx.arc(680,70,210,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fill();
  ctx.beginPath(); ctx.arc(680,70,150,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fill();

  // header
  ctx.fillStyle='#fff';
  ctx.font='bold 32px Syne, sans-serif';
  ctx.fillText('My Task List', 64, 82);
  ctx.font='15px DM Sans, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.55)';
  ctx.fillText(new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}), 64, 110);

  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(64,128); ctx.lineTo(540,128); ctx.stroke();

  const lines = blank ? [] : getFilteredLines(7);
  const slots = 7;
  for (let i=0;i<slots;i++) {
    const y = 164 + i*47;
    const text = lines[i] || '';
    // bullet
    ctx.beginPath(); ctx.arc(78,y-6,5,0,Math.PI*2);
    ctx.fillStyle = text ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)';
    ctx.fill();
    // text
    if (text) {
      ctx.font='18px DM Sans, sans-serif';
      ctx.fillStyle='#fff';
      ctx.fillText(truncate(ctx, text, 500), 98, y);
    }
    // line rule
    ctx.strokeStyle = text ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)';
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(64,y+13); ctx.lineTo(560,y+13); ctx.stroke();
  }

  ctx.font='bold 12px Syne, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillText('PrioritizeTasks.com', 64, BH-24);
  ctx.restore();
}

/* ── NOTEPAD template ── */
function renderNotepad(canvas, blank) {
  const {w:W,h:H} = getCanvasSize();
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const BW=800, BH=520;
  ctx.save(); scaleCtx(ctx,W,H,BW,BH);

  ctx.fillStyle='#C8573A'; ctx.fillRect(0,0,BW,BH);
  drawNoise(ctx,BW,BH);

  // blob bg
  ctx.beginPath(); ctx.arc(100,430,200,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fill();

  // title
  ctx.fillStyle='#fff';
  ctx.font='bold 30px Syne, sans-serif';
  ctx.fillText('Notes & Tasks', 64, 72);
  ctx.font='14px DM Sans, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillText(blank ? 'Fill in your tasks below' : 'Urgent · Important', 64, 98);

  // large notecard (decorative, top-right)
  const cx=520, cy=52, cw=220, ch=170, fold=32;
  ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=20; ctx.shadowOffsetY=8;
  drawDogEar(ctx,cx,cy,cw,ch,8,fold);
  ctx.fillStyle='#fff'; ctx.fill();
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  ctx.beginPath(); ctx.moveTo(cx+cw-fold,cy); ctx.lineTo(cx+cw,cy+fold); ctx.lineTo(cx+cw-fold,cy+fold); ctx.closePath();
  ctx.fillStyle='rgba(0,0,0,0.07)'; ctx.fill();
  [0.28,0.46,0.62,0.78].forEach(f=>{
    ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx+16,cy+ch*f); ctx.lineTo(cx+cw-16,cy+ch*f); ctx.stroke();
  });

  // small outline notecard (mid)
  const bx=148, by=215, bw=162, bh=132, bf=22;
  ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=1.5;
  drawDogEar(ctx,bx,by,bw,bh,6,bf); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.moveTo(bx+bw-bf,by); ctx.lineTo(bx+bw,by+bf); ctx.stroke();
  [0.28,0.5,0.7].forEach(f=>{
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(bx+12,by+bh*f); ctx.lineTo(bx+bw-16,by+bh*f); ctx.stroke();
  });

  const lines = blank ? [] : getFilteredLines(6);
  for (let i=0;i<6;i++) {
    const y = 280 + i*38;
    const text = lines[i] || '';
    // left accent bar
    ctx.fillStyle = text ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)';
    ctx.fillRect(64,y-15,6,20);
    if (text) {
      ctx.font='16px DM Sans, sans-serif';
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.fillText(truncate(ctx,text,540), 80, y);
    } else {
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(80,y); ctx.lineTo(560,y); ctx.stroke();
    }
  }

  ctx.font='bold 12px Syne, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.28)';
  ctx.fillText('PrioritizeTasks.com', 64, BH-24);
  ctx.restore();
}

/* ── TO-DO TRACKER template ── */
function renderTodo(canvas, blank) {
  const {w:W,h:H} = getCanvasSize();
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const BW=800, BH=520;
  ctx.save(); scaleCtx(ctx,W,H,BW,BH);

  ctx.fillStyle='#3558C0'; ctx.fillRect(0,0,BW,BH);
  drawNoise(ctx,BW,BH);

  // header
  ctx.fillStyle='#fff';
  ctx.font='bold 30px Syne, sans-serif';
  ctx.fillText('To-Do Today', 60, 70);
  ctx.font='14px DM Sans, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.45)';
  ctx.fillText(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), 60, 96);

  const lines = blank ? [] : getFilteredLines(6);
  const slots = 6;
  for (let i=0;i<slots;i++) {
    const y = 140 + i * 58;
    const text = lines[i] || '';
    const isDone = !blank && tasks.find(t=>t.text===text)?.done;

    // pill shadow + fill
    ctx.shadowColor='rgba(0,0,0,0.12)'; ctx.shadowBlur=8; ctx.shadowOffsetY=3;
    drawRoundRect(ctx, 52, y-26, 548, 44, 22);
    ctx.fillStyle = text ? (isDone ? 'rgba(255,255,255,0.12)' : '#fff') : 'rgba(255,255,255,0.07)';
    ctx.fill();
    if (!text) { ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1.5; ctx.stroke(); }
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;

    // check circle
    ctx.beginPath(); ctx.arc(88,y-4,14,0,Math.PI*2);
    if (isDone) {
      ctx.fillStyle='rgba(29,158,117,0.7)'; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(81,y-3); ctx.lineTo(86,y+3); ctx.lineTo(96,y-9); ctx.stroke();
    } else {
      ctx.strokeStyle = text ? 'rgba(53,88,192,0.3)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth=1.5; ctx.stroke();
    }

    if (text) {
      ctx.font = isDone ? '16px DM Sans, sans-serif' : '17px DM Sans, sans-serif';
      ctx.fillStyle = isDone ? 'rgba(255,255,255,0.35)' : '#1A1917';
      ctx.fillText(truncate(ctx,text,398), 114, y);
    }
  }

  ctx.font='bold 12px Syne, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.28)';
  ctx.fillText('PrioritizeTasks.com', 60, BH-24);
  ctx.restore();
}

/* ── PRIORITY BOARD template ── */
function renderPriority(canvas, blank) {
  const {w:W,h:H} = getCanvasSize();
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const BW=800, BH=520;
  ctx.save(); scaleCtx(ctx,W,H,BW,BH);

  ctx.fillStyle='#E05A6B'; ctx.fillRect(0,0,BW,BH);
  drawNoise(ctx,BW,BH);

  // bg circle
  ctx.beginPath(); ctx.arc(700,490,280,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fill();

  // header
  ctx.fillStyle='#fff';
  ctx.font='bold 30px Syne, sans-serif';
  ctx.fillText('Priority Board', 64, 70);
  ctx.font='14px DM Sans, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillText(blank ? 'Your ranked priorities' : 'Ranked by urgency + importance', 64, 96);

  ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(64,114); ctx.lineTo(600,114); ctx.stroke();

  const lines = blank ? [] : getFilteredLines(6);
  const maxBars = [500,450,390,330,270,210];
  const slots = 6;
  for (let i=0;i<slots;i++) {
    const y = 146 + i*54;
    const text = lines[i] || '';
    const barW = maxBars[i] * (text ? 1 : 0.25);

    // progress bar
    ctx.fillStyle = text ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(64, y-4, barW, 3);

    // rank number
    ctx.font='bold 12px Syne, sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.fillText('#'+(i+1), 64, y+20);

    if (text) {
      ctx.font='17px DM Sans, sans-serif';
      ctx.fillStyle='rgba(255,255,255,0.94)';
      ctx.fillText(truncate(ctx,text,490), 94, y+20);
    } else {
      // blank line placeholder
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(94,y+18); ctx.lineTo(560,y+18); ctx.stroke();
    }
  }

  ctx.font='bold 12px Syne, sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.28)';
  ctx.fillText('PrioritizeTasks.com', 64, BH-24);
  ctx.restore();
}

/* ── Orchestration ── */

const templateRenderers = {
  checklist: renderChecklist,
  notepad:   renderNotepad,
  todo:      renderTodo,
  priority:  renderPriority
};

function renderAllTemplates() {
  Object.entries(templateRenderers).forEach(([key, fn]) => {
    const c = document.getElementById('canvas-'+key);
    if (c) fn(c, tplMode==='blank');
  });
}

function downloadTemplate(key) {
  const {w:W,h:H} = getCanvasSize();
  const offscreen = document.createElement('canvas');
  offscreen.width = W; offscreen.height = H;
  templateRenderers[key](offscreen, false);
  const a = document.createElement('a');
  a.download = `PrioritizeTasks-${key}-${W}x${H}.png`;
  a.href = offscreen.toDataURL('image/png');
  a.click();
}

function downloadBlankTemplate(key) {
  const {w:W,h:H} = getCanvasSize();
  const offscreen = document.createElement('canvas');
  offscreen.width = W; offscreen.height = H;
  templateRenderers[key](offscreen, true);
  const a = document.createElement('a');
  a.download = `PrioritizeTasks-${key}-blank-${W}x${H}.png`;
  a.href = offscreen.toDataURL('image/png');
  a.click();
}

// Initial render — wait for fonts to load
document.fonts.ready.then(()=>{ renderAllTemplates(); }).catch(()=>{ setTimeout(renderAllTemplates, 600); });

// Re-render when tasks change
const _origSave = save;
save = function() { _origSave(); setTimeout(renderAllTemplates, 80); };
