import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "item-order",
  tableName: "items-orders",
  columns: {
    id: {
      primary: true,
      type: "nvarchar",
      generated: "uuid",
    },
    item_id: {
      type: "varchar",
      unique: true,
    },
    status: {
      type: "varchar",
      length: 10,
      default: "in_stock", // out_of_stock
    },
  },
});
