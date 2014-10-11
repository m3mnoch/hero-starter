var helpers = {};
var m3mnochBrain = {};

m3mnochBrain.myBase = []; // the coords of the healthwell base
m3mnochBrain.pathData = []; // just a 2-dimensional array for pathfinding calcs.  true x,y coords.


m3mnochBrain.log = function(str) {
	console.log(str);
};

m3mnochBrain.findBase = function(gameData) {
	// we really want a centralized health well.  wanna be in the mix the whole game.
	// so, not in the outer two tile lanes
	var nearestHealthWell = m3mnochBrain.findNearestHealthWellData(gameData);
	m3mnochBrain.myBase = nearestHealthWell.coords;

	return;
	

	var myHero = gameData.activeHero;
	
	var wellPath;
	var minTileEdge = 2;
	var maxTileEdge = 10;
	var wellDistance = 9999;

	for (var i=0; i< gameData.healthWells.length; i++) {
		if (gameData.healthWells[i].distanceFromLeft >= minTileEdge && gameData.healthWells[i].distanceFromLeft <= maxTileEdge && gameData.healthWells[i].distanceFromTop >= minTileEdge && gameData.healthWells[i].distanceFromTop <= maxTileEdge) {
			// this one is centralized
			wellPath = m3mnochBrain.findPath(m3mnochBrain.pathData, [myHero.distanceFromTop, myHero.distanceFromLeft], [gameData.healthWells[i].distanceFromTop, gameData.healthWells[i].distanceFromLeft]);

			if (wellDistance > wellPath.length) {
				m3mnochBrain.myBase = [gameData.healthWells[i].distanceFromTop, gameData.healthWells[i].distanceFromLeft];
				wellDistance = wellPath.length;
			}
		}
	}
};

m3mnochBrain.objectInTileRadius = function(sourceTile, destTile, radius) {
	var isInRadius = true;
	if (Math.abs(sourceTile.distanceFromTop - destTile.distanceFromTop) > radius) isInRadius = false;
	if (Math.abs(sourceTile.distanceFromLeft - destTile.distanceFromLeft) > radius) isInRadius = false;
	return isInRadius;
};

m3mnochBrain.objectNextToTile = function(sourceTile, destTile) {
	var isNextToTile = true;
	if (Math.abs(sourceTile.distanceFromTop - destTile.distanceFromTop) + Math.abs(sourceTile.distanceFromLeft - destTile.distanceFromLeft) != 1) isNextToTile = false;
	return isNextToTile;
};

m3mnochBrain.prepPathData = function(gameData) {
	m3mnochBrain.pathData = [];
	for (var i=0; i<gameData.board.lengthOfSide; i++) {
		m3mnochBrain.pathData[i] = [];
		for (var j=0; j<gameData.board.lengthOfSide; j++) {
			m3mnochBrain.pathData[i][j] = 0;
		}
	}

	// it's really irritating that all these coords are backwards -- as in: [y, x]
	for (var i=0; i< gameData.heroes.length; i++) {
		m3mnochBrain.pathData[gameData.heroes[i].distanceFromLeft][gameData.heroes[i].distanceFromTop] = 1;
	}
	for (var i=0; i< gameData.diamondMines.length; i++) {
		m3mnochBrain.pathData[gameData.diamondMines[i].distanceFromLeft][gameData.diamondMines[i].distanceFromTop] = 1;
	}
	for (var i=0; i< gameData.healthWells.length; i++) {
		m3mnochBrain.pathData[gameData.healthWells[i].distanceFromLeft][gameData.healthWells[i].distanceFromTop] = 1;
	}
	for (var i=0; i< gameData.impassables.length; i++) {
		m3mnochBrain.pathData[gameData.impassables[i].distanceFromLeft][gameData.impassables[i].distanceFromTop] = 1;
	}
};

// true x,y coords
m3mnochBrain.findDir = function(sourceCoords, destCoords) {
	var myDir = "stay";
	if (sourceCoords[0] < destCoords[0]) {
		myDir = "East";
	} else if (sourceCoords[0] > destCoords[0]) {
		myDir = "West";
	} else if (sourceCoords[1] < destCoords[1]) {
		myDir = "South";
	} else if (sourceCoords[1] > destCoords[1]) {
		myDir = "North";
	}
	return myDir;
};

