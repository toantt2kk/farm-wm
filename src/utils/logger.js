import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// Format cho console (hiển thị icon, màu sắc)
const consoleFormat = printf(({ level, message, timestamp }) => {
  let icon;
  switch (level) {
    case "info":
      icon = "ℹ️";
      break;
    case "warn":
      icon = "⚠️";
      break;
    case "error":
      icon = "❌";
      break;
    case "debug":
      icon = "🐛";
      break;
    default:
      icon = "";
  }
  return `${timestamp} ${icon} ${level}: ${message}`;
});

// Format cho file (giữ gọn gàng, không màu, không icon)
const fileFormat = printf(({ level, message, timestamp }) => {
  // In hoa level cho dễ đọc
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  transports: [
    // Ghi log ra terminal với màu sắc, icon
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        colorize({ all: true }),
        consoleFormat
      ),
    }),

    // Ghi log ra file .log đơn giản, không màu mè
    new winston.transports.File({
      filename: "./data/automation.log",
      format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), fileFormat),
    }),
  ],
});
