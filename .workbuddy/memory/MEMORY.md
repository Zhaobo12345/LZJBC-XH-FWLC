# 项目长期记忆（LZJBC-XH 家装平台原型）

## 一、工作空间与协作约定（最高优先级）
- 工作空间 `C:\Users\123456\WorkBuddy\LZJBC-XH-FWLC` 经 junction 绑定 `D:\TraeProject\LZJPro\LZJBC-XH-FWLC`；原项目 `LZJBC-XH` 只读，绝不写。
- **中断即取消**；**先确认后改**（方案/理由/风险表 → 确认 → 实现；改完代码再同步 PRD，除非「仅改代码」；不改 PRD 需点头）。不影响既有流程/交互。
- 页面规范：全局无滚动条；小程序必带默认导航栏（状态栏+nav+胶囊占位）；**手机框外右侧必带 `.page-nav`**（fixed 右上、可折叠 + `localStorage:pageNavCollapsed`；样式取 `common.css`，link 了 common.css 的页零 CSS 新增只补 HTML + `togglePageNav/restorePageNav`；当前页 `a.active`）；mobile-first 全宽堆叠、复合卡片不并排半宽；中老年可访问性；演示开关放手机框外只改状态变量。
- 校验留痕：`node --check` + `.workbuddy/_validate_html.py` + jsdom/行尾守恒；改前 `cp` 备份 `.workbuddy/_tmp/*.bak-日期-主题`。
- 替换铁律：禁用「下一个兄弟」当结束标记；按容器深度平衡替换。含 `</script>` 的锚点必须原样带回。
- 行尾敏感：各文件 CRLF/LF 不一（service/task-list=**CRLF**；task-detail*.html、js/craft-ref.js、member.html、PRD=LF）。Python 须 `newline=''` 读写。
- 弹窗层级：`.app-modal` 同 `z-index:1000`；`#appModal{1010}` / `.app-toast{1020}`。

## 二、合同归属硬口径（2026-11-10 用户确认，最高优先级）
- 合同**唯一归属服务流程项** `flowId/flowName`，`parent` 是唯一层级字段。**禁止生成无归属合同**：创建/复制/草稿/邀约入口必须带有效 `flowId`；空 `flowId` 返回 null。
- 合同不隶属架构层级：架构层级展示**一律删除**（非隐藏/非「旧版兼容」）；`group`/`joinedArchitecture`/`ARCH_LEVEL_MAP`/`?level`/`data-level` 已全清。**例外**：两端 `member.html` 架构树、邀请消息、框外口径声明；旧 `architecture.html` 11-09 归档。`?level`/`?group` 是组织上下文兼容参数，不代表合同归属。
- 复制发起按 `ct` 分流：六工种 → `contract-copy-initiate.html`；基础/设计 → `service-contract-copy-initiate.html`。**所有复制发起入口必须带 `item`(flowId)/`parent`/`source`**；`doSubmit/doSave` 以 flowId 非空为前置校验。
- 服务流程配置 6 项（量房/初步设计/设计服务/基础施工服务/主材安装/售后）；合同类型 **8 类**（基础/设计 + 6 工种），SSOT=`service-miniapp/create-contract.html:529-538` CONTRACT_TYPES。

## 三、服务端主页 `service-miniapp/project-list.html`（SSOT，CRLF）
- 骨架：`page-nav`/topbar/tab-bar/框外 `demo-panel` 6 组开关（角色/认证/状态/配置权限/指派权限/查看全部）；**无「流程项数」开关**。
- 双视角 `#nonworkerView`/`#workerView`；`setRole()` 切显隐。工人「我的服务流程」按签署合同 `MY_CONTRACTS[]` 驱动；`canAssign()` 对 worker 返回 false。
- 指派任务（临时派遣）：入口=`#fdAssignBar` + 每流程项；落库 `externals` + 持久化 `localStorage:lzj_flow_externals_v1`。
- 跳转口径：quick-nav 非工人=member/project-files/statement-list/contract-detail；工人=activity-list/member/project-files；待办全部=todo-list；合同待办=contract-detail?status=confirming_sender；任务待办=task-detail；我的任务=task-list?role=exec；动态=activity-list。
- 服务流程总规格 SSOT = `PRD-项目模块详细规格.html` §6.13。
- **发起变更按 ct 分流（2026-11-10）**：服务端合同列表 `actChange` → worker 走 `worker-contract-change.html?id=`；base/design 走 `contract-detail.html?id=&openChange=1`（自动开弹窗）。业主端发起变更入口已移除（弹窗/JS 留作死代码）。

