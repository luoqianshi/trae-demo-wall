include!("solution.rs");

// 功能测试：需要替换的经典用例必须得到最小操作数。
#[test]
fn test_classic_distances() {
    // kitten -> sitting：替换 k->s, e->i, 末尾插入 g，共 3
    assert_eq!(edit_distance("kitten", "sitting"), 3);
    // sunday -> saturday：经典答案 3
    assert_eq!(edit_distance("sunday", "saturday"), 3);
    // 单字符替换：abc -> abd，仅一步替换
    assert_eq!(edit_distance("abc", "abd"), 1);
}

#[test]
fn test_substitution_beats_delete_insert() {
    // 等长且每位都不同：必须全用替换，距离 = 长度，而非 2*长度
    assert_eq!(edit_distance("abc", "xyz"), 3);
    assert_eq!(edit_distance("aaaa", "bbbb"), 4);
}
