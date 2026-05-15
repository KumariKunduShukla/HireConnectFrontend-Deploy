import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        'src/main.jsx',
        'src/App.jsx',
        'src/index.jsx',
        '**/*.test.{js,jsx}',
        'vite.config.js',
        '**/*.css',
        '**/*.svg',
        'src/api/**',
        'src/pages/Dashboard.jsx',
        'src/pages/Profile.jsx',
        'src/pages/RecruiterDashboard.jsx',
        'src/pages/JobDetail.jsx',
        'src/pages/Jobs.jsx',
        'src/pages/Login.jsx',
        'src/pages/Register.jsx',
        'src/pages/ForgotPassword.jsx',
        'src/pages/Subscription.jsx',
        'src/pages/RecruiterApply.jsx'
      ],
    },
  },
});
