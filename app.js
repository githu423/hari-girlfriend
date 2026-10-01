/* ============================================================
   My Girl Day ❤️ — app.js
   Story: gift → ucapan → mawar → video → sertifikat → the end
   ============================================================ */
"use strict";

/* ================= KONFIGURASI ================= */
const CFG = {
  from: "Ibah Misbah",
  to: "Sinta Liya",
  place: "Bandung",
  videoSrc: "video.mp4",          // taruh file video di folder root
  signatureSrc: "tanda-tangan.png", // taruh PNG tanda tanganmu di folder root
  date: null,                      // null = tanggal hari ini (format Indonesia)
  maxRoses: 12,
  holdMs: 2000,
  signatureKey: "mgd-signature-v1",
};

const todayStr = () =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
const CERT_DATE = (CFG.date || todayStr());
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= TOAST ================= */
const toastEl = $("#toast");
let toastTimer = null;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

/* ================= AUDIO (kotak musik + sfx) ================= */
const AudioFX = (() => {
  let ctx = null, master = null;
  let musicOn = false, muted = false, schedTimer = null, nextT = 0, ni = 0;
  const EIGHTH = 0.26;

  const F = {
    G2: 98, A2: 110, Bb2: 116.54, C3: 130.81, E3: 164.81, F3: 174.61, G3: 196,
    A3: 220, Bb3: 233.08, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63,
    F4: 349.23, G4: 392, Gs4: 415.3, A4: 440, Bb4: 466.16, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5,
  };
  // Canon in D — arpeggio (kotak musik)
  const PROG = [
    ["C4", "E4", "G4", "C5", "C3"],
    ["G3", "B3", "D4", "G4", "G2"],
    ["A3", "C4", "E4", "A4", "A2"],
    ["E4", "Gs4", "B4", "E5", "E3"],
    ["F4", "A4", "C5", "F5", "F3"],
    ["Bb3", "D4", "F4", "Bb4", "Bb2"],
    ["G3", "B3", "D4", "G4", "G2"],
    ["A3", "C4", "E4", "A4", "A2"],
  ];

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);
    } catch (e) { return false; }
    return true;
  }
  function note(freq, t, gain = 0.16, dur = 1.15, type = "sine") {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
    // kilau kotak musik (oktav atas, lebih pendek)
    if (type === "sine" && freq < 900) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = "sine"; o2.frequency.value = freq * 2;
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.linearRampToValueAtTime(gain * 0.22, t + 0.006);
      g2.gain.exponentialRampToValueAtTime(0.0003, t + 0.4);
      o2.connect(g2); g2.connect(master);
      o2.start(t); o2.stop(t + 0.5);
    }
  }
  function tick() {
    while (nextT < ctx.currentTime + 0.45) {
      const chord = PROG[(ni / 4) | 0];
      const idx = ni % 4;
      note(F[chord[idx]], nextT, 0.15);
      if (idx === 0) note(F[chord[4]], nextT, 0.07, 1.4, "triangle");
      nextT += EIGHTH;
      ni = (ni + 1) % (PROG.length * 4);
    }
  }
  return {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
    },
    startMusic() {
      if (!ensure() || musicOn) return;
      musicOn = true;
      nextT = ctx.currentTime + 0.1;
      ni = 0;
      tick();
      schedTimer = setInterval(() => { if (ctx.state === "running") tick(); }, 120);
    },
    stopMusic() {
      musicOn = false;
      clearInterval(schedTimer);
    },
    get muted() { return muted; },
    setMuted(m) {
      muted = m;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.05);
      }
    },
    pop(p = 1) {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(540 * p, t);
      o.frequency.exponentialRampToValueAtTime(170 * p, t + 0.1);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.14);
    },
    chime() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => note(f, t + i * 0.07, 0.13, 0.6));
    },
    ding() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, t);
      o.frequency.linearRampToValueAtTime(1567, t + 0.16);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    },
  };
})();

