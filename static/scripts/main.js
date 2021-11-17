var socket = io();
let points = [new Point(0, 0)];
let heading = 0;
let obstacles = [];
let globalWaypoints = [];
let pxToFeet = 20;
let frameCount = 0;
const robotSize = [32, 28];
let prm = null;

socket.emit('obstacle', {});
socket.on('obstacle', function(msg) {
    let data = JSON.parse(msg.data);
    obstacles = data.map(x => {
            let poly = new Polygon(x.map(p => screen2World(Point.fromArray([-p[1] / 12, p[0] / 12]))));
            let waypoints = poly.getOffsetPoints(Math.max(...robotSize) + pxToFeet / 2);
            let offsetPoly = new Polygon(poly.getOffsetPoints(Math.max(...robotSize)));
            globalWaypoints.push(...waypoints);

            return {
                poly: poly,
                waypoints: waypoints,
                offsetPoly: offsetPoly
            };
        }
    );
    prm = new PRM(globalWaypoints, obstacles);
});

socket.on('pos', function(msg) {
    let data = JSON.parse(msg.data);
    var table = document.getElementsByClassName("inner-table").item(0).firstElementChild;
    var row = table.insertRow(0);
    var tsCell = row.insertCell(0);
    var codeCell = row.insertCell(1);
    var msgCell = row.insertCell(2);

    tsCell.innerHTML = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    codeCell.innerHTML = "1";
    msgCell.innerHTML = msg.data;

    while (table.rows.length > 10)
        table.deleteRow(table.rows.length - 1);

    if (!points.includes(new Point(-data[0], -data[1])))
        points.push(new Point(-data[0], -data[1]));

    heading = data[2];

    if (document.getElementById("img-stream") !== null) {
        document.getElementById("img-stream").src = "data:image/jpeg;base64," + msg.img;
    }
});

function screen2World(point) {
    return Point.add(Point.mul(point, pxToFeet), new Point(0, 0/*canvas.clientWidth/2, canvas.clientHeight/2*/));
}

function sendData(ele) {
    let end = screen2World(new Point(2, 8.5));
    let path = prm.getPath(prm.closestOnMap(screen2World(points[points.length - 1])), prm.closestOnMap(end));
    // path.push(screen2World(points[points.length - 1]));
    path.unshift(end);
    path = path.reverse();
    
    console.log(ele.checked);

    let cvt = path.map(p => `${(p.x/pxToFeet).toFixed(3)},${(p.y/pxToFeet).toFixed(3)}`);
    console.log(cvt)
    socket.emit('path', {
        on: ele.checked,
        path: cvt.join(' ') //path.map(p => `${(p.x / pxToFeet).toFixed(3)},${(p.y / pxToFeet).toFixed(3)}`).join(' ')
    });
}

window.onload = function() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    kAutoSize(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ENTER WORLD SPACE
        var p = screen2World(points[points.length - 1]);
        p = Point.sub(p, new Point(canvas.width/2, canvas.height/2));
        ctx.translate(-p.x, -p.y);
        
        ctx.lineWidth = 1;

        ctx.strokeStyle = COLORS.red;
        ctx.fillStyle = COLORS.red + "33";
        ctx.setLineDash([10, 10]);
        obstacles.forEach(obstacle => {
            ctx.fillStyle = COLORS.red;
            ctx.kDrawPoly(obstacle.poly);
            ctx.shadowBlur = 20;
            ctx.shadowColor = COLORS.red + "66";

            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = COLORS.red + "33";
            ctx.kDrawPoly(obstacle.offsetPoly);
            ctx.fill();
            ctx.stroke();

            // ctx.fillStyle = COLORS.lightBlue;
            // obstacle.waypoints.forEach(p => {
            //     ctx.kDrawCircle(p, 3);
            //     ctx.fill();
            // });
        });
        ctx.setLineDash([]);

        if (prm !== null) {
            ctx.strokeStyle = COLORS.lightBlue + "05";
            ctx.lineWidth = 1;
            for (let i = 0; i < prm.graph.length; i++) {
                for (let j = 0; j < prm.graph[i].n.length; j++) {
                    ctx.kDrawLine(prm.graph[i].p, prm.graph[prm.graph[i].n[j].idx].p);
                    ctx.stroke();
                }
            }
            let end = screen2World(new Point(2, 8.5));
            let path = prm.getPath(prm.closestOnMap(screen2World(points[points.length - 1])), prm.closestOnMap(end));
            path.push(screen2World(points[points.length - 1]));
            path.unshift(end);
            ctx.strokeStyle = COLORS.yellow + "44";
            ctx.fillStyle = COLORS.yellow;
            for (let i = 0; i < path.length - 1; i++) {
                ctx.kDrawLine(path[i], path[i+1]);
                ctx.stroke();
                ctx.kDrawCircle(path[i], 7);
                ctx.fill();
            }
        }

        ctx.strokeStyle = "#fff3";
        ctx.fillStyle = "white";
        ctx.lineThickness = 2;
        for (let i = 0; i < points.length - 1; i++) {
            ctx.kDrawLine(screen2World(points[i]), screen2World(points[i+1]));
            ctx.stroke();
        }

        // ENTER SCREEN SPACE
        ctx.strokeStyle = "white";
        ctx.fillStyle = "#fff8";

        ctx.resetTransform();
        
        // drawRobot(new Point(canvas.width/2, canvas.height/2), 10, 5, heading + Math.PI / 2);
        // drawRobot(new Point(canvas.width/2, canvas.height/2), heading + Math.PI / 2);
        ctx.kDrawRect(
            Point.add(Point.mul(new Point(robotSize[0]/12/2, robotSize[1]/12/2), pxToFeet), new Point(canvas.clientWidth/2, canvas.clientHeight/2)), 
            Point.add(Point.mul(new Point(-robotSize[0]/12/2, -robotSize[1]/12/2), pxToFeet), new Point(canvas.clientWidth/2, canvas.clientHeight/2)), 
            heading
        );
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.kDrawRectTri(new Point(canvas.width/2, canvas.height/2), 10, 10, heading + Math.PI);
        ctx.fill();
        if (socket.connected && frameCount % 2 == 0)
            socket.emit('pos', {});
        frameCount++;
        window.requestAnimationFrame(update);
    }
}
