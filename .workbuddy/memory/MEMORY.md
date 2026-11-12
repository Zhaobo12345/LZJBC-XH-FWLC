# 项目长期记忆（LZJBC-XH 家装平台原型）

## A. 协作与工作空间（最高优先级）
- 工作空间 `C:\Users\123456\WorkBuddy\LZJBC-XH-FWLC` junction → `D:\TraeProject\LZJPro\LZJBC-XH-FWLC`；原项目 `LZJBC-XH` 只读，绝不写。
- **中断即取消**；**先确认后改**（方案/理由/风险表 → 确认 → 实现）；改完代码再同步 PRD（除非「仅改代码」；不改 PRD 需点头）；不影响既有流程/交互。
- 页面规范：全局无滚动条；小程序必带默认导航栏（状态栏+nav+胶囊占位）；手机框外右侧必带 `.page-nav`（fixed 右上、可折叠 + `localStorage:pageNavCollapsed`、当前页 `a.active`，样式取 `common.css`）；mobile-first 全宽堆叠、复合卡片不并排半宽；中老年可访问性；演示开关放框外只改状态变量。
- 校验留痕：`node --check` + `.workbuddy/_validate_html.py` + jsdom + HTML BALANCED + 行尾/BOM 守恒；改前 `cp` 备份到 `.workbuddy/_tmp/*.bak-日期-主题`。
- 替换铁律：禁用「下一个兄弟」当结束标记；按容器深度平衡替换；含 `</script>` 的锚点原样带回；Python 须 `newline=''` 读写。
- 行尾：service/task-list=**CRLF**；task-detail*.html、`js/craft-ref.js`、`member.html`=LF；PRD 合同/完整/项目=LF，任务/PC其他=CRLF。
- 弹窗层级：`.app-modal` 1000 / `#appModal` 1010 / `.app-toast` 1020。
- 跨页复制 CSS 铁律：`:root` 变量体系不通用（project-list 用 `--grad-brand/--text-2/--primary`；task-list/common.css 用 `--primary-color/--text-secondary`）；复制 `.am-*` 等样式须在目标选择器补局部变量组；task-list filter-sheet 1190/1200、toast 10000、其弹窗取 1300。

## B. 合同归属硬口径（2026-11-10 用户确认）
- 合同**唯一归属服务流程项** `flowId/flowName`，`parent` 是唯一层级字段；**禁止生成无归属合同**，创建/复制/草稿/邀约入口必须带有效 `flowId`，空 `flowId` 返回 null。
- 合同不隶属架构层级：架构层级展示一律删除；`group`/`joinedArchitecture`/`ARCH_LEVEL_MAP`/`?level`/`data-level` 全清。例外：两端 `member.html` 架构树、邀请消息、框外口径声明；旧 `architecture.html` 已归档。`?level/?group` 仅组织上下文兼容参数。
- 复制发起按 `ct` 分流：六工种 → `contract-copy-initiate.html`；基础/设计 → `service-contract-copy-initiate.html`；所有入口必须带 `item`(flowId)/`parent`/`source`；`doSubmit/doSave` 以 flowId 非空为前置校验。
- 服务流程配置 6 项（量房/初步设计/设计服务/基础施工服务/主材安装/售后）；合同类型 **8 类**（基础/设计 + 6 工种），SSOT = `service-miniapp/create-contract.html` CONTRACT_TYPES。
- **发起变更按 ct 分流**：服务端合同列表 `actChange` → 六工种 `worker-contract-change.html?id=`；base/design `contract-detail.html?id=&openChange=1`。业主端发起变更入口已移除（弹窗/JS 留作死代码）。

## C. 服务端主页 `service-miniapp/project-list.html`（SSOT，CRLF）
- 骨架：page-nav / topbar / tab-bar / 框外 demo-panel 6 组开关（角色/认证/状态/配置权限/指派权限/查看全部）；无「流程项数」开关。
- 双视角 `#nonworkerView`/`#workerView`，`setRole()` 切显隐；工人「我的服务流程」由 `MY_CONTRACTS[]` 驱动；`canAssign()` 对 worker 返回 false。
- 指派任务（临时派遣）：入口 `#fdAssignBar` + 每流程项；落库 `externals` + `localStorage:lzj_flow_externals_v1`。task-list 派遣入口复用同一 key（A 完整集成，`tlMergeExternals()` DOM 幂等注入 `.temp-loose-list`，复用 `taskRow()`，徽标由 `deriveStats()` 自动重算；挂 `applyFlowCfg()` 末尾）。
- 跳转口径：quick-nav 非工人=member/project-files/statement-list/contract-detail；工人=activity-list/member/project-files；待办=todo-list；合同待办=contract-detail?status=confirming_sender；任务待办=task-detail；我的任务=task-list?role=exec；动态=activity-list。服务流程总规格 SSOT = `PRD-项目模块详细规格.html` §6.13。

