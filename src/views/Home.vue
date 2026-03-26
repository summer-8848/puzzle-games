<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const games = [
  {
    id: 'schulte',
    name: '舒尔特方格',
    description: '注意力训练，按顺序点击数字',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    path: '/schulte'
  },
  {
    id: 'schulte-hard',
    name: '舒尔特方格·困难',
    description: 'A,1,B,2,C,3... 字母数字交替',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    path: '/schulte-hard'
  },
  {
    id: 'sudoku',
    name: '数独',
    description: '经典数字逻辑游戏',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    path: '/sudoku',
    disabled: true
  }
]

function navigateToGame(path: string, disabled: boolean = false) {
  if (disabled) return
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-12 max-w-4xl">
      <!-- 头部 -->
      <header class="text-center mb-16">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-6">
          <svg class="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
          益智游戏合集
        </h1>
        <p class="text-gray-500 text-lg">锻炼大脑，提升专注力</p>
      </header>

      <!-- 游戏卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="game in games"
          :key="game.id"
          @click="navigateToGame(game.path, game.disabled)"
          @keydown.enter="navigateToGame(game.path, game.disabled)"
          tabindex="0"
          :class="[
            'group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer',
            game.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-xl hover:-translate-y-1 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          ]"
        >
          <!-- 背景装饰 -->
          <div
            :class="[
              'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300',
              game.disabled ? '' : 'group-hover:opacity-100',
              game.bgColor
            ]"
          ></div>

          <!-- 卡片内容 -->
          <div class="relative">
            <!-- 图标 -->
            <div
              :class="[
                'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-gradient-to-br shadow-lg transition-transform duration-300',
                game.disabled ? '' : 'group-hover:scale-110',
                game.color,
                game.disabled ? '' : 'shadow-' + (game.id === 'schulte' ? 'blue' : game.id === 'schulte-hard' ? 'purple' : 'amber') + '-500/30'
              ]"
            >
              <!-- 舒尔特方格图标 -->
              <svg v-if="game.id === 'schulte'" class="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <!-- 困难模式图标 -->
              <svg v-else-if="game.id === 'schulte-hard'" class="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <!-- 数独图标 -->
              <svg v-else-if="game.id === 'sudoku'" class="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            </div>

            <h2 class="text-xl font-semibold text-gray-800 mb-2">{{ game.name }}</h2>
            <p class="text-gray-500">{{ game.description }}</p>

            <!-- 开发中标签 -->
            <span
              v-if="game.disabled"
              class="inline-block mt-3 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full"
            >
              开发中
            </span>

            <!-- 箭头 -->
            <div
              v-if="!game.disabled"
              class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:-translate-x-1"
            >
              <svg class="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <footer class="text-center mt-16 text-gray-400 text-sm">
        更多游戏即将推出
      </footer>
    </div>
  </div>
</template>
