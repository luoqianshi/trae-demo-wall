import { Node } from '@tiptap/core'
import katex from 'katex'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    latexMath: {
      /** 插入行内数学公式 */
      insertInlineMath: () => ReturnType
      /** 插入块级数学公式 */
      insertBlockMath: () => ReturnType
    }
  }
}

/**
 * TipTap LaTeX 数学公式扩展
 * 支持 $...$ 行内公式和 $$...$$ 块级公式
 * 使用 KaTeX 渲染
 */
export const LatexMath = Node.create({
  name: 'latexMath',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      /** 公式类型: inline | block */
      display: {
        default: 'inline',
        parseHTML: (element) => element.getAttribute('data-display') || 'inline',
        renderHTML: (attributes) => ({ 'data-display': attributes.display }),
      },
      /** LaTeX 源码 */
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({ 'data-latex': attributes.latex }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="latex-math"]',
      },
      {
        tag: 'div[data-type="latex-math-block"]',
      },
    ]
  },

  renderHTML({ node }) {
    const { latex, display } = node.attrs
    const isBlock = display === 'block'

    try {
      const html = katex.renderToString(latex || '', {
        throwOnError: false,
        displayMode: isBlock,
        trust: false,
      })

      if (isBlock) {
        return [
          'div',
          {
            'data-type': 'latex-math-block',
            'data-latex': latex,
            'data-display': 'block',
            class: 'latex-math-block',
          },
          html,
        ]
      }

      return [
        'span',
        {
          'data-type': 'latex-math',
          'data-latex': latex,
          'data-display': 'inline',
          class: 'latex-math',
        },
        html,
      ]
    } catch {
      // 渲染失败时显示原始 LaTeX
      if (isBlock) {
        return [
          'div',
          {
            'data-type': 'latex-math-block',
            'data-latex': latex,
            'data-display': 'block',
            class: 'latex-math-block latex-math-error',
          },
          `$$${latex}$$`,
        ]
      }
      return [
        'span',
        {
          'data-type': 'latex-math',
          'data-latex': latex,
          'data-display': 'inline',
          class: 'latex-math latex-math-error',
        },
        `$${latex}$`,
      ]
    }
  },

  addCommands() {
    return {
      insertInlineMath:
        () =>
        ({ chain }) => {
          const latex = 'x^2 + y^2 = r^2'
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { latex, display: 'inline' },
            })
            .run()
        },
      insertBlockMath:
        () =>
        ({ chain }) => {
          const latex = '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { latex, display: 'block' },
            })
            .run()
        },
    }
  },
})