// Returns the nearest non-team diamond mine or false, if there are no diamond mines
m3mnochBrain.findNearestNonTeamDiamondMineFromObject = function(hero, sourceObject, board) {
  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, sourceObject, function(mineTile) {
  	if (mineTile.type === 'DiamondMine') {
  		if (mineTile.owner) {
  			return mineTile.owner.team !== hero.team;
  		} else {
  			return true;
  		}
  	} else {
  		return false;
  	}
  }, board);

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject;
};


// Returns the nearest unowned diamond mine or false, if there are no diamond mines
m3mnochBrain.findNearestUnownedDiamondMineData = function(gameData) {
	var hero = gameData.activeHero;
	var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
  	if (mineTile.type === 'DiamondMine') {
  		if (mineTile.owner) {
  			return mineTile.owner.id !== hero.id;
  		} else {
  			return true;
  		}
  	} else {
  		return false;
  	}
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject;
};

// Returns the nearest health well or false, if there are no health wells
m3mnochBrain.findNearestHealthWellData = function(gameData) {
	var hero = gameData.activeHero;
	var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
  	return healthWellTile.type === 'HealthWell';
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject;
};

// world is a 2d array of integers (eg world[10][15] = 0)
// pathStart and pathEnd are arrays like [5,10]
// returns an array of true coords.
m3mnochBrain.findPath = function (world, backwardsCoordsStart, backwardsCoordsEnd)
{
  // fixing the backwards coords.
  var pathStart = [backwardsCoordsStart[1],backwardsCoordsStart[0]];
  var pathEnd = [backwardsCoordsEnd[1],backwardsCoordsEnd[0]];

  //m3mnochBrain.log("pathStart: " + pathStart);
  //m3mnochBrain.log("pathEnd: " + pathEnd);

  // shortcuts for speed
  var abs = Math.abs;
  var max = Math.max;
  var pow = Math.pow;
  var sqrt = Math.sqrt;

  // the world data are integers:
  // anything higher than this number is considered blocked
  // this is handy is you use numbered sprites, more than one
  // of which is walkable road, grass, mud, etc
  var maxWalkableTileNum = 0;

  // keep track of the world dimensions
	// Note that this A-star implementation expects the world array to be square: 
  // it must have equal height and width. If your game world is rectangular, 
  // just fill the array with dummy values to pad the empty space.
  var worldWidth = world[0].length;
  var worldHeight = world.length;
  var worldSize = worldWidth * worldHeight;

  //m3mnochBrain.log("worldSize: " + worldSize);

  // which heuristic should we use?
  // default: no diagonals (Manhattan)
  var distanceFunction = ManhattanDistance;
  var findNeighbours = function(){}; // empty

  // distanceFunction functions
  // these return how far away a point is to another

  function ManhattanDistance(Point, Goal)
  { // linear movement - no diagonals - just cardinal directions (NSEW)
  	return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
  }

  function DiagonalDistance(Point, Goal)
  { // diagonal movement - assumes diag dist is 1, same as cardinals
  	return max(abs(Point.x - Goal.x), abs(Point.y - Goal.y));
  }

  function EuclideanDistance(Point, Goal)
  { // diagonals are considered a little farther than cardinal directions
	// diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
	// where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
	return sqrt(pow(Point.x - Goal.x, 2) + pow(Point.y - Goal.y, 2));
}

  // Neighbours functions, used by findNeighbours function
  // to locate adjacent available cells that aren't blocked

  // Returns every available North, South, East or West
  // cell that is empty. No diagonals,
  // unless distanceFunction function is not Manhattan
  function Neighbours(x, y)
  {
  	var N = y - 1,
  	S = y + 1,
  	E = x + 1,
  	W = x - 1,
  	myN = N > -1 && canWalkHere(x, N),
  	myS = S < worldHeight && canWalkHere(x, S),
  	myE = E < worldWidth && canWalkHere(E, y),
  	myW = W > -1 && canWalkHere(W, y),
  	result = [];
  	if(myN)
  		result.push({x:x, y:N});
  	if(myE)
  		result.push({x:E, y:y});
  	if(myS)
  		result.push({x:x, y:S});
  	if(myW)
  		result.push({x:W, y:y});
  	findNeighbours(myN, myS, myE, myW, N, S, E, W, result);
  	return result;
  }

  // returns every available North East, South East,
  // South West or North West cell - no squeezing through
  // "cracks" between two diagonals
  function DiagonalNeighbours(myN, myS, myE, myW, N, S, E, W, result)
  {
  	if(myN)
  	{
  		if(myE && canWalkHere(E, N))
  			result.push({x:E, y:N});
  		if(myW && canWalkHere(W, N))
  			result.push({x:W, y:N});
  	}
  	if(myS)
  	{
  		if(myE && canWalkHere(E, S))
  			result.push({x:E, y:S});
  		if(myW && canWalkHere(W, S))
  			result.push({x:W, y:S});
  	}
  }

  // returns every available North East, South East,
  // South West or North West cell including the times that
  // you would be squeezing through a "crack"
  function DiagonalNeighboursFree(myN, myS, myE, myW, N, S, E, W, result)
  {
  	myN = N > -1;
  	myS = S < worldHeight;
  	myE = E < worldWidth;
  	myW = W > -1;
  	if(myE)
  	{
  		if(myN && canWalkHere(E, N))
  			result.push({x:E, y:N});
  		if(myS && canWalkHere(E, S))
  			result.push({x:E, y:S});
  	}
  	if(myW)
  	{
  		if(myN && canWalkHere(W, N))
  			result.push({x:W, y:N});
  		if(myS && canWalkHere(W, S))
  			result.push({x:W, y:S});
  	}
  }

  // returns boolean value (world cell is available and open)
  function canWalkHere(x, y)
  {
  	return ((world[x] != null) &&
  		(world[x][y] != null) &&
  		(world[x][y] <= maxWalkableTileNum));
  };

	// Node function, returns a new object with Node properties
	// Used in the calculatePath function to store route costs, etc.
	function Node(Parent, Point)
	{
		var newNode = {
			// pointer to another Node object
			Parent:Parent,
			// array index of this Node in the world linear array
			value:Point.x + (Point.y * worldWidth),
			// the location coordinates of this Node
			x:Point.x,
			y:Point.y,
			// the heuristic estimated cost
			// of an entire path using this node
			f:0,
			// the distanceFunction cost to get
			// from the starting point to this node
			g:0
		};

		return newNode;
	}

	if (world[pathEnd[0]][pathEnd[1]] == 1) {
		// the spot we're looking to travel is occupied.  we're just going
		// to find the closest unoccupied spot.  well, good enough anyway.
		var tileNeighbors = Neighbours(pathEnd[0], pathEnd[1]);
		for (var i=0; i< tileNeighbors.length; i++) {
			tileNeighbors[i].dist = ManhattanDistance(tileNeighbors[i], {x:pathStart[0], y:pathStart[1]});
		}

		if (tileNeighbors.length > 0) {
			var newTileLoc = tileNeighbors[0];
			for (var i=1; i< tileNeighbors.length; i++) {
				if (tileNeighbors[i].dist < newTileLoc.dist) newTileLoc = tileNeighbors[i];
			}
			pathEnd[0] = newTileLoc.x;
			pathEnd[1] = newTileLoc.y;
		}
	}


	// Path function, executes AStar algorithm operations
	function calculatePath()
	{
		// create Nodes from the Start and End x,y coordinates
		var mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]});
		var mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]});
		// create an array that will contain all world cells
		var AStar = new Array(worldSize);
		// list of currently open Nodes
		var Open = [mypathStart];
		// list of closed Nodes
		var Closed = [];
		// list of the final output array
		var result = [];
		// reference to a Node (that is nearby)
		var myNeighbours;
		// reference to a Node (that we are considering now)
		var myNode;
		// reference to a Node (that starts a path in question)
		var myPath;
		// temp integer variables used in the calculations
		var length, max, min, i, j;
		// iterate through the open list until none are left
		while(length = Open.length)
		{
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			// grab the next node and remove it from Open array
			myNode = Open.splice(min, 1)[0];
			// is it the destination node?

			//m3mnochBrain.log("myNode.value: " + myNode.value + " | mypathEnd.value: " + mypathEnd.value);

			if(myNode.value === mypathEnd.value)
			{
				//m3mnochBrain.log("chopping down the final path node.");
				myPath = Closed[Closed.push(myNode) - 1];
				do
				{
					result.push([myPath.x, myPath.y]);
				}
				while (myPath = myPath.Parent);
				// clear the working arrays
				AStar = Closed = Open = [];
				// we want to return start to finish
				result.reverse();

				// chop off the first one since that's the one you're standing on.
				result.splice(0, 1);
			}
			else // not the destination
			{
				//m3mnochBrain.log("non-final path node: " + myNode.value);

				// find which nearby nodes are walkable
				myNeighbours = Neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i]);
					if (!AStar[myPath.value])
					{
						// estimated cost of this particular route so far
						myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						Open.push(myPath);
						// mark this node in the world graph as visited
						AStar[myPath.value] = true;

					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			}
		} // keep iterating until the Open list is empty

		//m3mnochBrain.log("result!: " + result);

		return result;
	}

	// actually calculate the a-star path!
	// this returns an array of coordinates
	// that is empty if no path is possible
	return calculatePath();

} // end of findPath() function


