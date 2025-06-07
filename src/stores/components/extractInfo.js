import { defineStore } from "pinia";
import { MainStore } from "../mainStore";
export const extractInfo = defineStore("extractInfo", {
  state: () => ({
    dataFlaten: [],
    extractedData : {},
    prodi: null,
    jalurMasukMap: JSON.parse(import.meta.env.VITE_JALUR_MASUK),
    tablesToReplace: JSON.parse(import.meta.env.VITE_TABLES_TO_REPLACE),
    prodiMap: JSON.parse(import.meta.env.VITE_PRODI),
    unknownValues: JSON.parse(import.meta.env.VITE_UNKNOWN_VALUES || '{}'),
  }),
  getters: {
    getProdi() {
      return this.prodi;
    },
  },
  actions: {
    async classifyKTW(studentsArray){
      const store = MainStore();
      const statusConfig = store.getStatus;
      const currentYears = store.getTimeNow;
      const tressholdYears = currentYears-4;

      const lulusStatus = (statusConfig.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());
      const doStatus     = (statusConfig.dikeluarkan || 'do').split(',').map(s => s.trim().toLowerCase());
      const aktifStatus  = (statusConfig.aktif || 'aktif').split(',').map(s => s.trim().toLowerCase());
      const keluarStatus = (statusConfig.keluar || 'keluar').split(',').map(s => s.trim().toLowerCase());

      let tepatWaktu = 0;
      let tidakTepatWaktu= 0;
      for (const student of studentsArray){
        const status = student.statusMahasiswa?.trim().toLowerCase();
        const duration = parseFloat(student.durasi);
        const angkatan = parseInt(student.angkatan);
        
        // Graduated
        if(lulusStatus.includes(status)){
          if(duration <= 4) tepatWaktu++;
          else              tidakTepatWaktu++;
        }
        // Kicked out
        else if (doStatus.includes(status)){
          if (duration >= 2) tidakTepatWaktu++;
        }
        // Resigned
        else if (keluarStatus.includes(status)){
          if (duration > 6) tidakTepatWaktu++;
        }
        // Active
        else if (aktifStatus.includes(status)){
          if (angkatan < tressholdYears) tidakTepatWaktu++;
        }
      }
      return {
        tepatWaktu,
        tidakTepatWaktu,
      };
    },
    async flattenData(data, p) {
      if(p ==="all"){
        return Object.values(data) 
        .flatMap(prodiObj =>
          Object.values(prodiObj) 
            .flatMap(angkatanObj =>
              Object.values(angkatanObj) 
                .flat() 
            )
        );
      }else{
        return Object.values(data).flat();
      }
    },       
    async startExtracting(data, p) {
      this.dataFlaten = {};
      this.extractedData = {};
      this.dataFlaten = await this.flattenData(data, p);
      await Promise.resolve();
      this.extractedData.totalData = await this.totalData();
      const bestCounts = await this.countBest(); 
      this.extractedData.countBestGPA  = bestCounts.bestGPA;
      this.extractedData.countBestDuration = bestCounts.bestDuration;
      this.extractedData.countBestGPADuration = bestCounts.bestGPADuration;
      
      this.extractedData.avgAll = await this.avgAll(); 
      this.extractedData.avgCat = await this.avgCat(data, p);
      this.extractedData.maxStats = await this.maxStats(data);
      this.extractedData.bestCat = await this.bestCat(this.extractedData.avgCat, p);
      this.extractedData.ktw = await this.findKTW(data, p);
      return this.extractedData;
    },
    async totalData(){
      const totalData = this.dataFlaten.length;
      return totalData;
    },
    async countBest(){
      const flattened = this.dataFlaten;
      const store = MainStore();
      const statusConfig = store.getStatus;
      const lulusStatus = (statusConfig.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());
      let result = {
        bestGPA: 0,
        bestDuration: 0,
        bestGPADuration: 0,
      };
      flattened.forEach(item => {
        const status = item.statusMahasiswa?.trim().toLowerCase();

        const gpa = parseFloat(item.ipk);
        let duration = NaN;

        if(lulusStatus.includes(status)){
          duration = parseFloat(item.durasi);
        }
        const validGPA = !isNaN(gpa) && gpa >=0 && gpa >= 3.00;
        const validDuration = !isNaN(duration) && duration <= 4;

        if(validGPA) result.bestGPA++;
        if(validDuration) result.bestDuration++;
        if(validGPA && validDuration) result.bestGPADuration++;
      })
      return result;
    },
    async avgAll() {
      const flattened = this.dataFlaten;
    
      let sumGPA = 0;
      let countGPA = 0;
      let sumDurasi = 0;
      let countDurasi = 0;

      const store = MainStore();
      const statusConfig = store.getStatus;
      const lulusStatus = (statusConfig.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());
    
      flattened.forEach(item => {
        const ipk = parseFloat(item.ipk);
        if (!isNaN(ipk)) {
          sumGPA += ipk;
          countGPA++;
        }

        const status = item.statusMahasiswa?.trim().toLowerCase();
        let durasi = NaN;
        if(lulusStatus.includes(status)){
          durasi = parseFloat(item.durasi);
        }
        if (!isNaN(durasi)) {
          sumDurasi += durasi;
          countDurasi++;
        }
      });
    
      return {
        avgGPA: countGPA ? (sumGPA / countGPA).toFixed(2) : "0.00",
        avgDuration: countDurasi ? (sumDurasi / countDurasi).toFixed(1) : "0.0",
      };
    },
    async avgCat(data, p){
      const store = MainStore();
      const statusConfig = store.getStatus;
      const lulusStatus = (statusConfig.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());

      const result = {};
      if(p==="all"){
        for (const [fakultas, prodiObj] of Object.entries(data)){
          let sumDur = 0;
          let countDur = 0;
          let sumGPA = 0;
          let countGPA=0;
          let totalAll=0;

          for (const angkatanObj of Object.values(prodiObj)){
            for (const mahasiswaArr of Object.values(angkatanObj)){
              for (const mahasiswa of mahasiswaArr){
                totalAll++;              
                // Durasi
                let durasi = NaN;
                const status = mahasiswa.statusMahasiswa?.trim().toLowerCase();
                if(lulusStatus.includes(status)){
                  durasi = parseFloat(mahasiswa.durasi);
                }
                if(!isNaN(durasi)){
                  sumDur+= durasi;
                  countDur++;
                }
                // Ipk
                const ipk = parseFloat(mahasiswa.ipk)
                if(!isNaN(ipk)){
                  sumGPA += ipk;
                  countGPA++;
                }
              }
            }
          }
          const avgGPA = countGPA ? (sumGPA/countGPA).toFixed(2) : "0.00";
          const avgDur = countGPA ? (sumDur/countDur).toFixed(1) : "0.0";

          if(totalAll > 0){
            result[fakultas] ={
              category: fakultas,
              avgGPA: avgGPA,
              avgDuration: avgDur,
              total: totalAll
            };
          }
        }
      }else{
        for (const [angkatan, mahasiswa] of Object.entries(data)){
          let sumDur = 0;
          let countDur = 0;
          let sumGPA = 0;
          let countGPA=0;
          let totalAll=0;

          mahasiswa.forEach(item => {
            totalAll++;              
            // Durasi
            let durasi = NaN;
            const status = item.statusMahasiswa?.trim().toLowerCase();
            if(lulusStatus.includes(status)){
              durasi = parseFloat(item.durasi);
            }
            if(!isNaN(durasi)){
              sumDur+= durasi;
              countDur++;
            }
            // Ipk
            const ipk = parseFloat(item.ipk)
            if(!isNaN(ipk)){
              sumGPA += ipk;
              countGPA++;
            }
          })

          const avgGPA = countGPA ? (sumGPA/countGPA).toFixed(2) : "0.00";
          const avgDur = countGPA ? (sumDur/countDur).toFixed(1) : "0.0";

          if(totalAll > 0){
            result[angkatan] ={
              category: angkatan,
              avgGPA: avgGPA,
              avgDuration: avgDur,
              total: totalAll
            };
          }
        }
      }
      return result;
    },
    async  maxStats() {
      const store = MainStore();
      const statusConfig = store.getStatus;
      const lulusStatus = (statusConfig.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());
      const flattened = this.dataFlaten;
    
      let maxGPA = 0;
      let maxDuration = Infinity;
      const gpaCounts = {};
      const durationCounts = {};
    
      flattened.forEach(item => {
        const status = item.statusMahasiswa?.trim().toLowerCase();
        let durasi = NaN;
        if(lulusStatus.includes(status)){
          durasi = parseFloat(item.durasi)
        }

        const hasValidIPK = Object.prototype.hasOwnProperty.call(item, 'ipk') && item.ipk !== '' && item.ipk <= 4.00;
        const gpa = hasValidIPK ? parseFloat(item.ipk) : NaN;
                
        // Update max GPA and counts
        if (gpa >= maxGPA) {
          maxGPA = Math.max(maxGPA, gpa);
          gpaCounts[gpa] = (gpaCounts[gpa] || 0) + 1;
        }
    
        // Update min duration and counts
        if (durasi <= maxDuration) {
          maxDuration = Math.min(maxDuration, durasi);
          durationCounts[durasi] = (durationCounts[durasi] || 0) + 1;
        }
      });
    
      return {
        highestGPA: {
          value: maxGPA.toFixed(2),
          count: gpaCounts[maxGPA] || 0,
        },
        fastestDuration: {
          value: maxDuration.toFixed(1),
          count: durationCounts[maxDuration] || 0,
        },
      };
    },
    async bestCat(data, p) {
      if (!data || Object.keys(data).length === 0) {
        return {
          bestAvgGPA: { label: "-", value: "-", score: "N/A" },
          bestAvgDuration: { label: "-", value: "-", score: "N/A" }
        };
      }    

      let bestGPA = { key: null, value: -Infinity };
      let bestDuration = { key: null, value: Infinity };

      for (const [key, val] of Object.entries(data)) {
        const gpa = parseFloat(val.avgGPA);
        const duration = parseFloat(val.avgDuration);
    
        if(duration === 0) continue;
        if (!isNaN(gpa) && gpa > bestGPA.value && gpa <= 4) {
          bestGPA = { key, value: gpa };
        }
    
        if (!isNaN(duration) && duration > 0 && duration < bestDuration.value) {
          bestDuration = { key, value: duration };
        }
      }
      const bestGPAValue = p === "all"
      ? data[bestGPA.key]?.category ?? bestGPA.key  
      : bestGPA.key;                                
    
      const bestDurationValue = p === "all"
      ? data[bestDuration.key]?.category ?? bestDuration.key
      : bestDuration.key;
    
      const label = p === "all" ? "Fakultas" : "Angkatan";
    
      return {
        bestAvgGPA: {
          label,
          value: bestGPAValue,
          score: isFinite(bestGPA.value) ? bestGPA.value.toFixed(2) : "N/A"
        },
        bestAvgDuration: {
          label,
          value: bestDurationValue,
          score: isFinite(bestDuration.value) ? bestDuration.value.toFixed(1) : "N/A"
        }
      };
    },
    async findKTW(data, p){
      const result = {};
      if(p==="all"){
        for (const [fakultas, prodiObj] of Object.entries(data)){
          let tepatWaktu = 0;
          let tidakTepatWaktu = 0;

          for (const angkatan of Object.values(prodiObj)){
            for (const students of Object.values(angkatan)){
              const classified = await this.classifyKTW(students);
              tepatWaktu += classified.tepatWaktu;
              tidakTepatWaktu += classified.tidakTepatWaktu;
            }
          }
          if (tepatWaktu|| tidakTepatWaktu){
            result[fakultas]={
              tepatWaktu,
              tidakTepatWaktu,
            };
          }
        }
      }else{
        for (const[angkatan, mahasiswa] of Object.entries(data)){
          let tepatWaktu = 0;
          let tidakTepatWaktu = 0;

          const classified = await this.classifyKTW(mahasiswa)
          tepatWaktu += classified.tepatWaktu;
          tidakTepatWaktu += classified.tidakTepatWaktu;

          if (tepatWaktu || tidakTepatWaktu){
            result[angkatan]={
              tepatWaktu,
              tidakTepatWaktu,
            };
          }
        }
      }
      return result
    },
  },
});