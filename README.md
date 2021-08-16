# The Price is Right
A multiplayer web game where players have to guess the price of a random item, inspired by the TV show *The Price is Right*.  
This was a quick project I made to learn socket.io and express.js.  
The random items are fetched via eBay's API, using [ebay-node-api](https://github.com/pajaydev/ebay-node-api).

## Rules
 - If a player's guess exceeds the price, they get no points, regardless of how close their guess is.
 - The player whose guess is closest to the price while not exceeding the price gets 1 point (if multiple players tie, they all get 1 point).
 - If a player guesses the exact price, they get 3 points (if multiple players guess the exact price, they all get 3 points).

## The Web App
 1. Players input a username on the landing page. No login is necessary.
 2. A player can create a game room by clicking "create". The player will be moved into the room and a six character room code will be generated. The game will start when this player clicks "start game".
 3. Other players can join the game room by inputting the six character room code and clicking "join".
 4. Once the game has started, an item name will be displayed and all players will be able to guess the price by inputting their guess and clicking "submit guess". Once all players have submitted their guess, the results will be displayed and the next item will be generated.
 5. The game continues indefinitely.