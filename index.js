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
var dealerHand = [];
var numHands;
var dealerCards = [];
var hiddenCard = [];
var playerCards = [];
var gameState = 0;
var activeHand = 0;



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
//PLAYER HAND STATE SCALE
// 0 = betting
// 1 = in play
// 2 = complete
// 3 = player done
// 4 = dealer done / view results
//GAME STATE SCALE
// 0 = hand selection
// 1 = betting
// 2 = in play
// 3 = complete
//DEALER HAND STATE SCALE
// 0 = hidden card
// 1 = reveal and hit
//WIN STATUS SCALE
// 0 = lose
// 1 = win
// 2 = push


function calcTotalValue(hand){
    var totalValue = 0;
    hand.cards.forEach((card)=>{totalValue+=parseInt(card.value)})
    return totalValue;
}
app.get("/blackjack",(req,res)=>{
    
    res.render("blackjack.ejs");
})
app.get("/blackjack/play",async(req,res)=>{
    
  
      //make game states on a cale of 0 to whatever and make html code that renders with each one ie buttons/messages
      res.render("blackjack.ejs", {dealer:dealerCards,player:playerHands,numHands:numHands, gameState: gameState});
})
app.get("/blackjack/play/shuffle", async (req,res)=>{
    console.log('shuffle');
    try {
        
        const response = await axios.get(`https://www.deckofcardsapi.com/api/deck/new/shuffle`,{
            params:{deck_count:6}
        });
        console.log(response.data);
        deckId = response.data.deck_id;
        console.log("deckID: " + deckId);
        numHands = parseInt(req.body.hands);
        for(var x=1;x<=numHands;x++){
          playerHands.push({
            id: x,
            cards: [],
            totalValues: 0,
            bust: false,
            handState: 0 ,
            bet: 0,
            win: 0
          });  
        }
        dealerHand.push({
          id: 1,
          cards: [],
          totalValues: 0,
          bust: false,
          handState: 0,
        });
        gameState = 1;
        activeHand = 0;
        res.redirect("/blackjack/play");
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }
})
app.post("/blackjack/play/deal",async(req,res)=>{
    var currentBets = req.body.bets;
    
    playerHands = [];
    playerCards = [];
    try {
        const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
            params:{count:numHands*2+2}
        });
        //gives dealer a card and has a hidden card
        console.log(response.data);
        dealerCards.push(response.data.cards[numHands*2+1]);
        hiddenCard.push(response.data.cards[numHands]);
        //puts appropriate player cards from response into array
        for(var x=0;x<response.data.cards.length;x++){
            if(!(x==numHands)||!(x==(numHands*2+1))){
                playerCards.push(response.data.cards[x]);
            }
        }
        if(numHands==1){
          for(var x=0; x<playerCards.length;x++ ){
            playerHands[0].cards.push(playerCards[(x)]);
          }
        }else{
          for(var x=0; x<playerCards.length;x++ ){
            playerHands[x%(numHands-1)].cards.push(playerCards[(x)]);
          }
        }
        for(var x=0; x<numHands;x++ ){
            playerHands[x].totalValues=calcTotalValue(playerHands[x]);
        }
        dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
        for(var x=0;x<numHands;x++){
          playerHands[x].bet = currentBets[x];
          playerHands[x].handState = 1;
        }
        gameState = 2;
        console.log(hiddenCard);
        console.log(dealerHand);
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
        var handIndex = req.body.handIndex;
        
        console.log(response.data);
        playerCards.push(response.data.cards[0]);
        playerHands[handIndex].totalValues=calcTotalValue(playerHands[handIndex]);
        if(playerHands[handIndex].totalValues>21){
          playerHands[handIndex].bust = true;
          playerHands[handIndex].handState = 2;
          if(!(activeHand+1>numHands)){
            activeHand++;
          }else{
            gameState = 3;
          }
          
        }else if(playerHands[handIndex].totalValues==21){
          playerHands[handIndex].handState = 2;
          if(!(activeHand+1>numHands)){
            activeHand++;
          }else{
            gameState = 3;
          }
        }else{
          //nothing tehe
        }
        res.redirect("/blackjack/play");
        }   
      catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }

});
app.get("/blackjack/play/stand", (req,res)=>{
  try{
    var handIndex =req.body.handIndex;
    playerHands[handIndex].handState = 3;
    if(!(activeHand+1>numHands)){
      activeHand++;
    }else{
      gameState = 3;
    }
  }catch(error){
    res.status(500).json({ message: "Error fetching data" });
  }
});
app.get("/blackjack/play/dealer",async(req,res)=>{
  
  try{
    setTimeout(()=>{},3000);
    dealerCards.push(hiddenCard[0]);
    dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
    while(dealerHand[0].totalValues<17){
    const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
      params:{count:1}
    });
    dealerCards.push(response.data.cards[0]);
    dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
    }
    if(dealerHand[0].totalValues>21){
      dealerHand[0].bust = true;
      //ddd
    }
    for(var x=0; x<numHands;x++ ){
      if(!(playerHands[x].bust)){
        if(playerHands[x].totalValues>dealerHand[0].totalValues||dealerHand[0].bust){
          playerHands[x].win = 1;
        }else if(playerHands[x].totalValues<dealerHand[0].totalValues){
          playerHands[x].win = 0;
        }else{
          playerHands[x].win = 2;
        }
      } else{
        playerHands[x].win = 0;
      }
    }
    gameState = 4;
    res.redirect("/blackjack/play");
  }catch{
    res.status(500).json({ message: "Error fetching data" });

  }
})
//make a reset board/log results
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