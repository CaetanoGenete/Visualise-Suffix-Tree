const default_node_colour = "#8a2be2";

const active_node_colour = "red";

const default_box_colour = "#f7f1f7";
const marked_box_colour = "greenyellow";
const curr_step_box_colour= "green";

//Horizontal grid seperation of nodes
const x_node_seperation = 200;
//Vertical grid seperation of nodes
const y_node_sepereation = 50;

tree = null;

//Node constructor function
function node(parent, start, end = Number.MAX_SAFE_INTEGER) {
    //Substring ends: [start, end)
    this.start = start;
    this.end = end;

    //suffix link
    this.slink = 0;
    this.parent = parent;

    //Children (Leaf node => edge.size() === 1)
    this.edge = new Map();
}

var add_nodes = [];
var update_nodes = [];

var add_edges = [];
var update_edges = [];

class Tree {
    #nodes = [];

    #active_node = 0;
    #active_edge = 0;
    #active_len = 0;

    //Next node that needs a suffix link
    #to_link = 0;

    #remainder = 0;
    #step = 0;

    #string = "";

    /**
     * Insert new leaf node to input root, with edge represeting substring of class attribute "string". 
     * 
     * @access private
     * @param {number} root Node from which to insert edge
     * @param {number} start Start index of substring
     * @param {number} end End index of substring ("string" length by default)
     * 
     * @returns {number} ID of newly created leaf node.
     */
    #add_node(root, start, end = Number.MAX_SAFE_INTEGER) {
        var node_index = this.#nodes.length;

        //Add node to visjs graph
        nodes.add({
            id: node_index, 
            label: String(node_index),
            x: 0, y: 0
            //level: level
        });

        //Create new leaf and set edge
        var leaf = new node(root, start, end);
        leaf.edge.set(0, node_index);
        this.#nodes.push(leaf);

