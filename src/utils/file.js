import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import _ from "lodash";
import { tmpdir } from "os";
import { join } from "path";

const deleteProfile = (dir, profileId) => {
  if (!dir) {
    dir = join(tmpdir(), `gologin_profile_${profileId}`);
  } else {
    dir = join(dir, `gologin_profile_${profileId}`);
  }
  return rmSync(dir, { recursive: true } || false);
};
const getDataToFile = async (file) => {
  try {
    const fileData = readFileSync(file, "utf-8");
    const datas = _.split(fileData.trim(), "\n");
    return datas;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
};

const removeStringFromFile = (filePath, stringToRemove) => {
  try {
    const content = readFileSync(filePath, "utf8");
    let datas = _.split(content, "\n");
    _.remove(datas, (data) => data === stringToRemove);
    writeFileSync(filePath, datas.join("\n"), "utf8");
    console.log(`✅ Đã xóa "${stringToRemove}" khỏi tệp ${filePath}`);
  } catch (error) {
    console.error("❌ Lỗi khi xử lý tệp:", error);
  }
};

const appendToFile = (filePath, newContent) => {
  try {
    const currentContent = existsSync(filePath)
      ? readFileSync(filePath, "utf8")
      : "";
    const updatedContent = currentContent
      ? `${currentContent}\n${newContent}`
      : newContent;
    writeFileSync(filePath, updatedContent.trim(), "utf8");
    console.log(`✅ Đã ghi thêm nội dung vào tệp: ${filePath}`);
  } catch (error) {
    console.error("❌ Lỗi khi ghi vào tệp:", error);
  }
};

export { appendToFile, deleteProfile, getDataToFile, removeStringFromFile };
