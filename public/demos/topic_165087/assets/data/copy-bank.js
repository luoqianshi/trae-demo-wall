/* ============================================================
   Drop Snacks · V6 Copy Bank
   唯一来源: Drop_Snacks_V6_情绪空间文案库_v1.0.docx
   178 条生产级文案，ID 稳定，不得重新编号
   ============================================================ */
(function(){
  "use strict";

  var LOCALE = "zh-CN";
  var STATUS = "production";
  var VERSION = "1.0";

  function e(id, text, type, tags, tone, bank, role){
    return {
      id: id,
      text: text,
      type: type,
      tags: tags,
      tone: tone,
      locale: LOCALE,
      status: STATUS,
      version: VERSION,
      bank: bank,
      role: role
    };
  }

  /* 角色分配：
     A-I = primary, J = life_prompt, K = afterglow, L = echo_intro */

  var entries = [
    /* ===== A. 通用结语 (16) ===== */
    e("END-GEN-001","这一刻已经结束，不必再替它延长。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-002","真正想要的那部分，也许已经发生了。","推测",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-003","你没有否定刚才的快乐，只是决定停在这里。","承认",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-004","这一次，不需要证明什么。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-005","它可以留在这一刻，不必跟你走进接下来的生活。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-006","已经足够了，就让\u201c足够\u201d成为完整的答案。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-007","你只是结束了一件事，不是在定义自己。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-008","不继续，也是一种清楚。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-009","现在可以把注意力还给别的事情了。","邀请",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-010","这次选择不需要被夸奖，它只需要真正结束。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-011","你已经做完了当下能做的部分。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-012","有些满足适合留下记忆，不必留下全部。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-013","到这里，已经是一种完整。","陈述",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-014","不必立刻轻松，结束也可以慢一点发生。","承认",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-015","这不会影响你的长期计划。","安定",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),
    e("END-GEN-016","最后，总要留下点什么——哪怕只是更清楚自己想要什么。","收束",["choice:any","tone:calm/warm","stage:complete"],"calm/warm","A","primary"),

    /* ===== B. 选择吃掉 (12) ===== */
    e("END-EAT-001","它真的很好吃，我理解的。","承认",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-002","想吃，是一条真实的信息。","承认",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-003","你选择了它，也可以不附带解释。","陈述",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-004","这一次的满足，不需要被审判。","安定",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-005","如果它仍然值得，那就认真地享受它。","邀请",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-006","吃掉不是失败，草率地忽略感受才是。","对照",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-007","你选择继续，也仍然保有下一次选择。","安定",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-008","这一次不会改写你的长期计划。","安定",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-009","满足发生了，就让它被好好感受。","邀请",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-010","吃完以后，你愿意看看它是否真的和想象中一样吗？","反问",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-011","也许你需要的不是克制，而是更诚实地吃这一份。","推测",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),
    e("END-EAT-012","现在先照顾真实的需要，剩下的以后再谈。","照顾",["choice:eat","avoid:shame","tone:warm/direct"],"warm/direct","B","primary"),

    /* ===== C. 完成处理 / 丢掉 (16) ===== */
    e("END-DROP-001","你结束的是剩下的部分，不是刚才的快乐。","陈述",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-002","花掉的钱已经发生了，不必再用身体把它补回来。","现实承认",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-003","不再想要，本身就是足够真实的信息。","陈述",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-004","它完成了那一刻的作用，现在可以离开了。","陈述",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-005","你放下的，也许是\u201c买了就必须承受完\u201d的惯性。","推测",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-006","这次处理有代价，但继续也并非没有代价。","权衡",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-007","浪费感可以存在，选择仍然可以结束。","承认",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-008","它不必因为被买下，就一直占用今晚。","陈述",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-009","真正舍不得的，是食物，还是已经花掉的钱？","反问",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-010","如果继续留下它，只会继续占用你吗？","反问",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-011","处理掉它，不代表否定当初为什么买。","安定",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-012","这不是最完美的答案，只是此刻更轻的代价。","权衡",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-013","你可以承认损失，也可以拒绝继续扩大损失。","陈述",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-014","让它停在这里，不需要再写一份辩护。","收束",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-015","有些东西被结束以后，才会真正失去重量。","隐喻",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),
    e("END-DROP-016","现在，桌面、冰箱或今晚都可以空出一点位置。","生活展开",["choice:drop","feeling:waste/dont_want","tone:calm/direct"],"calm/direct","C","primary"),

    /* ===== D. 保存 (12) ===== */
    e("END-SAVE-001","保存不是拖延，只要你知道下一次什么时候再决定。","澄清",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-002","今晚不需要回答所有问题。","安定",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-003","把它留到更合适的时候，也是一种结束。","陈述",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-004","你没有拒绝它，只是没有把现在交给它。","陈述",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-005","这次先保存，让下一次选择保持清楚。","邀请",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-006","如果明天还想要，那会是明天的新选择。","时间重置",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-007","保留食物，不必同时保留纠结。","安定",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-008","给它一个明确的位置，也给自己一个明确的暂停。","邀请",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-009","保存以后，你还愿意在合适的时间重新看它一眼吗？","反问",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-010","这份满足可以晚一点，不必抢占现在。","陈述",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-011","最均衡的解决办法，有时只是先把决定放到正确的时间。","权衡",["choice:save","tone:calm","followup:later"],"calm","D","primary"),
    e("END-SAVE-012","今天先到这里，下一次不需要从内疚开始。","收束",["choice:save","tone:calm","followup:later"],"calm","D","primary"),

    /* ===== E. 分享 / 分装 (12) ===== */
    e("END-SHARE-001","把它分出去，也把负担分轻了一点。","陈述",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-002","分享不是转移问题，而是让价值继续流动。","澄清",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-003","你不必独自承担一整份。","安定",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-004","这次的满足，可以被分成更合适的大小。","陈述",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-005","有人接住了剩下的部分，你也可以结束了。","陈述",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-006","让它去到真正还想要的人那里。","邀请",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-007","分装以后，选择会比包装更小、更清楚。","陈述",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-008","你保留了想要的，也没有让剩下的失去去处。","权衡",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-009","这是最均衡的解决办法。","肯定",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-010","你愿意把它留给谁，或者留到什么场景？","反问",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-011","不是所有拥有，都要由一个人完成。","陈述",["choice:share","tone:warm","social:true"],"warm","E","primary"),
    e("END-SHARE-012","这一次，关系比\u201c吃完\u201d更有价值。","关系",["choice:share","tone:warm","social:true"],"warm","E","primary"),

    /* ===== F. 替代选择 (12) ===== */
    e("END-SUB-001","你没有留下空白，只是换了一种更合适的回应。","陈述",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-002","真正想要的，也许是冷、甜、脆，或短暂离开当下。","推测",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-003","替代不是惩罚，它应该真的能接住你的需要。","澄清",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-004","新的选择，有没有让今晚更轻松一点？","反问",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-005","如果只是换成另一种勉强，那也值得重新考虑。","提醒",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-006","水、热茶、正餐、散步或休息，哪一个更接近现在的需要？","反问",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-007","你替换的不是食品，而是处理这份感受的方法。","陈述",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-008","这一次的替代，不需要成为长期规则。","安定",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-009","如果新的选择更舒服，就让它成为一次可记住的经验。","邀请",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-010","没有找到替代也没关系，结束本身已经发生。","安定",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-011","也许你想要的不是另一份食物，而是换一个场景。","推测",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),
    e("END-SUB-012","先看看新的选择是不是真的有效，再决定要不要记住它。","邀请",["choice:substitute","tone:curious","afterglow:important"],"curious","F","primary"),

    /* ===== G. 食品性质与分量 (24) ===== */
    e("END-PROP-001","这份量本来就很有存在感，停在这里也很完整。","分量",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-002","包装很大，不代表一次必须承担全部。","分量",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-003","剩下的不多，但\u201c吃完\u201d也不是唯一结局。","分量",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-004","已经吃掉大半，真正想要的部分可能已经完成。","分量",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-005","糖、油或能量只是背景信息，不是对你的判词。","边界",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-006","这是一份高能量的食物，所以系统更愿意让决定慢一点。","能量",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-007","它带来的满足很直接，后面的惯性也可能更长。","惯性",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-008","味道很重，选择不必也跟着变重。","隐喻",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-009","咖啡因会把今晚带得更远，你还想让它继续吗？","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-010","现在接近夜晚，身体和计划都值得被一起考虑。","时间",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-011","它已经不再冰、不再脆或不再新鲜，你舍不得的还是味道吗？","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-012","口感已经变化，继续保留的理由也可以重新变化。","变化",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-013","这件食物很容易保存，今晚不需要把决定做满。","保存",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-014","它不适合久放，选择可以更直接，但不必更急躁。","时效",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-015","这是一份庆祝或奖励，它已经完成了纪念的作用吗？","场景",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-016","昂贵让人更难放下，但价格不会让剩下的部分更好吃。","价格",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-017","它和某段记忆连在一起，所以这次选择可能不只是关于食物。","记忆",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-018","它很稀有，也可以被认真保存，而不是被匆忙吃完。","保存",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-019","甜味已经给过回应，剩下的还在回应什么？","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-020","脆感过去以后，你还在期待同一种满足吗？","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-021","冰冷、气泡或香味消失后，想要也可能已经换了对象。","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-022","如果这只是工作间隙的惯性，真正需要的会不会是离开座位？","反问",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-023","它不是必须摄入的东西，但你的感受仍然值得认真对待。","边界",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),
    e("END-PROP-024","系统只知道一个大致范围，最后的判断仍然在你手里。","不确定性",["food_property:*","uncertainty:allow","tone:contextual"],"contextual","G","primary"),

    /* ===== H. 可能存在真实饥饿或必要摄入 (10) ===== */
    e("END-NEED-001","如果身体还在需要，先照顾饥饿，再决定剩下的。","照顾",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-002","这可能不是一场关于克制的选择，而是一场关于需要的确认。","澄清",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-003","你已经很久没有好好吃东西了吗？","反问",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-004","先分清\u201c想要一点安慰\u201d和\u201c身体真的需要能量\u201d，不用急着选。","邀请",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-005","如果它承担了正餐的一部分，系统不应该催你结束。","边界",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-006","身体的需要不必经过道德审核。","安定",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-007","不确定时，可以先吃一小部分，再重新感受。","建议",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-008","现在需要的是食物、休息，还是离开压力源？","反问",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-009","如果你感到头晕、虚弱或明显不适，请先照顾身体，而不是完成仪式。","安全提示",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),
    e("END-NEED-010","这一次，最重要的不是少吃，而是不要把真实需要误认成失败。","原则",["need:likely/uncertain","safety:high","never_push_drop"],"calm/warm","H","primary"),

    /* ===== I. 长期计划与非灾难化 (12) ===== */
    e("END-LONG-001","一次选择不会决定长期结果。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-002","长期计划由很多次真实选择组成，不由一次完美表现组成。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-003","这不会影响你的长期计划。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-004","今天发生的事，可以只是今天发生的事。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-005","你不需要通过补偿，把这次选择变得更\u201c正确\u201d。","边界",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-006","下一顿饭不需要为这一刻承担责任。","边界",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-007","明天不必重新开始，你本来就没有离开。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-008","长期变化更像方向，不像判决。","隐喻",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-009","如果这次不理想，也不需要把它扩大成一个故事。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-010","一个晚上不会推翻你已经建立的东西。","安定",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-011","真正可持续的选择，不要求每次都像标准答案。","原则",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),
    e("END-LONG-012","这一次已经过去，长期计划仍然在原来的路上。","收束",["history:long_term","tone:reassuring","avoid:compensation"],"reassuring","I","primary"),

    /* ===== J. 生活重新展开 (20) — life_prompt ===== */
    e("END-LIFE-001","要不要陪伴家人看场电影？","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-002","继续去散散步？","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-003","现在可以把手腾出来，去做刚才被打断的事。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-004","窗外、房间和今晚，都比这件食品更大。","空间",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-005","去洗个澡，或者只是换一个位置坐坐？","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-006","要不要回到那本书、那段音乐或那场聊天？","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-007","给家人发条消息，也许比继续盯着它更值得。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-008","如果夜已经很深，睡觉也可以是下一步。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-009","去倒杯水，然后让这件事留在这里。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-010","你可以继续工作，但不必把纠结也带回去。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-011","现在想把注意力交给谁，或者交给什么？","反问",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-012","出去看看风，哪怕只走五分钟。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-013","回到生活，不需要一个宏大的计划。","安定",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-014","也许下一步只是把桌面收干净。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-015","这件事结束以后，今晚还剩下很多可能。","展开",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-016","去做一件和食物完全无关的小事。","邀请",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-017","如果什么都不想做，也可以安静地待一会儿。","安定",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-018","现在，屏幕可以变小，生活可以重新变大。","品牌主句",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-019","它已经不在画面中央了。","隐喻",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),
    e("END-LIFE-020","结束之后，不一定要庆祝；重新生活就够了。","收束",["life_prompt:true","max:1","tone:inviting"],"inviting","J","life_prompt"),

    /* ===== K. 余波回访 (22) — afterglow ===== */
    e("AFTER-001","一个小时过去了，它还在占用你吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-002","处理之后，今晚有没有轻一点？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-003","你后来还想起它吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-004","这次选择带来了轻松，还是新的负担？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-005","处理掉它，有没有让你觉得浪费？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-006","保存以后，你后来还想要它吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-007","吃完以后，满足感和原本期待的一样吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-008","分享以后，这件食品还留在你的注意力里吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-009","新的替代真的接住了当时的需要吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-010","你后来选择了别的食物、饮料，还是没有替代？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-011","现在更接近：轻松、后悔、无感，还是说不清？","选择题",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-012","如果再回到那个时刻，你会做同样的选择吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-013","浪费感后来变轻了吗？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-014","你真正放下的是食物，还是那份\u201c必须吃完\u201d的压力？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-015","这件食品后来有没有重新回到你面前？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-016","你是否进行了更好的饮食替代？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-017","这次处理有没有带来额外负担？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-018","今晚是否轻松了些？","反问",["stage:afterglow","delay:dynamic","one_question_only"],"question","K","afterglow"),
    e("AFTER-019","不用现在回答。下次打开时，再看看也可以。","安定",["stage:afterglow","delay:dynamic","one_question_only"],"calm","K","afterglow"),
    e("AFTER-020","想留下一句话给未来遇到同样情况的自己吗？","邀请",["stage:afterglow","delay:dynamic","one_question_only"],"inviting","K","afterglow"),
    e("AFTER-021","这次没有明显变化，也是一条有效反馈。","承认",["stage:afterglow","delay:dynamic","one_question_only"],"calm","K","afterglow"),
    e("AFTER-022","你愿意让系统记住，哪一句话对你有帮助吗？","邀请",["stage:afterglow","delay:dynamic","one_question_only"],"inviting","K","afterglow"),

    /* ===== L. 同类回声引导 (10) — echo_intro ===== */
    e("ECHO-001","先听见自己的答案，再看看别人留下了什么。","顺序",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-002","和你处理同一件食品的人，也经历过不同的余波。","说明",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-003","这不是标准答案，只是一些匿名回声。","边界",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-004","有人轻松了，有人后悔了，也有人很快忘了。","承认",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-005","相同食品，不一定意味着相同需要。","边界",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-006","更相似的，可能是你们当时都舍不得浪费。","匹配",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-007","这些经验不会替你证明刚才的选择。","边界",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-008","你可以读，也可以直接离开。","退出",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro"),
    e("ECHO-009","想把这一句话，匿名留给以后遇到同样情况的人吗？","邀请",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"inviting","L","echo_intro"),
    e("ECHO-010","公开的是经验，不是身份；共享的是余波，不是轨迹。","原则",["stage:shared_echoes","after:self_reflection","no_social_pressure"],"calm","L","echo_intro")
  ];

  /* ----- 自动校验 ----- */
  var idMap = {};
  var dupIds = [];
  var emptyTexts = [];
  var missingFields = [];
  var requiredFields = ["id","text","type","tags","tone","locale","status","version","bank","role"];

  entries.forEach(function(entry){
    if(idMap[entry.id]) dupIds.push(entry.id);
    idMap[entry.id] = true;
    if(!entry.text || entry.text.trim()==="") emptyTexts.push(entry.id);
    requiredFields.forEach(function(f){
      if(entry[f]===undefined || entry[f]===null) missingFields.push(entry.id+":"+f);
    });
  });

  var bankCounts = {};
  var prefixCounts = {};
  entries.forEach(function(entry){
    bankCounts[entry.bank] = (bankCounts[entry.bank]||0)+1;
    var prefix = entry.id.replace(/-\d+$/,"");
    prefixCounts[prefix] = (prefixCounts[prefix]||0)+1;
  });

  window.DropSnacksCopyBank = {
    version: "1.0",
    sourceDocument: "Drop_Snacks_V6_情绪空间文案库_v1.0.docx",
    entries: entries,
    manifest: {
      totalEntries: entries.length,
      uniqueIds: Object.keys(idMap).length,
      duplicateIds: dupIds,
      emptyTexts: emptyTexts,
      missingRequiredFields: missingFields,
      bankCounts: bankCounts,
      prefixCounts: prefixCounts,
      firstId: entries[0].id,
      lastId: entries[entries.length-1].id,
      roles: {
        primary: entries.filter(function(e){return e.role==="primary";}).length,
        life_prompt: entries.filter(function(e){return e.role==="life_prompt";}).length,
        afterglow: entries.filter(function(e){return e.role==="afterglow";}).length,
        echo_intro: entries.filter(function(e){return e.role==="echo_intro";}).length
      }
    },
    /* 工具方法 */
    getById: function(id){
      return entries.find(function(e){return e.id===id;}) || null;
    },
    getByRole: function(role){
      return entries.filter(function(e){return e.role===role;});
    },
    getByBank: function(bank){
      return entries.filter(function(e){return e.bank===bank;});
    }
  };
})();
