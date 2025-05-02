document.addEventListener("DOMContentLoaded", function () {
    const logo = document.getElementById("logo");
    logo.addEventListener("click", function () {
        location.reload();
    });

    // Cambiar la ruta de la URL sin recargar la página
    history.pushState(null, "", "/simulador");
});
