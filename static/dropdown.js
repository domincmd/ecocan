const dropdownContainer = document.querySelector(".dropdown-menu")
console.log(dropdownContainer)

function toggleDropdownMenu() {
    
    
    if (dropdownContainer.style.display == "block") {
        dropdownContainer.style.display = "none";
    }else if (dropdownContainer.style.display = "none") {
        dropdownContainer.style.display = "block";
    }else{
        alert("menu dropdown is in undefined state")
    }
}