<template>
  <div class="font-aktivMedium text-base text-lightText dark:text-darkText">
    <!-- Section Summary Model -->
    <div class="container p-2 sm:p-0 mb-14">
      <h1 class="text-2xl text-center font-aktivBold mb-1">
        Ringkasan Model
      </h1>

      <div class="overflow-x-auto">
          <div class="max-h-[300px] sm:max-h-[500px] overflow-y-auto rounded-lg shadow-sm border border-lightFooter dark:border-darkFooter bg-lightContainer dark:bg-darkContainer">
          <table class="w-full table-auto text-sm sm:text-base text-left">
          <thead class="font-aktivBold sticky top-0 text-center z-10 shadow-lg bg-lightHeader dark:bg-darkHeader">
              <tr>
                  <th class="px-2 py-1 sm:px-4 sm:py-2">Index</th>
                  <th class="px-2 py-1 sm:px-4 sm:py-2">True</th>
                  <th class="px-2 py-1 sm:px-4 sm:py-2">Prediksi</th>
                  <th class="px-2 py-1 sm:px-4 sm:py-2">Prob</th>
              </tr>
          </thead>
          <tbody class="text-center">
          <tr v-for="(truth, index) in getSummaryModel.real" :key="index" class="hover:bg-lightMain dark:hover:bg-darkMain transition" :class="colorMap(truth, getSummaryModel.predRounded[index])">
              <td class="px-2 py-1 sm:px-4 sm:py-2 border-b">{{ index }}</td>
              <td class="px-2 py-1 sm:px-4 sm:py-2 border-b">{{ truth }}</td>
              <td class="px-2 py-1 sm:px-4 sm:py-2 border-b">
                {{ getSummaryModel.predRounded[index] }}
              </td>
              <td class="px-2 py-1 sm:px-4 sm:py-2 border-b">
                {{ getSummaryModel.pred[index].toFixed(2) }}
              </td>
          </tr>
          </tbody>
          <tfoot class="sticky bottom-0 z-10 bg-lightHeader dark:bg-darkHeader">
            <tr>
              <td colspan="2" class="text-right font-bold">Precision</td>
              <td colspan="2" class="text-center">{{ summaryModel.precision }}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right font-bold">Recall</td>
              <td colspan="2" class="text-center">{{ summaryModel.recall }}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right font-bold">Accuracy</td>
              <td colspan="2" class="text-center">{{ summaryModel.accuracy }}</td>
            </tr>
            <tr>
              <td colspan="2" class="text-right font-bold">F1-Score</td>
              <td colspan="2" class="text-center">{{ summaryModel.f1Score }}</td>
            </tr>
          </tfoot>
          </table>
          </div>
      </div>
    </div>


    <!-- Section Summary Data -->
    <div class="container p-2 sm:p-0 mb-14">
        <h1 class="text-2xl text-center font-aktivBold mb-1">
            Ringkasan Data
        </h1>
        <div class="overflow-x-auto">
            <div class="max-h-[300px] sm:max-h-[500px] overflow-y-auto rounded-lg shadow-sm border border-lightFooter dark:border-darkFooter bg-lightContainer dark:bg-darkContainer">
            <table class="w-full table-auto text-sm sm:text-base text-left">
            <thead class="font-aktivBold sticky top-0 text-center z-10 shadow-lg bg-lightHeader dark:bg-darkHeader">
                <tr>
                <th class="w-1/2 px-2 py-1 sm:px-4 sm:py-2 text-left border border-lightFooter dark:border-darkFooter">Tahap</th>
                <th class="w-1/6 px-2 py-1 sm:px-4 sm:py-2 border border-lightFooter dark:border-darkFooter">Jumlah Fitur</th>
                <th class="w-1/6 px-2 py-1 sm:px-4 sm:py-2 border border-lightFooter dark:border-darkFooter">Outlier Dihapus</th>
                <th class="w-1/6 px-2 py-1 sm:px-4 sm:py-2 border border-lightFooter dark:border-darkFooter">Jumlah Data</th>
                </tr>
            </thead>
            <tbody>
                <tr class="hover:bg-lightMain dark:hover:bg-darkMain transition" v-for="row in summaryRows" :key="row.tahap">
                <td class="w-1/2 px-4 py-2 text-left border border-lightFooter dark:border-darkFooter">{{ row.tahap }}</td>
                <td class="w-1/6 px-4 py-2 text-center border border-lightFooter dark:border-darkFooter">{{ row.features }}</td>
                <td class="w-1/6 px-4 py-2 text-center border border-lightFooter dark:border-darkFooter">{{ row.deleted }}</td>
                <td class="w-1/6 px-4 py-2 text-center border border-lightFooter dark:border-darkFooter">{{ row.after }}</td>
                </tr>
            </tbody>
            </table>
            </div>

        </div>
    </div>

    <!-- Section one hot -->
    <div class="container p-2 sm:p-0 mb-14">
        <h1 class="text-2xl text-center font-aktivBold mb-1">
            Ringkasan One-Hot Encoding
        </h1>
    <div class="overflow-x-auto">
      <div class="max-h-[300px] sm:max-h-[500px] overflow-y-auto rounded-lg shadow-sm border border-lightFooter dark:border-darkFooter bg-lightContainer dark:bg-darkContainer">
        <table class="w-full table-auto text-sm sm:text-base text-left">
        <thead class="font-aktivBold sticky top-0 text-center z-10 shadow-lg bg-lightHeader dark:bg-darkHeader">
          <tr>
          <th class="w-1.5/6 px-2 py-1 sm:px-4 sm:py-2 text-center border border-lightFooter dark:border-darkFooter">Kunci</th>
          <th class="w-4/6 px-2 py-1 sm:px-4 sm:py-2 text-center border border-lightFooter dark:border-darkFooter">Vektor One-Hot</th>
          <th class="w-0.5/6 px-2 py-1 sm:px-4 sm:py-2 text-center border border-lightFooter dark:border-darkFooter">Indeks Aktif</th>
          </tr>
        </thead>
        <tbody>
        <template v-for="(kategori, kategoriKey) in dataMaps" :key="kategoriKey">
            <tr>
            <td :colspan="3" class="bg-lightHeader dark:bg-darkHeader font-aktivRegular text-center border border-lightFooter dark:border-darkFooter">
                {{ capitalizeFirst(kategoriKey) }}
            </td>
            </tr>
            <tr v-for="(vektor, kunci) in kategori" :key="kunci">
            <td class="w-1.5/6 px-2 py-1 sm:px-4 sm:py-2 border border-lightFooter dark:border-darkFooter">{{ capitalizeFirst(kunci) }}</td>
            <td class="w-4/6 px-2 py-1 sm:px-4 sm:py-2 border border-lightFooter dark:border-darkFooter whitespace-nowrap overflow-x-auto max-w-[300px]">
                <div class="flex flex-wrap gap-1 max-w-full overflow-x-auto">
                <span
                    v-for="(val, i) in vektor"
                    :key="i"
                    :class="['inline-block text-xs px-1 py-0.5 rounded',
                    val === 1
                        ? 'bg-blue-400 text-white'
                        : 'bg-gray-100 dark:bg-darkMain text-gray-500 dark:text-gray-300']"
                >{{ val }}</span>
                </div>
            </td>
            <td class="w-0.5/6 px-2 py-1 sm:px-4 sm:py-2 text-center border border-lightFooter dark:border-darkFooter">
                {{ vektor.findIndex(v => v === 1)}}
            </td>
            </tr>
        </template>
        </tbody>
        </table>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { MModelStore } from '@/stores/components/mmodelStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