var move = function(gameData, jsbHelpers) {
	helpers = jsbHelpers;

	var myHero = gameData.activeHero;
	if (myHero.enemies === undefined) {
		myHero.enemies = {};
		myHero.myCurrentEnemy = "";
		//m3mnochBrain.log("created enemy tracker");
	}

	// default priority is diamond hunting
	var currentPriority = helpers.findNearestNonTeamDiamondMine(gameData);
	var priorities = {
		enemy:"stay",
		health:"stay",
		intercept:"stay",
		diamond: currentPriority
	}

	m3mnochBrain.prepPathData(gameData);
	m3mnochBrain.findBase(gameData);

	// are we hurt?
	var painThreshold = 41;

	// always heal if we're hurt badly.
	if (myHero.health < painThreshold) {
		priorities.health = helpers.findNearestHealthWell(gameData);

	// if we're hurt AND next to the well, just fill 'er up!
	} else if (myHero.health < 100 && m3mnochBrain.objectNextToTile({distanceFromLeft:m3mnochBrain.myBase[1],distanceFromTop:m3mnochBrain.myBase[0]}, myHero)){
		priorities.health = helpers.findNearestHealthWell(gameData);
	}

	var myPath = [];
	if (m3mnochBrain.myBase !== undefined && m3mnochBrain.myBase.length > 0) {
		myPath = m3mnochBrain.findPath(m3mnochBrain.pathData, [myHero.distanceFromTop, myHero.distanceFromLeft], m3mnochBrain.myBase);
	}

	var enemyPath = [];
	var enemyPathTurnCount = 5; // we only care about them if they can get to our base within 5 turns.

	// see if i can beat the badguys who might push up on my well, yo.
	for (var i=0; i< gameData.heroes.length; i++) {
		if (gameData.heroes[i].team !== myHero.team) {
			var worthMyTime = true;

			if (myHero.enemies[gameData.heroes[i].name] === undefined) {
				m3mnochBrain.log('tracking enemy: ' + gameData.heroes[i].name);
				myHero.enemies[gameData.heroes[i].name] = {lastX:-1,lastY:-1,chasing:false};
			}

			// avoid jerks who just sit there and heal.
			if (myHero.enemies[gameData.heroes[i].name].lastX == gameData.heroes[i].distanceFromLeft && myHero.enemies[gameData.heroes[i].name].lastY == gameData.heroes[i].distanceFromTop) {
				// they've not moved and are sitting next to my well.
				if (m3mnochBrain.objectNextToTile({distanceFromLeft:m3mnochBrain.myBase[1],distanceFromTop:m3mnochBrain.myBase[0]}, gameData.heroes[i])) {
					worthMyTime = false;
				}
			}

			if (gameData.heroes[i].dead) {
				if (myHero.myCurrentEnemy == gameData.heroes[i].name) {
					myHero.enemies[gameData.heroes[i].name].chasing = false;
					myHero.myCurrentEnemy = "";
				}
				worthMyTime = false;
			}

			
			if (worthMyTime) {
				enemyPreviousPath = m3mnochBrain.findPath(m3mnochBrain.pathData, [myHero.enemies[gameData.heroes[i].name].lastY, myHero.enemies[gameData.heroes[i].name].lastX], m3mnochBrain.myBase);
				enemyCurrentPath = m3mnochBrain.findPath(m3mnochBrain.pathData, [gameData.heroes[i].distanceFromTop, gameData.heroes[i].distanceFromLeft], m3mnochBrain.myBase);
				//m3mnochBrain.log('enemy path nodes: ' + enemyCurrentPath.length);

				if (enemyCurrentPath.length > 0 && enemyCurrentPath.length < enemyPathTurnCount) {
					// closest badguy!  see if we can get there in time.
					enemyPathTurnCount = enemyCurrentPath.length;

					var enemyBackwardsPathDest = [enemyCurrentPath[enemyCurrentPath.length - 1][1], enemyCurrentPath[enemyCurrentPath.length - 1][0]];
					//m3mnochBrain.log('enemy assumed path target: ' + enemyBackwardsPathDest);
					myPath = m3mnochBrain.findPath(m3mnochBrain.pathData, [myHero.distanceFromTop, myHero.distanceFromLeft], enemyBackwardsPathDest);

					myHero.myCurrentEnemy = gameData.heroes[i].name;

					if (myPath.length > 0 && !myHero.enemies[gameData.heroes[i].name].chasing) {
						priorities.intercept = m3mnochBrain.findDir([myHero.distanceFromLeft, myHero.distanceFromTop], myPath[0]);
						m3mnochBrain.log('moving to intercept: ' + myHero.myCurrentEnemy);
					} else {
						myHero.enemies[gameData.heroes[i].name].chasing = true;
						priorities.enemy = helpers.findNearestEnemy(gameData);
						m3mnochBrain.log('chasing: ' + myHero.myCurrentEnemy);
					}

					// it's a badguy!  and he's right next to me!  nuke him!
					if (m3mnochBrain.objectNextToTile(myHero, gameData.heroes[i]) && !gameData.heroes[i].dead) {
						priorities.enemy = helpers.findNearestEnemy(gameData);
					}
				}
			}

			myHero.enemies[gameData.heroes[i].name].lastX = gameData.heroes[i].distanceFromLeft;
			myHero.enemies[gameData.heroes[i].name].lastY = gameData.heroes[i].distanceFromTop;
		}
	}

	// if i'm hurt at all and don't have any badguys to fight, heal up, yo.
	if (priorities.enemy == "stay" && priorities.intercept == "stay" && myHero.health < 100) {
		priorities.health = helpers.findNearestHealthWell(gameData);
	}


	var myDir = "stay";

	m3mnochBrain.log("--- STATS ---");
	if (myHero.myCurrentEnemy != "") m3mnochBrain.log("myHero.myCurrentEnemy: " + myHero.myCurrentEnemy + ", " + myHero.enemies[myHero.myCurrentEnemy].chasing);
	m3mnochBrain.log("diamondsEarned: " + myHero.diamondsEarned);
	m3mnochBrain.log("damageDone: " + myHero.damageDone);
	m3mnochBrain.log("heroesKilled: " + myHero.heroesKilled.length);
	m3mnochBrain.log("gravesRobbed: " + myHero.gravesRobbed);

	if (priorities.health != "stay") {
		m3mnochBrain.log("priority: HEALTH");
		myDir = priorities.health;

	} else if (priorities.enemy != "stay") {
		m3mnochBrain.log("priority: ENEMY");
		myDir = priorities.enemy;

	} else if (priorities.intercept != "stay") {
		m3mnochBrain.log("priority: INTERCEPT");
		myDir = priorities.intercept;

	} else if (priorities.diamond != "stay") {
		m3mnochBrain.log("priority: DIAMOND");
		myDir = priorities.diamond;
	}

	// just because i hate uncertainty.
	if (myDir === undefined) {
		m3mnochBrain.log("dude!  i'm hemmed in!  gtfotw!");
		myDir = "stay";
	}

	return myDir;
};

// Export the move function here
module.exports = move;
