# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 工作空间 ↔ 本地项目绑定（2026-10-29）
- 本 WorkBuddy 工作空间 `C:\Users\123456\WorkBuddy\LZJBC-XH-FWLC` 已通过**目录 junction（重解析点）**透明绑定到本地项目 `D:\TraeProject\LZJPro\LZJBC-XH-FWLC`。工作空间路径下的所有读写即直接作用于该本地项目（junction 目标），无文件复制、无漂移。
- 该本地项目由 `LZJBC-XH` 复制而来，用途：在 `LZJBC-XH-FWLC` 新增「**服务流程（FWLC）**」相关需求；调整与预览均落在副本，**绝不影响原项目** `D:\TraeProject\LZJPro\LZJBC-XH`。
- 工作约定：所有编辑、PRD 变更、预览都针对 `LZJBC-XH-FWLC` 副本；如需对照原项目，仅只读访问 `LZJBC-XH`，不对其做任何写操作。

## 协作约定（最高优先级）
- 中断即取消；先确认后改（结构化表格：方案/理由/风险→确认→实现；改完代码再同步 PRD，除非说"仅改代码"）。
- 改动前置约束：不影响基础施工/设计合同原流程；工人合同逻辑经 `isWorkerType`/独立页面门控；不破坏既有交互与其他模块。
- 无滚动条全局（`::-webkit-scrollbar{display:none}`+`scrollbar-width:none`+`-ms-overflow-style:none`）；页面必带微信小程序默认导航栏（状态栏+nav+原生胶囊占位）；mobile-first 全宽堆叠、复合卡片不并排半宽；兼顾中老年可访问性（触控区够大）。
- 校验留痕：`node --check` 验 JS + `.workbuddy/_validate_html.py` 验 HTML 标签平衡 + **CSS 大括号按 `<style>` 块逐个统计** + id 引用自检；验收后截图复核。
- 演示开关/说明放手机框右侧框外（`.arch-demo-stage`+`.arch-demo-note` 左侧 2px 虚线蓝条），只改状态变量、不调语义不符的既有函数。
- 弹窗层级：`.app-modal` 同 `z-index:1000`，同层时 DOM 靠后者盖前者；弹窗内触发提示须 `#appModal{z-index:1010}`/`.app-toast{z-index:1020}`。
- 演示页回迁正式页：先 Python 正则剔除 `data-page-node-id` 并 rstrip 归一再 diff；批量替换脚本每处 `count==1` 断言防静默；回迁后清洗版 diff 剩余差异=演示专有项；改前 `cp` 备份 `.workbuddy/_tmp/*.bak`；演示专有说明卡/标题后缀/装饰注释不回迁。

## 项目架构页·复制发起
- `architecture.html` 已接管演示页复制发起能力（等价 `architecture-multi-contract-demo.html`）。数据模型 `groupContracts`=组名→合同数组；`contractsOf`/`hasSignedContract`。
- 常规入口唯一：有合同节点「查看合同」→弹窗内每份「📋 复制发起」；无合同节点「📝 创建合同」空白新建。`copyContract()`→`contract-copy-initiate.html?group=&source=&from=architecture`。「已有合同→弹创建方式」是不可达防御分支，PRD 仅写"如因数据同步触发不阻断"。
- PRD 落位：§6.12（项目模块）+ §7.12（合同模块，字段差异 §7.12.2 对比 §7.5.3.1 拟定中页 + §7.12.3 隶属架构层级）；权限=创建合同权限；禁历史对比。

## PRD 书写规范
- 「中文（英文标识符）」前置；状态机表列序 `显示文案|状态 key|…`；V1 不写历史对比、不为已砍功能留专节。
- 禁「对原有交互的影响」总结小节（影响已写入对应小节则不单列）。状态基准以原型为权威：工人合同看 `contract-store.js`+`worker-contract-detail.js` STATUS_CONFIG；基础/设计看 `contract-detail.*`；PC 用自有 key（`pending_review`/`reviewed_*`）属另一层映射，勿改。

## 工人合同（service-miniapp）
- 六工种走 `worker-contract-detail.html`+`.js`（合并页暴露 `WCP`）；基础/设计走 `contract-detail.html`。数据层 localStorage，`contract-store.js` 提供 `window.ContractStore`。
- 甲方=陈庄（工长，非业主）；意向乙方仅限六工种（`TRADE_ROLE_BY_TYPE` 过滤），业主不参与。
- **乙方必选/可选口径（2026-09-11）**：`create-contract.html` 选工人类型时，意向乙方（仅工种、最多3人）为非必选（0-3 人可选）；`worker-contract-draft-initial-new.html` 拟定中页与 `contract-copy-initiate.html` 复制发起页的意向乙方维持各自既有口径（未改）。三页「乙方=当前意向乙方」，0 人时下游按空处理。
- 受邀方视角 `viewer==='receiver'` 差异化（renderMeta/正文预览/终态 `#receiverEndedView`）；阶段任务卡标题：发起方=「阶段任务」、受邀方=「🔧 承接任务」。
- 变更流程：已签约→发起变更→对方确认→生成 V2（**无上传签约文件环节**）。`change_signing_wait`/`worker-change-sign-upload.html`/`worker-sign-upload.html` 已删，勿恢复。合规版 `contract-detail.*` 含平台审核属另一流程，勿混。
- 「新建任务」=弹窗 `#addTaskModal`（必填=名称+执行·确认·担责三标准）；执行人默认：乙方仅1人→默认填、多人→空；无签约文件区（已下线）。

## 数据口径/页面约定
- PC 合同文本模板：六类工人合同双字段（违约责任可编辑绿标 / 固定条款不可编辑红标）；基础/设计单一「合同正文」。口径与小程序 `buildTemplatePreviewSections()` 同步。
- 待办：不含临时任务/待审核；任务类标签「任务」；层级不进 todo-list（按人聚合）。「合同任务执行」待办类型已取消→走微信服务号通知提醒。
- 服务通知 SSOT=《PRD-完整文档》§7.10（5 项微信订阅消息）；站内不占消息页 Tab、任务提醒不生成应用内待办。消息页 service 仅邀请/合同邀约；owner 不显 Tab，未读走 `#navMsgBadge`。
- 业主端项目详情收敛为 `project-detail-ongoing-v2.html`/`project-detail-completed-v2.html`（共享 css/js 勿误删）。原型城市限 北京/南阳/西安，主示例 西安。
- 阶段编辑器双套并行：拟定中 `#editStageList`(`.stage-card`) + 变更 `#stageEditContainer`(`.stage-edit-item`)，相关函数须兼容双选择器 `.stage-card, .stage-edit-item`。
- 「基础施工服务合同」演示页 = `contract-detail.html`（城市**北京**）：合同文本模板/阶段模板数据在 `js/contract-detail.js` 的 `contractTemplates`/`stageTemplates`（`type:基础施工服务合同`、`city:北京`，两处筛选条件据此取值，勿再回退 `西安/水电工程`）；模板正文参照页面「查看全文」。合同正文展示框三态高度统一：`.contract-text-preview`(拟定中) / `.change-contract-content .content-preview`(变更中) / `.text-content#readonlyContractText`(只读态) 均用 `--contract-text-max-height`(120px) + 底部渐隐；改只读态用 id 精确作用，勿波及 `#supplementaryTerms`。
- 任务跳转携带上下文：已签约态 `#stagesSection .task-item` 点击 → `openTaskReadonly()` → `navigateToTaskDetail()`，URL 带 `from=contract&taskName&contractName(取 #editContractName=基础施工合同0810)&stageName(取 .stage-item>.stage-name)&exec/confirm/liableStandard(取 data-*)`。`task-detail.html` 侧 `applyTaskContextFromUrl()` **仅认 `from=contract`**（其余入口零影响），三标准用 `renderStandardFromContract()` 按原文整条渲染为 1 条编号项、空值→「未设置」（`#stagesSection` 内 2 个 `task-added` 无 data 属性属正常）。
- 业主方 `owner-miniapp/contract-detail.html` 是**单文件多状态**（`ContractDetailPage.updateContractStatus()` 切换），无独立状态页；其「合同正文/查看全文/阶段任务」已同步为基础施工服务合同（7 阶段 28 任务 ×2 处：`#stagesSection` 只读 + `#stageEditContainer` 变更编辑）。注意 `#stagesSection` 里隐藏的 `#newStageItem` **夹在基础阶段中间**（其后还有原「收尾阶段」）；`owner-miniapp/js/contract-detail.js` 的 `TASK_EXEC_STD` 键=28 项基础施工任务，`openTaskReadonly()` 已改为 data-* 优先。
- 业主方任务跳转（2026-09-23，对齐服务方口径）：owner 合同状态**无「已完成」**，只有 `signed`（已签约）；「已签约（已履约完成）」演示经 `demoFulfilled()`→`updateContractStatus('signed')`，`currentStatus` 仍是 `signed`，故**仅 `signed` 分支**跳 `owner-miniapp/task-detail.html` 且带上下文。`onTaskItemClick`→`navigateToTaskDetail(taskItem,taskName)`；合同名取新增的 `#contractNameValue`（合同信息行「合同名称」值 div，原无 id），回退常量「基础施工服务合同」；阶段取 `.stage-item>.stage-name`；三标准取 `taskItem.dataset.*`。owner 侧 `applyTaskContextFromUrl()`/`renderStandardFromContract()` 在 IIFE 顶层 `initFromUrl()` 之后调用（owner 的 `initFromUrl` 非 DOMContentLoaded 内）；仅认 `from=contract`。
- 业主方**无「上传签约文件」功能**（2026-09-23 已删，勿恢复）：`owner-miniapp` 的 `confirmed` 态曾有待办 `actions:[{action:'upload'}]`→`showStatusModal('upload')`→`showSignUploadPage()` 打开 `#signUploadPage` 全屏上传浮层。已删：`#signUploadPage` 整块、签约文件卡片 `#signFileUploadBtn`（`+ 上传`）、6 个上传 JS 函数（`showSignUploadPage/closeSignUploadPage/handleSignFileSelect/renderSignFileList/removeSignFile/submitSignFile`）及 exposed-map/window 赋值、`actionTexts.upload`、`showStatusModal` 的 upload 分支、`.sign-upload-page` CSS 整块；`confirmed` 的 `actions` 改 `[]`、desc 改「签约文件由乙方上传后合同正式生效」。**保留** `#signConfirmModal`（确认/驳回签约复核弹窗，另一功能，本已孤立未接）与时间轴「上传签约文件」历史记录（记录非操作）。变更流 `upload_change_sign` 不依赖该页（仅 toast+转 `signed`），故不受影响。注：`updateBottomActions` 在 `actions=[]` 时 `display:none` 清空（同既有 `signed` 只读态），DOM 中无 `.bottom-dock`/预览合同按钮（仅遗留 CSS）。
- **原型区域替换铁律**：禁止用「下一个兄弟/已知元素」当结束标记（会吃掉容器闭合 `</div>`）；必须按**容器深度平衡**只替换容器内部。验收必须做「difflib 逐 hunk 的 div 增减 == 0」+「关键锚点累积 div 深度与备份一致」双对账，仅看「总开合平衡」会漏掉嵌套错位。

