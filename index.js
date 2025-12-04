const qs = new URLSearchParams(location.search);
const presetSongIdx = qs.get("song"); // optional index to force a song
const messageEl = document.getElementById("message");
const headline = document.getElementById("headline");
const sub = document.getElementById("sub");
const surpriseBtn = document.getElementById("surpriseBtn");
const musicBtn = document.getElementById("musicBtn");
const fixBtn = document.getElementById("fixBtn");
const paletteEl = document.getElementById("palette");
const card = document.getElementById("card");
const avatar = document.getElementById("avatar");
const page1 = document.getElementById("page-1");
const page2 = document.getElementById("page-2");
const candleEle = document.getElementById("candle");
const wishTipsEle = document.getElementById("wishTips");
const msgBox = document.getElementById("messageBox");
const msgText = document.getElementById("messageText");

let current = {
  songIdx: null,
  paletteIdx: null,
  audioEl: null,
};

let charIndex = 0;
let typingTimer = null;

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
function showLyric(text) {
  typeWriterWrite(text, () => {
    avatar.innerText = EMOJIS[pickRandom(EMOJIS)];
  });
}

function showMessage(i) {
  const text = MESSAGES[i] || "生日快乐 🎂";
  typeWriterWrite(text, () => {
    avatar.innerText = EMOJIS[pickRandom(EMOJIS)];
  });
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
  sub.innerText = AUDIO_LIST[i].name;
  showLyric(AUDIO_LIST[i].lyrics);
  current.songIdx = i;
}

/* share link (固定当前随机选择) */
function makeShareLink() {
  const base = location.origin + location.pathname;
  const params = new URLSearchParams();
  if (current.songIdx != null) params.set("song", current.songIdx);
  const url = base + "?" + params.toString();
  navigator.clipboard
    ?.writeText(url)
    .then(() => {
      alert("分享链接已复制到剪贴板~！");
    })
    .catch(() => {
      prompt("复制下面的链接：", url);
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

function switchPage(pageHide, pageShow) {
  pageShow.classList.remove("hide");
  pageShow.classList.remove("fade-out");
  pageHide.classList.add("fade-out");
  pageHide.addEventListener("transitionend", function handler() {
    pageHide.classList.add("hide");
    pageHide.classList.remove("fade-out");
    pageHide.removeEventListener("transitionend", handler);
  });
}

function typeWriterWrite(text, callback) {
  clearTimeout(typingTimer);
  msgText.textContent = "";
  charIndex = 0;
  msgBox.style.opacity = 1;

  function type() {
    if (charIndex < text.length) {
      msgText.textContent += text.charAt(charIndex);
      charIndex++;
      typingTimer = setTimeout(type, 80);
    } else {
      if (callback) callback();
    }
  }
  type();
}

/* initialization */
function init() {
  // apply preset palette or random
  const pIdx = pickRandom(PALETTES);
  applyPalette(pIdx);
  // choose message and song
  let songIdx;
  if (
    presetSongIdx !== null &&
    presetSongIdx !== undefined &&
    AUDIO_LIST[presetSongIdx]
  ) {
    songIdx = Number(presetSongIdx);
    showLyric(AUDIO_LIST[presetSongIdx].lyrics);
  } else {
    songIdx = pickRandom(AUDIO_LIST);
    const msgIdx = pickRandom(MESSAGES);
    showMessage(msgIdx);
  }
  current.songIdx = songIdx;
  setTimeout(() => {
    wishTipsEle.classList.remove("opacity");
  }, 7000);
  // handlers
  candleEle.onclick = () => {
    switchPage(page1, page2);
    playSong(current.songIdx);
  };
  surpriseBtn.onclick = () => {
    const i = pickRandom(MESSAGES);
    showMessage(i);
    const pIdx = pickRandom(PALETTES);
    applyPalette(pIdx);
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
    const pIdx = pickRandom(PALETTES);
    applyPalette(pIdx);
    burstConfetti();
  };
  fixBtn.onclick = makeShareLink;
  sub.innerText = "点击“点我抽一条祝福”或“播放随机歌曲”开始吧。";
}

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  // clear confetti canvas size on resize
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
});
