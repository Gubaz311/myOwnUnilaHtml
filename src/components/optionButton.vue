<template>
    <div class="container mt-3 text-base font-aktivRegular leading-6 sm:leading-5"> 
        <div class="flex flex-wrap justify-center text-center items-center min-h-10 text-lightText dark:text-darkText"> 
            <div class="w-full px-4 lg:w-1/2 font-semibold text-2xl">Kelulusan Tepat Waktu</div>
            <div class="w-full px-4 lg:w-1/2 flex justify-evenly p-2 items-center">
                <select @change="handleChange" v-model="ps" class=" flex h-10 rounded-md bg-lightHeader dark:bg-darkHeader border border-lightText dark:border-darkText text-lightText dark:text-darkText brightness-110 items-center p-2 hover:opacity-85 focus:ring-2 focus:ring-lightFooter dark:focus:ring-darkFooter focus:ring-offset-2 focus:ring-offset-gray-100 w-48 truncate overflow-hidden">
                    <option value="all">Semua Prodi</option>
                    <option value="4131">Agribisnis</option>
                    <option value="4161">Agronomi</option>
                    <option value="4121">Agroteknologi</option>
                    <option value="1031">Akutansi</option>
                    <option value="5012">Arsitektur</option>
                    <option value="3052">BIMB. Konseling</option>
                    <option value="7021">Biologi</option>
                    <option value="7061">Biologi Terapan</option>
                    <option value="1012">Bisnis Digital</option>
                    <option value="4111">Budidaya Perairan</option>
                    <option value="1021">Ekonomi Pembangunan</option>
                    <option value="8031">Farmasi</option>
                    <option value="7041">Fisika</option>
                    <option value="6071">Hubungan Internasional</option>
                    <option value="6041">Ilmu ADM. Negara</option>
                    <option value="6051">Ilmu ADM. Niaga</option>
                    <option value="2011">Ilmu Hukum</option>
                    <option value="4221">Ilmu Kelautan</option>
                    <option value="7051">Ilmu Komputer</option>
                    <option value="6031">Ilmu Komunikasi</option>
                    <option value="6021">Ilmu Pemerintahan</option>
                    <option value="4181">Ilmu Tanah</option>
                    <option value="4151">Kehutanan</option>
                    <option value="7011">Kimia</option>
                    <option value="1011">Manajemen</option>
                    <option value="7031">Matematika</option>
                    <option value="1424">Nutrisi dan Teknologi Pakan Ternak</option>
                    <option value="3041">Pend. Bahasa dan Sastra Indonesia</option>
                    <option value="3042">Pend. Bahasa Inggris</option>
                    <option value="3046">Pend. Bahasa Lampung</option>
                    <option value="3044">Pend. Bahasa Prancis</option>
                    <option value="3024">Pend. Biologi</option>
                    <option value="8011">Pend. Dokter</option>
                    <option value="3031">Pend. Ekonomi</option>
                    <option value="3022">Pend. Fisika</option>
                    <option value="3034">Pend. Geografi</option>
                    <option value="3032">Pend. Pancasila dan Kewarnegaraan</option>
                    <option value="3054">Pend. Guru Pendidikan Anak Usia Dini</option>
                    <option value="3053">Pend. Guru Sekolah Dasar</option>
                    <option value="3051">Pend. Jasmani</option>
                    <option value="3023">Pend. Kimia</option>
                    <option value="3021">Pend. Matematika</option>
                    <option value="3045">Pend. Musik</option>
                    <option value="3033">Pend. Sejarah</option>
                    <option value="3043">Pend. Tari</option>
                    <option value="3025">Pend. Teknologi Informasi</option>
                    <option value="4211">Penyuluhan Pertanian</option>
                    <option value="4141">Peternakan</option>
                    <option value="4191">Proteksi Tanaman</option>
                    <option value="6011">Sosiologi</option>
                    <option value="4201">Sumberdaya Akuatik</option>
                    <option value="5031">Teknik Elektro</option>
                    <option value="5071">Teknik Geodesi</option>
                    <option value="5051">Teknik Geofisika</option>
                    <option value="5061">Teknik Informatika</option>
                    <option value="5041">Teknik Kimia</option>
                    <option value="5014">Teknik Lingkungan</option>
                    <option value="5021">Teknik Mesin</option>
                    <option value="4071">Teknik Pertanian</option>
                    <option value="5011">Teknik Sipil</option>
                    <option value="4051">Teknologi Hasil Pertanian</option>
                    <option value="4231">Teknologi Industri Pertanian</option>
                    <option value="5022">Teknologi Rekayasa Otomotif</option>
                </select>
                <select @change="handleChange" v-model="year" class="flex h-10 rounded-md bg-lightHeader dark:bg-darkHeader border border-lightText dark:border-darkText text-lightText dark:text-darkText brightness-110 items-center p-2 hover:opacity-85 focus:ring-2 focus:ring-lightFooter dark:focus:ring-darkFooter focus:ring-offset-2 focus:ring-offset-gray-100">
                    <option value="2018-2018">2018-2018</option>
                    <option value="2018-2019">2018-2019</option>
                    <option value="2019-2020">2019-2020</option>
                    <option value="2020-2021">2020-2021</option>
                    <option value="2021-2022">2021-2022</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2018-2023">ALL DATA</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { MainStore } from '@/stores/mainStore';
const store = MainStore();

// let ps = ref('4131')
let ps = ref('5061')
let year = ref('2018-2023')

let splitedYear = computed(() => year.value.split("-"));

const handleChange = () => {
    store.setData(ps.value, splitedYear.value)
}

onBeforeMount(() => {
    store.setData(ps.value, splitedYear.value)
})

</script>
