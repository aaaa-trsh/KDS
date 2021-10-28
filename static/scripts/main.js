import { COLORS, kAutoSize } from './modules/kanvas-utils.js'
import { Point, Polygon } from './modules/geom-utils.js'
var socket = io();
let points = [new Point(0, 0)];
let heading = 0;
let obstacles = []
setInterval(function() {
    if (socket.connected) {
        socket.emit('pos', {});
    }
}, 20);

socket.on('pos', function(msg) {
    let data = JSON.parse(msg.data);
    var table = document.getElementsByClassName("inner-table").item(0).firstElementChild;
    var row = table.insertRow(0);
    var tsCell = row.insertCell(0);
    var codeCell = row.insertCell(1);
    var msgCell = row.insertCell(2);
    
    tsCell.style.width = "15%";
    codeCell.style.width = "10%";
    msgCell.style.width = "75%";

    tsCell.innerHTML = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    codeCell.innerHTML = "1";
    msgCell.innerHTML = msg.data;

    while (table.rows.length > 10) {
        table.deleteRow(table.rows.length - 1);
    }

    if (!points.includes(new Point(-data[0], -data[1]))) {
        points.push(new Point(-data[0], -data[1]));
        // points = points.slice(-50);
    }
    heading = data[2];
});

window.onload = function() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    kAutoSize(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pxToFeet = 20;
    const robotSize = [32, 28];
    const screenSpaceToWorldSpace = (point) => {
        return Point.add(Point.mul(point, pxToFeet), new Point(canvas.width/2, canvas.height/2));
    }
    let canvasWidthUnits = canvas.width/pxToFeet;
    let canvasHeightUnits = canvas.height/pxToFeet;
    
    socket.emit('obstacle', {});
    socket.on('obstacle', function(msg) {
        let data = JSON.parse(msg.data);
        obstacles = data.map(x => new Polygon(x.map(p => screenSpaceToWorldSpace(Point.fromArray([-p[1] / 12, p[0] / 12])))));
    });

    update();
    
    function update() {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineThickness = 2;

        // ENTER SCREEN SPACE
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // drawRobot(new Point(canvas.width/2, canvas.height/2), 10, 5, heading + Math.PI / 2);
        // drawRobot(new Point(canvas.width/2, canvas.height/2), heading + Math.PI / 2);
        ctx.kDrawRect(
            screenSpaceToWorldSpace(new Point(robotSize[0]/12/2, robotSize[1]/12/2)), 
            screenSpaceToWorldSpace(new Point(-robotSize[0]/12/2, -robotSize[1]/12/2)), 
            heading
        );
        ctx.stroke();
        ctx.kDrawRectTri(new Point(canvas.width/2, canvas.height/2), 10, 10, heading + Math.PI);
        ctx.fill();

        // ENTER WORLD SPACE
        var p = screenSpaceToWorldSpace(points[points.length - 1]);
        p = Point.sub(p, new Point(canvas.width/2, canvas.height/2));
        ctx.translate(-p.x, -p.y);
        
        for (let i = 0; i < points.length - 1; i++) {
            ctx.kDrawLine(screenSpaceToWorldSpace(points[i]), screenSpaceToWorldSpace(points[i+1]));
            ctx.stroke();
        }

        ctx.strokeStyle = COLORS.red;
        ctx.fillStyle = COLORS.red + "33";
        ctx.setLineDash([10, 10]);
        obstacles.forEach(poly => {
            ctx.fillStyle = COLORS.red;
            ctx.kDrawPoly(poly)
            ctx.fill();

            ctx.fillStyle = COLORS.red + "33";
            ctx.kDrawPoly(new Polygon(poly.getOffsetPoints(Math.max(...robotSize))));
            ctx.stroke();
            ctx.fill();
        });
        ctx.setLineDash([]);
        window.requestAnimationFrame(update);
    }
}