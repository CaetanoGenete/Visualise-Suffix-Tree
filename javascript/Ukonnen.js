const default_node_colour = "#8a2be2";
const active_node_colour = "red";

const default_box_colour = "#f7f1f7";
const marked_box_colour = "greenyellow";
const curr_step_box_colour= "green";

const split_edge_colour = "orange";

//Horizontal grid seperation of nodes
const x_node_seperation = 200;
//Vertical grid seperation of nodes
const y_node_sepereation = 50;

const alphabet_size = 128;

var node = function(start, end = Number.POSITIVE_INFINITY) {
    this.start = start;
    this.end = end;

    this.parent = null;
    this.slink = 0;

    //All ascii characters
    this.edge = new Array(alphabet_size).fill(0);
}

class Tree {

    move_parent(node_id, by_x, by_y, current_iteration, nodes) {
        //Todo: make deque
        let queue = [node_id];

        while(queue.length > 0) {
            let curr_node_id = queue.shift();

            current_iteration.nodes[curr_node_id].x += by_x;
            current_iteration.nodes[curr_node_id].y += by_y;

            for(let char = 0; char < alphabet_size; char++)
                if(nodes[curr_node_id].edge[char] != 0)
                    queue.push(nodes[curr_node_id].edge[char]);
        }
    }

    move_branch(inserted_node_id, current_iteration, nodes) {

        while(inserted_node_id != 0) {
            let parent_id = nodes[inserted_node_id].parent;
            
            for(let char = 0; char < alphabet_size; char++) {
                let next_node_id = nodes[parent_id].edge[char];

                if(next_node_id != 0) {
                    if(current_iteration.nodes[next_node_id].y < current_iteration.nodes[inserted_node_id].y)
                        this.move_parent(next_node_id, 0, -y_node_sepereation, current_iteration, nodes);
                    else if(current_iteration.nodes[next_node_id].y > current_iteration.nodes[inserted_node_id].y)
                        this.move_parent(next_node_id, 0, y_node_sepereation, current_iteration, nodes);
                }
            }

            inserted_node_id = parent_id;
        }
    }

    add_slink(from, to, nodes, prev_iter_data, iteration_data, maximum_nodes) {
        nodes[from].slink = to;
        //Always make sure root points to itself
        nodes[0].slink = 0;


        //GRAPHICAL CHANGE DATA///////////////////////////
        if(from != 0) {
            prev_iter_data.remove_edges.push(maximum_nodes + this.links_count);

            iteration_data.edges.push({
                id: maximum_nodes + this.links_count++,
                dashes: true,
                color: "gray",
                arrows: "to",

                from: from,
                to: to,

                smooth: {
                    enabled: true,
                    type: 'curvedCW'
                }
            });
        }
        ////////////////////////////////////////////////

        return to;
    }

    correct_edge_label(edge_id, nodes, string, step) {
        return string.substring(nodes[edge_id].start, Math.min(step + 1, nodes[edge_id].end));
    }

    find_min_y(node_id, current_iteration, nodes) {
        let min_node_id = node_id;
        let min_y = current_iteration.nodes[min_node_id].y;
        
        //Structure of the tree ensures that if a node's parent has a smaller displacement than 
        //a different node's parent then, it's y-coordinate will always be smaller.
        //
        //Therefore, recursively choose child node with smallest y-coordinate until there are no
        //more children
        while(true) {
            let min_node = nodes[min_node_id];

            //Hack: Extra check needed
            if((min_node.end == Number.POSITIVE_INFINITY && min_node_id != 0) || this.first_insert)
                return min_y;

            for(let char = 0; char < alphabet_size; char++) {
                let next_node = min_node.edge[char];

                if(next_node != 0) {
                    min_y = Math.max(current_iteration.nodes[next_node].y, min_y);
                    min_node_id = next_node;
                }
            }
        }        
    }

    update_displays(prev_iter_data, iteration_data, nodes, active_node, active_edge, active_len, remainder, step, string, max_node_id) {

        iteration_data.active_node = active_node;
        iteration_data.active_edge = active_edge;
        iteration_data.active_len = active_len;

        iteration_data.remainder = remainder;
        iteration_data.step = step;

        //Remove excess nodes
        iteration_data.nodes.length = max_node_id;

        if(active_len > 0) {

            let next_node = nodes[active_node].edge[active_edge.charCodeAt(0)];
            let label = this.correct_edge_label(next_node, nodes, string, step);
            
            prev_iter_data.edges.push({
                id: next_node,
                label: label.substring(0, label.length - (nodes[next_node].end == Number.POSITIVE_INFINITY))
            });

            let split = Math.min(label.length, active_len);

            iteration_data.edges.push({
                id: next_node,
                label: "<b>" + label.substring(0, split) + "|</b>" + label.substring(split),
            });
        }
    }

