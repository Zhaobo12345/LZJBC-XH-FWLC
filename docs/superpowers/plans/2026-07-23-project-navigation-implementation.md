# 项目导航功能实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在项目详情页面增加悬浮入口"项目导航"，以时间轴形式展示施工路线，帮助用户快速了解施工进度、定位当前执行任务。

**架构：** 采用右侧边缘抽屉式滑出设计，包含悬浮入口条、背景遮罩、抽屉面板三个组件。时间轴使用左侧垂直线+节点布局，支持展开/收起、自动定位、状态颜色区分。

**技术栈：** 原生 HTML/CSS/JavaScript，无额外依赖

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `service-miniapp/js/project-nav-data.js` | 导航数据模拟（新建） |
| `service-miniapp/project-detail.html` | 添加导航组件 HTML 结构 |
| `service-miniapp/css/project-detail.css` | 添加导航组件样式 |
| `service-miniapp/js/project-detail.js` | 添加导航交互逻辑 |

---

### 任务 1：创建导航数据模拟文件

**文件：**
- 创建：`service-miniapp/js/project-nav-data.js`

- [ ] **步骤 1：创建数据文件**

```javascript
/**
 * 项目导航数据模拟
 * 用于展示施工路线（阶段-任务树）
 */

const projectNavData = {
    projectId: 'proj-001',
    projectName: 'XX小区整体装修',
    stages: [
        {
            id: 'stage-1',
            name: '材料进场阶段',
            status: 'completed',
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
            currentTaskId: 'task-5',
            tasks: [
                { id: 'task-4', name: '开槽', status: 'completed' },
                { id: 'task-5', name: '布管', status: 'in_progress' },
                { id: 'task-6', name: '穿线', status: 'pending' },
                { id: 'task-7', name: '阶段确认', status: 'pending' }
            ]
        },
        {
            id: 'stage-3',
            name: '安装阶段',
            status: 'pending',
            tasks: [
                { id: 'task-8', name: '开关插座安装', status: 'pending' },
                { id: 'task-9', name: '灯具安装', status: 'pending' },
                { id: 'task-10', name: '阶段确认', status: 'pending' }
            ]
        },
        {
            id: 'stage-4',
            name: '收尾阶段',
            status: 'pending',
            tasks: [
                { id: 'task-11', name: '清理现场', status: 'pending' },
                { id: 'task-12', name: '最终确认', status: 'pending' }
            ]
        }
    ]
};

// 导出数据（支持模块化和全局访问）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectNavData;
}
```

- [ ] **步骤 2：验证文件语法**

运行：`node -c service-miniapp/js/project-nav-data.js`
预期：无错误输出

- [ ] **步骤 3：Commit**

```bash
git add service-miniapp/js/project-nav-data.js
git commit -m "feat: add project navigation data mock"
```

---

### 任务 2：添加导航组件 HTML 结构

**文件：**
- 修改：`service-miniapp/project-detail.html`（在 `</body>` 前添加）

- [ ] **步骤 1：在 HTML 文件末尾添加导航组件结构**

在 `</body>` 标签前添加以下内容：

```html
        <!-- 项目导航组件 -->
        <div class="project-nav-trigger" id="projectNavTrigger">
            <span class="nav-arrow">◀</span>
            <span class="nav-text">项目导航</span>
        </div>

        <div class="project-nav-overlay" id="projectNavOverlay"></div>

        <div class="project-nav-drawer" id="projectNavDrawer">
            <div class="drawer-header">
                <span class="drawer-title">施工路线</span>
                <span class="drawer-close" id="projectNavClose">×</span>
            </div>
            <div class="drawer-content" id="projectNavContent">
                <!-- 时间轴内容由 JS 动态生成 -->
            </div>
        </div>

        <script src="js/project-nav-data.js"></script>
```

- [ ] **步骤 2：验证 HTML 结构**

检查：确保结构正确嵌套在 `phone-frame` 内部，不影响现有元素

- [ ] **步骤 3：Commit**

```bash
git add service-miniapp/project-detail.html
git commit -m "feat: add project navigation HTML structure"
```

---

### 任务 3：添加导航组件 CSS 样式

**文件：**
- 修改：`service-miniapp/css/project-detail.css`（在文件末尾添加）

- [ ] **步骤 1：添加入口条样式**

