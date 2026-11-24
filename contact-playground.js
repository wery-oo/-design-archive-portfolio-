(() => {
  // Fill in confirmed addresses here. Empty values remain clearly marked drafts.
  const channels = [
    { key:'email', label:'EMAIL', name:'Email', value:'', color:'#ff4caa', x:12, y:27, r:-9 },
    { key:'phone', label:'PHONE', name:'电话', value:'', color:'#36d5f1', x:66, y:20, r:7 },
    { key:'github', label:'GITHUB', name:'GitHub', value:'', color:'#c7f34d', x:44, y:58, r:-5 },
    { key:'wechat', label:'WECHAT', name:'微信', value:'', color:'#34d476', x:17, y:69, r:8 },
    { key:'behance', label:'BEHANCE', name:'Behance', value:'', color:'#326cff', x:74, y:66, r:-8 },
    { key:'instagram', label:'INSTAGRAM', name:'Instagram / IG', value:'', color:'#ff762e', x:48, y:79, r:5 }
  ];
  const dialog = document.querySelector('.contact-playground');
  const cloud = document.querySelector('.contact-channel-cloud');
  const nodes = dialog.querySelector('.contact-play-nodes');
  const readout = dialog.querySelector('.contact-readout');
  const action = dialog.querySelector('.contact-action');
  const wireGroup = dialog.querySelector('.contact-wires g');
  let selected = null;
  const select = channel => {
    selected = channel;
    action.textContent = '复制';
    readout.style.setProperty('--signal', channel.color);
    readout.querySelector('span').textContent = `CHANNEL ${String(channels.indexOf(channel)+1).padStart(2,'0')} / ${channel.label}`;
    readout.querySelector('strong').textContent = channel.value || `${channel.name} 待填写`;
    readout.querySelector('p').textContent = channel.value ? '连接已就绪 / READY' : '账号确认后开放连接';
    action.hidden = !channel.value;
    nodes.querySelectorAll('button').forEach(button => button.classList.toggle('is-active',button.dataset.channel === channel.key));
  };
  window.openContactPlayground = channel => {
    if (!dialog.open) dialog.showModal();
    dialog.classList.remove('is-live');
    requestAnimationFrame(() => { dialog.classList.add('is-live'); drawWires(); });
    if (channel) select(channel);
  };
  const drawWires = () => {
    const box = dialog.getBoundingClientRect();
    const read = readout.getBoundingClientRect();
    const cx = read.left-box.left+read.width/2, cy = read.top-box.top+read.height/2;
    wireGroup.replaceChildren(...[...nodes.children].map(node => {
      const rect = node.getBoundingClientRect();
      const x = rect.left-box.left+rect.width/2, y = rect.top-box.top+rect.height/2;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${x} ${y} H ${(cx+x)/2} V ${cy} H ${cx}`);
      path.setAttribute('stroke',node.style.getPropertyValue('--signal'));
      return path;
    }));
  };
  channels.forEach((channel,i) => {
    const link = document.createElement('button');
    link.className = `contact-channel contact-channel-${channel.key}`;
    link.style.setProperty('--signal',channel.color);
    link.innerHTML = `<small>0${i+1} / ${channel.name}</small><strong>${channel.label} ↗</strong><span>${channel.value || '待填写 / NOT CONNECTED'}</span>`;
    link.addEventListener('click',()=>window.openContactPlayground(channel));
    cloud?.append(link);
    const node = document.createElement('button');
    node.className = 'contact-node'; node.dataset.channel = channel.key;
    node.style.cssText = `--signal:${channel.color};--r:${channel.r}deg;left:${channel.x}%;top:${channel.y}%;--delay:${i*65}ms`;
    node.innerHTML = `<small>0${i+1} / CONNECT</small><strong>${channel.label}</strong><span>↗</span>`;
    nodes.append(node);
    let drag = null, moved = false;
    node.addEventListener('pointerdown',event => {
      drag = {x:event.clientX,y:event.clientY,left:node.offsetLeft,top:node.offsetTop}; moved = false;
      node.setPointerCapture(event.pointerId); node.classList.add('is-held');
    });
    node.addEventListener('pointermove',event => {
      if (!drag) return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
      node.style.left = `${Math.max(10,Math.min(dialog.clientWidth-node.offsetWidth-10,drag.left+dx))}px`;
      node.style.top = `${Math.max(75,Math.min(dialog.clientHeight-node.offsetHeight-55,drag.top+dy))}px`;
      drawWires();
    });
    node.addEventListener('pointerup',()=>{drag=null;node.classList.remove('is-held');});
    node.addEventListener('pointercancel',()=>{drag=null;node.classList.remove('is-held');});
    node.addEventListener('click',()=>{if(!moved)select(channel);});
  });
  action.addEventListener('click', async () => {
    if(!selected?.value)return;
    try { await navigator.clipboard.writeText(selected.value); action.textContent='已复制 ✓'; }
    catch { action.textContent='请选择上方文字复制'; }
  });
  document.querySelector('.contact-play-open')?.addEventListener('click',()=>window.openContactPlayground());
  dialog.querySelector('.contact-play-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('.contact-reset').addEventListener('click',()=>{
    [...nodes.children].forEach((node,i)=>{node.style.left=`${channels[i].x}%`;node.style.top=`${channels[i].y}%`;}); drawWires();
  });
  window.addEventListener('resize',()=>{if(dialog.open)drawWires();});
})();
