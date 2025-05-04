<template>
<SummarySection/>
<AiButton/>
<barChart
    class="container"
    title="Statistik Mahasiswa"
    :categories="chartDataA.categories"
    :series="chartDataA.series"
  />
</template>

<script setup>
import AiButton from '@/components/aiButton.vue';
import SummarySection from '@/components/summarySection.vue';
import barChart from '@/components/charts/barChart.vue';
import { MainStore } from '@/stores/mainStore';
import { computed } from 'vue';

const store = MainStore()
const p = computed(() => store.getOptionInfo.prodi)
const avgCat = computed(() => store.getExtracted.avgCat)



// Fungsi builder chart data
const chartDataA = computed(() => {
  const categories = []
  const gpa = []
  const duration = []

  for (const [key, value] of Object.entries(avgCat.value)) {
    let xLabel
    console.log("p", p.value)
    if(p.value==="all"){
        xLabel = value.category
        categories.push(xLabel)
        console.log("p.value", p.value)
        console.log(`Key ${value.category} Ditambahkan`)
        console.log(`Key ${xLabel} Ditambahkan`)
    }else{
        xLabel = key
        categories.push(xLabel)
        console.log(`Key ${xLabel} Ditambahkan`)
    }

    categories.push(xLabel)

    gpa.push(parseFloat(value.avgGPA))
    duration.push(parseFloat(value.avgDuration))
}

  console.log('chartData', categories, gpa, duration)

  return {
    categories,
    series: [
      { name: 'IPK', data: gpa, color: '#60a5fa' },
      { name: 'Durasi', data: duration, color: '#34d399' }
    ]
  }
})

</script>