```css
/* ============================================
   项目导航组件样式
   ============================================ */

/* 悬浮入口条 */
.project-nav-trigger {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 88px;
    background: rgba(24, 144, 255, 0.9);
    border-radius: 8px 0 0 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    transition: width 0.2s ease, background 0.2s ease;
}

.project-nav-trigger:hover,
.project-nav-trigger:active {
    width: 54px;
    background: rgba(24, 144, 255, 1);
}

.project-nav-trigger .nav-arrow {
    font-size: 16px;
    color: #FFFFFF;
    margin-bottom: 4px;
}

.project-nav-trigger .nav-text {
    font-size: 12px;
    color: #FFFFFF;
    writing-mode: vertical-rl;
    letter-spacing: 2px;
}

/* 入口条隐藏状态 */
.project-nav-trigger.hidden {
    display: none;
}
```

- [ ] **步骤 2：添加遮罩样式**

```css
/* 背景遮罩 */
.project-nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1001;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.project-nav-overlay.show {
    opacity: 1;
    visibility: visible;
}
```

- [ ] **步骤 3：添加抽屉面板样式**

```css
/* 抽屉面板 */
.project-nav-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: 85%;
    max-width: 375px;
    height: 100%;
    background: #FFFFFF;
    z-index: 1002;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
}

.project-nav-drawer.open {
    transform: translateX(0);
}

/* 抽屉头部 */
.drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #E8E8E8;
    background: #F5F5F5;
    flex-shrink: 0;
}

.drawer-title {
    font-size: 16px;
    font-weight: 600;
    color: #333333;
}

.drawer-close {
    font-size: 24px;
    color: #999999;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.drawer-close:hover,
.drawer-close:active {
    background: #EEEEEE;
    color: #333333;
}

/* 抽屉内容区 */
.drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
}
```

- [ ] **步骤 4：添加时间轴样式**

```css
/* 时间轴 */
.timeline {
    position: relative;
    padding-left: 24px;
}

.timeline-stage {
    position: relative;
    margin-bottom: 16px;
}

.timeline-stage:last-child {
    margin-bottom: 0;
}

/* 时间轴节点 */
.timeline-node {
    position: absolute;
    left: -24px;
    top: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    z-index: 1;
}

/* 时间轴连接线 */
.timeline-line {
    position: absolute;
    left: -17px;
    top: 20px;
    bottom: -16px;
    width: 2px;
    background: #E8E8E8;
}

.timeline-stage:last-child .timeline-line {
    display: none;
}

/* 阶段标题 */
.timeline-stage-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #F5F5F5;
    border-radius: 6px;
    cursor: pointer;
}

.timeline-stage-name {
    font-size: 14px;
    font-weight: 500;
    color: #333333;
}

.timeline-stage-status {
    font-size: 12px;
    color: #999999;
}

/* 任务列表 */
.timeline-tasks {
    margin-top: 8px;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.timeline-tasks.collapsed {
    max-height: 0 !important;
}

.timeline-task {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    margin-top: 4px;
    background: #FFFFFF;
    border-radius: 6px;
    border: 1px solid #E8E8E8;
    cursor: pointer;
}

.timeline-task:hover,
.timeline-task:active {
    background: #F5F5F5;
}

.timeline-task-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-right: 10px;
    flex-shrink: 0;
}

.timeline-task-name {
    font-size: 14px;
    color: #333333;
    flex: 1;
}

.timeline-task.current {
    border-color: #1890FF;
    background: #E6F7FF;
}

.timeline-task.current .timeline-task-name {
    color: #1890FF;
    font-weight: 500;
}

.timeline-task.current::after {
    content: '← 当前';
    font-size: 12px;
    color: #1890FF;
    margin-left: 8px;
}
```

- [ ] **步骤 5：添加状态颜色样式**

