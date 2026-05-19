/**
 * Genera el HTML para el ticket de venta.
 * Soporta formato de 58mm y 80mm (responsive).
 */
const generateTicketHTML = (data) => {
  const {
    storeName,
    address,
    date,
    ticketId,
    items,
    total,
    footerMessage,
    logoUrl,
  } = data;

  // Filas de items
  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td class="qty">${item.quantity}</td>
      <td class="item">${item.name}</td>
      <td class="price">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const isA4 = data.format === "a4";

  const css = isA4
    ? `
        body {
          margin: 0;
          padding: 20mm;
          font-family: Arial, sans-serif;
          font-size: 12pt;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header .logo {
          max-width: 150px;
          height: auto;
          margin-bottom: 10px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .header h1 {
          font-size: 18pt;
          margin: 0;
          text-transform: uppercase;
        }
        .header p {
          margin: 4px 0;
          font-size: 10pt;
        }
        .meta {
          margin-bottom: 20px;
          font-size: 11pt;
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          text-align: left;
          border-bottom: 2px solid #000;
          font-size: 11pt;
          padding: 8px 4px;
        }
        td {
          vertical-align: top;
          padding: 8px 4px;
          border-bottom: 1px solid #eee;
        }
        .qty { width: 10%; font-weight: bold; }
        .item { width: 60%; }
        .price { width: 30%; text-align: right; }
        
        .totals {
          text-align: right;
          border-top: 2px solid #000;
          padding-top: 10px;
          margin-bottom: 20px;
        }
        .totals .row {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          margin-bottom: 5px;
        }
        .grand-total {
          font-size: 16pt;
          font-weight: bold;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          font-size: 10pt;
          margin-top: 40px;
          border-top: 1px solid #000;
          padding-top: 10px;
        }
      `
    : `
        body {
          margin: 0;
          padding: 10px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          width: 270px; /* Aprox 58mm - margins */
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 5px;
        }
        .header .logo {
          max-width: 60%;
          height: auto;
          margin-bottom: 5px;
          display: block;
          margin-left: auto;
          margin-right: auto;
          filter: grayscale(100%) contrast(150%); /* Optimizar para tÃ©rmicas */
        }
        .header h1 {
          font-size: 16px;
          margin: 0;
          text-transform: uppercase;
        }
        .header p {
          margin: 2px 0;
          font-size: 10px;
        }
        .meta {
          margin-bottom: 10px;
          font-size: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th {
          text-align: left;
          border-bottom: 1px solid #000;
          font-size: 10px;
        }
        td {
          vertical-align: top;
          padding: 2px 0;
        }
        .qty { width: 10%; font-weight: bold; }
        .item { width: 65%; font-size: 11px; }
        .price { width: 25%; text-align: right; }
        
        .totals {
          text-align: right;
          border-top: 1px dashed #000;
          padding-top: 5px;
          margin-bottom: 10px;
        }
        .totals .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 10px;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
      `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket #${ticketId}</title>
      <style>
        ${css}
      </style>
    </head>
    <body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ""}
        <h1>${storeName || "Kubo POS"}</h1>
        <p>${address || ""}</p>
      </div>
      
      <div class="meta">
        <p>Fecha: ${date}</p>
        <p>Ticket: #${ticketId || "---"}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cant</th>
            <th>Prod</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="row grand-total">
          <span>TOTAL:</span>
          <span>$${total?.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>${footerMessage || "Â¡Gracias por su compra!"}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera el HTML de una Factura tipo AFIP/ARCA (A4)
 * DiseÃ±o basado en el formato estÃ¡ndar de factura fiscal argentina.
 */
const generateFacturaHTML = (data) => {
  var storeName = data.storeName || "MI KIOSCO";
  var address = data.address || "";
  var cuit = data.cuit || "---";
  var invoiceLetter = data.invoiceType || "C";
  var salesPoint = data.salesPoint || 1;
  var voucherNumber = data.voucherNumber || 0;
  var date = data.date || "";
  var items = data.items || [];
  var total = parseFloat(data.total) || 0;
  var cae = data.cae || "";
  var caeFchVto = data.caeFchVto || "";
  var clientName = data.clientName || "Consumidor Final";
  var clientDni = data.clientDni || "-";
  var clientCondition = data.clientCondicionIva || "Consumidor Final";
  var issuerCondition = data.condicionIva || "Responsable Inscripto"; // Condición del EMISOR
  var ingresosBrutos = data.ingresosBrutos || cuit;
  var inicioActividades = data.inicioActividades || "01/01/2024";

  var pv = String(salesPoint).padStart(4, "0");
  var num = String(voucherNumber).padStart(8, "0");
  var comprobanteNum = pv + "-" + num;
  var codComprobante = invoiceLetter === "B" ? "06" : "11";

  // Fecha CAE
  var caeFchFormatted = "---";
  if (caeFchVto) {
    var s = String(caeFchVto);
    if (s.length === 8) {
      caeFchFormatted =
        s.slice(6, 8) + "/" + s.slice(4, 6) + "/" + s.slice(0, 4);
    } else {
      caeFchFormatted = s;
    }
  }

  // Items rows
  var itemsRows = "";
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var subtotal = (item.price * item.quantity).toFixed(2);
    itemsRows +=
      "<tr>" +
      '<td style="padding: 6px 10px; border-bottom: 1px solid #eee;">' +
      item.name +
      "</td>" +
      '<td style="padding: 6px 10px; border-bottom: 1px solid #eee; text-align: center;">' +
      item.quantity +
      "</td>" +
      '<td style="padding: 6px 10px; border-bottom: 1px solid #eee; text-align: right;">' +
      parseFloat(item.price).toFixed(2) +
      "</td>" +
      '<td style="padding: 6px 10px; border-bottom: 1px solid #eee; text-align: right;">' +
      subtotal +
      "</td>" +
      "</tr>";
  }

  var html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    "<title>Factura " +
    invoiceLetter +
    " " +
    comprobanteNum +
    "</title>" +
    "<style>" +
    "* { margin: 0; padding: 0; box-sizing: border-box; }" +
    "body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #000; width: 210mm; padding: 15mm 15mm; background: #fff; }" +
    "</style></head><body>" +
    // === HEADER PRINCIPAL ===
    '<div style="position: relative; border: 1.5px solid #000; display: flex; min-height: 130px;">' +
    // Lado izquierdo
    '<div style="flex: 1; padding: 15px 20px; border-right: 1.5px solid #000; text-align: center; display: flex; flex-direction: column; justify-content: center;">' +
    '<div style="font-size: 28px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px;">' +
    storeName +
    "</div>" +
    '<div style="font-size: 10px; color: #333; line-height: 1.8;">' +
    (address ? "<div>Domicilio: " + address + "</div>" : "") +
    "<div>" +
    issuerCondition +
    "</div>" +
    "</div></div>" +
    // Caja central con letra
    '<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #fff; border: 1.5px solid #000; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 10;">' +
    '<span style="font-size: 24px; font-weight: bold;">' +
    invoiceLetter +
    "</span>" +
    "</div>" +
    '<div style="position: absolute; top: 30px; left: 50%; transform: translateX(-50%); font-size: 7px; font-weight: bold; text-align: center; z-index: 10;">COD. ' +
    codComprobante +
    "</div>" +
    // Lado derecho
    '<div style="flex: 1; padding: 15px 20px; text-align: left; display: flex; flex-direction: column; justify-content: center;">' +
    '<div style="font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 8px;">FACTURA</div>' +
    '<div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">Nro. Comprobante: ' +
    comprobanteNum +
    "</div>" +
    '<div style="font-size: 10px; font-weight: bold; margin-bottom: 8px;">Fecha de Emisi&oacute;n: ' +
    date +
    "</div>" +
    '<div style="font-size: 9px; color: #333; line-height: 1.8;">' +
    "<div>C.U.I.T: " +
    cuit +
    "</div>" +
    "<div>Ing. Brutos: " +
    ingresosBrutos +
    "</div>" +
    "<div>Inicio de Actividades: " +
    inicioActividades +
    "</div>" +
    "</div></div>" +
    "</div>" +
    // === DATOS DEL CLIENTE ===
    '<div style="border: 1.5px solid #000; border-top: none; padding: 8px 15px; font-size: 9px; line-height: 1.8;">' +
    '<div><span style="font-weight: bold;">Apellido y Nombre / Raz&oacute;n Social:</span> &nbsp;&nbsp; ' +
    clientName +
    ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span style="font-weight: bold;">DNI / CUIT:</span> &nbsp;&nbsp; ' +
    clientDni +
    "</div>" +
    '<div><span style="font-weight: bold;">Condici&oacute;n IVA:</span> &nbsp;&nbsp; ' +
    clientCondition +
    "</div>" +
    "</div>" +
    // === TABLA DE ITEMS ===
    '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">' +
    "<thead>" +
    '<tr style="background: #e6e6e6; border: 1px solid #000;">' +
    '<th style="padding: 6px 10px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #ccc;">Producto</th>' +
    '<th style="padding: 6px 10px; text-align: center; font-size: 10px; font-weight: bold; border: 1px solid #ccc;">Cant.</th>' +
    '<th style="padding: 6px 10px; text-align: right; font-size: 10px; font-weight: bold; border: 1px solid #ccc;">P. Unitario</th>' +
    '<th style="padding: 6px 10px; text-align: right; font-size: 10px; font-weight: bold; border: 1px solid #ccc;">Subtotal</th>' +
    "</tr></thead><tbody>" +
    itemsRows +
    "</tbody></table>" +
    // Linea bajo la tabla
    '<div style="border-top: 1.5px solid #000; margin-top: 5px;"></div>' +
    // === TOTALES ===
    '<div style="display: flex; justify-content: flex-end; margin-top: 8px; font-size: 11px;">' +
    '<div style="width: 200px;">' +
    '<div style="display: flex; justify-content: space-between; padding: 4px 0; font-weight: bold;"><span>Subtotal:</span><span>$' +
    total.toFixed(2) +
    "</span></div>" +
    '<div style="display: flex; justify-content: space-between; padding: 6px 8px; font-weight: bold; font-size: 13px; background: #e6e6e6;"><span>Total:</span><span>$' +
    total.toFixed(2) +
    "</span></div>" +
    "</div></div>" +
    // === CAE FOOTER ===
    '<div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 8px; padding-top: 10px;">' +
    // Izquierda: Comprobante Autorizado
    "<div>" +
    (cae
      ? '<div style="font-weight: bold; font-style: italic;">Comprobante Autorizado</div>'
      : "") +
    "</div>" +
    // Derecha: CAE
    '<div style="text-align: right;">' +
    (cae
      ? '<div style="font-weight: bold;">CAE N&deg;: ' +
        cae +
        "</div>" +
        '<div style="font-weight: bold;">Fecha Vto. CAE: ' +
        caeFchFormatted +
        "</div>"
      : "<div></div>") +
    "</div>" +
    "</div>" +
    "</body></html>";

  return html;
};

