# Manual de Usuario - Kubo POS

## 1. Inicio de Sesión

Al iniciar el sistema, se mostrará la pantalla de Login.

- **Usuarios:** Seleccione su usuario de la lista.
- **Contraseña:** Ingrese su PIN o contraseña segura.
- **Roles:**
  - **Admin:** Acceso total al sistema.
  - **Empleado:** Acceso restringido (Solo ventas, cierre ciego, sin acceso a configuración crítica).

## 2. Pantalla de Ventas (POS)

Es la pantalla principal para realizar transacciones.

- **Buscar Productos:** Use el buscador superior o escanee el código de barras.
- **Agregar al Carrito:** Haga clic en el producto o presione `Enter` si usó el buscador.
- **Modificar Cantidad:** Use los botones `+` / `-` en el carrito.
- **Asignar Cliente:** Haga clic en el icono de usuario para asignar la venta a un cliente (necesario para Cuenta Corriente).
- **Finalizar Venta:** Presione el botón "Cobrar" (o `F12` / `Space`). Seleccione método de pago (Efectivo, Tarjeta, Cuenta Corriente).

## 3. Gestión de Caja

- **Apertura:** Al inicio del turno, debe abrir la caja indicando el monto inicial (cambio).
- **Movimientos:** Registre ingresos (reposición de cambio) o retiros (pago a proveedores) durante el turno.
- **Cierre de Caja:**
  - Contar el dinero físico en el cajón.
  - Ingresar el monto real en el sistema ("Arqueo").
  - El sistema generará un reporte comparando el teórico vs. real y mostrará diferencias.

## 4. Gestión de Productos (Inventario)

- **Agregar:** Botón "+" en Inventario. Ingrese nombre, código, costo, precio y stock.
- **Editar:** Haga clic en el lápiz en la fila del producto.
- **Eliminar:** Desactiva el producto (borrado lógico) para mantener historial de ventas.
- **Buscador:** Filtre por nombre o código.

## 5. Clientes y Cuenta Corriente

- **Registro:** En la sección "Clientes", registre nombre, DNI y teléfono.
- **Fiado (Cuenta Corriente):** Al cobrar una venta, seleccione "Cuenta Corriente". El saldo se sumará a la deuda del cliente.
- **Pagos de Deuda:** En la ficha del cliente, use el botón "Registrar Pago" para asentar abonos a la deuda.

## 6. Reportes Avanzados

(Solo Admin)

- **Métricas:** Visualice ganancias estimadas, ticket promedio y cantidad de ventas.
- **Gráficos:** Evolución de ventas diarias y mensuales.
- **Top Productos:** Ranking de los 10 productos más vendidos.
- **Exportar:** Descargue reportes en **PDF** o **CSV/Excel**.

## 7. Configuración y Seguridad

- **Usuarios:** Cree o modifique usuarios y sus permisos.
- **Datos:** Realice copias de seguridad manuales ("Crear Copia") y restáurelas si es necesario.
- **Logo del Ticket:** Personalice el logo que aparece en los comprobantes.
