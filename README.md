# 工作计划管理系统

基于 Vue 3 + Tauri 2.x 构建的跨平台工作计划管理系统。

## 功能特性

- 📋 **工作计划管理**：任务的增删改查，支持状态、四象限分类
- 📅 **多视图展示**：日计划、周计划、月计划视图
- 📊 **数据统计**：完成率趋势图、四象限分布图等
- 📥 **数据导入导出**：支持 Excel、CSV 格式
- 🔔 **任务提醒**：到期提醒、逾期警告
- 💾 **本地存储**：SQLite 数据库，数据安全可靠

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **桌面打包**: Tauri 2.x
- **UI组件库**: Element Plus
- **数据存储**: SQLite
- **图表库**: ECharts
- **样式**: TailwindCSS

## 开发环境

### 安装依赖

```bash
pnpm install
```

### 启动 Web 开发服务器

```bash
pnpm dev
```

### 启动 Tauri 开发环境

```bash
pnpm tauri:dev
```

### 构建桌面应用

```bash
pnpm tauri:build
```

## 项目结构

```
work-plan-manager/
├── src/                      # Vue 前端源码
│   ├── components/           # 公共组件
│   ├── views/                # 页面视图
│   ├── stores/               # Pinia 状态管理
│   ├── database/             # 数据库模块
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   └── router/               # 路由配置
├── src-tauri/                # Tauri 后端
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── tauri.conf.json
│   └── Cargo.toml
└── package.json
```

## 许可证

MIT License