## D. 两端任务列表 `task-list.html`
- 业主端（CRLF/BOM）：默认 `activeFlow='all'`；`?item/?flow/?level=` 深链不变；选中「全部」按筛选后可见数 `n===0` 整组隐藏；`filterTasks()` 每次先复位全部组。
- 服务方（CRLF）：`.rail-wrap` 半截露出（FADE_W=18）、「+N›」角标已移除、纯被动渐隐。
- 工艺参考 SSOT：服务方 `js/craft-ref.js`、PC `pc/pc-craft-ref.js`；仅图片 3 列 ≤9 张/组；排序铁律 执行标准→执行示例→确认标准→确认示例→担责标准；无图整块隐藏。PC `pc-stage-template.html` 顺序=执行标准→执行参考→确认标准→确认参考→担责标准，标题 `prompt` 编辑、放大查看器显示大图+标题。

## E. 工人合同与任务标准
- 六工种走 `worker-contract-detail.html`+`.js`（`WCP`）；基础/设计走 `contract-detail.html`；数据层 `js/contract-store.js`(`window.ContractStore`)。甲方=陈庄（工长）；意向乙方仅六工种、≤3 人、非必选。
- 变更流程：已签约→发起变更→对方确认→V2（**无上传签约文件**）；受邀方 `viewer==='receiver'` 差异化。
- 任务状态模型：已驳回非主状态，是「确认中」结果之一——全部确认人通过→已完成，任一驳回→回退待开始（记录保留）。

## F. 其他页面与数据口径
- 业主端项目详情 = `project-detail-{initial,ongoing,completed}-v2`（共享 css/js 勿误删）；原型城市限北京/南阳/西安（主示例西安）；`contract-detail.html` 城市北京（模板在 `js/contract-detail.js` 的 `contractTemplates`/`stageTemplates`）。
- `owner-miniapp/contract-detail.html` 单文件多状态（仅 signed）；无上传签约文件；任务跳转仅 signed 分支带 `from=contract`。业主合同数据源 SSOT = `owner-miniapp/js/contract-data.js`（`window.OWNER_CONTRACTS` + `getOwnerContractById`，8 条含 ContractTreeStore 合并，均带 `type`）。
- 成员页 `member.html`（LF）按约定**不改**；已删函数勿恢复。两端 `common.css` 的 `.page-nav` 块字节一致；`js/page-nav.js` 统一 `PAGE_NAV_CANON`（双兼容）。
- 业主端三态详情页布局已统一；`project-files.html` 已补 page-nav；`contract-detail.js` 的 `contractStatus` 补 `completed`（别名 signed）。

## G. PC 管理后台（11-10 P0/P1 已执行）
- PC 5 页 + 4 JS/CSS，全引入 `shared/doc-viewer/doc-viewer.js`；**无 localStorage 数据层**（静态硬编码），`LIST_USER_PERMISSION='all'`。
- 列表 8 列（含「所属服务流程项」）+ 6 项筛选 + `?item=`；3 条子合同父子折叠 + `?expand=` + 详情「上级合同」；合同类型 8 类；城市仅北京/南阳/西安；甲方陈庄；`validateFlowAttribution()` 审核前校验 flowId（`?noFlow=1` 演示）；状态映射表写在 `pc-contract-list.js` 顶部注释（**不改 key**）。
- **不展示工人合同**（6 类无平台审核流程）：`WORKER_TYPES` 过滤 + 类型下拉移除工人选项；模板页（合同文本）保留工人模板。
- 审核弹窗 `#reviewModal`+`#toastModal` 及 `showReviewModal` 等已删除（无调用死代码，**勿恢复**）；`goToReview()` 保留但无入口；五份 PRD 相关残留已归零；详情两页重复引入 `pc-contract-detail.js` 已修。
- **变更待审核演示数据 = `pc/pc-contract-data.js` `window.PC_CONTRACTS`（15 条）id=15**（base / `flowId:'sg'` / changing，仅 1 条）；列表页+两个详情页均引入；`pc-contract-list.js` 用 `window.PC_CONTRACTS || []`。详情页 `?id=15&status=change_reviewing` 审核交互完整（横幅/变更原因/金额高亮/变更记录/通过·驳回弹窗/结果态/`?noFlow=1`），**勿重复新建、勿把该状态数据改成工人类型**。
- 详情页 `bindContractById(id)` 按 `?id` 绑定标识字段（纯 DOM 定位、HTML 零改动），未带 `?id` 沿用内置示例；审核结果经 `reviewResult/reviewId/reviewReason` URL 回传，`REVIEW_RESULT` map 覆盖显示、不改写静态基线；`applyBackLinks` 缓存 NodeList。
- PC 两模板页 21 处 `alert()` 统一为 `showToast()`（toast 补 `white-space:pre-line`）。未动（需点头）：PRD 五份、P2 四项（流程项配置页/项目成员页/权限模型/文档同步）、PC 同构 store。