/* ================= PARTIKEL (fx canvas) ================= */
const FX = (() => {
  const cv = $("#fx"), cx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, petals = [], sparks = [], bursts = [], running = !REDUCED;

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function petal() {
    return {
      x: rand(0, W), y: rand(-H, 0),
      vy: rand(0.35, 0.85), sway: rand(0.4, 1.1), ph: rand(0, 6.28),
      rot: rand(0, 6.28), vr: rand(-0.02, 0.02),
      s: rand(6, 13),
      c: pick(["#e0526b", "#c9405a", "#ff9fb0", "#e6495b"]),
      t: 0,
    };
  }
  function spark() {
    return { x: rand(0, W), y: rand(0, H), s: rand(0.8, 2), ph: rand(0, 6.28), w: rand(0.02, 0.06), vy: rand(-0.05, 0.02) };
  }
  function init() {
    resize();
    addEventListener("resize", resize);
    if (REDUCED) return;
    for (let i = 0; i < 16; i++) { const p = petal(); p.y = rand(0, H); petals.push(p); }
    for (let i = 0; i < 26; i++) sparks.push(spark());
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden && !REDUCED;
      if (running) last = performance.now();
    });
    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!running) { last = now; return; }
      const dt = clamp(now - last, 0, 50) / 16.7; last = now;
      cx.clearRect(0, 0, W, H);

      // kilau emas
      for (const s of sparks) {
        s.y += s.vy * dt; s.ph += s.w * dt * 16.7 * 0.06;
        if (s.y < -4) s.y = H + 4;
        const a = 0.25 + 0.55 * Math.abs(Math.sin(s.ph));
        cx.globalAlpha = a;
        cx.fillStyle = "#ffd9a0";
        cx.beginPath(); cx.arc(s.x, s.y, s.s, 0, 7); cx.fill();
      }
      cx.globalAlpha = 1;

      // kelopak mawar
      for (const p of petals) {
        p.t += dt; p.y += p.vy * dt; p.x += Math.sin(p.t * 0.02 * p.sway + p.ph) * 0.5 * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 20) { Object.assign(p, petal()); }
        cx.save();
        cx.translate(p.x, p.y); cx.rotate(p.rot);
        cx.globalAlpha = 0.85; cx.fillStyle = p.c;
        cx.beginPath();
        cx.moveTo(0, -p.s);
        cx.quadraticCurveTo(p.s * 0.9, -p.s * 0.3, 0, p.s);
        cx.quadraticCurveTo(-p.s * 0.9, -p.s * 0.3, 0, -p.s);
        cx.fill();
        cx.restore();
      }
      cx.globalAlpha = 1;

      // ledakan (hati / confetti)
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt;
        b.vy += (b.grav || 0.1) * dt; b.vx *= 0.985; b.rot += b.vr * dt;
        const life = 1 - b.age / b.max;
        if (life <= 0) { bursts.splice(i, 1); continue; }
        cx.save();
        cx.globalAlpha = clamp(life * 1.4, 0, 1);
        cx.translate(b.x, b.y); cx.rotate(b.rot);
        cx.fillStyle = b.c;
        if (b.kind === "heart") {
          cx.scale(b.s / 10, b.s / 10);
          cx.beginPath();
          cx.moveTo(0, 5);
          cx.bezierCurveTo(-6, 0, -6, -5, -3, -5);
          cx.bezierCurveTo(-1.2, -5, 0, -3.4, 0, -2.2);
          cx.bezierCurveTo(0, -3.4, 1.2, -5, 3, -5);
          cx.bezierCurveTo(6, -5, 6, 0, 0, 5);
          cx.fill();
        } else if (b.kind === "confetti") {
          cx.fillRect(-b.s * 0.35, -b.s * 0.6, b.s * 0.7, b.s * 1.2);
        }
        cx.restore();
      }
    })(performance.now());
  }
  function heart(x, y, n, spread = 5) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.28), v = rand(1, spread);
      bursts.push({
        kind: "heart", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.6,
        rot: rand(-0.6, 0.6), vr: rand(-0.08, 0.08),
        s: rand(7, 15), c: pick(["#ff4d6d", "#ff8fa8", "#ffd9a0", "#e6495b", "#ffb3c1"]),
        age: 0, max: rand(55, 90), grav: 0.11,
      });
    }
  }
  function confetti(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(-2.6, -0.5), v = rand(3, 8);
      bursts.push({
        kind: "confetti", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: rand(0, 6.28), vr: rand(-0.2, 0.2),
        s: rand(7, 13), c: pick(["#ffd9a0", "#e8b96a", "#ff8fa8", "#e6495b", "#fff6ee"]),
        age: 0, max: rand(70, 110), grav: 0.16,
      });
    }
  }
  return { init, heart, confetti };
})();

/* ================= SLIDE MANAGER ================= */
const slides = $$(".slide");
const dotsEl = $("#dots");
let cur = 0, maxVisited = 0, nameSplitDone = false;
const HEART_D = "M12 21s-8.2-5.4-10.6-9.4C-.7 8.5 1.6 4.4 5.5 4.4c2.4 0 4.1 1.4 6.5 4.1 2.4-2.7 4.1-4.1 6.5-4.1 3.9 0 6.2 4.1 4.1 7.2C20.2 15.6 12 21 12 21z";

