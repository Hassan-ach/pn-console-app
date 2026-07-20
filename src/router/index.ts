import { createRouter, createWebHashHistory } from 'vue-router';
import InsightsPage from '../views/InsightsPage.vue';
import InsightDetailPage from '../views/InsightDetailPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
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

export default router;
