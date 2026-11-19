
// CONFERENCIA MAGISTRAL 2027
// PANEL ADMINISTRATIVO CON EDICIÓN Y CANCELACIÓN

const $ = id => document.getElementById(id);

const login = $("seccionLogin");
const panel = $("seccionPanel");
const tabla = $("tablaAsistentes");

let registrosActuales = [];
let registroCancelar = null;
let guardando = false;

function mostrarLogin() {
    login.classList.remove("admin-oculto");
    panel.classList.add("admin-oculto");
}

function mostrarPanel() {
    login.classList.add("admin-oculto");
    panel.classList.remove("admin-oculto");
}

function abrirModal(id) {
    $(id).classList.remove("admin-oculto");
}

function cerrarModal(id) {
    $(id).classList.add("admin-oculto");
}

async function comprobarAdministrador() {
    const { data: usuario, error } =
        await db.auth.getUser();

    if (error || !usuario.user) {
        return false;
    }

    const respuesta =
        await db.rpc("es_administrador");

    return !respuesta.error && respuesta.data === true;
}

// INICIAR SESIÓN

$("formLogin").addEventListener("submit", async e => {
    e.preventDefault();

    $("btnLogin").disabled = true;
    $("mensajeLogin").textContent = "Verificando...";

    try {
        const { error } = await db.auth.signInWithPassword({
            email: $("correoAdmin").value.trim(),
            password: $("passwordAdmin").value
        });

        if (error) throw error;

        if (!(await comprobarAdministrador())) {
            await db.auth.signOut();
            throw new Error("Cuenta sin permisos");
        }

        $("passwordAdmin").value = "";
        $("mensajeLogin").textContent = "";

        mostrarPanel();
        await cargarRegistros();

    } catch (error) {
        console.error(error);
        $("mensajeLogin").textContent =
            "No fue posible iniciar sesión. " +
            "Comprueba tus credenciales y permisos.";
    } finally {
        $("btnLogin").disabled = false;
    }
});

// CONSULTAR REGISTROS

async function cargarRegistros() {
    $("mensajePanel").textContent =
        "Actualizando información...";

    const { data, error } =
        await db.rpc("admin_listar_registros");

    if (error) {
        console.error(error);
        $("mensajePanel").textContent =
            "Error al cargar los asistentes.";
        return;
    }

    registrosActuales = data || [];

    const activos = registrosActuales.filter(
        r => r.estado === "confirmado"
    );

    const validados = activos.filter(
        r => r.asistencia_validada === true
    );

    $("totalRegistros").textContent = activos.length;
    $("totalValidados").textContent = validados.length;
    $("totalPendientes").textContent =
        activos.length - validados.length;

    dibujarTabla(registrosActuales);

    $("mensajePanel").textContent = "";
}

function crearCelda(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = valor ?? "";
    fila.appendChild(celda);
    return celda;
}

function dibujarTabla(registros) {
    tabla.innerHTML = "";

    if (registros.length === 0) {
        const fila = document.createElement("tr");
        const celda = crearCelda(
            fila, "No hay registros."
        );
        celda.colSpan = 7;
        tabla.appendChild(fila);
        return;
    }

    registros.forEach(r => {
        const fila = document.createElement("tr");

        crearCelda(fila, r.id);
        crearCelda(
            fila, r.nombre + " " + r.apellidos
        );
        crearCelda(fila, r.correo);
        crearCelda(fila, r.telefono || "");
        crearCelda(fila, r.asiento);

        const celdaEstado = crearCelda(fila, "");
        const estado = document.createElement("span");

        estado.className = "admin-estado";

        if (r.estado === "cancelado") {
            estado.classList.add("cancelado");
            estado.textContent = "Cancelado";
        } else if (r.asistencia_validada) {
            estado.classList.add("validado");
            estado.textContent = "Validado";
        } else {
            estado.classList.add("confirmado");
            estado.textContent = "Confirmado";
        }

        celdaEstado.appendChild(estado);

        const celdaAcciones = crearCelda(fila, "");
        const contenedor = document.createElement("div");
        contenedor.className = "acciones-fila";

        const editar = document.createElement("button");
        editar.type = "button";
        editar.textContent = "Editar";
        editar.className =
            "boton-tabla boton-editar";

        editar.disabled = r.estado === "cancelado";
        editar.addEventListener(
            "click", () => abrirEditar(r.id)
        );

        const cancelar = document.createElement("button");
        cancelar.type = "button";
        cancelar.textContent = "Cancelar";
        cancelar.className =
            "boton-tabla boton-cancelar";

        cancelar.disabled =
            r.estado !== "confirmado" ||
            r.asistencia_validada;

        cancelar.addEventListener(
            "click", () => abrirCancelar(r.id)
        );

        contenedor.appendChild(editar);
        contenedor.appendChild(cancelar);
        celdaAcciones.appendChild(contenedor);

        tabla.appendChild(fila);
    });
}

