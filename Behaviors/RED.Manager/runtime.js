// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDManager = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDManager.prototype;

	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};

	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;	// associated object instance to modify
		this.runtime = type.runtime;

		this.enabled = true;

		this.layoutAngle = 0;
		this.dataArray = null;
		this.paused = false;
		this.esckey = false;
		this.lastesctick = -1;
		this.players = {};
		this.goals = 0;
		this.exiting = false;
		this.bars = 0;
		this.placed = false;
		this.playerCount = 0;
		this.walls = 0;
		this.lastDt = this.runtime.getDt(this.inst);
	};

	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
		this.exiting = false;
		this.placed = false;

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

	behinstProto.onKeyDown = function (info)
	{	
		var tickcount = this.runtime.tickcount;

		if(info.keyCode == 27)
		{
			info.preventDefault();

			if (this.lastesctick < tickcount)
				this.esckey = true;
		}
	};

	behinstProto.onKeyUp = function (info)
	{
		var tickcount = this.runtime.tickcount;

		if(info.keyCode == 27)
		{
			info.preventDefault();
			this.esckey = false;
			this.lastesctick = tickcount;
		}
	};

	behinstProto.tick = function ()
	{

		if (this.dataArray != null)
		{
			this.paused = (this.dataArray.instances[0].at(13, 0, 0) == 1);
			this.playerCount = this.dataArray.instances[0].at(45, 0, 0);
		}
		else
			return;

		if (this.paused && this.esckey)
		{
			this.dataArray.instances[0].set(13, 0, 0, 0);
			this.dataArray.instances[0].set(35, 0, 0, 1);
			this.esckey = false;
		}

		if (this.paused)
			return;

		if (this.esckey)
		{
			this.dataArray.instances[0].set(13, 0, 0, 1);
			this.dataArray.instances[0].set(35, 0, 0, 1);
			this.esckey = false;
		}

		var dt = this.runtime.getDt(this.inst);
		var dtDiff = dt - this.lastDt;
		
		if (this.dataArray.instances[0].at(38, 0, 0) > 0)
		{
			var newValue = this.dataArray.instances[0].at(38, 0, 0) - dtDiff;
			this.dataArray.instances[0].set(38, 0, 0, newValue);
		}

		var expMult = this.dataArray.instances[0].at(6, 0, 0);
		var level = this.dataArray.instances[0].at(7, 0, 0);
		var currentExp = this.dataArray.instances[0].at(2, 0, 0);

		if ((expMult * level) <= currentExp)
		{
			this.dataArray.instances[0].set(2, 0, 0, (currentExp - (expMult * level)));
			this.dataArray.instances[0].set(7, 0, 0, level + 1);
		}

		var zoom = 1.0;

		var firstX = -100;
		var firstY = -100;

		for(var i = 0; i < this.players.players.length; i += 1)
		{
			var instance = this.players.players[i].instances[0];
			if(typeof instance == 'undefined')
				continue;

			if(!instance.visible || instance.opacity <= 0)
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
				}
			}

			if(playerNum == 0)
				continue;

			if(firstX == -100 && firstY == -100)
			{
				firstX = instance.x;
				firstY = instance.y;
			}

			zoom = this.calculateZoom(firstX, firstY, zoom, instance);

			this.resizePlayers(instance);
			this.handleGoals(instance, behInstance);
		}

		this.dataArray.instances[0].set(36, 0, 0, zoom);

		this.lastDt = dt;
	};

	behinstProto.calculateZoom = function (x, y, zoom, instance)
	{
		if(x == instance.x && y == instance.y)
			return zoom;

		var tempZoom = 1.0;

		var thisX = instance.x
		var thisY = instance.y

		var squareX = Math.pow((thisX - x), 2);
		var squareY = Math.pow((thisY - y), 2);

		var distance = Math.sqrt(squareX + squareY)

		if (distance > 500)
			tempZoom = (1.0/(0.002 * distance));

		return (tempZoom < zoom) ? tempZoom : zoom;
	};

	behinstProto.resizePlayers = function (instance)
	{
		if (instance.width > 16 || instance.height > 16)
		{
			instance.width -= 2;
			instance.height = instance.width;
			instance.set_bbox_changed();
			if(instance.width <= 16)
			{
				var unloaded = this.dataArray.instances[0].at(19, 0, 0) - 1;
				unloaded = (unloaded < 0) ? 0 : unloaded;

				this.dataArray.instances[0].set(19, 0, 0,  unloaded);
			}
		}
		else if (instance.width < 16 || instance.height < 16)
		{
			instance.width = 16;
			instance.height = instance.width;
			instance.set_bbox_changed();
		}
	}

	behinstProto.handleGoals = function(instance, behInst)
	{
		if(this.goals == 0)
			return;

		if(this.dataArray.instances[0].at(39, 0, 0) <= 0)
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

			if(this.dataArray.instances[0].at(19, 0, 0) > 0)
				continue;

			if(anyExiting || this.exiting)
				continue;

			if(this.dataArray.instances[0].at(39, 0, 0) <= 0)
				continue;

			if (this.dataArray.instances[0].at(41, 0, 0) != -1)
				this.dataArray.instances[0].set(41, 0, 0, -1);
			if (this.dataArray.instances[0].at(42, 0, 0) != -1)
				this.dataArray.instances[0].set(42, 0, 0, -1);
			if (this.dataArray.instances[0].at(43, 0, 0) != -1)
				this.dataArray.instances[0].set(43, 0, 0, -1);
			if (this.dataArray.instances[0].at(44, 0, 0) != -1)
				this.dataArray.instances[0].set(44, 0, 0, -1);
		}

		if(!anyExiting)
			this.exiting = false;
	}

	behinstProto.updateExits = function(collision, direction, onExit, behInst)
	{
		if(behInst.exiting)
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		if(!collision)
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		if(this.dataArray.instances[0].at(19, 0, 0) > 0)
			return this.checkExitsForOldPlayers(collision, onExit, behInst);

		switch (behInst.playerNumber)
		{
		case 1:
			this.dataArray.instances[0].set(41, 0, 0, direction);
			break;
		case 2:
			this.dataArray.instances[0].set(42, 0, 0, direction);
			break;
		case 3:
			this.dataArray.instances[0].set(43, 0, 0, direction);
			break;
		default:
			this.dataArray.instances[0].set(44, 0, 0, direction);
			break;
		}

		var exitingPlayers = this.dataArray.instances[0].at(40, 0, 0) + 1;
		this.dataArray.instances[0].set(40, 0, 0, exitingPlayers);
		this.exiting = true;
		behInst.exiting = true;
		return true;
	}

	behinstProto.checkExitsForOldPlayers = function(collision, onExit, behInst)
	{
		if(!behInst.exiting)
			return -1;

		if(collision && this.dataArray.instances[0].at(19, 0, 0) <= 0)
			return -1;
		
		if(onExit)
			return -1;

		var exitingPlayers = this.dataArray.instances[0].at(40, 0, 0) - 1;
		exitingPlayers = (exitingPlayers < 0) ? 0 : exitingPlayers;
		this.dataArray.instances[0].set(40, 0, 0, exitingPlayers);
		behInst.exiting = false;
		return false;
	}

	behinstProto.selectMap = function()
	{
		if (this.dataArray.instances[0].at(19, 0, 0) > 0)
			return false;

		if(!this.exiting)
			return false;

		var playerCount = this.dataArray.instances[0].at(8, 0, 0);
		var playersExiting = this.dataArray.instances[0].at(40, 0, 0);

		if(playerCount > playersExiting)
			return false;

		var randomNumber = Math.floor(Math.random() * 100);

		if (randomNumber < 50)
		{
			this.dataArray.instances[0].set(34, 0, 0, "Map (Maze)");
			this.dataArray.instances[0].set(9, 0, 0, 1);
		}
		else if (randomNumber < 75)
		{
			this.dataArray.instances[0].set(34, 0, 0, "Map (Corner)");
			this.dataArray.instances[0].set(9, 0, 0, 2);
		}
		else if (randomNumber < 90)
		{
			this.dataArray.instances[0].set(34, 0, 0, "Map (Battleground)");
			this.dataArray.instances[0].set(9, 0, 0, 3);
		}
		else
		{
			this.dataArray.instances[0].set(34, 0, 0, "Map (Treasure)");
			this.dataArray.instances[0].set(9, 0, 0, 4);
		}

		return true;
	}

	behinstProto.handlePlayerLoad = function(goal, directions, instance, behInst)
	{
		if(this.exiting)
			return -1;

		if (this.dataArray.instances[0].at(19, 0, 0) <= 0)
			return -1;

		if(this.dataArray.instances[0].at(39, 0, 0) <= 0)
			return -1;

		var exitDirection = this.calculateExitDirection(instance, behInst);

		if(exitDirection == -1)
			return false;

		if (exitDirection == -2)
			exitDirection = Math.floor(Math.random() * 4);

		var newDirection = this.calculateRotatedExitDirection(exitDirection);

		return this.placePlayerOnLoad(newDirection, directions, goal, instance, behInst);
	}

	behinstProto.calculateExitDirection = function(instance, behInst)
	{
		var exitDirection = -2;

		switch (behInst.playerNumber)
		{
		case 1:
			exitDirection = this.dataArray.instances[0].at(41, 0, 0);
			if(this.dataArray.instances[0].at(41, 0, 0) >= 0)
				break;

			if(this.dataArray.instances[0].at(28, 0, 0) < 0)
				break;

			if(this.dataArray.instances[0].at(37, 0, 0) > 0)
				break;

			this.decrementPlayers(instance);
			return -1;
		case 2:
			exitDirection = this.dataArray.instances[0].at(42, 0, 0);
			if(this.dataArray.instances[0].at(42, 0, 0) >= 0)
				break;

			if(this.dataArray.instances[0].at(29, 0, 0) < 0)
				break;

			if(this.dataArray.instances[0].at(37, 0, 0) > 0)
				break;

			this.decrementPlayers(instance);
			return -1;
		case 3:
			exitDirection = this.dataArray.instances[0].at(43, 0, 0);
			if(this.dataArray.instances[0].at(43, 0, 0) >= 0)
				break;

			if(this.dataArray.instances[0].at(30, 0, 0) < 0)
				break;

			if(this.dataArray.instances[0].at(37, 0, 0) > 0)
				break;

			this.decrementPlayers(instance);
			return -1;
		case 4:
			exitDirection = this.dataArray.instances[0].at(44, 0, 0);
			if(this.dataArray.instances[0].at(44, 0, 0) >= 0)
				break;

			if(this.dataArray.instances[0].at(31, 0, 0) < 0)
				break;

			if(this.dataArray.instances[0].at(37, 0, 0) > 0)
				break;

			this.decrementPlayers(instance);
			return -1;
		}

		return exitDirection;
	}

	behinstProto.decrementPlayers = function(instance)
	{
		instance.visible = false;
		instance.opacity = 0;

		var playersRemaining = this.dataArray.instances[0].at(19, 0, 0) - 1;
		playersRemaining = (playersRemaining < 0) ? 0 : playersRemaining;
		this.dataArray.instances[0].set(19, 0, 0, playersRemaining);

		var mapPlayerCount = this.dataArray.instances[0].at(8, 0, 0) - 1;
		mapPlayerCount = (mapPlayerCount < 0) ? 0 : mapPlayerCount;
		this.dataArray.instances[0].set(8, 0, 0, mapPlayerCount);
		this.runtime.DestroyInstance(instance);
	}

	behinstProto.calculateRotatedExitDirection = function(exitDirection)
	{
		var currentAngle = this.layoutAngle;
		var oldAngle = this.dataArray.instances[0].at(46, 0, 0);

		var change = ((((oldAngle - currentAngle) / 90) * (-1)) + 6) % 4;

		return ((exitDirection + change) % 4)
	}

	behinstProto.placePlayerOnLoad = function (direction, directions, goal, instance, behInst)
	{
		if(directions[direction] != behInst.playerNumber)
			return -1;

		if(behInst.placed)
			return false;

		if(this.dataArray.instances[0].at(37, 0, 0) > 0)
			return -1;

		switch (direction)
		{
		case 3:
			instance.x = goal.x + 64;
			instance.y = goal.y;
			instance.opacity = 1.0;
			instance.set_bbox_changed();
			behInst.placed = true;
			if(this.bars != 0)
			{
				var layer = this.runtime.getLayerByNumber(1);
				var newBars = this.runtime.createInstance(this.bars, layer);
				newBars.x = goal.x + 32;
				newBars.y = goal.y;
				newBars.set_bbox_changed();
			}
			break;
		case 1:
			instance.x = goal.x - 64;
			instance.y = goal.y;
			instance.opacity = 1.0;
			instance.set_bbox_changed();
			behInst.placed = true;
			if(this.bars != 0)
			{
				var layer = this.runtime.getLayerByNumber(1);
				var newBars = this.runtime.createInstance(this.bars, layer);
				newBars.x = goal.x - 32;
				newBars.y = goal.y;
				newBars.set_bbox_changed();
			}
			break;
		case 0:
			instance.x = goal.x;
			instance.y = goal.y + 64;
			instance.opacity = 1.0;
			instance.set_bbox_changed();
			behInst.placed = true;
			if(this.bars != 0)
			{
				var layer = this.runtime.getLayerByNumber(1);
				var newBars = this.runtime.createInstance(this.bars, layer);
				newBars.x = goal.x;
				newBars.y = goal.y + 32;
				newBars.set_bbox_changed();
			}
			break;
		default:
			instance.x = goal.x;
			instance.y = goal.y - 64;
			instance.opacity = 1.0;
			instance.set_bbox_changed();
			behInst.placed = true;
			if(this.bars != 0)
			{
				var layer = this.runtime.getLayerByNumber(1);
				var newBars = this.runtime.createInstance(this.bars, layer);
				newBars.x = goal.x;
				newBars.y = goal.y - 32;
				newBars.set_bbox_changed();
			}
			break;
		}

		return true;
	}

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	acts.SetMovementAngle = function (angle)
	{
		// 0, 90, 180, 270, else 0
		switch (angle) {
		case 0:		this.layoutAngle = 0;	break;
		case 90:	this.layoutAngle = 90;	break;
		case 180:	this.layoutAngle = 180;	break;
		case 270:	this.layoutAngle = 270;	break;
		default:	this.layoutAngle = 0;	break;
		}
	};

	acts.SetDataArray = function (array)
	{
		this.dataArray = array;
	};

	acts.AddPlayer = function (player)
	{
		this.players.players.push(player);
	};

	acts.AddGoal = function (goal)
	{
		this.goals = goal;
	};

	acts.AddBar = function (bar)
	{
		this.bars = bar;
	};

	acts.AddWall = function (wall)
	{
		this.walls = wall;
	};

	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;
}());
