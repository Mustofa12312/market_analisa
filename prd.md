# PRD — Web Trading Bot Kripto Otomatis Binance Spot

## 1. Ringkasan Produk

Produk ini adalah web dashboard untuk trading kripto otomatis di **Binance Spot** dengan tampilan modern, responsif, dan profesional. Sistem memantau pasar secara real-time, menganalisis peluang menggunakan gabungan indikator teknikal, price action, volume, serta modul AI/ML untuk scoring dan ranking koin. Saat peluang dianggap layak, sistem dapat memberi sinyal, melakukan paper trade pada mode demo, dan pada mode live dapat mengeksekusi order beli/jual sesuai aturan risiko.

Fokus utama produk:

* **Mendeteksi peluang terbaik** secara otomatis.
* **Meminimalkan kerugian** melalui manajemen risiko yang ketat.
* **Memberikan demo realistis** memakai harga pasar nyata.
* **Menampilkan dashboard lengkap** untuk monitoring, audit, dan evaluasi performa.

## 2. Tujuan Produk

1. Menyediakan bot trading spot yang bisa bekerja otomatis pada Binance.
2. Menggabungkan beberapa metode analisa untuk meningkatkan kualitas sinyal.
3. Memiliki mode demo/paper trading dengan data pasar real-time.
4. Menyediakan UI yang rapi, modern, dan mudah dipahami.
5. Memberikan transparansi penuh melalui riwayat trade, log eksekusi, dan metrik performa.
6. Menekan risiko dengan stop loss, take profit, trailing stop, dan batas kerugian harian.

## 3. Ruang Lingkup

### In-scope

* Binance Spot trading.
* Pair awal: **BTC/USDT, ETH/USDT, SOL/USDT**.
* Scanner koin terbaik dari daftar pair yang dipantau.
* Analisis indikator teknikal.
* AI/ML untuk ranking peluang.
* Paper trading real-time.
* Dashboard web.
* Notifikasi Telegram.
* Enkripsi API key.
* Riwayat trade, log, dan laporan performa.

### Out-of-scope untuk versi awal

* Futures / leverage.
* Margin trading.
* Auto-withdrawal.
* Multi-exchange.
* Copy trading pengguna lain.
* Trading frequency sangat tinggi (HFT).

## 4. Target Pengguna

* Trader pemula yang ingin bot otomatis dengan kontrol risiko.
* Trader menengah yang ingin sistem semi-otomatis dengan dashboard yang jelas.
* Pengguna yang ingin menguji strategi sebelum live trading.

## 5. Prinsip Desain Produk

* **Aman dulu, untung kemudian**.
* **AI membantu keputusan, bukan bertindak liar sendiri**.
* **Sinyal harus divalidasi beberapa lapisan**.
* **Semua aksi harus bisa diaudit**.
* **Demo harus mendekati kondisi real market**.

## 6. Konsep Strategi Trading

### 6.1 Model Keputusan

Keputusan trading memakai **hybrid system**:

1. **Rule Engine**

   * Menghitung indikator teknikal.
   * Mendeteksi kondisi pasar.
   * Menghasilkan sinyal dasar buy / hold / sell.

2. **AI/ML Scoring**

   * Menilai kualitas setup.
   * Meranking koin yang paling menarik.
   * Memberi confidence score.

3. **Risk Engine**

   * Memutuskan apakah trade boleh dieksekusi.
   * Menolak trade jika risiko terlalu tinggi.

### 6.2 Kenapa tidak AI saja?

AI murni sering sulit diprediksi dalam pasar kripto yang sangat volatil. Karena itu, keputusan final sebaiknya berasal dari gabungan:

* **aturan teknikal yang jelas**,
* **skor AI**,
* **filter risiko**.

### 6.3 Logika Trading Inti

Contoh alur:

* Pasar dianalisis tiap interval tertentu.
* Jika indikator dan price action mendukung bullish, sistem menghasilkan kandidat buy.
* AI memberi skor peluang.
* Risk engine mengecek volatilitas, volume, tren, dan kondisi drawdown.
* Jika lolos, sistem masuk posisi.
* Setelah entry, sistem memantau take profit, stop loss, dan trailing stop.
* Saat target tercapai atau sinyal melemah, sistem exit.

## 7. Strategi Analisa

