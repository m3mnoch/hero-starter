/*

If you'd like to test your hero code locally,
run this code using node (must have node installed).

Please note that you DO NOT need to do this to enter javascript
battle, it is simply an easy way to test whether your new hero 
code will work in the javascript battle.

To run:

  -Install node
  -Run the following in your terminal:

    node test_your_hero_code.js

  -If you don't see any errors in your terminal, the code works!

*/

//Get the helper file and the Game logic
var helpers = require('./helpers.js');
var Game = require('./game_logic/Game.js');

//Get my hero's move function ("brain")
var heroMoveFunction = require('./hero.js');

//The move function ("brain") the practice enemy will use
var enemyMoveFunction = function(gameData, helpers) {
  //Move in a random direction
  var choices = ['North', 'South', 'East', 'West'];
  return choices[Math.floor(Math.random()*4)];
}

// // The "Careful Assassin"
// // This hero will attempt to kill the closest weaker enemy hero.
var carefulAssassin = function(gameData, helpers) {
  var myHero = gameData.activeHero;
  if (myHero.health < 50) {
    return helpers.findNearestHealthWell(gameData);
  } else {
    return helpers.findNearestWeakerEnemy(gameData);
  }
};

// // The "Safe Diamond Miner"
var safeDiamondMiner = function(gameData, helpers) {
  var myHero = gameData.activeHero;

  //Get stats on the nearest health well
  var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
  if (boardTile.type === 'HealthWell') {
    return true;
  }
  });
  var distanceToHealthWell = healthWellStats.distance;
  var directionToHealthWell = healthWellStats.direction;
  

  if (myHero.health < 40) {
  //Heal no matter what if low health
  return directionToHealthWell;
  } else if (myHero.health < 100 && distanceToHealthWell === 1) {
  //Heal if you aren't full health and are close to a health well already
  return directionToHealthWell;
  } else {
  //If healthy, go capture a diamond mine!
  return helpers.findNearestNonTeamDiamondMine(gameData);
  }
};

//Makes a new game with a 5x5 board
var game = new Game(12);

//Add a health well in the middle of the board
game.addHealthWell(3,3);
game.addHealthWell(3,8);
game.addHealthWell(7,8);
game.addHealthWell(7,3);

//Add diamond mines on either side of the health well
game.addDiamondMine(0,5);
game.addDiamondMine(0,6);
game.addDiamondMine(5,5);
game.addDiamondMine(5,6);
game.addDiamondMine(9,5);
game.addDiamondMine(9,6);
game.addDiamondMine(11,5);
game.addDiamondMine(11,6);
game.addDiamondMine(5,0);
game.addDiamondMine(6,0);
game.addDiamondMine(5,11);
game.addDiamondMine(6,11);

// addImpassable
game.addImpassable(1,1);
game.addImpassable(1,2);
game.addImpassable(1,3);
game.addImpassable(1,4);
game.addImpassable(1,5);
game.addImpassable(1,6);
game.addImpassable(1,7);
game.addImpassable(1,8);
game.addImpassable(1,9);
game.addImpassable(1,10);
game.addImpassable(4,4);
game.addImpassable(4,7);
game.addImpassable(6,4);
game.addImpassable(6,7);
game.addImpassable(1,5);
game.addImpassable(1,6);
game.addImpassable(10,5);
game.addImpassable(10,6);
game.addImpassable(10,2);
game.addImpassable(10,3);
game.addImpassable(10,4);
game.addImpassable(10,5);
game.addImpassable(10,6);
game.addImpassable(10,7);
game.addImpassable(10,8);
game.addImpassable(10,9);
game.addImpassable(10,10);

//Add your hero in the top left corner of the map (team 0)
game.addHero(0, 0, 'MyHero', 0);

//Add an enemy hero in the bottom left corner of the map (team 1)
game.addHero(4, 3, 'Enemy', 1);
game.addHero(3, 6, 'Assassin', 1);
game.addHero(9, 2, 'Miner', 1);

console.log('About to start the game!  Here is what the board looks like:');

//You can run game.board.inspect() in this test code at any time
//to log out the current state of the board (keep in mind that in the actual
//game, the game object will not have any functions on it)
game.board.inspect();

//Play a very short practice game
var turnsToPlay = 150;

for (var i=0; i<turnsToPlay; i++) {
  var hero = game.activeHero;
  var direction;
  if (hero.name === 'MyHero') {

    //Ask your hero brain which way it wants to move
    direction = heroMoveFunction(game, helpers);

  } else if (hero.name === 'Assassin') {
    direction = carefulAssassin(game, helpers);

  } else if (hero.name === 'Miner') {
    direction = safeDiamondMiner(game, helpers);

  } else {
    direction = enemyMoveFunction(game, helpers);
  }
  console.log('-----');
  console.log('Turn ' + i + ':');
  console.log('-----');
  console.log(hero.name + ' tried to move ' + direction);
  console.log(hero.name + ' owns ' + hero.mineCount + ' diamond mines')
  console.log(hero.name + ' has ' + hero.health + ' health')
  game.handleHeroTurn(direction);
  game.board.inspect();
}