## 四、两端任务列表 `task-list.html`
- 业主端（CRLF/BOM）：默认 `activeFlow='all'`；`?item/?flow/?level=` 深链不变；选中「全部」按筛选后可见数 `n===0` 整组隐藏。`filterTasks()` 每次先复位全部组。
- 服务方（CRLF）：`.rail-wrap` 半截露出；「+N›」角标已移除。
- 工艺参考 SSOT：服务方 `js/craft-ref.js`、PC `pc/pc-craft-ref.js`；仅图片 3 列 ≤9 张/组；排序铁律 执行标准→执行示例→确认标准→确认示例→担责标准；无图整块隐藏。

## 五、工人合同与任务标准
- 六工种走 `worker-contract-detail.html`+`.js`（`WCP`）；基础/设计走 `contract-detail.html`；数据层 `js/contract-store.js`(`window.ContractStore`)。甲方=陈庄（工长）；意向乙方仅六工种、≤3 人、非必选。
- 变更流程：已签约→发起变更→对方确认→V2（**无上传签约文件**）。受邀方 `viewer==='receiver'` 差异化。
- 任务状态模型：已驳回非主状态，是「确认中」结果之一——全部确认人通过→已完成，任一驳回→回退待开始（记录保留）。

## 六、其他页面与数据口径
- 业主端项目详情=`project-detail-{initial,ongoing,completed}-v2`（共享 css/js 勿误删）；原型城市限**北京/南阳/西安**（主示例西安）。`contract-detail.html` 城市**北京**（模板在 `js/contract-detail.js` 的 `contractTemplates`/`stageTemplates`）。
- `owner-miniapp/contract-detail.html` 单文件多状态（仅 `signed`）；无上传签约文件（保留 `#signConfirmModal` 与时间轴）；任务跳转仅 signed 分支带 `from=contract`。
- 成员页 `member.html`（LF）按约定**不改**（业主独有规则保留）；已删函数勿恢复。
- PRD 规范：中文（英文标识符）前置；状态机表 `显示文案|状态key|…`；禁「对原有交互的影响」小节；下线功能直接删除不留版本历史。PRD 行尾：合同/完整/项目=LF，任务/PC其他=CRLF。

## 七、PC 管理后台（11-10 P0/P1 已执行）
- PC 5 页 + 4 JS/CSS，全引入 `shared/doc-viewer/doc-viewer.js`。**无 localStorage 数据层**（全静态硬编码），`LIST_USER_PERMISSION='all'`。
- 列表 8 列（含「所属服务流程项」）+ 6 项筛选 + `?item=`；3 条子合同父子折叠 + `?expand=` + 详情「上级合同」；合同类型 8 类；城市仅北京/南阳/西安；甲方陈庄；`validateFlowAttribution()` 审核前校验 flowId（`?noFlow=1` 演示）；状态映射表写进 `pc-contract-list.js` 顶部注释（**不改 key**）。
- 审核弹窗 `#reviewModal`+`#toastModal` 已删除（用户确认不影响流程）；`goToReview()` 未动但无弹窗入口。详情两页重复引入 `pc-contract-detail.js` 已修。
- **2026-11-11 新增**：PC 合同审核管理**不展示工人合同**（6 类班组无平台审核流程），`pc-contract-list.js` 新增 `WORKER_TYPES` 过滤 + 类型筛选下拉移除工人选项；模板页（合同文本）保留工人模板（属不同模块）。
- 未动（需点头）：PRD 五份、P2 四项（流程项配置页/项目成员页/权限模型/文档同步）、PC 同构 store。
- **2026-11-11 补：PC「变更待审核」演示数据 = `pc-contract-list.js` id=15**（base / `flowId:'sg'` / `flowName:'基础施工服务'` / changing，仅 1 条）。原项目 `LZJBC-XH/pc/pc-contract-list.js:50` 的 id=3 本是基础施工合同「拱墅区公寓 / changing」，当前项目曾被改成工人合同（shuidian + parentId），被 `WORKER_TYPES` 过滤后状态空档 → **勿再把该状态数据改成工人类型**。详情页 `?id=15&status=change_reviewing` 的审核交互（横幅/变更原因/金额高亮/变更记录/通过·驳回弹窗/结果态/`?noFlow=1` 归属校验）本就完整，勿重复新建。原项目 `#reviewModal`/`showReviewModal` 是无调用死代码，已删勿恢复；**PRD §5 两处「列表审核弹窗 `#reviewModal`」残留描述已于 2026-11-11 清理干净**（五份 PRD 归零），勿再写回。
- **2026-11-11 补（用户拍板「两块都补」）**：PC 审核演示数据 SSOT 抽为 `pc/pc-contract-data.js`（`window.PC_CONTRACTS`，15 条，静态硬编码无 localStorage），列表页 + 两个详情页均 `<script src>` 引入；`pc-contract-list.js` 改 `const allContracts = window.PC_CONTRACTS || []`。详情页新增 `bindContractById(id)` 按 `?id` 绑定名称/编号/类型/流程项/项目/金额/提交人/变更前后金额/变更原因，**纯 DOM 结构定位、HTML 零结构改动**；未带 `?id` 沿用内置示例。审核结果经 `reviewResult/reviewId/reviewReason` URL 回传列表，`REVIEW_RESULT` 对匹配 `changing` 行 map 覆盖显示「变更已通过 / 变更已驳回 + 驳回原因」，**不改写静态数据基线**、刷新可复现、状态筛选可命中；结果态 `#statusActions` 增「返回列表查看审核结果」，面包屑/侧栏/page-nav 全部回传（`applyBackLinks` 缓存 NodeList 保证多次调用有效）。PRD §5 列表章节补 note。校验 `_verify_pc_change_full.cjs` 67/67。