function buildDots() {
  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.setAttribute("aria-label", "Langkah " + (i + 1));
    b.innerHTML = `<svg viewBox="0 0 24 24"><path class="h" d="${HEART_D}"/></svg>`;
    b.addEventListener("click", () => { if (i <= maxVisited) goTo(i); });
    dotsEl.appendChild(b);
  });
}
function onEnter(i) {
  if (i === 1) {
    if (!nameSplitDone) {
      nameSplitDone = true;
      const el = $("#nameAnim");
      const txt = el.textContent;
      el.textContent = "";
      [...txt].forEach((ch, k) => {
        const sp = document.createElement("span");
        sp.className = "ch";
        sp.textContent = ch === " " ? "\u00A0" : ch;
        sp.style.animationDelay = (k * 90) + "ms";
        el.appendChild(sp);
      });
    }
    revealLetter($("#s-hello"));
  }
  if (i === 5) {
    revealLetter($("#s-end"));
    const r = slides[5].getBoundingClientRect();
    FX.heart(r.left + r.width / 2, r.top + r.height * 0.3, 26, 6);
  }
  Mascot.setSlide(i);
}
function revealLetter(scope) {
  const letter = $(".letter", scope);
  if (!letter) return;
  letter.classList.remove("on");
  $$("[data-line]", letter).forEach((p, k) => {
    p.style.transitionDelay = (300 + k * 420) + "ms";
  });
  requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.add("on")));
}
function goTo(i, instant = false) {
  i = clamp(i, 0, slides.length - 1);
  maxVisited = Math.max(maxVisited, i);
  slides.forEach((s, k) => s.classList.toggle("active", k === i));
  $$("#dots .dot").forEach((d, k) => {
    d.classList.toggle("done", k < i || k <= maxVisited);
    d.classList.toggle("cur", k === i);
  });
  cur = i;
  if (instant) return;
  AudioFX.pop(0.9 + i * 0.06);
  onEnter(i);
}
function next() { goTo(cur + 1); }

$$("[data-next]").forEach((b) => b.addEventListener("click", next));
$("#replay").addEventListener("click", () => location.reload());

/* ================= MASKOT PINGGUIN ================= */
const Mascot = (() => {
  const el = $("#mascot"), bubble = $("#bubble"), text = $("#bubbleText"), btn = $("#maruBtn");
  const LINES = [
    ["aku di sini jaga-jaga… dan buat malu-maluin 😳", "kotaknya nggak bohong, ada isinya! 💝"],
    ["Hi Sinta! Aku dengar kamu My Girl hari ini 🎉", "Dia ngomong apa sih? Aku cuma penguin… tapi aku setuju 😤💕", "Kok dia senyum-senyum sendiri lagi 😳"],
    ["Waaah mawar makin numpuk! 🌹", "Kalau penguin boleh, aku juga mau mawar 🥺", "Pinguinnya malu duluan 😳"],
    ["Tahan tombolnya pelan-pelan… biar deg-degannya keliatan 😏", "Video itu rahasia resmi antar-dua-kita ya 🤫"],
    ["Kamu WAJIB tanda tangan. It's the law. Hukum penguin 😤", "Unduh sertifikatnya — bukti sah My Girl! 📜", "Tanda tangannya awet permanen lho 😌"],
    ["Selamat ya, My Girl-nya Ibah! 🏆", "Aku nggak ikut-ikutan, tapi… bagus sih 😌❤️", "Tonton lagi? Aku ikut dari awal 🐧"],
  ];
  let idx = 0, timer = null, egg = 0;
  function show(t) {
    text.classList.add("fade");
    setTimeout(() => {
      text.textContent = t;
      text.classList.remove("fade");
      bubble.classList.add("show");
    }, 240);
  }
  function rotator() {
    clearInterval(timer);
    const lines = LINES[clamp(cur, 0, LINES.length - 1)];
    idx = 0;
    show(lines[0]);
    timer = setInterval(() => {
      idx = (idx + 1) % lines.length;
      show(lines[idx]);
    }, 5200);
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    egg++;
    btn.classList.remove("wiggle");
    void btn.offsetWidth;
    btn.classList.add("wiggle");
    AudioFX.pop(1.3 + egg * 0.08);
    const r = btn.getBoundingClientRect();
    FX.heart(r.left + r.width / 2, r.top + r.height * 0.3, 6, 4);
    const msgs = [
      "woi! aku penguin, bukan tombol 😤",
      "iya iya… gemes kamu lihat juga 😳",
      "berhenti klik aku, klik mawarnya 🌹",
      "aku penguin paling banyak diklik di dunia 😤💕",
    ];
    show(msgs[Math.min(egg - 1, msgs.length - 1)]);
    clearInterval(timer);
    setTimeout(rotator, 4200);
  });
  return { setSlide: () => rotator() };
})();

/* ================= SLIDE 0 : GIFT ================= */
let giftOpen = false;
$("#giftBox").addEventListener("click", (e) => {
  if (giftOpen) { next(); return; }
  giftOpen = true;
  AudioFX.unlock();
  if (!AudioFX.muted) AudioFX.startMusic();
  AudioFX.chime();
  const r = e.currentTarget.getBoundingClientRect();
  FX.heart(r.left + r.width / 2, r.top + r.height * 0.4, 34, 7);
  e.currentTarget.classList.add("opening");
  setTimeout(() => { FX.heart(r.left + r.width / 2, r.top + r.height * 0.3, 20, 6); }, 350);
  setTimeout(() => next(), 1050);
});

