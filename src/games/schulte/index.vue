<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const STORAGE_KEY = 'schulte-records'

// 游戏配置
const gridSize = ref(5)
const gridSizeOptions = [3, 4, 5, 6]

// 历史记录
interface Record {
  time: number
  date: string
}
const records = ref<Record<number, Record[]>>({})

// 游戏状态
const numbers = ref<number[]>([])
const currentTarget = ref(1)
const startTime = ref<number | null>(null)
const elapsedTime = ref(0)
const isPlaying = ref(false)
const isCompleted = ref(false)
const showConfirm = ref(false)
const confirmType = ref<'restart' | 'changeSize'>('restart')
const pendingGridSize = ref<number | null>(null)
let timer: number | null = null

// 计算属性
const totalNumbers = computed(() => gridSize.value * gridSize.value)
const cellSize = computed(() => {
  const sizes: Record<number, string> = {
    3: 'w-20 h-20 text-2xl',
    4: 'w-16 h-16 text-xl',
    5: 'w-14 h-14 text-lg',
    6: 'w-12 h-12 text-base'
  }
  return sizes[gridSize.value] || 'w-14 h-14 text-lg'
})

// 当前规格的历史最优
const bestTime = computed(() => {
  const sizeRecords = records.value[gridSize.value]
  if (!sizeRecords || sizeRecords.length === 0) return null
  return Math.min(...sizeRecords.map(r => r.time))
})

// 当前规格的历史记录
const currentRecords = computed(() => {
  return records.value[gridSize.value] || []
})

// 加载历史记录
function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      records.value = JSON.parse(saved)
    }
  } catch {
    records.value = {}
  }
}

// 保存历史记录
function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
}

// 添加记录
function addRecord(time: number) {
  const size = gridSize.value
  if (!records.value[size]) {
    records.value[size] = []
  }
  records.value[size].unshift({
    time,
    date: new Date().toISOString()
  })
  if (records.value[size].length > 20) {
    records.value[size] = records.value[size].slice(0, 20)
  }
  saveRecords()
}

// 生成随机数字数组
function generateNumbers() {
  const total = totalNumbers.value
  const arr = Array.from({ length: total }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 开始游戏
function startGame() {
  if (isPlaying.value && !isCompleted.value) {
    confirmType.value = 'restart'
    showConfirm.value = true
    return
  }
  startNewGame()
}

// 选择规格
function selectGridSize(size: number) {
  if (size === gridSize.value) return
  if (isPlaying.value && !isCompleted.value) {
    confirmType.value = 'changeSize'
    pendingGridSize.value = size
    showConfirm.value = true
    return
  }
  gridSize.value = size
  resetGame()
}

// 确认操作
function confirmAction() {
  showConfirm.value = false
  if (confirmType.value === 'changeSize' && pendingGridSize.value) {
    gridSize.value = pendingGridSize.value
    pendingGridSize.value = null
  }
  startNewGame()
}

// 开始新游戏
function startNewGame() {
  numbers.value = generateNumbers()
  currentTarget.value = 1
  startTime.value = Date.now()
  elapsedTime.value = 0
  isPlaying.value = true
  isCompleted.value = false

  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Date.now() - startTime.value
    }
  }, 100)
}

// 重置游戏状态
function resetGame() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  numbers.value = []
  currentTarget.value = 1
  startTime.value = null
  elapsedTime.value = 0
  isPlaying.value = false
  isCompleted.value = false
}

// 取消操作
function cancelAction() {
  showConfirm.value = false
  pendingGridSize.value = null
}

// 点击数字
function clickNumber(num: number) {
  if (!isPlaying.value || isCompleted.value) return

  if (num === currentTarget.value) {
    if (currentTarget.value === totalNumbers.value) {
      completeGame()
    } else {
      currentTarget.value++
    }
  }
}

// 完成游戏
function completeGame() {
  isCompleted.value = true
  isPlaying.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  addRecord(elapsedTime.value)
}

// 返回首页
function goHome() {
  router.push('/')
}

// 格式化时间
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  return `${seconds}.${milliseconds.toString().padStart(3, '0').slice(0, 2)}秒`
}

// 格式化完成时间（秒）
function formatSeconds(ms: number): string {
  const seconds = ms / 1000
  return seconds.toFixed(2)
}

