/* Matched Rhino images; schematic corridor bands, not measured bird tracking.
   DESIGN_VARIANCE 5 / MOTION_INTENSITY 4 / VISUAL_DENSITY 2.
   Native Canvas isolates flight motion from the existing comparison controls. */
(() => {
  'use strict';
  const root = document.querySelector('#corridor-animation');
  if (!root) return;
  const panels = [...root.querySelectorAll('canvas')];
  const play = root.querySelector('#flight-play');
  const replay = root.querySelector('#flight-replay');
  const scrub = root.querySelector('#flight-time');
  const clock = root.querySelector('#flight-clock');
  const phase = root.querySelector('#flight-phase');
  const overlay = root.querySelector('#flight-overlay');
  const feedback = root.querySelector('#flight-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 18, W = 1200, H = 605;
  const state = {time: 0, playing: !reduced.matches, visible: false, ready: false, bands: true};
  const pictures = {};
  let raf = 0, last = 0;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = t => t * t * (3 - 2 * t);
  const palette = {government: '#91aa86', proposal: '#b9de86'};
  // Centreline is the previously confirmed middle flight direction in main view.
  const points = [[936, 151.25], [840, 211.75], [708, 260.15], [588, 350.9]];
  function route(t) {
    const u = 1 - t;
    const x = u*u*u*points[0][0] + 3*u*u*t*points[1][0] + 3*u*t*t*points[2][0] + t*t*t*points[3][0];
    const y = u*u*u*points[0][1] + 3*u*u*t*points[1][1] + 3*u*t*t*points[2][1] + t*t*t*points[3][1];
    const dx = 3*u*u*(points[1][0]-points[0][0])+6*u*t*(points[2][0]-points[1][0])+3*t*t*(points[3][0]-points[2][0]);
    const dy = 3*u*u*(points[1][1]-points[0][1])+6*u*t*(points[2][1]-points[1][1])+3*t*t*(points[3][1]-points[2][1]);
    const d = Math.hypot(dx, dy);
    return {x, y, nx: -dy/d, ny: dx/d, heading: Math.atan2(dy, dx)};
  }
  function width(scheme, t) {
    const open = 18 + 87*smooth(t);
    // Different lateral spread communicates design intent, without false dimensions.
    return scheme === 'proposal' ? open : 18 + 16*t - 15*Math.sin(t*Math.PI)**2;
  }
  function band(ctx, scheme) {
    ctx.save();
    ctx.beginPath();
    for (let side = 1; side >= -1; side -= 2) {
      for (let i = 0; i <= 48; i++) {
        const t = side === 1 ? i/48 : 1-i/48;
        const p = route(t), w = width(scheme,t);
        const x=p.x+p.nx*w*side, y=p.y+p.ny*w*side;
        if (side === 1 && i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
    }
    ctx.closePath(); ctx.fillStyle = palette[scheme]; ctx.globalAlpha = .17; ctx.fill();
    ctx.globalAlpha = .65; ctx.strokeStyle = palette[scheme]; ctx.lineWidth = 1.2; ctx.setLineDash([5,7]);
    for (const side of [-1,1]) {
      ctx.beginPath();
      for(let i=0;i<=48;i++) {const t=i/48,p=route(t),w=width(scheme,t);const x=p.x+p.nx*w*side,y=p.y+p.ny*w*side;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.stroke();
    }
    ctx.restore();
  }
  function bird(ctx, x, y, angle, size, time, seed, opacity) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(size,size);
    ctx.globalAlpha=opacity; ctx.fillStyle='#f7fbf1'; ctx.strokeStyle='#254634'; ctx.lineWidth=.07; ctx.lineJoin='round';
    // Irregular flapping interspersed with glides; each bird has its own phase.
    const glide=Math.sin(time*.74+seed*2.1)>.36;
    const beat=glide ? .15 : Math.sin(time*(4.9+seed*.06)+seed*2.37);
    const span=1.08+.18*beat, sweep=.18+.22*beat;
    ctx.beginPath();ctx.moveTo(.28,0);
    ctx.bezierCurveTo(.02,-.25,-.2,-span,-.61,-span);
    ctx.quadraticCurveTo(-.33,-.55,-.1,-.18);ctx.lineTo(-.39,-.08);
    ctx.quadraticCurveTo(-.08,-.03,.28,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(.28,0);
    ctx.bezierCurveTo(.02,.25,-.2+sweep,span,-.61+sweep,span);
    ctx.quadraticCurveTo(-.33,.55,-.1,.18);ctx.lineTo(-.39,.08);
    ctx.quadraticCurveTo(-.08,.03,.28,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(-.03,0,.33,.095,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(.2,0);ctx.quadraticCurveTo(.39,-.025,.51,-.005);ctx.lineWidth=.10;ctx.strokeStyle='#f7fbf1';ctx.stroke();
    ctx.beginPath();ctx.moveTo(.5,0);ctx.lineTo(.75,0);ctx.lineWidth=.055;ctx.strokeStyle='#243a30';ctx.stroke();
    ctx.beginPath();ctx.moveTo(-.3,-.03);ctx.lineTo(-.53,-.045);ctx.moveTo(-.3,.03);ctx.lineTo(-.52,.045);ctx.lineWidth=.035;ctx.stroke();
    ctx.restore();
  }
  function drawScene(ctx, scheme, time, withBands=state.bands) {
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#edf2e8';ctx.fillRect(0,0,W,H);
    ctx.drawImage(pictures[scheme],0,0,W,H);
    ctx.fillStyle='rgba(246,250,240,.10)';ctx.fillRect(0,0,W,H);
    if(withBands)band(ctx,scheme);
    for(let flock=0;flock<3;flock++)for(let i=0;i<9;i++) {
      const seed=flock*9+i;
      const t=clamp((time-1.25-flock*1.2-i*.11)/12.1);
      const p=route(t), half=width(scheme,t);
      const row=Math.ceil(i/2), side=i===0?0:(i%2===0?-1:1);
      const spread=(side*row/4*.69+(flock-1)*.12)*half;
      const sway=Math.sin(time*.68+seed*1.7)*(1.2+2*t);
      const along=-row*(2+4*t);
      const x=p.x+p.nx*(spread+sway)+Math.cos(p.heading)*along;
      const y=p.y+p.ny*(spread+sway)+Math.sin(p.heading)*along;
      const visibility=smooth(clamp((time-1-flock*1.2-i*.11)/.8))*smooth(clamp((17.8-time)/1.1));
      if(visibility>0)bird(ctx,x,y,p.heading+.035*Math.sin(time*.57+seed),4.1+4.9*t,time,seed,visibility);
    }
  }
  const contexts=panels.map(c=>c.getContext('2d'));
  function draw(time=state.time) {
    if(!state.ready)return;
    contexts.forEach((ctx,i)=>drawScene(ctx,panels[i].dataset.scheme,time));
    scrub.value=String(Math.round(time*100));
    clock.textContent=String(Math.floor(time)).padStart(2,'0')+' / 18 秒';
    phase.textContent=time<4?'從河套方向飛來':time<12.7?'穿越建築之間的通道':'抵達三寶樹濕地前緣';
    root.dataset.phase=time<4?'approach':time<12.7?'passage':'arrival';
    root.dataset.time=time.toFixed(3);
  }
  function buttonState(){play.textContent=state.playing?'暫停':'播放';play.setAttribute('aria-pressed',String(state.playing));}
  function tick(now){
    raf=0;
    if(state.playing&&state.visible&&!document.hidden&&state.ready){
      if(last)state.time=(state.time+Math.min((now-last)/1000,.1))%duration;
      draw();last=now;raf=requestAnimationFrame(tick);
    }else last=0;
  }
  function schedule(){if(!raf&&state.playing&&state.visible&&!document.hidden&&state.ready)raf=requestAnimationFrame(tick);}
  function setPlaying(value){state.playing=value;buttonState();last=0;if(!value&&raf){cancelAnimationFrame(raf);raf=0;}schedule();}
  play.addEventListener('click',()=>setPlaying(!state.playing));
  replay.addEventListener('click',()=>{state.time=0;draw();setPlaying(true);});
  scrub.addEventListener('input',()=>{setPlaying(false);state.time=Number(scrub.value)/100;draw();});
  overlay.addEventListener('change',()=>{state.bands=overlay.checked;draw();});
  document.addEventListener('visibilitychange',()=>{last=0;schedule();});
  reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});
  const observer=new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;last=0;schedule();},{threshold:.08});
  observer.observe(root);
  window.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);observer.disconnect();},{once:true});
  buttonState();
  async function load(){
    root.dataset.ready='loading';feedback.textContent='正在載入兩方案模型…';
    try{
      await Promise.all(['government','proposal'].map(scheme=>new Promise((resolve,reject)=>{
        const img=new Image();img.onload=()=>{pictures[scheme]=img;resolve();};img.onerror=()=>reject(new Error('模型圖未能載入'));img.src='assets/'+scheme+'-main.webp';
      })));
      state.ready=true;root.dataset.ready='true';feedback.textContent='';
      if(reduced.matches)state.time=9;draw();schedule();
    }catch(error){root.dataset.ready='error';feedback.textContent='模型圖暫未能載入，請重新載入動畫。';play.disabled=true;}
  }
  root.querySelector('#flight-retry').addEventListener('click',()=>{play.disabled=false;load();});
  // Deterministic renderer shared by the live player and downloadable film.
  window.corridorFilm={duration, get ready(){return state.ready;},
    seek(time){setPlaying(false);state.time=clamp(time,0,duration);draw();},
    renderFrame(target,time){
      const ctx=target.getContext('2d'),S=target.width/2400;
      ctx.save();ctx.scale(S,S);ctx.fillStyle='#f8faf4';ctx.fillRect(0,0,2400,1050);
      ctx.fillStyle='#173e27';ctx.font='600 52px Microsoft JhengHei, sans-serif';ctx.fillText('讓候鳥，有更寬敞的通道。',60,86);
      ctx.fillStyle='#52674d';ctx.font='24px Microsoft JhengHei, sans-serif';ctx.fillText('河套 → 三寶樹濕地   ·   同一模型視角，同步飛行方向',62,133);
      for(const [i,scheme]of ['government','proposal'].entries()){
        const x=i?1220:40;ctx.fillStyle=scheme==='proposal'?'#28703e':'#52674d';ctx.font='600 32px Microsoft JhengHei, sans-serif';ctx.fillText(i?'我的方案':'政府方案',x+8,204);
        ctx.save();ctx.translate(x,233);ctx.scale(1140/1200,1140/1200);drawScene(ctx,scheme,time,true);ctx.restore();
        ctx.fillStyle=scheme==='proposal'?'#28703e':'#52674d';ctx.font='28px Microsoft JhengHei, sans-serif';ctx.fillText(i?'更大的三寶樹濕地，更開敞的入口':'建築逼近濕地前緣，入口收窄',x+8,866);
      }
      ctx.fillStyle='#d7e2cc';ctx.fillRect(48,909,2304,1);ctx.fillStyle='#173e27';ctx.font='28px Microsoft JhengHei, sans-serif';ctx.fillText(time<4?'從河套方向飛來':time<12.7?'穿越建築之間的通道':'抵達三寶樹濕地前緣',56,961);
      ctx.textAlign='right';ctx.fillStyle='#52674d';ctx.font='22px Microsoft JhengHei, sans-serif';ctx.fillText('通道與飛行為設計示意 · 非生態模擬',2344,961);ctx.restore();
    }
  };
  load();
})();
