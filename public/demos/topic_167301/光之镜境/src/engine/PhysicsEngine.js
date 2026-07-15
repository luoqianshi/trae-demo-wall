export class PhysicsEngine {
    static reflect(incidentVector, normalVector) {
        const dot = incidentVector.x * normalVector.x + incidentVector.y * normalVector.y;
        return {
            x: incidentVector.x - 2 * dot * normalVector.x,
            y: incidentVector.y - 2 * dot * normalVector.y
        };
    }

    static getNormal(mirror) {
        const angle = mirror.rotation * Math.PI / 180;
        return {
            x: Math.sin(angle),
            y: -Math.cos(angle)
        };
    }

    static getMirrorLine(mirror) {
        const angle = mirror.rotation * Math.PI / 180;
        const halfWidth = mirror.width / 2;
        return {
            x1: mirror.x - halfWidth * Math.cos(angle),
            y1: mirror.y - halfWidth * Math.sin(angle),
            x2: mirror.x + halfWidth * Math.cos(angle),
            y2: mirror.y + halfWidth * Math.sin(angle)
        };
    }

    static lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
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

    static calculateAngle(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (mag1 === 0 || mag2 === 0) return 0;
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosAngle) * 180 / Math.PI;
    }

    static checkTargetHit(ray, target) {
        const dx = ray.x2 - target.x;
        const dy = ray.y2 - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < target.radius + 5;
    }

    static normalizeVector(v) {
        const mag = Math.sqrt(v.x * v.x + v.y * v.y);
        if (mag === 0) return { x: 0, y: 0 };
        return { x: v.x / mag, y: v.y / mag };
    }
}

export class Ray {
    constructor(x, y, direction, color, maxReflections = 20) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.color = color;
        this.maxReflections = maxReflections;
        this.segments = [{ x1: x, y1: y, x2: x, y2: y }];
    }

    trace(elements, canvasWidth, canvasHeight) {
        this.segments = [{ x1: this.x, y1: this.y, x2: this.x, y2: this.y }];
        
        let currentX = this.x;
        let currentY = this.y;
        let currentDir = { ...this.direction };
        let reflections = 0;
        let hitTarget = null;

        while (reflections < this.maxReflections) {
            const endX = currentX + currentDir.x * Math.max(canvasWidth, canvasHeight) * 2;
            const endY = currentY + currentDir.y * Math.max(canvasWidth, canvasHeight) * 2;

            let closestHit = null;
            let closestDistance = Infinity;
            let hitElement = null;

            for (const element of elements) {
                if (element.type === 'laser') continue;

                if (element.type === 'mirror' || element.type === 'concave' || element.type === 'convex') {
                    const line = PhysicsEngine.getMirrorLine(element);
                    const intersection = PhysicsEngine.lineIntersection(
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
                    const intersection = PhysicsEngine.lineIntersection(
                        currentX, currentY, endX, endY,
                        element.x - element.radius, element.y - element.radius,
                        element.x + element.radius, element.y + element.radius
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
                this.segments.push({
                    x1: currentX,
                    y1: currentY,
                    x2: closestHit.x,
                    y2: closestHit.y
                });

                if (hitElement.type === 'target') {
                    hitTarget = hitElement;
                    break;
                }

                const normal = PhysicsEngine.getNormal(hitElement);
                currentDir = PhysicsEngine.reflect(currentDir, normal);
                currentX = closestHit.x;
                currentY = closestHit.y;
                reflections++;
            } else {
                this.segments.push({
                    x1: currentX,
                    y1: currentY,
                    x2: endX,
                    y2: endY
                });
                break;
            }
        }

        return { segments: this.segments, hitTarget };
    }
}
