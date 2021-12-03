var socket = io();
let points = [new Point(0, 0)];
let heading = 0;
let obstacles = [];
let globalWaypoints = [];
let pxToFeet = 20;
let frameCount = 0;
const robotSize = [32, 28];
let prm = null;
let goalPoint = new Point(-3 * pxToFeet, 0);

socket.emit('obstacle', {});
socket.on('obstacle', function(msg) {
    let data = JSON.parse(msg.data);
    obstacles = data.map(x => {
            let poly = new Polygon(x.map(p => screen2World(Point.fromArray([-p[1] / 12, p[0] / 12]))));
            let waypoints = poly.getOffsetPoints(2.2*pxToFeet);
            let offsetPoly = new Polygon(poly.getOffsetPoints(2*pxToFeet));
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

function world2Screen(point, camCenter) {
    return Point.sub(point, Point.mul(camCenter, -1));
}

function sendData(ele) {
    let end = goalPoint;
    let path = prm.getPath(prm.closestOnMap(screen2World(points[points.length - 1])), prm.closestOnMap(end));
    // path.push(screen2World(points[points.length - 1]));
    path = path.reverse();
    
    if (!prm.obstacleCast(screen2World(points[points.length - 1]), end)) {
        for (let i = 0; i < path.length; i++) {
            if (prm.obstacleCast(screen2World(points[points.length - 1]), path[i+1])) {
                path.splice(i, 1);
                i--;
            }
            if (prm.obstacleCast(path[i-1], end)) { path.splice(i, 1); }
        }
    }
    else { path = []; }
    path.push(end);

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
    ctx.kListenMousePos();
    ctx.kListenMouseDown();

    kAutoSize(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    
    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        var p = Point.sub(screen2World(points[points.length - 1]), new Point(canvas.width/2, canvas.height/2));
        ctx.translate(-p.x, -p.y);

        // ENTER WORLD SPACE
        ctx.kDrawRect(
            Point.sub(goalPoint, new Point(6, 6)), 
            Point.add(goalPoint, new Point(6, 6)), 
            frameCount / 12
        );
        ctx.fillStyle = COLORS.yellow;
        ctx.strokeStyle = COLORS.yellow;
        if (ctx.mouseDown && Point.dist(world2Screen(ctx.mousePos, p), goalPoint) < 30) {
            goalPoint = world2Screen(ctx.mousePos, p);
            ctx.fillStyle += "44";
            ctx.setLineDash([4, 4]);
        }

        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([]);

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
            let end = goalPoint;
            let path = prm.getPath(prm.closestOnMap(screen2World(points[points.length - 1])), prm.closestOnMap(end));
            path = path.reverse();
            // going from the end of the path to the start, remove all that can see end
            // for (let i = path.length - 1; i >= 0; i--) {
                
            // }
            if (!prm.obstacleCast(screen2World(points[points.length - 1]), end)) {
                for (let i = 0; i < path.length; i++) {
                    if (prm.obstacleCast(screen2World(points[points.length - 1]), path[i+1])) {
                        path.splice(i, 1);
                        i--;
                    }
                    if (prm.obstacleCast(path[i-1], end)) { path.splice(i, 1); }
                }
            }
            else { path = []; }
            

            ctx.strokeStyle = COLORS.yellow + "44";
            ctx.fillStyle = COLORS.yellow;
            path.unshift(screen2World(points[points.length - 1]));
            path.push(end);
            
            var spline = new CubicHermite(path.map(p => p.asArray()), path.map((p, i) => Point.mul(i > 0 ? Point.sub(p, path[i-1]).normalize() : Point.fromAngle(heading), i > 0 ? Point.dist(p, path[i-1])/2 : -100).asArray()));
            // console.log(spline.interpolate(.1))
            var past = Point.fromArray(spline.interpolate(0))
            for (let t = 0.01; t < 1; t += 0.01) {
                var cur = Point.fromArray(spline.interpolate(t));
                ctx.kDrawLine(past, cur);
                past = cur;
                ctx.stroke();
                
            }
            for (let i = 1; i < path.length - 1; i++) {
                // ctx.kDrawLine(path[i], path[i+1]);
                // ctx.stroke();
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
