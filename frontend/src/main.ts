import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'  // 테마 선택
import { definePreset } from '@primevue/themes' //primevue 컴포넌트 한번에 등록
import * as PrimeVueComponents from 'primevue' //primevue 컴포넌트 한번에 등록
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura  // Aura / Lara / Nora 중 선택
  }
})
//primevue 컴포넌트 한번에 등록
Object.entries(PrimeVueComponents).forEach(([name, component]) => {
  app.component(name, component)
})

app.mount('#app')
