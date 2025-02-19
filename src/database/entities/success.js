import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Success",
  tableName: "successes",
  columns: {
    id: {
      primary: true,
      type: "nvarchar",
      generated: "uuid",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    price: {
      type: "int",
    },
    datetime: {
      type: "text",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
});
