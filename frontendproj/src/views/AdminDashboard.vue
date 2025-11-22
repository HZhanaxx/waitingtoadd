<template>
  <div class="dashboard-container">
    <Sidebar />
    
    <div class="main-content">
      <header class="dashboard-header">
        <div>
          <h1>🛡️ 管理员面板</h1>
          <p class="subtitle">Admin Dashboard - 系统管理</p>
        </div>
      </header>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">👨‍💼</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalProfessionals }}</div>
            <div class="stat-label">专业人员</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalCases }}</div>
            <div class="stat-label">总案件</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #feca57 0%, #ff6b6b 100%);">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingVerifications }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button v-for="tab in tabs" :key="tab.value" :class="['tab-btn', { active: currentTab === tab.value }]" @click="switchTab(tab.value)">
          {{ tab.label }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading"></div>
        <p>加载中...</p>
      </div>

      <!-- Tab Content -->
      <div v-else class="tab-content">
        <!-- Verifications -->
        <div v-if="currentTab === 'verifications'">
          <div v-if="verifications.length > 0" class="verification-list">
            <div v-for="verification in verifications" :key="verification.id" class="verification-card">
              <div class="verification-header">
                <div>
                  <h3>{{ verification.professional_name }}</h3>
                  <p class="verification-date">{{ formatDate(verification.submitted_at) }}</p>
                </div>
                <span :class="['status-badge', `status-${verification.status}`]">{{ verification.status }}</span>
              </div>
              <div class="verification-details">
                <div class="detail-row"><span class="label">专业领域:</span><span>{{ verification.specialization }}</span></div>
                <div class="detail-row"><span class="label">执业证号:</span><span>{{ verification.license_number }}</span></div>
                <div class="detail-row"><span class="label">工作单位:</span><span>{{ verification.organization }}</span></div>
                <div class="detail-row"><span class="label">从业年限:</span><span>{{ verification.years_experience }} 年</span></div>
              </div>
              <div v-if="verification.status === 'submitted'" class="verification-actions">
                <button class="btn btn-success" @click="approveVerification(verification.id)">✅ 通过</button>
                <button class="btn btn-danger" @click="rejectVerification(verification.id)">❌ 拒绝</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>暂无待审核认证</h3>
          </div>
        </div>

        <!-- Users -->
        <div v-if="currentTab === 'users'">
          <div class="filters-section">
            <select v-model="userFilters.role" class="input" @change="loadUsers">
              <option value="">全部</option>
              <option value="user">普通用户</option>
              <option value="professional">专业人员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div v-if="users.length > 0" class="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.user_id">
                  <td>{{ user.user_id }}</td>
                  <td>{{ user.full_name || '未设置' }}</td>
                  <td>{{ user.phone }}</td>
                  <td><span class="role-badge">{{ getRoleText(user.role) }}</span></td>
                  <td><span :class="['status-badge', user.is_active ? 'status-active' : 'status-inactive']">{{ user.is_active ? '活跃' : '禁用' }}</span></td>
                  <td>{{ formatDate(user.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>暂无用户</h3>
          </div>
        </div>

        <!-- Cases -->
        <div v-if="currentTab === 'cases'">
          <div v-if="cases.length > 0" class="cases-grid">
            <div v-for="caseItem in cases" :key="caseItem.case_uuid" class="case-card" @click="$router.push(`/case/${caseItem.case_uuid}`)">
              <div class="case-header">
                <h3>{{ caseItem.title }}</h3>
                <span :class="['status-badge', `status-${caseItem.case_status}`]">{{ getStatusText(caseItem.case_status) }}</span>
              </div>
              <p class="case-description">{{ caseItem.description }}</p>
              <div class="case-meta">
                <span>📁 {{ caseItem.case_category }}</span>
                <span>💰 ¥{{ caseItem.budget_cny }}</span>
                <span>📅 {{ formatDate(caseItem.created_at) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>暂无案件</h3>
          </div>
        </div>

        <!-- System -->
        <div v-if="currentTab === 'system'" class="system-section">
          <div class="system-card">
            <h3>系统统计</h3>
            <div class="system-stats">
              <div class="system-stat"><span class="label">活跃用户(今日):</span><span class="value">{{ systemStats.activeUsersToday }}</span></div>
              <div class="system-stat"><span class="label">新增用户(本周):</span><span class="value">{{ systemStats.newUsersThisWeek }}</span></div>
              <div class="system-stat"><span class="label">创建案件(本周):</span><span class="value">{{ systemStats.newCasesThisWeek }}</span></div>
              <div class="system-stat"><span class="label">完成案件(本周):</span><span class="value">{{ systemStats.completedCasesThisWeek }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <Modal v-if="showRejectModal" @close="showRejectModal = false">
      <template #header><h2>拒绝认证申请</h2></template>
      <template #body>
        <form @submit.prevent="confirmRejectVerification">
          <div class="form-group">
            <label>拒绝原因*</label>
            <textarea v-model="rejectReason" class="input" rows="4" placeholder="请输入拒绝原因..." required></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showRejectModal = false">取消</button>
            <button type="submit" class="btn btn-danger">确认拒绝</button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/Sidebar.vue'
import Modal from '@/components/Modal.vue'
import api from '@/utils/api'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(false)
const showRejectModal = ref(false)
const currentTab = ref('verifications')
const stats = ref({ totalUsers: 0, totalProfessionals: 0, totalCases: 0, pendingVerifications: 0 })
const verifications = ref([])
const users = ref([])
const cases = ref([])
const systemStats = ref({ activeUsersToday: 0, newUsersThisWeek: 0, newCasesThisWeek: 0, completedCasesThisWeek: 0 })
const userFilters = ref({ role: '' })
const rejectingVerificationId = ref(null)
const rejectReason = ref('')

const tabs = computed(() => [
  { label: '认证审核', value: 'verifications', badge: stats.value.pendingVerifications > 0 ? stats.value.pendingVerifications : null },
  { label: '用户管理', value: 'users' },
  { label: '案件管理', value: 'cases' },
  { label: '系统设置', value: 'system' }
])

const loadStats = async () => {
  try {
    const response = await api.get('/api/admin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadVerifications = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/api/admin/verifications')
    verifications.value = response.data.verifications || []
  } catch (error) {
    console.error('Failed to load verifications:', error)
    verifications.value = []
  } finally {
    isLoading.value = false
  }
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (userFilters.value.role) params.role = userFilters.value.role
    const response = await api.get('/api/admin/users', { params })
    users.value = response.data.users || []
  } catch (error) {
    console.error('Failed to load users:', error)
    users.value = []
  } finally {
    isLoading.value = false
  }
}

const loadCases = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/api/admin/cases')
    cases.value = response.data.cases || []
  } catch (error) {
    console.error('Failed to load cases:', error)
    cases.value = []
  } finally {
    isLoading.value = false
  }
}

const loadSystemStats = async () => {
  try {
    const response = await api.get('/api/admin/system-stats')
    systemStats.value = response.data
  } catch (error) {
    console.error('Failed to load system stats:', error)
  }
}

const switchTab = (tab) => {
  currentTab.value = tab
  if (tab === 'verifications') loadVerifications()
  else if (tab === 'users') loadUsers()
  else if (tab === 'cases') loadCases()
  else if (tab === 'system') loadSystemStats()
}

const approveVerification = async (verificationId) => {
  if (!confirm('确认通过此认证申请?')) return
  try {
    await api.post(`/api/admin/verifications/${verificationId}/approve`)
    await loadVerifications()
    await loadStats()
    alert('认证已通过')
  } catch (error) {
    console.error('Failed to approve verification:', error)
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const rejectVerification = (verificationId) => {
  rejectingVerificationId.value = verificationId
  showRejectModal.value = true
}

const confirmRejectVerification = async () => {
  try {
    await api.post(`/api/admin/verifications/${rejectingVerificationId.value}/reject`, { reason: rejectReason.value })
    showRejectModal.value = false
    rejectReason.value = ''
    await loadVerifications()
    await loadStats()
    alert('已拒绝认证申请')
  } catch (error) {
    console.error('Failed to reject verification:', error)
    alert('操作失败: ' + (error.response?.data?.detail || error.message))
  }
}

const getRoleText = (role) => {
  const roleMap = { user: '普通用户', professional: '专业人员', admin: '管理员' }
  return roleMap[role] || role
}

const getStatusText = (status) => {
  const statusMap = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadVerifications()
})
</script>

<style scoped>
.dashboard-container { display: flex; min-height: 100vh; background: #f5f5f5; }
.main-content { flex: 1; padding: 24px; overflow-y: auto; }
.dashboard-header { margin-bottom: 24px; }
.dashboard-header h1 { font-size: 28px; margin-bottom: 4px; }
.subtitle { color: #6c757d; font-size: 14px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; padding: 20px; border-radius: 12px; display: flex; gap: 16px; align-items: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.stat-value { font-size: 32px; font-weight: 700; color: #2d2d2d; }
.stat-label { font-size: 14px; color: #6c757d; margin-top: 4px; }
.tab-navigation { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid #e5e5e5; }
.tab-btn { padding: 12px 20px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 15px; font-weight: 500; color: #6c757d; transition: all 0.2s; position: relative; }
.tab-btn:hover { color: #2d2d2d; }
.tab-btn.active { color: #667eea; border-bottom-color: #667eea; }
.tab-badge { display: inline-block; background: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; }
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; }
.loading { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.verification-list { display: grid; gap: 16px; }
.verification-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.verification-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.verification-header h3 { margin: 0 0 4px 0; }
.verification-date { color: #6c757d; font-size: 13px; }
.verification-details { display: grid; gap: 12px; margin-bottom: 16px; }
.detail-row { display: flex; gap: 12px; }
.detail-row .label { font-weight: 600; color: #6c757d; min-width: 100px; }
.verification-actions { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid #e5e5e5; }
.filters-section { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
.users-table { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 16px; text-align: left; border-bottom: 1px solid #e5e5e5; }
th { background: #f8f9fa; font-weight: 600; color: #2d2d2d; }
tr:hover { background: #f8f9fa; }
.role-badge { padding: 4px 12px; background: #e9ecef; color: #495057; border-radius: 12px; font-size: 12px; font-weight: 600; }
.status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status-pending { background: #fff3cd; color: #856404; }
.status-submitted { background: #cfe2ff; color: #084298; }
.status-approved { background: #d1e7dd; color: #0f5132; }
.status-in_progress { background: #cfe2ff; color: #084298; }
.status-completed { background: #d1e7dd; color: #0f5132; }
.status-cancelled { background: #f8d7da; color: #842029; }
.status-active { background: #d1e7dd; color: #0f5132; }
.status-inactive { background: #f8d7da; color: #842029; }
.cases-grid { display: grid; gap: 16px; }
.case-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); cursor: pointer; transition: all 0.2s; }
.case-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); }
.case-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
.case-header h3 { font-size: 18px; margin: 0; flex: 1; }
.case-description { color: #6c757d; margin-bottom: 16px; line-height: 1.6; }
.case-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: #6c757d; }
.system-section { display: flex; flex-direction: column; gap: 20px; }
.system-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.system-card h3 { margin-bottom: 20px; }
.system-stats { display: grid; gap: 16px; }
.system-stat { display: flex; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 8px; }
.system-stat .label { font-weight: 600; color: #6c757d; }
.system-stat .value { font-weight: 700; color: #2d2d2d; }
.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 64px; margin-bottom: 16px; }
.empty-state h3 { font-size: 24px; margin-bottom: 12px; }
.btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
.btn-secondary { background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; }
.btn-secondary:hover { background: #e9ecef; }
.btn-success { background: #28a745; color: white; }
.btn-success:hover { background: #218838; }
.btn-danger { background: #dc3545; color: white; }
.btn-danger:hover { background: #c82333; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; }
.input:focus { outline: none; border-color: #667eea; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; }
textarea.input { resize: vertical; font-family: inherit; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
