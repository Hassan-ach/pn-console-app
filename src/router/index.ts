import { createRouter, createWebHistory } from 'vue-router'
import InsightsExtractorServiceDemoUi from '../components/pages/InsightsExtractorServiceDemoUi.vue'

const routes = [
  {
    path: '/insights-service-demo',
    name: 'insights-service-demo',
    component: InsightsExtractorServiceDemoUi,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
