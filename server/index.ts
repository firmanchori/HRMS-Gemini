import { config } from "dotenv";
config({ path: ".env.local" });

import { createApp } from "./app.ts";

const PORT = process.env.API_PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`NusaHR API listening on http://localhost:${PORT}`);
});
