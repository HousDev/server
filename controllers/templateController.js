const path = require("path");

/**
 * Download Project Import Excel Template
 */
const downloadProjectTemplate = (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../dataTemplate/project_import_template.xlsx",
    );

    res.download(filePath, "project_import_template.xlsx", (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to download template" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * Download Project Import Excel Template
 */
const downloadItemsExcelTemplate = (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../dataTemplate/itemsExcelSample.xlsx",
    );

    res.download(filePath, "itemsExcelSample.xlsx", (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to download template" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/**
 * Download Project Import Excel Template
 */
const downloadServicesExcelTemplate = (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../dataTemplate/serviceExcelSample.xlsx",
    );

    res.download(filePath, "serviceExcelSample.xlsx", (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to download template" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  downloadProjectTemplate,
  downloadItemsExcelTemplate,
  downloadServicesExcelTemplate,
};
