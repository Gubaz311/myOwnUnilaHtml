<script setup>
import { MainStore } from '@/stores/mainStore';
const store = MainStore();

//Getting values from memory
const ps = store.memory.fakultas
const y = store.memory.tahun

const calc = () => {
    if(confirm("this will might take some time and memory")){
        store.fetchDataLulus(ps, y)
    }
}
</script>

<template>
    <div class="container rounded-md my-2 bg-lightMain dark:bg-darkMain flex justify-end ">
        <button class="bg-lightHeader dark:bg-darkHeader text-lightText dark:text-darkText hover:bg-lightIconFocus dark:hover:bg-darkIconFocus shadow-md rounded-md p-2 mr-10 w-28 md:w-32 font-aktivBold text-sm md:text-xl" @click="calc" >
            Calc by AI
        </button>
    </div> 
</template>