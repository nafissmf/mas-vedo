# Kuesioner Tesis Vedo

Aplikasi Nuxt untuk kuesioner tesis tentang *Job Insecurity*, *Organizational Justice*, *Career Development*, dan *Employee Performance*. Form memuat empat data responden serta 28 pernyataan skala Likert, dan menyimpan respons secara transaksional ke MySQL.

## Menjalankan

1. Salin `.env.example` menjadi `.env`, kemudian isi kredensial MySQL yang benar.
2. Instal dependensi dengan `npm install` lalu jalankan pengembangan dengan `npm run dev`.
3. Buka `http://localhost:3000`.

Untuk menjalankan dengan Docker, pastikan `mysql-container` sudah berjalan di network `app-bridge`, isi `.env`, lalu jalankan `docker compose up -d --build`.

## Menggunakan MySQL container yang sudah ada

Aplikasi membaca `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` dari `.env`. Container aplikasi terhubung ke network `app-bridge` yang sama dengan `mysql-container`. Jalankan isi [`database/init.sql`](database/init.sql) sekali pada database tujuan untuk membuat tabel `responses` dan `answers`.

Data identitas dipisahkan dari jawaban. Setiap pengiriman menghasilkan UUID anonim (`respondent_code`) dan seluruh 28 skor wajib bernilai 1–5.

## Back office

Buka `/admin` untuk melihat, menambah, mengubah, dan menghapus data kuesioner. Isi `ADMIN_USER` dan `ADMIN_PASSWORD` di `.env`; jika kosong, back office tidak bisa diakses. Login memakai Basic Auth, jadi di server wajib diakses lewat HTTPS.
