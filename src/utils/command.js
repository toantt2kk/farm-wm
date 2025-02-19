import { execSync } from "child_process";

const getScreenSize = () => {
  const output = execSync(
    "wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution"
  ).toString();
  const match = output.match(/(\\d+)\\s+(\\d+)/);
  return match
    ? { width: parseInt(match[1]), height: parseInt(match[2]) }
    : { width: 1920, height: 1080 };
};
export { getScreenSize };
