# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 工作空间绑定与协作约定（最高优先级）
- 工作空间 `C:\Users\123456\WorkBuddy\LZJBC-XH-FWLC` 经目录 junction 绑定 `D:\TraeProject\LZJPro\LZJBC-XH-FWLC`（由 `LZJBC-XH` 复制的副本，做「服务流程 FWLC」新需求）；原项目 `LZJBC-XH` 只读，绝不写。
- 中断即取消；先确认后改（方案/理由/风险表格→确认→实现；改完代码再同步 PRD，除非说"仅改代码"）。不影响既有流程/交互；不改 PRD 需用户点头。
- 页面规范：全局无滚动条；必带微信小程序默认导航栏（状态栏+nav+胶囊占位）；mobile-first 全宽堆叠、复合卡片不并排半宽；中老年可访问性（触控区大）。演示开关放手机框外，只改状态变量。
- 校验留痕：`node --check` + `.workbuddy/_validate_html.py` + CSS 大括号按 `<style>` 块统计 + jsdom 运行时测试（`.workbuddy/_tmp/jsdom-env`，先写 package.json 再 npm install）；改前 `cp` 备份 `.workbuddy/_tmp/*.bak`。
- 原型区域替换铁律：禁止用「下一个兄弟」当结束标记；按容器深度平衡替换，difflib 逐 hunk div 增减==0 + 锚点深度双对账。
- 行尾敏感：各文件 CRLF/LF 不一（flow-demo=**CRLF**；task-detail*.html、js/craft-ref.js、PRD-合同/完整/项目模块=LF），Python 统计行尾须 `newline=''` 读，否则误报。
- 弹窗层级：`.app-modal` 同 `z-index:1000`，同层 DOM 靠后者盖前者；弹窗内提示 `#appModal{z-index:1010}`/`.app-toast{1020}`。

