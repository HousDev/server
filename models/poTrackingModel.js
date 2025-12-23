const { query } = require("../config/db");

async function findById(id) {
  const data = await query("SELECT * FROM po_material_tracking WHERE id = ?", [
    id,
  ]);
  return data[0];
}

const updateMaterialQuantity = async (
  id,
  quantity_received,
  quantity_pending,
  status
) => {
  await query(
    "UPDATE po_material_tracking SET quantity_received = ?, quantity_pending = ?, status = ? WHERE id = ?",
    [quantity_received, quantity_pending, status, id]
  );
  return findById(id);
};

module.exports = { updateMaterialQuantity, findById };
