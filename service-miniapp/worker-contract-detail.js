/**
 * 工人合同详情页（独立页面 · 方案 B）
 * 仅服务于 拆除/水电/木作/泥瓦/油漆/小零工 六类工人合同。
 * 基础施工服务合同 / 设计服务合同 走原 contract-detail.html，不经过本页。
 *
 * 与「合同详情（合规版）」保持同一套原型导航与微信小程序规范：
 *   - 右侧「原型导航」含「合同状态切换（工人合同）」分组，按工人流程展示各状态页面效果；
 *   - 区分发起方 / 受邀方两种视角，受邀方视角可逐一查看每位被邀人页面效果；
 *   - 打开页面直接进入合同详情（默认以「水电班组服务合同」为示例），不再展示独立的合同说明/创建页；
 *   - 页面主体含「合同内容 / 阶段任务 / 附件」三区块（对齐合规版 section-tabs 结构）。
 */
(function (global) {
    'use strict';

    var WORKER_CANDIDATES = [
        { id: 'm-owner', name: '陈业主', role: '业主' },
        { id: 'm-designer', name: '王设计', role: '设计师' },
        { id: 'm-pm', name: '刘项目总', role: '项目总' },
        { id: 'm-lead', name: '孙工长', role: '工长' },
        { id: 'm-demolition', name: '钱拆除', role: '拆除工' },
        { id: 'm-demolition-2', name: '冯拆建', role: '拆除工' },
        { id: 'm-demolition-3', name: '蒋拆平', role: '拆除工' },
        { id: 'm-shuidian', name: '张水电', role: '水电工' },
        { id: 'm-shuidian-2', name: '韩水通', role: '水电工' },
        { id: 'm-shuidian-3', name: '杨水明', role: '水电工' },
        { id: 'm-muzuo', name: '李木作', role: '木作工' },
        { id: 'm-muzuo-2', name: '赵木森', role: '木作工' },
        { id: 'm-muzuo-3', name: '秦木林', role: '木作工' },
        { id: 'm-niwa', name: '周泥瓦', role: '泥瓦工' },
        { id: 'm-niwa-2', name: '许泥固', role: '泥瓦工' },
        { id: 'm-niwa-3', name: '何泥稳', role: '泥瓦工' },
        { id: 'm-youqi', name: '吴油漆', role: '油漆工' },
        { id: 'm-youqi-2', name: '吕油彩', role: '油漆工' },
        { id: 'm-youqi-3', name: '施油光', role: '油漆工' },
        { id: 'm-xiaolingong', name: '郑零工', role: '小零工' },
        { id: 'm-xiaolingong-2', name: '张零杂', role: '小零工' },
        { id: 'm-xiaolingong-3', name: '孔零活', role: '小零工' }
    ];

    // 意向乙方仅允许选择的工种（各工种，不含业主 / 设计师 / 项目总 / 工长）
    // 按工种角色过滤，新增候选工人（如每工种多名）自动纳入可选池
    var TRADE_ROLES = ['拆除工', '水电工', '木作工', '泥瓦工', '油漆工', '小零工'];
    var TRADE_CANDIDATES = WORKER_CANDIDATES.filter(function (m) {
        return TRADE_ROLES.indexOf(m.role) > -1;
    });

    // 合同类型 → 允许选择的工种角色（意向乙方按合同类型过滤工种）
    var TRADE_ROLE_BY_TYPE = {
        demolition: '拆除工',
        shuidian: '水电工',
        muzuo: '木作工',
        niwa: '泥瓦工',
        youqi: '油漆工',
        xiaolingong: '小零工'
    };
    function getContractTypeCandidates(type) {
        var role = TRADE_ROLE_BY_TYPE[type];
        return TRADE_CANDIDATES.filter(function (m) { return m.role === role; });
    }

    var STATUS_CONFIG = {
        worker_inviting_sender: {
            text: '确认中', bannerClass: 'confirming',
            desc: '已邀请意向乙方参与此合同，等待对方确认/抢单（第一位确认者成为合同乙方）。',
            actions: [{ text: '撤回确认', type: 'warning', action: 'worker_withdraw' }]
        },
        worker_inviting_receiver: {
            text: '确认中', bannerClass: 'confirming',
            desc: '您被邀请参与此合同，等待您确认/抢单。第一位确认者成为合同乙方。',
            actions: [
                { text: '拒绝', type: 'secondary', action: 'worker_reject' },
                { text: '确认加入', type: 'primary', action: 'worker_confirm' }
            ]
        },
        worker_confirmed_receiver: {
            text: '已确认', bannerClass: 'confirmed',
            desc: '您已成为本合同乙方，已自动加入项目架构层级。',
            actions: []
        },
        worker_lost_receiver: {
            text: '已确认', bannerClass: 'confirmed',
            desc: '该合同已被其他人员确认（抢单失败），您未成为本合同乙方。',
            actions: []
        },
        worker_rejected_receiver: {
            text: '已拒绝', bannerClass: 'rejected',
            desc: '您已拒绝该合同邀约，未成为本合同乙方。该邀约流程已结束。',
            actions: []
        },
        worker_draft: {
            text: '拟定中', bannerClass: 'draft',
            desc: '合同已撤回至拟定中。可直接修改合同名称、合同金额与意向乙方（仅各工种，1-3 人）后提交邀请。',
            actions: [
                { text: '仅保存', type: 'secondary', action: 'worker_save_draft' },
                { text: '提交并邀请乙方', type: 'success', action: 'worker_resubmit' }
            ]
        },
        worker_signed: {
            text: '已签约', bannerClass: 'signed',
            desc: '合同已正式生效。如需调整工程内容或金额，可发起合同变更（需对方确认后生效，无需平台审核）。',
            descReceiver: '合同已正式生效。',
            actions: [{ text: '发起变更', type: 'primary', action: 'start_change' }]
        },

        // ============== 变更阶段（工人合同无需平台审核；对齐「合同详情（合规版）」变更流程去平台化版本，预览用） ==============
        changing: {
            text: '变更中', bannerClass: 'changing',
            desc: '变更申请已发起，等待对方确认（阶段任务已暂停流转）。',
            actions: [{ text: '撤回变更', type: 'warning', action: 'withdraw_change' }]
        },
        change_confirming: {
            text: '待确认变更', bannerClass: 'change-confirming',
            desc: '对方发起变更申请，请确认或驳回（阶段任务已暂停流转）。',
            actions: [
                { text: '驳回变更', type: 'secondary', action: 'reject_change' },
                { text: '确认变更', type: 'primary', action: 'confirm_change' }
            ]
        },
        change_confirming_sender: {
            text: '变更确认中', bannerClass: 'confirming',
            desc: '变更申请已提交，等待对方（乙方）确认变更内容（阶段任务已暂停流转）。',
            actions: [{ text: '撤回变更', type: 'warning', action: 'withdraw_change' }]
        },
        // 变更阶段分支：待确认方（乙方）驳回变更后的独立页面
        change_rejected: {
            text: '变更已驳回', bannerClass: 'rejected',
            desc: '对方（乙方）已驳回本次变更申请，合同保持原已签约状态。可重新发起变更。',
            descReceiver: '您已驳回本次变更申请，合同保持原已签约状态。',
            actions: [
                { text: '重新发起变更', type: 'primary', action: 'start_change' }
            ],
            showRejectReason: true,
            rejectReason: '现场实际情况与变更内容不符，暂不接受该变更方案，请与工长（甲方）沟通后重新发起。'
        }
    };

    var ACTION_TEXT = {
        worker_withdraw: { title: '撤回合同邀约', message: '确定要撤回确认吗？撤回后合同退回拟定中，可就地修改意向乙方后重新提交邀约。' },
        worker_reject: { title: '拒绝邀请', message: '确定要拒绝此合同邀约吗？拒绝后您不会成为本合同乙方。' },
        worker_confirm: { title: '确认加入合同', message: '确定要确认加入此合同吗？确认后您将成为本合同乙方，并自动加入项目架构层级。' },
        worker_resubmit: { title: '提交并邀请乙方', message: '确定要提交当前合同信息与意向乙方名单吗？将向所选意向乙方（仅各工种）发送合同邀约。' },
        // 变更阶段动作（工人合同：无平台审核，对方确认后即进入签约）
        withdraw_change: { title: '撤回变更', message: '确定要撤回变更申请吗？撤回后合同恢复已签约状态，阶段任务恢复流转。' },
        reject_change: { title: '驳回变更', message: '确定要驳回该变更申请吗？驳回后合同保持原已签约状态。' },
        confirm_change: { title: '确认变更', message: '确认后即生成新版本的已签约状态，变更正式生效，确定继续吗？' },
        change_rejected_back: { title: '返回已签约', message: '确定返回合同已签约状态吗？变更申请将被清除，合同恢复为原始已签约内容。' }
    };

    var state = {
        workerId: '',
        viewer: 'sender',
        asUserId: '',
        contract: null,
        status: 'worker_inviting_sender',
        editInvited: [],
        draftContentTab: 'contract-text',
        tplKind: '',
        fulfilled: false,
        currentEditTask: null,
        editTaskConfirmPersonList: []
        // 工艺参考示例状态由共享模块 js/craft-ref.js（window.CraftRef）自持，不占本页 state
    };

    var pendingConfirm = null; // { title, message, onConfirm, onCancel }
    var pendingRejectReason = null; // 拒绝原因暂存（二次确认前保留）

    // 演示用合同模板（原型「更多 → 切换合同类型」入口）
    var DEMO_TYPES = [
        { type: 'demolition',  typeName: '拆除班组服务合同',   group: '拆除工程', name: '客厅原墙拆除工程合同', amount: 4800,  invited: ['m-demolition', 'm-demolition-2', 'm-demolition-3'] },
        { type: 'shuidian',    typeName: '水电班组服务合同',   group: '水电工程', name: '全屋水电改造合同',     amount: 12600, invited: ['m-shuidian', 'm-shuidian-2', 'm-shuidian-3'] },
        { type: 'muzuo',       typeName: '木作班组服务合同',   group: '木作工程', name: '定制柜体木作合同',     amount: 9800,  invited: ['m-muzuo', 'm-muzuo-2', 'm-muzuo-3'] },
        { type: 'niwa',        typeName: '泥瓦工班组服务合同', group: '泥瓦工程', name: '厨卫贴砖泥瓦合同',     amount: 7600,  invited: ['m-niwa', 'm-niwa-2', 'm-niwa-3'] },
        { type: 'youqi',       typeName: '油漆工班组服务合同', group: '油漆工程', name: '墙面乳胶漆油漆合同',   amount: 6400,  invited: ['m-youqi', 'm-youqi-2', 'm-youqi-3'] },
        { type: 'xiaolingong', typeName: '小零工服务合同',     group: '零星工程', name: '后期安装小零工合同',   amount: 2200,  invited: ['m-xiaolingong', 'm-xiaolingong-2', 'm-xiaolingong-3'] }
    ];

    // 默认示例合同（无 id 进入时直接展示）
    var DEFAULT_DEMO_TYPE = 'shuidian';

    // 演示默认项目地址（受邀方视角元信息「项目地址」展示用）
    var DEMO_PROJECT_ADDRESS = 'XX市XX区XX路XX号 · 阳光里小区 8 栋 2 单元 1101 室';

    // 合同内容 / 阶段任务 示例模板（按合同类型），对齐合规版展示
    var STAGE_TEMPLATES = {
        shuidian: {
            contentIntro: '工程内容：强电、弱电、给排水等水电工程，含材料进场、布管布线、设备安装及收尾验收。',
            stages: [
                { name: '给水阶段', order: '顺序执行', tasks: [
                    { name: '清理基层', exec: '张水电', conf: '陈庄', execStd: '作业面清扫干净。\n存证标准：每个空间拍摄不少于1张照片', confStd: '不能见垃圾和杂物，无明显浮灰', liableStd: '未清理或不干净，扣除100元/空间的工费，并立即清扫干净' },
                    { name: '✅放线', exec: '张水电', conf: '陈庄', execStd: '依据水点位位置，放出管路的路径线。\n存证标准：每个空间拍摄不少于1张照片', confStd: '线路清晰、横平竖直', liableStd: '未放线就开槽布管，扣除100元/空间的工费并重新放线' },
                    { name: '开槽', exec: '张水电', conf: '陈庄', execStd: '严禁不放线的情况下进行开槽 | 开槽要求横平竖直，严禁开斜槽，严禁开长度＞500mm横槽，严禁切断钢筋 | 开槽深度为管径+12mm（不包含混凝土构件）', confStd: '参照工艺执行标准验收', liableStd: '承担因违规开槽所造成的所有责任，包含安全、经济、延期等' },
                    { name: '管路保温', exec: '张水电', conf: '陈庄', execStd: '热供：红色、热回：黄色、自来水：白色、软水：蓝色、净水：绿色、中水：黑色 | 所有管道的裸露位置都应做保温，接头处刷保温胶密实链接，缠绕同色保温扎带 | 管道接头部位裸露，带验收完成后恢复', confStd: '参照工艺执行标准验收', liableStd: '未按标准做保温，更换对应要求的保温颜色，并承担材料费和延期费用' },
                    { name: '✅布管固定', exec: '张水电', conf: '陈庄', execStd: '平管固定点间距≤600mm，立管固定点间距≤1000mm | 水管末端、转弯处及阀门、水表两侧距离固定点距离≤200mm | 断管时，断面应同管轴线垂直、无毛刺 | 按照固定点的位置用成品涂塑带孔角铁做支撑，选用U型卡固定，安装卡件固定牢固，不能破坏管外壁 | 左热右冷，上热下冷，间距150mm | 埋墙水管不允许有接头，必须整管入墙；地面有防水要求的区域严禁布管布线。\n存证标准：每个空间拍摄不少于1张照片', confStd: '参照工艺执行标准验收', liableStd: '按要求拆除重做或加装固定点，直至符合工艺要求，并承担材料费和延期费用' },
                    { name: '热熔连接', exec: '张水电', conf: '陈庄', execStd: '20管:热熔深度14mm,加热时间5s，连接时间4s，冷却时间2s。 | 25管:热熔深度15mm,加热时间7s，连接时间4s，冷却时间2s | 32管:热熔深度16.5mm,加热时间8s，连接时间6s，冷却时间4s | 40管:热熔深度18mm,加热时间12s，连接时间6s，冷却时间4s | 热熔插管时禁止旋转', confStd: '不渗漏', liableStd: '承担因热熔问题产生的返工费、材料费和延期费用' },
                    { name: '✅出水口位置调整', exec: '张水电', conf: '陈庄', execStd: '水口外截面低于墙面完成面线100mm | 位置水平方正。\n存证标准：每个水口位置拍摄1张测量照片', confStd: '参照工艺执行标准验收', liableStd: '扣除100元/个的工费 | 整改至工艺要求范围' },
                    { name: '打压', exec: '张水电', conf: '陈庄', execStd: '试验压力不低于0.8Map，时间1小时以上。\n存证标准：拍摄压力表数值照片', confStd: '稳压1小时，30分钟内降压不超过0.05Map为合格', liableStd: '因不合格，承担产生的返工费、材料费和延期费用' }
                ] },
                { name: '排水阶段', order: '顺序执行', tasks: [
                    { name: '清理基层', exec: '张水电', conf: '陈庄', execStd: '作业面清扫干净。\n存证标准：每个空间拍摄不少于1张照片', confStd: '不能见垃圾和杂物，无明显浮灰', liableStd: '未清理或不干净，扣除100元/空间的工费，并立即清扫干净' },
                    { name: '✅放线', exec: '张水电', conf: '陈庄', execStd: '依据排水点位位置，以管径中心点，放出管路的路径线。\n存证标准：每个空间拍摄不少于1张照片', confStd: '线路清晰 | 卫生器具排水口纵横坐标：单独器具≤10mm，成排器具≤5mm | 卫生设备接口标高：单独器具≤10mm，成排器具≤5mm', liableStd: '未放线就开槽布管，扣除100元/空间的工费并重新放线' },
                    { name: '开槽', exec: '张水电', conf: '陈庄', execStd: '严禁不放线的情况下进行开槽 | 开槽要求横平竖直，严禁开斜槽，严禁开长度＞500mm横槽，严禁切断钢筋 | 开槽深度为管径+12mm（不包含混凝土构件）', confStd: '参照工艺执行标准验收', liableStd: '承担因违规开槽所造成的所有责任，包含安全、经济、延期等' },
                    { name: '✅布管固定', exec: '张水电', conf: '陈庄', execStd: '成品带孔涂塑红色角铁固定 | 立管间距≤1000mm，横管间距≤800mm | 按照固定点的位置用U型卡、吊卡进行安装，安装卡件固定牢固，不能破坏管外壁 | 断管时，断面应同管轴线垂直、无毛刺。\n存证标准：每个空间拍摄不少于1张照片', confStd: '参照工艺执行标准验收', liableStd: '按要求拆除重做或加装固定点，直至符合工艺要求，并承担材料费和延期费用' },
                    { name: '链接', exec: '张水电', conf: '陈庄', execStd: '接口干燥无污染物 | 管件接口内侧，直管外侧刷胶 | 施压使管插入至标记深度，左右旋转90°，使胶均匀，擦掉挤出的胶', confStd: '参照工艺执行标准验收', liableStd: '承担因链接问题产生的返工费、材料费和延期费用' },
                    { name: '测量坡度及通排实验', exec: '张水电', conf: '陈庄', execStd: '横管坡度≥1%；管道施工完毕后进行通水试验，排水口无积水、倒灌现象。\n存证标准：每个空间录制1条通排实验视频', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或拆除重做，并承担材料费和延期费用' },
                    { name: '封堵管道口', exec: '张水电', conf: '陈庄', execStd: '用专用管口封堵或其他材料封堵，保证牢固密实', confStd: '参照工艺执行标准验收', liableStd: '承担因未封堵造成管道堵塞，所产生的所有费用' },
                    { name: '✅管道隔音', exec: '张水电', conf: '陈庄', execStd: '用黑色保温进行包裹，切口、连接处用保温胶粘接，用保温扎带绑扎牢固。\n存证标准：每个空间拍摄不少于1张照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或拆除重做，并承担材料费和延期费用' }
                ] },
                { name: '强弱电阶段', order: '顺序执行', tasks: [
                    { name: '清理基层', exec: '张水电', conf: '陈庄', execStd: '作业面清扫干净。\n存证标准：每个空间拍摄不少于1张照片', confStd: '不能见垃圾和杂物，无明显浮灰', liableStd: '未清理或不干净，扣除100元/空间的工费，并立即清扫干净' },
                    { name: '✅放线', exec: '张水电', conf: '陈庄', execStd: '依据强弱电点位位置，放出管路的路径线。\n存证标准：每个空间拍摄不少于1张照片', confStd: '线路清晰、横平竖直', liableStd: '未放线就开槽布管，扣除100元/空间的工费并重新放线' },
                    { name: '开槽', exec: '张水电', conf: '陈庄', execStd: '严禁不放线的情况下进行开槽 | 开槽要求横平竖直，严禁开斜槽，严禁开长度＞500mm横槽，严禁切断钢筋 | 开槽深度为管径+12mm（不包含混凝土构件） | 顶面混凝土板必须开S型槽', confStd: '参照工艺执行标准验收', liableStd: '承担因违规开槽所造成的所有责任，包含安全、经济、延期等' },
                    { name: '✅线管线盒安装', exec: '张水电', conf: '陈庄', execStd: '分色：强电红色，弱电蓝色 | 管接头用PVC胶粘接牢固,用吊筋及金属勾卡固定，间距≤1000mm,固定点距管边缘(箱 盒)距离≤200mm,管路弯曲部位两端200mm内需加设固定点；整体横平竖直，大气美观 | 过线盒设置规定（管路弯曲用大弧弯）： | ①无弯曲情况管路长度超过30m必须加设过线盒 | ②有一个弯曲，管路长度超过20m必须加设过线盒 | ③有两个弯曲，管路长度超过15m必须加设过线盒 | ④有3个弯曲，管路长度超过8m必须加设过线盒  | 灯头盒部位使用软管连接，软管长度不小于线盒到吊顶之间的距离，不大于1米。\n存证标准：每个空间拍摄不少于1张照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或拆除重做，并承担材料费和延期费用' },
                    { name: '穿线', exec: '张水电', conf: '陈庄', execStd: '强电穿线（4²线不超过3根，2.5²线不超过5根） | 双色为接地线，蓝色为零线，黄、绿、红为项线。 | 接线盒、开关盒、插销盒及灯头盒内导线的预留长度150-200mm | 电箱内导线的预留长度应为配电箱体周长的1/2 | 弱电穿线（不超过2根）', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或拆除重做，并承担材料费和延期费用' },
                    { name: '接线', exec: '张水电', conf: '陈庄', execStd: '单铜芯导线直线连接：用双手同时把两芯线互绞两圈后，将两个线芯在另一个线芯上缠绕5-7圈，剪掉余头。\n存证标准：拍摄3张不同位置的照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改重做，并承担材料费和延期费用' },
                    { name: '✅涮锡', exec: '张水电', conf: '陈庄', execStd: '温度控制在250°350°，浸锡时间13秒，锡层覆盖完整光亮均匀无毛刺。\n存证标准：拍摄3张不同位置的照片', confStd: '锡层覆盖完整 | 光亮均匀无毛刺', liableStd: '未涮锡就包裹线头，扣除1000元/次的工费 | 并承担材料费和延期费用' },
                    { name: '线头包裹', exec: '张水电', conf: '陈庄', execStd: '第一层PVC胶带包裹—第二层绝缘胶布包裹 | 每层至少缠绕3层以上，拉伸率为30%~50%，增强密合性', confStd: '拆开验收 | 外观应整齐，相对美观', liableStd: '按要求整改或拆除重做，并承担材料费和延期费用' }
                ] },
                { name: '配电箱安装阶段', order: '顺序执行', tasks: [
                    { name: '基础型钢安装', exec: '张水电', conf: '陈庄', execStd: '电箱、柜的基础支架型钢安装允许偏差：垂直度每米误差＜3mm，总体误差＜5mm；水平度每米误差＜3mm，总体误差＜5mm；不平行度整体误差＜5mm； | 基础支架应做防锈处理。\n存证标准：拍摄3张不同位置的照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' },
                    { name: '箱体内部检查', exec: '张水电', conf: '陈庄', execStd: '箱内配件规格型号符合设计要求 | 闭锁装置动作准确有效 | 辅助开关与主开关切换动作一致 | 箱内系统图及配件编号清晰明确', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' },
                    { name: '箱体安装', exec: '张水电', conf: '陈庄', execStd: '箱体与基础支架型钢必须用镀锌螺栓连接 | 箱体安装垂直度允许偏差1.5%，相互间接缝＜2mm | 箱体安装高度底边距地1.5m', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' },
                    { name: '✅箱盘接线', exec: '张水电', conf: '陈庄', execStd: '连接的线束外应有塑料管等加强绝缘保护层 | 连接部位绞合紧密，且有不开口的终端端子或涮锡，不松散断股。\n存证标准：拍摄3张不同位置的照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' }
                ] },
                { name: '桥架铺设阶段', order: '顺序执行', tasks: [
                    { name: '支架制作及安装', exec: '张水电', conf: '陈庄', execStd: 'φ8mm吊筋及涂塑成品角铁制作支架，切口处做防锈处理；水平安装支架间距≤1.5，垂直安装支架间距不大于1m | 支架与桥架采用不同金属材质时，连接固定时要做防电腐化隔离层措施', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' },
                    { name: '✅桥架制作与安装', exec: '张水电', conf: '陈庄', execStd: '桥架弯曲半径：敷设有钢凯电缆的桥架，弯曲半径不小于电缆直径20倍；敷设无钢凯电缆的桥架，弯曲半径不小于电缆直径10倍 | 钢制桥架直线段长度超过30米，铝合金或玻璃钢桥架超过15米，应设有伸缩节；桥架跨建筑物伸缩缝、变形缝处设置补偿装置 | 所有桥架连接时使用的螺栓，一律要螺母朝外，防止电缆敷设时划伤 | 桥架安装位于易燃易爆、热力管道下方无设计要求时距离要求如下：平行距离：一般管道0.4m，易燃易爆管道0.5m,无保温热管1m，有保温热管0.5m。\n存证标准：拍摄3张不同位置的照片', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' },
                    { name: '桥架内电缆敷设', exec: '张水电', conf: '陈庄', execStd: '电缆出入各种沟、井、盘、柜时端头必须做密封处理 | 大于45°倾斜敷设的电缆每隔2m应设一个固定点 | 电缆两端应设标识牌', confStd: '参照工艺执行标准验收', liableStd: '按要求整改或重做，并承担材料费和延期费用' }
                ] },
                { name: '面板安装阶段', order: '顺序执行', tasks: [
                    { name: '✅清理', exec: '张水电', conf: '陈庄', execStd: '清理盒内杂物及灰尘，用毛刷、抹布将灰尘擦净。\n存证标准：拍摄3张不同位置的照片', confStd: '不能见垃圾和杂物，无明显浮灰', liableStd: '未清理或不干净，扣除100元/空间的工费并清理干净' },
                    { name: '✅开关插座接线安装', exec: '张水电', conf: '陈庄', execStd: '将盒内甩出的导线与开关或插座面板连接，将开关或插座推入盒内（如果盒边缘距离饰面完成面≥30mm，应增加套盒），对正盒眼，用机螺丝固定，固定后要面板端正与墙平齐。\n存证标准：每个空间拍摄不少于1张照片', confStd: '面板端正、严密、与墙平齐，多个面板间并排安装高度、间距应相同，误差≤0.5mm | 同一室内的不同位置的开关安装，开关高度误差≤2mm，方向应一致面板垂直偏差≤0.5mm', liableStd: '按要求整改或重做，并承担材料费和延期费用' }
                ] }
            ]
        },
        demolition: {
            contentIntro: '工程内容：室内原墙体、饰面拆除及建筑垃圾清运，含防护交底与现场平整。',
            stages: [
                { name: '原墙拆除阶段', order: '顺序执行', tasks: [ { name: '防护交底', exec: '钱拆除', conf: '陈庄' }, { name: '墙体拆除', exec: '钱拆除', conf: '陈庄' } ] },
                { name: '垃圾清运阶段', order: '顺序执行', tasks: [ { name: '建筑垃圾清运', exec: '钱拆除', conf: '陈庄' }, { name: '现场平整', exec: '钱拆除', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '钱拆除', conf: '陈庄' } ] }
            ]
        },
        muzuo: {
            contentIntro: '工程内容：木作基层、定制柜体制作与安装，含测量放样、五金安装及收尾。',
            stages: [
                { name: '测量放样阶段', order: '并行执行', tasks: [ { name: '现场测量', exec: '李木作', conf: '陈庄' }, { name: '深化图纸', exec: '李木作', conf: '陈庄' } ] },
                { name: '木工制作阶段', order: '顺序执行', tasks: [ { name: '基层制作', exec: '李木作', conf: '陈庄' }, { name: '柜体安装', exec: '李木作', conf: '陈庄' } ] },
                { name: '安装阶段', order: '顺序执行', tasks: [ { name: '五金安装', exec: '李木作', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '李木作', conf: '陈庄' } ] }
            ]
        },
        niwa: {
            contentIntro: '工程内容：地面找平、防水施工与墙地砖铺贴，含美缝清理。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [ { name: '地面找平', exec: '周泥瓦', conf: '陈庄' }, { name: '防水施工', exec: '周泥瓦', conf: '陈庄' } ] },
                { name: '贴砖阶段', order: '顺序执行', tasks: [ { name: '墙砖铺贴', exec: '周泥瓦', conf: '陈庄' }, { name: '地砖铺贴', exec: '周泥瓦', conf: '陈庄' }, { name: '阶段确认', exec: '周泥瓦', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '美缝清理', exec: '周泥瓦', conf: '陈庄' } ] }
            ]
        },
        youqi: {
            contentIntro: '工程内容：墙面基层处理、腻子批刮与乳胶漆涂刷，含清理保护。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [ { name: '墙面铲除', exec: '吴油漆', conf: '陈庄' }, { name: '批刮腻子', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '腻子阶段', order: '顺序执行', tasks: [ { name: '打磨', exec: '吴油漆', conf: '陈庄' }, { name: '底漆', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '油漆阶段', order: '顺序执行', tasks: [ { name: '面漆涂刷', exec: '吴油漆', conf: '陈庄' }, { name: '阶段确认', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '清理保护', exec: '吴油漆', conf: '陈庄' } ] }
            ]
        },
        xiaolingong: {
            contentIntro: '工程内容：零星安装、修补等小零工作业，含工具进场与安全防护。',
            stages: [
                { name: '安装准备阶段', order: '并行执行', tasks: [ { name: '工具进场', exec: '郑零工', conf: '陈庄' }, { name: '安全防护', exec: '郑零工', conf: '陈庄' } ] },
                { name: '零星作业阶段', order: '顺序执行', tasks: [ { name: '零星安装', exec: '郑零工', conf: '陈庄' }, { name: '修补作业', exec: '郑零工', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '郑零工', conf: '陈庄' } ] }
            ]
        }
    };

    // ============== 工具 ==============
    function $(id) { return document.getElementById(id); }
    function getParam(n) { return new URLSearchParams(global.location.search).get(n); }
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function showToast(msg) {
        var t = $('appToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        global.setTimeout(function () { t.classList.remove('show'); }, 2000);
    }
    function callPartyA(phone) {
        if (!phone) { showToast('未获取到联系电话'); return; }
        // 先二次确认，避免误触拨号
        showConfirm('拨打工长电话', '是否拨打 ' + phone + ' ？', function () {
            showToast('正在呼叫 ' + phone);
            global.location.href = 'tel:' + phone;
        }, { confirmText: '拨打', btnClass: 'primary' });
    }
    function clearConfirmState() {
        $('confirmModal').classList.remove('show');
        pendingConfirm = null;
    }
    function showConfirm(title, message, onConfirm, opts) {
        opts = opts || {};
        pendingConfirm = {
            title: title, message: message,
            onConfirm: onConfirm,
            onCancel: opts.onCancel || null
        };
        $('confirmTitle').textContent = title;
        $('confirmContent').textContent = message;
        var btn = $('confirmBtn');
        btn.textContent = opts.confirmText || '确认';
        btn.className = 'modal-btn ' + (opts.btnClass || 'danger');
        $('confirmModal').classList.add('show');
    }
    function closeConfirm() {
        // 取消按钮：若本次 confirm 注册了 onCancel，则在收起后回退（如回到原因弹窗）
        var fn = pendingConfirm && pendingConfirm.onCancel;
        clearConfirmState();
        if (fn) fn();
    }
    function runConfirm() {
        // 确认按钮：仅执行 onConfirm，不触发 onCancel
        var fn = pendingConfirm && pendingConfirm.onConfirm;
        clearConfirmState();
        if (fn) fn();
    }

    // ============== 初始化 ==============
    function init() {
        state.workerId = getParam('id') || '';
        state.viewer = getParam('viewer') || 'sender';
        state.asUserId = getParam('asUserId') || '';
        if (!global.ContractStore) { renderNotFound(); return; }
        // 预播种全部工种演示合同（id 形如 demo-<type>-example），保证外部按 id 跳转各工种都能命中
        DEMO_TYPES.forEach(function (d) { ensureDemoSeed(d.type); });
        if (!state.workerId) {
            // 无 id：直接展示示例合同（水电班组服务合同），不再展示独立的合同说明/创建页
            state.workerId = ensureDemoSeed(DEFAULT_DEMO_TYPE);
            if (!state.viewer || state.viewer === 'sender') state.viewer = 'sender';
            state.asUserId = '';
        }
        state.contract = global.ContractStore.getContract(state.workerId);
        if (!state.contract) { renderNotFound(); return; }
        $('notFound').style.display = 'none';
        $('mainView').style.display = 'block';
        fillConfirmerDropdown();
        // 支持「发起变更」页提交后回跳预览（如 preview=changing）或外部跳转指定状态（如 status=worker_confirmed_receiver）
        var preview = getParam('preview');
        var urlStatus = getParam('status');
        state.viewer = getParam('viewer') || state.viewer;
        updateStatus(urlStatus ? urlStatus : (preview ? preview : computeStatus()), getParam('viewer'));
        // 原型导航深链：?demo=fulfilled 时直接呈现「已签约（已履约完成）」演示态（仅当参数存在时触发，不影响既有流程）
        if (getParam('demo') === 'fulfilled') demoFulfilled();
        bindModalDismiss();
    }

    function renderNotFound() {
        $('notFound').style.display = 'block';
        $('mainView').style.display = 'none';
    }

    function nowLabel() {
        var dd = new Date();
        var h = dd.getHours(); var mm = dd.getMinutes();
        return (h < 10 ? '0' + h : '' + h) + ':' + (mm < 10 ? '0' + mm : '' + mm);
    }

    // 示例合同播种（幂等：固定 id，已存在则复用）
    function ensureDemoSeed(type) {
        var d = DEMO_TYPES.filter(function (x) { return x.type === type; })[0];
        if (!d) d = DEMO_TYPES[1];
        var id = 'demo-' + d.type + '-example';
        var existing = global.ContractStore.getContract(id);
        if (existing) {
            var needSave = false;
            // 早期播种的演示合同可能缺少邀请人字段，补名并刷新持久化消息
            if (!existing.inviterName) {
                existing.inviterName = '陈庄';
                existing.inviterRole = '工长';
                needSave = true;
            }
            // 甲方统一为陈庄（工长），兼容旧数据残留的「陈业主」
            if (!existing.partyAName || existing.partyAName === '陈业主') {
                existing.partyAName = '陈庄';
                needSave = true;
            }
            // 旧数据可能缺少甲方电话，补默认演示号码
            if (!existing.partyAPhone) {
                existing.partyAPhone = '13800138000';
                needSave = true;
            }
            // 旧数据可能缺少项目地址，补演示默认地址（受邀方视角展示用）
            if (!existing.projectAddress) {
                existing.projectAddress = DEMO_PROJECT_ADDRESS;
                needSave = true;
            }
            // 老演示默认仅 1 名受邀人，补充为 DEMO_TYPES 默认多人，便于演示多人抢单效果
            if (existing.invitations && existing.invitations.length === 1) {
                existing.invitations = d.invited.map(function (uid) {
                    var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
                    return { userId: m.id, name: m.name, role: m.role, status: 'pending' };
                });
                needSave = true;
                // 同步刷新合同邀约消息：删除旧的、按新受邀人重建
                (global.ContractStore.getMessages() || []).forEach(function (m) {
                    if (m.type === 'contract_invite' && m.contractId === existing.id) {
                        global.ContractStore.deleteMessage(m.id);
                    }
                });
                existing.invitations.forEach(function (inv) {
                    global.ContractStore.addMessage({
                        id: 'cmsg-' + existing.id + '-' + inv.userId,
                        type: 'contract_invite', contractId: existing.id, toUserId: inv.userId, toUserName: inv.name,
                        fromUserName: existing.inviterName || '陈庄', fromUserRole: existing.inviterRole || '工长',
                        contractName: existing.name, contractType: existing.typeName, group: existing.group,
                        status: 'pending', time: nowLabel(), date: '今天', unread: true
                    });
                });
            }
            // 演示：预置一名「已拒绝」并附原因的受邀人，便于发起方视图展示拒绝原因（幂等，用户真实拒绝后不覆盖）
            if (presetRejectedDemo(existing.invitations)) needSave = true;
            // 示例数据升级：旧演示合同仍为旧版水电示例阶段（材料进场/布管布线/安装/收尾）时，
            // 刷新为最新示例阶段任务（含执行/确认/担责标准）。仅当全部阶段均为旧示例时才替换，
            // 不影响用户已编辑过的阶段，也不影响非水电演示合同。
            var OLD_SHUIDIAN_STAGES = ['材料进场阶段', '布管布线阶段', '安装阶段', '收尾阶段'];
            if (d.type === 'shuidian' && existing.stages && existing.stages.length === OLD_SHUIDIAN_STAGES.length) {
                var allOld = existing.stages.every(function (s) { return OLD_SHUIDIAN_STAGES.indexOf(s.name) >= 0; });
                if (allOld) {
                    existing.stages = clone(STAGE_TEMPLATES.shuidian.stages);
                    needSave = true;
                }
            }
            if (needSave) global.ContractStore.saveContract(existing);
            return id;
        }
        var invited = d.invited.map(function (uid) {
            var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
            return { userId: m.id, name: m.name, role: m.role };
        });
        global.ContractStore.createContract({
            id: id, name: d.name, type: d.type, typeName: d.typeName,
            group: d.group, partyA: 'm-owner', partyAName: '陈庄', partyAPhone: '13800138000', projectAddress: DEMO_PROJECT_ADDRESS, inviterName: '陈庄', inviterRole: '工长',
            amount: d.amount, invited: invited
        });
        // 演示：预置一名「已拒绝」并附原因的受邀人，便于发起方视图展示拒绝原因
        var freshC = global.ContractStore.getContract(id);
        if (freshC && presetRejectedDemo(freshC.invitations)) global.ContractStore.saveContract(freshC);
        return id;
    }

    // 演示用：规范化「已签约 / 已确认（发起方）」视图的受邀人状态，稳定呈现
    // 「一人已确认（乙方）、一人抢单失败、一人已拒绝」的演示效果。
    // - 乙方（首位受邀人）不参与此规范化；
    // - 仅最后一名非乙方受邀人设为「已拒绝 + 原因」；
    // - 其余非乙方受邀人若曾为「已拒绝」（旧数据残留），重置为待确认，
    //   使已签约 / 已确认（发起方）视图回退显示为「抢单失败」而非「已拒绝」。
    // 幂等：仅修改上述目标项；仅作用于 demo-<type>-example 演示合同，不覆盖用户真实数据。
    function presetRejectedDemo(invitations) {
        if (!invitations || invitations.length < 2) return false;
        var changed = false;
        var firstId = (invitations[0] || {}).userId;
        var reasonText = '近期已有其他项目安排，无法承接本合同，敬请谅解。';
        var others = invitations.filter(function (i) { return i.userId !== firstId; });
        if (others.length === 0) return false;
        var lastOther = others[others.length - 1];
        others.forEach(function (i) {
            if (i === lastOther) {
                if (i.status !== 'rejected' || !i.rejectReason) {
                    i.status = 'rejected';
                    i.rejectReason = reasonText;
                    changed = true;
                }
            } else if (i.status === 'rejected') {
                delete i.status;
                delete i.rejectReason;
                changed = true;
            }
        });
        return changed;
    }

    function createDemo(type) {
        var d = DEMO_TYPES.filter(function (x) { return x.type === type; })[0];
        if (!d || !global.ContractStore) return;
        var id = 'demo-' + type + '-' + Date.now();
        var invited = d.invited.map(function (uid) {
            var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
            return { userId: m.id, name: m.name, role: m.role };
        });
        global.ContractStore.createContract({
            id: id, name: d.name, type: d.type, typeName: d.typeName,
            group: d.group, partyA: 'm-owner', partyAName: '陈庄', partyAPhone: '13800138000', projectAddress: DEMO_PROJECT_ADDRESS, inviterName: '陈庄', inviterRole: '工长',
            amount: d.amount, invited: invited
        });
        global.location.href = 'worker-contract-detail.html?id=' + encodeURIComponent(id) + '&viewer=sender';
    }

    function resetDemo() {
        if (global.ContractStore && global.ContractStore.clearAll) global.ContractStore.clearAll();
        global.location.href = 'worker-contract-detail.html';
    }

    function bindModalDismiss() {
        var modal = $('confirmModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeConfirm();
            });
        }
        var bcModal = $('businessCardModal');
        if (bcModal) {
            bcModal.addEventListener('click', function (e) {
                if (e.target === bcModal) closeBusinessCard();
            });
        }
        var reselectModal = $('reselectConfirmModal');
        if (reselectModal) {
            reselectModal.addEventListener('click', function (e) {
                if (e.target === reselectModal) closeReselectConfirm();
            });
        }
    }

    // ============== 状态计算 ==============
    function computeStatus() {
        var c = state.contract;
        if (state.viewer === 'receiver') {
            if (c.status === 'worker_confirmed') {
                var conf = c.invitations.filter(function (i) { return i.status === 'confirmed'; })[0];
                if (conf && conf.userId === state.asUserId) return 'worker_confirmed_receiver';
                return 'worker_lost_receiver';
            }
            if (c.status === 'worker_inviting') {
                var meInv = c.invitations.filter(function (i) { return i.userId === state.asUserId; })[0];
                if (meInv && meInv.status === 'rejected') return 'worker_rejected_receiver';
                return 'worker_inviting_receiver';
            }
            if (c.status === 'worker_draft') return 'worker_draft';
            if (c.status === 'worker_signed') return 'worker_signed';
            return 'worker_draft';
        }
        if (c.status === 'worker_inviting') return 'worker_inviting_sender';
        if (c.status === 'worker_draft') return 'worker_draft';
        if (c.status === 'worker_signed') return 'worker_signed';
        return 'worker_draft';
    }

    // 预览态：根据当前选中状态推导「已确认乙方」的 userId（用于元信息/架构提示展示）
    function previewConfirmedId() {
        var st = state.status;
        var c = state.contract;
        var firstId = (c.invitations[0] || {}).userId || '';
        if (st === 'worker_signed') return firstId;
        if (st === 'worker_confirmed_receiver') return state.asUserId;
        if (st === 'worker_lost_receiver') {
            var other = c.invitations.filter(function (i) { return i.userId !== state.asUserId; })[0];
            return other ? other.userId : firstId;
        }
        return '';
    }

    // 预览态：单个受邀人在名单中的展示状态
    function inviteDisplayStatus(inv) {
        var st = state.status;
        var c = state.contract;
        var asId = state.asUserId;
        var firstId = (c.invitations[0] || {}).userId || '';
        if (st === 'worker_inviting_sender' || st === 'worker_inviting_receiver' || st === 'worker_draft') {
            return inv.status; // 真实数据
        }
        if (st === 'worker_confirmed_receiver') return inv.userId === asId ? 'confirmed' : (inv.status === 'rejected' ? 'rejected' : 'lost');
        if (st === 'worker_lost_receiver') {
            if (inv.userId === asId) return 'lost';
            var winner = c.invitations.filter(function (i) { return i.userId !== asId; })[0];
            if (winner && inv.userId === winner.userId) return 'confirmed';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'worker_signed') return inv.userId === firstId ? 'confirmed' : (inv.status === 'rejected' ? 'rejected' : 'lost');
        // 变更阶段各状态：变更仅乙方需确认，其他人仅为历史邀约记录（不再「待确认」）。
        // 乙方状态按变更逻辑随状态演进：
        //   待确认变更 change_confirming（受邀方）·变更中 changing = 待确认（变更）；
        //   确认中 change_confirming_sender = 已确认（变更）；已驳回 change_rejected = 已驳回（变更）
        if (st === 'change_confirming' || st === 'changing') {
            if (inv.userId === firstId) return 'change_pending';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'change_confirming_sender') {
            if (inv.userId === firstId) return 'change_confirmed';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'change_rejected') {
            if (inv.userId === firstId) return 'change_rejected';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        return inv.status;
    }

    // 右侧导航「状态切换」直接预览任意状态（按状态推导视角）
    function updateStatusNavActive(status) {
        // 同步右侧原型导航「合同状态切换（工人合同）」当前选中项高亮
        // 遍历全部 .status-switch-item（含无 data-status 的演示项，如「已签约（已履约完成）」），
        // 先统一清除 active，再仅给匹配项点亮，避免切换状态后残留旧高亮（详见 demoFulfilled）
        // 高亮需结合视角（data-viewer）：同一 worker_signed 状态，发起方「已签约」与受邀方「已签约(受邀方)」各自高亮
        var items = document.querySelectorAll('.status-switch-item');
        for (var i = 0; i < items.length; i++) {
            var ds = items[i].getAttribute('data-status');
            var dv = items[i].getAttribute('data-viewer');
            var match = ds && (ds === status) && (!dv || dv === (state.viewer || 'sender'));
            items[i].classList.toggle('active', !!match);
            if (match) expandGroupOf(items[i]);
        }
    }

    // 展开包含指定导航项的「状态分组」，确保选中项可见（不影响其他分组收起状态）
    function expandGroupOf(el) {
        var group = el && el.closest ? el.closest('.status-group') : null;
        if (!group) return;
        var content = group.querySelector('.status-group-content');
        var icon = group.querySelector('.status-group-icon');
        if (content) content.style.display = '';
        if (icon) icon.textContent = '▼';
    }

    /**
     * 演示：切到已签约并显示「已履约完成」徽标
     * （仅原型演示用，用于直观呈现履约完成派生标识效果）
     */
    function demoFulfilled() {
        updateStatus('worker_signed');
        // 设置履约完成状态并重新渲染阶段任务
        state.fulfilled = true;
        renderStagesSection();
        // 显示履约完成徽标
        var fb = $('fulfilledBadge');
        if (fb) fb.style.display = 'inline-flex';
        // 仅高亮「已签约（已履约完成）」演示项
        var items = document.querySelectorAll('.status-switch-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('active');
            if (items[i].textContent.trim() === '已签约（已履约完成）') {
                items[i].classList.add('active');
            }
        }
    }

    function updateStatus(status, viewer) {
        var prevStatus = state.status;
        state.status = status;

        // 乙方确认接单→已签约：将「无执行人」的任务执行人统一更新为乙方人员（仅签约瞬间触发一次）
        if (status === 'worker_signed' && prevStatus !== 'worker_signed') {
            assignDefaultExecutorsOnSigned();
        }

        // 视角处理：优先使用导航项显式传入的 viewer（如发起方「已签约」项传入 'sender'），
        // 否则按状态后缀自动推导。视角必须在更新高亮前确定，保证高亮与渲染一致。
        if (viewer) {
            state.viewer = viewer;
            if (viewer === 'receiver') {
                var fId = (state.contract.invitations[0] || {}).userId || '';
                var vValid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
                if (!vValid) state.asUserId = fId;
            } else {
                state.asUserId = '';
            }
        } else if (status.indexOf('_receiver') > -1) {
            state.viewer = 'receiver';
            var firstId = (state.contract.invitations[0] || {}).userId || '';
            var valid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
            if (!valid) state.asUserId = firstId;
        } else if (status.indexOf('_sender') > -1) {
            state.viewer = 'sender';
            state.asUserId = '';
        } else if (status.indexOf('change') === 0) {
            // 变更阶段：change_confirming（待确认变更·受邀方）与以 _receiver 结尾者为待确认方（乙方）视角，其余按发起方视角预览
            if (status === 'change_confirming' || status.indexOf('_receiver') > -1) {
                state.viewer = 'receiver';
                var cFirstId = (state.contract.invitations[0] || {}).userId || '';
                var cValid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
                if (!cValid) state.asUserId = cFirstId;
            } else {
                state.viewer = 'sender';
                state.asUserId = '';
            }
        } else if (status === 'worker_draft') {
            state.viewer = 'sender';
            state.asUserId = '';
        }

        updateStatusNavActive(status); // 同步导航状态项选中高亮（需在视角确定后调用）
        var cfg = STATUS_CONFIG[status] || STATUS_CONFIG.worker_draft;

        $('bannerText').textContent = cfg.text;
        // 受邀方（乙方）视角不展示「可发起合同变更」提示（受邀方不支持发起变更，由发起方操作）
        $('bannerDesc').textContent = (state.viewer === 'receiver' && cfg.descReceiver) ? cfg.descReceiver : cfg.desc;
        $('statusBanner').className = 'wc-banner ' + (cfg.bannerClass || 'draft');

        // 切换状态时默认隐藏履约完成徽标（仅 demoFulfilled 时显示）
        var fb = $('fulfilledBadge');
        if (fb) fb.style.display = 'none';
        state.fulfilled = false;

        // 变更已驳回（乙方）：展示乙方驳回原因
        var crr = $('changeRejectReason');
        if (crr) {
            if (cfg.showRejectReason && cfg.rejectReason) {
                crr.innerHTML = '<span class="crr-label">乙方驳回原因</span>' + escapeHtml(cfg.rejectReason);
                crr.style.display = 'block';
            } else {
                crr.style.display = 'none';
            }
        }

        // 受邀方终态（抢单失败 / 已拒绝）：渲染轻量「邀约已结束」视图，隐藏完整详情，不影响发起方视图
        var isReceiverEnded = (status === 'worker_lost_receiver' || status === 'worker_rejected_receiver');
        var endedView = $('receiverEndedView');
        if (endedView) endedView.style.display = isReceiverEnded ? 'block' : 'none';
        if ($('statusBanner')) $('statusBanner').style.display = isReceiverEnded ? 'none' : '';
        if ($('invitationCard')) $('invitationCard').style.display = isReceiverEnded ? 'none' : 'block';
        if ($('readOnlySections')) $('readOnlySections').style.display = isReceiverEnded ? 'none' : '';
        if ($('draftContentWrap')) $('draftContentWrap').style.display = isReceiverEnded ? 'none' : '';
        if ($('bottomActions')) $('bottomActions').style.display = isReceiverEnded ? 'none' : '';
        if (isReceiverEnded) {
            // 受邀方终态（抢单失败 / 已拒绝）：隐藏顶部「合同操作 更多」整行，不展示该工具栏
            var tbEnd = $('contentToolbar');
            if (tbEnd) tbEnd.style.display = 'none';
            var mpEnd = $('moreOpsPanel');
            if (mpEnd) mpEnd.classList.remove('show');
            renderReceiverEndedView(status, cfg);
            return;
        }

        // 非终态：展示顶部「合同操作 更多」工具栏，并按状态动态生成更多菜单内容
        var tbShow = $('contentToolbar');
        if (tbShow) tbShow.style.display = '';
        renderMoreOps(status);

        renderMeta();
        renderFlow(status);
        repositionFlowBar(status);
        renderLists(status);

        var isDraft = (status === 'worker_draft');
        // 受邀方视角不展示「其他被邀请人及确认状态」，仅发起方可见完整名单；
        // 但待确认变更（change_confirming·受邀方）需展示「乙方（我）待确认（变更）」行，故放开名单显示；
        // 发起方变更态的「其他邀约人」已并入合同方卡片 meta 渲染，此处隐藏避免重复
        var showInviteList = !isDraft && !isSenderChangeView() && (state.viewer !== 'receiver' || status === 'change_confirming');
        $('inviteListBox').style.display = showInviteList ? 'block' : 'none';
        $('inviteEditPanel').style.display = isDraft ? 'block' : 'none';
        if (isDraft) initEditPanel();

        var ro = $('readOnlySections');
        var dw = $('draftContentWrap');
        var cw = $('changeReadOnlyWrap');
        var rcw = $('receiverChangeWrap');
        var isSenderChange = isSenderChangeView();
        var isRCChg = receiverChangeMode();
        if (cw) cw.style.display = isSenderChange ? 'block' : 'none';
        if (rcw) rcw.style.display = isRCChg ? 'block' : 'none';
        if (ro) ro.style.display = (isDraft || isSenderChange || isRCChg) ? 'none' : 'block';
        if (dw) dw.style.display = isDraft ? 'block' : 'none';
        if (isDraft) renderDraftContent();
        if (isSenderChange) switchChangeContentTab(null, 'contract-text');

        // 受邀方变更态：对齐「已确认（受邀方）-新」——不展示状态步骤图，整个「合同邀约与乙方」卡片隐藏，
        // 其中的合同名称/金额/乙方等信息改由 receiverChangeWrap 的 hero 主卡 + 合作方卡承载
        var ic = $('invitationCard');
        if (ic) ic.style.display = isRCChg ? 'none' : 'block';
        if (isRCChg) {
            if ($('workerContractMeta')) $('workerContractMeta').style.display = 'none';
            if ($('inviteListBox')) $('inviteListBox').style.display = 'none';
        }

        // 变更态卡片标题：发起方变更态改「合同方」，对齐「已签约（发起方）-新」；其余一律还原原标题
        //（受邀方变更态整张邀约卡已隐藏，标题不参与渲染）
        var inviteTitle = $('invitationCard') ? $('invitationCard').querySelector('.card-title') : null;
        if (inviteTitle) {
            inviteTitle.innerHTML = isSenderChange ? '🤝 合同方' : '🤝 合同邀约与乙方（意向乙方 · 首位确认者成乙方）';
        }

        // 重新选择乙方（拟定中·撤回后）：存在被替换的原乙方时，横幅提示 + 历史卡片均以数据驱动展示（直接导航进入也生效）
        if (isDraft && state.contract.replacedPartyB && state.contract.replacedPartyB.name) {
            applyReselectBanner();
        }

        renderArchNote();
        renderActions(cfg);
        renderChangeHighlight();   // 变更阶段：在已签约内容基础上高亮标记变更点

        // 受邀方变更态改走「已确认（受邀方）-新」卡片流渲染，其余状态沿用原只读分区
        if (isRCChg) {
            renderReceiverChangeSections();
        } else {
            renderContentSection();
            renderStagesSection();
            renderAttachmentsSection();
        }
    }

    function renderMeta() {
        var c = state.contract;
        var html = '';
        var isDraft = (state.status === 'worker_draft');
        var isReceiver = (state.viewer === 'receiver');
        // 字段级对齐：指定的 4 个变更态（变更确认中/待确认变更/变更已驳回，含发起方与受邀方视角）补充展示「工期」字段，
        // 与最新发起方视角 / 已确认（受邀方）-新 参考页一致；变更专属字段描述效果及操作项保持不动
        var targetedChangeStates = ['change_confirming_sender', 'change_confirming', 'change_rejected'];
        var showDuration = targetedChangeStates.indexOf(state.status) > -1;

        // 发起方变更态：合同方 + 合同信息卡片，对齐「已签约（发起方）-新」参考页布局
        if (isSenderChangeView()) {
            html += '<div class="form-section-title">合同甲方</div>';
            html += '<div class="party-a-row"><div class="invite-chips">' +
                '<span class="invite-chip"><span class="member-avatar" style="background:#fa8c16;">' + escapeHtml(c.partyAName ? c.partyAName.charAt(0) : '陈') + '</span>' +
                '<span class="chip-text">' + escapeHtml(c.partyAName || '陈庄') + '（工长）</span></span></div></div>';

            // 乙方解析兜底链见 resolvePartyB()：预览已确认 → 已确认邀约 → 存储乙方 → 首位邀约 → 工种默认候选人
            var b = resolvePartyB();
            html += '<div class="form-section-title">乙方（承包方）</div>';
            html += '<div class="invite-chips">' +
                '<span class="invite-chip"><span class="member-avatar" style="background:#1677ff;">' + escapeHtml(b.name ? b.name.charAt(0) : '乙') + '</span>' +
                '<span class="chip-text">' + escapeHtml(b.name || '—') + '（' + escapeHtml(b.role || '乙方') + '）</span></span></div>';

            // 其他邀约人：渲染除乙方外的真实邀约记录行（弱化展示，样式对齐 renderLists 记录行）；无则不展示该分组
            var others = (c.invitations || []).filter(function (i) { return i.userId !== b.userId; });
            if (others.length) {
                html += '<div class="form-section-title">其他邀约人</div>';
                html += '<div class="invite-list">' + others.map(function (inv) {
                    var ds = inviteDisplayStatus(inv);
                    var stText = '待确认', stCls = 'pending';
                    if (ds === 'confirmed') { stText = '已确认（乙方）'; stCls = 'confirmed'; }
                    else if (ds === 'rejected') { stText = '已拒绝'; stCls = 'rejected'; }
                    else if (ds === 'lost') { stText = '抢单失败'; stCls = 'lost'; }
                    else if (ds === 'change_pending') { stText = '待确认（变更）'; stCls = 'change-pending'; }
                    else if (ds === 'change_confirmed') { stText = '已确认（变更）'; stCls = 'change-confirmed'; }
                    else if (ds === 'change_rejected') { stText = '已驳回（变更）'; stCls = 'change-rejected'; }
                    var reasonSub = (ds === 'rejected' && inv.rejectReason)
                        ? '<div class="invite-reason">原因：' + escapeHtml(inv.rejectReason) + '</div>' : '';
                    return '<div class="invite-row is-record">' +
                        '<div class="invite-avatar muted">' + escapeHtml(inv.name ? inv.name.charAt(0) : '?') + '</div>' +
                        '<div class="invite-info"><div class="invite-name">' + escapeHtml(inv.name) +
                        '<span class="invite-record-tag">邀约记录</span></div>' +
                        '<div class="invite-role">' + escapeHtml(inv.role) + '</div>' + reasonSub + '</div>' +
                        '<div class="invite-status ' + stCls + ' record">' + stText + '</div></div>';
                }).join('') + '</div>';
            }

            html += '<div class="form-section-title">合同信息 <span class="muted">（类型：' + escapeHtml(c.typeName) + '）</span></div>';
            html += '<div class="edit-field"><label>合同名称</label><input type="text" class="edit-input ro" value="' + escapeHtml(c.name) + '" readonly></div>';
            var cpAmt = isChangeStage() ? getActiveChangeProposal() : null;
            var amountValue = c.amount;
            if (cpAmt && typeof cpAmt.amountNew === 'number') amountValue = cpAmt.amountNew;
            html += '<div class="edit-field"><label>合同金额（元，最多两位小数）</label><input type="number" class="edit-input ro" value="' + escapeHtml(Number(amountValue || 0).toFixed(2)) + '" readonly></div>';
            // 工期：变更阶段优先展示提案的「变更后工期」（activeDuration 内部已处理兜底）
            if (showDuration) {
                var durVal = activeDuration();
                if (durVal) {
                    html += '<div class="edit-field"><label>工期（自合同签订之日起计算）</label>' +
                        '<div class="field-row"><input type="number" class="edit-input ro" value="' + escapeHtml(String(durVal)) + '" readonly><span class="field-unit">天</span></div></div>';
                }
            }
            $('workerContractMeta').innerHTML = html;
            return;
        }

        if (!isDraft) html += metaRow('合同名称', c.name);
        // 受邀方视角：取消「合同类型」「所属架构层级」，改为补充「项目地址」（见下方）
        if (!isReceiver && !isDraft) {
            html += metaRow('合同类型', c.typeName);
            html += metaRow('所属架构层级', c.group || '—');
        }
        if (!isDraft && c.amount) {
            // 变更阶段：合同金额以「旧值 → 新值」高亮标记变更点（仍为已签约内容框架）
            var cpAmt = (isChangeStage() ? getActiveChangeProposal() : null);
            if (cpAmt && cpAmt.amountNew !== cpAmt.amountOld) {
                html += metaRowHighlight('合同金额', '¥' + fmtMoney(cpAmt.amountOld) + ' 元', '¥' + fmtMoney(cpAmt.amountNew) + ' 元');
            } else {
                html += metaRow('合同金额', c.amount + ' 元');
            }
        }
        // 字段级对齐：指定变更态展示「工期」字段（参考页均含工期；变更阶段优先展示提案变更后工期）
        if (showDuration) {
            var durVal = activeDuration();
            if (durVal) html += metaRow('工期', durVal + ' 天');
        }
        // 项目地址：受邀方视角补充展示（发起方/草稿保持原样，不增删）
        if (isReceiver && c.projectAddress) html += metaRow('项目地址', c.projectAddress);
        if (c.partyAName) {
            var paPhone = c.partyAPhone || '13800138000';
            var paVal = '<span class="meta-party-a">' + escapeHtml(c.partyAName) + '（工长）</span>' +
                '<span class="meta-phone" onclick="WCP.callPartyA(\'' + escapeHtml(paPhone) + '\')" title="拨打工长电话">📞</span>';
            html += metaRowRaw('甲方', paVal);
        }
        var pId = previewConfirmedId();
        if (pId) {
            var p = c.invitations.filter(function (i) { return i.userId === pId; })[0];
            if (p) html += metaRow('乙方', p.name);
        } else if (c.partyBName) {
            html += metaRow('乙方', c.partyBName);
        }
        $('workerContractMeta').innerHTML = html;
    }
    function metaRow(label, value) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + escapeHtml(value) + '</span></div>';
    }
    function metaRowRaw(label, valueHtml) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + valueHtml + '</span></div>';
    }

    function renderFlow(status) {
        // 步骤条对齐「拟定中（发起方）-新」：拟定中 → 确认中 → 已签约（3 步，无独立「已确认」步）
        var steps = [
            { key: 'draft', label: '拟定中', icon: '✏️' },
            { key: 'inviting', label: '确认中', icon: '🤝' },
            { key: 'signed', label: '已签约', icon: '📄' }
        ];
        var order = ['draft', 'inviting', 'signed'];
        var current = 'inviting';
        var done = false;
        if (status === 'worker_draft') current = 'draft';
        // 变更阶段：合同已签约，阶段任务按变更流程流转，步骤条整体置为已签约（变更以 banner 体现）
        // 含「变更中」(changing) 与 change_* 全部变更态（变更进行中/确认中/已驳回），均与变更状态不冲突
        // 该分支须置于 confirmed 判断之前，避免 change_* 中某些 key 因含 confirmed 子串被误判
        else if (status.indexOf('change') === 0 || status === 'changing') { current = 'signed'; done = true; }
        else if (status.indexOf('confirmed') > -1) { current = 'signed'; }   // 已确认：归入「已签约」步（进行中）
        else if (status === 'worker_signed') { current = 'signed'; done = true; }
        var curIdx = order.indexOf(current);

        var html = '<div class="worker-flow">';
        steps.forEach(function (s, i) {
            var cls = i < curIdx ? 'done' : (i === curIdx ? (done ? 'done' : 'current') : '');
            html += '<div class="wf-step ' + cls + '"><div class="wf-circle">' + s.icon + '</div><div class="wf-label">' + s.label + '</div></div>';
            if (i < steps.length - 1) {
                html += '<div class="wf-line ' + (i < curIdx ? 'done' : '') + '"></div>';
            }
        });
        html += '</div>';

        var box = $('workerFlowBox');
        box.innerHTML = html;
    }

    // 撤回后 / 发起方 草稿态：步骤条移至「合同操作」下方、状态横幅之上，并改用「合同方 意向乙方首位确认者即签约乙方」标题，
    // 对齐「拟定中（发起方）-新」；非草稿态恢复原位，不影响其他状态布局。
    function repositionFlowBar(status) {
        var flowBox = $('workerFlowBox');
        var invitationCard = $('invitationCard');
        var mainView = $('mainView');
        var banner = $('statusBanner');
        var meta = $('workerContractMeta');
        if (!flowBox || !invitationCard || !mainView || !banner) return;
        var isDraft = (status === 'worker_draft');
        var title = invitationCard.querySelector('.card-title');
        if (isDraft) {
            if (flowBox.parentNode !== mainView) mainView.insertBefore(flowBox, banner);
            if (title) title.innerHTML = '🤝 合同方 <span class="card-note">意向乙方首位确认者即签约乙方</span>';
            if (meta) meta.style.display = 'none';
        } else {
            if (flowBox.parentNode === mainView && meta) invitationCard.insertBefore(flowBox, meta);
            if (title) title.innerHTML = '🤝 合同邀约与乙方（意向乙方 · 首位确认者成乙方）';
            if (meta) meta.style.display = '';
        }
    }

    function renderLists(status) {
        var box = $('inviteListBox');
        box.innerHTML = '';
        var c = state.contract;
        var firstId = (c.invitations[0] || {}).userId || '';
        var isChangeView = (status === 'changing' || status === 'change_confirming' || status === 'change_confirming_sender' || status === 'change_rejected');
        var isReceiverChangeView = isChangeView && state.viewer === 'receiver';
        c.invitations.forEach(function (inv) {
            // 受邀方变更确认态（change_confirming）：仅展示乙方（即受邀方本人）待确认行，不暴露其他受邀人
            if (isReceiverChangeView && inv.userId !== firstId) return;
            var me = (inv.userId === state.asUserId);
            var ds = inviteDisplayStatus(inv);
            var stText = '待确认', stCls = 'pending';
            if (ds === 'confirmed') { stText = '已确认（乙方）'; stCls = 'confirmed'; }
            else if (ds === 'rejected') { stText = '已拒绝'; stCls = 'rejected'; }
            else if (ds === 'lost') { stText = '抢单失败'; stCls = 'lost'; }
            else if (ds === 'change_pending') { stText = '待确认（变更）'; stCls = 'change-pending'; }
            else if (ds === 'change_confirmed') { stText = '已确认（变更）'; stCls = 'change-confirmed'; }
            else if (ds === 'change_rejected') { stText = '已驳回（变更）'; stCls = 'change-rejected'; }
            var reasonSub = '';
            if (ds === 'rejected' && inv.rejectReason && !me) {
                reasonSub = '<div class="invite-reason">原因：' + escapeHtml(inv.rejectReason) + '</div>';
            }
            var isPartyB = (inv.userId === firstId);
            // 发起方变更态：乙方已在「合同方」卡片中单独展示，邀约名单中仅保留其他邀约人
            if (isSenderChangeView() && isPartyB) return;
            // 变更/已确认(发起方)/已签约：乙方已确定，其他被邀请人作为历史邀约记录弱化展示（浅色），
            // 与变更阶段未选中邀请人效果一致（opacity 0.55 + muted 头像 + 灰色状态徽标）。
            var isRecord = (isChangeView || status === 'worker_signed') && !isPartyB;
            var partyBTag = isPartyB ? '<span class="invite-partyb-tag">乙方</span>' : '';
            var recordTag = isRecord ? '<span class="invite-record-tag">邀约记录</span>' : '';
            var row = document.createElement('div');
            row.className = 'invite-row' + (me ? ' is-me' : '') + (isPartyB && !isRecord ? ' is-partyb' : '') + (isRecord ? ' is-record' : '');
            // 乙方行以「乙方 {人员}」呈现（乙方标签在前）；记录行附「邀约记录」标识
            var nameHtml = isPartyB
                ? (partyBTag + escapeHtml(inv.name) + (me ? '（我）' : ''))
                : (escapeHtml(inv.name) + (me ? '（我）' : '') + recordTag);
            row.innerHTML =
                '<div class="invite-avatar' + (isRecord ? ' muted' : '') + '">' + escapeHtml(inv.name ? inv.name.charAt(0) : '?') + '</div>' +
                '<div class="invite-info"><div class="invite-name">' + nameHtml + '</div>' +
                '<div class="invite-role">' + escapeHtml(inv.role) + '</div>' + reasonSub + '</div>' +
                '<div class="invite-status ' + stCls + (isRecord ? ' record' : '') + '">' + stText + '</div>';
            box.appendChild(row);
        });
    }

    function renderArchNote() {
        // 已确认 / 已签约态：架构层级加入说明已在上方 banner（「已自动加入项目架构层级」）展示，
        // 下方不再重复该行，故提示框始终隐藏。
        var arch = $('workerArchNote');
        if (arch) arch.style.display = 'none';
    }

    // 受邀方终态（抢单失败 / 已拒绝）：轻量「邀约已结束」视图
    function renderReceiverEndedView(status, cfg) {
        var c = state.contract;
        var view = $('receiverEndedView');
        if (!view) return;
        var isLost = (status === 'worker_lost_receiver');
        var cls = isLost ? 'lost' : 'rejected';
        var icon = isLost ? '⚠' : '✕';
        var statusText = isLost ? '抢单失败' : '已拒绝';
        var reasonBlock = '';
        if (!isLost) {
            // 已拒绝：展示本人填写的拒绝原因
            var meInv = (c.invitations || []).filter(function (i) { return i.userId === state.asUserId; })[0];
            var reason = meInv && meInv.rejectReason;
            if (reason) {
                reasonBlock = '<div class="re-ended-reason"><span class="rr-label">拒绝原因</span>' + escapeHtml(reason) + '</div>';
            }
        }
        view.innerHTML =
            '<div class="re-ended-icon ' + cls + '">' + icon + '</div>' +
            '<div class="re-ended-status ' + cls + '">' + statusText + '</div>' +
            '<div class="re-ended-card">' +
                '<div class="re-ended-contract">' + escapeHtml(c.name) + '</div>' +
                '<div class="re-ended-desc">' + escapeHtml(cfg.desc) + '</div>' +
                reasonBlock +
            '</div>';
    }

    // ============== 合同内容 / 阶段任务 / 附件 ==============
    function switchSection(tabEl, key) {
        var tabs = document.querySelectorAll('.section-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        if (tabEl) tabEl.classList.add('active');
        var keys = ['content', 'stages', 'attachments'];
        keys.forEach(function (k) {
            var el = $(k + 'Section');
            if (el) {
                if (k === key) el.classList.add('show');
                else el.classList.remove('show');
            }
        });
    }

    function renderContentSection() {
        var c = state.contract;
        var isReceiver = (state.viewer === 'receiver');

        // 发起方变更态：合同正文采用「已签约（发起方）-新」布局（违约责任/固定详细条款/补充条款，只读）
        if (isSenderChangeView()) {
            var extra = getExtra();
            var cpExtra = isChangeStage() ? getActiveChangeProposal() : null;
            var extraChanged = cpExtra && cpExtra.extraNew && cpExtra.extraNew !== cpExtra.extraOld;
            var extraHtml;
            if (extraChanged) {
                extraHtml = '<textarea class="edit-textarea ro" readonly>' + escapeHtml(cpExtra.extraNew) + '</textarea>';
            } else if (extra) {
                extraHtml = '<textarea class="edit-textarea ro" readonly>' + escapeHtml(extra) + '</textarea>';
            } else {
                extraHtml = '<textarea class="edit-textarea ro" readonly>无</textarea>';
            }
            var breachText = '1、甲方逾期付款的，按逾期金额千分之三/日支付违约金。\n2、乙方工期延误或质量不符的，应无偿返工并承担违约责任。';
            var html = '<div class="edit-field">' +
                '<label>违约责任</label>' +
                '<textarea class="edit-textarea ro" readonly>' + escapeHtml(breachText) + '</textarea>' +
                '</div>' +
                '<div class="form-label-row">' +
                '<label class="form-label">固定详细条款</label>' +
                '<a class="view-full-link" href="worker-contract-draft-fulltext-new.html">查看条款</a>' +
                '</div>' +
                '<div class="form-label-row" style="margin-top:14px;">' +
                '<label class="form-label">补充条款</label>' +
                (extraChanged ? '<span class="text-content-change-tag">变更后</span>' : '') +
                '</div>' +
                extraHtml;
            var box = $('changePaneContractText');
            if (box) box.innerHTML = html;
            $('contentSection').innerHTML = '';
            return;
        }

        // 合同正文（查看全文）区域已取消：全文化解至「固定详细条款 → 查看条款」独立全文页（对齐「已签约（发起方）-新」布局）。
        // 发起方 / 受邀方非变更态统一仅展示「违约责任 / 固定详细条款 / 补充条款」，不再保留截断预览框与「查看全文」入口。
        var extra = getExtra();
        // 变更阶段：补充条款若被修改，以高亮标记「变更后」内容
        var cpExtra = (isChangeStage() ? getActiveChangeProposal() : null);
        var extraChanged = cpExtra && cpExtra.extraNew && cpExtra.extraNew !== cpExtra.extraOld;
        var extraHtml;
        if (extraChanged) {
            extraHtml = '<span class="text-content-change">' + escapeHtml(cpExtra.extraNew).replace(/\n/g, '<br>') + '</span>' +
                '<span class="text-content-change-tag">变更后</span>';
        } else if (extra) {
            extraHtml = escapeHtml(extra).replace(/\n/g, '<br>');
        } else {
            extraHtml = '<span style="color:var(--text-tertiary);">暂无补充条款</span>';
        }
        var stageChangeBlock = '';
        if (cpExtra && cpExtra.stageNote) {
            stageChangeBlock = '<div class="form-group" style="margin-top:16px;">' +
                '<div class="form-label-row"><label class="form-label">阶段任务变更</label>' +
                '<span class="text-content-change-tag">变更后</span></div>' +
                '<div class="text-content"><span class="text-content-change">' + escapeHtml(cpExtra.stageNote) + '</span></div>' +
            '</div>';
        }
        var breachText = '1、甲方逾期付款的，按逾期金额千分之三/日支付违约金。\n2、乙方工期延误或质量不符的，应无偿返工并承担违约责任。';
        var fullTextHref = isReceiver ? 'worker-contract-receive-clauses-new.html' : 'worker-contract-draft-fulltext-new.html';
        var html = '<div class="card">' +
            // 违约责任（对齐「已签约（发起方）-新」布局，只读）
            '<div class="form-group" style="margin-top:16px;">' +
                '<div class="edit-field" style="margin-bottom:0;">' +
                '<label>违约责任</label>' +
                '<textarea class="edit-textarea ro" readonly>' + escapeHtml(breachText) + '</textarea>' +
                '</div>' +
            '</div>' +
            // 固定详细条款（对齐「已签约（发起方）-新」布局）
            '<div class="form-group" style="margin-top:16px;">' +
                '<div class="form-label-row"><label class="form-label">固定详细条款</label>' +
                '<a class="view-full-link" href="' + fullTextHref + '">查看条款</a></div>' +
            '</div>' +
            // 补充条款（保留）
            '<div class="form-group" style="margin-top:16px;">' +
                '<div class="form-label-row"><label class="form-label">补充条款</label>' +
                (extraChanged ? '<span class="text-content-change-tag">变更后</span>' : '') + '</div>' +
                '<div class="text-content">' + extraHtml + '</div>' +
            '</div>' +
            stageChangeBlock +
            '</div>';
        $('contentSection').innerHTML = html;
    }

    /**
     * 任务名「✅」完成记号清洗。
     * 说明：该记号写在演示任务名前，语义为「已完成」，属静态残留标识。
     * 规则：仅当任务确已完成（已签约且已履约完成）或处于「变更对应状态」（用户明确要求变更态保留）时保留；
     * 其余状态（拟定中 / 确认中 / 已签约但未履约「待开始」）一律去除——签约前及待开始阶段任务不支持执行，
     * 不应出现完成标识，否则与「待开始」meta 自相矛盾。
     */
    function cleanTaskName(name) {
        var s = (name == null) ? '' : String(name);
        var keepMark = (state.status === 'worker_signed' && state.fulfilled) ||
                       (typeof state.status === 'string' && state.status.indexOf('change') === 0);
        if (keepMark) return s;
        return s.replace(/^\s*✅\s*/, '');
    }

    function renderStagesSection() {
        var c = state.contract;
        var stages = getStages();
        var isFulfilled = state.fulfilled;
        // 已签约状态：点击任务跳转任务详情页（履约完成→已完成，否则→待开始）；其余状态仍弹窗查看
        var isSigned = (state.status === 'worker_signed');
        var stageHtml = stages.map(function (s, i) {
            var tasks = (s.tasks || []).map(function (t) {
                var clickAttr = isSigned
                    ? 'onclick="WCP.goTaskDetail(this)"'
                    : 'onclick="WCP.viewTaskDetail(this)"';
                var taskName = cleanTaskName(t.name);
                return '<div class="task-item" ' + clickAttr +
                    ' data-task-name="' + escapeHtml(taskName) + '"' +
                    ' data-executor="' + escapeHtml(t.exec || '') + '"' +
                    ' data-confirmers="' + escapeHtml(t.conf || '') + '"' +
                    ' data-exec-standard="' + escapeHtml(t.execStd || '') + '"' +
                    ' data-confirm-standard="' + escapeHtml(t.confStd || '') + '"' +
                    ' data-liable-standard="' + escapeHtml(t.liableStd || '') + '"' +
                    ' data-exec-refs="' + escapeHtml(JSON.stringify(t.execRefs || [])) + '"' +
                    ' data-confirm-refs="' + escapeHtml(JSON.stringify(t.confirmRefs || [])) + '"' +
                    '><div class="task-info">' +
                    '<div class="task-name">' + escapeHtml(taskName) + (isFulfilled ? ' <span class="task-done-tag">✓ 已完成</span>' : '') + '</div>' +
                    '</div></div>';
            }).join('');
            return '<div class="stage-item"><div class="stage-header" onclick="WCP.toggleStage(this)">' +
                '<div class="stage-icon">' + (i + 1) + '</div>' +
                '<div class="stage-info"><div class="stage-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="stage-meta">' + (s.tasks ? s.tasks.length : 0) + '个任务 · ' + (isFulfilled ? '已完成 100%' : '待开始') + '</div>' +
                '<div class="stage-order-tag" style="background-color:#FFF7E6;color:#FA8C16;">' + escapeHtml(s.order || '并行执行') + '</div></div>' +
                '<div class="arrow expanded">▼</div></div>' +
                '<div class="stage-tasks show">' + tasks + '</div></div>';
        }).join('');
        var html;
        if (isSenderChangeView()) {
            html = '<div class="stage-section-title"><span>📊</span><span>阶段任务 (' + stages.length + '个阶段)</span></div>' +
                '<div class="stage-card">' + stageHtml + '</div>';
        } else {
            html = '<div class="card"><div class="card-title"><span>📊 阶段任务 (' + stages.length + '个阶段)</span></div>' + stageHtml + '</div>';
        }
        var target = isSenderChangeView() ? 'changeStagesBox' : 'stagesSection';
        $(target).innerHTML = html;
    }

    function toggleStage(header) {
        var tasks = header.parentElement.querySelector('.stage-tasks');
        var arrow = header.querySelector('.arrow');
        if (!tasks) return;
        var collapsed = tasks.style.display === 'none';
        tasks.style.display = collapsed ? 'block' : 'none';
        if (arrow) arrow.classList.toggle('expanded', collapsed);
    }

    function renderAttachmentsSection() {
        var c = state.contract;
        var attachHtml = getAttachments().map(function (a) {
            return '<div class="attachment-item"><div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(a.name) + '</div><div class="file-meta">' + escapeHtml(a.meta || '') + '</div></div>' +
                '<div class="download-btn" onclick="WCP.showToast(\'预览附件\')">⬇</div></div>';
        }).join('');
        var html;
        if (isSenderChangeView()) {
            html = '<div class="attachment-list">' + attachHtml + '</div>';
            if (!attachHtml) html = '<div style="text-align:center;padding:20px 0;color:var(--text-tertiary);font-size:13px;">暂无附件</div>';
        } else {
            // 最新流程无上传签约文件环节，附件卡仅渲染合同附件（无签约文件子卡）
            html = '<div class="card"><div class="card-title"><span>📎 合同附件</span></div>' + attachHtml + '</div>';
        }
        var target = isSenderChangeView() ? 'changeAttachmentsBox' : 'attachmentsSection';
        $(target).innerHTML = html;
    }

    // 变更生效（V2）：将发起变更页提交的提案（金额/补充条款/阶段任务/附件）落到合同，并写入版本记录
    function applyChangeProposal() {
        var cp = state.contract.changeProposal;
        if (!cp) return;
        var patch = {};
        if (typeof cp.amountNew === 'number') { state.contract.amount = cp.amountNew; patch.amount = cp.amountNew; }
        if (typeof cp.durationNew === 'number' && cp.durationNew) { state.contract.duration = cp.durationNew; patch.duration = cp.durationNew; }
        if (typeof cp.extraNew === 'string') { state.contract.extraClauses = cp.extraNew; patch.extraClauses = cp.extraNew; }
        if (cp.stagesNew) { state.contract.stages = cp.stagesNew; patch.stages = cp.stagesNew; }
        if (cp.attachmentsNew) { state.contract.attachments = cp.attachmentsNew; patch.attachments = cp.attachmentsNew; }
        // 版本记录（历史版本）：标记 V2
        state.contract.versionLog = state.contract.versionLog || [];
        var vDesc = '变更生效';
        if (cp.amountNew !== cp.amountOld) vDesc += '：金额 ¥' + fmtMoney(cp.amountOld) + ' → ¥' + fmtMoney(cp.amountNew);
        if (typeof cp.durationNew === 'number' && cp.durationNew && cp.durationOld != null && cp.durationOld !== cp.durationNew) {
            vDesc += '：工期 ' + cp.durationOld + ' 天 → ' + cp.durationNew + ' 天';
        }
        if (cp.reason) vDesc += (vDesc === '变更生效' ? '：' : '；') + cp.reason;
        state.contract.versionLog.push({
            name: '合同变更 V2',
            desc: vDesc,
            date: nowLabel(),
            by: state.contract.partyAName || '陈庄'
        });
        patch.versionLog = state.contract.versionLog;
        // 清除提案（恢复为 clean 已签约内容）
        state.contract.changeProposal = '';
        patch.changeProposal = '';
        pushChangeLog('变更生效（V2）', '合同变更已正式生效，阶段任务按变更后内容继续流转', 'primary');
        if (global.ContractStore && state.workerId) {
            global.ContractStore.patchContract(state.workerId, patch);
        }
    }

    // ============== 底部操作 ==============
    function renderActions(cfg) {
        var box = $('bottomActions');
        box.innerHTML = '';
        box.style.display = 'flex';
        var actions = cfg.actions || [];
        // 重新选择乙方（拟定中·撤回后）：存在被替换的原乙方时，底部操作显示为「恢复原乙方 / 提交并邀请乙方」
        // 数据驱动（replacedPartyB 存在即代表处于重选草稿态），跨导航进入也稳定显示
        if (state.contract.replacedPartyB && (status === 'worker_draft')) {
            actions = [
                { text: '仅保存', type: 'secondary', action: 'worker_save_draft' },
                { text: '恢复原乙方', type: 'secondary', action: 'worker_reselect_cancel' },
                { text: '提交并邀请乙方', type: 'success', action: 'worker_resubmit' }
            ];
        }
        // 受邀方（乙方）视角不支持发起变更：过滤掉 start_change（发起方专属操作），避免误展示
        if (state.viewer === 'receiver') {
            actions = actions.filter(function (a) { return a.action !== 'start_change'; });
        }
        (actions).forEach(function (a) {
            var btn = document.createElement('button');
            btn.className = 'wc-action-btn ' + (a.type || 'primary');
            btn.textContent = a.text;
            if (a.disabled) btn.disabled = true;
            btn.onclick = function () { handleAction(a.action); };
            box.appendChild(btn);
        });
        if (actions.length === 0) box.style.display = 'none';
    }

    function handleAction(action) {
        if (action === 'view') return;
        if (action === 'worker_resubmit') { saveAndResubmit(); return; }
        // 拟定中「仅保存」：持久化当前草稿编辑内容（参考「合同详情（合规版）」），不改变状态、不发送邀约
        if (action === 'worker_save_draft') { saveDraftOnly(); return; }
        // 已签约发起方：点「发起变更」→ 先二次确认，确认后跳转到发起变更「页面」（弹窗无法承载较多内容）
        if (action === 'start_change') { confirmStartChange(); return; }

        // 点击「拒绝」直接展示填写原因弹窗（二次确认在提交原因后触发），不弹前置确认框
        if (action === 'worker_reject') { openRejectReason(); return; }

        // 重选进行中（拟定中）：恢复原乙方（取消重选）
        if (action === 'worker_reselect_cancel') { cancelReselect(); return; }

        var info = ACTION_TEXT[action];
        if (!info) return;
        showConfirm(info.title, info.message, function () {
            if (action === 'worker_withdraw') {
                global.ContractStore.withdrawConfirm(state.workerId);
                state.contract = global.ContractStore.getContract(state.workerId);
                showToast('已撤回确认，合同退回拟定中');
                updateStatus(computeStatus());
            } else if (action === 'worker_confirm') {
                var r = global.ContractStore.confirmInvitation(state.workerId, state.asUserId);
                state.contract = global.ContractStore.getContract(state.workerId);
                if (r.ok) {
                    showToast('确认成功！您已成为本合同乙方，已自动加入项目架构层级');
                } else if (r.reason === 'taken' || r.reason === 'not_inviting') {
                    showToast('已被他人确认（抢单失败）');
                } else if (r.reason === 'already') {
                    showToast('您已处理过该邀约');
                } else {
                    showToast('确认失败，请稍后重试');
                }
                updateStatus(computeStatus());
            } else if (action.indexOf('change') > -1 || action.indexOf('reject_change') > -1 || action.indexOf('confirm_change') > -1) {
                // 变更阶段动作：按合规版流程推进状态并写入变更记录
                var res = applyChangeAction(action);
                if (res) {
                    pushChangeLog(res.logTitle, res.logDesc, res.logType);
                    if (res.applyProposal) {
                        // 确认变更 → 应用变更提案生成 V2（保留提案内容，不清除）
                        applyChangeProposal();
                    } else if (res.next === 'worker_signed') {
                        // 撤回/驳回变更 → 回到已签约，清除变更提案（恢复为原始已签约内容）
                        clearChangeProposal();
                    }
                    showToast(res.toast);
                    if (res.next) updateStatus(res.next);
                }
            }
        });
    }

    // 变更阶段动作的推进逻辑（对齐「合同详情（合规版）」变更流程）
    function applyChangeAction(action) {
        switch (action) {
            case 'withdraw_change':
                return { next: 'worker_signed', toast: '已撤回变更，合同恢复已签约', logTitle: '撤回变更', logDesc: '发起方撤回变更申请，合同恢复已签约状态', logType: 'primary' };
            case 'reject_change':
                // 待确认方驳回 → 进入「变更已驳回」独立页面（保留提案用于展示被驳回的变更内容，不清除）
                return { next: 'change_rejected', toast: '已驳回变更，进入变更已驳回页', logTitle: '驳回变更', logDesc: '待确认方（乙方）驳回变更申请，合同保持原已签约状态', logType: 'warning' };
            case 'change_rejected_back':
                return { next: 'worker_signed', toast: '已返回合同已签约状态', logTitle: '返回已签约', logDesc: '发起方关闭变更驳回页，合同恢复已签约状态', logType: 'primary' };
            case 'confirm_change':
                // 最新流程：对方确认后即已签约（生成 V2 版本），无需上传签约文件
                return { next: 'worker_signed', applyProposal: true, toast: '已确认变更，变更已生效（生成 V2 版本）', logTitle: '确认变更', logDesc: '待确认方确认变更，合同生成新版本（V2）并生效', logType: 'primary' };
            default:
                return null;
        }
    }

    // 写入合同变更记录（变更记录弹窗动态读取）
    function pushChangeLog(title, desc, type) {
        if (!state.contract) return;
        state.contract.changeLog = state.contract.changeLog || [];
        state.contract.changeLog.push({
            title: title,
            desc: desc,
            type: type || 'primary',
            by: state.contract.partyAName || '陈庄',
            byRole: '工长',
            time: nowLabel()
        });
        if (global.ContractStore && state.workerId) {
            global.ContractStore.patchContract(state.workerId, { changeLog: state.contract.changeLog });
        }
    }

    // 金额千分位格式化
    function fmtMoney(n) {
        var v = Number(n) || 0;
        return v.toLocaleString('zh-CN');
    }

    // 当前生效的「变更提案」：真实发起的变更优先；导航直接预览变更阶段时给出演示提案以便直观查看高亮
    function getActiveChangeProposal() {
        if (state.contract && state.contract.changeProposal) return state.contract.changeProposal;
        if (state.status && state.status.indexOf('change') === 0) {
            var baseAmt = Number(state.contract && state.contract.amount) || 0;
            var baseExtra = getExtra() || '';
            var baseDur = Number(state.contract && state.contract.duration) || 30;
            return {
                reason: '因现场实际情况调整，需对合同金额与部分阶段任务进行变更',
                amountOld: baseAmt,
                amountNew: baseAmt + 2000,
                durationOld: baseDur,
                durationNew: baseDur + 15,
                extraOld: baseExtra,
                extraNew: baseExtra ? (baseExtra + '；新增：水电隐蔽工程需增加打压测试环节。') : '新增：水电隐蔽工程需增加打压测试环节。',
                stageNote: '新增「收尾阶段」：包含 2 个任务（保洁、验收）',
                demo: true
            };
        }
        return null;
    }

    function isChangeStage() {
        return !!(state.status && state.status.indexOf('change') === 0);
    }

    // 解析当前乙方（承包方）：预览已确认 → 真实已确认邀约 → 存储乙方 → 首位邀约 → 按工种默认候选人。
    // 变更预览态 previewConfirmedId() 返回空、且本地旧演示数据可能缺邀约/乙方字段，必须有最终兜底，避免出现「?」
    function resolvePartyB() {
        var c = state.contract;
        var pId = previewConfirmedId();
        var inv = null;
        if (pId) inv = (c.invitations || []).filter(function (i) { return i.userId === pId; })[0];
        if (!inv) inv = (c.invitations || []).filter(function (i) { return i.status === 'confirmed'; })[0];
        if (inv && inv.name) return { name: inv.name, role: inv.role || '', userId: inv.userId };
        if (c.partyBName) return { name: c.partyBName, role: c.partyBRole || '', userId: '' };
        var firstInv = (c.invitations || [])[0];
        if (firstInv && firstInv.name) return { name: firstInv.name, role: firstInv.role || '', userId: firstInv.userId };
        var cand = getContractTypeCandidates(c.type)[0];
        return {
            name: cand ? cand.name : '施工方',
            role: cand ? cand.role : (TRADE_ROLE_BY_TYPE[c.type] || '乙方'),
            userId: ''
        };
    }

    // 当前工期（变更阶段优先取提案的变更后工期，未填/未变更则用当前合同工期）
    function activeDuration() {
        ensureDraftFields();
        var c = state.contract;
        var cp = isChangeStage() ? getActiveChangeProposal() : null;
        if (cp && typeof cp.durationNew === 'number' && cp.durationNew) return cp.durationNew;
        return Number(c.duration) || 0;
    }

    function isSenderChangeView() {
        return state.viewer === 'sender' && (state.status === 'change_confirming_sender' || state.status === 'change_rejected');
    }

    // 受邀方变更态（待确认变更 change_confirming / 变更已驳回 change_rejected·受邀方视角）
    function receiverChangeMode() {
        return state.viewer === 'receiver' && (state.status === 'change_confirming' || state.status === 'change_rejected');
    }

    // 受邀方变更态：渲染「主卡 / 合作方 / 工期 / 违约责任 / 合同全部正文 / 承接任务 / 附件」卡片流，
    // 对齐「已确认（受邀方）-新」页面布局（无状态步骤图）；变更相关字段描述效果及操作项保持不动
    function renderReceiverChangeSections() {
        ensureDraftFields();
        var c = state.contract;
        var b = resolvePartyB();
        var partyA = c.partyAName || '陈庄';

        // ⓪ 主卡（对齐参考页顶部 hero 主接单卡）：合同名称 + 合同报酬 + 项目地址
        var cpAmt = isChangeStage() ? getActiveChangeProposal() : null;
        var amtVal = c.amount;
        if (cpAmt && typeof cpAmt.amountNew === 'number') amtVal = cpAmt.amountNew;
        var amtOldTag = (cpAmt && cpAmt.amountNew !== cpAmt.amountOld)
            ? '<span class="rc-hero-old">原 ¥' + escapeHtml(fmtMoney(cpAmt.amountOld)) + '</span>' : '';
        var heroMeta = '';
        if (c.projectAddress) heroMeta = '<div class="rc-hero-meta"><b>项目地址</b>' + escapeHtml(c.projectAddress) + '</div>';
        $('rcHero').innerHTML =
            '<div class="rc-hero-name">' + escapeHtml(c.name) + '</div>' +
            '<div class="rc-hero-amount"><small>¥</small>' + escapeHtml(fmtMoney(amtVal)) + '<small> 元</small>' + amtOldTag + '</div>' +
            '<div class="rc-hero-label">合同报酬（施工完成且验收通过后由线下进行支付）</div>' +
            heroMeta;

        // ① 合作方
        $('rcCoop').innerHTML =
            '<div class="rc-title">🤝 合作方 <span class="rc-badge">甲方（工长）· 乙方（您）</span></div>' +
            '<div class="rc-line">甲方（雇主）：<a class="rc-call-link" onclick="WCP.showToast(\'演示原型，暂不支持拨号\')">📞 ' + escapeHtml(partyA) + '（工长）拨打电话</a></div>' +
            '<div class="rc-line">乙方（您）：<b>' + escapeHtml(b.name) + '</b></div>';

        // ② 工期（只读；变更阶段优先展示提案的「变更后工期」，有变化时附原工期说明）
        var cpDur = isChangeStage() ? getActiveChangeProposal() : null;
        var durNew = activeDuration();
        var durChanged = !!(cpDur && typeof cpDur.durationNew === 'number' && cpDur.durationNew && Number(c.duration) && cpDur.durationNew !== Number(c.duration));
        $('rcDuration').innerHTML = '<div class="rc-line">📅 工期：<b>' + escapeHtml(String(durNew || 30)) + ' 天</b>' +
            (durChanged ? ' <span style="font-size:11px;color:var(--text-tertiary,#999);">原 ' + escapeHtml(String(c.duration)) + ' 天 · 变更后 ' + escapeHtml(String(cpDur.durationNew)) + ' 天</span>' : '') +
            '</div>';

        // ③ 违约责任（只读）
        $('rcBreach').innerHTML =
            '<div class="rc-title">⚠️ 违约责任</div>' +
            '<div class="rc-line">1. 甲方逾期付款的，按逾期金额千分之三/日支付违约金。</div>' +
            '<div class="rc-line">2. 乙方工期延误或质量不符的，应无偿返工并承担违约责任。</div>';

        // ④ 合同全部正文：链接式 + 只读「已阅读并同意」标记
        $('rcFullText').innerHTML =
            '<div class="rc-full-link-row">' +
                '<a class="rc-full-link" onclick="WCP.showFullText()">📄 查看《合同全部正文》 ›</a>' +
                '<span class="rc-agreed-badge">✓ 已阅读并同意</span>' +
            '</div>';

        // ⑤ 承接任务（阶段任务，整体收纳展开）
        var stages = getStages();
        $('rcStages').innerHTML =
            '<div class="rc-title clickable" onclick="WCP.toggleReceiverStageWrap()">🔧 承接任务 <span class="rc-badge">' + stages.length + ' 个阶段</span>' +
            '<span class="rc-fold-arrow" id="rcStageArrow">▶</span></div>' +
            '<div class="rc-stage-box" id="rcStageWrap" style="display:none;" data-rendered="0"></div>';

        // ⑥ 合同附件
        var atts = getAttachments();
        var attHtml = atts.map(function (a) {
            return '<div class="rc-att"><div class="rc-att-icon">📄</div>' +
                '<div class="rc-att-name">' + escapeHtml(a.name) + '</div>' +
                '<div class="rc-att-meta">' + escapeHtml(a.meta || '') + '</div></div>';
        }).join('');
        if (!attHtml) attHtml = '<div class="rc-empty">暂无附件</div>';
        $('rcAttachments').innerHTML = '<div class="rc-title">📎 合同附件 <span class="rc-badge">' + atts.length + ' 项</span></div>' + attHtml;
    }

    // 「承接任务」整体展开 / 收起（首次展开时渲染阶段列表）
    function toggleReceiverStageWrap() {
        var wrap = $('rcStageWrap');
        var arrow = $('rcStageArrow');
        if (!wrap) return;
        var toOpen = (wrap.style.display === 'none');
        if (toOpen && wrap.getAttribute('data-rendered') === '0') {
            wrap.innerHTML = receiverStageHTML();
            wrap.setAttribute('data-rendered', '1');
        }
        wrap.style.display = toOpen ? 'block' : 'none';
        if (arrow) arrow.classList.toggle('open', toOpen);
    }

    function receiverStageHTML() {
        var stages = getStages();
        return stages.map(function (s, i) {
            var tasks = (s.tasks || []).map(function (t) {
                return '<div class="task-item" onclick="WCP.viewTaskDetail(this)"' +
                    ' data-task-name="' + escapeHtml(cleanTaskName(t.name)) + '"' +
                    ' data-executor="' + escapeHtml(t.exec || '') + '"' +
                    ' data-confirmers="' + escapeHtml(t.conf || '') + '"' +
                    ' data-exec-standard="' + escapeHtml(t.execStd || '') + '"' +
                    ' data-confirm-standard="' + escapeHtml(t.confStd || '') + '"' +
                    ' data-liable-standard="' + escapeHtml(t.liableStd || '') + '"' +
                    ' data-exec-refs="' + escapeHtml(JSON.stringify(t.execRefs || [])) + '"' +
                    ' data-confirm-refs="' + escapeHtml(JSON.stringify(t.confirmRefs || [])) + '"' +
                    '><div class="task-info"><div class="task-name">' + escapeHtml(cleanTaskName(t.name)) + '</div></div></div>';
            }).join('');
            return '<div class="stage-item"><div class="stage-header" onclick="WCP.toggleStage(this)">' +
                '<div class="stage-icon">' + (i + 1) + '</div>' +
                '<div class="stage-info"><div class="stage-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="stage-meta">' + (s.tasks ? s.tasks.length : 0) + '个任务 · 待开始</div>' +
                '<div class="stage-order-tag" style="background-color:#FFF7E6;color:#FA8C16;">' + escapeHtml(s.order || '并行执行') + '</div></div>' +
                '<div class="arrow expanded">▼</div></div>' +
                '<div class="stage-tasks show">' + tasks + '</div></div>';
        }).join('');
    }

    // ============== 发起方「发起变更」（已签约 → 变更中） ==============
    // 点「发起变更」先二次确认，确认后跳转到独立的发起变更「页面」（弹窗无法承载较多内容）
    function confirmStartChange() {
        showConfirm('发起合同变更',
            '变更需对方确认，确认后即生成新版本（V2）并生效。变更确认前阶段任务暂停流转。',
            function () {
                goChangePage();
            },
            { confirmText: '去填写', btnClass: 'primary' });
    }
    function goChangePage() {
        clearChangeProposal();   // 进入发起变更页前清除旧提案，保证从「变更已驳回」重新发起时以当前合同内容全新填写
        global.location.href = 'worker-contract-change.html?id=' + encodeURIComponent(state.workerId);
    }
    function clearChangeProposal() {
        if (state.contract && state.contract.changeProposal) {
            state.contract.changeProposal = '';
            if (global.ContractStore && state.workerId) {
                global.ContractStore.patchContract(state.workerId, { changeProposal: '' });
            }
        }
    }

    // ============== 变更内容高亮（变更阶段：仍为已签约内容，变更点高亮标记） ==============
    function renderChangeHighlight() {
        var card = $('changeHighlightCard');
        if (!card) return;
        if (!isChangeStage()) { card.style.display = 'none'; return; }
        var cp = getActiveChangeProposal();
        if (!cp) { card.style.display = 'none'; return; }
        card.style.display = 'block';
        var amtDiff = (cp.amountNew !== cp.amountOld);
        var amtHtml = amtDiff
            ? ('<span class="ch-old">¥' + fmtMoney(cp.amountOld) + '</span>' +
               '<span class="ch-arrow">→</span>' +
               '<span class="ch-new">¥' + fmtMoney(cp.amountNew) + '</span>' +
               '<span class="ch-badge">' + (cp.amountNew > cp.amountOld ? '+' : '') + fmtMoney(cp.amountNew - cp.amountOld) + '</span>')
            : ('<span class="ch-new">¥' + fmtMoney(cp.amountNew) + '</span>');
        var extraChanged = (cp.extraNew && cp.extraNew !== cp.extraOld);
        var extraHtml = '';
        if (extraChanged) {
            extraHtml = '<div class="ch-sub ch-old-text">原：' + escapeHtml(cp.extraOld || '（无）') + '</div>' +
                '<div class="ch-sub ch-new-text">变更后：' + escapeHtml(cp.extraNew) + '</div>';
        } else if (cp.extraNew) {
            extraHtml = '<div class="ch-sub">' + escapeHtml(cp.extraNew) + '</div>';
        }
        var stageHtml = cp.stageNote ? ('<div class="ch-sub ch-new-text">' + escapeHtml(cp.stageNote) + '</div>') : '';
        // 工期变更：提案含 durationNew 且与原工期不同时，在变更内容中展示「原 X 天 → 变更后 Y 天」
        var durHtml = '';
        if (typeof cp.durationNew === 'number' && cp.durationNew && cp.durationNew !== Number(state.contract.duration)) {
            durHtml = '<div class="ch-sub"><span class="ch-old">' + escapeHtml(String(state.contract.duration)) + ' 天</span>' +
                '<span class="ch-arrow">→</span>' +
                '<span class="ch-new">' + escapeHtml(String(cp.durationNew)) + ' 天</span></div>';
        }
        var stateLabel = '';
        if (state.status === 'change_rejected') {
            stateLabel = '<span class="ch-state rejected">变更已驳回（乙方）</span>';
        } else {
            // changing / change_confirming（受邀方待确认）/ change_confirming_sender（发起方待确认）：等待对方确认，确认后即生成 V2 已签约
            stateLabel = '<span class="ch-state confirming">变更进行中（等待对方确认）</span>';
        }
        var html =
            '<div class="ch-head"><span class="ch-title">🔄 变更内容</span>' + stateLabel + '</div>' +
            (cp.reason ? '<div class="ch-reason"><span class="ch-reason-label">变更原因</span>' + escapeHtml(cp.reason) + '</div>' : '') +
            '<div class="ch-row"><span class="ch-label">合同金额</span><span class="ch-value">' + amtHtml + '</span></div>' +
            (durHtml ? '<div class="ch-row"><span class="ch-label">工期</span><span class="ch-value">' + durHtml + '</span></div>' : '') +
            (extraHtml ? '<div class="ch-row"><span class="ch-label">补充条款</span><span class="ch-value">' + extraHtml + '</span></div>' : '') +
            (stageHtml ? '<div class="ch-row"><span class="ch-label">阶段任务</span><span class="ch-value">' + stageHtml + '</span></div>' : '');
        card.innerHTML = html;
    }

    // 元信息行（含变更高亮：旧值 → 新值）
    function metaRowHighlight(label, oldVal, newVal) {
        return '<div class="meta-row highlight"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value"><span class="mv-old">' + escapeHtml(oldVal) +
            '</span><span class="mv-arrow">→</span><span class="mv-new">' + escapeHtml(newVal) +
            '</span><span class="mv-tag">变更</span></span></div>';
    }

    // ============== 拒绝原因弹窗 ==============
    function openRejectReason() {
        var ta = $('rejectReasonInput');
        if (ta) ta.value = '';
        var err = $('rejectReasonErr');
        if (err) err.style.display = 'none';
        $('rejectReasonModal').classList.add('show');
        if (ta) global.setTimeout(function () { ta.focus(); }, 50);
    }
    function closeRejectReason() {
        $('rejectReasonModal').classList.remove('show');
    }
    function submitRejectReason() {
        var ta = $('rejectReasonInput');
        var reason = (ta && ta.value || '').trim();
        if (!reason) {
            var err = $('rejectReasonErr');
            if (err) { err.textContent = '请填写拒绝原因'; err.style.display = 'block'; }
            if (ta) ta.focus();
            return;
        }
        // 暂存原因，收起原因弹窗后弹出二次确认提示（原因弹窗层级更低，避免遮挡）
        pendingRejectReason = reason;
        closeRejectReason();
        showConfirm('确认拒绝邀约', '您填写的拒绝原因将提交给发起方（工长），确定要拒绝该合同邀约吗？', function () {
            doReject(pendingRejectReason);
        }, {
            confirmText: '确认拒绝',
            btnClass: 'danger',
            onCancel: function () {
                // 取消二次确认 → 回到原因弹窗并保留已填内容
                var saved = pendingRejectReason;
                pendingRejectReason = null;
                openRejectReason();
                var taBack = $('rejectReasonInput');
                if (taBack && saved) taBack.value = saved;
            }
        });
    }
    function doReject(reason) {
        pendingRejectReason = null;
        global.ContractStore.rejectInvitation(state.workerId, state.asUserId, reason);
        state.contract = global.ContractStore.getContract(state.workerId);
        showToast('已拒绝该合同邀约');
        updateStatus(computeStatus());
    }

    // ============== 发起方主动重新选择乙方 ==============
    function openReselectConfirm() {
        var m = $('reselectConfirmModal');
        if (m) m.classList.add('show');
    }
    function closeReselectConfirm() {
        var m = $('reselectConfirmModal');
        if (m) m.classList.remove('show');
    }
    function confirmReselect() {
        closeReselectConfirm();
        if (global.ContractStore && state.workerId) {
            global.ContractStore.reselectPartyB(state.workerId);   // 原乙方 replaced、versionLog 留痕、清空名单、退回拟定中
            state.contract = global.ContractStore.getContract(state.workerId);
        }
        updateStatus('worker_draft');   // 渲染拟定中（撤回后）：横幅/历史卡片/底部「恢复原乙方·提交并邀请乙方」均以 replacedPartyB 数据驱动
        showToast('合同已退回拟定中，请重新选择乙方');
    }
    // 重选拟定中横幅：提示原乙方合作未达成，并引导重新搜索选择 1-3 名意向乙方
    function applyReselectBanner() {
        var prev = state.contract.replacedPartyB;
        $('bannerText').textContent = '重新选择乙方';
        $('bannerDesc').textContent = prev && prev.name
            ? ('原乙方「' + prev.name + '」合作未达成，合同已退回拟定中。请重新搜索并选择 1-3 名意向乙方后提交邀请。')
            : '合同已退回拟定中。请重新搜索并选择 1-3 名意向乙方后提交邀请。';
        $('statusBanner').className = 'wc-banner draft';
        renderReselectHistory();   // 同步展示「历史选择记录」卡片
    }
    // 重选视图内的「历史选择记录」卡片：展示被替换的原乙方（发起人可见，直至提交新邀请）
    function renderReselectHistory() {
        var card = $('reselectHistoryCard');
        if (!card) return;
        var prev = state.contract.replacedPartyB;
        if (prev && prev.name) {
            card.style.display = 'block';
            $('reselectHistoryBody').innerHTML =
                memberAvatarHtml(prev, '') +
                '<div class="rh-info">' +
                    '<div class="rh-name">' + escapeHtml(prev.name) + '</div>' +
                    '<div class="rh-role">' + escapeHtml(prev.role || '乙方') + '</div>' +
                '</div>' +
                '<span class="rh-tag">合作未达成</span>';
        } else {
            card.style.display = 'none';
        }
    }
    function cancelReselect() {
        var prev = state.contract.replacedPartyB;   // 恢复原乙方以 replacedPartyB 为权威来源（跨导航也稳定）
        if (global.ContractStore && state.workerId && prev) {
            global.ContractStore.reselectCancel(state.workerId, prev);
            state.contract = global.ContractStore.getContract(state.workerId);
        }
        updateStatus('worker_draft');
        showToast('已取消重新选择，恢复原乙方');
    }
    // ============== 乙方头像 / 个人电子名片（拟定中选择乙方时展示） ==============
    // 由 userId 生成稳定色相，保证同名不同人头像颜色不同（避免重名混淆）
    function avatarColor(seed) {
        seed = seed || '?';
        var h = 0;
        for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
        return 'hsl(' + h + ', 52%, 55%)';
    }
    function memberAvatarHtml(m, extraCls) {
        var initial = (m.name || '?').charAt(0);
        var color = avatarColor(m.userId || m.name || '?');
        return '<span class="member-avatar ' + (extraCls || '') + '" style="background:' + color + '">' + escapeHtml(initial) + '</span>';
    }
    function openBusinessCard(m) {
        var av = $('bcAvatar');
        if (av) { av.textContent = (m.name || '?').charAt(0); av.style.background = avatarColor(m.userId || m.name || '?'); }
        var nm = $('bcName'); if (nm) nm.textContent = m.name || '';
        var rl = $('bcRole'); if (rl) rl.textContent = m.role || '';
        var idEl = $('bcId'); if (idEl) idEl.textContent = m.userId || '';
        var box = $('businessCardModal'); if (box) box.classList.add('show');
    }
    function closeBusinessCard() {
        var box = $('businessCardModal'); if (box) box.classList.remove('show');
    }

    // ============== 拟定中：内联「意向乙方」编辑面板 ==============
    function initEditPanel() {
        var typeCands = getContractTypeCandidates(state.contract.type);
        var validIds = typeCands.map(function (m) { return m.id; });
        state.editInvited = (state.contract.invitations || []).filter(function (i) {
            return validIds.indexOf(i.userId) > -1;
        }).map(function (i) {
            return { userId: i.userId, name: i.name, role: i.role };
        });
        if ($('editNameInput')) $('editNameInput').value = state.contract.name || '';
        if ($('editAmountInput')) $('editAmountInput').value = (state.contract.amount != null && state.contract.amount !== '') ? state.contract.amount : '';
        if ($('editDurationInput')) $('editDurationInput').value = (state.contract.duration != null && state.contract.duration !== '') ? state.contract.duration : '';
        if ($('breachInput')) $('breachInput').value = state.contract.breach || '';
        // 甲方默认陈庄（与数据归一化一致）
        if (!state.contract.partyAName) state.contract.partyAName = '陈庄';
        renderPartyAChips();
        renderEditChips();
        renderEditList();
    }

    // ============== 拟定中：合同甲方选择（单选，模糊匹配姓名/角色；复用 WORKER_CANDIDATES） ==============
    function togglePartyAPanel() {
        var p = $('partyAPanelBox'); if (!p) return;
        var open = p.classList.contains('open');
        if (open) { p.classList.remove('open'); return; }
        p.classList.add('open');
        var s = $('partyASearch');
        if (s) { s.value = ''; renderPartyAList(); if (s.focus) s.focus(); }
    }
    function filterPartyA() { renderPartyAList(); }
    function renderPartyAList() {
        var listEl = $('partyAList');
        var emptyEl = $('partyAEmpty');
        if (!listEl) return;
        var keyword = (($('partyASearch') && $('partyASearch').value) || '').trim().toLowerCase();
        listEl.innerHTML = '';
        var matched = WORKER_CANDIDATES.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        var curId = (state.contract && state.contract.partyAId) ||
            ((state.contract && state.contract.partyAName) ? (WORKER_CANDIDATES.filter(function (x) { return x.name === state.contract.partyAName; })[0] || {}).id : '') || '';
        matched.forEach(function (m) {
            var selected = curId && curId === m.id;
            var item = document.createElement('div');
            item.className = 'member-picker-item' + (selected ? ' selected' : '');
            item.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="member-main"><span class="member-name">' + escapeHtml(m.name) + '</span>' +
                '<span class="member-role">' + escapeHtml(m.role) + '</span></span>' +
                (selected ? '<span class="check">✓</span>' : '');
            item.onclick = function () { selectPartyA(m); };
            var av = item.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            listEl.appendChild(item);
        });
    }
    function selectPartyA(m) {
        state.contract.partyAName = m.name;
        state.contract.partyAId = m.id;
        renderPartyAChips();
        renderPartyAList();
        var p = $('partyAPanelBox'); if (p) p.classList.remove('open');
    }
    function renderPartyAChips() {
        var chipsEl = $('partyAChips');
        var valEl = $('partyAValue');
        if (!chipsEl) return;
        chipsEl.innerHTML = '';
        var name = state.contract && state.contract.partyAName;
        if (!name) {
            if (valEl) valEl.textContent = '选择甲方 ›';
            return;
        }
        if (valEl) valEl.textContent = '更换甲方 ›';
        var cur = (WORKER_CANDIDATES.filter(function (x) { return x.name === name; })[0]) || { name: name, role: '' };
        var chip = document.createElement('span');
        chip.className = 'invite-chip';
        chip.innerHTML = memberAvatarHtml(cur, 'clickable') +
            '<span class="chip-text">' + escapeHtml(cur.name) + (cur.role ? '（' + escapeHtml(cur.role) + '）' : '') + '</span>' +
            '<span class="x">✕</span>';
        var av = chip.querySelector('.member-avatar');
        if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(cur); };
        chip.querySelector('.x').onclick = function (ev) {
            ev.stopPropagation();
            state.contract.partyAName = '';
            state.contract.partyAId = '';
            renderPartyAChips();
            renderPartyAList();
        };
        chipsEl.appendChild(chip);
    }

    function toggleEditPanel() {
        var p = $('editInvitePanelBox');
        var open = p.classList.contains('open');
        if (open) { p.classList.remove('open'); return; }
        p.classList.add('open');
        var s = $('editInviteSearch');
        s.value = '';
        renderEditList();
        if (s.focus) s.focus();
    }

    function filterEdit() { renderEditList(); }

    function renderEditList() {
        var listEl = $('editInviteList');
        var emptyEl = $('editInviteEmpty');
        var keyword = ($('editInviteSearch').value || '').trim().toLowerCase();
        listEl.innerHTML = '';
        var typeCands = getContractTypeCandidates(state.contract.type);
        var roleLabel = typeCands[0] ? typeCands[0].role : '工种';
        var titleEl = $('inviteRoleTitle');
        if (titleEl) titleEl.textContent = '意向乙方（仅 ' + roleLabel + '）';
        if (emptyEl) emptyEl.textContent = '未找到匹配的' + roleLabel;
        var matched = typeCands.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 ||
                m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { emptyEl.style.display = 'block'; return; }
        emptyEl.style.display = 'none';
        var full = state.editInvited.length >= 3;
        matched.forEach(function (m) {
            var selected = state.editInvited.some(function (x) { return x.userId === m.id; });
            var item = document.createElement('div');
            item.className = 'member-picker-item' + (selected ? ' selected' : '') + (full && !selected ? ' disabled' : '');
            item.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="member-main"><span class="member-name">' + escapeHtml(m.name) + '</span>' +
                '<span class="member-role">' + escapeHtml(m.role) + '</span></span>' +
                (selected ? '<span class="check">✓</span>' : '');
            item.onclick = function () { toggleEditMember(m); };
            // 头像点击 → 查看个人电子名片（不触发选择/取消选择）
            var av = item.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            listEl.appendChild(item);
        });
    }

    function toggleEditMember(m) {
        var idx = state.editInvited.map(function (x) { return x.userId; }).indexOf(m.id);
        if (idx > -1) {
            state.editInvited.splice(idx, 1);
        } else {
            if (state.editInvited.length >= 3) {
                showToast('最多邀请 3 名意向乙方');
                return;
            }
            state.editInvited.push({ userId: m.id, name: m.name, role: m.role });
        }
        renderEditChips();
        renderEditList();
    }

    function renderEditChips() {
        var chipsEl = $('inviteEditChips');
        var countEl = $('inviteCount');
        var valEl = $('editInviteValue');
        chipsEl.innerHTML = '';
        if (state.editInvited.length === 0) {
            valEl.textContent = '点击添加意向乙方';
            if (countEl) countEl.textContent = '（至少 1 人）';
        } else {
            valEl.textContent = '已选 ' + state.editInvited.length + ' / 3 人';
            if (countEl) countEl.textContent = '';
        }
        state.editInvited.forEach(function (m) {
            var chip = document.createElement('span');
            chip.className = 'invite-chip';
            chip.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="chip-text">' + escapeHtml(m.name) + '（' + escapeHtml(m.role) + '）</span>' +
                '<span class="x" data-id="' + m.userId + '">✕</span>';
            // 头像点击 → 查看个人电子名片（不触发删除）
            var av = chip.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            chip.querySelector('.x').onclick = function (ev) {
                ev.stopPropagation();
                var target = getContractTypeCandidates(state.contract.type).filter(function (x) { return x.id === m.userId; })[0];
                if (target) toggleEditMember(target);
            };
            chipsEl.appendChild(chip);
        });
    }

    function saveAndResubmit() {
        var name = ($('editNameInput').value || '').trim();
        var amountRaw = ($('editAmountInput').value || '').trim();
        var duration = ($('editDurationInput').value || '').trim();
        var breach = ($('breachInput').value || '').trim();
        if (!name) { showToast('请填写合同名称'); return; }
        var amount = Number(amountRaw);
        if (!amountRaw || isNaN(amount) || amount <= 0) { showToast('请填写有效的合同金额'); return; }
        if (state.editInvited.length < 1 || state.editInvited.length > 3) {
            showToast('请至少选择 1 名意向乙方');
            return;
        }
        ensureDraftFields();
        state.contract.duration = duration;
        state.contract.breach = breach;
        var info = ACTION_TEXT.worker_resubmit;
        showConfirm(info.title, info.message, function () {
            if (global.ContractStore.patchContract) {
                global.ContractStore.patchContract(state.workerId, {
                    name: name, amount: amount,
                    duration: duration, breach: breach,
                    partyAName: state.contract.partyAName, partyAId: state.contract.partyAId,
                    stages: state.contract.stages,
                    extraClauses: state.contract.extraClauses,
                    attachments: state.contract.attachments,
                    templateText: state.contract.templateText,
                    templateStage: state.contract.templateStage,
                    contentIntro: state.contract.contentIntro
                });
            }
            global.ContractStore.submitInvite(state.workerId, state.editInvited);
            state.contract = global.ContractStore.getContract(state.workerId);
            showToast('已提交邀请');
            updateStatus(computeStatus());
            renderReselectHistory();            // 隐藏「历史选择记录」卡片（replacedPartyB 已清空）
        });
    }

    // ============== 拟定中「仅保存」（参考「合同详情（合规版）」saveDraftContent） ==============
    // 将当前草稿编辑内容持久化到合约库，不改变状态、不发送邀约、不弹出二次确认；
    // 重新进入拟定中时由 initEditPanel / renderDraftContent 自动恢复（含意向乙方）。
    function saveDraftOnly() {
        var name = ($('editNameInput').value || '').trim();
        var amount = ($('editAmountInput').value || '').trim();
        var duration = ($('editDurationInput').value || '').trim();
        var breach = ($('breachInput').value || '').trim();
        ensureDraftFields();
        state.contract.duration = duration;
        state.contract.breach = breach;
        if (global.ContractStore.patchContract) {
            global.ContractStore.patchContract(state.workerId, {
                name: name,
                amount: amount,
                duration: duration,
                breach: breach,
                partyAName: state.contract.partyAName,
                partyAId: state.contract.partyAId,
                stages: state.contract.stages,
                extraClauses: state.contract.extraClauses,
                attachments: state.contract.attachments,
                templateText: state.contract.templateText,
                templateStage: state.contract.templateStage,
                contentIntro: state.contract.contentIntro,
                // 持久化意向乙方选择（仅落库，不发送邀约、不改变状态；submitInvite 时会被整体覆盖）
                invitations: state.editInvited.map(function (m) {
                    return { userId: m.userId, name: m.name, role: m.role, status: 'pending' };
                })
            });
        }
        showToast('已保存草稿内容');
    }

    // ============== 拟定中：可编辑合同内容（参考「合同详情（合规版）」） ==============
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }

    function defaultAttachments() {
        var tn = (state.contract && state.contract.typeName) || '服务合同';
        return [
            { name: tn + '.pdf', meta: '2.3MB · 2024-01-10上传' },
            { name: '量房照片.jpg', meta: '1.5MB · 2024-01-10上传' },
            { name: '材料清单.xlsx', meta: '156KB · 2024-01-12上传' },
            { name: '施工图纸.dwg', meta: '5.8MB · 2024-01-12上传' }
        ];
    }

    // 确保合同内容字段存在（草稿态在内存中初始化，提交时一并落库）
    function ensureDraftFields() {
        var c = state.contract;
        if (!c) return;
        if (!c.stages) c.stages = clone((STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).stages);
        if (c.extraClauses == null) c.extraClauses = '1. 乙方应严格按照施工图纸进行施工，如有变更需经甲方书面确认。\n2. 材料进场需经甲方或监理方验收合格后方可使用。\n3. 隐蔽工程验收合格后方可进行下一道工序。';
        if (!c.attachments) c.attachments = defaultAttachments();
        if (c.templateText == null) c.templateText = '';
        if (c.templateStage == null) c.templateStage = '';
        if (!c.contentIntro) c.contentIntro = (STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).contentIntro;
        if (c.duration == null || c.duration === '') c.duration = '30';
        if (c.breach == null || c.breach === '') c.breach = '1、甲方逾期付款的，按逾期金额千分之三/日支付违约金。\n2、乙方工期延误或质量不符的，应无偿返工并承担违约责任。';
        if (!c.partyAName) c.partyAName = '陈庄';
    }
    function getStages() { ensureDraftFields(); return state.contract.stages; }
    function getContentIntro() { ensureDraftFields(); return state.contract.contentIntro; }
    function getExtra() { ensureDraftFields(); return state.contract.extraClauses; }
    function getAttachments() { ensureDraftFields(); return state.contract.attachments; }
    function tradeWorkerOf(type) {
        var c = getContractTypeCandidates(type)[0];
        return c ? c.name : '施工方';
    }

    function renderDraftContent() {
        ensureDraftFields();
        renderDraftContractText();
        renderDraftStageTask();
        renderDraftAttachment();
        switchDraftContentTab(null, state.draftContentTab || 'contract-text');
    }

    function switchDraftContentTab(tabEl, key) {
        state.draftContentTab = key;
        var tabs = document.querySelectorAll('#draftContentWrap .content-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        var map = { 'contract-text': 0, 'stage-task': 1, 'attachment': 2 };
        if (tabs[map[key]]) tabs[map[key]].classList.add('active');
        var panes = ['wcDraftContractText', 'wcDraftStageTask', 'wcDraftAttachment'];
        panes.forEach(function (pid, i) {
            var el = $(pid);
            if (el) el.classList.toggle('active', i === map[key]);
        });
        // 附件 Tab：隐藏「更换模板」按钮（附件不支持模板功能）
        var btn = $('draftTemplateBtn');
        if (btn) btn.style.display = (key === 'attachment') ? 'none' : '';
    }

    // 变更阶段（发起方视角）只读合同内容 Tab 切换
    function switchChangeContentTab(tabEl, key) {
        var wrap = $('changeReadOnlyWrap');
        if (!wrap) return;
        var tabs = wrap.querySelectorAll('.content-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        if (tabEl) tabEl.classList.add('active');
        var panes = ['changePaneContractText', 'changePaneStageTask', 'changePaneAttachment'];
        panes.forEach(function (pid) {
            var el = $(pid);
            if (el) el.classList.remove('active');
        });
        var map = { 'contract-text': 'changePaneContractText', 'stage-task': 'changePaneStageTask', 'attachment': 'changePaneAttachment' };
        var pane = $(map[key]);
        if (pane) pane.classList.add('active');
    }

    function renderDraftContractText() {
        var c = state.contract;
        var breach = $('breachInput');
        if (breach) breach.value = c.breach || '';
        var extra = $('editContractExtra');
        if (extra) extra.value = getExtra();
        var info = $('draftTemplateInfo');
        var tag = $('draftTemplateTag');
        if (info && tag) {
            if (c.templateText) { info.style.display = 'block'; tag.textContent = '已选择模板：' + c.templateText; }
            else { info.style.display = 'none'; }
        }
    }
    function updateDraftExtra(val) { if (state.contract) state.contract.extraClauses = val; }

    function renderDraftStageTask() {
        var c = state.contract;
        var stages = getStages();
        var html = stages.map(function (s, i) {
            var seqOn = (s.order === '顺序执行');
            var tasks = (s.tasks || []).map(function (t, j) {
                return '<div class="task-edit-item">' +
                    '<input class="task-input" value="' + escapeHtml(cleanTaskName(t.name)) + '" placeholder="任务名称" oninput="WCP.updateDraftTaskName(' + i + ',' + j + ',this.value)" onclick="WCP.editTaskDetail(this,' + i + ',' + j + ')" readonly>' +
                    '<div class="task-action-btn edit" onclick="WCP.editTaskDetail(this,' + i + ',' + j + ')" title="编辑详情">✎</div>' +
                    '<div class="task-action-btn" onclick="WCP.deleteDraftTask(' + i + ',' + j + ')">×</div>' +
                    '</div>';
            }).join('');
            return '<div class="stage-card">' +
                '<div class="stage-card-header">' +
                '<div class="stage-card-header-row">' +
                '<input type="text" class="stage-name-input" value="' + escapeHtml(s.name) + '" placeholder="请输入阶段名称" oninput="WCP.updateDraftStageName(' + i + ',this.value)">' +
                '<div class="stage-sequential"><span>' + (seqOn ? '按序执行' : '并行执行') + '</span><div class="switch ' + (seqOn ? 'active' : '') + '" onclick="WCP.toggleDraftStageSeq(' + i + ',this)"></div></div>' +
                '</div>' +
                '<div class="stage-card-header-row"><div class="stage-actions">' +
                '<div class="stage-action-btn add" onclick="WCP.openAddTaskModal(' + i + ')">+ 添加任务</div>' +
                '<div class="stage-action-btn delete" onclick="WCP.deleteDraftStage(' + i + ')">× 删除阶段</div>' +
                '</div></div>' +
                '</div>' +
                '<div class="task-edit-list">' + tasks + '</div>' +
                '</div>';
        }).join('');
        var listEl = $('draftStageList');
        if (listEl) listEl.innerHTML = html;
        var info = $('draftStageInfo');
        var tag = $('draftStageTag');
        if (info && tag) {
            if (c.templateStage) { info.style.display = 'block'; tag.textContent = '已选择模板：' + c.templateStage; }
            else { info.style.display = 'none'; }
        }
    }
    function updateDraftTaskName(si, ti, val) { var s = state.contract.stages[si]; if (s && s.tasks[ti]) s.tasks[ti].name = val; }
    function updateDraftStageName(si, val) { if (state.contract.stages[si]) state.contract.stages[si].name = val; }
    function toggleDraftStageSeq(si, el) {
        var s = state.contract.stages[si]; if (!s) return;
        var on = el.classList.toggle('active');
        s.order = on ? '顺序执行' : '并行执行';
        var span = el.parentElement.querySelector('span');
        if (span) span.textContent = s.order;
    }
    function addDraftTask(si) {
        var s = state.contract.stages[si]; if (!s) return;
        s.tasks = s.tasks || [];
        var exec = state.editInvited.length === 1 ? state.editInvited[0].name : '';
        s.tasks.push({ name: '新任务', exec: exec, conf: '', execRefs: [], confirmRefs: [] });
        renderDraftStageTask();
    }
    function deleteDraftTask(si, ti) { var s = state.contract.stages[si]; if (!s) return; s.tasks.splice(ti, 1); renderDraftStageTask(); }
    function addDraftStage() {
        var exec = state.editInvited.length === 1 ? state.editInvited[0].name : '';
        state.contract.stages.push({ name: '新阶段', order: '顺序执行', tasks: [{ name: '新任务', exec: exec, conf: '' }] });
        renderDraftStageTask();
    }
    function deleteDraftStage(si) { state.contract.stages.splice(si, 1); renderDraftStageTask(); }

    function renderDraftAttachment() {
        var c = state.contract;
        var atts = getAttachments();
        var html = atts.map(function (a, i) {
            return '<div class="attachment-item">' +
                '<div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(a.name) + '</div><div class="file-size">' + escapeHtml(a.meta || '') + '</div></div>' +
                '<div class="delete-btn" onclick="WCP.removeDraftAttachment(' + i + ')">删除</div>' +
                '</div>';
        }).join('');
        var listEl = $('draftAttList');
        if (listEl) listEl.innerHTML = html;
    }
    function addDraftAttachment() { var inp = $('draftAttInput'); if (inp) inp.click(); }
    function onDraftAttPicked(e) {
        var f = e.target && e.target.files && e.target.files[0];
        if (!f) return;
        var sz = (f.size ? (f.size / 1024).toFixed(0) + 'KB' : '—');
        state.contract.attachments.push({ name: f.name, meta: sz + ' · 刚刚上传' });
        renderDraftAttachment();
        e.target.value = '';
    }
    function removeDraftAttachment(i) { state.contract.attachments.splice(i, 1); renderDraftAttachment(); }

    // ---- 更换模板（按当前内容 Tab 提供类型匹配模板） ----
    function draftBaseName() {
        var tn = (state.contract && state.contract.typeName) || '服务';
        return tn.replace('班组服务合同', '').replace('服务合同', '');
    }
    function getDraftTemplates(kind) {
        var b = draftBaseName();
        if (kind === 'text') return [
            { id: 'std', name: '标准' + b + '服务合同', desc: '含工程概况 / 价款 / 质量 / 违约等完整条款' },
            { id: 'lite', name: '精简' + b + '服务合同', desc: '核心条款精简版' }
        ];
        // stage
        return [
            { id: 'std', name: '标准' + b + '工程阶段', desc: '沿用本合同类型标准阶段模板' },
            { id: 'lite', name: '精简' + b + '工程阶段', desc: '仅保留核心阶段' }
        ];
    }
    function showDraftTemplatePicker() {
        var tab = state.draftContentTab || 'contract-text';
        if (tab === 'attachment') { showToast('附件区不支持更换模板，请直接上传或删除附件'); return; }
        var kind = tab === 'stage-task' ? 'stage' : 'text';
        openTemplatePicker(kind);
    }
    function openTemplatePicker(kind) {
        state.tplKind = kind;
        renderTemplatePickerList(kind);
        var m = $('wcTemplatePicker');
        if (m) m.classList.add('show');
    }
    function renderTemplatePickerList(kind) {
        var list = $('wcTplList');
        if (!list) return;
        var items = getDraftTemplates(kind);
        var titleMap = { text: '选择合同正文模板', stage: '选择阶段任务模板' };
        var t = $('wcTplTitle'); if (t) t.textContent = titleMap[kind] || '选择模板';
        var ft = $('wcTplFilterType'); if (ft) ft.textContent = (state.contract && state.contract.typeName) || '-';
        var emptyEl = $('wcTplEmpty'); if (emptyEl) emptyEl.style.display = items.length ? 'none' : 'block';
        var icon = kind === 'stage' ? '📝' : '📄';
        list.innerHTML = items.map(function (it) {
            return '<div class="template-select-item">' +
                '<div class="item-left"><div class="item-icon">' + icon + '</div></div>' +
                '<div class="item-content">' +
                    '<div class="item-name">' + escapeHtml(it.name) + '</div>' +
                    '<div class="item-desc">' + escapeHtml(it.desc) + '</div>' +
                '</div>' +
                '<div class="item-actions">' +
                    '<span class="action-btn secondary" onclick="WCP.previewDraftTemplate(\'' + kind + '\',\'' + it.id + '\')">预览</span>' +
                    '<span class="action-btn primary" onclick="WCP.applyTemplate(\'' + kind + '\',\'' + it.id + '\')">使用</span>' +
                '</div></div>';
        }).join('');
    }
    function applyTemplate(kind, id) {
        var c = state.contract;
        if (kind === 'text') {
            c.templateText = (getDraftTemplates('text').filter(function (x) { return x.id === id; })[0] || {}).name || '';
            if (id === 'lite') c.contentIntro = '工程内容：' + draftBaseName() + '相关作业（精简版）。';
        } else {
            var src = (STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).stages;
            c.stages = id === 'lite' ? clone(src).slice(0, 2) : clone(src);
            c.templateStage = (getDraftTemplates('stage').filter(function (x) { return x.id === id; })[0] || {}).name || '';
        }
        closeTemplatePicker();
        renderDraftContent();
        showToast('已应用模板');
    }
    function closeTemplatePicker() { var m = $('wcTemplatePicker'); if (m) m.classList.remove('show'); }

    // 正文模板预览：拆为「违约责任」与「固定详细条款」两个只读区域；固定详细条款仅含标准条款项，不含甲乙方/金额/工期
    function buildTemplatePreviewSections(id) {
        if (id === 'lite') {
            return {
                breach: '任一方违约应承担相应责任并赔偿对方因此受到的损失。',
                fixed: '一、质量要求：符合国家现行施工标准。\n二、争议解决：协商不成的，向工程所在地人民法院起诉。'
            };
        }
        return {
            breach: '任一方违约应承担相应责任并赔偿对方因此受到的损失。',
            fixed: '一、双方权利义务\n甲方有权监督、指导乙方工作并给予奖励、处罚；乙方应按标准施工，服从现场管理规定与交底。\n\n二、质量标准\n应符合国家及行业现行施工验收标准，材料合格、工艺规范。\n\n三、验收标准\n阶段完工后由甲方组织验收，合格后方可进入下一阶段。\n\n四、争议解决\n本合同履行中发生争议，双方应友好协商解决；协商不成的，向工程所在地人民法院提起诉讼。'
        };
    }

    // 模板预览（弹窗效果与布局对齐「拟定中（发起方）-新」更换模板的预览交互）
    var tplPreviewStages = null; // 阶段任务模板预览：缓存当前预览的阶段数据，供点击任务就地展开三项标准
    function previewDraftTemplate(kind, id) {
        var item = (getDraftTemplates(kind) || []).filter(function (x) { return x.id === id; })[0];
        if (!item) return;
        state.previewTplKind = kind;
        state.previewTplId = id;
        var titleEl = $('wcPreviewTitle'); if (titleEl) titleEl.textContent = item.name;
        var metaEl = $('wcPreviewMeta');
        if (metaEl) {
            var tn = (state.contract && state.contract.typeName) || '';
            if (kind === 'stage') {
                var src0 = STAGE_TEMPLATES[state.contract.type] || STAGE_TEMPLATES.shuidian;
                var sn = (id === 'lite') ? src0.stages.slice(0, 2).length : src0.stages.length;
                metaEl.innerHTML = '<span>类型：' + escapeHtml(tn) + '</span><span>阶段数：' + sn + '</span>';
            } else {
                metaEl.innerHTML = '<span>类型：' + escapeHtml(tn) + '</span><span>模板：' + escapeHtml(item.name) + '</span>';
            }
        }
        var contentEl = $('wcPreviewContent');
        if (contentEl) {
            var html = '';
            if (kind === 'stage') {
                var src = STAGE_TEMPLATES[state.contract.type] || STAGE_TEMPLATES.shuidian;
                var stages = (id === 'lite') ? src.stages.slice(0, 2) : src.stages;
                tplPreviewStages = stages;
                html += '<div class="preview-section"><div class="preview-section-title">阶段任务明细（' + stages.length + ' 个阶段）</div><div class="preview-stage-list">';
                stages.forEach(function (s, i) {
                    var tasks = (s.tasks || []).map(function (t, ti) {
                        var did = 'tplTask_' + i + '_' + ti, tid = 'tplTaskToggle_' + i + '_' + ti;
                        var std = function (lbl, val) {
                            return '<div style="margin-bottom:8px;"><span style="color:#1677ff;font-weight:600;">' + lbl + '：</span><span style="color:#333;">' + escapeHtml(val || '（未填写）') + '</span></div>';
                        };
                        return '<div style="margin:6px 0;">' +
                            '<div style="padding:10px 12px;background:#f7f9fc;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onclick="WCP.toggleTemplateTaskDetail(' + i + ',' + ti + ')">' +
                            '<span style="font-weight:600;color:#333;">' + escapeHtml(t.name) + '</span>' +
                            '<span id="' + tid + '" style="color:#1677ff;font-size:12px;flex-shrink:0;margin-left:10px;">查看标准 ›</span></div>' +
                            '<div id="' + did + '" style="display:none;padding:10px 14px 6px;background:#fff;border:1px solid #eef2f7;border-top:none;border-radius:0 0 8px 8px;">' +
                            std('执行标准', t.execStd) + std('确认标准', t.confStd) + std('担责标准', t.liableStd) +
                            '</div></div>';
                    }).join('');
                    html += '<div style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#222;"><span style="background:#1677ff;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">' + (i + 1) + '</span>' + escapeHtml(s.name) + ' <span style="color:#fa8c16;font-size:12px;">' + escapeHtml(s.order || '') + '</span></div><div style="margin-top:6px;padding-left:28px;">' + tasks + '</div></div>';
                });
                html += '</div></div>';
            } else {
                var sec = buildTemplatePreviewSections(id);
                html += '<div class="preview-section"><div class="preview-section-title">违约责任</div><div class="preview-section-content">' + escapeHtml(sec.breach).replace(/\n/g, '<br>') + '</div></div>';
                html += '<div class="preview-section"><div class="preview-section-title">固定详细条款<span style="font-size:11px;color:#999;font-weight:400;margin-left:8px;">（不可修改）</span></div><div class="preview-section-content">' + escapeHtml(sec.fixed).replace(/\n/g, '<br>') + '</div></div>';
                html += '<div style="font-size:12px;color:#999;margin-top:8px;">甲乙方 / 合同金额 / 工期 等基础信息由合同主信息填写，不在固定条款内。</div>';
            }
            contentEl.innerHTML = html;
        }
        // 不隐藏选择弹窗：预览为选择弹窗的上层，关闭预览后选择弹窗自然透出（返回「更换模板」弹窗）
        var prev = $('wcTemplatePreview'); if (prev) prev.classList.add('show');
    }
    function applyTemplateFromPreview() {
        if (!state.previewTplKind) return;
        applyTemplate(state.previewTplKind, state.previewTplId);
        closeTemplatePreview();
    }
    function closeTemplatePreview() { var m = $('wcTemplatePreview'); if (m) m.classList.remove('show'); }

    // 阶段任务模板预览：点击任务项在预览浮窗内就地展开/收起 执行 / 确认 / 担责标准（手风琴，不新增浮窗层）
    function toggleTemplateTaskDetail(si, ti) {
        var detail = document.getElementById('tplTask_' + si + '_' + ti);
        var toggle = document.getElementById('tplTaskToggle_' + si + '_' + ti);
        if (!detail) return;
        var open = detail.style.display !== 'none';
        detail.style.display = open ? 'none' : 'block';
        if (toggle) toggle.textContent = open ? '查看标准 ›' : '收起 ‹';
    }

    // ---- 查看全文 / 预览合同 ----
    function showFullText() {
        var m = $('wcFullTextModal'); if (!m) return;
        $('wcFullTextTitle').textContent = '📄 合同正文（全文）';
        $('wcFullTextContent').innerHTML = (state.viewer === 'receiver') ? buildReceiverContractHTML() : buildContractBodyHTML();
        m.classList.add('show');
    }
    function closeFullText() { var m = $('wcFullTextModal'); if (m) m.classList.remove('show'); }
    function previewContract() {
        var m = $('wcFullTextModal'); if (!m) return;
        $('wcFullTextTitle').textContent = '👁️ 预览合同';
        $('wcFullTextContent').innerHTML = buildFullContractHTML();
        m.classList.add('show');
    }
    function buildContractBodyHTML() {
        // 合同正文（全文）：双方权责 / 质量验收 / 安全及文明施工 / 道德承诺 / 其他条款（序号已按全文顺序重排）
        return '<div class="contract-article"><div class="article-title">一、双方权责</div><div class="article-content">' +
            '<p class="clause-subtitle">1、甲方责任</p>' +
            '<p class="clause-item">A. 提供施工图纸，协调物业办理施工手续，提供作业面，配合乙方进场施工</p>' +
            '<p class="clause-item">B. 给乙方进行进场前的交底培训</p>' +
            '<p class="clause-item">C. 对乙方的施工内容进行验收</p>' +
            '<p class="clause-item">D. 依据合同款项申请支付乙方</p>' +
            '<p class="clause-subtitle">2、甲方权利</p>' +
            '<p class="clause-item">A. 有权审核乙方的相关证件</p>' +
            '<p class="clause-item">B. 对不合格的施工项目，有权要求整改或停工</p>' +
            '<p class="clause-item">C. 乙方施工质量不达标且拒不整改的，甲方有权扣除相应费用</p>' +
            '<p class="clause-item">D. 对不按合同约定履约的乙方，可随时提出更换</p>' +
            '<p class="clause-subtitle">3、乙方责任</p>' +
            '<p class="clause-item">A. 严格按合同、图纸及规范施工，确保工程质量</p>' +
            '<p class="clause-item">B. 配合甲方提出的合理的变更事项</p>' +
            '<p class="clause-item">C. 保修期内免费维修因施工质量导致的问题</p>' +
            '<p class="clause-subtitle">4、乙方权利</p>' +
            '<p class="clause-item">A. 依据合同约定要求甲方支付合同款项</p>' +
            '<p class="clause-item">B. 发生变更，有权追加合理的费用</p>' +
        '</div></div>' +
        '<div class="contract-article"><div class="article-title">二、质量验收</div><div class="article-content">' +
            '<p class="clause-item">1、甲方依据《施工工艺标准》进行验收</p>' +
            '<p class="clause-item">2、验收流程：班组自检-工长预检-业主正式验收-班组交接互检</p>' +
            '<p class="clause-item">3、验收不合格的，乙方需在2日内整改完毕，经过两次验收仍然不合格的，甲方有权扣除相应的合同金额并终止与乙方的合同。</p>' +
        '</div></div>' +
        '<div class="contract-article"><div class="article-title">三、安全及文明施工</div><div class="article-content">' +
            '<p class="clause-item">1、乙方必须购买意外保险（提供保单），施工中发生安全事故由乙方承担全部责任</p>' +
            '<p class="clause-item">2、施工期间若因乙方操作不当导致甲方或第三方财产损失，乙方负责赔偿</p>' +
            '<p class="clause-item">3、乙方需遵守现场《安全文明施工规定》</p>' +
        '</div></div>' +
        '<div class="contract-article"><div class="article-title">四、道德承诺</div><div class="article-content">' +
            '<p class="clause-item">1）工人承诺，在整个施工服务过程中不做任何违反道德的事情，如有违反自愿赔偿非法所得。</p>' +
            '<p class="clause-sub2">1. 搞恶意增项的，自罚30倍。</p>' +
            '<p class="clause-sub2">2. 恶意虚增费用和费用造假的，自罚30倍。</p>' +
            '<p class="clause-sub2">3. 商品以次充好和掺假调包的，自罚30倍。</p>' +
            '<p class="clause-sub2">4. 私下侵吞业主财物的，自罚30倍。</p>' +
            '<p class="clause-sub2">5. 知劣买劣、知假买假的，自罚30倍。</p>' +
            '<p class="clause-sub2">6. 私下收取好处费、返佣、回扣等，自罚30倍。</p>' +
            '<p class="clause-sub2">7. 耍手段胁迫甲方而获取不当利益的，自罚30倍。</p>' +
            '<p class="clause-sub2">8. 故意使坏妨碍安全、质量、工期造成损失的，自罚10倍。</p>' +
            '<p class="clause-sub2">9. 无条件接受社会舆论公开谴责。</p>' +
            '<p class="clause-item">2）取证与执行</p>' +
            '<p class="clause-sub2">1. 客户或甲方自行取证留存。</p>' +
            '<p class="clause-sub2">2. 直接按非法所得金额的倍数赔偿客户。</p>' +
            '<p class="clause-sub2">3. 如果拒绝赔偿，客户或甲方有权扣除乙方已有的项目资金，并提起诉讼。</p>' +
        '</div></div>' +
        '<div class="contract-article"><div class="article-title">五、其他条款</div><div class="article-content">' +
            '<p class="clause-item">1、如因不可抗力，甲乙双方可协商一致终止合同</p>' +
            '<p class="clause-item">2、因本合同引起的争议，双方应协商解决，协商不成的，提交项目所在地人民法院诉讼解决</p>' +
            '<p class="clause-item">3、本合同未尽事宜，可签订补充协议，补充协议与本合同具有同等效力</p>' +
            '<p class="clause-item">4、本合同一式两份，甲乙双方各执一份，自签字盖章之日起生效</p>' +
        '</div></div>';
    }
    // 受邀方视角「查看全部正文」完整合同正文：关键条款（甲方责权 / 乙方责权）前置，再附标准条款
    function buildReceiverContractHTML() {
        // 受邀方全文与发起方同源（同一份固定条款正文）
        return buildContractBodyHTML();
    }
    function buildFullContractHTML() {
        var c = state.contract;
        var body = buildContractBodyHTML();
        var extra = getExtra();
        var extraHtml = '<div class="contract-article"><div class="article-title">补充条款</div><div class="article-content">' +
            escapeHtml(extra).replace(/\n/g, '<br>') + '</div></div>';
        var stages = getStages();
        var stageHtml = stages.map(function (s) {
            var ts = (s.tasks || []).map(function (t) {
                return '<div style="margin-bottom:8px;"><p style="margin:0 0 4px;"><strong>' + escapeHtml(t.name.replace(/^\s*✅\s*/, '')) + '</strong>　<span style="font-weight:400;color:#86909C;">执行：' + escapeHtml(t.exec || '—') + '　确认：' + escapeHtml(t.conf || '—') + '</span></p>' +
                    '<p style="margin:0 0 2px;">执行标准：' + escapeHtml(t.execStd || '（未填写）') + '</p>' +
                    '<p style="margin:0 0 2px;">确认标准：' + escapeHtml(t.confStd || '（未填写）') + '</p>' +
                    '<p style="margin:0;">担责标准：' + escapeHtml(t.liableStd || '（未填写）') + '</p></div>';
            }).join('');
            return '<div class="contract-article"><div class="article-title">' + escapeHtml(s.name) + '（' + escapeHtml(s.order || '并行执行') + '）</div><div class="article-content">' + ts + '</div></div>';
        }).join('');
        var atts = getAttachments();
        var attHtml = atts.map(function (a) { return '<p>· ' + escapeHtml(a.name) + '（' + escapeHtml(a.meta || '') + '）</p>'; }).join('');
        var partyB = c.partyBName ? escapeHtml(c.partyBName) : '';
        var sign = '<div class="contract-article"><div class="article-title">签署信息</div><div class="article-content">' +
            '<p><strong>甲方（发包方）：</strong>' + escapeHtml(c.partyAName || '陈庄') + '</p>' +
            '<p><strong>乙方（承包方）：</strong>' + partyB + '</p></div></div>';
        return body + extraHtml + stageHtml + '<div class="contract-article"><div class="article-title">合同附件</div><div class="article-content">' + (attHtml || '<p>无</p>') + '</div></div>' + sign;
    }

    // ============== 原型导航：状态分组折叠 / 更多菜单 ==============
    function toggleStatusGroup(header) {
        var content = header.parentElement.querySelector('.status-group-content');
        var icon = header.querySelector('.status-group-icon');
        if (!content || !icon) return;
        var hidden = content.style.display === 'none';
        content.style.display = hidden ? 'block' : 'none';
        icon.textContent = hidden ? '▼' : '▶';
    }

    /* 右侧原型导航整块 收起 / 展开（不影响内部 status-group 各自展开态） */
    function togglePageNav() {
        var nav = document.querySelector('.page-nav');
        var btn = $('pageNavToggle');
        if (!nav) return;
        var collapsed = nav.classList.toggle('collapsed');
        if (btn) btn.classList.toggle('collapsed', collapsed);
    }

    function toggleMoreOps() {
        var p = $('moreOpsPanel');
        var b = $('moreOpsBtn');
        if (!p) return;
        p.classList.toggle('show');
        if (b) b.classList.toggle('open');
    }
    function closeMoreOps() {
        var p = $('moreOpsPanel');
        var b = $('moreOpsBtn');
        if (p) p.classList.remove('show');
        if (b) b.classList.remove('open');
    }

    // 更多菜单内容按状态动态生成：
    //   - 受邀方确认中（worker_inviting_receiver）：仅展示「导出合同文件」
    //   - 其余非终态状态：版本记录 / 变更记录 / 导出合同文件（对齐「合同详情（合规版）」）
    //   - 发起方（state.viewer === 'sender'）视角额外在菜单首位提供「复制发起」入口（快捷发起同类型新合同）
    // 受邀方终态（抢单失败 / 已拒绝）由 updateStatus 直接隐藏整行工具栏，无需渲染菜单
    function renderMoreOps(status) {
        var panel = $('moreOpsPanel');
        if (!panel) return;
        var items;
        if (status === 'worker_inviting_receiver') {
            items = [
                { icon: '📄', label: '导出合同文件', fn: 'WCP.exportContract()' }
            ];
        } else {
            items = [
                { icon: '📋', label: '版本记录', fn: 'WCP.showVersionModal()' },
                { icon: '📜', label: '变更记录', fn: 'WCP.showChangeRecordModal()' },
                { icon: '📄', label: '导出合同文件', fn: 'WCP.exportContract()' }
            ];
            // 发起方视角：新增「复制发起」入口（快捷发起同类型新合同），置于菜单首位
            if (state.viewer === 'sender') {
                items.unshift({ icon: '📑', label: '复制发起', fn: 'WCP.openCopyInitiate()', extra: '快捷发起同类型新合同' });
            }
        }
        panel.innerHTML = items.map(function (it) {
            return '<div class="op-item" onclick="' + it.fn + '; WCP.closeMoreOps();"><span class="op-icon">' + it.icon + '</span><span>' + escapeHtml(it.label) + '</span>' + (it.extra ? '<span class="op-extra">' + escapeHtml(it.extra) + '</span>' : '') + '</div>';
        }).join('');
    }

    // ============== 版本 / 变更 / 导出弹窗（对齐「合同详情（合规版）」更多菜单） ==============
    function getVersionData() {
        var c = state.contract || {};
        var partyB = c.partyBName ? escapeHtml(c.partyBName) : '乙方';
        var base = function (extra) {
            return {
                versions: [{ tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-15 签约生效', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'primary' },
                    { title: '提交邀请', desc: '进入确认中', time: '2024-01-06 14:30', type: 'success' }
                ].concat(extra || [])
            };
        };
        return {
            'worker_draft': (function () {
                // 重新选择乙方属于「历史版本」记录（非变更），合并合同 versionLog 展示
                var log = (c.versionLog || []).slice().reverse();
                var versions = log.map(function (e, i) {
                    return { tag: 'R' + (i + 1), name: e.name, desc: e.desc, date: e.date || '', current: false };
                });
                versions.push({ tag: 'V1', name: '初始版本（拟定中·撤回后）', desc: '合同已重新编辑', date: '2024-01-09 重新拟定', current: true });
                var timeline = [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交邀请', desc: '进入确认中', time: '2024-01-06 14:30', type: 'success' },
                    { title: '撤回确认', desc: '合同退回拟定中', time: '2024-01-08 09:15', type: 'warning' },
                    { title: '重新编辑合同', desc: '拟定中', time: '2024-01-09 10:00', type: 'primary' }
                ];
                log.forEach(function (e) {
                    timeline.push({ title: '重新选择乙方', desc: '原乙方合作未达成，退回拟定中重新选择', time: e.date || '', type: 'warning' });
                });
                return { versions: versions, timeline: timeline };
            })(),
            'worker_inviting_sender': base([]),
            'worker_inviting_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '已收到邀请，待确认', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' }
                ]
            },
            'worker_confirmed_receiver': base([
                { title: '我方确认合同', desc: '确认人：' + partyB, time: '2024-01-08 16:20', type: 'success' }
            ]),
            'worker_signed': base([
                { title: '乙方确认合同', desc: '确认人：' + partyB + '，合同即时生效（V1版本）', time: '2024-01-08 16:20', type: 'success' }
            ]),
            'worker_lost_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '抢单失败', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' },
                    { title: '其他人员抢先确认', desc: '本邀约已结束', time: '2024-01-08 16:20', type: 'error' }
                ]
            },
            'worker_rejected_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '已拒绝邀约', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' },
                    { title: '已拒绝邀约', desc: '本邀约已结束', time: '2024-01-07 11:00', type: 'error' }
                ]
            },
            'default': base([])
        };
    }

    function updateVersionContent() {
        var versionList = $('versionList');
        var statusFlowTimeline = $('statusFlowTimeline');
        var versionData = getVersionData();
        var data = versionData[state.status] || versionData['default'];
        if (versionList) {
            versionList.innerHTML = data.versions.map(function (v) {
                return '<div class="version-item">' +
                    '<div class="version-tag ' + (v.current ? 'current' : '') + '">' + v.tag + '</div>' +
                    '<div class="version-info">' +
                    '<div class="version-name">' + escapeHtml(v.name) + '</div>' +
                    '<div class="version-desc">' + escapeHtml(v.desc) + '</div>' +
                    '<div class="version-date">' + escapeHtml(v.date) + '</div>' +
                    '</div>' +
                    '<div class="view-btn">查看</div>' +
                    '</div>';
            }).join('');
        }
        if (statusFlowTimeline) {
            statusFlowTimeline.innerHTML = data.timeline.map(function (t) {
                return '<div class="timeline-item">' +
                    '<div class="timeline-dot ' + (t.type || 'success') + '"></div>' +
                    '<div class="timeline-content">' +
                    '<div class="timeline-title">' + escapeHtml(t.title) + '</div>' +
                    '<div class="timeline-desc">' + escapeHtml(t.desc) + '</div>' +
                    '<div class="timeline-time">' + escapeHtml(t.time) + '</div>' +
                    '</div>' +
                    '</div>';
            }).join('');
        }
    }

    function showVersionModal() {
        updateVersionContent();
        var m = $('versionModal');
        if (m) m.classList.add('show');
    }
    function closeVersionModal() {
        var m = $('versionModal');
        if (m) m.classList.remove('show');
    }

    function showChangeRecordModal() {
        // 动态渲染本次操作留痕（从合同 changeLog 读取，反映重新选择乙方等实际操作）
        var logWrap = $('changeRecordLog');
        var logList = $('changeRecordLogList');
        if (logWrap && logList) {
            var log = (state.contract && state.contract.changeLog) || [];
            if (log.length) {
                logWrap.style.display = 'block';
                logList.innerHTML = log.slice().reverse().map(function (e) {
                    var dotCls = e.type === 'reselect' ? 'warning' : 'primary';
                    return '<div class="cr-log-item">' +
                        '<span class="cr-dot ' + dotCls + '"></span>' +
                        '<div class="cr-log-main">' +
                            '<div class="cr-log-title">' + escapeHtml(e.title) + '</div>' +
                            '<div class="cr-log-desc">' + escapeHtml(e.desc) + '</div>' +
                            '<div class="cr-log-meta">操作人：' + escapeHtml(e.by || '陈庄') +
                                (e.byRole ? '（' + escapeHtml(e.byRole) + '）' : '') + ' · ' + escapeHtml(e.time || '') + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } else {
                logWrap.style.display = 'none';
            }
        }
        var m = $('changeRecordModal');
        if (m) m.classList.add('show');
    }
    function closeChangeRecordModal() {
        var m = $('changeRecordModal');
        if (m) m.classList.remove('show');
    }
    function viewChangeVersion(version) {
        closeChangeRecordModal();
        var names = { v0: '初始版本', v1: '第一次变更', v2: '第二次变更' };
        showToast('正在加载' + (names[version] || '该') + '合同详情...\n\n将展示该版本下的合同基本信息、合同正文、阶段任务、附件等内容');
    }

    function exportContract() {
        showExportModal();
    }
    function showExportModal() {
        var m = $('exportModal');
        if (m) m.classList.add('show');
    }
    function closeExportModal() {
        var m = $('exportModal');
        if (m) m.classList.remove('show');
    }
    function exportToPDF() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(function () {
            showToast('PDF文件已保存到手机本地\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 1500);
    }
    function shareToWechat() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(function () {
            showToast('PDF文件已生成，正在打开微信分享...\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 1500);
    }

    // ============== 任务详情/编辑弹窗 ==============
    // 任务名称 → 三标准映射（参考合同详情·合规版 TASK_STANDARD_MAP）
    var TASK_STANDARD_MAP = {
        '材料采购': { exec: '按设计图纸与合同清单采购符合国家标准的电线、线管等材料，并随货提供合格证与检测报告。', confirm: '材料品牌、规格、数量与合同约定一致，质量证明文件齐全方可签收。', liable: '因材料质量或规格不符导致返工、工期延误的，由采购执行方承担相应费用与责任。' },
        '材料报验': { exec: '整理材料质量证明文件，向监理/业主报验并提交样品。', confirm: '报验资料齐全，样品经确认人认可后准予使用。', liable: '未经报验擅自使用的，由执行方承担整改与返工责任。' },
        '开槽布管': { exec: '按深化图纸弹线定位，使用机械规范开槽并敷设线管，管卡固定牢固、弯曲半径合规，强弱电分管分盒。', confirm: '开槽位置、深度及线管规格、走向、间距符合图纸与规范要求。', liable: '因违规开槽或管线敷设不到位导致结构损伤、后期无法穿线或维修困难的，由施工执行方整改担责。' },
        '穿线接线': { exec: '按回路穿线，线色区分正确，预留足够接线长度，管内无接头；开关插座处接线牢固。', confirm: '导线规格、根数、绝缘电阻测试合格，接线符合安全规范。', liable: '因穿线或接线错误导致短路、跳闸的，由施工执行方承担责任。' },
        '通水通电测试': { exec: '完成水管打压测试与电气绝缘、通断测试，记录测试数据，确保无渗漏、无漏电。', confirm: '水管保压合格、电气绝缘电阻与接地测试达标，测试报告完整。', liable: '未测试或测试造假导致用水用电事故的，由执行与确认方共同担责。' },
        '阶段确认': { exec: '完成本阶段全部任务并自检合格，提交阶段成果与记录。', confirm: '相关确认人按节点对阶段成果进行核验并签字确认。', liable: '阶段内任务未达标即申请确认的，由执行方承担整改责任。' },
        '开关插座安装': { exec: '按图纸标高与间距安装，接线牢固、面板端正、接地可靠。', confirm: '安装位置、数量、接线符合设计与安全规范。', liable: '安装松动、接错线导致故障的，由施工执行方担责。' },
        '防护交底': { exec: '对施工区域进行成品防护，向班组进行安全与技术交底并签字记录。', confirm: '防护措施到位，交底记录齐全且签字确认。', liable: '因防护不到位或交底缺失造成成品损坏、安全事故的，由执行方承担责任。' },
        '墙体拆除': { exec: '按确认的拆除范围弹线定位，由上至下规范拆除，不得破坏承重结构与防水层。', confirm: '拆除范围、标高符合确认要求，承重结构完好。', liable: '超范围拆除或破坏承重结构的，由执行方承担修复与赔偿费用。' },
        '建筑垃圾清运': { exec: '将拆除垃圾分类装袋，合规清运至指定消纳场所，保持通道畅通。', confirm: '现场无遗留垃圾，清运记录完整。', liable: '因清运不及时或乱倒垃圾造成处罚的，由执行方承担责任。' },
        '现场平整': { exec: '对拆除后的墙面、地面进行清理平整，达到后续施工条件。', confirm: '基层平整度符合后续工序施工要求。', liable: '平整不到位影响后续工序质量的，由执行方整改担责。' },
        '现场测量': { exec: '按设计图纸到现场进行尺寸复核，记录实际尺寸并标注关键节点。', confirm: '测量数据准确，与图纸偏差在允许范围内。', liable: '测量误差导致材料浪费或安装不当的，由执行方承担责任。' },
        '深化图纸': { exec: '根据现场实测数据深化施工图纸，明确节点做法与材料用量。', confirm: '深化图纸经确认人审核签字后方可施工。', liable: '图纸深化错误导致返工的，由执行方承担相应费用。' },
        '基层制作': { exec: '按图纸制作木作基层骨架，龙骨间距合规，连接牢固、防潮处理到位。', confirm: '基层平整度、牢固度与防潮处理符合规范。', liable: '基层制作不达标导致面层变形或开裂的，由执行方返工担责。' },
        '柜体安装': { exec: '按深化图纸组装柜体，水平垂直调整到位，连接牢固、缝隙均匀。', confirm: '柜体安装位置、垂直度、缝隙符合验收标准。', liable: '安装不牢或偏差超标导致使用异常的，由执行方调整担责。' },
        '五金安装': { exec: '按设计要求安装五金配件，位置准确、开合灵活、固定牢固。', confirm: '五金品牌、数量、功能符合设计要求，开合测试合格。', liable: '五金安装不到位导致损坏或使用不便的，由执行方更换担责。' },
        '地面找平': { exec: '按标高线进行地面水泥砂浆找平，坡度符合排水要求，无空鼓开裂。', confirm: '找平层平整度、坡度符合规范，无空鼓开裂。', liable: '找平层空鼓、开裂影响后续铺设的，由执行方返工担责。' },
        '防水施工': { exec: '对厨卫等区域涂刷防水涂料，厚度均匀、边角圆弧处理，完成后做闭水试验。', confirm: '防水层厚度达标，闭水试验24小时无渗漏。', liable: '防水施工不到位导致渗漏的，由执行方承担返工与赔偿费用。' },
        '墙砖铺贴': { exec: '按排砖图铺贴墙砖，缝隙均匀、平整度合规，阴阳角方正。', confirm: '铺贴平整、缝隙均匀、无空鼓，阴阳角符合规范。', liable: '铺贴空鼓、脱落或不平整超标的，由执行方返工担责。' },
        '地砖铺贴': { exec: '按排砖图铺贴地砖，坡度朝向地漏，平整度与缝差符合规范。', confirm: '地砖铺贴平整、缝差合规、无空鼓，排水通畅。', liable: '铺贴空鼓、坡度倒泛水导致积水的，由执行方返工担责。' },
        '美缝清理': { exec: '清理砖缝后均匀填入美缝剂，表面平整、无气泡与余料。', confirm: '美缝饱满、色泽均匀、无脱落。', liable: '美缝施工不到位导致发黑脱落的，由执行方返工担责。' },
        '墙面铲除': { exec: '铲除原墙面腻子与涂料至基层，清理灰尘保证附着力。', confirm: '基层清理干净，无残留腻子与涂料。', liable: '铲除不彻底导致后续腻子起皮的，由执行方返工担责。' },
        '批刮腻子': { exec: '按规范批刮腻子两至三遍，每遍干透后打磨，阴阳角顺直。', confirm: '腻层平整、无裂纹、阴阳角顺直，打磨后无明显划痕。', liable: '腻子层开裂、脱落影响面漆效果的，由执行方返工担责。' },
        '打磨': { exec: '使用砂纸或打磨机对腻子层进行均匀打磨，确保平整无划痕。', confirm: '打磨后平整度符合面漆施工要求，无明显划痕。', liable: '打磨不平或划痕过深影响面漆效果的，由执行方整改担责。' },
        '底漆': { exec: '按规范滚涂底漆一遍，涂刷均匀无漏底，待干透后进行面漆施工。', confirm: '底漆涂刷均匀、无漏底、无流坠。', liable: '底漆漏涂导致面漆色差或泛碱的，由执行方返工担责。' },
        '面漆涂刷': { exec: '按设计颜色滚涂面漆两遍，涂刷均匀、无流坠、无色差。', confirm: '面漆色泽均匀、无流坠、无色差，符合验收标准。', liable: '面漆色差、流坠或起皮影响观感的，由执行方返工担责。' },
        '清理保护': { exec: '施工完成后清理现场，对成品进行保护，避免后续工序污染。', confirm: '现场清理干净，成品保护到位。', liable: '保护不到位造成成品损坏的，由执行方承担责任。' },
        '工具进场': { exec: '按施工计划将工具与辅材运抵现场，清点登记并妥善放置。', confirm: '工具辅材清单齐全，放置规范。', liable: '工具遗漏或放置不当影响施工进度的，由执行方承担责任。' },
        '安全防护': { exec: '对施工区域进行安全围护，配备消防器材，做好高空与用电防护。', confirm: '安全防护措施到位，符合现场管理要求。', liable: '安全防护不到位造成事故的，由执行方承担责任。' },
        '零星安装': { exec: '按业主需求完成零星安装件，尺寸合适、固定牢固。', confirm: '安装位置、牢固度符合使用要求。', liable: '安装不牢或尺寸错误导致返工的，由执行方担责。' },
        '修补作业': { exec: '对前期施工遗留的瑕疵进行修补，恢复至交付标准。', confirm: '修补部位与原面层无明显色差、平整一致。', liable: '修补不到位影响整体观感的，由执行方重新修补担责。' }
    };
    var GENERIC_STD = {
        exec: '按合同约定及国家/行业相关施工规范执行，过程中做好自检与记录。',
        confirm: '由相关确认人按合同约定的标准进行核验并签字确认。',
        liable: '因执行或确认不到位造成质量、安全、工期问题的，由责任方承担相应责任。'
    };
    // 已签约状态：点击任务跳转任务详情页（对应任务状态：已履约完成→已完成，否则→待开始）
    /**
     * 已签约状态：点击任务跳转「任务详情（水电）」页，并携带当前任务上下文。
     * 仅追加 URL 参数（任务名称 / 隶属合同 / 隶属阶段 / 执行·确认·担责三项标准），
     * 不改动其它状态的跳转与任何既有操作、交互流程；任务详情页无参数时保持原有示例数据。
     * @param {HTMLElement} el - 被点击的任务项元素
     */
    function goTaskDetail(el) {
        var taskStatus = state.fulfilled ? 'completed' : 'pending';
        var item = (el && el.closest) ? (el.closest('.task-item') || el) : null;
        var name = item ? (item.getAttribute('data-task-name') || '') : '';

        // 三标准：与只读弹窗同口径（data 属性 → 任务名映射 → 通用兜底），保证均有值
        var stdMap = TASK_STANDARD_MAP[name] || {};
        var execStd = (item && item.getAttribute('data-exec-standard')) || stdMap.exec || GENERIC_STD.exec;
        var confStd = (item && item.getAttribute('data-confirm-standard')) || stdMap.confirm || GENERIC_STD.confirm;
        var liableStd = (item && item.getAttribute('data-liable-standard')) || stdMap.liable || GENERIC_STD.liable;

        // 隶属阶段：任务所属阶段的阶段名称
        var stageName = '';
        var stageItem = (item && item.closest) ? item.closest('.stage-item') : null;
        if (stageItem) {
            var stageNameEl = stageItem.querySelector('.stage-name');
            if (stageNameEl) stageName = stageNameEl.textContent.trim();
        }

        // 隶属合同：当前合同名称
        var contractName = (state.contract && state.contract.name) || '';

        var params = new URLSearchParams();
        params.set('status', taskStatus);
        params.set('from', 'contract');
        params.set('taskName', name);
        params.set('contractName', contractName);
        params.set('stageName', stageName);
        params.set('execStandard', execStd);
        params.set('confirmStandard', confStd);
        params.set('liableStandard', liableStd);

        window.location.href = 'task-detail-shuidian.html?' + params.toString();
    }
    // 只读任务详情弹窗（参考合同详情·合规版 viewTaskDetail）
    function viewTaskDetail(el) {
        var item = el.closest('.task-item') || el;
        var name = item.getAttribute('data-task-name') || '—';
        var executor = item.getAttribute('data-executor') || '暂未设置';
        var confirmers = item.getAttribute('data-confirmers') || '暂未设置';

        // 三标准：优先取 data 属性 → 任务名映射 → 通用兜底（保证均有值）
        var stdMap = TASK_STANDARD_MAP[name] || {};
        var execStd = item.getAttribute('data-exec-standard') || stdMap.exec || GENERIC_STD.exec;
        var confStd = item.getAttribute('data-confirm-standard') || stdMap.confirm || GENERIC_STD.confirm;
        var liableStd = item.getAttribute('data-liable-standard') || stdMap.liable || GENERIC_STD.liable;

        var m = $('taskDetailModal');
        if (!m) return;
        $('detailTaskName').textContent = name;
        $('detailExecutor').textContent = executor;
        $('detailConfirmers').textContent = confirmers;
        $('detailExecStandard').innerHTML = escapeHtml(execStd).replace(/\n/g, '<br/>');
        $('detailConfirmStandard').innerHTML = escapeHtml(confStd).replace(/\n/g, '<br/>');
        $('detailLiableStandard').innerHTML = escapeHtml(liableStd).replace(/\n/g, '<br/>');
        // 工艺参考示例：只读展示（数据取自 .task-item 的 data 属性）
        CraftRef.renderDisplay('detailExecCraftRef', item.getAttribute('data-exec-refs'));
        CraftRef.renderDisplay('detailConfirmCraftRef', item.getAttribute('data-confirm-refs'));
        m.classList.add('show');
    }
    function closeTaskDetailModal() {
        var m = $('taskDetailModal');
        if (m) m.classList.remove('show');
    }

    // 编辑任务弹窗（参考合同详情·合规版 editTaskDetail）
    var ROLE_MAP = {
        '陈庄': '工长', '张水电': '水电工', '钱拆除': '拆除工',
        '李木作': '木作工', '周泥瓦': '泥瓦工', '吴油漆': '油漆工', '郑零工': '小零工'
    };
    // 合同乙方名单（用于编辑/添加任务时执行人默认值推导）：已确认/已签约取 partyBName（唯一），
    // 拟定/邀请中取意向乙方名单（1~3 人）。拟定中（撤回后）invitations 已清空（空数组不作为有效来源），
    // 此时回退到邀请编辑面板已选名单 state.editInvited，保证撤回后添加/编辑任务仍能按规则预填。
    function getPartyBList() {
        var c = state.contract;
        if (!c) return [];
        if (c.partyBName) return [c.partyBName];
        // 拟定中（撤回后）：意向乙方以邀请编辑面板的实时选择为准——
        // 用户可能已增删候选（尚未重新提交邀约），c.invitations 中的旧记录（含 replaced/pending）
        // 不能作为默认值依据，否则面板调整为 1 人后仍按「多人」规则默认空，预填失效。
        if (state.status === 'worker_draft' && state.editInvited && state.editInvited.length) {
            return state.editInvited.map(function (i) { return i.name; });
        }
        var invs = (c.invitations && c.invitations.length) ? c.invitations : (state.editInvited || []);
        return invs.map(function (i) { return i.name; });
    }
    // 乙方确认接单→已签约时，将「无执行人」的任务执行人统一更新为乙方人员（PRD 规则）。
    function assignDefaultExecutorsOnSigned() {
        var c = state.contract;
        if (!c || !c.partyBName) return;
        var stages = getStages();
        if (!stages || !stages.length) return;
        var changed = false;
        stages.forEach(function (s) {
            (s.tasks || []).forEach(function (t) {
                if (!t.exec) { t.exec = c.partyBName; changed = true; }
            });
        });
        if (changed && typeof renderDraftStageTask === 'function') renderDraftStageTask();
    }
    function editTaskDetail(el, stageIdx, taskIdx) {
        var stages = getStages();
        var s = stages[stageIdx];
        var t = s && s.tasks ? s.tasks[taskIdx] : null;
        if (!t) return;

        state.currentEditTask = { stageIdx: stageIdx, taskIdx: taskIdx };

        var name = t.name || '';
        var executor = t.exec || '';
        // 执行人默认值：合同乙方仅一人时，无执行人的任务默认填乙方人员；多乙方则为空（非必选）
        if (!executor) {
            var pbList = getPartyBList();
            if (pbList.length === 1) executor = pbList[0];
        }
        var confirmerStr = t.conf || '';
        var confirmerArr = confirmerStr ? confirmerStr.split(/[、,，]/).map(function(s){return s.trim();}).filter(Boolean) : [];
        var execStd = t.execStd || '';
        var confStd = t.confStd || '';
        var liableStd = t.liableStd || '';

        $('editTaskName').value = name;

        // 执行人：填充标签 + 隐藏值
        var execTags = $('editTaskExecutorTags');
        if (executor && ROLE_MAP[executor]) {
            execTags.innerHTML = '<div class="confirm-person-tag">' + executor + '（' + ROLE_MAP[executor] + '）' +
                '<span class="remove" onclick="WCP.removeExecutor(\'edit\')">×</span></div>';
        } else if (executor) {
            execTags.innerHTML = '<div class="confirm-person-tag">' + executor +
                '<span class="remove" onclick="WCP.removeExecutor(\'edit\')">×</span></div>';
        } else {
            execTags.innerHTML = '';
        }
        $('editTaskExecutor').value = executor;
        $('editTaskExecutorSearch').value = '';
        $('editTaskExecutorDropdown').classList.remove('show');

        // 确认人：填充标签列表
        state.editTaskConfirmPersonList = confirmerArr;
        updateEditConfirmPersonTags();
        $('editTaskConfirmerSearch').value = '';
        $('editTaskConfirmerDropdown').classList.remove('show');

        // 三项标准
        $('editTaskExecStandard').value = execStd;
        $('editTaskConfirmStandard').value = confStd;
        $('editTaskLiableStandard').value = liableStd;

        // 工艺参考示例：读取任务既有数据并渲染配置列表（共享模块 CraftRef）
        CraftRef.setRefs('edit', 'exec', t.execRefs);
        CraftRef.setRefs('edit', 'confirm', t.confirmRefs);

        $('editTaskModal').classList.add('show');
    }
    function closeEditTaskModal() {
        var m = $('editTaskModal');
        if (m) m.classList.remove('show');
        $('editTaskExecutorTags').innerHTML = '';
        $('editTaskExecutorDropdown').classList.remove('show');
        $('editTaskConfirmerDropdown').classList.remove('show');
        state.editTaskConfirmPersonList = [];
        CraftRef.setRefs('edit', 'exec', []);
        CraftRef.setRefs('edit', 'confirm', []);
        state.currentEditTask = null;
    }
    function confirmEditTask() {
        if (!state.currentEditTask) { closeEditTaskModal(); return; }
        var si = state.currentEditTask.stageIdx;
        var ti = state.currentEditTask.taskIdx;
        var stages = getStages();
        var t = stages[si] && stages[si].tasks ? stages[si].tasks[ti] : null;
        if (!t) { closeEditTaskModal(); return; }

        var name = $('editTaskName').value.trim();
        if (!name) { showToast('请输入任务名称'); return; }

        var execStd = $('editTaskExecStandard').value.trim();
        var confStd = $('editTaskConfirmStandard').value.trim();
        var liableStd = $('editTaskLiableStandard').value.trim();
        if (!execStd) { showToast('请输入执行标准'); return; }
        if (!confStd) { showToast('请输入确认标准'); return; }
        if (!liableStd) { showToast('请输入担责标准'); return; }

        var executor = $('editTaskExecutor').value.trim();
        var confirmers = state.editTaskConfirmPersonList || [];

        t.name = name;
        t.exec = executor;
        t.conf = confirmers.join('、');
        t.execStd = execStd;
        t.confStd = confStd;
        t.liableStd = liableStd;
        t.execRefs = CraftRef.getRefs('edit', 'exec');
        t.confirmRefs = CraftRef.getRefs('edit', 'confirm');

        closeEditTaskModal();
        renderDraftStageTask();
        showToast('任务详情已保存');
    }

    // 新建任务弹窗（交互对齐「合同详情·合规版」addTaskModal：先填全字段 → 确认后写入阶段）
    function openAddTaskModal(si) {
        if (typeof si !== 'number') si = state.currentAddStageIndex || 0;
        state.currentAddStageIndex = si;
        state.newTaskConfirmPersonList = [];
        CraftRef.setRefs('new', 'exec', []);
        CraftRef.setRefs('new', 'confirm', []);
        var name = $('newTaskName'); if (name) name.value = '';
        var exec = $('newTaskExecutor');
        var execTags = $('newTaskExecutorTags');
        // 执行人默认值：与编辑任务规则一致——乙方仅一人时默认填乙方人员；多人则默认空（均可修改）
        var defaultExec = '';
        var pbList = getPartyBList();
        if (pbList.length === 1) defaultExec = pbList[0];
        if (exec) exec.value = defaultExec;
        if (execTags) {
            if (defaultExec && ROLE_MAP[defaultExec]) {
                execTags.innerHTML = '<div class="confirm-person-tag">' + defaultExec + '（' + ROLE_MAP[defaultExec] + '）' +
                    '<span class="remove" onclick="WCP.removeExecutor(\'new\')">×</span></div>';
            } else if (defaultExec) {
                execTags.innerHTML = '<div class="confirm-person-tag">' + defaultExec +
                    '<span class="remove" onclick="WCP.removeExecutor(\'new\')">×</span></div>';
            } else {
                execTags.innerHTML = '';
            }
        }
        var execSearch = $('newTaskExecutorSearch'); if (execSearch) execSearch.value = '';
        var confTags = $('newTaskConfirmPersons'); if (confTags) confTags.innerHTML = '';
        var confSearch = $('newTaskConfirmerSearch'); if (confSearch) confSearch.value = '';
        var es = $('newTaskExecStandard'); if (es) es.value = '';
        var cs = $('newTaskConfirmStandard'); if (cs) cs.value = '';
        var ls = $('newTaskLiableStandard'); if (ls) ls.value = '';
        var m = $('addTaskModal');
        if (m) m.classList.add('show');
    }
    function closeAddTaskModal() {
        var m = $('addTaskModal');
        if (m) m.classList.remove('show');
        var execTags = $('newTaskExecutorTags'); if (execTags) execTags.innerHTML = '';
        var confTags = $('newTaskConfirmPersons'); if (confTags) confTags.innerHTML = '';
        state.currentAddStageIndex = null;
        state.newTaskConfirmPersonList = [];
        CraftRef.setRefs('new', 'exec', []);
        CraftRef.setRefs('new', 'confirm', []);
    }
    function confirmAddTask() {
        var si = state.currentAddStageIndex;
        if (typeof si !== 'number') { closeAddTaskModal(); return; }
        var stages = getStages();
        var s = stages[si];
        if (!s) { closeAddTaskModal(); return; }
        var name = $('newTaskName').value.trim();
        if (!name) { showToast('请输入任务名称'); return; }
        var execStd = $('newTaskExecStandard').value.trim();
        var confStd = $('newTaskConfirmStandard').value.trim();
        var liableStd = $('newTaskLiableStandard').value.trim();
        if (!execStd) { showToast('请输入执行标准'); return; }
        if (!confStd) { showToast('请输入确认标准'); return; }
        if (!liableStd) { showToast('请输入担责标准'); return; }
        var executor = $('newTaskExecutor').value.trim();
        var confirmers = state.newTaskConfirmPersonList || [];
        s.tasks = s.tasks || [];
        s.tasks.push({ name: name, exec: executor, conf: confirmers.join('、'), execStd: execStd, confStd: confStd, liableStd: liableStd, execRefs: CraftRef.getRefs('new', 'exec'), confirmRefs: CraftRef.getRefs('new', 'confirm') });
        closeAddTaskModal();
        renderDraftStageTask();
        showToast('任务已添加');
    }

    // 执行人搜索下拉（参考合规版交互）
    function toggleExecutorSearch(prefix) {
        var dd = $(prefix + 'TaskExecutorDropdown');
        if (!dd) return;
        dd.classList.toggle('show');
    }
    function filterExecutorList(prefix) {
        var kw = ($(prefix + 'TaskExecutorSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskExecutorDropdown');
        if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function(opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = name.indexOf(kw) >= 0 ? '' : 'none';
        });
        dd.classList.add('show');
    }
    function selectExecutor(prefix, name, role) {
        var tags = $(prefix + 'TaskExecutorTags');
        tags.innerHTML = '<div class="confirm-person-tag">' + name + '（' + role + '）' +
            '<span class="remove" onclick="WCP.removeExecutor(\'' + prefix + '\')">×</span></div>';
        $(prefix + 'TaskExecutor').value = name;
        $(prefix + 'TaskExecutorSearch').value = '';
        $(prefix + 'TaskExecutorDropdown').classList.remove('show');
    }
    function removeExecutor(prefix) {
        $(prefix + 'TaskExecutorTags').innerHTML = '';
        $(prefix + 'TaskExecutor').value = '';
    }

    // 确认人搜索下拉（多选）
    function toggleConfirmerSearch(prefix) {
        var dd = $(prefix + 'TaskConfirmerDropdown');
        if (!dd) return;
        dd.classList.toggle('show');
    }
    function filterConfirmerList(prefix) {
        var kw = ($(prefix + 'TaskConfirmerSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskConfirmerDropdown');
        if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function(opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = name.indexOf(kw) >= 0 ? '' : 'none';
        });
        dd.classList.add('show');
    }
    // 确认人可选范围=项目内全部人员（与执行人同源 WORKER_CANDIDATES），覆盖静态 7 人选项
    function fillConfirmerDropdown() {
        ['edit', 'new'].forEach(function (prefix) {
            var dd = $(prefix + 'TaskConfirmerDropdown');
            if (!dd) return;
            dd.innerHTML = WORKER_CANDIDATES.map(function (m) {
                return '<div class="person-option" onclick="WCP.selectConfirmer(\'' + prefix + '\', \'' + m.name + '\', \'' + m.role + '\')"><div class="avatar">' + m.name.charAt(0) + '</div><div class="name">' + m.name + '</div><div class="role-tag">' + m.role + '</div></div>';
            }).join('');
        });
    }
    function selectConfirmer(prefix, name, role) {
        var key = prefix + 'TaskConfirmPersonList';
        if (!state[key]) state[key] = [];
        if (state[key].length >= 5) { showToast('确认人最多5人'); return; }
        if (state[key].indexOf(name) >= 0) { showToast('已添加'); return; }
        state[key].push(name);
        updateConfirmPersonTags(prefix);
        $(prefix + 'TaskConfirmerSearch').value = '';
        $(prefix + 'TaskConfirmerDropdown').classList.remove('show');
    }
    function removeConfirmer(prefix, index) {
        var key = prefix + 'TaskConfirmPersonList';
        if (!state[key]) return;
        state[key].splice(index, 1);
        updateConfirmPersonTags(prefix);
    }
    function updateConfirmPersonTags(prefix) {
        var tags = $(prefix + 'TaskConfirmPersons');
        if (!tags) return;
        var list = state[prefix + 'TaskConfirmPersonList'] || [];
        if (list.length === 0) {
            tags.innerHTML = '';
            return;
        }
        tags.innerHTML = list.map(function(name, i) {
            var role = ROLE_MAP[name] || '施工方';
            return '<div class="confirm-person-tag">' + name + '（' + role + '）' +
                '<span class="remove" onclick="WCP.removeConfirmer(\'' + prefix + '\',' + i + ')">×</span></div>';
        }).join('');
    }
    function updateEditConfirmPersonTags() {
        updateConfirmPersonTags('edit');
    }

    // 全局暴露（供 HTML onclick 调用）
    global.WCP = {
        init: init,
        updateStatus: updateStatus,
        demoFulfilled: demoFulfilled,
        toggleStatusGroup: toggleStatusGroup,
        togglePageNav: togglePageNav,
        toggleEditPanel: toggleEditPanel,
        filterEdit: filterEdit,
        saveAndResubmit: saveAndResubmit,
        showToast: showToast,
        closeConfirm: closeConfirm,
        runConfirm: runConfirm,
        switchSection: switchSection,
        toggleStage: toggleStage,
        createDemo: createDemo,
        resetDemo: resetDemo,
        toggleMoreOps: toggleMoreOps,
        closeMoreOps: closeMoreOps,
        // 复制发起：跳转独立复制发起页（contract-copy-initiate.html），带入来源标识与合同 id 便于后续预填
        openCopyInitiate: function () {
            var params = 'from=detail';
            if (state.workerId) params += '&source=' + encodeURIComponent(state.workerId);
            global.location.href = 'contract-copy-initiate.html?' + params;
        },
        showVersionModal: showVersionModal,
        closeVersionModal: closeVersionModal,
        showChangeRecordModal: showChangeRecordModal,
        closeChangeRecordModal: closeChangeRecordModal,
        viewChangeVersion: viewChangeVersion,
        exportContract: exportContract,
        showExportModal: showExportModal,
        closeExportModal: closeExportModal,
        exportToPDF: exportToPDF,
        shareToWechat: shareToWechat,
        callPartyA: callPartyA,
        openRejectReason: openRejectReason,
        closeRejectReason: closeRejectReason,
        submitRejectReason: submitRejectReason,
        openReselectConfirm: openReselectConfirm,
        closeReselectConfirm: closeReselectConfirm,
        confirmReselect: confirmReselect,
        cancelReselect: cancelReselect,
        confirmStartChange: confirmStartChange,
        goChangePage: goChangePage,
        openBusinessCard: openBusinessCard,
        closeBusinessCard: closeBusinessCard,
        switchDraftContentTab: switchDraftContentTab,
        switchChangeContentTab: switchChangeContentTab,
        toggleReceiverStageWrap: toggleReceiverStageWrap,
        updateDraftExtra: updateDraftExtra,
        updateDraftTaskName: updateDraftTaskName,
        updateDraftStageName: updateDraftStageName,
        toggleDraftStageSeq: toggleDraftStageSeq,
        addDraftTask: addDraftTask,
        openAddTaskModal: openAddTaskModal,
        closeAddTaskModal: closeAddTaskModal,
        confirmAddTask: confirmAddTask,
        deleteDraftTask: deleteDraftTask,
        addDraftStage: addDraftStage,
        deleteDraftStage: deleteDraftStage,
        addDraftAttachment: addDraftAttachment,
        onDraftAttPicked: onDraftAttPicked,
        removeDraftAttachment: removeDraftAttachment,
        showDraftTemplatePicker: showDraftTemplatePicker,
        applyTemplate: applyTemplate,
        closeTemplatePicker: closeTemplatePicker,
        previewDraftTemplate: previewDraftTemplate,
        applyTemplateFromPreview: applyTemplateFromPreview,
        closeTemplatePreview: closeTemplatePreview,
        toggleTemplateTaskDetail: toggleTemplateTaskDetail,
        togglePartyAPanel: togglePartyAPanel,
        filterPartyA: filterPartyA,
        selectPartyA: selectPartyA,
        renderPartyAChips: renderPartyAChips,
        showFullText: showFullText,
        closeFullText: closeFullText,
        previewContract: previewContract,
        goTaskDetail: goTaskDetail,
        viewTaskDetail: viewTaskDetail,
        closeTaskDetailModal: closeTaskDetailModal,
        editTaskDetail: editTaskDetail,
        closeEditTaskModal: closeEditTaskModal,
        confirmEditTask: confirmEditTask,
        toggleExecutorSearch: toggleExecutorSearch,
        filterExecutorList: filterExecutorList,
        selectExecutor: selectExecutor,
        removeExecutor: removeExecutor,
        toggleConfirmerSearch: toggleConfirmerSearch,
        filterConfirmerList: filterConfirmerList,
        selectConfirmer: selectConfirmer,
        removeConfirmer: removeConfirmer,
        updateEditConfirmPersonTags: updateEditConfirmPersonTags
        // 工艺参考示例能力由共享模块 js/craft-ref.js（window.CraftRef）提供，HTML onclick 直连 CraftRef.*
    };

    // 工艺参考示例：复用本页 toast（不注入时模块用自身兜底 toast）
    if (global.CraftRef) { global.CraftRef.setToastHandler(function (msg) { showToast(msg); }); }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
