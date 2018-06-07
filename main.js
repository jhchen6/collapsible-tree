var width = 960,
    height = 800,
    offsetTop = 20,
    offsetLeft = 120,
    levelInterval;

var g = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + [offsetLeft, offsetTop] + ")");

var duration = 750;

var id = 0;
var root;

//tree is a calculator that sets x, y properties to nodes.
var tree = d3.tree()
    .size([height - offsetTop * 2, width - offsetLeft * 2]);

var link = d3.linkHorizontal()
    .x(d => d.y)
    .y(d => d.x);

d3.json("flare.json").then(data => {
    root = d3.hierarchy(data)
        .each(d => { d._children = d.children; d.id = id++; });
    tree(root);
    levelInterval = root.children[0].y;

    root.children.forEach(c => {
        c.each(d => d.children = null);
    });

    update(root);

    // d3.select("button")
    //     .on("click", () => {
    //         if (root.children) {
    //             root.each(d => d.children = null);
    //         }
    //         else {
    //             root.each(d => d.children = d._children);
    //         }
    //         update(root);
    //     });
});

function update(source) {
    tree(root);

    root.each(d => { d.y = d.depth * levelInterval; });

    var links = g.selectAll(".link")
        .data(root.links(), d => d.target.id);

    links.enter().append("path")
        .attr("class", "link")
        .attr("d", d => {
            var p = getOldPosition(source),
                node = { x: p[0], y: p[1] };
            return link({ source: node, target: node })
        });

    g.selectAll(".link")
        .transition()
        .duration(duration)
        .attr("d", link);

    //order between these two transitions is important

    links.exit()
        .transition()
        .duration(duration)
        .attr("d", d => link({ source: source, target: source }))
        .remove();

    var nodes = g.selectAll(".node")
        .data(root.descendants(), d => d.id);

    var nodesEnter = nodes.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => {
            var p = getOldPosition(source);
            return "translate(" + [p[1], p[0]] + ")"
        })
        .attr("opacity", 0)
        .on("click", clicked);

    nodesEnter.append("circle")
        .attr("r", 0)

    nodesEnter.append("text")
        .attr("text-anchor", d => d.data.children ? "end" : "start")
        .attr("x", d => d.data.children ? "-0.7em" : "0.7em")
        .attr("y", "0.35em")
        .text(d => d.data.name);

    g.selectAll(".node circle").attr("fill", d =>
        (d.children || !d.data.children) ? "white" : "lightsteelblue");

    g.selectAll(".node")
        .transition()
        .duration(duration)
        .attr("transform", d => "translate(" + [d.y, d.x] + ")")
        .attr("opacity", 1);

    nodesEnter.selectAll("circle")
        .transition()
        .duration(duration)
        .attr("r", 4);

    var nodesExit = nodes.exit()
        .transition()
        .duration(duration)
        .attr("transform", d => "translate(" + [source.y, source.x] + ")")
        .attr("opacity", 0)
        .remove();

    nodesExit.selectAll("circle")
        .transition()
        .duration(duration)
        .attr("r", 0);

    root.each(d => { d.x0 = d.x; d.y0 = d.y; });
}

function clicked(d) {
    if (d.children) {
        d.children = null;
    }
    else {
        d.children = d._children;
    }
    update(d);
}

function getOldPosition(d) {
    var x = (d.x0 == undefined) ? d.x : d.x0,
        y = (d.y0 == undefined) ? d.y : d.y0;
    return [x, y];
}