class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromArray(arr) {
        return new Point(arr[0], arr[1]);
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    static det(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    static sub(a, b) {
        return new Point(a.x - b.x, a.y - b.y);
    }

    static mul(a, b) {
        return new Point(a.x * b, a.y * b);
    }

    static mulXY(a, b) {
        return new Point(a.x / b.x, a.y / b.y);
    }

    static add(a, b) {
        return new Point(a.x + b.x, a.y + b.y);
    }

    static div(a, b) {
        return new Point(a.x / b, a.y / b);
    }
    
    static divXY(a, b) {
        return new Point(a.x / b.x, a.y / b.y);
    }

    static pow(a, b) {
        return new Point(Math.pow(a.x, b), Math.pow(a.y, b));
    }        

    static dist(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    static lerp(a, b, t) {
        return new Point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }

    static cross(a, b) {
        return (a.x * b.y) - (a.y * b.x);
    }

    static getAngle(a) {
        return Math.atan2(a.y, a.x);
    }

    static angleTo(a, b) {
        return Point.getAngle(a) - Point.getAngle(b);
    }

    static fromAngle(a) {
        return new Point(Math.cos(a), Math.sin(a));
    }

    static linePointProjection(lineCrossPoint, slope, pointToProject) {
        let perpendicular = slope;
        return new Point(pointToProject.x, perpendicular * (pointToProject.x - lineCrossPoint.x) + lineCrossPoint.y);
    }

    static get3PointCircle(a, b, c) {
        var x12 = (a.x - b.x);
        var x13 = (a.x - c.x);
    
        var y12 = (a.y - b.y);
        var y13 = (a.y - c.y);
    
        var y31 = (c.y - a.y);
        var y21 = (b.y - a.y);
    
        var x31 = (c.x - a.x);
        var x21 = (b.x - a.x);
    
        //x1^2 - x3^2
        var sx13 = Math.pow(a.x, 2) - Math.pow(c.x, 2);
    
        // y1^2 - y3^2
        var sy13 = Math.pow(a.y, 2) - Math.pow(c.y, 2);
    
        var sx21 = Math.pow(b.x, 2) - Math.pow(a.x, 2);
        var sy21 = Math.pow(b.y, 2) - Math.pow(a.y, 2);
    
        var f = ((sx13) * (x12)
                + (sy13) * (x12)
                + (sx21) * (x13)
                + (sy21) * (x13))
                / (2 * ((y31) * (x12) - (y21) * (x13)));
        var g = ((sx13) * (y12)
                + (sy13) * (y12)
                + (sx21) * (y13)
                + (sy21) * (y13))
                / (2 * ((x31) * (y12) - (x21) * (y13)));
    
        var c = -(Math.pow(a.x, 2)) -
        Math.pow(a.y, 2) - 2 * g * a.x - 2 * f * a.y;
    
        var h = -g;
        var k = -f;
        var sqr_of_r = h * h + k * k - c;
    
        // r is the radius
        var r = Math.sqrt(sqr_of_r);
        return {
            x: h,
            y: k,
            r: r
        }
    }

    static get2PointRadCenter(a, b, r) {
        // if (2 * r < Point.dist(a, b))
        //     return [Point.div(Point.add(a, b), 2),  Point.div(Point.add(a, b), 2)]
        let radsq = r * r;
        let x1 = a.x;
        let y1 = a.y;
        let x2 = b.x;
        let y2 = b.y;

        let q = Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
        let x3 = (x1 + x2) / 2;
        let rx = Math.sqrt(radsq - ((q / 2) * (q / 2))) * ((y1 - y2) / q);

        let y3 = (y1 + y2) / 2;
        let ry = Math.sqrt(radsq - ((q / 2) * (q / 2))) * ((x2-x1) / q);
        let offset = new Point(rx, ry)
        return [Point.add(new Point(x3, y3), offset), Point.sub(new Point(x3, y3), offset)];
    }

    sign(x) {
        return x == 0 ? 1 : Math.sign(x);
    }

    
    sideOfLine(a, b) {
        return this.sign((b.x - a.x) * (this.y - a.y) - (b.y - a.y) * (this.x - a.x))
    }

    normalize() {
        let len = this.len();
        return new Point(this.x / len, this.y / len);
    }

    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    rotate(angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        return new Point(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    mirror(o, p) {
        let d = Point.sub(o, p);
        this.x = -d.x + o.x;
        this.y = -d.y + o.y;
    }

    equals(other) {
        return this.x == other.x && this.y == other.y;
    }

    getAngle() {
        return Math.atan2(this.y, this.x);
    }
}

class PathPoint extends Point {
    constructor(x, y, v) {
        super(x, y);
        this.vel = v;
    }

    static fromPoint(p, v) {
        return new PathPoint(p.x, p.y, v);
    }
}

class TrajectoryState extends Point {
    constructor(x, y, c, v, a) {
        super(x, y);
        this.x = x;
        this.y = y;
        this.c = c;
        this.v = v;
        this.a = a;
    }
}

class Polygon {
    constructor(points) {
        // sort points by angle to center
        this.points = points;
        let c = this.getCenter();
        this.points = points.sort((a, b) => {
            let aa = Math.atan2(a.y - c.y, a.x - c.x);
            let bb = Math.atan2(b.y - c.y, b.x - c.x);
            return aa - bb;
        });
        this.points = points;
    }

    getCenter() {
        let x = 0;
        let y = 0;
        for (let i = 0; i < this.points.length; i++) {
            x += this.points[i].x;
            y += this.points[i].y;
        }
        return new Point(x / this.points.length, y / this.points.length);
    }

    convexHull() {
        let points = this.points;
        let endpoint = points[0]
        points.sort(function (a, b) {
            return a.x - b.x
        });
        let pointOnHull = points[0];
        let hull = []

        while (true) {
            hull.push(pointOnHull);
            let x = 0
            for (let i = 0; i < points.length; i++) {
                let point = points[i]
                let position = (endpoint.x - pointOnHull.x) * (point.y - pointOnHull.y) - (endpoint.y - pointOnHull.y) * (point.x - pointOnHull.x)
                if ((endpoint.equals(pointOnHull)) || (position > 0.0001)) {
                    endpoint = point
                    x += 1
                }
            }
            pointOnHull = endpoint;
            if (endpoint == hull[0]) break
        }
        return hull
    }

    pointInside(p)
    {
        let sides = this.points.map((x, i) => {
            return p.sideOfLine(this.points[i], this.points[(i + 1) % this.points.length]);
        });
        
        return sides.every(x => x == sides[0]);
    }
    pointInsideOffset(p, offset)
    {
        return new Polygon(this.getOffsetPoints(offset)).pointInside(p);
    }

    getBoundingBox() {
        let minX = this.points[0].x;
        let minY = this.points[0].y;
        let maxX = this.points[0].x;
        let maxY = this.points[0].y;
        for (let i = 1; i < this.points.length; i++) {
            if (this.points[i].x < minX) minX = this.points[i].x;
            if (this.points[i].y < minY) minY = this.points[i].y;
            if (this.points[i].x > maxX) maxX = this.points[i].x;
            if (this.points[i].y > maxY) maxY = this.points[i].y;
        }
        return {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }
    leftPerp(p) { return new Point(p.y, -p.x); }
    rightPerp(p) { return new Point(-p.y, p.x); }

    rayIntersectsSegment(rayOrigin, rayDirection, a, b, tmax) {
        let seg = Point.sub(b, a);
        let segPerp = this.leftPerp(seg);
        let perpDotd = Point.dot(rayDirection, segPerp);
        if (Math.abs(perpDotd) < 0.001)
        {
            return { 
                hit: false,
                t: Infinity
            };
        }
    
        let d = Point.sub(a, rayOrigin);
        let t = Point.dot(segPerp, d) / perpDotd;
        let s = Point.dot(this.leftPerp(rayDirection), d) / perpDotd;
    
        return { 
            hit: t >= 0.0 && t <= tmax && s >= 0.0 && s <= 1.0,
            t: t
        }
    }
    lineCast(a, b)
    {

        let rayOrigin = a;
        let rayDirection = Point.sub(b, a).normalize();
        let maxDist = Point.dist(b, a);

        if (this.pointInside(a) || this.pointInside(b)) return true;
        for (let j = 1; j < this.points.length; j++) {
            let h = this.rayIntersectsSegment(
                rayOrigin,
                rayDirection.normalize(), 
                this.points[(j - 1) % this.points.length], 
                this.points[j], 
                maxDist
            ).hit;
            if (h) {
                return true;
            }
        }
        return false;
    }
    

    segmentIntersection(a, b, c, d) {
        let u = Point.sub(b, a);
        let v = Point.sub(d, c);
        let w = Point.sub(a, c);
        let D = Point.cross(u, v);
        let s = Point.cross(v, w) / D;
        let t = Point.cross(w, u) / D;
        return s >= 0 && s <= 1 && t >= 0 && t <= 1;
    }

    getOffsetPoints(offset) {
        let points = [];

        for (let i = 0; i < this.points.length; i++) {
            let prev = (i + this.points.length - 1) % this.points.length;
            let next = (i + this.points.length + 1) % this.points.length;
            let flip = Point.dot(
                this.rightPerp(Point.sub(this.points[i], this.points[next])),
                Point.sub(this.points[prev], this.points[i]), 
            ) < 0 ? 1 : -1;
            let lineNormal = this.rightPerp(Point.sub(this.points[prev], this.points[i]).normalize())
                
            points.push(Point.add(this.points[i], Point.mul(lineNormal, offset * flip)));
            points.push(Point.add(this.points[prev], Point.mul(lineNormal, offset * flip)));
        }
        return points;
    }

    perimeter() {
        let perimeter = 0;
        for (let i = 0; i < this.points.length; i++) {
            let prev = (i + this.points.length - 1) % this.points.length;
            perimeter += Point.dist(this.points[i], this.points[prev]);
        }
        return perimeter;
    }

    draw() {
        // let offsetPoints = this.getOffsetPoints(14);
        // drawCircle(offsetPoints[0], 2);
        // for (let i = 1; i < offsetPoints.length; i++) {
        //     drawCircle(offsetPoints[i], 2);
        //     drawLine(offsetPoints[i - 1], offsetPoints[i]);
        // }
        // drawLine(offsetPoints[offsetPoints.length - 1], offsetPoints[0]);


        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
        ctx.closePath();
        ctx.stroke();
        
    }
}