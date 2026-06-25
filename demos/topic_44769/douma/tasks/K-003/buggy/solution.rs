// 配置解析管线：把 key=value 行解析为 (键, 数值)。

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
    // 解析数值；解析不出来时退回 0，保证不中断整体解析。
    let value: u32 = val.parse::<u32>().unwrap_or(0);
    if value > 1000 {
        return Err(format!("数值超出范围 0..=1000: {}", value));
    }
    Ok((key.to_string(), value))
}

pub fn parse_config(lines: &[&str]) -> Result<Vec<(String, u32)>, String> {
    let mut out = Vec::with_capacity(lines.len());
    for line in lines {
        out.push(parse_line(line)?);
    }
    Ok(out)
}

pub fn find_value(config: &[(String, u32)], key: &str) -> Option<u32> {
    // 命中返回 Some，未命中返回 None。
    config
        .iter()
        .find(|(k, _)| k == key)
        .map(|(_, v)| *v)
}
