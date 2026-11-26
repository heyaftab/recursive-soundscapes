/* HiDPI canvas visualizer: static recursive scene cached separately from active-note animation. */
(function (RS) {
  'use strict';
  class VisualStage {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scene = null;
      this.theme = 'light';
      this.activeId = null;
      this.activeSince = 0;
      this.playing = false;
      this.immersive = false;
      this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
      this.sceneLayer = document.createElement('canvas');
      this.layerCtx = this.sceneLayer.getContext('2d');
      this.width = 0; this.height = 0; this.dpr = 1;
      this.nodeMap = new Map();
      this._resize = this.resize.bind(this);
      this._drawFrame = this.drawFrame.bind(this);
      this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.resize()) : null;
      this.resizeObserver?.observe(canvas.parentElement);
      window.addEventListener('resize', this._resize);
      this.resize();
      this.frameId = requestAnimationFrame(this._drawFrame);
    }
    setPosition(position) { this.position = position; }
    setScene(scene, composition) {
      this.composition=composition; this.position=0; this.kochPaths=new Map();
      this.melodyEvents=composition.events.filter(event=>event.kind==='melody');
      this.scene = scene;
      this.nodeMap = new Map(scene.nodes.map(n => [n.id, n]));
      this.activeId = null;
      this.renderStatic();
    }
    setTheme(theme) {
      this.theme = theme;
      this.renderStatic();
    }
    setActive(id) {
      if (id !== this.activeId) { this.activeId = id; this.activeSince = performance.now(); }
    }
    setPlaying(playing) { this.playing = playing; }
    setImmersive(value) {
      this.immersive = Boolean(value);
      this.renderStatic();
    }
    setReducedMotion(value) { this.reducedMotion = value; }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width)), h = Math.max(200, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (this.width === w && this.height === h && this.dpr === dpr) return;
      this.width = w; this.height = h; this.dpr = dpr;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.sceneLayer.width = w * dpr; this.sceneLayer.height = h * dpr;
      this.kochPaths=new Map();
      this.renderStatic();
    }
    coordX(x) { return this.width * (.5 + (x - .5) * .78); }
    coordY(y) { return this.height * (.5 + (y - .5) * .9); }
    fibonacciX(x) { return this.coordX(x); }
    fibonacciY(y) { return this.coordY(y); }
    traversalX(x) {
      if(this.scene?.algorithm!=='koch')return this.coordX(x);
      const size=Math.min(this.width,this.height)*.95*.78;
      return this.width/2+(x-.5)*size;
    }
    traversalY(y) {
      if(this.scene?.algorithm!=='koch')return this.coordY(y);
      const size=Math.min(this.width,this.height)*.95*.78;
      return this.coordY(.46+(y-.5)*size/this.height);
    }
    setup(ctx) { ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
    background(ctx) {
      const w = this.width, h = this.height;
      const grd = ctx.createRadialGradient(w * .52, h * .44, 8, w * .5, h * .45, Math.max(w, h) * .67);
      const dark = this.theme === 'dark';
      grd.addColorStop(0, dark ? '#142139' : '#ffffff');
      grd.addColorStop(.51, dark ? '#0e172a' : '#f5f8fc');
      grd.addColorStop(1, dark ? '#09101d' : '#eaf0f7');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = dark ? 'rgba(126,155,195,.055)' : 'rgba(91,115,148,.09)'; ctx.lineWidth = 1;
      if (!this.immersive) {
        for (let x = 0; x < w; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      }
      // Fixed background particles (rather than random on each frame) avoid flicker.
      let seed = 3;
      const particleCount = this.immersive ? 44 : 80;
      for (let i = 0; i < particleCount; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const x = (seed / 4294967296) * w;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const y = (seed / 4294967296) * h;
        ctx.fillStyle = dark
          ? (i % 3 === 0 ? 'rgba(162,214,241,.25)' : 'rgba(185,169,240,.15)')
          : (i % 3 === 0 ? 'rgba(46,145,166,.26)' : 'rgba(133,105,190,.19)');
        ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 1.2 : .65, 0, Math.PI * 2); ctx.fill();
      }
      const radius = Math.min(w, h) * .25;
      ctx.strokeStyle = dark ? 'rgba(117,209,227,.065)' : 'rgba(91,132,165,.10)';
      for (const r of [radius * .57, radius, radius * 1.4]) {
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, r, r * .80, 0, 0, 2 * Math.PI); ctx.stroke();
      }
    }
    trianglePath(ctx, pts) {
      ctx.beginPath(); ctx.moveTo(this.coordX(pts[0].x), this.coordY(pts[0].y));
      ctx.lineTo(this.coordX(pts[1].x), this.coordY(pts[1].y));
      ctx.lineTo(this.coordX(pts[2].x), this.coordY(pts[2].y)); ctx.closePath();
    }
    renderStatic() {
      if (!this.width || !this.scene) return;
      const ctx = this.layerCtx;
      this.setup(ctx);
      this.background(ctx);
      const nodes = this.scene.nodes;
      const dark = this.theme === 'dark';
      ctx.save();
      if (this.scene.algorithm === 'fibonacci') {
        ctx.lineWidth = 1.8;
        for (let i = 1; i < nodes.length; i++) {
          const prev = nodes[i - 1], n = nodes[i];
          ctx.strokeStyle = dark
            ? `rgba(101,231,239,${.12 + (i / nodes.length) * .42})`
            : `rgba(8,127,145,${.18 + (i / nodes.length) * .48})`;
          ctx.beginPath(); ctx.moveTo(this.fibonacciX(prev.x), this.fibonacciY(prev.y));
          ctx.quadraticCurveTo(this.fibonacciX(.5 + (prev.x + n.x - 1) * .42), this.fibonacciY(.5 + (prev.y + n.y - 1) * .42), this.fibonacciX(n.x), this.fibonacciY(n.y)); ctx.stroke();
        }
        nodes.forEach((n, i) => {
          const x = this.fibonacciX(n.x), y = this.fibonacciY(n.y);
          ctx.fillStyle = dark
            ? (i % 5 === 0 ? 'rgba(178,148,246,.9)' : 'rgba(112,236,241,.65)')
            : (i % 5 === 0 ? 'rgba(118,85,189,.9)' : 'rgba(8,127,145,.76)');
          ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 3.6 : 2.4, 0, 2 * Math.PI); ctx.fill();
          if (!this.immersive && (i % 5 === 0 || i === nodes.length - 1)) {
            ctx.font = '13px ui-monospace, monospace';
            ctx.fillStyle = dark ? 'rgba(201,222,248,.72)' : 'rgba(49,67,91,.76)';
            ctx.fillText(`F${i}`, x + 8, y - 9);
          }
        });
        // Gentle central Fibonacci notation makes the connection legible before playback.
        if (!this.immersive) {
          ctx.textAlign = 'center'; ctx.font = '14px ui-monospace, monospace';
          ctx.fillStyle = dark ? 'rgba(133,199,215,.4)' : 'rgba(46,111,130,.48)';
          ctx.fillText('F(n) = F(n−1) + F(n−2)', this.width / 2, this.height * .91); ctx.textAlign = 'left';
        }
      } else if (this.scene.algorithm === 'sierpinski') {
        ctx.strokeStyle = dark ? 'rgba(101,231,239,.09)' : 'rgba(8,127,145,.18)'; ctx.lineWidth = 1;
        const leaves = nodes.filter(n => n.leaf);
        // Thin, translucent leaves show the actual recursive topology.
        for (const n of leaves) {
          this.trianglePath(ctx, n.triangle);
          ctx.fillStyle = dark ? 'rgba(90,227,236,.09)' : 'rgba(8,127,145,.08)'; ctx.fill();
          ctx.strokeStyle = dark ? 'rgba(106,214,231,.34)' : 'rgba(8,127,145,.38)'; ctx.stroke();
        }
        for (const n of nodes) {
          if (n.depth > 2) continue;
          this.trianglePath(ctx, n.triangle);
          ctx.strokeStyle = dark
            ? `rgba(176,135,255,${.13 / (n.depth + 1)})`
            : `rgba(118,85,189,${.22 / (n.depth + 1)})`;
        }
      } else if (this.scene.algorithm === 'tree') {
        // Branches share endpoints — the geometry of the tree is itself recursive.
        nodes.forEach(n => {
          const x1 = this.coordX(n.x1), y1 = this.coordY(n.y1), x2 = this.coordX(n.x2), y2 = this.coordY(n.y2);
          ctx.strokeStyle = dark
            ? (n.depth < 2 ? 'rgba(140,205,235,.66)' : n.depth % 2 === 0 ? 'rgba(115,219,220,.48)' : 'rgba(167,139,250,.42)')
            : (n.depth < 2 ? 'rgba(56,112,147,.76)' : n.depth % 2 === 0 ? 'rgba(8,127,145,.62)' : 'rgba(118,85,189,.56)');
          ctx.lineWidth = Math.max(.65, (8 - n.depth) * .49);
          ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          if (n.leaf) {
            ctx.fillStyle = dark ? 'rgba(143,234,223,.34)' : 'rgba(8,127,145,.42)';
            ctx.beginPath(); ctx.arc(x2, y2, 1.5, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
      ctx.restore();
    }
    drawKoch(ctx) {
      const iteration=this.composition.iterations.filter(i=>i.time<=this.position).at(-1)||this.composition.iterations[0];
      const level=iteration.depth;
      let progress=this.reducedMotion?1:RS.clamp((this.position-iteration.time)/Math.min(.65,iteration.duration*.6),0,1);
      progress=progress*progress*(3-2*progress);
      const size=Math.min(this.width,this.height)*.95*.78;
      const x=v=>this.width/2+(v-.5)*size,y=v=>this.coordY(.46+(v-.5)*size/this.height);
      const colors=this.theme==='dark'?['#65e7ef','#88d8ed','#a78bfa','#c29cf5','#f0a5e8','#c3dbf8']:['#087f91','#247eaa','#7655bd','#975cac','#b34f9f','#476c9b'];
      let cached=this.kochPaths.get(level);
      if(progress===1 && !cached){
        cached=new Path2D();
        for(const n of this.scene.levels[level]){cached.moveTo(x(n.x1),y(n.y1));cached.lineTo(x(n.x2),y(n.y2));}
        this.kochPaths.set(level,cached);
      }
      if(progress===1){ctx.strokeStyle=colors[level];ctx.lineWidth=level>3?1.2:2;ctx.stroke(cached);}
      else for(const n of this.scene.levels[level]){
        const parent=this.nodeMap.get(n.parentId);
        const from=parent?{x1:parent.x1+(parent.x2-parent.x1)*n.child/4,y1:parent.y1+(parent.y2-parent.y1)*n.child/4,x2:parent.x1+(parent.x2-parent.x1)*(n.child+1)/4,y2:parent.y1+(parent.y2-parent.y1)*(n.child+1)/4}:n;
        const mix=k=>from[k]+(n[k]-from[k])*progress;
        ctx.beginPath();ctx.moveTo(x(mix('x1')),y(mix('y1')));ctx.lineTo(x(mix('x2')),y(mix('y2')));
        ctx.strokeStyle=colors[level];ctx.lineWidth=level>3?1.2:2;ctx.stroke();
      }
      const active=this.nodeMap.get(this.activeId);
      if(active){
        ctx.save();ctx.strokeStyle=colors[active.depth];ctx.shadowColor='#a78bfa';ctx.shadowBlur=this.reducedMotion?0:16;ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x(active.x1),y(active.y1));ctx.lineTo(x(active.x2),y(active.y2));ctx.stroke();ctx.restore();
      }
    }
    drawHanoi(ctx) {
      const moves=this.composition.events.filter(e=>e.kind==='melody');
      const event=moves.filter(e=>e.time<=this.position).at(-1);
      const move=event?this.nodeMap.get(event.sourceNodeId):null;
      const progress=event?RS.clamp((this.position-event.time)/event.moveDuration,0,1):0;
      const pegs=move?(progress>=1?move.after:move.before):this.scene.initial;
      const w=this.width,h=this.height,base=this.coordY(.76),diskH=Math.min(26,h*.05),pegX=[this.coordX(.2),this.coordX(.5),this.coordX(.8)];
      const dark=this.theme==='dark';
      ctx.strokeStyle=dark?'#667897':'#8191aa';ctx.lineWidth=5;ctx.lineCap='round';
      for(let i=0;i<3;i++){
        ctx.beginPath();ctx.moveTo(pegX[i],base);ctx.lineTo(pegX[i],this.coordY(.24));ctx.stroke();
        ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pegX[i]-w*.135*.78,base+diskH);ctx.lineTo(pegX[i]+w*.135*.78,base+diskH);ctx.stroke();
        ctx.font='13px ui-monospace,monospace';ctx.textAlign='center';ctx.fillStyle=dark?'#a9b7d0':'#46546a';ctx.fillText(['LEFT','MIDDLE','RIGHT'][i],pegX[i],base+diskH+25);
      }
      const disk=(size,x,y,active=false)=>{
        const width=w*(.08+.18*size/this.scene.disks)*.78;
        ctx.save();ctx.fillStyle=(dark?['#65e7ef','#a78bfa','#f0a5e8']:['#087f91','#7655bd','#b34f9f'])[(size-1)%3];
        if(active){ctx.shadowColor='#f0a5e8';ctx.shadowBlur=this.reducedMotion?0:18;}
        ctx.beginPath();ctx.roundRect(x-width/2,y-diskH/2,width,diskH-2,6);ctx.fill();
        ctx.shadowBlur=0;ctx.strokeStyle=dark?'rgba(255,255,255,.42)':'rgba(255,255,255,.68)';ctx.lineWidth=1;ctx.stroke();
        ctx.fillStyle=dark?'#111929':'#fff';ctx.font='bold 14px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(String(size),x,y+4);ctx.restore();
      };
      for(let peg=0;peg<3;peg++)pegs[peg].forEach((size,level)=>{
        if(move&&progress<1&&peg===move.from&&size===move.disk)return;
        disk(size,pegX[peg],base-level*diskH,move&&progress>=1&&size===move.disk&&peg===move.to&&this.position<event.time+event.moveDuration+.2);
      });
      if(move&&progress<1){
        const startY=base-move.sourceHeight*diskH,endY=base-move.destinationHeight*diskH,top=this.coordY(.18);
        let x=pegX[move.from],y=startY;
        if(this.reducedMotion){x=pegX[move.to];y=endY;}
        else if(progress<.25)y=startY+(top-startY)*(progress/.25);
        else if(progress<.75){x+= (pegX[move.to]-x)*((progress-.25)/.5);y=top;}
        else{x=pegX[move.to];y=top+(endY-top)*((progress-.75)/.25);}
        disk(move.disk,x,y,true);
      }
      const end=moves.at(-1).time+moves.at(-1).moveDuration;
      if(this.position>=end){
        ctx.save();ctx.strokeStyle=dark?'#65e7ef':'#087f91';ctx.lineWidth=2;
        const phase=this.reducedMotion?0:Math.min(1,(this.position-end)/1.5);
        ctx.globalAlpha=1-phase*.65;ctx.beginPath();ctx.ellipse(pegX[2],this.coordY(.46),w*(.13+phase*.04)*.78,h*(.31+phase*.04)*.9,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      ctx.textAlign='left';
    }
    drawTraversalBall(ctx) {
      const events=this.melodyEvents||[];
      if(!events.length)return;
      const position=this.position||0;
      const center={x:.5,y:this.scene.algorithm==='koch' ? .46 : .5};
      if(!this.playing&&position<=0){this.drawBallAt(ctx,center);return;}
      const launchDuration=Math.min(.32,Math.max(.06,((events[1]?.time||.6)-events[0].time)*.45));
      const launching=position<launchDuration;
      let nextIndex=events.findIndex(event=>event.time>position);
      if(nextIndex<0)nextIndex=events.length;
      const returningToCenter=nextIndex===events.length;
      const fromEvent=events[Math.max(0,nextIndex-1)],toEvent=events[Math.min(events.length-1,nextIndex)];
      const fromNode=this.nodeMap.get(fromEvent.sourceNodeId),toNode=this.nodeMap.get(toEvent.sourceNodeId);
      const from=launching?center:this.traversalPoint(fromNode);
      const to=launching?this.traversalPoint(this.nodeMap.get(events[0].sourceNodeId)):returningToCenter?center:this.traversalPoint(toNode);
      if(!from||!to)return;
      const segmentStart=nextIndex===1&&!launching?launchDuration:fromEvent.time;
      const span=launching?launchDuration:returningToCenter?1.35:toEvent.time-segmentStart;
      const progress=this.reducedMotion?(launching||returningToCenter?1:0):span<=0?0:RS.clamp((position-(launching?0:segmentStart))/span,0,1);
      const controlX=this.scene.algorithm==='fibonacci' ? .5+(from.x+to.x-1)*.42 : (from.x+to.x)/2;
      const controlY=this.scene.algorithm==='fibonacci' ? .5+(from.y+to.y-1)*.42 : (from.y+to.y)/2-.06;
      const inverse=1-progress;
      let x=inverse*inverse*from.x+2*inverse*progress*controlX+progress*progress*to.x;
      let y=inverse*inverse*from.y+2*inverse*progress*controlY+progress*progress*to.y;
      if(!this.reducedMotion)y-=Math.sin(Math.PI*progress)*(this.scene.algorithm==='fibonacci' ? .035 : .022);
      this.drawBallAt(ctx,{x,y});
    }
    traversalPoint(node) {
      if(!node)return null;
      if(this.scene.algorithm==='tree')return node.depth===0?{x:node.x1,y:node.y1}:{x:node.x2,y:node.y2};
      if(this.scene.algorithm==='koch')return {x:(node.x1+node.x2)/2,y:(node.y1+node.y2)/2};
      return {x:node.x,y:node.y};
    }
    drawBallAt(ctx,point) {
      const x=this.traversalX(point.x),y=this.traversalY(point.y);
      ctx.save();
      ctx.shadowColor='#8b72d4';ctx.shadowBlur=this.reducedMotion?5:15;
      const ball=ctx.createRadialGradient(x-2,y-2,1,x,y,7);
      ball.addColorStop(0,'#ffffff');ball.addColorStop(.35,'#a8f4ef');ball.addColorStop(1,'#8d73d5');
      ctx.fillStyle=ball;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    drawFrame(timestamp) {
      this.frameId = requestAnimationFrame(this._drawFrame);
      if (!this.scene || !this.width) return;
      const ctx = this.ctx;
      this.setup(ctx);
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.drawImage(this.sceneLayer, 0, 0, this.width, this.height);
      if(this.scene.algorithm==='hanoi'){this.drawHanoi(ctx);return;}
      if(this.scene.algorithm==='koch'){this.drawKoch(ctx);this.drawTraversalBall(ctx);return;}
      const n = this.nodeMap.get(this.activeId);
      if (!n) {
        if(['fibonacci','sierpinski','tree'].includes(this.scene.algorithm))this.drawTraversalBall(ctx);
        return;
      }
      const age = Math.min(1, (timestamp - this.activeSince) / 900);
      const intensity = this.reducedMotion ? .75 : 1 - age * .46;
      ctx.save();
      ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = this.reducedMotion ? 8 : 22;
      if (n.type === 'triangle') {
        this.trianglePath(ctx, n.triangle);
        ctx.fillStyle = `rgba(179,135,252,${.19 * intensity})`; ctx.fill();
        ctx.strokeStyle = `rgba(197,169,255,${intensity})`; ctx.lineWidth = 2; ctx.stroke();
      } else if (n.type === 'branch') {
        ctx.lineWidth = Math.max(2.3, (9 - n.depth) * .56);
        ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(197,169,255,${intensity})`;
        ctx.beginPath(); ctx.moveTo(this.coordX(n.x1), this.coordY(n.y1)); ctx.lineTo(this.coordX(n.x2), this.coordY(n.y2)); ctx.stroke();
        const activeX = n.depth === 0 ? n.x1 : n.x2;
        const activeY = n.depth === 0 ? n.y1 : n.y2;
        ctx.beginPath(); ctx.arc(this.coordX(activeX), this.coordY(activeY), 3.3, 0, Math.PI * 2); ctx.fillStyle = '#d5bcff'; ctx.fill();
      } else {
        const x = this.fibonacciX(n.x), y = this.fibonacciY(n.y);
        ctx.fillStyle = '#d5bcff'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(189,151,255,${.7 * intensity})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, this.reducedMotion ? 12 : 11 + age * 23, 0, Math.PI * 2); ctx.stroke();
      }
      if (n.type !== 'point' && !this.reducedMotion) {
        ctx.strokeStyle = `rgba(185,145,255,${.4 * intensity})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(this.coordX(n.x), this.coordY(n.y), 10 + age * 19, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if(['fibonacci','sierpinski','tree'].includes(this.scene.algorithm))this.drawTraversalBall(ctx);
    }
    destroy() {
      cancelAnimationFrame(this.frameId);
      this.resizeObserver?.disconnect();
      window.removeEventListener('resize', this._resize);
    }
  }
  RS.VisualStage = VisualStage;
})(window.RS = window.RS || {});