## 项目主页（进行中）service-miniapp/project-list.html（2026-11-02 替换）
- **SSOT = `project-list.html`**（由 `project-detail-flow-demo.html` 演进后替换旧页；demo 页保留为沙箱/对照，后续改动以 project-list.html 为准）。CRLF。
- 骨架沿用旧页：`page-nav`(10 链接 + localStorage 折叠) / `topbar`(proj-switch 项目信息跳 project-info + 切换面板:全部|进行中|已完成 + 选项 + 新建项目→`create-project.html`，未认证弹 `#authRequiredModal`→`promoter-auth.html`) / `tab-bar`(首页/项目/消息/我的) / 框外 `demo-panel`（角色视角、认证状态、选中项状态、流程项数、指派权限）。
- 双视角：`#nonworkerView`（服务流程主视图，默认）/ `#workerView`（待办3/我的任务/quick-nav/合同/任务统计，无服务流程卡）；`setRole()` 切换并隐藏 `.flow-trigger`、关闭浮窗。
- 跳转对齐（旧页口径）：quick-nav 非工人=member/project-files/statement-list/contract-detail；工人=activity-list/architecture/member/project-files；待办全部=todo-list，合同待办=contract-detail?status=confirming_sender，任务待办/动态项/流程任务行=task-detail，我的任务=task-list?role=exec，动态全部=activity-list，合同类动态=contract-detail。`go()/navigate()/openPage()` 统一真实跳转。
- 服务流程卡片与浮窗（鱼眼 Tab/竖排书签/吸顶/居中/合同 chip/指派任务吸底条）同 demo 页逻辑，jsdom `test-project-list.js`(40)。
- 数据：`ITEMS[]`（id/name/kind:'contract'|任务型/status/done/total/stages[]/externals[]/hasContract）；sg=基础施工服务 5 阶段（collapsed 记忆 `fdStageCollapsed`）；cz 主材/rz 软装 hasContract:false；ht=设计服务。演示开关 6/8 项切换。
- 浮窗结构：`#fdFlowList`（鱼眼 Tab `.fd-ri-d0~d3` 距离缩放+mask 渐隐）+ `.fd-bm-wrap`（左侧竖排书签 `.fd-bm` `writing-mode:vertical-rl` 22px + `.fd-bm-util` 工具位=全部收起/展开）+ `#fdDetailBody`。
- 吸顶：浮窗内 `#fdFlowList` sticky top:0；`.fd-bm-col` sticky top:`var(--fd-rail-h)`（renderFlowDrawer 按 offsetHeight+marginTop 同步，防透明缝）。主页面 `.flow-card.flow-sticky` 提升为 `#pageBody` 直接子级 + `overflow:visible`（原 `overflow:hidden` 会阻断 sticky）。
- 居中：`centerRail(rail,item,smooth)` 自实现 scrollLeft 居中（不用 scrollIntoView）；rail 需 `position:relative`（否则 offsetLeft 基准错）+ `::before/::after` 首尾留白 `calc(50% - 42px)`。
- 合同入口：`contractAction(sel)` 按 `hasContract` 返回「拟定合同」(create) /「查看合同」(view)，chip 寄生在 `.fd-info` 与 `.flow-stats` 右端零新增行高；`goContract()` 带 `from=flow&item=<id>`。
- 指派任务（临时派遣）：**入口=明细区底部吸底条** `.fd-assignbar`(sticky bottom:0 + 上沿渐隐遮罩) 内含实心主色按钮 `.fd-ext-add`，任务多也在一步内可达；**每个流程项都有入口**（合同型走「临时派遣」书签 Tab；任务型项内容内联「临时派遣」`.fd-ext-sub` 区块），入口按**每流程项权限**显隐（`canAssign(it)` + 演示三态 `assignPermMode` all/partial/none，演示面板 `#optAssignPerm`），无权限时不渲染入口、`openAssignModal` 也拦截。
- 弹窗 `.assign-modal`(z-index:80)+`.am-*` 字段：任务名称*、**执行人\***（单选 AS_WORKERS）、**确认人（选填≤5，多选勾选 `.am-opt.checked`+✓、下拉不关、超限行内错误）**、执行标准*、确认标准选填、担责标准选填；**已取消「隶属阶段」**（表单字段/分组渲染/`toggleFdExtStage`/相关 CSS 均已删，列表为单一平铺 `.fd-ext-list`）。校验全行内错误无 toast；落库 `externals.push({name,exec,confirms:[],status})`（无 stage 字段），total+1 自动重算；任务行显示「确认N人」meta。函数 `openAssignModal/closeAssignModal/toggleAsSelect/closeAsDropdowns/pickAsExecutor/renderAsConfirmOptions/pickAsConfirmer/confirmAssignTask/fdAssignBar/canAssign` 均 window 导出。jsdom：test-assign.js(35) + test-assign-confirmers.js(27)。
- 未完成：演示页改动未回迁正式页 `project-detail-ongoing-v2.html`/`completed-v2.html`；PRD 同步搁置（用户选先预览）。
- 备份：`.workbuddy/_tmp/project-detail-flow-demo.html.bak-20261102-*`（bookmark/collapseall/fisheye/utilbm/ui/sgtasks/fdsticky/assign/confirmers）。

## 工人合同（service-miniapp）
- 六工种走 `worker-contract-detail.html`+`.js`（暴露 `WCP`）；基础/设计走 `contract-detail.html`；数据层 `contract-store.js`(`window.ContractStore`)。甲方=陈庄（工长）；意向乙方仅六工种、最多3人、非必选（2026-09-11 口径）。
- 变更流程：已签约→发起变更→对方确认→V2（**无上传签约文件**，相关页已删勿恢复）。受邀方视角 `viewer==='receiver'` 差异化。
- 「新建任务」=`#addTaskModal`（必填=名称+三标准）；执行人默认：乙方1人默认填、多人空。

