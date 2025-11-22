<template>
  <div class="dashboard-container">
    <Sidebar />
    
    <div class="main-content">
      <header class="dashboard-header">
        <h1>我的案件</h1>
        <div class="header-actions">
          <button class="btn btn-primary" @click="showNewCaseModal = true">
            ➕ 新建案件
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

      <div class="dashboard-body">
        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label>状态筛选:</label>
            <select v-model="statusFilter" class="input" @change="loadCases">
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading"></div>
          <p>加载中...</p>
        </div>

        <!-- Cases list -->
        <div v-else-if="cases.length > 0" class="cases-grid">
          <div
            v-for="caseItem in cases"
            :key="caseItem.case_uuid"
            class="case-card"
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
            <div v-if="caseItem.professional_name" class="case-professional">
              👨‍💼 负责人: {{ caseItem.professional_name }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>还没有案件</h3>
          <p>点击上方"新建案件"按钮创建您的第一个案件</p>
        </div>

        <!-- ✨ Added: Questionnaire Section -->
        <QuestionnaireSection />
      </div>
    </div>

    <!-- New Case Modal -->
    <Modal v-if="showNewCaseModal" @close="showNewCaseModal = false">
      <template #header>
        <h2>创建新案件</h2>
      </template>
      <template #body>
        <form @submit.prevent="handleCreateCase">
          <div class="form-group">
            <label>案件标题*</label>
            <input
              v-model="newCase.title"
              type="text"
              class="input"
              :class="{ error: errors.title }"
              placeholder="请输入案件标题"
              required
            />
            <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
          </div>

          <div class="form-group">
            <label>案件描述*</label>
            <textarea
              v-model="newCase.description"
              class="input textarea"
              :class="{ error: errors.description }"
              placeholder="请详细描述您的案件情况"
              rows="5"
              required
            ></textarea>
            <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
          </div>

          <div class="form-group">
            <label>案件类别*</label>
            <select v-model="newCase.case_category" class="input" required>
              <option value="">请选择</option>
              <option value="民事诉讼">民事诉讼</option>
              <option value="刑事诉讼">刑事诉讼</option>
              <option value="行政诉讼">行政诉讼</option>
              <option value="劳动纠纷">劳动纠纷</option>
              <option value="合同纠纷">合同纠纷</option>
              <option value="知识产权">知识产权</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label>优先级</label>
            <select v-model="newCase.priority" class="input">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>

          <div class="form-group">
            <label>预算 (人民币)</label>
            <input
              v-model.number="newCase.budget_cny"
              type="number"
              class="input"
              placeholder="请输入预算金额"
              min="0"
              step="100"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showNewCaseModal = false">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading"></span>
              <span v-else>创建</span>
            </button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient, { security } from '@/utils/api'
import Sidebar from '@/components/Sidebar.vue'
import Modal from '@/components/Modal.vue'
import QuestionnaireSection from '@/components/QuestionnaireSection.vue'  // ✨ Added import

const router = useRouter()
const authStore = useAuthStore()

// State
const cases = ref([])
const isLoading = ref(false)
const showNewCaseModal = ref(false)
const showUserMenu = ref(false)
const statusFilter = ref('')
const isSubmitting = ref(false)

const newCase = ref({
  title: '',
  description: '',
  case_category: '',
  priority: 'medium',
  budget_cny: null
})

const errors = ref({
  title: '',
  description: ''
})

// Load cases
const loadCases = async () => {
  isLoading.value = true
  try {
    const params = { limit: 100 }
    if (statusFilter.value) {
      params.status_filter = statusFilter.value
    }

    const response = await apiClient.get('/cases/my-cases', { params })
    cases.value = response.data.cases || []
  } catch (error) {
    console.error('Load cases failed:', error)
    alert('加载案件失败')
  } finally {
    isLoading.value = false
  }
}

// Create case
const handleCreateCase = async () => {
  // Validate
  errors.value = { title: '', description: '' }
  
  if (!newCase.value.title || newCase.value.title.trim().length < 5) {
    errors.value.title = '标题至少需要5个字符'
    return
  }
  
  if (!newCase.value.description || newCase.value.description.trim().length < 20) {
    errors.value.description = '描述至少需要20个字符'
    return
  }

  // Sanitize input
  const sanitizedData = {
    title: security.sanitizeText(newCase.value.title),
    description: security.sanitizeText(newCase.value.description),
    case_category: newCase.value.case_category,
    priority: newCase.value.priority,
    budget_cny: newCase.value.budget_cny
  }

  isSubmitting.value = true
  try {
    const response = await apiClient.post('/cases/', sanitizedData)
    
    // Add new case to list
    cases.value.unshift(response.data)
    
    // Reset form and close modal
    newCase.value = {
      title: '',
      description: '',
      case_category: '',
      priority: 'medium',
      budget_cny: null
    }
    showNewCaseModal.value = false
    
    alert('案件创建成功')
  } catch (error) {
    console.error('Create case failed:', error)
    alert(error.response?.data?.detail || '创建案件失败')
  } finally {
    isSubmitting.value = false
  }
}

// View case detail
const viewCase = (caseUuid) => {
  router.push(`/case/${caseUuid}`)
}

// Toggle user menu
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// Handle logout
const handleLogout = async () => {
  if (confirm('确定要退出登录吗?')) {
    await authStore.logout()
    router.push('/login')
  }
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// Initialize
onMounted(() => {
  loadCases()
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
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dashboard-header h1 {
  font-size: 24px;
  color: #2d2d2d;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  z-index: 100;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: #2d2d2d;
  text-decoration: none;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.dashboard-body {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filters-section {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-weight: 600;
  color: #2d2d2d;
}

.filter-group select {
  min-width: 150px;
}

.loading-container {
  text-align: center;
  padding: 60px;
}

.loading-container .loading {
  margin: 0 auto 16px;
  border-color: #667eea;
  border-top-color: transparent;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.case-card {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.case-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.case-header h3 {
  font-size: 18px;
  color: #2d2d2d;
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

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-in_progress {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.case-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.case-professional {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
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
  color: #2d2d2d;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d2d2d;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
  }

  .main-content {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .cases-grid {
    grid-template-columns: 1fr;
  }
}
</style>
