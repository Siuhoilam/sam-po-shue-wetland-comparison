const state={view:'main',parallel:false,data:null};
const viewer=document.querySelector('#viewer');
const images=[document.querySelector('#proposal-image'),document.querySelector('#government-image')];
const slider=document.querySelector('#compare-range');
const status=document.querySelector('#status');
const routeToggle=document.querySelector('#route-toggle');
const labels={main:'鳥瞰',overview:'高角度',top:'俯視'};
const imageSizes='(max-width:680px) calc(100vw - 32px), (max-width:1450px) calc(100vw - 88px), 1360px';
function split(){viewer.style.setProperty('--split',slider.value+'%');document.querySelector('#range-output').value=slider.value+'%';}
slider.addEventListener('input',split);split();
function drawRoutes(){
  if(!state.data)return;
  document.querySelectorAll('.route-overlay').forEach((svg,index)=>{
    const marker='flow-'+index+'-'+state.view;
    const paths=state.data.routes[state.view].map(points=>{const [a,b,c,d]=points;return 'M'+a.join(',')+' C'+b.join(',')+' '+c.join(',')+' '+d.join(',');});
    svg.innerHTML='<defs><marker id="'+marker+'" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#eefbcf" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'+paths.map((d,i)=>'<path d="'+d+'" fill="none" stroke="#16492b" stroke-width="7" opacity=".6"/><path d="'+d+'" fill="none" stroke="#eefbcf" stroke-width="2.8" opacity="'+(i===1?'.95':'.72')+'" stroke-linecap="round" marker-end="url(#'+marker+')"/>').join('');
  });
}
function view(name){
  state.view=name;viewer.setAttribute('aria-busy','true');document.querySelector('#image-error').hidden=true;
  for(const [img,key] of [[images[0],'proposal'],[images[1],'government']]){
    img.srcset='assets/'+key+'-'+name+'-800.webp 800w, assets/'+key+'-'+name+'-1200.webp 1200w, assets/'+key+'-'+name+'.webp 2400w';
    img.src='assets/'+key+'-'+name+'.webp';img.alt=(key==='proposal'?'我的方案':'政府方案')+'，同角度'+labels[name]+'模型圖';
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===name)));
  drawRoutes();status.textContent='已切換至'+labels[name]+'。';
}
for(const img of images){img.addEventListener('load',()=>{if(images.every(image=>image.complete&&image.naturalWidth>0))viewer.setAttribute('aria-busy','false');});img.addEventListener('error',()=>{document.querySelector('#image-error').hidden=false;viewer.setAttribute('aria-busy','false');});}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>view(button.dataset.view)));
document.querySelector('#retry-images').addEventListener('click',()=>view(state.view));
routeToggle.addEventListener('change',()=>viewer.classList.toggle('show-routes',routeToggle.checked));
document.querySelector('#layout-toggle').addEventListener('click',event=>{state.parallel=!state.parallel;viewer.classList.toggle('side-by-side',state.parallel);event.currentTarget.setAttribute('aria-pressed',String(state.parallel));event.currentTarget.textContent=state.parallel?'滑動看':'並排看';document.querySelector('.viewer-footer').hidden=state.parallel;status.textContent=state.parallel?'已切換並排對比。':'已切換滑動對比。';});
document.querySelector('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await viewer.requestFullscreen();}catch{status.textContent='可使用瀏覽器縮放或下載對比圖檢視。';}});
document.addEventListener('fullscreenchange',()=>{for(const img of images)img.sizes=document.fullscreenElement?'100vw':imageSizes;});
const dataReady=window.ecologyComparisonData?Promise.resolve(window.ecologyComparisonData):fetch('assets/comparison-directions-v2.json').then(response=>{if(!response.ok)throw new Error('Data unavailable');return response.json();});
dataReady.then(data=>{state.data=data;drawRoutes();}).catch(()=>{routeToggle.checked=false;routeToggle.disabled=true;viewer.classList.remove('show-routes');status.textContent='模型可正常比較，方向示意暫時未能載入。';});
