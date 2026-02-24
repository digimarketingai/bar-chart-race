/**
 * BarChartRace.js v1.0.0
 * Ultra-smooth animated bar chart race library
 * Usage: new BarChartRace('#el', { data: { labels, datasets } }).play()
 * MIT License
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BarChartRace = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ══════════════ UTILITIES ══════════════
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function formatValue(n, fmt) {
    if (fmt) return fmt(n);
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.round(n).toLocaleString();
  }

  function parseColor(c) {
    let hex = (c || '#6688cc').replace('#', '');
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // ══════════════ STYLE INJECTION ══════════════
  let _stylesInjected = false;

  function injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    // Load fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;600;700;900&display=swap';
    document.head.appendChild(link);

    const s = document.createElement('style');
    s.id = 'bcr-global-styles';
    s.textContent = `
.bcr-root{position:relative;overflow:hidden;border-radius:20px;font-family:'Inter',system-ui,sans-serif}
.bcr-root *{box-sizing:border-box;margin:0;padding:0}
.bcr-dark{background:#080818;color:#e0e0f0}
.bcr-light{background:#f0f2f8;color:#1a1a2e}
.bcr-particles{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none}
.bcr-confetti-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:hidden}
.bcr-confetti{position:absolute;border-radius:2px}
@keyframes bcr-cfall{0%{opacity:1;transform:translateY(0) rotate(0deg) scale(1)}100%{opacity:0;transform:translateY(120vh) rotate(720deg) scale(0.15)}}
.bcr-inner{position:relative;z-index:1;padding:28px 28px 20px}
.bcr-header{text-align:center;margin-bottom:4px}
.bcr-title{font-family:'Orbitron',monospace,sans-serif;font-size:clamp(1rem,3vw,1.35rem);font-weight:900;letter-spacing:2px;text-transform:uppercase;background:linear-gradient(90deg,#00d4ff,#7b2ffc,#ff2d95);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bcr-light .bcr-title{background:linear-gradient(90deg,#0055bb,#6600cc,#cc0055);-webkit-background-clip:text;background-clip:text}
.bcr-subtitle{font-size:0.78rem;opacity:0.35;margin-top:2px}
.bcr-label-wrap{text-align:center;margin:8px 0 2px;user-select:none;position:relative}
.bcr-label-main{font-family:'Orbitron',monospace;font-size:clamp(2.8rem,10vw,4.8rem);font-weight:900;line-height:1;opacity:0.1;transition:transform 0.2s cubic-bezier(.4,2,.6,1)}
.bcr-label-main.bcr-pop{transform:scale(1.07)}
.bcr-label-sub{font-family:'Orbitron',monospace;font-size:clamp(0.65rem,2vw,0.88rem);letter-spacing:3px;color:#00d4ff;margin-top:-2px;min-height:1.2em}
.bcr-light .bcr-label-sub{color:#0055bb}
.bcr-progress-wrap{width:55%;max-width:280px;height:3px;margin:10px auto 14px;border-radius:3px;overflow:hidden}
.bcr-dark .bcr-progress-wrap{background:rgba(255,255,255,0.05)}
.bcr-light .bcr-progress-wrap{background:rgba(0,0,0,0.07)}
.bcr-progress-fill{height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#00d4ff,#7b2ffc,#ff2d95);box-shadow:0 0 8px rgba(0,212,255,0.5);transition:width 0.12s linear}
.bcr-chart{position:relative;overflow:hidden;transition:height 0.4s}
.bcr-row{display:flex;align-items:center;position:absolute;width:100%;left:0;will-change:transform,opacity;transition:transform 0.55s cubic-bezier(.22,1,.36,1),opacity 0.35s}
.bcr-rank{width:28px;min-width:28px;text-align:center;font-family:'Orbitron',monospace;font-size:0.62rem;font-weight:700;opacity:0.25}
.bcr-icon{width:30px;height:30px;min-width:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:0.68rem;font-weight:900;color:#fff;margin-right:8px;position:relative;flex-shrink:0;text-shadow:0 1px 2px rgba(0,0,0,0.4)}
.bcr-crown::after{content:'👑';position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:11px;animation:bcr-bounce .75s ease infinite}
@keyframes bcr-bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}
.bcr-name{width:72px;min-width:72px;font-size:0.76rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0}
.bcr-track{flex:1;position:relative;min-width:0}
.bcr-fill{height:100%;border-radius:4px 8px 8px 4px;position:relative;overflow:hidden;will-change:width;min-width:2px}
.bcr-fill::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.12) 50%,transparent 100%);animation:bcr-shimmer 2.2s infinite}
@keyframes bcr-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.bcr-glow{position:absolute;right:0;top:0;width:24px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2));border-radius:0 8px 8px 0}
.bcr-val{min-width:56px;text-align:right;font-family:'Orbitron',monospace;font-size:0.68rem;font-weight:700;opacity:0.65;padding-left:6px}
.bcr-change{width:24px;min-width:24px;text-align:center;font-size:0.62rem;font-weight:700}
.bcr-up{color:#00ff88}.bcr-down{color:#ff4466}.bcr-same{opacity:0.2}
.bcr-controls{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:16px;flex-wrap:wrap}
.bcr-btn{padding:9px 22px;border:none;border-radius:10px;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;outline:none}
.bcr-btn:active{transform:scale(.96)}
.bcr-btn-play{background:linear-gradient(135deg,#00d4ff,#7b2ffc);color:#fff;box-shadow:0 4px 18px rgba(0,212,255,.3)}
.bcr-btn-play:hover{box-shadow:0 6px 28px rgba(0,212,255,.5);transform:translateY(-1px)}
.bcr-btn-play.bcr-active{background:linear-gradient(135deg,#ff2d95,#7b2ffc);box-shadow:0 4px 18px rgba(255,45,149,.3)}
.bcr-btn-reset{color:#999}
.bcr-dark .bcr-btn-reset{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.bcr-light .bcr-btn-reset{background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.1);color:#666}
.bcr-btn-reset:hover{opacity:.8}
.bcr-select{padding:8px 12px;border-radius:10px;font-size:.78rem;font-family:'Inter',sans-serif;outline:none;cursor:pointer}
.bcr-dark .bcr-select{background:rgba(255,255,255,.06);color:#bbb;border:1px solid rgba(255,255,255,.08)}
.bcr-light .bcr-select{background:#fff;color:#333;border:1px solid rgba(0,0,0,.1)}
@media(max-width:600px){
  .bcr-inner{padding:14px 10px 12px}
  .bcr-name{width:48px;min-width:48px;font-size:.65rem}
  .bcr-icon{width:24px;height:24px;min-width:24px;font-size:.58rem;margin-right:5px}
  .bcr-rank{width:22px;min-width:22px;font-size:.55rem}
  .bcr-val{min-width:42px;font-size:.6rem}
  .bcr-change{width:18px;min-width:18px;font-size:.55rem}
}`;
    document.head.appendChild(s);
  }

  // ══════════════ PARTICLE SYSTEM ══════════════
  class Particles {
    constructor(canvas, theme) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.theme = theme;
      this.pts = [];
      this.alive = false;
      this._resize();
      this._seed();
      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);
    }
    _resize() {
      const r = this.c.parentElement.getBoundingClientRect();
      this.c.width = r.width;
      this.c.height = r.height;
    }
    _seed() {
      this.pts = [];
      const n = Math.min(60, Math.floor((this.c.width * this.c.height) / 12000));
      for (let i = 0; i < n; i++)
        this.pts.push({
          x: Math.random() * this.c.width,
          y: Math.random() * this.c.height,
          r: Math.random() * 1.4 + 0.3,
          dx: (Math.random() - 0.5) * 0.35,
          dy: (Math.random() - 0.5) * 0.35,
          a: Math.random() * 0.3 + 0.06,
        });
    }
    start() {
      if (this.alive) return;
      this.alive = true;
      this._loop();
    }
    stop() {
      this.alive = false;
      window.removeEventListener('resize', this._onResize);
    }
    _loop() {
      if (!this.alive) return;
      const { ctx, c, pts, theme } = this;
      const W = c.width,
        H = c.height;
      ctx.clearRect(0, 0, W, H);
      const clr = theme === 'light' ? '60,80,140' : '100,180,255';
      for (const p of pts) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(${clr},${p.a})`;
        ctx.fill();
      }
      requestAnimationFrame(() => this._loop());
    }
  }

  // ══════════════ MAIN CLASS ══════════════
  class BarChartRace {
    /**
     * Creates a new BarChartRace instance.
     *
     * @param {string|HTMLElement} selector  CSS selector or DOM element
     * @param {Object}  opts
     * @param {string}  [opts.title]           Chart title
     * @param {string}  [opts.subtitle]        Subtitle text
     * @param {Object}  opts.data              Data payload
     * @param {string[]} opts.data.labels      One label per frame (e.g. years)
     * @param {string[]} [opts.data.sublabels] Optional sub-labels (e.g. quarters)
     * @param {Object[]} opts.data.datasets    Array of {name, values[], color?, icon?}
     * @param {number}  [opts.barCount=10]     Visible bar count
     * @param {number}  [opts.barHeight=44]    Row height in px
     * @param {number}  [opts.duration=500]    Milliseconds per frame
     * @param {boolean} [opts.controls=true]   Show play/pause/reset/speed controls
     * @param {boolean} [opts.particles=true]  Floating background particles
     * @param {boolean} [opts.confetti=true]   Confetti on leader change
     * @param {string}  [opts.theme='dark']    'dark' or 'light'
     * @param {Function}[opts.formatValue]     (n) => string
     * @param {Function}[opts.onPlay]
     * @param {Function}[opts.onPause]
     * @param {Function}[opts.onReset]
     * @param {Function}[opts.onFrameChange]   (index, label) => void
     * @param {Function}[opts.onLeaderChange]  (dataset) => void
     * @param {Function}[opts.onComplete]
     */
    constructor(selector, opts = {}) {
      injectStyles();
      this.el =
        typeof selector === 'string'
          ? document.querySelector(selector)
          : selector;
      if (!this.el) throw new Error('BarChartRace: container element not found');

      const d = (this.o = Object.assign(
        {
          title: '',
          subtitle: '',
          data: { labels: [], sublabels: null, datasets: [] },
          barCount: 10,
          barHeight: 44,
          duration: 500,
          controls: true,
          particles: true,
          confetti: true,
          theme: 'dark',
          formatValue: null,
          onPlay: null,
          onPause: null,
          onReset: null,
          onFrameChange: null,
          onLeaderChange: null,
          onComplete: null,
        },
        opts
      ));

      this._frame = 0;
      this._elapsed = 0;
      this._playing = false;
      this._raf = null;
      this._lt = 0;
      this._leader = -1;
      this._ranks = {};
      this._total = d.data.labels.length;
      this._bars = [];
      this._ps = null;

      this._build();
      this._render(0, 0);
    }

    /* ── DOM ── */
    _build() {
      const o = this.o;
      this.el.innerHTML = '';

      const root = (this._root = document.createElement('div'));
      root.className = 'bcr-root bcr-' + o.theme;

      if (o.particles) {
        const cv = document.createElement('canvas');
        cv.className = 'bcr-particles';
        root.appendChild(cv);
        requestAnimationFrame(() => {
          this._ps = new Particles(cv, o.theme);
          this._ps.start();
        });
      }

      this._confLayer = document.createElement('div');
      this._confLayer.className = 'bcr-confetti-layer';
      root.appendChild(this._confLayer);

      const inner = document.createElement('div');
      inner.className = 'bcr-inner';

      // header
      if (o.title || o.subtitle) {
        const hd = document.createElement('div');
        hd.className = 'bcr-header';
        if (o.title) {
          const t = document.createElement('div');
          t.className = 'bcr-title';
          t.textContent = o.title;
          hd.appendChild(t);
        }
        if (o.subtitle) {
          const s = document.createElement('div');
          s.className = 'bcr-subtitle';
          s.textContent = o.subtitle;
          hd.appendChild(s);
        }
        inner.appendChild(hd);
      }

      // labels
      const lw = document.createElement('div');
      lw.className = 'bcr-label-wrap';
      this._lMain = document.createElement('div');
      this._lMain.className = 'bcr-label-main';
      this._lSub = document.createElement('div');
      this._lSub.className = 'bcr-label-sub';
      lw.appendChild(this._lMain);
      lw.appendChild(this._lSub);
      inner.appendChild(lw);

      // progress
      const pw = document.createElement('div');
      pw.className = 'bcr-progress-wrap';
      this._pFill = document.createElement('div');
      this._pFill.className = 'bcr-progress-fill';
      pw.appendChild(this._pFill);
      inner.appendChild(pw);

      // chart
      const chart = (this._chart = document.createElement('div'));
      chart.className = 'bcr-chart';
      chart.style.height = o.barCount * o.barHeight + 'px';

      const bh = o.barHeight;
      const trackH = Math.max(bh - 14, 20);

      o.data.datasets.forEach((ds, i) => {
        const row = document.createElement('div');
        row.className = 'bcr-row';
        row.style.height = bh + 'px';
        row.style.opacity = '0';

        const rank = document.createElement('div');
        rank.className = 'bcr-rank';

        const icon = document.createElement('div');
        icon.className = 'bcr-icon';
        icon.style.background = ds.color || '#668';
        icon.textContent = ds.icon || ds.name.slice(0, 2).toUpperCase();

        const name = document.createElement('div');
        name.className = 'bcr-name';
        name.textContent = ds.name;
        name.title = ds.name;

        const track = document.createElement('div');
        track.className = 'bcr-track';
        track.style.height = trackH + 'px';

        const fill = document.createElement('div');
        fill.className = 'bcr-fill';
        const c = ds.color || '#668';
        fill.style.background = `linear-gradient(90deg,${c}cc,${c})`;
        const rgb = parseColor(c);
        fill.style.boxShadow = `0 0 14px rgba(${rgb.r},${rgb.g},${rgb.b},.3)`;
        fill.style.width = '0%';

        const glow = document.createElement('div');
        glow.className = 'bcr-glow';
        fill.appendChild(glow);
        track.appendChild(fill);

        const val = document.createElement('div');
        val.className = 'bcr-val';

        const chg = document.createElement('div');
        chg.className = 'bcr-change bcr-same';

        row.append(rank, icon, name, track, val, chg);
        chart.appendChild(row);
        this._bars.push({ row, rank, icon, fill, val, chg });
      });

      inner.appendChild(chart);

      // controls
      if (o.controls) {
        const cw = document.createElement('div');
        cw.className = 'bcr-controls';

        const pb = (this._playBtn = document.createElement('button'));
        pb.className = 'bcr-btn bcr-btn-play';
        pb.textContent = '▶  PLAY';
        pb.onclick = () => this.toggle();

        const rb = document.createElement('button');
        rb.className = 'bcr-btn bcr-btn-reset';
        rb.textContent = '↺  RESET';
        rb.onclick = () => this.reset();

        const sel = (this._sel = document.createElement('select'));
        sel.className = 'bcr-select';
        [
          ['🐢 Slow', 1000],
          ['⚡ Normal', 500],
          ['🔥 Fast', 250],
          ['💥 Insane', 100],
        ].forEach(([l, v]) => {
          const op = document.createElement('option');
          op.value = v;
          op.textContent = l;
          if (v === o.duration) op.selected = true;
          sel.appendChild(op);
        });
        sel.onchange = () => this.setSpeed(+sel.value);

        cw.append(pb, rb, sel);
        inner.appendChild(cw);
      }

      root.appendChild(inner);
      this.el.appendChild(root);
    }

    /* ── ANIMATION LOOP ── */
    _tick(ts) {
      if (!this._playing) return;
      if (this._lt === 0) {
        this._lt = ts;
        this._raf = requestAnimationFrame((t) => this._tick(t));
        return;
      }
      const dt = ts - this._lt;
      this._lt = ts;
      this._elapsed += dt;

      const t = clamp(this._elapsed / this.o.duration, 0, 1);
      this._render(this._frame, ease(t));

      if (t >= 1) {
        this._elapsed = 0;
        this._frame++;
        if (this._frame >= this._total - 1) {
          this._frame = this._total - 1;
          this._render(this._frame, 0);
          this.pause();
          if (this.o.onComplete) this.o.onComplete();
          if (this.o.confetti) {
            this._confetti('#ffd700');
            this._confetti('#00d4ff');
          }
          return;
        }
        // pop label
        this._lMain.classList.add('bcr-pop');
        setTimeout(() => this._lMain.classList.remove('bcr-pop'), 180);

        if (this.o.onFrameChange)
          this.o.onFrameChange(this._frame, this.o.data.labels[this._frame]);
      }

      this._raf = requestAnimationFrame((t2) => this._tick(t2));
    }

    /* ── RENDER ── */
    _render(frame, t) {
      const o = this.o;
      const ds = o.data.datasets;
      const next = Math.min(frame + 1, this._total - 1);

      this._lMain.textContent = o.data.labels[frame] || '';
      if (o.data.sublabels)
        this._lSub.textContent = o.data.sublabels[frame] || '';

      const prog = (frame + t) / Math.max(this._total - 1, 1);
      this._pFill.style.width = (prog * 100).toFixed(2) + '%';

      const items = ds.map((d, i) => ({
        i,
        v: lerp(d.values[frame] || 0, d.values[next] || d.values[frame] || 0, t),
      }));
      items.sort((a, b) => b.v - a.v);

      const mx = Math.max(items[0] ? items[0].v : 1, 1);
      const leader = items[0] ? items[0].i : -1;

      if (leader !== this._leader && this._leader !== -1 && this._playing) {
        if (o.confetti) this._confetti(ds[leader].color || '#00d4ff');
        if (o.onLeaderChange) o.onLeaderChange(ds[leader]);
      }
      this._leader = leader;

      for (let r = 0; r < items.length; r++) {
        const it = items[r];
        const b = this._bars[it.i];
        if (r < o.barCount) {
          b.row.style.opacity = '1';
          b.row.style.transform = `translateY(${r * o.barHeight}px)`;
          b.fill.style.width =
            Math.max((it.v / mx) * 100, 0.4).toFixed(2) + '%';
          b.val.textContent = formatValue(it.v, o.formatValue);
          b.rank.textContent = '#' + (r + 1);
          if (r === 0) b.icon.classList.add('bcr-crown');
          else b.icon.classList.remove('bcr-crown');
          const pr = this._ranks[it.i];
          if (pr !== undefined && pr !== r) {
            b.chg.textContent = r < pr ? '▲' : '▼';
            b.chg.className = 'bcr-change ' + (r < pr ? 'bcr-up' : 'bcr-down');
          } else {
            b.chg.textContent = '—';
            b.chg.className = 'bcr-change bcr-same';
          }
        } else {
          b.row.style.opacity = '0';
          b.row.style.transform = `translateY(${o.barCount * o.barHeight}px)`;
        }
        this._ranks[it.i] = r;
      }
    }

    /* ── CONFETTI ── */
    _confetti(base) {
      const ly = this._confLayer;
      const cols = [base, '#00d4ff', '#ff2d95', '#ffd700', '#00ff88', '#fff'];
      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'bcr-confetti';
        const c = cols[(Math.random() * cols.length) | 0];
        const sz = Math.random() * 7 + 4;
        const dur = Math.random() * 1.4 + 1;
        const del = Math.random() * 0.25;
        el.style.cssText = `left:${Math.random() * 100}%;top:-10px;width:${sz}px;height:${sz * 0.55}px;background:${c};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};animation:bcr-cfall ${dur}s ${del}s forwards`;
        ly.appendChild(el);
        setTimeout(() => el.remove(), (dur + del) * 1000 + 50);
      }
    }

    /* ══════════ PUBLIC API ══════════ */

    /** Start or resume playback */
    play() {
      if (this._playing) return this;
      if (this._frame >= this._total - 1) {
        this._frame = 0;
        this._leader = -1;
        this._ranks = {};
      }
      this._playing = true;
      this._lt = 0;
      this._elapsed = 0;
      if (this._playBtn) {
        this._playBtn.textContent = '⏸  PAUSE';
        this._playBtn.classList.add('bcr-active');
      }
      this._raf = requestAnimationFrame((t) => this._tick(t));
      if (this.o.onPlay) this.o.onPlay();
      return this;
    }

    /** Pause playback */
    pause() {
      this._playing = false;
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._playBtn) {
        this._playBtn.textContent = '▶  PLAY';
        this._playBtn.classList.remove('bcr-active');
      }
      if (this.o.onPause) this.o.onPause();
      return this;
    }

    /** Toggle play/pause */
    toggle() {
      return this._playing ? this.pause() : this.play();
    }

    /** Reset to frame 0 */
    reset() {
      this.pause();
      this._frame = 0;
      this._elapsed = 0;
      this._leader = -1;
      this._ranks = {};
      this._render(0, 0);
      if (this.o.onReset) this.o.onReset();
      return this;
    }

    /** Set playback speed (ms per frame) */
    setSpeed(ms) {
      this.o.duration = ms;
      return this;
    }

    /** Jump to a specific frame */
    goToFrame(n) {
      this._frame = clamp(n, 0, this._total - 1);
      this._elapsed = 0;
      this._render(this._frame, 0);
      return this;
    }

    /** Replace data and re-render (same datasets structure) */
    setData(newData) {
      this.o.data = newData;
      this._total = newData.labels.length;
      this.reset();
      return this;
    }

    /** Current frame index */
    get currentFrame() {
      return this._frame;
    }
    /** Whether currently playing */
    get isPlaying() {
      return this._playing;
    }
    /** Total number of frames */
    get totalFrames() {
      return this._total;
    }

    /** Clean up and remove all DOM / listeners */
    destroy() {
      this.pause();
      if (this._ps) this._ps.stop();
      this.el.innerHTML = '';
    }
  }

  return BarChartRace;
});
