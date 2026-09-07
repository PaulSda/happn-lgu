/* ===========================================================
   happn x LGU - Suivi des contenus
   Base partagée temps réel (Supabase) + captures compressées
   =========================================================== */

const CITIES=["Paris","Lille","Lyon","Marseille","Bordeaux"];
const FMT_CLASS={Reel:"fmt-reel",Story:"fmt-story",Post:"fmt-post",TikTok:"fmt-tiktok",Autre:"fmt-autre"};
const $=s=>document.querySelector(s);
const fmtNum=n=>{n=Number(n)||0;return n>=1000?(n/1000).toFixed(n>=10000?0:1).replace('.0','')+'k':n;};
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let data=[];          // rows in memory
let pending=[];       // compressed images (base64) staged in the modal
let sb=null;          // supabase client
let LIVE=false;

/* ---------- Supabase init ---------- */
function initSupabase(){
  const url=window.SUPABASE_URL, key=window.SUPABASE_ANON_KEY;
  if(!url||!key||!window.supabase){
    $('#setupBanner').style.display='block';
    setStatus(false,"Mode local (base non configurée)");
    loadLocal();
    return;
  }
  try{
    sb=window.supabase.createClient(url,key);
    setStatus(true,"Temps réel actif");
    LIVE=true;
    fetchAll();
    // realtime subscription
    sb.channel('contents-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'contents'},()=>fetchAll())
      .subscribe();
  }catch(e){
    console.error(e);setStatus(false,"Erreur de connexion");loadLocal();
  }
}
function setStatus(live,txt){
  const el=$('#connStatus');el.className='status '+(live?'live':'off');
  el.innerHTML='<span class="dot"></span>'+txt;
}

/* ---------- Data fetch ---------- */
async function fetchAll(){
  if(!sb){return;}
  const {data:rows,error}=await sb.from('contents').select('*').order('created_at',{ascending:false});
  if(error){console.error(error);setStatus(false,"Erreur de lecture");return;}
  data=rows.map(r=>({
    id:r.id,name:r.name,city:r.city,fmt:r.format,date:r.pub_date,
    views:r.views,likes:r.likes,comm:r.comments,link:r.link,venue:r.venue,
    photos:Array.isArray(r.photos)?r.photos:(r.photos?JSON.parse(r.photos):[])
  }));
  render();
  $('#savenote').textContent="";
}

/* ---------- Local fallback (no DB) ---------- */
function loadLocal(){
  try{const raw=localStorage.getItem('happn_lgu_local');if(raw)data=JSON.parse(raw);}catch(e){}
  render();
  $('#savenote').textContent="";
}
function saveLocal(){try{localStorage.setItem('happn_lgu_local',JSON.stringify(data));}catch(e){}}

/* ---------- Metrics ---------- */
function engag(r){const v=Number(r.views)||0;if(!v)return null;return (((Number(r.likes)||0)+(Number(r.comm)||0))/v)*100;}

/* ---------- Render ---------- */
function render(){
  const fc=$('#fCity').value, ff=$('#fFmt').value;
  const rows=data.filter(r=>(!fc||r.city===fc)&&(!ff||r.fmt===ff));
  const totV=data.reduce((s,r)=>s+(Number(r.views)||0),0);
  const totL=data.reduce((s,r)=>s+(Number(r.likes)||0),0);
  const totC=data.reduce((s,r)=>s+(Number(r.comm)||0),0);
  const creators=new Set(data.map(r=>(r.name||'').trim().toLowerCase())).size;
  const es=data.map(engag).filter(x=>x!=null);
  const avgEng=es.length?es.reduce((a,b)=>a+b,0)/es.length:0;
  const activity=[
    ['Contenus publiés',data.length,'posts partagés'],
    ['Créateurs actifs',creators,'ont publié'],
    ['Villes couvertes',new Set(data.map(r=>r.city).filter(Boolean)).size+' / 5','en campagne'],
    ['Contenus avec preuve',data.filter(r=>(r.photos||[]).length).length,'captures jointes'],
  ];
  $('#kpis').innerHTML=activity.map(k=>`<div class="kpi"><div class="lab">${k[0]}</div><div class="val">${k[1]}</div><div class="sub">${k[2]||''}</div></div>`).join('');

  const perf=[
    ['Vues cumulées',fmtNum(totV),'toutes plateformes'],
    ['Likes',fmtNum(totL),''],
    ['Commentaires',fmtNum(totC),''],
    ['Engagement moyen',avgEng.toFixed(1)+'%','(likes+comm)/vues'],
  ];
  $('#perfKpis').innerHTML=perf.map(k=>`<div class="kpi"><div class="lab">${k[0]}</div><div class="val">${k[1]}</div><div class="sub">${k[2]||''}</div></div>`).join('');
  if(!window._kpiAnimated){window._kpiAnimated=true;animateVals();}

  const byCity=CITIES.map(c=>({c,n:data.filter(r=>r.city===c).length}));
  const maxC=Math.max(1,...byCity.map(x=>x.n));
  $('#cityBars').innerHTML=byCity.map(x=>`<div class="cityrow"><span class="nm">${x.c}</span><span class="track"><span class="fill" data-w="${x.n/maxC*100}"></span></span><span class="ct">${x.n}</span></div>`).join('');
  // animate bar widths after paint
  requestAnimationFrame(()=>document.querySelectorAll('.fill[data-w]').forEach(el=>{el.style.width=el.dataset.w+'%';}));

  const fmts=["Reel","Story","Post","TikTok","Autre"];
  const byF=fmts.map(f=>({f,n:data.filter(r=>r.fmt===f).length})).filter(x=>x.n>0);
  const maxF=Math.max(1,...byF.map(x=>x.n));
  $('#fmtBars').innerHTML=(byF.length?byF:[{f:'-',n:0}]).map(x=>`<div class="cityrow"><span class="nm">${x.f}</span><span class="track"><span class="fill" data-w="${x.n/maxF*100}"></span></span><span class="ct">${x.n}</span></div>`).join('');

  if(!rows.length){$('#rows').innerHTML=`<tr><td colspan="11" class="empty">Aucun contenu pour l'instant. Clique sur « + Ajouter un contenu ».</td></tr>`;return;}
  $('#rows').innerHTML=rows.map(r=>{
    const e=engag(r);const ph=r.photos||[];
    const thumbs=ph.length?`<div class="thumbs">${ph.slice(0,3).map((src,i)=>`<img src="${src}" data-full="${src}" alt="preuve">`).join('')}${ph.length>3?`<span class="more" data-first="${esc(ph[3])}">+${ph.length-3}</span>`:''}</div>`:'<span style="color:var(--grey)">-</span>';
    return `<tr>
      <td><b>${esc(r.name)}</b>${r.venue?`<br><span style="font-size:11px;color:var(--grey)">${esc(r.venue)}</span>`:''}</td>
      <td class="hide-sm city">${r.city||''}</td>
      <td><span class="pill ${FMT_CLASS[r.fmt]||'fmt-autre'}">${r.fmt||'-'}</span></td>
      <td class="num perf-col">${r.views?fmtNum(r.views):'-'}</td>
      <td class="num perf-col">${r.likes?fmtNum(r.likes):'-'}</td>
      <td class="num perf-col">${r.comm?fmtNum(r.comm):'-'}</td>
      <td class="num perf-col">${e!=null?e.toFixed(1)+'%':'-'}</td>
      <td>${thumbs}</td>
      <td class="hide-sm">${r.date?String(r.date).split('-').reverse().join('/'):'-'}</td>
      <td>${r.link?`<a class="lnk" href="${esc(r.link)}" target="_blank" rel="noopener">voir ↗</a>`:'-'}</td>
      <td><button class="del" data-id="${r.id}" title="Supprimer">🗑</button></td>
    </tr>`;}).join('');
}

/* ---------- Image compression ---------- */
function compress(file,max=1000,q=0.7){
  return new Promise((res,rej)=>{
    const img=new Image();const rd=new FileReader();
    rd.onload=()=>img.src=rd.result;
    rd.onerror=rej;
    img.onload=()=>{
      let{width:w,height:h}=img;
      if(w>h&&w>max){h=Math.round(h*max/w);w=max;}
      else if(h>=w&&h>max){w=Math.round(w*max/h);h=max;}
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      res(cv.toDataURL('image/jpeg',q));
    };
    img.onerror=rej;rd.readAsDataURL(file);
  });
}
async function handleFiles(files){
  for(const f of files){
    if(!f.type.startsWith('image/'))continue;
    try{const b64=await compress(f);pending.push(b64);}catch(e){console.error('compress fail',e);}
  }
  renderPreview();
}
function renderPreview(){
  $('#preview').innerHTML=pending.map((src,i)=>`<div class="pv"><img src="${src}"><button type="button" class="rm" data-i="${i}">×</button></div>`).join('');
}

/* ---------- Modal ---------- */
$('#addBtn').onclick=()=>{
  pending=[];renderPreview();
  ['i_name','i_views','i_likes','i_comm','i_link','i_venue','i_date'].forEach(k=>$('#'+k).value='');
  $('#i_city').value='Paris';$('#i_fmt').value='Reel';
  $('#dlg').showModal();
};
$('#drop').onclick=()=>$('#i_files').click();
$('#i_files').onchange=e=>handleFiles(e.target.files);
$('#drop').addEventListener('dragover',e=>{e.preventDefault();$('#drop').style.background='#efd9fb';});
$('#drop').addEventListener('dragleave',()=>$('#drop').style.background='');
$('#drop').addEventListener('drop',e=>{e.preventDefault();$('#drop').style.background='';handleFiles(e.dataTransfer.files);});
$('#preview').addEventListener('click',e=>{const b=e.target.closest('.rm');if(b){pending.splice(+b.dataset.i,1);renderPreview();}});

$('#saveBtn').onclick=async(e)=>{
  const name=$('#i_name').value.trim();
  if(!name){e.preventDefault();$('#i_name').focus();return;}
  const rec={
    name,city:$('#i_city').value,fmt:$('#i_fmt').value,date:$('#i_date').value||null,
    views:$('#i_views').value?+$('#i_views').value:null,
    likes:$('#i_likes').value?+$('#i_likes').value:null,
    comm:$('#i_comm').value?+$('#i_comm').value:null,
    link:$('#i_link').value.trim()||null,venue:$('#i_venue').value.trim()||null,
    photos:pending.slice()
  };
  if(LIVE&&sb){
    const {error}=await sb.from('contents').insert([{
      name:rec.name,city:rec.city,format:rec.fmt,pub_date:rec.date,
      views:rec.views,likes:rec.likes,comments:rec.comm,link:rec.link,venue:rec.venue,
      photos:rec.photos
    }]);
    if(error){alert("Erreur d'enregistrement : "+error.message);e.preventDefault();return;}
    // realtime will refresh; also refresh now for snappiness
    fetchAll();
  }else{
    rec.id=Date.now()+''+Math.floor(Math.random()*999);
    data.unshift(rec);saveLocal();render();
  }
};

/* ---------- Delete ---------- */
$('#rows').addEventListener('click',async e=>{
  const b=e.target.closest('.del');if(!b)return;
  if(!confirm('Supprimer ce contenu ?'))return;
  const id=b.dataset.id;
  if(LIVE&&sb){
    const {error}=await sb.from('contents').delete().eq('id',id);
    if(error){alert("Erreur suppression : "+error.message);return;}
    fetchAll();
  }else{
    data=data.filter(r=>String(r.id)!==String(id));saveLocal();render();
  }
});

/* ---------- Lightbox ---------- */
$('#rows').addEventListener('click',e=>{
  const img=e.target.closest('img[data-full]');
  const more=e.target.closest('.more');
  if(img){$('#lbImg').src=img.dataset.full;$('#lightbox').showModal();}
  else if(more){$('#lbImg').src=more.dataset.first;$('#lightbox').showModal();}
});
$('#lbClose').onclick=()=>$('#lightbox').close();
$('#lightbox').addEventListener('click',e=>{if(e.target.id==='lightbox')$('#lightbox').close();});

/* ---------- Filters + export ---------- */
$('#fCity').onchange=render;$('#fFmt').onchange=render;
$('#perfToggle').onclick=togglePerf;
$('#exportBtn').onclick=()=>{
  const head=['Créateur','Ville','Format','Vues','Likes','Commentaires','Engagement %','Date','Lieu','Lien','Nb preuves'];
  const lines=[head.join(',')].concat(data.map(r=>{const e=engag(r);
    return [r.name,r.city,r.fmt,r.views||'',r.likes||'',r.comm||'',e!=null?e.toFixed(1):'',r.date||'',r.venue||'',r.link||'',(r.photos||[]).length]
      .map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',');}));
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='happn_lgu_contenus.csv';a.click();
};

