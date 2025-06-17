import { defineStore } from "pinia";
export const PreProcessing = defineStore("preProcessing", {
    state:()=>({
      dataToDelete:import.meta.env.VITE_DATA_TO_DELETE,
      tablesToReplace: JSON.parse(import.meta.env.VITE_TABLES_TO_REPLACE),
      prodiMap: JSON.parse(import.meta.env.VITE_PRODI),
      unknownValues: JSON.parse(import.meta.env.VITE_UNKNOWN_VALUES || '{}'),
      jalurMasukMap: JSON.parse(import.meta.env.VITE_JALUR_MASUK),
      columnsToCut: import.meta.env.VITE_COLUMNS_TO_CUT,
    }),
    getters:{
    },
    actions:{
      async startPreprocessing(data){
        async function extractInfo(studentsArr){
          function getSemesterNumber(str){
              const year = parseInt(str);
              const isGenap = str.toLowerCase().includes("genap");
              return (year - 2000) * 2 + (isGenap ? 1 : 0);
          };

          function roundToNearestHalf(num) {
              return Math.round(num * 2) / 2;
          };

          for (const student of studentsArr) {
          const semesterAwal = getSemesterNumber(student.angkatan);
          const semesterAkhir = getSemesterNumber(student.semesterTerakhir);
          const durasi = Number(roundToNearestHalf((semesterAkhir - semesterAwal)/2));
          student.durasi = parseFloat(durasi.toFixed(1));
          }
          return studentsArr;
        };

        const clean = await this.cleaningData(data);
        const extractedInfo = await extractInfo(clean);
        const cut = await this.cutColumn(extractedInfo);
        return cut;
      },
      async cleaningData(data){
        const dataToDelete = this.dataToDelete.split(",");
        //handle other than S1 data
        const onlyS1Students = data.filter((student) => {
          const jalurMasuk = (student.jalurMasuk || "").toLowerCase();
          const jalurPenerimaan = (student.jalurPenerimaan || "").toLowerCase();
          const namaProdi = (student.namaProdi || "").toLowerCase();
          
          const combined =`${jalurMasuk} ${jalurPenerimaan} ${namaProdi}`;
          return !dataToDelete.some((dataToDelete) => combined.includes(dataToDelete));
        })

        //handle duplicate by npm
        const seenNPM = new Set();
        const uniqueData = onlyS1Students.filter((student) => {
          const duplicate = seenNPM.has(student.npm);
          seenNPM.add(student.npm);
          return !duplicate;
        });
        
        //handle missing fakultas and namaProdi
        const prodiMap = new Map()
        uniqueData.forEach((student) => {
          const npm = student.npm;
          const kode = npm.substring(3, 7);
          const namaProdi = student.namaProdi?.trim();
          const fakultas = student.fakultas?.trim();

          if (namaProdi && fakultas){
            prodiMap.set(kode, { namaProdi, fakultas });
          }
        })

        const filledStudents = uniqueData.map((student) =>{
          const npm = student.npm;
          const kode = npm.substring(3, 7);
          const ref = prodiMap.get(kode);

          return {
            ...student,
            namaProdi: ref ? ref.namaProdi : student.namaProdi,
            fakultas: ref ? ref.fakultas : student.fakultas,
          }
        })

        // Handle null student.angkatan value
        filledStudents.map((student) => {
          if (!student.angkatan){
            const npm = student.npm
            const angkatanCode = npm.slice(0,2);
            if (parseInt(angkatanCode)<10){
              student.angkatan = `200${angkatanCode}`;
            }else{
              student.angkatan = `20${angkatanCode}`;
            }
          }
        })

        // Handle null student.jalurPenerimaan value
        let jalurMap = {};
        filledStudents.forEach(s => {
          if (s.jalurPenerimaan && !jalurMap[s.kodeProdi]) {
            jalurMap[s.kodeProdi] = s.jalurPenerimaan;
          }
        });

        // Isi jalurPenerimaan yang kosong berdasarkan mapping
        filledStudents.forEach(student => {
          if (!student.jalurPenerimaan || student.jalurPenerimaan.trim() === "") {
            student.jalurPenerimaan = jalurMap[student.kodeProdi] || "tidak diketahui";
          }
        });

        const outRangeIpk = filledStudents.filter((student) => {
          const ipk = parseFloat(student.ipk);
          return ipk >= 0.00 && ipk <= 4.00;
        })
        return outRangeIpk;
      },
      async cutColumn(data){
        const columnsToCut = this.columnsToCut.split(",");
        const result = data.map((student) => {
          columnsToCut.forEach((col) => {
            if (col in student) {
              delete student[col];
            }
          });
          return student;
        });
        return result;
      },
    },
})