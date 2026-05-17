import express from "express"
import { ENV } from "./lib/ENV.js";
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.route.js";
import booksAndthesesRoutes from "./routes/items.routes.js";
import roomReservationRoutes from "./routes/room.routes.js";
import historyRoutes from "./routes/history.routes.js";

const app = express()

const normalizeOrigin = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    try {
        const parsed = new URL(raw);
        return parsed.origin;
    } catch {
        // Fallback for values without protocol; keep a conservative normalized form.
        return raw.replace(/\/+$/, "");
    }
};

const parseEnvOrigins = (value) => {
    return String(value || "")
        .split(",")
        .map((item) => normalizeOrigin(item))
        .filter(Boolean);
};

const isAllowedVercelPreview = (origin) => {
    const normalized = normalizeOrigin(origin);
    return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized);
};

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = Array.from(new Set([
    ...parseEnvOrigins(ENV.CLIENT_URL),
    ...parseEnvOrigins(process.env.CLIENT_URLS),
    ...parseEnvOrigins(process.env.FRONTEND_URL),
    "https://csu-smartlib.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
    // Vite may pick another port (5174+) if 5173 is taken. Allow common dev ports.
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://0.0.0.0:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://0.0.0.0:5175",
].map((origin) => normalizeOrigin(origin)).filter(Boolean)));

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser requests and same-origin tools with no Origin header.
            if (!origin) return callback(null, true);

            const normalizedOrigin = normalizeOrigin(origin);

            if (allowedOrigins.includes(normalizedOrigin)) {
                return callback(null, true);
            }

            // Optional safety valve for Vercel preview URLs.
            if (process.env.ALLOW_VERCEL_PREVIEWS === "true" && isAllowedVercelPreview(normalizedOrigin)) {
                return callback(null, true);
            }

            console.warn(`[cors] blocked origin: ${origin}`);
            return callback(null, false);
        },
        credentials: true,
    })
)


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/items", booksAndthesesRoutes);
app.use("/api/rooms", roomReservationRoutes);
app.use("/api/history", historyRoutes);

// Place this AFTER all app.use() route registrations
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  console.error(err); // This will reveal the real error
  res.status(500).json({ message: err.message });
});

if(!ENV.SERVERLESS){
    app.listen(ENV.PORT, () =>{
        console.log("Server is running on port ", ENV.PORT);
    });
}

export default app;
