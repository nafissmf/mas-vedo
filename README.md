# Kuesioner Tesis Vedo

Aplikasi Nuxt untuk kuesioner tesis tentang *Job Insecurity*, *Organizational Justice*, *Career Development*, dan *Employee Performance*. Form memuat empat data responden serta 28 pernyataan skala Likert, dan menyimpan respons secara transaksional ke MySQL.

## Menjalankan

1. Salin `.env.example` menjadi `.env`, kemudian isi kredensial MySQL yang benar.
2. Instal dependensi dengan `npm install` lalu jalankan pengembangan dengan `npm run dev`.
3. Buka `http://localhost:3000`.

Untuk menjalankan seluruh stack baru dengan Docker, ganti password default pada `docker-compose.yml`, lalu jalankan `docker compose up --build`.

## Menggunakan MySQL container yang sudah ada

Secara default aplikasi mencari host `mysql-container`. Pastikan container Nuxt dan MySQL berada pada jaringan Docker yang sama, atau set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` di `.env`. Jalankan isi [`database/init.sql`](database/init.sql) sekali pada database tujuan untuk membuat tabel `responses` dan `answers`.

Data identitas dipisahkan dari jawaban. Setiap pengiriman menghasilkan UUID anonim (`respondent_code`) dan seluruh 28 skor wajib bernilai 1–5.
