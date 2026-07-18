import { createRouter, createMemoryHistory } from 'vue-router';
import InsightsPage from '../views/InsightsPage.vue';
import InsightDetailPage from '../views/InsightDetailPage.vue';

export const insightsRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', redirect: '/insights' },
    {
      path: '/insights',
      name: 'insights',
      component: InsightsPage,
    },
    {
      path: '/insights/:id',
      name: 'insight-detail',
      component: InsightDetailPage,
      props: true,
    },
  ],
});
