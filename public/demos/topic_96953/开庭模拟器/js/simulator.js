(function () {
    'use strict';

    /* ============ 案由与角色数据 ============ */
    const CASE_TYPES = [
        { id: '民间借贷纠纷', icon: '💰', desc: '借款未还、借条争议等' },
        { id: '合同纠纷', icon: '📄', desc: '买卖、租赁、服务合同等' },
        { id: '婚姻家庭', icon: '💍', desc: '离婚、财产分割、抚养权' },
        { id: '劳动争议', icon: '🔧', desc: '欠薪、解除合同、工伤' },
        { id: '交通事故', icon: '🚗', desc: '赔偿、责任认定、保险' },
        { id: '物业纠纷', icon: '🏠', desc: '物业费、服务质量等' },
        { id: '名誉权纠纷', icon: '🗣', desc: '诽谤、侮辱、网络侵权' },
        { id: '其他民事', icon: '⚖', desc: '其他民事诉讼案件' }
    ];

    const ROLES = [
        { id: 'plaintiff', icon: '👨', name: '原告', desc: '主动起诉一方' },
        { id: 'defendant', icon: '🧑', name: '被告', desc: '被起诉应诉一方' },
        { id: 'thirdparty', icon: '👤', name: '第三人', desc: '有独立请求权第三人' }
    ];

    const ROLE_NAMES = {
        judge: '法官（审判长）',
        plaintiff: '原告',
        defendant: '被告',
        thirdparty: '第三人',
        witness: '证人'
    };

    const ROLE_AVATAR = {
        judge: '法',
        plaintiff: '原',
        defendant: '被',
        thirdparty: '三',
        witness: '证'
    };

    /* ============ 庭审流程 ============ */
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function hasWitnessMention(caseInfo) {
        const text = ((caseInfo && (caseInfo.evidence + ' ' + caseInfo.facts + ' ' + caseInfo.claims)) || '').toLowerCase();
        return /证人|目击者|见证人|在场人|见证/.test(text);
    }

    function buildJudgeOpening(caseInfo) {
        const caseType = (caseInfo && caseInfo.caseType) || '民事';
        return '（敲击法槌）\n\n现在开庭。\n\n本院今天依法公开审理原告与被告之间' + caseType + '纠纷一案。\n\n本案适用简易程序，由审判员独任审理，书记员担任法庭记录。\n\n根据《中华人民共和国民事诉讼法》的规定，当事人在诉讼中享有下列权利：\n一、可以委托诉讼代理人，提出回避申请；\n二、可以收集、提供证据，进行辩论，请求调解；\n三、原告可以放弃或者变更诉讼请求，被告可以承认或者反驳诉讼请求，有权提起反诉。\n\n当事人应当依法行使诉讼权利，遵守诉讼秩序，如实陈述案件事实。\n\n现在核对双方当事人身份。请原告陈述身份信息。';
    }

    function buildIdentityTemplate(role) {
        if (role === 'plaintiff') {
            return '原告：王某，女，汉族，1988年6月12日出生，住北京市朝阳区建国路88号，身份证号：110105198806120028。';
        }
        if (role === 'defendant') {
            return '被告：刘某，男，汉族，1985年3月20日出生，住北京市海淀区中关村大街12号，身份证号：110108198503200035。';
        }
        return '第三人：赵某，男，汉族，1990年1月15日出生，住北京市西城区西长安街50号。';
    }

    function buildTrialFlow(userRole, caseInfo) {
        const isPlaintiff = userRole === 'plaintiff';
        const isDefendant = userRole === 'defendant';
        const isThird = userRole === 'thirdparty';
        const hasWitness = hasWitnessMention(caseInfo);

        const flow = [
            { speaker: 'judge', phase: '开庭准备', fixed: true, content: buildJudgeOpening(caseInfo) },
            { speaker: 'plaintiff', phase: '开庭准备', fixed: true, content: buildIdentityTemplate('plaintiff') },
            { speaker: 'judge', phase: '开庭准备', fixed: true, content: '请被告陈述身份信息。' },
            { speaker: 'defendant', phase: '开庭准备', fixed: true, content: buildIdentityTemplate('defendant') },
            { speaker: 'judge', phase: '开庭准备', fixed: true, content: '经核对，双方当事人身份明确，符合出庭条件，可以参加本案诉讼。\n\n现在进入法庭调查。请原告当庭陈述诉讼请求以及所依据的事实与理由。' }
        ];

        if (isPlaintiff) {
            flow.push({ speaker: 'plaintiff', phase: '法庭调查', userControlled: true, instruction: '当庭陈述你的诉讼请求和事实理由。' });
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '针对原告陈述的事实向原告发问，追问关键细节（如时间、金额、交付方式）。' });
            flow.push({ speaker: 'plaintiff', phase: '法庭调查', userControlled: true, instruction: '回答法官的提问。' });
        } else {
            flow.push({ speaker: 'plaintiff', phase: '法庭调查', instruction: '陈述诉讼请求和事实理由（由 AI 推演原告立场）。' });
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '针对原告陈述向原告发问。' });
            flow.push({ speaker: 'plaintiff', phase: '法庭调查', instruction: '回答法官提问（AI 推演）。' });
        }

        if (isDefendant) {
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '要求被告进行答辩。' });
            flow.push({ speaker: 'defendant', phase: '法庭调查', userControlled: true, instruction: '针对原告的起诉进行答辩，表明你的立场和理由。' });
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '就答辩内容向被告发问。' });
            flow.push({ speaker: 'defendant', phase: '法庭调查', userControlled: true, instruction: '回答法官提问。' });
        } else {
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '要求被告进行答辩。' });
            flow.push({ speaker: 'defendant', phase: '法庭调查', instruction: '进行答辩，反驳原告诉求（AI 推演被告立场）。' });
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '就答辩内容向被告发问。' });
            flow.push({ speaker: 'defendant', phase: '法庭调查', instruction: '回答法官提问（AI 推演）。' });
        }

        if (isThird) {
            flow.push({ speaker: 'judge', phase: '法庭调查', instruction: '询问第三人是否有独立请求权并要求陈述。' });
            flow.push({ speaker: 'thirdparty', phase: '法庭调查', userControlled: true, instruction: '陈述你的独立请求及事实理由。' });
        }

        // 举证质证
        if (isPlaintiff) {
            flow.push({ speaker: 'judge', phase: '举证质证', instruction: '宣布进入举证质证阶段，要求原告举证。' });
            flow.push({ speaker: 'plaintiff', phase: '举证质证', userControlled: true, instruction: '出示你掌握的证据，并说明每份证据的证明事项。' });
            flow.push({ speaker: 'defendant', phase: '举证质证', instruction: '对原告证据进行质证，指出真实性问题或证明力不足（AI 推演）。' });
            flow.push({ speaker: 'judge', phase: '举证质证', instruction: '要求被告举证。' });
            flow.push({ speaker: 'defendant', phase: '举证质证', instruction: '出示被告方证据（AI 推演）。' });
            flow.push({ speaker: 'plaintiff', phase: '举证质证', userControlled: true, instruction: '对被告证据发表质证意见。' });
        } else if (isDefendant) {
            flow.push({ speaker: 'judge', phase: '举证质证', instruction: '宣布进入举证质证阶段，要求原告举证。' });
            flow.push({ speaker: 'plaintiff', phase: '举证质证', instruction: '出示原告证据（AI 推演）。' });
            flow.push({ speaker: 'defendant', phase: '举证质证', userControlled: true, instruction: '对原告证据进行质证。' });
            flow.push({ speaker: 'judge', phase: '举证质证', instruction: '要求被告举证。' });
            flow.push({ speaker: 'defendant', phase: '举证质证', userControlled: true, instruction: '出示你掌握的证据并说明证明事项。' });
            flow.push({ speaker: 'plaintiff', phase: '举证质证', instruction: '对被告证据质证（AI 推演）。' });
        } else {
            flow.push({ speaker: 'judge', phase: '举证质证', instruction: '宣布进入举证质证阶段，要求原告举证。' });
            flow.push({ speaker: 'plaintiff', phase: '举证质证', instruction: '出示原告证据（AI 推演）。' });
            flow.push({ speaker: 'defendant', phase: '举证质证', instruction: '对原告证据质证（AI 推演）。' });
            flow.push({ speaker: 'thirdparty', phase: '举证质证', userControlled: true, instruction: '对原被告证据发表意见，并出示你的证据。' });
        }

        // 证人出庭（依据《民事诉讼法》第七十三条，证人确有困难不能出庭的除外，应当出庭作证）
        if (hasWitness) {
            flow.push({ speaker: 'judge', phase: '证人出庭', instruction: '询问当事人是否有证人需要申请出庭作证，告知证人作证的权利义务及如实作证的法律责任。' });
            if (isPlaintiff) {
                flow.push({ speaker: 'plaintiff', phase: '证人出庭', userControlled: true, instruction: '申请你方证人出庭作证，并简要说明证人了解的案件情况。' });
            } else if (isDefendant) {
                flow.push({ speaker: 'defendant', phase: '证人出庭', userControlled: true, instruction: '申请你方证人出庭作证，并简要说明证人了解的案件情况。' });
            } else {
                flow.push({ speaker: 'plaintiff', phase: '证人出庭', instruction: '申请证人出庭作证（AI 推演）。' });
            }
            flow.push({ speaker: 'judge', phase: '证人出庭', instruction: '准许证人出庭，宣布传唤证人，告知证人如实作证的义务及作伪证的法律责任。' });
            flow.push({ speaker: 'witness', phase: '证人出庭', instruction: '证人到庭，陈述其所了解的与案件有关的事实经过。' });
            flow.push({ speaker: 'judge', phase: '证人出庭', instruction: '法官就证人陈述的事实向证人提问，核实细节。' });
            if (isPlaintiff) {
                flow.push({ speaker: 'plaintiff', phase: '证人出庭', userControlled: true, instruction: '向证人发问，核实对你方有利的事实。' });
            } else {
                flow.push({ speaker: 'plaintiff', phase: '证人出庭', instruction: '向证人发问（AI 推演）。' });
            }
            if (isDefendant) {
                flow.push({ speaker: 'defendant', phase: '证人出庭', userControlled: true, instruction: '向证人发问，核实对你方有利的事实。' });
            } else {
                flow.push({ speaker: 'defendant', phase: '证人出庭', instruction: '向证人发问（AI 推演）。' });
            }
            flow.push({ speaker: 'judge', phase: '证人出庭', instruction: '证人作证完毕，宣布证人退庭。' });
        }

        // 法庭辩论
        flow.push({ speaker: 'judge', phase: '法庭辩论', instruction: '宣布进入法庭辩论阶段，要求原告发言。' });
        if (isPlaintiff) {
            flow.push({ speaker: 'plaintiff', phase: '法庭辩论', userControlled: true, instruction: '发表辩论意见，反驳被告观点。' });
        } else {
            flow.push({ speaker: 'plaintiff', phase: '法庭辩论', instruction: '发表辩论意见（AI 推演）。' });
        }
        if (isDefendant) {
            flow.push({ speaker: 'defendant', phase: '法庭辩论', userControlled: true, instruction: '发表辩论意见，反驳原告观点。' });
        } else {
            flow.push({ speaker: 'defendant', phase: '法庭辩论', instruction: '发表辩论意见（AI 推演）。' });
        }
        if (isThird) {
            flow.push({ speaker: 'thirdparty', phase: '法庭辩论', userControlled: true, instruction: '发表你的辩论意见。' });
        }

        // 最后陈述
        flow.push({ speaker: 'judge', phase: '最后陈述', instruction: '宣布进入最后陈述阶段。' });
        if (isPlaintiff) {
            flow.push({ speaker: 'plaintiff', phase: '最后陈述', userControlled: true, instruction: '作最后陈述。' });
        } else {
            flow.push({ speaker: 'plaintiff', phase: '最后陈述', instruction: '作最后陈述（AI 推演）。' });
        }
        if (isDefendant) {
            flow.push({ speaker: 'defendant', phase: '最后陈述', userControlled: true, instruction: '作最后陈述。' });
        } else {
            flow.push({ speaker: 'defendant', phase: '最后陈述', instruction: '作最后陈述（AI 推演）。' });
        }
        if (isThird) {
            flow.push({ speaker: 'thirdparty', phase: '最后陈述', userControlled: true, instruction: '作最后陈述。' });
        }

        flow.push({ speaker: 'judge', phase: '宣布休庭', instruction: '宣布休庭，择期宣判，告知当事人庭后注意事项。' });
        return flow;
    }

    /* ============ 状态 ============ */
    const state = {
        apiKey: '',
        model: '',
        caseType: '',
        userRole: '',
        caseInfo: { facts: '', evidence: '', claims: '' },
        conversation: [],
        flow: [],
        flowIndex: 0,
        running: false,
        resultsData: null,
        keyChecking: false,
        mode: 'ai',
        ttsEnabled: false,
        ttsPlaying: false
    };

    /* ============ DOM 引用 ============ */
    const $ = function (id) { return document.getElementById(id); };
    const $$ = function (sel, ctx) { return (ctx || document).querySelectorAll(sel); };

    /* ============ Toast ============ */
    function toast(msg, type) {
        type = type || 'info';
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = msg;
        $('toast-container').appendChild(el);
        setTimeout(function () {
            el.classList.add('fade-out');
            setTimeout(function () { el.remove(); }, 350);
        }, 3200);
    }

    /* ============ 步骤导航 ============ */
    function showStep(step) {
        for (let i = 1; i <= 6; i++) {
            $('panel-' + i).hidden = (i !== step);
        }
        updateProgress(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateProgress(current) {
        const steps = $$('.progress-step');
        const lines = $$('.progress-line');
        steps.forEach(function (el, idx) {
            const n = idx + 1;
            el.classList.remove('active', 'done');
            if (n < current) el.classList.add('done');
            else if (n === current) el.classList.add('active');
        });
        lines.forEach(function (el, idx) {
            const n = idx + 1;
            el.classList.toggle('done', n < current);
        });
    }

    /* ============ 渲染选项卡片 ============ */
    function renderModelOptions() {
        const wrap = $('model-options');
        wrap.innerHTML = '';
        SiliconFlow.MODELS.forEach(function (m, idx) {
            const card = document.createElement('label');
            card.className = 'model-card' + (idx === 0 ? ' selected' : '');
            card.setAttribute('data-model', m.id);
            card.innerHTML =
                '<input type="radio" name="model" value="' + m.id + '"' + (idx === 0 ? ' checked' : '') + '>' +
                '<div class="model-name">' + m.name + '</div>' +
                '<div class="model-desc">' + m.desc + '</div>';
            card.addEventListener('click', function () {
                $$('.model-card').forEach(function (c) { c.classList.remove('selected'); });
                card.classList.add('selected');
                state.model = m.id;
            });
            wrap.appendChild(card);
        });
        state.model = SiliconFlow.MODELS[0].id;
    }

    function renderCaseGrid() {
        const grid = $('case-grid');
        grid.innerHTML = '';
        CASE_TYPES.forEach(function (c) {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML =
                '<div class="option-icon">' + c.icon + '</div>' +
                '<div class="option-title">' + c.id + '</div>' +
                '<div class="option-desc">' + c.desc + '</div>';
            card.addEventListener('click', function () {
                $$('.option-card', grid).forEach(function (el) { el.classList.remove('selected'); });
                card.classList.add('selected');
                state.caseType = c.id;
                $('to-step-3').disabled = false;
            });
            grid.appendChild(card);
        });
    }

    function renderRoleGrid() {
        const grid = $('role-grid');
        grid.innerHTML = '';
        ROLES.forEach(function (r) {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML =
                '<div class="option-icon">' + r.icon + '</div>' +
                '<div class="option-title">' + r.name + '</div>' +
                '<div class="option-desc">' + r.desc + '</div>';
            card.addEventListener('click', function () {
                $$('.option-card', grid).forEach(function (el) { el.classList.remove('selected'); });
                card.classList.add('selected');
                state.userRole = r.id;
                $('to-step-4').disabled = false;
            });
            grid.appendChild(card);
        });
    }

    /* ============ 庭审聊天渲染 ============ */
    function appendBubble(speaker, content, isUser) {
        const area = $('chat-area');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + speaker + (isUser ? ' user' : '');
        const label = ROLE_NAMES[speaker] + (isUser ? ' · 你' : (speaker === state.userRole ? ' · AI 代答' : ''));
        bubble.innerHTML =
            '<div class="avatar">' + ROLE_AVATAR[speaker] + '</div>' +
            '<div class="bubble-content">' +
            '<div class="bubble-label"><span class="role-tag' + (isUser ? ' user-tag' : '') + '">' + label + '</span></div>' +
            '<div class="bubble-text"></div>' +
            '</div>';
        area.appendChild(bubble);
        bubble.querySelector('.bubble-text').textContent = content;
        area.scrollTop = area.scrollHeight;
        return bubble;
    }

    function createStreamingBubble(speaker, label) {
        const area = $('chat-area');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + speaker;
        bubble.innerHTML =
            '<div class="avatar">' + ROLE_AVATAR[speaker] + '</div>' +
            '<div class="bubble-content">' +
            '<div class="bubble-label"><span class="role-tag">' + (label || ROLE_NAMES[speaker]) + '</span></div>' +
            '<div class="bubble-text"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>' +
            '</div>';
        area.appendChild(bubble);
        area.scrollTop = area.scrollHeight;
        return bubble;
    }

    function clearTypingInBubble(textEl) {
        const indicator = textEl.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    function showTyping() {
        const area = $('chat-area');
        const el = document.createElement('div');
        el.className = 'chat-bubble judge';
        el.id = 'typing-bubble';
        el.innerHTML =
            '<div class="avatar">法</div>' +
            '<div class="bubble-content">' +
            '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>' +
            '</div>';
        area.appendChild(el);
        area.scrollTop = area.scrollHeight;
    }

    function removeTyping() {
        const el = $('typing-bubble');
        if (el) el.remove();
    }

    function setPhase(phase) {
        $('trial-phase').textContent = phase;
    }

    /* ============ Prompt 构建 ============ */
    function buildConversationText() {
        if (!state.conversation.length) return '（庭审尚未开始）';
        return state.conversation.map(function (m) {
            return '【' + ROLE_NAMES[m.speaker] + '】' + m.content;
        }).join('\n');
    }

    function buildCaseContext() {
        const info = state.caseInfo;
        const userRoleName = ROLE_NAMES[state.userRole];
        let text = '案件信息：\n';
        text += '- 案由：' + state.caseType + '\n';
        text += '- 用户扮演的角色：' + userRoleName + '\n';
        text += '- 案件事实经过：' + (info.facts || '（未提供）') + '\n';
        text += '- 掌握的证据：' + (info.evidence || '（未提供）') + '\n';
        text += '- 诉求与理由：' + (info.claims || '（未提供）');
        return text;
    }

    function buildMessages(turn) {
        const speaker = turn.speaker;
        const speakerName = ROLE_NAMES[speaker];
        const isUser = speaker === state.userRole && turn.userControlled;

        const sys =
            '你是一名中国民事庭审模拟专家，正在还原一场真实的民事诉讼庭审。请严格遵循《中华人民共和国民事诉讼法》的程序。\n\n' +
            buildCaseContext() + '\n\n' +
            '当前庭审阶段：' + turn.phase + '\n' +
            '你现在扮演的角色：' + speakerName + (isUser ? '（由用户控制，本回合请代替用户生成发言）' : '') + '\n' +
            '本回合任务：' + turn.instruction + '\n\n' +
            '已有的庭审记录（按发言顺序）：\n' + buildConversationText() + '\n\n' +
            '要求：\n' +
            '1. 必须严格站在' + speakerName + '的立场发言，符合该角色在庭审中的身份与目的；\n' +
            '2. 内容真实自然，像真实的中国基层法院庭审一样口语化、专业化；\n' +
            '3. 控制篇幅在 2 到 6 句话，不超过 200 字；\n' +
            '4. 只输出角色发言内容本身，不要输出角色名、引号、方括号、舞台说明或任何解释性前缀；\n' +
            '5. 不要重复已有记录中的内容，要推动庭审向前发展；\n' +
            '6. 法官应推动程序：核实身份、归纳争议焦点、组织举证质证、引导辩论、宣布休庭；\n' +
            '7. 当事人应围绕事实与证据展开陈述、答辩、质证、辩论，维护自身合法权益。';

        return [{ role: 'user', content: sys }];
    }

    function buildSummaryMessages() {
        const sys =
            '你是一名资深民事诉讼律师，也是庭审模拟系统的分析引擎。请基于以下完整庭审记录，为当事人提供专业的庭后总结与建议。\n\n' +
            buildCaseContext() + '\n\n' +
            '用户角色：' + ROLE_NAMES[state.userRole] + '\n\n' +
            '完整庭审记录：\n' + buildConversationText() + '\n\n' +
            '请严格按以下 JSON 结构输出（不要输出 JSON 以外的任何文字、不要使用 markdown 代码块）：\n' +
            '{\n' +
            '  "recap": "本次庭审的整体回顾，3-5 句话",\n' +
            '  "evidence_tips": ["庭前需要补充或完善的证据建议条目1", "条目2", ...],\n' +
            '  "key_facts": ["庭审中暴露的重点事实要点1", "要点2", ...],\n' +
            '  "risks": ["本案的法律风险提示1", "风险2", ...],\n' +
            '  "strategy": ["针对用户角色的庭审策略与应对建议1", "建议2", ...]\n' +
            '}';
        return [{ role: 'user', content: sys }];
    }

    /* ============ AI 调用 ============ */
    function generateAI(turn, onChunk) {
        const messages = buildMessages(turn);
        return SiliconFlow.streamChat(state.apiKey, state.model, messages, {
            maxTokens: 600,
            temperature: 0.7,
            topP: 0.92
        }, onChunk);
    }

    function generateSummary() {
        const messages = buildSummaryMessages();
        return SiliconFlow.chat(state.apiKey, state.model, messages, {
            maxTokens: 2400,
            temperature: 0.5,
            topP: 0.9
        });
    }

    /* ============ 用户输入处理 ============ */
    let userResolve = null;

    function showUserInput(turn) {
        const area = $('input-area');
        area.classList.remove('hidden');
        const isOwnRole = turn.speaker === state.userRole;
        const tag = $('input-role-tag');
        if (state.mode === 'real') {
            tag.textContent = ROLE_NAMES[turn.speaker] + (isOwnRole ? ' · 你' : ' · 由你扮演');
        } else {
            tag.textContent = ROLE_NAMES[turn.speaker] + ' · 你';
        }
        $('input-prompt-text').textContent = turn.instruction;
        $('user-input').value = '';
        $('user-input').placeholder = '请以 ' + ROLE_NAMES[turn.speaker] + ' 的身份发言……';
        preVoiceText = '';
        lastTranscription = '';
        updateLiveBadge(0);
        $('ai-answer').style.display = isOwnRole ? '' : 'none';
        setTimeout(function () { $('user-input').focus(); }, 100);
        userResolve = null;
    }

    function hideUserInput() {
        $('input-area').classList.add('hidden');
    }

    function waitForUserInput(turn) {
        return new Promise(function (resolve) {
            userResolve = resolve;
        });
    }

    /* ============ 庭审主循环 ============ */
    async function runTrial() {
        state.running = true;
        for (let i = state.flowIndex; i < state.flow.length; i++) {
            state.flowIndex = i;
            const turn = state.flow[i];
            setPhase(turn.phase);

            if (turn.fixed && turn.content) {
                appendBubble(turn.speaker, turn.content, false);
                state.conversation.push({ speaker: turn.speaker, content: turn.content, phase: turn.phase });
                $('chat-area').scrollTop = $('chat-area').scrollHeight;
                if (state.ttsEnabled) { await speakText(turn.speaker, turn.content); }
                await sleep(1200);
                continue;
            }

            if (turn.identity) {
                var isUserIdentity = state.mode === 'real' ? true : (turn.speaker === state.userRole);
                if (isUserIdentity) {
                    showUserInput(turn);
                    var result = await waitForUserInput(turn);
                    hideUserInput();
                    state.conversation.push({ speaker: turn.speaker, content: result.content, phase: turn.phase });
                    if (!result.rendered) { appendBubble(turn.speaker, result.content, true); }
                } else {
                    var identityContent = buildIdentityTemplate(turn.speaker);
                    appendBubble(turn.speaker, identityContent, false);
                    state.conversation.push({ speaker: turn.speaker, content: identityContent, phase: turn.phase });
                    $('chat-area').scrollTop = $('chat-area').scrollHeight;
                    if (state.ttsEnabled) { await speakText(turn.speaker, identityContent); }
                    await sleep(1000);
                }
                continue;
            }

            const isUserTurn = state.mode === 'real' ? true : (turn.speaker === state.userRole && turn.userControlled);

            if (isUserTurn) {
                showUserInput(turn);
                const result = await waitForUserInput(turn);
                hideUserInput();
                state.conversation.push({ speaker: turn.speaker, content: result.content, phase: turn.phase });
                if (!result.rendered) {
                    appendBubble(turn.speaker, result.content, true);
                }
            } else {
                const bubble = createStreamingBubble(turn.speaker);
                const textEl = bubble.querySelector('.bubble-text');
                let content = '';
                let firstChunk = true;
                try {
                    content = await generateAI(turn, function (chunk) {
                        if (firstChunk) {
                            clearTypingInBubble(textEl);
                            firstChunk = false;
                        }
                        textEl.appendChild(document.createTextNode(chunk));
                        $('chat-area').scrollTop = $('chat-area').scrollHeight;
                    });
                } catch (e) {
                    clearTypingInBubble(textEl);
                    toast('AI 调用失败：' + e.message, 'error');
                    state.running = false;
                    return;
                }
                if (firstChunk) clearTypingInBubble(textEl);
                if (!content) content = '（无内容）';
                state.conversation.push({ speaker: turn.speaker, content: content, phase: turn.phase });
                $('chat-area').scrollTop = $('chat-area').scrollHeight;
                if (state.ttsEnabled) {
                    await speakText(turn.speaker, content);
                }
            }
        }
        state.running = false;
        await finishTrial();
    }

    async function finishTrial() {
        toast('庭审结束，正在生成专业建议……', 'success');
        showStep(6);
        renderTrialSummary();
        try {
            const raw = await generateSummary();
            renderResults(raw);
        } catch (e) {
            $('results-content').innerHTML =
                '<div class="result-section">' +
                '<h3><span class="icon">⚠</span>总结生成失败</h3>' +
                '<div class="result-text">' + e.message + '\n\n你可以点击下方"查看庭审记录"重新阅读完整庭审过程。</div>' +
                '</div>';
            toast('总结生成失败：' + e.message, 'error');
        }
    }

    function renderTrialSummary() {
        const info = state.caseInfo;
        $('trial-summary').innerHTML =
            '<h4>本次模拟信息</h4>' +
            '<dl>' +
            '<dt>案由</dt><dd>' + state.caseType + '</dd>' +
            '<dt>你的角色</dt><dd>' + ROLE_NAMES[state.userRole] + '</dd>' +
            '<dt>使用模型</dt><dd>' + state.model + '</dd>' +
            '<dt>发言轮次</dt><dd>' + state.conversation.length + ' 轮</dd>' +
            '</dl>';
    }

    function tryParseJSON(text) {
        if (!text) return null;
        let t = text.trim();
        const start = t.indexOf('{');
        const end = t.lastIndexOf('}');
        if (start >= 0 && end > start) {
            t = t.slice(start, end + 1);
        }
        try { return JSON.parse(t); } catch (e) { return null; }
    }

    function renderResults(raw) {
        const data = tryParseJSON(raw);
        state.resultsData = data;
        state.resultsRaw = data ? null : raw;
        const container = $('results-content');
        if (!data) {
            container.innerHTML =
                '<div class="result-section">' +
                '<h3><span class="icon">📋</span>庭审总结</h3>' +
                '<div class="result-text">' + escapeHtml(raw || '（无内容）') + '</div>' +
                '</div>';
            return;
        }
        let html = '';
        if (data.recap) {
            html += sectionHtml('📋', '庭审回顾', '<div class="result-text">' + escapeHtml(data.recap) + '</div>');
        }
        if (Array.isArray(data.evidence_tips) && data.evidence_tips.length) {
            html += sectionHtml('📂', '证据完善建议', listHtml(data.evidence_tips));
        }
        if (Array.isArray(data.key_facts) && data.key_facts.length) {
            html += sectionHtml('🔍', '重点事实要点', listHtml(data.key_facts));
        }
        if (Array.isArray(data.risks) && data.risks.length) {
            html += sectionHtml('⚠', '法律风险提示', listHtml(data.risks));
        }
        if (Array.isArray(data.strategy) && data.strategy.length) {
            html += sectionHtml('💡', '庭审策略建议', listHtml(data.strategy));
        }
        container.innerHTML = html || '<div class="result-text">暂无内容</div>';
    }

    function sectionHtml(icon, title, inner) {
        return '<div class="result-section"><h3><span class="icon">' + icon + '</span>' + title + '</h3>' + inner + '</div>';
    }

    function listHtml(arr) {
        return '<ul class="result-list">' + arr.map(function (it) {
            return '<li>' + escapeHtml(it) + '</li>';
        }).join('') + '</ul>';
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* ============ 语音输入（MediaRecorder + 硅基流动多模态转写）============ */
    const TTS_VOICES = {
        judge: 'FunAudioLLM/CosyVoice2-0.5B:charles',
        plaintiff: 'FunAudioLLM/CosyVoice2-0.5B:alex',
        defendant: 'FunAudioLLM/CosyVoice2-0.5B:benjamin',
        thirdparty: 'FunAudioLLM/CosyVoice2-0.5B:david',
        witness: 'FunAudioLLM/CosyVoice2-0.5B:claire'
    };

    let mediaRecorder = null;
    let audioChunks = [];
    let recordingStream = null;
    let recognitionActive = false;
    let preVoiceText = '';
    let lastTranscription = '';
    let transcribing = false;
    let transcriptionTimer = null;

    function encodeWav(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const bitDepth = 16;
        const numSamples = audioBuffer.length;
        const blockAlign = numChannels * bitDepth / 8;
        const byteRate = sampleRate * blockAlign;
        const dataSize = numSamples * blockAlign;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        let p = 0;
        function ws(s) { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); }
        function u32(v) { view.setUint32(p, v, true); p += 4; }
        function u16(v) { view.setUint16(p, v, true); p += 2; }
        ws('RIFF'); u32(36 + dataSize); ws('WAVE'); ws('fmt ');
        u32(16); u16(1); u16(numChannels); u32(sampleRate);
        u32(byteRate); u16(blockAlign); u16(bitDepth);
        ws('data'); u32(dataSize);
        const channels = [];
        for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
        for (let i = 0; i < numSamples; i++) {
            for (let c = 0; c < numChannels; c++) {
                let s = Math.max(-1, Math.min(1, channels[c][i]));
                view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                p += 2;
            }
        }
        return buffer;
    }

    function blobToWavBlob(blob) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onloadend = function () {
                const arrBuf = reader.result;
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) { reject(new Error('浏览器不支持 AudioContext')); return; }
                const ctx = new AC();
                ctx.decodeAudioData(arrBuf, function (audioBuffer) {
                    const wavBuf = encodeWav(audioBuffer);
                    resolve(new Blob([wavBuf], { type: 'audio/wav' }));
                }, function (e) { reject(new Error('音频解码失败：' + (e.message || '格式不支持'))); });
            };
            reader.onerror = function () { reject(new Error('文件读取失败')); };
            reader.readAsArrayBuffer(blob);
        });
    }

    function doPartialTranscription() {
        if (transcribing || audioChunks.length === 0) return;
        transcribing = true;
        const chunks = audioChunks.slice();
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        blobToWavBlob(blob).then(function (wavBlob) {
            return SiliconFlow.transcribeAudio(state.apiKey, wavBlob);
        }).then(function (text) {
            if (text) {
                lastTranscription = text;
                const ta = $('user-input');
                const prefix = preVoiceText && !preVoiceText.match(/\s$/) ? preVoiceText + ' ' : preVoiceText;
                ta.value = prefix + text;
                ta.scrollTop = ta.scrollHeight;
                updateLiveBadge(text.length);
            }
            transcribing = false;
        }).catch(function () {
            transcribing = false;
        });
    }

    function updateLiveBadge(charCount) {
        const badge = $('live-badge');
        if (!badge) return;
        if (charCount > 0) {
            badge.style.display = 'inline-flex';
            badge.textContent = '已识别 ' + charCount + ' 字';
        } else {
            badge.style.display = 'none';
        }
    }

    async function startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast('当前浏览器不支持录音功能，请使用 Chrome / Edge 浏览器', 'error');
            return;
        }
        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            toast('无法访问麦克风：' + (e.message || '请检查浏览器权限'), 'error');
            return;
        }
        audioChunks = [];
        preVoiceText = $('user-input').value;
        lastTranscription = '';
        transcribing = false;
        const mimeOptions = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        let mimeType = '';
        for (let i = 0; i < mimeOptions.length; i++) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported(mimeOptions[i])) {
                mimeType = mimeOptions[i];
                break;
            }
        }
        try {
            mediaRecorder = mimeType ? new MediaRecorder(recordingStream, { mimeType: mimeType }) : new MediaRecorder(recordingStream);
        } catch (e) {
            toast('录音初始化失败：' + e.message, 'error');
            recordingStream.getTracks().forEach(function (t) { t.stop(); });
            return;
        }
        mediaRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
            recordingStream.getTracks().forEach(function (t) { t.stop(); });
            if (transcriptionTimer) { clearInterval(transcriptionTimer); transcriptionTimer = null; }
            const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            if (blob.size < 500) {
                toast('录音太短，未捕捉到语音内容', 'warning');
                updateLiveBadge(0);
                return;
            }
            toast('正在做最终识别…', 'info');
            blobToWavBlob(blob).then(function (wavBlob) {
                return SiliconFlow.transcribeAudio(state.apiKey, wavBlob);
            }).then(function (text) {
                if (text) {
                    lastTranscription = text;
                    const ta = $('user-input');
                    const prefix = preVoiceText && !preVoiceText.match(/\s$/) ? preVoiceText + ' ' : preVoiceText;
                    ta.value = prefix + text;
                    ta.scrollTop = ta.scrollHeight;
                    toast('语音识别完成', 'success');
                } else if (lastTranscription) {
                    toast('语音识别完成', 'success');
                } else {
                    toast('未识别到语音内容', 'warning');
                }
                updateLiveBadge(0);
            }).catch(function (e) {
                if (lastTranscription) {
                    toast('语音识别完成（部分结果）', 'warning');
                } else {
                    toast('语音识别失败：' + e.message, 'error');
                }
                updateLiveBadge(0);
            });
        };
        mediaRecorder.start(1000);
        recognitionActive = true;
        $('mic-btn').classList.add('recording');
        const badge = $('live-badge');
        if (badge) { badge.style.display = 'inline-block'; badge.textContent = '聆听中…'; }
        transcriptionTimer = setInterval(doPartialTranscription, 3000);
        toast('正在聆听…再次点击结束', 'info');
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        recognitionActive = false;
        $('mic-btn').classList.remove('recording');
        const badge = $('live-badge');
        if (badge && badge.style.display !== 'none') {
            badge.textContent = '识别中…';
        }
    }

    function toggleMic() {
        if (recognitionActive) {
            stopRecording();
            return;
        }
        startRecording();
    }

    /* ============ 语音朗读（CosyVoice2 TTS）============ */
    let currentAudio = null;

    function stopTTS() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        state.ttsPlaying = false;
    }

    async function speakText(speaker, text) {
        if (!state.ttsEnabled || !text) return;
        stopTTS();
        const toggle = $('tts-toggle');
        toggle.classList.add('loading');
        state.ttsPlaying = true;
        try {
            const blob = await SiliconFlow.speak(state.apiKey, text, TTS_VOICES[speaker]);
            const url = URL.createObjectURL(blob);
            currentAudio = new Audio(url);
            currentAudio.onended = function () {
                state.ttsPlaying = false;
                URL.revokeObjectURL(url);
                currentAudio = null;
            };
            await currentAudio.play();
        } catch (e) {
            toast('语音朗读失败：' + e.message, 'error');
            state.ttsEnabled = false;
            toggle.classList.remove('active', 'loading');
        } finally {
            toggle.classList.remove('loading');
        }
    }

    /* ============ Word 下载 ============ */
    function downloadWord() {
        const data = state.resultsData;
        const now = new Date();
        const stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
            pad(now.getHours()) + ':' + pad(now.getMinutes());

        const titleStyle = 'font-size:22pt;font-weight:bold;text-align:center;color:#1a2942;margin:0 0 8pt;';
        const subStyle = 'font-size:10pt;text-align:center;color:#5a5a7a;margin:0 0 20pt;';
        const h2Style = 'font-size:14pt;font-weight:bold;color:#1a2942;border-bottom:2px solid #c9a961;padding-bottom:4pt;margin:18pt 0 8pt;';
        const h3Style = 'font-size:11pt;font-weight:bold;color:#1a2942;margin:14pt 0 6pt;';
        const pStyle = 'font-size:10.5pt;line-height:1.8;color:#1a1a2e;margin:4pt 0;';
        const liStyle = 'font-size:10.5pt;line-height:1.8;color:#1a1a2e;margin:4pt 0 4pt 18pt;';
        const metaStyle = 'font-size:9pt;color:#5a5a7a;border:1px solid #ddd;padding:8pt;background:#f5f0e6;margin:0 0 16pt;';
        const cellStyle = 'border:1px solid #999;padding:6pt 10pt;font-size:10pt;';

        let body = '';
        body += '<p style="' + titleStyle + '">开庭模拟报告</p>';
        body += '<p style="' + subStyle + '">AI 庭审推演 · 生成时间：' + stamp + '</p>';
        body += '<table style="border-collapse:collapse;width:100%;' + metaStyle + '">';
        body += '<tr><td style="' + cellStyle + ';width:25%;background:#ebe3d0;font-weight:bold;">案由</td><td style="' + cellStyle + '">' + escapeHtml(state.caseType) + '</td></tr>';
        body += '<tr><td style="' + cellStyle + ';background:#ebe3d0;font-weight:bold;">你的角色</td><td style="' + cellStyle + '">' + escapeHtml(ROLE_NAMES[state.userRole]) + '</td></tr>';
        body += '<tr><td style="' + cellStyle + ';background:#ebe3d0;font-weight:bold;">使用模型</td><td style="' + cellStyle + '">' + escapeHtml(state.model) + '</td></tr>';
        body += '<tr><td style="' + cellStyle + ';background:#ebe3d0;font-weight:bold;">发言轮次</td><td style="' + cellStyle + '">' + state.conversation.length + ' 轮</td></tr>';
        body += '</table>';

        if (state.caseInfo.facts || state.caseInfo.evidence || state.caseInfo.claims) {
            body += '<h2 style="' + h2Style + '">案件信息</h2>';
            if (state.caseInfo.facts) body += '<p style="' + h3Style + '">案件事实经过</p><p style="' + pStyle + '">' + escapeHtml(state.caseInfo.facts) + '</p>';
            if (state.caseInfo.evidence) body += '<p style="' + h3Style + '">掌握的证据</p><p style="' + pStyle + '">' + escapeHtml(state.caseInfo.evidence) + '</p>';
            if (state.caseInfo.claims) body += '<p style="' + h3Style + '">诉求与理由</p><p style="' + pStyle + '">' + escapeHtml(state.caseInfo.claims) + '</p>';
        }

        body += '<h2 style="' + h2Style + '">庭审记录</h2>';
        let lastPhase = '';
        state.conversation.forEach(function (m) {
            if (m.phase !== lastPhase) {
                body += '<p style="' + h3Style + '">【' + escapeHtml(m.phase) + '】</p>';
                lastPhase = m.phase;
            }
            body += '<p style="' + pStyle + '"><b>' + escapeHtml(ROLE_NAMES[m.speaker] || m.speaker) + '：</b>' + escapeHtml(m.content) + '</p>';
        });

        body += '<h2 style="' + h2Style + '">AI 庭审总结与建议</h2>';
        if (data) {
            if (data.recap) body += '<p style="' + h3Style + '">庭审回顾</p><p style="' + pStyle + '">' + escapeHtml(data.recap) + '</p>';
            body += sectionWord('证据完善建议', data.evidence_tips, h3Style, liStyle);
            body += sectionWord('重点事实要点', data.key_facts, h3Style, liStyle);
            body += sectionWord('法律风险提示', data.risks, h3Style, liStyle);
            body += sectionWord('庭审策略建议', data.strategy, h3Style, liStyle);
        } else {
            body += '<p style="' + pStyle + '">' + escapeHtml(state.resultsRaw || '（无内容）') + '</p>';
        }

        body += '<p style="' + subStyle + ';margin-top:24pt;">本报告由 AI 庭审模拟系统自动生成，仅供参考，不构成法律意见。</p>';

        const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>开庭模拟报告</title></head><body>' + body + '</body></html>';

        const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '开庭模拟报告_' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast('报告已下载', 'success');
    }

    function sectionWord(title, arr, h3Style, liStyle) {
        if (!Array.isArray(arr) || !arr.length) return '';
        let html = '<p style="' + h3Style + '">' + escapeHtml(title) + '</p>';
        html += arr.map(function (it) { return '<p style="' + liStyle + '">▸ ' + escapeHtml(it) + '</p>'; }).join('');
        return html;
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    /* ============ 事件绑定 ============ */
    function bindEvents() {
        // API Key 输入
        $('api-key-input').addEventListener('input', function (e) {
            state.apiKey = e.target.value.trim();
            $('to-step-2').disabled = !(state.apiKey && state.model);
        });

        $('toggle-key').addEventListener('click', function () {
            const input = $('api-key-input');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        $('to-step-2').addEventListener('click', function () {
            if (state.keyChecking) return;
            if (!state.apiKey) { toast('请先输入 API-Key', 'warning'); return; }
            if (!state.model) { toast('请选择模型', 'warning'); return; }

            const btn = this;
            const originalText = btn.textContent;
            state.keyChecking = true;
            btn.disabled = true;
            btn.classList.add('checking');
            btn.textContent = '正在验证 Key…';

            SiliconFlow.testKey(state.apiKey, state.model).then(function () {
                toast('API-Key 验证通过', 'success');
                try { localStorage.setItem('sf_api_key', state.apiKey); } catch (e) {}
                try { localStorage.setItem('sf_model', state.model); } catch (e) {}
                state.keyChecking = false;
                btn.disabled = false;
                btn.classList.remove('checking');
                btn.textContent = originalText;
                showStep(2);
            }).catch(function (e) {
                state.keyChecking = false;
                btn.disabled = false;
                btn.classList.remove('checking');
                btn.textContent = originalText;
                toast('API-Key 验证失败：' + e.message + '（请确认 Key 正确且账户有余额）', 'error');
            });
        });

        $('to-step-3').addEventListener('click', function () {
            if (!state.caseType) { toast('请选择案由', 'warning'); return; }
            showStep(3);
        });

        $('to-step-4').addEventListener('click', function () {
            if (!state.userRole) { toast('请选择角色', 'warning'); return; }
            showStep(4);
        });

        // 庭审模式选择
        $$('#mode-grid .mode-card').forEach(function (card) {
            card.addEventListener('click', function () {
                $$('#mode-grid .mode-card').forEach(function (c) { c.classList.remove('selected'); });
                card.classList.add('selected');
                state.mode = card.getAttribute('data-mode');
            });
        });

        // 语音朗读开关
        $('tts-toggle').addEventListener('click', function () {
            state.ttsEnabled = !state.ttsEnabled;
            this.classList.toggle('active', state.ttsEnabled);
            if (state.ttsEnabled) {
                this.textContent = '🔊 朗读中';
                toast('已开启 AI 语音朗读（CosyVoice2）', 'success');
            } else {
                this.textContent = '🔊 语音朗读';
                stopTTS();
            }
        });

        // 语音输入
        $('mic-btn').addEventListener('click', toggleMic);

        // 返回按钮
        $$('[data-back]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                showStep(parseInt(btn.getAttribute('data-back'), 10));
            });
        });

        // 开始庭审
        $('start-trial').addEventListener('click', function () {
            const facts = $('case-facts').value.trim();
            const evidence = $('case-evidence').value.trim();
            const claims = $('case-claims').value.trim();
            if (!facts) { toast('请填写案件事实经过', 'warning'); $('case-facts').focus(); return; }
            if (!claims) { toast('请填写你的诉求与理由', 'warning'); $('case-claims').focus(); return; }
            state.caseInfo = { facts: facts, evidence: evidence, claims: claims };
            state.conversation = [];
            state.flowIndex = 0;
            state.flow = buildTrialFlow(state.userRole, state.caseInfo);

            $('trial-case').textContent = state.caseType;
            const modeLabel = state.mode === 'real' ? '真实庭审模式' : 'AI 推演模式';
            $('trial-role').textContent = '你的角色：' + ROLE_NAMES[state.userRole] + ' · ' + modeLabel;
            $('chat-area').innerHTML = '';
            hideUserInput();
            showStep(5);
            toast(state.mode === 'real' ? '真实庭审模式已开启，请逐一扮演所有角色发言' : '庭审开始，请耐心等待 AI 推演', 'info');
            runTrial();
        });

        // 用户输入提交
        $('submit-input').addEventListener('click', function () {
            const text = $('user-input').value.trim();
            if (!text) { toast('请输入发言内容，或点击"AI 代答"', 'warning'); return; }
            if (userResolve) { const r = userResolve; userResolve = null; r({ content: text, rendered: false }); }
        });

        $('user-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                $('submit-input').click();
            }
        });

        // AI 代答
        $('ai-answer').addEventListener('click', async function () {
            const turn = state.flow[state.flowIndex];
            if (!turn) return;
            const text = $('user-input').value.trim();
            const instruction = text ? ('用户已草拟内容，请基于此优化并代替用户发言：' + text) : turn.instruction;
            const aiTurn = Object.assign({}, turn, { instruction: instruction, userControlled: false });
            $('user-input').value = '';
            $('user-input').placeholder = 'AI 正在代你发言……';
            this.disabled = true;
            $('submit-input').disabled = true;
            const bubble = createStreamingBubble(turn.speaker, ROLE_NAMES[turn.speaker] + ' · AI 代答');
            bubble.classList.add('user');
            const textEl = bubble.querySelector('.bubble-text');
            let content = '';
            let firstChunk = true;
            try {
                content = await generateAI(aiTurn, function (chunk) {
                    if (firstChunk) {
                        clearTypingInBubble(textEl);
                        firstChunk = false;
                    }
                    textEl.appendChild(document.createTextNode(chunk));
                    $('chat-area').scrollTop = $('chat-area').scrollHeight;
                });
            } catch (e) {
                clearTypingInBubble(textEl);
                textEl.textContent = '（AI 代答失败：' + e.message + '）';
                toast('AI 代答失败：' + e.message, 'error');
                content = '（AI 代答失败）';
            }
            if (firstChunk) clearTypingInBubble(textEl);
            this.disabled = false;
            $('submit-input').disabled = false;
            if (userResolve) { const r = userResolve; userResolve = null; r({ content: content, rendered: true }); }
        });

        // 重新开始
        $('restart-btn').addEventListener('click', function () {
            if (state.running) {
                if (!confirm('庭审正在进行中，确定要重新开始吗？')) return;
            }
            resetAll();
        });

        $('restart-from-result').addEventListener('click', resetAll);

        $('download-word').addEventListener('click', function () {
            if (!state.resultsData && !state.resultsRaw) {
                toast('暂无可下载的报告内容', 'warning');
                return;
            }
            downloadWord();
        });

        $('back-to-trial').addEventListener('click', function () {
            showStep(5);
        });
    }

    function resetAll() {
        state.conversation = [];
        state.flowIndex = 0;
        state.flow = [];
        state.running = false;
        state.caseType = '';
        state.userRole = '';
        state.caseInfo = { facts: '', evidence: '', claims: '' };
        state.resultsData = null;
        state.resultsRaw = null;
        state.mode = 'ai';
        state.ttsEnabled = false;
        stopTTS();
        $('case-facts').value = '';
        $('case-evidence').value = '';
        $('case-claims').value = '';
        $('chat-area').innerHTML = '';
        hideUserInput();
        $$('#case-grid .option-card').forEach(function (c) { c.classList.remove('selected'); });
        $$('#role-grid .option-card').forEach(function (c) { c.classList.remove('selected'); });
        $$('#mode-grid .mode-card').forEach(function (c) { c.classList.remove('selected'); });
        const aiCard = document.querySelector('#mode-grid .mode-card[data-mode="ai"]');
        if (aiCard) aiCard.classList.add('selected');
        const ttsBtn = $('tts-toggle');
        if (ttsBtn) { ttsBtn.classList.remove('active', 'loading'); ttsBtn.textContent = '🔊 语音朗读'; }
        $('to-step-3').disabled = true;
        $('to-step-4').disabled = true;
        showStep(1);
        toast('已重置，可以开始新的模拟', 'info');
    }

    /* ============ 初始化 ============ */
    function init() {
        renderModelOptions();
        renderCaseGrid();
        renderRoleGrid();
        bindEvents();
        updateProgress(1);

        const savedKey = localStorage.getItem('sf_api_key');
        if (savedKey) {
            $('api-key-input').value = savedKey;
            state.apiKey = savedKey;
        }
        const savedModel = localStorage.getItem('sf_model');
        if (savedModel) {
            state.model = savedModel;
            $$('.model-card').forEach(function (c) { c.classList.remove('selected'); });
            const card = document.querySelector('.model-card[data-model="' + savedModel + '"]');
            if (card) {
                card.classList.add('selected');
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            }
        }
        $('to-step-2').disabled = !(state.apiKey && state.model);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
