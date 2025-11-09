import path from "path";

// Vercel 환경에서는 /tmp 디렉토리 사용, 로컬에서는 process.cwd() 사용
const isVercel = process.env.VERCEL === "1";
const basePath = isVercel ? "/tmp" : process.cwd();

export const dbPath = path.join(basePath, "data", "chat.db");
