// 拆分 qwen 图片编辑（支持3图）.json 为单图/双图/三图三个变体
const fs = require('fs')
const path = require('path')

const SRC_PATH = 'F:/ComfyUI-aki-XZG/ComfyUI-aki-XZG/ComfyUI/user/default/workflows/00-应用案例/qwen图片编辑（支持3图）.json'
const TARGET_DIR = path.dirname(SRC_PATH)

const VARIANTS = [
  { name: 'qwen图片编辑-单图', enabledLoadImageIds: [78] },
  { name: 'qwen图片编辑-双图', enabledLoadImageIds: [78, 120] },
  { name: 'qwen图片编辑-三图', enabledLoadImageIds: [78, 120, 121] },
]

const raw = fs.readFileSync(SRC_PATH, 'utf8')

for (const variant of VARIANTS) {
  // 通过 JSON 字符串 round-trip 深拷贝（保留所有字段，包含 subgraph definitions）
  const wf = JSON.parse(raw)
  let imageCount = 0
  if (Array.isArray(wf.nodes)) {
    for (const n of wf.nodes) {
      if (n.type === 'LoadImage') {
        if (variant.enabledLoadImageIds.includes(n.id)) {
          n.mode = 0
          imageCount++
        } else {
          n.mode = 4
        }
      }
    }
  }
  // 写入工作流目录，让 scan 接口能扫描到
  const outPath = path.join(TARGET_DIR, `${variant.name}.json`)
  fs.writeFileSync(outPath, JSON.stringify(wf), 'utf8')
  console.log(`✓ ${variant.name}.json (启用 ${imageCount} 个 LoadImage)`)
}
console.log('done')
