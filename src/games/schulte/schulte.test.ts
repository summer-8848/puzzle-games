import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Schulte from './index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/schulte', name: 'Schulte', component: Schulte }
  ]
})

describe('Schulte Game', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    router.push('/schulte')
    await router.isReady()
    wrapper = mount(Schulte, {
      global: {
        plugins: [router]
      }
    })
  })

  it('初始状态显示"点击下方按钮开始"', () => {
    const hint = wrapper.text()
    expect(hint).toContain('点击下方按钮开始')
  })

  it('存在模式选择按钮', () => {
    const buttons = wrapper.findAll('button')
    const modeButtons = buttons.filter(btn => btn.text() === '数字' || btn.text() === '大写字母' || btn.text() === '小写字母')
    expect(modeButtons.length).toBe(3)
  })

  it('存在规格选择按钮', () => {
    const buttons = wrapper.findAll('button')
    const sizeButtons = buttons.filter(btn => btn.text().includes('×'))
    expect(sizeButtons.length).toBe(4)
  })

  it('存在开始游戏按钮', () => {
    const buttons = wrapper.findAll('button')
    const startBtn = buttons.find(btn => btn.text() === '开始游戏')
    expect(startBtn).toBeDefined()
  })

  it('切换模式为大写字母', async () => {
    const buttons = wrapper.findAll('button')
    const upperBtn = buttons.find(btn => btn.text() === '大写字母')
    await upperBtn!.trigger('click')
    await wrapper.vm.$nextTick()
    // 验证大写字母模式选中
    const upperActive = buttons.find(btn => btn.text() === '大写字母')
    expect(upperActive?.classes()).toContain('shadow-blue-500/30')
  })

  it('切换规格为3×3', async () => {
    const buttons = wrapper.findAll('button')
    const size3Btn = buttons.find(btn => btn.text() === '3×3')
    await size3Btn!.trigger('click')
    await wrapper.vm.$nextTick()
    // 验证3×3选中
    const size3Active = buttons.find(btn => btn.text() === '3×3')
    expect(size3Active?.classes()).toContain('shadow-blue-500/30')
  })
})
