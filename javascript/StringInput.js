
//Ensures that only lowercase characters that are not spaces can be written in the text area.
window.onload = function() {

    let text = document.getElementById("input_text");
    let build_button = document.getElementById("header__input-div").getElementsByTagName("button")[0];

    text.addEventListener("keydown", (event) => {

        if(event.key == "Enter")
            build_button.click();
    });

    text.addEventListener("input", (event) => {

        event.target.value = event.target.value.replace(/\s|\|/g, '');

        if(event.target.value.length > 0) {
            build_button.classList.add("button");
            build_button.style.backgroundColor = "#f5f5f5";
        }
        else {
            build_button.classList.remove("button");
            build_button.style.backgroundColor = null;        
        }

    } );

}

