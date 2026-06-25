// 编辑距离（Levenshtein）：插入/删除/替换三操作，求最小操作数。

pub fn edit_distance(a: &str, b: &str) -> usize {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    let (n, m) = (a.len(), b.len());

    // dp[i][j]：a 前 i 个字符变成 b 前 j 个字符的最小操作数。
    let mut dp = vec![vec![0usize; m + 1]; n + 1];

    // 边界：空串到长度 j（全插入）/ 长度 i 到空串（全删除）。
    for i in 0..=n {
        dp[i][0] = i;
    }
    for j in 0..=m {
        dp[0][j] = j;
    }

    for i in 1..=n {
        for j in 1..=m {
            if a[i - 1] == b[j - 1] {
                // 字符相等：直接沿用对角线，无需操作。
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                let delete = dp[i - 1][j] + 1; // 删除 a[i-1]
                let insert = dp[i][j - 1] + 1; // 插入 b[j-1]
                dp[i][j] = delete.min(insert);
            }
        }
    }

    dp[n][m]
}
