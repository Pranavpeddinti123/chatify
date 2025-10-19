import express from "express"
import dotenv from 'dotenv'
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js";



dotenv.config();


 
const app = express()

// It tells your Express app to use some code for every incoming request or for requests matching a specific path.
app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes)

const port = process.env.PORT || 3000




app.listen(port,() => console.log("Server is running on port 3000"))