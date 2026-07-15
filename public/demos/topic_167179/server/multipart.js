const fs = require('fs');
const path = require('path');

/**
 * 极简 multipart/form-data 解析器
 * - 适合本 MVP 单文件上传场景
 * - 文件内容写入磁盘，字段以字符串返回
 * - 限制单请求 2GB（可根据服务器内存/磁盘调整）
 */
const MAX_SIZE = 2 * 1024 * 1024 * 1024;

function parseMultipart(req, uploadDir) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const match = contentType.match(/boundary=([^;]+)/i);
    if (!match) {
      return reject(new Error('请求缺少 multipart boundary'));
    }
    const boundary = Buffer.from('--' + match[1].trim().replace(/^"|"$/g, ''));

    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_SIZE) {
        return reject(new Error(`上传文件过大，限制 ${MAX_SIZE / 1024 / 1024 / 1024}GB。若视频过大，建议先导出音频再上传。`));
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const result = parseBuffer(Buffer.concat(chunks), boundary, uploadDir);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', reject);
    req.on('aborted', () => reject(new Error('请求被客户端中断')));
    req.on('close', () => {
      if (!req.complete) reject(new Error('请求连接已关闭'));
    });
  });
}

function parseBuffer(buf, boundary, uploadDir) {
  const fields = {};
  const files = {};
  fs.mkdirSync(uploadDir, { recursive: true });

  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    pos += boundary.length;
    // 结束边界 --boundary--
    if (buf.slice(pos, pos + 2).equals(Buffer.from('--'))) break;
    // 跳过 CRLF
    if (buf.slice(pos, pos + 2).equals(Buffer.from('\r\n'))) pos += 2;

    const next = buf.indexOf(boundary, pos);
    const part = next === -1 ? buf.slice(pos) : buf.slice(pos, next);

    const sep = part.indexOf('\r\n\r\n');
    if (sep === -1) {
      pos = next;
      continue;
    }

    const headerText = part.slice(0, sep).toString('utf8');
    let body = part.slice(sep + 4);
    // 去除 part 末尾的 CRLF
    if (body.length >= 2 && body.slice(body.length - 2).equals(Buffer.from('\r\n'))) {
      body = body.slice(0, body.length - 2);
    }

    const dispMatch = headerText.match(
      /Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i
    );
    if (!dispMatch) {
      pos = next;
      continue;
    }

    const name = dispMatch[1];
    const filename = dispMatch[2] || null;

    if (filename !== null) {
      const safeName = `${Date.now()}_${path.basename(filename || 'upload')}`;
      const savePath = path.join(uploadDir, safeName);
      fs.writeFileSync(savePath, body);
      files[name] = {
        filename: filename || safeName,
        path: savePath,
        size: body.length,
      };
    } else {
      fields[name] = body.toString('utf8');
    }

    pos = next;
  }

  return { fields, files };
}

module.exports = { parseMultipart };
