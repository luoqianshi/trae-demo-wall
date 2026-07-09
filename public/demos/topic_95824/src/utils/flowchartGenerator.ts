import { Flowchart, AnalysisResult, FlowchartNode, FlowchartEdge } from '../types';

export const generateFlowchart = (analysis: AnalysisResult): Flowchart => {
  const nodes: FlowchartNode[] = [
    { id: 'start', label: '开始', type: 'start', x: 200, y: 30 },
  ];
  
  const edges: FlowchartEdge[] = [];
  
  let currentY = 110;
  let prevNodeId = 'start';
  
  const processSteps = [
    `需求收集与分析`,
    `功能模块设计`,
    `原型设计与评审`,
    `开发实现`,
    `测试验证`,
    `上线交付`,
  ];
  
  processSteps.forEach((step, index) => {
    const nodeId = `step_${index}`;
    nodes.push({
      id: nodeId,
      label: step,
      type: 'process',
      x: 200,
      y: currentY,
    });
    edges.push({
      id: `edge_${index}`,
      source: prevNodeId,
      target: nodeId,
    });
    prevNodeId = nodeId;
    currentY += 80;
  });
  
  nodes.push({
    id: 'end',
    label: '结束',
    type: 'end',
    x: 200,
    y: currentY,
  });
  edges.push({
    id: 'edge_end',
    source: prevNodeId,
    target: 'end',
  });
  
  return {
    id: `flow_${Date.now()}`,
    name: '业务流程图',
    nodes,
    edges,
  };
};

export const generateNutritionFlowchart = (): Flowchart => {
  const nodes: FlowchartNode[] = [
    { id: 'start', label: '病人入院', type: 'start', x: 200, y: 30 },
    { id: 'step1', label: '病人基本信息录入', type: 'process', x: 200, y: 110 },
    { id: 'step2', label: '营养评估', type: 'process', x: 200, y: 190 },
    { id: 'decision1', label: '是否特殊饮食', type: 'decision', x: 200, y: 270 },
    { id: 'step3', label: '特殊饮食方案', type: 'process', x: 400, y: 270 },
    { id: 'step4', label: '标准膳食方案', type: 'process', x: 0, y: 270 },
    { id: 'step5', label: '制定膳食计划', type: 'process', x: 200, y: 350 },
    { id: 'step6', label: '生成配餐清单', type: 'process', x: 200, y: 430 },
    { id: 'step7', label: '厨房配餐配送', type: 'process', x: 200, y: 510 },
    { id: 'step8', label: '病人用餐确认', type: 'process', x: 200, y: 590 },
    { id: 'step9', label: '营养摄入跟踪', type: 'process', x: 200, y: 670 },
    { id: 'decision2', label: '是否需要调整', type: 'decision', x: 200, y: 750 },
    { id: 'end', label: '出院/继续', type: 'end', x: 200, y: 830 },
  ];
  
  const edges: FlowchartEdge[] = [
    { id: 'e1', source: 'start', target: 'step1' },
    { id: 'e2', source: 'step1', target: 'step2' },
    { id: 'e3', source: 'step2', target: 'decision1' },
    { id: 'e4', source: 'decision1', target: 'step3', label: '是' },
    { id: 'e5', source: 'decision1', target: 'step4', label: '否' },
    { id: 'e6', source: 'step3', target: 'step5' },
    { id: 'e7', source: 'step4', target: 'step5' },
    { id: 'e8', source: 'step5', target: 'step6' },
    { id: 'e9', source: 'step6', target: 'step7' },
    { id: 'e10', source: 'step7', target: 'step8' },
    { id: 'e11', source: 'step8', target: 'step9' },
    { id: 'e12', source: 'step9', target: 'decision2' },
    { id: 'e13', source: 'decision2', target: 'step2', label: '是' },
    { id: 'e14', source: 'decision2', target: 'end', label: '否' },
  ];
  
  return {
    id: 'nutrition_flow',
    name: '病人营养膳食管理流程',
    nodes,
    edges,
  };
};
