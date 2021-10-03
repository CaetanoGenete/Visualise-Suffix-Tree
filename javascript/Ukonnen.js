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

//Number of characters defined by the ASCII standard (not extended)
const ALPHABET_SIZE = 1 << 7;

//Root node's ID will always be 0
const ROOT_ID = 0;

var node = function(start, end = Number.POSITIVE_INFINITY) {
    this.start = start;
    this.end = end;

    //If suffix tree is contructed in one go (not character by character)
    //it may be worth having the slinks stored in a seperate array to
    //avoid unecessary data in nodes
    this.slink = 0;

    //All edges by default will map to 0 (meaning no edge)
    this.edge = new Array(ALPHABET_SIZE).fill(0);
}

class Tree {

    /**
     * Moves node and all of its descendants
     * 
     * @param {Number} node_id ID of node to be moved
     * @param {Number} by_x 
     * @param {Number} by_y 
     * @param {Object} current_iteration 
     * @param {Object[]} nodes 
     */
    move_parent(node_id, by_x, by_y, current_iteration, nodes) {
        //Todo: make deque
        let queue = [node_id];

        while(queue.length > 0) {
            let curr_node_id = queue.shift();

            current_iteration.nodes[curr_node_id].x += by_x;
            current_iteration.nodes[curr_node_id].y += by_y;

            for(let char = 0; char < ALPHABET_SIZE; char++)
                if(nodes[curr_node_id].edge[char] != 0)
                    queue.push(nodes[curr_node_id].edge[char]);
        }
    }

