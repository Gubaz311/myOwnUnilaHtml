<script setup>
import {  computed, ref } from 'vue';
import { MainStore } from '@/stores/mainStore';

const store = ref(MainStore())
const msg = computed(() => store.value.getTeksLoading.value);

</script>

<template>
    <div class="container bg-lightContainer dark:bg-darkContainer shadow-md rounded-md mt-3 mb-44 border h-72 p-5 flex items-center justify-center">
        <div class="flex items-center justify-center">
            <span class="text-4xl text-lightText dark:text-darkText" >
                {{ msg }}
            </span>
            <span class="w-3 h-3 ml-4 animate-ping rounded-full bg-lightIcon dark:bg-darkIcon"></span>

        </div>
    </div>
</template>
