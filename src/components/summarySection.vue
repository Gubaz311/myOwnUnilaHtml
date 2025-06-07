<template>
<div class="bg-lightHeader dark:bg-darkHeader md:bg-none md:dark:bg-none md:border-2 md:border-lightText md:dark:border-darkText rounded-lg container p-3 mt-5 text-lightText dark:text-darkText">
  <div class="grid grid-cols-2 md:grid-cols-9 md:grid-rows-4 gap-4 text-lg">
      <div class="col-span-2 md:col-span-3 md:row-span-4 flex items-center justify-center">
        <vennChart/>
      </div> <!--pie chart-->
      <div class="col-span-2 md:col-span-3 md:row-span-2 md:col-start-4 md:mt-2">
        <div class="space-y-2">
          <div class="flex items-center gap-1">
            <CalendarLogo class="h-7 w-7"/><span>{{tahunAwal}} - {{tahunAkhir}}</span>
          </div>
          <div class="flex items-center gap-1">
            <PeopleLogo class="h-7 w-7"/><span>{{ totalData }} Mahasiswa</span>
          </div>
          <div class="flex items-center gap-1">
            <AverageLogo class="h-7 w-7"/><span>Rata - Rata IPK : {{ avgIPK }}</span>
          </div>
          <div class="flex items-center gap-1">
            <HourglassLogo class="h-7 w-7"/><span>Rata - Rata Masa Studi : {{ avgDurasi }} Tahun</span>
          </div>
        </div>
      </div>
      <div class="col-span-1 md:col-span-3 md:row-span-2 md:col-start-7 md:row-start-1">
        <div class="flex flex-col space-y-2 md:pt-4 mb-1">
          <div class="flex justify-center">
            <MedalLogo class="h-12 md:h-16"/>
          </div>
        </div>
        <div class="text-center">IPK Tertinggi : <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestIPK }}</span></div>
        <div class="text-center">dengan <span class="text-lightIconFocus dark:text-darkIconFocus">{{ totalBestIPK }} Mahasiswa</span></div>
      </div>
      <div class="col-span-1 md:col-span-2 md:row-span-2 md:col-start-4 md:row-start-3">
        <div class="flex flex-col space-y-2 md:pt-4 mb-1">
          <div class="flex justify-center">
            <podiumLogo class="h-12 md:h-[3.75rem]"/>
          </div>
        </div>
        <div class="text-center">{{ bestCatInfo.bestCatLabel }} dengan IPK Terbaik</div>
        <div class="text-center">diproleh oleh <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestCatInfo.bestCatValueIPK }}</span></div>
        <div class="text-center">dengan IPK <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestCatInfo.bestCatScoreIPK }}</span> </div>
      </div>
      <div class="col-span-1 md:col-span-2 md:row-span-2 md:col-start-6 md:row-start-3">
        <div class="flex flex-col space-y-2 md:pt-4 mb-1">
          <div class="flex justify-center">
            <trophyLogo class="h-12 md:h-16"/>
          </div>
        </div>
        <div class="text-center">{{ bestCatInfo.bestCatLabel }} dengan Durasi Terbaik</div>
        <div class="text-center">diproleh oleh <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestCatInfo.bestCatValueDuration }}</span></div>
        <div class="text-center">dengan <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestCatInfo.bestCatScoreDuration }}</span> Tahun</div>
      </div>
      <div class="col-span-1 md:col-span-2 md:row-span-2 md:col-start-8 md:row-start-3">
        <div class="flex flex-col space-y-2 md:pt-4 mb-1">  
          <div class="flex justify-center">
            <rocketLogo class="h-12 md:h-16"/>
          </div>
        </div>
        <div class="text-center">Durasi Tercepat : <span class="text-lightIconFocus dark:text-darkIconFocus">{{ bestDuration }}</span> Tahun</div>
        <div class="text-center">dengan <span class="text-lightIconFocus dark:text-darkIconFocus">{{ totalBestDuration }}</span> Mahasiswa</div>
      </div>
  </div>
</div>
</template>

<script setup>
import vennChart from './charts/vennChart.vue';

import AverageLogo from './icons/averageLogo.vue';
import CalendarLogo from './icons/calendarLogo.vue';
import HourglassLogo from './icons/hourglassLogo.vue';
import PeopleLogo from './icons/peopleLogo.vue';

import podiumLogo from './icons/podiumLogo.vue';
import trophyLogo from './icons/trophyLogo.vue';
import rocketLogo from './icons/rocketLogo.vue';
import MedalLogo from './icons/medalLogo.vue';
import { MainStore } from '@/stores/mainStore';
import { computed, ref } from 'vue';


const store = MainStore();
const optionInfo = ref(store.optionInfo);
const tahunAwal = ref(optionInfo.value.year[0]);
const tahunAkhir = ref(optionInfo.value.year[1]);

const extracted = ref(store.getExtracted);
const totalData = ref(extracted.value.totalData);
const avgIPK = ref(extracted.value.avgAll.avgGPA);
const avgDurasi = ref(extracted.value.avgAll.avgDuration);
const bestIPK = ref(extracted.value.maxStats.highestGPA.value);
const totalBestIPK = ref(extracted.value.maxStats.highestGPA.count);


// const bestCat = computed(() => {
//   return optionInfo.value.prodi === 'all' ? "Prodi" : "Tahun";
// });
// const bestCatValueIPK = computed(() =>{
//   return ref(extracted.value.bestCat.bestAvgGPA.value);
// })
// const bestCatValueDuration = computed(() =>{
//   return ref(extracted.value.bestCat.bestAvgDuration.value);
// })
const bestCatInfo = computed(() => {
  const bestCatLabel = extracted.value.bestCat.bestAvgGPA.label;
  const bestCatValueIPK = extracted.value.bestCat.bestAvgGPA.value;
  const bestCatScoreIPK = extracted.value.bestCat.bestAvgGPA.score;
  const bestCatValueDuration = extracted.value.bestCat.bestAvgDuration.value; 
  const bestCatScoreDuration = extracted.value.bestCat.bestAvgDuration.score;

  return {
    bestCatLabel,
    bestCatValueIPK,
    bestCatScoreIPK,
    bestCatValueDuration,
    bestCatScoreDuration
  };
});



const bestDuration = ref(extracted.value.maxStats.fastestDuration.value);
const totalBestDuration = ref(extracted.value.maxStats.fastestDuration.count);



</script>
