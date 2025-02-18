import imaps from "imap-simple";
import { simpleParser } from "mailparser";

const config = {
  imap: {
    user: "admin@goku68.com",
    password: "Sonca@123",
    host: "imap.secureserver.net",
    port: 993,
    tls: true,
    authTimeout: 60000,
    tlsOptions: { rejectUnauthorized: false }, // Bỏ qua kiểm tra chứng chỉ
  },
};

export const getCodeFromEmail = async (recipient) => {
  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    // Tìm email có người nhận là "recipient"
    const searchCriteria = [["HEADER", "To", recipient]];
    const fetchOptions = { bodies: "", struct: true, markSeen: false };

    let messages = await connection.search(searchCriteria, fetchOptions);
    if (!messages.length) {
      console.log("Không có email nào.");
      connection.end();
      return null;
    }

    // Sắp xếp theo thời gian nhận (mới nhất trước)
    messages.sort(
      (a, b) => new Date(b.attributes.date) - new Date(a.attributes.date)
    );

    // Lấy email mới nhất
    const latestMessage = messages[0];
    const all = latestMessage.parts.find((part) => part.which === "");
    const parsed = await simpleParser(all.body);

    // Tìm mã xác nhận 6 chữ số trong tiêu đề
    const match = parsed.subject.match(/\b\d{6}\b/);
    if (match) {
      console.log(`📧 Mã tìm được: ${match[0]}`);
      connection.end();
      return match[0];
    }

    console.log("Không tìm thấy mã 6 chữ số trong tiêu đề.");
    connection.end();
    return null;
  } catch (error) {
    console.error("Lỗi khi lấy email:", error);
    return null;
  }
};

// Gọi hàm kiểm tra
// getCodeFromEmail("hannah926toan34@goku68.com").then((code) => {
//   if (code) {
//     console.log(`✅ Mã xác nhận: ${code}`);
//   } else {
//     console.log("⚠️ Không tìm thấy mã hợp lệ.");
//   }
// });
