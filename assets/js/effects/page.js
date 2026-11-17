(()=>{'use strict';const page=document.querySelector('.hn-page'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),nav=document.querySelector('.hn-nav'),menu=nav.querySelector('.hn-menu');
function close(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const on=nav.classList.toggle('open');menu.setAttribute('aria-expanded',on)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menu.focus()}});document.addEventListener('click',e=>{if(!nav.contains(e.target))close()});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));

// Behaviors only below/outside the original hero.
page.querySelectorAll('h2[data-reveal]').forEach(h=>{const lines=h.innerHTML.split(/<br\s*\/?\s*>/i);h.innerHTML=lines.map((l,i)=>`<span class="line-wrap" style="--line:${i}"><span>${l}</span></span>`).join('')});

// Scroll-linked reveals: identical path in both directions, with no one-shot observer.
const reveals=[...page.querySelectorAll('[data-reveal]')];
function revealAtScroll(vh){reveals.forEach(el=>{const r=el.getBoundingClientRect(),previous=Number(el.style.getPropertyValue('--reveal')||1),top=r.top-(el.dataset.reveal==='rise'&&!reduce.matches?(1-previous)*38:0),distance=Math.min(230,vh*.28),start=vh*.96;const value=reduce.matches?1:Math.max(0,Math.min(1,(start-top)/distance));el.style.setProperty('--reveal',value.toFixed(4));el.querySelectorAll('.line-wrap>span').forEach((line,i)=>{const p=reduce.matches?1:Math.max(0,Math.min(1,(start-top-i*24)/distance));line.style.setProperty('--line-reveal',p.toFixed(4))});});}
[...page.querySelectorAll('.button,.glass,.price-card,.plan-link,.circle,.pmoc-step,.pmoc-glass-note'),...nav.querySelectorAll('#hn-links a')].forEach(el=>el.addEventListener('pointermove',e=>{if(reduce.matches||e.pointerType==='touch')return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${e.clientX-r.left}px`);el.style.setProperty('--my',`${e.clientY-r.top}px`)},{passive:true}));
const scene=page.querySelector('.sensations'),photos=[...page.querySelectorAll('.orbit figure')],visual=page.querySelector('.service-visual'),about=page.querySelector('.about-photo');let queued=false;
function render(){queued=false;nav.classList.toggle("hn-scrolled",scrollY>90);const vh=innerHeight;revealAtScroll(vh);const r=scene.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(vh-r.top)/(vh+r.height)));photos.forEach((el,i)=>{const angle=i*Math.PI/2+(reduce.matches?.15:progress*1.5),mobile=innerWidth<700,x=Math.cos(angle)*(mobile?150:Math.min(innerWidth*.34,500)),y=Math.sin(angle)*(mobile?180:195),scale=.78+(Math.sin(angle)+1)*.1;el.style.transform=`translate3d(${x}px,${y-65}px,0) rotate(${Math.cos(angle)*7}deg) scale(${scale})`;el.style.opacity=mobile?'.28':'.56'});if(!reduce.matches){[visual,about,page.querySelector(".pmoc-scene")].forEach(el=>{const b=el.getBoundingClientRect();if(b.bottom>0&&b.top<vh)el.style.setProperty('--photo-y',`${(b.top-vh*.3)*-.045}px`)});const b=visual.getBoundingClientRect();visual.style.setProperty('--clip',`${Math.max(0,Math.min(6,(b.top/vh-.18)*9))}%`)}}
function tick(){if(!queued){queued=true;requestAnimationFrame(render)}}addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);reduce.addEventListener('change',tick);render();

// Use the supplied full logo in the footer, without image filtering.
const original=document.querySelector('.hero .brand img'),footer=page.querySelector('footer .brand img');if(original&&footer)footer.src=original.src;
})();
