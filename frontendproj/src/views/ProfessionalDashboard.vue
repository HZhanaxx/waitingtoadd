<template>
  <div class="dashboard-container">
    <Sidebar />
    
    <div class="main-content">
      <header class="dashboard-header">
        <div>
          <h1>👨‍💼 专业人士工作台</h1>
          <p class="subtitle">Professional Dashboard</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="$router.push('/case-pool')">
            📋 案件池
          </button>
          <div class="user-menu">
            <button class="btn btn-secondary" @click="toggleUserMenu">
              {{ authStore.userName }}
            </button>
            <div v-if="showUserMenu" class="dropdown-menu">
              <router-link to="/profile" class="menu-item">个人资料</router-link>
              <button @click="handleLogout" class="menu-item">退出登录</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Verification Status Alert -->
      <div v-if="verificationStatus !== 'approved'" class="verification-alert" :class="getVerificationClass()">
        <div class="alert-content">
          <span class="alert-icon">{{ getVerificationIcon() }}</span>
          <div>
            <strong>{{ getVerificationTitle() }}</strong>
            <p>{{ getVerificationMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            📊
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalCases }}</div>
            <div class="stat-label">总案件数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            ⏳
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingCases }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            ⚡
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.inProgressCases }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            ✅
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completedCases }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-btn', { active: currentTab === tab.value }]"
          @click="currentTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading"></div>
        <p>加载中...</p>
      </div>

      <!-- Cases list -->
      <div v-else-if="filteredCases.length > 0" class="cases-grid">
        <div
          v-for="caseItem in filteredCases"
          :key="caseItem.case_uuid"
          class="case-card professional-case"
          @click="viewCase(caseItem.case_uuid)"
        >
          <div class="case-header">
            <h3>{{ caseItem.title }}</h3>
            <span :class="['status-badge', `status-${caseItem.case_status}`]">
              {{ getStatusText(caseItem.case_status) }}
            </span>
          </div>
          <p class="case-description">{{ caseItem.description }}</p>
          <div class="case-meta">
            <span>📁 {{ caseItem.case_category }}</span>
            <span>💰 ¥{{ caseItem.budget_cny }}</span>
            <span>📅 {{ formatDate(caseItem.created_at) }}</span>
          </div>
          <div v-if="caseItem.client_name" class="case-client">
            👤 客户: {{ caseItem.client_name }}
          </div>
          <div class="case-actions">
            <button 
              v-if="caseItem.case_status === 'pending'"
              class="btn btn-sm btn-primary" 
              @click.stop="acceptCase(caseItem.case_uuid)"
            >
              接受案件
            </button>
            <button 
              v-if="caseItem.case_status === 'in_progress'"
              class="btn btn-sm btn-success" 
              @click.stop="completeCase(caseItem.case_uuid)"
            >
              标记完成
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>{{ getEmptyStateTitle() }}</h3>
        <p>{{ getEmptyStateMessage() }}</p>
        <button v-if="currentTab === 'pending'" class="btn btn-primary" @click="$router.push('/case-pool')">
          前往案件池
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/Sidebar.vue'
import api from '@/utils/api'

const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(false)
const cases = ref([])
const verificationStatus = ref('pending') // pending, approved, rejected
const showUserMenu = ref(false)
const currentTab = ref('all')

const stats = ref({
  totalCases: 0,
  pendingCases: 0,
  inProgressCases: 0,
  completedCases: 0
})

const tabs = [
  { label: '全部案件', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

// Computed
const filteredCases = computed(() => {
  if (currentTab.value === 'all') return cases.value
  return cases.value.filter(c => c.case_status === currentTab.value)
})

// Methods
const loadCases = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/api/professional/my-cases')
    cases.value = response.data.cases || []
    calculateStats()
  } catch (error) {
    console.error('Failed to load cases:', error)
    cases.value = []
  } finally {
    isLoading.value = false
  }
}

