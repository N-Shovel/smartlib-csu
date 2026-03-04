import express from "express"
import { ENV } from "./lib/ENV.js";
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.route.js";
import booksAndthesesRoutes from "./routes/items.routes.js";
import roomReservationRoutes from "./routes/room.routes.js";

const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
}))


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/items", booksAndthesesRoutes);
app.use("/api/rooms", roomReservationRoutes);

if(!ENV.SERVERLESS){
    app.listen(ENV.PORT, () =>{
        console.log("Server is running on port ", ENV.PORT);
    });
}

export default app;
