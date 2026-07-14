/**
 * 数据表格模块
 * 实现可滚动、可排序、可拖拽列、可隐藏列功能
 */

class DataTable {
  constructor(tableId, headerRowId, bodyId) {
    this.table = document.getElementById(tableId);
    this.headerRow = document.getElementById(headerRowId);
    this.tbody = document.getElementById(bodyId);
    this.data = [];
    this.columns = [
      { key: 'date', label: '日期', visible: true, sortable: true },
      { key: 'salesperson_name', label: '销售员', visible: true, sortable: true },
      { key: 'customer_name', label: '客户', visible: true, sortable: true },
      { key: 'customer_industry', label: '行业', visible: true, sortable: true },
      { key: 'region_province', label: '省份', visible: true, sortable: true },
      { key: 'region_city', label: '城市', visible: true, sortable: true },
      { key: 'product_name', label: '商品', visible: true, sortable: true },
      { key: 'product_category', label: '品类', visible: true, sortable: true },
      { key: 'quantity', label: '数量', visible: true, sortable: true, isNumber: true },
      { key: 'amount', label: '金额', visible: true, sortable: true, isNumber: true, isAmount: true }
    ];
    this.sortState = { column: null, direction: 'asc' };
    this.columnOrder = this.columns.map((_, i) => i);
    this.draggedColumn = null;
  }

  setData(data) {
    this.data = data;
    this.render();
  }

  render() {
    this.renderHeader();
    this.renderBody();
    this.initColumnToggle();
  }

  renderHeader() {
    this.headerRow.innerHTML = '';
    
    this.columnOrder.forEach(colIndex => {
      const col = this.columns[colIndex];
      if (!col.visible) return;

      const th = document.createElement('th');
      th.textContent = col.label;
      th.dataset.column = col.key;
      th.dataset.colIndex = colIndex;
      
      if (col.sortable) {
        th.classList.add('sortable', 'draggable');
        th.addEventListener('click', (e) => {
          if (!this.draggedColumn) {
            this.sort(col.key);
          }
        });
        
        // 拖拽功能
        th.draggable = true;
        th.addEventListener('dragstart', (e) => this.onDragStart(e, colIndex));
        th.addEventListener('dragover', (e) => this.onDragOver(e));
        th.addEventListener('dragenter', (e) => this.onDragEnter(e, colIndex));
        th.addEventListener('dragleave', (e) => this.onDragLeave(e));
        th.addEventListener('drop', (e) => this.onDrop(e, colIndex));
        th.addEventListener('dragend', (e) => this.onDragEnd(e));
      }

      if (col.isAmount) {
        th.classList.add('amount');
      }

      // 更新排序状态
      if (this.sortState.column === col.key) {
        th.classList.add(this.sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }

      this.headerRow.appendChild(th);
    });
  }

  renderBody() {
    this.tbody.innerHTML = '';
    
    this.data.forEach(row => {
      const tr = document.createElement('tr');
      
      this.columnOrder.forEach(colIndex => {
        const col = this.columns[colIndex];
        if (!col.visible) return;

        const td = document.createElement('td');
        const value = row[col.key];
        
        if (col.isAmount) {
          td.textContent = '¥' + this.formatAmount(value);
          td.classList.add('amount');
        } else if (col.isNumber) {
          td.textContent = value.toLocaleString();
        } else {
          td.textContent = value;
        }
        
        tr.appendChild(td);
      });
      
      this.tbody.appendChild(tr);
    });
  }

  sort(columnKey) {
    if (this.sortState.column === columnKey) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState.column = columnKey;
      this.sortState.direction = 'asc';
    }

    const col = this.columns.find(c => c.key === columnKey);
    const isNumber = col && col.isNumber;

    this.data.sort((a, b) => {
      let valA = a[columnKey];
      let valB = b[columnKey];

      if (isNumber) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '');
        valB = String(valB || '');
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      if (valA < valB) comparison = -1;

      return this.sortState.direction === 'asc' ? comparison : -comparison;
    });

    this.renderHeader();
    this.renderBody();
  }

  formatAmount(value) {
    if (value >= 100000000) return (value / 100000000).toFixed(2) + '亿';
    if (value >= 10000) return (value / 10000).toFixed(2) + '万';
    return value.toFixed(2);
  }

  // 列拖拽功能
  onDragStart(e, colIndex) {
    this.draggedColumn = colIndex;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  onDragEnter(e, colIndex) {
    if (this.draggedColumn !== null && this.draggedColumn !== colIndex) {
      e.target.classList.add('drag-over');
    }
  }

  onDragLeave(e) {
    e.target.classList.remove('drag-over');
  }

  onDrop(e, targetColIndex) {
    e.preventDefault();
    
    if (this.draggedColumn !== null && this.draggedColumn !== targetColIndex) {
      // 交换列顺序
      const draggedPos = this.columnOrder.indexOf(this.draggedColumn);
      const targetPos = this.columnOrder.indexOf(targetColIndex);
      
      this.columnOrder.splice(draggedPos, 1);
      this.columnOrder.splice(targetPos, 0, this.draggedColumn);
      
      this.renderHeader();
      this.renderBody();
    }
    
    e.target.classList.remove('drag-over');
  }

  onDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedColumn = null;
    
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }

  // 列显示/隐藏功能
  initColumnToggle() {
    const btnToggle = document.getElementById('btn-column-toggle');
    const dropdown = document.getElementById('column-dropdown');
    
    if (!btnToggle || !dropdown) return;
    
    // 生成列选项
    dropdown.innerHTML = '';
    this.columns.forEach((col, index) => {
      const item = document.createElement('div');
      item.className = 'column-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `col-${index}`;
      checkbox.checked = col.visible;
      checkbox.addEventListener('change', () => {
        col.visible = checkbox.checked;
        this.renderHeader();
        this.renderBody();
      });
      
      const label = document.createElement('label');
      label.htmlFor = `col-${index}`;
      label.textContent = col.label;
      
      item.appendChild(checkbox);
      item.appendChild(label);
      dropdown.appendChild(item);
    });
    
    // 切换下拉菜单
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== btnToggle) {
        dropdown.classList.remove('show');
      }
    });
  }
}

window.DataTable = DataTable;
