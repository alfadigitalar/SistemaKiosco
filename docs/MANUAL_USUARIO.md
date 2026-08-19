# 📘 Manual de Usuario Definitivo - Kubo POS (Guía Exhaustiva)

Bienvenido al manual de usuario más completo de **Kubo POS**. A diferencia de una guía rápida, este documento ha sido diseñado para explicar **cada pantalla, cada botón, cada alerta y cada atajo de teclado** de forma minuciosa. Si lees este documento, comprenderás el 100% de la lógica del sistema y serás un experto absoluto.

---

## 📌 Índice de Contenidos

1. [Primeros Pasos y Pantalla de Ingreso](#1-primeros-pasos-y-pantalla-de-ingreso)
2. [El Menú Lateral (Navegación)](#2-el-menú-lateral-navegación)
3. [Módulo: Dashboard (Panel de Inicio)](#3-módulo-dashboard-panel-de-inicio)
4. [Módulo: Vender (El Punto de Venta / POS)](#4-módulo-vender-el-punto-de-venta--pos)
5. [Módulo: Caja (Control de Dinero)](#5-módulo-caja-control-de-dinero)
6. [Módulo: Inventario (Productos, Precios y Combos)](#6-módulo-inventario-productos-precios-y-combos)
7. [Módulo: Clientes (Cuentas Corrientes)](#7-módulo-clientes-cuentas-corrientes)
8. [Módulo: Proveedores (Pedidos Inteligentes)](#8-módulo-proveedores-pedidos-inteligentes)
9. [Módulo: Historial (Anulaciones y Devoluciones)](#9-módulo-historial-anulaciones-y-devoluciones)
10. [Módulo: Reportes (Estadísticas y Excel)](#10-módulo-reportes-estadísticas-y-excel)
11. [Módulo: Usuarios (Control de Personal)](#11-módulo-usuarios-control-de-personal)
12. [Módulo: Configuración (AFIP, Copias de Seguridad, Correo)](#12-módulo-configuración-afip-copias-de-seguridad-correo)

---

## 1. Primeros Pasos y Pantalla de Ingreso

Cuando abras el sistema, lo primero que verás es una pantalla de seguridad. 
- **Campo de "Usuario":** Aquí debes escribir tu nombre de usuario exacto. El sistema distingue mayúsculas y minúsculas.
- **Campo de "Contraseña":** Escribe tu clave secreta. Verás puntos oscuros para que nadie vea tu clave.
- **Botón "Ingresar":** Botón azul ubicado debajo de la contraseña. Al hacer clic, el sistema verifica tus credenciales. Si fallas, verás un cartel rojo de alerta indicando que el usuario no existe o la clave es incorrecta.
- **Recordatorio:** Las credenciales que vienen de fábrica cuando el sistema es nuevo son -> Usuario: `admin` / Contraseña: `admin123`.

*Nota de seguridad:* Si ingresas como "Administrador", tendrás acceso total a borrar cosas y ver ganancias. Si ingresas como "Empleado", el sistema ocultará automáticamente los precios de costo, los reportes de ganancias y las configuraciones avanzadas.

---

## 2. El Menú Lateral (Navegación)

Del lado izquierdo de tu pantalla, verás una columna oscura con varios botones. Esta es tu "Botonera Principal".
- En la parte superior verás el logo de **Kubo POS**. Si haces clic allí, irás directamente al Dashboard.
- Debajo, verás la lista de módulos: **Dashboard, Vender, Caja, Inventario, Clientes, Proveedores, Historial, Usuarios, Reportes, Configuración**.
- **Botón "Cerrar Sesión":** Ubicado bien abajo a la izquierda. Sirve para bloquear la pantalla cuando termina tu turno laboral y que el siguiente empleado deba poner su propia contraseña.

---

## 3. Módulo: Dashboard (Panel de Inicio)

Esta es la pantalla de "Vistazo Rápido". Está diseñada para que el dueño sepa cómo va el día apenas inicia sesión.
- **Tarjetas Superiores:** Te muestran cuatro números gigantes:
  1. *Ventas de Hoy:* Suma total de dinero facturado en el día.
  2. *Ventas del Mes:* Suma total de dinero facturado desde el día 1 del mes en curso.
  3. *Tickets Emitidos:* La cantidad de ventas (clientes) atendidos hoy.
  4. *Alertas de Stock:* Un número en rojo que indica cuántos productos de tu kiosco se están por agotar.
- **Gráficos Centrales:** Verás gráficos de barras que comparan las ventas de la semana, y un gráfico circular con los productos más vendidos del mes.

---

## 4. Módulo: Vender (El Punto de Venta / POS)

¡El corazón de Kubo POS! Esta pantalla está diseñada para ser extremadamente rápida. No necesitas tocar el mouse (ratón) si no quieres.

### A. La Barra Superior
- **Buscador (Atajo F2):** La barra blanca grande que dice *"Buscar producto..."*. Si haces clic ahí y escribes "Coca", se despliega una lista. Si pulsas Enter sobre la opción correcta, se suma al carrito.
- **Botón con ícono de Celular:** Sirve para activar el escáner móvil. Al pulsarlo, sale un Código QR gigante. Si escaneas ese QR con la cámara de tu celular conectado al mismo WiFi, tu celular se convierte en lector de códigos de barras. Todo lo que enfoques con el celular se agregará automáticamente al carrito de la PC.
- **Selector de Cliente:** Arriba a la derecha dice *"Seleccionar Cliente"*. Sirve para decirle al sistema a quién le estás vendiendo. Búscalo por nombre. Es **obligatorio** seleccionarlo si le vas a vender "Al Fiado" o si le vas a hacer una Factura de AFIP de montos muy grandes.
- **Interruptor AFIP (Atajo F4):** Si el interruptor gris está apagado, emites tickets comunes (internos). Si lo pulsas, se pone verde y dice "FACTURA ELECTRÓNICA". En este modo, al cobrar, el sistema informará la venta a la AFIP y emitirá un ticket legal con código CAE. Para volver a ticket interno, puedes pulsar la tecla **F11**.

### B. Los Carritos en Espera (Pestañas)
Arriba del listado de compras verás tres pestañas grises: **Carrito 1, Carrito 2, Carrito 3**.
- **¿Qué pasa si estoy cobrándole a Juan, ya le pasé 15 productos, y me dice que se olvidó la billetera en el auto?**
- En vez de borrar los 15 productos para atender a la señora de atrás, simplemente **haz clic en "Carrito 2"**.
- La pantalla quedará vacía. Puedes atender a la señora y cobrarle normalmente. 
- Cuando Juan regrese, **haz clic en "Carrito 1"** y todos sus productos estarán allí guardados.

### C. La Lista Central (Carrito)
A medida que pasas el lector láser o buscas productos, se irán apilando aquí.
- **Cantidades:** A la derecha de cada producto verás botones circulares `+` y `-`. Púlsalos para subir o bajar la cantidad. También puedes hacer doble clic en el número central y escribir "50" directamente con el teclado para no pulsar el `+` cincuenta veces.
- **Productos Pesables:** Si configuraste en el inventario que el fiambre se vende "por Kg", al pasarlo por el lector se abrirá un recuadro verde gigante pidiendo que ingreses los gramos/kilos exactos (ej: `0.250`).
- **Botón Basurero Rojo:** Elimina por completo ese producto del carrito.

### D. Alertas Automáticas (Magia de Kubo)
- **Alerta de Vencimiento:** Si pasas un alfajor y está vencido, la pantalla emitirá un pitido de alerta y saldrá un enorme cartel rojo: **¡PRODUCTO VENCIDO!**. Si vence en menos de 7 días, saldrá un cartel naranja.
- **Alerta de Stock Bajo:** Si al pasar un producto, tu stock desciende del límite mínimo, te avisará con un cartel rojo para que recuerdes reponerlo.
- **Alerta de Promociones:** Si pasas 1 Fernet y 2 Cocas, y el sistema detecta que existe un "Combo" armado con eso, te aparecerá un cartel morado brillante que dice **"¡Oferta Disponible! Aplicar Promo"**. Si le das clic a "Aplicar", el sistema descontará esos productos sueltos y los reemplazará por el precio especial del Combo de forma automática.

### E. Botón "+ Ítem Libre"
Ubicado abajo a la izquierda. Úsalo cuando te piden algo raro que no tenés en sistema (ejemplo: "Carga virtual", "Fotocopias", "Hielo"). 
1. Haces clic ahí.
2. Escribes el nombre y el precio unitario.
3. Le das a Agregar. 
Se sumará al carrito con precio pero sin afectar el stock de tu negocio.

### F. El Cobro y Vuelto Automático (Atajo F9)
Abajo a la derecha está el botón verde **Cobrar (F9)**.
Al pulsarlo, se abre la ventana final. Tiene pestañas en la parte superior:
1. **Efectivo:** 
   - El sistema te pregunta "¿Paga con?". 
   - Tienes billetes dibujados (ej: de $1000, $2000, $10000). Si el total es $1500 y el cliente te da un billete de $2000, haz clic en el dibujo de $2000. 
   - Inmediatamente debajo dirá en color verde: **VUELTO: $500**. 
   - Le das al botón "Confirmar Venta" y listo.
2. **Tarjeta y Mercado Pago:** Para asentar que cobraste por Posnet o transferencia. (Recuerda que debes cobrar con el aparato físico primero).
3. **Mixto:** Para cuando te dan $1000 en efectivo y el resto con tarjeta. Pones "$1000" en el casillero de efectivo, y el sistema completa automáticamente cuánto le falta pasar por la tarjeta.
4. **Fiado / Cta. Cte:** Si apretas esto, no entra dinero en tu caja. La cuenta se le suma como DEUDA al cliente. (Recuerda que debes haber seleccionado al cliente arriba a la derecha antes de apretar cobrar, sino este botón estará bloqueado).

### G. Presupuestos (Atajo F5)
Si alguien te pide precio por mucha mercadería pero no la va a llevar ahora.
1. Cargas todos los productos al carrito.
2. Presionas la tecla **F5** (o el botón Presupuesto abajo a la izquierda).
3. Se abre una ventana preguntando hasta cuándo es válido el precio (fecha y hora).
4. Al confirmar, el sistema genera un archivo PDF formal con logo, fecha de vencimiento y detalle de la compra para que se lo envíes por WhatsApp al cliente.

---

## 5. Módulo: Caja (Control de Dinero)

El sistema lleva la cuenta de todos los billetes que deberías tener.
1. **Abrir Turno:** Cuando llegas a la mañana, el sistema está bloqueado. Vas a "Caja", ingresas en "Fondo Inicial" los billetes y monedas que usas para dar cambio (ej: $5000), y le das a "Abrir Turno".
2. **Botón Rojo "Egreso de Efectivo":** Se usa si sacas plata de la caja registradora. Por ejemplo, le pagas $2000 al sodero. Haces clic, pones monto $2000, escribes "Pago Soda", y le das a Guardar. Esto resta dinero a tu total para que al final del día no te salte que "te falta plata".
3. **Botón Verde "Ingreso de Efectivo":** Se usa si el dueño trae $10000 de su casa para tener más cambio en la caja. Pones $10000 y el concepto "Cambio".
4. **Cerrar Turno (Arqueo):** Al final de tu jornada laboral. 
   - Pulsas "Cerrar Caja". 
   - Cuentas todos los billetes físicos de tu cajón a mano y escribes el número exacto en el casillero "Efectivo en Caja".
   - Le das a Confirmar.
   - Si tenías que tener $20.000 y escribiste $19.000, el sistema te imprimirá un ticket rojo diciendo "FALTANTE DE CAJA: -$1000". Si todo está bien, dirá "Caja Cuadrada".

---

## 6. Módulo: Inventario (Productos, Precios y Combos)

Donde creas y editas tu catálogo.

### Crear Producto (Botón Azul "+ Nuevo Producto")
Al hacer clic, se abre una ventana con campos:
- **Código de Barras:** Pásalo por el láser. Si es pan y no tiene, presiona el botoncito mágico a la derecha del campo y el sistema te inventará un código único (ej: 00010023).
- **Nombre:** Bien detallado (ej: "Galletitas Oreo 117g").
- **Categoría:** Desplegable. Si no existe la categoría, la escribes.
- **Costo ($):** Lo que te cuesta a vos.
- **Precio Venta ($):** A cuánto lo vendes. (Notarás que al escribir esto, un numerito en verde al lado te dirá exactamente qué porcentaje de rentabilidad le estás sacando).
- **Stock Actual:** Cuántos tenés ahora mismo.
- **Stock Mínimo:** El número de alerta. Si pones 10, cuando queden 10 el sistema se pondrá a gritar y pintar en rojo el producto.
- **Unidad de Medida:** Por defecto dice "Unidad". Si es fiambre, cámbialo a "Kg o Gr" (Pesable). Así, al venderlo, te pedirá que ingreses el peso.
- **Vencimiento:** Si le das al interruptor, se despliega un calendario. Pones la fecha de caducidad.

### Editar Producto (Botón Ícono Lápiz)
En la lista de productos, cada fila tiene un lápiz azul a la derecha. Le haces clic, cambias el precio o stock, y le das a Guardar.

### Botón de "Actualizar Precios" (Masivo)
- Botón blanco con flechas hacia arriba.
- Si el repartidor de bebidas aumentó un 15%, no vayas uno por uno.
- Haces clic ahí, seleccionas la categoría "Bebidas", eliges "Aumentar en Porcentaje %", escribes "15", y le das a Aplicar. Todos los cientos de productos de esa categoría se actualizarán instantáneamente.

### Pestaña Combos / Promos
Arriba hay una pestaña para ir a Combos.
- Pulsa **+ Nuevo Combo**.
- **Nombre:** "Promo Fernet + Coca".
- **Precio del Combo:** $8000.
- **Componentes:** Abajo tienes un buscador. Buscas "Fernet 750ml", pones cantidad 1. Vuelves a buscar "Coca Cola 2L", pones cantidad 2. 
- Le das a Guardar.
- Al vender la Promo, entrarán $8000 a la caja y, secretamente por atrás, el sistema descontará 1 botella de Fernet y 2 Cocas del stock general de la base de datos.

---

## 7. Módulo: Clientes (Cuentas Corrientes)

### Crear Cliente
- Entras a Clientes, pulsas "+ Nuevo Cliente". Pones su Nombre (obligatorio), DNI y teléfono.

### Gestionar Fiado
- Cuando a Juan le fiaste en la pantalla de Ventas, su deuda aquí subió.
- En la fila de Juan, vas a ver en rojo que debe $5000.
- Haz clic en el botón azul del **Ojo (Detalles / Estado de Cuenta)**.
- Se abre su ficha personal, con todo lo que se llevó en el pasado.
- **Botón Verde "Registrar Pago (Abonar)":** Viene Juan con $3000. Haces clic, escribes "3000", eliges efectivo, y confirmas.
- Su deuda bajará mágicamente a $2000.
- **¿Qué pasa si debe $2000 y me trae un billete de $5000 y me dice "quedate el vuelto"?**
- Pones que te pagó $5000. La deuda de Juan quedará en verde y dirá: **Saldo a favor: +$3000**. La próxima vez que venga, el sistema descontará de ahí automáticamente.

---

## 8. Módulo: Proveedores (Pedidos Inteligentes)

### Proveedores
- Creas al proveedor (Botón + Nuevo).
- Asegúrate de que tus productos en el inventario tengan asignado a este proveedor.

### Generar Orden de Compra Mágica (Botón Hoja Gris)
1. En la fila del proveedor (ej: Arcor), pulsa el botón con forma de Hoja que dice "Crear Pedido".
2. Se abre una pantalla gigante en blanco.
3. Pulsa el botón gigante amarillo **"Cargar Faltantes (Stock Bajo)"**.
4. ¡Magia! El sistema lee todo tu inventario, filtra todo lo que sea de "Arcor", busca lo que esté por debajo del "Stock Mínimo" y lo mete en una lista. Te sugiere cuántos pedir para rellenar la góndola.
5. Puedes editar las cantidades manualmente ahí mismo.
6. Haces clic en el botón verde abajo a la derecha: **"Descargar PDF"**.
7. Te generará un PDF profesional, con tu logo, la fecha y la lista, ideal para mandarlo por WhatsApp al preventista de Arcor.

---

## 9. Módulo: Historial (Anulaciones y Devoluciones)

### Ver Tickets Pasados
- Entras, y a la izquierda ves una lista de tickets. 
- Arriba tienes un calendario de filtros para elegir "Mes pasado", "Ayer", etc.
- Haces clic en un ticket y a la derecha se abre el detalle gigante (Qué llevó, quién lo cobró, a qué hora).
- **Botón Imprimir:** Ícono de impresora. Reimprime el papelito.

### Devolver / Anular Venta (Botón Rojo)
- Si cobraste mal y el cliente quiere la plata:
1. En el detalle del ticket, pulsas el botón rojo "Devolver / Anular Venta".
2. Te mostrará qué llevó el cliente. Si fueron 5 cosas y devuelve 1 sola, ajusta la cantidad en esa pantallita a 1 y borra el resto.
3. Verás una casilla fundamental: **"Reingresar al Stock"**. 
   - Si la marcas, el producto volverá a sumar unidades a tu negocio (Ej: Lo devolvió porque se arrepintió).
   - Si la desmarcas, el producto se dará por perdido y no sumará stock (Ej: Se le rompió al salir y le diste otro o le devolviste la plata por queja).
4. Le das a Confirmar. La plata desaparecerá de las estadísticas de ventas de ese día.

---

## 10. Módulo: Reportes (Estadísticas y Excel)

- Al entrar, usa el filtro de fechas de la parte superior (Ej: "Este Mes").
- Verás tarjetas: **Ingreso Total**, **Cantidad de Transacciones**, **Ticket Promedio** y **Ganancia Real Estimada**.
- La ganancia real toma el precio de venta de cada ítem de ese mes y le resta tu precio de costo. 
- Tienes gráficos visuales abajo para entender a qué hora se vende más y qué productos rinden más plata.
- **Botones Superiores Exportar:** "PDF" genera un informe lindo para el dueño. "CSV / Excel" descarga un archivo crudo para que tu contador lo procese en la computadora.

---

## 11. Módulo: Usuarios (Control de Personal)

- Pulsa "+ Nuevo Usuario".
- Rellena Nombre Completo, Nombre de Usuario (sin espacios, ej: "marcos"), y una contraseña numérica fácil para ellos (ej: "1234").
- **Rol:** 
  - Si le pones **Empleado**, la pantalla de Kubo POS le ocultará todo el módulo de Configuración, no le mostrará precios de costo en el inventario, no le mostrará el módulo de ganancias y no lo dejará borrar tickets del historial. Solo podrá cobrar y ver su caja de turno.
  - Si le pones **Administrador**, será el Dios del sistema. No uses esto para empleados comunes.

---

## 12. Módulo: Configuración (AFIP, Copias de Seguridad, Correo)

La sala de máquinas de Kubo POS.

### Pestaña Empresa y Recibo
- Configura el "Nombre Kiosco" (lo que sale en grande arriba del ticket).
- Escribe tu dirección, teléfono y el "Mensaje de pie" (Ej: "Gracias por su visita").

### Pestaña Facturación (AFIP)
- Pones el CUIT, Razón Social, Condición (Monotributo/Inscripto) y el **Punto de Venta** (el número de caja que declaraste en la web de AFIP, suele ser "2" o "3").
- Debajo, subes los archivos `.crt` y `.key`. Estos archivos te los tiene que dar tu contador o generarlos desde la página de AFIP. Son la "firma digital" del negocio. Sin ellos, el botón "F4 Factura Electrónica" del POS dará error.

### Pestaña Sistema (Correo Electrónico SMTP)
- Sirve para enviarle tickets digitales por email a tus clientes (al cobrar, el sistema te preguntará si quieres enviarlo).
- Usas `smtp.gmail.com` y puerto `587`.
- Pones tu correo Gmail.
- **Contraseña:** NO es tu clave de Google. Debes entrar a los ajustes de seguridad de tu cuenta de Google en internet, ir a "Contraseñas de aplicaciones" y generar un código de 16 letras que debes pegar aquí.

### Copias de Seguridad (Backups)
- En la pestaña Sistema, busca el apartado Copias de Seguridad.
- **Botón Azul "Crear Copia Ahora":** Haces clic y el sistema empaqueta toda tu base de datos (productos, clientes, precios, deudas) en un archivito pequeño. Guárdalo en un Pendrive todas las semanas.
- **Botón "Restaurar":** Si la computadora se rompe o la formatean, instalas Kubo POS de nuevo, entras aquí, subes el archivo de tu pendrive, el sistema se reinicia, y ¡voilà! Tu kiosco vuelve a tener toda su información exactamente igual que el día que hiciste la copia.

---
**¡Felicitaciones!** Llegaste al final. Ahora posees un conocimiento profundo de Kubo POS. Si dominas todas estas herramientas y botones, llevarás el control de tu comercio a un nivel profesional que evitará pérdidas de dinero, tiempo y mercadería. ¡Éxitos con las ventas!
