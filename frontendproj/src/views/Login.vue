<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-icon">⚖️</div>
        <h1>法律助手</h1>
        <p>专业的法律服务平台</p>
      </div>

      <div class="tabs">
        <button 
          class="tab" 
          :class="{ active: loginMethod === 'password' }"
          @click="loginMethod = 'password'"
        >
          密码登录
        </button>
        <button 
          class="tab" 
          :class="{ active: loginMethod === 'phone' }"
          @click="loginMethod = 'phone'"
        >
          验证码登录
        </button>
        <button 
          class="tab" 
          :class="{ active: loginMethod === 'register' }"
          @click="loginMethod = 'register'"
        >
          注册
        </button>
      </div>

      <div class="form-section">
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <!-- Password Login Form -->
        <form v-if="loginMethod === 'password'" @submit.prevent="handlePasswordLogin">
          <div class="form-group">
            <label for="username">用户名或手机号</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="input"
              placeholder="请输入用户名或手机号"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="input"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary submit-btn"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading"></span>
            <span v-else>登录</span>
          </button>
        </form>

        <!-- Phone Verification Login Form -->
        <form v-if="loginMethod === 'phone'" @submit.prevent="handlePhoneLogin">
          <div class="form-group">
            <label for="phone">手机号</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              class="input"
              :class="{ error: errors.phone }"
              placeholder="请输入手机号"
              maxlength="11"
              @input="validatePhone"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label for="code">验证码</label>
            <div class="code-input-group">
              <input
                id="code"
                v-model="code"
                type="text"
                class="input"
                :class="{ error: errors.code }"
                placeholder="请输入验证码"
                maxlength="6"
              />
              <button
                type="button"
                class="btn btn-secondary code-btn"
                :disabled="!canSendCode || countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
              </button>
            </div>
            <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
          </div>

          <button
            type="submit"
            class="btn btn-primary submit-btn"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading" class="loading"></span>
            <span v-else>登录</span>
          </button>

          <div class="info-notice">
            <p>⏱️ 验证码5分钟内有效</p>
            <p>💡 开发模式下，验证码会显示在后端控制台</p>
          </div>
        </form>

        <!-- Registration Form -->
        <form v-if="loginMethod === 'register'" @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="reg-username">用户名 (可选)</label>
            <input
              id="reg-username"
              v-model="regUsername"
              type="text"
              class="input"
              placeholder="请输入用户名，5-50个字符"
              maxlength="50"
            />
          </div>

          <div class="form-group">
            <label for="reg-phone">手机号 (可选)</label>
            <input
              id="reg-phone"
              v-model="regPhone"
              type="tel"
              class="input"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </div>

          <div class="form-group">
            <label for="reg-role">注册类型 *</label>
            <select
              id="reg-role"
              v-model="regRole"
              class="input"
              required
            >
              <option value="">请选择注册类型</option>
              <option value="user">普通用户</option>
              <option value="professional">专业人员（律师/顾问）</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reg-password">密码 *</label>
            <input
              id="reg-password"
              v-model="regPassword"
              type="password"
              class="input"
              placeholder="至少8个字符，包含字母和数字"
              required
            />
          </div>

          <div class="form-group">
            <label for="reg-password-confirm">确认密码 *</label>
            <input
              id="reg-password-confirm"
              v-model="regPasswordConfirm"
              type="password"
              class="input"
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary submit-btn"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading"></span>
            <span v-else>注册</span>
          </button>

          <div class="info-notice">
            <p>💡 用户名和手机号至少填写一项</p>
            <p>📱 建议填写手机号以便找回密码</p>
            <p>👔 专业人员注册后需等待管理员审核</p>
          </div>
        </form>

        <div class="security-notice">
          <p>🔒 您的数据经过加密传输，确保安全</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { security } from '@/utils/api'
import apiClient from '@/utils/api'  // ✅ Added: Import axios instance

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Login method: 'password', 'phone', or 'register'
const loginMethod = ref('password')

// Password login form
const username = ref('')
const password = ref('')

// Phone login form
const phone = ref('')
const code = ref('')
const errors = ref({
  phone: '',
  code: ''
})

// Registration form
const regUsername = ref('')
const regPhone = ref('')
const regRole = ref('')
const regPassword = ref('')
const regPasswordConfirm = ref('')

// Common
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const countdown = ref(0)
let countdownTimer = null

// Computed
const canSendCode = computed(() => {
  return phone.value.length === 11 && !errors.value.phone
})

const isFormValid = computed(() => {
  return phone.value.length === 11 && code.value.length === 6 && 
         !errors.value.phone && !errors.value.code
})

// Validation functions
const validatePhone = () => {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phone.value) {
    errors.value.phone = ''
  } else if (!phoneRegex.test(phone.value)) {
    errors.value.phone = '请输入有效的手机号'
  } else {
    errors.value.phone = ''
  }
}

