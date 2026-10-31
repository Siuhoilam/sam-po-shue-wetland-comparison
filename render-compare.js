/* Proposal aerial and pen views are solo; village retains the paired comparison. */
(()=>{
  const root=document.querySelector('#render-viewer'),slider=document.querySelector('#render-range'),output=document.querySelector('#render-output'),toggle=document.querySelector('#render-layout');
  const pictures=[document.querySelector('#wetland-hero'),document.querySelector('#government-render')],error=document.querySelector('#render-error');
  const penViews=Array.isArray(window.proposalPenViews)?window.proposalPenViews:[];
  const select=document.querySelector('#pen-angle-select');
  for(const [i,entry] of penViews.entries()){const option=document.createElement('option');option.value=i;option.textContent=String(i+1).padStart(2,'0')+' '+entry.title;select.append(option);}
  document.querySelector('button[data-render-view=pen]').disabled=!penViews.length;
  const views={
    aerial:{compare:false,bases:['proposal-aerial-new-20261031'],widths:[1752],height:897,medium:1200,subtitle:'新視角：城市、河灣與濕地',descriptions:['城市前景，濕地延伸至遠處',''],lead:'從城市一側，望向濕地。',note:'我的方案 · 新機位意象',download:'proposal-pen-views-20261031.zip',downloadLabel:'下載鋼筆圖集 ↗',alts:['我的方案新鳥瞰：左側地標塔、中央河灣、城市右前景與右後方大片魚塘']},
    village:{compare:true,bases:['proposal-village-v4','government-village-v4'],widths:[1774,1774],height:887,medium:1200,subtitle:'從村口望向濕地',descriptions:['望見大片濕地','地台與建築圍合'],lead:'從新田村望向濕地。',note:'政府平台較村地面高約7米 · 情境示意',download:'village-comparison-v4.svg',downloadLabel:'下載渲染對比圖 ↗',alts:['我的方案新田村視角：從村口望見大片魚塘與開敞濕地','政府方案新田村視角：抬高地台與新建築遮擋村口向外的視野']}
  };
  let active='aerial',parallel=false,dragging=false,penIndex=0;
  function info(name){if(name!=='pen')return views[name];const p=penViews[penIndex];return p?{compare:false,bases:[p.base],widths:[p.width],height:p.height,medium:1600,subtitle:'我的方案 · Rhino原生鋼筆圖',descriptions:[p.title,''],lead:p.title,note:'Rhino原生鋼筆模式 · '+String(penIndex+1).padStart(2,'0')+'/'+penViews.length,download:'proposal-pen-views-20261031.zip',downloadLabel:'下載全部鋼筆圖 ↗',alts:['我的方案鋼筆圖：'+p.title]}:null;}
  function split(value){const percent=Math.max(0,Math.min(100,Math.round(value)));slider.value=percent;output.value=percent+'%';root.style.setProperty('--split',percent+'%');}
  function size(){const d=info(active);if(!d)return;const width=Math.ceil(root.clientWidth/(d.compare&&parallel?2:1));for(const img of pictures)img.sizes=width+'px';}
  function loaded(){const d=info(active);if(!d)return;const visible=d.compare?pictures:[pictures[0]];if(visible.every((img,i)=>img.complete&&img.naturalWidth>0&&img.currentSrc.includes('/'+d.bases[i]))){root.setAttribute('aria-busy','false');error.hidden=true;}}
  function show(name){
    const d=info(name);if(!d)return;active=name;error.hidden=true;root.setAttribute('aria-busy','true');root.dataset.renderView=name;root.setAttribute('aria-label',d.compare?'兩方案新田村視角對比':name==='pen'?'我的方案鋼筆圖':'我的方案新鳥瞰渲染');
    root.classList.toggle('single-only',!d.compare);root.classList.toggle('side-by-side',d.compare&&parallel);document.querySelector('#render-controls').hidden=!d.compare;document.querySelector('#render-slider-row').hidden=parallel;document.querySelector('#render-government-label').hidden=!d.compare;
    document.querySelector('#pen-angle-row').hidden=name!=='pen';document.querySelector('#render-view-subtitle').hidden=name==='pen';
    root.style.setProperty('--render-aspect',d.widths[0]+'/'+d.height);root.style.setProperty('--render-parallel-aspect',(d.widths[0]*2)+'/'+d.height);
    (d.compare?pictures:[pictures[0]]).forEach((img,i)=>{const base='assets/'+d.bases[i];img.width=d.widths[i];img.height=d.height;img.alt=d.alts[i];img.srcset=base+'-800.webp 800w, '+base+'-'+d.medium+'.webp '+d.medium+'w, '+base+'.webp '+d.widths[i]+'w';img.src=base+'.webp';});
    document.querySelectorAll('button[data-render-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.renderView===name)));
    document.querySelector('#render-view-subtitle').textContent=d.subtitle;document.querySelector('#render-proposal-description').textContent=d.descriptions[0];document.querySelector('#render-government-description').textContent=d.descriptions[1];document.querySelector('#render-caption-lead').textContent=d.lead;document.querySelector('#render-caption-note').textContent=d.note;
    document.querySelector('#render-download-primary').href='assets/'+d.bases[0]+'.png';document.querySelector('#render-download-comparison').href='assets/'+d.download;document.querySelector('#render-download-comparison').textContent=d.downloadLabel;
    size();loaded();document.querySelector('#status').textContent='已切換至'+d.subtitle+'。';
  }
  document.querySelectorAll('button[data-render-view]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.renderView)));
  select.addEventListener('change',()=>{penIndex=Number(select.value);show('pen');});
  slider.addEventListener('input',()=>split(slider.value));
  toggle.addEventListener('click',()=>{if(!info(active).compare)return;parallel=!parallel;root.classList.toggle('side-by-side',parallel);toggle.setAttribute('aria-pressed',String(parallel));toggle.textContent=parallel?'滑動看':'並排看';document.querySelector('#render-slider-row').hidden=parallel;size();});
  function pointer(event){const box=root.getBoundingClientRect();split(100*(event.clientX-box.left)/box.width);}
  root.addEventListener('pointerdown',event=>{if(!info(active).compare||parallel||event.button!==0||event.target.closest('button,a,input'))return;dragging=true;root.setPointerCapture(event.pointerId);if(event.pointerType==='mouse')event.preventDefault();pointer(event);});root.addEventListener('pointermove',event=>{if(dragging)pointer(event);});
  const release=event=>{dragging=false;if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);};root.addEventListener('pointerup',release);root.addEventListener('pointercancel',release);
  for(const img of pictures){img.addEventListener('load',loaded);img.addEventListener('error',()=>{if(!info(active).compare&&img===pictures[1])return;error.hidden=false;root.setAttribute('aria-busy','false');});}
  document.querySelector('#retry-renders').addEventListener('click',()=>show(active));
  if('ResizeObserver' in window)new ResizeObserver(size).observe(root);else window.addEventListener('resize',size);
  split(slider.value);show(active);
})();