### 7.1 Indikator Teknikal

* **RSI**: mendeteksi overbought / oversold.
* **MACD**: melihat momentum dan cross.
* **EMA**: mengukur arah tren cepat dan lambat.
* **Bollinger Bands**: mengukur volatilitas dan potensi breakout / mean reversion.

### 7.2 Price Action

* Breakout resistance.
* Rejection support.
* Higher high / higher low.
* Lower high / lower low.
* Candle confirmation.

### 7.3 Volume

* Volume spike.
* Volume confirmation saat breakout.
* Divergensi volume terhadap harga.

### 7.4 AI/ML

Fungsi AI bukan menggantikan aturan, melainkan:

* memprioritaskan koin yang paling layak dipantau,
* memberi probabilitas keberhasilan setup,
* mengurangi trade yang kualitasnya rendah.

Contoh fitur input AI:

* return historis,
* volatilitas,
* slope EMA,
* RSI state,
* MACD state,
* candle pattern,
* volume ratio,
* breakout likelihood,
* market regime.

## 8. Aturan Beli dan Jual

### 8.1 Aturan Beli

Trade buy hanya boleh terjadi jika:

* tren jangka pendek dan menengah mendukung arah naik,
* sinyal teknikal minimal mencapai ambang tertentu,
* volume mendukung,
* AI confidence score melewati batas minimum,
* risk engine menyetujui,
* tidak sedang dalam kondisi market yang terlalu buruk.

### 8.2 Aturan Jual

Posisi dijual jika salah satu kondisi terjadi:

* take profit tercapai,
* stop loss tercapai,
* trailing stop tersentuh,
* sinyal reversal kuat muncul,
* AI confidence turun drastis,
* kondisi pasar memburuk.

### 8.3 Siapa yang memutuskan?

* **Sistem** menentukan aturan final.
* **AI** memberi rekomendasi dan skor.

Ini lebih aman dan lebih mudah dikontrol daripada menyerahkan semua keputusan pada AI.

## 9. Manajemen Risiko

Tujuan utama: **kerugian sekecil mungkin**.

### Fitur risiko wajib

* **Max risk per trade**: persentase kecil dari total modal.
* **Stop loss otomatis**.
* **Take profit otomatis**.
* **Trailing stop**.
* **Max daily loss**: jika kerugian harian mencapai batas, bot berhenti.
* **Cooldown after loss**: jeda setelah trade rugi.
* **Position sizing adaptif**.
* **No trade filter** saat volatilitas ekstrem atau volume aneh.

### Rekomendasi kebijakan risiko

* Risk per trade rendah.
* Jangan all-in.
* Hanya buka posisi ketika confidence tinggi.
* Hentikan bot saat performa turun di bawah ambang tertentu.

## 10. Mode Demo / Paper Trading

Mode demo harus terasa seperti trading nyata, tetapi tanpa uang sungguhan.

### Ciri-ciri demo

* Harga memakai **data pasar real-time**.
* Order dieksekusi secara simulasi berdasarkan harga market saat itu.
* Slippage dan fee bisa disimulasikan.
* Riwayat trade tersimpan seperti live mode.
* Hasil performa bisa dibandingkan dengan strategi lain.

### Tujuan demo

* Menguji strategi dalam kondisi nyata.
* Melihat apakah logika entry/exit masuk akal.
* Mengukur win rate, profit factor, dan drawdown.
* Memastikan UI dan alur sistem bekerja sebelum live.

## 11. Fitur Utama Produk

### 11.1 Dashboard Utama

Menampilkan:

* harga real-time,
* sinyal buy/sell,
* status bot,
* profit/loss,
* grafik candlestick,
* riwayat trade,
* log eksekusi,
* daftar koin terbaik hasil scanner AI,
* indikator key metrics.

### 11.2 Coin Scanner / Opportunity Finder

Fitur untuk mencari koin dengan peluang terbaik dari daftar market yang dipantau.
Output scanner:

* ranking koin terbaik,
* confidence score,
* alasan kenapa koin direkomendasikan,
* level risiko,
* status tren.

### 11.3 Trade Journal

* daftar semua trade,
* waktu entry dan exit,
* alasan entry,
* alasan exit,
* hasil untung/rugi,
* indikator saat trade terjadi.

### 11.4 Bot Control

