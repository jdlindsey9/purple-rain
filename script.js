const canvas = document.getElementById("rain");
const ctx = canvas.getContext("2d", { alpha: true });

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timeLeftEl = document.getElementById("timeLeft");
const audioEl = document.getElementById("audio");

let w, h, dpr;
let drops = [];
let animId = null;

const DURATION_MS = 8 * 60 * 1000; // 8 minutes
let endAt = null;
let running = false;

function resize() {
  dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  w = Math.floor(window.innerWidth);
  h = Math.floor(window.innerHeight);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function makeDrops(count) {
  drops = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    len: 12 + Math.random() * 20,
    speed: 7 + Math.random() * 12,
    width: 1 + Math.random() * 1.2,
    alpha: 0.25 + Math.random() * 0.45,
    hueShift: -10 + Math.random() * 20
  }));
}

// density scales with screen size
makeDrops(Math.min(900, Math.floor((w * h) / 1800)));

function drawBackgroundGlow() {
  // subtle purple haze
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 40, w * 0.3, h * 0.2, Math.min(w, h) * 0.9);
  g.addColorStop(0, "rgba(184,76,255,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function step() {
  ctx.clearRect(0, 0, w, h);
  drawBackgroundGlow();

  // draw rain
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const d of drops) {
    const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
    // purple rain color
    grad.addColorStop(0, `rgba(210, 170, 255, 0)`);
    grad.addColorStop(0.2, `rgba(184, 76, 255, ${d.alpha})`);
    grad.addColorStop(1, `rgba(130, 40, 255, 0)`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = d.width;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x, d.y + d.len);
    ctx.stroke();

    d.y += d.speed;
    d.x += Math.sin((d.y + d.x) * 0.002) * 0.35;

    if (d.y > h + 40) {
      d.y = -40 - Math.random() * 200;
      d.x = Math.random() * w;
    }
    if (d.x < -50) d.x = w + 50;
    if (d.x > w + 50) d.x = -50;
  }

  ctx.restore();

  // timing
  if (running && endAt != null) {
    const msLeft = Math.max(0, endAt - Date.now());
    updateTimer(msLeft);

    if (msLeft <= 0) {
      stop();
      return;
    }
  }

  animId = requestAnimationFrame(step);
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateTimer(msLeft) {
  timeLeftEl.textContent = formatTime(msLeft);
}

function start() {
  if (running) return;
  running = true;

  endAt = Date.now() + DURATION_MS;
  updateTimer(DURATION_MS);

  startBtn.disabled = true;
  stopBtn.disabled = false;

  // Try to play audio (will work only if a valid audio file exists AND user gesture allowed)
  try {
    audioEl.currentTime = 0;
    // If there's no file, this will silently fail or show error in console.
    audioEl.play().catch(() => {});
  } catch {}

  if (!animId) step();
}

function stop() {
  running = false;
  endAt = null;

  startBtn.disabled = false;
  stopBtn.disabled = true;

  try {
    audioEl.pause();
    audioEl.currentTime = 0;
  } catch {}

  updateTimer(DURATION_MS);
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);

// start animation loop immediately (visual only)
step();
updateTimer(DURATION_MS);
