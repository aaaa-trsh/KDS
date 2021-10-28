const COLORS = {
    yellow: "#ecf542",
    lightBlue: "#7cd5f1",
    darkBlue: "#2a4552",
    red: "#f72858",
    white: "#ffffff",
    black: "#000000",
    clear: "#0000",
    bg: "#161b1e"
}

/**
 * Converts { r, g, b } to hex
 */
function rgbToHex(rgb) {
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

/**
 * Converts a hex color to { r, g, b }
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Lerps between c1 and c2 by t
 */
function lerpColor(c1, c2, t) {
    function lerp(a, b, t) {
        return (b - a) * t + a;
    }
    return `rgb(${lerp(c1.r, c2.r, t)}, ${lerp(c1.g, c2.g, t)}, ${lerp(c1.b, c2.b, t)})`;
}

/**
 * Draws a line from p1 to p2
 */
CanvasRenderingContext2D.prototype.kDrawLine = function(p1, p2) {
    this.beginPath();
    this.moveTo(p1.x, p1.y);
    this.lineTo(p2.x, p2.y);
    this.closePath();
} 

/**
 * Draws a rect from p1 to p2 at angle a
 */
CanvasRenderingContext2D.prototype.kDrawRect = function(p1, p2, a=0) {
    let initalTransform = this.getTransform();
    let size = [Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)];
    this.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    this.rotate(a);
    this.beginPath();
    this.rect(-size[0] / 2, -size[1] / 2, size[0], size[1]);
    this.closePath();
    this.setTransform(initalTransform);
}

/**
 * Draws a square at point p with size d
 */
CanvasRenderingContext2D.prototype.kDrawSquare = function(p, d=2) {
    this.beginPath();
    this.rect(p.x - d/2, p.y - d/2, d, d);
    this.closePath();
} 

/**
 * Draws a circle at point p with diameter d
 */
CanvasRenderingContext2D.prototype.kDrawCircle = function(p, d) {
    this.beginPath();
    this.arc(p.x, p.y, d / 2, 0, 2 * Math.PI);
    this.closePath();
}

/**
 * Draws a ray starting at p towards angle a that is l long and starts startOffset away from p
 */
CanvasRenderingContext2D.prototype.kDrawRay = function(p, a, l, startOffset=0) {
    let angleCoords = [ Math.cos(a), Math.sin(a) ];
    this.beginPath();
    this.moveTo(p.x + (angleCoords[1] * startOffset), p.y + (angleCoords[0] * startOffset));
    this.lineTo(p.x + (angleCoords[1] * l), p.y + (angleCoords[0] * l));
    this.closePath();
} 

/**
 * Draws a bezier with control points a, b, c, d
 */
CanvasRenderingContext2D.prototype.kDrawBezier = function(a, b, c, d) {
    this.beginPath();
    this.moveTo(a.x, a.y);
    this.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
    this.closePath();
}

/**
 * Draws a triangle at point p with width w and height h, pointing in angle a
 */
CanvasRenderingContext2D.prototype.kDrawRectTri = function(p, w, h, a=0) {
    let initalTransform = this.getTransform();
    this.translate(p.x, p.y);
    this.rotate(a);
    this.beginPath();
    this.moveTo(-w / 2, h / 2);
    this.lineTo(w / 2, 0);
    this.lineTo(-w / 2, -h / 2);
    this.closePath();
    this.setTransform(initalTransform);
}

CanvasRenderingContext2D.prototype.kDrawPoly = function(poly) {
    this.beginPath();
    this.moveTo(poly.points[0].x, poly.points[0].y);
    for (let i = 1; i < poly.points.length; i++) {
        this.lineTo(poly.points[i].x, poly.points[i].y);
    }
    this.lineTo(poly.points[poly.points.length - 1].x, poly.points[poly.points.length - 1].y);
    this.closePath();
}
/**
 * Sets a listener to automatizally size the canvas on window resize
 */
let kAutoSize = (canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    window.addEventListener("resize", () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });
}

export { COLORS, rgbToHex, hexToRgb, lerpColor, kAutoSize };