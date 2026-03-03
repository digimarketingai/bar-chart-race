# 🏆 BarChartRace.js

A zero-dependency, ultra-smooth animated bar chart race library. One JS file. No build step. Styles auto-inject. Just link and go.

## 🎬 Live Demo

👉 **[digimarketingai.github.io/bar-chart-race](https://digimarketingai.github.io/bar-chart-race/)**

---

## 🔗 Use It On Your Website

**One script tag. That's it.** CSS is auto-injected — no extra stylesheet needed.

```html
<div id="race"></div>

<script src="https://digimarketingai.github.io/bar-chart-race/BarChartRace.js"></script>
<script>
  new BarChartRace('#race', {
    title: 'My Race',
    data: {
      labels: ['2020', '2021', '2022', '2023', '2024'],
      datasets: [
        { name: 'Apple',   color: '#a8a8a8', values: [274, 365, 394, 383, 391] },
        { name: 'Google',  color: '#4285f4', values: [182, 257, 282, 307, 350] },
        { name: 'Amazon',  color: '#ff9900', values: [386, 469, 514, 574, 620] },
        { name: 'Tesla',   color: '#cc0000', values: [31, 53, 81, 96, 115] },
      ]
    }
  });
</script>
```

No CSS file. No build tools. No npm. Works anywhere.

---

## ⚙️ All Options

```javascript
new BarChartRace('#race', {

  // ── Content ──
  title:      '🚀 My Race',                // Chart title (gradient text)
  subtitle:   'Some description',           // Smaller subtitle

  // ── Data ──
  data: {
    labels:    ['2020', '2021', '2022'],    // One label per frame (shown large)
    sublabels: ['Q1', 'Q2', 'Q3'],          // Optional sub-label per frame
    datasets: [
      {
        name:   'Apple',                    // Display name
        icon:   'AP',                       // 2-char badge (default: first 2 letters)
        color:  '#a8a8a8',                  // Bar color (hex)
        values: [274, 365, 394]             // One value per frame
      }
    ]
  },

  // ── Display ──
  barCount:   10,         // Number of visible bars
  barHeight:  44,         // Row height in pixels
  theme:      'dark',     // 'dark' or 'light'

  // ── Playback ──
  duration:   500,        // Milliseconds per frame
  controls:   true,       // Show play/pause/reset/speed buttons

  // ── Effects ──
  particles:  true,       // Floating background particles
  confetti:   true,       // Confetti burst on leader change

  // ── Formatting ──
  formatValue: (n) => {   // Custom value formatter
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    return n.toLocaleString();
  },

  // ── Callbacks ──
  onPlay:          () => {},                    // Fired on play
  onPause:         () => {},                    // Fired on pause
  onReset:         () => {},                    // Fired on reset
  onFrameChange:   (index, label) => {},        // Fired each frame
  onLeaderChange:  (dataset) => {},             // Fired when #1 changes
  onComplete:      () => {}                     // Fired at the end
});
```

---

## 🧩 API Methods

```javascript
const race = new BarChartRace('#race', { ... });

race.play();            // Start or resume
race.pause();           // Pause
race.toggle();          // Toggle play/pause
race.reset();           // Reset to frame 0
race.goToFrame(15);     // Jump to specific frame
race.setSpeed(250);     // Change ms per frame
race.setData(newData);  // Replace data & reset
race.destroy();         // Remove everything

// Read-only properties
race.currentFrame;      // Current frame index
race.isPlaying;         // Boolean
race.totalFrames;       // Total number of frames
```

---

## 💡 Examples

### Minimal (3 lines)

```html
<div id="r"></div>
<script src="https://digimarketingai.github.io/bar-chart-race/bar-chart-race.js"></script>
<script>
  new BarChartRace('#r', {
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        { name: 'A', color: '#f44', values: [10, 30, 20, 50] },
        { name: 'B', color: '#44f', values: [5, 25, 40, 35] },
        { name: 'C', color: '#4f4', values: [20, 10, 35, 45] },
      ]
    }
  }).play();
</script>
```

### Light Theme

```javascript
new BarChartRace('#race', {
  theme: 'light',
  data: { ... }
});
```

### Auto-play

```javascript
new BarChartRace('#race', { data: { ... } }).play();
```

### Custom Formatting

```javascript
new BarChartRace('#race', {
  data: { ... },
  formatValue: (n) => '$' + Math.round(n) + 'M'
});
```

### React / Vue / Svelte

Works in any framework. Just call it on a mounted DOM element:

```javascript
// React example (inside useEffect)
useEffect(() => {
  const race = new BarChartRace(ref.current, { data: { ... } });
  return () => race.destroy();
}, []);
```

---

## 📁 Project Structure

```
bar-chart-race/
├── index.html            ← Demo page
├── bar-chart-race.js     ← Library (this is the only file users need)
└── README.md
```

---

## ✨ Features

- 🏎️ Silky 60fps animation with cubic-bezier easing
- 👑 Crown badge on the #1 leader
- 🎊 Confetti explosions on leader changes
- ▲▼ Rank change indicators
- 🎮 Built-in controls (play, pause, reset, 4 speed modes)
- 🌌 Particle canvas background
- 🌗 Dark & light themes
- 📱 Fully responsive
- 0️⃣ Zero dependencies — single JS file
- 💉 CSS auto-injects — no stylesheet to link
- 🔌 Works everywhere — vanilla, React, Vue, Svelte, WordPress
- 📦 UMD module — works with `<script>`, `require()`, and `import`

---

## 📄 License

MIT — free to use, modify, and share.

---

<p align="center">
  Built by <a href="https://github.com/digimarketingai">digimarketingai</a>
</p>
