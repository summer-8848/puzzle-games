<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const STORAGE_KEY = 'schulte-hard-records'

// 游戏配置 - 困难模式固定为 A,1,B,2,C,3... 交替
const gridSize = ref(6)
const gridSizeOptions = [6, 7]

// 历史记录
interface GameRecord {
  time: number
  date: string
}
const records = ref<Record<string, GameRecord[]>>({})

// 获取当前记录的key
function getRecordKey() {
  return `${gridSize.value}`
}

// 游戏状态
const numbers = ref<(number | string)[]>([])
const currentTarget = ref<string | number>('A')
const clickedCount = ref(0)
const startTime = ref<number | null>(null)
const elapsedTime = ref(0)
const isPlaying = ref(false)
const isCompleted = ref(false)
const isObserving = ref(false)
const observeCountdown = ref(5)
const showConfirm = ref(false)
let timer: number | null = null
let observeTimer: number | null = null

// 计算属性
const totalNumbers = computed(() => gridSize.value * gridSize.value)

// 生成困难模式内容数组: A,1,B,2,C,3...
function generateMixedContent(total: number): (string | number)[] {
  const result: (string | number)[] = []
  for (let i = 0; i < total; i++) {
    if (i % 2 === 0) {
      result.push(String.fromCharCode(65 + Math.floor(i / 2)))
    } else {
      result.push(Math.floor(i / 2) + 1)
    }
  }
  return result
}

const cellSize = computed(() => {
  const sizes: Record<number, string> = {
    6: 'w-12 h-12 text-base',
    7: 'w-11 h-11 text-sm'
  }
  return sizes[gridSize.value] || 'w-12 h-12 text-base'
})

// 当前规格的历史最优
const bestTime = computed(() => {
  const sizeRecords = records.value[getRecordKey()]
  if (!sizeRecords || sizeRecords.length === 0) return null
  return Math.min(...sizeRecords.map(r => r.time))
})

