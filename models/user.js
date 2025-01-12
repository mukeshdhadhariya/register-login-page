const mongoose=require("mongoose");
require('dotenv').config({
    path:'./.env'
})

const mgdbconnect=async ()=>{
    try {
        const cnt=await mongoose.connect(`${process.env.MGDB_URL}/${process.env.NAME}`)
        console.log("monogobd conntected");
    } catch (error) {
        console.log("error",error);
        
    }
}
mgdbconnect()


const userSchema=mongoose.Schema({
    username:String,
    name:String,
    email:String,
    passward:String,
    age:Number,
    profilepic:{
        type:String,
        default:""
    },
    post:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ]
})
module.exports=mongoose.model('user',userSchema);