// ============================================
// Utility Functions
// ============================================

const Utils = {
  // Generate unique ID
  uuid() {
    return 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
  },

  // Simple hash for generating IDs from content
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 12);
  },

  // Generate company ID from name + position + location
  companyId(name, position, location) {
    return Utils.hash(`${name || ''}_${position || ''}_${location || ''}`);
  },

  // Parse location string into array of cities
  parseCities(locationStr) {
    if (!locationStr) return [];
    // Split by common delimiters
    const cities = locationStr
      .split(/[,，、\s]+/)
      .map(c => c.trim())
      .filter(c => c && c.length > 0 && c !== '+' && !c.match(/^\d+$/));
    return cities;
  },

  // Get primary city (first city or truncated list)
  primaryLocation(locationStr) {
    const cities = Utils.parseCities(locationStr);
    if (cities.length === 0) return locationStr || '未知';
    if (cities.length <= 2) return cities.join('、');
    return `${cities[0]} +${cities.length - 1}`;
  },

  // Format deadline for display
  formatDeadline(deadline) {
    if (!deadline) return '未知';
    if (deadline === '招满为止' || deadline === '尽快投递') return deadline;
    if (deadline === '/') return '未知';
    return deadline;
  },

  // Check if deadline is urgent (within 7 days)
  isUrgentDeadline(deadline) {
    if (!deadline || deadline === '招满为止' || deadline === '尽快投递' || deadline === '/') return false;
    const d = new Date(deadline);
    if (isNaN(d)) return false;
    const diff = d - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  },

  // Check if deadline is passed
  isExpired(deadline) {
    if (!deadline || deadline === '招满为止' || deadline === '尽快投递' || deadline === '/') return false;
    const d = new Date(deadline);
    if (isNaN(d)) return false;
    return d < new Date();
  },

  // Generate star rating HTML
  starHTML(rating) {
    if (!rating) return '';
    let html = '<span class="star-rating">';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fas fa-star${i <= rating ? '' : ' empty'}"></i>`;
    }
    html += '</span>';
    return html;
  },

  // Escape HTML
  esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Truncate text
  truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '...';
  },

  // Toast notification
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle',
    };

    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i><span>${Utils.esc(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Show modal
  showModal(title, bodyHTML, options = {}) {
    const container = document.getElementById('modal-container');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">${Utils.esc(title)}</div>
          <button class="modal-close" onclick="Utils.closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${bodyHTML}
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Utils.closeModal();
    });

    container.appendChild(overlay);
    return overlay;
  },

  closeModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Parse Excel file using SheetJS
  parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // Map raw Excel rows to company objects
  // Supports both header-based and headerless formats
  // Auto-detects column layout from header row
  mapRowsToCompanies(rows) {
    if (!rows || rows.length === 0) return [];

    // Check if first row is a header
    const firstRow = rows[0].map(c => String(c || '').trim());
    const hasHeader = firstRow.some(cell =>
      cell.includes('公司') || cell.includes('企业名') || cell.includes('岗位') ||
      cell.includes('城市') || cell.includes('地点') || cell.includes('更新')
    );

    // If header row, build column index map
    let colMap = null;
    let dataRows = rows;
    if (hasHeader) {
      colMap = {};
      firstRow.forEach((cell, idx) => {
        if (cell.includes('更新') || cell.includes('时间')) colMap.updateTime = idx;
        else if (cell.includes('企业名') || cell.includes('公司名') || cell.includes('名称')) colMap.companyName = idx;
        else if (cell.includes('企业类型') || cell.includes('类型')) colMap.companyType = idx;
        else if (cell.includes('届次') || cell.includes('届')) colMap.graduationYear = idx;
        else if (cell.includes('批次')) colMap.batch = idx;
        else if (cell.includes('行业') || cell.includes('领域')) colMap.industry = idx;
        else if (cell.includes('岗位') || cell.includes('职位') || cell.includes('招聘')) colMap.positionName = idx;
        else if (cell.includes('地点') || cell.includes('城市')) colMap.location = idx;
        else if (cell.includes('截止')) colMap.deadline = idx;
        else if (cell.includes('来源')) colMap.announcementSource = idx;
        else if (cell.includes('公告') && cell.includes('链接')) colMap.announcementUrl = idx;
        else if (cell.includes('投递') && cell.includes('链接')) colMap.applicationUrl = idx;
        else if (cell.includes('专业')) colMap.majorRequirement = idx;
        else if (cell.includes('笔试')) colMap.examInfo = idx;
        else if (cell.includes('学历')) colMap.educationRequirement = idx;
        else if (cell.includes('开始')) colMap.startDate = idx;
      });

      // Ensure required columns are mapped
      if (colMap.companyName === undefined) colMap.companyName = 1;
      if (colMap.positionName === undefined) colMap.positionName = 6;
      if (colMap.location === undefined) colMap.location = 7;

      dataRows = rows.slice(1);
    }

    const companies = [];

    for (const row of dataRows) {
      // Skip empty rows
      if (!row || row.every(c => !c || c === '')) continue;

      // Ensure row has enough columns
      while (row.length < 14) row.push('');

      const get = (key, defaultIdx) => {
        const idx = colMap ? (colMap[key] !== undefined ? colMap[key] : defaultIdx) : defaultIdx;
        return idx !== undefined && idx < row.length ? row[idx] : '';
      };

      const name = String(get('companyName', 1) || '').trim();
      if (!name) continue;

      const position = String(get('positionName', 6) || '').trim();
      const location = String(get('location', 7) || '').trim();

      // Format deadline
      let deadline = get('deadline', 8);
      if (deadline instanceof Date) {
        deadline = deadline.toISOString().split('T')[0];
      } else {
        deadline = String(deadline || '').trim();
      }

      // Format update time
      let updateTime = get('updateTime', 0);
      if (updateTime instanceof Date) {
        updateTime = updateTime.toISOString().split('T')[0];
      } else {
        updateTime = String(updateTime || '').trim();
      }

      // Format start date
      let startDate = colMap && colMap.startDate !== undefined ? get('startDate', null) : '';
      if (startDate instanceof Date) {
        startDate = startDate.toISOString().split('T')[0];
      } else {
        startDate = String(startDate || '').trim();
      }

      // Format positions: normalize all separators to 、
      let positionFormatted = position;
      if (positionFormatted && positionFormatted !== '/') {
        positionFormatted = positionFormatted
          .replace(/[;；]/g, '、')        // semicolons → 、
          .replace(/[，,]/g, '、')         // commas → 、
          .replace(/、\s*/g, '、')         // clean space after 、
          .replace(/\s*、/g, '、')         // clean space before 、
          .replace(/\s+/g, '、')           // remaining spaces → 、
          .replace(/、+/g, '、')           // deduplicate 、
          .replace(/^、|、$/g, '');         // trim leading/trailing 、
      }

      // Get URLs — validate http links, convert email to mailto:
      let announcementUrl = String(get('announcementUrl', 10) || '').trim();
      let applicationUrl = String(get('applicationUrl', 11) || '').trim();

      if (announcementUrl && !announcementUrl.startsWith('http')) {
        const emailMatch = announcementUrl.match(/[\w.+-]+@[\w.-]+\.\w+/);
        announcementUrl = emailMatch ? `mailto:${emailMatch[0]}` : '';
      }
      if (applicationUrl && !applicationUrl.startsWith('http')) {
        const emailMatch = applicationUrl.match(/[\w.+-]+@[\w.-]+\.\w+/);
        applicationUrl = emailMatch ? `mailto:${emailMatch[0]}` : '';
      }

      companies.push({
        id: Utils.companyId(name, position, location),
        companyName: name,
        companyType: String(get('companyType', 2) || '').trim(),
        graduationYear: String(get('graduationYear', 3) || '').trim(),
        batch: String(get('batch', 4) || '').trim(),
        industry: String(get('industry', 5) || '').trim(),
        positionName: positionFormatted,
        location: location,
        deadline: deadline,
        educationRequirement: colMap && colMap.educationRequirement !== undefined ? String(get('educationRequirement', null) || '').trim() : '',
        announcementSource: String(get('announcementSource', 9) || name).trim(),
        announcementUrl: announcementUrl,
        applicationUrl: applicationUrl,
        majorRequirement: String(get('majorRequirement', 12) || '').trim(),
        examInfo: String(get('examInfo', 13) || '').trim(),
        startDate: startDate,
        updateTime: updateTime,
        matchScore: null,
        starRating: null,
        matchReason: null,
        isFavorite: false,
        applyStatus: '未投递',
        notes: '',
        tags: [],
        createdAt: null,
        updatedAt: null,
      });
    }

    return companies;
  },

  // Export companies to Excel
  exportToExcel(companies, filename = '企业列表.xlsx') {
    const data = companies.map(c => ({
      '公司名称': c.companyName,
      '企业类型': c.companyType,
      '届次': c.graduationYear,
      '批次': c.batch,
      '行业': c.industry,
      '招聘岗位': c.positionName,
      '工作地点': c.location,
      '截止时间': c.deadline,
      '学历要求': c.educationRequirement,
      '专业要求': c.majorRequirement,
      '笔试情况': c.examInfo,
      '公告链接': c.announcementUrl,
      '投递链接': c.applicationUrl,
      '匹配星级': c.starRating || '',
      '投递状态': c.applyStatus,
      '收藏': c.isFavorite ? '是' : '否',
      '备注': c.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '企业列表');
    XLSX.writeFile(wb, filename);
  },

  // Get unique values from array of objects
  uniqueValues(arr, key) {
    const set = new Set();
    arr.forEach(item => {
      const val = item[key];
      if (val) {
        // Split comma-separated values
        String(val).split(/[,，]/).forEach(v => {
          v = v.trim();
          if (v) set.add(v);
        });
      }
    });
    return Array.from(set).sort();
  },
};
