const default_node_colour = "#8a2be2";

tree = null;

function node(start, end = Number.MAX_SAFE_INTEGER) {
    this.start = start;
    this.end = end;
    this.slink = 0;

    this.edge = new Map();
}

class Tree {
    #nodes = [];

    #active_node = 0;
    #active_edge = 0;
    #active_len = 0;

    #to_link = 0;

    #remainder = 0;
    #step = 0;
    #string = "";

    #add_node(root, start, end = Number.MAX_SAFE_INTEGER) {
        var node_index = this.#nodes.length;
        var level = 0;

        if(root != null)
            level = nodes.get(root)["level"] + 1;

        nodes.add({
            id: node_index, 
            label: String(node_index),
            level: level
        });

        var leaf = new node(start, end);
        leaf.edge.set(0, node_index);
        this.#nodes.push(leaf);

        return node_index;
    }

    #get_edge_index(root, char) {
        if(this.#nodes[root].edge.get(char) != null)
            return this.#nodes[root].edge.get(char);
        else
            return 0;
    }

    #get_edge(root, char) {
        return this.#nodes[this.#get_edge_index(root, char)];
    }

    #get_act_edge_node() {
        return this.#get_edge(this.#active_node, this.#active_edge);
    }

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

    #add_edge(root, char, to) {
        edges.add({
            id: to,
            from: root,
            to: to,
            label: char
        });

        this.#nodes[root].edge.set(char, to);
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

        edges.update({
            id: to, from: new_root
        });

        this.#update_levels(new_root);
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
                color: default_node_colour
            },
            layout: {
                hierarchical: {
                  direction: "LR",
                },
            },
            physics: true
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

        var split_i = this.#get_act_edge_node().start + this.#active_len;

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

                    this.#reroot_edge(split_node, split_c, next_node);
                    this.#add_edge(this.#active_node, this.#active_edge, split_node);

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