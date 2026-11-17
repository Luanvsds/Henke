(() => {
  'use strict';

  // A imagem de fundo e a textura WebGL compartilham exatamente o mesmo asset.
  // A MESMA textura compõe o fundo CSS e o WebGL, em dois enquadramentos responsivos.
  const DESKTOP_IMAGE = window.HENKE_HERO_IMAGE || new URL('assets/fundo-henke.jpg', document.baseURI).href;
  const MOBILE_IMAGE = window.HENKE_HERO_IMAGE_MOBILE || new URL('assets/fundo-henke-mobile.jpg', document.baseURI).href;
  const mobileView = matchMedia('(max-width:680px)');
  const hero = document.querySelector('.hero-panel');
  const layer = document.querySelector('.fluid-layer');
  const canvas = document.querySelector('#fluidCanvas');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (/^https?:/i.test(source)) image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Imagem de fundo indisponível'));
      image.src = source;
    });
  }

  async function boot() {
    let fluid = null;
    let requestIndex = 0;
    // A película de gelo desenha ramos reais sobre a MESMA área da distorção.
    // Não interfere na navegação nem no tamanho aprovado do efeito WebGL.
    if (!reduceMotion) new IceTrail();

    async function updateImage() {
      const token = ++requestIndex;
      const source = mobileView.matches ? MOBILE_IMAGE : DESKTOP_IMAGE;
      try {
        const image = await loadImage(source);
        if (token !== requestIndex) return;
        document.documentElement.style.setProperty('--hero-image', `url("${source}")`);
        if (reduceMotion) return;
        if (fluid) fluid.replaceImage(image);
        else fluid = new FluidHero(image);
      } catch (error) {
        // O fundo CSS e o gelo 2D continuam funcionando sem WebGL.
        console.warn('Henke: WebGL indisponível. Mantendo o fundo e a geada interativa.', error.message);
        layer.classList.add('is-ready');
      }
    }

    await updateImage();
    if (mobileView.addEventListener) mobileView.addEventListener('change', updateImage);
    else mobileView.addListener(updateImage);
  }

  /**
   * V15 — GLAZE ICE: água líquida, frente de congelamento, solidificação e ruptura no segundo toque.
   * Não utiliza placas poligonais, círculos esbranquiçados ou flocos
   * de neve repetidos. Cada célula usa ramificações orgânicas de
   * cristais de gelo, vaporização delicada e microagulhas translúcidas.
   * A física WebGL sob esta camada continua IGUAL à V12.
   */
  /**
   * ICE PHASE TRANSITION / V15
   * Physical reference: fast lateral crystal front -> slow freezing of the
   * remaining liquid, with ice domains and trapped bubbles. No snowflake art.
   * The film remains visibly solid until the pointer returns and fractures it.
   */
  class IceTrail {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ice-trail';
      this.canvas.setAttribute('aria-hidden', 'true');
      document.querySelector('.fluid-frame').appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d', {alpha: true});
      if (!this.ctx) return;
      this.surfaces = Array.from({length: 14}, (_, i) => this.createIceSurface(i));
      this.patches = [];
      this.last = null;
      this.count = 0;
      this.size = {width: 0, height: 0};
      this.resize();

      const move = e => {
        if (e.pointerType === 'touch' || (e.target.closest && e.target.closest('a'))) return;
        this.pointer(e.clientX, e.clientY, e.type === 'pointerdown');
      };
      hero.addEventListener('pointermove', move, {passive: true});
      hero.addEventListener('pointerdown', move, {passive: true});
      hero.addEventListener('pointerleave', () => this.last = null);
      hero.addEventListener('touchstart', e => {
        if (e.touches.length) this.pointer(e.touches[0].clientX, e.touches[0].clientY, true);
      }, {passive: true});
      hero.addEventListener('touchmove', e => {
        if (e.touches.length) this.pointer(e.touches[0].clientX, e.touches[0].clientY, false);
      }, {passive: true});
      hero.addEventListener('touchend', () => this.last = null, {passive: true});
      hero.addEventListener('touchcancel', () => this.last = null, {passive: true});
      window.addEventListener('blur', () => this.last = null);
      window.addEventListener('resize', () => this.resize(), {passive: true});
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(layer);
      layer.classList.add('is-ready');
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    rand(seed) {
      let state = (seed * 2654435761) >>> 0;
      return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }
    createIceSurface(id) {
      const c = document.createElement('canvas');
      c.width = c.height = 320;
      const g = c.getContext('2d');
      const rand = this.rand(id + 29);
      g.translate(160, 160);

      // A smooth translucent bulk layer of clear glaze ice.
      const bulk = g.createRadialGradient(-31, -39, 8, 0, 0, 155);
      bulk.addColorStop(0, 'rgba(230,250,255,.65)');
      bulk.addColorStop(.28, 'rgba(190,239,255,.63)');
      bulk.addColorStop(.70, 'rgba(114,204,240,.49)');
      bulk.addColorStop(.88, 'rgba(70,159,218,.24)');
      bulk.addColorStop(1, 'rgba(77,184,238,0)');
      g.fillStyle = bulk;
      g.fillRect(-160, -160, 320, 320);

      // Irregular interlocking crystal domains, never six-point snowflakes.
      for (let i = 0; i < 30; i++) {
        const a = rand() * Math.PI * 2;
        const d = (rand() ** .7) * 125;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        const side = 12 + rand() * 34;
        const skew = rand() * Math.PI * 2;
        g.beginPath();
        for (let j = 0; j < 5; j++) {
          const ang = skew + j * 2 * Math.PI / 5;
          const rr = side * (.6 + rand() * .58);
          if (j === 0) g.moveTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
          else g.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
        }
        g.closePath();
        g.fillStyle = i % 3 === 0 ? 'rgba(247,253,255,.13)' : 'rgba(110,215,255,.07)';
        g.fill();
        g.lineWidth = .7 + rand() * .8;
        g.strokeStyle = i % 3 === 0 ? 'rgba(237,251,255,.48)' : 'rgba(122,210,247,.37)';
        g.stroke();
      }

      // Hairline interfaces between crystal grains.
      for (let j = 0; j < 18; j++) {
        const a = rand() * Math.PI * 2;
        const d = 8 + rand() * 112;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        const direction = rand() * Math.PI * 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(direction) * (20 + rand() * 42), y + Math.sin(direction) * (20 + rand() * 42));
        g.lineWidth = .6 + rand() * .65;
        g.strokeStyle = 'rgba(242,253,255,.32)';
        g.stroke();
      }

      // Air inclusions: small dark bubbles with specular crescent rims.
      for (let j = 0; j < 76; j++) {
        const a = rand() * Math.PI * 2;
        const d = (rand() ** .58) * 123;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        const r = .7 + rand() * 2.5;
        g.fillStyle = 'rgba(21,89,137,.22)';
        g.beginPath();g.arc(x, y, r, 0, Math.PI * 2);g.fill();
        g.strokeStyle = 'rgba(242,253,255,.54)';
        g.lineWidth = .65;
        g.beginPath();g.arc(x - .38, y - .32, r * .86, 2.7, 5.45);g.stroke();
      }

      // Fine broken refraction along the outer perimeter.
      for (let k = 0; k < 70; k++) {
        const a = rand() * Math.PI * 2, d = 102 + rand() * 38;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a+.35)*(2+rand()*8),y+Math.sin(a+.35)*(2+rand()*8));
        g.strokeStyle='rgba(211,250,255,.30)';g.lineWidth=.5+rand()*.8;g.stroke();
      }
      return c;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (width === this.canvas.width && height === this.canvas.height) return;
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.size = {width: rect.width, height: rect.height};
      this.patches = [];
      this.last = null;
    }

    pointer(cx, cy, clicked) {
      const bounds = layer.getBoundingClientRect();
      if (cx < bounds.left || cx > bounds.right || cy < bounds.top || cy > bounds.bottom) {
        this.last = null; return;
      }
      const p = {x: cx - bounds.left, y: cy - bounds.top};
      const now = performance.now();
      const previous = this.last;
      if (!previous) {
        this.touch(p.x, p.y, now, clicked);
        this.last = p;
        return;
      }
      const dx = p.x - previous.x, dy = p.y - previous.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 6 && !clicked) return;
      const steps = Math.min(22, Math.max(1, Math.ceil(distance / 16)));
      // If the line crosses existing solid ice, treat the whole gesture as
      // a strike: do not leave a new wet trail on the way to the old ice.
      const hit = this.patches.find(ice => ice.state === 'solid' &&
        this.distanceToSegment(ice.x, ice.y, previous.x,previous.y,p.x,p.y) < 65);
      if (hit) {
        hit.state='shattering';hit.hitTime=now;hit.hitX=p.x;hit.hitY=p.y;
        hit.hitAngle=Math.atan2(dy,dx);
        this.last=p;
        this.suppressUntil=now+520;
        return;
      }
      if (now < (this.suppressUntil||0)) {this.last=p;return;}
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        this.touch(previous.x + dx * t, previous.y + dy * t,
                   now, clicked && i === steps, Math.atan2(dy,dx));
      }
      this.last = p;
      if (this.patches.length > 78) this.patches.splice(0, this.patches.length - 78);
    }

    distanceToSegment(px,py,x1,y1,x2,y2) {
      const dx=x2-x1,dy=y2-y1;
      const len=dx*dx+dy*dy;
      const t=len>0 ? Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len)) : 0;
      return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
    }

    touch(x,y,time,clicked,angle=0) {
      // Critical: a second pass shatters existing SOLID ice, not a new flake.
      let hit = null;
      let closest = 76;
      for (const ice of this.patches) {
        if (ice.state === 'shattering') continue;
        const d = Math.hypot(x-ice.x,y-ice.y);
        if (d < closest && ice.state === 'solid') {closest=d;hit=ice;}
      }
      if (hit) {
        hit.state='shattering';hit.hitTime=time;hit.hitX=x;hit.hitY=y;hit.hitAngle=angle;
        // Neighboring solid domains crack too: rupture propagates locally.
        for (const ice of this.patches) {
          if (ice===hit || ice.state !== 'solid') continue;
          const d = Math.hypot(ice.x-hit.x,ice.y-hit.y);
          if (d < 58) {ice.state='shattering';ice.hitTime=time + d*2.2;ice.hitX=x;ice.hitY=y;ice.hitAngle=angle;}
        }
        return true;
      }
      // Do not paint again on top of water / actively freezing domains.
      for (const ice of this.patches) {
        if (ice.state==='shattering') continue;
        if (Math.hypot(x-ice.x,y-ice.y) < 62) return false;
      }
      const id = this.count++;
      this.patches.push({x,y,born:time,seed:id,state:'water',radius:clicked?110:98+(id%5-2)*2.5,
        sprite:id%this.surfaces.length,rotation:(id*1.61)%6.28,
        strength:clicked?1:.83+(id%3)*.055,
        hitTime:0,hitX:0,hitY:0,hitAngle:0,unfreezeAt:time+17500});
      return false;
    }

    // One advancing, non-round, uneven ice/water interface for each nucleus.
    icePath(ctx, r, grow, seed, phase=0) {
      const n=48;
      ctx.beginPath();
      for(let i=0;i<=n;i++) {
        const a=i*Math.PI*2/n;
        const serration=1+.08*Math.sin(a*7+seed*.7)+.065*Math.cos(a*13-seed*.33)+.035*Math.sin(a*23+seed*1.2);
        const d=r*Math.max(.02,grow)*serration;
        const x=Math.cos(a)*d, y=Math.sin(a)*d;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
    }

    drawLiquid(ctx, ice, age, strength=1) {
      const r=ice.radius;
      const movement=age/220;
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation*.2);
      const fade=Math.min(1,age/150)*strength;
      ctx.globalAlpha=fade;
      const film=ctx.createRadialGradient(-r*.20,-r*.25,2,0,0,r*1.05);
      film.addColorStop(0,'rgba(79,217,255,.12)');
      film.addColorStop(.44,'rgba(47,171,238,.20)');
      film.addColorStop(.74,'rgba(15,97,168,.20)');
      film.addColorStop(.94,'rgba(92,228,255,.06)');
      film.addColorStop(1,'rgba(87,213,255,0)');
      ctx.fillStyle=film;
      ctx.beginPath();ctx.ellipse(0,0,r*.98,r*.86,-.10,0,Math.PI*2);ctx.fill();
      // Distorted liquid specular arcs: subtle, animated, unmistakably wet.
      for(let j=0;j<3;j++) {
        const rr=r*(.24+j*.23+Math.sin(movement-j*.7)*.016);
        ctx.strokeStyle=`rgba(177,240,255,${(.10+.13*(3-j)/3)*Math.min(1,fade)})`;
        ctx.lineWidth=1.6-j*.24;
        ctx.beginPath();ctx.ellipse(-r*.05,r*.015,rr,rr*.69,-.10,-1.1+j*.30,1.55+j*.16);ctx.stroke();
      }
      ctx.strokeStyle=`rgba(187,249,255,${(.17*fade).toFixed(3)})`;
      ctx.lineWidth=1.1;
      ctx.beginPath();ctx.ellipse(-r*.03,r*.01,r*.92,r*.79,-.10,3.5,5.35);ctx.stroke();
      ctx.restore();
    }

    drawFreezing(ctx,ice,time) {
      const age=time-ice.born;
      // Phase 1: water remains liquid for first half second, then an ICE FRONT grows.
      const nucleus=Math.min(1,Math.max(0,(age-850)/1450));
      const fastFront=1-Math.pow(1-nucleus,2.15);
      const waterAlpha=1-.50*fastFront;
      this.drawLiquid(ctx,ice,age,waterAlpha);
      if(nucleus<=0) return;
      const r=ice.radius;
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      const radius=r*(.12+.88*fastFront);
      this.icePath(ctx,r,.12+.88*fastFront,ice.seed);
      ctx.clip();
      // First stage: branching translucent crystals form quickly at the moving boundary.
      ctx.globalAlpha=(.25+.30*nucleus)*ice.strength;
      ctx.drawImage(this.surfaces[ice.sprite],-r,-r,2*r,2*r);
      ctx.restore();
      // Thin, moving solidification line (the clearest indicator of a phase front).
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      this.icePath(ctx,r,.12+.88*fastFront,ice.seed);
      ctx.shadowColor='rgba(162,240,255,.86)';ctx.shadowBlur=8;
      ctx.strokeStyle=`rgba(224,252,255,${.20+.35*(1-nucleus*.2)})`;
      ctx.lineWidth=1.25;ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
      // Water still appears ahead of the front, while the middle crystallizes.
    }

    drawSolidifying(ctx,ice,time) {
      const age=time-ice.born;
      const t=Math.min(1,Math.max(0,(age-2300)/1900));
      const slow=1-Math.pow(1-t,1.75);
      const r=ice.radius;
      // Transition 2: remaining water becomes a solid glassy sheet with trapped bubbles.
      this.drawLiquid(ctx,ice,age,(1-t)*.48);
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      ctx.globalAlpha=ice.strength*(.40+.54*slow);
      this.icePath(ctx,r,1,ice.seed);ctx.clip();
      ctx.drawImage(this.surfaces[ice.sprite],-r,-r,2*r,2*r);
      // As the water freezes completely, the layer becomes harder, brighter and faceted.
      const fill=ctx.createLinearGradient(-r*.7,-r*.7,r*.6,r*.7);
      fill.addColorStop(0,`rgba(233,252,255,${(.10+.20*slow).toFixed(3)})`);
      fill.addColorStop(.56,`rgba(128,215,255,${(.04+.10*slow).toFixed(3)})`);
      fill.addColorStop(1,'rgba(49,159,233,0)');
      ctx.fillStyle=fill;ctx.fillRect(-r,-r,2*r,2*r);
      ctx.restore();
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      this.icePath(ctx,r,1,ice.seed);
      ctx.strokeStyle=`rgba(235,252,255,${(.32+.42*slow).toFixed(3)})`;
      ctx.lineWidth=1.3+slow*.5;ctx.shadowColor='rgba(126,220,255,.5)';ctx.shadowBlur=5;ctx.stroke();
      // moving light freezes into a stationary specular edge
      ctx.shadowBlur=0;ctx.restore();
    }

    drawSolid(ctx,ice,time) {
      const r=ice.radius;
      const fade=Math.min(1,(ice.unfreezeAt-time)/1750);
      if(fade<=0)return;
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      ctx.globalAlpha=ice.strength*.88*fade;
      this.icePath(ctx,r,1,ice.seed);ctx.clip();
      ctx.drawImage(this.surfaces[ice.sprite],-r,-r,2*r,2*r);
      // Solid transparent ice is not chalk white: retain blue refraction.
      const hard=ctx.createLinearGradient(-r,-r*.45,r,r);
      hard.addColorStop(0,'rgba(232,251,255,.21)');
      hard.addColorStop(.36,'rgba(128,212,250,.095)');
      hard.addColorStop(1,'rgba(50,141,220,.02)');
      ctx.fillStyle=hard;ctx.fillRect(-r,-r,2*r,2*r);
      ctx.restore();
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      this.icePath(ctx,r,1,ice.seed);
      ctx.strokeStyle=`rgba(217,250,255,${(.26*fade).toFixed(3)})`;
      ctx.lineWidth=1.25;ctx.stroke();ctx.restore();
    }

    drawBreaking(ctx,ice,time) {
      const dt=Math.max(0,time-ice.hitTime);
      const t=Math.min(1,dt/1080);
      const fade=1-t*t*(3-2*t);
      const r=ice.radius;
      // Phase 3 upon second pass: cracks radiate from the impact, then shards scatter.
      ctx.save();ctx.translate(ice.x,ice.y);ctx.rotate(ice.rotation);
      const pieces=9, sprite=this.surfaces[ice.sprite];
      const seed=ice.seed;
      for (let i=0;i<pieces;i++) {
        const a0=i*Math.PI*2/pieces, a1=(i+1)*Math.PI*2/pieces;
        const mid=(a0+a1)*.5;
        const scatter=r*(.015 + .25*t*t)*(1+.15*Math.sin(seed+i*4));
        ctx.save();
        ctx.translate(Math.cos(mid)*scatter+Math.cos(ice.hitAngle)*t*7,
                      Math.sin(mid)*scatter+Math.sin(ice.hitAngle)*t*7);
        ctx.rotate((i%2?-1:1)*t*.14);
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a0)*r*1.2,Math.sin(a0)*r*1.2);
        ctx.lineTo(Math.cos(mid)*r*1.22,Math.sin(mid)*r*1.22);
        ctx.lineTo(Math.cos(a1)*r*1.2,Math.sin(a1)*r*1.2);
        ctx.closePath();ctx.clip();
        ctx.globalAlpha=ice.strength*fade*.95;
        ctx.drawImage(sprite,-r,-r,r*2,r*2);
        ctx.restore();
      }
      ctx.restore();
      // Bright stress cracks rapidly branch from point of impact, then clear.
      ctx.save();ctx.translate(ice.hitX,ice.hitY);ctx.rotate(ice.hitAngle);
      ctx.globalAlpha=fade*(1-Math.max(0,t-.5));
      for(let j=0;j<11;j++) {
        const a=j*2*Math.PI/11+ice.seed*.18;
        const len=r*(.32+.62*t)*(1+.20*Math.sin(j*3.12));
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.lineTo(Math.cos(a)*len*.38,Math.sin(a)*len*.38);
        ctx.lineTo(Math.cos(a+.09)*len*.67,Math.sin(a+.09)*len*.67);
        ctx.lineTo(Math.cos(a-.045)*len,Math.sin(a-.045)*len);
        ctx.strokeStyle='rgba(242,253,255,.85)';ctx.lineWidth=1.0;ctx.stroke();
      }
      ctx.restore();
    }

    animate(now) {
      const ctx=this.ctx,{width,height}=this.size;
      if(!width||!height) {requestAnimationFrame(this.animate);return;}
      ctx.clearRect(0,0,width,height);
      // Keep solid ice visible until the user passes again (or a long natural fade).
      this.patches=this.patches.filter(ice =>
        ice.state==='shattering'?now-ice.hitTime<1080:now<ice.unfreezeAt);
      for (const ice of this.patches) {
        const age=Math.max(0,now-ice.born);
        if(ice.state!=='shattering') {
          if(age<2300)ice.state='freezing';
          else if(age<4200)ice.state='solidifying';
          else ice.state='solid';
        }
        if(ice.state==='freezing')this.drawFreezing(ctx,ice,now);
        else if(ice.state==='solidifying')this.drawSolidifying(ctx,ice,now);
        else if(ice.state==='solid')this.drawSolid(ctx,ice,now);
        else this.drawBreaking(ctx,ice,now);
      }
      requestAnimationFrame(this.animate);
    }
  }

  class FluidHero {
    constructor(photo) {
      this.photo = photo;
      this.imageAspect = photo.naturalWidth / photo.naturalHeight;
      this.gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: false,
        antialias: false, stencil: false, depth: false,
        preserveDrawingBuffer: false
      });
      const gl = this.gl;
      if (!gl) throw new Error('WebGL 1 não habilitado');
      const floatTextures = gl.getExtension('OES_texture_float');
      const halfTextures = gl.getExtension('OES_texture_half_float');
      if (!floatTextures && !halfTextures) throw new Error('Texturas de simulação não suportadas');
      const linearFloat = !!gl.getExtension('OES_texture_float_linear');
      const linearHalf = !!gl.getExtension('OES_texture_half_float_linear');
      gl.getExtension('WEBGL_color_buffer_float');
      gl.getExtension('EXT_color_buffer_half_float');
      gl.getExtension('EXT_color_buffer_float');
      const possibilities = [];
      if (floatTextures) possibilities.push([gl.FLOAT, linearFloat]);
      if (halfTextures) possibilities.push([halfTextures.HALF_FLOAT_OES, linearHalf]);
      const supported = possibilities.find(([type]) => this.probeFramebuffer(type));
      if (!supported) throw new Error('Framebuffers float/half-float indisponíveis');
      this.bufferType = supported[0];
      this.floatLinear = supported[1];
      this.pointer = { x: .65, y: .5, dx: 0, dy: 0, active: false, moved: false, lastX: null, lastY: null };
      this.programs = this.createPrograms();
      this.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      this.imageTexture = this.createImageTexture(photo);
      this.lastSize = '';
      this.resize();
      this.registerEvents();
      this.frame();
      layer.classList.add('is-ready');
    }

    createShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader) || 'Shader inválido';
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    }

    createProgram(fragment) {
      const gl = this.gl;
      const vertex = this.createShader(gl.VERTEX_SHADER, `
        attribute vec2 aPosition;
        varying vec2 vUv;
        void main() {
          vUv = aPosition * 0.5 + 0.5;
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }
      `);
      const pixel = this.createShader(gl.FRAGMENT_SHADER, fragment);
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, pixel);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(pixel);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Não foi possível conectar os shaders');
      }
      const uniforms = {};
      const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
      return { program, uniforms, position: gl.getAttribLocation(program, 'aPosition') };
    }

    createPrograms() {
      const common = 'precision highp float; varying vec2 vUv;';
      return {
        advection: this.createProgram(common + `
          uniform sampler2D uVelocity, uSource;
          uniform float uDt, uDissipation;
          void main() {
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            vec2 sourceUv = clamp(vUv - velocity * uDt, vec2(0.001), vec2(0.999));
            gl_FragColor = texture2D(uSource, sourceUv) * uDissipation;
          }`),
        divergence: this.createProgram(common + `
          uniform sampler2D uVelocity;
          uniform vec2 uTexel;
          void main() {
            vec2 L = texture2D(uVelocity, clamp(vUv-vec2(uTexel.x,0.0),0.0,1.0)).xy;
            vec2 R = texture2D(uVelocity, clamp(vUv+vec2(uTexel.x,0.0),0.0,1.0)).xy;
            vec2 T = texture2D(uVelocity, clamp(vUv+vec2(0.0,uTexel.y),0.0,1.0)).xy;
            vec2 B = texture2D(uVelocity, clamp(vUv-vec2(0.0,uTexel.y),0.0,1.0)).xy;
            float d = 0.25 * (R.x - L.x + T.y - B.y);
            gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
          }`),
        pressure: this.createProgram(common + `
          uniform sampler2D uPressure, uDivergence;
          uniform vec2 uTexel;
          void main() {
            float L = texture2D(uPressure, clamp(vUv-vec2(uTexel.x,0.0),0.0,1.0)).r;
            float R = texture2D(uPressure, clamp(vUv+vec2(uTexel.x,0.0),0.0,1.0)).r;
            float T = texture2D(uPressure, clamp(vUv+vec2(0.0,uTexel.y),0.0,1.0)).r;
            float B = texture2D(uPressure, clamp(vUv-vec2(0.0,uTexel.y),0.0,1.0)).r;
            float d = texture2D(uDivergence, vUv).r;
            gl_FragColor = vec4((L+R+T+B-d)*0.25,0.0,0.0,1.0);
          }`),
        gradient: this.createProgram(common + `
          uniform sampler2D uPressure, uVelocity;
          uniform vec2 uTexel;
          void main() {
            float L = texture2D(uPressure, clamp(vUv-vec2(uTexel.x,0.0),0.0,1.0)).r;
            float R = texture2D(uPressure, clamp(vUv+vec2(uTexel.x,0.0),0.0,1.0)).r;
            float T = texture2D(uPressure, clamp(vUv+vec2(0.0,uTexel.y),0.0,1.0)).r;
            float B = texture2D(uPressure, clamp(vUv-vec2(0.0,uTexel.y),0.0,1.0)).r;
            vec2 v = texture2D(uVelocity, vUv).xy - vec2(R-L,T-B)*0.5;
            gl_FragColor = vec4(v,0.0,1.0);
          }`),
        splat: this.createProgram(common + `
          uniform sampler2D uTarget;
          uniform vec2 uPoint;
          uniform vec3 uForce;
          uniform float uRadius, uAspect;
          void main() {
            vec2 d = vUv-uPoint;
            d.x *= uAspect;
            float influence = exp(-dot(d,d)/uRadius);
            gl_FragColor = texture2D(uTarget,vUv) + vec4(uForce*influence,0.0);
          }`),
        display: this.createProgram(common + `
          uniform sampler2D uImage, uVelocity, uColor;
          uniform float uImageAspect, uViewportAspect, uDistortion, uInnerScale;
          uniform vec2 uHeroOffset, uHeroScale;
          float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
          float noise(vec2 p) {
            vec2 i=floor(p), f=fract(p);
            f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),
                       mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
          }
          vec4 sampleSoft(vec2 uv) {
            vec2 clampedUv=clamp(uv,vec2(0.0),vec2(1.0));
            vec4 original=texture2D(uImage,clampedUv);
            if(uv.x>=0.0 && uv.x<=1.0 && uv.y>=0.0 && uv.y<=1.0) return original;
            vec4 blend=vec4(0.0);
            for(int y=-1;y<=1;y++){
              for(int x=-1;x<=1;x++){
                blend+=texture2D(uImage,clamp(clampedUv+vec2(float(x),float(y))*.002,0.0,1.0));
              }
            }
            return blend/9.0;
          }
          void main() {
            vec2 velocity=texture2D(uVelocity,vUv).xy;
            float scalar=texture2D(uColor,vUv).r;
            vec2 direction=normalize(velocity+vec2(.001,.001));
            vec2 shift=uDistortion*direction*scalar;
            // A mesma distorção fluida da versão original: força aplicada duas vezes.
            vec2 localUv=(vUv+shift+shift-0.5)/uInnerScale+0.5;
            // Reconstrói o enquadramento do fundo no container. A distorção
            // continua local, e a imagem não salta durante a interação.
            vec2 globalUv=uHeroOffset+localUv*uHeroScale;
            vec2 imageUv=globalUv;
            if(uViewportAspect<uImageAspect){
              imageUv.x=(globalUv.x-0.5)*(uViewportAspect/uImageAspect)+0.5;
            }else{
              imageUv.y=(globalUv.y-0.5)*(uImageAspect/uViewportAspect)+0.5;
            }
            imageUv.y=1.0-imageUv.y;
            vec4 original=sampleSoft(imageUv);

            // Película de gelo localizada nos rastros do movimento, com
            // cristais, fissuras suaves e brilho azul — nunca congelamento fixo.
            float flow=length(velocity);
            float frost=smoothstep(.010,.050,scalar*1.95+flow*.032);
            vec2 cellUv=localUv*vec2(85.0,85.0);
            float grain=noise(localUv*vec2(160.0,160.0));
            float facets=noise(localUv*vec2(46.0,46.0));
            float crackA=pow(1.0-abs(sin(cellUv.x*.71+noise(localUv*14.0)*6.0)),22.0);
            float crackB=pow(1.0-abs(sin(cellUv.y*.67-noise(localUv*11.0)*5.0)),24.0);
            float crackC=pow(1.0-abs(sin((cellUv.x+cellUv.y)*.46+noise(localUv*9.0)*6.3)),25.0);
            float fracture=clamp(crackA*.52+crackB*.48+crackC*.45,0.0,1.0);
            float crystal=fracture*(.48+.52*facets);
            float frostVary=mix(.55,1.0,grain);
            float crystalDust=smoothstep(.58,.92,noise(localUv*250.0)*(0.65+0.35*grain));
            float shard=smoothstep(.70,.96,facets+fracture*.35);
            vec3 cold=vec3(.86,.975,1.0);
            vec3 icy=mix(original.rgb,cold,frost*(.58+.24*frostVary));
            icy+=frost*crystal*vec3(.27,.40,.48);
            icy+=frost*crystalDust*vec3(.10,.18,.22);
            icy+=frost*pow(shard,2.0)*vec3(.08,.16,.21);
            icy=mix(icy,vec3(.94,.985,1.0),frost*crystalDust*.18);
            float refractionGlint=frost*clamp(flow*2.2,0.0,.34);
            icy+=refractionGlint*vec3(.16,.39,.48);
            // Suaviza o encontro com a borda arredondada do container.
            float edge= min(min(localUv.x,1.0-localUv.x),min(localUv.y,1.0-localUv.y));
            float softMask=smoothstep(0.0,.015,edge);
            // Keep the original fluid distortion, but do not fake ice here.
            // The separate Canvas layer draws the true two-stage freezing.
            gl_FragColor=vec4(mix(original.rgb,icy,.10),original.a*softMask);
          }`)
      };
    }

    replaceImage(image) {
      const gl = this.gl;
      const nextTexture = this.createImageTexture(image);
      gl.deleteTexture(this.imageTexture);
      this.imageTexture = nextTexture;
      this.imageAspect = image.naturalWidth / image.naturalHeight;
      this.photo = image;
    }

    createImageTexture(image) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Falha no upload da imagem para GPU');
      return texture;
    }

    probeFramebuffer(type) {
      const gl = this.gl;
      const texture = gl.createTexture();
      const fbo = gl.createFramebuffer();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, type, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const result = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(fbo);
      return result;
    }

    createFBO(width, height, filtering = false) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering && this.floatLinear ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering && this.floatLinear ? gl.LINEAR : gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, this.bufferType, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(fbo);
        throw new Error('Framebuffer float não suportado');
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture, fbo, width, height };
    }

    createDouble(width, height, filtering = false) {
      return {
        read: this.createFBO(width, height, filtering),
        write: this.createFBO(width, height, filtering),
        swap() { const temp = this.read; this.read = this.write; this.write = temp; }
      };
    }

    disposeBuffers() {
      if (!this.velocity) return;
      const gl = this.gl;
      const objects = [this.velocity.read, this.velocity.write, this.color.read, this.color.write, this.pressure.read, this.pressure.write, this.divergence];
      objects.forEach((t) => { gl.deleteTexture(t.texture); gl.deleteFramebuffer(t.fbo); });
    }

    resize() {
      const rect = layer.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(2, Math.round(rect.width * 1.2 * dpr));
      const height = Math.max(2, Math.round(rect.height * 1.2 * dpr));
      const signature = `${width}x${height}`;
      if (signature === this.lastSize) return;
      canvas.width = width;
      canvas.height = height;
      this.aspect = rect.width / rect.height;
      const heroRect = hero.getBoundingClientRect();
      this.heroAspect = heroRect.width / heroRect.height;
      this.heroOffset = [(rect.left - heroRect.left) / heroRect.width,
                         1 - (rect.bottom - heroRect.top) / heroRect.height];
      this.heroScale = [rect.width / heroRect.width, rect.height / heroRect.height];
      this.lastSize = signature;
      this.disposeBuffers();
      const simHeight = Math.round(128 + (4 - 1) * (512 - 128) / 9);
      const simWidth = Math.round(simHeight * (width / height));
      this.texel = [1 / simWidth, 1 / simHeight];
      this.velocity = this.createDouble(simWidth, simHeight, true);
      this.color = this.createDouble(simWidth, simHeight, true);
      this.pressure = this.createDouble(simWidth, simHeight, false);
      this.divergence = this.createFBO(simWidth, simHeight, false);
    }

    draw(name, target, apply) {
      const gl = this.gl;
      const p = this.programs[name];
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
      gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
      gl.useProgram(p.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.enableVertexAttribArray(p.position);
      gl.vertexAttribPointer(p.position, 2, gl.FLOAT, false, 0, 0);
      let unit = 0;
      const api = {
        tex: (key, texture) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(p.uniforms[key], unit++);
        },
        f1: (key, v) => { if (p.uniforms[key] !== undefined) gl.uniform1f(p.uniforms[key], v); },
        f2: (key, x, y) => { if (p.uniforms[key] !== undefined) gl.uniform2f(p.uniforms[key], x, y); },
        f3: (key, x, y, z) => { if (p.uniforms[key] !== undefined) gl.uniform3f(p.uniforms[key], x, y, z); }
      };
      apply(api);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    splat(target, force) {
      const p = this.pointer;
      this.draw('splat', target.write, (u) => {
        u.tex('uTarget', target.read.texture);
        u.f2('uPoint', p.x, p.y);
        u.f3('uForce', force[0], force[1], force[2]);
        u.f1('uRadius', target === this.color ? 0.0001816 : 0.0002376);
        u.f1('uAspect', this.aspect);
      });
      target.swap();
    }

    frame() {
      const p = this.pointer;
      try {
        if (p.moved) {
          this.splat(this.velocity, [Math.max(-1, Math.min(1, p.dx)), Math.max(-1, Math.min(1, p.dy)), 0]);
          this.splat(this.color, [0.050, 0, 0]);
          p.moved = false; p.dx = 0; p.dy = 0;
        }
        this.draw('divergence', this.divergence, (u) => {
          u.tex('uVelocity', this.velocity.read.texture);
          u.f2('uTexel', ...this.texel);
        });
        for (let i = 0; i < 16; i++) {
          this.draw('pressure', this.pressure.write, (u) => {
            u.tex('uPressure', this.pressure.read.texture);
            u.tex('uDivergence', this.divergence.texture);
            u.f2('uTexel', ...this.texel);
          });
          this.pressure.swap();
        }
        this.draw('gradient', this.velocity.write, (u) => {
          u.tex('uPressure', this.pressure.read.texture);
          u.tex('uVelocity', this.velocity.read.texture);
          u.f2('uTexel', ...this.texel);
        });
        this.velocity.swap();
        this.draw('advection', this.velocity.write, (u) => {
          u.tex('uVelocity', this.velocity.read.texture);
          u.tex('uSource', this.velocity.read.texture);
          u.f1('uDt', 1 / 60); u.f1('uDissipation', 0.97);
        });
        this.velocity.swap();
        this.draw('advection', this.color.write, (u) => {
          u.tex('uVelocity', this.velocity.read.texture);
          u.tex('uSource', this.color.read.texture);
          u.f1('uDt', 8 / 60); u.f1('uDissipation', 0.98);
        });
        this.color.swap();
        this.draw('display', null, (u) => {
          u.tex('uImage', this.imageTexture);
          u.tex('uVelocity', this.velocity.read.texture);
          u.tex('uColor', this.color.read.texture);
          u.f1('uImageAspect', this.imageAspect);
          u.f1('uViewportAspect', this.heroAspect);
          u.f2('uHeroOffset', ...this.heroOffset);
          u.f2('uHeroScale', ...this.heroScale);
          u.f1('uInnerScale', 5 / 6);
          u.f1('uDistortion', 0.496);
        });
      } catch (error) {
        canvas.style.visibility='hidden';
        layer.classList.add('is-ready');
        console.warn('Henke: erro ao desenhar. Mantendo o fundo e o rastro de gelo.', error.message);
        return;
      }
      this.animationId = requestAnimationFrame(() => this.frame());
    }

    registerEvents() {
      const p = this.pointer;
      const clear = () => { p.active = false; p.moved = false; p.dx = 0; p.dy = 0; p.lastX = null; p.lastY = null; };
      const move = (clientX, clientY, click = false) => {
        const rect = layer.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) {
          clear();
          return;
        }
        p.x = (x + 0.1) / 1.2;
        p.y = (1 - y + 0.1) / 1.2;
        if (p.lastX !== null) {
          p.dx += (x - p.lastX) * 4.3;
          p.dy += (p.lastY - y) * 4.3;
          p.moved = true;
        }
        if (click) { p.dx += 0.07; p.dy += 0.05; p.moved = true; }
        p.lastX = x; p.lastY = y; p.active = true;
      };
      hero.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') move(e.clientX, e.clientY); });
      hero.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') move(e.clientX, e.clientY); });
      hero.addEventListener('pointerleave', clear);
      hero.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.target.closest('a')) return;
        move(e.clientX, e.clientY, true);
      });
      hero.addEventListener('touchstart', (e) => {
        if (e.touches.length) move(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      hero.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        const rect = layer.getBoundingClientRect();
        const t = e.touches[0];
        if (t.clientX >= rect.left && t.clientX <= rect.right &&
            t.clientY >= rect.top && t.clientY <= rect.bottom) e.preventDefault();
        move(t.clientX, t.clientY);
      }, { passive: false });
      hero.addEventListener('touchend', clear, { passive: true });
      hero.addEventListener('touchcancel', clear, { passive: true });
      window.addEventListener('blur', clear);
      window.addEventListener('resize', () => this.resize(), { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(layer);
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        cancelAnimationFrame(this.animationId);
        canvas.style.visibility='hidden';
        layer.classList.add('is-ready');
      });
    }
  }

  boot();
})();
