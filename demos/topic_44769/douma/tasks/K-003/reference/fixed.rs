// 配置解析管线：把 key=value 行解析为 (键, 数值)，任意非法都必须传播为 Err。

// 解析单行：返回 Ok((键, 值)) 或 Err(描述)。值须为 0..=1000 的非负整数。
fn parse_line(line: &str) -> Result<(String, u32), String> {
    // 必须含且仅按首个 '=' 拆分键值。
    let pos = line
        .find('=')
        .ok_or_else(|| format!("缺少 '=': {}", line))?;
    let key = line[..pos].trim();
    let val = line[pos + 1..].trim();
    if key.is_empty() {
        return Err(format!("键为空: {}", line));
    }
    // 关键：解析失败必须用 ? 传播为 Err，绝不能 unwrap_or(0) 把错误吞成默认值。
    let value: u32 = val
        .parse::<u32>()
        .map_err(|_| format!("非法数值: {}", val))?;
    if value > 1000 {
        return Err(format!("数值超出范围 0..=1000: {}", value));
    }
    Ok((key.to_string(), value))
}

pub fn parse_config(lines: &[&str]) -> Result<Vec<(String, u32)>, String> {
    let mut out = Vec::with_capacity(lines.len());
    for line in lines {
        // 任意一行非法即整体失败，错误如实上抛。
        out.push(parse_line(line)?);
    }
    Ok(out)
}

pub fn find_value(config: &[(String, u32)], key: &str) -> Option<u32> {
    // 命中返回 Some，未命中返回 None（不得用默认值掩盖）。
    config
        .iter()
        .find(|(k, _)| k == key)
        .map(|(_, v)| *v)
}
