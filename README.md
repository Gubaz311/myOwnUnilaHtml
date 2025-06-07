# Prediksi Kelulusan Tepat Waktu Mahasiswa (KTW)  
Skripsi - Sistem Prediksi KTW Berbasis Vue.js dan TensorFlow.js

## 📖 Deskripsi

Skripsi ini bertujuan untuk membangun sistem prediksi **Kelulusan Tepat Waktu (KTW)** mahasiswa berdasarkan data akademik dan status studi. Sistem ini dikembangkan menggunakan **Vue.js** sebagai frontend dan **TensorFlow.js** sebagai library machine learning di sisi client (browser).

Sistem dapat melakukan pelatihan model (training), validasi, pengujian, dan inferensi secara langsung di browser tanpa server eksternal. Diharapkan sistem ini dapat membantu institusi pendidikan dalam menganalisis risiko keterlambatan kelulusan mahasiswa secara otomatis.

---

## 🚀 Fitur Utama

- Input data mahasiswa per semester (IPK, SKS, status)
- Preprocessing data otomatis (normalisasi, encoding, penghapusan outlier)
- Training model machine learning di browser menggunakan TensorFlow.js
- Menyimpan dan memuat model yang telah dilatih
- Prediksi kelulusan tepat waktu secara real-time
- Visualisasi loss dan akurasi selama proses pelatihan

---

## 🛠 Teknologi

- **Vue.js** – Framework frontend JavaScript
- **Vite** – Build tool modern untuk Vue
- **Pinia** – State management pengganti Vuex
- **TensorFlow.js** – Library machine learning berbasis JavaScript
- **JavaScript (ES6+)** – Bahasa utama pengembangan

---

## 📁 Struktur Folder

src/
├── assets/ # Asset statis (gambar, ikon, dll)
├── components/ # Komponen UI Vue
├── models/ # Kode terkait model ML
│ ├── preprocessing.js # Pra-pemrosesan data
│ ├── modelBuilder.js # Arsitektur model
│ └── trainer.js # Logika pelatihan
├── stores/ # Store Pinia untuk data global
├── views/ # Halaman Vue (UI utama)
├── App.vue # Komponen root
├── main.js # Entry point aplikasi
.env # Variabel environment

---

## ⚙️ Cara Menjalankan Aplikasi

1. **Clone repositori:**
   ```bash
   git clone https://github.com/username/proyek-prediksi-ktw.git
   cd proyek-prediksi-ktw

2. **Instal Depedensi**
npm install

3. **Jalankan server pengembangan**
npm run dev

4. **Akses Aplikasi**
http://localhost:5173

🧠 Alur Proses
Input Data Mahasiswa
Input terdiri dari data per semester:

IPK

Total SKS

Status aktif (AK), cuti (CT), tidak aktif (TA)

Angkatan, prodi, dan atribut lain

Pra-pemrosesan

Menyelesaikan missing value

Menghapus outlier menggunakan metode IQR

Melakukan one-hot encoding dan normalisasi

Mengelompokkan berdasarkan angkatan

Pelatihan Model

Model neural network dibangun dengan TensorFlow.js

Lapisan: Dense, Dropout, Aktivasi ReLU/Sigmoid

Callback: EarlyStopping, ReduceLROnPlateau

Data dibagi: 80% training, 10% validasi, 10% testing

Evaluasi & Prediksi

Menampilkan akurasi, val_loss, dan confusion matrix

Prediksi KTW untuk mahasiswa baru berdasarkan data historis


Skripsi ini dibuat untuk keperluan akademik. Anda bebas menggunakan atau memodifikasi proyek ini untuk pembelajaran atau penelitian dengan tetap mencantumkan atribusi yang sesuai.

---

Kalau kamu ingin saya menambahkan nama, institusi, atau link demo (jika ada), tinggal beri tahu. Saya juga bisa bantu buat versi Bahasa Inggris jika dibutuhkan untuk publikasi atau presentasi internasional.
