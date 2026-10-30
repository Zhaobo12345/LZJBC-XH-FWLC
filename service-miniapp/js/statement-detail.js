let statementData = {
    id: '1',
    type: 'material',
    typeName: '辅料费',
    amount: 4500.00,
    contract: '基础施工合同',
    description: '现场水电实际超出原合同预估米数，进行实际增项测量结算。',
    status: 'pending',
    creator: '张工长',
    creatorRole: 'foreman',
    createTime: '2026-05-20 10:30',
    confirmer: '李先生',
    confirmerRole: 'owner',
    confirmTime: '',
    rejectReason: '',
    payment_voucher: {
        attachment_urls: [],
        upload_time: '',
        uploader_name: ''
    }
};

let uploadedImages = [];

const typeMap = {
    'worker_wage': '工友工资',
    'material': '辅料费',
    'measure': '措施费',
    'insurance': '保险费',
    'foreman_wage': '工长工资'
};

const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status') || 'pending';
const type = urlParams.get('type') || 'material';
document.addEventListener('DOMContentLoaded', function() {
    initPageData();
    updatePageByStatus();
});

function initPageData() {
    statementData.status = status;
    statementData.type = type;
    statementData.typeName = typeMap[type] || '辅料费';
    
    document.getElementById('typeTag').textContent = statementData.typeName;
    document.getElementById('typeTag').className = 'type-tag ' + type;
    document.getElementById('amountDisplay').textContent = formatAmount(statementData.amount);
    document.getElementById('contractName').textContent = statementData.contract;
    document.getElementById('billType').textContent = statementData.typeName;
    document.getElementById('creatorName').textContent = statementData.creator;
    document.getElementById('createTime').textContent = statementData.createTime;
}

function formatAmount(amount) {
    const prefix = amount < 0 ? '-' : '';
    const absAmount = Math.abs(amount);
    return prefix + '¥ ' + absAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updatePageByStatus() {
    const statusBanner = document.getElementById('statusBanner');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusDesc = document.getElementById('statusDesc');
    const rejectReasonBanner = document.getElementById('rejectReasonBanner');
    const confirmInfoCard = document.getElementById('confirmInfoCard');
    const voucherCard = document.getElementById('voucherCard');
    const uploadFooter = document.getElementById('uploadFooter');
    
    switch (status) {
        case 'pending':
            statusBanner.className = 'status-banner';
            statusIcon.textContent = '⏳';
            statusText.textContent = '待确认';
            statusDesc.textContent = '等待业主确认';
            uploadFooter.style.display = 'none';
            break;
            
        case 'effective':
            statusBanner.className = 'status-banner effective';
            statusIcon.textContent = '✅';
            statusText.textContent = '已生效';
            statusDesc.textContent = '账单已确认生效';
            
            confirmInfoCard.style.display = 'block';
            document.getElementById('confirmerAvatar').textContent = statementData.confirmer.charAt(0);
            document.getElementById('confirmerName').textContent = statementData.confirmer + '（业主）';
            document.getElementById('confirmTime').textContent = '已于 2026-05-19 14:30 确认';
            
            addLogItem(statementData.confirmer + ' 确认了对账单', '2026-05-19 14:30');
            
            uploadFooter.style.display = 'flex';
            break;
            
        case 'paid':
            statusBanner.className = 'status-banner paid';
            statusIcon.textContent = '💳';
            statusText.textContent = '已支付';
            statusDesc.textContent = '账单已完成支付';
            
            confirmInfoCard.style.display = 'block';
            document.getElementById('confirmerAvatar').textContent = statementData.confirmer.charAt(0);
            document.getElementById('confirmerName').textContent = statementData.confirmer + '（业主）';
            document.getElementById('confirmTime').textContent = '已于 2026-05-19 14:30 确认';
            
            voucherCard.style.display = 'block';
            document.getElementById('uploaderAvatar').textContent = statementData.creator.charAt(0);
            document.getElementById('uploaderName').textContent = statementData.creator;
            document.getElementById('uploadTime').textContent = '2026-05-18 16:30';
            
            addLogItem(statementData.confirmer + ' 确认了对账单', '2026-05-19 14:30');
            addLogItem(statementData.creator + ' 上传了支付凭证', '2026-05-18 16:30');
            
            uploadFooter.style.display = 'none';
            break;
            
        case 'rejected':
            statusBanner.className = 'status-banner rejected';
            statusIcon.textContent = '❌';
            statusText.textContent = '已驳回';
            statusDesc.textContent = '账单已被业主驳回';
            
            rejectReasonBanner.style.display = 'block';
            document.getElementById('rejectReasonContent').textContent = statementData.confirmer + '（业主）：数量算错了，现场测量只有20米，请核对后重新发起。';
            
            addLogItem(statementData.confirmer + ' 驳回了对账单', '2026-05-18 16:00');
            
            uploadFooter.style.display = 'none';
            break;
    }
}

function addLogItem(text, time) {
    const logList = document.getElementById('logList');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
        <div class="log-dot"></div>
        <div class="log-content">
            <div class="log-text">${text}</div>
            <div class="log-time">${time}</div>
        </div>
    `;
    logList.appendChild(logItem);
}

function previewAttachment(name) {
    showToast('预览：' + name);
}

function showToast(message) {
    const toast = document.getElementById('toastModal');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function showVoucherDrawer() {
    document.getElementById('voucherDrawerOverlay').classList.add('show');
    document.getElementById('voucherDrawer').classList.add('show');
    uploadedImages = [];
    renderUploadGrid();
}

function hideVoucherDrawer() {
    document.getElementById('voucherDrawerOverlay').classList.remove('show');
    document.getElementById('voucherDrawer').classList.remove('show');
}

function renderUploadGrid() {
    const uploadGrid = document.getElementById('uploadGrid');
    let html = '';
    
    uploadedImages.forEach((img, index) => {
        html += `
            <div class="upload-item preview" onclick="previewUploadImage(${index})">
                <div class="img-placeholder">📷</div>
                <div class="delete-btn" onclick="event.stopPropagation(); deleteImage(${index})">×</div>
            </div>
        `;
    });
    
    if (uploadedImages.length < 9) {
        html += `
            <div class="upload-item add" onclick="addImage()">
                <div class="add-icon">+</div>
                <div class="add-text">添加图片</div>
            </div>
        `;
    }
    
    uploadGrid.innerHTML = html;
}

function addImage() {
    // 校验数量限制
    if (uploadedImages.length >= 9) {
        showToast('最多上传9张图片');
        return;
    }
    
    // 模拟文件选择（实际项目中会触发文件选择器）
    // 校验规则：jpg/jpeg/png/webp，单张≤10MB
    uploadedImages.push({
        id: Date.now(),
        url: '',
        name: '凭证图片_' + (uploadedImages.length + 1) + '.jpg'
    });
    
    renderUploadGrid();
}

function deleteImage(index) {
    uploadedImages.splice(index, 1);
    renderUploadGrid();
}

function previewUploadImage(index) {
    showToast('预览图片 ' + (index + 1));
}

function previewImage(index) {
    showToast('预览凭证图片 ' + (index + 1));
}

function submitVoucher() {
    if (uploadedImages.length === 0) {
        showToast('请至少上传1张凭证图片');
        return;
    }
    
    showToast('凭证上传成功');
    hideVoucherDrawer();
    
    setTimeout(() => {
        window.location.href = 'statement-list.html';
    }, 1500);
}
