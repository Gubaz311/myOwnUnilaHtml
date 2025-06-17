<script setup>
import { MainStore } from '@/stores/mainStore';
import { computed } from 'vue';
const store = MainStore();

//Getting values from memory
const ps = computed(() => store.optionInfo.prodi)
const y = computed(() => store.optionInfo.year)

const calc = () => {
    store.TrainAI();
    store.setData(ps.value, y.value)
}


const teks = computed(() => {
    return store.isPredicted ? "Back to non AI" : "Calc by AI"
})
</script>

<template>
    <div class="container rounded-md mt-8 my-2 bg-lightMain dark:bg-darkMain flex justify-end ">
        <button class="bg-lightHeader dark:bg-darkHeader text-lightText dark:text-darkText hover:bg-lightIconFocus dark:hover:bg-darkIconFocus shadow-md rounded-md p-2 mr-10 w-32 md:w-40 font-aktivBold text-sm md:text-xl" @click="calc" >
            {{ teks }}
        </button>
    </div> 
</template>