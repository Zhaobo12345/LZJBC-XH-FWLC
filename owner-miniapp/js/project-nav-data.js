/**
 * 项目导航数据模拟
 * 用于展示施工路线（阶段-任务树）
 */

const projectNavData = {
    projectId: 'proj-001',
    projectName: 'XX小区整体装修',
    totalStages: 5,
    totalTasks: 18,
    stages: [
        {
            id: 'stage-1',
            name: '准备与拆改交底阶段',
            status: 'completed',
            collapsed: false,
            tasks: [
                { id: 'task-1', name: '现场放线与三方交底', status: 'completed' },
                { id: 'task-2', name: '墙体拆除与建筑垃圾清运', status: 'completed' },
                { id: 'task-3', name: '新建砌墙与植筋加固', status: 'completed' }
            ]
        },
        {
            id: 'stage-2',
            name: '水电管路与隐蔽工程',
            status: 'in_progress',
            collapsed: false,
            currentTaskId: 'task-6',
            tasks: [
                { id: 'task-4', name: '强弱电开槽与弹线定位', status: 'completed' },
                { id: 'task-5', name: '冷热水管路铺设与打压测试', status: 'completed' },
                { id: 'task-6', name: '卫生间沉箱防漏与二次排水', status: 'in_progress', hasTag: true },
                { id: 'task-7', name: '中央空调/新风主机吊装穿梁', status: 'in_progress', hasTag: true },
                { id: 'task-8', name: '隐蔽工程节点联合三方验收', status: 'pending' }
            ]
        },
        {
            id: 'stage-3',
            name: '泥瓦铺贴与防水防渗',
            status: 'pending',
            collapsed: false,
            tasks: [
                { id: 'task-9', name: '卫生间及阳台高分子防水刷制', status: 'pending' },
                { id: 'task-10', name: '闭水试验48小时联合签字', status: 'pending' },
                { id: 'task-11', name: '墙地砖铺贴与地面找平', status: 'pending' },
                { id: 'task-12', name: '泥瓦工程节点联合验收', status: 'pending' }
            ]
        },
        {
            id: 'stage-4',
            name: '木作吊顶与隔断制作',
            status: 'pending',
            collapsed: true,
            tasks: [
                { id: 'task-13', name: '轻钢龙骨与木龙骨基层制作', status: 'pending' },
                { id: 'task-14', name: '石膏板吊顶与背景墙隔断安装', status: 'pending' },
                { id: 'task-15', name: '木作工程节点联合三方验收', status: 'pending' }
            ]
        },
        {
            id: 'stage-5',
            name: '油漆喷涂与墙面装饰',
            status: 'pending',
            collapsed: true,
            tasks: [
                { id: 'task-16', name: '墙面刮腻子打磨与底漆涂刷', status: 'pending' },
                { id: 'task-17', name: '面漆喷涂与墙纸墙布铺贴', status: 'pending' },
                { id: 'task-18', name: '油漆工程节点联合三方验收', status: 'pending' }
            ]
        }
    ]
};

// 导出数据（支持模块化和全局访问）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectNavData;
}