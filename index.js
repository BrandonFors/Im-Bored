import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

const pages= ["/bacon","/imgflip","/blackjack","/nasa"];
const numPages = 4; 





app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/",(req,res) =>{
    res.render("index.ejs");
    
});

app.get("/about",(req,res) =>{
    res.render("about.ejs");
    
});

app.get("/bacon",(req,res) =>{
    res.render("bacon.ejs");
    
});

app.get("/imgflip",(req,res) =>{
    res.render("imgflip.ejs");
    
});

app.get("/blackjack",(req,res)=>{
    res.render("blackjack.ejs");
})

app.get("/nasa",(req,res) =>{
    res.render("nasa.ejs");
    
});

app.get("/random",(req,res)=>{
    var page = pages[Math.floor(Math.random() * numPages)];
    console.log(page);
    res.redirect(page);
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });