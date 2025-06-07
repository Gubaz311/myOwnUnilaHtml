import { defineStore } from "pinia";


export const FetchData = defineStore("FetchData", {
    state:() =>({
        config:{
            url:import.meta.env.VITE_BASE_URL,
        },
    }),
    getters:{
    },
    actions:{
        async startFetch(prodi, year){
            //Getting all required variables
            let url = this.config.url
            
            url += `/${year[0]}/${year[1]}`
            if (prodi !== "all") {
                // Jika prodi spesifik maka ditambahkan link prodi
              url += `/${prodi}`;
            }
            try{
                const response = await fetch(url);
                if(!response.ok){
                    return { error: `Failed to fetch data: ${response.statusText}` };
                }
                const data = await response.json();
                return {data : data};
            } catch(err){
                return { error: err.message };
            }
        },
    }
})