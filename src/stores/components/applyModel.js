import { defineStore } from "pinia";
import { MModelStore } from "./mmodelStore";
import { HelperCode } from "../helperCode";
import { MainStore } from "../mainStore";

export const ApplyModel = defineStore("applyModel", {
    state: () => ({

    }),
    getters:{

    },
    actions:{
        async startApplyModel(dataNested, p){
            const helper = HelperCode();
            const model = MModelStore();

            // Flatting data
            const dataFlaten = await helper.flattenData(dataNested, p);

            // Making index for each data
            const indexedData = dataFlaten.map((item, idx) => ({ ...item, __originalIndex: idx }));

            // separating data
            const {dataNoLabel, dataLabel} = await this.separateData(indexedData);

            //predicting noLabel data and combining it with property label
            const predData = await model.predictData(dataNoLabel);
            if (!predData){
                console.error("something went wrong with the prediction");
                return null;
            }
            const studentPredData = await this.combinePred(dataNoLabel, predData)

            // Combine the predicted data with the existing labeled data
            const combinedData = [...dataLabel, ...studentPredData].sort(
                (a, b) => a.__originalIndex - b.__originalIndex
            );

            // Remove the __originalIndex
            combinedData.forEach(student => {
                delete student.__originalIndex;
            })
            const cleanedCombined = combinedData;

            // Restructure the combined data
            const dataRestructure = await helper.restructureData(cleanedCombined, p)
            return dataRestructure;
        },
        async separateData(dataFlat){
            const store = MainStore();
            const statusConfig = store.getStatus;
            const aktifStatus  = (statusConfig.aktif || 'aktif').split(',').map(s => s.trim().toLowerCase());

            let dataNoLabel = [];

            const dataLabel = dataFlat.filter(student =>{
                const status = student.statusMahasiswa?.trim().toLowerCase();
                const duration = parseFloat(student.durasi);

                const filter = aktifStatus.includes(status) && duration < 4;

                if (filter) dataNoLabel.push(student);
                return !filter;
            })

            return {dataNoLabel, dataLabel}
        },
        async combinePred(dataFlat, predData){
            for (let i = 0; i < dataFlat.length; i++){
                const student = dataFlat[i];
                const label = Math.round(predData[i])
                student.label = label;
                
            }
            return dataFlat;  
        },
    },
})