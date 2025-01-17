const express = require('express');
const app = express();
const path =require("path");
const usermodel=require("./models/user");
const postmodel=require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken');
const upload = require('./config/multer');
const port = process.env.PORT || 4000;


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());


app.get("/" , (req,res)=>{
    res.render("index");
});




app.get("/login" , (req,res)=>{
    res.render("login");
});


app.get("/profile/upload" ,isloggedin, (req,res)=>{
    res.render("profileupload");
});

app.post("/upload" ,isloggedin,upload.single("image"), async (req,res)=>{
    let user=await usermodel.findOne({email:req.user.email});
    user.profilepic=req.file.filename;
    await user.save();
    res.redirect("/profile");
});

app.get("/profile" ,isloggedin, async(req,res)=>{
    let user=await usermodel.findOne({email:req.user.email}).populate("post");
    res.render("profile",{user});
});
app.get("/like/:id" ,isloggedin, async(req,res)=>{
    let post=await postmodel.findOne({_id:req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    
    await post.save();
    res.redirect("/profile");
});
app.get("/edit/:id" ,isloggedin, async(req,res)=>{
    let post=await postmodel.findOne({_id:req.params.id}).populate("user");
    res.render("edit",{post})
});
app.post("/update/:id" ,isloggedin, async(req,res)=>{
    let post=await postmodel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect("/profile")
});
app.post("/post" ,isloggedin, async(req,res)=>{
    let user=await usermodel.findOne({email:req.user.email})

    let post=await postmodel.create({
        user:user._id,
        content:req.body.content
    });

    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.get("/logout" , (req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
});

app.post("/register" , async (req,res)=>{
    let{email,passward,name,username,age}=req.body;
    let user=await usermodel.findOne({email});
    if(user) return res.status(500).send("User already register");

    bcrypt.genSalt(10,(err,salt)=>{ 
        bcrypt.hash(passward,salt,async (err,hash)=>{
            let user=await usermodel.create({
                username,
                name,
                email,
                age,
                passward:hash
            });
            let token=jwt.sign({email:email,userid:user._id},"mukesh");
            res.cookie("token",token);
            res.redirect("/profile");
        })
    });
});

app.post("/login" , async (req,res)=>{
    let{email,passward}=req.body;
    let user=await usermodel.findOne({email});
    if(!user) return res.status(500).send("somthing went wrong");
    bcrypt.compare(passward,user.passward,function(err,result){
        if(result){
            let token=jwt.sign({email:email,userid:user._id},"mukesh");
            res.cookie("token",token);
            res.status(200).redirect("/profile");
        }
        else res.redirect('/login');
    })
    
});

function isloggedin(req,res,next){
    if(req.cookies.token=="") res.redirect("/login");
    else{
        let data=jwt.verify(req.cookies.token,"mukesh");
        req.user=data;
        next();
    }
}
app.listen(port);
