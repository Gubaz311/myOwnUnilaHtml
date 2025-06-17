import * as tf from '@tensorflow/tfjs'
import { MainStore } from '../mainStore';
import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import '@tensorflow/tfjs-backend-webgpu';
import '@tensorflow/tfjs-backend-wasm';
import { get, set } from 'idb-keyval';
import { HelperCode } from '../helperCode';

export const MModelStore = defineStore('mmodelStore', {
    state:() =>({
        totalDataStep:{},
        testingData:{},
        dataMaps:{},
        model:null,
        modelAvailable:false,
        isTrained:false,
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
            console.log("Startinitial")
            const store = MainStore();
            const helper = HelperCode();
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
            store.loading.status = false;

            // Optimizing data
            store.loading.content = `Optimizing Data`;
            this.totalDataStep.getData = {};
            const flatten = await helper.flattenData(this.data, "all");
            const rawFlatten = flatten.map(item => toRaw(item));
            this.totalDataStep.getData.after = rawFlatten.length;
            this.totalDataStep.getData.features = this.getTotalFeature(rawFlatten);

            // Filter data outliers
            const cleanedData = await this.cleanOutliers(rawFlatten);

            // generate encodeMaps
            this.encodeMaps = await this.encodeMapsbuilder(cleanedData);

            // Print mapping data
            this.dataMaps = await this.generateDataMaps(this.encodeMaps);

            // clean newstudent
            const cleanedData2 = await this.cleanNewStudent(cleanedData);

            // find output
            this.totalDataStep.findOutput = {};
            const dataWithOutput = await this.findOutput(cleanedData2);

            // split for testing
            this.totalDataStep.splitForTesting = {};
            const {trainData, testData} = await this.smartSplit(dataWithOutput, 0.05);
            this.testingData = Object.freeze(testData);

            // Encode data
            const encodedData = await this.encodeField(trainData);
            this.totalDataStep.encodeField = {};
            this.totalDataStep.encodeField.after = encodedData.length;
            this.totalDataStep.encodeField.features = this.getTotalFeature(encodedData);
            const encodedOutput = await this.encodeOutput(trainData);

            // Create Tensor
            const tensorData = Object.freeze(tf.tensor2d(encodedData, [encodedData.length, encodedData[0].length]));
            const tensorOutput = Object.freeze(tf.tensor2d(encodedOutput, [encodedOutput.length, encodedOutput[0].length]));
            this.tensorData = tensorData;
            this.tensorOutput = tensorOutput;

            // Creating Model
            const inputSize = tensorData.shape[1];
            this.model = await this.createModel(inputSize, learningCurve, neuron, sumHidden)
            
            // Training Model
            store.loading.content = `Training Model`;
            const startTime = Date.now();
            await this.trainModel(tensorData, tensorOutput, patienceCount);
            const endTime = Date.now();
            const trainingTime = (endTime - startTime) / 1000;
            console.log(`Training ${trainingTime.toFixed(2)} detik`);

            // Testing Model
            await this.testModel();
            this.isTrained = true;
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
        async loadModel() {
            // Config backend tensorflow
            await tf.setBackend('webgpu');
            await tf.ready();
            let model;
            try { 
                model = await tf.loadLayersModel('indexeddb://best-model-val_loss');
                this.model = model;
                console.log('✅ Model loaded from disk!');
                this.modelAvailable = true;
            } catch (err) {
                console.log('⚠️ Model not found ');
                console.log(err);
            }

            return model;
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

            // Handle outliers
            const helper = HelperCode();
            const ipkList = filteredByStatus
                .map(s => parseFloat(s[this.inputConfig.number]))
                .filter(Number.isFinite);
            
            const sortedIPK = [...ipkList].sort((a, b) => a- b);
            const q1 = await helper.percentile(sortedIPK, 0.015);
            const q3 = await helper.percentile(sortedIPK, 1.00);
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
            const filterIPK = filteredByStatus.filter(s => {
                const ipk = parseFloat(s[this.inputConfig.number]);
                if(ipk >= q1 && ipk <= q3){
                    return ipk
                }
            })
            this.totalDataStep.cleanOutliers.filterIPK.after = filterIPK.length;
            this.totalDataStep.cleanOutliers.filterIPK.deleted = this.totalDataStep.cleanOutliers.filteredByStatus.after - filterIPK.length; //error .after disini
            this.totalDataStep.cleanOutliers.filterIPK.features = this.getTotalFeature(filterIPK);

            return filterIPK;
        },
        async cleanNewStudent(data){
            // Handle newStudents
            this.totalDataStep.cleanOutliers.validStudents = {};
            const validStudents = data.filter(s => {
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
            this.totalDataStep.cleanOutliers.validStudents.deleted = this.totalDataStep.cleanOutliers.filterIPK.after - validStudents.length;
            this.totalDataStep.cleanOutliers.validStudents.features = this.getTotalFeature(validStudents);

            return validStudents;
        },
        async findOutput(data){
            for (const student of data){
                const status = student.statusMahasiswa?.toLowerCase().trim();
                const duration = parseFloat(student.durasi);
                const isLulus = this.status.lulus.some(v => status.includes(v));
                
                student.label = (isLulus && duration <= 4) ? 1 : 0;
            }
            this.totalDataStep.findOutput.features = this.getTotalFeature(data);
            return data;
        },
        async smartSplit(data, splitRatio = 0.05){
            const oneHot = this.inputConfig.oneHot || {};
            const mapping = this.inputConfig.mapping || {};
            const nTest = Math.max(1, Math.round(data.length * splitRatio));

            const comboMap = {};
            for (const student of data){
                const key = oneHot.map(field => {
                    let val = student[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                    const fieldMapping = mapping[field];
                    if (fieldMapping && fieldMapping[val] && val){
                        val = fieldMapping[val];
                    }
                    return val || '';
                }).join('|');
                if (!comboMap[key]) comboMap[key] = [];
                comboMap[key].push(student);
            }
            // Sort
            const sortedEntries = Object.entries(comboMap).sort((a, b) => b[1].length - a[1].length);
            const sorted = Object.fromEntries(sortedEntries)

            const testUniq = [];
            const used = new Set();
            for (const arr of Object.values(sorted)) {
                if (arr.length > 10 && testUniq.length < nTest) {
                    const idx = Math.floor(Math.random() * arr.length);
                    testUniq.push(arr[idx]);
                    used.add(arr[idx]);
                }
            }

            // returning used test to data
            const leftover = data.filter(row => !used.has(row));
            for (let i = leftover.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [leftover[i], leftover[j]] = [leftover[j], leftover[i]];
            }
            const testSet = testUniq.slice();
            for (let i = 0; i < leftover.length && testSet.length < nTest; i++) {
                testSet.push(leftover[i]);
            }

            // 4. Data train = data - testSet
            const testSetSet = new Set(testSet);
            const trainData = data.filter(row => !testSetSet.has(row));
            const testData = testSet;
            this.totalDataStep.splitForTesting.after = trainData.length;
            this.totalDataStep.splitForTesting.features = this.getTotalFeature(trainData);

            return { trainData, testData };
        },
        async loadEncodeMaps(){
            console.log("loadEncodeMaps")
            try {
                const maps = await get('encode-maps');
                if (maps) {
                    this.encodeMaps = maps;
                    console.log("✅ encodeMaps loaded from IndexedDB");
                } else {
                    console.warn("⚠️ encodeMaps not found in IndexedDB");
                }
            } catch (err) {
                console.warn("❌ Error loading encodeMaps");
                console.error(err);
            }
        },
        async encodeMapsbuilder(dataList){
            // Pembuatan encodeMaps
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
            const rawEncodeMaps = toRaw(encodeMaps)
            await set('encode-maps', rawEncodeMaps)
            return encodeMaps;
        },
        async encodeField(data){
            const encoded = [];
            let debugging = {};
            for (const student of data){
                const row = [];
                
                // Encode one-hot
                // for (const field of this.inputConfig.oneHot){
                //     const fieldMap = this.encodeMaps[field];
                //     const oneHot = new Array(fieldMap.size).fill(0); 
                //     let val = student[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                //     if (!val) {
                //         console.log(`Field ${field} is empty for student`, student);
                //         continue;
                //     }

                //     const fieldMapping = this.inputConfig.mapping?.[field];
                //     if (fieldMapping && fieldMapping[val]){
                //         val = fieldMapping[val];
                //     }
                //     const index = fieldMap.map.get(val);
                //     if (index !== undefined){
                //         oneHot[index] = 1;
                //     }
                //     row.push(...oneHot);
                // }
                for (const field of this.inputConfig.oneHot) {
                    const fieldMap = this.encodeMaps[field];
                    const oneHot = new Array(fieldMap.size).fill(0); 

                    let val = student[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();

                    if (!val) {
                        console.warn(`⚠️ Field "${field}" is empty for student:`, student);
                        continue;
                    }

                    const rawVal = val; // simpan sebelum mapping

                    const fieldMapping = this.inputConfig.mapping?.[field];
                    if (fieldMapping && fieldMapping[val]) {
                        val = fieldMapping[val];
                    }

                    const index = fieldMap.map.get(val);

                    if (index !== undefined) {
                        oneHot[index] = 1;
                    } else {
                        if (!debugging[val]){
                            debugging[val] = [];
                        }
                        debugging[val].push(`${rawVal} pada ${val}`);                    
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
            console.log("debugging:", debugging)

            return encoded;
        },
        async encodeOutput(data){
            let banyak1 = 0;
            let banyak0 = 0;
            const encoded = data.map(s => {
                if (s.label === 1) banyak1++;
                else banyak0++
                return s.label;
            })
            console.log(`1 VS 0 : ${banyak1} vs ${banyak0}`);
            return encoded.map(v => [v]);
        },
        // async splitData(data, output){
        //     // Combine input-Output
        //     const combined = data.map((input, idData) => ({
        //         input,
        //         output: output[idData]
        //     }))

        //     // Shuffle
        //     for (let i = combined.length - 1; i > 0; i--){
        //         const j = Math.floor(Math.random() * (i + 1));
        //         [combined[i], combined[j]] = [combined[j], combined[i]];
        //     }

        //     // 5% for Testing
        //     const testSize = Math.floor(combined.length * 0.05);
        //     const testSet = combined.slice(0, testSize);
        //     const trainSet = combined.slice(testSize);

        //     // Split
        //     const dataTest = testSet.map(d => d.input);
        //     const outputTest = testSet.map(d => d.output);
        //     const dataTrain = trainSet.map(d => d.input);
        //     const outputTrain = trainSet.map(d => d.output);

        //     return {dataTest, outputTest, dataTrain, outputTrain}
        // },
        async createModel(inputSize, learningCurve, neuron, sumHidden){
            console.log("inputSize:", inputSize)
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
        async testModel(columnToShuffle = null){
            if(!this.model){
                console.error("Model belum dibuat. Silakan jalankan startInitial terlebih dahulu.");
                return;
            }
            // Reset testing summary
            this.testingSummary = {};

            const store = MainStore();
            store.loading.status = false;
            store.loading.content = `Predicting Testing Data`;

            const data = structuredClone(this.testingData);
            if (columnToShuffle || !columnToShuffle === ""){
                console.log(`Shuffling column: ${columnToShuffle}`);
                const values = data.map(s => s[columnToShuffle])

                // Shuffle values
                for (let i = values.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [values[i], values[j]] = [values[j], values[i]];
                }

                // Assign shuffled values back to data
                data.forEach((row, index) => {
                    row[columnToShuffle] = values[index];
                })
            }

            const encodedData = await this.encodeField(data);
            const encodedOutput = await this.encodeField(data);

            // Create Tensor for Testing
            const tensorTestData = Object.freeze(tf.tensor2d(encodedData, [encodedData.length, encodedData[0].length]));

            // Testing
            const outputPredict = toRaw(this.model).predict(tensorTestData);

            // Konversi hasil prediksi dan label
            const preds = await outputPredict.data();

            // Save testing labels
            this.testingSummary.real = encodedOutput.map(l => l[0]);
            this.testingSummary.pred = preds;

            store.loading.status = true;

        },
        async predictData(data){
            let model = toRaw(this.model);
            if(!this.modelAvailable || !model){
                const store = MainStore();
                store.loading.content = "❌ Model tidak tersedia!";
                console.warn("Model tidak tersedia untuk prediksi.");
                return null;
            }
            await this.saveConfig();
            if(!this.encodeMaps || Object.keys(toRaw(this.encodeMaps)).length === 0){
                await this.loadEncodeMaps() 
                if(!this.encodeMaps || Object.keys(toRaw(this.encodeMaps)).length === 0){
                    console.warn("EncodeMaps tidak ditemukan")
                    return null;
                }
            }
            const encodedData = await this.encodeField(data);
            const tensorData = Object.freeze(tf.tensor2d(encodedData, [encodedData.length, encodedData[0].length]));
            const outputPredict = model.predict(tensorData);
            const preds = await outputPredict.data();
            return preds;
        },
        // Helper Section
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