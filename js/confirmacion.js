
// CONFERENCIA MAGISTRAL 2027
// GENERACIÓN DEL QR Y CONFIRMACIÓN

let reserva = null;

try {
    reserva = JSON.parse(
        sessionStorage.getItem("confirmacionReserva")
    );
} catch (error) {
    console.error("Error al recuperar la reserva", error);
}

const contenido = document.getElementById(
    "contenidoEntrada"
);

const errorPantalla = document.getElementById(
    "errorConfirmacion"
);

const contenedorQR = document.getElementById(
    "codigoQR"
);

function mostrarError() {
    contenido.classList.add("oculto");
    errorPantalla.classList.remove("oculto");
}

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "Fecha no disponible";
    }

    return fecha.toLocaleString("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Mexico_City"
    });
}

function iniciarConfirmacion() {

    if (
        !reserva ||
        !reserva.token ||
        !reserva.nombre ||
        !reserva.fila ||
        reserva.numero === undefined
    ) {
        mostrarError();
        return;
    }

    const nombreCompleto =
        reserva.nombre + " " + reserva.apellidos;

    const asiento =
        reserva.fila + "-" + reserva.numero;

    // Mostrar los datos de la entrada
    document.getElementById(
        "nombreAsistente"
    ).textContent = nombreCompleto;

    document.getElementById(
        "asientoAsignado"
    ).textContent = asiento;

    document.getElementById(
        "nombreEvento"
    ).textContent = reserva.evento;

    document.getElementById(
        "fechaEvento"
    ).textContent = formatearFecha(reserva.fecha);

    document.getElementById(
        "lugarEvento"
    ).textContent = reserva.lugar;

    document.getElementById(
        "identificadorQR"
    ).textContent =
        "Identificador: " + reserva.token;

    // Generar el código QR usando el token único
    if (typeof QRCode === "undefined") {
        contenedorQR.textContent =
            "No se pudo cargar el generador QR.";
        return;
    }

    contenedorQR.innerHTML = "";

    new QRCode(contenedorQR, {
        text: reserva.token,
        width: 220,
        height: 220,
        colorDark: "#111827",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Descargar el QR como imagen PNG
document.getElementById(
    "btnDescargar"
).addEventListener("click", function () {

    if (!reserva || !reserva.token) {
        alert("No hay una entrada para descargar.");
        return;
    }

    const canvas = contenedorQR.querySelector("canvas");
    const imagen = contenedorQR.querySelector("img");

    let urlImagen = "";

    if (canvas) {
        urlImagen = canvas.toDataURL("image/png");
    } else if (imagen && imagen.complete) {
        urlImagen = imagen.src;
    }

    if (!urlImagen) {
        alert("El código QR todavía no está disponible.");
        return;
    }

    const enlace = document.createElement("a");

    enlace.href = urlImagen;
    enlace.download =
        "Entrada_CM2027_" +
        reserva.fila + "-" +
        reserva.numero + ".png";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
});

// Compartir confirmación mediante WhatsApp
document.getElementById(
    "btnWhatsapp"
).addEventListener("click", function () {

    if (!reserva) {
        return;
    }

    const mensaje =
        "🎓 CONFERENCIA MAGISTRAL 2027\n\n" +
        "¡Mi registro está confirmado!\n\n" +
        "Evento: " + reserva.evento + "\n" +
        "Asistente: " + reserva.nombre +
        " " + reserva.apellidos + "\n" +
        "Asiento: " + reserva.fila +
        "-" + reserva.numero + "\n" +
        "Fecha: " + formatearFecha(reserva.fecha) + "\n" +
        "Lugar: " + reserva.lugar + "\n\n" +
        "Conservaré mi código QR para ingresar.";

    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(mensaje);

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
});

// Inicializar la página
iniciarConfirmacion();
