import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/board',
    name: 'board-list',
    component: () => import('../views/BoardListView.vue')
  },
  {
    path: '/board/write',
    name: 'board-write',
    component: () => import('../views/BoardWriteView.vue')
  },
  {
    path: '/board/edit/:id',
    name: 'board-edit',
    component: () => import('../views/BoardWriteView.vue'),
    props: true
  },
  {
    path: '/board/:id',
    name: 'board-detail',
    component: () => import('../views/BoardDetailView.vue'),
    props: true
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('../views/MapView.vue')
  }
  ,
  {
    path: '/places',
    name: 'places-list',
    component: () => import('../views/CategoryListView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router