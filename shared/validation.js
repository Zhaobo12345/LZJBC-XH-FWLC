/**
 * 良造家管理平台 - 通用表单校验工具库
 * 创建日期：2026-07-27
 * 用途：提供统一的表单字段校验规则、错误提示和交互工具函数
 * 适用范围：PC管理端、服务方小程序、业主小程序
 */

(function(global) {
    'use strict';

    // ==================== 正则表达式定义 ====================
    const REGEX = {
        // 手机号：1开头，第二位3-9，共11位
        PHONE: /^1[3-9]\d{9}$/,
        
        // 金额（正数）：最多2位小数
        AMOUNT_POSITIVE: /^(\d{1,10})(\.\d{1,2})?$/,
        
        // 金额（可负）：支持负数，最多2位小数
        AMOUNT_NEGATIVE: /^-?(\d{1,8})(\.\d{1,2})?$/,
        
        // 星级评分：0.5的倍数，范围0.5-5.0
        RATING: /^([0-5]\.0|[1-4]\.5|0\.5)$/,
        
        // 日期：YYYY-MM-DD格式
        DATE: /^\d{4}-\d{2}-\d{2}$/,
        
        // UUID格式
        UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    };

    // ==================== 校验规则 ====================
    const VALIDATORS = {
        /**
         * 校验手机号
         * @param {string} value - 手机号
         * @returns {object} {valid: boolean, message: string}
         */
        phone: function(value) {
            if (!value) {
                return { valid: false, message: '请输入手机号' };
            }
            if (!REGEX.PHONE.test(value)) {
                return { valid: false, message: '请输入正确的手机号' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验姓名
         * @param {string} value - 姓名
         * @param {number} maxLength - 最大长度，默认50
         * @returns {object} {valid: boolean, message: string}
         */
        name: function(value, maxLength = 50) {
            const trimmed = (value || '').trim();
            if (!trimmed) {
                return { valid: false, message: '请输入姓名' };
            }
            if (trimmed.length > maxLength) {
                return { valid: false, message: '姓名不能超过' + maxLength + '个字符' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验正数金额
         * @param {string|number} value - 金额
         * @param {number} max - 最大值，默认99999999.99
         * @returns {object} {valid: boolean, message: string}
         */
        amountPositive: function(value, max = 99999999.99) {
            if (!value && value !== 0) {
                return { valid: false, message: '请输入金额' };
            }
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                return { valid: false, message: '请输入正确的金额' };
            }
            if (num > max) {
                return { valid: false, message: '金额不能超过' + max.toLocaleString() + '元' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验可负金额
         * @param {string|number} value - 金额
         * @param {number} max - 最大绝对值，默认9999999.99
         * @returns {object} {valid: boolean, message: string}
         */
        amountNegative: function(value, max = 9999999.99) {
            if (!value && value !== 0) {
                return { valid: false, message: '请输入金额' };
            }
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, message: '请输入正确的金额' };
            }
            if (Math.abs(num) > max) {
                return { valid: false, message: '金额不能超过' + max.toLocaleString() + '元' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验文本长度
         * @param {string} value - 文本内容
         * @param {number} maxLength - 最大长度
         * @param {boolean} required - 是否必填
         * @param {string} fieldName - 字段名称
         * @returns {object} {valid: boolean, message: string}
         */
        textLength: function(value, maxLength, required = false, fieldName = '内容') {
            const trimmed = (value || '').trim();
            if (!trimmed) {
                if (required) {
                    return { valid: false, message: '请输入' + fieldName };
                }
                return { valid: true, message: '' };
            }
            if (trimmed.length > maxLength) {
                return { valid: false, message: fieldName + '不能超过' + maxLength + '个字符' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验日期格式和逻辑
         * @param {string} startDate - 开始日期
         * @param {string} endDate - 结束日期
         * @returns {object} {valid: boolean, message: string}
         */
        dateRange: function(startDate, endDate) {
            if (!startDate || !endDate) {
                return { valid: true, message: '' };
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end <= start) {
                return { valid: false, message: '结束日期须晚于开始日期' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验星级评分（支持半星）
         * @param {number} value - 评分值
         * @returns {object} {valid: boolean, message: string}
         */
        rating: function(value) {
            const validValues = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
            if (!validValues.includes(parseFloat(value))) {
                return { valid: false, message: '请选择评分' };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验文件
         * @param {File} file - 文件对象
         * @param {string} type - 文件类型：'image', 'video', 'document'
         * @param {number} maxSize - 最大大小（MB）
         * @returns {object} {valid: boolean, message: string}
         */
        file: function(file, type = 'image', maxSize = 10) {
            if (!file) {
                return { valid: false, message: '请选择文件' };
            }

            const typeConfig = {
                image: {
                    formats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
                    name: '图片'
                },
                video: {
                    formats: ['video/mp4', 'video/quicktime'],
                    extensions: ['.mp4', '.mov'],
                    name: '视频'
                },
                document: {
                    formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                    extensions: ['.pdf', '.doc', '.docx'],
                    name: '文档'
                }
            };

            const config = typeConfig[type] || typeConfig.image;
            const sizeBytes = maxSize * 1024 * 1024;

            // 校验格式
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            const isValidType = config.formats.includes(fileType) || 
                                config.extensions.some(ext => fileName.endsWith(ext));
            if (!isValidType) {
                return { valid: false, message: '请上传' + config.extensions.join('、') + '格式的' + config.name };
            }

            // 校验大小
            if (file.size > sizeBytes) {
                return { valid: false, message: config.name + '大小不能超过' + maxSize + 'MB' };
            }

            return { valid: true, message: '' };
        },

        /**
         * 校验文件数量
         * @param {number} current - 当前数量
         * @param {number} max - 最大数量
         * @param {string} name - 文件类型名称
         * @returns {object} {valid: boolean, message: string}
         */
        fileCount: function(current, max, name = '附件') {
            if (current > max) {
                return { valid: false, message: '最多上传' + max + '张' + name };
            }
            return { valid: true, message: '' };
        },

        /**
         * 校验必选项
         * @param {any} value - 值
         * @param {string} fieldName - 字段名称
         * @returns {object} {valid: boolean, message: string}
         */
        required: function(value, fieldName = '此项') {
            if (value === null || value === undefined || value === '' || 
                (Array.isArray(value) && value.length === 0)) {
                return { valid: false, message: '请选择' + fieldName };
            }
            return { valid: true, message: '' };
        }
    };

    // ==================== 格式化工具 ====================
    const FORMATTERS = {
        /**
         * 格式化金额为两位小数
         * @param {string|number} value - 金额
         * @returns {string}
         */
        formatAmount: function(value) {
            if (!value && value !== 0) return '';
            const num = parseFloat(value);
            if (isNaN(num)) return '';
            return num.toFixed(2);
        },

        /**
         * 格式化大额金额显示（万）
         * @param {string|number} value - 金额
         * @returns {string}
         */
        formatAmountLarge: function(value) {
            const num = parseFloat(value);
            if (isNaN(num)) return '';
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + '万';
            }
            return '';
        },

        /**
         * 格式化字数统计
         * @param {string} value - 文本内容
         * @param {number} maxLength - 最大长度
         * @returns {string}
         */
        formatCharCount: function(value, maxLength) {
            const len = (value || '').length;
            return len + '/' + maxLength;
        },

        /**
         * 获取字数统计颜色
         * @param {string} value - 文本内容
         * @param {number} maxLength - 最大长度
         * @returns {string} 颜色值
         */
        getCharCountColor: function(value, maxLength) {
            const len = (value || '').length;
            const ratio = len / maxLength;
            if (ratio >= 1) return '#FF4D4F'; // 红色：超限
            if (ratio >= 0.9) return '#FA8C16'; // 橙色：接近上限
            return '#8C8C8C'; // 灰色：正常
        }
    };

    // ==================== UI交互工具 ====================
    const UI = {
        /**
         * 显示字段错误状态
         * @param {HTMLElement} inputElement - 输入框元素
         * @param {string} message - 错误信息
         */
        showError: function(inputElement, message) {
            if (!inputElement) return;
            
            // 添加错误样式
            inputElement.style.borderColor = '#FF4D4F';
            inputElement.style.backgroundColor = '#FFF1F0';
            
            // 查找或创建错误提示元素
            let errorEl = inputElement.parentNode.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'field-error';
                errorEl.style.cssText = 'color: #FF4D4F; font-size: 12px; margin-top: 4px;';
                inputElement.parentNode.appendChild(errorEl);
            }
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        },

        /**
         * 清除字段错误状态
         * @param {HTMLElement} inputElement - 输入框元素
         */
        clearError: function(inputElement) {
            if (!inputElement) return;
            
            // 清除错误样式
            inputElement.style.borderColor = '';
            inputElement.style.backgroundColor = '';
            
            // 隐藏错误提示
            const errorEl = inputElement.parentNode.querySelector('.field-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        },

        /**
         * 更新字数统计显示
         * @param {HTMLElement} countElement - 字数统计元素
         * @param {string} value - 文本内容
         * @param {number} maxLength - 最大长度
         */
        updateCharCount: function(countElement, value, maxLength) {
            if (!countElement) return;
            
            countElement.textContent = FORMATTERS.formatCharCount(value, maxLength);
            countElement.style.color = FORMATTERS.getCharCountColor(value, maxLength);
        },

        /**
         * 绑定实时校验（输入时显示字数统计，失焦时校验格式）
         * @param {HTMLElement} inputElement - 输入框元素
         * @param {function} validator - 校验函数
         * @param {HTMLElement} countElement - 字数统计元素（可选）
         * @param {number} maxLength - 最大长度（可选）
         */
        bindValidation: function(inputElement, validator, countElement, maxLength) {
            if (!inputElement) return;

            // 输入时：更新字数统计
            if (countElement && maxLength) {
                inputElement.addEventListener('input', function() {
                    UI.updateCharCount(countElement, this.value, maxLength);
                    UI.clearError(this);
                });
            }

            // 失焦时：校验格式
            inputElement.addEventListener('blur', function() {
                const result = validator(this.value);
                if (result.valid) {
                    UI.clearError(this);
                } else {
                    UI.showError(this, result.message);
                }
            });
        },

        /**
         * 表单提交前校验所有字段
         * @param {Array} fields - 字段配置数组 [{element, validator, value}]
         * @returns {object} {valid: boolean, errors: array}
         */
        validateAll: function(fields) {
            const errors = [];
            let firstErrorElement = null;

            fields.forEach(function(field) {
                const result = field.validator(field.value || field.element?.value);
                if (!result.valid) {
                    errors.push({ field: field.name, message: result.message });
                    if (field.element) {
                        UI.showError(field.element, result.message);
                        if (!firstErrorElement) {
                            firstErrorElement = field.element;
                        }
                    }
                }
            });

            // 聚焦第一个错误字段
            if (firstErrorElement) {
                firstErrorElement.focus();
            }

            return { valid: errors.length === 0, errors: errors };
        }
    };

    // ==================== 半星评分组件 ====================
    const StarRating = {
        /**
         * 初始化半星评分组件
         * @param {HTMLElement} container - 容器元素
         * @param {function} onChange - 值变化回调
         * @param {number} initialValue - 初始值
         */
        init: function(container, onChange, initialValue = 0) {
            if (!container) return;

            container.innerHTML = '';
            container.style.cssText = 'display: flex; gap: 4px;';
            container.dataset.rating = initialValue;

            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('div');
                star.className = 'star-item';
                star.dataset.index = i;
                star.style.cssText = `
                    width: 32px; height: 32px; cursor: pointer;
                    position: relative; display: flex; align-items: center; justify-content: center;
                `;

                // 左半边
                const leftHalf = document.createElement('div');
                leftHalf.className = 'star-half star-half-left';
                leftHalf.style.cssText = 'position: absolute; left: 0; top: 0; width: 50%; height: 100%;';
                
                // 右半边
                const rightHalf = document.createElement('div');
                rightHalf.className = 'star-half star-half-right';
                rightHalf.style.cssText = 'position: absolute; right: 0; top: 0; width: 50%; height: 100%;';

                star.appendChild(leftHalf);
                star.appendChild(rightHalf);
                container.appendChild(star);

                // 绑定点击事件
                star.addEventListener('click', function(e) {
                    const rect = this.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const isLeftHalf = clickX < rect.width / 2;
                    
                    const rating = isLeftHalf ? i : i + 0.5;
                    StarRating.setValue(container, rating);
                    if (onChange) onChange(rating);
                });

                // 悬停效果
                star.addEventListener('mouseenter', function(e) {
                    const rect = this.getBoundingClientRect();
                    const hoverX = e.clientX - rect.left;
                    const isLeftHalf = hoverX < rect.width / 2;
                    StarRating.showPreview(container, i, isLeftHalf);
                });

                star.addEventListener('mouseleave', function() {
                    StarRating.setValue(container, parseFloat(container.dataset.rating));
                });
            }

            // 设置初始值
            this.setValue(container, initialValue);
        },

        /**
         * 设置评分值
         * @param {HTMLElement} container - 容器元素
         * @param {number} rating - 评分值
         */
        setValue: function(container, rating) {
            container.dataset.rating = rating;
            const stars = container.querySelectorAll('.star-item');
            
            stars.forEach(function(star, index) {
                const starIndex = index + 1;
                const leftHalf = star.querySelector('.star-half-left');
                const rightHalf = star.querySelector('.star-half-right');
                
                if (starIndex <= rating) {
                    // 整颗星填充
                    leftHalf.innerHTML = '★';
                    rightHalf.innerHTML = '★';
                    star.style.color = '#FA8C16';
                } else if (starIndex - 0.5 === rating) {
                    // 半颗星填充
                    leftHalf.innerHTML = '★';
                    rightHalf.innerHTML = '☆';
                    star.style.color = '#FA8C16';
                } else {
                    // 空星
                    leftHalf.innerHTML = '☆';
                    rightHalf.innerHTML = '☆';
                    star.style.color = '#D9D9D9';
                }
            });
        },

        /**
         * 显示预览效果（悬停时）
         * @param {HTMLElement} container - 容器元素
         * @param {number} hoverIndex - 悬停的星星索引
         * @param {boolean} isLeftHalf - 是否左半边
         */
        showPreview: function(container, hoverIndex, isLeftHalf) {
            const previewRating = isLeftHalf ? hoverIndex : hoverIndex + 0.5;
            const stars = container.querySelectorAll('.star-item');
            
            stars.forEach(function(star, index) {
                const starIndex = index + 1;
                const leftHalf = star.querySelector('.star-half-left');
                const rightHalf = star.querySelector('.star-half-right');
                
                if (starIndex <= previewRating) {
                    leftHalf.innerHTML = '★';
                    rightHalf.innerHTML = '★';
                    star.style.color = '#FA8C16';
                    star.style.opacity = '0.7';
                } else if (starIndex - 0.5 === previewRating) {
                    leftHalf.innerHTML = '★';
                    rightHalf.innerHTML = '☆';
                    star.style.color = '#FA8C16';
                    star.style.opacity = '0.7';
                } else {
                    leftHalf.innerHTML = '☆';
                    rightHalf.innerHTML = '☆';
                    star.style.color = '#D9D9D9';
                    star.style.opacity = '1';
                }
            });
        },

        /**
         * 获取当前评分值
         * @param {HTMLElement} container - 容器元素
         * @returns {number}
         */
        getValue: function(container) {
            return parseFloat(container.dataset.rating) || 0;
        }
    };

    // ==================== 导出 ====================
    global.Validation = {
        REGEX: REGEX,
        validate: VALIDATORS,
        format: FORMATTERS,
        ui: UI,
        StarRating: StarRating
    };

})(typeof window !== 'undefined' ? window : global);