```css
/* 已完成状态 */
.timeline-stage.completed .timeline-node {
    background: #999999;
    color: #FFFFFF;
}

.timeline-stage.completed .timeline-line {
    background: #999999;
}

.timeline-stage.completed .timeline-stage-header {
    opacity: 0.7;
}

.timeline-task.completed .timeline-task-icon {
    background: #999999;
    color: #FFFFFF;
}

.timeline-task.completed .timeline-task-name {
    color: #999999;
}

/* 执行中状态 */
.timeline-stage.in_progress .timeline-node {
    background: #1890FF;
    color: #FFFFFF;
}

.timeline-stage.in_progress .timeline-line {
    background: #1890FF;
}

.timeline-stage.in_progress .timeline-stage-header {
    background: #E6F7FF;
}

.timeline-task.in_progress .timeline-task-icon {
    background: #1890FF;
    color: #FFFFFF;
}

.timeline-task.in_progress .timeline-task-name {
    color: #1890FF;
    font-weight: 500;
}

/* 待执行状态 - 即将执行 */
.timeline-stage.pending-soon .timeline-node {
    background: #FA8C16;
    color: #FFFFFF;
}

.timeline-stage.pending-soon .timeline-line {
    background: #FA8C16;
}

.timeline-task.pending-soon .timeline-task-icon {
    background: transparent;
    border: 2px solid #FA8C16;
    color: #FA8C16;
}

.timeline-task.pending-soon .timeline-task-name {
    color: #FA8C16;
}

/* 待执行状态 - 后续 */
.timeline-stage.pending .timeline-node {
    background: transparent;
    border: 2px solid #BFBFBF;
    color: #BFBFBF;
}

.timeline-stage.pending .timeline-line {
    background: #BFBFBF;
}

.timeline-task.pending .timeline-task-icon {
    background: transparent;
    border: 2px solid #BFBFBF;
    color: #BFBFBF;
}

.timeline-task.pending .timeline-task-name {
    color: #BFBFBF;
}
```

- [ ] **步骤 6：验证 CSS 语法**

检查：确保所有样式规则正确闭合，无语法错误

- [ ] **步骤 7：Commit**

```bash
git add service-miniapp/css/project-detail.css
git commit -m "feat: add project navigation CSS styles"
```

---

### 任务 4：添加导航交互逻辑

**文件：**
- 修改：`service-miniapp/js/project-detail.js`（在文件末尾添加或整合到现有模块中）

- [ ] **步骤 1：添加导航状态管理**

```javascript
/**
 * 项目导航模块
 */
const ProjectNav = {
    // 状态
    isOpen: false,
    currentStageId: null,
    touchStartX: 0,
    touchStartY: 0,
    
    // DOM 元素
    elements: {
        trigger: null,
        overlay: null,
        drawer: null,
        close: null,
        content: null
    },
    
    // 初始化
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.renderTimeline();
    },
    
    // 缓存 DOM 元素
    cacheElements: function() {
        this.elements.trigger = document.getElementById('projectNavTrigger');
        this.elements.overlay = document.getElementById('projectNavOverlay');
        this.elements.drawer = document.getElementById('projectNavDrawer');
        this.elements.close = document.getElementById('projectNavClose');
        this.elements.content = document.getElementById('projectNavContent');
    },
    
    // 绑定事件
    bindEvents: function() {
        // 点击入口条打开
        this.elements.trigger.addEventListener('click', () => this.open());
        
        // 点击遮罩关闭
        this.elements.overlay.addEventListener('click', () => this.close());
        
        // 点击关闭按钮
        this.elements.close.addEventListener('click', () => this.close());
        
        // 右滑手势关闭
        this.elements.drawer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.elements.drawer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.elements.drawer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    },
    
    // 打开抽屉
    open: function() {
        this.isOpen = true;
        this.elements.trigger.classList.add('hidden');
        this.elements.overlay.classList.add('show');
        this.elements.drawer.classList.add('open');
        
        // 延迟定位，等待渲染完成
        setTimeout(() => this.scrollToCurrentTask(), 100);
    },
    
    // 关闭抽屉
    close: function() {
        this.isOpen = false;
        this.elements.trigger.classList.remove('hidden');
        this.elements.overlay.classList.remove('show');
        this.elements.drawer.classList.remove('open');
    },
    
    // 处理触摸开始
    handleTouchStart: function(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    },
    
    // 处理触摸移动
    handleTouchMove: function(e) {
        if (!this.isOpen) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        // 判断是否为水平滑动
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
            this.close();
        }
    },
    
    // 处理触摸结束
    handleTouchEnd: function(e) {
        // 重置状态
        this.touchStartX = 0;
        this.touchStartY = 0;
    }
};
```

- [ ] **步骤 2：添加时间轴渲染函数**

