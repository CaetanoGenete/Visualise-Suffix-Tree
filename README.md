# Visualising Ukkonen's algorithm
<h2>Inspiration</h2>
This is a project inspired by Brenden's excellent website with the same goal (see <a href = https://brenden.github.io/ukkonen-animation/>https://brenden.github.io/ukkonen-animation/</a>). The scope of this project is improve upon and address certain limitations of the aformentioned tool, also providing a different outlook.

<h2>Motive</h2>
There are many reasons behind the creation of this tool, from more practical reasons to simply for educational purposes, of course any programming tends to be instructive regardless of whether it is a reinvention. The main reasons behind this website are to:
<br></br>
<ul>
  <li>Allow for indefinately sized strings</li>
  <li>Provide control over the display of the tree</li>
  <li>Correctly display suffix links</li>
</ul>

The second motivation for this website is to provide source code for an efficient implementation of this algorithm.

<h2>The algorithm</h2>
Ukkonen's algorithm is a O(n) time complexity algorithm for building a suffix tree. 

```javascript
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

    //All edges by default will map t
    this.edge = new Array(ALPHABET_SIZE).fill(0);
}
```

```javascript
var nodes = null;

var add_slink = function(from, to, nodes) {
    //Add slink
    nodes[from].slink = to;
    //Ensure ROOT_ID never has an outgoing link
    nodes[ROOT_ID].slink = ROOT_ID;
    
    //Next node that might need a link is 'to'
    return to;
}

var build_suffix_tree = function(string) { 
    nodes = new Array((string.length << 1) - 1);
    
    let next_id = ROOT_ID:
    //Having start be the length ensures that active_edge calculated from a non existant edge (i.e. which points to 0)
    //will always be null
    nodes[next_id++] = new node(string.length);
    
    //Active point:
    let active_node = ROOT_ID;
    let active_len = 0;
    
    //Number of suffixe's that need to be inserted at given step
    let remainder = 0;
    
    for(let step = 0; step < string.length; step++) {
        let step_char = string.charCodeAt(step);
    
        let to_link = ROOT_ID;
    
        //There is always one character that needs to be added
        remainder++;
        while(remainder > 0) {
            //Optimisation 1: active_edge is always dependant on active_len
            let active_edge = string[step - active_len];
            
            let next_node = nodes[active_node].edge[active_edge];
            let edge_len = nodes[next_node].end - nodes[next_node].start;
            
            //Note: If next_node is root, thereby implying no active_edge char points of active_node,
            //then this will pass
            //
            //If true, need to walk down tree to next node
            if(edge_len <= active_len) {
                active_node = next_node;
                active_len -= edge_len;
            }
            else {
                let split_i = nodes[next_node].start + active_len;
                //If active_edge does not exist then this will always be 0 as active_len will always be 0,
                //if this were to happen
                let split_char = string.charCodeAt(split_i);

                //Always true if no active_edge as start of root node points to the null character
                if(split_char != step_char) {
                    //Node where next insert is going to occur
                    let split_node = active_node;

                    //Split must occur
                    if(active_len > 0) {
                        nodes[next_id] = new node(nodes[next_node].start, split_i);
                        split_node = next_id++;
                        
                        nodes[split_node].edge[split_char] = next_node;
                        nodes[next_node].start = split_i;
                        
                        nodes[active_node].edge[active_edge] = split_node;
                        
                        //Rule 1:
                        active_len -= (active_node == root_id);
                    }
                    
                    nodes[next_id] = new_node(step);
                    nodes[split_node].edge[step_char] = next_id++;
                    
                    //Decrease remainder after successfull insertion
                    remainder--;
                    
                    //Add slink (Rule 2)
                    to_link = add_slink(to_link, split_node, nodes);
                    
                    //(Rule 3)
                    active_node = nodes[active_node].slink;
                }
                else {
                    //character is alread on edge
                    active_len++;
                    
                    //Optimisation 3
                    to_link = add_slink(to_link, active_node, nodes);

                    //Want to start checking next character
                    break;
                }
            }
        }
    }
}
```
<h2>Dependencies</h2>
Many thanks to:
<ul>
  <li>Visjs (<a href = "https://visjs.org/">https://visjs.org/</a>)</li>
  For providing the functionality used to render the graph.
</ul>
