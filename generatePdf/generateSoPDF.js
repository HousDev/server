const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

async function generateSoPdf(data) {
  /* ======================
     1️⃣ Read Logo
  ====================== */

  const logoPath = path.join(__dirname, "Logo.png");
  const logoBase64 = fs.readFileSync(logoPath, "base64");

  const templateData = {
    ...data,
    logoBase64: `data:image/webp;base64,${logoBase64}`,
  };

  /* ======================
     2️⃣ Load EJS Template
  ====================== */

  const templatePath = path.join(__dirname, "generateSO.ejs");
  const html = await ejs.renderFile(templatePath, templateData);

  /* ======================
     3️⃣ Detect OS
  ====================== */

  const isLinux = process.platform === "linux";

  const executablePath = isLinux
    ? "/usr/bin/chromium-browser"
    : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  /* ======================
     4️⃣ Launch Puppeteer
  ====================== */

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  /* ======================
     5️⃣ Date Formatting
  ====================== */

  const now = new Date();
  const generatedOn = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  /* ======================
     6️⃣ Generate PDF
  ====================== */

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "5mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
    displayHeaderFooter: true,
    headerTemplate: `<div></div>`,
    footerTemplate: `
      <div style="width:100%; font-size:10px; color:#666;
                  display:flex; justify-content:space-between;
                  padding:0 15mm;">
        <span>Generated On: ${generatedOn}</span>
        <span>
          Page <span class="pageNumber"></span> of
          <span class="totalPages"></span>
        </span>
      </div>
    `,
  });

  await browser.close();
  return pdf;
}

module.exports = generateSoPdf;
