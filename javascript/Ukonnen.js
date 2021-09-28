const default_node_colour = "#8a2be2";

//Horizontal grid seperation of nodes
const x_node_seperation = 200;
//Vertical grid seperation of nodes
const y_node_sepereation = 50;

tree = null;

//Not constructor function
function node(parent, start, end = Number.MAX_SAFE_INTEGER) {
    //Substring ends: [start, end)
    this.start = start;
    this.end = end;

    //suffix link
    this.slink = 0;
    //Parent (Aids branch seperation)
    this.parent = parent;

    //Children (Leaf node => edge.size() === 1)
    this.edge = new Map();
}

class Tree {
    #nodes = [];

    //Active point
    /**@private @ */
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
     * 
     * 
     * @param {number} to ID of edge (Should always be the deepest node connected by the edge) 
     */
    #update_edge_label(to) {
        var node = this.#nodes[to];

        edges.update({
            id: to,
            label: this.#string.substring(node.start, Math.min(node.end, this.#step + 1))
        });
    }

    #add_char_to_label(to, char) {
        var node = this.#nodes[to];

        edges.update({
            id: to,
            label: edges.get(to)['label'] + char
        });
    }

    #find_min_y(root) {
        var max_node = root;
        var max_y = nodes.get(root)['y'];

        while(true) {

            if(this.#nodes[max_node].edge.size == 1)
                return max_y;

            this.#nodes[max_node].edge.forEach((value) => {
                if(value != max_node) {
                    max_y = Math.max(nodes.get(value)['y'], max_y);
                    max_node = value;
                }
            });
        }        
    }

    #move_parent(root, by_y, by_x = 0) {
        nodes.update({id: root, y: nodes.get(root)['y'] - by_y, x: nodes.get(root)['x'] + by_x});

        this.#nodes[root].edge.forEach((value) => {
            if(value != root)
                this.#move_parent(value, by_y, by_x);
        });
    }

    #move_branch(inserted_node) {

        while(inserted_node != 0) {
            var parent = this.#nodes[inserted_node].parent;

            this.#nodes[parent].edge.forEach((value) => {
                if(value != parent && value != inserted_node) {
                    if(nodes.get(value)['y'] < nodes.get(inserted_node)['y'])
                        this.#move_parent(value, y_node_sepereation);
                    else if(nodes.get(value)['y'] > nodes.get(inserted_node)['y'])
                        this.#move_parent(value, -y_node_sepereation);
                }
            });

            inserted_node = parent;
        }

    }

    #add_edge(root, char, to, active_edge_node = null) {
        var offset = 0;

        var x = 0;
        var y = 0;
        
        if(this.#nodes[root].edge.size > 1)
            offset = y_node_sepereation;

        if(active_edge_node == null) {
            x = nodes.get(root)['x'] + x_node_seperation,
            y = this.#find_min_y(root) + offset
        }
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

        if(active_edge_node == null) {
            this.#nodes[root].edge.forEach((value) => {
                if(value != root && value != to)
                    this.#move_parent(value, y_node_sepereation);
            });

            //console.log("root: " + String(root) + ", parent: " + String(this.#nodes[root].parent))
            this.#move_branch(root);
        }

        //console.log("to: " + String(to) + ", root: " + String(root));

    }

    #update_levels(root) {
        this.#nodes[root].edge.forEach((value) => {
            if(value != root) {
                nodes.update({
                    id: value, level: nodes.get(root)['level'] + 1
                });

                this.#update_levels(value)
            }
        });
    }

    #reroot_edge(new_root, char, to) {
        this.#nodes[new_root].edge.set(char, to);
        this.#nodes[to].parent = new_root;

        var delta_x = (nodes.get(new_root)['x'] + x_node_seperation) - nodes.get(to)['x'];
        var delta_y = nodes.get(new_root)['y'] - nodes.get(to)['y'];

        this.#move_parent(to, delta_y, delta_x);

        edges.update({
            id: to, from: new_root
        });

        //this.#update_levels(new_root);
    }

    #change_active_node(to) {
        var active_point = document.getElementById("active-point-data");

        nodes.update({
            id: to, color: "red"
        });
        
        if(this.#active_node != to) {
            nodes.update({
                id: this.#active_node, color: default_node_colour
            });
        }

        this.#active_node = to;
        active_point.children[0].innerHTML = this.#active_node;
    }

    #change_active_edge(char) {
        var active_point = document.getElementById("active-point-data");

        this.#active_edge = char;
        active_point.children[1].innerHTML = char;
    }

    #change_active_len(len) {
        var active_point = document.getElementById("active-point-data");

        this.#active_len = len;
        active_point.children[2].innerHTML = len;
    }

    #change_remainder(remainder) {
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        if(this.#step < boxes.length)
        for(var i = this.#step - this.#remainder; i <= this.#step; i++)
            boxes[i].children[0].style.backgroundColor = "#f7f1f7";

        this.#remainder = remainder;
        variables.children[0].innerHTML = remainder;

        if(this.#step < boxes.length) {
            for(var i = this.#step - this.#remainder + 1; i <= this.#step; i++)
                boxes[i].children[0].style.backgroundColor = "greenyellow";

            boxes[this.#step].children[0].style.backgroundColor = "green";

        }
    }

    #change_step(step) {
        var variables = document.getElementById("variables-data");
        var boxes = document.getElementsByClassName("char-box");

        if(step < boxes.length)
        for(var i = this.#step - this.#remainder; i <= step; i++)
            boxes[i].children[0].style.backgroundColor = "#f7f1f7";

        this.#step = step;
        variables.children[1].innerHTML = step;

        if(step < boxes.length) {
            for(var i = step - this.#remainder; i <= step; i++)
                boxes[i].children[0].style.backgroundColor = "greenyellow";

            boxes[step].children[0].style.backgroundColor = "green";
        }

    }

    #edge_length(node, char) {
        var edge = this.#get_edge(node, char);

        return Math.min(this.#string.length, edge.end) - edge.start;
    }

    constructor() {        
        var container = document.getElementById("suffix-tree");

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
            /*
            layout: {
                hierarchical: {
                  direction: "LR",
                },
            },
            */
            physics: false
        }

        if(network != null)
            network.destroy();

        nodes.clear();
        edges.clear();

        //Add first root node
        this.#add_node(null, 0);

        this.#change_active_node(0);
        this.#change_active_edge(0);
        this.#change_active_len(0);

        this.#change_remainder(0);
        this.#change_step(0);

        var data = {
            nodes: nodes,
            edges: edges
        }
    
        network = new vis.Network(container, data, options);
    }

    #add_slink(to) {
        if(this.#to_link != 0 && to != 0) {
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

        this.#to_link = to;
        return to;
    }

    #next_step = true;

    #allow_next_step() {
        this.#change_step(this.#step + 1);
        this.#change_remainder(this.#remainder + 1);
        this.#to_link = 0;

        this.#next_step = true;
    }

    #render_split_edge() {
        this.#update_edge_label(this.#get_edge_index(this.#active_node, this.#active_edge));

        this.#change_active_edge(this.#string[this.#step - this.#active_len]);

        var split_i = this.#get_act_edge_node().start;
        split_i += Math.min(this.#active_len, this.#edge_length(this.#active_node, this.#active_edge));

        if(this.#active_len > 0) {
            var node_i = this.#get_edge_index(this.#active_node, this.#active_edge);
            var node = this.#nodes[node_i];

            edges.update({
                id: node_i, label: "<b>" + this.#string.substring(node.start, split_i) + "|</b>" + this.#string.substring(split_i, Math.min(this.#string.length, node.end))
            });
        }
    }

    add_character(character) {
        if (this.#next_step) {
            this.#string += character;
            this.#next_step = false;

            for(var i = 1; i < this.#nodes.length; i++)
                //if is root
                if(this.#nodes[i].edge.size == 1)
                    this.#add_char_to_label(i, character);

        }

        if(this.#nodes.length == 1) {
            var leaf = this.#add_node(0, 0);
            this.#add_edge(0, character, leaf);

            this.#allow_next_step();

        } else {

            this.#change_active_edge(this.#string[this.#step - this.#active_len]);
            var edge_len = this.#edge_length(this.#active_node, this.#active_edge);

            if(edge_len <= this.#active_len) {
                this.#change_active_len(this.#active_len - edge_len);
                this.#change_active_node(this.#get_edge_index(this.#active_node, this.#active_edge));

                this.#change_active_edge(this.#string[this.#step - this.#active_len]);

                //Gets rid of delimeter while climbing
                this.#update_edge_label(this.#active_node);
                this.#render_split_edge();

                return this.#step;
            }

            var split_i = this.#get_act_edge_node().start + this.#active_len;
            var split_c = this.#string[split_i];

            if(split_c != character) {
                var split_node = this.#active_node;

                if(this.#active_len > 0) {
                    split_node = this.#add_node(this.#active_node, this.#get_act_edge_node().start, split_i);

                    var next_node = this.#get_edge_index(this.#active_node, this.#active_edge);

                    //split edge
                    this.#get_act_edge_node().start += this.#active_len;
                    this.#update_edge_label(next_node);

                    debugger;

                    this.#add_edge(this.#active_node, this.#active_edge, split_node, next_node);
                    this.#reroot_edge(split_node, split_c, next_node);

                    this.#update_edge_label(split_node);
                    this.#add_slink(split_node);
                }
                else {
                    this.#change_active_len(this.#active_len + (this.#active_node == 0));

                    this.#add_slink(split_node);
                }

                var leaf = this.#add_node(split_node, this.#step);
                this.#add_edge(split_node, character, leaf);

                this.#change_active_len(this.#active_len - (this.#active_node == 0));
                this.#change_remainder(this.#remainder - 1);

                this.#change_active_node(this.#nodes[this.#active_node].slink);
                
                //Can move onto next character
                if(this.#remainder == 0)
                    this.#allow_next_step();

            } else {
                this.#change_active_len(this.#active_len + 1);
                this.#add_slink(this.#active_node);

                this.#allow_next_step();
            }

            this.#render_split_edge();


            //Ensures split is rendered properly

        }   

        return this.#step;
    }
}