/* ---------- Go ---------- */
/* ---------- Count-up animation (waouw effect) ---------- */
function animateVals(){
  document.querySelectorAll('.kpi .val').forEach(el=>{
    const raw=el.textContent.trim();
    const m=raw.match(/^([\d.,]+)(k)?(%)?$/);
    if(!m)return;
    const target=parseFloat(m[1].replace(',','.'));const suffix=(m[2]||'')+(m[3]||'');
    if(isNaN(target)||target===0)return;
    const dur=1000, t0=performance.now();
    const dec=(m[3]?1:0);
    function step(now){
      const p=Math.min(1,(now-t0)/dur);
      const eased=1-Math.pow(1-p,3);
      const cur=target*eased;
      el.textContent=(dec?cur.toFixed(1):Math.round(cur))+suffix;
      if(p<1)requestAnimationFrame(step);else el.textContent=raw;
    }
    requestAnimationFrame(step);
  });
}

/* ---------- Toggle performances ---------- */
let perfOpen=false;
function togglePerf(){
  perfOpen=!perfOpen;
  const wrap=$('#perfSection'), btn=$('#perfToggle'), table=document.querySelector('table');
  wrap.style.display=perfOpen?'block':'none';
  btn.innerHTML=perfOpen?'Masquer les performances ▲':'Voir les performances ▼';
  if(table)table.classList.toggle('show-perf',perfOpen);
  if(perfOpen){
    // animate perf bars/counts when revealed
    document.querySelectorAll('#perfKpis .val').forEach(el=>{
      const raw=el.textContent.trim();const m=raw.match(/^([\d.,]+)(k)?(%)?$/);
      if(!m)return;const target=parseFloat(m[1].replace(',','.'));const suffix=(m[2]||'')+(m[3]||'');
      if(isNaN(target)||target===0)return;const dur=800,t0=performance.now(),dec=(m[3]?1:0);
      (function step(now){const p=Math.min(1,(now-t0)/dur);const c=target*(1-Math.pow(1-p,3));
        el.textContent=(dec?c.toFixed(1):Math.round(c))+suffix;if(p<1)requestAnimationFrame(step);else el.textContent=raw;})(t0);
    });
  }
}

initSupabase();
