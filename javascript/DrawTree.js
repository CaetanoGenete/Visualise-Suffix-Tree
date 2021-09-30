var network = null;

var full_string = "";
var string_index = 0;

var nodes = new vis.DataSet();
var edges = new vis.DataSet();

function init() {
    var input = document.getElementById("input_text");

    console.log(input.value);
}

function check_overflow_boxes() {
    container = document.getElementById("info__char-boxes");


    if(container.clientHeight < container.scrollHeight)
        container.style.borderColor = "#808080FF";
    else
        container.style.borderColor = "#80808000";
    
}

window.onresize = check_overflow_boxes;

function load_string() {
    container = document.getElementById("info__char-boxes");
    text_box = document.getElementById("input_text");

    while(container.firstChild) {
        container.removeChild(container.firstChild);
    }

    //Reset string and index
    full_string = text_box.value;
    string_index = 0;

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
    tree = new Tree();
}

function add_character() {    
    if(string_index < full_string.length) {
        next_char = full_string[string_index];

        string_index = tree.add_character(next_char);
    }
}
