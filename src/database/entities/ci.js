import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "CI",
  tableName: "cis",
  columns: {
    id: {
      primary: true,
      type: "nvarchar",
      generated: "uuid",
    },
    cc_number: {
      type: "varchar",
      length: 16,
      unique: true,
    },
    month: {
      type: "varchar",
    },
    year: {
      type: "varchar",
    },
    cvv: {
      type: "varchar",
      length: 4,
    },
    status: {
      type: "varchar",
      length: 10,
      default: "unused",
    },
  },
});