```javascript
// 渲染时间轴
renderTimeline: function() {
    if (!projectNavData || !projectNavData.stages) return;
    
    const html = projectNavData.stages.map((stage, stageIndex) => {
        // 判断阶段状态
        let stageStatusClass = stage.status;
        if (stage.status === 'pending') {
            // 判断是否为即将执行（下一个阶段）
            const hasInProgress = projectNavData.stages.some(s => s.status === 'in_progress');
            if (hasInProgress) {
                // 找到 in_progress 阶段的索引
                const inProgressIndex = projectNavData.stages.findIndex(s => s.status === 'in_progress');
                if (stageIndex === inProgressIndex + 1) {
                    stageStatusClass = 'pending-soon';
                }
            }
        }
        
        // 生成任务列表 HTML
        const tasksHtml = stage.tasks.map(task => {
            let taskStatusClass = task.status;
            if (task.status === 'pending') {
                // 判断是否为即将执行（执行中阶段内的下一个任务）
                if (stage.status === 'in_progress') {
                    const currentTaskIndex = stage.tasks.findIndex(t => t.status === 'in_progress');
                    const taskIndex = stage.tasks.indexOf(task);
                    if (taskIndex === currentTaskIndex + 1) {
                        taskStatusClass = 'pending-soon';
                    }
                }
            }
            
            const isCurrent = task.status === 'in_progress';
            const icon = task.status === 'completed' ? '✓' : 
                        task.status === 'in_progress' ? '⏳' : '';
            
            return `
                <div class="timeline-task ${taskStatusClass} ${isCurrent ? 'current' : ''}" 
                     data-task-id="${task.id}" 
                     onclick="ProjectNav.goToTaskDetail('${task.id}')">
                    <span class="timeline-task-icon">${icon}</span>
                    <span class="timeline-task-name">${task.name}</span>
                </div>
            `;
        }).join('');
        
        // 计算任务列表高度
        const taskCount = stage.tasks.length;
        const tasksHeight = taskCount * 48 + 8; // 每个任务约48px高度 + margin
        
        // 阶段图标
        const stageIcon = stage.status === 'completed' ? '✓' : 
                         stage.status === 'in_progress' ? '⏳' : '';
        
        // 阶段状态文字
        const stageStatusText = stage.status === 'completed' ? '已完成' :
                                stage.status === 'in_progress' ? '进行中' : '待执行';
        
        return `
            <div class="timeline-stage ${stageStatusClass}" data-stage-id="${stage.id}">
                <div class="timeline-node">${stageIcon}</div>
                <div class="timeline-line"></div>
                <div class="timeline-stage-header" onclick="ProjectNav.toggleStage('${stage.id}')">
                    <span class="timeline-stage-name">${stage.name}</span>
                    <span class="timeline-stage-status">${stageStatusText}</span>
                </div>
                <div class="timeline-tasks" style="max-height: ${tasksHeight}px;">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }).join('');
    
    this.elements.content.innerHTML = `<div class="timeline">${html}</div>`;
}
```

- [ ] **步骤 3：添加展开/收起阶段函数**

```javascript
// 展开/收起阶段
toggleStage: function(stageId) {
    const stageEl = document.querySelector(`.timeline-stage[data-stage-id="${stageId}"]`);
    if (!stageEl) return;
    
    const tasksEl = stageEl.querySelector('.timeline-tasks');
    if (!tasksEl) return;
    
    if (tasksEl.classList.contains('collapsed')) {
        // 展开：恢复原始高度
        const taskCount = stageEl.querySelectorAll('.timeline-task').length;
        const tasksHeight = taskCount * 48 + 8;
        tasksEl.style.maxHeight = tasksHeight + 'px';
        tasksEl.classList.remove('collapsed');
    } else {
        // 收起
        tasksEl.classList.add('collapsed');
        tasksEl.style.maxHeight = '0';
    }
}
```

- [ ] **步骤 4：添加定位到当前任务函数**

```javascript
// 定位到当前任务
scrollToCurrentTask: function() {
    const currentTaskEl = document.querySelector('.timeline-task.current');
    if (!currentTaskEl) return;
    
    // 确保父级阶段展开
    const stageEl = currentTaskEl.closest('.timeline-stage');
    if (stageEl) {
        const tasksEl = stageEl.querySelector('.timeline-tasks');
        if (tasksEl && tasksEl.classList.contains('collapsed')) {
            const taskCount = stageEl.querySelectorAll('.timeline-task').length;
            const tasksHeight = taskCount * 48 + 8;
            tasksEl.style.maxHeight = tasksHeight + 'px';
            tasksEl.classList.remove('collapsed');
        }
    }
    
    // 滚动到当前任务
    const contentEl = this.elements.content;
    const taskTop = currentTaskEl.offsetTop;
    const contentHeight = contentEl.clientHeight;
    const taskHeight = currentTaskEl.clientHeight;
    
    // 计算滚动位置，使当前任务居中
    const scrollTop = taskTop - (contentHeight / 2) + (taskHeight / 2);
    
    contentEl.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
    });
}
```

- [ ] **步骤 5：添加跳转任务详情函数**

```javascript
// 跳转任务详情
goToTaskDetail: function(taskId) {
    // 关闭抽屉
    this.close();
    
    // 延迟跳转，等待动画完成
    setTimeout(() => {
        window.location.href = `task-detail.html?taskId=${taskId}`;
    }, 300);
}
```

- [ ] **步骤 6：在页面加载时初始化**

```javascript
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // ... 其他初始化代码 ...
    
    // 初始化项目导航
    if (typeof ProjectNav !== 'undefined') {
        ProjectNav.init();
    }
});
```

- [ ] **步骤 7：验证 JS 语法**

运行：`node -c service-miniapp/js/project-detail.js`
预期：无错误输出

- [ ] **步骤 8：Commit**

```bash
git add service-miniapp/js/project-detail.js
git commit -m "feat: add project navigation interaction logic"
```

---

### 任务 5：在 owner-miniapp 中同步添加相同功能

**文件：**
- 创建：`owner-miniapp/js/project-nav-data.js`（复制 service-miniapp 版本）
- 修改：`owner-miniapp/project-detail.html`
- 修改：`owner-miniapp/css/project-detail.css`
- 修改：`owner-miniapp/js/project-detail.js`

- [ ] **步骤 1：复制数据文件**

```bash
cp service-miniapp/js/project-nav-data.js owner-miniapp/js/project-nav-data.js
```

- [ ] **步骤 2：修改 owner-miniapp/project-detail.html**

添加相同的 HTML 结构（参考任务 2）

- [ ] **步骤 3：修改 owner-miniapp/css/project-detail.css**

添加相同的 CSS 样式（参考任务 3）

- [ ] **步骤 4：修改 owner-miniapp/js/project-detail.js**

添加相同的 JS 逻辑（参考任务 4）

- [ ] **步骤 5：验证所有文件**

检查：确保两个 miniapp 的导航功能一致

- [ ] **步骤 6：Commit**

```bash
git add owner-miniapp/
git commit -m "feat: add project navigation to owner-miniapp"
```

---

### 任务 6：集成测试与验收

- [ ] **步骤 1：启动本地服务器**

```bash
cd service-miniapp
python -m http.server 9528
```

- [ ] **步骤 2：打开项目详情页面**

访问：`http://127.0.0.1:9528/project-detail.html`

