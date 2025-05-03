<template>
<div class="bg-lightHeader dark:bg-darkHeader md:bg-none md:dark:bg-none md:border-2 md:border-lightText md:dark:border-darkText rounded-lg container p-3 mt-5"> <!-- saya ingin mengganti ini agar menjadi background warna -->
  <div class="grid grid-cols-2 md:grid-cols-5 md:grid-rows-4 gap-4">
      <div class="col-span-2 md:col-span-2 md:row-span-4">
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
        <div>ini section 1</div>
      </div> <!--pie chart-->
      <div class="col-span-2 md:col-span-2 md:row-span-2 md:col-start-3">
        <div class="space-y-2">
          <div class="flex items-center gap-1">
            <CalendarLogo class="h-5 w-5"/><span>Lorem ipsum dolor sit amet.</span>
          </div>
          <div class="flex items-center gap-1">
            <PeopleLogo class="h-5 w-5"/><span>Lorem ipsum dolor sit, amet consectetur adipisicing el</span>
          </div>
          <div class="flex items-center gap-1">
            <AverageLogo class="h-5 w-5"/><span>Lorem ipsum dolor sit amet.</span>
          </div>
          <div class="flex items-center gap-1">
            <HourglassLogo class="h-5 w-5"/><span>Lorem ipsum dolor sit amet.</span>
          </div>
        </div>
      </div>
      <div class="col-span-1 w-1/2 md:w-full md:row-span-2 md:col-start-5 md:pt-4">
        <MedalLogo class="h-12 md:w-full w-1/2"/>
        <div>ini section 3</div>
        <div>ini section 3</div>
      </div>
      <div class="col-span-1 w-1/2 md:w-full md:row-span-2 md:col-start-3 md:row-start-3">
        <podiumLogo class="h-12 md:w-full w-1/2"/>
        <div>ini section 4</div>
        <div>ini section 4</div>
      </div>
      <div class="col-span-1 w-1/2 md:w-full md:row-span-2 md:col-start-4 md:row-start-3">
        <trophyLogo class="h-12 md:w-full w-1/2"/>
        <div>ini section 5</div>
        <div>ini section 5</div>
      </div>
      <div class="col-span-1 w-1/2 md:w-full md:row-span-2 md:col-start-5 md:row-start-3">
        <rocketLogo class="h-12 md:w-full w-1/2"/>
        <div>ini section 6</div>
        <div>ini section 6</div>
      </div>
  </div>
</div>
</template>

<script setup>
import AverageLogo from './icons/averageLogo.vue';
import CalendarLogo from './icons/calendarLogo.vue';
import HourglassLogo from './icons/hourglassLogo.vue';
import PeopleLogo from './icons/peopleLogo.vue';

import podiumLogo from './icons/podiumLogo.vue';
import trophyLogo from './icons/trophyLogo.vue';
import rocketLogo from './icons/rocketLogo.vue';
import MedalLogo from './icons/medalLogo.vue';


</script>
