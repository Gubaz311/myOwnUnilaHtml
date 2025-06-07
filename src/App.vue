<template>
  <div class="relative z-10">
    <main class="bg-lightMain dark:bg-darkMain relative min-h-screen pb-5">
    <noiseBackground/>
    <MainHeader class="overflow-hidden z-30"/>
    <OptionButton v-if="store.currentView !== 'report'"/>
    <div v-if="store.loading.status === true">
      <component :is="currentCoponnent"/>
    </div>
    <div v-else>
      <LoadingView v-if="store.loading.status === false"/>
    </div>
    <optionAI v-if="store.currentView === 'report'" :disabled="!store.loading.status"/>
  </main>
  </div>
  <mainFooter/>
</template>

<script setup>
import noiseBackground from './components/icons/noiseBackground.vue';
import MainHeader from './components/mainHeader.vue';
import mainFooter from './components/mainFooter.vue';
import ktwView from './views/ktwView.vue';
import { MainStore } from './stores/mainStore';
import LoadingView from './components/loadingView.vue';
import OptionButton from './components/optionButton.vue';
import { computed } from 'vue';
import ReportModel from './views/reportModel.vue';
import optionAI from './components/optionAI.vue';
const store = MainStore();


const currentCoponnent = computed(() =>{
  return store.currentView === 'report' ? ReportModel : ktwView;
})

</script>

