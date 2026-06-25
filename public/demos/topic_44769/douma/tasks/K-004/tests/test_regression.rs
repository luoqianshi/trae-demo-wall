include!("solution.rs");

// 回归测试：纯插入 / 纯删除 / 相等 的干净基线（不触发替换转移）。
// 这些场景不需要替换，buggy 仍应正确，作为基线保持通过。
#[test]
fn test_pure_insert_delete_equal() {
    // 相等
    assert_eq!(edit_distance("hello", "hello"), 0);
    assert_eq!(edit_distance("", ""), 0);

    // 纯插入：空串到长度 n
    assert_eq!(edit_distance("", "abcd"), 4);
    // 纯删除：长度 n 到空串
    assert_eq!(edit_distance("abcd", ""), 4);

    // 一端是另一端的子序列前缀：纯追加/删除
    assert_eq!(edit_distance("abc", "abcde"), 2); // 追加 d,e
    assert_eq!(edit_distance("abcde", "abc"), 2); // 删除 d,e
}

#[test]
fn test_single_char_indel() {
    // 中间插入一个字符
    assert_eq!(edit_distance("ac", "abc"), 1);
    // 删除一个字符
    assert_eq!(edit_distance("abc", "ac"), 1);
}
