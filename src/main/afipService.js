const Afip = require("@afipsdk/afip.js");

/**
 * Servicio para interactuar con AFIP (ARCA)
 * @param {Object} config - Configuración { cuit, certPath, keyPath, salesPoint, production }
 * @param {Object} data - Datos de la venta { total, clientDoc, items }
 */
async function createInvoice(config, data) {
  try {
    console.log("[AFIP] Iniciando servicio con config:", {
      ...config,
      keyPath: "HIDDEN",
    });

    const afip = new Afip({
      CUIT: parseInt(config.cuit),
      cert: config.certPath,
      key: config.keyPath,
      production: true, // Asumimos producción si el usuario configuró esto
    });

    // Datos básicos
    const puntoVenta = parseInt(config.salesPoint);
    const tipoComprobante = 6; // Factura B (Para Consumidor Final / Monotributo a CF es 11)
    // TODO: Parametrizar si es Factura C (11) o B (6)
    // Por defecto usaremos 6 (B) asumiendo Responsable Inscripto -> Consumidor Final

    // 1. Obtener último número de comprobante
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      puntoVenta,
      tipoComprobante
    );
    const nextVoucher = lastVoucher + 1;

    console.log("[AFIP] Próximo comprobante:", nextVoucher);

    // 2. Preparar payload
    // Fecha formato YYYYMMDD
    const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");

    const total = parseFloat(data.total.toFixed(2));

    // Cálculos para Factura B (RI a CF/Exento/Monotributo)
    // El importe total INCLUYE IVA.
    // Debemos enviar ImpNeto + ImpIVA = Total.
    // Asumiendo IVA 21%.
    const impNeto = parseFloat((total / 1.21).toFixed(2));
    const impIVA = parseFloat((total - impNeto).toFixed(2));

    // Ajuste por redondeo
    // A veces (Neto + IVA) != Total por un centavo. Ajustamos el IVA para que cuadre exactamente con el Total.
    const impIVAAdjusted = parseFloat((total - impNeto).toFixed(2));

    const payload = {
      CantReg: 1, // Cantidad de comprobantes a registrar
      PtoVta: puntoVenta,
      CbteTipo: tipoComprobante,
      Concepto: 1, // 1 = Productos, 2 = Servicios, 3 = Productos y Servicios
      DocTipo: data.clientDoc ? 80 : 99, // 99 = Consumidor Final, 80 = CUIT
      DocNro: data.clientDoc || 0,
      CbteDesde: nextVoucher,
      CbteHasta: nextVoucher,
      CbteFch: parseInt(date),
      ImpTotal: total,
      ImpTotConc: 0, // Importe neto no gravado
      ImpNeto: impNeto,
      ImpOpEx: 0, // Importe exento
      ImpIVA: impIVAAdjusted,
      ImpTrib: 0, // Importe tributos
      MonId: "PES", // Moneda
      MonCotiz: 1, // Cotización
      Iva: [
        {
          Id: 5, // 5 = 21%
          BaseImp: impNeto,
          Importe: impIVAAdjusted,
        },
      ],
    };

    console.log("[AFIP] Enviando payload:", payload);

    // 3. Crear Comprobante
    const res = await afip.ElectronicBilling.createVoucher(payload);

    console.log("[AFIP] Respuesta exitosa:", res);

    return {
      success: true,
      cae: res.CAE,
      caeFchVto: res.CAEFchVto,
      voucherNumber: nextVoucher,
      voucherType: tipoComprobante,
    };
  } catch (error) {
    console.error("[AFIP] Error:", error);
    return {
      success: false,
      message: error.message || "Error desconocido al contactar ARCA",
    };
  }
}

module.exports = { createInvoice };
