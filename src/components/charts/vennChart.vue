<template>
    <div ref="chartContainer" class="h-44 md:h-72" style="width: 100%;;"></div>
</template>
  
<script setup>
  import { onMounted, ref } from 'vue'
  import Highcharts from 'highcharts'
  import 'highcharts/modules/venn' // Modul Venn akan dikenali otomatis
import { document } from 'postcss'
  const chartContainer = ref(null)


  const renderChart = () => {
    const isDark = document.documentElement.classList.contains('dark')

    Highcharts.chart(chartContainer.value, {
      chart: {
        type: 'venn',
        backgroundColor: null,
      },
      title: {
        text: null
      },
      accessibility: {
        enabled: false // ← ini menonaktifkan warning tersebut
      },
      series: [{
        data: [
          { 
            sets: ['IPK ≥ 3.00'], 
            value: 40, 
            name: 'IPK Tinggi',
            color: isDark ? #60a5fa99 : '#60a5fa66',
          },
          { sets: ['Durasi ≤ 4 Tahun'], value: 35, name: 'Durasi Cepat' },
          { sets: ['IPK ≥ 3.00', 'Durasi ≤ 4 Tahun'], value: 15, name: 'Keduanya' }
        ],
        dataLabels: {
          enabled: true,
          format: '{point.name}'
        }
      }],
      tooltip: {
        pointFormat: '{point.name}: <b>{point.value}</b>'
      },
      credits: {
        enabled: false
      }
    })

  }




  onMounted(() => {
    renderChart()
  })
</script>
  