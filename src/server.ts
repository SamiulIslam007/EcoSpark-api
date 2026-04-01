import "dotenv/config";
import app from "./app";
import { validateEnv } from "./lib/validateEnv";

validateEnv();

const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