- [ ] **步骤 3：验证入口条显示**

检查：
- 入口条位于右侧垂直居中
- 显示"◀ 项目导航"文字
- 点击有 hover 效果

- [ ] **步骤 4：验证打开抽屉**

点击入口条，检查：
- 遮罩淡入显示
- 抽屉从右侧滑入
- 入口条隐藏

- [ ] **步骤 5：验证时间轴显示**

检查：
- 时间轴正确显示阶段和任务
- 颜色正确区分状态
- 当前任务有"← 当前"标记

- [ ] **步骤 6：验证自动定位**

检查：
- 打开抽屉时自动滚动到当前任务
- 当前任务所在阶段已展开

- [ ] **步骤 7：验证关闭抽屉**

测试：
- 点击遮罩关闭
- 点击关闭按钮关闭
- 右滑手势关闭

- [ ] **步骤 8：验证任务跳转**

点击任务，验证跳转到 task-detail.html?taskId=xxx

- [ ] **步骤 9：验证不影响现有功能**

检查：
- 页面其他功能正常
- 原有卡片、列表无异常

- [ ] **步骤 10：Commit 最终版本**

```bash
git add -A
git commit -m "feat: complete project navigation feature implementation"
```

---

## 验收清单

### 功能验收
- [x] 点击入口条能打开抽屉面板
- [x] 抽屉面板正确显示时间轴
- [x] 颜色正确区分任务状态
- [x] 打开时自动定位到当前执行任务
- [x] 点击任务能跳转到详情页
- [x] 点击遮罩/关闭按钮能关闭抽屉
- [x] 右滑手势能关闭抽屉

### 视觉验收
- [x] 入口条位置正确（右侧垂直居中）
- [x] 抽屉动画流畅
- [x] 时间轴布局清晰
- [x] 颜色方案符合设计规格

### 兼容性验收
- [x] 不影响现有页面功能
- [x] 在不同屏幕尺寸下正常显示
- [x] 触摸交互流畅