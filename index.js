import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;
const pages= ["/bacon","/imgflip","/blackjack","/nasa"];
const numPages = 4;
//imgflip variables
var letters = /[a-z]/i;
//blackjack variables
//MAYBE MAKE AN ARRAY OF HANDS
const BLACKJACK_API_URL = "https://www.deckofcardsapi.com/api/deck";
var deckId;
var remainingCards;
//place cards, bet, bust?, total values, message within hand elements in this array;
var playerHands = [];
var currentBet;
var numHands;
var dealerCards = [];
var hiddenCard = [];
var playerCards = [];
var message;
var gameState;
var buttons = [];



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
function calcTotalValue(hand){
    var totalValue = 0;
    hand.cards.forEach((card)=>{totalValue+=parseInt(card.value)})
    return totalValue;
}
app.get("/blackjack",(req,res)=>{
    
    res.render("blackjack.ejs");
})
app.get("/blackjack/play",async(req,res)=>{
    
    switch(gameState) {
        case "inPlay":
          message = "Select 'Hit' or 'Stand'. Don't get over 21!";
          buttons = [
            {ref:"/blackjack/play/hit", text: "HIT"},
            {ref:"/blackjack/play/stand", text: "STAND"}
        ];
          break;
        case "betting":
            message = "Place and lock in your bet.";
            buttons = [
                {ref:"/blackjack/play/hit", text: "HIT"},
                {ref:"/blackjack/play/stand", text: "STAND"}
            ];
          break;
        //not in use
        // case "busted":
        //     message = "You busted all over the place.";
        //     break;
          
        default:
          message = "";
      }

      res.render("blackjack.ejs", {dealer:dealerCards,player:playerHands,numHands:numHands,message:message});
})
app.get("/blackjack/play/shuffle", async (req,res)=>{
    console.log('shuffle');
    try {
        
        const response = await axios.get(`https://www.deckofcardsapi.com/api/deck/new/shuffle`,{
            params:{deck_count:6}
        });
        console.log(response.data);
        deckId = response.data.deck_id;
        gameState = "betting";
        console.log("deckID: " + deckId);
        res.redirect("/blackjack/play");
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }
})
app.post("/blackjack/play/deal",async(req,res)=>{
    currentBet = req.body.bet;
    numHands = parseInt(req.body.hands);
    playerHands = [];
    playerCards = [];
    try {
        const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
            params:{count:numHands*2+2}
        });
        //gives dealer a card and has a hidden card
        console.log(response.data);
        dealerCards.push(response.data.cards[0]);
        hiddenCard.push(response.data.cards[numHands+1]);
        
        for(var x=1;x<=numHands;x++){
          playerHands.push({
            id: x,
            cards: [],
            totalValues: 0,
            bust: false,
          });  
        }
        //puts appropriate player cards from response into array
        for(var x=1;x<response.data.cards.length;x++){
            if(!(x==numHands+1)){
                playerCards.push(response.data.cards[x]);
            }
        for(var x=0; x<playerCards.length;x++ ){
            playerHands[x].cards.push(playerCards[(x%3)]);
        }
        for(var x=0; x<numHands;x++ ){
            playerHands[x].totalValues=calcTotalValue(playerHands[x]);
        }
   
        }
        gameState = "inPlay";
        console.log(response.data);
        console.log(playerHands);
        res.redirect("/blackjack/play");
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }

});
app.get("/blackjack/play/hit",async(req,res)=>{
    try {
        const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
            params:{count:1}
        });
        
        console.log(response.data);
        playerCards.push(response.data.cards[0]);
        
        playerCards.forEach((card)=>{parseInt(card.value)});
        res.redirect("/blackjack/play");
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }

});
//CREATE STAND FUNCTION
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