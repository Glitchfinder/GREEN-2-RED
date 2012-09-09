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
		this.exiting = false;
		this.placed = false;
		this.playerCount = 0;
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
	};

	behinstProto.onKeyDown = function (info)
	{	
		var tickcount = this.runtime.tickcount;
		
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
			return;

		if(this.dataArray.instances[0].at(39, 0, 0) == 1)
			this.inst.opacity = 1.0;

		if(this.dataArray.instances[0].at(39, 0, 0) <= 0)
			return;

		if(this.dataArray.instances[0].at(19, 0, 0) > 0)
			return;

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