## 任务详情页·工艺参考示例（2026-10-15 新增；16:34 调整为无视频·3列网格）
- 两个任务详情页均已加：① `service-miniapp/task-detail-shuidian.html`（**单行巨型 HTML + LF 行尾**）；② `service-miniapp/task-detail.html`（`taskName=穿线`，LF 行尾，**无 `fillStandard`**）。编辑均须保持 LF。
- 复刻到 `task-detail.html` 时注意：本页**无 `--bg-tertiary`** 变量，`.craft-ref-item` 背景改字面色 `#F2F3F5`；`--border-color`/`--text-primary` 本页存在可沿用。
- 「执行标准」「确认标准」`standard-card` 内各含 `.craft-ref`（标题 `.craft-ref-title`「工艺参考示例」+ `.craft-ref-media`）；媒体项为纯图片 `.craft-ref-item`（无视频项），用 `background-image`（`../shared/images/site-*.png`）+ `aspect-ratio:1/1`，布局为 **`display:grid;grid-template-columns:repeat(3,1fr);gap:8px`（一排 3 个、最多 9 张）**。⚠️ 本版**不支持视频**。
- **关键约束**：`.craft-ref` 必须放在 `#execStandard`/`#confirmStandard` **之外**（紧随 list 之后、卡片闭合 `</div>` 之前）。原因：URL 参数脚本 `fillStandard()` 会 `box.innerHTML=` 整体覆盖该 list；放内部会被清空。放外部不影响 `toggleStandard()` 的 `list.previousElementSibling`（仍为 card-header）。
- 交互：缩略图 `onclick="viewCraftMedia(this)"`（读 `data-media-type/src/title`）→ 页面内联 JS 惰性创建 `#craftMediaViewer`（`.craft-viewer`，`position:absolute;inset:0;z-index:1200`，置于 `.phone-frame` 内）放大显示图片；`closeCraftMedia()` 关闭；两者均 `window.*` 导出。
- 样式/脚本均加在**页面内联** `<style>`/`<script>`（页面级，不污染 `css/task-detail.css` 与共享文件）。
- **合同详情·工艺参考示例配置（2026-10-15 加；2026-10-16 改为整页 + 多选）**：`service-miniapp/contract-detail.html`(CRLF)/`css`(CRLF)/`js`(LF)。「添加新任务」`#addTaskModal` 与「编辑任务」`#editTaskModal` 内，执行/确认标准 textarea 后各增「工艺参考示例」配置区（增删改）：4 个 `.craft-ref-config`(`craftRefCfg-new/edit-exec/confirm`) + 列表(3 列、最多 9 张、✎/×)。**编辑以整页 `#craftRefEditorPage` 承载**（`z-index:800`、从右滑入 translateX(100%→0)、自带状态栏+导航栏「←返回/标题/胶囊」、底部固定保存栏），**已取消「从常用示例中选择」预设**（无 `CRAFT_REF_PRESETS`）；**上传支持多选**（add 模式 `input.multiple`、一次多张；edit 模式单张替换关多选）；逐张缩略图+可编辑标题+删除、计数「已选 X / 9 张」、满额隐藏上传占位。state：`newTaskCraftRefs`/`newTaskConfirmCraftRefs`/`editTaskCraftRefs`/`editTaskConfirmCraftRefs`/`craftRefEditorCtx`/`craftRefEditorBuffer`(工作缓冲)；落库经 `.task-edit-item` 的 `dataset.craftRefs`/`confirmCraftRefs`(JSON)。`openTaskReadonly` 走 `.edit-task-modal.readonly` → 隐藏「添加」与 ✎/×（纯展示）。函数 `openCraftRefEditor/saveCraftRef/closeCraftRefEditor/deleteCraftRef/handleCraftRefUpload/renderCraftRefEditor/updateCraftRefItemTitle/removeCraftRefBufferItem` 均 `window.*` 导出。验证：HTML BALANCED、CSS 716/716、`node --check` OK、jsdom 21/21。备份 `.workbuddy/_tmp/*-bak-20261016-craftpage`。
- **工人合同「工艺参考示例」共享模块（2026-10-16 最终形态）**：SSOT = `service-miniapp/js/craft-ref.js`（`window.CraftRef`，LF）。工人 8 页统一 head 注入 `<script src="js/craft-ref.js">`（**必须在内联脚本之前**，各页 `renderStages()` 在脚本末尾立即执行）；页面 API：`CraftRef.setRefs('new'|'edit','exec'|'confirm',refs)` 载入+渲染、`getRefs` 取回落库（`t.execRefs/confirmRefs`）、`renderDisplay(containerId,refs)` 只读渲染、`openEditor/renderEditor/handleUpload(多选)/save/deleteRef/closeEditor/updateTitle/removeBufferItem`、`viewImage/closeViewer`、`setToastHandler`（不注入用模块兜底 toast，惰性建于 `.phone-frame`）。**上限 9 张、3 列网格、仅图片无视频**；只读展示点击放大用**事件委托**（`data-cr-idx`）防标题引号转义问题。查看器 `#craftRefViewer`(`position:absolute;inset:0;z-index:900`)、展示 `.craft-ref-display` 样式在共享 `css/contract-detail.css`（CRLF）；整页 `#craftRefEditorPage`(`z-index:800`)+配置列表样式亦在该共享 CSS。**配对排序铁律**：执行标准→执行示例→确认标准→确认示例→担责标准（曾因两块示例堆在确认标准后被用户截图纠正）。接线页：合并页 `worker-contract-detail`(WCP IIFE 内 `CraftRef.*`)、拟定中 `worker-contract-draft-initial-new`（无 taskDetailModal，查看即编辑弹窗）、变更 `worker-contract-change`（`normalizeTask` 须保留 `execRefs/confirmRefs`；init 要求 URL `?id=`）；只读页×5（confirming/signed-initiator、receive-inviting/confirmed/fulfilled）经 `.task-item` 的 `data-exec-refs/data-confirm-refs` + `viewTaskDetail` 渲染展示，首任务播种 site-1/site-2 演示图。非工人 `contract-detail.html` 仍是独立内联实现（未迁入模块），`task-detail*.html` 为静态 craft-ref（`viewCraftMedia`，类名 `.craft-viewer` 不冲突）。教训：Python 替换含 `</script>` 的锚点必须原样带回闭合标签；HTML BALANCED 不校验 script 配对，需 grep `<script`/`</script>` 计数。备份 `.workbuddy/_tmp/*.bak-20261016-craftmodule`。

