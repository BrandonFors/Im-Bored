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
var hiddenHand = [];
var hiddenCard;
var playerCards = [];
var gameState = 0;
var activeHand = 1;
var totalMoney = 1000;
var numResets = 0;

var nasaAPIKEY= "NNzgahJt0d8mfLEYzA2ovvN1eGJO7hlUYCojD6Iw";


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
// 4 = dealer done/view results
// 5 = invalid bet size
//DEALER HAND STATE SCALE
// 0 = hidden card
// 1 = reveal and hit
//WIN STATUS SCALE
// 0 = lose
// 1 = win
// 2 = push


//commonly used function that calculates the total value of the cards within a hand at a given time (works for dealer and player hands)
//accounts for the face card values as tens
function calcTotalValue(hand){
    var totalValue = 0;
    //for each card look at the value of that card and add a number to the total value that will be returned
    hand.cards.forEach((card)=>{
      var value = 0;
      if(card.value == "ACE"){
        //aces are regaurded as one and then counted as 11 if allowed later.
        value = 1;
        hand.ace = true;
      }else if(card.value=="KING"||card.value=="QUEEN"||card.value=="JACK"){
        value = 10;
      }else{
        value = parseInt(card.value);
      }
      totalValue+=value;
    
    })
    return totalValue;
}
//Constructs a String based on the totalValues of the card
function getTotalValuesString(hand){
  if(!hand.ace){
    hand.totalValuesString= "Hand Value: " + hand.totalValues;
  }else{
    if(hand.totalValues+10<=21){
      hand.totalValuesString = "Hand Value: " + (hand.totalValues+10)+" or "+hand.totalValues;
    }else{
      hand.totalValuesString = "Hand Value: " + hand.totalValues;
    }
  }
}
//basic get method for the initial call of /blackjack 
app.get("/blackjack",(req,res)=>{
    
    res.render("blackjack.ejs");
})
//this is the get method that will always be redirected to whenever another get/post method is used
app.get("/blackjack/play",async(req,res)=>{
    
      //returns passes in necesary objects and values for the front end to react with
      res.render("blackjack.ejs", {
        dealer:dealerHand,
        player:playerHands,
        numHands:numHands, 
        gameState: gameState, 
        activeHand:activeHand, 
        money: totalMoney, 
        resets: numResets
      });
})
//shuffle post method called when player selects the number of hands they want and presses submit
//number of hands cannot be changed between rounds
app.post("/blackjack/play/shuffle", async (req,res)=>{
    console.log('shuffle');
    try {
        //uses axios to call deck api and get a deck id with 6 decks
        const response = await axios.get(`https://www.deckofcardsapi.com/api/deck/new/shuffle`,{
            params:{deck_count:6}
        });
        console.log(response.data);
        //get the deck id from the response object
        deckId = response.data.deck_id;
        console.log("deckID: " + deckId);
        //gets the number of hands selected (1-3) from the body of the request from the ejs file
        numHands = parseInt(req.body.hands);
        //creates numHands hand instances within playerHands array
        for(var x=1;x<=numHands;x++){
          playerHands.push({
            id: x,
            cards: [],
            totalValues: 0,
            totalValuesString: "",
            bust: false,
            handState: 0 ,
            bet: 0,
            betId: "bet"+x,
            win: 0,
            //you can only ever have one ace count as 11
            ace: false

          });  
        }
        //creasts one instance of a hand in dealerHand array
        dealerHand.push({
          id: 1,
          cards: [],
          totalValues: 0,
          totalValuesString: "",
          bust: false,
          handState: 0,
          ace: false
        });
        //sets the game state to one to trigger the bet screen
        gameState = 1;
        
        res.redirect("/blackjack/play");
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }
})
//deal deals cards to dealer and player hands
//triggered when bets are submitted
app.post("/blackjack/play/deal",async(req,res)=>{
    
    
    
    try {
      //check that bet amounts are less than or equal to the totalMoney available
      var currentBetsTotal = 0;
      var currentBet1 = parseInt(req.body.bet1);
      currentBetsTotal += currentBet1;
      //uses if statements to see if certain bet ids exist within the request body
      //if they do they add them to the bet total
      if(req.body.bet2 !=null){
        var currentBet2 = parseInt(req.body.bet2);
        currentBetsTotal += currentBet2;
      } 
      if(req.body.bet3 !=null){
        var currentBet3 = parseInt(req.body.bet3);
        currentBetsTotal += currentBet3;
      }
      var currentBets = [currentBet1,currentBet2,currentBet3];

      if(totalMoney-currentBetsTotal<0){
        // if the bets are invalid return the user to the same screen and make them re enter valid bet amounts
        res.redirect("/blackjack/play");

      }else{
      
        //make a request to the deck api to draw a certain amount of cards based on game conditions
        const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{

            params:{count:numHands*2+2}
        });
        //gives dealer a card and has a hidden card
        console.log(response.data);
        //takes a card from the response as the dealers hidden card
        hiddenCard = response.data.cards[numHands*2+1];
        //takes a card form the response and pushes it into the dealerHand hand object card array
        dealerHand[0].cards.push(response.data.cards[numHands]);
        //puts appropriate player cards from response into array
        for(var x=0;x<response.data.cards.length;x++){
            if((!(x==numHands))&&(!(x==(numHands*2+1)))){
                playerCards.push(response.data.cards[x]);
            }
        }
        //puts appropriate cards from player cards into playerHands hand object card arrays
        if(numHands==1){
          for(var x=0; x<playerCards.length;x++ ){
            playerHands[0].cards.push(playerCards[(x)]);
          }
        }else{
          for(var x=0; x<playerCards.length;x++ ){
            playerHands[(x+1)%(numHands)].cards.push(playerCards[(x)]);
          }
        }
        //calcs the total values of each hand 
        for(var x=0; x<numHands;x++ ){
            playerHands[x].totalValues=calcTotalValue(playerHands[x]);
            getTotalValuesString(playerHands[x]);
        }
        //calcs the total value of dealer hand
        dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
        getTotalValuesString(dealerHand[0]);
        //puts the input bets into the hand objects with playerHands
        for(var x=0;x<numHands;x++){
          playerHands[x].bet = currentBets[x];
          playerHands[x].handState = 1;
          //subtracts money from totalMoney for each input bet
          totalMoney -= currentBets[x];
        }
        //calc total values of dealer hand
        dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
        getTotalValuesString(dealerHand[0]);
        
        
        //checks for dealer blackjack
        //accounts for hidden card not yet being added to the cards within dealer hand
          if((dealerHand[0].totalValues==10&&hiddenCard.value == "ACE")||
          (dealerHand[0].totalValues ==1 &&hiddenCard.value == "KING")||
          (dealerHand[0].totalValues ==1 &&hiddenCard.value == "QUEEN")||
          (dealerHand[0].totalValues ==1 &&hiddenCard.value == "JACK")||
          (dealerHand[0].totalValues ==1 &&hiddenCard.value == "10")
        ){
          //redirects to dealer if the dealer has 21 bc game is over
           res.redirect("/blackjack/play/dealer");
            
        }else{
          gameState = 2;
          activeHand = 1;
          //if the dealer doesn't have 21 the game will continue as normally
          res.redirect("/blackjack/play");
        }
        

       
        console.log(dealerHand);
        console.log(playerHands);
        
      }
      } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }

});
//get method that grants the active hand another card
app.get("/blackjack/play/hit",async(req,res)=>{
    try {
      //makes an api request to draw one card from the deck
        const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
            params:{count:1}
        });
        //gets the index within the playerHands array by subtracting one from activeHand
        var handIndex = (activeHand-1);
        
        console.log(response.data);
        //puts the card from the api response into the active hand's card array
        playerHands[handIndex].cards.push(response.data.cards[0]);
        //recalcs the total value after the card is added
        playerHands[handIndex].totalValues=calcTotalValue(playerHands[handIndex]);
        getTotalValuesString(playerHands[handIndex]);
        //checks to see if the hand is busted
        if(playerHands[handIndex].totalValues>21){
          playerHands[handIndex].bust = true;
          playerHands[handIndex].handState = 2;
          //if there is another hand to be played increase activeHand value to move to the next hand
          //if not then move to the next stage of the game
          if(!(activeHand+1>numHands)){
            activeHand++;
            res.redirect("/blackjack/play");
          }else{
            gameState = 3;
            res.redirect("/blackjack/play/dealer");
          }
          //if the hand has 21 move to the next hand
        }else if(playerHands[handIndex].totalValues==21){
          playerHands[handIndex].handState = 2;
          //if there is another hand to be played increase activeHand value to move to the next hand
          //if not then move to the next stage of the game
          if(!(activeHand+1>numHands)){
            activeHand++;
            res.redirect("/blackjack/play");
          }else{
            gameState = 3;
            res.redirect("/blackjack/play/dealer");

          }
        }else{
          //nothing tehe
          res.redirect("/blackjack/play");
        }
        console.log(playerHands);
        //redirect to main method
      
        }   
      catch (error) {
        res.status(500).json({ message: "Error fetching data" });
      }

});
//called when player wants to stop the current hand and move on to playing the next
app.get("/blackjack/play/stand", (req,res)=>{
  try{
    var handIndex =activeHand-1;
    playerHands[handIndex].handState = 3;
    //if there is another hand to be played increase activeHand value to move to the next hand
    //if not then move to the next stage of the game
    if(activeHand+1<=numHands){
      activeHand++;
      res.redirect("/blackjack/play");
    }else{
      gameState = 3;
      res.redirect("/blackjack/play/dealer");
    }
  }catch(error){
    res.status(500).json({ message: "Error fetching data" });
  }
  console.log(playerHands);
  
});
//method that plays through the dealer
app.get("/blackjack/play/dealer",async(req,res)=>{
  
  try{
    //adds the hidnen card to the dealer hand 
    dealerHand[0].cards.push(hiddenCard);
    dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
    //if the dealer hand has an ace and the value
    if(dealerHand[0].ace){
      //Since aces are counted as 1 by default check if the ace can count as 11 and if that value is above 17 
      //(dealer stands on 17 or more)
      if(dealerHand[0].totalValues+10>=17&&dealerHand[0].totalValues+10<=21){
        dealerHand[0].totalValues +=10;
      }
    }
    
    getTotalValuesString(dealerHand[0]);
    //
    while(dealerHand[0].totalValues<17){
    const response = await axios.get(`${BLACKJACK_API_URL}/${deckId}/draw/`,{
      params:{count:1}
    });
    dealerHand[0].cards.push(response.data.cards[0]);
    dealerHand[0].totalValues=calcTotalValue(dealerHand[0]);
    if(dealerHand[0].ace){
      if(dealerHand[0].totalValues+10>=17&&dealerHand[0].totalValues+10<=21){
        dealerHand[0].totalValues +=10;
      }
    }
    getTotalValuesString(dealerHand[0]);
    }
    if(dealerHand[0].totalValues>21){
      dealerHand[0].bust = true;
      
    }
    
    for(var x=0; x<numHands;x++ ){
      if(playerHands[x].ace){
        if(playerHands[x].totalValues<=21){
          playerHands[x].totalValues +=10;
        }
      }
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
    dealerHand[0].handState = 1;
    for(var x = 0; x<numHands; x++){
      playerHands[x].handState = 4;
    }
    

    gameState = 4;
    res.redirect("/blackjack/play");
  }catch{
    res.status(500).json({ message: "Error fetching data" });

  }
})
//make a reset board/log results
//make a function to check dealer blackjack in begining 
//make it check for overbetting
app.get("/blackjack/play/reset", async (req,res)=>{ 
  try{
    for(var x=0; x<numHands;x++ ){
      if(playerHands[x].win==1){
        
        totalMoney +=playerHands[x].bet*2
      }else if(playerHands[x].win==2){
        totalMoney +=playerHands[x].bet;
      }else{
        //nothing
      }
    }
    playerHands = [];
    dealerHand = [];
    playerCards = [];

    console.log(playerHands);
    console.log(dealerHand);
    for(var x=1;x<=numHands;x++){
      playerHands.push({
        id: x,
        cards: [],
        totalValues: 0,
        totalValuesString: "",
        bust: false,
        handState: 0 ,
        bet: 0,
        betId: "bet"+x,
        win: 0,
        //you can only ever have one ace count as 11
        ace: false

      });  
      console.log("yep");
    }
    dealerHand.push({
      id: 1,
      cards: [],
      totalValues: 0,
      totalValuesString: "",
      bust: false,
      handState: 0,
      ace: false
    });
    console.log(playerHands);
    console.log(dealerHand);
    console.log("yay");
    gameState = 1;
    res.redirect("/blackjack/play");
  }catch{
    res.status(500).json({ message: "Error fetching data" });
  }
});
app.get("/blackjack/play/resetMoney", async (req,res)=>{
  totalMoney = 1000;
  numResets++;
  res.redirect("/blackjack/play");
})
/////////////////////////////////////////////////////////NASA\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/nasa",(req,res) =>{
    res.render("nasa.ejs");

    
});
/////////////////////////////////////////////////////CALCULATOR\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/calculator",(req,res) =>{
  res.render("calculator.ejs");
  
});
app.post("/calculator",(req,res)=>{
  res.render("calculator.ejs", {image:"/images/ryanmeme.jpg", num1:req.body.num1, num2: req.body.num2})
})
///////////////////////////////////////////////////////RANDOM\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
app.get("/random",(req,res)=>{
    var page = pages[Math.floor(Math.random() * numPages)];
    console.log(page);
    res.redirect(page);
})





app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });