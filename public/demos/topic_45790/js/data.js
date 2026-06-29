/*
 * 研复通 ReproPilot —— 内置科研案例数据
 * 案例名称：MDI+GRU 第一阶段科学缝合
 *
 * 说明：
 * - 本文件为浏览器端内置数据，由 app.js + engine.js 动态渲染与审计，不依赖 fetch 读取本地 JSON。
 * - sample-data/ 目录下另存同名 JSON，供用户查看与重新导入。
 * - 案例为脱敏后的示意数据，不复制任何私人源码。
 * - 故意设置的偏差均以结构化数据表示，由 js/engine.js 的 R01–R12 规则动态计算得出，
 *   不在 HTML 中写死任何结论。
 *
 * 本文件同时提供 baseline（基线，含偏差）与 improved（修正后）两份数据，
 * 供“应用示例修复”闭环演示使用。
 */
window.ReproData = (function () {

  /* ===================== 基线案例（含故意偏差） ===================== */
  var baseline = {
    "project": {
      "name": "MDI+GRU 第一阶段科学缝合",
      "stage": "第一阶段落盘核查",
      "pipeline": ["MDI 逐消息边界", "Bridge 严格适配与分组", "GRU 字段语义推断", "合并可追溯结果"]
    },
    "run": {
      "run_id": "run-baseline-20240510-001",
      "run_time": "2024-05-10T14:30:00+08:00",
      "input_summary": "12 条上行/下行消息，含 96 个字段切片；configs/baseline.yaml。",
      "test_command": "python -m mdi_gru.pipeline --config configs/baseline.yaml",
      "exit_code": 0,
      "test_passed": 18,
      "test_failed": 4,
      "historical_run_ids": ["run-old-20240301-999"],
      "artifacts": ["outputs/intermediate_boundaries.json"]
    },
    "messages": [
      { "message_id": "msg-001", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" },
        { "field_index": 1, "offset_unit": "byte", "start": 4, "end": 8, "field_hex": "05060708" },
        { "field_index": 2, "offset_unit": "byte", "start": 8, "end": 24, "field_hex": "090a0b0c0d0e0f101112131415161718" }
      ]},
      { "message_id": "msg-002", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" },
        { "field_index": 1, "offset_unit": "byte", "start": 4, "end": 8, "field_hex": "05060708" },
        { "field_index": 2, "offset_unit": "byte", "start": 8, "end": 24, "field_hex": "090a0b0c0d0e0f101112131415161718" }
      ]},
      { "message_id": "msg-003", "direction": "downlink", "byte_length": 16, "raw_hex": "aabbccddeeff00112233445566778899", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 2, "field_hex": "aabb" },
        { "field_index": 1, "offset_unit": "byte", "start": 2, "end": 4, "field_hex": "ccdd" },
        { "field_index": 2, "offset_unit": "byte", "start": 4, "end": 16, "field_hex": "eeff00112233445566778899" }
      ]},
      { "message_id": "", "direction": "uplink", "byte_length": 20, "raw_hex": "11223344556677889900aabbccddeeff0011", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 5, "field_hex": "1122334455" },
        { "field_index": 1, "offset_unit": "hex_char", "start": 10, "end": 24, "field_hex": "6677889900aabbcc" },
        { "field_index": 2, "offset_unit": "byte", "start": 12, "end": 20, "field_hex": "aabbccddeeff0011" }
      ]},
      { "message_id": "msg-005", "direction": "downlink", "byte_length": 16, "raw_hex": "aabbccddeeff00112233445566778899", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 2, "field_hex": "aabb" },
        { "field_index": 1, "offset_unit": "byte", "start": 2, "end": 4, "field_hex": "ccdd" },
        { "field_index": 2, "offset_unit": "byte", "start": 4, "end": 16, "field_hex": "eeff00112233445566778899" }
      ]},
      { "message_id": "msg-001", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" }
      ]}
    ],
    "gru": {
      "formal_gru_input_boundary_source": "protocol_representative",
      "copy_messages_to_ten": true,
      "truncate_to_shortest": true,
      "model_weights_mutable": true,
      "semantic_centers_mutable": false,
      "schema_version": null,
      "requests": [
        { "request_id": "req-001", "group_key": null, "direction": "uplink", "boundaries": [[0,4],[4,8],[8,24]], "field_count": 3, "message_limit": 10, "message_ids": ["msg-001","msg-002","","msg-001"], "reparse_ok": false },
        { "request_id": "req-002", "group_key": "downlink|0,2|2,4|4,16|3|10", "direction": "uplink", "boundaries": [[0,2],[2,4],[4,16]], "field_count": 3, "message_limit": 10, "message_ids": ["msg-003","msg-005"], "reparse_ok": true }
      ],
      "results": [
        { "message_id": "msg-001", "direction": "uplink", "field_index": 0, "start": 0, "end": 4, "field_hex": "01020304", "semantic_candidate": "version", "confidence": 0.92, "source_request_id": null },
        { "message_id": "msg-001", "direction": "uplink", "field_index": 1, "start": 4, "end": 8, "field_hex": "05060708", "semantic_candidate": "length", "confidence": 0.88, "source_request_id": null },
        { "message_id": "msg-003", "direction": "downlink", "field_index": 0, "start": 0, "end": 2, "field_hex": "aabb", "semantic_candidate": "header", "confidence": 0.81, "source_request_id": "req-002" }
      ]
    },
    "paperSteps": [
      { "id": "P01", "requirement": "保留逐消息 message_id 和原始顺序", "acceptance": "每条消息保留唯一 message_id；输出顺序与输入顺序一致；可通过顺序校验测试。", "status": "implemented", "source": "mdi_gru/pipeline.py :: extract_messages()", "evidence": "顺序校验 12/12 通过，message_id 字段在中间产物中可见。", "riskLevel": "low" },
      { "id": "P02", "requirement": "保存逐消息字节级字段边界", "acceptance": "每个字段记录起始/结束字节偏移；偏移可通过回放重解析还原。", "status": "implemented", "source": "mdi_gru/boundary.py :: save_field_boundaries()", "evidence": "字段边界表生成成功，抽样 10 条均能回放解析。", "riskLevel": "low" },
      { "id": "P03", "requirement": "将十六进制字符位置转换为字节偏移", "acceptance": "所有十六进制位置均换算为字节偏移；含越界与奇数长度校验。", "status": "partial", "source": "mdi_gru/offset.py :: hex_to_byte_offset()", "evidence": "常规样本换算正确，但奇数长度与越界输入仅完成部分校验，存在静默返回 0 的路径。", "riskLevel": "medium" },
      { "id": "P04", "requirement": "按 direction、boundaries 和 message_limit 严格分组", "acceptance": "分组结果与配置完全一致；message_limit 生效；不复制消息凑数量。", "status": "implemented", "source": "mdi_gru/grouping.py :: strict_group()", "evidence": "分组单元测试 8/8 通过，未发现复制消息凑数量行为。", "riskLevel": "low" },
      { "id": "P05", "requirement": "构造可重新解析的 GRU request", "acceptance": "构造的 request 可被反序列化还原；含重新解析测试。", "status": "alternative", "source": "mdi_gru/request.py :: build_gru_request()", "evidence": "request 能成功发送并返回结果，但缺少 build→parse 回环测试，无法证明可重新解析。", "riskLevel": "high" },
      { "id": "P06", "requirement": "调用已有 GRU 推断核心", "acceptance": "成功调用 GRU 推断；返回字段语义候选；不修改模型权重。", "status": "implemented", "source": "gru_core/infer.py :: run_inference()", "evidence": "调用链路正常，权重文件只读打开，未触发写操作。", "riskLevel": "low" },
      { "id": "P07", "requirement": "合并 message_id、字段范围、字段值和语义候选", "acceptance": "输出统一记录，包含四类字段；含完整性校验。", "status": "not_implemented", "source": "（尚未实现）", "evidence": "代码中仅占位函数 merge_results()，未写入任何合并逻辑。", "riskLevel": "high" },
      { "id": "P08", "requirement": "生成 JSONL、测试报告和验收记录", "acceptance": "生成三份产物文件；JSONL 行数与消息数一致；报告含通过/失败统计。", "status": "not_implemented", "source": "（尚未实现）", "evidence": "最终 JSONL 产物缺失，测试报告与验收记录未生成。", "riskLevel": "high" }
    ],
    "sourceMappings": [
      { "step": "P01", "file": "mdi_gru/pipeline.py", "symbol": "extract_messages()", "status": "implemented", "evidence": "返回值含 message_id，顺序与输入一致。", "riskLevel": "low" },
      { "step": "P02", "file": "mdi_gru/boundary.py", "symbol": "save_field_boundaries()", "status": "implemented", "evidence": "字段边界表落盘，抽样可回放。", "riskLevel": "low" },
      { "step": "P03", "file": "mdi_gru/offset.py", "symbol": "hex_to_byte_offset()", "status": "partial", "evidence": "常规换算正确；奇数长度/越界静默返回 0。", "riskLevel": "medium" },
      { "step": "P04", "file": "mdi_gru/grouping.py", "symbol": "strict_group()", "status": "implemented", "evidence": "分组测试 8/8 通过。", "riskLevel": "low" },
      { "step": "P05", "file": "mdi_gru/request.py", "symbol": "build_gru_request()", "status": "alternative", "evidence": "能发送，但无 build→parse 回环测试。", "riskLevel": "high" },
      { "step": "P06", "file": "gru_core/infer.py", "symbol": "run_inference()", "status": "implemented", "evidence": "权重只读，未写操作。", "riskLevel": "low" },
      { "step": "P07", "file": "mdi_gru/merge.py", "symbol": "merge_results()", "status": "not_implemented", "evidence": "仅占位函数，无合并逻辑。", "riskLevel": "high" },
      { "step": "P08", "file": "mdi_gru/export.py", "symbol": "export_jsonl()", "status": "not_implemented", "evidence": "最终 JSONL 产物缺失。", "riskLevel": "high" }
    ],
    "audit": {
      "testCommand": "python -m mdi_gru.pipeline --config configs/baseline.yaml",
      "testPassed": 18, "testFailed": 4,
      "items": [
        { "item": "边界单位", "required": "字节(byte)", "actual": "字节(byte)", "pass": true, "note": "与论文一致。" },
        { "item": "message_id 是否保留", "required": "保留", "actual": "保留", "pass": true, "note": "中间产物可见 message_id。" },
        { "item": "是否使用逐消息边界", "required": "是", "actual": "是", "pass": true, "note": "逐消息保存字段边界。" },
        { "item": "是否严格分组", "required": "严格(direction+boundaries+message_limit)", "actual": "严格", "pass": true, "note": "分组测试全部通过。" },
        { "item": "是否复制消息凑数量", "required": "否", "actual": "否", "pass": true, "note": "未发现复制行为。" },
        { "item": "是否静默截断", "required": "否", "actual": "是(配置错误)", "pass": false, "note": "一条配置错误地允许最短消息静默截断，违反论文要求。" },
        { "item": "是否修改模型权重", "required": "否", "actual": "否", "pass": true, "note": "权重文件只读打开。" },
        { "item": "是否使用历史结果", "required": "否", "actual": "否", "pass": true, "note": "未引用历史结果。" },
        { "item": "GRU request 重新解析测试", "required": "存在", "actual": "缺失", "pass": false, "note": "缺少 build→parse 回环测试。" },
        { "item": "最终 JSONL 产物", "required": "生成且行数一致", "actual": "缺失", "pass": false, "note": "JSONL 产物未生成。" },
        { "item": "message_id 追踪证据", "required": "全量可追溯", "actual": "部分缺失", "pass": false, "note": "一条记录缺少 message_id 追踪证据。" }
      ]
    },
    "risks": [
      { "id": "R01", "title": "最短消息静默截断配置错误", "severity": "high", "relatedStep": "P04", "evidence": "configs/baseline.yaml 中 allow_truncate_shortest=true，与论文“不得静默截断”要求冲突。", "impact": "可能丢失字段边界，导致后续推断结果偏差且无告警。" },
      { "id": "R02", "title": "GRU request 缺少重新解析测试", "severity": "high", "relatedStep": "P05", "evidence": "测试目录中无 test_request_roundtrip，无法证明 request 可被重新解析还原。", "impact": "下游消费方可能因结构不一致而解析失败。" },
      { "id": "R03", "title": "合并阶段 P07 未实现", "severity": "high", "relatedStep": "P07", "evidence": "merge_results() 仅有占位实现，无合并逻辑与完整性校验。", "impact": "message_id、字段范围、字段值、语义候选无法统一记录。" },
      { "id": "R04", "title": "最终 JSONL 产物缺失", "severity": "high", "relatedStep": "P08", "evidence": "运行后 outputs/ 目录下无 results.jsonl，测试报告与验收记录也未生成。", "impact": "无法进入验收环节，复现可信度无法量化。" },
      { "id": "R05", "title": "十六进制偏移越界静默返回 0", "severity": "medium", "relatedStep": "P03", "evidence": "hex_to_byte_offset() 在越界/奇数长度输入时静默返回 0，未抛异常。", "impact": "边界偏移可能被错误置零，污染后续字段对齐。" },
      { "id": "R06", "title": "一条记录缺少 message_id 追踪证据", "severity": "medium", "relatedStep": "P01", "evidence": "中间产物第 7 条记录 message_id 为空，无法追溯到源消息。", "impact": "复现链条断裂，影响可追溯性。" }
    ],
    "correctionPlan": [
      { "id": "C01", "relatedRisk": "R01", "action": "将 allow_truncate_shortest 改为 false 并增加启动期配置校验。", "status": "planned" },
      { "id": "C02", "relatedRisk": "R02", "action": "新增 test_request_roundtrip，覆盖 build→parse 回环。", "status": "planned" },
      { "id": "C03", "relatedRisk": "R03", "action": "实现 merge_results()，补齐四类字段合并与完整性校验。", "status": "planned" },
      { "id": "C04", "relatedRisk": "R04", "action": "实现 export_jsonl()，生成 JSONL + 测试报告 + 验收记录。", "status": "planned" },
      { "id": "C05", "relatedRisk": "R05", "action": "越界/奇数长度输入改为抛异常并记录，禁止静默返回 0。", "status": "planned" },
      { "id": "C06", "relatedRisk": "R06", "action": "补全第 7 条记录的 message_id 追踪证据。", "status": "planned" }
    ]
  };

  /* ===================== 修正后案例（偏差已消除，保留 P09 低风险残留） ===================== */
  var improved = {
    "project": {
      "name": "MDI+GRU 第一阶段科学缝合（修正后）",
      "stage": "第一阶段落盘核查-已修正",
      "pipeline": ["MDI 逐消息边界", "Bridge 严格适配与分组", "GRU 字段语义推断", "合并可追溯结果"]
    },
    "run": {
      "run_id": "run-improved-20240512-002",
      "run_time": "2024-05-12T10:05:00+08:00",
      "input_summary": "12 条上行/下行消息，含 96 个字段切片；configs/improved.yaml；逐消息边界 + 严格分组。",
      "test_command": "python -m mdi_gru.pipeline --config configs/improved.yaml",
      "exit_code": 0,
      "test_passed": 22,
      "test_failed": 0,
      "historical_run_ids": [],
      "artifacts": ["outputs/results.jsonl", "outputs/test_report.md", "outputs/acceptance.json", "outputs/intermediate_boundaries.json"]
    },
    "messages": [
      { "message_id": "msg-001", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" },
        { "field_index": 1, "offset_unit": "byte", "start": 4, "end": 8, "field_hex": "05060708" },
        { "field_index": 2, "offset_unit": "byte", "start": 8, "end": 24, "field_hex": "090a0b0c0d0e0f101112131415161718" }
      ]},
      { "message_id": "msg-002", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" },
        { "field_index": 1, "offset_unit": "byte", "start": 4, "end": 8, "field_hex": "05060708" },
        { "field_index": 2, "offset_unit": "byte", "start": 8, "end": 24, "field_hex": "090a0b0c0d0e0f101112131415161718" }
      ]},
      { "message_id": "msg-003", "direction": "downlink", "byte_length": 16, "raw_hex": "aabbccddeeff00112233445566778899", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 2, "field_hex": "aabb" },
        { "field_index": 1, "offset_unit": "byte", "start": 2, "end": 4, "field_hex": "ccdd" },
        { "field_index": 2, "offset_unit": "byte", "start": 4, "end": 16, "field_hex": "eeff00112233445566778899" }
      ]},
      { "message_id": "msg-004", "direction": "uplink", "byte_length": 20, "raw_hex": "11223344556677889900aabbccddeeff0011", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 5, "field_hex": "1122334455" },
        { "field_index": 1, "offset_unit": "byte", "start": 5, "end": 12, "field_hex": "6677889900aabb" },
        { "field_index": 2, "offset_unit": "byte", "start": 12, "end": 20, "field_hex": "ccddeeff0011" }
      ]},
      { "message_id": "msg-005", "direction": "downlink", "byte_length": 16, "raw_hex": "aabbccddeeff00112233445566778899", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 2, "field_hex": "aabb" },
        { "field_index": 1, "offset_unit": "byte", "start": 2, "end": 4, "field_hex": "ccdd" },
        { "field_index": 2, "offset_unit": "byte", "start": 4, "end": 16, "field_hex": "eeff00112233445566778899" }
      ]},
      { "message_id": "msg-006", "direction": "uplink", "byte_length": 24, "raw_hex": "0102030405060708090a0b0c0d0e0f101112131415161718", "fields": [
        { "field_index": 0, "offset_unit": "byte", "start": 0, "end": 4, "field_hex": "01020304" },
        { "field_index": 1, "offset_unit": "byte", "start": 4, "end": 8, "field_hex": "05060708" },
        { "field_index": 2, "offset_unit": "byte", "start": 8, "end": 24, "field_hex": "090a0b0c0d0e0f101112131415161718" }
      ]}
    ],
    "gru": {
      "formal_gru_input_boundary_source": "per_message",
      "copy_messages_to_ten": false,
      "truncate_to_shortest": false,
      "model_weights_mutable": false,
      "semantic_centers_mutable": false,
      "schema_version": "1.0.0",
      "requests": [
        { "request_id": "req-001", "group_key": "uplink|0,4|4,8|8,24|3|10", "direction": "uplink", "boundaries": [[0,4],[4,8],[8,24]], "field_count": 3, "message_limit": 10, "message_ids": ["msg-001","msg-002","msg-004","msg-006"], "reparse_ok": true },
        { "request_id": "req-002", "group_key": "downlink|0,2|2,4|4,16|3|10", "direction": "downlink", "boundaries": [[0,2],[2,4],[4,16]], "field_count": 3, "message_limit": 10, "message_ids": ["msg-003","msg-005"], "reparse_ok": true }
      ],
      "results": [
        { "message_id": "msg-001", "direction": "uplink", "field_index": 0, "start": 0, "end": 4, "field_hex": "01020304", "semantic_candidate": "version", "confidence": 0.94, "source_request_id": "req-001" },
        { "message_id": "msg-001", "direction": "uplink", "field_index": 1, "start": 4, "end": 8, "field_hex": "05060708", "semantic_candidate": "length", "confidence": 0.91, "source_request_id": "req-001" },
        { "message_id": "msg-003", "direction": "downlink", "field_index": 0, "start": 0, "end": 2, "field_hex": "aabb", "semantic_candidate": "header", "confidence": 0.88, "source_request_id": "req-002" },
        { "message_id": "msg-004", "direction": "uplink", "field_index": 0, "start": 0, "end": 5, "field_hex": "1122334455", "semantic_candidate": "session_id", "confidence": 0.86, "source_request_id": "req-001" }
      ]
    },
    "paperSteps": [
      { "id": "P01", "requirement": "保留逐消息 message_id 和原始顺序", "acceptance": "每条消息保留唯一 message_id；输出顺序与输入顺序一致；可通过顺序校验测试。", "status": "implemented", "source": "mdi_gru/pipeline.py :: extract_messages()", "evidence": "顺序校验 12/12 通过；第 7 条记录 message_id 已补全，全量可追溯。", "riskLevel": "low" },
      { "id": "P02", "requirement": "保存逐消息字节级字段边界", "acceptance": "每个字段记录起始/结束字节偏移；偏移可通过回放重解析还原。", "status": "implemented", "source": "mdi_gru/boundary.py :: save_field_boundaries()", "evidence": "字段边界表生成成功，抽样 10 条均能回放解析。", "riskLevel": "low" },
      { "id": "P03", "requirement": "将十六进制字符位置转换为字节偏移", "acceptance": "所有十六进制位置均换算为字节偏移；含越界与奇数长度校验。", "status": "implemented", "source": "mdi_gru/offset.py :: hex_to_byte_offset()", "evidence": "越界/奇数长度输入改为抛异常并记录，不再静默返回 0；边界用例全部通过。", "riskLevel": "low" },
      { "id": "P04", "requirement": "按 direction、boundaries 和 message_limit 严格分组", "acceptance": "分组结果与配置完全一致；message_limit 生效；不复制消息凑数量。", "status": "implemented", "source": "mdi_gru/grouping.py :: strict_group()", "evidence": "分组单元测试 8/8 通过；allow_truncate_shortest 已置 false 并增加启动期配置校验。", "riskLevel": "low" },
      { "id": "P05", "requirement": "构造可重新解析的 GRU request", "acceptance": "构造的 request 可被反序列化还原；含重新解析测试。", "status": "implemented", "source": "mdi_gru/request.py :: build_gru_request()", "evidence": "新增 test_request_roundtrip，build→parse 回环测试通过。", "riskLevel": "low" },
      { "id": "P06", "requirement": "调用已有 GRU 推断核心", "acceptance": "成功调用 GRU 推断；返回字段语义候选；不修改模型权重。", "status": "implemented", "source": "gru_core/infer.py :: run_inference()", "evidence": "调用链路正常，权重文件只读打开，未触发写操作。", "riskLevel": "low" },
      { "id": "P07", "requirement": "合并 message_id、字段范围、字段值和语义候选", "acceptance": "输出统一记录，包含四类字段；含完整性校验。", "status": "implemented", "source": "mdi_gru/merge.py :: merge_results()", "evidence": "四类字段合并完成，完整性校验通过，无缺失记录。", "riskLevel": "low" },
      { "id": "P08", "requirement": "生成 JSONL、测试报告和验收记录", "acceptance": "生成三份产物文件；JSONL 行数与消息数一致；报告含通过/失败统计。", "status": "implemented", "source": "mdi_gru/export.py :: export_jsonl()", "evidence": "outputs/results.jsonl 行数与消息数一致；测试报告与验收记录已生成。", "riskLevel": "low" },
      { "id": "P09", "requirement": "计算 Acc1/Acc2 评价指标", "acceptance": "输出 Acc1 与 Acc2 指标；含与论文基线的对照表。", "status": "not_implemented", "source": "（第二阶段实现）", "evidence": "最终 Acc1/Acc2 尚未在第一阶段计算，等待后续评价阶段。", "riskLevel": "low" }
    ],
    "sourceMappings": [
      { "step": "P01", "file": "mdi_gru/pipeline.py", "symbol": "extract_messages()", "status": "implemented", "evidence": "返回值含 message_id，顺序与输入一致；第 7 条已补全。", "riskLevel": "low" },
      { "step": "P02", "file": "mdi_gru/boundary.py", "symbol": "save_field_boundaries()", "status": "implemented", "evidence": "字段边界表落盘，抽样可回放。", "riskLevel": "low" },
      { "step": "P03", "file": "mdi_gru/offset.py", "symbol": "hex_to_byte_offset()", "status": "implemented", "evidence": "越界/奇数长度抛异常，不再静默返回 0。", "riskLevel": "low" },
      { "step": "P04", "file": "mdi_gru/grouping.py", "symbol": "strict_group()", "status": "implemented", "evidence": "分组测试 8/8 通过；截断配置已关闭。", "riskLevel": "low" },
      { "step": "P05", "file": "mdi_gru/request.py", "symbol": "build_gru_request()", "status": "implemented", "evidence": "build→parse 回环测试通过。", "riskLevel": "low" },
      { "step": "P06", "file": "gru_core/infer.py", "symbol": "run_inference()", "status": "implemented", "evidence": "权重只读，未写操作。", "riskLevel": "low" },
      { "step": "P07", "file": "mdi_gru/merge.py", "symbol": "merge_results()", "status": "implemented", "evidence": "四类字段合并完成，完整性校验通过。", "riskLevel": "low" },
      { "step": "P08", "file": "mdi_gru/export.py", "symbol": "export_jsonl()", "status": "implemented", "evidence": "JSONL/测试报告/验收记录均已生成。", "riskLevel": "low" },
      { "step": "P09", "file": "mdi_gru/metrics.py", "symbol": "compute_accuracy()", "status": "not_implemented", "evidence": "第二阶段实现，本阶段未计算 Acc1/Acc2。", "riskLevel": "low" }
    ],
    "audit": {
      "testCommand": "python -m mdi_gru.pipeline --config configs/improved.yaml",
      "testPassed": 22, "testFailed": 0,
      "items": [
        { "item": "边界单位", "required": "字节(byte)", "actual": "字节(byte)", "pass": true, "note": "与论文一致。" },
        { "item": "message_id 是否保留", "required": "保留", "actual": "保留", "pass": true, "note": "全量可追溯。" },
        { "item": "是否使用逐消息边界", "required": "是", "actual": "是", "pass": true, "note": "逐消息保存字段边界。" },
        { "item": "是否严格分组", "required": "严格(direction+boundaries+message_limit)", "actual": "严格", "pass": true, "note": "分组测试全部通过。" },
        { "item": "是否复制消息凑数量", "required": "否", "actual": "否", "pass": true, "note": "未发现复制行为。" },
        { "item": "是否静默截断", "required": "否", "actual": "否", "pass": true, "note": "allow_truncate_shortest=false，启动期校验通过。" },
        { "item": "是否修改模型权重", "required": "否", "actual": "否", "pass": true, "note": "权重文件只读打开。" },
        { "item": "是否使用历史结果", "required": "否", "actual": "否", "pass": true, "note": "未引用历史结果。" },
        { "item": "GRU request 重新解析测试", "required": "存在", "actual": "存在", "pass": true, "note": "build→parse 回环测试通过。" },
        { "item": "最终 JSONL 产物", "required": "生成且行数一致", "actual": "生成且行数一致", "pass": true, "note": "JSONL 行数与消息数一致。" },
        { "item": "message_id 追踪证据", "required": "全量可追溯", "actual": "全量可追溯", "pass": true, "note": "第 7 条记录已补全。" }
      ]
    },
    "risks": [
      { "id": "R01", "title": "最短消息静默截断配置错误", "severity": "resolved", "relatedStep": "P04", "evidence": "allow_truncate_shortest 已置 false 并通过启动期校验。", "impact": "已消除。" },
      { "id": "R02", "title": "GRU request 缺少重新解析测试", "severity": "resolved", "relatedStep": "P05", "evidence": "test_request_roundtrip 已新增并通过。", "impact": "已消除。" },
      { "id": "R03", "title": "合并阶段 P07 未实现", "severity": "resolved", "relatedStep": "P07", "evidence": "merge_results() 已实现，完整性校验通过。", "impact": "已消除。" },
      { "id": "R04", "title": "最终 JSONL 产物缺失", "severity": "resolved", "relatedStep": "P08", "evidence": "export_jsonl() 已实现，三份产物均已生成。", "impact": "已消除。" },
      { "id": "R05", "title": "十六进制偏移越界静默返回 0", "severity": "resolved", "relatedStep": "P03", "evidence": "越界/奇数长度输入改为抛异常。", "impact": "已消除。" },
      { "id": "R06", "title": "一条记录缺少 message_id 追踪证据", "severity": "resolved", "relatedStep": "P01", "evidence": "第 7 条记录 message_id 已补全。", "impact": "已消除。" }
    ],
    "correctionPlan": [
      { "id": "C01", "relatedRisk": "R01", "action": "将 allow_truncate_shortest 改为 false 并增加启动期配置校验。", "status": "done" },
      { "id": "C02", "relatedRisk": "R02", "action": "新增 test_request_roundtrip，覆盖 build→parse 回环。", "status": "done" },
      { "id": "C03", "relatedRisk": "R03", "action": "实现 merge_results()，补齐四类字段合并与完整性校验。", "status": "done" },
      { "id": "C04", "relatedRisk": "R04", "action": "实现 export_jsonl()，生成 JSONL + 测试报告 + 验收记录。", "status": "done" },
      { "id": "C05", "relatedRisk": "R05", "action": "越界/奇数长度输入改为抛异常并记录，禁止静默返回 0。", "status": "done" },
      { "id": "C06", "relatedRisk": "R06", "action": "补全第 7 条记录的 message_id 追踪证据。", "status": "done" }
    ]
  };

  /* 旧版兼容统计（仅用于首页指标卡的简单展示，真实评分由 engine.calculateScore 计算） */
  function computeStats(p) {
    p = p || {};
    var steps = Array.isArray(p.paperSteps) ? p.paperSteps : [];
    var mapped = steps.filter(function (s) { return s && s.status !== "not_implemented"; }).length;
    var risks = Array.isArray(p.risks) ? p.risks : [];
    var highRisk = risks.filter(function (r) { return r && r.severity === "high"; }).length;
    var a = p.audit || {};
    var artifacts = steps.filter(function (s) { return s && s.status === "implemented"; }).length;
    var base = steps.length ? Math.round((mapped / steps.length) * 100) : 0;
    var credibility = Math.max(0, base - highRisk * 6);
    return {
      stepTotal: steps.length,
      stepMapped: mapped,
      highRisk: highRisk,
      testPassed: a.testPassed || 0,
      testFailed: a.testFailed || 0,
      artifacts: artifacts,
      credibility: credibility
    };
  }

  return {
    baseline: baseline,
    improved: improved,
    project: baseline,      // 默认载入基线
    computeStats: computeStats
  };
})();
