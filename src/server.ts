import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
});
