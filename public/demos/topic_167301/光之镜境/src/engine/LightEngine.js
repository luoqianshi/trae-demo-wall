export class LightEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.elements = [];
        this.rays = [];
        this.showNormal = false;
        this.darkMode = false;
        this.trailCanvas = null;
        this.trailCtx = null;
        this.lastFrameTime = 0;
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.trailCanvas) {
            this.trailCanvas.width = width;
            this.trailCanvas.height = height;
        }
    }

    initTrailCanvas() {
        if (!this.trailCanvas) {
            this.trailCanvas = document.createElement('canvas');
            this.trailCanvas.width = this.canvas.width;
            this.trailCanvas.height = this.canvas.height;
            this.trailCtx = this.trailCanvas.getContext('2d');
        }
    }

    addElement(element) {
        this.elements.push(element);
    }

    removeElement(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
    }

    clearElements() {
        this.elements = [];
    }

    clearTrails() {
        if (this.trailCtx) {
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        }
    }

    updateRays() {
        this.rays = [];
        
        const lasers = this.elements.filter(e => e.type === 'laser');
        
        for (const laser of lasers) {
            const angle = laser.rotation * Math.PI / 180;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
            
            const ray = {
                startX: laser.x,
                startY: laser.y,
                direction,
                color: laser.color || '#fbbf24',
                segments: []
            };
            
            let currentX = laser.x;
            let currentY = laser.y;
            let currentDir = { ...direction };
            let reflections = 0;
            const maxReflections = 20;
            
            while (reflections < maxReflections) {
                const endX = currentX + currentDir.x * Math.max(this.canvas.width, this.canvas.height) * 2;
                const endY = currentY + currentDir.y * Math.max(this.canvas.width, this.canvas.height) * 2;
                
                let closestHit = null;
                let closestDistance = Infinity;
                let hitElement = null;
                
                for (const element of this.elements) {
                    if (element.type === 'laser') continue;
                    
                    if (element.type === 'mirror' || element.type === 'concave' || element.type === 'convex') {
                        const line = this.getMirrorLine(element);
                        const intersection = this.lineIntersection(
                            currentX, currentY, endX, endY,
                            line.x1, line.y1, line.x2, line.y2
                        );
                        
                        if (intersection) {
                            const dx = intersection.x - currentX;
                            const dy = intersection.y - currentY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 1 && distance < closestDistance) {
                                closestDistance = distance;
                                closestHit = intersection;
                                hitElement = element;
                            }
                        }
                    } else if (element.type === 'target') {
                        const dx = currentX - element.x;
                        const dy = currentY - element.y;
                        const distToCenter = Math.sqrt(dx * dx + dy * dy);
                        
                        const dot = dx * currentDir.x + dy * currentDir.y;
                        const closestPointDist = -dot / (currentDir.x * currentDir.x + currentDir.y * currentDir.y);
                        
                        if (closestPointDist > 0) {
                            const closestX = currentX + currentDir.x * closestPointDist;
                            const closestY = currentY + currentDir.y * closestPointDist;
                            const dx2 = closestX - element.x;
                            const dy2 = closestY - element.y;
                            const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                            
                            if (dist < element.radius + 5) {
                                closestDistance = closestPointDist;
                                closestHit = { x: closestX, y: closestY };
                                hitElement = element;
                            }
                        }
                    } else if (element.type === 'screen') {
                        const line = {
                            x1: element.x - element.width / 2,
                            y1: element.y,
                            x2: element.x + element.width / 2,
                            y2: element.y
                        };
                        const intersection = this.lineIntersection(
                            currentX, currentY, endX, endY,
                            line.x1, line.y1, line.x2, line.y2
                        );
                        
                        if (intersection) {
                            const dx = intersection.x - currentX;
                            const dy = intersection.y - currentY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 1 && distance < closestDistance) {
                                closestDistance = distance;
                                closestHit = intersection;
                                hitElement = element;
                            }
                        }
                    }
                }
                
                if (closestHit) {
                    ray.segments.push({
                        x1: currentX,
                        y1: currentY,
                        x2: closestHit.x,
                        y2: closestHit.y
                    });
                    
                    if (hitElement.type === 'target') {
                        hitElement.hit = true;
                        hitElement.hitTime = Date.now();
                    } else if (hitElement.type === 'screen') {
                        hitElement.hit = true;
                        hitElement.hitPos = { x: closestHit.x, y: closestHit.y };
                    }
                    
                    if (hitElement.type === 'mirror' || hitElement.type === 'concave' || hitElement.type === 'convex') {
                        const normal = this.getNormal(hitElement);
                        currentDir = this.reflect(currentDir, normal);
                        currentX = closestHit.x;
                        currentY = closestHit.y;
                        reflections++;
                    } else {
                        break;
                    }
                } else {
                    ray.segments.push({
                        x1: currentX,
                        y1: currentY,
                        x2: endX,
                        y2: endY
                    });
                    break;
                }
            }
            
            this.rays.push(ray);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.darkMode) {
            this.drawDarkModeBackground();
        }
        
        if (this.trailCanvas) {
            this.ctx.drawImage(this.trailCanvas, 0, 0);
        }
        
        this.drawElements();
        
        if (this.showNormal) {
            this.drawNormals();
        }
        
        this.drawRays();
    }

    drawDarkModeBackground() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawElements() {
        for (const element of this.elements) {
            this.drawElement(element);
        }
    }

    drawElement(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        this.ctx.rotate(element.rotation * Math.PI / 180);
        
        switch (element.type) {
            case 'laser':
                this.drawLaser(element);
                break;
            case 'mirror':
                this.drawMirror(element);
                break;
            case 'concave':
                this.drawConcaveMirror(element);
                break;
            case 'convex':
                this.drawConvexMirror(element);
                break;
            case 'screen':
                this.drawScreen(element);
                break;
            case 'target':
                this.drawTarget(element);
                break;
            case 'obstacle':
                this.drawObstacle(element);
                break;
            case 'protractor':
                this.drawProtractor(element);
                break;
            case 'sensor':
                this.drawSensor(element);
                break;
            case 'canvas':
                this.drawLightCanvas(element);
                break;
        }
        
        this.ctx.restore();
    }

    drawLaser(element) {
        const size = 30;
        
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.6, -size * 0.4);
        this.ctx.lineTo(-size * 0.4, 0);
        this.ctx.lineTo(-size * 0.6, size * 0.4);
        this.ctx.closePath();
        
        const gradient = this.ctx.createLinearGradient(-size, 0, size, 0);
        gradient.addColorStop(0, '#374151');
        gradient.addColorStop(1, '#6b7280');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, 0, 5, 0, Math.PI * 2);
        const glowGradient = this.ctx.createRadialGradient(size * 0.5, 0, 0, size * 0.5, 0, 10);
        glowGradient.addColorStop(0, element.color || '#fbbf24');
        glowGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.5)');
        glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(size * 0.5, 0, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = element.color || '#fbbf24';
        this.ctx.fill();
    }

    drawMirror(element) {
        const width = element.width || 80;
        const height = element.height || 12;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-width / 2, -height / 2, width, height, 4);
        
        const gradient = this.ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
        gradient.addColorStop(0, '#94a3b8');
        gradient.addColorStop(0.3, '#e2e8f0');
        gradient.addColorStop(0.7, '#e2e8f0');
        gradient.addColorStop(1, '#94a3b8');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-width / 2 + 5, -height / 2 + 3);
        this.ctx.lineTo(width / 2 - 5, -height / 2 + 3);
        this.ctx.strokeStyle = '#f1f5f9';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('M', 0, 4);
    }

    drawConcaveMirror(element) {
        const width = element.width || 80;
        const height = element.height || 30;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, width / 2, Math.PI, 0);
        this.ctx.lineWidth = height;
        this.ctx.lineCap = 'round';
        
        const gradient = this.ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(0.5, '#e2e8f0');
        gradient.addColorStop(1, '#64748b');
        this.ctx.strokeStyle = gradient;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('凹', 0, 5);
    }

    drawConvexMirror(element) {
        const width = element.width || 80;
        const height = element.height || 30;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, width / 2, 0, Math.PI);
        this.ctx.lineWidth = height;
        this.ctx.lineCap = 'round';
        
        const gradient = this.ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
        gradient.addColorStop(0, '#64748b');
        gradient.addColorStop(0.5, '#e2e8f0');
        gradient.addColorStop(1, '#64748b');
        this.ctx.strokeStyle = gradient;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('凸', 0, 5);
    }

    drawScreen(element) {
        const width = element.width || 100;
        const height = element.height || 8;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-width / 2, -height / 2, width, height, 2);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        if (element.hit && element.hitPos) {
            const localHitX = element.hitPos.x - element.x;
            this.ctx.beginPath();
            this.ctx.arc(localHitX, 0, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fill();
        }
    }

    drawTarget(element) {
        const radius = element.radius || 25;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        
        if (element.hit) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(0.5, '#16a34a');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.3)');
            this.ctx.fillStyle = gradient;
            
            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 20;
        } else {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(0.5, '#dc2626');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
            this.ctx.fillStyle = gradient;
            
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-radius * 0.4, 0);
        this.ctx.lineTo(radius * 0.4, 0);
        this.ctx.moveTo(0, -radius * 0.4);
        this.ctx.lineTo(0, radius * 0.4);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('靶', 0, 0);
    }

    drawObstacle(element) {
        const width = element.width || 60;
        const height = element.height || 40;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-width / 2, -height / 2, width, height, 4);
        
        const gradient = this.ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
        gradient.addColorStop(0, '#475569');
        gradient.addColorStop(1, '#64748b');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('障碍', 0, 2);
    }

    drawProtractor(element) {
        const radius = 60;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, Math.PI, 0);
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-radius, 0);
        this.ctx.lineTo(radius, 0);
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        for (let i = 0; i <= 180; i += 10) {
            const angle = (i - 90) * Math.PI / 180;
            const innerRadius = radius - (i % 30 === 0 ? 15 : 8);
            
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            this.ctx.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            this.ctx.strokeStyle = '#00d4ff';
            this.ctx.lineWidth = i % 30 === 0 ? 2 : 1;
            this.ctx.stroke();
            
            if (i % 30 === 0) {
                const labelRadius = radius - 22;
                this.ctx.fillStyle = '#00d4ff';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(i.toString(), Math.cos(angle) * labelRadius, Math.sin(angle) * labelRadius);
            }
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -radius - 10);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawSensor(element) {
        const size = 25;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-size / 2, -size / 2, size, size, 4);
        
        if (element.active) {
            this.ctx.fillStyle = '#22c55e';
            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 15;
        } else {
            this.ctx.fillStyle = '#475569';
        }
        
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = element.active ? '#4ade80' : '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('S', 0, 0);
    }

    drawLightCanvas(element) {
        const width = element.width || 200;
        const height = element.height || 150;
        
        this.ctx.beginPath();
        this.ctx.roundRect(-width / 2, -height / 2, width, height, 8);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        if (element.trails && element.trails.length > 0) {
            for (const trail of element.trails) {
                this.ctx.beginPath();
                this.ctx.moveTo(trail.x1 - element.x + width / 2, trail.y1 - element.y + height / 2);
                this.ctx.lineTo(trail.x2 - element.x + width / 2, trail.y2 - element.y + height / 2);
                this.ctx.strokeStyle = trail.color;
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = trail.color;
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('感光画布', 0, height / 2 - 15);
    }

    drawRays() {
        for (const ray of this.rays) {
            for (const segment of ray.segments) {
                this.drawRaySegment(segment, ray.color);
            }
        }
    }

    drawRaySegment(segment, color) {
        if (this.trailCtx) {
            this.trailCtx.beginPath();
            this.trailCtx.moveTo(segment.x1, segment.y1);
            this.trailCtx.lineTo(segment.x2, segment.y2);
            this.trailCtx.strokeStyle = color;
            this.trailCtx.lineWidth = 2;
            this.trailCtx.globalAlpha = 0.1;
            this.trailCtx.stroke();
            this.trailCtx.globalAlpha = 1;
        }
        
        const gradient = this.ctx.createLinearGradient(segment.x1, segment.y1, segment.x2, segment.y2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.hexToRgba(color, 0.3));
        this.ctx.strokeStyle = gradient;
        
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.beginPath();
        this.ctx.moveTo(segment.x1, segment.y1);
        this.ctx.lineTo(segment.x2, segment.y2);
        this.ctx.stroke();
        
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        this.drawArrowhead(segment.x2, segment.y2, segment.x1, segment.y1, color);
    }

    drawArrowhead(x, y, fromX, fromY, color) {
        const size = 8;
        const angle = Math.atan2(y - fromY, x - fromX);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - size * Math.cos(angle - Math.PI / 6),
            y - size * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x - size * Math.cos(angle + Math.PI / 6),
            y - size * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawNormals() {
        for (const element of this.elements) {
            if (element.type === 'mirror') {
                const normal = this.getNormal(element);
                const length = 40;
                
                this.ctx.beginPath();
                this.ctx.moveTo(element.x, element.y);
                this.ctx.lineTo(
                    element.x + normal.x * length,
                    element.y + normal.y * length
                );
                
                this.ctx.strokeStyle = '#ef4444';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                this.drawArrowhead(
                    element.x + normal.x * length,
                    element.y + normal.y * length,
                    element.x,
                    element.y,
                    '#ef4444'
                );
            }
        }
    }

    getMirrorLine(mirror) {
        const angle = mirror.rotation * Math.PI / 180;
        const halfWidth = (mirror.width || 80) / 2;
        return {
            x1: mirror.x - halfWidth * Math.cos(angle),
            y1: mirror.y - halfWidth * Math.sin(angle),
            x2: mirror.x + halfWidth * Math.cos(angle),
            y2: mirror.y + halfWidth * Math.sin(angle)
        };
    }

    getNormal(mirror) {
        const angle = mirror.rotation * Math.PI / 180;
        return {
            x: Math.sin(angle),
            y: -Math.cos(angle)
        };
    }

    lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (Math.abs(denom) < 1e-10) return null;
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        
        if (ua >= 0 && ua <= 1 && ub >= -0.1 && ub <= 1.1) {
            return {
                x: x1 + ua * (x2 - x1),
                y: y1 + ua * (y2 - y1),
                ua,
                ub
            };
        }
        return null;
    }

    reflect(incidentVector, normalVector) {
        const dot = incidentVector.x * normalVector.x + incidentVector.y * normalVector.y;
        return {
            x: incidentVector.x - 2 * dot * normalVector.x,
            y: incidentVector.y - 2 * dot * normalVector.y
        };
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getRayAngles() {
        const angles = [];
        
        for (const ray of this.rays) {
            if (ray.segments.length >= 2) {
                const firstSegment = ray.segments[0];
                const incidentVector = {
                    x: firstSegment.x2 - firstSegment.x1,
                    y: firstSegment.y2 - firstSegment.y1
                };
                
                for (const element of this.elements) {
                    if (element.type === 'mirror') {
                        const normal = this.getNormal(element);
                        const incidentAngle = this.calculateAngle(incidentVector, normal);
                        
                        if (ray.segments.length > 1) {
                            const secondSegment = ray.segments[1];
                            const reflectVector = {
                                x: secondSegment.x2 - secondSegment.x1,
                                y: secondSegment.y2 - secondSegment.y1
                            };
                            const reflectAngle = this.calculateAngle(reflectVector, normal);
                            
                            angles.push({
                                incidentAngle: Math.round(incidentAngle * 10) / 10,
                                reflectAngle: Math.round(reflectAngle * 10) / 10
                            });
                        }
                    }
                }
            }
        }
        
        return angles;
    }

    calculateAngle(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (mag1 === 0 || mag2 === 0) return 0;
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosAngle) * 180 / Math.PI;
    }
}
