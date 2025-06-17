import { defineStore } from "pinia";
import { MainStore } from "./mainStore";

export const HelperCode = defineStore("helperCode", {
    state: () => ({
        inputAi:JSON.parse(import.meta.env.VITE_INPUT_AI),
    }),
    getters: {

    },
    actions: {
        async flattenData(data, p) {
            let dataReturn = [];
            if(p ==="all"){
                dataReturn = Object.values(data) 
                .flatMap(prodiObj =>
                Object.values(prodiObj) 
                    .flatMap(angkatanObj =>
                    Object.values(angkatanObj) 
                        .flat() 
                    )
                )
            }else{
                dataReturn = Object.values(data).flat();
            }
            return dataReturn;
        },
        async restructureData(flattenedData, p) {
            const result = {};
            for (const student of flattenedData) {
                const fakultas = student.fakultas;
                const namaProdi = student.namaProdi;
                const angkatan = (student.angkatan).toString(); //kenapa error?

                if (p === "all") {
                    if (!result[fakultas]) result[fakultas] = {};
                    if (!result[fakultas][namaProdi]) result[fakultas][namaProdi] = {};
                    if (!result[fakultas][namaProdi][angkatan]) result[fakultas][namaProdi][angkatan] = [];
                    result[fakultas][namaProdi][angkatan].push(student);
                } else {
                    if (!result[angkatan]) result[angkatan] = [];
                    result[angkatan].push(student);
                }
            }

            return result;
        },
        async percentile(arrData, p){
            const index = (arrData.length - 1) * p;
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;

            if(upper >= arrData.length) return arrData[lower];
            return arrData[lower] * (1-weight) +arrData[upper] * weight;
        },
        async jenisKelaminNormalize(student){
            const mapping = this.inputAi.mapping.jenisKelamin;
            const gender = student.jenisKelamin.toLowerCase().replace(/\s*-\s*/g, '-').trim();
            if (gender === "") return null;

            const normalized = mapping[gender];
            if (normalized) return normalized;
            console.log(`Gender "${gender}" tidak ada di mapping`);
            return null
        },
        async classifyKTW(student){
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
                if (angkatan <= tressholdYears) tidakTepatWaktu++;
            }

            return {
                tepatWaktu,
                tidakTepatWaktu,
            };
        },
    },
})