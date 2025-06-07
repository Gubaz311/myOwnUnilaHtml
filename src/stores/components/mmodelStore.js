import * as tf from '@tensorflow/tfjs'
import { MainStore } from '../mainStore';
import { defineStore } from 'pinia';
import { extractInfo } from './extractInfo';
import { toRaw } from 'vue';
import '@tensorflow/tfjs-backend-webgpu';
import '@tensorflow/tfjs-backend-wasm';

export const MModelStore = defineStore('mmodelStore', {
    state:() =>({
        totalDataStep:{},
        dataMaps:{},
        model:null,
        modelAvailable:false,
        data:{},
        prodi:null,
        encodeMaps:{},
        encodedData:{},
        tensorData:{},
        tensorOutput:{},
        inputConfig:null,
        status:null,
        rancuDuration:null,
        timeNow:null,
        chartData:[],
        testingSummary:{},
    }),
    getters:{
        getChartData(state){
            return state.chartData;
        },
        getDataMaps(state){
            return state.dataMaps;
        },
        getTotalDataStep(state){
            return state.totalDataStep;
        },
        isModelAvailable(state){
            return state.modelAvailable;
        },
        getTestingSummary(state){
            return state.testingSummary;
        },
    },
    actions:{
        async startInitial(backend, learningCurve, patienceCount, neuron, sumHidden){
            const store = MainStore();
            store.loading.status = false;

            // Rebooting memory
            this.dataMaps = {};
            this.totalDataStep = {};
            this.chartData = [];
            this.encodeMaps = {};
            this.encodedData = {};
            this.tensorOutput = {};
            this.tensorData = {};
            this.testingSummary = {};

            // Will be deleted in the future
            this.model = null;

            store.gotoReport();

            // Config backend tensorflow
            await tf.setBackend(backend);
            await tf.ready();

            // Get configuration
            if(
                !this.prodi ||
                !this.inputConfig ||
                !this.status ||
                !this.rancuDuration ||
                !this.timeNow
            ){
                await this.saveConfig();  
            }

            // Get data
            await this.completingMissingData(); 
            this.data = store.getDataPreprocessing;
            store.loading.status = false

            // Optimizing data
            this.totalDataStep.getData = {};
            store.loading.content = `Optimizing Data`;
            const extract = extractInfo();
            const flatten = await extract.flattenData(this.data, "all");
            const rawFlatten = flatten.map(item => toRaw(item));
            this.totalDataStep.getData.after = rawFlatten.length;
            this.totalDataStep.getData.features = this.getTotalFeature(rawFlatten);

            // Filter data outliers
            const cleanedData = await this.cleanOutliers(rawFlatten);
            
            // Build encode maps
            this.encodeMaps = await this.encodeMapsbuilder(cleanedData);
            
            // Print mapping data
            this.dataMaps = await this.generateDataMaps(this.encodeMaps);

            // Encode data
            const encodedData = await this.encodeField(cleanedData);
            const encodedOutput = await this.encodeOutput(cleanedData)

            // Split for testing
            const {dataTest, outputTest, dataTrain, outputTrain} = await this.splitData(encodedData, encodedOutput)

            // Create Tensor
            const tensorData = Object.freeze(tf.tensor2d(dataTrain, [dataTrain.length, dataTrain[0].length]));
            const tensorOutput = Object.freeze(tf.tensor2d(outputTrain, [outputTrain.length, outputTrain[0].length]));
            this.tensorData = tensorData;
            this.tensorOutput = tensorOutput;

            // Creating Model
            const inputSize = tensorData.shape[1];
            if(!this.model){
                this.model = await this.createModel(inputSize, learningCurve, neuron, sumHidden)
            }

            // Training Model
            store.loading.content = `Training Model`;
            const startTime = Date.now();
            await this.trainModel(tensorData, tensorOutput, patienceCount);
            const endTime = Date.now();
            const trainingTime = (endTime - startTime) / 1000;
            console.log(`Training ${trainingTime.toFixed(2)} detik`);

            store.loading.content = `Predicting Testing Data`;
            // Pastikan dataTest adalah tensor2d
            const tensorTest = tf.tensor2d(dataTest, [dataTest.length, dataTest[0].length]);
            
            // Testing
            const outputPredict = toRaw(this.model).predict(tensorTest);

            // Konversi hasil prediksi dan label
            const preds = await outputPredict.data();
            
            // Save testing labels
            this.testingSummary.real = outputTest.map(l => l[0]);
            this.testingSummary.pred = preds;
            
            // // Hitung akurasi manual
            // let TP = 0, FP = 0, FN = 0, TN = 0;
            // for (let i = 0; i < preds.length; i++) {
            //     const pred = preds[i][0];
            //     const label = labels[i];

            //     if (pred === 1 && label === 1) TP++; // True Positive
            //     else if (pred === 1 && label === 0) FP++; // False Positive
            //     else if (pred === 0 && label === 1) FN++; // False Negative
            //     else if (pred === 0 && label === 0) TN++; // True Negative
            // }

            // const accuracy = (TP + TN) / (TP + FP + TN + FN || 1);
            // const precision = TP / (TP + FP || 1);
            // const recall = TP / (TP + FN || 1);

            // // Log hasil
            // console.log("Predictions (rounded):", preds.map(p => p[0]));
            // console.log("True Labels         :", labels);
            // console.log(`Manual Accuracy: ${(accuracy * 100).toFixed(2)}%`);
            // console.log(`Precision       : ${(precision * 100).toFixed(2)}%`);
            // console.log(`Recall          : ${(recall * 100).toFixed(2)}%`);

            store.loading.status = true;
        },
        async saveConfig(){
            const store = MainStore();
            this.prodi = store.getProdi;
            
            const status = store.getStatus;
            this.status = {};
            this.status.lulus = (status.lulus || 'lulus').split(",").map(s=>s.trim().toLowerCase());
            this.status.aktif = (status.aktif || 'aktif').split(",").map(s=>s.trim().toLowerCase());
            this.status.dikeluarkan = (status.dikeluarkan || 'dikeluarkan').split(",").map(s=>s.trim().toLowerCase());
            this.status.keluar = (status.keluar || 'keluar').split(",").map(s=>s.trim().toLowerCase());

            const input = store.getInput;
            this.inputConfig = {};
            this.inputConfig.oneHot = input.oneHot.split(",");
            this.inputConfig.number = input.number.split(",");
            this.inputConfig.mapping = input.mapping || {};

            this.rancuDuration = store.getRancuDuration;
            this.timeNow = store.getTimeNow;
        },
        async completingMissingData(){
            const store = MainStore();
            const prodi = this.prodi;
            for (const prodiCode of Object.keys(prodi)){
                const {namaProdi, fakultas} = prodi[prodiCode];
                const missingYear = [];

                //Checking data per year
                for(let year = 2018; year<=2023; year++){
                    const yearStr = year.toString();
                    if(
                        !this.data[fakultas] ||
                        !this.data[fakultas][namaProdi] ||
                        !this.data[fakultas][namaProdi][yearStr]
                    ){
                        missingYear.push(yearStr);
                    }
                }

                if (missingYear.length > 0){
                    const minYear = Math.min(...missingYear);
                    const maxYear = Math.max(...missingYear);
                    await store.setData(prodiCode, [minYear, maxYear])
                }
            }
        },
        async cleanOutliers(data){
            this.totalDataStep.cleanOutliers = {};
            const startingAmount = data.length;

            // Make sure all data is full
            this.totalDataStep.cleanOutliers.fullData = {};
            const fullData = data.filter(s => {
                for (const field of this.inputConfig.oneHot){
                    if(!s[field] || s[field].toString().trim() === '' ){
                        return false;
                    }
                }
                for (const field of this.inputConfig.number){
                    const value = parseFloat(s[field]);
                    if(!Number.isFinite(value)){
                        return false;
                    }
                }
                return true;
            })
            this.totalDataStep.cleanOutliers.fullData.after = fullData.length;
            this.totalDataStep.cleanOutliers.fullData.deleted = startingAmount - fullData.length;
            this.totalDataStep.cleanOutliers.fullData.features = this.getTotalFeature(fullData)

            //Handle DO/Out < this.rancuDuration
            this.totalDataStep.cleanOutliers.filteredByStatus = {};
            const filteredByStatus = fullData.filter(s => {
                const status = s.statusMahasiswa?.trim().toLowerCase();
                const duration = parseFloat(s.durasi);
                
                const isDikeluarkan = this.status.dikeluarkan.some(v => status.includes(v));
                const isKeluar = this.status.keluar.some(v => status.includes(v));

                const filter = (isDikeluarkan || isKeluar) && duration < this.rancuDuration;
                return !filter;
            })
            this.totalDataStep.cleanOutliers.filteredByStatus.after = filteredByStatus.length;
            this.totalDataStep.cleanOutliers.filteredByStatus.deleted = this.totalDataStep.cleanOutliers.fullData.after - filteredByStatus.length;
            this.totalDataStep.cleanOutliers.filteredByStatus.features = this.getTotalFeature(filteredByStatus);

            // Handle newStudents
            this.totalDataStep.cleanOutliers.validStudents = {};
            const validStudents = filteredByStatus.filter(s => {
                const status = s.statusMahasiswa?.trim().toLowerCase();
                const duration = parseFloat(s.durasi);

                const isLulus = this.status.lulus.some(v => status.includes(v));
                const isDikeluarkan = this.status.dikeluarkan.some(v => status.includes(v));
                const isKeluar = this.status.keluar.some(v => status.includes(v));
                const isAktif = this.status.aktif.some(v => status.includes(v));

                const filter = isLulus || isDikeluarkan || isKeluar || (isAktif && duration >= 4);

                return filter;
            });
            this.totalDataStep.cleanOutliers.validStudents.after = validStudents.length;
            this.totalDataStep.cleanOutliers.validStudents.deleted = this.totalDataStep.cleanOutliers.filteredByStatus.after - validStudents.length;
            this.totalDataStep.cleanOutliers.validStudents.features = this.getTotalFeature(validStudents);

            // Handle outliers
            const ipkList = validStudents
                .map(s => parseFloat(s[this.inputConfig.number]))
                .filter(Number.isFinite);
            
            const sortedIPK = [...ipkList].sort((a, b) => a- b);
            const q1 = await this.percentile(sortedIPK, 0.015);
            const q3 = await this.percentile(sortedIPK, 1.00);
            // const iqr = q3 - q1;
            // console.log("Q1:", q1, "Q3:", q3, "IQR:", iqr);

            // const lower = q1 - 1.5 * iqr;
            // const upper = q3 + 1.5 * iqr;
            // console.log("Lower:", lower, "Upper:", upper);

            // const filterIPK = validStudents.filter(s => {
            //     const ipk = parseFloat(s[this.inputConfig.number]);
            //     if( ipk >= lower && ipk <= upper){
            //         return ipk >= lower && ipk <= upper;
            //     }else{
            //         console.log(`Outlier karena IPK: ${ipk} di luar rentang [${lower}, ${upper}]`);
            //     }
            // })
            this.totalDataStep.cleanOutliers.filterIPK = {};
            const filterIPK = validStudents.filter(s => {
                const ipk = parseFloat(s[this.inputConfig.number]);
                if(ipk >= q1 && ipk <= q3){
                    return ipk
                }
            })
            this.totalDataStep.cleanOutliers.filterIPK.after = filterIPK.length;
            this.totalDataStep.cleanOutliers.filterIPK.deleted = this.totalDataStep.cleanOutliers.validStudents.after - filterIPK.length;
            this.totalDataStep.cleanOutliers.filterIPK.features = this.getTotalFeature(filterIPK);

            return filterIPK;
        },
        async encodeMapsbuilder(dataList){
            const encodeMaps = {};

            // Encode one-hot
            for (const field of this.inputConfig.oneHot){
                const map = new Map();
                let index = 0;
                const fieldMapping = this.inputConfig.mapping?.[field]
                for (const item of dataList){
                    let val = item[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                    if (!val) continue
                    if (fieldMapping && fieldMapping[val]) {
                        val = fieldMapping[val]
                    }
                    if (!map.has(val)){
                        map.set(val, index++)
                    }
                }
                encodeMaps[field] = {
                    map,
                    size: map.size,
                }
            }
            for (const field of this.inputConfig.number){
                const val = dataList.map(s => parseFloat(s[field])).filter(value => !isNaN(value));
                encodeMaps[field] = {
                    min: Math.min(...val),
                    max: Math.max(...val),
                }
            }

            return encodeMaps;
        },
        async encodeField(data){
            const encoded = [];
            this.totalDataStep.encodeField = {};
            for (const student of data){
                const row = [];
                
                // Encode one-hot
                for (const field of this.inputConfig.oneHot){
                    const fieldMap = this.encodeMaps[field];
                    const oneHot = new Array(fieldMap.size).fill(0);
                    let val = student[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                    if (!val) continue;

                    const fieldMapping = this.inputConfig.mapping?.[field];
                    if (fieldMapping && fieldMapping[val]){
                        val = fieldMapping[val];
                    }
                    const index = fieldMap.map.get(val);
                    if (index !== undefined){
                        oneHot[index] = 1;
                    }
                    row.push(...oneHot);
                }

                // Encode number
                for (const field of this.inputConfig.number){
                    const fieldMap = this.encodeMaps[field];
                    const val = parseFloat(student[field]);

                    if (!isNaN(val)){
                        const normalized = (val - fieldMap.min) / (fieldMap.max - fieldMap.min);
                        row.push(normalized);
                    }
                }
                encoded.push(row);
            }
            this.totalDataStep.encodeField.after = encoded.length;
            this.totalDataStep.encodeField.features = this.getTotalFeature(encoded);
            return encoded;
        },
        async encodeOutput(data){
            let banyak1 = 0;
            let banyak0 = 0;
            const encoded = data.map(s => {
                const status = s.statusMahasiswa?.toLowerCase().trim();
                const duration = parseFloat(s.durasi)
                const isLulus = this.status.lulus.some(v => status.includes(v));
                if (isLulus && duration <=4) banyak1++;
                else banyak0++
                return (isLulus && duration <= 4) ? 1 : 0;
            })
            console.log(`1 VS 0 : ${banyak1} vs ${banyak0}`);
            return encoded.map(v => [v]);
        },
        async splitData(data, output){
            // Combine input-Output
            const combined = data.map((input, idData) => ({
                input,
                output: output[idData]
            }))

            // Shuffle
            for (let i = combined.length - 1; i > 0; i--){
                const j = Math.floor(Math.random() * (i + 1));
                [combined[i], combined[j]] = [combined[j], combined[i]];
            }

            // 5% for Testing
            const testSize = Math.floor(combined.length * 0.05);
            const testSet = combined.slice(0, testSize);
            const trainSet = combined.slice(testSize);

            // Split
            const dataTest = testSet.map(d => d.input);
            const outputTest = testSet.map(d => d.output);
            const dataTrain = trainSet.map(d => d.input);
            const outputTrain = trainSet.map(d => d.output);

            return {dataTest, outputTest, dataTrain, outputTrain}
        },
        async createModel(inputSize, learningCurve, neuron, sumHidden){
            const model = tf.sequential();
            await tf.ready();

            for(let i=0; i<sumHidden; i++){
                if(i===0){
                    console.log(`membuat layer dengan input size ${inputSize} dan neuron ${neuron[i]}`);
                    model.add(tf.layers.dense({
                        inputShape:[inputSize],
                        units:neuron[i],
                        activation:'relu'
                    }))
                }else{
                    console.log(`membuat layer dengan neuron ${neuron[i]}`);
                    model.add(tf.layers.dense({
                        units:neuron[i],
                        activation:'relu'
                    }))
                    model.add(tf.layers.dropout({rate:0.2}))
                }
            }
            console.log(`membuat layer output dengan neuron 1`);
            const pos = 0;
            const neg = 0;

            let biasInitializerOpt = undefined;
            if (pos > 0 && neg > 0) {
            const initialBiasValue = Math.log(pos / neg);
            biasInitializerOpt = tf.initializers.constant({ value: initialBiasValue });
            }
            model.add(tf.layers.dense({ 
                units:1, 
                activation:'sigmoid',
                ...(biasInitializerOpt ? { biasInitializer: biasInitializerOpt } : {}),
            }))

            model.compile({
                loss: 'binaryCrossentropy',
                optimizer: tf.train.adam(learningCurve),
                metrics: ['accuracy'],
            })

            return model;
        },
        async trainModel(data, output, patienceCount){
            this.chartData =  [{loss:[], val_loss:[]}]
            const model = toRaw(this.model);

            // For Printing Loss
            const trainingProgressCallback =  {
                onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch + 1} / 1000`);
                console.log(`Loss: ${logs.loss}, Accuracy: ${logs.acc}`);
                console.log(`Validation Loss: ${logs.val_loss}, Validation Accuracy: ${logs.val_acc}`);

                this.chartData[0].loss.push(logs.loss)
                this.chartData[0].val_loss.push(logs.val_loss)
                }
            };
            const saveChart = new tf.CustomCallback(trainingProgressCallback)

            // Callback modelCheckpoint
            let bestValLoss = Infinity;
            const modelCheckpointCallBack = {
                onEpochEnd: async (epoch, logs) => {
                    const valLoss = logs.val_loss;

                    if(valLoss < bestValLoss){
                        bestValLoss = valLoss;
                        console.log(`✨ Epoch ${epoch + 1}: val_loss improved to ${valLoss.toFixed(4)}. Saving model...`);

                        await model.save('indexeddb://best-model-val_loss');
                    }
                }
            }
            const modelCheckpoint = new tf.CustomCallback(modelCheckpointCallBack);

            // ReduceLROnPlateau
            let bestValLossPlateau = Infinity;
            let wait = 0;
            let currentLR = typeof model.optimizer.learningRate === 'number'
            ? model.optimizer.learningRate
            : model.optimizer.learningRate.dataSync()[0]; // Ambil nilai scalar
            const reduceLROnPlateauConfig = {
                patience: Math.round(patienceCount / 5),
                factor: 0.5,
                minLR: 0.00001,
                minDelta: 0.0001
            }

            const reduceLROnPlateauCallback = {
                onEpochEnd: async (epoch, logs) => {
                    const valLoss = logs.val_loss;

                    if (valLoss + reduceLROnPlateauConfig.minDelta < bestValLossPlateau) {
                        bestValLossPlateau = valLoss;
                        wait = 0;
                    } else {
                        wait++;
                        if (wait >= reduceLROnPlateauConfig.patience) {
                            const oldLR = currentLR;
                            currentLR = Math.max(oldLR * reduceLROnPlateauConfig.factor, reduceLROnPlateauConfig.minLR);
                            console.log(`📉 [Epoch ${epoch + 1}] val_loss stagnan selama ${wait} epoch`);

                            console.log(`🔽 ReduceLROnPlateau: Menurunkan learning rate dari ${oldLR} ke ${currentLR}`);
                            
                            model.optimizer.learningRate = currentLR;
                            wait = 0;
                        }
                    }
                }
            };
            const reduceLROnPlateau = new tf.CustomCallback(reduceLROnPlateauCallback);

            // Training Model
            await model.fit(data, output, {
                epochs: 1000,
                batchSize: Math.max(32, Math.floor(data.shape[0]/50)),
                shuffle: true,
                validationSplit: 0.3,
                callbacks: [
                    tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: patienceCount, restoreBestWeight: true }),
                    reduceLROnPlateau,
                    saveChart,
                    modelCheckpoint,
                ]
            })

            // // Debuggin for printing weights
            // const layer = model.layers[0]; // layer pertama (langsung terhubung ke input)
            // const weights = layer.getWeights();

            // const weightTensor = weights[0]; // matrix bobot
            // const biasTensor = weights[1];   // bias per neuron

            // const weightArray = await weightTensor.array();
            // const biasArray = await biasTensor.array();

            // console.log("Bobot per input feature:");
            // weightArray.forEach((row, i) => {
            //     console.log(`Fitur ke-${i + 1}:`, row);
            // });
            // console.log("Bias per neuron:", biasArray);

            this.model = await tf.loadLayersModel('indexeddb://best-model-val_loss');
        },
        // Helper Section
        async percentile(arrData, p){
            const index = (arrData.length - 1) * p;
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;

            if(upper >= arrData.length) return arrData[lower];
            return arrData[lower] * (1-weight) +arrData[upper] * weight;
        },
        async generateDataMaps(encodeMaps){
            const table = {};

            for (const [field, config] of Object.entries(encodeMaps)){
                if(!config.map) continue;

                const size = config.size;
                const fieldTable = {};

                for (const [key, index] of config.map.entries()){
                    const oneHot = Array(size).fill(0);
                    oneHot[index] = 1;
                    fieldTable[key] = oneHot;
                }

                table[field] = fieldTable;
            }
            return table;
        },
        getTotalFeature(data){
            if(!data || data.length === 0) return 0;
            return Object.keys(data[0]).length;
        },
    }//ACTIONS
})