    /**
     * Creates space between branch connecting root and input node (should only ever be one path)
     * 
     * @param {Number} inserted_node_id leaf node, whose branch needs to be moved 
     * @param {Object} current_iteration
     * @param {Object[]} nodes 
     */
    move_branch(inserted_node_id, current_iteration, nodes) {

        while(inserted_node_id != 0) {
            let parent_id = nodes[inserted_node_id].parent;
            
            for(let char = 0; char < ALPHABET_SIZE; char++) {
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

    /**
     * Adds slink to tree.
     * 
     * @param {Number} from ID of root of slink
     * @param {Number} to ID of end of slink
     * @param {Object[]} nodes 
     * 
     * @param {Object} prev_iter_data 
     * @param {Object} iteration_data 
     * 
     * @param {Number} maximum_nodes Upper-bound for number of nodes in tree
     * @returns The next node_id that needs an slink
     */
    add_slink(from, to, nodes, prev_iter_data, iteration_data, maximum_nodes) {
        nodes[from].slink = to;
        //Ensure ROOT_ID never has an outgoing link
        nodes[ROOT_ID].slink = ROOT_ID;


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

    /**
     * @param {Number} edge_id Deepest node connected by edge
     * @param {Object[]} nodes 
     * @param {String} string 
     * @param {Number} step 
     * @returns The label on an edge
     */
    correct_edge_label(edge_id, nodes, string, step) {
        return string.substring(nodes[edge_id].start, Math.min(step + 1, nodes[edge_id].end));
    }

    /**
     * Gets the maximum y-value of the descendants of the input node.
     * 
     * @param {Number} node_id 
     * @param {Object} current_iteration 
     * @param {Object[]} nodes 
     * @returns 
     */
    find_max_y(node_id, current_iteration, nodes) {
        let max_node_id = node_id;
        let max_y = current_iteration.nodes[max_node_id].y;
        
        //Structure of the tree ensures that if a node's parent has a greater y-position than 
        //a different node's parent then, it's y-coordinate will always be greater also.
        //
        //Therefore, recursively choose child node with greatest y-coordinate until there are no
        //more children
        while(true) {
            let max_node = nodes[max_node_id];

            //Hack: Extra check needed
            if((max_node.end == Number.POSITIVE_INFINITY && max_node_id != 0) || this.first_insert)
                return max_y;

            for(let char = 0; char < ALPHABET_SIZE; char++) {
                let next_node = max_node.edge[char];

                if(next_node != 0) {
                    max_y = Math.max(current_iteration.nodes[next_node].y, max_y);
                    max_node_id = next_node;
                }
            }
        }        
    }

    /**
     * Updates graphical features attatched to the active point, remainder and step.
     * 
     * @param {Object} prev_iter_data 
     * @param {Object} iteration_data 
     * 
     * @param {Object[]} nodes 
     * 
     * @param {Number} active_node 
     * @param {String} active_edge 
     * @param {Number} active_len 
     * 
     * @param {Number} remainder 
     * @param {Number} step 
     * @param {String} string 
     * @param {Number} max_node_id 
     */
    update_displays(prev_iter_data, iteration_data, nodes, active_node, active_edge, active_len, remainder, step, string, max_node_id) {

        //Update text
        iteration_data.active_node = active_node;
        iteration_data.active_edge = active_edge;
        iteration_data.active_len = active_len;

        iteration_data.remainder = remainder;
        iteration_data.step = step;

        //Remove excess nodes
        iteration_data.nodes.length = max_node_id;

        //Update active_edge on graph
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

    /**
     * Changes edge_label back to default, if not already.
     * 
     * @param {Number} next_node 
     * 
     * @param {Object} iteration_data 
     * 
     * @param {Object[]} nodes 
     * 
     * @param {String} string 
     * @param {Number} step 
     */
    refresh_edge_len(next_node, iteration_data, nodes, string, step) {
        iteration_data.edges.push({
            id: next_node,
            label: this.correct_edge_label(next_node, nodes, string, step)
        });
    }

    constructor(string) {
        //Root will always be 0
        const ROOT_ID = 0;
        //Ukkonen's variables
        
        //Active point:
        let active_node = ROOT_ID;
        let active_edge = null;
        let active_len = 0;

        //Number of suffixe's that need to be inserted at given step
        let remainder = 0;
        
        //Node data
        
        let maximum_nodes = 2 * string.length;
        let nodes = new Array(maximum_nodes);
        
        let max_node_id = 0;
        //Having start be the length ensures that active_edge calculated from a non existant edge (i.e. which points to 0)
        //will always be null        
        nodes[max_node_id++] = new node(string.length);

        //GRAPHICAL CHANGE DATA////////////////////////////
        let iteration = 0;
        this.next_iteration = new Array(maximum_nodes);
        //First iteration, simply add root node
        this.next_iteration[iteration] = {
            nodes: [{id: ROOT_ID, label: String(ROOT_ID), x: 0, y: 0}],
            edges: [],

            active_node: active_node,
            active_edge: "none",
            active_len: active_len,

            remainder: remainder,
            step: 0,
        }

        this.prev_iteration = new Array(maximum_nodes);
        this.prev_iteration[iteration++] = {
            edges: [],

            remove_nodes: [ROOT_ID],
            remove_edges: [],
        }

        //Temporary, will find better solution later
        this.first_insert = true;  
        this.links_count = 0;

        ////////////////////////////////////////////////////

        for(let step = 0; step < string.length; step++) {
            let step_char = string[step];

            let to_link = ROOT_ID;
            remainder++;

            //Hack: for graphical use only
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
                //Optimisation 1: active_edge is always dependant on active_len
                active_edge = string[step - active_len];

                let next_node = nodes[active_node].edge[active_edge.charCodeAt(0)];
                let edge_len = nodes[next_node].end - nodes[next_node].start;
                
                //Note: If next_node is root, thereby implying no active_edge leaves active_node,
                //then this will pass (because infinity is always larger)
                //
                //If true, need to walk down tree to next node
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

                //Always true if no active_edge as start of root node points to the null character
                if(split_char != step_char) {
                        //Node where next insert is going to occur
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
                            active_len -= (active_node == ROOT_ID)
                        }

                        //Add new leaf node
                        nodes[max_node_id] = new node(step);

                        //GRAPHICAL CHANGE DATA///////////////////////////

                        //Remove node and edge created below
                        prev_iter_data.remove_nodes.push(max_node_id);
                        prev_iter_data.remove_edges.push(max_node_id);

                        //New node moved into position:
                        iteration_data.nodes[max_node_id].x = iteration_data.nodes[split_node].x + x_node_seperation;
                        iteration_data.nodes[max_node_id].y = this.find_max_y(split_node, iteration_data, nodes) + y_node_sepereation;

                        //Adding edge
                        iteration_data.edges.push({id: max_node_id, label: step_char, from: split_node, to: max_node_id});
                        //////////////////////////////////////////////////

                        nodes[split_node].edge[step_char.charCodeAt(0)] = max_node_id++;
                        
                        //Decrease remainder after successfull insertion
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

                        //Add slink (Rule 2)
                        to_link = this.add_slink(to_link, split_node, nodes, prev_iter_data, iteration_data, maximum_nodes);

                        //Rule 3: Move down slink, if it doensn't exist then it will just go to root because default
                        //slink is root
                        active_node = nodes[active_node].slink;

                     } else {
                         //character is already on the active_edge
                        active_len++;  

                        //GRAPHICAL CHANGE DATA///////////////////////////
                        this.update_displays(prev_iter_data, iteration_data, nodes, active_node, active_edge, active_len, remainder, step, string, max_node_id); 
                        ///////////////////////////////////////////////////////
                        
                        //Optimisation 3
                        to_link = this.add_slink(to_link, active_node, nodes, prev_iter_data, iteration_data, maximum_nodes);

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