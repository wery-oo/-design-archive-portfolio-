(() => {
  const list = document.querySelector('.scroll-work-list');
  if (!list) return;
  const specimens = [...document.querySelectorAll('.work-specimen-stage img')];
  function showSpecimen(index) {
    specimens.forEach((image, position) => { image.hidden = position !== index; });
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map();
  const alphabet = 'Xx+=-';
  const symbolCache = new Map();
  function symbolWord(word) {
    if (symbolCache.has(word)) return symbolCache.get(word);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently:true });
    ctx.font = '700 96px Arial';
    canvas.width = Math.ceil(ctx.measureText(word).width) + 8;
    canvas.height = 112;
    ctx.font = '700 96px Arial'; ctx.fillStyle = '#000';
    ctx.fillText(word, 4, 86);
    const pixels = ctx.getImageData(0,0,canvas.width,112).data;
    const rows=14, cols=Math.max(24,word.length*8), lines=[];
    for(let y=0;y<rows;y++) {
      let line='';
      for(let x=0;x<cols;x++) {
        const px=Math.min(canvas.width-1,Math.floor((x+.5)*canvas.width/cols));
        const py=Math.floor(14+(y+.5)*76/rows);
        const density=pixels[(py*canvas.width+px)*4+3];
        line+=density>180?((x+y)%3?'X':'x'):density>100?'+':density>45?'=':density>12?'-':' ';
      }
      lines.push(line);
    }
    const value=lines.join('\n');
    if(symbolCache.size>=128)symbolCache.delete(symbolCache.keys().next().value);
    symbolCache.set(word,value);return value;
  }
  function scramble(element, delay = 0) {
    if (reduced.matches) return;
    const original = element.dataset.original || element.textContent;
    element.dataset.original = original;
    const old = animations.get(element);
    if (old) cancelAnimationFrame(old);
    const start = performance.now() + delay;
    const chars = [...original];
    function frame(now) {
      const progress = Math.max(0, Math.min(1, (now - start) / 740));
      element.textContent = chars.map((char, i) => {
        if (/\s/.test(char) || i / chars.length < progress) return char;
        return alphabet[Math.floor(Math.random() * alphabet.length)];
      }).join('');
      if (progress < 1) animations.set(element, requestAnimationFrame(frame));
      else { element.textContent = original; animations.delete(element); }
    }
    animations.set(element, requestAnimationFrame(frame));
  }
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in-screen');
    entry.target.querySelectorAll('[data-decode]').forEach((el,i)=>scramble(el,i*45));
    reveal.unobserve(entry.target);
  }), { rootMargin:'0px 0px -5% 0px', threshold:0 });

  document.querySelectorAll('.archive-panel .project-row').forEach((source, index) => {
    const name = source.querySelector('strong').textContent.replace(/ 0[14]$/, '');
    const type = source.querySelector('span:not(.project-no)').textContent;
    const year = source.querySelector('time').textContent;
    const no = String(index + 1).padStart(2, '0');
    const item = document.createElement('li'); item.className = 'scroll-work';
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'scroll-work-button';
    button.setAttribute('aria-label', `${no} ${name}，${type}，${year}，查看占位档案`);
    const base = document.createElement('span'); base.className = 'work-base';
    [no,name,type,'ARCHIVE / DRAFT',year].forEach((text,i)=>{
      const span=document.createElement('span');span.textContent=text;span.dataset.decode='';span.dataset.original=text;
      span.className=['work-number','work-name','work-type','work-state','work-year'][i];base.append(span);
    });
    const flip=document.createElement('span');flip.className='work-flip';flip.setAttribute('aria-hidden','true');
    const inner=document.createElement('span');inner.className='work-flip-inner';
    const symbolTitle=document.createElement('pre');symbolTitle.className='work-symbol-title';
    symbolTitle.textContent=symbolWord(name);
    const track=document.createElement('span');track.className='work-marquee';
    const phrase=`${no}     ${name} ↗     ${type.toUpperCase()}     `;
    for(let i=0;i<2;i++) {
      const copy=document.createElement('span'); copy.className='work-marquee-copy';
      copy.classList.add('work-symbol-copy');
      copy.textContent=symbolWord(phrase.repeat(2)); track.append(copy);
    }
    inner.append(track,symbolTitle);flip.append(inner);button.append(base,flip);item.append(button);list.append(item);
    let flips=[];
    let symbolTimer;
    function titlePulse() {
      if(reduced.matches)return;
      clearTimeout(symbolTimer);
      item.classList.add('is-symbol-phase');
      // Same macro-letter decoding vocabulary as the cover, then resolve the name.
      let frame=0;
      const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      function pulse() {
        const progress=frame/7;
        const word=[...name].map((char,i)=>char===' '||i/name.length<progress?char:alphabet[Math.floor(Math.random()*26)]).join('');
        symbolTitle.textContent=symbolWord(word);
        frame++;
        if(frame<=7)symbolTimer=setTimeout(pulse,52);
        else {symbolTitle.textContent=symbolWord(name);item.classList.remove('is-symbol-phase');}
      }
      pulse();
    }
    function animateFlip(enter, fromTop) {
      const interrupted = flips.some(a => a.playState === 'running');
      const currentFlip = interrupted ? getComputedStyle(flip).transform : null;
      const currentInner = interrupted ? getComputedStyle(inner).transform : null;
      flips.forEach(a=>a.cancel());flips=[];
      if(reduced.matches){flip.style.transform=enter?'translateY(0)':'translateY(-101%)';return;}
      const direction=fromTop?-1:1;
      const timing={duration:500,easing:'cubic-bezier(.215,.61,.355,1)',fill:'forwards'};
      if(enter) {
        flips.push(flip.animate([{transform:currentFlip || `translateY(${direction*101}%)`},{transform:'translateY(0)'}],timing));
        flips.push(inner.animate([{transform:currentInner || `translateY(${-direction*100}%) scaleY(0)`},{transform:'translateY(0) scaleY(1)'}],timing));
      } else {
        flips.push(flip.animate([{transform:currentFlip || 'translateY(0)'},{transform:`translateY(${direction*101}%)`}],timing));
        flips.push(inner.animate([{transform:currentInner || 'translateY(0) scaleY(1)'},{transform:`translateY(${-direction*100}%) scaleY(0)`}],timing));
      }
      item.classList.toggle('is-hover',enter);
    }
    const upper=event=>event.clientY < button.getBoundingClientRect().top+button.clientHeight/2;
    button.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch')return;
      showSpecimen(index);
      animateFlip(true,upper(event));titlePulse();
    });
    button.addEventListener('pointerleave',event=>{
      if(document.activeElement!==button)animateFlip(false,upper(event));
    });
    button.addEventListener('focus',()=>{
      showSpecimen(index);
      animateFlip(true,true);titlePulse();
    });
    button.addEventListener('blur',()=>animateFlip(false,true));
    button.addEventListener('click',()=>{
      showSpecimen(index);
      openPanel('work'); source.focus();
    });
    reveal.observe(item);
  });
  // Fit only exceptionally long names; keep the shared size and column starts.
  const measure = document.createElement('canvas').getContext('2d');
  function fitWorkNames() {
    list.querySelectorAll('.work-name').forEach(name => {
      const style = getComputedStyle(name);
      const text = name.dataset.original;
      measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const tracking = parseFloat(style.letterSpacing) || 0;
      const width = measure.measureText(text).width + Math.max(0, [...text].length - 1) * tracking;
      name.style.setProperty('--name-scale', String(Math.min(1, Math.max(.62, (name.clientWidth - 12) / Math.max(width, 1)))));
    });
  }
  document.fonts.ready.then(fitWorkNames);
  new ResizeObserver(fitWorkNames).observe(list);
})();
