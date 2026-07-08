// ===== 诊断逻辑模块 =====

const Diagnosis = {
    // 差距阈值
    GAP_THRESHOLD: 1.5,
    
    // 维度权重
    DIMENSION_WEIGHTS: {
        direction: 0.35,
        certainty: 0.25,
        timing: 0.20,
        cost: 0.20
    },
    
    // 诊断语配置
    DIAGNOSIS_TEXTS: {
        direction: {
            externalHigh: '外部趋势显示这个方向是上行的，但你内心觉得"这不是我的路"。你纠结的不是不知道该往哪走，而是有一个"部分"在告诉你：这可能是别人的方向，不是你的。区分"我想要的"和"我应该要的"——这个"部分"的声音值得倾听。',
            internalHigh: '你内心觉得"这就是我想要的"，但外部数据还没给出足够强的信号。你的卡点不是自我怀疑，而是外部条件还不够明朗。建议：持续关注外部信号，同时用小规模试错验证方向。',
            balanced: '方向感维度上，你的内在感受和外部环境判断基本一致，卡点不在这里。请关注其他维度。'
        },
        certainty: {
            externalHigh: '外部信息充足、路径清晰，但你内心觉得"我搞不定"。你的卡点不是缺乏信息，而是自我效能感不足。建议：把大目标拆成你能掌控的最小步骤，用"完成即反馈"的方式逐步建立信心。',
            internalHigh: '你对自己有信心，但外部信息还不够清晰。你的卡点是"信息不足"而非能力不够。建议：先做信息收集，找到至少一个可参照的案例或可执行的路径。',
            balanced: '确定性维度上，你的内在信心和外部信息清晰度基本一致，卡点不在这里。'
        },
        timing: {
            externalHigh: '外部判断显示时机合适，但你内心觉得"我等不了那么久"。你的卡点不是时机不对，而是对不确定性的耐受度较低。建议：在长期目标中嵌入短周期里程碑，用小反馈维持大方向。',
            internalHigh: '你有足够的耐心和长期视野，但外部时机可能还不成熟。你的卡点是"时机未到"，而非意愿不足。建议：保持关注，等待信号更明确时再出手。',
            balanced: '时间感维度上，你的内在耐心和外部时机判断基本一致，卡点不在这里。'
        },
        cost: {
            externalHigh: '外部显示代价可控，但你内心觉得"我承受不了失败"。你的卡点不是风险本身，而是你可能在失败后过度自责。建议：事先用文字写下"如果失败了，我会如何对待自己"，把自我同情的标准定在事情发生之前。',
            internalHigh: '你内心觉得自己能扛住失败，但外部显示代价可能比你想象的大。你的卡点是"客观代价被低估"。建议：重新评估最坏情况的客观损失。',
            balanced: '代价感维度上，你的内在承压能力和外部损失评估基本一致，卡点不在这里。'
        },
        noGap: '内外判断基本一致，决策卡点不在这四个维度。建议：关注其他可能的关键因素——外部资源是否到位、时间窗口是否紧迫、是否存在未纳入考虑的约束条件（人际关系、资金链、家庭支持等）。'
    },
    
    // 计算各维度差距
    calculateGaps: function(externalScores, internalScores) {
        const dimensionOrder = Cases.getDimensionOrder();
        const gaps = {};
        
        dimensionOrder.forEach(dim => {
            const external = externalScores[dim]?.score || 0;
            const internal = internalScores[dim] || 0;
            gaps[dim] = {
                external: external,
                internal: internal,
                gap: external - internal,
                absoluteGap: Math.abs(external - internal)
            };
        });
        
        return gaps;
    },
    
    // 找到差距最大的维度
    findMaxGapDimension: function(gaps) {
        const dimensionOrder = Cases.getDimensionOrder();
        let maxGap = -Infinity;
        let maxDimension = null;
        
        dimensionOrder.forEach(dim => {
            if (gaps[dim]?.absoluteGap > maxGap) {
                maxGap = gaps[dim].absoluteGap;
                maxDimension = dim;
            }
        });
        
        return {
            dimension: maxDimension,
            gap: maxGap,
            exceedsThreshold: maxGap >= this.GAP_THRESHOLD
        };
    },
    
    // 判断差距类型
    determineGapType: function(external, internal) {
        const gap = external - internal;
        
        if (gap >= this.GAP_THRESHOLD) {
            return 'externalHigh';
        } else if (gap <= -this.GAP_THRESHOLD) {
            return 'internalHigh';
        } else {
            return 'balanced';
        }
    },
    
    // 生成诊断语
    generateDiagnosis: function(externalScores, internalScores) {
        const gaps = this.calculateGaps(externalScores, internalScores);
        const maxGapResult = this.findMaxGapDimension(gaps);
        
        if (!maxGapResult.exceedsThreshold) {
            return {
                diagnosis: this.DIAGNOSIS_TEXTS.noGap,
                gapType: 'balanced',
                maxGapDimension: null,
                maxGapValue: maxGapResult.gap,
                gaps: gaps
            };
        }
        
        const dimension = maxGapResult.dimension;
        const gapInfo = gaps[dimension];
        const gapType = this.determineGapType(gapInfo.external, gapInfo.internal);
        
        return {
            diagnosis: this.DIAGNOSIS_TEXTS[dimension][gapType],
            gapType: gapType,
            maxGapDimension: dimension,
            maxGapValue: maxGapResult.gap,
            gaps: gaps
        };
    },
    
    // 计算外部校准总分
    calculateExternalTotal: function(externalScores) {
        const dimensionOrder = Cases.getDimensionOrder();
        let weightedSum = 0;
        let totalWeight = 0;
        
        dimensionOrder.forEach(dim => {
            const score = externalScores[dim]?.score || 0;
            const weight = this.DIMENSION_WEIGHTS[dim] || 0;
            weightedSum += score * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : 0;
    },
    
    // 计算内部自评总分
    calculateInternalTotal: function(internalScores) {
        const dimensionOrder = Cases.getDimensionOrder();
        let sum = 0;
        let count = 0;
        
        dimensionOrder.forEach(dim => {
            if (internalScores[dim] !== undefined && internalScores[dim] !== null) {
                sum += internalScores[dim];
                count++;
            }
        });
        
        return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    },
    
    // 获取差距级别
    getGapLevel: function(absoluteGap) {
        if (absoluteGap >= this.GAP_THRESHOLD) {
            return 'high';
        } else if (absoluteGap >= 1.0) {
            return 'medium';
        } else {
            return 'low';
        }
    },
    
    // 获取差距标签文本
    getGapLabel: function(gapType) {
        const labels = {
            externalHigh: '外高内低',
            internalHigh: '内高外低',
            balanced: '基本一致'
        };
        return labels[gapType] || '未知';
    },
    
    // 获取差距说明
    getGapDescription: function(gapType) {
        const descriptions = {
            externalHigh: '外部环境有利，但内在感受不对，某个"部分"在拉刹车',
            internalHigh: '内在动力充足，但外部环境不明朗，可能有盲目自信风险',
            balanced: '内外判断高度统一，卡点不在这个维度'
        };
        return descriptions[gapType] || '';
    },
    
    // 验证内部评分完整性
    validateInternalScores: function(internalScores) {
        const dimensionOrder = Cases.getDimensionOrder();
        const missing = [];
        
        dimensionOrder.forEach(dim => {
            if (internalScores[dim] === undefined || internalScores[dim] === null) {
                missing.push(dim);
            }
        });
        
        return {
            isValid: missing.length === 0,
            missing: missing
        };
    },
    
    // 生成完整诊断报告
    generateFullReport: function(caseId, externalScores, internalScores) {
        const caseInfo = Cases.getCaseById(caseId);
        const diagnosis = this.generateDiagnosis(externalScores, internalScores);
        const externalTotal = this.calculateExternalTotal(externalScores);
        const internalTotal = this.calculateInternalTotal(internalScores);
        
        return {
            caseId: caseId,
            caseTitle: caseInfo?.title || '',
            caseDescription: caseInfo?.description || '',
            externalTotal: externalTotal,
            internalTotal: internalTotal,
            overallGap: Math.abs(externalTotal - internalTotal),
            diagnosis: diagnosis,
            gaps: diagnosis.gaps,
            maxGapDimension: diagnosis.maxGapDimension,
            maxGapValue: diagnosis.maxGapValue,
            gapType: diagnosis.gapType
        };
    },
    
    // 格式化诊断结果
    formatDiagnosisResult: function(result) {
        return {
            ...result,
            gaps: Object.entries(result.gaps).map(([dimension, gapInfo]) => ({
                dimension: dimension,
                dimensionName: Cases.dimensionNames[dimension],
                external: gapInfo.external,
                internal: gapInfo.internal,
                gap: gapInfo.gap,
                absoluteGap: gapInfo.absoluteGap,
                gapLevel: this.getGapLevel(gapInfo.absoluteGap),
                gapType: this.determineGapType(gapInfo.external, gapInfo.internal)
            }))
        };
    },
    
    // 获取建议行动项
    getActionItems: function(gapType, dimension) {
        const actionItems = {
            direction: {
                externalHigh: [
                    '花10分钟写下：这个选择中，哪些是"我想要的"，哪些是"我应该要的"',
                    '做一个"无人知晓测试"：如果没人知道你的选择，你还会选这条路吗？',
                    '倾听身体信号：想到这个选择时，身体有什么感受？是兴奋还是紧绷？'
                ],
                internalHigh: [
                    '建立一个信息追踪清单，每周收集3条相关外部信号',
                    '找到至少一个正在走这条路的人，进行一次深度访谈',
                    '设计一个低成本的最小可行性测试（MVP），验证方向'
                ],
                balanced: [
                    '方向感不是卡点，关注其他维度',
                    '考虑是否有其他未被识别的约束条件'
                ]
            },
            certainty: {
                externalHigh: [
                    '把目标拆解成3个你能掌控的最小步骤',
                    '每完成一个小步骤，给自己一个明确的反馈',
                    '回顾过去的成功经验，建立信心储备'
                ],
                internalHigh: [
                    '制作一份信息收集清单，确保覆盖所有关键方面',
                    '寻找至少一个可参照的成功案例',
                    '绘制一张清晰的路径图，标注关键节点'
                ],
                balanced: [
                    '确定性不是卡点，关注其他维度',
                    '考虑是否需要更详细的执行计划'
                ]
            },
            timing: {
                externalHigh: [
                    '在长期目标中设置3个短期里程碑',
                    '建立一个信号监测系统，定期评估进展',
                    '练习延迟满足，从小事开始培养耐心'
                ],
                internalHigh: [
                    '设定一个明确的入场信号，等待信号出现',
                    '利用等待期进行能力储备和资源积累',
                    '建立情景规划，准备多个应对方案'
                ],
                balanced: [
                    '时间感不是卡点，关注其他维度',
                    '考虑是否需要更灵活的时间安排'
                ]
            },
            cost: {
                externalHigh: [
                    '写下"失败后的自我对话"，设定自我同情的标准',
                    '制定一个"安全退出计划"，明确止损条件',
                    '练习自我接纳，告诉自己"失败也是学习的一部分"'
                ],
                internalHigh: [
                    '进行最坏情况分析，量化可能的损失',
                    '寻找风险对冲方案，降低下行风险',
                    '咨询专业人士，获得客观的风险评估'
                ],
                balanced: [
                    '代价感不是卡点，关注其他维度',
                    '考虑是否有其他隐藏的成本'
                ]
            }
        };
        
        if (!dimension || !actionItems[dimension]) {
            return [];
        }
        
        return actionItems[dimension][gapType] || [];
    }
};

// 全局暴露
window.Diagnosis = Diagnosis;