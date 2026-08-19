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

    // MODO SIMULACIÓN / SANDBOX INTERNO
    // Si no hay certificados configurados o son "test", simulamos respuesta exitosa
    if (
      !config.certPath ||
      !config.keyPath ||
      config.certPath === "test" ||
      config.keyPath === "test"
    ) {
      console.log(
        "[AFIP] MODO SIMULACIÓN ACTIVADO (Sin certificados reales o prueba)",
      );

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const pv = parseInt(config.salesPoint) || 1;
      let tipo = 6; // B
      if (config.condition === "Monotributo" || config.condition === "Exento")
        tipo = 11; // C

      // Generar número aleatorio para simular consecutivo
      // En producción real, esto consultaría el último comprobante, aquí inventamos
      const fakeNum = Math.floor(Date.now() / 1000) % 1000000;

      // Fecha Vto CAE futura (+10 días)
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const vto = future.toISOString().slice(0, 10).replace(/-/g, "");

      return {
        success: true,
        cae: "74365823641284", // CAE Simulado Random
        caeFchVto: vto,
        voucherNumber: fakeNum,
        voucherType: tipo,
        simulation: true,
      };
    }

    const afip = new Afip({
      CUIT: parseInt(config.cuit),
      cert: config.certPath,
      key: config.keyPath,
      production: true, // Asumimos producción si el usuario configuró esto
    });

    // Datos básicos
    const puntoVenta = parseInt(config.salesPoint);
    let tipoComprobante = 6; // Default: Factura B

    // Determinar tipo de comprobante según condición del emisor
    // Monotributo -> Factura C (11)
    // Responsable Inscripto -> Factura B (6) (o A si el cliente es RI, por ahora B)
    if (config.condition === "Monotributo" || config.condition === "Exento") {
      tipoComprobante = 11; // Factura C
    } else if (config.condition === "Responsable Inscripto") {
      // TODO: Chequear condición del cliente. Por ahora asumimos CF -> Factura B
      tipoComprobante = 6; // Factura B
    }

    console.log(
      `[AFIP] Condición: ${config.condition} -> Tipo Comprobante: ${tipoComprobante}`,
    );

    // 1. Obtener último número de comprobante
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      puntoVenta,
      tipoComprobante,
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
    let payload = {};

    if (tipoComprobante === 11) {
      // === FACTURA C (Monotributo) ===
      // No discrimina IVA. ImpTotal = ImpNeto (o se puede usar ImpTotConc para no gravado, pero Monotributo suele ponerlo en Subtotal)
      // Para Monotributo en WSFE: ImpNeto tiene el total? O ImpTotConc?
      // Usualmente: ImpTotal = $100 -> ImpSubtotal (Neto) = $100 ? No, ImpNeto y OpEx.
      // Simplificación para Monotributo: Todo al Neto (o TotConc si no corresponde), IVA 0.
      // AFIP dice que para CbteTipo 11, ImpNeto + ImpTotConc + ImpOpEx + ImpTrib = ImpTotal.
      // Usaremos ImpSubtotal en ImpNeto (o veremos si falla sin alicuotas).
      // Update: Factura C NO lleva array de IVA.

      payload = {
        CantReg: 1,
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante,
        Concepto: 1, // Productos
        DocTipo: data.clientDoc ? 80 : 99,
        DocNro: data.clientDoc || 0,
        CbteDesde: nextVoucher,
        CbteHasta: nextVoucher,
        CbteFch: parseInt(date),
        ImpTotal: total,
        ImpTotConc: 0,
        ImpNeto: total, // Todo al neto en Factura C
        ImpOpEx: 0,
        ImpIVA: 0, // Sin IVA
        ImpTrib: 0,
        MonId: "PES",
        MonCotiz: 1,
        // No Iva array for Factura C
      };
    } else {
      // === FACTURA B (Responsable Inscripto a CF) ===
      // Discrimina IVA internamente (21%)
      const impNeto = parseFloat((total / 1.21).toFixed(2));
      const impIVA = parseFloat((total - impNeto).toFixed(2));
      const impIVAAdjusted = parseFloat((total - impNeto).toFixed(2));

      payload = {
        CantReg: 1,
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante,
        Concepto: 1, // Productos
        DocTipo: data.clientDoc ? 80 : 99,
        DocNro: data.clientDoc || 0,
        CbteDesde: nextVoucher,
        CbteHasta: nextVoucher,
        CbteFch: parseInt(date),
        ImpTotal: total,
        ImpTotConc: 0,
        ImpNeto: impNeto,
        ImpOpEx: 0,
        ImpIVA: impIVAAdjusted,
        ImpTrib: 0,
        MonId: "PES",
        MonCotiz: 1,
        Iva: [
          {
            Id: 5, // 5 = 21%
            BaseImp: impNeto,
            Importe: impIVAAdjusted,
          },
        ],
      };
    }

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
