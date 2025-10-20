import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { ENV } from "../lib/env.js"

export const protectRoute = async(req,res,next) => {

    try{
// the token contains three parts divided with "."        
// Header: { "alg": "HS256", "typ": "JWT" } → algorithm and type
// Payload: { "userId": "68f4df..." } → the data you stored
// Signature: a hash calculated from the header + payload + secret

        const token = req.cookies.jwt
        if(!token) return res.status(401).json({message:"Unauthorized - No token provided"})
        
        const decoded = jwt.verify(token,ENV.JWT_SECRET)
        if(!decoded) return res.status(401).json({message:"Unauthorized - Invalid Token"})

        const user = await User.findById(decoded.userId).select("-password")
        if(!user) return res.status(404).json({message:"Unauthorized - No user found"})

        req.user = user
        next()

    }catch(error){
        console.error("Error in protectRoute middleware",error)
        res.status(500).json({message:"Internal server error"})
    }
}

// 2️⃣ What jwt.verify(token, secret) does

// When you call:

// const decoded = jwt.verify(token, ENV.JWT_SECRET)


// This is what happens internally:

// Split the token into its three parts: header, payload, signature.

// const [header64, payload64, signature] = token.split('.');


// Recalculate the signature using the header and payload with the secret you provided:

// const expectedSignature = HMACSHA256(header64 + '.' + payload64, ENV.JWT_SECRET)


// Compare signatures:

// If expectedSignature === signature → token is valid

// If not → token is invalid → throws an error