const loadVerificationStatus = async () => {
  try {
    const response = await api.get('/api/professional/verification-status')
    verificationStatus.value = response.data.status
  } catch (error) {
    console.error('Failed to load verification status:', error)
  }
}

const calculateStats = () => {
  stats.value.totalCases = cases.value.length
  stats.value.pendingCases = cases.value.filter(c => c.case_status === 'pending').length
  stats.value.inProgressCases = cases.value.filter(c => c.case_status === 'in_progress').length
  stats.value.completedCases = cases.value.filter(c => c.case_status === 'completed').length
}

const viewCase = (caseUuid) => {
  router.push(`/case/${caseUuid}`)
}

const acceptCase = async (caseUuid) => {
  try {
    await api.post(`/api/professional/cases/${caseUuid}/accept`)
    await loadCases()
  } catch (error) {
    console.error('Failed to accept case:', error)
    alert('接受案件失败')
  }
}

const completeCase = async (caseUuid) => {
  if (!confirm('确认标记此案件为已完成?')) return
  
  try {
    await api.post(`/api/professional/cases/${caseUuid}/complete`)
    await loadCases()
  } catch (error) {
    console.error('Failed to complete case:', error)
    alert('标记完成失败')
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getVerificationClass = () => {
  return {
    'alert-warning': verificationStatus.value === 'pending',
    'alert-danger': verificationStatus.value === 'rejected',
    'alert-info': verificationStatus.value === 'submitted'
  }
}

const getVerificationIcon = () => {
  const icons = {
    pending: '⏳',
    submitted: '📝',
    rejected: '❌',
    approved: '✅'
  }
  return icons[verificationStatus.value] || '⏳'
}

const getVerificationTitle = () => {
  const titles = {
    pending: '请完成专业认证',
    submitted: '认证审核中',
    rejected: '认证未通过'
  }
  return titles[verificationStatus.value] || ''
}

const getVerificationMessage = () => {
  const messages = {
    pending: '您需要完成专业认证后才能接受案件。请前往个人资料页面提交认证信息。',
    submitted: '您的认证资料正在审核中,请耐心等待。审核通过后即可开始接受案件。',
    rejected: '您的认证审核未通过,请检查并重新提交认证资料。'
  }
  return messages[verificationStatus.value] || ''
}

const getEmptyStateTitle = () => {
  const titles = {
    all: '暂无案件',
    pending: '暂无待处理案件',
    in_progress: '暂无进行中案件',
    completed: '暂无已完成案件'
  }
  return titles[currentTab.value] || '暂无案件'
}

const getEmptyStateMessage = () => {
  const messages = {
    all: '您还没有任何案件',
    pending: '您可以前往案件池查找并接受新案件',
    in_progress: '当前没有正在进行的案件',
    completed: '您还没有完成任何案件'
  }
  return messages[currentTab.value] || ''
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Lifecycle
onMounted(() => {
  loadCases()
  loadVerificationStatus()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 28px;
  margin-bottom: 4px;
}

.subtitle {
  color: #6c757d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 100;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  color: #2d2d2d;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f8f9fa;
}

.verification-alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border-left: 4px solid;
}

.verification-alert.alert-warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.verification-alert.alert-danger {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.verification-alert.alert-info {
  background: #d1ecf1;
  border-color: #17a2b8;
  color: #0c5460;
}

.alert-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.alert-icon {
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2d2d2d;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
}

.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e5e5;
}

.tab-btn {
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #2d2d2d;
}

.tab-btn.active {
  color: #11998e;
  border-bottom-color: #11998e;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #11998e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cases-grid {
  display: grid;
  gap: 16px;
}

.case-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.case-header h3 {
  font-size: 18px;
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-in_progress { background: #cfe2ff; color: #084298; }
.status-completed { background: #d1e7dd; color: #0f5132; }
.status-cancelled { background: #f8d7da; color: #842029; }

.case-description {
  color: #6c757d;
  margin-bottom: 16px;
  line-height: 1.6;
}

.case-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
}

.case-client {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 12px;
}

.case-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e5e5;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
