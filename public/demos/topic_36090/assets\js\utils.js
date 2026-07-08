/* ============================================
   通用工具函数
   包含：Toast提示、格式化、导出CSV、日期处理等
   ============================================ */

(function () {
    'use strict';

    /* ============================================
       Toast 提示
       ============================================ */
    function showToast(message, type) {
        type = type || 'info';
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        toast.style.cssText = [
            'position: fixed; top: 20px; left: 50%;',
            'transform: translateX(-50%);',
            'padding: 12px 24px; border-radius: 8px;',
            'color: white; font-size: 14px;',
            'z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
            'animation: slideDown 0.3s ease;'
        ].join(' ');

        if (type === 'success') toast.style.background = '#10b981';
        else if (type === 'error') toast.style.background = '#ef4444';
        else toast.style.background = '#3b82f6';

        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 2500);
    }

    /* ============================================
       数字/金额格式化
       ============================================ */
    function formatMoney(amount) {
        const num = parseFloat(amount) || 0;
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatNumber(num, decimals) {
        decimals = typeof decimals === 'number' ? decimals : 2;
        const n = parseFloat(num) || 0;
        return n.toFixed(decimals);
    }

    /* ============================================
       日期格式化
       ============================================ */
    function formatDate(date) {
        const d = date ? new Date(date) : new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function formatDateTime(date) {
        const d = date ? new Date(date) : new Date();
        return formatDate(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function getMonthRange() {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from: formatDate(from), to: formatDate(to) };
    }

    /* ============================================
       模态框
       ============================================ */
    function showModal(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
            'background: rgba(0,0,0,0.5); display: flex;',
            'align-items: center; justify-content: center;',
            'z-index: 9998; padding: 20px;'
        ].join(' ');

        const box = document.createElement('div');
        box.style.cssText = [
            'background: white; border-radius: 16px; padding: 24px;',
            'width: 100%; max-width: 400px;',
            'box-shadow: 0 20px 40px rgba(0,0,0,0.2);'
        ].join(' ');

        box.innerHTML = '<h3 style="margin-bottom:12px;color:#111;">提示</h3>' +
            '<p style="color:#666;margin-bottom:20px;font-size:14px;">' + message + '</p>' +
            '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button id="cancelBtn" style="padding:8px 16px;border:1px solid #ddd;background:white;border-radius:8px;cursor:pointer;">取消</button>' +
            '<button id="okBtn" style="padding:8px 16px;border:none;background:#ef4444;color:white;border-radius:8px;cursor:pointer;">确认</button>' +
            '</div>';

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        box.querySelector('#cancelBtn').onclick = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };
        box.querySelector('#okBtn').onclick = function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (onConfirm) onConfirm();
        };
    }

    /* ============================================
       CSV 导出
       ============================================ */
    function exportCSV(records, filename) {
        const headers = ['日期', '供应商', '货品明细', '总金额(元)', '备注'];
        const rows = records.map(function (r) {
            const itemText = (r.items || []).map(function (item) {
                return (item.name || '') + ' x' + (item.weight || '') + '斤 ' + (item.price || '') + '元';
            }).join('; ');
            return [
                r.date || '',
                r.supplier || '',
                '"' + (itemText || '').replace(/"/g, '""') + '"',
                r.totalAmount || 0,
                '"' + (r.note || '').replace(/"/g, '""') + '"'
            ].join(',');
        });

        const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || ('采购记录_' + formatDate() + '.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ============================================
       导出 Excel (实际是带HTML格式的xls文件)
       ============================================ */
    function exportExcel(records, filename) {
        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1">';
        html += '<tr><th>日期</th><th>供应商</th><th>货品</th><th>重量(斤)</th><th>单价(元)</th><th>金额(元)</th><th>备注</th></tr>';

        records.forEach(function (r) {
            if (r.items && r.items.length > 0) {
                r.items.forEach(function (item, idx) {
                    html += '<tr>';
                    if (idx === 0) {
                        html += '<td rowspan="' + r.items.length + '">' + (r.date || '') + '</td>';
                        html += '<td rowspan="' + r.items.length + '">' + (r.supplier || '') + '</td>';
                    }
                    html += '<td>' + (item.name || '') + '</td>';
                    html += '<td>' + (item.weight || '') + '</td>';
                    html += '<td>' + (item.price || '') + '</td>';
                    html += '<td>' + (item.amount || '') + '</td>';
                    if (idx === 0) {
                        html += '<td rowspan="' + r.items.length + '">' + (r.note || '') + '</td>';
                    }
                    html += '</tr>';
                });
            } else {
                html += '<tr><td>' + (r.date || '') + '</td><td>' + (r.supplier || '') + '</td><td colspan="4">-</td><td>' + (r.note || '') + '</td></tr>';
            }
        });

        html += '</table></body></html>';
        const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || ('采购记录_' + formatDate() + '.xls');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ============================================
       页面跳转辅助
       ============================================ */
    function go(url) { window.location.href = url; }

    // 暴露到全局
    window.Utils = {
        showToast: showToast,
        formatMoney: formatMoney,
        formatNumber: formatNumber,
        formatDate: formatDate,
        formatDateTime: formatDateTime,
        getMonthRange: getMonthRange,
        showModal: showModal,
        exportCSV: exportCSV,
        exportExcel: exportExcel,
        go: go
    };

    console.log('[Utils] 工具函数已加载');
})();