// 格式化日期（人类化）
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (date >= today) {
    return diffHours === 1 ? '1小时前' : `${diffHours}小时前`
  }

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  if (date >= yesterday) return `昨天 ${timeStr}`

  const dayBeforeYesterday = new Date(yesterday.getTime() - 24 * 60 * 60 * 1000)
  if (date >= dayBeforeYesterday) return `前天 ${timeStr}`

  if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${weekdays[date.getDay()]} ${timeStr}`
  }

  if (date.getFullYear() === now.getFullYear()) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日 ${timeStr}`
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日 ${timeStr}`
}

// 判断是否为新纪录
const isNewRecord = computed(() => {
  if (!isCompleted.value || currentRecords.value.length === 0) return false
  return elapsedTime.value === bestTime.value
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  // 恢复滚动
  document.body.style.overflow = ''
})

onMounted(() => {
  loadRecords()
})

// 游戏进行时禁止页面滚动
watch(isPlaying, (playing) => {
  document.body.style.overflow = playing ? 'hidden' : ''
})

</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-6 max-w-2xl">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-8">
        <button
          @click="goHome"
          class="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span>返回</span>
        </button>
        <h1 class="text-xl font-bold text-gray-800">舒尔特方格</h1>
        <div class="w-20"></div>
      </div>

      <!-- 游戏卡片 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/10 p-6 mb-6">
        <!-- 规格选择 -->
        <div class="flex items-center justify-center gap-3 mb-4">
          <span class="text-gray-500 text-sm">规格</span>
          <div class="flex gap-2">
            <button
              v-for="size in gridSizeOptions"
              :key="size"
              @click="selectGridSize(size)"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none',
                gridSize === size
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              {{ size }}×{{ size }}
            </button>
          </div>
        </div>

        <!-- 历史最优 -->
        <div class="text-center mb-6">
          <template v-if="bestTime !== null">
            <span class="text-gray-400 text-sm">历史最优</span>
            <div class="flex items-center justify-center gap-2 mt-1">
              <svg class="w-5 h-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {{ formatTime(bestTime) }}
              </span>
            </div>
          </template>
          <template v-else>
            <span class="text-gray-400 text-sm">暂无记录，开始挑战吧</span>
          </template>
        </div>

        <!-- 计时器 -->
        <div class="text-center mb-6">
          <div class="inline-flex flex-col items-center">
            <!-- 游戏进行中显示计时 -->
            <div v-if="isPlaying && !isCompleted" class="text-5xl font-mono font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {{ formatTime(elapsedTime) }}
            </div>
            <!-- 未开始显示提示 -->
            <div v-else-if="!isPlaying && !isCompleted" class="text-gray-400 text-lg">
              点击下方按钮开始
            </div>
            <!-- 游戏中显示当前目标 -->
            <div v-if="isPlaying && !isCompleted" class="text-gray-400 text-sm mt-2">
              当前目标: <span class="text-blue-600 font-semibold">{{ currentTarget }}</span>
            </div>
          </div>
        </div>

        <!-- 游戏区域 -->
        <div class="flex justify-center mb-6">
          <div
            v-if="isPlaying || isCompleted"
            class="grid gap-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl"
            :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }"
          >
            <button
              v-for="(num, index) in numbers"
              :key="index"
              @click="clickNumber(num)"
              :class="[
                'flex items-center justify-center rounded-xl font-bold transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none',
                cellSize,
                num < currentTarget
                  ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-500/30 scale-95'
                  : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 border border-gray-100'
              ]"
            >
              {{ num }}
            </button>
          </div>

          <!-- 未开始提示 -->
          <div
            v-else
            class="flex flex-col items-center justify-center h-48 text-gray-300"
          >
            <svg class="w-16 h-16 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span>点击下方按钮开始游戏</span>
          </div>
        </div>

        <!-- 完成提示 -->
        <div
          v-if="isCompleted"
          class="text-center mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100"
        >
          <div class="flex items-center justify-center gap-2 mb-2">
            <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="text-green-600 text-lg font-semibold">
              {{ isNewRecord ? '新纪录！' : '完成！' }}
            </span>
          </div>
          <div class="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {{ formatTime(elapsedTime) }}
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="flex justify-center">
          <button
            @click="startGame"
            class="px-10 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all cursor-pointer focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            {{ isCompleted ? '再来一局' : isPlaying ? '重新开始' : '开始游戏' }}
          </button>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="currentRecords.length > 0" class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-blue-500/10 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <h3 class="font-semibold text-gray-700">最近 {{ currentRecords.length }} 次记录</h3>
        </div>
        <div class="max-h-60 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50/80 sticky top-0">
              <tr>
                <th class="px-6 py-3 text-left text-gray-500 font-medium">挑战时间</th>
                <th class="px-6 py-3 text-right text-gray-500 font-medium">完成时间（秒）</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(record, index) in currentRecords"
                :key="index"
                class="border-t border-gray-50 transition-colors"
                :class="{ 'bg-amber-50/50': record.time === bestTime }"
              >
                <td class="px-6 py-3 text-gray-500">{{ formatDate(record.date) }}</td>
                <td class="px-6 py-3 text-right font-mono font-medium" :class="record.time === bestTime ? 'text-amber-600' : 'text-gray-700'">
                  {{ formatSeconds(record.time) }}
                  <span v-if="record.time === bestTime && currentRecords.length > 1" class="ml-1 text-amber-500">★</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showConfirm"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              {{ confirmType === 'restart' ? '确认重新开始？' : '确认切换规格？' }}
            </h3>
            <p class="text-gray-500 mb-6">当前游戏进度将被清除</p>
            <div class="flex gap-3 justify-end">
              <button
                @click="cancelAction"
                class="px-5 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all"
              >
                取消
              </button>
              <button
                @click="confirmAction"
                class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl cursor-pointer focus:ring-2 focus:ring-blue-300 focus:outline-none shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
