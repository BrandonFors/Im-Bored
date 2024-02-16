import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const pages= ["/bacon","/imgflip","/blackjack","/nasa"];
const numPages = 4;
var letters = /[a-z]/i;





app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
///////////////////////////////////////////////////////HOME\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/",(req,res) =>{
    res.render("index.ejs");
    
});

app.get("/about",(req,res) =>{
    res.render("about.ejs");
    
});
/////////////////////////////////////////////////////////////BACON\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.get("/bacon",(req,res) =>{
    res.render("bacon.ejs");
    
});
app.get("/baconImg",(req,res)=>{
    var width = Math.floor(Math.random() * 400)+201;
    var height = Math.floor(Math.random() * 400)+201;
    var url = "https://baconmockup.com/" + width+"/"+height+"/"
    res.render("bacon.ejs", {imgUrl: url});
})
app.post("/baconImg",(req,res)=>{
    var width = req.body["width"];
    var height = req.body["height"];
    var url;
    console.log(req.body["width"]);
    console.log(req.body["height"]);
    if(letters.test(width)||letters.test(height)){
        console.log("letters!!");
        res.render("bacon.ejs", {invalidParam:true});
      } else {
        
      
        if(height == ""){
            height = Math.floor(Math.random() * 800)+201;
        }
        if(width == ""){
            width = Math.floor(Math.random() * 800)+201;
        }

        url = "https://baconmockup.com/" + width+"/"+height+"/";
        console.log(url);
        res.render("bacon.ejs", {imgUrl: url});
        console.log("render");
}
})



///////////////////////////////////////////////////////////IMGFLIP\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/imgflip",(req,res) =>{
    res.render("imgflip.ejs");
    
});


//////////////////////////////////////////////////////////////BLACKJACK\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/blackjack",(req,res)=>{
    res.render("blackjack.ejs");
})
/////////////////////////////////////////////////////////NASA\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/nasa",(req,res) =>{
    res.render("nasa.ejs");
    
});
///////////////////////////////////////////////////////RANDOM\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/random",(req,res)=>{
    var page = pages[Math.floor(Math.random() * numPages)];
    console.log(page);
    res.redirect(page);
})




app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });