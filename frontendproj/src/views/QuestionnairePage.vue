<template>
  <div class="questionnaire-page">
    <div class="questionnaire-wrapper">
      <!-- 返回按钮 -->
      <div class="back-button">
        <button @click="goBack" class="btn-back">
          ← 返回
        </button>
      </div>

      <!-- 动态问卷组件 -->
      <DynamicQuestionnaire
        v-if="sessionId"
        :sessionId="sessionId"
        :apiBaseUrl="apiBaseUrl"
        :getAuthToken="getAuthToken"
        @completed="handleCompleted"
        @error="handleError"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DynamicQuestionnaire from '@/components/DynamicQuestionnaire.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 从路由参数获取 session ID
const sessionId = computed(() => route.params.sessionId)

// API 基础 URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// 获取认证 Token
const getAuthToken = () => {
  return authStore.token
}

// 返回
const goBack = () => {
  router.push('/dashboard')
}

// 完成问卷
const handleCompleted = (data) => {
  console.log('Questionnaire completed:', data)
  
  // 显示成功消息
  alert('问卷提交成功！')
  
  // 返回到仪表盘
  setTimeout(() => {
    router.push('/dashboard')
  }, 2000)
}

// 错误处理
const handleError = (error) => {
  console.error('Questionnaire error:', error)
  alert('问卷出现错误: ' + error.message)
}
</script>

<style scoped>
.questionnaire-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px;
}

.questionnaire-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.back-button {
  margin-bottom: 16px;
}

.btn-back {
  background: white;
  color: #666;
  border: 1px solid #e5e5e5;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f5f5f5;
  color: #2d2d2d;
}

@media (max-width: 768px) {
  .questionnaire-page {
    padding: 16px;
  }
}
</style>
