var helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = function(board, distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
helpers.getTileNearby = function(board, distanceFromTop, distanceFromLeft, direction) {

  // These are the X/Y coordinates
  var fromTopNew = distanceFromTop;
  var fromLeftNew = distanceFromLeft;

  // This associates the cardinal directions with an X or Y coordinate
  if (direction === 'North') {
    fromTopNew -= 1;
  } else if (direction === 'East') {
    fromLeftNew += 1;
  } else if (direction === 'South') {
    fromTopNew += 1;
  } else if (direction === 'West') {
    fromLeftNew -= 1;
  } else {
    return false;
  }

  // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
  if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
    return board.tiles[fromTopNew][fromLeftNew];
  } else {
    return false;
  }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function(board, fromTile, tileCallback) {
  // Storage queue to keep track of places the fromTile has been
  var queue = [];

  //Keeps track of places the fromTile has been for constant time lookup later
  var visited = {};

  // Variable assignments for fromTile's coordinates
  var dft = fromTile.distanceFromTop;
  var dfl = fromTile.distanceFromLeft;

  // Stores the coordinates, the direction fromTile is coming from, and it's location
  var visitInfo = [dft, dfl, 'None', 'START'];

  //Just a unique way of storing each location we've visited
  visited[dft + '|' + dfl] = true;

  // Push the starting tile on to the queue
  queue.push(visitInfo);

  // While the queue has a length
  while (queue.length > 0) {

    // Shift off first item in queue
    var coords = queue.shift();

    // Reset the coordinates to the shifted object's coordinates
    var dft = coords[0];
    var dfl = coords[1];

    // Loop through cardinal directions
    var directions = ['North', 'East', 'South', 'West'];
    for (var i = 0; i < directions.length; i++) {

      // For each of the cardinal directions get the next tile...
      var direction = directions[i];

      // ...Use the getTileNearby helper method to do this
      var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

      // If nextTile is a valid location to move...
      if (nextTile) {

        // Assign a key variable the nextTile's coordinates to put into our visited object later
        var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

        var isGoalTile = false;
        try {
          isGoalTile = tileCallback(nextTile);
        } catch(err) {
          isGoalTile = false;
        }

        // If we have visited this tile before
        if (visited.hasOwnProperty(key)) {

          //Do nothing--this tile has already been visited

        //Is this tile the one we want?
        } else if (isGoalTile) {

          // This variable will eventually hold the first direction we went on this path
          var correctDirection = direction;

          // This is the distance away from the final destination that will be incremented in a bit
          var distance = 1;

          // These are the coordinates of our target tileType
          var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

          // Loop back through path until we get to the start
          while (coords[3] !== 'START') {

            // Haven't found the start yet, so go to previous location
            correctDirection = coords[2];

            // We also need to increment the distance
            distance++;

            // And update the coords of our current path
            coords = coords[3];
          }

          //Return object with the following pertinent info
          return {
            object: nextTile,
            direction: correctDirection,
            distance: distance,
            coords: finalCoords
          };

          // If the tile is unoccupied, then we need to push it into our queue
        } else if (nextTile.type === 'Unoccupied') {

          queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

          // Give the visited object another key with the value we stored earlier
          visited[key] = true;
        }
      }
    }
  }

  // If we are blocked and there is no way to get where we want to go, return false
  return false;
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
helpers.findNearestNonTeamDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
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
  return pathInfoObject.direction;
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
helpers.findNearestNonTeamDiamondMineFromObject = function(hero, sourceObject, board) {
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
helpers.findNearestUnownedDiamondMine = function(gameData) {
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
  return pathInfoObject.direction;
};

// Returns the nearest unowned diamond mine or false, if there are no diamond mines
helpers.findNearestUnownedDiamondMineData = function(gameData) {
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
helpers.findNearestHealthWell = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
    return healthWellTile.type === 'HealthWell';
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWellData = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
    return healthWellTile.type === 'HealthWell';
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this description)
helpers.findNearestWeakerEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
  });

  //Return the direction that needs to be taken to achieve the goal
  //If no weaker enemy exists, will simply return undefined, which will
  //be interpreted as "Stay" by the game object
  return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile) {
    return heroTile.type === 'Hero' && heroTile.team === hero.team;
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};


// world is a 2d array of integers (eg world[10][15] = 0)
// pathStart and pathEnd are arrays like [5,10]
helpers.findPath = function (world, pathStart, pathEnd)
{
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
      if(myNode.value === mypathEnd.value)
      {
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
      }
      else // not the destination
      {
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
    return result;
  }

  // actually calculate the a-star path!
  // this returns an array of coordinates
  // that is empty if no path is possible
  return calculatePath();

} // end of findPath() function


module.exports = helpers;
