import { defineStore } from "pinia";
export const PreProcessing = defineStore("preProcessing", {
    state:()=>({
      tablesToReplace: JSON.parse(import.meta.env.VITE_TABLES_TO_REPLACE),
      prodiMap: JSON.parse(import.meta.env.VITE_PRODI),
      unknownValues: JSON.parse(import.meta.env.VITE_UNKNOWN_VALUES || '{}'),
      jalurMasukMap: JSON.parse(import.meta.env.VITE_JALUR_MASUK),
    }),
    getters:{
      async findDuration(tglMasuk, tglKeluar) {
        const masukDate = new Date(tglMasuk);
        const keluarDate = new Date(tglKeluar);
    
        // Hitung selisih dalam tahun dan bulan
        let yearDiff = keluarDate.getFullYear() - masukDate.getFullYear();
        let monthDiff = keluarDate.getMonth() - masukDate.getMonth();
    
        // Jika bulan di tglMasuk lebih besar dari bulan di tglKeluar, kurangi 1 tahun dan sesuaikan bulan
        if (monthDiff < 0) {
            yearDiff--;
            monthDiff += 12;
        }

            // Hitung tahun dalam format desimal
        let totalYears = yearDiff + (monthDiff / 12);

        if (monthDiff === 0) {
          return `${yearDiff} tahun`;
        } else {
            // Bulatkan ke 1 angka desimal
            return `${totalYears.toFixed(1)} tahun`;
        }
    }
    },
    actions:{
      async startPreprocessing(data, p){
        const cut = await this.cutColumn(data);
        const clean = await this.cleaningData(cut);
        const extractInfo = await this.extractInfo(clean);
        const finalData = await this.categorized(extractInfo, p)
        return finalData;
      },
      async cutColumn(data){
        const columnsToCut = import.meta.env.VITE_COLUMNS_TO_CUT.split(',');
        const result = data.map((student) => {
          columnsToCut.forEach((col) => {
            delete student[col];
          });
          return student;
        });
        return result;
      },
      async cleaningData(data){
        //handle duplicate by npm
        const seenNPM = new Set();
        const uniqueData = data.filter((student) => {
          const duplicate = seenNPM.has(student.npm);
          seenNPM.add(student.npm);
          return !duplicate;
        });
        // return uniqueData;

        // Handle kolom kosong dengan nilai default
        const tablesToReplace = this.tablesToReplace;
        const emptyField = uniqueData.map((student) => {
          // Tangani tiap kolom secara spesifik
          Object.keys(student).forEach((key) => {
            if (student[key] === "" || student[key] === undefined || student[key] === null) {
                // Jika key ada di tabel replacement, gunakan nilai yang didefinisikan
                if (tablesToReplace[key]) {
                    student[key] = tablesToReplace[key];
                } else {
                    // Jika tidak ada, gunakan nilai default
                    student[key] = tablesToReplace.default || null;
                }
            }
          });
          return student;
        });

        return emptyField;
      },
      async extractInfo(data){
        //extract NPM
        data.map((student) => {
          const npm = student.npm;

          // Ekstraksi 2 digit pertama untuk angkatan
          const angkatanCode = npm.slice(0, 2);
          let angkatan;
          
          if (parseInt(angkatanCode) < 10) {
              angkatan = `200${angkatanCode}`; // Angkatan sebelum 2010
          } else {
              angkatan = `20${angkatanCode}`;  // Angkatan setelah 2010
          }
          student.angkatan = angkatan;

          // Ekstraksi 2 digit berikutnya untuk jalur masuk
          const jalurMasukCode = npm.slice(2, 4);
          const jalurMasuk = this.jalurMasukMap[jalurMasukCode] || this.unknownValues.jalur;
          student.jalurMasuk = jalurMasuk;

          // Ekstraksi 3 digit setelahnya untuk kode prodi
          const prodiCode = npm.slice(4, 7);
          const prodi = this.prodiMap[prodiCode] || this.unknownValues.prodi;
          student.prodi = prodi;

          // Mengambil tanggal tanpa timestamp (YYYY-MM-DD)
          const tglMasuk = student.tglMasuk.split('T')[0];
          student.tglMasuk = tglMasuk;
          const tglKeluar = student.tglKeluar ? student.tglKeluar.split('T')[0] : null;
          student.tglKeluar = tglKeluar;

          // Hitung durasi 
          const masukDate = new Date(tglMasuk);
          const keluarDate = tglKeluar ? new Date(tglKeluar) : null;
          let durasi = null;
          if (masukDate && keluarDate && keluarDate >= masukDate) {
              // Hitung selisih dalam tahun dan bulan
              let yearDiff = keluarDate.getFullYear() - masukDate.getFullYear();
              let monthDiff = keluarDate.getMonth() - masukDate.getMonth();
              
              // Jika bulan di tglMasuk lebih besar dari bulan di tglKeluar, kurangi 1 tahun dan sesuaikan bulan
              if (monthDiff < 0) {
                  yearDiff--;
                  monthDiff += 12;
              }
              // Hitung tahun dalam format desimal
              let totalYears = yearDiff + (monthDiff / 12);
                  // Bulatkan ke 0 atau 0.5 terdekat
              durasi = Math.floor(totalYears) + (totalYears % 1 >= 0.5 ? 0.5 : 0);
          }
          student.durasi = durasi;

        });
        data.forEach((student) => {
          delete student.npm;
        })
        return data;
      },
      async categorized(data, p){
        let finalData ={};
        if (p === "all"){
          data.forEach((student) => {
            let fakultas = student.prodi;
            if (!Object.prototype.hasOwnProperty.call(finalData, fakultas)) {
              finalData[fakultas] = [];
            }
            finalData[fakultas].push(student);
          });
        } else {
          data.forEach((student) => {
            let tahunMasuk = new Date(student.tglMasuk)
              .getFullYear()
              .toString();
            if (!Object.prototype.hasOwnProperty.call(finalData, tahunMasuk)) {
              finalData[tahunMasuk] = [];
            }
            finalData[tahunMasuk].push(student);
          });
          this.fakultas = false;
        }
        return finalData;
      },
//HELPER CODE
    },
})