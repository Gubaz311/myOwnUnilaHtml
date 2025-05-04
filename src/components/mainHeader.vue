<template>
<header id="header" class="font-aktivMedium bg-lightHeader/75 text-lightText shadow-md rounded-sm z-10 p-1 sticky top-0 w-full dark:bg-darkHeader/75 dark:text-darkText">
    <!-- Baris Pertama -->
    <div id="baris1" class="h-14 w-full flex justify-between items-center py-3">
      <div class="flex py-0 relative">
        <div class="h-full content-center hidden md:block md:mx-3">
          <div class="h-14 w-14 mb-2"> <!--YANG INI-->
            <div class="relative w-full h-full overflow-hidden">
              <!--Mengambil tinggi dan lebar maximum-->
              <div :class="{ 'modeRotate': !isLightMode }" class="w-[200%] h-[200%] z-10 transition duration-1000" id="svg1">
                <!--Pembungkus svg-->
                <darkLight/>
              </div>
              <div class="absolute w-full h-full top-0 left-0 z-20 cursor-pointer" id="mode1" @click="toggleTheme"></div>
            </div>
          </div>
        </div>
        <div class="h-full content-center md:hidden" x-data="{ open: false }">
          <div x-show="open" class="fixed inset-0 z-50 overflow-hidden">
            <div x-show="open" x-transition:enter="transition-opacity ease-out duration-300"
              x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
              x-transition:leave="transition-opacity ease-in duration-300" x-transition:leave-start="opacity-100"
              x-transition:leave-end="opacity-0" class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
            </div>
            <!-- Sidebar Content -->
            <section class="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div x-show="open" x-transition:enter="transition-transform ease-out duration-300"
                x-transition:enter-start="transform translate-x-full" x-transition:enter-end="transform translate-x-0"
                x-transition:leave="transition-transform ease-in duration-300"
                x-transition:leave-start="transform translate-x-0" x-transition:leave-end="transform translate-x-full"
                class="w-screen max-w-md">
                <div class="h-full flex flex-col py-6 bg-lightHeader shadow-xl dark:bg-darkHeader">
                  <!-- Sidebar Header -->
                  <div class="flex items-center justify-between px-4">
                    <button x-on:click="open = false" class="text-lightText dark:text-darkText">
                      <span class="sr-only">Close</span>
                      <xButton/>
                    </button>
                  </div>
                  <div
                    class="mt-4 px-4 h-20 w-[85%] shadow-md mx-5 rounded-md flex items-center bg-lightContainer dark:bg-darkContainer">
                    <p class="ml-2 text-lightText dark:text-darkText">
                      Halaman Utama
                    </p>
                  </div>
                  <div
                    class="mt-4 px-4 h-20 w-[85%] shadow-md mx-5 rounded-md flex items-center bg-lightContainer dark:bg-darkContainer">
                    <p class="ml-2 text-lightText dark:text-darkText">
                      World Class University
                    </p>
                  </div>
                  <div
                    class="mt-4 px-4 h-20 w-[85%] shadow-md mx-5 rounded-md flex items-center bg-lightContainer dark:bg-darkContainer">
                    <p class="ml-2 text-lightText dark:text-darkText">
                      Kelulusan Tepat Waktu
                    </p>
                  </div>
                  <div
                    class="mt-4 px-4 h-20 w-[85%] shadow-md mx-5 rounded-md flex items-center bg-lightContainer dark:bg-darkContainer">
                    <p class="ml-2 text-lightText dark:text-darkText">
                      Infografis
                    </p>
                  </div>
                  <!-- Sidebar Content -->
                  <div class="mt-4 px-4 h-full overflow-auto">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <!-- Card 1 -->
                      <div
                        class="bg-gray-50 hover:bg-gray-100 p-4 cursor-pointer rounded-md border border-gray-300 transition-colors duration-300">
                        <h3 class="text-lg font-semibold text-black mb-2">
                          Card 1
                        </h3>
                        <p class="text-gray-600">Content for card 1.</p>
                      </div>
                      <!-- Card 2 -->
                      <div
                        class="bg-gray-50 hover:bg-gray-100 p-4 cursor-pointer rounded-md border border-gray-300 transition-colors duration-300">
                        <h3 class="text-lg font-semibold text-black mb-2">
                          Card 2
                        </h3>
                        <p class="text-gray-600">Content for card 2.</p>
                      </div>
                    </div>
                  </div>
                  <!-- Sidebar Footer -->
                  <div class="mt-6 px-4">
                    <button class="flex justify-center items-center bg-white text-black rounded-md text-sm p-2 gap-1">
                      <FilterButton/>
                      Filters
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <button x-on:click="open = true">
            <div class="w-10 h-10 stroke-lightText dark:stroke-darkText my-2" id="burger">
              <!--Pembungkus svg-->
              <BurgerButton/>
            </div>
          </button>
        </div>
        <div class="h-full content-center ml-1 my-2 md:hidden">
          <div class="h-8 w-8 mt-1">
            <div class="relative w-full h-full overflow-hidden">
              <!--Mengambil tinggi dan lebar maximum-->
              <div :class="{ 'modeRotate': !isLightMode }" class="w-[200%] h-[200%] z-10 transition duration-1000" id="svg2">
                <!--Pembungkus svg-->
                <darkLight/>
              </div>
              <div class="absolute w-full h-full top-0 left-0 z-20 cursor-pointer" id="mode2" @click="toggleTheme"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex py-0 relative">
        <a href="./">
          <div class="h-full content-center items-center mr-12 flex">
            <div class="mr-1.5 h-8 w-8 md:h-11 md:w-11">
                <img hre src="../assets/logoUniv.png" alt="logo unila" />
            </div>
            <div class="text-base font-bold md:text-2xl">My"Own"-Unila</div>
          </div>
      </a>
        <div class="h-full content-center mr-2 leading-4 md:leading-7">Login</div>
      </div>
    </div>
    <!-- Baris Kedua -->
    <div id="baris2"
      class="border-t-4 h-10 border-y-lightText items-center px-4 space-x-5 content-center hidden md:flex dark:border-y-darkText transition duration-1000 leading-4 md:leading-7">
      <!--div a-->
      <span class="h-10 rounded flex items-center">
        <span class="flex items-center">
          <span class="h-10 w-10 flex items-center justify-center">
            <!--Pembungkus svg-->
            <HomeButton/>
          </span>
        </span>
        <span>Halaman Utama</span>
      </span>
      <span class="h-10 rounded flex items-center">
        <span class="flex items-center">
          <span class="h-10 w-10 flex items-center justify-center">
            <!--Pembungkus svg-->
            <WebButton/>
          </span>
        </span>
        <span>World Class University ▾</span>
      </span>
      <span class="h-10 rounded flex items-center">
        <span class="flex items-center">
          <span class="h-10 w-10 flex items-center justify-center">
            <!--Pembungkus svg-->
            <GraphsButton/>
          </span>
        </span>
        <span>Kelulusan Tepat Waktu</span>
      </span>
      <span class="h-10 rounded flex items-center">
        <span class="flex items-center">
          <span class="h-10 w-10 flex items-center justify-center">
            <!--Pembungkus svg-->
            <BarButton/>
          </span>
        </span>
        <span>Infografis </span>
      </span>
    </div>
  </header>