const model = MModelStore();

// Summary model data
const getSummaryModel = computed(() => {
  const summary = model.getTestingSummary;
  return {
    ...summary,
    predRounded: summary.pred.map(pred => pred >= 0.5 ? 1 : 0) // Thresholding at 0.5
  }
});

// Accuracy, precision, recall, f1-score
const summaryModel = computed(() => {
  let TP = 0, FP = 0, FN = 0, TN = 0;
  let banyak1 = 0, banyak0 = 0;
  for (let i = 0; i < getSummaryModel.value.real.length; i++){
    const pred = getSummaryModel.value.predRounded[i];
    const label = getSummaryModel.value.real[i];

    if(label === 1) banyak1++;
    else if(label === 0) banyak0++;

    if (pred === 1 && label === 1) TP++; // True Positive
    else if (pred === 1 && label === 0) FP++; // False Positive
    else if (pred === 0 && label === 1) FN++; // False Negative
    else if (pred === 0 && label === 0) TN++; // True Negative
  }

  console.log("getSumamaryModel.value:", getSummaryModel.value);
  console.log(`1 VS 0 TestingData: ${banyak1} vs ${banyak0}`);
  
  const accuracyFormula = (TP + TN) / (TP + FP + TN + FN || 1);
  const accuracy = (accuracyFormula * 100).toFixed(2) + "%"
  const precisionFormula = TP / (TP + FP || 1);
  const precision = (precisionFormula * 100).toFixed(2) + "%";
  const recallFormula = TP / (TP + FN || 1);
  const recall = (recallFormula * 100).toFixed(2) + "%";
  const f1ScoreFormula = (precisionFormula + recallFormula === 0)
    ? 0
    : (2*precisionFormula*recallFormula)/(precisionFormula + recallFormula);
  const f1Score = (f1ScoreFormula * 100).toFixed(2) + "%";
  return {accuracy, precision, recall, f1Score};
})

// ColorMap
function colorMap(real, pred){
  return (real === pred) 
  ? 'bg-green-500/5 border border-green-500/10'
  : 'bg-red-500/5 border border-red-500/10'
}

// Total data step summary
const totalDataStep = computed(() => model.getTotalDataStep);
const summaryRows = computed(() => {
  const arr = [];
  const dataStep = totalDataStep.value;
  if (!dataStep) return arr;

  for (const [key, value] of Object.entries(dataStep)) {
    if (value && (value.after !== undefined || value.features !== undefined || value.feature !== undefined)) {
      arr.push({
        tahap: capitalizeFirst(key),
        after: value.after ?? '-',
        deleted: value.deleted ?? '-',
        features: value.features ?? value.feature ?? '-'
      });
    } else if (typeof value === 'object' && value !== null) {
      // Nested (cleanOutliers, dst)
      for (const [subKey, subValue] of Object.entries(value)) {
        arr.push({
          tahap: `${capitalizeFirst(key)} ${capitalizeFirst(subKey)}`,
          after: subValue.after ?? '-',
          deleted: subValue.deleted ?? '-',
          features: subValue.features ?? subValue.feature ?? '-'
        });
      }
    }
  }
  return arr;
})

function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return '';

  // Step 1: Ubah camelCase ke "Camel Case"
  let clean = str.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Step 2: Trim & hapus spasi ganda
  clean = clean.trim().replace(/\s+/g, ' ');

  // Step 3: Hitung panjang tanpa spasi
  const lenNoSpace = clean.replace(/\s/g, '').length;

  // Step 4: ≤ 4 karakter → kapital semua
  if (lenNoSpace <= 4) {
    return clean.toUpperCase();
  }

  // Step 5: Kapital tiap kata
  return clean
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// One-hot encoding data
const { dataMaps } = storeToRefs(model);


</script>