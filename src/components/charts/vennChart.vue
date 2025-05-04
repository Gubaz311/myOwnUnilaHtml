<template>
  <div ref="chartContainer" class="h-44 md:h-72 w-full"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Highcharts from 'highcharts'
import 'highcharts/modules/venn'
import { MainStore } from '@/stores/mainStore'

const chartContainer = ref(null)
let chartInstance = null
let observer = null

// Fungsi untuk render chart
const renderChart = () => {
  const isDark = document.documentElement.classList.contains('dark')

  if (chartInstance) {
    chartInstance.destroy() // Hapus chart lama
  }

  const store = MainStore()
  const extractedData = ref(store.getExtracted)
  console.log('extractedData', extractedData.value)


  chartInstance = Highcharts.chart(chartContainer.value, {
    chart: {
      type: 'venn',
      backgroundColor: null,
    },
    title: { text: null },
    accessibility: { enabled: false },
    series: [{
      data: [
        {
          sets: ['IPK ≥ 3.00'],
          value: extractedData.value.countBestGPA,
          name: 'IPK Tinggi',
          color: isDark ? 'rgba(96, 165, 250, 0.6)' : 'rgba(96, 165, 250, 0.4)', 
        },
        {
          sets: ['Durasi ≤ 4 Tahun'],
          value: extractedData.value.countBestDuration,
          name: 'Durasi Cepat',
          color: isDark ? 'rgba(244, 114, 182, 0.6)' : 'rgba(244, 114, 182, 0.4)', 
        },
        {
          sets: ['IPK ≥ 3.00', 'Durasi ≤ 4 Tahun'],
          value: extractedData.value.countBestGPADuration,
          name: 'Keduanya',
          color: isDark ? 'rgba(165, 180, 252, 0.9)' : '#rgba(2, 132, 199, 0.9)', 
        }
      ],
      dataLabels: {
        enabled: true,
        format: '{point.name}'
      }
    }],
    tooltip: {
      pointFormat: '{point.name}: <b>{point.value}</b>'
    },
    credits: { enabled: false }
  })
}

onMounted(() => {
  renderChart()

  // Pantau perubahan class dark di <html>
  observer = new MutationObserver(() => {
    renderChart()
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  if (observer) {
    observer.disconnect()
  }
})
</script>
