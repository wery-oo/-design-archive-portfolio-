(() => {
  const dialog = document.querySelector('.contact-playground');
  if (!dialog) return;
  const channels = [
    { key:'email', label:'EMAIL', value:'', x:8, y:26 },
    { key:'phone', label:'PHONE', value:'', x:61, y:19 },
    { key:'github', label:'GITHUB', value:'', x:37, y:46 },
    { key:'wechat', label:'WECHAT', value:'', x:11, y:70 },
    { key:'behance', label:'BEHANCE', value:'', x:71, y:61 },
    { key:'instagram', label:'INSTAGRAM', value:'', x:48, y:81 }
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  dialog.classList.add('ascii-contact');
  dialog.innerHTML = `<header class="contact-play-head"><span>DESIGN ARCHIVE® / CONNECTION ARCHIVE</span><button type="button" class="contact-play-close">关闭 ×</button></header>
    <h2 id="contact-play-title" class="contact-accessible-title">LET’S TALK — 联系方式</h2>
    <canvas class="contact-ascii-art" aria-hidden="true"></canvas>
    <p class="contact-ascii-invitation">LET’S TALK_<span>选择一个频道，留下连接。</span></p>
    <div class="contact-play-nodes" aria-label="联系频道"></div>
    <section class="contact-readout" aria-live="polite" hidden><span></span><strong></strong><p></p><button class="contact-action" type="button" hidden>复制</button><button class="contact-detail-close" type="button" aria-label="收起频道">收起 −</button></section>
    <footer class="contact-play-foot"><span>OUTSIDE = PERSONALITY / INSIDE = SYSTEM</span><span>06 CHANNELS / OPEN TO CONNECT</span></footer>`;
  const canvas = dialog.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const sample = document.createElement('canvas');
  const ink = sample.getContext('2d', {willReadFrequently:true});
  const nodes = dialog.querySelector('.contact-play-nodes');
  const readout = dialog.querySelector('.contact-readout');
  const action = readout.querySelector('.contact-action');
  let selected = null, frame = 0, width = 0, height = 0, started = 0, last = 0;
  let points = [];
  const pointer = {x:-9999,y:-9999};
  const glyphs = 'Xx+=-';
  const timers = new Map();

  function decode(button, label) {
    clearInterval(timers.get(button));
    if (reduced.matches) return;
    let tick = 0;
    const text = button.querySelector('strong');
    const timer = setInterval(() => {
      text.textContent = Array.from(label).map((c,i) => i < tick / 2 ? c : glyphs[(i+tick)%5]).join('');
      if (tick++ > label.length * 2) { clearInterval(timer); text.textContent = label; }
    }, 28);
    timers.set(button, timer);
  }
  function resize() {
    width = dialog.clientWidth; height = dialog.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width*dpr; canvas.height = height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    sample.width = 176; sample.height = 76;
    ink.clearRect(0,0,176,76);
    ink.fillStyle = '#000'; ink.font = '900 46px Arial';
    ink.textAlign = 'center';
    ink.fillText('CON',88,35); ink.fillText('TACT',88,73);
    const pixels = ink.getImageData(0,0,176,76).data;
    const cell = Math.min(width*.9/176, height*.65/76);
    const left = (width - cell*176)/2;
    const top = height*.22;
    points = [];
    for(let y=0;y<76;y++) for(let x=0;x<176;x++) {
      const alpha = pixels[(y*176+x)*4+3]/255;
      if(alpha > .15) points.push({x:left+x*cell,y:top+y*cell,alpha,glyph:glyphs[(x*3+y*7)%5],cell});
    }
    if (selected) placeReadout(selected);
    draw(performance.now());
  }
  function draw(time) {
    ctx.clearRect(0,0,width,height);
    const reveal = reduced.matches ? 1 : Math.min(1,(time-started)/950);
    const bounds = !readout.hidden ? readout.getBoundingClientRect() : null;
    const base = dialog.getBoundingClientRect();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(const p of points) {
      const distance = Math.hypot(p.x-pointer.x,p.y-pointer.y);
      const wave = reduced.matches ? 0 : Math.max(0,1-distance/125);
      const angle = Math.atan2(p.y-pointer.y,p.x-pointer.x);
      const inside = bounds && p.x > bounds.left-base.left-20 && p.x < bounds.right-base.left+20 && p.y > bounds.top-base.top-20 && p.y < bounds.bottom-base.top+20;
      ctx.globalAlpha = p.alpha * (inside ? .035 : .72) * Math.max(0,Math.min(1,reveal*2-p.x/width));
      ctx.fillStyle = wave > .2 ? '#008ab3' : '#101315';
      ctx.font=`400 ${Math.max(3,p.cell*.98)}px "Courier New",monospace`;
      const glyph = reveal<.98 && (p.x+p.y)%7>3 ? glyphs[Math.floor(time/65+p.x)%5] : p.glyph;
      ctx.fillText(glyph,p.x+Math.cos(angle)*wave*14,p.y+Math.sin(angle)*wave*14);
    }
    ctx.globalAlpha=1;
  }
  function loop(time) {
    frame=0;
    if(!dialog.open || document.hidden) return;
    if(time-last>32) {draw(time);last=time;}
    if(!reduced.matches) frame=requestAnimationFrame(loop);
  }
  function placeReadout(channel) {
    if(width<700) {readout.style.left='6vw';readout.style.top='auto';return;}
    const node=nodes.querySelector(`[data-channel="${channel.key}"]`);
    readout.style.left=`${Math.min(width-350,Math.max(24,node.offsetLeft))}px`;
    readout.style.top=`${Math.min(height-240,node.offsetTop+55)}px`;
  }
  function collapse() {
    selected=null; readout.hidden=true;
    nodes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded','false'));
    draw(performance.now());
  }
  function select(channel) {
    if(selected===channel) {collapse();return;}
    selected=channel;
    nodes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.channel===channel.key)));
    readout.querySelector('span').textContent=`[ ${String(channels.indexOf(channel)+1).padStart(2,'0')} / ${channel.label} ]`;
    readout.querySelector('strong').textContent=channel.value || '—';
    readout.querySelector('p').textContent=channel.value ? '连接已就绪' : '联系方式待填写';
    action.hidden=!channel.value;
    readout.hidden=false; placeReadout(channel);
    if(window.gsap && !reduced.matches) gsap.fromTo(readout,{opacity:0,y:9},{opacity:1,y:0,duration:.35,ease:'power3.out',overwrite:true});
    draw(performance.now());
  }
  channels.forEach((channel,i)=>{
    const node=document.createElement('button');
    node.type='button';node.className='contact-node';node.dataset.channel=channel.key;
    node.style.setProperty('--node-x',`${channel.x}%`);node.style.setProperty('--node-y',`${channel.y}%`);
    node.setAttribute('aria-label',channel.label);node.setAttribute('aria-expanded','false');
    node.innerHTML=`<small>[ 0${i+1} ]</small><strong>${channel.label}</strong><span>+</span>`;
    node.addEventListener('pointerenter',()=>decode(node,channel.label));
    node.addEventListener('focus',()=>decode(node,channel.label));
    node.addEventListener('click',()=>select(channel));nodes.append(node);
  });
  window.openContactPlayground = channel => {
    if(!dialog.open) dialog.showModal();
    collapse();started=performance.now();resize();
    cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);
    const found=channels.find(c=>c.key===(typeof channel==='string'?channel:channel?.key));
    if(found)select(found);
  };
  dialog.addEventListener('pointermove',event=>{const rect=dialog.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;});
  dialog.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-9999;});
  dialog.querySelector('.contact-play-close').addEventListener('click',()=>dialog.close());
  readout.querySelector('.contact-detail-close').addEventListener('click',()=>{const key=selected?.key;collapse();nodes.querySelector(`[data-channel="${key}"]`)?.focus();});
  dialog.addEventListener('close',()=>{
    cancelAnimationFrame(frame); frame=0; timers.forEach(clearInterval); timers.clear();
    channels.forEach(channel=>{nodes.querySelector(`[data-channel="${channel.key}"] strong`).textContent=channel.label;});
    pointer.x=pointer.y=-9999;
  });
  action.addEventListener('click',async()=>{if(!selected?.value)return;try{await navigator.clipboard.writeText(selected.value);action.textContent='已复制';}catch{action.textContent='请选择文字复制';}});
  addEventListener('resize',()=>{if(dialog.open)resize();});
  document.addEventListener('visibilitychange',()=>{if(dialog.open&&!document.hidden&&!frame)frame=requestAnimationFrame(loop);});
  reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;if(dialog.open)frame=requestAnimationFrame(loop);});
})();
