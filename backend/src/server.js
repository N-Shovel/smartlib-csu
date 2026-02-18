import express from "express";

const app = express();

const PORT = 8080 || 5000;

app.listen(PORT, () =>{
    console.log(`Server is listening at PORT: ${PORT}`);
})

export default app;
