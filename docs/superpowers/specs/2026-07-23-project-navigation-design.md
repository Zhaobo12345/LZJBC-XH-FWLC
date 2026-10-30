# 项目导航功能设计规格

> 创建日期: 2026-07-23
> 状态: 待实现

## 一、概述

### 1.1 功能定位

在项目详情页面增加悬浮入口"项目导航"，以时间轴形式展示施工路线（阶段-任务树），帮助用户快速了解施工进度、定位当前执行任务、浏览整体施工计划。

### 1.2 设计原则

- **简洁直观**：布局清晰，一眼看懂施工路线
- **状态明确**：通过颜色区分任务状态
- **定位精准**：自动定位到当前执行任务
- **不影响现有功能**：作为独立组件叠加在现有页面上

## 二、交互形式

### 2.1 入口样式

采用**右侧边缘抽屉式滑出**形式。

| 属性 | 值 | 说明 |
|------|------|------|
| 位置 | 屏幕右侧边缘 | 拇指热区 |
| 宽度 | 44px | 最小触控宽度 |
| 高度 | 88px | 便于点击 |
| 背景 | rgba(24, 144, 255, 0.9) | 半透明蓝色 |
| 圆角 | 左侧8px，右侧0px | 与屏幕边缘贴合 |
| 文字 | "项目导航" + 左箭头 | 垂直排列，白色 |
| 定位 | top: 50%; transform: translateY(-50%) | 垂直居中 |

### 2.2 抽屉面板

