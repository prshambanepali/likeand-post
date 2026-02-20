require("dotenv").config();

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "CLIENT_ORIGIN",
];

for (const k of required) {
  if (!process.env[k]) console.warn(`⚠️ Missing env var: ${k}`);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
};
