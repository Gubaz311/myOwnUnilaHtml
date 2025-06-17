import './assets/main.css'
import { createPinia } from 'pinia'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import HighchartsVue from 'highcharts-vue'
import { MainStore } from './stores/mainStore'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(HighchartsVue)
app.use(router)
app.mount('#app')


// Console function

const store = MainStore();
window.start = store.gotoReport; 
//store.gotoReport() isinya store.currentView = report

// import { ModelStore } from './stores/components/modelStore'
// const model = ModelStore();
// window.coba = model.buYessi;