import { Prototype, Component } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const generatePrototype = (analysis: any): Prototype => {
  const components: Component[] = [];
  
  components.push({
    id: generateId(),
    type: 'navigation',
    props: { title: '系统首页' },
    style: { width: '100%', height: '60px', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '18px', fontWeight: 'bold' },
    position: { x: 0, y: 0 },
  });

  let yOffset = 80;
  
  if (analysis.features && analysis.features.length > 0) {
    const featureCards = analysis.features.slice(0, 3).map((feature: any, index: number) => ({
      id: generateId(),
      type: 'card',
      props: { 
        title: feature.name, 
        description: feature.description,
        priority: feature.priority
      },
      style: { 
        width: '280px', 
        height: '160px', 
        backgroundColor: '#fff', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      position: { x: 40 + index * 320, y: yOffset },
    }));
    components.push(...featureCards);
    yOffset += 180;
  }

  if (analysis.userStories && analysis.userStories.length > 0) {
    components.push({
      id: generateId(),
      type: 'card',
      props: { 
        title: '用户故事',
        stories: analysis.userStories.slice(0, 3)
      },
      style: { 
        width: '920px', 
        height: '200px', 
        backgroundColor: '#fff', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      position: { x: 40, y: yOffset },
    });
    yOffset += 220;
  }

  if (analysis.entities && analysis.entities.length > 0) {
    const entityCards = analysis.entities.slice(0, 2).map((entity: any, index: number) => ({
      id: generateId(),
      type: 'card',
      props: { 
        title: `实体: ${entity.name}`,
        attributes: entity.attributes
      },
      style: { 
        width: '440px', 
        height: '180px', 
        backgroundColor: '#fff', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      position: { x: 40 + index * 480, y: yOffset },
    }));
    components.push(...entityCards);
  }

  return {
    id: generateId(),
    pages: [
      {
        id: generateId(),
        name: '首页',
        components,
      },
    ],
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#f97316',
      fontFamily: 'Inter',
      borderRadius: '8px',
    },
  };
};

export const createComponent = (type: string, x: number, y: number): Component => {
  const defaultStyles: Record<string, React.CSSProperties> = {
    button: { width: '120px', height: '40px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    input: { width: '200px', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px', fontSize: '14px' },
    text: { fontSize: '16px', color: '#374151' },
    card: { width: '200px', height: '150px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    list: { width: '250px', height: '200px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' },
    navigation: { width: '100%', height: '60px', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px' },
    form: { width: '300px', height: '250px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
    modal: { width: '400px', height: '250px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    table: { width: '400px', height: '200px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
    chart: { width: '300px', height: '200px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' },
    image: { width: '200px', height: '150px', backgroundColor: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    dropdown: { width: '150px', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px' },
    checkbox: { width: '20px', height: '20px', border: '2px solid #d1d5db', borderRadius: '4px' },
    radio: { width: '20px', height: '20px', border: '2px solid #d1d5db', borderRadius: '50%' },
    textarea: { width: '250px', height: '100px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '14px', resize: 'none' },
  };

  return {
    id: generateId(),
    type: type as any,
    props: { label: type === 'button' ? '按钮' : type === 'input' ? '输入框' : '组件' },
    style: defaultStyles[type] || { width: '100px', height: '100px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px' },
    position: { x, y },
  };
};