## H. 导航与审计收尾（2026-11-11，#113–#118 三批完结）
- page-nav 统一范围铁律：仅对**已知加载 `js/page-nav.js`** 的页面统一链接集；自有折叠机制的 22 页、两个 `member.html`、业主端（自有 16 项规范集）**不动**。规范 10 项（service SSOT=`create-contract.html`）：home / project-detail-initial-v2 / project-list / project-detail-completed-v2 / project-info / create-project / task-list / task-detail / contract-list / contract-detail。
- 补缺铁律：只插入不删不重排；插入点=`.page-nav` 内最后一个顶层 `<a>` 之后、状态切换/演示区块之前；多行页按主 eol 逐行插，单行压缩页用空格紧凑插；title/active/JS 引用原样保留。8 页已补 49 条，SAFE 归零。
- 去重铁律：只删「相邻两行 href 与文案完全相同」的真冗余；「同 href 不同文案」与「主导航 active + 状态切换 active」属刻意入口不删。两个 `member.html` 各剩 1 行真冗余，需单独点头。
- **#117-② 遗留 30 页链接集不齐已由用户明确关闭（「不用管」），无后续待办**。
- 3 个 task-detail 页 HTMLParser 签名本就 `bad=1`，以「改前后一致」为准；验收基线数字留在当日日志，不在此累积。
- 保留/不改项：状态切换器接线、MY_CONTRACTS 刻意静态、默认 6/上限 12、服务通知页 demo、`window.ContractAmountMask` 无害死代码。

## I. 五份 PRD 分工与同步铁律
- 五份：合同 / 项目 / 任务 / PC端其他 / **完整文档（总览）**。改代码后**必查「完整文档」功能清单**（用中文页面名、不含 `.html`，文件名扫描查不出来）。
- 分工：PC 合同审核→合同 PRD；跳转/流程项/成员→项目 PRD；任务/PC其他仅本模块改动时同步；总览随功能增删同步。§7.12 分入口：任务详情点头像→各端 `member.html`；成员卡片按各端自身规则，**勿笼统写「各端成员页」**。
- PRD 规范：中文前置（英文标识符）；状态机表 `显示文案|状态key|…`；禁「对原有交互的影响」小节；下线功能直接删除不留版本历史；禁写失效文件名、内部代号 `D8`、404 描述。
- 删表格行必查上一行 `rowspan`；一律 `newline=''` 纯文本替换 + 行数 / `data-page-node-id` / 标签数守恒；断言用「改前后计数一致」。
- **追加章节位置铁律**：`<div class="section">` 必须落在 `div.main-content > div.container` 内部（最后一个正文 section 之后、「文档结束」标记之前），不可放 `</script>` 与 `</body>` 之间（会脱离容器、底部贴左错位）。DOM 深度：正文 section=4，body 直接子级=2；五份 PRD 错位已全部归零。

## J. 量房告知书口径（2026-11-12 用户确认，最高优先级）
- 量房服务结果在「量房」服务项下的任务内体现；告知书**不关联、不展示结果**（零实测数据 / 达标结论 / 交付物 / 成果态），仅用于通知业主并取得「知晓且同意允许开始量房」的标识。
- `flow-letter-slim/` = A 档精简美化版（2 页：流程项入口 + 一页两态告知书）；`flow-letter-demo/` 7 页为原演示、字节零改动，两者并排对照。两态 `notice_wait_confirm` / `notice_confirmed`，旧 `?state=notice_pending_result` 回落默认；PRD §6.13.5 描述原目录，未动。
