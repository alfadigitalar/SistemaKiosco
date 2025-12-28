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
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket #${ticketId}</title>
      <style>
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
          filter: grayscale(100%) contrast(150%); /* Optimizar para térmicas */
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
      </style>
    </head>
    <body>
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ""}
        <h1>${storeName || "Novy POS"}</h1>
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
        <p>${footerMessage || "¡Gracias por su compra!"}</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateTicketHTML };
