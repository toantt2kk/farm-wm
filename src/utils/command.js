import { execSync } from "child_process";
import os from "os";

const getScreenSize = () => {
  try {
    if (os.platform() === "win32") {
      const output = execSync(
        "wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution"
      ).toString();
      const match = output.match(/(\d+)\s+(\d+)/);
      return match
        ? { width: parseInt(match[1]), height: parseInt(match[2]) }
        : { width: 1920, height: 1080 };
    } else if (os.platform() === "darwin") {
      const output = execSync(
        "system_profiler SPDisplaysDataType | awk '/Resolution/{print $2, $4}'"
      )
        .toString()
        .trim();
      const match = output.match(/(\d+)\s+(\d+)/);
      return match
        ? { width: parseInt(match[1]), height: parseInt(match[2]) }
        : { width: 1920, height: 1080 };
    }
  } catch (error) {
    console.error("Error fetching screen resolution:", error);
  }
  return { width: 1920, height: 1080 }; // Default fallback
};

export { getScreenSize };