## 八、业主端三态详情页统一 + 框架收敛（2026-11-10）
- 三态业主详情页已布局统一（对齐 ongoing-v2），均含服务流程视图 + 规范 page-nav。`member.html` 未动。
- 两端 `common.css` `.page-nav` 块字节一致；`js/page-nav.js` 收敛为同一 `PAGE_NAV_CANON`（JS 驱动/HTML 驱动双兼容，共用 `localStorage:pageNavCollapsed`）。
- **2026-11-11 补**：业主端 `project-files.html` 原缺 `.page-nav` 已补；`task-list.html`/`activity-list.html` 导航不可折叠+链接集不全→替换为统一 16 项规范集并接入 `js/page-nav.js`；`contract-detail.js` `contractStatus` 补 `completed`（别名 signed），修复已完成项目详情页合同卡 `?status=completed` 断链。

## 九、三端审计批次收尾（2026-11-11）
- 批次一/二全部完成：#113 PC 工人合同剔除、#114 业主批次一、#115 服务方批次一、#116 PC 批次一、#117 一致性（⑥业主详情绑定真实数据 / ②page-nav 仅收口 #115 注入 11 页 / ①③④⑤ 评估落地）。
- **#118 批次三（全部收尾，三批 #113–#118 完结）**：①③④⑦⑧⑨ 保留/不改（①状态切换器接线完整 · ③MY_CONTRACTS 刻意静态 · ④默认 6/上限 12 · ⑦服务通知页是完整 demo 且已被 8 个状态页引用 · ⑧D8 · ⑨`window.ContractAmountMask` 全库无定义、恒走明文，属无害死代码，重复函数仅 service/task-list 两组且后者覆盖前者功能更强）；②⑤⑥ 已改：②业主 demo 面板删「服务方（受邀）」选项 · ⑤task-list 派遣入口 A 完整集成 · ⑥PC 两模板页 21 处 `alert()` 统一为页内 `showToast()`（并给 toast 补 `white-space:pre-line` 保住多行校验换行）。PRD 未动（纯代码层演示/提示一致性，无模型口径变更）。
- **业主合同数据源 SSOT**：`owner-miniapp/js/contract-data.js` 导出 `window.OWNER_CONTRACTS` + `getOwnerContractById(id)`（8 条，含 ContractTreeStore 合并，均带 `type`）；列表与详情共用，`contract-detail.js` 按 `?id` 填标识字段；阶段任务/条款正文仍为 demo。
- page-nav 统一范围铁律：仅对**已知加载 `js/page-nav.js`** 的页面做链接集统一；预存在且自有折叠机制的页面不盲目改（否则折叠失效）。
- **#117-② 遗留 30 页已由用户明确关闭（2026-11-11「不用管」）**：服务端 41 个含 `.page-nav` 页中，#115 注入的 11 页已统一；其余 30 页链接集虽不整齐，但折叠/跳转均正常，属观感非缺陷，不再处理。三批 #113–#118 最终完结、无后续待办。
- **导航去重铁律（2026-11-11）**：全库 73 页扫描，结构性重复为 0（单页多 `.page-nav` / 重复引入 page-nav.js 或 common.css / 内联折叠与统一脚本共存均无）。导航内重复链接分三类，只删「相邻两行 href 与文案完全相同」的真冗余；「同 href 不同文案」（如「任务报告单」vs「报告单-有确认人」、「项目架构」）与「主导航 active + 状态切换 active 各一个」属刻意入口，**不删**。已去重 service 11 页；**两个 `member.html` 按 D8 禁改，仍有各 1 行真冗余**，需单独点头才动。
- 全量复核基线（2026-11-11）：`.workbuddy/_tmp/verify_batches_20261111.py` 静态断言 68/68；jsdom `84/84`（`_verify_tl_dispatch` 33 / `_verify_tl_dispatch2` 11 / `_verify_tl_regression` 22 / `_verify_pc_toast` 18）；24 页 HTML `BALANCED`、5 个独立 JS `node --check`、4 组行尾守恒。PRD 无需同步（`PRD-合同模块详细规格.html:784` 合同类型本就只有基础/设计两类 + 15 处「工人合同无平台审核」声明）。
- **#118-⑤ task-list 派遣（2026-11-11，A 完整集成）**：`service-miniapp/task-list.html` 新增框内「＋ 指派任务」入口条 + 弹窗，与 project-list 共用 `localStorage:lzj_flow_externals_v1`（字段 `{name,exec,confirms,status:'未开始'}` + 三标准），两端互相可见。**DOM 级注入模式**：`tlMergeExternals()` 幂等重建 `.task-item` 到对应流程项 `.temp-loose-list`（`buildSnapshotGroups` 对 sg/ht return 走 legacy，故不可改 SNAPSHOT 注入），复用 `taskRow()`，徽标/结果条由 `deriveStats()`/`filterTasks()` 据 DOM 自动重算。`applyFlowCfg()` 末尾挂接（pageshow 亦走此函数）。
- **跨页复制 CSS 铁律**：各页 `:root` 变量体系**不通用**——service `project-list.html` 用 `--grad-brand/--text-2/--primary`，而 `task-list.html`/`common.css` 用 `--primary-color/--text-secondary`。复制 `.am-*` 等样式时必须在目标选择器上补局部变量组，否则全部 `var()` 失效；同时核对 z-index 层级（task-list filter-sheet 1190/1200、toast 10000，弹窗取 1300）。

