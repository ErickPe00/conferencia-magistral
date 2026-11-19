
let eventoActual = null;
let listaAsientos = [];
let asientoElegido = null;
let reservando = false;

const zona = document.getElementById("zonaAsientos");
const nombreAsistente = document.getElementById(
    "nombreAsistente"
);
const textoAsiento = document.getElementById(
    "asientoSeleccionado"
);
const botonConfirmar = document.getElementById(
    "btnConfirmar"
);
const mensaje = document.getElementById(
    "mensajeAsientos"
);

// Recuperar datos del formulario
let asistente = null;

try {
    asistente = JSON.parse(
        sessionStorage.getItem("asistentePendiente")
    );
} catch (error) {
    console.error("Datos temporales inválidos", error);
}

if (!asistente ||
    !asistente.nombre ||
    !asistente.apellidos ||
    !asistente.correo ||
    !asistente.telefono) {

    zona.textContent =
        "Primero debes completar el formulario de registro.";

    mensaje.textContent =
        "Regresa a la página de registro.";

} else {
    nombreAsistente.textContent =
        asistente.nombre + " " + asistente.apellidos;

    iniciar();
}

// Cargar evento y asientos
async function iniciar() {
    try {
        mensaje.textContent = "";

        const { data: evento, error: errorEvento } =
            await db
                .from("eventos")
                .select("id,nombre,fecha,lugar")
                .order("id", { ascending: true })
                .limit(1)
                .single();

        if (errorEvento) {
            throw errorEvento;
        }

        eventoActual = evento;

        await cargarAsientos();

    } catch (error) {
        console.error("Error al iniciar:", error);

        zona.textContent =
            "No fue posible cargar el auditorio.";

        mensaje.textContent =
            "Revisa la conexión con Supabase.";
    }
}

// Consultar asientos desde Supabase
async function cargarAsientos() {
    const { data, error } = await db.rpc(
        "obtener_asientos",
        {
            p_evento_id: eventoActual.id
        }
    );

    if (error) {
        throw error;
    }

    listaAsientos = data || [];

    // Si el asiento elegido ya fue ocupado,
    // eliminar la selección
    if (asientoElegido) {
        const actual = listaAsientos.find(
            a => a.id === asientoElegido.id
        );

        if (!actual || actual.ocupado) {
            asientoElegido = null;
            textoAsiento.textContent = "Ninguno";
        }
    }

    dibujarAsientos();
}

// Construir visualmente el auditorio
function dibujarAsientos() {
    zona.innerHTML = "";

    if (listaAsientos.length === 0) {
        zona.textContent =
            "No hay asientos configurados.";
        return;
    }

    const filas = [
        ...new Set(listaAsientos.map(a => a.fila))
    ];

    filas.forEach(fila => {

        const contenedorFila =
            document.createElement("div");

        contenedorFila.className = "fila-asientos";

        const etiqueta = document.createElement("span");
        etiqueta.className = "nombre-fila";
        etiqueta.textContent = fila;

        contenedorFila.appendChild(etiqueta);

        const asientosFila = listaAsientos.filter(
            a => a.fila === fila
        );

        asientosFila.forEach(asiento => {

            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = "asiento";
            boton.textContent = asiento.numero;

            boton.setAttribute(
                "aria-label",
                `Asiento ${fila}-${asiento.numero}`
            );

            if (asiento.ocupado) {
                boton.classList.add("ocupado");
                boton.disabled = true;

            } else if (
                asientoElegido &&
                asientoElegido.id === asiento.id
            ) {
                boton.classList.add("seleccionado");
                boton.setAttribute(
                    "aria-pressed", "true"
                );

            } else {
                boton.classList.add("disponible");
            }

            if (!asiento.ocupado) {
                boton.addEventListener("click", () => {
                    seleccionarAsiento(asiento);
                });
            }

            contenedorFila.appendChild(boton);
        });

        zona.appendChild(contenedorFila);
    });

    botonConfirmar.disabled =
        !asientoElegido || reservando;
}

// Seleccionar un asiento
function seleccionarAsiento(asiento) {
    if (reservando) return;

    asientoElegido = asiento;

    textoAsiento.textContent =
        asiento.fila + "-" + asiento.numero;

    mensaje.textContent = "";

    dibujarAsientos();
}

// Confirmar y guardar reserva
botonConfirmar.addEventListener(
    "click",
    async () => {

        if (reservando ||
            !asientoElegido ||
            !eventoActual ||
            !asistente) {
            return;
        }

        reservando = true;
        botonConfirmar.disabled = true;
        botonConfirmar.textContent =
            "Guardando reserva...";

        mensaje.textContent = "";

        try {
            const { data: token, error } =
                await db.rpc("reservar_asiento", {
                    p_evento_id: eventoActual.id,
                    p_asiento_id: asientoElegido.id,
                    p_nombre: asistente.nombre,
                    p_apellidos: asistente.apellidos,
                    p_correo: asistente.correo,
                    p_telefono: asistente.telefono
                });

            if (error) {
                throw error;
            }

            // Guardar confirmación de esta sesión
            const confirmacion = {
                token: token,
                nombre: asistente.nombre,
                apellidos: asistente.apellidos,
                fila: asientoElegido.fila,
                numero: asientoElegido.numero,
                evento: eventoActual.nombre,
                fecha: eventoActual.fecha,
                lugar: eventoActual.lugar
            };

            sessionStorage.setItem(
                "confirmacionReserva",
                JSON.stringify(confirmacion)
            );

            // Ya no necesitamos el formulario pendiente
            sessionStorage.removeItem(
                "asistentePendiente"
            );

            window.location.href =
                "confirmacion.html";

        } catch (error) {

            console.error("Error de reserva:", error);

            const descripcion =
                (error.message || "").toLowerCase();

            if (descripcion.includes("ocupado") ||
                error.code === "23505") {

                mensaje.textContent =
                    "Ese lugar ya fue reservado. " +
                    "Selecciona otro asiento.";

            } else if (
                descripcion.includes("correo ya")
            ) {
                mensaje.textContent =
                    "Este correo ya tiene un registro " +
                    "para la conferencia.";

            } else {
                mensaje.textContent =
                    "No se pudo confirmar la reserva. " +
                    "Revisa los datos e inténtalo de nuevo.";
            }

            // Actualizar los asientos ocupados
            try {
                await cargarAsientos();
            } catch (e) {
                console.error(
                    "No fue posible actualizar asientos", e
                );
            }

        } finally {
            reservando = false;
            botonConfirmar.textContent =
                "Confirmar mi reserva";

            botonConfirmar.disabled = !asientoElegido;
        }
    }
);
