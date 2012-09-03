// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDWHITEReviver = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDWHITEReviver.prototype;
		
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
		
		this.enabled = true;
		
		this.dataArray = null;
		this.paused = false;
		this.players = {};
		this.online = false;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
		this.players.players = new Array();
		
		this.inst.opacity = 0.5;
		this.online = false;
	};

	behinstProto.tick = function ()
	{
		
		if(this.dataArray != null) {
			this.paused = (this.dataArray.instances[0].at(13, 0, 0) == 1);
		}
		else
		{
			return;
		}
		
		if (!this.enabled)
			return;
		
		if (this.paused)
			return;
		
		var allDead = true;
		
		for(var i = 0; i < this.players.players.length; i += 1)
		{
			if(typeof this.players.players[i].instances[0] == 'undefined')
			{
				if (!this.online)
					continue;
				
				var texname = "";
				
				if(typeof this.players.players[i].animations[0] != 'undefined')
				{
					if(typeof this.players.players[i].animations[0].frames[0] != 'undefined')
					{
						if(typeof this.players.players[i].animations[0].frames[0].texture_file != 'undefined')
						{
							texname = this.players.players[i].animations[0].frames[0].texture_file;
						}
					}
				}

				var texnumber = -1;
				var revivalNumber = 0;
				
				texname = texname.toUpperCase().toLowerCase();
				
				if (~texname.indexOf('red'))
				{
					texnumber = 1;
				}
				else if (~texname.indexOf('indigo'))
				{
					texnumber = 2;
				}
				
				var newPlayer = 0;

				for (var index = 0; index < 4; index += 1)
				{
					switch(index)
					{
					case 0:
						if (this.dataArray.instances[0].at(20, 0, 0) == texnumber)
						{
							if (this.dataArray.instances[0].at(28, 0, 0) >= 0 && this.dataArray.instances[0].at(14, 0, 0) > 0)
							{
								if (this.dataArray.instances[0].at(28, 0, 0) == 0)
								{
									this.dataArray.instances[0].set(28, 0, 0, -1);
									newPlayer = 1;
								}
								else
								{
									this.dataArray.instances[0].set(28, 0, 0, this.dataArray.instances[0].at(28, 0, 0) - 1);
								}
							}
							continue;
						}
						else
						{
							continue;
						}
						
						break;
					case 1:
						if (this.dataArray.instances[0].at(21, 0, 0) == texnumber)
						{
							if (this.dataArray.instances[0].at(29, 0, 0) >= 0 && this.dataArray.instances[0].at(15, 0, 0) > 0)
							{
								if (this.dataArray.instances[0].at(29, 0, 0) == 0)
								{
									this.dataArray.instances[0].set(29, 0, 0, -1);
									newPlayer = 1;
								}
								else
								{
									this.dataArray.instances[0].set(29, 0, 0, this.dataArray.instances[0].at(29, 0, 0) - 1);
								}
							}
							continue;
						}
						else
						{
							continue;
						}
						
						break;
					case 2:
						if (this.dataArray.instances[0].at(24, 0, 0) == texnumber)
						{
							if (this.dataArray.instances[0].at(30, 0, 0) >= 0 && this.dataArray.instances[0].at(23, 0, 0) > 0)
							{
								if (this.dataArray.instances[0].at(30, 0, 0) == 0)
								{
									this.dataArray.instances[0].set(30, 0, 0, -1);
									newPlayer = 1;
								}
								else
								{
									this.dataArray.instances[0].set(30, 0, 0, this.dataArray.instances[0].at(30, 0, 0) - 1);
								}
							}
							continue;
						}
						else
						{
							continue;
						}
						
						break;
					default:
						if (this.dataArray.instances[0].at(27, 0, 0) == texnumber)
						{
							if (this.dataArray.instances[0].at(31, 0, 0) >= 0 && this.dataArray.instances[0].at(26, 0, 0) > 0)
							{
								if (this.dataArray.instances[0].at(31, 0, 0) == 0)
								{
									this.dataArray.instances[0].set(31, 0, 0, -1);
									newPlayer = 1;
								}
								else
								{
									this.dataArray.instances[0].set(31, 0, 0, this.dataArray.instances[0].at(31, 0, 0) - 1);
								}
							}
							continue;
						}
						else
						{
							continue;
						}
						
						break;
					}
				}
				
				if (newPlayer == 1)
				{
					var layer = this.runtime.getLayerByNumber(1);
					newPlayer = this.runtime.createInstance(this.players.players[i], layer);
					newPlayer.x = this.inst.x;
					newPlayer.y = this.inst.y;
					newPlayer.width = 128;
					newPlayer.height = 128;
					newPlayer.set_bbox_changed();
					this.dataArray.instances[0].set(18, 0, 0, "revival");
					this.dataArray.instances[0].set(38, 0, 0, 5);
					this.dataArray.instances[0].set(8, 0, 0, this.dataArray.instances[0].at(8, 0, 0) + 1);
				}
				continue;
			}
			
			var playerNumber = 0;
			
			var playerBehavior = 0;
			
			for(var i2 = 0; i2 < this.players.players[i].instances[0].behavior_insts.length; i2 += 1)
			{
				if(typeof this.players.players[i].instances[0].behavior_insts[i2].playerNumber != 'undefined')
				{
					playerNumber = this.players.players[i].instances[0].behavior_insts[i2].playerNumber;
					playerBehavior = i2;
				}
			}
			
			if(playerNumber == 0)
				return;
				
			switch(playerNumber)
			{
			case 1:
				if (this.dataArray.instances[0].at(28, 0, 0) == -1 && this.dataArray.instances[0].at(14, 0, 0) > 0)
				{
					allDead = false;
					if (this.dataArray.instances[0].at(37, 0, 0) == 1)
					{
						this.players.players[i].instances[0].behavior_insts[playerBehavior].placed = true;
						this.players.players[i].instances[0].x = this.inst.x - 32;
						this.players.players[i].instances[0].y = this.inst.y;
						this.players.players[i].instances[0].set_bbox_changed();
					}
				}
				break;
			case 2:
				if (this.dataArray.instances[0].at(29, 0, 0) == -1 && this.dataArray.instances[0].at(15, 0, 0) > 0)
				{
					allDead = false;
					if (this.dataArray.instances[0].at(37, 0, 0) == 1)
					{
						this.players.players[i].instances[0].behavior_insts[playerBehavior].placed = true;
						this.players.players[i].instances[0].x = this.inst.x + 32;
						this.players.players[i].instances[0].y = this.inst.y;
						this.players.players[i].instances[0].set_bbox_changed();
					}
				}
				
				break;
			case 3:
				if (this.dataArray.instances[0].at(30, 0, 0) == -1 && this.dataArray.instances[0].at(23, 0, 0) > 0)
				{
					allDead = false;
					if (this.dataArray.instances[0].at(37, 0, 0) == 1)
					{
						this.players.players[i].instances[0].behavior_insts[playerBehavior].placed = true;
						this.players.players[i].instances[0].x = this.inst.x;
						this.players.players[i].instances[0].y = this.inst.y - 32;
						this.players.players[i].instances[0].set_bbox_changed();
					}
				}
				
				break;
			default:
				if (this.dataArray.instances[0].at(31, 0, 0) == -1 && this.dataArray.instances[0].at(26, 0, 0) > 0)
				{
					allDead = false;
					if (this.dataArray.instances[0].at(37, 0, 0) == 1)
					{
						this.players.players[i].instances[0].behavior_insts[playerBehavior].placed = true;
						this.players.players[i].instances[0].x = this.inst.x;
						this.players.players[i].instances[0].y = this.inst.y + 32;
						this.players.players[i].instances[0].set_bbox_changed();
					}
				}
				
				break;
			}
			if (!this.online && this.dataArray.instances[0].at(19, 0, 0) <= 0)
			{
				var playercollision = this.runtime.testOverlap(this.inst, this.players.players[i].instances[0])
			
				if(playercollision)
				{
					this.online = true;
					this.inst.opacity = 1.0;
					this.dataArray.instances[0].set(18, 0, 0, "activate");
				}
				
				
			}
		}
		
		if (allDead && !this.online && this.dataArray.instances[0].at(19, 0, 0) <= 0 && this.dataArray.instances[0].at(39, 0, 0) >= 1)
		{
			this.dataArray.instances[0].set(37, 0, 0, 1);
			this.dataArray.instances[0].set(28, 0, 0, -1);
			this.dataArray.instances[0].set(29, 0, 0, -1);
			this.dataArray.instances[0].set(30, 0, 0, -1);
			this.dataArray.instances[0].set(31, 0, 0, -1);
			this.dataArray.instances[0].set(38, 0, 0, 300);
			
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
		
		if ((this.dataArray.instances[0].at(39, 0, 0) == 1) && !allDead && (this.dataArray.instances[0].at(37, 0, 0) == 1))
		{
			this.online = true;
			this.inst.opacity = 1.0;
			this.dataArray.instances[0].set(37, 0, 0, 0);
			this.dataArray.instances[0].set(18, 0, 0, "revival");
		}
	};

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;
	
	acts.SetDataArray = function (array)
	{
		this.dataArray = array;
	};
	
	acts.AddPlayer = function (player)
	{
		this.players.players.push(player);
	};

	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;

}());