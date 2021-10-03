
var full_string = "";
var curr_iteration = 0;

var last_active_node = 0;
var last_remainder = 0;
var last_step = 0;

var nodes = new vis.DataSet();
var edges = new vis.DataSet();

network = null;

const anim_dur = 200;
const anim_frames = 15;

var curr_animation_frame = 0;

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
    //Avoid potential issues
    if(curr_animation_frame != 0)
        return;

    container = document.getElementById("info__char-boxes");
    text_box = document.getElementById("input_text");

    if(text_box.value.length == 0)
        return;

    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

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
            },
            scaling: {
                label: {
                    enabled: true,
                    min: 0,
                    max: 14
                },
                min: 0,
                max: 20,

                customScalingFunction: function (min, max, total, value) {
                    return value;
                },
            },
        },
        edges: {
            font: { 
                align: "top", 
                multi: true, 
                bold: {color: "orange"}
            },
            smooth: { enabled:false},
            color: default_node_colour,
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

/**
 * Standard linear interpolation between x and y
 * 
 * @param {Number} x start value 
 * @param {Number} y end value
 * @param {Number} value Between 0-1
 * 
 * @returns if values at 0, returns x, if at 1 returns y, otherwise return value in between
 */
var lerp = function(x, y, value) {
    return x + value * (y - x);
}

/**
 * returns the correct coordinates and places into result at current animation time.
 * 
 * @param {Number} node_id The node to be moved
 * @param {Object} from initial position (at current animation), must be object containing x, y (pair)_
 * @param {Object} to end position (at current animation), must be object containing x, y (pair)
 * @param {Object[]} result where to output result
 * @param {Boolean} grow If set to true, will change size of node
 * @param {Number} reversed 0: Node grows, 1: Node shrinks
 */
var move_node = function(node_id, from, to, result, grow = false, reversed = 0) {
    let inter_value = curr_animation_frame / anim_frames;

    result[node_id] = {
        id: node_id,
        x: lerp(from.x, to.x, inter_value),
        y: lerp(from.y, to.y, inter_value),

        value: grow ? lerp(0, 1, Math.abs(inter_value - reversed)) : undefined
    };
}

function next_iteration() { 
    //Initialisation hasn't occured yet
    //Or, simple solution (avoid queues), if animation ongoing do nothing
    if(network == null || curr_animation_frame != 0)
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

        //Update box colourings
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


        //Animate///////////////////////////////////////////////////////////////
        if(curr_iteration != 0) {

            let prev_iter = tree.get_next_iteration(curr_iteration - 1);

            if(prev_iter.nodes.length != data.nodes.length) {
                var animation = setInterval((curr_data, next_data) => {
                    //Improves flickering
                    if(curr_animation_frame++ == 0)
                        edges.update(next_data.edges);

                    //Check if animation needs to end
                    if(curr_animation_frame >= anim_frames) {
                        //Ensures nodes are placed in correct position
                        nodes.update(data.nodes);

                        curr_animation_frame = 0;
                        clearInterval(animation);
                        return;
                    }

                    //node update data
                    let interp_nodes = new Array(next_data.nodes.length);

                    //Move nodes in a straight line to their destination
                    let node_id = 0;
                    for(; node_id < curr_data.nodes.length; node_id++) 
                        move_node(node_id, curr_data.nodes[node_id], next_data.nodes[node_id], interp_nodes);

                    let start = {x: 0, y: 0};

                    //If a split occured
                    if(next_data.split != null) {
                        let split_node = next_data.nodes[node_id];
                        let parent = next_data.nodes[next_data.split];

                        //Create node in the middle of the edge
                        start.x = (parent.x + split_node.x)/2;
                        start.y = (parent.y + split_node.y)/2;

                        move_node(node_id++, start, split_node, interp_nodes, true);
                    }

                    //If an inserter has been made
                    if(next_data.inserted_parent != null) {
                        //If a split has not occured then node will be created
                        //inside its parent
                        if(next_data.split == null) {
                            let parent = curr_data.nodes[data.inserted_parent];

                            start.x = parent.x;
                            start.y = parent.y;
                        }

                        let inserted_node = next_data.nodes[node_id];
                        move_node(node_id, start, inserted_node, interp_nodes, true);
                    }

                    nodes.update(interp_nodes);

                }, anim_dur/anim_frames, prev_iter, data);

            } else {
                //Otherwise just normal update
                nodes.update(data.nodes);
                edges.update(data.edges);
            }
        }
        else {
            //Otherwise just normal update
            nodes.update(data.nodes);
            edges.update(data.edges);        
        }
        /////////////////////////////////////////////////////////////////////////////////////

        last_active_node = data.active_node;
        last_remainder = data.remainder;
        last_step = data.step;
    }

    if(curr_iteration == tree.get_max_iterations() - 1)
        de_activate_button(1);
}

