import mongoose from "mongoose"

export const connectDB=()=>{
    mongoose.connect(process.env.MONGO_URL,({
        useNewUrlParser:true,
        useUnifiedTopology:true,
    })).then((e)=>{
        console.log(`database connected to ${e.connection.host}`)
    })
}