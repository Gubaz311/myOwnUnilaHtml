<template>
    <div class="container bg-lightContainer dark:bg-darkContainer mt-3 text-base font-aktivRegular leading-6 sm:leading-5"> 
        <div class="flex flex-wrap justify-center text-center items-center min-h-10 text-lightText dark:text-darkText"> 
            <div class="w-full px-4 lg:w-1/2 font-semibold">Kelulusan Tepat Waktu</div>
            <div class="w-full px-4 lg:w-1/2 flex justify-evenly p-2 items-center">
                <select @change="handleChange" v-model="ps" class=" flex h-10 rounded-md bg-lightHeader dark:bg-darkHeader border border-lightText dark:border-darkText text-lightText dark:text-darkText brightness-110 items-center p-2 hover:opacity-85 focus:ring-2 focus:ring-lightFooter dark:focus:ring-darkFooter focus:ring-offset-2 focus:ring-offset-gray-100">
                    <option value="all">Semua Prodi</option>
                    <option value="1">FEB</option>
                    <option value="2">Hukum</option>
                    <option value="3">FISIP</option>
                    <option value="4">Kedokteran</option>
                    <option value="5">FKIP</option>
                    <option value="6">FMIPA</option>
                    <option value="7">Pertanian</option>
                    <option value="8">Teknik</option>
                </select>
                <select @change="handleChange" v-model="year" class="flex h-10 rounded-md bg-lightHeader dark:bg-darkHeader border border-lightText dark:border-darkText text-lightText dark:text-darkText brightness-110 items-center p-2 hover:opacity-85 focus:ring-2 focus:ring-lightFooter dark:focus:ring-darkFooter focus:ring-offset-2 focus:ring-offset-gray-100">
                    <option value="2010-2012">2010-2012</option>
                    <option value="2012-2014">2012-2014</option>
                    <option value="2014-2016">2014-2016</option>
                    <option value="2019-2020">2019-2020</option>
                    <option value="2020-2021">2020-2021</option>
                    <option value="2021-2022">2021-2022</option>
                    <option value="2000-2099">ALL DATA</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { MainStore } from '@/stores/mainStore';
const store = MainStore();

let ps = ref('all')
let year = ref('2010-2012')

let splitedYear = computed(() => year.value.split("-"));

const handleChange = () => {
    store.setData(ps.value, splitedYear.value)
}

onBeforeMount(() => {
    store.setData(ps.value, splitedYear.value)
})

</script>