## 十、原型导航补缺口径（2026-11-11 用户指令「补缺的链接也执行」）
- **安全补充已执行**：已加载 `js/page-nav.js` 且链接集缺项的 8 页（`create-project` / `promoter-auth` / `statement-list` / `statement-detail` / `task-detail` / `task-detail-completed` / `task-detail-shuidian` / `task-report`）补齐规范 10 项，共 +49 条，全库 SAFE 归零。
- **补缺铁律**：只插入、不删、不重排；插入点 = `.page-nav` 内最后一个顶层 `<a>` 之后、状态切换/演示区块之前；多行页按文件主 eol 逐行插，单行压缩页（3 个 task-detail）用空格紧凑插、不新增行；title / active / 状态切换 / `js/page-nav.js` 引用原样保留。补前须校验目标文件存在。
- **规范 10 项（service SSOT = `create-contract.html:1211-1220`）**：home / project-detail-initial-v2 / project-list / project-detail-completed-v2 / project-info / create-project / task-list / task-detail / contract-list / contract-detail。
- **范围外不动**：22 页自有内联折叠机制页、两个 `member.html`（D8）、业主端（自有 16 项规范集且无 `project-list.html`，**勿套 service 10 项**）。
- **历史基线**：3 个 task-detail 页 HTMLParser 签名本就 `bad=1`，校验以「改前/改后签名一致」为准，不要误判为回归。
