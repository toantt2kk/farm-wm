import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Task",
  tableName: "tasks",
  columns: {
    id: {
      primary: true,
      type: "nvarchar",
      generated: "uuid",
    },
    port: {
      type: "int",
    },
    task_id: {
      type: "int",
      unique: true,
    },
    position: {
      type: "json",
      nullable: false,
    },
    resolution: {
      type: "json",
      nullable: false,
    },
    status: {
      type: "varchar",
      length: 10,
      default: "available", // not_available
    },
  },
});