        return node_index;
    }

    /**
     * Returns ID of the input <i>root</i>'s child node, with edge substring starting with input <i>char</i>. Note:
     * Starting character of all edges with common root must be distinct.
     * 
     * If no such node exists then 0 is returned, signalling an error.
     * 
     * @method
     * @private
     *    
     * @param {number} root 
     * @param {String} char  
     * 
     * @returns {number} See description above.
     */
    #get_edge_index(root, char) {
        if(this.#nodes[root].edge.get(char) != null)
            return this.#nodes[root].edge.get(char);
        else
            return 0;
    }

    /**
     * Returns <i>root</i>'s child node as an object, with edge substring starting with input <i>char</i>. Note:
     * Starting character of all edges with common root must be distinct.
     * 
     * If no such node exists then the root node is returned, signalling an error.   
     * 
     * @method
     * @private
     * 
     * @param {number} root 
     * @param {String} char
     * 
     * @return {Object} See description above.  
     */
    #get_edge(root, char) {
        return this.#nodes[this.#get_edge_index(root, char)];
    }

    /**
     * Returns the <i>active_node</i>'s child node as an object, with edge substring starting with the <i>active_edge</i>. 
     * 
     * If no such node exists then the root node is returned, signalling an error.   
     * 
     * @method
     * @private
     * 
     * @return {Object} See description above.  
     */
    #get_act_edge_node() {
        return this.#get_edge(this.#active_node, this.#active_edge);
    }

    /**
     * Updates the label on input edge.
     * 
     * @method
     * @private
     * 
     * @param {number} to ID of edge (Should always be the deepest node connected by the edge) 

     */
    #update_edge_label(to, update_array) {
        var node = this.#nodes[to];

        update_array.push({
            id: to,
            label: this.#string.substring(node.start, Math.min(node.end, this.#step + 1))
        });
    }

    /**
     * Appends a character to edge label
     * 
     * @method
     * @private
     * 
     * @param {number} to Id of edge (Should always be the deepest node connected by the edge) 
     * @param {number} char Character to append to edge label
     */
    #add_char_to_label(to, char) {
        var node = this.#nodes[to];

        edges.update({
            id: to,
            label: edges.get(to)['label'] + char
        });
    }

    /**
     * Searches the tree/subtree for the greatest vertical displacement in the y-increasing direction 
     * 
     * @method
     * @private
     * 
     * @param {number} root Root node of sub-tree to search 
     */
    #find_min_y(root) {
        var max_node = root;
        var max_y = nodes.get(root)['y'];
        
        //Structure of the tree ensures that if a node's parent has a smaller displacement than 
        //a different node's parent then, it's y-coordinate will always be smaller.
        //
        //Therefore, recursively choose child node with smallest y-coordinate until there are no
        //more children
        while(true) {

            if(this.#nodes[max_node].edge.size == 1)
                return max_y;

            //Find minimum
            this.#nodes[max_node].edge.forEach((value) => {
                //Omit current node
                if(value != max_node) {
                    max_y = Math.max(nodes.get(value)['y'], max_y);
                    max_node = value;
                }
            });
        }        
    }

    /**
     * Moves node and all its children by the input x and y displacement
     * 
     * @method
     * @private
     *
     * @param {number} root The node to be moved
     * @param {number} by_y displacement in y-direction
     * @param {number} by_x displacement in x-direction
     */
    #move_parent(root, by_x, by_y, update_array) {
        //Todo: Make deque
        var queue = [root];

        //Simple DFS
        while(queue.length > 0) {
            var current = queue.shift();

            update_array.push({id: current, y: nodes.get(current)['y'] - by_y, x: nodes.get(current)['x'] + by_x});

            this.#nodes[current].edge.forEach((value) => {
                if(value != current)
                    queue.push(value);
            });
        }

    }

    /**
     * Moves all nodes that do not lie on the path connecting the root node to the input inserted node. If a node is above this 'branch'
     * line, then it will be shifted vertically upwards otherwise downwards.
     * 
     * @method
     * @private
     * 
     * @param {number} inserted_node Invariant leaf node
     */
    #move_branch(inserted_node) {

        var update_array = [];

        //Traverse down branch
        while(inserted_node != 0) {
            var parent = this.#nodes[inserted_node].parent;

            this.#nodes[parent].edge.forEach((value) => {
                if(value != parent && value != inserted_node) {
                    //Move all children below the 'branch' downwards
                    if(nodes.get(value)['y'] < nodes.get(inserted_node)['y'])
                        this.#move_parent(value, 0, y_node_sepereation, update_array);
                    //Move all children above the branch upwards
                    else if(nodes.get(value)['y'] > nodes.get(inserted_node)['y'])
                        this.#move_parent(value, 0, -y_node_sepereation, update_array);
                }
            });

            inserted_node = parent;
        }

        nodes.update(update_array);
    }

    /**
     * Links two input nodes (root and to) with an edge. 
     * 
     * @param {number} root Start of edge
     * @param {number} char First character of edge label
     * @param {number} to End of edge
     * @param {number} active_edge_node Node to be replaced (if needed)
     */
    #add_edge(root, char, to, active_edge_node = null) {
        var offset = 0;

        var x = 0;
        var y = 0;
        
        if(this.#nodes[root].edge.size > 1)
            offset = y_node_sepereation;

        //If it's a leaf node: Position will always be such that it does not overlap with the subtree's of
        //its parent's other children. This has arbitrarily been chosen to be the smallest offset downwards.
        if(active_edge_node == null) {
            x = nodes.get(root)['x'] + x_node_seperation,
            y = this.#find_min_y(root) + offset
        }
        //Otherwise node inherts position of active_edge_node
        else {
            x = nodes.get(active_edge_node)['x'];
            y = nodes.get(active_edge_node)['y'];
        }
        
        nodes.update({
            id: to, 
            y: y,
            x: x
        });

        edges.add({
            id: to,
            from: root,
            to: to,
            label: char
        });

        this.#nodes[root].edge.set(char, to);
        
        //Move children of parent to ensure children nodes are symmetrically placed (If they are leaf nodes)
        if(active_edge_node == null) {
            var update_array = [];

            this.#nodes[root].edge.forEach((value) => {
                if(value != root && value != to)
                    this.#move_parent(value, 0, y_node_sepereation, update_array);
            });
            nodes.update(update_array);

            this.#move_branch(root);
        }
    }

    /**
     * Changes the root node of the edge with id 'to' with input new_root.
     * 
     * @param {number} new_root New root node for edge
     * @param {String} char First character of edge label (may be different if needs changing)
     * @param {number} to ID of edge (Should always be the deepest node connected by the edge) 
     */
    #reroot_edge(new_root, char, to) {
        this.#nodes[new_root].edge.set(char, to);
        this.#nodes[to].parent = new_root;

        //Adjust node position of end node to ensure no overlap
        var delta_x = (nodes.get(new_root)['x'] + x_node_seperation) - nodes.get(to)['x'];
        var delta_y = nodes.get(new_root)['y'] - nodes.get(to)['y'];

        var update_array = [];
        this.#move_parent(to, delta_x, delta_y, update_array);
        nodes.update(update_array);

        edges.update({
            id: to, from: new_root
        });

    }

    /**
     * Changes active_node and updates display on navigation panel.
     * 
     * @method
     * @private
     * 
     * @param {number} to New active_node 
     */
    #change_active_node(to) {
        var active_point = document.getElementById("active-point-data");

        nodes.update({
            id: to, color: active_node_colour
        });
        
        if(this.#active_node != to) {
            nodes.update({
                id: this.#active_node, color: default_node_colour
            });
        }

        //Updates display
        this.#active_node = to;
        active_point.children[0].innerHTML = this.#active_node;
    }

    
    /**
     * Changes active_edge and updates display on navigation panel.
     * 
     * @method
     * @private
     * 
     * @param {number} char New active_edge
     */
    #change_active_edge(char) {
        var active_point = document.getElementById("active-point-data");

        this.#active_edge = char;
        active_point.children[1].innerHTML = char;
    }

    
    /**
     * Changes active_len and updates display on navigation panel.
     * 
     * @method
     * @private
     * 
     * @param {number} len New active_len 
     */
    #change_active_len(len) {
        len = Math.max(0, len);
        var active_point = document.getElementById("active-point-data");

        this.#active_len = len;
        active_point.children[2].innerHTML = len;
    }

    /**
     * Changes remainder, updates display on navigation panel and correctly colours the
     * character boxes to show what substring is currently being inserted
     * 
     * @method
     * @private
     * 
     * @param {number} remainder New remainder 
     */
    #change_remainder(remainder) {
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        //Reset colour of boxes that were previously green
        if(this.#step < boxes.length) {
            for(var i = Math.max(0, this.#step - this.#remainder); i <= this.#step; i++) {
                boxes[i].children[0].style.backgroundColor = "#f7f1f7";
            }
        }

        //Update display
        this.#remainder = remainder;
        variables.children[0].innerHTML = remainder;

        //Clours boxes correctly
        if(this.#step < boxes.length) {
            for(var i = this.#step - this.#remainder + 1; i < this.#step; i++) {
                boxes[i].children[0].style.backgroundColor = "greenyellow";
            }

            boxes[this.#step].children[0].style.backgroundColor = "green";
        }
    }

    /**
     * Changes step, updates display on navigation panel and correctly colours the
     * character boxes to show what substring is currently being inserted
     * 
     * @method
     * @private
     * 
     * @param {number} step New step 
     */
    #change_step(step) {
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        //Reset colour of boxes that were previously marked
        if(step < boxes.length)
        for(var i = Math.max(0, this.#step - this.#remainder); i <= step; i++)
            boxes[i].children[0].style.backgroundColor = "#f7f1f7";

        //Update display
        this.#step = step;
        variables.children[1].innerHTML = step;

        //Correctly colour
        if(step < boxes.length) {
            for(var i = step - this.#remainder + 1; i <= step; i++)
                boxes[i].children[0].style.backgroundColor = "greenyellow";

            //Last box is the step box which is a different colour
            boxes[step].children[0].style.backgroundColor = "green";
        }

    }

    /**
     * The length of the label of the edge leaving 'node' with first character 'char'.
     * 
     * @param {*} node root node of edge
     * @param {*} char The first character of the edge's label
     * 
     * @returns See description above.
     */
    #edge_length(node, char) {
        var edge = this.#get_edge(node, char);

        return Math.min(this.#string.length, edge.end) - edge.start;
    }

    constructor() {        
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

        //Empty nodes and edges
        nodes.clear();
        edges.clear();

        //Add first root node
        this.#add_node(null, 0);

        this.#change_active_node(0);
        this.#change_active_edge(0);
        this.#change_active_len(0);

        this.#change_remainder(1);
        this.#change_step(0);

        var data = {
            nodes: nodes,
            edges: edges
        }
    
        network = new vis.Network(container, data, options);
    }

    /**
     * Adds an slink from to_link to the input parameter. Displayed as a 
     * dashed grey curved arrow.
     * 
     * @param {number} to Node the link points to 
     */
    #add_slink(to) {
        //If neither end of link is the root then proceed
        if(this.#to_link != 0 && to != 0 && this.#to_link != to) {
            this.#nodes[this.#to_link].slink = to;

            if(this.#to_link != to) {
                edges.add({
                    dashes: true,
                    color: "gray",
                    arrows: "to",

                    from: this.#to_link,
                    to: to,

                    smooth: {
                        enabled: true,
                        type: 'curvedCW'
                    }
                });
            }
        }

        //Next node requiring a suffix link is going to be the last linked node
        this.#to_link = to;
        return to;
    }

    //If true then on next iteration the step should be incremented
    #next_step = true;

    /**
     * Increments remainder and step
     * 
     * @private
     * @method
     * 
     */
    #allow_next_step() {
        this.#change_step(this.#step + 1);
        this.#change_remainder(this.#remainder + 1);
        this.#to_link = 0;

        this.#next_step = true;
    }

    /**
     * Draws the effect of the active_len and active_edge onto the graph by adding a delimeter and changing
     * the colour. This displays, visually, where the split will occur if the next substring is
     * not on the edge.
     */
    #render_split_edge() {
        if(this.#active_len > 0) {

            var update_array = [];
            this.#update_edge_label(this.#get_edge_index(this.#active_node, this.#active_edge), update_array);
            edges.update(update_array);

            this.#change_active_edge(this.#string[this.#step - this.#active_len]);


            //Gets the index of where the split could occur
            var split_i = this.#get_act_edge_node().start;
            split_i += Math.min(this.#active_len, this.#edge_length(this.#active_node, this.#active_edge));

            var node_i = this.#get_edge_index(this.#active_node, this.#active_edge);
            var node = this.#nodes[node_i];

            edges.update({
                id: node_i, label: "<b>" + this.#string.substring(node.start, split_i) + "|</b>" + this.#string.substring(split_i, Math.min(this.#string.length, node.end))
            });
        }
    }

    #single_insert(root, char) {
        var leaf = this.#add_node(root, this.#step);
        this.#add_edge(root, char, leaf);

        //Rule 2 (Add suffix link if this is not the first internal node created)
        this.#add_slink(root);
        this.#change_remainder(this.#remainder - 1);
        //Rule 1 (If active_node is root then decrement active length)
        this.#change_active_len(this.#active_len - (this.#active_node == 0));
        //Rule 3 (If a suffix link exists, then move active_node down suffix link)
        this.#change_active_node(this.#nodes[this.#active_node].slink);
        
        if(this.#remainder == 0)
            this.#allow_next_step();
    }

    /**
     * Builds the suffix tree one character at a time. For visualisation purposes, a character need not necessarily
     * be added if further nodes need to be added.
     * 
     * @param {String} character character to be added to tree 
     * 
     * @returns {Number} The current step of the function
     */
     
    add_character(character) {

        if(this.#next_step) {
            this.#next_step = false;

            this.#string += character;

            var update_array = [];
            for(var i = 0; i < this.#nodes.length; i++)
                //If is leaf
                if(this.#nodes[i].edge.size == 1)
                    this.#update_edge_label(i, update_array);

            edges.update(update_array);
        }

        this.#change_active_edge(this.#string[this.#step - this.#active_len]);
        var edge_len = this.#edge_length(this.#active_node, this.#active_edge);

        //Walk down the tree until in the middle of an edge
        if(edge_len <= this.#active_len) {
            this.#change_active_node(this.#get_edge_index(this.#active_node, this.#active_edge));
            this.#change_active_len(this.#active_len - edge_len);

            //Updates edge
            var update_array = [];
            this.#update_edge_label(this.#active_node, update_array);
            edges.update(update_array);
            
        } else {

            //Edge does not exist
            if(this.#get_edge_index(this.#active_node, this.#active_edge) == 0) {
                this.#single_insert(this.#active_node, this.#active_edge);
            } else {

                //Calculate split index
                var split_i = this.#get_act_edge_node().start + this.#active_len;
                var split_c = this.#string[split_i];

                //Characters to be inserted do not match!
                if(split_c != character) {
                    var next_node =  this.#get_edge_index(this.#active_node, this.#active_edge);
                    var split_node = this.#add_node(this.#active_node, this.#nodes[next_node].start, split_i);

                    this.#get_act_edge_node().start += this.#active_len;

                    this.#add_edge(this.#active_node, this.#active_edge, split_node, next_node);
                    this.#reroot_edge(split_node, split_c, next_node);
                    
                    var update_array = [];
                    this.#update_edge_label(next_node, update_array);
                    this.#update_edge_label(split_node, update_array);
                    edges.update(update_array);

                    this.#single_insert(split_node, character);
                }
                else {
                    this.#change_active_len(this.#active_len + 1);
                    this.#add_slink(this.#active_node);

                    this.#allow_next_step();
                }
            }
        }

        this.#render_split_edge();

        return this.#step;
    }
}