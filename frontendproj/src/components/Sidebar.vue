<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">⚖️</div>
        <span>法律助手</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">
          {{ userInitial }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ authStore.userName }}</div>
          <div class="user-role">{{ getRoleText(authStore.userRole) }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// Navigation items based on user role
const navigationItems = computed(() => {
  const role = authStore.userRole
  
  const commonItems = [
    { path: '/profile', icon: '👤', label: '个人资料' }
  ]

  if (role === 'admin') {
    return [
      { path: '/admin', icon: '📊', label: '管理面板' },
      { path: '/admin/users', icon: '👥', label: '用户管理' },
      { path: '/admin/cases', icon: '📋', label: '案件监控' },
      ...commonItems
    ]
  } else if (role === 'professional') {
    return [
      { path: '/professional', icon: '💼', label: '工作台' },
      { path: '/case-pool', icon: '📁', label: '案件池' },
      { path: '/professional/my-cases', icon: '📋', label: '我的案件' },
      ...commonItems
    ]
  } else {
    return [
      { path: '/dashboard', icon: '🏠', label: '我的案件' },
      { path: '/cases/new', icon: '➕', label: '新建案件' },
      ...commonItems
    ]
  }
})

// Check if route is active
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Get user initial
const userInitial = computed(() => {
  const name = authStore.userName || 'U'
  return name.charAt(0).toUpperCase()
})

// Get role text
const getRoleText = (role) => {
  const roleMap = {
    'admin': '管理员',
    'professional': '专业人员',
    'user': '普通用户'
  }
  return roleMap[role] || role
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2d2d2d;
}

.logo-icon {
  font-size: 28px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #2d2d2d;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e5e5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #2d2d2d;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }

  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 12px;
  }

  .nav-item {
    flex-direction: column;
    gap: 4px;
    min-width: 80px;
    text-align: center;
  }

  .nav-label {
    font-size: 12px;
  }
}
</style>