</template>

<script setup>
import BarButton from './icons/barButton.vue';
import BurgerButton from './icons/burgerButton.vue';
import darkLight from './icons/darkLight.vue';
import FilterButton from './icons/filterButton.vue';
import GraphsButton from './icons/graphsButton.vue';
import HomeButton from './icons/homeButton.vue';
import WebButton from './icons/WebButton.vue';
import xButton from './icons/xButton.vue';


import { ref, onMounted } from 'vue';
import { MainStore } from '@/stores/mainStore';
const store = MainStore();


// const theme = ref(MainStore.theme);
// Periksa tema di localStorage atau default ke 'light'
const isLightMode = ref(localStorage.theme !== 'dark');

// Fungsi untuk toggle tema
function toggleTheme() {
  isLightMode.value = !isLightMode.value;
  const newTheme = isLightMode.value ? 'light' : 'dark';
  store.setTheme(newTheme); // Simpan tema baru ke store
  applyTheme(); // Terapkan tema setelah diubah
}

// Fungsi untuk menerapkan tema
function applyTheme() {
  const html = document.querySelector('html');
  if (isLightMode.value) {
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
  }
}

// Terapkan tema saat komponen dimuat
onMounted(() => {
  const savedTheme = localStorage.theme || 'light';
  store.setTheme(savedTheme); // Set tema awal dari localStorage
  isLightMode.value = savedTheme === 'light';
  applyTheme();
});
</script>

