import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy load components for better performance
const Login = () => import('@/views/Login.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const ProfessionalDashboard = () => import('@/views/ProfessionalDashboard.vue')
const AdminDashboard = () => import('@/views/AdminDashboard.vue')
const Profile = () => import('@/views/Profile.vue')
const CaseDetail = () => import('@/views/CaseDetail.vue')
const CasePool = () => import('@/views/CasePool.vue')
const QuestionnairePage = () => import('@/views/QuestionnairePage.vue')  // ✨ Added questionnaire page
const Unauthorized = () => import('@/views/Unauthorized.vue')
const NotFound = () => import('@/views/NotFound.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: '登录 - 法律助手'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { 
      requiresAuth: true,
      roles: ['user'],
      title: '我的案件 - 法律助手'
    }
  },
  {
    path: '/professional',
    name: 'ProfessionalDashboard',
    component: ProfessionalDashboard,
    meta: { 
      requiresAuth: true,
      roles: ['professional'],
      title: '专业人员面板 - 法律助手'
    }
  },
  {
    path: '/Admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { 
      requiresAuth: true,
      roles: ['admin'],
      title: '管理员面板 - 法律助手'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { 
      requiresAuth: true,
      title: '个人资料 - 法律助手'
    }
  },
  {
    path: '/case/:id',
    name: 'CaseDetail',
    component: CaseDetail,
    meta: { 
      requiresAuth: true,
      title: '案件详情 - 法律助手'
    },
    props: true
  },
  {
    path: '/case-pool',
    name: 'CasePool',
    component: CasePool,
    meta: { 
      requiresAuth: true,
      roles: ['professional'],
      title: '案件池 - 法律助手'
    }
  },
  // ✨ Added: Questionnaire route
  {
    path: '/questionnaire/:sessionId',
    name: 'Questionnaire',
    component: QuestionnairePage,
    meta: { 
      requiresAuth: true,
      roles: ['user'],
      title: '问卷填写 - 法律助手'
    },
    props: true
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: Unauthorized,
    meta: {
      title: '无权访问 - 法律助手'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到 - 法律助手'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard for authentication and authorization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  document.title = to.meta.title || '法律助手'

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // User not authenticated
    if (!authStore.isAuthenticated) {
      // Try to restore session
      await authStore.init()
      
      if (!authStore.isAuthenticated) {
        // Redirect to login with return URL
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    }

    // Check role-based access
    if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
      console.warn(`Access denied: User role ${authStore.userRole} not in allowed roles ${to.meta.roles}`)
      next({ name: 'Unauthorized' })
      return
    }
  }

  // Redirect authenticated users away from login page
  if (to.name === 'Login' && authStore.isAuthenticated) {
    const dashboardRoute = getDashboardRoute(authStore.userRole)
    next({ name: dashboardRoute })
    return
  }

  // Continue navigation
  next()
})

// Helper function to get dashboard route based on role
function getDashboardRoute(role) {
  switch (role) {
    case 'admin':
      return 'AdminDashboard'
    case 'professional':
      return 'ProfessionalDashboard'
    case 'user':
    default:
      return 'Dashboard'
  }
}

// Error handler for navigation failures
router.onError((error) => {
  console.error('Router error:', error)
})

export default router
