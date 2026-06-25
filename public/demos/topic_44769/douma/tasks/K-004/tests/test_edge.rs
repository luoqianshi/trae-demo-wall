include!("solution.rs");

// 边界测试：放大替换转移缺失——混合替换、对称性、单点差异。
#[test]
fn test_substitution_required_cases() {
    // 同位置不同字符，只能靠替换：每个不同位置贡献 1
    assert_eq!(edit_distance("flaw", "lawn"), 2); // flaw→lawn：删 f + 末尾插 n，共 2 步
    // 单字符替换，绝不能算成 2（删+插）
    assert_eq!(edit_distance("a", "b"), 1);
    assert_eq!(edit_distance("cat", "cut"), 1); // 仅 a->u
    assert_eq!(edit_distance("cat", "dog"), 3); // 三处全替换
}

#[test]
fn test_symmetry() {
    // 代价对称：交换参数结果相同
    let pairs = [
        ("kitten", "sitting"),
        ("abc", "xyz"),
        ("sunday", "saturday"),
        ("intention", "execution"),
    ];
    for (a, b) in pairs.iter() {
        assert_eq!(
            edit_distance(a, b),
            edit_distance(b, a),
            "对称性失败：{} <-> {}",
            a,
            b
        );
    }
    // 经典 intention->execution = 5
    assert_eq!(edit_distance("intention", "execution"), 5);
}

#[test]
fn test_mixed_unicode_and_boundary() {
    // 含多字节字符，按字符计数
    assert_eq!(edit_distance("café", "cafe"), 1); // é -> e 一步替换
    assert_eq!(edit_distance("αβγ", "αxγ"), 1);   // 中间替换
    // 一端为空
    assert_eq!(edit_distance("abc", ""), 3);
}