function prev_iteration() {  
    //Initialisation hasn't occured yet
    //Or, simple solution (avoid queues), if animation ongoing do nothing
    if(network == null || curr_animation_frame != 0)       
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

        //Special if not at very end
        if(last_step + 1 < full_string.length)
            boxes[last_step + 1].children[0].style.backgroundColor = default_box_colour;

        //Update box colourings
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

        //Animate///////////////////////////////////////////////////////////////
        if(curr_iteration != tree.get_max_iterations() - 1) {

            let curr_iter = tree.get_next_iteration(curr_iteration + 1);

            if(curr_iter.nodes.length != data.nodes.length) {
                var animation = setInterval((curr_data, prev_data, remove_data) => {
                    
                    curr_animation_frame++;

                    //Check if animation needs to end
                    if(curr_animation_frame >= anim_frames) {
                        //Ensures nodes are placed in correct position and everything is removed
                        edges.update(remove_data.edges);
                        edges.remove(remove_data.remove_edges);

                        edges.update(prev_data.edges);
                        nodes.update(prev_data.nodes);

                        nodes.remove(remove_data.remove_nodes);

                        curr_animation_frame = 0;
                        clearInterval(animation);
                        return;
                    }

                    //node update data
                    let interp_nodes = new Array(curr_data.nodes.length);

                    //Move nodes in a straight line to their destination
                    let node_id = 0;
                    for(; node_id < prev_data.nodes.length; node_id++) 
                        move_node(node_id, curr_data.nodes[node_id], prev_data.nodes[node_id], interp_nodes);

                    
                    let end = {x: 0, y: 0};
                    
                    //If a split occured
                    if(curr_data.split != null) {
                        let split_node = curr_data.nodes[node_id];
                        let parent = curr_data.nodes[curr_data.split];

                        //destinition of node in the middle of previous existing edge
                        end.x = (parent.x + split_node.x)/2;
                        end.y = (parent.y + split_node.y)/2;

                        move_node(node_id++, split_node, end, interp_nodes, true, 1);
                    }

                    //If an inserter has been made
                    if(curr_data.inserted_parent != null) {
                        //If a split has not occured then node will move to be
                        //inside its parent
                        if(curr_data.split == null) {
                            let parent = curr_data.nodes[curr_data.inserted_parent];

                            end.x = parent.x;
                            end.y = parent.y;
                        }

                        let inserted_node = curr_data.nodes[node_id];
                        move_node(node_id, inserted_node, end, interp_nodes, true, 1);
                    }

                    nodes.update(interp_nodes);

                }, anim_dur/anim_frames, curr_iter, data, remove_data);

            } else {
                edges.update(remove_data.edges);

                nodes.update(data.nodes);
                edges.update(data.edges);
        
                nodes.remove(remove_data.remove_nodes);
                edges.remove(remove_data.remove_edges);
            }
        }
        else {
            edges.update(remove_data.edges);

            nodes.update(data.nodes);
            edges.update(data.edges);
    
            nodes.remove(remove_data.remove_nodes);
            edges.remove(remove_data.remove_edges);
        }
        /////////////////////////////////////////////////////////////////////////////////////


        last_active_node = data.active_node;
        last_remainder = data.remainder;
        last_step = data.step;    
    }

    if(curr_iteration == 0) 
        de_activate_button(0);
}

