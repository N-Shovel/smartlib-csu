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

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    ENV.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
    // Vite may pick another port (5174+) if 5173 is taken. Allow common dev ports.
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://0.0.0.0:5174",
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser requests and same-origin tools with no Origin header.
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
)


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/items", booksAndthesesRoutes);
app.use("/api/rooms", roomReservationRoutes);
app.use("/api/history", historyRoutes);

if(!ENV.SERVERLESS){
    app.listen(ENV.PORT, () =>{
        console.log("Server is running on port ", ENV.PORT);
    });
}

export default app;
