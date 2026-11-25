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
    setScene(scene) {
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
    setReducedMotion(value) { this.reducedMotion = value; }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width)), h = Math.max(200, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (this.width === w && this.height === h && this.dpr === dpr) return;
      this.width = w; this.height = h; this.dpr = dpr;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.sceneLayer.width = w * dpr; this.sceneLayer.height = h * dpr;
      this.renderStatic();
    }
    coordX(x) { return x * this.width; }
    coordY(y) { return y * this.height; }
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
      for (let x = 0; x < w; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // Fixed background particles (rather than random on each frame) avoid flicker.
      let seed = 3;
      for (let i = 0; i < 80; i++) {
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
      ctx.fillStyle = dark ? 'rgba(114,181,204,.06)' : 'rgba(68,99,128,.34)';
      ctx.font = '10px monospace'; ctx.fillText('0,0', 17, 19);
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
          ctx.beginPath(); ctx.moveTo(this.coordX(prev.x), this.coordY(prev.y));
          ctx.quadraticCurveTo(this.coordX(.5 + (prev.x + n.x - 1) * .42), this.coordY(.5 + (prev.y + n.y - 1) * .42), this.coordX(n.x), this.coordY(n.y)); ctx.stroke();
        }
        nodes.forEach((n, i) => {
          const x = this.coordX(n.x), y = this.coordY(n.y);
          ctx.fillStyle = dark
            ? (i % 5 === 0 ? 'rgba(178,148,246,.9)' : 'rgba(112,236,241,.65)')
            : (i % 5 === 0 ? 'rgba(118,85,189,.9)' : 'rgba(8,127,145,.76)');
          ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 3.6 : 2.4, 0, 2 * Math.PI); ctx.fill();
          if (i % 5 === 0 || i === nodes.length - 1) {
            ctx.font = '11px ui-monospace, monospace';
            ctx.fillStyle = dark ? 'rgba(201,222,248,.72)' : 'rgba(49,67,91,.76)';
            ctx.fillText(`F${i}`, x + 8, y - 9);
          }
        });
        // Gentle central Fibonacci notation makes the connection legible before playback.
        ctx.textAlign = 'center'; ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = dark ? 'rgba(133,199,215,.4)' : 'rgba(46,111,130,.48)';
        ctx.fillText('F(n) = F(n−1) + F(n−2)', this.width / 2, this.height * .91); ctx.textAlign = 'left';
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
      } else {
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
    drawFrame(timestamp) {
      this.frameId = requestAnimationFrame(this._drawFrame);
      if (!this.scene || !this.width) return;
      const ctx = this.ctx;
      this.setup(ctx);
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.drawImage(this.sceneLayer, 0, 0, this.width, this.height);
      const n = this.nodeMap.get(this.activeId);
      if (!n) return;
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
        ctx.beginPath(); ctx.arc(this.coordX(n.x2), this.coordY(n.y2), 3.3, 0, Math.PI * 2); ctx.fillStyle = '#d5bcff'; ctx.fill();
      } else {
        const x = this.coordX(n.x), y = this.coordY(n.y);
        ctx.fillStyle = '#d5bcff'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(189,151,255,${.7 * intensity})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, this.reducedMotion ? 12 : 11 + age * 23, 0, Math.PI * 2); ctx.stroke();
      }
      if (n.type !== 'point' && !this.reducedMotion) {
        ctx.strokeStyle = `rgba(185,145,255,${.4 * intensity})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(this.coordX(n.x), this.coordY(n.y), 10 + age * 19, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    destroy() {
      cancelAnimationFrame(this.frameId);
      this.resizeObserver?.disconnect();
      window.removeEventListener('resize', this._resize);
    }
  }
  RS.VisualStage = VisualStage;
})(window.RS = window.RS || {});
