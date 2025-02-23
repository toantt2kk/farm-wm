import readline from "readline";
import { workers } from "./worker/index.js";

// Điều khiển chương trình với phím F5 hoặc Enter
if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (str, key) => {
    if (key.name === "f5") {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      main();
    }
  });
} else {
  console.warn("STDIN không phải TTY. Nhấn Enter để chạy main().");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on("line", () => {
    rl.close();
    workers();
  });
}
