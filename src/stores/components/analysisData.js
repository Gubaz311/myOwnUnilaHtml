import { defineStore } from "pinia";
import { HelperCode } from "../helperCode";

export const AnalysisData = defineStore("analysisData", {
    state: () => ({
        dataFlaten : {},
        analysisData:{},
    }),
    getters: {
        getAnalysisData(state){
            return state.analysisData;
        },
    },
    actions:{
        async startAnalysis(data, p){
            const helper = HelperCode();
            this.analysisData = {};
            this.dataFlaten = await helper.flattenData(data, p);
            this.analysisData.ipk = await this.analysisIpk();
            this.analysisData.gender = await this.analysisGender(data, p);
            return this.analysisData;
        },
        async analysisIpk(){
            const helper = HelperCode();
            const result = {};
            const studentsArr = this.dataFlaten;            

            function getIpkCategory(ipk) {
                if (ipk < 0.5) return "0.0;0.5";
                else if (ipk < 1.0) return "0.5;1.0";
                else if (ipk < 1.5) return "1.0;1.5";
                else if (ipk < 2.0) return "1.5;2.0";
                else if (ipk < 2.5) return "2.0;2.5";
                else if (ipk < 3.0) return "2.5;3.0";
                else if (ipk < 3.5) return "3.0;3.5";
                else return "3.5;4.0";
            }

            for (const student of studentsArr){
                const label = parseInt(student.label);
                const ipk = parseFloat(student.ipk);
                if (isNaN(ipk)) continue;

                const ipkCategory = getIpkCategory(ipk);
                if (!result[ipkCategory]){
                    result[ipkCategory] = {
                        tepatWaktu: 0,
                        tidakTepatWaktu: 0,
                    }
                }
                let hasil;
                if (isNaN(label)){
                    hasil = await helper.classifyKTW(student);
                }else{
                    hasil = label === 1 
                        ? {tepatWaktu: 1, tidakTepatWaktu: 0}
                        : {tepatWaktu: 0, tidakTepatWaktu: 1};
                }

                // Update the counts based on the classification result
                result[ipkCategory].tepatWaktu += hasil.tepatWaktu;
                result[ipkCategory].tidakTepatWaktu += hasil.tidakTepatWaktu;
            }

            return result;
        },
        async analysisGender(data, p){
            const helper = HelperCode();
            const result = {};
            if (p === "all"){
                for (const [fakultas, prodiObj] of Object.entries(data)){
                    // Creating new object if it doesn't exist
                    if (!result[fakultas]){
                        result[fakultas] = {};
                    }
    
                    for (const angkatan of Object.values(prodiObj)){
                        for (const students of Object.values(angkatan)){
                            for (const student of students){
                                const label = parseInt(student.label);
                                const rawGender = student.jenisKelamin.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                                if (rawGender === "") continue;

                                const gender = await helper.jenisKelaminNormalize(student)


                                if (!result[fakultas][gender]){
                                    result[fakultas][gender] = {
                                        tepatWaktu: 0,
                                        tidakTepatWaktu:0
                                    }
                                }

                                let hasil;
                                if (isNaN(label)){
                                    hasil = await helper.classifyKTW(student);
                                }else{
                                    hasil = label === 1
                                        ? {tepatWaktu: 1, tidakTepatWaktu: 0}
                                        : {tepatWaktu: 0, tidakTepatWaktu: 1};
                                }

                                // Update the counts based on the classification result
                                result[fakultas][gender].tepatWaktu += hasil.tepatWaktu;
                                result[fakultas][gender].tidakTepatWaktu += hasil.tidakTepatWaktu;
                            }
                        }
                    }
                }
            } else {
                for (const [angkatan, students] of Object.entries(data)){
                    // Creating new object if it doesn't exist
                    if (!result[angkatan]){
                        result[angkatan] = {};
                    }
                    for (const student of students){
                        const label = parseInt(student.label);
                        const rawGender = student.jenisKelamin.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                        if (rawGender === "") continue;

                        const gender = await helper.jenisKelaminNormalize(student)

                        if (!result[angkatan][gender]){
                            result[angkatan][gender] = {
                                tepatWaktu: 0,
                                tidakTepatWaktu:0
                            }
                        }

                        let hasil;
                        if (isNaN(label)){
                            hasil = await helper.classifyKTW(student);
                        }else{
                            hasil = label === 1
                                ? {tepatWaktu: 1, tidakTepatWaktu: 0}
                                : {tepatWaktu: 0, tidakTepatWaktu: 1};
                        }

                        // Update the counts based on the classification result
                        result[angkatan][gender].tepatWaktu += hasil.tepatWaktu;
                        result[angkatan][gender].tidakTepatWaktu += hasil.tidakTepatWaktu;
                    }
                }
            }
            return result;
        },
    },
})