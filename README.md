# 益智游戏合集

一个基于 Vue 3 的网页小游戏合集，锻炼大脑，提升专注力。

## 游戏

### 舒尔特方格

注意力训练游戏，按顺序点击 1 到 N 的数字，用时越短越好。

- 支持 3×3、4×4、5×5、6×6 四种规格
- 实时计时
- 历史记录（最近 20 次）
- 历史最优成绩展示

### 数独（开发中）

经典数字逻辑游戏。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS 框架
- **Vue Router** - 路由管理

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 部署

项目支持部署到 Cloudflare Pages：

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 构建命令：`pnpm build`
3. 输出目录：`dist`

## 项目结构

```
study-game/
├── src/
│   ├── games/           # 游戏组件
│   │   └── schulte/     # 舒尔特方格
│   ├── router/          # 路由配置
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   └── style.css        # 全局样式
├── public/              # 静态资源
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## License

MIT
