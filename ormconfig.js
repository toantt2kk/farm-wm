export default {
  type: "better-sqlite3", // Hoặc "postgres", "mysql", "mariadb", "mongodb", etc.
  database: "data/farm.sqlite",
  synchronize: true, // Tự động cập nhật database khi có thay đổi
  logging: false,
  entities: ["src/database/entities/**/*.js"], // Đường dẫn đến các entity
  migrations: ["src/database/migrations/**/*.js"],
  subscribers: ["src/database/subscribers/**/*.js"],
};
