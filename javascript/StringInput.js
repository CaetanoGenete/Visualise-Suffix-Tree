
//Ensures that only lowercase characters that are not spaces can be written in the text area.
window.onload = function() {

    var text = document.getElementById("input_text");

    text.addEventListener("keypress", event => {

        //Do not allow spaces
        if(event.key == " " || event.key == "|")
            event.preventDefault();
    });

}

