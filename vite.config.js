import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    '__firebase_config': 'import.meta.env.VITE_FIREBASE_CONFIG',
    '__app_id': 'import.meta.env.VITE_APP_ID',
    '__initial_auth_token': 'import.meta.env.VITE_INITIAL_AUTH_TOKEN'
  }
})