/**
 * Genera el HTML de un Presupuesto (A4)
 * Documento no válido como factura
 */
const generateBudgetHTML = (data) => {
  const storeName = data.storeName || "MI KIOSCO";
  const address = data.address || "";
  const date = data.date || "";
  const validUntil = data.validUntil || "";
  const items = data.items || [];
  const total = parseFloat(data.total) || 0;
  const clientName = data.clientName || "Consumidor Final";
  const clientDni = data.clientDni || "-";
  const clientEmail = data.clientEmail || "";
  const clientPhone = data.clientPhone || "";
  const refNumber = data.refNumber || String(Date.now()).slice(-6);

  // Items rows
  let itemsRows = "";
  let subtotalSum = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = item.quantity || item.cantidad || 1;
    const price = parseFloat(item.price || item.sale_price) || 0;
    const lineTotal = price * qty;
    subtotalSum += lineTotal;
    const bgColor = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    itemsRows +=
      '<tr style="background: ' + bgColor + ';">' +
      '<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #334155;">' + qty + '</td>' +
      '<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #0f172a;">' + item.name + '</td>' +
      '<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; color: #475569;">$ ' + price.toFixed(2) + '</td>' +
      '<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; font-weight: 600; color: #0f172a;">$ ' + lineTotal.toFixed(2) + '</td>' +
      '</tr>';
  }

  var html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Presupuesto</title>' +
    '<style>' +
    '* { margin: 0; padding: 0; box-sizing: border-box; }' +
    "body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; color: #0f172a; width: 210mm; min-height: 297mm; padding: 18mm 18mm 20mm 18mm; background: #fff; }" +
    '@page { margin: 0; size: A4; }' +
    '</style></head><body>' +

    // === HEADER ===
    '<div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px;">' +
    '<div>' +
    '<div style="font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">' + storeName + '</div>' +
    (address ? '<div style="font-size: 10px; color: #64748b; margin-top: 4px;">' + address + '</div>' : '') +
    '</div>' +
    '<div style="text-align: right;">' +
    '<div style="font-size: 30px; font-weight: 800; color: #164e63; letter-spacing: 1px;">PRESUPUESTO</div>' +
    '<div style="font-size: 11px; color: #64748b; margin-top: 4px;">N.&deg; ' + refNumber + '</div>' +
    '</div></div>' +

    // Accent line
    '<div style="height: 3px; background: #164e63; border-radius: 2px;"></div>' +
    '<div style="height: 1px; background: #e2e8f0; margin-top: 2px;"></div>' +

    // === INFO BLOCKS ===
    '<div style="display: flex; justify-content: space-between; margin-top: 20px; gap: 30px;">' +
    // Client
    '<div style="flex: 1;">' +
    '<div style="font-size: 8px; font-weight: 700; color: #164e63; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">CLIENTE</div>' +
    '<div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">' + clientName + '</div>' +
    (clientDni && clientDni !== "-" ? '<div style="font-size: 10px; color: #64748b;">DNI/CUIT: ' + clientDni + '</div>' : '') +
    (clientEmail ? '<div style="font-size: 10px; color: #64748b;">' + clientEmail + '</div>' : '') +
    (clientPhone ? '<div style="font-size: 10px; color: #64748b;">Tel: ' + clientPhone + '</div>' : '') +
    '</div>' +
    // Details
    '<div style="flex: 1;">' +
    '<div style="font-size: 8px; font-weight: 700; color: #164e63; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">DETALLES</div>' +
    '<table style="font-size: 10px; border-collapse: collapse;">' +
    '<tr><td style="color: #64748b; padding: 2px 10px 2px 0;">Fecha de emisi&oacute;n:</td><td style="font-weight: 600; color: #0f172a;">' + date + '</td></tr>' +
    (validUntil ? '<tr><td style="color: #64748b; padding: 2px 10px 2px 0;">V&aacute;lido hasta:</td><td style="font-weight: 600; color: #0f172a;">' + validUntil + '</td></tr>' : '') +
    '</table></div></div>' +

    // === TABLE ===
    '<table style="width: 100%; border-collapse: collapse; margin-top: 24px;">' +
    '<thead><tr style="background: #164e63;">' +
    '<th style="padding: 10px 14px; text-align: center; font-size: 9px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; width: 60px;">Cant.</th>' +
    '<th style="padding: 10px 14px; text-align: left; font-size: 9px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Descripci&oacute;n</th>' +
    '<th style="padding: 10px 14px; text-align: right; font-size: 9px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; width: 110px;">P. Unitario</th>' +
    '<th style="padding: 10px 14px; text-align: right; font-size: 9px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; width: 110px;">Importe</th>' +
    '</tr></thead><tbody>' +
    itemsRows +
    '</tbody></table>' +

    // === TOTALS ===
    '<div style="display: flex; justify-content: flex-end; margin-top: 20px;">' +
    '<div style="width: 260px;">' +
    '<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; color: #64748b;">' +
    '<span>Subtotal:</span>' +
    '<span style="color: #0f172a;">$ ' + subtotalSum.toFixed(2) + '</span>' +
    '</div>' +
    '<div style="height: 1px; background: #e2e8f0;"></div>' +
    '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; margin-top: 6px; background: #164e63; border-radius: 6px; color: #fff;">' +
    '<span style="font-size: 12px; font-weight: 700;">TOTAL</span>' +
    '<span style="font-size: 18px; font-weight: 800;">$ ' + total.toFixed(2) + '</span>' +
    '</div></div></div>' +

    // === OBSERVATIONS ===
    '<div style="margin-top: 36px;">' +
    '<div style="font-size: 8px; font-weight: 700; color: #164e63; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Observaciones</div>' +
    '<div style="font-size: 9px; color: #94a3b8; line-height: 1.6;">' +
    'Los precios expresados son en pesos argentinos e incluyen IVA.<br>' +
    (validUntil ? 'Este presupuesto tiene validez hasta el ' + validUntil + '.' : 'Este presupuesto es estimativo y no posee validez fiscal.') +
    '</div></div>' +

    // === FOOTER ===
    '<div style="position: fixed; bottom: 18mm; left: 18mm; right: 18mm;">' +
    '<div style="height: 1px; background: #e2e8f0; margin-bottom: 10px;"></div>' +
    '<div style="display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8;">' +
    '<span>Generado por ' + storeName + '</span>' +
    '<span>Presupuesto N.&deg; ' + refNumber + ' | ' + date + '</span>' +
    '</div></div>' +

    '</body></html>';

  return html;
};

module.exports = { generateTicketHTML, generateFacturaHTML, generateBudgetHTML };

