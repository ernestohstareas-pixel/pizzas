async function consultar() {
    const id = document.getElementById('id_cliente').value;
    if (!id) return alert("Ingresa un ID para buscar");

    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('id_pizzeria').value = data.id_pizzeria;
            document.getElementById('nombre_completo').value = data.nombre_completo;
            document.getElementById('direccion').value = data.direccion;
            document.getElementById('telefono').value = data.telefono;
        } else {
            alert(data.error || "Cliente no encontrado");
        }
    } catch (err) {
        alert("Error al consultar el servidor");
    }
}