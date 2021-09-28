window.onload = function() {

    var text = document.getElementById("input_text");

    text.addEventListener("keypress", event => {

        console.log("Key pressed: " + event.key)
        if(event.key == " ") {
            event.preventDefault();
        }

        if(event.key.toLowerCase() != event.key) {
            console.log("failed");
            event.preventDefault();

            text.value += event.key.toLowerCase();
        }
    });

}

