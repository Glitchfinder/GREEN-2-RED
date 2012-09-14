// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDSPIKETrap = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDSPIKETrap.prototype;
		
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
		
		this.defaultControls = false;
		this.dataArray = null;
		this.paused = false;
		this.players = {};
		
		this.currentDirection = -1; // Current direction: 0 = left, 1 = right, 2 = up, 3 = down;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;
	
	behinstProto.reverseDirection = function ()
	{
		this.simleft = false;
		this.simright = false;
		this.simup = false;
		this.simdown = false;
		
		var testX = this.inst.x;
		var testY = this.inst.y;
		
		var tempDirection = this.currentDirection;
		
		switch(this.currentDirection)
		{
		case 0:
			this.inst.x += 32;
			this.inst.set_bbox_changed();
			if(!this.runtime.testOverlapSolid(this.inst))
			{
				this.simright = true;
				this.currentDirection = 1;
			}
			this.inst.x = testX;
			break;
		case 1:
			this.inst.x -= 32;
			this.inst.set_bbox_changed();
			if(!this.runtime.testOverlapSolid(this.inst))
			{
				this.simleft = true;
				this.currentDirection = 0;
			}
			this.inst.x = testX;
			break;
		case 2:
			this.inst.y += 32;
			this.inst.set_bbox_changed();
			if(!this.runtime.testOverlapSolid(this.inst))
			{
				this.simdown = true;
				this.currentDirection = 3;
			}
			this.inst.y = testY;
			break;
		default:
			this.inst.y -= 32;
			this.inst.set_bbox_changed();
			if(!this.runtime.testOverlapSolid(this.inst))
			{
				this.simup = true;
				this.currentDirection = 2;
			}
			this.inst.y = testY;
			break;
		}
		
		if (tempDirection == this.currentDirection)
		{
			this.currentDirection = -1;
			this.chooseDirection();
		}
	}
	
	behinstProto.chooseDirection = function ()
	{
		if (this.currentDirection != -1)
		{
			this.reverseDirection();
			return;
		}
		
		// Next direction: 0 = left, 1 = right, 2 = up, 3 = down;
		var dirs = [0, 1, 2, 3]
		
		dirs.sort(function() {return 0.5 - Math.random()});
		
		var testX = this.inst.x;
		var testY = this.inst.y;
		
		var finished = false;
		
		this.simleft = false;
		this.simright = false;
		this.simup = false;
		this.simdown = false;
		
		for(var i = 0; i < dirs.length; i += 1)
		{
			if(finished)
				continue;
			
			switch(dirs[i])
			{
			case 0:
				this.inst.x -= 32;
				this.inst.set_bbox_changed();
				if(!this.runtime.testOverlapSolid(this.inst))
				{
					finished = true;
					this.simleft = true;
					this.currentDirection = dirs[i];
				}
				this.inst.x = testX;
				break;
			case 1:
				this.inst.x += 32;
				this.inst.set_bbox_changed();
				if(!this.runtime.testOverlapSolid(this.inst))
				{
					finished = true;
					this.simright = true;
					this.currentDirection = dirs[i];
				}
				this.inst.x = testX;
				break;
			case 2:
				this.inst.y -= 32;
				this.inst.set_bbox_changed();
				if(!this.runtime.testOverlapSolid(this.inst))
				{
					finished = true;
					this.simup = true;
					this.currentDirection = dirs[i];
				}
				this.inst.y = testY;
				break;
			default:
				this.inst.y += 32;
				this.inst.set_bbox_changed();
				if(!this.runtime.testOverlapSolid(this.inst))
				{
					finished = true;
					this.simdown = true;
					this.currentDirection = dirs[i];
				}
				this.inst.y = testY;
				break;
			}
		}
		this.inst.set_bbox_changed();
	};
	
	behinstProto.onCreate = function()
	{
		// Load properties
		this.maxspeed = this.properties[0];
		this.acc = this.properties[1];
		this.dec = this.properties[2];
		this.directions = this.properties[3];	// 0=Up & down, 1=Left & right, 2=4 directions, 3=8 directions"
		this.angleMode = this.properties[4];	// 0=No,1=90-degree intervals, 2=45-degree intervals, 3=360 degree (smooth)
		//this.defaultControls = (this.properties[5] === 1);	// 0=no, 1=yes
		
		this.chooseDirection();
		this.players.players = new Array();
		
		var randomnumber = Math.floor(Math.random() * 3)
		
		if(randomnumber >= 2)
			this.runtime.DestroyInstance(this.inst);
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
		
		var dt = this.runtime.getDt(this.inst);
		
		var left = this.leftkey || this.simleft;
		var right = this.rightkey || this.simright;
		var up = this.upkey || this.simup;
		var down = this.downkey || this.simdown;
		
		if (!this.enabled)
			return;
		
		if (this.paused)
			return;
		
		// Is already overlapping solid: must have moved itself in (e.g. by rotating or being crushed),
		// so push out
		var collobj = this.runtime.testOverlapSolid(this.inst);
		if (collobj)
		{
			this.runtime.registerCollision(this.inst, collobj);
			if (!this.runtime.pushOutSolidNearest(this.inst))
				return;		// must be stuck in solid
		}
		
		if (this.simleft == false && this.simright == false && this.simup == false && this.simdown == false)
			this.chooseDirection();
		
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
			
			// Attempt X movement
			this.inst.x += this.dx * dt;
			this.inst.set_bbox_changed();
			
			collobj = this.runtime.testOverlapSolid(this.inst);
			if (collobj)
			{
				this.inst.x = oldx;
				
				this.chooseDirection();
				
				this.dx = 0;
				
				this.inst.set_bbox_changed();
				this.runtime.registerCollision(this.inst, collobj);
			}
			
			// Attempt Y movement
			this.inst.y += this.dy * dt;
			this.inst.set_bbox_changed();
			
			collobj = this.runtime.testOverlapSolid(this.inst);
			if (collobj)
			{
				this.inst.y = oldy;
				
				this.chooseDirection();
				
				this.dy = 0;
				
				this.inst.set_bbox_changed();
				this.runtime.registerCollision(this.inst, collobj);
			}
			
			ax = cr.round6dp(this.dx);
			ay = cr.round6dp(this.dy);
			
			// Apply angle so long as object is still moving and isn't entirely blocked by a solid
			if (ax !== 0 || ay !== 0)
			{
				if (this.angleMode === 1)	// 90 degree intervals
					this.inst.angle = cr.to_clamped_radians(Math.round(cr.to_degrees(Math.atan2(ay, ax)) / 90.0) * 90.0);
				else if (this.angleMode === 2)	// 45 degree intervals
					this.inst.angle = cr.to_clamped_radians(Math.round(cr.to_degrees(Math.atan2(ay, ax)) / 45.0) * 45.0);
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