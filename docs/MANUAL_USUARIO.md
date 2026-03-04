# manual_usuario.md

# 📘 Manual de Usuario - Kubo POS

Bienvenido al sistema **Kubo POS**, su solución integral para la gestión de puntos de venta. Este manual le guiará paso a paso en el uso y configuración del sistema para sacar el máximo provecho de sus funcionalidades.

---

## 🚀 1. Instalación y Primeros Pasos

### 1.1. Requisitos

- Computadora con Windows 10 o superior (recomendado).
- Conexión a Internet (opcional, solo para facturación electrónica y envío de mails).

### 1.2. Instalación

1.  Ejecute el archivo instalador `Kubo POS Setup 1.0.0.exe`.
2.  Siga las instrucciones en pantalla (Siguiente -> Instalar).
3.  Al finalizar, el sistema se abrirá automáticamente.

### 1.3. Ingreso al Sistema (Login)

- **Usuario por defecto:** `admin`
- **Contraseña por defecto:** `admin123`
- _Nota: Se recomienda cambiar esta contraseña o crear un nuevo usuario personal desde la sección de Usuarios._

---

## 🖥️ 2. Módulos del Sistema

### 🏠 2.1. Panel Principal (Dashboard)

Es la pantalla de inicio donde verá un resumen de su negocio en tiempo real.

- **Tarjetas de Resumen:** Ventas del día, Ganancia Neta, Stock Bajo, Productos por Vencer.
- **Gráficos:** Evolución de ventas semanales y productos más vendidos.
- **Accesos Rápidos:** Botones para ir directamente a vender, ver productos, clientes o stock.

### 🛒 2.2. Punto de Venta (POS)

Aquí es donde realizará todas las ventas.

1.  **Buscar Producto:** Puede escanear el código de barras o escribir el nombre en el buscador.
2.  **Item Libre:** Si necesita cobrar algo que no está en el catálogo (ej. Fotocopias, Trámites), presione el botón "+ Item Libre", ingrese un nombre temporal y su precio.
3.  **Agregar al Carrito:** Haga clic en el producto o presione `Enter` si usó el escáner.
4.  **Modificar Cantidad:** Use los botones `+` y `-` en la lista de la derecha.
5.  **Seleccionar Cliente (Opcional):** Si desea registrar la venta a un cliente (para Cuentas Corrientes/Fiado), selecciónelo arriba a la derecha.
6.  **Modo Factura o Ticket:** Puede alternar rápidamente entre emitir Factura Electrónica (F4) o un comprobante interno "Ticket X" (F11).
7.  **Formato de Impresión:** Desde la tarjeta de Totales, puede elegir imprimir en su ticketera convencional (58mm) o en formato estándar grande (A4).
8.  **Cobrar:** Presione el botón verde "Cobrar" (o tecla `F9`).
9.  **Método de Pago:** Seleccione Efectivo, Tarjeta, Mercado Pago, Mixto o **"Fiado / Cta. Cte."** (esta última opción solo estará disponible si seleccionó al cliente en el paso 5). Si es Efectivo, ingrese con cuánto abona para calcular el vuelto.

### 📦 2.3. Productos e Inventario

Gestione todo su catálogo.

- **Nuevo Producto:** Botón "+ Nuevo Producto". Complete nombre, código de barras, precios y stock.
- **Control de Stock:**
  - Puede sumar stock manualmente.
  - **Alerta de Stock Bajo:** Los productos aparecerán en rojo cuando queden pocas unidades.
  - **Vencimientos:** Ingrese la fecha de vencimiento para que el sistema le avise antes de que expiren.

### 👥 2.4. Clientes y Cuentas Corrientes

Lleve el registro de sus clientes habituales y permítales acumular saldo deudor de manera sencilla.

- **Nuevo Cliente:** Registre su nombre, DNI, teléfono y correo electrónico.
- **Fiado / Cuenta Corriente:** Para fiarle a un cliente, primero selecciónelo durante la venta (paso 5 del POS), luego presione "Cobrar" y elija la opción **"Fiado / Cta. Cte."**. El monto total de la venta quedará registrado en su ficha automáticamente.
- **Registrar Pago:** Cuando el cliente venga a cancelar su deuda, vaya aquí a la lista de Clientes, búsquelo, presione el botón "Detalles" y use el botón "Registrar Pago" para cobrar parcial o totalmente la suma adeudada.

### 📊 2.5. Reportes y Estadísticas

Analice el rendimiento de su negocio.

- **Historial de Ventas:** Vea todas las operaciones pasadas. Puede reimprimir tickets o anular ventas.
- **Caja Diaria:** Resumen de ingresos y egresos del turno actual.
- **Reportes Avanzados:** Filtre por fecha para saber cuánto ganó en la semana o el mes.

---

## ⚙️ 3. Configuración del Sistema

En esta sección podrá personalizar el comportamiento de Kubo POS.

### 🏢 3.1. Datos del Negocio

- Cargue el Nombre de su Kiosco y la Dirección. Estos datos saldrán impresos en el ticket.

### 🧾 3.2. Facturación Electrónica (ARCA/AFIP) y Tickets

- **Condición frente al IVA:** Configure de manera muy importante si usted es Monotributista, Responsable Inscripto o Exento. El sistema decidirá de forma automática y transparente si debe emitir Facturas "A", "B" o "C" para cumplir correctamente con los requerimientos legales según cada venta.
- **Datos Fiscales:** Complete su CUIT, Razón Social, Ingresos Brutos y Punto de Venta para que figuren en las cabeceras de sus comprobantes.
- **Certificados Digitales:** Ingrese la ruta en su computadora de los archivos `.crt` y `.key` emitidos por ARCA, indispensables para generar los códigos CAE y darle validez legal a las facturas.
- **Logo:** Suba la imagen de su logo comercial para estampar en los tickets de 58mm y documentos A4.

