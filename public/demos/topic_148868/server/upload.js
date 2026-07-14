/**
 * 成长漂流瓶 — 图片上传工具模块
 * 将 base64 图片保存到服务器文件系统，返回相对路径供数据库存储和前端渲染
 * 支持按子目录分类存储（如 avatar、checkin、bottle 等）
 */
const fs = require('fs'); // 引入 fs 模块，用于文件系统操作
const path = require('path'); // 引入 path 模块，用于处理文件路径

// 上传根目录（项目根目录下的 uploads 文件夹）
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads'); // 上传文件根目录

// 确保上传根目录存在
if (!fs.existsSync(UPLOAD_DIR)) { // 如果目录不存在
    fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // 递归创建目录
}

// 允许的图片 MIME 类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // 允许的图片格式

// 最大文件大小：5MB（base64 解码后的字节数）
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 保存 base64 图片到文件系统
 * @param {string} base64Data base64 编码的图片数据（含 data URI 前缀）
 * @param {string} subDir 子目录名称（可选，如 'avatar'、'checkin'、'bottle'）
 * @returns {{ success: boolean, path?: string, error?: string }}
 */
function saveImage(base64Data, subDir) {
    try {
        // 校验入参
        if (!base64Data || typeof base64Data !== 'string') { // 数据为空或非字符串
            return { success: false, error: '图片数据不能为空' }; // 返回错误
        }

        // 解析 base64 数据（格式：data:image/jpeg;base64,xxxx）
        const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/); // 正则匹配
        if (!matches) { // 格式不匹配
            return { success: false, error: '无效的图片数据格式' }; // 返回错误
        }

        const mimeType = matches[1]; // MIME 类型，如 image/jpeg
        const base64 = matches[2]; // 纯 base64 数据

        // 检查图片类型是否允许
        if (!ALLOWED_TYPES.includes(mimeType)) { // 类型不在允许列表
            return { success: false, error: '不支持的图片格式（仅支持 JPEG、PNG、GIF、WebP）' }; // 返回错误
        }

        // 将 base64 解码为 Buffer
        const buffer = Buffer.from(base64, 'base64'); // 解码

        // 检查文件大小
        if (buffer.length > MAX_SIZE) { // 超过大小限制
            return { success: false, error: '图片大小不能超过 5MB' }; // 返回错误
        }

        // 生成唯一文件名：时间戳_随机字符串.扩展名
        const ext = mimeType.split('/')[1]; // 扩展名，如 jpeg、png
        const fileName = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext; // 唯一文件名

        // 确定保存目录（支持子目录分类）
        const saveDir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR; // 保存目录
        if (!fs.existsSync(saveDir)) { // 目录不存在
            fs.mkdirSync(saveDir, { recursive: true }); // 递归创建
        }

        // 写入文件
        const filePath = path.join(saveDir, fileName); // 完整文件路径
        fs.writeFileSync(filePath, buffer); // 同步写入

        // 返回相对路径（用于数据库存储和前端访问）
        const relativePath = subDir // 有子目录
            ? '/uploads/' + subDir + '/' + fileName // 带子目录的路径
            : '/uploads/' + fileName; // 根目录路径
        return { success: true, path: relativePath }; // 返回成功和路径
    } catch (err) { // 发生异常
        console.error('保存图片失败:', err); // 记录错误
        return { success: false, error: '保存图片失败: ' + err.message }; // 返回错误
    }
}

/**
 * 删除图片文件
 * @param {string} relativePath 相对路径（如 /uploads/avatar/xxx.jpg）
 * @returns {boolean} 是否删除成功
 */
function deleteImage(relativePath) {
    try {
        if (!relativePath) return false; // 路径为空
        // 仅允许删除 uploads 目录下的文件
        if (!relativePath.startsWith('/uploads/')) return false; // 路径不合法
        const fullPath = path.join(__dirname, '..', relativePath); // 转为绝对路径
        if (fs.existsSync(fullPath)) { // 文件存在
            fs.unlinkSync(fullPath); // 删除文件
            return true; // 返回成功
        }
        return false; // 文件不存在
    } catch (err) { // 发生异常
        console.error('删除图片失败:', err); // 记录错误
        return false; // 返回失败
    }
}

module.exports = { saveImage, deleteImage }; // 导出函数