/* ================= SLIDE 2 : MAWAR ================= */
const ROSE_SVG = `
<svg viewBox="0 0 64 96" aria-hidden="true">
  <path d="M32 34C31 52 33 62 32 92" stroke="#3e8e5a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M32 56C20 52 12 56 8 64 18 66 28 62 32 56Z" fill="#4c9a63"/>
  <path d="M32 70C44 66 52 70 56 78 46 80 36 76 32 70Z" fill="#4c9a63"/>
  <g transform="translate(32 22)">
    <ellipse rx="17" ry="9" transform="rotate(-38)" fill="#b7202f"/>
    <ellipse rx="17" ry="9" transform="rotate(38)" fill="#b7202f"/>
    <circle r="15.5" fill="#cf2b3c"/>
    <circle r="11" fill="#e2435a"/>
    <circle r="6.5" fill="#cf2b3c"/>
    <circle r="2.6" fill="#8f1826"/>
    <path d="M-15.5 -2A15.5 15.5 0 0 1 -9 -12.6" stroke="#a11f2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M15.5 -2A15.5 15.5 0 0 0 9 -12.6" stroke="#a11f2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
const ROSE_MSGS = {
  1: "satu mawar… permulaan dari yang manis 🌹",
  2: "dua mawar, dua mata yang senyum lihatnya 👀💕",
  3: "tiga mawar? selera kamu cocok sama mawar, ternyata 😌",
  4: "empat mawar, empat alasan aku senyum hari ini",
  5: "lima mawar — jari kamu rajin banget hari ini 😄",
  6: "enam mawar. Enam dari satu miliar alasan cintaku",
  7: "tujuh mawar… pinguin di pojok mulai kagum 😳",
  8: "delapan mawar. Delapan = tak terbatas dalam matematika cinta ∞",
  9: "sembilan mawar. Sembilan dari seribu pelukan yang belum kesampaian 🤗",
  10: "sepuluh mawar! Dasarnya romantis, huh 😌",
  11: "sebelas mawar. Kotaknya mulai sesak, cintaku nggak",
  12: "DUA BELAS! Kotaknya penuh, cinta pun meluap 🌹💖 — sisanya ada di dadaku",
};
const roseBox = $("#roseBox");
let roseCount = 0;
// slot posisi mawar (persentase lebar kotak)
const SLOTS = [12, 30, 48, 66, 84, 21, 39, 57, 75, 33, 51, 14];
$("#sendRose").addEventListener("click", () => {
  roseCount++;
  AudioFX.pop(1 + Math.min(roseCount, 12) * 0.06);
  const cnt = $("#roseCount");
  cnt.textContent = roseCount + " mawar";
  cnt.classList.remove("bump");
  void cnt.offsetWidth;
  cnt.classList.add("bump");
  const msg = $("#roseMsg");
  msg.textContent = ROSE_MSGS[Math.min(roseCount, 12)] || "kotaknya udah penuh, tapi cintaku unlimited 😌🌹";
  if (roseCount <= CFG.maxRoses) {
    const r = document.createElement("span");
    r.className = "rose";
    r.innerHTML = ROSE_SVG;
    r.style.left = SLOTS[(roseCount - 1) % SLOTS.length] + "%";
    r.style.setProperty("--rr", rand(-8, 8).toFixed(1) + "deg");
    r.style.zIndex = String(roseCount);
    roseBox.appendChild(r);
  } else {
    const b = roseBox.getBoundingClientRect();
    FX.heart(b.left + b.width / 2, b.top + 20, 5, 4);
  }
});

/* ================= SLIDE 3 : HOLD + VIDEO ================= */
const holdBtn = $("#holdBtn"), ring = $("#ring"), holdHeart = $("#holdHeart"), holdTip = $("#holdTip");
const RING_C = 326.73;
let holdProg = 0, holding = false, holdRaf = null, unlocked = false, lastHoldT = 0;
let videoAvailable = null;

fetch(CFG.videoSrc, { method: "HEAD" }).then((r) => { videoAvailable = r.ok; }).catch(() => { videoAvailable = false; });

function holdLoop(now) {
  if (!lastHoldT) lastHoldT = now;
  const dt = now - lastHoldT; lastHoldT = now;
  if (holding) {
    holdProg = clamp(holdProg + dt / CFG.holdMs, 0, 1);
    if (holdProg >= 1) { unlock(); return; }
  } else {
    holdProg = clamp(holdProg - dt / (CFG.holdMs * 0.9), 0, 1);
    if (holdProg <= 0 && !unlocked) { lastHoldT = 0; cancelAnimationFrame(holdRaf); return; }
  }
  ring.style.strokeDashoffset = RING_C * (1 - holdProg);
  holdHeart.setAttribute("transform", `translate(60 44) scale(${(0.92 + holdProg * 0.4).toFixed(3)})`);
  holdTip.textContent = unlocked ? "DIBUKA ✨" : holdProg > 0.5 ? "Hampir…" : "TAHAN";
  holdRaf = requestAnimationFrame(holdLoop);
}
function startHold() {
  if (unlocked) return;
  AudioFX.unlock();
  holding = true; lastHoldT = 0;
  cancelAnimationFrame(holdRaf);
  holdRaf = requestAnimationFrame(holdLoop);
}
function endHold() {
  if (unlocked) return;
  holding = false;
}
holdBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); holdBtn.setPointerCapture(e.pointerId); startHold(); });
holdBtn.addEventListener("pointerup", endHold);
holdBtn.addEventListener("pointercancel", endHold);
holdBtn.addEventListener("contextmenu", (e) => e.preventDefault());

function unlock() {
  if (unlocked) return;
  unlocked = true; holding = false;
  holdBtn.classList.add("full", "unlocked");
  AudioFX.chime();
  const r = holdBtn.getBoundingClientRect();
  FX.heart(r.left + r.width / 2, r.top + r.height / 2, 24, 6);
  const sub = $("#videoSub");
  sub.textContent = "Dibuka! 🎉 Video spesial dari aku. Nonton ya, cantik 😘";
  setTimeout(buildVideoStage, 700);
}

function buildVideoStage() {
  const stage = $("#videoStage");
  stage.classList.remove("hidden");
  const frame = document.createElement("div");
  frame.className = "video-frame";
  stage.appendChild(frame);

  if (videoAvailable) {
    const v = document.createElement("video");
    v.src = CFG.videoSrc;
    v.controls = true; v.playsInline = true; v.preload = "metadata"; v.autoplay = true;
    frame.appendChild(v);
    const ov = document.createElement("button");
    ov.className = "video-overlay";
    ov.innerHTML = `<span style="display:grid;justify-items:center">
        <span class="play-heart"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="ov-cap">Klik untuk menonton ❤️</span></span>`;
    ov.addEventListener("click", () => { v.play(); ov.classList.add("gone"); });
    v.addEventListener("playing", () => ov.classList.add("gone"), { once: true });
    v.addEventListener("error", () => {
      stage.innerHTML = "";
      stage.appendChild(fallbackFrame());
      const n2 = document.createElement("p");
      n2.className = "video-note";
      n2.textContent = "(hmm… videonya belum kesampaian upload, Sayang 😅 nanti ada)";
      stage.appendChild(n2);
    }, true);
    const note = document.createElement("p");
    note.className = "video-note";
    note.textContent = "— buat kamu, dan cuma buat kamu 🤍";
    stage.appendChild(note);
  } else {
    frame.replaceWith(fallbackFrame());
    const note = document.createElement("p");
    note.className = "video-note";
    note.textContent = "(videonya masih di laptopku, Sayang… begitu ke-upload otomatis jadi video asli 😘)";
    stage.appendChild(note);
  }
}
function fallbackFrame() {
  const frame = document.createElement("div");
  frame.className = "video-frame";
  const cv = document.createElement("canvas");
  cv.width = 960; cv.height = 540;
  cv.id = "reelCanvas";
  frame.appendChild(cv);
  const note = document.createElement("p");
  note.style.cssText = "position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:11px;color:rgba(255,217,226,.65);padding:0 10px";
  note.textContent = "taruh file video.mp4 di folder website → otomatis jadi video asli";
  frame.appendChild(note);
  startReel(cv);
  return frame;
}
function startReel(cv) {
  if (REDUCED) return;
  const cx2 = cv.getContext("2d");
  const hearts = [];
  let t = 0, raf = null;
  function draw() {
    raf = requestAnimationFrame(draw);
    if (cur !== 3 || !document.contains(cv)) { cancelAnimationFrame(raf); raf = null; return; }
    t += 16;
    const W = cv.width, H = cv.height;
    const g = cx2.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#2b0d1f"); g.addColorStop(1, "#170710");
    cx2.fillStyle = g; cx2.fillRect(0, 0, W, H);
    // hati melayang
    if (hearts.length < 16 && Math.random() < 0.12) {
      hearts.push({ x: rand(0, W), y: H + 20, v: rand(0.5, 1.4), s: rand(8, 20), ph: rand(0, 6), c: pick(["rgba(255,77,109,.5)", "rgba(255,143,168,.4)", "rgba(255,217,160,.35)"]) });
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.y -= h.v; h.ph += 0.02;
      if (h.y < -30) { hearts.splice(i, 1); continue; }
      cx2.save();
      cx2.translate(h.x + Math.sin(h.ph) * 14, h.y);
      cx2.scale(h.s / 10, h.s / 10);
      cx2.fillStyle = h.c;
      cx2.beginPath();
      cx2.moveTo(0, 5);
      cx2.bezierCurveTo(-6, 0, -6, -5, -3, -5);
      cx2.bezierCurveTo(-1.2, -5, 0, -3.4, 0, -2.2);
      cx2.bezierCurveTo(0, -3.4, 1.2, -5, 3, -5);
      cx2.bezierCurveTo(6, -5, 6, 0, 0, 5);
      cx2.fill(); cx2.restore();
    }
    cx2.textAlign = "center";
    cx2.fillStyle = "#ffd9e2";
    cx2.font = "600 40px 'Cormorant Garamond', Georgia, serif";
    cx2.fillText("Video spesial dari " + CFG.from, W / 2, H * 0.42);
    cx2.fillStyle = "#ffb3c1";
    cx2.font = "500 20px 'Quicksand', sans-serif";
    const pct = 96 + 3 * Math.sin(t / 900);
    cx2.fillText("💌 sedang di-upload ke server cinta… " + pct.toFixed(0) + "%", W / 2, H * 0.54);
    cx2.fillStyle = "rgba(255,255,255,.12)";
    cx2.fillRect(W / 2 - 140, H * 0.60, 280, 8);
    cx2.fillStyle = "rgba(255,143,168,.85)";
    cx2.fillRect(W / 2 - 140, H * 0.60, 280 * (pct / 100), 8);
    if (raf === null) raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
}

/* ================= SLIDE 4 : TANDA TANGAN + SERTIFIKAT ================= */
const pad = $("#sigPad"), pcx = pad.getContext("2d");
const PSCALE = Math.min(2, devicePixelRatio || 1);
pad.width = 460 * PSCALE; pad.height = 110 * PSCALE;
pcx.setTransform(PSCALE, 0, 0, PSCALE, 0, 0);

let sigStrokes = [];
try {
  const saved = JSON.parse(localStorage.getItem(CFG.signatureKey) || "null");
  if (saved && Array.isArray(saved.strokes)) sigStrokes = saved.strokes;
} catch (e) { /* abaikan */ }

let signedOnce = sigStrokes.length > 0;
if (signedOnce) $("#sigHint").textContent = "✔ permanen — nggak bisa dihapus (beneran 😌)";

function padPoint(e) {
  const r = pad.getBoundingClientRect();
  return [(e.clientX - r.left) * (460 / r.width), (e.clientY - r.top) * (110 / r.height)];
}
function drawStroke(c, pts, lw) {
  if (!pts.length) return;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 1) c.lineTo(pts[0][0] + 0.1, pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  c.lineTo(last[0], last[1]);
  c.lineWidth = lw; c.lineCap = "round"; c.lineJoin = "round";
  c.stroke();
}
function renderPad() {
  pcx.clearRect(0, 0, 460, 110);
  pcx.strokeStyle = "#8b1e2e";
  for (const s of sigStrokes) drawStroke(pcx, s, 2.8);
}
renderPad();

let drawing = false, curStroke = null, lastPt = null;
pad.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  pad.setPointerCapture(e.pointerId);
  drawing = true;
  curStroke = [padPoint(e)];
  lastPt = curStroke[0];
  sigStrokes.push(curStroke);
  renderPad();
  $("#sigHint").classList.add("gone");
});
pad.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const [x, y] = padPoint(e);
  const lp = curStroke[curStroke.length - 1];
  if (Math.hypot(x - lp[0], y - lp[1]) > 1.2) {
    if (curStroke.length > 500) curStroke.pop(); // jaga ukuran
    curStroke.push([x, y]);
    // gambar segmen baru saja (ringan)
    pcx.beginPath();
    pcx.moveTo(lastPt[0], lastPt[1]);
    pcx.lineTo(x, y);
    pcx.stroke();
    lastPt = [x, y];
  }
});
function endSig(e) {
  if (!drawing) return;
  drawing = false;
  if (curStroke && curStroke.length === 1) sigStrokes.pop();
  curStroke = null;
  const total = sigStrokes.reduce((a, s) => a + s.length, 0);
  if (total > 10) {
    persistSig();
    if (!signedOnce) {
      signedOnce = true;
      AudioFX.ding();
      const r = pad.getBoundingClientRect();
      FX.heart(r.left + r.width / 2, r.top + r.height / 2, 14, 5);
      toast("Tanda tanganmu tersimpan. Permanen, seperti cintaku 😌");
      $("#sigHint").textContent = "✔ permanen — nggak bisa dihapus (beneran 😌)";
    } else {
      AudioFX.pop(1.4);
      toast("Tanda tanganmu makin tebal… makin sayang 😄");
    }
  }
}
pad.addEventListener("pointerup", endSig);
pad.addEventListener("pointercancel", endSig);

function persistSig() {
  try {
    const strokes = sigStrokes.slice(-80).map((s) =>
      s.length > 300 ? s.filter((_, i) => i % 2 === 0) : s
    );
    localStorage.setItem(CFG.signatureKey, JSON.stringify({ v: 1, strokes }));
  } catch (e) { /* storage penuh / private mode — skip */ }
}

/* tanda tangan pengirim (PNG manual) */
let senderImg = null;
{
  const img = new Image();
  img.onload = () => {
    senderImg = img;
    const wrap = $("#senderSigWrap");
    wrap.innerHTML = "";
    wrap.appendChild(img);
  };
  img.src = CFG.signatureSrc;
}

/* tanggal di sertifikat */
$("#certDate").textContent = CFG.place + ", " + CERT_DATE;

/* ================= GAMBAR SERTIFIKAT (canvas export) ================= */
function drawSpaced(c, text, x, y, spacing) {
  const widths = [...text].map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx2 = x - total / 2;
  const prev = c.textAlign;
  c.textAlign = "left";
  [...text].forEach((ch, i) => { c.fillText(ch, cx2, y); cx2 += widths[i] + spacing; });
  c.textAlign = prev;
}
function heartPath(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath();
  c.moveTo(0, 5);
  c.bezierCurveTo(-6, 0, -6, -5, -3, -5);
  c.bezierCurveTo(-1.2, -5, 0, -3.4, 0, -2.2);
  c.bezierCurveTo(0, -3.4, 1.2, -5, 3, -5);
  c.bezierCurveTo(6, -5, 6, 0, 0, 5);
  c.fill(); c.restore();
}
function rosePath(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "#4c9a63";
  c.save(); c.rotate(0.7); c.beginPath(); c.ellipse(-s * 0.85, s * 0.45, s * 0.55, s * 0.22, 0, 0, 7); c.fill(); c.restore();
  c.save(); c.rotate(-0.7); c.beginPath(); c.ellipse(s * 0.85, s * 0.45, s * 0.55, s * 0.22, 0, 0, 7); c.fill(); c.restore();
  c.fillStyle = "#b7202f";
  c.beginPath(); c.ellipse(0, -s * 0.4, s * 0.62, s * 0.3, -0.7, 0, 7); c.fill();
  c.beginPath(); c.ellipse(0, -s * 0.4, s * 0.62, s * 0.3, 0.7, 0, 7); c.fill();
  c.fillStyle = "#cf2b3c";
  c.beginPath(); c.arc(0, 0, s * 0.62, 0, 7); c.fill();
  c.fillStyle = "#e2435a";
  c.beginPath(); c.arc(0, 0, s * 0.44, 0, 7); c.fill();
  c.fillStyle = "#cf2b3c";
  c.beginPath(); c.arc(0, 0, s * 0.26, 0, 7); c.fill();
  c.fillStyle = "#8f1826";
  c.beginPath(); c.arc(0, 0, s * 0.1, 0, 7); c.fill();
  c.restore();
}
function drawCertificate(c) {
  const W = 1500, H = 1000;
  c.textBaseline = "alphabetic";
  // latar
  c.fillStyle = "#fffdf4"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#f0e4ca";
  for (let y = 44; y < H - 30; y += 28)
    for (let x = 44; x < W - 30; x += 28) {
      c.beginPath(); c.arc(x, y, 1.2, 0, 7); c.fill();
    }
  // bingkai
  c.strokeStyle = "#d4a24a"; c.lineWidth = 10; c.strokeRect(30, 30, W - 60, H - 60);
  c.strokeStyle = "#e8cd93"; c.lineWidth = 2; c.strokeRect(58, 58, W - 116, H - 116);
  // ornamen sudut
  c.fillStyle = "#d4a24a";
  [[86, 86], [W - 86, 86], [86, H - 86], [W - 86, H - 86]].forEach(([x, y]) => heartPath(c, x, y, 2.4));
  rosePath(c, 175, 175, 40, -0.5);
  rosePath(c, W - 175, 175, 40, 0.5);
  rosePath(c, 175, H - 175, 40, 0.5);
  rosePath(c, W - 175, H - 175, 40, -0.5);
  // nomor
  c.fillStyle = "#b08a52"; c.font = "600 20px Quicksand, sans-serif";
  c.textAlign = "right"; c.fillText("No. 001 / MY-GIRL-DAY / 2026", W - 84, 100);
  c.textAlign = "center";
  // judul
  c.fillStyle = "#b08a52"; c.font = "600 30px Quicksand, sans-serif";
  drawSpaced(c, "S E R T I F I K A T", W / 2, 172, 4);
  c.fillStyle = "#a32334"; c.font = "600 80px 'Cormorant Garamond', serif";
  c.fillText("Selamat Hari My Girl Day", W / 2, 262);
  // garis + hati
  c.strokeStyle = "#d4a24a"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(W / 2 - 190, 306); c.lineTo(W / 2 - 34, 306); c.stroke();
  c.beginPath(); c.moveTo(W / 2 + 34, 306); c.lineTo(W / 2 + 190, 306); c.stroke();
  c.fillStyle = "#d4a24a"; heartPath(c, W / 2, 306, 3);
  c.fillStyle = "#6b5647"; c.font = "italic 400 32px 'Cormorant Garamond', serif";
  c.fillText("diberikan dengan penuh cinta kepada", W / 2, 372);
  // nama
  c.fillStyle = "#8b1e2e"; c.font = "118px 'Great Vibes', cursive";
  c.fillText(CFG.to, W / 2, 495);
  c.strokeStyle = "#d4a24a"; c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(W / 2 - 235, 528);
  c.bezierCurveTo(W / 2 - 120, 542, W / 2 + 120, 514, W / 2 + 235, 528);
  c.stroke();
  // alasan
  c.fillStyle = "#5b4a3f"; c.font = "400 29px 'Cormorant Garamond', serif";
  c.fillText("karena kamu satu baris kode terindah yang pernah jalan di hidup developer ini ❤️", W / 2, 585);
  // stempel
  c.save();
  c.translate(W - 255, 445); c.rotate(-0.22);
  c.strokeStyle = "rgba(205,57,68,.8)"; c.fillStyle = "rgba(205,57,68,.8)";
  c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 92, 0, 7); c.stroke();
  c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 80, 0, 7); c.stroke();
  c.font = "700 19px Quicksand, sans-serif"; c.fillText("DIPERSEMBAHKAN", 0, -22);
  c.font = "700 14.5px Quicksand, sans-serif";
  c.fillText("• DENGAN CINTA TULEN •", 0, 4);
  c.fillText("100% ORIGINAL", 0, 28);
  c.restore();
  // garis tanda tangan
  c.strokeStyle = "#6b5647"; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(180, 828); c.lineTo(480, 828); c.stroke();
  c.beginPath(); c.moveTo(940, 828); c.lineTo(1400, 828); c.stroke();
  // tanda tangan pengirim
  if (senderImg) {
    const bw = 300, bh = 108, sc = Math.min(bw / senderImg.width, bh / senderImg.height);
    const dw = senderImg.width * sc, dh = senderImg.height * sc;
    c.save();
    c.globalCompositeOperation = "multiply";
    c.drawImage(senderImg, 330 - dw / 2, 706 + (bh - dh) / 2, dw, dh);
    c.restore();
  } else {
    c.fillStyle = "#2f2a26"; c.font = "60px 'Great Vibes', cursive";
    c.fillText(CFG.from, 330, 800);
  }
  c.fillStyle = "#4a3b31"; c.font = "700 26px Quicksand, sans-serif";
  c.fillText(CFG.from, 330, 862);
  c.fillStyle = "#8a7462"; c.font = "500 19px Quicksand, sans-serif";
  c.fillText("Si Pemberi Cinta", 330, 888);
  // tanda tangan Sinta
  if (sigStrokes.length) {
    c.save();
    c.translate(940, 716);
    c.strokeStyle = "#8b1e2e";
    for (const s of sigStrokes) drawStroke(c, s, 2.8);
    c.restore();
  } else {
    c.fillStyle = "#b9a98f"; c.font = "italic 500 22px Quicksand, sans-serif";
    c.fillText("— menunggu tanda tanganmu, Sayang —", 1170, 785);
  }
  c.fillStyle = "#4a3b31"; c.font = "700 26px Quicksand, sans-serif";
  c.fillText(CFG.to, 1170, 862);
  c.fillStyle = "#8a7462"; c.font = "500 19px Quicksand, sans-serif";
  c.fillText("My Girl Kesayangan", 1170, 888);
  // tanggal
  c.fillStyle = "#6b5647"; c.font = "italic 400 28px 'Cormorant Garamond', serif";
  c.fillText(CFG.place + ", " + CERT_DATE, W / 2, 862);
  // footer
  c.fillStyle = "#b08a52"; c.font = "500 18px Quicksand, sans-serif";
  c.fillText("— Komite My Girl Day, Dept. of Love & Dev —", W / 2, 928);
}

async function fontsReady() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load("118px 'Great Vibes'"),
        document.fonts.load("600 80px 'Cormorant Garamond'"),
        document.fonts.load("700 26px Quicksand"),
      ]),
      new Promise((res) => setTimeout(res, 3500)),
    ]);
  } catch (e) { /* lanjut aja */ }
}
let dlBusy = false;
$("#dlCert").addEventListener("click", async () => {
  if (dlBusy) return;
  dlBusy = true;
  const btn = $("#dlCert");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Menggambar sertifikat… 🎨";
  await fontsReady();
  try {
    if (sigStrokes.length === 0) toast("Tips: tanda tangan dulu ya, biar sertifikatnya lengkap 😘");
    const cv = document.createElement("canvas");
    cv.width = 1500; cv.height = 1000;
    drawCertificate(cv.getContext("2d"));
    await new Promise((res) => cv.toBlob(res, "image/png"));
    const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sertifikat-my-girl-day-sinta-liya.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    AudioFX.chime();
    const r = btn.getBoundingClientRect();
    FX.confetti(r.left + r.width / 2, r.top, 70);
    FX.heart(r.left + r.width / 2, r.top, 16, 6);
    toast("Sertifikat terunduh! Simpan baik-baik ya, Sayang 😎💘");
  } catch (e) {
    toast("Ups, gagal mengunduh… coba lagi ya 😅");
  }
  btn.disabled = false;
  btn.textContent = old;
  dlBusy = false;
});

/* ================= KLIK = HATI KECIL ================= */
let lastClick = 0;
document.addEventListener("pointerup", (e) => {
  const now = performance.now();
  if (now - lastClick < 220) return;
  lastClick = now;
  if (e.target.closest("button, a, canvas, .card")) return;
  if (!REDUCED) FX.heart(e.clientX, e.clientY, 5, 3.5);
});

/* ================= MUSIK TOGGLE ================= */
$("#musicBtn").addEventListener("click", () => {
  AudioFX.unlock();
  AudioFX.setMuted(!AudioFX.muted);
  $("#musicBtn").classList.toggle("muted", AudioFX.muted);
  $("#musicBtn").setAttribute("aria-pressed", String(!AudioFX.muted));
  if (!AudioFX.muted) AudioFX.startMusic();
});

/* ================= INIT ================= */
buildDots();
FX.init();
goTo(0, true);
onEnter(0);