## 工艺参考示例（跨端，2026-10-15/16）
- SSOT：服务方 `js/craft-ref.js`(`window.CraftRef`)，工人 8 页 head 注入（须在内联脚本前）；PC `pc/pc-craft-ref.js`(`window.PCCraftRef`)。仅图片、3 列、≤9 张/组；任务级两组（exec/confirm）互不影响；`refs=[{src,title}]`，DOM `data-exec-refs`/`data-confirm-refs`。
- 排序铁律：执行标准→执行示例→确认标准→确认示例→担责标准。只读无图整块隐藏（含标题）。`.craft-ref` 不得放进会被 `innerHTML=` 覆盖的 list 容器内。
- PC 特有坑：`.task-detail-content` stopPropagation → document 委托失效，须容器级 `bindClicks`。
- 教训：Python 替换含 `</script>` 锚点必须原样带回闭合标签；HTML BALANCED 不校验 script 配对需 grep 计数。
- 非工人 `contract-detail.html` 是独立内联实现未迁模块；`task-detail*.html` 为静态 craft-ref。
- PRD SSOT=《PRD-合同模块详细规格》第十一章 `#craft-ref-spec`；各端只写落位锚点。PRD 章节末尾追加小节时锚点必须含该章闭合 `</div>`。

## 数据口径/页面约定（精选）
- 业主端项目详情=`project-detail-ongoing-v2`/`completed-v2`（共享 css/js 勿误删）；原型城市限北京/南阳/西安，主示例西安。「基础施工服务合同」演示页=`contract-detail.html`（城市**北京**，模板在 `js/contract-detail.js` 的 `contractTemplates`/`stageTemplates`，勿回退西安）。
- 业主方 `owner-miniapp/contract-detail.html` 单文件多状态（无「已完成」，仅 `signed`；`demoFulfilled()` 仍 signed）；**无上传签约文件功能**（已删勿恢复，保留 `#signConfirmModal` 与时间轴历史记录）；任务跳转仅 signed 分支带 `from=contract` 上下文，`#contractNameValue` 取合同名。
- 服务方任务跳转：已签约态 task-item→`openTaskReadonly()`→URL 带 `from=contract&taskName&contractName&stageName&exec/confirm/liableStandard`；task-detail 侧仅认 `from=contract`，`renderStandardFromContract()` 整条渲染、空→「未设置」。
- 待办不含临时任务/待审核；「合同任务执行」待办已取消走服务号通知。服务通知 SSOT=《PRD-完整文档》§7.10。
- PRD 规范：「中文（英文标识符）」前置；状态机表列序 `显示文案|状态key|…`；V1 不写历史对比；禁「对原有交互的影响」总结小节；状态基准以原型为权威。PRD 行尾：合同/完整/项目=LF，任务/PC其他=CRLF。

## 项目架构页·复制发起
- `architecture.html`：`groupContracts`=组名→合同数组；入口=有合同「查看合同」弹窗内「📋 复制发起」/无合同「📝 创建合同」；`copyContract()`→`contract-copy-initiate.html?group=&source=&from=architecture`。PRD 落位 §6.12+§7.12。

