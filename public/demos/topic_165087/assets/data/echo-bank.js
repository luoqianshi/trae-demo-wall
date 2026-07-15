/* ============================================================
   Drop Snacks · V6D-C Echo Bank
   经过审核的本地匿名经验示例 (reviewed example)
   ------------------------------------------------------------
   这不是：
   - 真实用户投稿
   - 真实社区
   - 网络数据库
   - 热门内容 / 用户统计 / 实时数据
   ------------------------------------------------------------
   全部 24 条为 reviewed_example，locale=zh-CN，status=reviewed
   每条 18–52 字，第一人称，克制、匿名，无身份/健康/评价信息
   eat / drop / save / share 各至少 6 条可用
   ============================================================ */
(function(){
  "use strict";

  var LOCALE = "zh-CN";
  var STATUS = "reviewed";
  var SOURCE_TYPE = "reviewed_example";
  var VERSION = 1;

  function e(id, text, choiceTypes, foodCategories, feelings, purchaseReasons, timeContexts){
    return {
      id: id,
      text: text,
      choiceTypes: choiceTypes || [],
      foodCategories: foodCategories || [],
      feelings: feelings || [],
      purchaseReasons: purchaseReasons || [],
      timeContexts: timeContexts || [],
      locale: LOCALE,
      status: STATUS,
      sourceType: SOURCE_TYPE,
      version: VERSION
    };
  }

  var entries = [
    /* ===== eat (6) ===== */
    e("ECHO-R001","吃完那包薯片，我才发现自己其实只是想听那个脆响。",
      ["eat"],["薯片"],["want"],[],["late_night"]),
    e("ECHO-R002","喝完整瓶可乐，满足感没有想象中持久，但当时确实想要。",
      ["eat"],["含糖饮料"],["want"],["顺手买"],[]),
    e("ECHO-R003","巧克力冰淇淋化在嘴里那一刻，我知道今晚不需要再想它了。",
      ["eat"],["冰淇淋"],["want"],[],["evening"]),
    e("ECHO-R004","我把它吃完了，没替它找理由，也没替自己找借口。",
      ["eat"],[],["hesitate"],[],[]),
    e("ECHO-R005","半夜那份夜宵，吃完反而更清醒了一点。",
      ["eat"],["夜宵"],["want"],[],["late_night"]),
    e("ECHO-R006","聚会剩下的那块蛋糕，我第二天早上一个人吃掉了。",
      ["eat"],["甜品","聚会剩余"],[],["聚会剩余"],["morning"]),

    /* ===== drop (6) ===== */
    e("ECHO-R007","把剩下的奶茶倒掉时，我松了一口气，而不是心疼。",
      ["drop"],["奶茶"],["dont_want"],[],["evening"]),
    e("ECHO-R008","处理掉那半包薯片后，桌面空了一块，注意力也跟着松开。",
      ["drop"],["薯片"],["waste"],[],[]),
    e("ECHO-R009","我把开封两天的甜品扔了，它已经完成了它的任务。",
      ["drop"],["甜品"],["dont_want"],[],[]),
    e("ECHO-R010","倒掉那杯没喝完的饮料，今晚好像轻了一些。",
      ["drop"],["含糖饮料"],["dont_want"],[],["late_night"]),
    e("ECHO-R011","大包装吃到一半我停了，剩下的部分没有继续留着。",
      ["drop"],["大包装"],["hesitate"],[],[]),
    e("ECHO-R012","处理掉那块巧克力，比想象中容易，也没想再拿一块。",
      ["drop"],["巧克力"],["dont_want"],[],[]),

    /* ===== save (6) ===== */
    e("ECHO-R013","我把那袋薯片夹好收起来，明天再说，今晚先不想。",
      ["save"],["薯片"],["hesitate"],[],["evening"]),
    e("ECHO-R014","可乐放回冰箱，我发现不开它也没那么难。",
      ["save"],["含糖饮料"],["hesitate"],[],[]),
    e("ECHO-R015","把聚会剩余的菜分装进冰箱，给自己留了明天的份。",
      ["save","share"],["聚会剩余"],["waste"],["聚会剩余"],[]),
    e("ECHO-R016","那块蛋糕我没动，盖上盖子，等真正想吃的时刻再打开。",
      ["save"],["甜品"],["hesitate"],[],[]),
    e("ECHO-R017","冰淇淋重新放回冷冻层，它不会因为我没吃完就消失。",
      ["save"],["冰淇淋"],["hesitate"],[],[]),
    e("ECHO-R018","大包装我分成了三份，留一份在桌上，其余收起来。",
      ["save","share"],["大包装"],["hesitate"],["大包装"],[]),

    /* ===== share (6) ===== */
    e("ECHO-R019","聚会剩余的菜分给室友一半，我自己留下的一半刚好。",
      ["share"],["聚会剩余"],["waste"],["聚会剩余"],[]),
    e("ECHO-R020","那袋大包装薯片我分给同事一些，剩下的就没那么压手。",
      ["share"],["薯片","大包装"],["waste"],["大包装"],[]),
    e("ECHO-R021","把半瓶可乐让给家人，我自己倒掉杯里剩下的那点。",
      ["share","drop"],["含糖饮料"],["hesitate"],[],[]),
    e("ECHO-R022","巧克力掰成两块，一块给朋友，一块留给自己慢慢吃。",
      ["share","save"],["巧克力"],["want"],[],[]),
    e("ECHO-R023","奶茶分给旁边的人半杯，我没再续杯，刚好。",
      ["share"],["奶茶"],["hesitate"],[],[]),
    e("ECHO-R024","夜宵那份我留了一半给明天，另一半和朋友分了。",
      ["share","save"],["夜宵"],["waste"],[],["late_night"])
  ];

  window.DropSnacksEchoBank = {
    VERSION: "1.0.0",
    entries: entries,
    getAll: function(){ return entries.slice(); },
    getById: function(id){
      for(var i = 0; i < entries.length; i++){
        if(entries[i].id === id) return entries[i];
      }
      return null;
    }
  };
})();
