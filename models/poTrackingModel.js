const { query } = require("../config/db");

async function findByIdAndPO_ID(item_id, po_id) {
  const data = await query(
    "SELECT * FROM po_material_tracking WHERE item_id = ? AND po_id=?",
    [item_id, po_id]
  );
  return data[0];
}
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
    `UPDATE po_material_tracking 
   SET quantity_received = ?, quantity_pending = ?, status = ?
   WHERE id = ?`,
    [quantity_received, quantity_pending, status, id]
  );
  return findById(id);
};

module.exports = { updateMaterialQuantity, findById, findByIdAndPO_ID };
