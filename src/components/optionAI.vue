<template>
    <div class="max-w-screen-md mx-auto mt-6 px-4 py-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
  
      <!-- Backend -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TF.js Backend</label>
        <select v-model="backend" :disabled="disabled" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white">
          <option value="cpu">CPU</option>
          <option value="webgl">WebGL</option>
          <option value="wasm">WASM</option>
          <option value="webgpu">WebGPU</option>
        </select>
      </div>
  
      <!-- Patience -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patience</label>
        <input :disabled="disabled" type="number" v-model="patience" min="1" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
      </div>
  
      <!-- Learning Rate -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Learning Rate</label>
        <input :disabled="disabled" type="number" step="0.001" v-model="learningRate" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
      </div>

      <!-- Hidden Layers -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hidden Layers</label>
        <input :disabled="disabled" type="number" step="1" v-model="hiddenSum" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
      </div>
  
      <!-- Hidden Layer Neurons -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hidden Layers Neurons(16,8 => 16 layer 1, 8 layer 2)</label>
        <input :disabled="disabled" type="text" v-model="neurons" class="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-700 dark:text-white" />
      </div>
  
      <!-- Action Buttons -->
      <div class="md:col-span-2 flex justify-end gap-4 mt-4">
        <button :disabled="disabled" @click="apply" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow">
          Apply
        </button>
        <button :disabled="disabled" @click="saveModel" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow">
          Save this Model
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, ref } from 'vue'
  import { MModelStore } from '@/stores/components/mmodelStore'
  const mmodel = MModelStore()
  const {disabled} = defineProps({
  disabled: Boolean
  })

  // import { ModelStore } from '@/stores/components/modelStore'
  // const model = ModelStore()


  const backend = ref('webgpu')
  const patience = ref(50)
  const learningRate = ref(0.005)
  const neurons = ref('64,32,16')
  const hiddenSum = ref('3')

  const splitedNeurons = computed(() =>
    neurons.value.split(",").map(n => parseInt(n.trim()))
  )
  const intHiddenSum = computed(() => parseInt(hiddenSum.value))

  const apply = () => {
    // kirim ke store atau emit
    mmodel.startInitial(backend.value, learningRate.value, patience.value, splitedNeurons.value, intHiddenSum.value)
    console.log('Apply config', { backend: backend.value, patience: patience.value, learningRate: learningRate.value, neurons: neurons.value })
  }
  
  const saveModel = () => {
    // simpan config
    console.log('Save config', { backend: backend.value, patience: patience.value, learningRate: learningRate.value, neurons: neurons.value })
  }
  </script>
  