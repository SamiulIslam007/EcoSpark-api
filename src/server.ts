import "dotenv/config";
import app from "./app.js";
import { validateEnv } from "./app/utils/validateEnv.js";

validateEnv();

// Vercel sets VERCEL=1; never call listen() there (serverless uses export default).
// Use VERCEL, not NODE_ENV — NODE_ENV can be unset or wrong on some runtimes.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
