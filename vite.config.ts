import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Auto-detect base path for GitHub Pages
// For user page (username.github.io): base = '/'
// For project page (username.github.io/repo-name): base = '/repo-name/'
const getBase = () => {
  const repo = process.env.GITHUB_REPOSITORY
  if (repo) {
    const [, name] = repo.split('/')
    // If repo name matches owner name + .github.io, it's a user page
    if (name && !name.endsWith('.github.io')) {
      return `/${name}/`
    }
  }
  return '/'
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: getBase(),
})
