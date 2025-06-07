<template>
<SummarySection/>
<AiButton/>
<barChart
    class="container"
    title="Kelulusan Tepat Waktu"
    :categories="chartDataA.categories"
    :series="chartDataA.series"
  />
<barChart
    class="container"
    title="Statistik Mahasiswa"
    :categories="chartDataB.categories"
    :series="chartDataB.series"
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
const ktw = computed(() => store.getExtracted.ktw)




const chartDataA = computed(() => {
  const categories = []
  const KTW = []
  const nonKTW = []
  for (const [key, value] of Object.entries(ktw.value)){
    let xLabel;
    if(p.value==="all"){
      xLabel = key
    }else{
      xLabel = key
    }
    categories.push(xLabel)
    KTW.push(parseFloat(value.tepatWaktu))
    nonKTW.push(parseFloat(value.tidakTepatWaktu))
  }
  return {
    categories,
    series: [
      { name: 'Tepat Waktu', data: KTW, color: '#60a5fa' },
      { name: 'Tidak Tepat Waktu', data: nonKTW, color: '#34d399' }
    ]
  }
})

// Fungsi builder chart data
const chartDataB = computed(() => {
  const categories = []
  const gpa = []
  const duration = []
  for (const [key, value] of Object.entries(avgCat.value)) {
    let xLabel
    // console.log("p", p.value)
    if(p.value==="all"){
        xLabel = value.category
        // console.log("p.value", p.value)
        // console.log(`Key ${value.category} Ditambahkan`)
        // console.log(`Key ${xLabel} Ditambahkan`)
    }else{
        xLabel = key
        // console.log(`Key ${xLabel} Ditambahkan`)
    }
    categories.push(xLabel)
    gpa.push(parseFloat(value.avgGPA))
    duration.push(parseFloat(value.avgDuration))
  }
  return {
    categories,
    series: [
      { name: 'IPK', data: gpa, color: '#60a5fa' },
      { name: 'Durasi', data: duration, color: '#34d399' }
    ]
  }
})



</script>