// EDITAR ASISTENTE

function abrirEditar(id) {
    const r = registrosActuales.find(
        x => Number(x.id) === Number(id)
    );

    if (!r || r.estado !== "confirmado") return;

    $("editarId").value = r.id;
    $("editarNombre").value = r.nombre;
    $("editarApellidos").value = r.apellidos;
    $("editarCorreo").value = r.correo;
    $("editarTelefono").value = r.telefono || "";

    $("mensajeEditar").textContent = "";

    abrirModal("modalEditar");
    $("editarNombre").focus();
}

$("btnCerrarEditar").addEventListener("click", () => {
    if (!guardando) cerrarModal("modalEditar");
});

$("formEditar").addEventListener("submit", async e => {
    e.preventDefault();
    if (guardando) return;

    guardando = true;
    $("btnGuardarEditar").disabled = true;
    $("btnCerrarEditar").disabled = true;

    $("mensajeEditar").textContent =
        "Guardando cambios...";

    try {
        const { error } = await db.rpc(
            "admin_editar_asistente",
            {
                p_registro_id: Number($("editarId").value),
                p_nombre: $("editarNombre").value.trim(),
                p_apellidos: $("editarApellidos").value.trim(),
                p_correo: $("editarCorreo").value.trim(),
                p_telefono: $("editarTelefono").value.trim()
            }
        );

        if (error) throw error;

        cerrarModal("modalEditar");
        await cargarRegistros();

        $("mensajePanel").textContent =
            "Datos del asistente actualizados correctamente.";

    } catch (error) {
        console.error(error);

        $("mensajeEditar").textContent =
            error.message ||
            "No se pudieron guardar los cambios.";

    } finally {
        guardando = false;
        $("btnGuardarEditar").disabled = false;
        $("btnCerrarEditar").disabled = false;
    }
});

// CANCELAR RESERVA

function abrirCancelar(id) {
    const r = registrosActuales.find(
        x => Number(x.id) === Number(id)
    );

    if (!r ||
        r.estado !== "confirmado" ||
        r.asistencia_validada) {
        return;
    }

    registroCancelar = r.id;

    $("textoCancelar").textContent =
        "¿Quieres cancelar la reserva de " +
        r.nombre + " " + r.apellidos +
        " en el asiento " + r.asiento + "?";

    $("mensajeCancelar").textContent = "";

    abrirModal("modalCancelar");
}

$("btnCerrarCancelar").addEventListener("click", () => {
    if (!guardando) cerrarModal("modalCancelar");
});

$("btnConfirmarCancelar").addEventListener(
    "click", async () => {

        if (guardando || registroCancelar === null) {
            return;
        }

        guardando = true;

        $("btnConfirmarCancelar").disabled = true;
        $("btnCerrarCancelar").disabled = true;

        $("mensajeCancelar").textContent =
            "Cancelando reserva...";

        try {
            const { error } = await db.rpc(
                "admin_cancelar_reserva",
                {
                    p_registro_id: Number(registroCancelar)
                }
            );

            if (error) throw error;

            registroCancelar = null;

            cerrarModal("modalCancelar");
            await cargarRegistros();

            $("mensajePanel").textContent =
                "Reserva cancelada. El asiento está disponible.";

        } catch (error) {
            console.error(error);

            $("mensajeCancelar").textContent =
                error.message ||
                "No fue posible cancelar la reserva.";

        } finally {
            guardando = false;
            $("btnConfirmarCancelar").disabled = false;
            $("btnCerrarCancelar").disabled = false;
        }
    }
);

// BOTONES PRINCIPALES

$("btnActualizar").addEventListener(
    "click", cargarRegistros
);

$("btnSalir").addEventListener("click", async () => {
    await db.auth.signOut();
    registrosActuales = [];
    registroCancelar = null;

    cerrarModal("modalEditar");
    cerrarModal("modalCancelar");

    tabla.innerHTML = "";
    mostrarLogin();
});

// RECUPERAR SESIÓN

async function iniciarAdministrador() {
    mostrarLogin();

    if (await comprobarAdministrador()) {
        mostrarPanel();
        await cargarRegistros();
    }
}

iniciarAdministrador();
