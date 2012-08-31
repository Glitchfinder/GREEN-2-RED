// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDPlayer = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDPlayer.prototype;
		
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
		this.inst = inst;				// associated object instance to modify
		this.runtime = type.runtime;
		
		// Key states
		this.upkey = false;
		this.downkey = false;
		this.leftkey = false;
		this.rightkey = false;
		this.ignoreInput = false;
		
		// Simulated key states
		this.simup = false;
		this.simdown = false;
		this.simleft = false;
		this.simright = false;
		
		// attempted workaround for sticky keys bug
		this.lastuptick = -1;
		this.lastdowntick = -1;
		this.lastlefttick = -1;
		this.lastrighttick = -1;
		
		// Movement
		this.dx = 0;
		this.dy = 0;
		
		this.enabled = true;
		
		this.layoutAngle = 0;
		this.dataArray = null;
		this.paused = false;
		this.playerNumber = 0;
		this.multiplePlayers = false;
		this.esckey = false;
		this.lastesctick = -1;
		this.players = {};
		this.goals = 0;
		this.exiting = false;
		this.bars = 0;
		this.placed = false;
		this.playerCount = 0;
		this.walls = 0;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;
	
	behinstProto.onCreate = function()
	{
		// Load properties
		this.maxspeed = this.properties[0];
		this.acc = this.properties[1];
		this.dec = this.properties[2];
		// 0=Up & down, 1=Left & right, 2=4 directions, 3=8 directions"
		this.directions = this.properties[3];
		// 0=No,1=90-degree intervals, 2=45-degree intervals, 3=360 degree (smooth)
		this.angleMode = this.properties[4];
		// 0=no, 1=yes
		this.defaultControls = (this.properties[5] === 1);
		// 0=no, 1=yes
		this.player2 = (this.properties[6] === 1);
		this.exiting = false;
		this.placed = false;
		
		// Only bind keyboard events via jQuery if default controls are in use
		if (this.defaultControls)
		{
			jQuery(document).keydown(
				(function (self) {
					return function(info) {
						self.onKeyDown(info);
					};
				})(this)
			);
			
			jQuery(document).keyup(
				(function (self) {
					return function(info) {
						self.onKeyUp(info);
					};
				})(this)
			);
		}
		
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
		
		if(this.playerCount > 1 && this.playerNumber == 2) {
			switch (info.which) {
			case 37:	// left arrow
				info.preventDefault();
				
				// Workaround for sticky keys bug: reject if arriving on same tick as onKeyUp event
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 38:	// up arrow
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 39:	// right arrow
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 40:	// down arrow
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			case 100:	// left (Numpad 4)
				info.preventDefault();
				
				// Workaround for sticky keys bug: reject if arriving on same tick as onKeyUp event
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 104:	// up (Numpad 8)
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 102:	// right (Numpad 6)
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 98:	// down (Numpad 2)
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			}
		}
		else if(this.playerCount > 1 && this.playerNumber == 1) {
			switch (info.which) {
			case 65:	// left (A Key)
				info.preventDefault();
				
				// Workaround for sticky keys bug: reject if arriving on same tick as onKeyUp event
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 87:	// up (W Key)
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 68:	// right (S Key)
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 83:	// down (D Key)
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			}
		}
		else {
			switch (info.which) {
			case 37:	// left arrow
				info.preventDefault();
				
				// Workaround for sticky keys bug: reject if arriving on same tick as onKeyUp event
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 38:	// up arrow
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 39:	// right arrow
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 40:	// down arrow
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			case 65:	// left (A Key)
				info.preventDefault();
				
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 87:	// up (W Key)
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 68:	// right (S Key)
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 83:	// down (D Key)
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			case 100:	// left (Numpad 4)
				info.preventDefault();
				
				if (this.lastlefttick < tickcount)
					this.leftkey = true;
				
				break;
			case 104:	// up (Numpad 8)
				info.preventDefault();
				
				if (this.lastuptick < tickcount)
					this.upkey = true;
					
				break;
			case 102:	// right (Numpad 6)
				info.preventDefault();
				
				if (this.lastrighttick < tickcount)
					this.rightkey = true;
					
				break;
			case 98:	// down (Numpad 2)
				info.preventDefault();
				
				if (this.lastdowntick < tickcount)
					this.downkey = true;
				
				break;
			}
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
		
		if(this.playerCount > 1 && this.playerNumber == 2) {
			switch (info.which) {
			case 37:	// left arrow
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 38:	// up arrow
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 39:	// right arrow
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 40:	// down arrow
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			case 100:	// left (Numpad 4)
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 104:	// up (Numpad 8)
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 102:	// right (Numpad 6)
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 98:	// down (Numpad 2)
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			}
		}
		else if(this.playerCount > 1 && this.playerNumber == 1) {
			switch (info.which) {
			case 65:	// left (A Key)
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 87:	// up (W Key)
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 68:	// right (S Key)
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 83:	// down (D Key)
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			}
		}
		else {
			switch (info.which) {
			case 37:	// left arrow
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 38:	// up arrow
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 39:	// right arrow
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 40:	// down arrow
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			case 65:	// left (A Key)
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 87:	// up (W Key)
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 68:	// right (S Key)
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 83:	// down (D Key)
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			case 100:	// left (Numpad 4)
				info.preventDefault();
				this.leftkey = false;
				this.lastlefttick = tickcount;
				break;
			case 104:	// up (Numpad 8)
				info.preventDefault();
				this.upkey = false;
				this.lastuptick = tickcount;
				break;
			case 102:	// right (Numpad 6)
				info.preventDefault();
				this.rightkey = false;
				this.lastrighttick = tickcount;
				break;
			case 98:	// down (Numpad 2)
				info.preventDefault();
				this.downkey = false;
				this.lastdowntick = tickcount;
				break;
			}
		}
	};

	behinstProto.tick = function ()
	{
		
		if (this.dataArray != null)
		{
			this.multiplePlayers = (this.dataArray.instances[0].at(8, 0, 0) > 1);
			this.paused = (this.dataArray.instances[0].at(13, 0, 0) == 1);
			this.playerCount = this.dataArray.instances[0].at(45, 0, 0);
		}
		else
		{
			return;
		}
		
		if(this.dataArray.instances[0].at(39, 0, 0) == 1)
			this.inst.opacity = 1.0;
		
		switch(this.playerNumber)
		{
		case 1:
			if (this.dataArray.instances[0].at(14, 0, 0) <= 0)
				this.runtime.DestroyInstance(this.inst);
			
			break;
		case 2:
			if (this.dataArray.instances[0].at(15, 0, 0) <= 0)
				this.runtime.DestroyInstance(this.inst);
			
			break;
		case 3:
			if (this.dataArray.instances[0].at(23, 0, 0) <= 0)
				this.runtime.DestroyInstance(this.inst);
			
			break;
		case 4:
			if (this.dataArray.instances[0].at(26, 0, 0) <= 0)
				this.runtime.DestroyInstance(this.inst);
			
			break;
		}
		
		if (!this.paused &&
			this.esckey &&
			this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber)
		{
			this.dataArray.instances[0].set(13, 0, 0, 1);
			this.dataArray.instances[0].set(33, 0, 0, -1);
			this.dataArray.instances[0].set(35, 0, 0, 1);
			this.esckey = false;
		}
		else if (this.paused &&
				this.esckey &&
				this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber)
		{
			this.dataArray.instances[0].set(13, 0, 0, 0);
			this.dataArray.instances[0].set(33, 0, 0, -2);
			this.dataArray.instances[0].set(35, 0, 0, 1);
			this.esckey = false;
		}
		
		var dt = this.runtime.getDt(this.inst);
		
		var left = this.leftkey || this.simleft;
		var right = this.rightkey || this.simright;
		var up = this.upkey || this.simup;
		var down = this.downkey || this.simdown;
		this.simleft = false;
		this.simright = false;
		this.simup = false;
		this.simdown = false;
		
		if (this.playerCount == 0)
		{
			this.leftkey = false;
			this.rightkey = false;
			this.upkey = false;
			this.downkey = false;
		}
		
		if (!this.enabled)
			return;
		
		if (this.paused)
		{
			this.esckey = false;
			return;
		}
		
		if (this.dataArray.instances[0].at(38, 0, 0) > 0 &&
			this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber)
			this.dataArray.instances[0].set(38, 0, 0, this.dataArray.instances[0].at(38, 0, 0) - 1);
		
		if (this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber)
		{
			var expMult = this.dataArray.instances[0].at(6, 0, 0);
			var level = this.dataArray.instances[0].at(7, 0, 0);
			var currentExp = this.dataArray.instances[0].at(2, 0, 0);
			
			if ((expMult * level) <= currentExp)
			{
				this.dataArray.instances[0].set(2, 0, 0, (currentExp - (expMult * level)));
				this.dataArray.instances[0].set(7, 0, 0, level + 1);
			}
			
			var zoom = 1.0;
			
			for(var i = 0; i < this.players.players.length; i += 1)
			{
				
				if(typeof this.players.players[i].instances[0] == 'undefined')
					continue;
					
				var playerNum = 0;
				
				for(var i2 = 0; i2 < this.players.players[i].instances[0].behavior_insts.length; i2 += 1)
				{
					if(typeof this.players.players[i].instances[0].behavior_insts[i2].playerNumber !=
						'undefined')
					{
						playerNum = this.players.players[i].instances[0].behavior_insts[i2].playerNumber;
					}
				}
				
				if(playerNum == 0)
					continue;
				
				var tempZoom = 1.0;
				
				var thisX = this.inst.x
				var thisY = this.inst.y
				
				var thatX = this.players.players[i].instances[0].x
				var thatY = this.players.players[i].instances[0].y
				
				if (Math.sqrt((Math.pow((thisX - thatX), 2)) + (Math.pow((thisY - thatY), 2))) > 500)
					tempZoom = (1.0/((1.0/500.0) * Math.sqrt((Math.pow((thisX - thatX), 2)) +
						(Math.pow((thisY - thatY), 2)))));
					
				if (tempZoom < zoom)
					zoom = tempZoom;
					
			}
			
			this.dataArray.instances[0].set(36, 0, 0, zoom);
		}
		
		var direction = 0;
		
		var directionCounts = [0, 0, 0, 0];
		
		var onExit = false;
		
		if (this.goals != 0 &&
			this.playerNumber != 0 &&
			this.dataArray.instances[0].at(39, 0, 0) >= 1)
		{
			for (var i = 0; i < this.goals.instances.length; i += 1)
			{
				if(typeof this.goals.instances[i] == 'undefined')
					continue;
				
				if(typeof this.goals.instances[i].behavior_insts[0] == 'undefined')
					continue;
				
				if(typeof this.goals.instances[i].behavior_insts[0].direction == 'undefined')
					continue;
				
				direction = this.goals.instances[i].behavior_insts[0].direction;
				
				directionCounts[direction - 1] += 1;
				
				var collision = this.runtime.testOverlap(this.inst, this.goals.instances[i]);
				
				if (!this.exiting && collision && this.dataArray.instances[0].at(19, 0, 0) <= 0)
				{
					switch (this.playerNumber)
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
					
					this.dataArray.instances[0].set(40, 0, 0,
						this.dataArray.instances[0].at(40, 0, 0) + 1);
					this.exiting = true;
					onExit = true;
				}
				else if(this.exiting &&
					!collision &&
					this.dataArray.instances[0].at(19, 0, 0) <= 0 &&
					!onExit)
				{
					this.dataArray.instances[0].set(40, 0, 0,
						this.dataArray.instances[0].at(40, 0, 0) - 1);
					this.exiting = false;
				}
				
				var playerCount = this.dataArray.instances[0].at(8, 0, 0);
				var playersExiting = this.dataArray.instances[0].at(40, 0, 0);
				
				if (this.dataArray.instances[0].at(19, 0, 0) <= 0 &&
					this.exiting &&
					this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber &&
					playerCount <= playersExiting)
				{
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
					
					return;
				}
				
				if (this.dataArray.instances[0].at(19, 0, 0) > 0 && !this.exiting)
				{
					var exitDirection = 0;
					switch (this.playerNumber)
					{
					case 1:
						if (this.dataArray.instances[0].at(41, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(38, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(28, 0, 0) >= 0 &&
							this.dataArray.instances[0].at(37, 0, 0) <= 0)
						{
							this.dataArray.instances[0].set(19, 0, 0,
								this.dataArray.instances[0].at(19, 0, 0) - 1);
							this.dataArray.instances[0].set(8, 0, 0,
								this.dataArray.instances[0].at(8, 0, 0) - 1);
							this.runtime.DestroyInstance(this.inst);
							return;
						}
					
						exitDirection = this.dataArray.instances[0].at(41, 0, 0);
						break;
					case 2:
						if (this.dataArray.instances[0].at(42, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(38, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(29, 0, 0) >= 0 &&
							this.dataArray.instances[0].at(37, 0, 0) <= 0)
						{
							this.dataArray.instances[0].set(19, 0, 0,
								this.dataArray.instances[0].at(19, 0, 0) - 1);
							this.dataArray.instances[0].set(8, 0, 0,
								this.dataArray.instances[0].at(8, 0, 0) - 1);
							this.runtime.DestroyInstance(this.inst);
							return;
						}
					
						exitDirection = this.dataArray.instances[0].at(42, 0, 0);
						break;
					case 3:
						if (this.dataArray.instances[0].at(43, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(38, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(30, 0, 0) >= 0 &&
							this.dataArray.instances[0].at(37, 0, 0) <= 0)
						{
							this.dataArray.instances[0].set(19, 0, 0,
								this.dataArray.instances[0].at(19, 0, 0) - 1);
							this.dataArray.instances[0].set(8, 0, 0,
								this.dataArray.instances[0].at(8, 0, 0) - 1);
							this.runtime.DestroyInstance(this.inst);
							return;
						}
					
						exitDirection = this.dataArray.instances[0].at(43, 0, 0);
						break;
					case 4:
						if (this.dataArray.instances[0].at(44, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(38, 0, 0) <= 0 &&
							this.dataArray.instances[0].at(31, 0, 0) >= 0 &&
							this.dataArray.instances[0].at(37, 0, 0) <= 0)
						{
							this.dataArray.instances[0].set(19, 0, 0,
								this.dataArray.instances[0].at(19, 0, 0) - 1);
							this.dataArray.instances[0].set(8, 0, 0,
								this.dataArray.instances[0].at(8, 0, 0) - 1);
							this.runtime.DestroyInstance(this.inst);
							return;
						}
					
						exitDirection = this.dataArray.instances[0].at(44, 0, 0);
						break;
					}
					
					if (exitDirection == 0)
						exitDirection = Math.floor(Math.random() * 4) + 1;
					
					var newDirection = 0;
					
					switch (exitDirection)
					{
					case 1:
						switch (this.layoutAngle)
						{
						case 0:
							newDirection = 2;
							break;
						case 90:
							newDirection = 3;
							break;
						case 180:
							newDirection = 1;
							break;
						default:
							newDirection = 4;
							break;
						}
						break;
					case 2:
						switch (this.layoutAngle)
						{
						case 0:
							newDirection = 1;
							break;
						case 90:
							newDirection = 4;
							break;
						case 180:
							newDirection = 2;
							break;
						default:
							newDirection = 3;
							break;
						}
						break;
					case 3:
						switch (this.layoutAngle)
						{
						case 0:
							newDirection = 4;
							break;
						case 90:
							newDirection = 1;
							break;
						case 180:
							newDirection = 3;
							break;
						default:
							newDirection = 2;
							break;
						}
						break;
					default:
						switch (this.layoutAngle)
						{
						case 0:
							newDirection = 3;
							break;
						case 90:
							newDirection = 2;
							break;
						case 180:
							newDirection = 4;
							break;
						default:
							newDirection = 1;
							break;
						}
						break;
					}
					
					if(directionCounts[newDirection - 1] == this.playerNumber &&
						!this.placed &&
						this.dataArray.instances[0].at(37, 0, 0) <= 0 &&
						this.dataArray.instances[0].at(38, 0, 0) <= 0)
					{
						switch (newDirection)
						{
						case 1:
							this.inst.x = this.goals.instances[i].x + 64;
							this.inst.y = this.goals.instances[i].y;
							this.inst.opacity = 1.0;
							this.inst.set_bbox_changed();
							this.placed = true;
							if(this.bars != 0)
							{
								var layer = this.runtime.getLayerByNumber(1);
								var newBars = this.runtime.createInstance(this.bars, layer);
								newBars.x = this.goals.instances[i].x + 32;
								newBars.y = this.goals.instances[i].y;
								newBars.set_bbox_changed();
							}
							break;
						case 2:
							this.inst.x = this.goals.instances[i].x - 64;
							this.inst.y = this.goals.instances[i].y;
							this.inst.opacity = 1.0;
							this.inst.set_bbox_changed();
							this.placed = true;
							if(this.bars != 0)
							{
								var layer = this.runtime.getLayerByNumber(1);
								var newBars = this.runtime.createInstance(this.bars, layer);
								newBars.x = this.goals.instances[i].x - 32;
								newBars.y = this.goals.instances[i].y;
								newBars.set_bbox_changed();
							}
							break;
						case 3:
							this.inst.x = this.goals.instances[i].x;
							this.inst.y = this.goals.instances[i].y + 64;
							this.inst.opacity = 1.0;
							this.inst.set_bbox_changed();
							this.placed = true;
							if(this.bars != 0)
							{
								var layer = this.runtime.getLayerByNumber(1);
								var newBars = this.runtime.createInstance(this.bars, layer);
								newBars.x = this.goals.instances[i].x;
								newBars.y = this.goals.instances[i].y + 32;
								newBars.set_bbox_changed();
							}
							break;
						default:
							this.inst.x = this.goals.instances[i].x;
							this.inst.y = this.goals.instances[i].y - 64;
							this.inst.opacity = 1.0;
							this.inst.set_bbox_changed();
							this.placed = true;
							if(this.bars != 0)
							{
								var layer = this.runtime.getLayerByNumber(1);
								var newBars = this.runtime.createInstance(this.bars, layer);
								newBars.x = this.goals.instances[i].x;
								newBars.y = this.goals.instances[i].y - 32;
								newBars.set_bbox_changed();
							}
							break;
						}
					}
				}
				else if (this.playerNumber != 0 &&
					this.dataArray.instances[0].at(35, 0, 0) == this.playerNumber &&
					this.dataArray.instances[0].at(19, 0, 0) <= 0)
				{
					if (this.dataArray.instances[0].at(41, 0, 0) != 0)
						this.dataArray.instances[0].set(41, 0, 0, 0);
					if (this.dataArray.instances[0].at(42, 0, 0) != 0)
						this.dataArray.instances[0].set(42, 0, 0, 0);
					if (this.dataArray.instances[0].at(43, 0, 0) != 0)
						this.dataArray.instances[0].set(43, 0, 0, 0);
					if (this.dataArray.instances[0].at(44, 0, 0) != 0)
						this.dataArray.instances[0].set(44, 0, 0, 0);
				}
			}
		}
		
		if (this.inst.width > 16 || this.inst.height > 16)
		{
			this.inst.width -= 4;
			this.inst.height = this.inst.width;
			this.inst.set_bbox_changed();
			if(this.inst.width <= 16)
			{
				this.dataArray.instances[0].set(19, 0, 0, this.dataArray.instances[0].at(19, 0, 0) - 1);
			}
			return;
		}
		else if (this.inst.width < 16 || this.inst.height < 16)
		{
			this.inst.width = 16;
			this.inst.height = this.inst.width;
			this.inst.set_bbox_changed();
		}
		
		// Is already overlapping solid: must have moved itself in (e.g. by rotating or being crushed),
		// so push out
		var collobj = this.runtime.testOverlapSolid(this.inst);
		if (collobj)
		{
			this.runtime.registerCollision(this.inst, collobj);
			if (!this.runtime.pushOutSolidNearest(this.inst))
				return;		// must be stuck in solid
		}
		
		// Ignoring input: ignore all keys
		if (this.ignoreInput)
		{
			left = false;
			right = false;
			up = false;
			down = false;
		}
		
		// Up & down mode: ignore left & right keys
		if (this.directions === 0)
		{
			left = false;
			right = false;
		}
		// Left & right mode: ignore up & down keys
		else if (this.directions === 1)
		{
			up = false;
			down = false;
		}
		
		// 4 directions mode: up/down take priority over left/right
		if (this.directions === 2 && (up || down))
		{
			left = false;
			right = false;
		}
		
		// Apply deceleration when no arrow key pressed, for each axis
		if (left == right)	// both up or both down
		{
			if (this.dx < 0)
			{
				this.dx += this.dec * dt;
				
				if (this.dx > 0)
					this.dx = 0;
			}
			else if (this.dx > 0)
			{
				this.dx -= this.dec * dt;
				
				if (this.dx < 0)
					this.dx = 0;
			}
		}
		
		if (up == down)
		{
			if (this.dy < 0)
			{
				this.dy += this.dec * dt;
				
				if (this.dy > 0)
					this.dy = 0;
			}
			else if (this.dy > 0)
			{
				this.dy -= this.dec * dt;
				
				if (this.dy < 0)
					this.dy = 0;
			}
		}
		
		// Apply acceleration
		if (left && !right)
		{
			// Moving in opposite direction to current motion: add deceleration
			if (this.dx > 0)
				this.dx -= (this.acc + this.dec) * dt;
			else
				this.dx -= this.acc * dt;
		}
		
		if (right && !left)
		{
			if (this.dx < 0)
				this.dx += (this.acc + this.dec) * dt;
			else
				this.dx += this.acc * dt;
		}
		
		if (up && !down)
		{
			if (this.dy > 0)
				this.dy -= (this.acc + this.dec) * dt;
			else
				this.dy -= this.acc * dt;
		}
		
		if (down && !up)
		{
			if (this.dy < 0)
				this.dy += (this.acc + this.dec) * dt;
			else
				this.dy += this.acc * dt;
		}
		
		var ax, ay;
		
		if (this.dx !== 0 || this.dy !== 0)
		{
			// Limit to max speed
			var speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
			
			if (speed > this.maxspeed)
			{
				// Limit vector magnitude to maxspeed
				var a = Math.atan2(this.dy, this.dx);
				this.dx = this.maxspeed * Math.cos(a);
				this.dy = this.maxspeed * Math.sin(a);
			}
			
			// Save old position and angle
			var oldx = this.inst.x;
			var oldy = this.inst.y;
			var oldangle = this.inst.angle;
			
			var tempX = 0;
			var tempY = 0;
			
			// Calculate directional movement based on layout angle
			switch(this.layoutAngle) {
			case 90:
				tempX = (0 - this.dy) * dt;
				tempY = this.dx * dt;
				break;
			case 180:
				tempX = (0 - this.dx) * dt;
				tempY = (0 - this.dy) * dt;
				break;
			case 270:
				tempX = this.dy * dt;
				tempY = (0 - this.dx) * dt;
				break;
			default:
				tempX = this.dx * dt;
				tempY = this.dy * dt;
				break;
			}
			
			// Attempt X movement
			this.inst.x += tempX;
			this.inst.set_bbox_changed();
			
			collobj = this.runtime.testOverlapSolid(this.inst);
			if (collobj)
			{
				this.inst.x = oldx;
				
				switch(this.layoutAngle) {
				case 90:
					this.dy = 0;
					break
				case 180:
					this.dx = 0;
					break;
				case 270:
					this.dy = 0;
					break;
				default:
					this.dx = 0;
					break;
				}
				
				this.inst.set_bbox_changed();
				this.runtime.registerCollision(this.inst, collobj);
			}
			
			// Attempt Y movement
			this.inst.y += tempY;
			this.inst.set_bbox_changed();
			
			collobj = this.runtime.testOverlapSolid(this.inst);
			if (collobj)
			{
				this.inst.y = oldy;
				
				switch(this.layoutAngle) {
				case 90:
					this.dx = 0;
					break
				case 180:
					this.dy = 0;
					break;
				case 270:
					this.dx = 0;
					break;
				default:
					this.dy = 0;
					break;
				}
				
				this.inst.set_bbox_changed();
				this.runtime.registerCollision(this.inst, collobj);
			}
			
			ax = cr.round6dp(this.dx);
			ay = cr.round6dp(this.dy);
			
			// Apply angle so long as object is still moving and isn't entirely blocked by a solid
			if (ax !== 0 || ay !== 0)
			{
				if (this.angleMode === 1)	// 90 degree intervals
					this.inst.angle = cr.to_clamped_radians(Math.round(
						cr.to_degrees(Math.atan2(ay, ax)) / 90.0) * 90.0);
				else if (this.angleMode === 2)	// 45 degree intervals
					this.inst.angle = cr.to_clamped_radians(Math.round(
						cr.to_degrees(Math.atan2(ay, ax)) / 45.0) * 45.0);
				else if (this.angleMode === 3)	// 360 degree
					this.inst.angle = Math.atan2(ay, ax);
			}
				
			this.inst.set_bbox_changed();
			
			if (this.inst.angle != oldangle)
			{
				collobj = this.runtime.testOverlapSolid(this.inst);
				if (collobj)
				{
					this.inst.angle = oldangle;
					this.inst.set_bbox_changed();
					this.runtime.registerCollision(this.inst, collobj);
				}
			}
		}
	};

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	cnds.IsMoving = function ()
	{
		return this.dx !== 0 || this.dy !== 0;
	};
	
	cnds.CompareSpeed = function (cmp, s)
	{
		var speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
		
		return cr.do_cmp(speed, cmp, s);
	};

	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	acts.Stop = function ()
	{
		this.dx = 0;
		this.dy = 0;
	};
	
	acts.Reverse = function ()
	{
		this.dx *= -1;
		this.dy *= -1;
	};
	
	acts.SetIgnoreInput = function (ignoring)
	{
		this.ignoreInput = ignoring;
	};
	
	acts.SetSpeed = function (speed)
	{
		if (speed < 0)
			speed = 0;
		if (speed > this.maxspeed)
			speed = this.maxspeed;
			
		// Speed is new magnitude of vector of motion
		var a = Math.atan2(this.dy, this.dx);
		this.dx = speed * Math.cos(a);
		this.dy = speed * Math.sin(a);
	};
	
	acts.SetMaxSpeed = function (maxspeed)
	{
		this.maxspeed = maxspeed;
		
		if (this.maxspeed < 0)
			this.maxspeed = 0;
	};
	
	acts.SetAcceleration = function (acc)
	{
		this.acc = acc;
		
		if (this.acc < 0)
			this.acc = 0;
	};
	
	acts.SetDeceleration = function (dec)
	{
		this.dec = dec;
		
		if (this.dec < 0)
			this.dec = 0;
	};
	
	acts.SimulateControl = function (ctrl)
	{
		// 0=left, 1=right, 2=up, 3=down
		switch (ctrl) {
		case 0:		this.simleft = true;	break;
		case 1:		this.simright = true;	break;
		case 2:		this.simup = true;		break;
		case 3:		this.simdown = true;	break;
		}
	};
	
	acts.SetEnabled = function (en)
	{
		this.enabled = (en === 1);
	};
	
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
	
	acts.SetPlayerNumber = function (number)
	{
		this.playerNumber = number;
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

	exps.Speed = function (ret)
	{
		ret.set_float(Math.sqrt(this.dx * this.dx + this.dy * this.dy));
	};
	
	exps.MaxSpeed = function (ret)
	{
		ret.set_float(this.maxspeed);
	};
	
	exps.Acceleration = function (ret)
	{
		ret.set_float(this.acc);
	};
	
	exps.Deceleration = function (ret)
	{
		ret.set_float(this.dec);
	};
	
	exps.MovingAngle = function (ret)
	{
		ret.set_float(cr.to_degrees(Math.atan2(this.dy, this.dx)));
	};
	
	exps.VectorX = function (ret)
	{
		ret.set_float(this.dx);
	};
	
	exps.VectorY = function (ret)
	{
		ret.set_float(this.dy);
	};
}());