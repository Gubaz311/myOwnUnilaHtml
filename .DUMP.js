async startInitial() {
    // 1. Simpan konfigurasi input dan data yang dibutuhkan ke state
    await this.saveConfig(); // menyimpan ke this.data, this.input, this.prodi, dll
  
    // 2. Flatten data mahasiswa dari struktur nested ke array datar
    const flatten = await this.flattenData(this.data, "all");
    this.dataFlaten = flatten;
  
    // 3. Filter data outlier (misal mahasiswa mengundurkan diri di semester < 4 atau IPK tidak valid)
    const cleaned = await this.cleanOutlier(flatten);
  
    // 4. Bangun peta one-hot encoding untuk field-field kategori
    this.encodeMaps = await this.buildEncodeMaps(cleaned);
  
    // 5. Kelompokkan data mahasiswa berdasarkan tahun masuk
    this.groupedData = await this.groupByYear(cleaned);
  
    // 6. Tentukan tahun awal pelatihan dan batas akhir (threshold year = tahun sekarang - 4)
    this.trainingYear = 2018;
    this.thresholdYear = new Date().getFullYear() - 4;
  
    // 7. Data siap digunakan untuk pelatihan bertahap per tahun
    console.log("✅ Data siap digunakan. Tahun pelatihan awal:", this.trainingYear, "batas akhir:", this.thresholdYear);
  }
  



//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  



// Langkah besar:
this.groupedData = await this.groupByYear(cleanedData);

// Untuk tiap tahun:
for (const year in this.groupedData) {
    const students = this.groupedData[year];

    // Step 1: encode IPK dan input lain
    const encoded = students.map(s => this.encodeSingleStudent(s));

    // Step 2: pisahkan input dan target
    const inputs = encoded.map(e => e.input);
    const targets = encoded.map(e => e.output);

    // Step 3: training model
    await this.train(inputs, targets);
}



import { defineStore } from "pinia";
import { FetchData } from "./components/fetchData";
import { extractInfo } from "./components/extractInfo";
import { PreProcessing } from "./components/preProcessing";
import { ref, nextTick } from "vue";
import router from "@/router";

