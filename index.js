const qs = new URLSearchParams(location.search);
const presetMsgIdx = qs.get("msg"); // optional index to force a message
const presetSongIdx = qs.get("song"); // optional index to force a song
const presetPalette = qs.get("palette"); // optional palette idx
const messageEl = document.getElementById("message");
const headline = document.getElementById("headline");
const sub = document.getElementById("sub");
const surpriseBtn = document.getElementById("surpriseBtn");
const musicBtn = document.getElementById("musicBtn");
const fixBtn = document.getElementById("fixBtn");
const paletteEl = document.getElementById("palette");
const card = document.getElementById("card");
const avatar = document.getElementById("avatar");

let current = {
  msgIdx: null,
  songIdx: null,
  paletteIdx: null,
  audioEl: null,
};

function pickRandom(arr) {
  return Math.floor(Math.random() * arr.length);
}

function applyPalette(idx) {
  const p = PALETTES[idx];
  document.documentElement.style.setProperty("--bg1", p[0]);
  document.documentElement.style.setProperty("--bg2", p[1]);
  document.documentElement.style.setProperty("--accent", p[2]);
  current.paletteIdx = idx;
  // avatar border color update
  avatar.style.borderColor = hexToRgba(p[2], 0.6);
}

/* small helper */
function hexToRgba(hex, a) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* show message with tiny animation */
function showMessage(i) {
  const text = MESSAGES[i] || "祝你生日快乐！";
  // headline.innerText = "生日快乐 🎂";
  messageEl.style.opacity = 0;
  setTimeout(() => {
    messageEl.innerText = text;
    messageEl.style.opacity = 1;
  }, 220);
  current.msgIdx = i;
  // occasional emoji avatar change
  const emojis = ["🎉", "🥳", "🎂", "💫", "✨", "🎈"];
  avatar.innerText = emojis[i % emojis.length];
}

/* music handling */
function playSong(i) {
  if (current.audioEl) {
    current.audioEl.pause();
    current.audioEl.remove();
    current.audioEl = null;
  }
  const src = AUDIO_LIST[i].url;
  if (!src) {
    console.log("没有可用的音频资源", i);
    return;
  }
  const audio = document.createElement("audio");
  audio.src = src;
  audio.controls = true;
  audio.autoplay = true;
  audio.style.marginLeft = "10px";
  // ensure user action first (browsers may block autoplay)
  audio.play().catch(() => {
    console.log("浏览器阻止自动播放，请点击播放按钮以开始音乐。");
  });
  musicBtn.after(audio);
  current.audioEl = audio;
  current.songIdx = i;
}

/* share link (固定当前随机选择) */
function makeShareLink() {
  const base = location.origin + location.pathname;
  const params = new URLSearchParams();
  if (current.msgIdx != null) params.set("msg", current.msgIdx);
  if (current.songIdx != null) params.set("song", current.songIdx);
  if (current.paletteIdx != null) params.set("palette", current.paletteIdx);
  const url = base + "?" + params.toString();
  navigator.clipboard
    ?.writeText(url)
    .then(() => {
      console.log("分享链接已复制到剪贴板！");
    })
    .catch(() => {
      prompt("复制下面的链接：", url);
    });
}

/* render palette selectors */
function renderPaletteSelectors() {
  PALETTES.forEach((p, idx) => {
    const s = document.createElement("div");
    s.className = "swatch";
    s.title = `配色 ${idx + 1}`;
    s.style.background = `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
    s.onclick = () => {
      applyPalette(idx);
    };
    paletteEl.appendChild(s);
  });
}

/* confetti simple implementation */
function burstConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = card.clientWidth * dpr;
  canvas.height = card.clientHeight * dpr;
  canvas.style.width = card.clientWidth + "px";
  canvas.style.height = card.clientHeight + "px";
  ctx.scale(dpr, dpr);
  let pieces = [];
  const colors = [
    getComputedStyle(document.documentElement).getPropertyValue("--accent") ||
      "#ff6b6b",
    "#ffd166",
    "#06d6a0",
    "#4cc9f0",
  ];
  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: Math.random() * card.clientWidth,
      y: (Math.random() * card.clientHeight) / 2,
      r: 6 + Math.random() * 8,
      dx: -3 + Math.random() * 6,
      dy: 1 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rotd: -5 + Math.random() * 10,
    });
  }
  let t = 0;
  function frame() {
    ctx.clearRect(0, 0, card.clientWidth, card.clientHeight);
    pieces.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy + Math.sin(t / 10) * 0.5;
      p.rot += p.rotd;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    });
    t++;
    pieces = pieces.filter((p) => p.y < card.clientHeight + 20);
    if (pieces.length > 0) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, card.clientWidth, card.clientHeight);
  }
  frame();
}

/* initialization */
function init() {
  renderPaletteSelectors();
  // apply preset palette or random
  const pIdx =
    presetPalette !== null &&
    presetPalette !== undefined &&
    PALETTES[presetPalette]
      ? Number(presetPalette)
      : pickRandom(PALETTES);
  applyPalette(pIdx);
  // choose message and song
  const msgIdx =
    presetMsgIdx !== null &&
    presetMsgIdx !== undefined &&
    MESSAGES[presetMsgIdx]
      ? Number(presetMsgIdx)
      : pickRandom(MESSAGES);
  showMessage(msgIdx);
  const songIdx =
    presetSongIdx !== null &&
    presetSongIdx !== undefined &&
    AUDIO_LIST[presetSongIdx]
      ? Number(presetSongIdx)
      : pickRandom(AUDIO_LIST);
  current.songIdx = songIdx;
  playSong(songIdx)

  // handlers
  surpriseBtn.onclick = () => {
    const i = pickRandom(MESSAGES);
    showMessage(i);
    burstConfetti();
  };
  musicBtn.onclick = () => {
    try {
      let n;
      do {
        n = pickRandom(AUDIO_LIST);
      } while (n === current.songIdx);
      current.songIdx = n;
      playSong(n);
    } catch (e) {
      console.error(e);
      console.log("播放失败，检查音频路径或浏览器策略");
    }
  };

  fixBtn.onclick = makeShareLink;

  // small tip in subline
  sub.innerText = "点击“点我抽一条祝福”或“播放随机歌曲”开始吧。";
}

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  // clear confetti canvas size on resize
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
});
