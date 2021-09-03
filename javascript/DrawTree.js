var network = null;

var nodes = [];
var edges = [];

function init() {
    var input = document.getElementById("input_text");

    console.log(input.value);
}

window.addEventListener("load", () => {
    var container = document.getElementById("suffix-tree");

    for (var i = 0; i < 15; i++) {
        nodes.push({ id: i, label: String(i) });
    }

    edges.push({ from: 0, to: 1 });
    edges.push({ from: 0, to: 6 });
    edges.push({ from: 0, to: 13 });
    edges.push({ from: 0, to: 11 });
    edges.push({ from: 1, to: 2 });
    edges.push({ from: 2, to: 3 });
    edges.push({ from: 2, to: 4 });
    edges.push({ from: 3, to: 5 });
    edges.push({ from: 1, to: 10 });
    edges.push({ from: 1, to: 7 });
    edges.push({ from: 2, to: 8 });
    edges.push({ from: 2, to: 9 });
    edges.push({ from: 3, to: 14 });
    edges.push({ from: 1, to: 12 });

    nodes[0]["level"] = 0;
    nodes[1]["level"] = 1;
    nodes[2]["level"] = 3;
    nodes[3]["level"] = 4;
    nodes[4]["level"] = 4;
    nodes[5]["level"] = 5;
    nodes[6]["level"] = 1;
    nodes[7]["level"] = 2;
    nodes[8]["level"] = 4;
    nodes[9]["level"] = 4;
    nodes[10]["level"] = 2;
    nodes[11]["level"] = 1;
    nodes[12]["level"] = 2;
    nodes[13]["level"] = 1;
    nodes[14]["level"] = 5;

    var options = {
        nodes: {
            fixed: {x:true, y:true},
            shape: "circle",
            color: "#8a2be2",
            font: {
                color: "#f5f5f5",
                face: "Quicksand"
            }
        },
        layout: {
            hierarchical: {
              direction: "LR",
            },
        },
        physics: false
    }

    var data = {
        nodes: nodes,
        edges: edges
    }

    network = new vis.Network(container, data, options);

});
