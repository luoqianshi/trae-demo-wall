let graphSimulation = null;

function generateGraphFromData(graphData) {
    const container = document.getElementById('graphContainer');
    const svg = document.getElementById('graph-svg');
    const loading = document.getElementById('graphLoading');
    
    loading.classList.remove('hidden');
    
    setTimeout(() => {
        loading.classList.add('hidden');
        renderGraph(graphData);
    }, 1500);
}

function renderGraph(graphData) {
    const svg = d3.select('#graph-svg');
    const container = document.getElementById('graphContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.selectAll('*').remove();
    
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#94A3B8');
    
    const g = svg.append('g');
    
    const nodes = graphData.nodes.map(d => ({ ...d }));
    const edges = graphData.edges.map(d => ({ ...d }));
    
    const colorMap = {
        'core': '#F59E0B',
        'concept': '#3B82F6',
        'detail': '#10B981'
    };
    
    graphSimulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));
    
    const link = g.append('g')
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke', '#CBD5E1')
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#arrowhead)');
    
    const linkLabel = g.append('g')
        .selectAll('text')
        .data(edges)
        .enter()
        .append('text')
        .attr('font-size', '10px')
        .attr('fill', '#94A3B8')
        .attr('text-anchor', 'middle')
        .text(d => d.label);
    
    const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    node.append('circle')
        .attr('r', d => d.size)
        .attr('fill', d => colorMap[d.group])
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
    
    node.append('text')
        .attr('dy', d => d.size + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', '#1E293B')
        .text(d => d.label);
    
    node.on('mouseover', function(event, d) {
        const tooltip = document.getElementById('graphTooltip');
        tooltip.textContent = d.description || d.label;
        tooltip.classList.add('visible');
        tooltip.style.left = (event.offsetX + 10) + 'px';
        tooltip.style.top = (event.offsetY + 10) + 'px';
    })
    .on('mouseout', function() {
        document.getElementById('graphTooltip').classList.remove('visible');
    })
    .on('click', function(event, d) {
        console.log('Clicked node:', d.label);
    });
    
    graphSimulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        linkLabel
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    svg.on('dblclick', () => {
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });
}

function dragstarted(event) {
    if (!event.active) graphSimulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

function dragended(event) {
    if (!event.active) graphSimulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}

function resetGraph() {
    const svg = document.getElementById('graph-svg');
    svg.innerHTML = '';
    document.getElementById('graphLoading').classList.remove('hidden');
}

function toggleGraphPanel() {
    const panel = document.getElementById('graphPanel');
    panel.classList.toggle('expanded');
}
