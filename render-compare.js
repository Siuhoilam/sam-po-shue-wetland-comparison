/* Independent rendered gallery: human-scale village view and aerial view. */
(()=>{
  const root=document.querySelector('#render-viewer'),slider=document.querySelector('#render-range'),output=document.querySelector('#render-output'),toggle=document.querySelector('#render-layout');
  const pictures=[document.querySelector('#wetland-hero'),document.querySelector('#government-render')],error=document.querySelector('#render-error');
  const views={
    village:{bases:['proposal-village-v4','government-village-v4'],widths:[1774,1774],height:887,subtitle:'從村口望向濕地',descriptions:['望見大片濕地','地台與建築圍合'],lead:'從新田村望向濕地。',note:'政府平台較村地面高約7米 · 情境示意',download:'village-comparison-v4.svg',alts:['我的方案新田村視角：從村口望見大片魚塘與開敞濕地','政府方案新田村視角：抬高地台與新建築遮擋村口向外的視野']},
    aerial:{bases:['sam-po-shue-living-wetland-v2','government-render-main-v3'],widths:[1766,1765],height:891,subtitle:'三寶樹濕地與候鳥通道',descriptions:['濕地入口開敞','濕地前緣配置'],lead:'濕地相連，生命自由往來。',note:'兩方案效果圖 · 同視角意象',download:'rendered-comparison-v3.svg',alts:['我的方案鳥瞰效果圖：連續濕地、開敞綠地與自然候鳥','政府方案鳥瞰效果圖：濕地前緣的建築配置']}
  };
  let active='village',parallel=false,dragging=false;
  function split(value){const percent=Math.max(0,Math.min(100,Math.round(value)));slider.value=percent;output.value=percent+'%';root.style.setProperty('--split',percent+'%');}
  function size(){const width=Math.ceil(root.clientWidth/(parallel?2:1));for(const img of pictures)img.sizes=width+'px';}
  function loaded(){if(pictures.every((img,i)=>img.complete&&img.naturalWidth>0&&img.currentSrc.includes('/'+views[active].bases[i]))){root.setAttribute('aria-busy','false');error.hidden=true;}}
  function show(name){
    const data=views[name];if(!data)return;active=name;error.hidden=true;root.setAttribute('aria-busy','true');root.dataset.renderView=name;
    root.style.setProperty('--render-aspect',data.widths[0]+'/'+data.height);root.style.setProperty('--render-parallel-aspect',(data.widths[0]*2)+'/'+data.height);
    pictures.forEach((img,i)=>{const base='assets/'+data.bases[i];img.width=data.widths[i];img.height=data.height;img.alt=data.alts[i];img.srcset=base+'-800.webp 800w, '+base+'-1200.webp 1200w, '+base+'.webp '+data.widths[i]+'w';img.src=base+'.webp';});
    document.querySelectorAll('button[data-render-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.renderView===name)));
    document.querySelector('#render-view-subtitle').textContent=data.subtitle;document.querySelector('#render-proposal-description').textContent=data.descriptions[0];document.querySelector('#render-government-description').textContent=data.descriptions[1];document.querySelector('#render-caption-lead').textContent=data.lead;document.querySelector('#render-caption-note').textContent=data.note;
    document.querySelector('#render-download-primary').href='assets/'+data.bases[0]+'.png';document.querySelector('#render-download-comparison').href='assets/'+data.download;
    size();loaded();document.querySelector('#status').textContent='已切換至'+(name==='village'?'新田村視角。':'濕地鳥瞰。');
  }
  document.querySelectorAll('button[data-render-view]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.renderView)));
  slider.addEventListener('input',()=>split(slider.value));
  toggle.addEventListener('click',()=>{parallel=!parallel;root.classList.toggle('side-by-side',parallel);toggle.setAttribute('aria-pressed',String(parallel));toggle.textContent=parallel?'滑動看':'並排看';document.querySelector('#render-slider-row').hidden=parallel;size();document.querySelector('#status').textContent=parallel?'效果圖已切換為左右並排。':'效果圖已切換為滑動對比。';});
  function pointer(event){const box=root.getBoundingClientRect();split(100*(event.clientX-box.left)/box.width);}
  root.addEventListener('pointerdown',event=>{if(parallel||event.button!==0||event.target.closest('button,a,input'))return;dragging=true;root.setPointerCapture(event.pointerId);if(event.pointerType==='mouse')event.preventDefault();pointer(event);});
  root.addEventListener('pointermove',event=>{if(dragging)pointer(event);});
  const release=event=>{dragging=false;if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);};root.addEventListener('pointerup',release);root.addEventListener('pointercancel',release);
  for(const img of pictures){img.addEventListener('load',loaded);img.addEventListener('error',()=>{error.hidden=false;root.setAttribute('aria-busy','false');});}
  document.querySelector('#retry-renders').addEventListener('click',()=>show(active));
  if('ResizeObserver' in window)new ResizeObserver(size).observe(root);else window.addEventListener('resize',size);
  split(slider.value);show(active);
})();
