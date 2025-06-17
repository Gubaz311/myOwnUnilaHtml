<template>
    <div class="container mt-4">
        <button
            class="flex items-center gap-2 p-2 rounded-lg text-lightText dark:text-darkText bg-lightContainer dark:bg-darkContainer hover:brightness-95"
            @click="store.gotoReport"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali</span>
        </button>
    </div>
    <div v-if="isTrained">
        <lineChart
        v-for="(chart, index) in lineCharts"
        class="container"
        :key="index"
        :title="chart.title"
        :categories="chart.categories"
        :series="chart.series"
        />
    </div>
    <div v-if="isTrained" class="container">
        <div class="max-w-screen-md mx-auto mt-6 px-4 py-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block text-base text-gray-700 dark:text-gray-300">shuffle column?</label>
            <select @change="handleChange" v-model="kolomAcak" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
            <option value="">Pilih kolom</option>
            <option value="namaProdi">Nama Prodi</option>
            <option value="jenisKelamin">Jenis Kelamin</option>
            <option value="jalurPenerimaan">Jalur Masuk</option>
            <option value="ipk">IPK</option>
            </select>
        </div>
    </div>
    <summaryModel v-if="isTrained"/>
</template>

<script setup>
import lineChart from '@/components/charts/lineChart.vue';
import summaryModel from '@/components/summaryModel.vue';
import { computed, ref } from 'vue';
import { MModelStore } from '@/stores/components/mmodelStore';
import { MainStore } from '@/stores/mainStore';
const store = MainStore();
const model = MModelStore();



const isTrained = computed(() => model.isTrained)
const chartData = computed(() => model.getChartData);
const value = computed(() => Object.keys(chartData.value))
const color = computed(() => store.getColor)
const lineCharts = computed(() => {
    return value.value.map((key) => {
        const data = chartData.value[key] || { loss: [], val_loss: [] }
        const categories =  Array.from({ length: data.loss.length }, (_, i) => i + 1);

        return {
            title: 'Training',
            categories: categories,
            series:[
                { name:'Loss', data: data.loss, lineWidth:3 ,color: color.value[0] },
                { name: 'Validation Loss', data: data.val_loss, lineWidth:3 ,color: color.value[1] }
            ]
        }
    })
})



let kolomAcak = ref("")

const handleChange = () => {
    model.testModel(kolomAcak.value)
}
</script>