    refresh_edge_len(next_node, iteration_data, nodes, string, step) {
        iteration_data.edges.push({
            id: next_node,
            label: this.correct_edge_label(next_node, nodes, string, step)
        });
    }

    constructor(string) {
        //Root will always be 0
        const root_id = 0;
        //Ukkonen's variables
        
        //Active point:
        let active_node = root_id;
        let active_edge = null;
        let active_len = 0;

        //Suffix data:
        let remainder = 0;
        
        //Node data
        
        let maximum_nodes = 2 * string.length;
        let nodes = new Array(maximum_nodes);

        let iteration = 0;
        this.next_iteration = new Array(maximum_nodes);
        //First iteration, simply add root node
        this.next_iteration[iteration] = {
            nodes: [{id: root_id, label: String(root_id), x: 0, y: 0}],
            edges: [],

            active_node: active_node,
            active_edge: undefined,
            active_len: active_len,

            remainder: remainder,
            step: 0,
        }

        this.prev_iteration = new Array(maximum_nodes);
        this.prev_iteration[iteration++] = {
            edges: [],

            remove_nodes: [root_id],
            remove_edges: [],
        }

        let max_node_id = 0;
        //We'll see later why having the start be the length of the string will remove the need for one if
        nodes[max_node_id++] = new node(string.length);
        //Add terminator
        string += "\0";

        //Temporary, will find better solution later
        this.first_insert = true;  
        this.links_count = 0;

        for(let step = 0; step < string.length - 1; step++) {
            let step_char = string[step];

            let next_link = 0;
            remainder++;

            let first_iteration = true;
            while(remainder > 0) {
                //GRAPHICAL CHANGE DATA///////////////////////////

                //Setting data
                this.next_iteration[iteration] = {
                    //At most two nodes can be added per iteration and #edges = #nodes - 1
                    nodes: new Array(max_node_id + 2),
                    edges: [],

                    active_node: 0,
                    active_edge: null,
                    active_len: 0,

                    remainder: 0,
                    step: 0,

                }

                this.prev_iteration[iteration] = {
                    edges: [],

                    remove_nodes: [],
                    remove_edges: [],
                }

                let iteration_data = this.next_iteration[iteration];
                let prev_iter_data = this.prev_iteration[iteration];

                //Copy previous iteration data as nodes are never removed going forward in iterations
                for(let i = 0; i < max_node_id; i++) {
                    iteration_data.nodes[i] = Object.assign({}, this.next_iteration[iteration - 1].nodes[i]);
                }

                //Initialise potential last nodes
                for(let i = max_node_id; i < max_node_id + 2; i++)
                    iteration_data.nodes[i] = {id: i, label: String(i), x: 0, y: 0};
                
                iteration++;

                ////////////////////////////////////////////////////
                //Observation 1:
                active_edge = string[step - active_len];

                let next_node = nodes[active_node].edge[active_edge.charCodeAt(0)];
                let edge_len = nodes[next_node].end - nodes[next_node].start;
                
                //Note: If next_node is root, thereby implying no active_edge char points of active_node,
                //then this will pass assuming string.length * 2 < Number.POSTIVE_INFINITY (which for 
                //practical purposes should always be true)
                if(edge_len <= active_len) {
                    this.refresh_edge_len(next_node, iteration_data, nodes, string, step);

                    active_node = next_node;
                    active_len -= edge_len;

                } else {
                    //GRAPHICAL CHANGE DATA///////////////////////////
                    //If statement to avoid unnecessary updates
                    if(first_iteration) {         
                        //Increment node_end variable (update all leaf edges)
                        for(let node_id = 0; node_id < max_node_id; node_id++) {
                            //If is leaf node:
                            if(nodes[node_id].end == Number.POSITIVE_INFINITY) {
                                prev_iter_data.edges.push({
                                    id: node_id,
                                    label: this.correct_edge_label(node_id, nodes, string, step - 1),
                                    from: nodes[node_id].parent,
                                    to: node_id
                                });

                                iteration_data.edges.push({
                                    id: node_id,
                                    label: this.correct_edge_label(node_id, nodes, string, step),
                                    from: nodes[node_id].parent,
                                    to: node_id
                                });
                            }
                        }

                        first_iteration = false;
                    }

                    //////////////////////////////////////////////////

                    let split_i = nodes[next_node].start + active_len;
                    //If active_edge does not exist then this will always be 0 as active_len will always be 0
                    //if this were to happen
                    let split_char = string[split_i];

                    //Always true if no active_edge
                    if(split_char != step_char) {
                        let split_node = active_node;

                        //Split must occur
                        if(active_len > 0) {
                            nodes[max_node_id] = new node(nodes[next_node].start, split_i);
                            split_node = max_node_id++;

                            nodes[split_node].edge[split_char.charCodeAt(0)] = next_node;
                            nodes[next_node].start = split_i;

                            nodes[active_node].edge[active_edge.charCodeAt(0)] = split_node;

                            //GRAPHICAL CHANGE DATA///////////////////////////
                
                            //Move node into position:
                            iteration_data.nodes[split_node].x = iteration_data.nodes[next_node].x;
                            iteration_data.nodes[split_node].y = iteration_data.nodes[next_node].y;

                            this.move_parent(next_node, x_node_seperation, 0, iteration_data, nodes);

                            //Delete edge created below when reverse iterating
                            prev_iter_data.remove_nodes.push(split_node);
                            prev_iter_data.remove_edges.push(split_node);

                            //Edge has been created
                            iteration_data.edges.push({
                                id: split_node, 
                                label: this.correct_edge_label(split_node, nodes, string, step),
                                from: active_node, to: split_node
                            });
                            nodes[split_node].parent = active_node;

                            //Undoing below re-root of edge
                            prev_iter_data.edges.push({
                                id: next_node,
                                label: string.substring(split_i - active_len, Math.min(nodes[next_node].end, step + 1)),
                                from: active_node, to: next_node
                            });

                            //Rerooting edge
                            iteration_data.edges.push({
                                id: next_node, 
                                label: this.correct_edge_label(next_node, nodes, string, step),
                                from: split_node, to: next_node
                            });
                            nodes[next_node].parent = split_node;
                            
                            ////////////////////////////////////////////////////

                            //Rule 1: Decrement active_len if insertion from root
                            active_len -= (active_node == root_id)
                        }

                        //Add new leaf node
                        nodes[max_node_id] = new node(step);

                        //GRAPHICAL CHANGE DATA///////////////////////////

                        //Remove node and edge created below
                        prev_iter_data.remove_nodes.push(max_node_id);
                        prev_iter_data.remove_edges.push(max_node_id);

                        //New node moved into position:
                        iteration_data.nodes[max_node_id].x = iteration_data.nodes[split_node].x + x_node_seperation;
                        iteration_data.nodes[max_node_id].y = this.find_min_y(split_node, iteration_data, nodes) + y_node_sepereation;

                        //Adding edge
                        iteration_data.edges.push({id: max_node_id, label: step_char, from: split_node, to: max_node_id});
                        //////////////////////////////////////////////////

                        nodes[split_node].edge[step_char.charCodeAt(0)] = max_node_id++;
                        
                        //Remainder decreases after successful insertion
                        remainder--;

                        //GRAPHICAL CHANGE DATA///////////////////////////
                        //Hack: 
                        if(this.first_insert) {
                            iteration_data.nodes[max_node_id - 1].y -= y_node_sepereation;

                            this.first_insert = false;
                        }
                        nodes[max_node_id - 1].parent = split_node;

                        this.move_branch(max_node_id - 1, iteration_data, nodes);

                        this.refresh_edge_len(nodes[active_node].edge[active_edge.charCodeAt(0)], iteration_data, nodes, string, step);
                        //////////////////////////////////////////////////

                        //Rule 2:
                        next_link = this.add_slink(next_link, split_node, nodes, prev_iter_data, iteration_data, maximum_nodes);

                        //Rule 3: Move down slink, if it doensn't exist then it will just go to root because default
                        //slink is root
                        active_node = nodes[active_node].slink;

                     } else {
                        active_len++;  

                        //GRAPHICAL CHANGE DATA///////////////////////////
                        this.update_displays(prev_iter_data, iteration_data, nodes, active_node, active_edge, active_len, remainder, step, string, max_node_id); 
                        ///////////////////////////////////////////////////////
                        
                        next_link = this.add_slink(next_link, active_node, nodes, prev_iter_data, iteration_data, maximum_nodes);

                        break; 
                     }
                }

                //GRAPHICAL CHANGE DATA///////////////////////////
                //Not necessary: Only for display purposes
                active_edge = string[step - active_len];
                this.update_displays(prev_iter_data, iteration_data, nodes, active_node, active_edge, active_len, remainder, step, string, max_node_id);

                //////////////////////////////////////////////////
            }
        }


        this.max_iterations = iteration;
    }

    get_next_iteration(iteration) {
        return this.next_iteration[iteration];
    }

    get_prev_iteration(iteration) {
        return this.prev_iteration[iteration];
    }

    get_max_iterations() {
        return this.max_iterations;
    }
}