* start / pause / stop bot,
* aktifkan demo/live mode,
* pilih pair yang dipantau,
* set risiko dan threshold,
* manual override.

### 11.5 Telegram Notifications

Notifikasi saat:

* buy dilakukan,
* sell dilakukan,
* sinyal kuat muncul,
* bot error,
* batas risiko tercapai,
* bot berhenti otomatis.

## 12. UI / UX Direction

Tampilan harus modern, elegan, dan enak dipakai di desktop maupun mobile.

### Gaya visual

* dark mode premium,
* aksen warna neon halus,
* kartu statistik bersih,
* grafik besar dan jelas,
* status chip yang mudah dibaca,
* animasi ringan agar terasa hidup.

### Layout utama

1. **Sidebar**: navigasi dashboard, strategy, risk, logs, settings.
2. **Top bar**: status bot, mode demo/live, koneksi exchange.
3. **Main panel**: chart, signals, coin scanner, stats.
4. **Right panel**: trade log, alert, notifikasi Telegram, health system.

## 13. Backend / Arsitektur Sistem

### Rekomendasi stack backend

* **Node.js + NestJS** atau **Node.js + Express**.
* **PostgreSQL** untuk data utama.
* **Redis** untuk cache dan antrean job.
* **WebSocket** untuk data real-time.
* **Python microservice** opsional untuk modul AI/ML dan backtesting.

### Kenapa backend ini cocok?

* Node.js cocok untuk integrasi API dan real-time dashboard.
* Python cocok untuk analitik, ML, dan backtesting.
* PostgreSQL kuat untuk histori trade dan audit log.

### Komponen sistem

* Market Data Service.
* Signal Engine.
* AI Scoring Service.
* Risk Engine.
* Order Executor.
* Paper Trading Engine.
* Notification Service.
* Logging & Audit Service.

## 14. Alur Data

1. Sistem mengambil harga dan candle dari market.
2. Data masuk ke analisis indikator.
3. AI menilai peluang.
4. Risk engine memvalidasi.
5. Jika lolos, order dieksekusi atau disimulasikan.
6. Hasil trade disimpan ke database.
7. Dashboard menampilkan status terbaru.
8. Telegram menerima notifikasi.

## 15. Fitur AI yang Lebih Sempurna

Agar lebih baik dari sekadar signal bot biasa, AI bisa dibuat untuk:

* **mendeteksi koin yang sedang punya momentum**, bukan hanya BTC/ETH/SOL,
* **mengurutkan koin berdasarkan peluang**,
* **mengenali market regime**: trending, sideways, high volatility,
* **mendeteksi setup yang sering gagal**,
* **mengurangi trade saat kondisi pasar buruk**.

### Output AI ideal

* score 0–100,
* confidence level,
* bias arah market,
* alasan rekomendasi singkat,
* level risiko.

## 16. Data yang Digunakan

### Sumber data

* harga live,
* OHLCV candle,
* volume,
* spread,
* market depth bila diperlukan,
* riwayat trade internal,
* parameter strategi.

### Data untuk model AI

* data historis candle,
* indikator turunan,
* label hasil trade masa lalu,
* kondisi pasar saat trade terjadi.

## 17. Keamanan

### Wajib

* API key dienkripsi saat disimpan.
* Private key tidak pernah tampil di frontend.
* Permission API dibatasi hanya trade, tanpa withdrawal.
* Audit log untuk semua aksi penting.
* Autentikasi login admin.
* Session protection.

### Tambahan keamanan

* rate limit,
* CSRF protection,
* HTTPS,
* sanitasi input,
* pemisahan environment demo dan live.

## 18. Non-Functional Requirements

* **Real-time**: update harga dan sinyal tanpa delay besar.
* **Reliable**: bot tidak mudah crash.
* **Secure**: API key aman.
* **Scalable**: bisa tambah pair dan strategi.
* **Maintainable**: kode modular.
* **Responsive**: tampilan nyaman di berbagai ukuran layar.

## 19. Metrics Keberhasilan

* Win rate.
* Profit factor.
* Max drawdown.
* Sharpe-like performance metric.
* Akurasi sinyal AI.
* Jumlah false signal.
* Stabilitas bot.
* Latency data-to-signal.

## 20. MVP Scope

### MVP 1

