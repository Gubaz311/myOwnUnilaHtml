import { defineStore } from "pinia";
export const extractInfo = defineStore("extractInfo", {
  state: () => ({
    data: [],
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
    async startExtracting(data, p) {
      this.extractedData = {};
      this.extractedData.totalData = await this.totalData(data);
      this.extractedData.countBestGPA = (await this.countBest(data)).bestGPA;
      this.extractedData.countBestDuration = (await this.countBest(data)).bestDuration;
      this.extractedData.countBestGPADuration = (await this.countBest(data)).bestGPADuration;
      this.extractedData.avgAll = await this.avgAll(data);
      this.extractedData.avgCat = await this.avgCat(data, p);
      this.extractedData.maxStats = await this.maxStats(data);
      this.extractedData.bestCat = await this.bestCat(this.extractedData.avgCat, p);

      return this.extractedData;
    },
    async totalData(data){
      let totalData = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
      return totalData;
    },
    async countBest(data){
      const flattened = Object.values(data).flat();
      let result = {
        bestGPA: 0,
        bestDuration: 0,
        bestGPADuration: 0,
      };
      flattened.forEach(item => {
        const gpa = parseFloat(item.ipk ?? 0);
        const duration = parseFloat(item.durasi ?? 0);
        const bestGpa = gpa >= 3.00;
        const bestDuration = duration <= 4;

        if (bestGpa) result.bestGPA++;
        if (bestDuration) result.bestDuration++;
        if (bestGpa && bestDuration) result.bestGPADuration++;
        
      })
      return result;
    },
    async avgAll(data){
      const flattened = Object.values(data).flat();
      const total = flattened.length;
      const sum = flattened.reduce((acc, item) => {
        acc.ipk += parseFloat(item.ipk ?? 0);
        acc.durasi += parseFloat(item.durasi ?? 0);
        return acc
      }, {ipk: 0, durasi: 0});

      return {
        avgGPA: total ? (sum.ipk / total).toFixed(2) : "0.00",
        avgDuration: total ? (sum.durasi / total).toFixed(1) : "0.0",
      }

    },
    async avgCat(data, p) {
      const result = {};
    
      const isValidEntry = (entry) => {
        const masuk = new Date(entry.tglMasuk);
        const keluar = new Date(entry.tglKeluar);
        return keluar >= masuk;
      };
    
      if (p === "all") {
        const grouped = {};
    
        for (const [key, arr] of Object.entries(data)) {
          const code = key.split("-")[0];
          if (!grouped[code]) grouped[code] = [];
          grouped[code].push(...arr);
        }
    
        for (const [code, arr] of Object.entries(grouped)) {
          const valid = arr.filter(isValidEntry);
          if (!valid.length) continue;
    
          const sumGPA = valid.reduce((sum, d) => sum + parseFloat(d.ipk), 0);
          const sumDur = valid.reduce((sum, d) => sum + parseFloat(d.durasi), 0);
          const prodiName = valid[0].prodi;
    
          result[code] = {
            category: prodiName,
            avgGPA: (sumGPA / valid.length).toFixed(2),
            avgDuration: (sumDur / valid.length).toFixed(1)
          };
        }
      } else {
        for (const [key, arr] of Object.entries(data)) {
          const valid = arr.filter(isValidEntry);
          if (!valid.length) continue;
    
          const year = key.split("-")[1];
          const sumGPA = valid.reduce((sum, d) => sum + parseFloat(d.ipk), 0);
          const sumDur = valid.reduce((sum, d) => sum + parseFloat(d.durasi), 0);
          const prodiName = valid[0].prodi;
    
          result[year] = {
            category: prodiName,
            avgGPA: (sumGPA / valid.length).toFixed(2),
            avgDuration: (sumDur / valid.length).toFixed(1)
          };
        }
      }
    
      return result;
    },
    
    async  maxStats(data) {
      const flattened = Object.values(data).flat();
    
      let maxGPA = 0;
      let maxDuration = Infinity;
      const gpaCounts = {};
      const durationCounts = {};
    
      flattened.forEach(item => {
        const gpa = parseFloat(item.ipk);
        const durasi = parseFloat(item.durasi);
    
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
      const cat = data;
    
      if (!cat || Object.keys(cat).length === 0) {
        return {
          bestAvgGPA: { label: "-", value: "-", score: "N/A" },
          bestAvgDuration: { label: "-", value: "-", score: "N/A" }
        };
      }
    
      let bestGPA = { key: null, value: -Infinity };
      let bestDuration = { key: null, value: Infinity };
    
      for (const [key, val] of Object.entries(cat)) {
        const gpa = parseFloat(val.avgGPA);
        const duration = parseFloat(val.avgDuration);
    
        if (gpa > bestGPA.value) {
          bestGPA = { key, value: gpa };
        }
    
        if (duration < bestDuration.value) {
          bestDuration = { key, value: duration };
        }
      }
    
      // Untuk p === 'all', ambil nama prodi dari category
      // Untuk selain 'all', pakai tahun (key)
      const bestGPAValue = p === "all" 
        ? cat[bestGPA.key]?.category || bestGPA.key 
        : bestGPA.key;
    
      const bestDurationValue = p === "all" 
        ? cat[bestDuration.key]?.category || bestDuration.key 
        : bestDuration.key;
    
      const label = p === "all" ? "Prodi" : "Tahun";
    
      return {
        bestAvgGPA: {
          label,
          value: bestGPAValue,
          score: bestGPA.value.toFixed(2)
        },
        bestAvgDuration: {
          label,
          value: bestDurationValue,
          score: bestDuration.value.toFixed(1)
        }
      };
    },
    
  },
});