### ✉️ 3.3. Configuración de Email (Envío de Comprobantes)

Para que el sistema envíe comprobantes en PDF (Facturas C, Tickets, etc.) directamente al email de sus clientes. El PDF adjuntado tendrá el mismo formato estructurado y calidad gráfica que la versión impresa en A4 (incluyendo su CUIT y datos fiscales).

**Recomendado: Usar GMAIL**
Por seguridad, Google no permite usar su contraseña normal. Debe generar una **"Contraseña de Aplicación"**.

**Pasos para configurar Gmail:**

1.  Vaya a su Cuenta de Google > Seguridad > Verificación en 2 pasos (debe estar activada).
2.  Busque la opción **"Contraseñas de aplicaciones"**.
3.  Cree una nueva (nombre: `Kubo POS`). Google le dará un código de 16 letras.
4.  En Kubo POS, vaya a **Configuración > Sistema > Email**.
5.  Complete los datos:
    - **Host SMTP:** `smtp.gmail.com`
    - **Puerto:** `587`
    - **Usuario:** `su_email@gmail.com`
    - **Contraseña:** `(pegue el código de 16 letras aquí)`
6.  Guarde los cambios.

### 👥 3.4. Gestión de Usuarios

- Cree cuentas para sus empleados.
- Asigne roles: `Administrador` (acceso total) o `Vendedor` (restringido: no puede ver costos ni borrar productos).

---

## 💾 4. COPIAS DE SEGURIDAD (¡Muy Importante!)

Para evitar perder información ante cualquier problema con su computadora, el sistema cuenta con una función de respaldo integrada.

### 4.1. Cómo Crear una Copia (Recomendado: Semanalmente)

1.  Vaya al menú **Configuración**.
2.  Entre en la pestaña **Sistema**.
3.  Busque la sección **"Copias de Seguridad"**.
4.  Haga clic en el botón azul **"Crear Copia de Seguridad Ahora"**.
    - _Aparecerá un mensaje de éxito confirmando que sus datos están a salvo._

### 4.2. Cómo Restaurar una Copia

Si cometió un error grave (ej. borró productos por accidente) y quiere "volver atrás en el tiempo":

1.  Vaya a **Configuración > Sistema > Historial de Copias**.
2.  Busque la copia por fecha y hora.
3.  Haga clic en **"Restaurar"**.
4.  Confirme la advertencia. **El sistema se reiniciará automáticamente** y volverá al estado exacto de esa fecha.

### 4.3. Respaldo Externo (Anti-Robo/Rotura PC)

Las copias automáticas se guardan en su disco duro. Si su computadora se rompe o se la roban, **esas copias también se pierden**.
**Recomendación de Seguridad:**

1.  Cada cierto tiempo (ej. fin de mes), vaya a la misma sección **Sistema**.
2.  Use el botón **"Exportar a Excel"** o busque los archivos de respaldo manualmente.
3.  Envíese esos archivos por **Email** o guárdelos en un **Pendrive / Google Drive**.

---

---

## 📱 5. Configuración del Escáner Móvil (Celular)

Para usar su teléfono como lector de código de barras, **es fundamental** configurar correctamente la red.

### 5.1. Requisito Básico: WiFi

Tanto la computadora donde está instalado el sistema como el celular **deben estar conectados a la misma red WiFi**. Si la PC usa cable de red, debe estar conectada al mismo módem que emite el WiFi.

### 5.2. Alerta de Firewall de Windows (¡Muy Importante!) 🛡️

La primera vez que intente usar el escáner, Windows mostrará una ventana preguntando si permite el acceso.

**DEBE MARCAR AMBAS CASILLAS:**

- [x] Redes privadas (como la de casa o el trabajo)
- [x] Redes públicas (aeropuertos, cafeterías - _aunque sea su casa, a veces Windows la detecta así_)

Luego haga clic en **"Permitir acceso"**.

#### ¿Qué hacer si le dio "Cancelar" por error?

Si no le funciona, es probable que el Firewall esté bloqueando la conexión. Para arreglarlo:

1.  En Windows, busque **"Permitir que una aplicación acceda a través de Firewall de Windows"**.
2.  Haga clic en el botón **"Cambiar la configuración"** (arriba a la derecha).
3.  Busque en la lista **"Kubo POS"** (o `node.exe` / `Electron` si está en prueba).
4.  Asegúrese de que tenga **las dos casillas marcadas** (Privada y Pública) a la derecha.
5.  Acepte y reinicie el sistema.

---

## ❓ 6. Solución de Problemas Frecuentes

**P: El sistema no imprime.**
R: Verifique que la impresora esté encendida, tenga papel y esté seleccionada correctamente en _Configuración > Facturación_.

**P: Olvidé mi contraseña.**
R: Solicite al usuario Administrador que restablezca su clave desde _Gestión de Usuarios_. Si el admin perdió su clave, contacte a soporte técnico.

**P: No veo los productos nuevos en el buscador.**
R: Intente borrar el texto y escribir de nuevo. Si persiste, cierre y vuelva a abrir el sistema.

---

**Soporte Técnico:**
Ante cualquier duda no cubierta en este manual, contacte a su proveedor de software.
