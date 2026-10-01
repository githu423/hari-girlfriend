# 💝 My Girl Day — Sinta Liya

Website hadiah spesial **Hari My Girl Day** dari **Ibah Misbah** untuk **Sinta Liya**.
Dibuat 100% dengan HTML + CSS + JS murni (tanpa framework, tanpa build) — super ringan, cocok untuk hosting di **Vercel**.

## ✨ Alur ceritanya

1. **Kotak hadiah** — ketuk kotaknya, hati meledak, musik kotak musik mengalun 🎵
2. **Ucapan selamat** — *Happy My Girl Day* dengan animasi nama & surat kecil
3. **Mawar merah** — kirim mawar ke kotak Sinta (mawar kesukaannya) 🌹
4. **Video** — tahan tombolnya 2 detik untuk membuka video spesial
5. **Sertifikat** — sertifikat resmi My Girl Day, dengan:
   - tanda tangan **Ibah Misbah** (file `tanda-tangan.png`)
   - area tanda tangan interaktif untuk **Sinta** — tulis pakai jari/mouse,
     **sekali ditandatangani = permanen** (tersimpan di browser, tidak bisa terhapus)
   - tombol **Unduh Sertifikat** → PNG 1500×1000 lengkap dengan kedua tanda tangan 📥
6. **The End (nggak)** 💘

Plus: maskot penguin Badtz-Maru style yang suka komentar (klik-klik untuk efek lucu 😤),
kelopak mawar beterbangan, kilau emas, dan musik kotak musik (bisa dimatikan di tombol kanan-atas).

## 📁 File yang bisa kamu ganti

| File | Keterangan |
|---|---|
| `video.mp4` | Video spesial. Taruh di **root folder** (sebelah `index.html`). Kalau belum ada, website otomatis menampilkan "reel" animasi romantis sampai videonya dipasang. |
| `tanda-tangan.png` | Tanda tangan Ibah (yang di repo sekarang masih *placeholder*). Ganti dengan PNG tanda tangan aslimu — sebaiknya **background transparan** (atau putih, website otomatis mem-blend-nya). |

## ✏️ Ganti nama / tanggal

- Di `app.js` → bagian `CFG` (atas file): `from`, `to`, `place`, `date`.
- Di `index.html`: cari teks `Sinta Liya` / `Ibah Misbah` dan ganti sesuai kebutuhan.

## 🚀 Deploy ke Vercel

**Cara 1 — dari GitHub (paling gampang):**
1. Push repo ini ke GitHub (cabang mana saja, mis. `main` atau cabang Arena ini).
2. Buka [vercel.com/new](https://vercel.com/new), login, lalu import repo `hari-girlfriend`.
3. Biarkan semua default (Framework: *Other*, Root: `/`) → **Deploy**. Selesai!

**Cara 2 — drag & drop (tanpa GitHub):**
1. Download/zip folder website ini (cukup `index.html`, `styles.css`, `app.js`, `tanda-tangan.png`, `video.mp4`).
2. Buka [vercel.com/upload](https://vercel.com/upload) dan seret foldernya. Selesai!

> Jangan lupa: **tambahkan `video.mp4` dan `tanda-tangan.png` dulu sebelum deploy** kalau ingin langsung lengkap.

## 🛠️ Teknologi

- HTML5 + CSS3 + Vanilla JS — zero dependency, zero build step
- Partikel (kelopak, hati, confetti) via `<canvas>`
- Musik kotak musik (Canon in D) via Web Audio API — tanpa file audio
- Sertifikat diekspor ke PNG via canvas (tanpa library html2canvas)
- Responsive HP ↔ desktop, hormati `prefers-reduced-motion`

---
*Dibuat dengan ❤️ untuk My Girl yang paling luar biasa.*
