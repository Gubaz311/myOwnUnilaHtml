import './assets/main.css'
import { createPinia } from 'pinia'


import { createApp } from 'vue'
import App from './App.vue'
import { MainStore } from './stores/mainStore'
import HighchartsVue from 'highcharts-vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(HighchartsVue)
app.mount('#app')

//debugging
const mainStore = MainStore()
window.mainStore = mainStore;
