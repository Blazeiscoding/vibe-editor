import express from "express";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";


const app = express();
const port = 3010;

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static("static"));

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

// Fetch random quote when server starts

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
