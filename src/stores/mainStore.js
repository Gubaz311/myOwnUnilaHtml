import { defineStore } from "pinia";
import { FetchData } from "./components/fetchData";
import { extractInfo } from "./components/extractInfo";
import { PreProcessing } from "./components/preProcessing";
import { ref } from "vue";

export const MainStore = defineStore("main", {
  state:()=>({
    theme: null, 
    dataraw:[],
    dataPreprocessing:[],
    combinedFinalData: {},
    optionInfo: {},
    memory: [],
    loading:{
      status:false,
      content:null,
    },
    extractedData: {},
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
    }
  },
  actions:{
    async setTheme(newTheme){
      this.theme = newTheme;
      localStorage.theme = newTheme;
    },
    async setData(p, y){
      const fetchData = FetchData();
      const preProcessing = PreProcessing();
      this.loading.status = false;
      this.combinedFinalData = {};
      this.optionInfo.prodi = p;
      this.optionInfo.year = y;

      //check if data already exist
      if(p === "all"){
        for(let prodi = 1; prodi <= 8; prodi++){
          const missingYear = [];
          for(let year = y[0]; year <= y[1]; year++){
            const key = `${prodi}-${year}`;
            //Jika data per year belum ada
            if(!this.dataPreprocessing[key]){
              missingYear.push(year);
            }
          }
            //Fetching missingYeaer
            if (missingYear.length > 0){
              const minYear = Math.min(...missingYear);
              const maxYear = Math.max(...missingYear);
              
              this.loading.content = "Fetching Data";
              const resultFetch = await fetchData.startFetch(prodi, [minYear, maxYear]);
              if (resultFetch.error){
                this.loading.content = "Fail to get data";
                console.log("Error details : ", resultFetch.error);
                return;
              }
              this.loading.content = "Cleaning Data";
              const cleanedData = await preProcessing.startPreprocessing(resultFetch.data, prodi);
              
              //Insert missingYear to dataPreprocessing
              for (let year of missingYear){
                const key = `${prodi}-${year}`;
                this.dataPreprocessing[key] = cleanedData[year] || [];
              }
            }
            //Getting data from memory
            for (let year = y[0]; year <= y[1]; year++){
              const key = `${prodi}-${year}`;
              this.combinedFinalData[key]= this.dataPreprocessing[key];
            }
        }

            // //Jika data belum ada
            // if (!this.dataPreprocessing[key]){  
            //   this.loading.content = "Fetching Data";
            //   const resultFetch = await fetchData.startFetch(prodi, year);

            //   if (resultFetch.error){
            //     this.loading.content = "Fail to get data";
            //     console.log("Error details : ", resultFetch.error);
            //     return;
            //   }
            //   this.loading.content = "Cleaning Data";
            //   const cleanedData = await preProcessing.startPreprocessing(resultFetch.data, prodi);
            //   this.dataPreprocessing[key] = cleanedData;
            //   this.combinedFinalData[key] = cleanedData;
            // }
      }else{ //Jika p bukan all
        let prodi = p;
        const missingYear = [];
        for(let year = y[0]; year <= y[1]; year++){
          let key = `${prodi}-${year}`;
          if (!this.dataPreprocessing[key]){
            missingYear.push(year)
          }

          // if (!this.dataPreprocessing[key]){  
          //   this.loading.content = "Fetching Data";
          //   const resultFetch = await fetchData.startFetch(key);

          //   if (resultFetch.error){
          //     this.loading.content = "Fail to get data";
          //     console.log("Error details : ", resultFetch.error);
          //     return;
          //   }
          //   this.loading.content = "Cleaning Data";
          //   const cleanedData = await preProcessing.startPreprocessing(resultFetch.data, prodi);
          //   this.dataPreprocessing[key] = cleanedData;
          //   this.combinedFinalData[key] = cleanedData;
          // }
        }
        //Fetching missingYear
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        if (missingYear.length > 0){
          const minYear = Math.min(...missingYear);
          const maxYear = Math.max(...missingYear);

          this.loading.content = "Fetching Data";
          const resultFetch = await fetchData.startFetch(prodi, [minYear, maxYear]);
          if (resultFetch.error){
            this.loading.content = "Fail to get data";
            console.log("Error details : ", resultFetch.error);
            return;
          }

          this.loading.content = "Cleaning Data";
          const cleanedData = await preProcessing.startPreprocessing(resultFetch.data, p);
          //Insert missingYear to dataPreprocessing
          for (let year of missingYear){
            const key = `${prodi}-${year}`;
            this.dataPreprocessing[key] = cleanedData[year] || [];
          }
        }
        for (let year = y[0]; year <= y[1]; year++){
          let key = `${prodi}-${year}`;
          this.combinedFinalData[key]= this.dataPreprocessing[key];
        }
      }
      const extract = extractInfo();
      const extracted = await extract.startExtracting(this.combinedFinalData, p);
      this.extractedData = extracted;
      console.log("this.dataPreprocessing: ", this.dataPreprocessing);

      this.loading.status = true;

      
      // if(!this.dataPreprocessing[yearRange]){
      //   const fetchData = FetchData();
      //   this.loading.content = "Fetching Data";
      //   const resultFetch = await fetchData.startFetch(p, y);
      //   if (resultFetch.error){
      //       this.loading.content = "Fail to get data";
      //       console.log("Error details : ", resultFetch.error);
      //       return;
      //   }
      //   this.dataPreprocessing[yearRange] = resultFetch.data;
      //   return 0;
      // }

      // if (!this.dataPreprocessing[yearRange]){
      //   //fetching
      //   const fetchData = FetchData()
      //   this.loading.content = "Fetching Data"
      //   const resultFetch = await fetchData.startFetch(p, y);
      //   if (resultFetch.error){
      //       this.loading.content = "Fail to get data"
      //       console.log("Error details : ", resultFetch.error)
      //       return
      //   }
      //   //saving to key
      //   this.dataraw = resultFetch;

      //   //Create new key
      //   this.dataPreprocessing[yearRange] = [];

      //   const preProcessing = PreProcessing()
      //   this.loading.content = "Cleaning Data";
      //   const resultPreProcessing = await preProcessing.startPreprocessing(this.dataraw.data, p)
      //   if (resultPreProcessing.error){
      //       this.loading.content = "Fail to clean data";
      //       console.log("Error details : ", resultPreProcessing.error)
      //       return
      //   } else {
      //       this.dataPreprocessing[yearRange] = resultPreProcessing;
      //   }
      // }
  

    },
    async TrainAI(){
      console.log(this.dataraw) //1
      console.log("data selesai: ", this.dataPreprocessing) //2
    },
  },
})