export const MainStore = defineStore("main", {
  state:()=>({
    theme: null, 
    dataraw:[],
    dataPreprocessing:[], //
    combinedFinalData: {}, //
    optionInfo: {}, //
    memory: [],
    loading:{ //
      status:false,
      content:null,
    },
    extractedData: {}, //
    allProdi:JSON.parse(import.meta.env.VITE_PRODI), //
    statusMahasiswa:JSON.parse(import.meta.env.VITE_STATUS || {}),//
    timeNow:import.meta.env.VITE_TIMENOW ? parseInt(import.meta.env.VITE_TIMENOW) : new Date().getFullYear(),
    linkAi:import.meta.env.VITE_LINK,
    inputAi:JSON.parse(import.meta.env.VITE_INPUT_AI),
    rancuDuration:parseInt(import.meta.env.VITE_RANCU_SEMESTER),
    currentView:"ktw",
    applyInProgress:false,
  }),
  getters:{
    getTeksLoading(state){
      return ref(state.loading.content)
    },
    getThemeColor(state){
      return state.theme === 'dark' ? '#F3F4F6' : '#111827';
    },
    getExtracted(state){
      return state.extractedData
    },
    getOptionInfo(state){
      return state.optionInfo
    },
    getStatus(state){
      return state.statusMahasiswa
    },
    getTimeNow(state){
      return state.timeNow
    },
    getLink(state){
      return state.linkAi
    },
    getDataPreprocessing(state){
      return state.dataPreprocessing
    },
    getProdi(state){
      return state.allProdi
    },
    getInput(state){
      return state.inputAi
    },
    getRancuDuration(state){
      return state.rancuDuration
    },
    async resetCombinedFinalData(state){
      for (const key in state.combinedFinalData){
        delete state.combinedFinalData[key];
      }
      Object.assign(state.combinedFinalData, {})
      state.combinedFinalData = {};
    },
  },
  actions:{
    async gotoReport(){
      router.push('/report')
      this.currentView = 'report'
    },
    async setTheme(newTheme){
      this.theme = newTheme;
      localStorage.theme = newTheme;
    },
    async setData(p, y){
      const fetchData = FetchData();
      const preProcessing = PreProcessing();
      this.loading.status = false;
      await this.resetCombinedFinalData;
      await nextTick();
      await Promise.resolve();
      this.optionInfo.prodi = p;
      this.optionInfo.year = y;
  


      //check if data already exist
      if(p === "all"){
        for(const prodiCode of Object.keys(this.allProdi)){
          const {namaProdi, fakultas} = this.allProdi[prodiCode];
          const missingYear = [];

          //Checking data per year
          for(let year = y[0]; year <= y[1]; year++){
            const yearStr = year.toString();
            if (
              !this.dataPreprocessing[fakultas] || 
              !this.dataPreprocessing[fakultas][namaProdi] ||
              !this.dataPreprocessing[fakultas][namaProdi][yearStr]
            ){
              missingYear.push(yearStr)
            }
          }
          //Fetching missingYeaer per prodi
          if (missingYear.length > 0){
            const minYear = Math.min(...missingYear);
            const maxYear = Math.max(...missingYear);
            
            this.loading.content = "Fetching Data";
            const resultFetch = await fetchData.startFetch(prodiCode, [minYear, maxYear]);
            if (resultFetch.error){
              this.loading.content = "Fail to get data";
              console.log("Data untuk ",prodiCode,"tidak didapat")
              return;
            }

            this.loading.content = "Cleaning Data";
            if (resultFetch.data && resultFetch.data.length > 0){
              const cleanedData = await preProcessing.startPreprocessing(resultFetch.data);
              if(!this.dataPreprocessing[fakultas]){
                this.dataPreprocessing[fakultas] = {};
              }
              if(!this.dataPreprocessing[fakultas][namaProdi]){
                this.dataPreprocessing[fakultas][namaProdi] = {};
              }

              for (let year = minYear; year <= maxYear; year++){
                const yearStr = year.toString();
                if(!this.dataPreprocessing[fakultas][namaProdi][yearStr]){
                  this.dataPreprocessing[fakultas][namaProdi][yearStr] = [];
                }
                // Filter mahasiswa by angkatan
                const studentsPerYear = cleanedData.filter(student => student.angkatan?.toString() === yearStr);

                // Push hasil filter
                this.dataPreprocessing[fakultas][namaProdi][yearStr].push(...studentsPerYear);
              }
              // Object.entries(cleanedData).forEach(([, students]) => {
              //   console.log("students", students)
              //   console.log("students.angkatan", students.angkatan)
              //   console.log("student.angkatan type", typeof students.angkatan)
              //   if(!this.dataPreprocessing[fakultas]){
              //     this.dataPreprocessing[fakultas] = {};
              //   }
              //   if(!this.dataPreprocessing[fakultas][namaProdi]){
              //     this.dataPreprocessing[fakultas][namaProdi] = {};
              //   }
              //   if(!this.dataPreprocessing[fakultas][namaProdi][students.angkatan]){
              //     this.dataPreprocessing[fakultas][namaProdi][students.angkatan] = [];
              //   }
              //   this.dataPreprocessing[fakultas][namaProdi][students.angkatan].push(students);
              // })          
            }
            
          }
          //Getting data from memory  
          // for (let year = y[0]; year <= y[1]; year++){
          //   const yearStr = year.toString();
          //   if(
          //     this.dataPreprocessing[fakultas] && 
          //     this.dataPreprocessing[fakultas][namaProdi] && 
          //     this.dataPreprocessing[fakultas][namaProdi][yearStr]
          //   ){
          //     if (!this.combinedFinalData[fakultas]) {
          //       this.combinedFinalData[fakultas] = {};
          //     }
          //     if (!this.combinedFinalData[fakultas][namaProdi]) {
          //       this.combinedFinalData[fakultas][namaProdi] = {};
          //     }
          //     this.combinedFinalData[fakultas][namaProdi][yearStr] = this.dataPreprocessing[fakultas][namaProdi][yearStr];
          //   }
          // }
          for (let year = y[0]; year <= y[1]; year++){
            const yearStr = year.toString();
            if(
              this.dataPreprocessing[fakultas] && 
              this.dataPreprocessing[fakultas][namaProdi] && 
              this.dataPreprocessing[fakultas][namaProdi][yearStr]
            ){
              if (!this.combinedFinalData[fakultas]) {
                this.combinedFinalData[fakultas] = {};
              }
              if (!this.combinedFinalData[fakultas][namaProdi]) {
                this.combinedFinalData[fakultas][namaProdi] = {};
              }
              this.combinedFinalData[fakultas][namaProdi][yearStr] = this.dataPreprocessing[fakultas][namaProdi][yearStr];
            }else{
              console.warn("Data tidak ditemukan untuk:", fakultas, namaProdi, yearStr)
            }
          }
        }
      }else { 
        //Jika p bukan all
        const namaProdi = this.allProdi[p].namaProdi;
        const fakultas = this.allProdi[p].fakultas;
        const missingYear = [];
        for(let year = y[0]; year <= y[1]; year++){
          const yearStr = year.toString();
          if(
            !this.dataPreprocessing[fakultas] || 
            !this.dataPreprocessing[fakultas][namaProdi] ||
            !this.dataPreprocessing[fakultas][namaProdi][yearStr]
          ){
            missingYear.push(yearStr)
          }
        }
        //Fetching missingYear
        if (missingYear.length > 0){
          const minYear = Math.min(...missingYear);
          const maxYear = Math.max(...missingYear);

          this.loading.content = "Fetching Data";
          const resultFetch = await fetchData.startFetch(p, [minYear, maxYear]);
          if (resultFetch.error){
            this.loading.content = "Fail to get data";
            console.log("Error details : ", resultFetch.error);
            return;
          }

          this.loading.content = "Cleaning Data";
          const cleanedData = await preProcessing.startPreprocessing(resultFetch.data);
          if(!this.dataPreprocessing[fakultas]){
            this.dataPreprocessing[fakultas] = {};
          }
          if(!this.dataPreprocessing[fakultas][namaProdi]){
            this.dataPreprocessing[fakultas][namaProdi] = {};
          }

          for (let year = minYear; year <= maxYear; year++){
            const yearStr = year.toString();
            if(!this.dataPreprocessing[fakultas][namaProdi][yearStr]){
              this.dataPreprocessing[fakultas][namaProdi][yearStr] = [];
            }
            // Filter mahasiswa by angkatan
            const studentsPerYear = cleanedData.filter(student => student.angkatan?.toString() === yearStr);

            // Push hasil filter
            this.dataPreprocessing[fakultas][namaProdi][yearStr].push(...studentsPerYear);
          }
        }
        for (let year = y[0]; year <= y[1]; year++){
          const yearStr = year.toString();
          if(
            this.dataPreprocessing[fakultas] && 
            this.dataPreprocessing[fakultas][namaProdi] && 
            this.dataPreprocessing[fakultas][namaProdi][yearStr]
          ){
            this.combinedFinalData[yearStr] = this.dataPreprocessing[fakultas][namaProdi][yearStr];
          }
        }
      }
      const extract = extractInfo();
      this.extractedData = await extract.startExtracting(this.combinedFinalData, p);
      this.loading.status = true;
    },
    async TrainAI(){
    },
  },
})

