// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/*---------------------------------------------------------------------*\
| *  REDManager Behavior Class                                          |
| ------                                                                |
|    The REDManager Behavior Class                                      |
\*---------------------------------------------------------------------*/
cr.behaviors.REDManager = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDManager.prototype;

	/*---------------------------------------------------------------------*\
	| *  Create Behavior Type                                               |
	| ------                                                                |
	|    Creates and sets the behavior's base type information.             |
	\*---------------------------------------------------------------------*/
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};

	var behtypeProto = behaviorProto.Type.prototype;

	/*---------------------------------------------------------------------*\
	| *  On Behavior Created                                                |
	| ------                                                                |
	|    Called when the behavior is created.                               |
	\*---------------------------------------------------------------------*/
	behtypeProto.onCreate = function()
	{
	};

	/*---------------------------------------------------------------------*\
	| *  Object Instance                                                    |
	| ------                                                                |
	|    Called when an instance of the object is created.                  |
	\*---------------------------------------------------------------------*/
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;	// associated object instance to modify
		this.runtime = type.runtime;

		this.layoutAngle = 0;
		this.dataArray = null;
		this.paused = false;
		this.esckey = false;
		this.lastesctick = -1;
		this.players = {};
		this.goals = 0;
		this.exiting = false;
		this.bars = 0;
		this.orange = 0;
		this.spikes = 0;
		this.coins = 0;
		this.lastDt = this.runtime.getDt(this.inst);
		this.firstOrange = false;
		this.playerKilled = false;
	};

	var behinstProto = behaviorProto.Instance.prototype;

	/*---------------------------------------------------------------------*\
	| *  On Object Creation                                                 |
	| ------                                                                |
	|    Called when the object is initialized. Deals with the defaulting   |
	|  of certain values, as well as other things, like binding keys.       |
	\*---------------------------------------------------------------------*/
	behinstProto.onCreate = function()
	{
		this.exiting = false;
		this.placed = false;
		this.esckey = false;
		this.lastesctick = -1;
		this.firstPlayer = false;
		this.playerKilled = false;

		jQuery(document).keydown(
			(function (self)
			{
				return function(info)
				{
					self.onKeyDown(info);
				};
			}
			)(this)
		);

		jQuery(document).keyup(
			(function (self)
			{
				return function(info)
				{
					self.onKeyUp(info);
				};
			}
			)(this)
		);

		this.players.players = new Array();
	};

	/*---------------------------------------------------------------------*\
	| *  On Key Pressed                                                     |
	| ------                                                                |
	|    Called when a key is pressed. If the key is the escape key, and    |
	|  the key was not released this frame, will set the appropriate flag.  |
	|  This flag is used to determine when to pause or unpause the game.    |
	\*---------------------------------------------------------------------*/
	behinstProto.onKeyDown = function (info)
	{	
		var tickcount = this.runtime.tickcount;

		if(info.keyCode != 27)
			return;

		info.preventDefault();

		if (this.lastesctick < tickcount)
			this.esckey = true;
	};

	/*---------------------------------------------------------------------*\
	| *  On Key Released                                                    |
	| ------                                                                |
	|    Called when a key is released. If the key is the escape key, this  |
	|  will set the appropriate flag. This flag is used to determine when   |
	|  to pause or unpause the game.                                        |
	\*---------------------------------------------------------------------*/
	behinstProto.onKeyUp = function (info)
	{
		var tickcount = this.runtime.tickcount;

		if(info.keyCode != 27)
			return;

		info.preventDefault();
		this.esckey = false;
		this.lastesctick = tickcount;
	};

	/*---------------------------------------------------------------------*\
	| *  Tick Function                                                      |
	| ------                                                                |
	|    Called once per tick. Can affect both framerate and processing     |
	|  time drastically if too much code is processed.                      |
	\*---------------------------------------------------------------------*/
	behinstProto.tick = function ()
	{

		if (this.dataArray != null)
		{
			this.paused = this.isPaused();
		}
		else
			return;

		if (this.paused && this.esckey)
		{
			this.setPaused(0);
			this.paused = false;
			this.esckey = false;
		}

		if (this.paused)
			return;

		if (this.esckey)
		{
			this.setPaused(1);
			this.paused = true;
			this.esckey = false;
			return;
		}

		this.checkLifeCount();
		this.updateRevivalCooldown();
		this.updateLevel();

		var zoom = 1.0;

		var firstX = -100;
		var firstY = -100;

		for(var i = 0; i < this.players.players.length; i += 1)
		{
			var instance = this.players.players[i].instances[0];

			if(typeof instance == 'undefined')
				continue;

			var playerNum = 0;
			var behInstance = 0;

			for(var i2 = 0; i2 < instance.behavior_insts.length; i2 += 1)
			{
				if(playerNum == 0)
					behInstance = instance.behavior_insts[i2];

				if(typeof behInstance.playerNumber != 'undefined')
				{
					playerNum = behInstance.playerNumber;
					break;
				}
			}

			if(playerNum == 0)
				continue;

			this.playerKilled = false;

			if(this.getPlayerLives(playerNum) <= 0)
			{
				this.runtime.DestroyInstance(instance)
				continue;
			}

			if(firstX == -100 && firstY == -100)
			{
				firstX = instance.x;
				firstY = instance.y;
			}

			zoom = this.calculateZoom(firstX, firstY, zoom, instance);

			this.resizePlayers(instance);
			this.handleCoins(instance, playerNum);
			this.handleGoals(instance, behInstance);
			this.handleOrange(instance, playerNum);

		}

		this.setMapZoom(zoom);
	};

	/*---------------------------------------------------------------------*\
	| *  Check Total Remaining Lives                                        |
	| ------                                                                |
	|    Called once per tick. This function checks the players' total      |
	|  remaining lives. If the total is zero or less, the game resets to    |
	|  the title.                                                           |
	\*---------------------------------------------------------------------*/
	behinstProto.checkLifeCount = function ()
	{
		if(this.getPlayerLives(1) > 0)
			return;

		if(this.getPlayerLives(2) > 0)
			return;

		if(this.getPlayerLives(3) > 0)
			return;

		if(this.getPlayerLives(4) > 0)
			return;

		this.resetDataArray();
		this.setNextLayout("Title");
	};

	/*---------------------------------------------------------------------*\
	| *  Update Revival Cooldown                                            |
	| ------                                                                |
	|    Called once per tick. This function checks the players' current    |
	|  experience and updates their level accordingly.                      |
	\*---------------------------------------------------------------------*/
	behinstProto.updateRevivalCooldown = function ()
	{
		var dt = this.runtime.getDt(this.inst);
		var dtDiff = dt - this.lastDt;
		this.lastDt = dt;

		if (this.isRevivalActive())
		{
			var newValue = this.getRevivalCooldown - dtDiff;
			this.setRevivalCooldown(newValue);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Update Player Level                                                |
	| ------                                                                |
	|    Called once per tick. This function checks the players' current    |
	|  experience and updates their level accordingly.                      |
	\*---------------------------------------------------------------------*/
	behinstProto.updateLevel = function ()
	{
		var expMult = this.getExperienceMultiplier();
		var level = this.getPlayerLevel();
		var currentExp = this.getPlayerExperience();

		if ((expMult * level) <= currentExp)
		{
			this.setPlayerExperience(currentExp - (expMult * level));
			this.setPlayerLevel(level + 1);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Calculate Zoom                                                     |
	| ------                                                                |
	|    Called once per player, per tick, with the exception of the first  |
	|  player processed. Calculates the necessary layout scale to display   |
	| the player instance passed in along with the specified coordinates.   |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * x:        The x-coordinate of the first player processed during  |
	|                this tick.                                             |
	|    * y:        The y-coordinate of the first player processed during  |
	|                this tick.                                             |
	|    * zoom:     The currently necessary zoom. If this player requires  |
	|                the game to zoom further out, a new value will be      |
	|                returned. Otherwise, this value will be returned.      |
	|    * instance: The player instance that is currently being processed. |
	\*---------------------------------------------------------------------*/
	behinstProto.calculateZoom = function (x, y, zoom, instance)
	{
		if(x == instance.x && y == instance.y)
			return zoom;

		var tempZoom = 1.0;

		var thisX = instance.x;
		var thisY = instance.y;

		var squareX = Math.pow((thisX - x), 2);
		var squareY = Math.pow((thisY - y), 2);

		var distance = Math.sqrt(squareX + squareY);

		if (distance > 500)
			tempZoom = (1.0/(0.002 * distance));

		return (tempZoom < zoom) ? tempZoom : zoom;
	};

	/*---------------------------------------------------------------------*\
	| *  Resize Players                                                     |
	| ------                                                                |
	|    Called once per player, per tick. This function shrinks the player |
	|  from the size they start at to normal size, as a visual cue to help  |
	|  players find their characters.                                       |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance: The player instance that is currently being processed. |
	\*---------------------------------------------------------------------*/
	behinstProto.resizePlayers = function (instance)
	{
		if (instance.width > 16 || instance.height > 16)
		{
			instance.width -= 4;
			instance.height = instance.width;
			instance.set_bbox_changed();

			if(instance.width <= 16)
			{
				this.setUnloadedPlayerCount(this.getUnloadedPlayerCount() - 1);
			}
		}
		else if (instance.width < 16 || instance.height < 16)
		{
			instance.width = 16;
			instance.height = instance.width;
			instance.set_bbox_changed();
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Process Coin Treasure Objects                                      |
	| ------                                                                |
	|    Called once per player, per tick. This function deals with all     |
	|  processing related to the Coin treasure objects. Currently, it deals |
	|  with checking for collision between the players and coins, though in |
	|  the future more may be involved.                                     |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance:  The player instance that is currently being           |
	|                 processed.                                            |
	|    * playerNum: The player number of the currently processing player  |
	|                 instance.                                             |
	\*---------------------------------------------------------------------*/
	behinstProto.handleCoins = function(instance, playerNum)
	{
		if (!this.arePlayersLoaded())
			return;

		if(playerNum == 0)
			return;

		for(var i = 0; i < this.coins.instances.length; i += 1)
		{
			var coin = this.coins.instances[i];

			if(typeof coin == 'undefined')
				continue;

			var collision = this.runtime.testOverlap(instance, coin)

			if(!collision)
				continue;

			this.setPlayerCoins(playerNum, this.getPlayerCoins(playerNum) + 1);
			this.setMapCoins(this.getMapCoins() - 1);
			this.playSound("normal");
			this.runtime.DestroyInstance(coin);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Process Exit Tiles                                                 |
	| ------                                                                |
	|    Called once per player, per tick. This function deals with all     |
	|  processing related to the Exit tiles. Thus, it deals with changing   |
	|  the currently loaded map when necessary, placing the players on a    |
	|  newly loaded map, and removing any players placed on a newly loaded  |
	|  map that have died and not yet respawned.                            |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance: The player instance that is currently being processed. |
	|    * behInst:  The behavior instance that contains the information    |
	|                regarding the currently processing player.             |
	\*---------------------------------------------------------------------*/
	behinstProto.handleGoals = function(instance, behInst)
	{
		if(this.goals == 0)
			return;

		if(!this.isLayoutLoaded())
			return;

		if(behInst.playerNumber == 0)
			return;

		var direction = 0;
		var directions = [0, 0, 0, 0];
		var onExit = this.exiting;
		var anyExiting = false;

		for (var i = 0; i < this.goals.instances.length; i += 1)
		{
			var goal = this.goals.instances[i];

			if(typeof goal == 'undefined')
				continue;

			if(typeof goal.behavior_insts[0] == 'undefined')
				continue;

			if(typeof goal.behavior_insts[0].direction == 'undefined')
				continue;

			direction = goal.behavior_insts[0].direction;

			directions[direction] += 1;

			var coll = this.runtime.testOverlap(instance, goal);

			var exits = this.updateExits(coll, direction, onExit, behInst);

			if(exits != -1)
				onExit = exits;

			if(exits == true)
				anyExiting = true;

			if(this.selectMap())
				return;

			var result = this.handlePlayerLoad(goal, directions, instance, behInst);
			if(result != -1)
				break;

			if(!this.arePlayersLoaded())
				continue;

			if(anyExiting || this.exiting)
				continue;

			if (this.getPlayerDirection(1) != -1)
				this.setPlayerDirection(1, -1);

			if (this.getPlayerDirection(2) != -1)
				this.setPlayerDirection(2, -1);

			if (this.getPlayerDirection(3) != -1)
				this.setPlayerDirection(3, -1);

			if (this.getPlayerDirection(4) != -1)
				this.setPlayerDirection(4, -1);
		}

		if(!anyExiting)
			this.exiting = false;
	};

	/*---------------------------------------------------------------------*\
	| *  Check Exits for Players                                            |
	| ------                                                                |
	|    Called once per exit tile, per player, per tick. This function     |
	|  checks the exit tiles to see if players are ready to change maps. If |
	|  the game is currently not in a state where a map change would be     |
	|  allowed, the function will return -1. If a map change would be       |
	|  possible, then it will return true if the current player is touching |
	|  the current exit. Otherwise, it will return false.                   |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * collision: Boolean. True if the current player is touching the   |
	|                 current exit tile.                                    |
	|    * direction: An integer that represents the direction the player   |
	|                 is traveling when they leave through this exit tile.  |
	|                 0 => Up; 1 => Right; 2 => Down; 3 => Left             |
	|                 Note that the value is relative to the location in    |
	|                 the current layout in the editor, and not related to  |
	|                 the view a player has while playing the game.         |
	|    * onExit:    A boolean value. If a player has been found to be     |
	|                 attempting to switch maps, this will be true.         |
	|    * behInst:   The behavior instance that contains the information   |
	|                 regarding the currently processing player.            |
	\*---------------------------------------------------------------------*/
	behinstProto.updateExits = function(collision, direction, onExit, behInst)
	{
		if(behInst.exiting)
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		if(!collision)
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		if(!this.arePlayersLoaded())
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		switch (behInst.playerNumber)
		{
		case 1:
			this.setPlayerDirection(1, direction);
			break;
		case 2:
			this.setPlayerDirection(2, direction);
			break;
		case 3:
			this.setPlayerDirection(3, direction);
			break;
		default:
			this.setPlayerDirection(4, direction);
			break;
		}

		this.setExitingPlayerCount(this.getExitingPlayerCount() + 1);
		this.exiting = true;
		behInst.exiting = true;
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Check Exits for Exiting Players                                    |
	| ------                                                                |
	|    Called once per exit tile, per player, per tick. This function     |
	|  checkings the exit tiles to see if players are ready to change maps. |
	|  If the game is currently not in a state where a map change would be  |
	|  allowed, the function will return -1. If the current player is no    |
	|  longer touching an exit, this function will return false.            |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * collision: Boolean. True if the current player is touching the   |
	|                 current exit tile.                                    |
	|    * onExit:    A boolean value. If a player has been found to be     |
	|                 attempting to switch maps, this will be true.         |
	|    * behInst:   The behavior instance that contains the information   |
	|                 regarding the currently processing player.            |
	\*---------------------------------------------------------------------*/
	behinstProto.checkExitsForOldPlayers = function(collision, onExit, behInst)
	{
		if(!behInst.exiting)
			return -1;

		if(collision && this.arePlayersLoaded())
			return -1;
		
		if(onExit)
			return -1;

		this.setExitingPlayerCount(this.getExitingPlayerCount() - 1);
		behInst.exiting = false;
		return false;
	};

	/*---------------------------------------------------------------------*\
	| *  Map Selector                                                       |
	| ------                                                                |
	|    Called once per exit tile, per player, per tick. This function     |
	|  deals with successful attempts to exit the current map. If, for some |
	|  reason, the map cannot be exited, this function will return false.   |
	|  otherwise, it will trigger a map change, and set the necessary data. |
	\*---------------------------------------------------------------------*/
	behinstProto.selectMap = function()
	{
		if (!this.arePlayersLoaded())
			return false;

		if(!this.exiting)
			return false;

		if(this.getCurrentPlayerCount() > this.getExitingPlayerCount())
			return false;

		var randomNumber = Math.floor(Math.random() * 100);

		if (randomNumber < 50)
		{
			this.setNextLayout("Map (Maze)");
			this.setMapType(1);
		}
		else if (randomNumber < 75)
		{
			this.setNextLayout("Map (Corner)");
			this.setMapType(2);
		}
		else if (randomNumber < 90)
		{
			this.setNextLayout("Map (Battleground)");
			this.setMapType(3);
		}
		else
		{
			this.setNextLayout("Map (Treasure)");
			this.setMapType(4);
		}

		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Handle Player Load                                                 |
	| ------                                                                |
	|    Called once per exit tile, per player, per tick. This function     |
	|  deals with placing the player when a new map loads. If the game is   |
	|  in a state where the player should not be moved, it will return -1.  |
	|  Otherwise, it will return false if the player cannot or should not   |
	|  be placed, and true if the player is placed. Note that it also will  |
	|  return -1 when a map is loading and it removes a dead player rather  |
	|  than placing them.                                                   |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * goal:       The exit tile instance that is currently being       |
	|                  processed.                                           |
	|    * directions: An array containing the number of times a goal of    |
	|                  each direction has been processed. Used to determine |
	|                  which goal a player starts at.                       |
	|    * instance:   The player instance that is currently being          |
	|                  processed.                                           |
	|    * behInst:    The behavior instance that contains the information  |
	|                  regarding the currently processing player.           |
	\*---------------------------------------------------------------------*/
	behinstProto.handlePlayerLoad = function(goal, directions, instance, behInst)
	{
		if(this.exiting)
			return -1;

		if (this.arePlayersLoaded())
			return -1;

		if(!this.isLayoutLoaded())
			return -1;

		var exitDirection = this.calculateExitDirection(instance, behInst);

		if(exitDirection == -1)
			return false;

		if (exitDirection == -2)
			exitDirection = Math.floor(Math.random() * 4);

		var newDirection = this.calculateRotatedExitDirection(exitDirection);

		return this.placePlayerOnLoad(newDirection, directions, goal, instance, behInst);
	};

	/*---------------------------------------------------------------------*\
	| *  Calculate Base Exit Direction                                      |
	| ------                                                                |
	|    Called once per exit tile, per player, per tick. This function     |
	|  determines which direction a player was traveling when they left the |
	|  last map. If no direction can be determined, this function returns   |
	|  -2, resulting in a random direction being selected. If this function |
	|  determines that a player is dead and should not be placed, it calls  |
	|  the decrementPlayers function to remove the player, then returns -1. |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance: The player instance that is currently being processed. |
	|    * behInst:  The behavior instance that contains the information    |
	|                regarding the currently processing player.             |
	\*---------------------------------------------------------------------*/
	behinstProto.calculateExitDirection = function(instance, behInst)
	{
		var exitDirection = -2;

		var number = behInst.playerNumber;

		if(number != 1 && number != 2 && number != 3 && number != 4)
			return exitDirection;

		exitDirection = this.getPlayerDirection(number);
		if(exitDirection >= 0)
			return exitDirection;

		if(this.getRespawnTimer(number) < 0)
			return exitDirection;

		if(this.isRevivalForced())
			return exitDirection;

		this.decrementPlayers(instance);
		return -1;
	};

	/*---------------------------------------------------------------------*\
	| *  Remove Player From Map                                             |
	| ------                                                                |
	|    Called only when it is determined that a player is dead and should |
	|  not be spawned with the map. This function deletes the player        |
	|  instance and reduces the loading players and total players counts by |
	|  1, to help track when the map is playable and when exits are usable. |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance: The player instance that is currently being processed. |
	\*---------------------------------------------------------------------*/
	behinstProto.decrementPlayers = function(instance)
	{
		if(this.playerKilled)
			return;

		instance.visible = false;
		instance.opacity = 0;

		this.setUnloadedPlayerCount(this.getUnloadedPlayerCount() - 1);
		this.setCurrentPlayerCount(this.getCurrentPlayerCount() - 1);
		this.runtime.DestroyInstance(instance);
		this.playerKilled = true;
	};

	/*---------------------------------------------------------------------*\
	| *  Calculate Rotated Exit Direction                                   |
	| ------                                                                |
	|    Called once per exit tile, per player, until the player has been   |
	|  placed. This function takes the base exit direction from the last    |
	|  map, and calculates the direction from which the player should enter |
	|  the newly loaded map. This function takes into account random map    |
	|  rotation.                                                            |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * exitDirection: The direction the player traveled to exit the     |
	|                     previous map.                                     |
	\*---------------------------------------------------------------------*/
	behinstProto.calculateRotatedExitDirection = function(exitDirection)
	{
		var currentAngle = this.layoutAngle;
		var oldAngle = this.getLastMapAngle();

		var change = ((((oldAngle - currentAngle) / 90) * (-1)) + 6) % 4;

		return ((exitDirection + change) % 4);
	};

	/*---------------------------------------------------------------------*\
	| *  Place Player on Map Load                                           |
	| ------                                                                |
	|    Called once per exit tile, per player, until the player has been   |
	|  placed. If the player should not be placed, this function will       |
	|  return -1. If the player has already been placed, this function will |
	|  automatically return false. Otherwise, it will return true. This     |
	|  function will move the player to the appropriate spawn location when |
	|  the map loads, and will block off the door through which they        |
	|  entered the map by placing a map tile in front of it.                |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * direction:  The direction from which the player should enter the |
	|                  newly loaded map.                                    |
	|    * directions: An array containing the number of times a goal of    |
	|                  each direction has been processed. Used to determine |
	|                  which goal a player starts at.                       |
	|    * goal:       The exit tile instance that is currently being       |
	|                  processed.                                           |
	|    * instance:   The player instance that is currently being          |
	|                  processed.                                           |
	|    * behInst:    The behavior instance that contains the information  |
	|                  regarding the currently processing player.           |
	\*---------------------------------------------------------------------*/
	behinstProto.placePlayerOnLoad = function (direction, directions, goal, instance, behInst)
	{
		if(directions[direction] != behInst.playerNumber)
			return -1;

		if(behInst.placed)
			return false;

		if(this.isRevivalForced())
			return -1;

		switch (direction)
		{
		case 3:
			this.movePlayerToStart(goal, instance, behInst, 64, 0);
			break;
		case 1:
			this.movePlayerToStart(goal, instance, behInst, -64, 0);
			break;
		case 0:
			this.movePlayerToStart(goal, instance, behInst, 0, 64);
			break;
		default:
			this.movePlayerToStart(goal, instance, behInst, 0, -64);
			break;
		}

		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Place Player on Map Load                                           |
	| ------                                                                |
	|    Called up to once per call to this.placePlayerOnLoad(). This       |
	|  function moves the player to the correct starting location, based    |
	|  upon the exit tile and coordinate offset given to it.                |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * goal:       The exit tile instance that is currently being       |
	|                  processed.                                           |
	|    * instance:   The player instance that is currently being          |
	|                  processed.                                           |
	|    * behInst:    The behavior instance that contains the information  |
	|                  regarding the currently processing player.           |
	|    * x:          The x offset to place the player at, relative to the |
	|                  selected exit tile. Note that a gate tile will be    |
	|                  placed at a coordinate cooresponding to half of this |
	|                  offset.                                              |
	|    * y:          The y offset to place the player at, relative to the |
	|                  selected exit tile. Note that a gate tile will be    |
	|                  placed at a coordinate cooresponding to half of this |
	|                  offset.                                              |
	\*---------------------------------------------------------------------*/
	behinstProto.movePlayerToStart = function (goal, instance, behInst, x, y)
	{
		instance.x = goal.x + x;
		instance.y = goal.y + y;
		instance.opacity = 1.0;
		instance.set_bbox_changed();
		behInst.placed = true;

		if(this.bars != 0)
		{
			var layer = this.runtime.getLayerByNumber(1);
			var newBars = this.runtime.createInstance(this.bars, layer);
			newBars.x = goal.x + (x / 2);
			newBars.y = goal.y + (y / 2);
			newBars.set_bbox_changed();
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Handle Orange                                                      |
	| ------                                                                |
	|    Called once per player, per tick. This function deals with all     |
	|  processing related to the Orange enemies. It checks to see if that   |
	|  have killed a player, as well as whether or not they should charge   |
	|  toward a player.                                                     |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance:  The player instance that is currently being           |
	|                 processed.                                            |
	|    * playerNum: The player number of the currently processing player  |
	|                 instance.                                             |
	\*---------------------------------------------------------------------*/
	behinstProto.handleOrange = function (instance, playerNum)
	{
		if(!this.arePlayersLoaded())
			return;

		if(!this.isLayoutLoaded())
			return;

		if(this.orange == 0)
			return;

		this.firstOrange = true;

		for(var i = 0; i < this.orange.instances.length; i += 1)
		{
			var orange = this.orange.instances[i];

			if(typeof orange == 'undefined')
				continue;

			var behavior = orange.behavior_insts[0];

			if(typeof behavior == 'undefined')
				continue;

			if(typeof behavior.charging == 'undefined')
				continue;

			this.attemptCharge(instance, orange, behavior);
			this.handleSpikeTrap(instance, playerNum);

			this.firstOrange = false;

			var collision = this.runtime.testOverlap(instance, orange);

			if(!collision)
				continue;

			if(this.isRevivalActive())
				return;

			if(this.playerKilled)
				return;

			this.runtime.DestroyInstance(instance);
			this.setCurrentPlayerCount(this.getCurrentPlayerCount() - 1);
			this.setPlayerLives(playerNum, this.getPlayerLives(playerNum) - 1);
			this.setRespawnTimer(playerNum, 5);

			this.playSound("death");
			this.playerKilled = true;
			return;
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Attempt Charge                                                     |
	| ------                                                                |
	|    Called once per orange, player, per tick. This function deals with |
	|  orange's attempts to charge at a player.                             |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance: The player instance that is currently being processed. |
	|    * orange:   The instance of orange that is currently being         |
	|                processed.                                             |
	|    * behavior: The behavior instance for the currently processing     |
	|                orange enemy.                                          |
	\*---------------------------------------------------------------------*/
	behinstProto.attemptCharge = function (instance, orange, behavior)
	{
		if (behavior.charging)
			return;

		{
			var playerX = instance.x;
			var playerY = instance.y;

			var x = orange.x;
			var y = orange.y;

			switch(behavior.currentDirection)
			{
			case 0:
				if(playerY > (y - 10) && playerY < (y + 10) && playerX < x)
				{
					orange.opacity = 0;
					this.checkCharge(playerX, orange, behavior);
				}
				break;
			case 1:
				if(playerY > (y - 10) && playerY < (y + 10) && playerX > x)
				{
					orange.opacity = 0;
					this.checkCharge(playerX, orange, behavior);
				}
				break;
			case 2:
				if(playerX > (x - 10) && playerX < (x + 10) && playerY < y)
				{
					orange.opacity = 0;
					this.checkCharge(playerY, orange, behavior);
				}
				break;
			default:
				if(playerX > (x - 10) && playerX < (x + 10) && playerY > y)
				{
					orange.opacity = 0;
					this.checkCharge(playerY, orange, behavior);
				}
				break;
			}

			orange.x = x;
			orange.y = y;
			orange.set_bbox_changed();
			orange.opacity = 1.0;
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Check Charge                                                       |
	| ------                                                                |
	|    Called once per orange, player, per tick. This function deals with |
	|  orange's attempts to charge at a player, and whether or not orange   |
	|  will actually charge.                                                |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * location: The x or y value that orange is trying to charge to.   |
	|    * orange:   The instance of orange that is currently being         |
	|                processed.                                             |
	|    * behavior: The behavior instance for the currently processing     |
	|                orange enemy.                                          |
	\*---------------------------------------------------------------------*/
	behinstProto.checkCharge = function (location, orange, behavior)
	{
		if(behavior.charging)
			return false;

		var xValue = 32;
		var yValue = 32;

		switch(behavior.currentDirection)
		{
		case 0:
			xValue *= -1;
			yValue *= 0;
			break;
		case 1:
			yValue *= 0;
			break;
		case 2:
			xValue *= 0;
			yValue *= -1;

			break;
		default:
			xValue *= 0;
			break;
		}

		var xCheck = Math.abs((xValue < 0) ? 19 : -19);

		while((Math.abs(location - orange.x) > xCheck) && xValue != 0)
		{
			orange.x += xValue;
			orange.set_bbox_changed();

			if(this.runtime.testOverlapSolid(orange))
				return false;
		}

		var yCheck = Math.abs((yValue < 0) ? 19 : -19);

		while((Math.abs(location - orange.y) > yCheck) && yValue != 0)
		{
			orange.y += yValue;
			orange.set_bbox_changed();

			if(this.runtime.testOverlapSolid(orange))
				return false;
		}

		behavior.charging = true;
		behavior.maxspeed *= 4;
	};

	/*---------------------------------------------------------------------*\
	| *  Handle Spike Trap                                                  |
	| ------                                                                |
	|    Called once per orange, per player, per tick. This function deals  |
	|  with all processing related to the Spike Trap object. It checks to   |
	|  see if a player is colliding with a spike trap, and deals with the   |
	|  results. In the future, it will also deal with collisions between    |
	|  orange and the spike trap.                                           |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * instance:  The player instance that is currently being           |
	|                 processed.                                            |
	|    * playerNum: The player number of the currently processing player  |
	|                 instance.                                             |
	\*---------------------------------------------------------------------*/
	behinstProto.handleSpikeTrap = function (instance, playerNum)
	{
		if(!this.arePlayersLoaded())
			return;

		for(var i = 0; i < this.spikes.instances.length; i += 1)
		{
			if(!this.firstOrange)
				break;

			var spike = this.spikes.instances[i];

			if(typeof spike == 'undefined')
				continue;

			if(this.isRevivalActive())
				continue;

			if(this.playerKilled)
				break;

			var collision = this.runtime.testOverlap(spike, instance);
			
			if(!collision)
				continue;

			this.runtime.DestroyInstance(instance);
			this.setCurrentPlayerCount(this.getCurrentPlayerCount() - 1);
			this.setPlayerLives(playerNum, this.getPlayerLives(playerNum) - 1);
			this.setRespawnTimer(playerNum, 5);

			this.playSound("death");
			this.playerKilled = true;
			break;
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Are Players Loaded                                                 |
	| ------                                                                |
	|    Utility access function. Returns true if all players have been     |
	|  placed upon their starting location.                                 |
	\*---------------------------------------------------------------------*/
	behinstProto.arePlayersLoaded = function ()
	{
		if (this.dataArray == null)
			return -200;

		return (this.dataArray.instances[0].at(19, 0, 0) <= 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Current Player Count                                           |
	| ------                                                                |
	|    Utility access function. Returns the number of players currently   |
	|  shown on the map.                                                    |
	\*---------------------------------------------------------------------*/
	behinstProto.getCurrentPlayerCount = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(8, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Exiting Player Count                                           |
	| ------                                                                |
	|    Utility access function. Returns the number of players currently   |
	|  attempting to move to another map.                                   |
	\*---------------------------------------------------------------------*/
	behinstProto.getExitingPlayerCount = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(40, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Experience Multiplier                                          |
	| ------                                                                |
	|    Utility access function. Returns the preset experience multiplier. |
	|  This value can be used to determine difficulty and game progress. If |
	|  set to a low value, game is more difficult and progresses faster,    |
	|  while the opposite results in slower progression and easier play.    |
	|  Note that this value is currently used, but the results are not.     |
	\*---------------------------------------------------------------------*/
	behinstProto.getExperienceMultiplier = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(6, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Previous Map Angle                                             |
	| ------                                                                |
	|    Utility access function. Returns the angle of the last map the     |
	|  player exited.                                                       |
	\*---------------------------------------------------------------------*/
	behinstProto.getLastMapAngle = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(46, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Map Coin Total                                                 |
	| ------                                                                |
	|    Utility access function. Returns the number of coins remaining on  |
	|  the map.                                                             |
	\*---------------------------------------------------------------------*/
	behinstProto.getMapCoins = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(3, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player's Coin Total                                            |
	| ------                                                                |
	|    Utility access function. Returns the total amount of treasure that |
	|  the specified player has collected.                                  |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player: The number value that represents a specific player.      |
	\*---------------------------------------------------------------------*/
	behinstProto.getPlayerCoins = function (player)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].at(10, 0, 0);
		case 2:
			return this.dataArray.instances[0].at(11, 0, 0);
		case 3:
			return this.dataArray.instances[0].at(22, 0, 0);
		default:
			return this.dataArray.instances[0].at(25, 0, 0);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player Direction                                               |
	| ------                                                                |
	|    Utility access function. Returns the direction the given player is |
	|  attempting exit. Will return -1 if the player is not attempting to   |
	|  exit the map. If the player is attempting to exit, it will return a  |
	|  value representing the direction, where 0=>up, 1=>right, 2=>down,    |
	|  and 3=>left. This is independent of the current map's rotation.      |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player: The number value that represents a specific player.      |
	\*---------------------------------------------------------------------*/
	behinstProto.getPlayerDirection = function (player)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].at(41, 0, 0);
		case 2:
			return this.dataArray.instances[0].at(42, 0, 0);
		case 3:
			return this.dataArray.instances[0].at(43, 0, 0);
		default:
			return this.dataArray.instances[0].at(44, 0, 0);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player Experience                                              |
	| ------                                                                |
	|    Utility access function. Returns the total experience the player   |
	|  has earned for the current level.                                    |
	\*---------------------------------------------------------------------*/
	behinstProto.getPlayerExperience = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(2, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player Level                                                   |
	| ------                                                                |
	|    Utility access function. Returns the player's current level.       |
	\*---------------------------------------------------------------------*/
	behinstProto.getPlayerLevel = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(7, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player's Remaining Lives                                       |
	| ------                                                                |
	|    Utility access function. Returns the remaining number of lives for |
	|  the given player.                                                    |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player: The number value that represents a specific player.      |
	\*---------------------------------------------------------------------*/
	behinstProto.getPlayerLives = function (player)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].at(14, 0, 0);
		case 2:
			return this.dataArray.instances[0].at(15, 0, 0);
		case 3:
			return this.dataArray.instances[0].at(23, 0, 0);
		default:
			return this.dataArray.instances[0].at(26, 0, 0);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Get Player's Respawn Timer                                         |
	| ------                                                                |
	|    Utility access function. Returns remaining time, in seconds,       |
	|  before the player will respawn on a map with an active revival tile. |
	|  If the player is not dead, will return -1.                           |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player: The number value that represents a specific player.      |
	\*---------------------------------------------------------------------*/
	behinstProto.getRespawnTimer = function (player)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].at(28, 0, 0);
		case 2:
			return this.dataArray.instances[0].at(29, 0, 0);
		case 3:
			return this.dataArray.instances[0].at(30, 0, 0);
		default:
			return this.dataArray.instances[0].at(31, 0, 0);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Get Revival Godmode Timer                                          |
	| ------                                                                |
	|    Utility access function. Returns the remaining time, in seconds,   |
	|  before the players no longer have godmode due to a revival.          |
	\*---------------------------------------------------------------------*/
	behinstProto.getRevivalCooldown = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(38, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Get Unloaded Player Count                                          |
	| ------                                                                |
	|    Utility access function. Returns the number of players who have    |
	|  yet to fully load.                                                   |
	\*---------------------------------------------------------------------*/
	behinstProto.getUnloadedPlayerCount = function ()
	{
		if (this.dataArray == null)
			return -200;

		return this.dataArray.instances[0].at(19, 0, 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Is Layout Loaded                                                   |
	| ------                                                                |
	|    Utility access function. Returns a boolean representing whether or |
	|  not the layout has loaded. If the first ontick event has been        |
	|  completed for this layout, will return true, otherwise, it will not. |
	\*---------------------------------------------------------------------*/
	behinstProto.isLayoutLoaded = function ()
	{
		if (this.dataArray == null)
			return -200;

		return (this.dataArray.instances[0].at(39, 0, 0) >= 1);
	};

	/*---------------------------------------------------------------------*\
	| *  Is Game Paused                                                     |
	| ------                                                                |
	|    Utility access function. Returns a boolean value representing      |
	|  whether or not the game is currently paused.                         |
	\*---------------------------------------------------------------------*/
	behinstProto.isPaused = function ()
	{
		if (this.dataArray == null)
			return -200;

		return (this.dataArray.instances[0].at(13, 0, 0) == 1);
	};

	/*---------------------------------------------------------------------*\
	| *  Is Revival Godmode in Effect                                       |
	| ------                                                                |
	|    Utility access function. Returns true if players are currently in  |
	|  godmode due to having recently revived.                              |
	\*---------------------------------------------------------------------*/
	behinstProto.isRevivalActive = function ()
	{
		if (this.dataArray == null)
			return -200;

		return (this.dataArray.instances[0].at(38, 0, 0) > 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Is Forced Revival Active                                           |
	| ------                                                                |
	|    Utility access function. Returns true if a new map needs to be     |
	|  loaded due to all players dying, with no active revival tile on the  |
	|  map to resurrect them.                                               |
	\*---------------------------------------------------------------------*/
	behinstProto.isRevivalForced = function ()
	{
		if (this.dataArray == null)
			return -200;

		return (this.dataArray.instances[0].at(37, 0, 0) != 0);
	};

	/*---------------------------------------------------------------------*\
	| *  Play Sound                                                         |
	| ------                                                                |
	|    Utility access function. Tells the game to play a sound effect.    |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A string containing the full name of the audio track   |
	|                to play.                                               |
	\*---------------------------------------------------------------------*/
	behinstProto.playSound = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		this.dataArray.instances[0].set(18, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Reset Global Data Array                                            |
	| ------                                                                |
	|    Utility access function. Sets the global data array to report as   |
	|  uninitialized. This results in it being reset the next time a new    |
	|  layout is loaded.                                                    |
	\*---------------------------------------------------------------------*/
	behinstProto.resetDataArray = function ()
	{
		if (this.dataArray == null)
			return -200;

		this.dataArray.instances[0].set(1, 0, 0, 0);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Current Player Count                                           |
	| ------                                                                |
	|    Utility access function. Sets the number of players currently      |
	|  shown on the map.                                                    |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the current number of players.   |
	\*---------------------------------------------------------------------*/
	behinstProto.setCurrentPlayerCount = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(8, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Exiting Player Count                                           |
	| ------                                                                |
	|    Utility access function. Sets the number of players currently      |
	|  attempting to move to another map.                                   |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the number of players attempting |
	|                to exit the map.                                       |
	\*---------------------------------------------------------------------*/
	behinstProto.setExitingPlayerCount = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(40, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Map Coin Total                                                 |
	| ------                                                                |
	|    Utility access function. Sets the total number of coins remaning   |
	|  on the current map.                                                  |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the number of remaining coins.   |
	\*---------------------------------------------------------------------*/
	behinstProto.setMapCoins = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(3, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Map Type                                                       |
	| ------                                                                |
	|    Utility access function. Sets the type for the next map to load.   |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the type of map.                 |
	\*---------------------------------------------------------------------*/
	behinstProto.setMapType = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		this.dataArray.instances[0].set(9, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Map Zoom                                                       |
	| ------                                                                |
	|    Utility access function. Sets the current map scale so that the    |
	|  map will zoom in or out.                                             |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A decimal value representing the current map zoom.     |
	\*---------------------------------------------------------------------*/
	behinstProto.setMapZoom = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(36, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Next Layout                                                    |
	| ------                                                                |
	|    Utility access function. Sets the next layout to load.             |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A string representing the name of the layout.          |
	\*---------------------------------------------------------------------*/
	behinstProto.setNextLayout = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		this.dataArray.instances[0].set(34, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Game Paused                                                    |
	| ------                                                                |
	|    Utility access function. Sets a boolean value representing whether |
	|  or not the game is currently paused.                                 |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number boolean representing the current pause state. |
	\*---------------------------------------------------------------------*/
	behinstProto.setPaused = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue != 0 && newValue != 1)
			return -300;

		this.dataArray.instances[0].set(13, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player Coins                                                   |
	| ------                                                                |
	|    Utility access function. Sets the total amount of treasure that    |
	|  the specified player has collected.                                  |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player:   The number value that represents a specific player.    |
	|    * newValue: A number representing the total amount of treasure     |
	|                that the player has collected.                         |
	\*---------------------------------------------------------------------*/
	behinstProto.setPlayerCoins = function (player, newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		if(newValue < 0)
			newValue = 0;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].set(10, 0, 0, newValue);
		case 2:
			return this.dataArray.instances[0].set(11, 0, 0, newValue);
		case 3:
			return this.dataArray.instances[0].set(22, 0, 0, newValue);
		default:
			return this.dataArray.instances[0].set(25, 0, 0, newValue);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player Direction                                               |
	| ------                                                                |
	|    Utility access function. Sets the direction the given player is    |
	|  attempting exit. Shouyld set -1 if the player is not attempting to   |
	|  exit the map. If the player is attempting to exit, it should set a   |
	|  value representing the direction, where 0=>up, 1=>right, 2=>down,    |
	|  and 3=>left. This is independent of the current map's rotation.      |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player:   The number value that represents a specific player.    |
	|    * newValue: A number representing the direction a player is trying |
	|                to exit the map in.                                    |
	\*---------------------------------------------------------------------*/
	behinstProto.setPlayerDirection = function (player, newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		if(newValue < -1 || newValue > 3)
			return -400;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].set(41, 0, 0, newValue);
		case 2:
			return this.dataArray.instances[0].set(42, 0, 0, newValue);
		case 3:
			return this.dataArray.instances[0].set(43, 0, 0, newValue);
		default:
			return this.dataArray.instances[0].set(44, 0, 0, newValue);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player Experience                                              |
	| ------                                                                |
	|    Utility access function. Sets the total experience the player has  |
	|  earned for the current level.                                        |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the players' current experience. |
	\*---------------------------------------------------------------------*/
	behinstProto.setPlayerExperience = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(2, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player Level                                                   |
	| ------                                                                |
	|    Utility access function. Sets the player's current level.          |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the players' current level.      |
	\*---------------------------------------------------------------------*/
	behinstProto.setPlayerLevel = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 1)
			newValue = 1;

		this.dataArray.instances[0].set(7, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player's Remaining Lives                                       |
	| ------                                                                |
	|    Utility access function. Sets the remaining number of lives for    |
	|  the specified player.                                                |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player:   The number value that represents a specific player.    |
	|    * newValue: A number representing the player's remaining lives.    |
	\*---------------------------------------------------------------------*/
	behinstProto.setPlayerLives = function (player, newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		if(newValue < 0)
			newValue = 0;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].set(14, 0, 0, newValue);
		case 2:
			return this.dataArray.instances[0].set(15, 0, 0, newValue);
		case 3:
			return this.dataArray.instances[0].set(23, 0, 0, newValue);
		default:
			return this.dataArray.instances[0].set(26, 0, 0, newValue);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Set Player's Respawn Timer                                         |
	| ------                                                                |
	|    Utility access function. Sets remaining time, in seconds, before   |
	|  the player will respawn on a map with an active revival tile. If the |
	|  player is not dead, it should set -1.                                |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player:   The number value that represents a specific player.    |
	|    * newValue: A number representing the time, in seconds, before a   |
	|                player can be revived.                                 |
	\*---------------------------------------------------------------------*/
	behinstProto.setRespawnTimer = function (player, newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(player != 1 && player != 2 && player != 3 && player != 4)
			return -300;

		if(newValue < -1)
			newValue = -1;

		switch(player)
		{
		case 1:
			return this.dataArray.instances[0].set(28, 0, 0, newValue);
		case 2:
			return this.dataArray.instances[0].set(29, 0, 0, newValue);
		case 3:
			return this.dataArray.instances[0].set(30, 0, 0, newValue);
		default:
			return this.dataArray.instances[0].set(31, 0, 0, newValue);
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Set Revival Godmode Timer                                          |
	| ------                                                                |
	|    Utility access function. Sets the remaining time, in seconds,      |
	|  before the players no longer have godmode due to a revival.          |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the time, in seconds, before     |
	|                players can be killed after a recent revival.          |
	\*---------------------------------------------------------------------*/
	behinstProto.setRevivalCooldown = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(38, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Set Unloaded Player Count                                          |
	| ------                                                                |
	|    Utility access function. Sets the number of players who have yet   |
	|  to fully load.                                                       |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * newValue: A number representing the number of players that have  |
	|                yet to be dealt with after a map loads.                |
	\*---------------------------------------------------------------------*/
	behinstProto.setUnloadedPlayerCount = function (newValue)
	{
		if (this.dataArray == null)
			return -200;

		if(newValue < 0)
			newValue = 0;

		this.dataArray.instances[0].set(19, 0, 0, newValue);
		return true;
	};

	/*---------------------------------------------------------------------*\
	| *  Conditions                                                         |
	| ------                                                                |
	|    Functions triggered by the editor. Currently unused by this        |
	|  behavior class.                                                      |
	\*---------------------------------------------------------------------*/
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	/*---------------------------------------------------------------------*\
	| *  Actions                                                            |
	| ------                                                                |
	|    Actions performed by the event system. Not intended for use in any |
	|  setting aside from the event editor.                                 |
	\*---------------------------------------------------------------------*/
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	/*---------------------------------------------------------------------*\
	| *  Set Movement Angle                                                 |
	| ------                                                                |
	|    Stores the rotation of the current map. This is called when a new  |
	|  layout loads.                                                        |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * angle: A number representing the rotation, in degrees, of the    |
	|             current map. If the number is not 0, 90, 180, or 270, the |
	|             function will store the value of 0.                       |
	\*---------------------------------------------------------------------*/
	acts.SetMovementAngle = function (angle)
	{
		// 0, 90, 180, 270, else 0
		switch (angle)
		{
		case 0:		this.layoutAngle = 0;	break;
		case 90:	this.layoutAngle = 90;	break;
		case 180:	this.layoutAngle = 180;	break;
		case 270:	this.layoutAngle = 270;	break;
		default:	this.layoutAngle = 0;	break;
		}
	};

	/*---------------------------------------------------------------------*\
	| *  Set Data Array                                                     |
	| ------                                                                |
	|    Stores the game's data array. This is called when a new layout     |
	|    loads.                                                             |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * array: The game's current Array object.                          |
	\*---------------------------------------------------------------------*/
	acts.SetDataArray = function (array)
	{
		this.dataArray = array;
	};

	/*---------------------------------------------------------------------*\
	| *  Add Player                                                         |
	| ------                                                                |
	|    Adds a player to the manager's player array. If the player is      |
	|  already stored in the array, it is ignored. This is called when a    |
	|  new layout loads.                                                    |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * player: A player object.                                         |
	\*---------------------------------------------------------------------*/
	acts.AddPlayer = function (player)
	{
		for(var i = 0; i < this.players.players.length; i++)
		{
			if(this.players.players[i] == player)
				return;
		}

		this.players.players.push(player);
	};

	/*---------------------------------------------------------------------*\
	| *  Add Goal Tile                                                      |
	| ------                                                                |
	|    Stores the goal tile for later use. This is called when a new      |
	|  layout loads.                                                        |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * goal: A goal object.                                             |
	\*---------------------------------------------------------------------*/
	acts.AddGoal = function (goal)
	{
		this.goals = goal;
	};

	/*---------------------------------------------------------------------*\
	| *  Add Bar Tile                                                       |
	| ------                                                                |
	|    Stores the bar tile for later use. This is called when a new       |
	|  layout loads.                                                        |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * bar: A bar tile object.                                          |
	\*---------------------------------------------------------------------*/
	acts.AddBar = function (bar)
	{
		this.bars = bar;
	};

	/*---------------------------------------------------------------------*\
	| *  Add Orange Enemy                                                   |
	| ------                                                                |
	|    Stores the Orange Enemy objects for later use. This is called when |
	|  a new layout loads.                                                  |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * orange: An orange enemy object.                                  |
	\*---------------------------------------------------------------------*/
	acts.AddOrange = function (orange)
	{
		this.orange = orange;
	};

	/*---------------------------------------------------------------------*\
	| *  Add Spike Trap Enemy                                               |
	| ------                                                                |
	|    Stores the Spike Trap Enemy objects for later use. This is called  |
	|  when a new layout loads.                                             |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * spike: A spike trap enemy object.                                |
	\*---------------------------------------------------------------------*/
	acts.AddSpike = function (spike)
	{
		this.spikes = spike;
	};

	
	/*---------------------------------------------------------------------*\
	| *  Add Coin                                                           |
	| ------                                                                |
	|    Stores the Coin objects for later use. This is called when a new   |
	|  layout loads.                                                        |
	| ------                                                                |
	|  Arguments:                                                           |
	|    * coin: A coin treasure object.                                    |
	\*---------------------------------------------------------------------*/
	acts.AddCoin = function (coin)
	{
		this.coins = coin;
	};

	/*---------------------------------------------------------------------*\
	| *  Expressions                                                        |
	| ------                                                                |
	|    Expressions are functions that the editor can call to check        |
	|  various portions of the behavior. While an expression cannot set a   |
	|  value, it must always return a value.                                |
	\*---------------------------------------------------------------------*/
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;
}());
