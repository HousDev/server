const express = require("express");
const generatePoPdf = require("./generatePoPDF.js");
const { query } = require("../config/db.js");
const { findByIdVendorsTC } = require("../models/termsConditionsModel.js");
const e = require("express");

const pdfRouter = express.Router();

pdfRouter.get("/po/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /* =======================
        1️⃣ Fetch PO Header
      ======================= */
    const [poRows] = await query(
      `
        SELECT
          po.*,

          v.name AS vendor_name,
          v.gst_number AS vendor_gst,
          v.office_street,
          v.office_city,
          v.office_pincode,

          p.name AS project_name,
          p.location AS project_location,

          pt.name AS po_type_name

        FROM purchase_orders po
        LEFT JOIN vendors v ON v.id = po.vendor_id
        LEFT JOIN projects p ON p.id = po.project_id
        LEFT JOIN po_types pt ON pt.id = po.po_type_id
        WHERE po.id = ?
        `,
      [id]
    );

    if (!poRows) {
      return res.status(404).json({ message: "PO not found" });
    }

    const po = poRows;

    /* =======================
        2️⃣ Fetch PO Items
      ======================= */

    const itemRows = await query(
      `
        SELECT
          item_name,
          quantity,
          unit,
          rate
        FROM purchase_order_items
        WHERE po_id = ?
        `,
      [id]
    );

    const selected_terms_idsData = JSON.parse(po.selected_terms_ids);
    const terms_and_conditionsData = JSON.parse(po.terms_and_conditions) || [];

    const termsData = await findByIdVendorsTC(po.vendor_id);

    const terms =
      termsData.filter((term) => selected_terms_idsData.includes(term.id)) ||
      [];

    terms_and_conditionsData.forEach((element) => {
      terms.push(element);
    });

    const formattedTerms = Object.values(
      terms.reduce((acc, item) => {
        const categoryKey = item.category.toLowerCase();

        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            title: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
            points: [],
          };
        }

        acc[categoryKey].points.push(item.content);

        return acc;
      }, {})
    );

    /* =======================
        4️⃣ Build FINAL PO DATA
      ======================= */
    const poData = {
      id: po.po_number,

      logoUrl: "https://dummyimage.com/160x60/000/fff.png&text=NoteVault",

      poNumber: po.po_number,
      date: new Date(po.po_date).toLocaleDateString(),

      subject: "Purchase Order",
      description: po.notes || "",

      company: {
        name: "Nayash Group",
        address: `First Floor,Tamara Uprise,
  Pune, 411017`,
        gst: "27ABCDE1234F1Z5",
      },

      vendor: {
        name: po.vendor_name,
        address: `${po.office_street}, ${po.office_city} - ${po.office_pincode}`,
        gst: po.vendor_gst,
      },

      items: itemRows.map((item) => ({
        name: item.item_name,
        qty: item.quantity,
        unit: item.unit,
        rate: item.rate,
      })),

      totals: {
        subtotal: po.subtotal,
        discount: po.discount_amount,
        gst: po.total_gst_amount,
        grandTotal: po.grand_total,
      },

      terms: formattedTerms,
    };

    /* =======================
        5️⃣ Generate PDF
      ======================= */
    const pdf = await generatePoPdf(poData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${po.po_number}.pdf`,
    });

    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate PO PDF" });
  }
});

module.exports = pdfRouter;
