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
  }
  // TODO(선택 기능 담당자): 지도 시각화 화면을 별도 라우트로 뺄 경우 여기에 추가
  // { path: '/map', name: 'map', component: () => import('../views/MapView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
