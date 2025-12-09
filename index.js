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
const page3 = document.getElementById("page-3");
const candleEle = document.getElementById("candle");
const wishTipsEle = document.getElementById("wishTips");
const msgBox = document.getElementById("messageBox");
const msgText = document.getElementById("messageText");
const envelopeIcon = document.getElementById("envelopeIcon");
const letterContent = document.getElementById("letterContent");
const imageGrid = document.getElementById("imageGrid");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeModal");

let current = {
  songIdx: null,
  paletteIdx: null,
  audioEl: null,
};

let charIndex = 0;
let typingTimer = null;

function pickRandom(arr, excludeLetterOnly = false) {
  if (excludeLetterOnly && arr === AUDIO_LIST) {
    const normalSongs = arr.filter(song => !song.isLetterOnly);
    return Math.floor(Math.random() * normalSongs.length);
  }
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
function playSong(i, isLoop = false, autoPlayNext = true) {
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
  audio.loop = isLoop; // 设置循环播放
  audio.style.marginLeft = "10px";
  
  // 添加播放结束事件监听器
  if (!isLoop && autoPlayNext) {
    audio.addEventListener('ended', () => {
      playNextRandomSong();
    });
  }
  
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

/* 播放下一首随机歌曲（不包括《样子》） */
function playNextRandomSong() {
  let nextSongIdx;
  do {
    nextSongIdx = pickRandom(AUDIO_LIST, true);
  } while (nextSongIdx === current.songIdx);
  
  current.songIdx = nextSongIdx;
  playSong(nextSongIdx, false, true);
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

/* 播放信件页面专属歌曲 */
function playLetterSong() {
  const letterSongIndex = AUDIO_LIST.findIndex(song => song.id === 'letter');
  if (letterSongIndex !== -1) {
    playSong(letterSongIndex, true); // 设置为循环播放
  }
}

/* 加载图片配置 */
function loadImages() {
  // 图片配置 - 可以在这里添加更多图片
  const images = [
    { id: 1, src: '/images/1.png', alt: '回忆1' },
    { id: 2, src: '/images/2.png', alt: '回忆2' },
    { id: 3, src: '/images/3.png', alt: '回忆3' },
    { id: 4, src: '/images/4.png', alt: '回忆4' },
    { id: 5, src: '/images/5.png', alt: '回忆5' },
  ];

  const imageGrid = document.getElementById('imageGrid');
  imageGrid.innerHTML = ''; // 清空现有内容

  // 动态生成图片元素
  images.forEach((image, index) => {
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.image = image.id;
    imageItem.dataset.index = index;

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt;
    img.loading = 'lazy';

    imageItem.appendChild(img);
    imageGrid.appendChild(imageItem);
  });

  return images;
}

/* 加载信件内容 */
async function loadLetterContent() {
  try {
    const response = await fetch('1.txt');
    const text = await response.text();
    letterContent.textContent = text;
    // 加载信件内容后播放样子
    playLetterSong();
    // 加载图片
    loadImages();
  } catch (error) {
    console.error('加载信件内容失败:', error);
    letterContent.textContent = '亲爱的小梨老师，\n\n在这个特别的日子里，我想对你说一声生日快乐！\n\n感谢你一直以来对我的关心和指导...\n\n生日快乐！🎂🎉🎁';
  }
}

/* 显示图片模态框 */
function showImageModal(imageSrc) {
  modalImage.src = imageSrc;
  imageModal.style.display = "block";
  document.body.style.overflow = "hidden";
}

/* 关闭图片模态框 */
function closeImageModal() {
  imageModal.style.display = "none";
  document.body.style.overflow = "auto";
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
    songIdx = pickRandom(AUDIO_LIST, true);
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
    playSong(current.songIdx, false, true);
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
        n = pickRandom(AUDIO_LIST, true);
      } while (n === current.songIdx);
      current.songIdx = n;
      playSong(n, false, true);
    } catch (e) {
      console.error(e);
      console.log("播放失败，检查音频路径或浏览器策略");
    }
    const pIdx = pickRandom(PALETTES);
    applyPalette(pIdx);
    burstConfetti();
  };
  fixBtn.onclick = makeShareLink;
  
  // 信封图标点击事件
  envelopeIcon.onclick = () => {
    // 停止当前播放的音乐
    if (current.audioEl) {
      current.audioEl.pause();
      current.audioEl.remove();
      current.audioEl = null;
    }
    switchPage(page2, page3);
    loadLetterContent();
  };
  
  
  // 图片点击事件
  imageGrid.onclick = (e) => {
    const imageItem = e.target.closest('.image-item');
    if (imageItem) {
      const img = imageItem.querySelector('img');
      if (img) {
        // 直接显示原图，不进行尺寸替换
        showImageModal(img.src);
      }
    }
  };
  
  // 模态框关闭事件
  closeModal.onclick = closeImageModal;
  
  // 点击模态框关闭（点击背景或非图片区域）
  imageModal.onclick = (e) => {
    if (e.target === imageModal || e.target === modalImage.parentElement) {
      closeImageModal();
    }
  };
  
  // 阻止图片点击事件冒泡，防止点击图片时关闭模态框
  modalImage.onclick = (e) => {
    e.stopPropagation();
  };
  
  // ESC键关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.style.display === 'block') {
      closeImageModal();
    }
  });
  
  sub.innerText = "点击\"点我抽一条祝福\"或\"播放随机歌曲\"开始吧。";
}

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  // clear confetti canvas size on resize
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
});
