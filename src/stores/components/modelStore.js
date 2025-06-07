import * as tf from '@tensorflow/tfjs'
import JSZip from 'jszip';
import { MainStore } from '../mainStore';
import { defineStore } from 'pinia';
import { extractInfo } from './extractInfo';
import { toRaw } from 'vue';
import '@tensorflow/tfjs-backend-webgpu';
import '@tensorflow/tfjs-backend-wasm';

export const ModelStore = defineStore ("modelStore", {
    state:()=>({
        model:null,
        data: {},
        prodi:null,
        encodeMaps:{},
        encodedData:{},
        tensorData:{},
        outputData:{},
        inputConfig:null,
        status:null,
        rancuDuration:null,
        timeNow:null,
        chartData:{},
    }),
    getters:{
        getChartData(state){
            return state.chartData
        },
    },
    actions:{
//HELPER CODE
        async percentile(arr, p){
            console.log("percentile")
            const index = (arr.length - 1) * p;
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index % 1;

            if(upper >= arr.length) return arr[lower];
            return arr[lower] * (1 - weight) + arr[upper] * weight;
        },
        async encodeMapsOneHot(dataList){
            console.log("buildEncodeMaps")
            const encodeMaps = {};
            // Encode oneHot
            for (const field of this.inputConfig.oneHot){
                const map = new Map();
                let index = 0;
                const fieldMapping = this.inputConfig.mapping?.[field]; // ambil mapping field ini
                for(const item of dataList){
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
                    size:map.size
                }
            }
            return encodeMaps;
        },
        async encodeMapsNumber(dataList){
            const encodeMaps = {};
            for (const field of this.inputConfig.number){
                const values = dataList.map(s => parseFloat(s[field])).filter(value => !isNaN(value))
                encodeMaps[field]={
                    min:Math.min(...values),
                    max:Math.max(...values)
                }
            }
            return encodeMaps;
        },
        async generateOneHotTableFromEncodeMaps(encodeMaps) {
            const table = {};
            for (const [field, config] of Object.entries(encodeMaps)) {
                if (!config.map) continue; // skip non-one-hot
        
                const size = config.size;
                const fieldTable = {};
        
                for (const [key, index] of config.map.entries()) {
                    const oneHot = Array(size).fill(0);
                    oneHot[index] = 1;
                    fieldTable[key] = oneHot;
                }
        
                table[field] = fieldTable;
            }
            return table;
        },

// MAIN CODE
        async downloadModel(){
            console.log("downloadModel")
            const store = MainStore();
            const link = store.getLink;
            const response = await fetch(link);
            const blob = await response.blob();

            const zip = await JSZip.loadAsync(blob);
            const files = {};

            for (const fileName of Object.keys(zip.files)){
                const file = zip.files[fileName];
                if(!file.dir) files[fileName] = await file.async("blob");
            }

            const handler = tf.io.browserFiles([
                new File([files["model.json"]], "model.json"),
                new File([files["group1-shard1of1.bin"]], "group1-shard1of1.bin"),
            ])

            this.model = await tf.loadLayersModel(handler);
            console.log("model terload")
        },
        async saveConfig(){
            console.log("saveConfig")
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
        async startInitial(backend, learningCurve, patienceCount, neuron, sumHidden){
            console.log("startInitial")
            const store = MainStore();
            store.loading.status = false;
            console.log("loading false", store.loading.status)
            // Resetting data 
            this.chartData = {};
            this.encodeMaps = {};
            this.encodedData = {};
            this.outputData = {};
            this.tensorData = {};

            store.gotoReport()

            // Config asinkron backend tensorflow

            await tf.setBackend(backend)
            await tf.ready();


            this.data = store.getDataPreprocessing;
            if(
                !this.prodi ||
                !this.inputConfig ||
                !this.status ||
                !this.rancuDuration ||
                !this.timeNow
            ){
                await this.saveConfig();  
            }
            await this.completingMissingData(); 
            this.data = store.getDataPreprocessing;
            store.loading.status = false;

            store.loading.content = `Optimizing Data`
            console.log("store.loading.content :", store.loading.content)
            console.log("this.loading content : optimizing Data")
            const extract = extractInfo();
            const flatten = await extract.flattenData(this.data, "all")
            const cleanedFlatten = flatten.map(item => toRaw(item));
            
            // Filter data outliers
            const cleanedData = await this.cleanOutliers(cleanedFlatten);
            
            // Grouping data by "angkatan"
            const grouped = await this.groupByYear(cleanedData)
            
            // Build Encode Maps
            // for categorical
            this.encodeMaps = await this.encodeMapsOneHot(cleanedData)            
            // for number
            for (const [key, value] of Object.entries(grouped)){
                this.encodeMaps[key] = await this.encodeMapsNumber(value);
            }

            // Encode Data
            for (const [key, value] of Object.entries(grouped)){
                this.encodedData[key] = await this.encodeField(value, key)
            }

            console.log("this.encodedData", this.encodedData)

            // Generate info encodeMaps
            const oneHotTable = await this.generateOneHotTableFromEncodeMaps(this.encodeMaps);
            console.log("oneHotTable",oneHotTable);

            // Create output
            const outputData = await this.encodeOutput(grouped)
            this.outputData = Object.freeze(outputData)

            // Create Tensor2d input
            const tensorData = {};
            for (const [key, value] of Object.entries(this.encodedData)){
                const flattenEncode = value.map(student => {
                    return student.flat()
                })

                const rowCount = flattenEncode.length;
                const colCount = flattenEncode[0].length;

                const tensor = tf.tensor2d(flattenEncode, [rowCount, colCount]);
                tensorData[key] = Object.freeze(tensor)
            }
            this.tensorData = Object.freeze(tensorData)

            // Create model
            const firstKey = Object.keys(this.encodedData)[0];
            const inputSize = this.tensorData[firstKey].shape[1]
            if(!this.model){
                this.model = await this.createModel(inputSize, learningCurve, neuron, sumHidden);
            }
            console.log("store.loading:", store.loading.status)//////////////
            store.loading.status = false;

            // Training 
            for (const year of Object.keys(grouped)){
                store.loading.content = `Training Model for ${year}`
                if(year < (this.timeNow - 4)){
                    const x = this.tensorData[year];
                    const y = this.outputData[year];
                    
                    const { xTrain, yTrain, xVal, yVal } = await this.splitXY(x, y);
                    this.chartData[year] = {loss:[], val_loss:[]}
                    // Training model
                    const startTime = Date.now(); // waktu mulai training
                    await this.trainModel(xTrain, yTrain, xVal, yVal, patienceCount, year)
                    const endTime = Date.now(); // waktu selesai training
                    const trainingTime = (endTime - startTime) / 1000; // dalam detik
                    console.log(`Training ${year} ${trainingTime.toFixed(2)} detik`);
                }   
            }
            // 1. Prediksi data tahun 2019
            const output = toRaw(this.model).predict(this.tensorData[2019]);

            // 2. Konversi output tensor ke array
            const preds = await output.round().array(); // prediksi (dibulatkan ke 0 atau 1)
            const labels = this.outputData[2019];       // label asli array of 0/1

            // 3. Hitung akurasi manual
            let TP = 0, FP = 0, FN = 0, TN = 0;
            for (let i = 0; i < preds.length; i++) {
                const pred = preds[i][0];
                const label = labels[i];

                if (pred === 1 && label === 1) TP++; // True Positive
                else if (pred === 1 && label === 0) FP++; //False Positive
                else if (pred === 0 && label === 1) FN++; // False Negative
                else if (pred === 0 && label === 0) TN++; // True Negative

            }
            const accuracy = (TP + TN) / (TP+FP+TN+FN || 1);
            const precision = TP / (TP + FP || 1); 
            const recall = TP / (TP + FN || 1);

            // 4. Log hasil
            console.log("Predictions (rounded):", preds.map(p => p[0]));
            console.log("True Labels         :", labels);
            console.log(`Manual Accuracy on 2019: ${(accuracy * 100).toFixed(2)}%`);
            console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
            console.log(`Recall   : ${(recall * 100).toFixed(2)}%`);
            console.log("store.loading", store.loading.status)
            store.loading.status = true;


        },
        async completingMissingData(){
            console.log("completingMissingData")
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
            console.log("cleanOutlies")            
            // Handle DO/OUT < this.rancuDuration
            const filteredByStatus = data.filter(s => {
                const status = s.statusMahasiswa?.trim().toLowerCase();
                const duration = parseFloat(s.durasi);

                const filter = (status.includes(this.status.dikeluarkan) || status.includes(this.status.keluar)) && duration < this.rancuDuration
                return !filter
            })

            const validStudents = filteredByStatus.filter(s => {
                const status = s.statusMahasiswa?.trim().toLowerCase();
                const filter = status.includes(this.status.lulus) || status.includes(this.status.dikeluarkan) || status.includes(this.status.keluar) || (status.includes(this.status.aktif) && parseFloat(s.durasi) > 4)
                return filter;
            })

            const ipkList = validStudents
                .map(s => parseFloat(s[this.inputConfig.number]))
                .filter(Number.isFinite)
            
            const sorted = [...ipkList].sort((a, b) => a - b);
            const q1 = await this.percentile(sorted, 0.25);
            const q3 = await this.percentile(sorted, 0.75);
            const iqr = q3 - q1;

            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;

            const filterIPK = filteredByStatus.filter(s => {
                const ipk = parseFloat(s[this.inputConfig.number]);
                return ipk >= lower && ipk <= upper;
            })
            return filterIPK;
        },
        async groupByYear(data){
            let grouped = {};
            for (const student of data){
                const angkatan = student.angkatan;
                if(!grouped[angkatan]){
                    grouped[angkatan] = []
                }
                grouped[angkatan].push(student)
            }
            return grouped;
        },
        async encodeField(students, year){
            console.log("encodeField")
            const encoded = [];
            for(const student of students){
                const studentEncoded = [];
                // Normalization oneHot
                for(const field of this.inputConfig.oneHot){
                    const fieldMap = this.encodeMaps[field];
                    const oneHot = new Array(fieldMap.size).fill(0);
                    let val = student[field]?.toLowerCase().replace(/\s*-\s*/g, '-').trim();
                    if(!val) continue; // skip if field is empty

                    const fieldMapping = this.inputConfig.mapping?.[field]
                    if(fieldMapping && fieldMapping[val]){
                        val = fieldMapping[val];
                    }
                    const index = fieldMap.map.get(val);
                    if(index !==undefined){
                        oneHot[index] = 1;
                    }
                    studentEncoded.push(oneHot)
                };

                // Normalization number
                for (const field of this.inputConfig.number){
                    const fieldMap = this.encodeMaps[year][field];
                    const value = parseFloat(student[field]);
    
                    if(!isNaN(value)){
                        const normalized = (value - fieldMap.min) / (fieldMap.max - fieldMap.min);
                        studentEncoded.push(parseFloat(normalized.toFixed(4)))
                    }
                }
                encoded.push(studentEncoded);
            }
            return encoded;
        },
        async encodeOutput(objectData){
            const outputLabel = {};
            for (const [year, students] of Object.entries(objectData)){
                outputLabel[year] = students.map(s => {
                    const durasi = s.durasi;
                    const status = s.statusMahasiswa?.trim().toLowerCase();
                    const isLulus = status.includes(this.status.lulus) 

                    return durasi <= 4 && isLulus === true ? 1 : 0;
                })
            }
            return outputLabel;
        },
        async createModel(inputSize, learningCurve, neuron, sumHidden){
            console.log("createModel")
            const model = tf.sequential()

            for(let i = 0; i<sumHidden; i++){
                if(i===0){
                    model.add(tf.layers.dense({
                        inputShape:[inputSize],
                        units:neuron[i],
                        activation:'relu'
                    }))
                }else{
                    model.add(tf.layers.dense({
                        units:neuron[i],
                        activation:'relu'
                    }))
                    model.add(tf.layers.dropout({ rate: 0.2 }));
                }
            }
            model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

            model.compile({
                loss: 'binaryCrossentropy',
                optimizer: tf.train.adam(learningCurve),
                metrics: ['accuracy'],
            })
            return model;
        },
        async splitXY(xTensor, yArray, trainRatio = 0.7){
            const total = yArray.length;
            const trainCount = Math.floor(total * trainRatio);
        
            // Potong array output
            const yTrain = tf.tensor2d(yArray.slice(0, trainCount), [trainCount, 1], 'float32');
            const yVal = tf.tensor2d(yArray.slice(trainCount), [total - trainCount, 1], 'float32');

            // Potong tensor input
            const xTrain = xTensor.slice([0, 0], [trainCount, xTensor.shape[1]]);
            const xVal = xTensor.slice([trainCount, 0], [total - trainCount, xTensor.shape[1]]);

            return { xTrain, yTrain, xVal, yVal };
        },
        async trainModel(xTrain, yTrain, xVal, yVal, patienceCount, year){
            const model = toRaw(this.model)

            //function for debuggin
            const trainingProgressCallback =  {
                onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch + 1} / 1000`);
                console.log(`Loss: ${logs.loss}, Accuracy: ${logs.acc}`);
                console.log(`Validation Loss: ${logs.val_loss}, Validation Accuracy: ${logs.val_acc}`);

                this.chartData[year].loss.push(logs.loss)
                this.chartData[year].val_loss.push(logs.val_loss)
                }
            };

            const customCallback = new tf.CustomCallback(trainingProgressCallback)
            await model.fit(xTrain, yTrain, {
                epochs: 1000,
                batchSize: Math.max(32, Math.floor(xTrain.shape[0]/50)),
                shuffle: true,
                validationData: [xVal, yVal],
                callbacks: [
                    tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: patienceCount, restoreBestWeight: true }),
                    customCallback
                ]
            });

            const store = MainStore()
            console.log("store.loading:", store.loading.status)
            xTrain.dispose();
            yTrain.dispose();
            this.model = model;
        },
        async createDummy(){
            
        },
        async buYessi(learningCurve, batchSize){

            await tf.setBackend('webgpu');
            await tf.ready();

            const x = [
                [1, 1],
                [1, 0],
                [0, 1],
                [0, 0]
            ];            
            const y = [0,1,1,0]

            const tensorX = tf.tensor2d(x, [x.length, x[0].length]);
            const tensorY = tf.tensor2d(y, [y.length, 1]);
            const model = tf.sequential();
            model.add(tf.layers.dense({
                inputShape:[2],
                units:2,
                activation:'relu',
                kernelInitializer: tf.initializers.randomUniform({ minval: -1, maxval: 1 }),
                biasInitializer: tf.initializers.randomUniform({ minval: -1, maxval: 1 })
            }))
            model.add(tf.layers.dense({
                units:1,
                activation:'sigmoid',
                kernelInitializer: tf.initializers.randomUniform({ minval: -1, maxval: 1 }),
                biasInitializer: tf.initializers.randomUniform({ minval: -1, maxval: 1 })
            }))

            model.compile({
                loss: 'binaryCrossentropy',
                optimizer: tf.train.adam(learningCurve),
                metrics: ['accuracy'],
            })

            //function for debuggin
            const trainingProgressCallback =  {
                onEpochEnd: async (epoch, logs) => {
                console.log(`Epoch ${epoch + 1} / 2000`);
                console.log(`Loss: ${logs.loss}, Accuracy: ${logs.acc}`);
                }
            };
            const customCallback = new tf.CustomCallback(trainingProgressCallback)
            const startTime = Date.now(); // waktu mulai training
            await model.fit(tensorX, tensorY, {
                epochs: 2000,
                batchSize: batchSize,
                shuffle: true,
                callbacks: [customCallback]
            });
            const endTime = Date.now(); // waktu selesai training
            const trainingTime = (endTime - startTime) / 1000; // dalam detik
            console.log(`Training selesai dalam ${trainingTime.toFixed(2)} detik`);

            const cobaPredict = [
                [1,1],
                [1,0],
                [0,1],
                [0,0]
            ]
            for (const item of cobaPredict){
                const inputTensor = tf.tensor2d([item], [1,2])
                const hasil = model.predict(inputTensor)
                hasil.data().then(data => {
                    const prediksi = data[0];
                    const bulat = prediksi >= 0.5 ? 1 : 0;
                    console.log(`Predict untuk [${item}] adalah ${bulat}`);
                });
            }
        },

    },
})