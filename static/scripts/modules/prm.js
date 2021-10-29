class PRM {
    constructor(nodes, obstacles) {
        this.nodes = nodes;
        console.log(nodes);
        this.obstacles = obstacles;
        this.graph = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.addToWeb(this.nodes[i], i);
        }
    }

    setObstacles(obstacles) { this.obstacles = obstacles; console.log(obstacles); }

    addToWeb(newNode, i=this.nodes.length) {
        let neighbors = [];
        for (let j = 0; j < this.nodes.length; j++) {
            if (!this.obstacles.some(ob => ob.offsetPoly.lineCast(newNode, this.nodes[j])))
                neighbors.push({ p: this.nodes[i], idx: j });
        }
        
        this.graph.push({p: newNode, n: neighbors, idx: i});
    }
    removeFromWeb(node) { this.graph[node.idx].n = []; }

    closestOnMap(p) {
        let min = Infinity;
        let node = new Point(Infinity, Infinity);
    
        for (let i = this.graph.length - 1; i >= 0; i--) {
            if (this.graph[i].n.length == 0) continue;
            let dist = Point.sub(p, this.graph[i].p).len();
            if (dist < min) {
                min = dist;
                node = this.graph[i];
            }
        }
        return node;
    }

    getPath(start, end) {
        let graph = this.graph;
        for (let i = 0; i < graph.length; i++) {
            graph[i].d = Infinity;
            graph[i].visited = false;
        }
        graph[start.idx].d = 0;
        let current = start;
        let maxIterations = graph.length;
        let iterations = 0;
        while (maxIterations > iterations) {
            for (let i = 0; i < current.n.length; i++) {
                let neighbor = graph[current.n[i].idx];
                let d = Point.dist(neighbor.p, current.p) + current.d;
                if (d < neighbor.d) {
                    neighbor.d = d;
                    neighbor.prev = current;
                }
            }
            graph[current.idx].visited = true;

            if (graph[end.idx].visited) {
                break;
            }

            let min = Infinity;
            let minIdx = -1;
            for (let i = 0; i < graph.length; i++) {
                if (!graph[i].visited && graph[i].d < min) {
                    min = graph[i].d;
                    minIdx = i;
                }
            }
            if (minIdx == -1) {
                return [];
            }
            current = graph[minIdx];
            iterations++;
        }
        iterations = 0;

        let path = [];
        current = graph[end.idx];
        while (maxIterations > iterations) {
            path.push(current.p);
            current = current.prev;
            if (current == undefined || current.p.equals(start.p)) break;
            iterations++;
        }
        path.push(start.p);
        return path;
    }
}