| 属性 | 值 |
|------|------|
| 宽度 | 85% 屏幕宽度（最大 375px） |
| 位置 | 固定在屏幕右侧 |
| 背景 | 白色 (#FFFFFF) |
| 阴影 | -4px 0 16px rgba(0,0,0,0.2) |

### 2.3 动画规格

| 动画 | 时长 | 缓动函数 |
|------|------|----------|
| 打开 | 300ms | ease-out |
| 关闭 | 250ms | ease-in |

动画过程：
- 打开：translateX(100%) → translateX(0)
- 关闭：translateX(0) → translateX(100%)

### 2.4 背景遮罩

| 属性 | 值 |
|------|------|
| 背景 | rgba(0, 0, 0, 0.5) |
| 动画 | 淡入淡出，与抽屉同步 |
| 点击行为 | 关闭抽屉 |

### 2.5 关闭方式

1. 点击左侧遮罩区域
2. 点击顶部关闭按钮
3. 在抽屉上向右滑动超过 50px
4. Android 返回键（如支持）

## 三、时间轴设计

### 3.1 布局结构

```
┌─────────────────────────────────────┐
│  施工路线                    [×]   │
├─────────────────────────────────────┤
│                                     │
│  ●──────── 材料进场阶段 ✓          │
│  │         ┌─────────────────┐     │
│  │         │ ✓ 材料采购      │     │
│  │         │ ✓ 材料运输      │     │
│  │         │ ✓ 材料确认      │     │
│  │         └─────────────────┘     │
│  │                                 │
│  ●──────── 布管布线阶段 ⏳         │  ← 当前执行阶段
│  │         ┌─────────────────┐     │
│  │         │ ✓ 开槽          │     │
│  │         │ ⏳ 布管 ← 当前   │     │  ← 定位到这里
│  │         │ ○ 穿线          │     │
│  │         │ ○ 阶段确认      │     │
│  │         └─────────────────┘     │
│  │                                 │
│  ○──────── 安装阶段                │
│  │         ┌─────────────────┐     │
│  │         │ ○ 开关插座安装  │     │
│  │         │ ○ 灯具安装      │     │
│  │         └─────────────────┘     │
│  │                                 │
│  ○──────── 收尾阶段                │
│             ┌─────────────────┐     │
│             │ ○ 清理现场      │     │
│             │ ○ 最终确认      │     │
│             └─────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

### 3.2 状态图标

| 状态 | 阶段图标 | 任务图标 |
|------|----------|----------|
| 已完成 | ● (实心) | ✓ (勾选) |
| 执行中 | ● (实心) | ⏳ (时钟) |
| 待执行 | ○ (空心) | ○ (空心) |

### 3.3 颜色方案

| 状态 | 节点颜色 | 文字颜色 | 背景 |
|------|----------|----------|------|
| 已完成 | #999999 | #999999 | #F5F5F5 |
| 执行中 | #1890FF | #1890FF | #E6F7FF |
| 待执行(即将) | #FA8C16 | #FA8C16 | 无 |
| 待执行(后续) | #BFBFBF | #BFBFBF | 无 |

### 3.4 连接线样式

- 宽度：2px
- 颜色：与节点状态颜色一致
- 样式：实线
- 间距：节点间距 16px

## 四、交互行为

### 4.1 打开抽屉

1. 用户点击右侧"项目导航"入口条
2. 入口条隐藏（或变成关闭按钮）
3. 背景遮罩淡入
4. 抽屉面板从右侧滑入
5. 内容区域自动滚动定位到当前执行任务

### 4.2 定位逻辑

```
打开抽屉时：
1. 获取当前执行中任务的数据
2. 计算任务在列表中的位置（offsetTop）
3. 使用 scrollTo 滚动到该位置（带平滑动画）
4. 高亮该任务节点（添加 .current 类）
```

### 4.3 点击阶段名称

- 展开/收起该阶段的任务列表
- 展开时：任务列表高度从 0 过渡到实际高度
- 收起时：任务列表高度过渡到 0

### 4.4 点击任务名称

- 跳转到任务详情页（task-detail.html?taskId=xxx）
- 传递任务ID参数

## 五、组件结构

### 5.1 HTML 结构

```html
<!-- 悬浮入口条 -->
<div class="project-nav-trigger" id="projectNavTrigger">
    <span class="nav-arrow">◀</span>
    <span class="nav-text">项目导航</span>
</div>

<!-- 背景遮罩 -->
<div class="project-nav-overlay" id="projectNavOverlay"></div>

<!-- 抽屉面板 -->
<div class="project-nav-drawer" id="projectNavDrawer">
    <div class="drawer-header">
        <span class="drawer-title">施工路线</span>
        <span class="drawer-close" id="projectNavClose">×</span>
    </div>
    <div class="drawer-content" id="projectNavContent">
        <!-- 时间轴内容由 JS 动态生成 -->
    </div>
</div>
```

### 5.2 CSS 类名

```css
/* 入口条 */
.project-nav-trigger { ... }

/* 遮罩 */
.project-nav-overlay { ... }

/* 抽屉面板 */
.project-nav-drawer { ... }

/* 时间轴 */
.timeline { ... }
.timeline-stage { ... }
.timeline-node { ... }
.timeline-line { ... }
.timeline-tasks { ... }
.timeline-task { ... }
```

### 5.3 JS 函数

```javascript
// 打开抽屉
function openProjectNav() { ... }

// 关闭抽屉
function closeProjectNav() { ... }

// 渲染时间轴
function renderTimeline(data) { ... }

// 定位到当前任务
function scrollToCurrentTask() { ... }

// 展开/收起阶段
function toggleStage(stageId) { ... }

// 跳转任务详情
function goToTaskDetail(taskId) { ... }
```

## 六、数据结构

### 6.1 阶段任务数据

```javascript
const projectNavData = {
    projectId: 'proj-001',
    projectName: 'XX小区整体装修',
    stages: [
        {
            id: 'stage-1',
            name: '材料进场阶段',
            status: 'completed', // completed | in_progress | pending
            tasks: [
                { id: 'task-1', name: '材料采购', status: 'completed' },
                { id: 'task-2', name: '材料运输', status: 'completed' },
                { id: 'task-3', name: '材料确认', status: 'completed' }
            ]
        },
        {
            id: 'stage-2',
            name: '布管布线阶段',
            status: 'in_progress',
            currentTaskId: 'task-5', // 当前执行任务
            tasks: [
                { id: 'task-4', name: '开槽', status: 'completed' },
                { id: 'task-5', name: '布管', status: 'in_progress' },
                { id: 'task-6', name: '穿线', status: 'pending' },
                { id: 'task-7', name: '阶段确认', status: 'pending' }
            ]
        },
        // ... 更多阶段
    ]
};
```

## 七、文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `project-detail.html` | 添加导航组件 HTML |
| `css/project-detail.css` | 添加导航组件样式 |
| `js/project-detail.js` | 添加导航交互逻辑 |
| `js/project-nav-data.js` | 导航数据模拟（新建） |

## 八、验收标准

### 8.1 功能验收

- [ ] 点击入口条能打开抽屉面板
- [ ] 抽屉面板正确显示时间轴
- [ ] 颜色正确区分任务状态
- [ ] 打开时自动定位到当前执行任务
- [ ] 点击任务能跳转到详情页
- [ ] 点击遮罩/关闭按钮能关闭抽屉
- [ ] 右滑手势能关闭抽屉

### 8.2 视觉验收

- [ ] 入口条位置正确（右侧垂直居中）
- [ ] 抽屉动画流畅
- [ ] 时间轴布局清晰
- [ ] 颜色方案符合设计规格

### 8.3 兼容性验收

- [ ] 不影响现有页面功能
- [ ] 在不同屏幕尺寸下正常显示
- [ ] 触摸交互流畅