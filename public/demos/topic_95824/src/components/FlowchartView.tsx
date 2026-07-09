import { Flowchart } from '../types';

interface FlowchartViewProps {
  flowchart: Flowchart;
}

export const FlowchartView = ({ flowchart }: FlowchartViewProps) => {
  const getNodeStyle = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return {
          fill: '#10b981',
          stroke: '#059669',
          color: 'white',
          rx: 30,
          ry: 30,
        };
      case 'decision':
        return {
          fill: '#fef3c7',
          stroke: '#f59e0b',
          color: '#92400e',
          rx: 0,
          ry: 0,
        };
      default:
        return {
          fill: '#dbeafe',
          stroke: '#3b82f6',
          color: '#1e40af',
          rx: 8,
          ry: 8,
        };
    }
  };

  const getNodeCenter = (node: { x: number; y: number; type: string }) => {
    const width = node.type === 'decision' ? 120 : 140;
    const height = node.type === 'decision' ? 60 : 50;
    return {
      cx: node.x + width / 2,
      cy: node.y + height / 2,
    };
  };

  const getNodeDimensions = (type: string) => {
    return type === 'decision' 
      ? { width: 120, height: 60 }
      : { width: 140, height: 50 };
  };

  const getEdgePath = (sourceId: string, targetId: string, label?: string) => {
    const sourceNode = flowchart.nodes.find(n => n.id === sourceId);
    const targetNode = flowchart.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return { path: '', labelPos: { x: 0, y: 0 } };

    const sourceDim = getNodeDimensions(sourceNode.type);
    const targetDim = getNodeDimensions(targetNode.type);

    const sourceCenter = { x: sourceNode.x + sourceDim.width / 2, y: sourceNode.y + sourceDim.height };
    const targetCenter = { x: targetNode.x + targetDim.width / 2, y: targetNode.y };

    if (sourceCenter.x === targetCenter.x) {
      return {
        path: `M ${sourceCenter.x} ${sourceCenter.y} L ${targetCenter.x} ${targetCenter.y}`,
        labelPos: { x: sourceCenter.x + 5, y: (sourceCenter.y + targetCenter.y) / 2 },
      };
    } else {
      const midY = (sourceCenter.y + targetCenter.y) / 2;
      return {
        path: `M ${sourceCenter.x} ${sourceCenter.y} L ${sourceCenter.x} ${midY} L ${targetCenter.x} ${midY} L ${targetCenter.x} ${targetCenter.y}`,
        labelPos: { x: Math.min(sourceCenter.x, targetCenter.x) + 5, y: midY - 5 },
      };
    }
  };

  const maxX = Math.max(...flowchart.nodes.map(n => n.x + (n.type === 'decision' ? 120 : 140)));
  const maxY = Math.max(...flowchart.nodes.map(n => n.y + (n.type === 'decision' ? 60 : 50)));

  return (
    <div className="overflow-auto bg-gray-50 rounded-lg p-4">
      <svg 
        width={Math.max(maxX + 100, 400)} 
        height={maxY + 60}
        className="mx-auto"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>

        {flowchart.edges.map((edge) => {
          const { path, labelPos } = getEdgePath(edge.source, edge.target, edge.label);
          return (
            <g key={edge.id}>
              <path
                d={path}
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="start"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {flowchart.nodes.map((node) => {
          const style = getNodeStyle(node.type);
          const dims = getNodeDimensions(node.type);
          
          return (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={dims.width}
                height={dims.height}
                rx={style.rx}
                ry={style.ry}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="2"
              />
              <text
                x={node.x + dims.width / 2}
                y={node.y + dims.height / 2 + 4}
                fontSize="12"
                fill={style.color}
                textAnchor="middle"
                fontWeight="500"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
