/* 

  The only function that is required in this file is the "move" function

  You MUST export the move function, in order for your code to run
  So, at the bottom of this code, keep the line that says:

  module.exports = move;

  The "move" function must return "North", "South", "East", "West", or "Stay"
  (Anything else will be interpreted by the game as "Stay")
  
  The "move" function should accept two arguments that the website will be passing in: 
	- a "gameData" object which holds all information about the current state
	  of the battle

	- a "helpers" object, which contains useful helper functions
	  - check out the helpers.js file to see what is available to you

	(the details of these objects can be found on javascriptbattle.com/rules)

  This file contains four example heroes that you can use as is, adapt, or
  take ideas from and implement your own version. Simply uncomment your desired
  hero and see what happens in tomorrow's battle!

  Such is the power of Javascript!!!

*/

//TL;DR: If you are new, just uncomment the 'move' function that you think sounds like fun!
//       (and comment out all the other move functions)


// // The "Northerner"
// // This hero will walk North.  Always.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   return 'North';
// };

// // The "Blind Man"
// // This hero will walk in a random direction each turn.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   var choices = ['North', 'South', 'East', 'West'];
//   return choices[Math.floor(Math.random()*4)];
// };

// // The "Priest"
// // This hero will heal nearby friendly champions.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 60) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestTeamMember(gameData);
//   }
// };

// // The "Unwise Assassin"
// // This hero will attempt to kill the closest enemy hero. No matter what.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 30) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestEnemy(gameData);
//   }
// };

// // The "Careful Assassin"
// // This hero will attempt to kill the closest weaker enemy hero.
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;
//   if (myHero.health < 50) {
//     return helpers.findNearestHealthWell(gameData);
//   } else {
//     return helpers.findNearestWeakerEnemy(gameData);
//   }
// };

/*
// // The "Safe Diamond Miner"
var move = function(gameData, helpers) {
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
*/

// // The "Selfish Diamond Miner"
// // This hero will attempt to capture diamond mines (even those owned by teammates).
// var move = function(gameData, helpers) {
//   var myHero = gameData.activeHero;

//   //Get stats on the nearest health well
//   var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function(boardTile) {
//     if (boardTile.type === 'HealthWell') {
//       return true;
//     }
//   });

//   var distanceToHealthWell = healthWellStats.distance;
//   var directionToHealthWell = healthWellStats.direction;

//   if (myHero.health < 40) {
//     //Heal no matter what if low health
//     return directionToHealthWell;
//   } else if (myHero.health < 100 && distanceToHealthWell === 1) {
//     //Heal if you aren't full health and are close to a health well already
//     return directionToHealthWell;
//   } else {
//     //If healthy, go capture a diamond mine!
//     return helpers.findNearestUnownedDiamondMine(gameData);
//   }
// };

// // The "Coward"
// // This hero will try really hard not to die.
// var move = function(gameData, helpers) {
//   return helpers.findNearestHealthWell(gameData);
// }

