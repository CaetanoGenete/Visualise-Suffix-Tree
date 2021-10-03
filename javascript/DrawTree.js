
var full_string = "";
var curr_iteration = 0;

var last_active_node = 0;
var last_remainder = 0;
var last_step = 0;

network = null;

var nodes = new vis.DataSet();
var edges = new vis.DataSet();

function check_overflow_boxes() {
    container = document.getElementById("info__char-boxes");

    if(container.clientHeight < container.scrollHeight)
        container.style.borderColor = "#808080FF";
    else
        container.style.borderColor = "#80808000";
}
window.onresize = check_overflow_boxes;

//Ensures the display is correctly displayed at all times
function ensure_display_visible() {
    let variables = document.getElementById("control-panel__variables");
    let info_panel = document.getElementById("info");
    
    //If network exists than want the panel to be displayed
    if(network != null) {
        variables.style.transform = "translateY(0px)";
        variables.style.MozTransform = "translateY(0px)";
        variables.style.msTransform = "translateY(0px)";

        info_panel.style.transform = "translateY(0px)";
        info_panel.style.MozTransform = "translateY(0px)";
        info_panel.style.msTransform = "translateY(0px)";
    }
    //Otherwise go back to closed
    else {
        variables.style.transform = null;
        variables.style.MozTransform = null;
        variables.style.msTransform = null;

        info_panel.style.transform = null;
        info_panel.style.MozTransform = null;
        info_panel.style.msTransform = null;
    }
}

function activate_button(button_index) {
    let header = document.getElementById("control-panel__header")
    let buttons = header.getElementsByTagName("button");
    
    buttons[button_index].classList.add("button");
    buttons[button_index].style.backgroundColor = "whitesmoke";
}

function de_activate_button(button_index) {
    let header = document.getElementById("control-panel__header")
    let buttons = header.getElementsByTagName("button");
    
    buttons[button_index].classList.remove("button");
    buttons[button_index].style.backgroundColor = "grey";
}

function load_string() {
    container = document.getElementById("info__char-boxes");
    text_box = document.getElementById("input_text");

    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if(text_box.value.length == 0)
        return;

    //Reset string and index
    full_string = text_box.value;
    curr_iteration = -1;

    for(character in text_box.value) {
        outer_box = document.createElement("div");
        inner_box = document.createElement("div");
        display_char = document.createElement("h3");

        inner_box.style.animationDelay = String(character * 0.05) + "s";

        display_char.innerHTML = text_box.value[character];

        inner_box.appendChild(display_char);
        outer_box.appendChild(inner_box);
        outer_box.classList.add("char-box"); 

        container.appendChild(outer_box);
    }

    check_overflow_boxes();
    
    delete tree;
    tree = new Tree(full_string);

    var container = document.getElementById("suffix-tree");

    //Create static tree with circular nodes
    var options = {
        nodes: {
            fixed: {x:true, y:true},
            shape: "circle",
            color: "#8a2be2",
            font: {
                color: "#f5f5f5",
                face: "Quicksand",
            }
        },
        edges: {
            font: { 
                align: "top", 
                multi: true, 
                bold: {color: "orange"}
            },
            smooth: { enabled:false},
            color: default_node_colour
        },
        physics: false
    }

    //Destroy network if one already exists
    if(network != null)
        network.destroy();        

    activate_button(1);
    de_activate_button(0);

    //Empty nodes and edges
    nodes.clear();
    edges.clear();

    var data = {
        nodes: nodes,
        edges: edges
    }

    network = new vis.Network(container, data, options);
    ensure_display_visible();

    last_active_node = 0;
    last_remainder = 0;
    last_step = 0;

    next_iteration();
}


function next_iteration() { 
    //Initialisation hasn't occured yet     
    if(network == null)
        return;
    
    if(curr_iteration >= 0) 
        activate_button(0);

    if(curr_iteration < tree.get_max_iterations() - 1) {
        curr_iteration++;

        var active_point = document.getElementById("active-point-data");
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        var data = tree.get_next_iteration(curr_iteration);

        data.nodes[last_active_node].color = default_node_colour;
        data.nodes[data.active_node].color = active_node_colour;

        active_point.children[0].innerHTML = data.active_node;
        active_point.children[1].innerHTML = data.active_edge;
        active_point.children[2].innerHTML = data.active_len;

        variables.children[0].innerHTML = data.remainder;
        variables.children[1].innerHTML = data.step;
        variables.children[2].innerHTML = curr_iteration + "/" + (tree.get_max_iterations() - 1);

        if(curr_iteration == 0) {
            boxes[0].children[0].style.backgroundColor = curr_step_box_colour;
        } else {
            for(let i = last_step - last_remainder; i <= data.step - data.remainder; i++)
                boxes[i].children[0].style.backgroundColor = default_box_colour;
            
            for(let i = data.step - data.remainder + 1; i <= data.step; i++) 
                boxes[i].children[0].style.backgroundColor = marked_box_colour;

            if(data.step + 1 < full_string.length) 
                boxes[data.step + 1].children[0].style.backgroundColor = curr_step_box_colour;
            
        }

        nodes.update(data.nodes);
        edges.update(data.edges);

        last_active_node = data.active_node;
        last_remainder = data.remainder;
        last_step = data.step;
    }

    if(curr_iteration == tree.get_max_iterations() - 1)
        de_activate_button(1);
}

function prev_iteration() {  
    //Initialisation hasn't occured yet
    if(network == null)
        return; 

    if(curr_iteration < curr_iteration < tree.get_max_iterations() - 1)
        activate_button(1);

    if(curr_iteration > 0) {
        curr_iteration--;

        var active_point = document.getElementById("active-point-data");
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        var data = tree.get_next_iteration(curr_iteration);
        var remove_data = tree.get_prev_iteration(curr_iteration + 1);

        data.nodes[last_active_node].color = default_node_colour;
        data.nodes[data.active_node].color = active_node_colour;

        active_point.children[0].innerHTML = data.active_node;
        active_point.children[1].innerHTML = data.active_edge;
        active_point.children[2].innerHTML = data.active_len;

        variables.children[0].innerHTML = data.remainder;
        variables.children[1].innerHTML = data.step;
        variables.children[2].innerHTML = curr_iteration + "/" + (tree.get_max_iterations() - 1);

        if(last_step + 1 < full_string.length)
            boxes[last_step + 1].children[0].style.backgroundColor = default_box_colour;

        if(curr_iteration == 0) {
            boxes[0].children[0].style.backgroundColor = curr_step_box_colour;
        } else {
            for(let i = data.step; i <= last_step; i++) {
                boxes[i].children[0].style.backgroundColor = default_box_colour;
            }

            for(let i = data.step - data.remainder + 1; i <= data.step; i++) {
                boxes[i].children[0].style.backgroundColor = marked_box_colour;
            }

            if(data.step + 1 < full_string.length) {
                boxes[data.step + 1].children[0].style.backgroundColor = curr_step_box_colour;
            }
        }

        edges.update(remove_data.edges);

        nodes.update(data.nodes);
        edges.update(data.edges);

        nodes.remove(remove_data.remove_nodes);
        edges.remove(remove_data.remove_edges);

        last_active_node = data.active_node;
        last_remainder = data.remainder;
        last_step = data.step;    
    }

    if(curr_iteration == 0) 
        de_activate_button(0);
}

