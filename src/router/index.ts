import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/schulte',
      name: 'Schulte',
      component: () => import('@/games/schulte/index.vue')
    }
  ]
})

export default router