var move = function(gameData, helpers) {
	var myHero = gameData.activeHero;
	if (myHero.enemies === undefined) {
		myHero.enemies = {};
		myHero.myCurrentEnemy = "";
		console.log("created enemy tracker");
	}

	// default priority is diamond hunting
	var currentPriority = helpers.findNearestNonTeamDiamondMine(gameData);
	var priorities = {
		enemy:"stay",
		health:"stay",
		intercept:"stay",
		diamond: currentPriority
	}

	// are we hurt?
	var painThreshold = 41;

	// always heal if we're hurt badly.
	if (myHero.health < painThreshold) {
		priorities.health = helpers.findNearestHealthWell(gameData);

	// if we're hurt AND next to the well, just fill 'er up!
	} else if (myHero.health < 100 && helpers.objectNextToTile({distanceFromLeft:helpers.myBase[1],distanceFromTop:helpers.myBase[0]}, myHero)){
		priorities.health = helpers.findNearestHealthWell(gameData);

	}
	

	helpers.prepPathData(gameData);
	helpers.findBase(gameData);

	var myPath = helpers.findPath(helpers.pathData, [myHero.distanceFromTop, myHero.distanceFromLeft], helpers.myBase);
	for (var i=0; i< myPath.length; i++) {
		//console.log('--- node: (' + myPath[i][0] + "," + myPath[i][1] + ")");
	}

	var enemyPath = [];
	var enemyPathTurnCount = 5; // we only care about them if they can get to our base within 5 turns.

	// see if i can beat the badguys who might push up on my well, yo.
	for (var i=0; i< gameData.heroes.length; i++) {
		if (gameData.heroes[i].team !== myHero.team) {
			var worthMyTime = true;

			if (myHero.enemies[gameData.heroes[i].name] === undefined) {
				console.log('tracking enemy: ' + gameData.heroes[i].name);
				myHero.enemies[gameData.heroes[i].name] = {lastX:-1,lastY:-1};
			}

			// avoid jerks who just sit there and heal.
			if (myHero.enemies[gameData.heroes[i].name].lastX == gameData.heroes[i].distanceFromLeft && myHero.enemies[gameData.heroes[i].name].lastY == gameData.heroes[i].distanceFromTop) {
				// they've not moved and are sitting next to my well.
				if (helpers.objectNextToTile({distanceFromLeft:helpers.myBase[1],distanceFromTop:helpers.myBase[0]}, gameData.heroes[i])) {
					worthMyTime = false;
				}
			}
			
			if (worthMyTime) {
				enemyPreviousPath = helpers.findPath(helpers.pathData, [myHero.enemies[gameData.heroes[i].name].lastY, myHero.enemies[gameData.heroes[i].name].lastX], helpers.myBase);
				enemyCurrentPath = helpers.findPath(helpers.pathData, [gameData.heroes[i].distanceFromTop, gameData.heroes[i].distanceFromLeft], helpers.myBase);
				console.log('enemy path nodes: ' + enemyCurrentPath.length);

				if (enemyCurrentPath.length > 0 && enemyCurrentPath.length < enemyPathTurnCount) {
					// closest badguy!  see if we can get there in time.
					enemyPathTurnCount = enemyCurrentPath.length;

					var enemyBackwardsPathDest = [enemyCurrentPath[enemyCurrentPath.length - 1][1], enemyCurrentPath[enemyCurrentPath.length - 1][0]];
					console.log('enemy assumed path target: ' + enemyBackwardsPathDest);
					myPath = helpers.findPath(helpers.pathData, [myHero.distanceFromTop, myHero.distanceFromLeft], enemyBackwardsPathDest);

					myHero.myCurrentEnemy = gameData.heroes[i].name;
					priorities.intercept = helpers.findDir([myHero.distanceFromLeft, myHero.distanceFromTop], myPath[0]);

					// it's a badguy!  and he's right next to me!  nuke him!
					if (helpers.objectNextToTile(myHero, gameData.heroes[i]) && !gameData.heroes[i].dead) {
						priorities.enemy = helpers.findNearestEnemy(gameData);
					}
				}
			}

			myHero.enemies[gameData.heroes[i].name].lastX = gameData.heroes[i].distanceFromLeft;
			myHero.enemies[gameData.heroes[i].name].lastY = gameData.heroes[i].distanceFromTop;
		}
	}

/*
	var myDir = "stay";
	if (myPath.length > 0) {
		myDir = helpers.findDir([myHero.distanceFromLeft, myHero.distanceFromTop], myPath[0]);
	}
*/




/*
	var myTargetWellData = helpers.findNearestHealthWellData(gameData);
	var myTargetDiamondMineData = helpers.findNearestUnownedDiamondMineData(gameData);
	var targetDiamondMineDist = 99999;
	for (var i=0; i< gameData.healthWells.length; i++) {
		var testDiamondMine = helpers.findNearestNonTeamDiamondMineFromObject(myHero, gameData.healthWells[i], gameData.board);
		if (testDiamondMine.distance < targetDiamondMineDist) {
			targetDiamondMineDist = testDiamondMine.distance;
			myTargetWellData = gameData.healthWells[i];
			myTargetDiamondMineData = testDiamondMine;
		}
	}
*/

	/*
	console.log('====================');
	console.log('targetWell: ' + myTargetWellData.distanceFromTop + ',' + myTargetWellData.distanceFromLeft);
	console.log('targetMine: ' + myTargetDiamondMineData.coords);
	console.log('====================');
	*/
	//return "stay";

/*
	// danger!
	if (myHero.health < painThreshold) {
		return helpers.findNearestHealthWell(gameData);

	// always at least try to beat someone up.
	} else if (myDir == "stay") {
		var myDir = helpers.findNearestEnemy(gameData);
	}
*/
	
	var myDir = "stay";

	if (priorities.health != "stay") {
		console.log("--- priority: HEALTH");
		myDir = priorities.health;

	} else if (priorities.enemy != "stay") {
		console.log("--- priority: ENEMY");
		myDir = priorities.enemy;

	} else if (priorities.intercept != "stay") {
		console.log("--- priority: INTERCEPT");
		myDir = priorities.intercept;

	} else if (priorities.diamond != "stay") {
		console.log("--- priority: DIAMOND");
		myDir = priorities.diamond;
	}

	return myDir;
};

// Export the move function here
module.exports = move;
