<template>
    <div v-if="modelAvailable !== null">
        <lineChart
        v-for="(chart, index) in lineCharts"
        class="container"
        :key="index"
        :title="chart.title"
        :categories="chart.categories"
        :series="chart.series"
        />
    </div>
    <summaryModel v-if="modelAvailable !== null"/>
</template>

<script setup>
import lineChart from '@/components/charts/lineChart.vue';
import summaryModel from '@/components/summaryModel.vue';
import { computed } from 'vue';
// import { ModelStore } from '@/stores/components/modelStore';
// import { MainStore } from '@/stores/mainStore';

// const model = ModelStore()
// const chartData = computed(() => model.getChartData)
// const allYears = computed(() => Object.keys(chartData.value))

// const lineCharts = computed(() => {
//     const store = MainStore()
//     console.log("store.loading:", store.loading.status)
//     console.log("chartData:", chartData.value, typeof chartData.value)
//     console.log("allYears:", allYears.value, typeof allYears.value)
//     console.log("YAYA") // Terbaca
//     return allYears.value.map(year => {
//         console.log("hei") // Tidak Terbaca
//         const data = chartData.value[year] || { loss: [], val_loss: [] }
//         const categories = Array.from({ length: data.loss.length }, (_, i) => i + 1)
//         console.log("categories:", categories)

//         console.log("categories:", categories) 
//         console.log("loss:", data.loss)
//         console.log("val_loss:", data.val_loss)

//         return {
//             title:`Training Loss ${year}`,
//             categories,
//             series:[
//                 { name: 'Loss', data: data.loss },
//                 { name: 'Validation Loss', data: data.val_loss }
//             ]
//         }
//     })
// })

import { MModelStore } from '@/stores/components/mmodelStore';
import { MainStore } from '@/stores/mainStore';
const store = MainStore();
const model = MModelStore();
const modelAvailable = computed(() => model.model)
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
</script>