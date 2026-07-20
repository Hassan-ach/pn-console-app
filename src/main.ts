import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { insightsRouter } from './router/insightsRouter'

const app = createApp(App)

app.use(insightsRouter)
// app.use(router)
app.mount('#app')