## 团队成员页 member.html（单树嵌套成员 v2，LF）
- 团队成员 = **member.html 升级承载**（URL 不变）。**单树嵌套**：成员紧凑行（复用 renderMemberCard）直接嵌在各层级下方（`.tnode` 包裹每节点：row + `.node-members` + `.tree-children`），无独立成员列表/分组下拉/筛选条/invite-fab。architecture.html 保留不动。
- **落位规则**：`nodeDirectMembers(node)`=归属本节点且不归属任何子节点（最具体层级唯一落位）；`archMemberMatch` 基于 findArchNode/findArchParent（L2=上级工作组+role 名，兼容动态节点）。节点人数=**含下级聚合**（build 返回 count：项目部 9/水电 3/强电弱电各 1）。弱电组成员=钱九（非示意图的周七）。
- **开关模型**：`memOnFor`=节点记忆 memShown > 全局 allMemOn > 跟随 archExpanded（顶层函数）；`toggleAllMem()` 清空 memShown 全局接管（true 展开全部路径）；`toggleNodeMem(key)` 先物化全部节点状态再翻转目标。默认 allMemOn=false（收起人员）；卡头 `#memAllToggle`(展示全部人员/收起人员) + `#archToggleBtn`(收起/展开架构)。
- **⋯ → 底部动作面板** `#archSheet`(fixed z-1201)+`#archSheetMask`(z-1200)：`openArchSheet(key)` 组装 items{t,fn,args}，行 onclick=`archSheetRun(i)` 经 window[fn].apply 调用；闭环=openCreateNodeModal/inviteToNode/openRenameNodeModal/showExitArchNodeModal(已加入)/showDeleteNodeModal(未加入)；`checkCanExitArchGroup` 任务角色拦截走 showAlert。**权限入口保留**：徽标/箭头→showPermissionModalIfAllowed、头像→goToProfile；savePermission 后 renderArchTree 刷新树内标签。
- **统一搜索**：搜索栏常驻于架构卡上方；`handleSearch` 置 currentSearchKw + allMemOn=true；树内过滤层级+成员（memberMatchesKw：姓名/角色/roleTag）；archHeadSub=「命中 N 个层级 · M 位成员」；clearSearch 复位 allMemOn=false。
- 已删（勿恢复）：selectFilter/renderMemberList/toggleMemArea/applyArchNode/toggleArchActions/syncArchFilterUI/toggleSearchBar/closeSearchBar/filterDropdown 三函数/**其 click-outside 处理器**（元素删除后 null.contains 全局报错）；confirmCreate/Rename/Delete 内下拉同步改纯 renderArchTree。
- 校验：node --check / BALANCED / CSS 312+7 / script 287:287 / LF；jsdom **test-member-tree.js 66/66**（SSOT，旧 merge/arch 已归档 .bak-legacy）；test-member-perm.js 28/28（改树内断言）、test-project-list.js 59/59 绿。备份 `.bak-20261103-treeembed`。

## 项目主页（进行中）= service-miniapp/project-list.html（新设计页替换旧页后）
- 页面=新设计（服务流程卡+浮窗）+ 旧页骨架（10 项原型导航、顶栏项目信息→project-info、切换面板+新建项目+认证拦截、底部 tab-bar、框外演示面板含角色/认证/权限开关）。`project-detail-flow-demo.html` 降为对照沙箱，后续改动以 project-list 为准。
- 双视角：`#nonworkerView` 同非工人；`#workerView`=待办(3)/我的任务/**我的服务流程**/快捷入口/我的合同/任务统计；`setRole()` 切显隐并隐藏 `#flowTrigger` + 关浮窗。
- 工人快捷入口（4 格）：项目动态→activity-list；**团队成员→member.html**（原「架构+成员」合并，架构入口保留在合同卡「查看架构 ›」）；资料→project-files；**我的合同→`scrollToContract()` 滚动定位 `#contractListWorker` 并 1.4s 高亮**（不新开页）。
- 工人「我的服务流程」：**按我签署的合同驱动，只渲染合同隶属的流程项**（量房/设计/售后等无关项不出现）；数据 `MY_CONTRACTS[]`（contract/flowItem/flowIdx/flowTotal/itemStatus/itemDone/itemTotal/signState/progress/stages[{n,s:done|cur|todo}]/myStage/myDone/myTotal/href）；`myFlowHtml()/renderMyFlow()`；卡头「N 份合同 + 主线第 X/Y 环」；阶段轨当前段带「我」标记（`.mf-st.cur` 品牌渐变）；底部「我的任务 n/m · 当前阶段」+「查看合同 ›」；多份合同**纵向堆叠不横向滑**；无指派/拟定合同/阶段折叠/浮窗入口。
- 卡头右侧=`#mfViewAll`「查看全部 ›」→`openFlowDrawer()`（与非工人浮窗完全一致），显隐由 `canViewAllFlow` 控制（演示面板 `#optViewAll` 可查看/不可查看）；**原「主线第 X、Y 环」文案已删**。
- 工人视角**不再有独立「我的合同」卡与「任务统计」卡**（与流程块内合同名/进度、我的任务统计重复，已删，勿恢复）；快捷入口「我的合同」→`scrollToMyFlow()` 定位 `#myFlowCard` 并高亮。
- `canAssign()` 含 `currentRole==='worker' → false`，工人浮窗内不渲染指派入口。
