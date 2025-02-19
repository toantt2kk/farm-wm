import { DataSource } from "typeorm";
import ormConfig from "../../ormconfig.js"; // Import file cấu hình

const AppDataSource = new DataSource(ormConfig);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

export default AppDataSource;
