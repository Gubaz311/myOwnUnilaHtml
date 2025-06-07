import { createRouter, createWebHistory } from 'vue-router'
import reportModel from '@/views/reportModel.vue'
import KtwView from '@/views/ktwView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: KtwView
    },
    {
      path: '/report',
      name: 'ReportModel',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: reportModel
    }
  ]
})

export default router
