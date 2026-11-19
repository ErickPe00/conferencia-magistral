
const formulario = document.getElementById(
    "formRegistro"
);

const mensaje = document.getElementById(
    "mensaje"
);

formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.getElementById(
        "nombre"
    ).value.trim();

    const apellidos = document.getElementById(
        "apellidos"
    ).value.trim();

    const correo = document.getElementById(
        "correo"
    ).value.trim().toLowerCase();

    const telefono = document.getElementById(
        "telefono"
    ).value.trim();

    const privacidad = document.getElementById(
        "privacidad"
    ).checked;

    if (!nombre || !apellidos || !correo || !telefono) {
        mensaje.textContent =
            "Completa todos los campos.";
        return;
    }

    if (!/^[0-9]{10}$/.test(telefono)) {
        mensaje.textContent =
            "El teléfono debe contener 10 dígitos.";
        return;
    }

    if (!privacidad) {
        mensaje.textContent =
            "Debes aceptar el aviso de privacidad.";
        return;
    }

    const asistente = {
        nombre,
        apellidos,
        correo,
        telefono
    };

    // Guardar temporalmente los datos.
    // Todavía no se envían a Supabase.
    sessionStorage.setItem(
        "asistentePendiente",
        JSON.stringify(asistente)
    );

    window.location.href = "asientos.html";
});