* Login.
* Dashboard utama.
* Real-time market data.
* RSI, MACD, EMA, Bollinger Bands.
* Paper trading.
* Riwayat trade.
* Telegram notifikasi.
* Enkripsi API key.

### MVP 2

* Coin scanner AI.
* Risk engine lengkap.
* Backtesting.
* Performance analytics.
* Manual strategy settings.

### MVP 3

* Model AI lebih pintar.
* Multi-timeframe analysis.
* Adaptive strategy.
* Smart ranking koin.

## 21. User Stories

* Sebagai pengguna, saya ingin melihat harga real-time agar tahu kondisi pasar.
* Sebagai pengguna, saya ingin bot memberi sinyal buy/sell agar saya tidak memantau terus-menerus.
* Sebagai pengguna, saya ingin demo yang realistis agar strategi bisa diuji dulu.
* Sebagai pengguna, saya ingin notifikasi Telegram agar tidak ketinggalan event penting.
* Sebagai pengguna, saya ingin kerugian dibatasi agar modal lebih aman.
* Sebagai pengguna, saya ingin melihat alasan trade agar sistem transparan.

## 22. Acceptance Criteria

Sistem dianggap sukses jika:

* dapat membaca data market real-time,
* dapat memberi sinyal berbasis indikator + AI,
* demo mode berjalan dengan harga pasar nyata,
* paper trade tercatat dengan benar,
* dashboard tampil stabil,
* API key tersimpan aman,
* Telegram notifikasi terkirim,
* risk control aktif dan konsisten.

## 23. Rekomendasi Teknologi Frontend

* **React + Vite**
* **Tailwind CSS**
* **Axios**
* **React Query / TanStack Query** untuk data fetching
* **Socket/WebSocket client** untuk data real-time
* **Charting library** untuk candlestick dan indikator
* **State management** ringan bila perlu

## 24. Rekomendasi Teknologi Tambahan

* **Backend**: NestJS atau Express
* **Database**: PostgreSQL
* **Cache / Queue**: Redis
* **AI Service**: Python (FastAPI) bila diperlukan
* **Deployment**: Docker
* **Monitoring**: log terpusat + health check

## 25. Risiko Produk

* Market sangat volatil.
* AI bisa overfit.
* Sinyal teknikal bisa false breakout.
* Slippage dan fee bisa mengurangi hasil.
* API exchange bisa rate limit atau error.
* Kondisi market berubah cepat.

## 26. Mitigasi Risiko

* Gunakan paper trading sebelum live.
* Gunakan batas risiko per trade.
* Simulasikan fee dan slippage.
* Gunakan multi-filter sebelum entry.
* Stop bot saat performa menurun.
* Monitor dan retrain model AI secara berkala.

## 27. Rencana Pengembangan

### Tahap 1 — Fondasi

* setup frontend dan backend,
* integrasi market data,
* dashboard utama,
* login dan keamanan dasar.

### Tahap 2 — Trading Engine

* signal engine,
* paper trading,
* risk management,
* riwayat trade.

### Tahap 3 — AI Scanner

* scoring koin,
* ranking peluang,
* multi-indicator fusion,
* evaluasi model.

### Tahap 4 — Polishing

* UI premium,
* analytics,
* Telegram,
* deployment production.

## 28. Catatan Penting

Untuk hasil yang lebih profesional, sistem sebaiknya tidak langsung mengandalkan AI untuk buy/sell penuh. Struktur terbaik adalah:

* **indikator + price action + volume** sebagai dasar,
* **AI sebagai filter dan ranking**,
* **risk engine sebagai pengaman terakhir**.

Dengan pendekatan ini, bot lebih masuk akal, lebih mudah diuji, dan lebih aman untuk dikembangkan ke live trading.

---

## Keputusan Produk yang Direkomendasikan

**Arsitektur terbaik untuk versi awal:**

* Frontend: React + Vite + Tailwind CSS + Axios
* Backend: Node.js (NestJS/Express)
* DB: PostgreSQL
* Realtime: WebSocket
* AI: Python service opsional
* Mode trading: Demo real-time terlebih dahulu, lalu live

**Inti strategi terbaik:**

* indikator teknikal + price action + volume,
* AI scoring,
* risk engine ketat,
* Telegram notifikasi,
* encryption untuk API key.
