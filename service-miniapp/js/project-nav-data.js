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