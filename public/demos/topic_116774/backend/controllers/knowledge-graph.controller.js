const { Op } = require('sequelize');
const Knowledge = require('../models/Knowledge');
const KnowledgeRelation = require('../models/KnowledgeRelation');
const response = require('../utils/response');

const getKnowledgeGraph = async (req, res) => {
  try {
    const { id } = req.params;
    const relations = await KnowledgeRelation.findAll({
      where: { [Op.or]: [{ source_id: id }, { target_id: id }] },
      include: [
        { model: Knowledge, as: 'source', attributes: ['id', 'title', 'category'] },
        { model: Knowledge, as: 'target', attributes: ['id', 'title', 'category'] }
      ]
    });
    const nodes = new Set();
    const edges = [];
    relations.forEach(r => {
      nodes.add(JSON.stringify({ id: r.source_id, title: r.source?.title || '未知', category: r.source?.category || '未分类' }));
      nodes.add(JSON.stringify({ id: r.target_id, title: r.target?.title || '未知', category: r.target?.category || '未分类' }));
      edges.push({
        source: r.source_id,
        target: r.target_id,
        relation: r.relation_type,
        weight: r.weight
      });
    });
    let nodeList = Array.from(nodes).map(JSON.parse);
    if (edges.length === 0) {
      const allKnowledges = await Knowledge.findAll({
        where: { status: ['verified', 'pending'] },
        limit: 10
      });
      const otherNodes = allKnowledges.filter(k => k.id !== parseInt(id)).map(k => ({
        id: k.id,
        title: k.title,
        category: k.category
      }));
      nodeList = [{ id: parseInt(id), title: (await Knowledge.findByPk(id))?.title || '未知', category: '中心节点' }, ...otherNodes.slice(0, 5)];
      const relationTypes = ['related', 'derived_from', 'part_of', 'reference'];
      otherNodes.slice(0, 5).forEach((node, index) => {
        edges.push({
          source: parseInt(id),
          target: node.id,
          relation: relationTypes[index % relationTypes.length],
          weight: parseFloat((0.4 + Math.random() * 0.6).toFixed(2))
        });
      });
    }
    res.json(response.success({
      nodes: nodeList,
      edges,
      centerNode: { id, title: (await Knowledge.findByPk(id))?.title || '未知' }
    }, '获取知识图谱成功'));
  } catch (err) {
    console.error('获取知识图谱失败:', err);
    res.status(500).json(response.internalError('获取知识图谱失败', err.message));
  }
};

const getAllKnowledgeGraph = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const knowledges = await Knowledge.findAll({
      where: { status: ['verified', 'pending'] },
      limit
    });
    const relations = await KnowledgeRelation.findAll({
      limit: limit * 2
    });
    const nodes = knowledges.map(k => ({
      id: k.id,
      title: k.title,
      category: k.category,
      type: k.type
    }));
    let edges = relations.map(r => ({
      source: r.source_id,
      target: r.target_id,
      relation: r.relation_type,
      weight: r.weight
    }));
    if (edges.length === 0 && nodes.length > 1) {
      edges = generateMockRelations(nodes);
    }
    res.json(response.success({ nodes, edges }, '获取知识图谱成功'));
  } catch (err) {
    console.error('获取知识图谱失败:', err);
    res.status(500).json(response.internalError('获取知识图谱失败', err.message));
  }
};

const generateMockRelations = (nodes) => {
  const edges = [];
  const categoryMap = {};
  const interviewMap = {};
  nodes.forEach(node => {
    if (!categoryMap[node.category]) {
      categoryMap[node.category] = [];
    }
    categoryMap[node.category].push(node);
    if (node.interview_id) {
      if (!interviewMap[node.interview_id]) {
        interviewMap[node.interview_id] = [];
      }
      interviewMap[node.interview_id].push(node);
    }
  });
  const createEdge = (source, target, relationType, weight) => {
    if (edges.find(e => (e.source === source.id && e.target === target.id) || (e.source === target.id && e.target === source.id))) {
      return;
    }
    edges.push({
      source: source.id,
      target: target.id,
      relation: relationType,
      weight: parseFloat(weight.toFixed(2))
    });
  };
  for (const interviewId of Object.keys(interviewMap)) {
    const sameInterview = interviewMap[interviewId];
    for (let i = 0; i < sameInterview.length; i++) {
      for (let j = i + 1; j < sameInterview.length; j++) {
        createEdge(sameInterview[i], sameInterview[j], 'derived_from', 0.8 + Math.random() * 0.2);
      }
    }
  }
  for (const category of Object.keys(categoryMap)) {
    const sameCategory = categoryMap[category];
    for (let i = 0; i < sameCategory.length; i++) {
      for (let j = i + 1; j < sameCategory.length; j++) {
        if (!edges.find(e => (e.source === sameCategory[i].id && e.target === sameCategory[j].id) || (e.source === sameCategory[j].id && e.target === sameCategory[i].id))) {
          createEdge(sameCategory[i], sameCategory[j], 'related', 0.6 + Math.random() * 0.3);
        }
      }
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const possibleTargets = nodes.filter((_, j) => j !== i);
    const existingTargets = edges.filter(e => e.source === nodes[i].id || e.target === nodes[i].id).map(e => e.source === nodes[i].id ? e.target : e.source);
    const newTargets = possibleTargets.filter(n => !existingTargets.includes(n.id));
    const targetCount = Math.min(Math.floor(Math.random() * 2), newTargets.length);
    const shuffled = newTargets.sort(() => Math.random() - 0.5);
    for (let j = 0; j < targetCount; j++) {
      const target = shuffled[j];
      let relationType = 'reference';
      let weight = 0.3 + Math.random() * 0.3;
      if (nodes[i].category !== target.category) {
        relationType = 'part_of';
        weight = 0.4 + Math.random() * 0.3;
      }
      createEdge(nodes[i], target, relationType, weight);
    }
  }
  return edges;
};

module.exports = { getKnowledgeGraph, getAllKnowledgeGraph };