// 当前规格的历史记录
const currentRecords = computed(() => {
  return records.value[getRecordKey()] || []
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
  const key = getRecordKey()
  if (!records.value[key]) {
    records.value[key] = []
  }
  records.value[key].unshift({
    time,
    date: new Date().toISOString()
  })
  if (records.value[key].length > 20) {
    records.value[key] = records.value[key].slice(0, 20)
  }
  saveRecords()
}

// 生成随机内容数组
function generateNumbers() {
  const arr = generateMixedContent(totalNumbers.value)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 开始游戏
function startGame() {
  if (isPlaying.value && !isCompleted.value) {
    showConfirm.value = true
    return
  }
  startNewGame()
}

// 选择规格
function selectGridSize(size: number) {
  if (size === gridSize.value) return
  gridSize.value = size
  resetGame()
}

// 确认操作
function confirmAction() {
  showConfirm.value = false
  startNewGame()
}

// 开始新游戏
function startNewGame() {
  numbers.value = generateNumbers()
  currentTarget.value = 'A'
  clickedCount.value = 0
  startTime.value = null
  elapsedTime.value = 0
  isPlaying.value = false
  isCompleted.value = false
  isObserving.value = true
  observeCountdown.value = 5

  if (timer) clearInterval(timer)
  if (observeTimer) clearInterval(observeTimer)

  // 观察期倒计时
  observeTimer = window.setInterval(() => {
    observeCountdown.value--
    if (observeCountdown.value <= 0) {
      clearInterval(observeTimer!)
      observeTimer = null
      isObserving.value = false
      isPlaying.value = true
      startTime.value = Date.now()
      // 开始计时
      timer = window.setInterval(() => {
        if (startTime.value) {
          elapsedTime.value = Date.now() - startTime.value
        }
      }, 100)
    }
  }, 1000)
}

// 重置游戏状态
function resetGame() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (observeTimer) {
    clearInterval(observeTimer)
    observeTimer = null
  }
  numbers.value = []
  currentTarget.value = 'A'
  clickedCount.value = 0
  startTime.value = null
  elapsedTime.value = 0
  isPlaying.value = false
  isCompleted.value = false
  isObserving.value = false
}

// 取消操作
function cancelAction() {
  showConfirm.value = false
}

// 点击字母/数字
function clickNumber(num: number | string) {
  if (!isPlaying.value || isCompleted.value) return

  if (num === currentTarget.value) {
    clickedCount.value++
    if (clickedCount.value === totalNumbers.value) {
      completeGame()
    } else {
      // 交替递增: A->1->B->2->C->3...
      if (typeof currentTarget.value === 'string') {
        // 当前是字母，下一个应该是数字
        currentTarget.value = (currentTarget.value.charCodeAt(0) - 64)
      } else {
        // 当前是数字，下一个应该是字母
        currentTarget.value = String.fromCharCode(65 + currentTarget.value)
      }
    }
  }
}

// 判断是否已点击（用于显示绿色）
function isClicked(num: number | string): boolean {
  // 比较逻辑: 'A' < 1 < 'B' < 2 < 'C' ...
  const order = (n: string | number): number => {
    if (typeof n === 'string') {
      return (n.charCodeAt(0) - 64) * 2 - 1 // A=1, B=3, C=5...
    }
    return n * 2 // 1=2, 2=4, 3=6...
  }
  return order(num) < order(currentTarget.value)
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
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}秒`
}

// 格式化完成时间（秒）
function formatSeconds(ms: number): string {
  const seconds = ms / 1000
  return seconds.toFixed(3)
}

// 格式化日期
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  return `${year}-${month}-${day} ${timeStr}`
}

// 判断是否为新纪录
const isNewRecord = computed(() => {
  if (!isCompleted.value || currentRecords.value.length === 0) return false
  return elapsedTime.value === bestTime.value
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
})

onMounted(() => {
  loadRecords()
})

// 游戏进行时禁止页面滚动和缩放
watch(isPlaying, (playing) => {
  document.body.style.overflow = playing ? 'hidden' : ''
  document.body.style.touchAction = playing ? 'none' : ''
})

</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div class="container mx-auto px-4 py-6 max-w-2xl">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-8">
        <button
          @click="goHome"
          class="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span>返回</span>
        </button>
        <h1 class="text-xl font-bold text-white">舒尔特方格 · 困难模式</h1>
        <div class="w-20"></div>
      </div>

      <!-- 游戏卡片 -->
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/20">
        <!-- 模式说明 -->
        <div class="text-center mb-4">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
            <svg class="w-4 h-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>
            </svg>
            <span class="text-purple-300 text-sm font-medium">A,1,B,2,C,3... 交替挑战</span>
          </div>
        </div>

        <!-- 规格选择 -->
        <div class="flex items-center justify-center gap-3 mb-4">
          <span class="text-gray-400 text-sm">规格</span>
          <div class="flex gap-2">
            <button
              v-for="size in gridSizeOptions"
              :key="size"
              @click="selectGridSize(size)"
              :disabled="isPlaying && !isCompleted"
              :class="[
                'px-5 py-2 rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-purple-500 focus:outline-none',
                gridSize === size
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20',
                isPlaying && !isCompleted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
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
              <svg class="w-5 h-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
            <!-- 观察期显示倒计时 -->
            <div v-if="isObserving" class="text-5xl font-mono font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {{ observeCountdown }}
            </div>
            <!-- 游戏进行中显示计时 -->
            <div v-else-if="isPlaying && !isCompleted" class="text-5xl font-mono font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {{ formatTime(elapsedTime) }}
            </div>
            <!-- 未开始显示提示 -->
            <div v-else-if="!isPlaying && !isCompleted" class="text-gray-400 text-lg">
              点击下方按钮开始
            </div>
            <!-- 观察期提示 -->
            <div v-if="isObserving" class="text-amber-400 text-sm mt-2">
              观察期，请记住方格位置
            </div>
            <!-- 游戏中显示当前目标 -->
            <div v-else-if="isPlaying && !isCompleted" class="text-gray-400 text-sm mt-2">
              当前目标: <span class="text-purple-400 font-bold text-lg">{{ currentTarget }}</span>
            </div>
          </div>
        </div>

        <!-- 游戏区域 -->
        <div class="flex justify-center mb-6">
          <!-- 观察期显示格子 -->
          <div
            v-if="isObserving"
            class="grid gap-2 p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border-2 border-amber-400/50"
            :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }"
          >
            <div
              v-for="(num, index) in numbers"
              :key="index"
              :class="[
                'flex items-center justify-center rounded-xl font-bold transition-all duration-200',
                cellSize,
                'bg-white/90 text-gray-800 shadow-lg border border-white/50'
              ]"
            >
              {{ num }}
            </div>
          </div>

          <!-- 游戏进行中 -->
          <div
            v-else-if="isPlaying || isCompleted"
            class="grid gap-2 p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl"
            :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }"
          >
            <button
              v-for="(num, index) in numbers"
              :key="index"
              @click="clickNumber(num)"
              :class="[
                'flex items-center justify-center rounded-xl font-bold cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none select-none',
                cellSize,
                isClicked(num)
                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/90 text-gray-800 shadow-md border border-white/50 active:bg-white/70'
              ]"
            >
              {{ num }}
            </button>
          </div>

          <!-- 未开始提示 -->
          <div
            v-else
            class="flex flex-col items-center justify-center h-48 text-gray-500"
          >
            <svg class="w-16 h-16 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span>点击下方按钮开始游戏</span>
          </div>
        </div>

        <!-- 完成提示 -->
        <div
          v-if="isCompleted"
          class="text-center mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30"
        >
          <div class="flex items-center justify-center gap-2 mb-2">
            <svg class="w-6 h-6 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="text-green-400 text-lg font-semibold">
              {{ isNewRecord ? '新纪录！' : '完成！' }}
            </span>
          </div>
          <div class="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {{ formatTime(elapsedTime) }}
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="flex justify-center">
          <button
            @click="startGame"
            class="px-10 py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all cursor-pointer focus:ring-2 focus:ring-purple-300 focus:outline-none"
          >
            {{ isCompleted ? '再来一局' : isPlaying ? '重新开始' : '开始游戏' }}
          </button>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="currentRecords.length > 0" class="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20">
        <div class="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <h3 class="font-semibold text-gray-300">最近 {{ currentRecords.length }} 次记录</h3>
        </div>
        <div class="max-h-60 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-white/5 sticky top-0">
              <tr>
                <th class="px-6 py-3 text-left text-gray-400 font-medium">挑战时间</th>
                <th class="px-6 py-3 text-right text-gray-400 font-medium">完成时间（秒）</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(record, index) in currentRecords"
                :key="index"
                class="border-t border-white/5 transition-colors"
                :class="{ 'bg-amber-500/10': record.time === bestTime }"
              >
                <td class="px-6 py-3 text-gray-400">{{ formatDate(record.date) }}</td>
                <td class="px-6 py-3 text-right font-mono font-medium" :class="record.time === bestTime ? 'text-amber-400' : 'text-gray-300'">
                  {{ formatSeconds(record.time) }}
                  <span v-if="record.time === bestTime && currentRecords.length > 1" class="ml-1 text-amber-400">★</span>
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
          class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div class="bg-slate-800 rounded-3xl p-6 max-w-sm mx-4 shadow-2xl border border-white/20">
            <h3 class="text-lg font-semibold text-white mb-2">确认重新开始？</h3>
            <p class="text-gray-400 mb-6">当前游戏进度将被清除</p>
            <div class="flex gap-3 justify-end">
              <button
                @click="cancelAction"
                class="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer focus:ring-2 focus:ring-gray-500 focus:outline-none transition-all"
              >
                取消
              </button>
              <button
                @click="confirmAction"
                class="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl cursor-pointer focus:ring-2 focus:ring-purple-300 focus:outline-none shadow-lg hover:shadow-xl transition-all"
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
