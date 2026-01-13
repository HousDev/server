const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

async function generatePoPdf(data) {
  // 🔥 READ LOGO
  const logoPath = path.join(__dirname, "Logo.png");
  const logoBase64 = fs.readFileSync(logoPath, "base64");

  // 🔥 ATTACH LOGO TO TEMPLATE DATA
  const templateData = {
    ...data,
    logoBase64: `data:image/webp;base64,${logoBase64}`,
  };

  const templatePath = path.join(__dirname, "generatePO.ejs");
  const html = await ejs.renderFile(templatePath, templateData);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const now = new Date();
  const generatedOn = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

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

module.exports = generatePoPdf;
