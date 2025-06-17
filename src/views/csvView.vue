<template>
<summarySection/>
<barChart
    class="container mt-8"
    title="Kelulusan Tepat Waktu"
    :categories="chartDataA.categories"
    :series="chartDataA.series"
  />
<barChart
    class="container mt-8"
    title="Kelulusan Tepat Waktu <br> pada IPK"
    :categories="chartDataB.categories"
    :series="chartDataB.series"
    :stacking="'normal'"
  />
<barChart
    class="container mt-8"
    title="Kelulusan Tepat Waktu <br> pada Jenis Kelamin"
    :categories="chartDataC.categories"
    :series="chartDataC.series"
    :stacking="'normal'"
  />
</template>

<script setup>
import summarySection from '@/components/summarySection.vue';
import barChart from '@/components/charts/barChart.vue';
import { MainStore } from '@/stores/mainStore';
import { AnalysisData } from '@/stores/components/analysisData';
import { computed } from 'vue';

const store = MainStore();
const ktw = computed(() => store.getExtracted.ktw);

const chartDataA = computed(() => {
    const categories = [];
    const KTW = [];
    const nonKTW = [];

    for (const [key, value] of Object.entries(ktw.value)){
        categories.push(key);
        KTW.push(parseFloat(value.tepatWaktu));
        nonKTW.push(parseFloat(value.tidakTepatWaktu));
    }

    return {
        categories,
        series: [
            { name: 'Tepat Waktu', data: KTW, color: '#60a5fa' },
            { name: 'Tidak Tepat Waktu', data: nonKTW, color: '#34d399' }
        ]
    }
})

const analysis = AnalysisData();
const analysisData = computed(() => analysis.getAnalysisData)

const chartDataB = computed(() => {
    const categories = [];
    const KTW = [];
    const nonKTW = [];

    for (const [key, value] of Object.entries(analysisData.value.ipk)){
        const kategori = key.toString().replace(/;/g, " - ");
        categories.push(kategori);
        KTW.push(parseFloat(value.tepatWaktu));
        nonKTW.push(parseFloat(value.tidakTepatWaktu));
    }

    return {
        categories,
        series: [
            { name: 'Tepat Waktu', data: KTW, color: '#60a5fa' },
            { name: 'Tidak Tepat Waktu', data: nonKTW, color: '#ec4899' }
        ]
    }
})


const chartDataC = computed(() => {
    const categories = [];
    const malePositive = [];
    const maleNegative = [];
    const femalePositive = [];
    const femaleNegative = [];

    for (const [key, value] of Object.entries(analysisData.value.gender)){
        categories.push(key);
        malePositive.push(parseFloat(value["laki-laki"].tepatWaktu));
        maleNegative.push(parseFloat(value["laki-laki"].tidakTepatWaktu));
        femalePositive.push(parseFloat(value.perempuan.tepatWaktu));
        femaleNegative.push(parseFloat(value.perempuan.tidakTepatWaktu));
    }

    return {
        categories,
        series: [
            { name: 'KTW', data: malePositive, stack:'Laki-laki' , color:'#60a5fa' },
            { name: 'NON KTW', data: maleNegative, stack:'Laki-laki' , color:'#3b82f6' },
            { name: 'KTW', data: femalePositive, stack:'Perempuan' , color:'#f472b6' },
            { name: 'NON KTW', data: femaleNegative, stack:'Perempuan' , color: '#ec4899' }
        ]
    }
})

</script>