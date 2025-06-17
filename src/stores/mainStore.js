import { defineStore } from "pinia";
import { FetchData } from "./components/fetchData";
import { extractInfo } from "./components/extractInfo";
import { PreProcessing } from "./components/preProcessing";
import { ref, toRaw } from "vue";
import router from "@/router";
import { MModelStore } from "./components/mmodelStore";
import { ApplyModel } from "./components/applyModel";
import { AnalysisData } from "./components/analysisData";
import _ from "lodash";

export const MainStore = defineStore("main", {
  state:()=>({
    theme: null, 
    dataraw:[],
    dataPreprocessing:{}, //
    dataPreprocessingCSV:{}, 
    dataPreprocessingAI:{},
    isPredicted:false,
    combinedFinalData: {}, //
    optionInfo: {}, //
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
    getColor(){
      return this.theme === 'dark'
      ? ['rgba(112, 225, 232, 0.85)', 'rgba(245, 40, 145, 0.8)']
      : ['rgba(100, 116, 255, 0.85)', 'rgba(253, 66, 19, 0.85)']    
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

  },
  actions:{
    // Method to config
    async gotoReport(){
      if(this.currentView === 'ktw'){
        router.push('/report')
        this.currentView = 'report';
      }
      else {
        router.back();
        this.currentView = 'ktw'
      }
    },
    async setTheme(newTheme){
      this.theme = newTheme;
      localStorage.theme = newTheme;
    },
    async resetCombinedFinalData(){
      for (const key in this.combinedFinalData){
        delete this.combinedFinalData[key];
      }
      Object.assign(this.combinedFinalData, {})
      this.combinedFinalData = {};
    },
    // Main function
    async setData(p, y){
      const fetchData = FetchData();
      const preProcessing = PreProcessing();
      this.loading.status = false;
      await this.resetCombinedFinalData();
      this.combinedFinalData = {};
  
      //check if data already exist
      if(p === "all"){
      this.optionInfo.prodi = p;
      this.optionInfo.year = y;

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
              return;
            }

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

                // Push value
                this.dataPreprocessing[fakultas][namaProdi][yearStr].push(...studentsPerYear);
              }       
            }
          }

          //Combine data per prodi
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
              const clone = _.cloneDeep(this.dataPreprocessing[fakultas][namaProdi][yearStr])
              this.combinedFinalData[fakultas][namaProdi][yearStr] = clone;
            }else{
              console.warn("Data tidak ditemukan untuk:", fakultas, namaProdi, yearStr)
            }
          }
        }
      }
      else { 
        this.optionInfo.prodi = p;
        this.optionInfo.year = y;

        // if prodi spicific
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

            // Push value
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
            const clone = _.cloneDeep(this.dataPreprocessing[fakultas][namaProdi][yearStr])
            this.combinedFinalData[yearStr] = clone;
          }
        }
      }

      // Calculate Ai
      if (this.isPredicted){
        console.log("isPredicted terekseksekusi")
        const applyMod = ApplyModel();
        this.loading.content = `Predicting Data`;
        if (p === "all"){
          this.dataPreprocessingAI = await applyMod.startApplyModel(this.combinedFinalData, p);
          const clonePredicted = _.cloneDeep(this.dataPreprocessingAI);
          this.combinedFinalData = {};
          this.combinedFinalData = clonePredicted;
        }else{
          const namaProdi = this.allProdi[p].namaProdi;
          const fakultas = this.allProdi[p].fakultas;
          if (!this.dataPreprocessingAI[fakultas]) this.dataPreprocessingAI[fakultas] ={};
          if (!this.dataPreprocessingAI[fakultas][namaProdi]) this.dataPreprocessingAI[fakultas][namaProdi] = {};

          let missingYear = [];
          for (const year of Object.keys(this.combinedFinalData)){
            if (!this.dataPreprocessingAI[fakultas][namaProdi][year]){
              missingYear.push(year);
            }
          };
          if (missingYear.length > 0){
            const predicted = await applyMod.startApplyModel(this.combinedFinalData, p);
            for (const year of missingYear){
              this.dataPreprocessingAI[fakultas][namaProdi][year] = predicted[year];
            }
          }
          // Combine Data 
          for (let year = y[0]; year <= y[1]; year++){
            const yearStr = year.toString()
            const clonePredicted = _.cloneDeep(this.dataPreprocessingAI[fakultas][namaProdi][yearStr])
            this.combinedFinalData[yearStr] = {};
            this.combinedFinalData[yearStr] = clonePredicted;
          }
        }
      }
      const extract = extractInfo();
      this.extractedData = await extract.startExtracting(this.combinedFinalData, p); //extracting data seperti mencari ktw dan non ktw untuk chart
      
      this.loading.status = true;
    },
    async setDataCSV(p, y, data){
      this.loading.status = false;
      const model = MModelStore();
      if (!model.model || !model.modelAvailable) {
        setTimeout(() => {
          this.loading.content = '';
          this.loading.status = true;
        }, 3000)
        return;
      }
      const preProcessing = PreProcessing();
      const applyMod = ApplyModel()
      if (this.currentView !== 'csv'){
        this.currentView =  'csv';
      }
      this.loading.status = false;
      this.combinedFinalData = {};
      this.optionInfo.prodi = p;
      this.optionInfo.year = y;

      if(!this.dataPreprocessingCSV || Object.keys(this.dataPreprocessingCSV).length === 0){ 
        this.loading.content = "Processing Data";
        const preprocessed = await preProcessing.startPreprocessing(data);
        for (const student of preprocessed){
          const fakultas = student.fakultas;
          const namaProdi = student.namaProdi;
          const angkatan = student.angkatan.toString();
  
          if(!fakultas || !namaProdi || !angkatan) continue;
  
          if (!this.dataPreprocessingCSV[fakultas]) {
            this.dataPreprocessingCSV[fakultas] = {};
          }
          if (!this.dataPreprocessingCSV[fakultas][namaProdi]) {
            this.dataPreprocessingCSV[fakultas][namaProdi] = {};
          }
          if (!this.dataPreprocessingCSV[fakultas][namaProdi][angkatan]) {
            this.dataPreprocessingCSV[fakultas][namaProdi][angkatan] = [];
          }
          this.dataPreprocessingCSV[fakultas][namaProdi][angkatan].push(student);
        }
        this.loading.content = `Predicting Data`
        this.dataPreprocessingCSV = await applyMod.startApplyModel(toRaw(this.dataPreprocessingCSV), "all") // saya menambahkan ini
      }

      if (p === "all"){
        for (let year =y[0]; year <= y[1]; year++){
          const yearStr = year.toString();
          for (const fakultas in this.dataPreprocessingCSV){
            for (const namaProdi in this.dataPreprocessingCSV[fakultas]){
              if (!this.combinedFinalData[fakultas]){
                this.combinedFinalData[fakultas] = {};
              }
              if (!this.combinedFinalData[fakultas][namaProdi]){
                this.combinedFinalData[fakultas][namaProdi] = {};
              }
              if (this.dataPreprocessingCSV[fakultas][namaProdi][yearStr]){
                this.combinedFinalData[fakultas][namaProdi][yearStr] = this.dataPreprocessingCSV[fakultas][namaProdi][yearStr];
              }
            }
          }
        }
      }else{
        // If Prodi specific
        const namaProdi = this.allProdi[p].namaProdi;
        const fakultas = this.allProdi[p].fakultas;

        for (let year = y[0]; year <= y[1]; year++){
          const yearStr = year.toString();
          if (this.dataPreprocessingCSV[fakultas][namaProdi][yearStr]){
            this.combinedFinalData[yearStr] = this.dataPreprocessingCSV[fakultas][namaProdi][yearStr];
          }
        }
      }
      
      const extract = extractInfo();
      this.extractedData = await extract.startExtracting(toRaw(this.combinedFinalData), p);
      const analysis = AnalysisData();
      await analysis.startAnalysis(this.combinedFinalData, p);
      this.loading.status = true;
    },
    async TrainAI(){
      this.isPredicted = !this.isPredicted
    },
  },// Actions
})