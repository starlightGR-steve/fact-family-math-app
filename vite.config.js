import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      '__firebase_config': JSON.stringify(env.VITE_FIREBASE_CONFIG || '{}'),
      '__app_id': JSON.stringify(env.VITE_APP_ID || 'default-app-id'),
      '__initial_auth_token': JSON.stringify(env.VITE_INITIAL_AUTH_TOKEN || '')
    }
  }
})
