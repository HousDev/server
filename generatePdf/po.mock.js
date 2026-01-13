const purchaseOrders = [
  {
    id: "PO-1001",
    logoUrl: "https://dummyimage.com/160x60/000/fff.png&text=NoteVault",
    poNumber: "PO-1001",
    date: "05-01-2026",

    subject: "Purchase Order for Construction Materials",
    description:
      "This purchase order is issued for the supply of construction materials as per agreed specifications, pricing, and delivery terms mentioned below.",

    company: {
      name: "NoteVault Constructions Pvt Ltd",
      address: "Rahatani Phata, Kale Wadi, Pimpri-Chinchwad, Pune - 411017",
      gst: "27ABCDE1234F1Z5",
    },

    vendor: {
      name: "Rahul Traders",
      address: "MIDC Bhosari, Pune - 411026",
      gst: "27PQRSX5678K9Z2",
    },

    items: [
      { name: "Cement (UltraTech)", qty: 100, rate: 420 },
      { name: "TMT Steel Bars 12mm", qty: 50, rate: 6200 },
      { name: "River Sand", qty: 10, rate: 1800 },
      { name: "Crushed Stone Aggregate", qty: 15, rate: 1600 },
    ],

    totals: {
      subtotal: 100 * 420 + 50 * 6200 + 10 * 1800 + 15 * 1600,
      discount: 5000,
      gst: 0.18 * (100 * 420 + 50 * 6200 + 10 * 1800 + 15 * 1600 - 5000),
      grandTotal: (100 * 420 + 50 * 6200 + 10 * 1800 + 15 * 1600 - 5000) * 1.18,
    },

    terms: [
      {
        title: "Payment",
        points: [
          "Payment shall be made within 30 days from the date of invoice.",
          "Invoices must mention PO number for processing.",
          "Late payment may attract penalties as per company policy.",
        ],
      },
      {
        title: "Delivery",
        points: [
          "Materials must be delivered within 7 working days.",
          "Delivery location: Pune construction site.",
          "Vendor is responsible for safe transportation.",
        ],
      },
      {
        title: "Quality",
        points: [
          "All materials must meet IS standards.",
          "Company reserves the right to reject substandard materials.",
        ],
      },
    ],
  },

  {
    id: "PO-1002",
    logoUrl: "https://dummyimage.com/160x60/004aad/ffffff.png&text=NoteVault",
    poNumber: "PO-1002",
    date: "10-01-2026",

    subject: "Purchase Order for Electrical & Plumbing Materials",
    description:
      "This purchase order covers the procurement of electrical and plumbing materials required for the residential project as per specifications below.",

    company: {
      name: "NoteVault Infrastructure Pvt Ltd",
      address: "Baner Road, Pune - 411045",
      gst: "27LMNOP9876Q1Z9",
    },

    vendor: {
      name: "Shree Electricals & Sanitary",
      address: "Wakad, Pune - 411057",
      gst: "27WXYZA4321R8Z6",
    },

    items: [
      { name: "PVC Pipes 4 inch", qty: 200, rate: 180 },
      { name: "Electrical Copper Wire (90m)", qty: 30, rate: 2200 },
      { name: "Modular Switch Boards", qty: 50, rate: 950 },
      { name: "Water Taps (SS)", qty: 40, rate: 850 },
    ],

    totals: {
      subtotal: 200 * 180 + 30 * 2200 + 50 * 950 + 40 * 850,
      discount: 3000,
      gst: 0.18 * (200 * 180 + 30 * 2200 + 50 * 950 + 40 * 850 - 3000),
      grandTotal: (200 * 180 + 30 * 2200 + 50 * 950 + 40 * 850 - 3000) * 1.18,
    },

    terms: [
      {
        title: "Payment",
        points: [
          "50% advance payment required.",
          "Remaining balance payable within 15 days after delivery.",
        ],
      },
      {
        title: "Delivery",
        points: [
          "Delivery must be completed within 10 working days.",
          "Partial delivery allowed with prior approval.",
        ],
      },
      {
        title: "Warranty",
        points: [
          "All electrical items must carry a minimum 1-year warranty.",
          "Defective items to be replaced at no extra cost.",
        ],
      },
    ],
  },
];

module.exports = purchaseOrders;
