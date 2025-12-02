// —————————————— 随机祝福语 ——————————————
const wishes = [
  "愿你新的一岁：平安、顺心、无忧无虑！",
  "愿所有的快乐和好运都奔向你！",
  "愿你永远被世界温柔以待～",
  "愿你此生尽兴、赤诚善良！",
  "愿你走过的每一步都是鲜花与掌声！",
  "愿你心中有光，笑容灿烂！",
  "愿你被爱包围，永远开心！",
  "新的一岁，继续闪闪发光！",
];

let wishIndex = 0;
let charIndex = 0;
const wishBox = document.getElementById("wishBox");
const wishText = document.getElementById("wishText");

function typeWriter() {
  const currentWish = wishes[wishIndex];
  wishBox.style.opacity = 1; // 显示祝福语区域

  if (charIndex < currentWish.length) {
    wishText.textContent += currentWish.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 80); // 打字速度
  } else {
    // 打完单句后停留 1.5 秒
    setTimeout(() => fadeOutWish(), 1500);
  }
}

function fadeOutWish() {
  wishBox.style.opacity = 0;
  setTimeout(() => {
    charIndex = 0;
    wishText.textContent = "";

    // 下一条祝福语
    wishIndex = (wishIndex + 1) % wishes.length;

    // 淡出后再淡入下一句
    setTimeout(typeWriter, 600);
  }, 600);
}

// 页面载入 2 秒后触发祝福轮播
setTimeout(typeWriter, 2000);

// 歌曲处理
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const list = document.getElementById("musicList");

// 插入 option
for (let i = 0; i < songs.length; i++) {
  const op = document.createElement("option");
  op.value = songs[i].url;
  op.textContent = `${String(i + 1).padStart(2, "0")} - ${songs[i].name}`;
  list.appendChild(op);
}

// 默认加载第一首
list.value = songs[0].url;
audio.src = songs[0].url;

// 进入页面自动播放
window.addEventListener("load", () => {
  audio.play().catch(() => {
    console.log("自动播放被浏览器限制，需要用户点击。");
  });
});

// 播放/暂停
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
});

// 更新按钮图标
audio.addEventListener("play", () => (playBtn.textContent = "⏸"));
audio.addEventListener("pause", () => (playBtn.textContent = "▶"));

// 切歌
list.addEventListener("change", () => {
  audio.src = list.value;
  audio.play();
});

// —————————————— 歌词面板显示 / 隐藏 ——————————————

function toggleLyrics() {
  const panel = document.getElementById("lyricsPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}
