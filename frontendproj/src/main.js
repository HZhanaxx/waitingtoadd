import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Create Vue app
const app = createApp(App)

// Create Pinia store
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
  
  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'production') {
    // sendToLoggingService(err, info)
  }
}

// Security: Disable Vue devtools in production
if (process.env.NODE_ENV === 'production') {
  app.config.devtools = false
}

// Mount app
app.mount('#app')

// Security: Prevent console access in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
}
