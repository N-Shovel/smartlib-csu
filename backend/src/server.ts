import express from "express"
import { ENV } from "./lib/ENV";
import cookieParser from "cookie-parser";
import cors from "cors";


import studentAuthRoutes from "./routes/studentAuth.routes";
import studentProfileRoutes from "./routes/studentProfile.route";

const app = express()

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
}))


app.use("/api/auth", studentAuthRoutes);
app.use("/api/profile", studentProfileRoutes);

if(!ENV.SERVERLESS){
    app.listen(ENV.PORT, () =>{
        console.log("Server is running on port ", ENV.PORT);
    });
}

export default app;
