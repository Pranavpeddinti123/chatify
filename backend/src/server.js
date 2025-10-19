import express from "express"
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js";
import path from "node:path"
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";


const __dirname = path.resolve()

 
const app = express()

app.use(express.json()); // req.body

// It tells your Express app to use some code for every incoming request or for requests matching a specific path.
app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes)

const port = ENV.PORT || 3000


// make ready for deployment
if(ENV.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));

    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"))
    })
}


app.listen(port,() => {
    console.log("Server is running on port 3000")
    connectDB()
});