## PC 端·工艺参考示例（2026-10-16 新增）
- SSOT = `pc/pc-craft-ref.js`（**CRLF**，`window.PCCraftRef`）。仅图片、一排三个、最多 9 张。API：`renderDisplay(containerId, refs)`（容器需带 `class="pc-craft-block"`，空数据整块隐藏含标题）/ `renderConfig(containerId, 'exec'|'confirm', refs)` + `getConfig(type)`（可编辑配置，`.pc-craft-ref` 容器）/ `stripHTML(refs,label)` + `stripRowHTML(exec,confirm)`（任务行只读小图条）/ `handleUpload(type, input)`（多选，超 9 截断）/ `editTitle(type,i)`（`prompt` 改标题）/ `removeItem` / `viewImage`+`closeViewer`（惰性 `#pcCraftViewer`，`position:fixed;z-index:10050`，挂 body，点任意处关闭）/ `bindClicks(target)`（幂等容器级绑定）/ `repaint(type)` / `setToastHandler`。
- **PC 特有坑**：`.task-detail-content` 带 `event.stopPropagation()` → **document 级委托失效**，必须在 `renderDisplay`/`renderConfig` 的容器上 `bindClicks`；`renderTaskList` 末尾也对 `#taskListContent` `bindClicks`。缩略图点击时 `stopPropagation`，避免触发遮罩「点击空白关闭」。
- 样式全部在 `pc/pc-common.css`（**LF**，第 30 节；该文件是 PC 唯一 LF 文件，其余 PC 文件均 CRLF）。`.pc-craft-item` 只读为正方形；**配置区 `.pc-craft-ref` 内 `grid-auto-rows:110px` 压行高**（700px 弹窗防溢出）。
- 接线：
  - `pc-contract-detail.html` / `pc-contract-detail-reviewing.html`（共享 `pc-contract-detail.js`，均 CRLF）：`#taskDetailModal` 内 `#taskDetailExecCraftRef` / `#taskDetailConfirmCraftRef`；11 处 `.task-row` 一律 `onclick="showTaskDetail(this, ...)"`，演示数据写在该行 `data-exec-refs` / `data-confirm-refs`（单引号属性 + JSON）。`showTaskDetail(rowEl, name, ...)` 保留**旧签名兼容**（首位为字符串则整体左移一位）。
  - `pc/pc-stage-template.html`（CRLF）：`#taskEditModal` 内 `#taskExecCraftRef` / `#taskConfirmCraftRef` 配置区；`cloneStages` 保留 `execRefs/confirmRefs`；`renderTaskList` 写 `dataset.execRefs/confirmRefs` 并渲染「执行/确认」两组小图条；`stageData` 播种演示图。**模块 `<script src="pc-craft-ref.js">` 必须在主内联 `<script>` 之前**（页面末尾 IIFE `editTemplate(1)` 立即 `renderTaskList`）。
