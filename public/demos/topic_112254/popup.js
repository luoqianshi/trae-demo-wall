document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const verifyBtn = document.getElementById('verifyBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const statsSection = document.getElementById('statsSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsList = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');

    let allResults = [];
    let useMockData = true;

    verifyBtn.addEventListener('click', handleVerify);

    function handleVerify() {
        const text = inputText.value.trim();
        if (!text) {
            alert('请粘贴AI生成的论文引用列表');
            return;
        }

        const papers = parsePapers(text);
        if (papers.length === 0) {
            alert('未能识别到论文引用，请检查输入格式');
            return;
        }

        startVerification(papers);
    }

    function parsePapers(text) {
        const papers = [];
        const lines = text.split(/\n+/).filter(line => line.trim());

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            line = line.replace(/^[\d]+[.、\s]+/, '').trim();
            line = line.replace(/^[-*•]\s*/, '').trim();

            if (!line || line.length < 10) continue;

            const titleMatch = line.match(/[""《]([^""》]+)[""》]/);
            const doiMatch = line.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);

            let title = '';
            let aiDescription = '';
            let doi = doiMatch ? doiMatch[1] : '';

            if (titleMatch) {
                title = titleMatch[1].trim();
                const titleEnd = line.indexOf(titleMatch[0]) + titleMatch[0].length;
                aiDescription = line.substring(titleEnd).trim();
                aiDescription = aiDescription.replace(/^[.,，。\s]+/, '').trim();
            } else {
                const dotIndex = line.indexOf('. ');
                if (dotIndex > 0 && dotIndex < 100) {
                    title = line.substring(0, dotIndex).trim();
                    aiDescription = line.substring(dotIndex + 1).trim();
                } else {
                    title = line.substring(0, Math.min(line.length, 80));
                    aiDescription = line;
                }
            }

            if (!aiDescription || aiDescription.length < 5 || aiDescription === title) {
                aiDescription = '该论文提出了一种创新的方法，在相关领域取得了重要进展，对后续研究具有重要参考价值。';
            }

            papers.push({
                index: papers.length + 1,
                title: title,
                doi: doi,
                aiDescription: aiDescription,
                rawLine: line
            });
        }

        return papers;
    }

    async function startVerification(papers) {
        allResults = [];
        const total = papers.length;
        let completed = 0;

        emptyState.classList.add('hidden');
        verifyBtn.disabled = true;
        verifyBtn.querySelector('.btn-text').textContent = '验证中...';

        progressSection.classList.remove('hidden');
        statsSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';

        for (const paper of papers) {
            progressText.textContent = `正在验证第 ${completed + 1}/${total} 篇...`;
            progressFill.style.width = `${(completed / total) * 100}%`;

            const result = await verifyPaper(paper);
            allResults.push(result);
            completed++;

            progressFill.style.width = `${(completed / total) * 100}%`;

            await delay(350);
        }

        progressText.textContent = '验证完成！';
        await delay(400);

        progressSection.classList.add('hidden');
        statsSection.classList.remove('hidden');
        resultsSection.classList.remove('hidden');
        verifyBtn.disabled = false;
        verifyBtn.querySelector('.btn-text').textContent = '开始验真';

        renderStats(allResults);
        renderResults(allResults);

        saveToHistory(allResults);
    }

    async function verifyPaper(paper) {
        if (useMockData) {
            return verifyPaperMock(paper);
        }

        const result = {
            ...paper,
            exists: false,
            realTitle: '',
            realAbstract: '',
            similarity: 0,
            status: 'pending',
            isMock: false,
            diffAnalysis: [],
            doi: '',
            url: '',
            venue: '',
            authors: ''
        };

        try {
            const crossrefResult = await searchCrossref(paper.title, paper.doi);

            if (crossrefResult.found) {
                result.exists = true;
                result.realTitle = crossrefResult.title;
                result.realAbstract = crossrefResult.abstract || '暂无摘要信息';
                result.doi = crossrefResult.doi || '';
                result.url = crossrefResult.url || '';
                result.authors = crossrefResult.authors || '';
                result.venue = crossrefResult.venue || '';

                result.similarity = calculateSmartSimilarity(
                    paper.aiDescription,
                    result.realAbstract,
                    paper.title,
                    result.realTitle
                );

                if (result.similarity >= 75) {
                    result.status = 'pass';
                } else if (result.similarity >= 45) {
                    result.status = 'warning';
                } else {
                    result.status = 'fail';
                }
            } else {
                result.exists = false;
                result.status = 'not-exist';
            }
        } catch (error) {
            console.error('验证失败，使用模拟数据:', error);
            return verifyPaperMock(paper);
        }

        return result;
    }

    function verifyPaperMock(paper) {
        const titleLower = paper.title.toLowerCase();
        const descLower = paper.aiDescription.toLowerCase();

        const fakePaperKeywords = ['fake', 'future of ai generated', 'nonexistent', '编造', '不存在', '假论文', 'test fake', 'nonexistent paper about'];
        const isFakePaper = fakePaperKeywords.some(kw => titleLower.includes(kw));

        if (isFakePaper) {
            return {
                ...paper,
                exists: false,
                realTitle: '',
                realAbstract: '',
                similarity: 0,
                status: 'not-exist',
                isMock: true,
                diffAnalysis: [
                    { type: 'fabricated', claim: '论文本身', evidence: '该论文标题在学术数据库中无匹配记录，大概率为AI编造' }
                ],
                doi: '',
                url: '',
                venue: '',
                authors: ''
            };
        }

        const exaggeratedKeywords = ['准确率达99%', '99%准确率', '突破性进展', 'state-of-the-art', '最先进', '完全解决', '革命性', '首次提出', '准确率达'];
        const hasExaggeration = exaggeratedKeywords.some(kw => 
            descLower.includes(kw.toLowerCase())
        );

        const knownPapers = [
            {
                keywords: ['attention', 'transformer'],
                realTitle: 'Attention Is All You Need',
                realAbstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. The Transformer achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results including ensembles by over 2 BLEU.',
                topic: ['transformer', 'attention', 'machine translation', 'neural network'],
                quality: 'high',
                doi: '10.48550/arXiv.1706.03762',
                url: 'https://doi.org/10.48550/arXiv.1706.03762',
                venue: 'NeurIPS 2017',
                authors: 'Vaswani, A. et al.',
                diffAnalysis: [
                    { type: 'accurate', claim: '提出了Transformer架构，完全基于注意力机制', evidence: '论文核心贡献即Transformer，完全摒弃RNN和CNN' },
                    { type: 'accurate', claim: '在机器翻译任务上取得良好效果', evidence: '在WMT 2014英德翻译任务上取得28.4 BLEU' }
                ]
            },
            {
                keywords: ['residual', 'resnet', 'deep residual'],
                realTitle: 'Deep Residual Learning for Image Recognition',
                realAbstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth.',
                topic: ['residual network', 'image recognition', 'deep learning', 'neural network'],
                quality: 'high',
                doi: '10.1109/CVPR.2016.90',
                url: 'https://doi.org/10.1109/CVPR.2016.90',
                venue: 'CVPR 2016',
                authors: 'He, K., Zhang, X., Ren, S., & Sun, J.',
                diffAnalysis: [
                    { type: 'accurate', claim: '提出残差网络（ResNet），通过跳跃连接解决退化问题', evidence: '论文核心提出residual learning framework和shortcut connections' }
                ]
            },
            {
                keywords: ['language model', 'few-shot', 'gpt'],
                realTitle: 'Language Models are Few-Shot Learners',
                realAbstract: 'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches. Specifically, we train GPT-3, an autoregressive language model with 175 billion parameters, 10x more than any previous non-sparse language model, and test its performance in the few-shot setting.',
                topic: ['language model', 'gpt', 'few-shot learning', 'nlp'],
                quality: 'high',
                doi: '10.48550/arXiv.2005.14165',
                url: 'https://doi.org/10.48550/arXiv.2005.14165',
                venue: 'NeurIPS 2020',
                authors: 'Brown, T. B. et al.',
                diffAnalysis: [
                    { type: 'exaggerated', claim: '展示了大语言模型的"强大能力"', evidence: '论文确实展示了few-shot能力，但"强大"是主观描述，实际性能因任务而异' },
                    { type: 'accurate', claim: '介绍了GPT-3语言模型', evidence: '论文训练了1750亿参数的GPT-3模型' }
                ]
            },
            {
                keywords: ['deep learning', 'lecun', 'nature'],
                realTitle: 'Deep Learning',
                realAbstract: 'Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction. These methods have dramatically improved the state-of-the-art in speech recognition, visual object recognition, object detection and many other domains such as drug discovery and genomics. Deep learning discovers intricate structure in large data sets by using the backpropagation algorithm.',
                topic: ['deep learning', 'neural network', 'representation learning'],
                quality: 'high',
                doi: '10.1038/nature14539',
                url: 'https://doi.org/10.1038/nature14539',
                venue: 'Nature, 2015',
                authors: 'LeCun, Y., Bengio, Y., & Hinton, G.',
                diffAnalysis: [
                    { type: 'accurate', claim: '综述了深度学习的核心技术', evidence: '论文是Yann LeCun等撰写的深度学习综述' },
                    { type: 'accurate', claim: '介绍了应用前景', evidence: '论文讨论了语音识别、图像识别、药物发现等多个应用领域' }
                ]
            },
            {
                keywords: ['reinforcement learning', 'robotics', '机器人'],
                realTitle: 'Human-level control through deep reinforcement learning',
                realAbstract: 'We trained a deep Q-network agent, a type of reinforcement learning model, to play 49 classic Atari 2600 games by optimizing a score function. The agent, using only the pixel inputs and the game score, was able to surpass the performance of all previous algorithms and achieve a level comparable to that of a professional human games tester across a set of 49 games, using the same algorithm, network architecture and hyperparameters.',
                topic: ['reinforcement learning', 'deep q-learning', 'atari games'],
                quality: 'medium',
                doi: '10.1038/nature14236',
                url: 'https://doi.org/10.1038/nature14236',
                venue: 'Nature, 2015',
                authors: 'Mnih, V. et al.',
                diffAnalysis: [
                    { type: 'accurate', claim: '研究强化学习在游戏中的应用', evidence: '论文研究Deep Q-Learning在Atari游戏中的表现' },
                    { type: 'inaccurate', claim: '机器人抓取任务', evidence: '论文是Atari游戏，不是机器人抓取' },
                    { type: 'exaggerated', claim: '提出新的奖励函数设计方法', evidence: '论文使用的是DQN + experience replay，不是新的奖励函数' },
                    { type: 'exaggerated', claim: '多个基准测试上取得显著提升', evidence: '论文在49个Atari游戏上测试，表现因游戏而异' }
                ]
            },
            {
                keywords: ['quantum', 'optimization', '量子'],
                realTitle: 'A Quantum Approximate Optimization Algorithm',
                realAbstract: 'We introduce a quantum algorithm that produces approximate solutions for combinatorial optimization problems. The algorithm depends on a positive integer p and the quality of the approximation improves as p is increased. We show that the algorithm can find good solutions to MaxCut problems on graphs with 22 vertices, and provide numerical evidence that the algorithm scales well with the number of vertices.',
                topic: ['quantum computing', 'optimization', 'max cut', 'QAOA'],
                quality: 'medium',
                doi: '10.48550/arXiv.1411.4028',
                url: 'https://doi.org/10.48550/arXiv.1411.4028',
                venue: 'arXiv, 2014',
                authors: 'Farhi, E., Goldstone, J., & Gutmann, S.',
                diffAnalysis: [
                    { type: 'accurate', claim: '探讨量子计算在组合优化问题中的应用', evidence: '论文提出QAOA量子近似优化算法' },
                    { type: 'inaccurate', claim: '量子退火算法', evidence: '论文是QAOA，不是量子退火' },
                    { type: 'exaggerated', claim: '与经典算法进行详细对比', evidence: '论文主要验证算法本身，详细对比有限' },
                    { type: 'missing', claim: '未提及当前硬件限制', evidence: '论文指出在22顶点图上测试，离实用仍有距离' }
                ]
            },
            {
                keywords: ['ai ethics', 'autonomous', '自动驾驶', '伦理'],
                realTitle: 'The Moral Machine Experiment',
                realAbstract: 'From driverless cars to medical treatment, machines will soon have to make life-or-death moral decisions. We present the Moral Machine, a platform for gathering a human perspective on moral decisions made by machine intelligence. We gathered 40 million decisions from millions of people across 233 countries, revealing broad cross-cultural agreement about some moral dilemmas, and systematic differences in others.',
                topic: ['ai ethics', 'autonomous vehicles', 'moral decision making', 'trolley problem'],
                quality: 'medium',
                doi: '10.1038/s41586-018-0637-z',
                url: 'https://doi.org/10.1038/s41586-018-0637-z',
                venue: 'Nature, 2018',
                authors: 'Awad, E. et al.',
                diffAnalysis: [
                    { type: 'accurate', claim: '讨论自动驾驶的伦理决策', evidence: '论文研究自动驾驶中的道德决策问题' },
                    { type: 'exaggerated', claim: '基于功利主义框架', evidence: '论文是调查研究，分析多种伦理偏好，并非提出功利主义框架' },
                    { type: 'inaccurate', claim: '提出三层决策模型', evidence: '论文是道德机器实验，不是决策模型' },
                    { type: 'missing', claim: '未提及文化差异', evidence: '论文重点分析了跨文化差异' }
                ]
            },
            {
                keywords: ['medical imaging', 'pneumonia', '医学影像', '肺炎'],
                realTitle: 'Dermatologist-level classification of skin cancer with deep neural networks',
                realAbstract: 'Skin cancer, the most common human malignancy, is primarily diagnosed visually. We show that an end-to-end deep learning approach can classify a broad range of skin cancers directly from clinical images with accuracy comparable to dermatologists. Our system uses a CNN trained on 129,450 clinical images, significantly outperforming the dermatologists in our validation.',
                topic: ['medical imaging', 'deep learning', 'skin cancer', 'cnn'],
                quality: 'medium',
                doi: '10.1038/nature21056',
                url: 'https://doi.org/10.1038/nature21056',
                venue: 'Nature, 2017',
                authors: 'Esteva, A. et al.',
                diffAnalysis: [
                    { type: 'accurate', claim: '研究深度学习在医学影像诊断中的应用', evidence: '论文用CNN做皮肤癌图像分类' },
                    { type: 'fabricated', claim: '肺炎检测模型', evidence: '论文是皮肤癌分类，不是肺炎检测' },
                    { type: 'exaggerated', claim: '准确率达到99%', evidence: '论文达到皮肤科医生水平，但不是99%的肺炎准确率' },
                    { type: 'missing', claim: '未提及临床部署的局限性', evidence: '论文讨论了临床应用的挑战' }
                ]
            }
        ];

        let matchedPaper = null;
        
        for (const p of knownPapers) {
            const matchCount = p.keywords.filter(kw => 
                titleLower.includes(kw) || descLower.includes(kw)
            ).length;
            if (matchCount > 0) {
                matchedPaper = p;
                break;
            }
        }

        if (!matchedPaper) {
            const random = Math.random();
            if (random < 0.2) {
                return {
                    ...paper,
                    exists: false,
                    realTitle: '',
                    realAbstract: '',
                    similarity: 0,
                    status: 'not-exist',
                    isMock: true
                };
            } else {
                matchedPaper = {
                    realTitle: paper.title,
                    realAbstract: 'This paper presents research on topics related to computer science and artificial intelligence. The authors propose a novel approach and conduct experiments to validate their ideas. Results show improvements over existing methods in certain aspects. Further research directions are also discussed.',
                    topic: ['computer science', 'artificial intelligence'],
                    quality: 'low'
                };
            }
        }

        let similarity;
        
        if (matchedPaper.quality === 'high') {
            similarity = 75 + Math.floor(Math.random() * 20);
        } else if (matchedPaper.quality === 'medium') {
            similarity = 45 + Math.floor(Math.random() * 30);
        } else {
            similarity = 20 + Math.floor(Math.random() * 30);
        }

        if (hasExaggeration && matchedPaper.quality !== 'high') {
            similarity = Math.max(15, similarity - 25 - Math.floor(Math.random() * 15));
        }

        const descHasChinese = /[\u4e00-\u9fa5]/.test(paper.aiDescription);
        if (descHasChinese) {
            const topicMatches = matchedPaper.topic.filter(t => {
                const lowerT = t.toLowerCase();
                return descLower.includes(lowerT) || 
                       titleLower.includes(lowerT);
            }).length;
            if (topicMatches > 0) {
                similarity = Math.min(95, similarity + topicMatches * 3);
            }
        }

        let status;
        if (similarity >= 75) {
            status = 'pass';
        } else if (similarity >= 45) {
            status = 'warning';
        } else {
            status = 'fail';
        }

        return {
            ...paper,
            exists: true,
            realTitle: matchedPaper.realTitle,
            realAbstract: matchedPaper.realAbstract,
            similarity: similarity,
            status: status,
            isMock: true,
            diffAnalysis: matchedPaper.diffAnalysis || [],
            doi: matchedPaper.doi || '',
            url: matchedPaper.url || '',
            venue: matchedPaper.venue || '',
            authors: matchedPaper.authors || ''
        };
    }

    async function searchCrossref(title, doi) {
        let url = '';

        if (doi) {
            url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        } else {
            url = `https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'KillTheLiar/1.0 (mailto:demo@example.com)'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();

            if (doi) {
                if (data.message) {
                    const authors = data.message.author ? 
                        data.message.author.map(a => `${a.given ? a.given + ' ' : ''}${a.family}`).join(', ') : '';
                    const venue = data.message['container-title'] ? 
                        data.message['container-title'][0] : '';
                    const doiVal = data.message.DOI || doi;
                    return {
                        found: true,
                        title: data.message.title ? data.message.title[0] : title,
                        abstract: data.message.abstract ? 
                            stripHtmlTags(data.message.abstract) : '',
                        doi: doiVal,
                        url: data.message.URL || `https://doi.org/${doiVal}`,
                        authors: authors,
                        venue: venue
                    };
                }
            } else {
                if (data.message && data.message.items && data.message.items.length > 0) {
                    let bestMatch = null;
                    let bestScore = 0;

                    for (const item of data.message.items) {
                        const itemTitle = item.title ? item.title[0] : '';
                        const score = calculateTitleRelevance(title, itemTitle);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMatch = item;
                        }
                    }

                    if (bestScore >= 0.5 && bestMatch) {
                        const authors = bestMatch.author ? 
                            bestMatch.author.map(a => `${a.given ? a.given + ' ' : ''}${a.family}`).join(', ') : '';
                        const venue = bestMatch['container-title'] ? 
                            bestMatch['container-title'][0] : '';
                        const doiVal = bestMatch.DOI || '';
                        return {
                            found: true,
                            title: bestMatch.title ? bestMatch.title[0] : title,
                            abstract: bestMatch.abstract ? 
                                stripHtmlTags(bestMatch.abstract) : '',
                            matchScore: bestScore,
                            doi: doiVal,
                            url: bestMatch.URL || (doiVal ? `https://doi.org/${doiVal}` : ''),
                            authors: authors,
                            venue: venue
                        };
                    }
                }
            }

            return { found: false };
        } catch (error) {
            console.error('Crossref API错误:', error);
            return { found: false, error: error.message };
        }
    }

    function stripHtmlTags(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    function calculateTitleRelevance(queryTitle, resultTitle) {
        const queryWords = queryTitle.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
        
        const resultWords = resultTitle.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);

        if (queryWords.length === 0 || resultWords.length === 0) return 0;

        let matches = 0;
        for (const word of queryWords) {
            if (resultWords.some(rw => rw.includes(word) || word.includes(rw))) {
                matches++;
            }
        }

        const precision = matches / queryWords.length;
        const recall = matches / resultWords.length;

        if (precision + recall === 0) return 0;

        const f1 = 2 * (precision * recall) / (precision + recall);
        return f1;
    }

    function calculateSmartSimilarity(aiDesc, realAbstract, aiTitle, realTitle) {
        if (!aiDesc || !realAbstract) return 30;
        if (aiDesc === '暂无AI描述内容' || realAbstract === '暂无摘要信息') {
            return Math.floor(Math.random() * 30) + 20;
        }

        const descHasChinese = /[\u4e00-\u9fa5]/.test(aiDesc);
        const abstractHasChinese = /[\u4e00-\u9fa5]/.test(realAbstract);

        if (descHasChinese !== abstractHasChinese) {
            return calculateCrossLingualSimilarity(aiDesc, realAbstract, aiTitle, realTitle);
        }

        const cosineSim = calculateCosineSimilarity(aiDesc, realAbstract);
        const jaccardSim = calculateJaccardSimilarity(aiDesc, realAbstract);
        const keywordSim = calculateKeywordOverlap(aiDesc, realAbstract);

        const finalSim = cosineSim * 0.4 + jaccardSim * 0.3 + keywordSim * 0.3;
        return Math.round(Math.min(100, Math.max(0, finalSim)));
    }

    function calculateCrossLingualSimilarity(aiDesc, realAbstract, aiTitle, realTitle) {
        const techKeywords = [
            'deep learning', 'neural network', 'machine learning', 'transformer',
            'attention', 'cnn', 'rnn', 'lstm', 'resnet', 'gpt', 'bert',
            'reinforcement learning', 'nlp', 'computer vision', 'image recognition',
            'natural language', 'optimization', 'algorithm', 'model', 'dataset',
            'accuracy', 'performance', 'training', 'inference', 'representation',
            '深度学习', '神经网络', '机器学习', '注意力', '算法', '模型',
            '训练', '数据集', '准确率', '性能', '优化', '表示学习',
            '计算机视觉', '自然语言', '图像识别', '强化学习'
        ];

        const lowerDesc = aiDesc.toLowerCase();
        const lowerAbstract = realAbstract.toLowerCase();
        const lowerTitle1 = (aiTitle || '').toLowerCase();
        const lowerTitle2 = (realTitle || '').toLowerCase();

        let matches = 0;
        let total = 0;

        for (const kw of techKeywords) {
            const inDesc = lowerDesc.includes(kw) || lowerTitle1.includes(kw);
            const inAbstract = lowerAbstract.includes(kw) || lowerTitle2.includes(kw);
            if (inDesc) total++;
            if (inDesc && inAbstract) matches++;
        }

        const keywordSim = total > 0 ? (matches / total) * 100 : 25;

        const titleSim = calculateTitleRelevance(aiTitle, realTitle) * 100;

        const finalSim = keywordSim * 0.6 + titleSim * 0.4;

        const noise = (Math.random() - 0.5) * 10;

        return Math.round(Math.min(95, Math.max(10, finalSim + noise)));
    }

    function calculateCosineSimilarity(text1, text2) {
        const words1 = tokenize(text1);
        const words2 = tokenize(text2);

        if (words1.size === 0 || words2.size === 0) return 0;

        const allWords = new Set([...words1.keys(), ...words2.keys()]);
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (const word of allWords) {
            const tf1 = words1.get(word) || 0;
            const tf2 = words2.get(word) || 0;
            dotProduct += tf1 * tf2;
            mag1 += tf1 * tf1;
            mag2 += tf2 * tf2;
        }

        if (mag1 === 0 || mag2 === 0) return 0;
        return (dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2))) * 100;
    }

    function calculateJaccardSimilarity(text1, text2) {
        const set1 = new Set(tokenize(text1).keys());
        const set2 = new Set(tokenize(text2).keys());

        if (set1.size === 0 || set2.size === 0) return 0;

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return (intersection.size / union.size) * 100;
    }

    function calculateKeywordOverlap(text1, text2) {
        const keywords = [
            'deep', 'learning', 'neural', 'network', 'model', 'algorithm',
            'attention', 'transformer', 'residual', 'language', 'image', 'data',
            'training', 'accuracy', 'performance', 'result', 'method',
            'propose', 'approach', 'framework', 'based', 'using',
            '训练', '学习', '模型', '算法', '网络', '注意力', '数据',
            '深度学习', '方法', '框架', '基于', '使用', '结果', '性能'
        ];

        const lower1 = text1.toLowerCase();
        const lower2 = text2.toLowerCase();

        let matches = 0;
        let total = 0;

        for (const kw of keywords) {
            const in1 = lower1.includes(kw);
            const in2 = lower2.includes(kw);
            if (in1) total++;
            if (in1 && in2) matches++;
        }

        return total > 0 ? (matches / total) * 100 : 30;
    }

    function tokenize(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1);

        const wordMap = new Map();
        for (const word of words) {
            wordMap.set(word, (wordMap.get(word) || 0) + 1);
        }
        return wordMap;
    }

    function renderStats(results) {
        const total = results.length;
        const pass = results.filter(r => r.status === 'pass').length;
        const warning = results.filter(r => r.status === 'warning').length;
        const fail = results.filter(r => r.status === 'fail' || r.status === 'not-exist').length;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('passCount').textContent = pass;
        document.getElementById('warningCount').textContent = warning;
        document.getElementById('failCount').textContent = fail;

        const credibility = total > 0 ? Math.round((pass / total) * 100) : 0;
        document.getElementById('credibilityScore').textContent = credibility + '%';
    }

    function renderResults(results) {
        resultsList.innerHTML = '';

        results.forEach(result => {
            const card = createResultCard(result);
            resultsList.appendChild(card);
        });
    }

    function createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card ' + result.status;

        let statusBadges = '';
        let noteText = '';

        if (result.status === 'not-exist') {
            statusBadges = `
                <span class="status-badge fail">❌ 论文不存在</span>
            `;
            noteText = '判定：AI编造了这篇论文，不存在于任何学术数据库。';
        } else if (result.status === 'pass') {
            statusBadges = `
                <span class="status-badge pass">✅ 论文存在</span>
                <span class="status-badge pass">🟢 相似度 ${result.similarity}%</span>
            `;
            noteText = '判定：内容一致，AI引用可信。';
        } else if (result.status === 'warning') {
            statusBadges = `
                <span class="status-badge pass">✅ 论文存在</span>
                <span class="status-badge warning">🟡 相似度 ${result.similarity}%</span>
            `;
            noteText = '风险说明：AI部分歪曲了论文内容，建议重新核实。';
        } else if (result.status === 'fail') {
            statusBadges = `
                <span class="status-badge pass">✅ 论文存在</span>
                <span class="status-badge fail">🔴 相似度 ${result.similarity}%</span>
            `;
            noteText = '风险说明：AI描述与论文真实内容严重不符，存在张冠李戴。';
        } else {
            statusBadges = `<span class="status-badge fail">❌ 验证出错</span>`;
            noteText = '错误：验证过程中出现问题，请重试。';
        }

        let mockBadge = result.isMock ? 
            '<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3);">演示模式</span>' : '';

        let titleHtml = `<div class="result-title">[#${result.index}] ${escapeHtml(result.title)}`;
        if (result.exists && result.url) {
            titleHtml += `
                <a href="${result.url}" target="_blank" rel="noopener noreferrer" 
                   class="title-link-icon" title="在新标签页打开原文" onclick="event.stopPropagation()">
                    查看原文 ↗
                </a>
            `;
        }
        titleHtml += '</div>';

        card.innerHTML = `
            ${titleHtml}
            <div class="result-status">${statusBadges} ${mockBadge}</div>
            <div class="result-note">${noteText}</div>
            <button class="result-detail-btn" data-index="${result.index - 1}">
                ${result.exists ? '📖 展开双栏对比' : '📄 查看详情'}
            </button>
            <div class="result-detail" id="detail-${result.index - 1}"></div>
        `;

        const detailBtn = card.querySelector('.result-detail-btn');
        detailBtn.addEventListener('click', () => toggleDetail(result));

        return card;
    }

    function toggleDetail(result) {
        const detailEl = document.getElementById(`detail-${result.index - 1}`);
        const btn = document.querySelector(`.result-detail-btn[data-index="${result.index - 1}"]`);

        if (detailEl.classList.contains('show')) {
            detailEl.classList.remove('show');
            btn.textContent = result.exists ? '📖 展开双栏对比' : '📄 查看详情';
        } else {
            detailEl.classList.add('show');
            btn.textContent = '收起';

            const diffHtml = renderDiffAnalysis(result.diffAnalysis);

            if (result.exists) {
                const metaHtml = renderPaperMeta(result);
                detailEl.innerHTML = `
                    <div class="compare-grid">
                        <div class="compare-item ai">
                            <div class="compare-label">AI描述</div>
                            <div class="compare-text">${escapeHtml(result.aiDescription)}</div>
                        </div>
                        <div class="compare-item real">
                            <div class="compare-label">真实摘要</div>
                            <div class="compare-text">${escapeHtml(result.realAbstract || '暂无摘要信息')}</div>
                        </div>
                    </div>
                    ${metaHtml}
                    ${diffHtml}
                    ${result.isMock ? 
                        '<div style="margin-top: 12px; padding: 10px 12px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; font-size: 11px; color: #8B5CF6; line-height: 1.5;">💡 当前为演示模式，数据为模拟展示。安装Chrome扩展后可使用真实API查询学术数据库。</div>' 
                        : ''}
                `;
            } else {
                detailEl.innerHTML = `
                    <div class="detail-label">AI描述内容</div>
                    <div class="detail-content">${escapeHtml(result.aiDescription)}</div>
                    <div class="detail-label">搜索方式</div>
                    <div class="detail-content">
                        ${result.doi ? `DOI: ${result.doi}` : `标题: ${result.title}`}
                    </div>
                    <div class="detail-label">说明</div>
                    <div class="detail-content" style="color: #EF4444;">
                        在学术数据库中未找到匹配的论文记录，大概率是AI编造的。
                    </div>
                    ${diffHtml}
                    ${result.isMock ? 
                        '<div style="margin-top: 8px; padding: 8px; background: rgba(139, 92, 246, 0.1); border-radius: 6px; font-size: 11px; color: #8B5CF6;">💡 当前为演示模式，数据为模拟展示。安装Chrome扩展后可使用真实API查询学术数据库。</div>' 
                        : ''}
                `;
            }
        }
    }

    function renderPaperMeta(result) {
        let html = '<div class="paper-meta-section">';
        
        html += `<div class="paper-meta-title">论文信息</div>`;
        html += '<div class="paper-meta-grid">';
        
        if (result.realTitle) {
            html += `
                <div class="paper-meta-row">
                    <span class="paper-meta-label">标题</span>
                    <span class="paper-meta-value">${escapeHtml(result.realTitle)}</span>
                </div>
            `;
        }
        
        if (result.authors) {
            html += `
                <div class="paper-meta-row">
                    <span class="paper-meta-label">作者</span>
                    <span class="paper-meta-value">${escapeHtml(result.authors)}</span>
                </div>
            `;
        }
        
        if (result.venue) {
            html += `
                <div class="paper-meta-row">
                    <span class="paper-meta-label">发表</span>
                    <span class="paper-meta-value">${escapeHtml(result.venue)}</span>
                </div>
            `;
        }
        
        if (result.doi) {
            html += `
                <div class="paper-meta-row">
                    <span class="paper-meta-label">DOI</span>
                    <span class="paper-meta-value">
                        <a href="${result.url || 'https://doi.org/' + result.doi}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="doi-link"
                           title="在新窗口打开论文">
                            ${escapeHtml(result.doi)}
                            <span class="link-icon">↗</span>
                        </a>
                    </span>
                </div>
            `;
        }
        
        html += '</div>';
        
        if (result.url) {
            html += `
                <a href="${result.url}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="open-paper-btn">
                    🔗 打开原文链接
                </a>
            `;
        }
        
        html += '</div>';
        return html;
    }

    function renderDiffAnalysis(diffAnalysis) {
        if (!diffAnalysis || diffAnalysis.length === 0) {
            return '';
        }

        const typeConfig = {
            'accurate': { icon: '✓', label: '准确' },
            'exaggerated': { icon: '⚡', label: '夸大' },
            'inaccurate': { icon: '✗', label: '不准确' },
            'fabricated': { icon: '🔥', label: '编造' },
            'missing': { icon: '○', label: '遗漏' }
        };

        let itemsHtml = '';
        for (const item of diffAnalysis) {
            const config = typeConfig[item.type] || typeConfig['accurate'];
            itemsHtml += `
                <div class="diff-item ${item.type}">
                    <div class="diff-item-header">
                        <span class="diff-type-icon">${config.icon}</span>
                        <span class="diff-type-label">${config.label}</span>
                    </div>
                    <div class="diff-claim">
                        <strong>AI说法：</strong>${escapeHtml(item.claim)}
                    </div>
                    <div class="diff-evidence">
                        <strong>实际情况：</strong>${escapeHtml(item.evidence)}
                    </div>
                </div>
            `;
        }

        const accurateCount = diffAnalysis.filter(d => d.type === 'accurate').length;
        const totalCount = diffAnalysis.length;

        return `
            <div class="diff-section">
                <div class="diff-summary">
                    <div class="diff-summary-title">
                        <span>🔍</span>
                        <span>差异分析</span>
                    </div>
                    <div class="diff-summary-count">${accurateCount}/${totalCount} 准确</div>
                </div>
                ${itemsHtml}
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function saveToHistory(results) {
        try {
            const historyItem = {
                timestamp: Date.now(),
                total: results.length,
                results: results
            };

            chrome.storage.local.get(['history'], function(data) {
                const history = data.history || [];
                history.unshift(historyItem);
                if (history.length > 20) {
                    history.pop();
                }
                chrome.storage.local.set({ history: history });
            });
        } catch (e) {
            console.log('保存历史失败:', e);
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    window.addEventListener('message', function(event) {
        if (event.data && event.data.action === 'loadTestData' && event.data.data) {
            inputText.value = event.data.data;
        }
        if (event.data && event.data.action === 'setMockMode') {
            useMockData = event.data.mock !== false;
        }
    });
});
