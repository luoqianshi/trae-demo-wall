Component({
  properties: {
    content: {
      type: String,
      value: ''
    },
    isFallback: {
      type: Boolean,
      value: false
    },
    editable: {
      type: Boolean,
      value: true
    }
  },

  data: {
    isEditing: false,
    editContent: '',
    richNodes: []
  },

  observers: {
    'content': function(content) {
      if (content) {
        this.parseContent(content);
      } else {
        this.setData({ richNodes: [] });
      }
    }
  },

  lifetimes: {
    attached() {
      if (this.data.content) {
        this.parseContent(this.data.content);
      }
    }
  },

  methods: {
    /**
     * 将纯文本内容解析为 rich-text 支持的节点
     * 支持换行渲染，**加粗**标记
     */
    parseContent(text) {
      if (!text) {
        this.setData({ richNodes: [] });
        return;
      }
      
      const lines = text.split('\n');
      let nodes = [];
      
      lines.forEach((line, index) => {
        // 解析行内的 **加粗** 标记
        const inlineNodes = this.parseInline(line);
        nodes = nodes.concat(inlineNodes);
        
        // 非最后一行添加换行
        if (index < lines.length - 1) {
          nodes.push({ type: 'text', text: '\n' });
        }
      });
      
      this.setData({ richNodes: nodes });
    },

    /**
     * 解析行内 **text** 为加粗节点
     */
    parseInline(line) {
      const nodes = [];
      const boldRegex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // 匹配前的普通文本
        if (match.index > lastIndex) {
          nodes.push({ type: 'text', text: line.substring(lastIndex, match.index) });
        }
        // 加粗文本
        nodes.push({
          name: 'span',
          attrs: {
            style: 'font-weight: bold; color: #1A1A1A;'
          },
          children: [{ type: 'text', text: match[1] }]
        });
        lastIndex = match.index + match[0].length;
      }
      
      // 剩余普通文本
      if (lastIndex < line.length) {
        nodes.push({ type: 'text', text: line.substring(lastIndex) });
      }
      
      return nodes;
    },

    onCopy() {
      if (!this.data.content) return;
      
      wx.setClipboardData({
        data: this.data.content,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    },

    onRegenerate() {
      this.triggerEvent('regenerate');
    },

    onEdit() {
      this.setData({
        isEditing: true,
        editContent: this.data.content
      });
    },

    onEditInput(e) {
      this.setData({ editContent: e.detail.value });
    },

    onSaveEdit() {
      this.setData({ isEditing: false });
      this.triggerEvent('edit', { content: this.data.editContent });
    },

    onCancelEdit() {
      this.setData({ isEditing: false });
    }
  }
});