- 验证口径：3 页 BALANCED + script 配对 + 内联 `node --check` + `pc-common.css` 大括号 + **difflib 逐 hunk div 失衡=0** + 锚点深度对账；jsdom 冒烟 `.workbuddy/_tmp/pc_craft_smoke_detail.js`（29 项，可传 `pc/pc-contract-detail-reviewing.html` 参数）与 `pc_craft_smoke_stage.js`（42 项）。备份 `.workbuddy/_tmp/pc-*.bak-20261017-craft`。

## PRD·工艺参考示例同步位置（2026-10-16 补）
- **SSOT = `PRD-合同模块详细规格.html` 第十一章「工艺参考示例规格（跨端通用）」`#craft-ref-spec`**（11.1~11.6）。各端只写落位、不重复规则。
- 各端落位锚点：合同模块内 `#sec-2-11`（PC 合同详情·任务详情弹窗）/ `#sec-3-4` 注 + `#sec-3-5-2-1` note（服务方非工人）/ `#sec-4-6`（业主端）/ §7.6.2 note + §7.11.2 表行 + §7.11.3 段（工人合同）/ `#sec-8-9`（受邀方）；`PRD-PC端其他模块详细规格.html#s2-9-1`（阶段任务模板）；`PRD-任务模块详细规格.html` §3.4 注 + §6.1 行；`PRD-完整文档.html` 六、功能清单「任务管理」组。
- 口径要点：任务级两组（执行 / 确认）互不影响；`execRefs`/`confirmRefs` = `[{src,title}]`；DOM `data-exec-refs`/`data-confirm-refs`（服务方非工人合同为 `data-craft-refs`/`data-confirm-craft-refs`）；仅图片无视频、每组 ≤9 张；只读态无图整块隐藏（含标题）；排序「执行标准→执行示例→确认标准→确认示例→担责标准」。
- **插入铁律**：给 PRD 章节**末尾追加小节**时，锚点必须包含该章节的**闭合 `</div>`**，新小节插到闭合标签**之前**；只锚定「下一章注释」会把新小节扔到 section 外并多出闭合标签。验收用「difflib 逐 hunk div 增减 == 0 + 原文 divΔ 不变」双对账。
- 行尾：`PRD-合同模块…`/`PRD-完整文档`/`PRD-项目模块` = LF；`PRD-任务模块…`/`PRD-PC端其他模块…` = CRLF。
