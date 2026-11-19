
// CONFERENCIA MAGISTRAL 2027
// LECTOR Y VALIDACIÓN DE CÓDIGOS QR

const accesoDenegado = document.getElementById(
    "accesoDenegado"
);

const contenidoValidador = document.getElementById(
    "contenidoValidador"
);

const resultado = document.getElementById(
    "resultadoValidacion"
);

const botonValidar = document.getElementById(
    "btnValidar"
);

const botonCamara = document.getElementById(
    "btnIniciarCamara"
);

const campoToken = document.getElementById(
    "tokenEntrada"
);

let lector = null;
let camaraActiva = false;
let procesando = false;

// Verificar permiso administrativo
async function verificarAcceso() {

    const { data: usuario, error: errorUsuario } =
        await db.auth.getUser();

    if (errorUsuario || !usuario.user) {
        return false;
    }

    const { data, error } =
        await db.rpc("es_administrador");

    return !error && data === true;
}

// Mostrar resultado
function mostrarResultado(tipo, texto) {

    resultado.className =
        "validador-resultado " + tipo;

    resultado.textContent = texto;
}

// Comprobar identificador UUID
function tokenValido(token) {

    const patron =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    return patron.test(token);
}

// Validar realmente en Supabase
async function validarEntrada(token) {

    if (procesando) {
        return;
    }

    const tokenLimpio = token.trim();

    if (!tokenValido(tokenLimpio)) {

        mostrarResultado(
            "error",
            "El identificador no tiene un formato válido."
        );

        return;
    }

    procesando = true;
    botonValidar.disabled = true;

    mostrarResultado(
        "aviso",
        "Consultando entrada en Supabase..."
    );

    try {

        const { data, error } =
            await db.rpc("admin_validar_entrada", {
                p_token: tokenLimpio
            });

        if (error) {
            throw error;
        }

        if (data.estado === "valida") {

            mostrarResultado(
                "exito",
                "✅ ENTRADA VÁLIDA. " + data.mensaje
            );

        } else if (data.estado === "utilizada") {

            mostrarResultado(
                "aviso",
                "⚠️ ENTRADA YA UTILIZADA. " +
                data.mensaje
            );

        } else {

            mostrarResultado(
                "error",
                "❌ ENTRADA RECHAZADA. " +
                data.mensaje
            );
        }

    } catch (error) {

        console.error("Error de validación:", error);

        mostrarResultado(
            "error",
            "No fue posible validar la entrada. " +
            "Revisa tu conexión o los permisos."
        );

    } finally {

        procesando = false;
        botonValidar.disabled = false;

    }
}

// Validación manual
document.getElementById(
    "formValidacion"
).addEventListener("submit", async (e) => {

    e.preventDefault();

    await validarEntrada(campoToken.value);

});

// Detener cámara y liberar el dispositivo
async function detenerLector() {

    if (lector) {

        const anterior = lector;
        lector = null;

        try {
            await anterior.clear();
        } catch (error) {
            console.warn(
                "No fue posible liberar el lector:",
                error
            );
        }
    }

    camaraActiva = false;
    botonCamara.disabled = false;
    botonCamara.textContent = "Activar lector QR";
}

// Iniciar lector de cámara
botonCamara.addEventListener("click", async () => {

    if (camaraActiva) {
        return;
    }

    if (typeof Html5QrcodeScanner === "undefined") {

        mostrarResultado(
            "error",
            "No se cargó la biblioteca del lector QR."
        );

        return;
    }

    camaraActiva = true;
    botonCamara.disabled = true;
    botonCamara.textContent = "Lector activo";

    lector = new Html5QrcodeScanner(
        "lectorQR",
        {
            fps: 10,
            qrbox: {
                width: 220,
                height: 220
            },
            rememberLastUsedCamera: true
        },
        false
    );

    lector.render(async (textoQR) => {

        if (procesando || !camaraActiva) {
            return;
        }

        // No permitir una segunda lectura
        camaraActiva = false;

        await detenerLector();

        campoToken.value = textoQR;

        await validarEntrada(textoQR);

    }, () => {
        // Ignorar intentos sin detectar QR
    });

});

// Iniciar página
async function iniciarValidador() {

    const autorizado = await verificarAcceso();

    if (!autorizado) {

        accesoDenegado.classList.remove(
            "admin-oculto"
        );

        contenidoValidador.classList.add(
            "admin-oculto"
        );

        return;
    }

    accesoDenegado.classList.add(
        "admin-oculto"
    );

    contenidoValidador.classList.remove(
        "admin-oculto"
    );
}

iniciarValidador();