// Password login handler
const handlePasswordLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Determine if input is phone or username
    const isPhone = /^1[3-9]\d{9}$/.test(username.value)
    
    const payload = {
      password: password.value
    }

    if (isPhone) {
      payload.phone = username.value
    } else {
      payload.username = username.value
    }

    const response = await apiClient.post('/auth/login', payload)  // ✅ Fixed: Use apiClient

    if (response.data.token && response.data.token.access_token) {
      // Store tokens
      authStore.setTokens(response.data.token.access_token, response.data.token.refresh_token)
      authStore.setUser(response.data.user)

      successMessage.value = '登录成功！'
      
      // Redirect based on role
      const redirectTo = route.query.redirect || getRoleDefaultRoute(response.data.user.role)
      
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.response?.data?.detail || '登录失败，请检查用户名和密码'
  } finally {
    isLoading.value = false
  }
}

// Phone verification login handler
const handlePhoneLogin = async () => {
  if (!isFormValid.value) {
    errorMessage.value = '请输入正确的手机号和验证码'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await apiClient.post('/auth/login', {  // ✅ Fixed: Use apiClient
      phone: phone.value,
      verification_code: code.value
    })

    if (response.data.token && response.data.token.access_token) {
      authStore.setTokens(response.data.token.access_token, response.data.token.refresh_token)
      authStore.setUser(response.data.user)

      successMessage.value = '登录成功！'
      
      const redirectTo = route.query.redirect || getRoleDefaultRoute(response.data.user.role)
      
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.response?.data?.detail || '登录失败，请检查手机号和验证码'
  } finally {
    isLoading.value = false
  }
}

// Registration handler
const handleRegister = async () => {
  errorMessage.value = ''

  // Validation
  if (!regUsername.value && !regPhone.value) {
    errorMessage.value = '用户名和手机号至少填写一项'
    return
  }

  if (regUsername.value && (regUsername.value.length < 5 || regUsername.value.length > 50)) {
    errorMessage.value = '用户名长度应为5-50个字符'
    return
  }

  if (regPhone.value && !/^1[3-9]\d{9}$/.test(regPhone.value)) {
    errorMessage.value = '请输入有效的手机号'
    return
  }

  if (!regRole.value) {
    errorMessage.value = '请选择注册类型'
    return
  }

  if (regPassword.value.length < 8) {
    errorMessage.value = '密码至少8个字符'
    return
  }

  if (!/[a-zA-Z]/.test(regPassword.value) || !/\d/.test(regPassword.value)) {
    errorMessage.value = '密码必须包含字母和数字'
    return
  }

  if (regPassword.value !== regPasswordConfirm.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  isLoading.value = true

  try {
    const payload = {
      username: regUsername.value || null,
      phone: regPhone.value || null,
      password: regPassword.value,
      role: regRole.value
    }

    await apiClient.post('/auth/register', payload)  // ✅ Fixed: Use apiClient

    successMessage.value = '注册成功！' + (regRole.value === 'professional' ? '请等待管理员审核' : '请登录')
    
    // Switch to login tab after 2 seconds
    setTimeout(() => {
      loginMethod.value = 'password'
      username.value = regUsername.value || regPhone.value
      password.value = ''
      successMessage.value = ''
      
      // Clear registration form
      regUsername.value = ''
      regPhone.value = ''
      regRole.value = ''
      regPassword.value = ''
      regPasswordConfirm.value = ''
    }, 2000)

  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = error.response?.data?.detail || '注册失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// Send verification code
const sendCode = async () => {
  if (!canSendCode.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await apiClient.post('/auth/send-code', {  // ✅ Fixed: Use apiClient
      phone: phone.value,
      purpose: 'login'
    })

    successMessage.value = '验证码已发送，请查收（开发模式下请查看后端控制台）'
    
    // Start countdown
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (error) {
    console.error('Send code error:', error)
    errorMessage.value = error.response?.data?.detail || '发送验证码失败'
  } finally {
    isLoading.value = false
  }
}

// Helper function to get default route by role
const getRoleDefaultRoute = (role) => {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'professional':
      return '/professional'
    default:
      return '/dashboard'
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.logo-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.logo-section h1 {
  font-size: 32px;
  margin-bottom: 8px;
  font-weight: 700;
}

.logo-section p {
  font-size: 16px;
  opacity: 0.9;
}

.tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab {
  flex: 1;
  padding: 16px;
  text-align: center;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #6c757d;
  transition: all 0.3s;
}

.tab.active {
  color: #667eea;
  background: white;
  border-bottom-color: #667eea;
}

.tab:hover:not(.active) {
  background: rgba(102, 126, 234, 0.05);
}

.form-section {
  padding: 32px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.3s;
}

select.input {
  cursor: pointer;
  background-color: white;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.input.error {
  border-color: #ef4444;
}

.code-input-group {
  display: flex;
  gap: 8px;
}

.code-input-group .input {
  flex: 1;
}

.code-btn {
  white-space: nowrap;
  padding: 12px 16px;
  min-width: 120px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.alert-error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.alert-success {
  background: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.info-notice {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 13px;
  color: #0369a1;
}

.info-notice p {
  margin: 4px 0;
}

.security-notice {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  text-align: center;
  font-size: 13px;
  color: #6c757d;
}

.security-notice p {
  margin: 4px 0;
}
</style>
