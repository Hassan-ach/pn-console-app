<template>
  <div style="margin: 2rem auto; font-family: sans-serif; width: 100%">
    <h1>Insight Extraction Demo</h1>

    <button @click="loadSample">Load Sample Data</button>
    <button @click="runExtraction" :disabled="loading" style="margin-left: 0.5rem;">
      {{ loading ? 'Running...' : 'Run Extraction' }}
    </button>
    <p v-if="error" style="color: red;">{{ error }}</p>

    <h2>History:</h2>
    <textarea
      v-model="historyText"
      :rows="historyRows"
      style="width: 100%; font-family: monospace; resize: vertical;"
    ></textarea>
    
    <h2>New Messages:</h2>
    <textarea
      v-model="messagesText"
      :rows="messagesRows"
      style="width: 100%; font-family: monospace; resize: vertical;"
    ></textarea>

    <h2>Extracted Insights:</h2>
    <ul v-if="allExtracted.length">
      <li v-for="(i, idx) in allExtracted" :key="idx">
        <strong>{{ i.label }}</strong> ({{ i.type }}) {{ i.content }}
      </li>
    </ul>
    <p v-else><em>There is nothing new to be extracted</em></p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import extractInsights from '../../services/InsightExtractorService'
import type { InsightExtractionResult } from '../../services/InsightExtractorService/InsightSchema'
import type { InputInsight, InputMessage } from '../../services/InsightExtractorService/types'

const sampleHistory: InputInsight[] = [
  { id: 1, type: 'TASK', content: 'Send the Q3 budget report to the finance team' },
  { id: 2, type: 'URGENCY', content: 'Production server CPU usage spiking above 90%, needs immediate investigation' },
  { id: 3, type: 'INFO', content: 'Client prefers communication via email, not phone' },
  { id: 4, type: 'DECISION', content: 'Approve or reject the proposal to migrate the database to PostgreSQL next quarter' },
  { id: 5, type: 'TASK', content: 'Schedule a 1:1 meeting with the new hire Sarah' },
]

const sampleMessages: InputMessage[] = [
  { id: 1, content: 'Hey, just letting you know I sent the Q3 budget report to finance this morning, all done.' },
  { id: 2, content: 'CPU spike was caused by a runaway cron job. We killed it, usage is back to normal. No further action needed.' },
  { id: 3, content: 'Actually feel free to call me directly for urgent matters, email is fine for everything else.' },
  { id: 4, content: 'We need to order two new laptops for the design team before the next sprint kicks off.' },
]

const historyText = ref(JSON.stringify(sampleHistory, null, 2))
const messagesText = ref(JSON.stringify(sampleMessages, null, 2))
const result = ref<InsightExtractionResult | null>(null)
const error = ref('')
const loading = ref(false)

const historyRows = computed(() => historyText.value.split('\n').length)
const messagesRows = computed(() => messagesText.value.split('\n').length)

const allExtracted = computed(() => {
  if (!result.value) return []
  return [
    ...result.value.updatedInsights.map(i => ({
      label: `[updated #${i.id}]`,
      type: i.type,
      content: i.content,
    })),
    ...result.value.newInsights.map(i => ({
      label: '[new]',
      type: i.type,
      content: i.content,
    })),
  ]
})

function loadSample() {
  historyText.value = JSON.stringify(sampleHistory, null, 2)
  messagesText.value = JSON.stringify(sampleMessages, null, 2)
  result.value = null
  error.value = ''
}

async function runExtraction() {
  error.value = ''
  result.value = null
  loading.value = true
  try {
    const history: InputInsight[] = JSON.parse(historyText.value)
    const messages: InputMessage[] = JSON.parse(messagesText.value)
    result.value = await extractInsights(history, messages)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>
