<template>
    <div ref="chartContainer" class="h-44 md:h-96 w-full"></div>
</template>
  
<script setup>
  import { onMounted, onBeforeUnmount, ref } from 'vue'
  import Highcharts from 'highcharts'
  
  const props = defineProps({
    title: String,
    categories: Array,
    series: Array
  })
  
  const chartContainer = ref(null)
  let chartInstance = null
  let observer = null
  
  const renderChart = () => {
    const isDark = document.documentElement.classList.contains('dark')
  
    if (chartInstance) {
      chartInstance.destroy()
    }
  
    chartInstance = Highcharts.chart(chartContainer.value, {
      chart: {
        type: 'column',
        backgroundColor: null
      },
      title: {
        text: props.title || null,
        style: { color: isDark ? '#fff' : '#000' }
      },
      accessibility: { enabled: false },
      xAxis: {
        categories: props.categories,
        labels: {
          style: { color: isDark ? '#fff' : '#000' }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: null
        },
        labels: {
          style: { color: isDark ? '#fff' : '#000' }
        }
      },
      legend: {
        itemStyle: {
          color: isDark ? '#fff' : '#000'
        }
      },
      series: props.series,
      tooltip: {
        shared: true,
        backgroundColor: isDark ? '#1f2937' : '#f9fafb',
        style: {
          color: isDark ? '#fff' : '#000'
        }
      },
      credits: {
        enabled: false
      }
    })
  }
  
  onMounted(() => {
    renderChart()
    observer = new MutationObserver(renderChart)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  })
  
  onBeforeUnmount(() => {
    if (chartInstance) chartInstance.destroy()
    if (observer) observer.disconnect()
  })
</script>
  