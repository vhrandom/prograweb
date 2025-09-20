// server/cors.ts
import cors from "cors";

export const corsOptions = {
  origin: ["http://localhost:5000"],
  credentials: true,
};

export default cors(corsOptions);
