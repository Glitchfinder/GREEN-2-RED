// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDTitleBG = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDTitleBG.prototype;
		
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
		this.titleActive = true;
		
		this.spacekey = false;
		this.lastspacetick = -1;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
		// Load properties
		this.resizes = (this.properties[0] === 1);	// 0=no, 1=yes
		
		if(this.resizes)
		{
			var randomX = (Math.floor(Math.random() * 799) + 1);
			var randomY = (Math.floor(Math.random() * 599) + 1);
			
			this.inst.x = randomX;
			this.inst.y = randomY;
			this.inst.set_bbox_changed();
		}
		else
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
		
		if(info.keyCode == 32)
		{
			info.preventDefault();
			
			if (this.lastspacetick < tickcount)
				this.spacekey = true;
		}
	};
	
	behinstProto.onKeyUp = function (info)
	{
		var tickcount = this.runtime.tickcount;
		
		if(info.keyCode == 32)
		{
			info.preventDefault();
			this.spacekey = false;
			this.lastspacetick = tickcount;
		}
	};

	behinstProto.tick = function ()
	{
		
		if(this.dataArray != null) {
			this.titleActive = (this.dataArray.instances[0].at(12, 0, 0) == 1);
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
		
		if (this.spacekey && (this.dataArray.instances[0].at(34, 0, 0) == 0))
		{
			this.dataArray.instances[0].set(34, 0, 0, "Map (Maze)");
			this.dataArray.instances[0].set(12, 0, 0, 2);
			this.spacekey = false;
		}
		
		if (!this.titleActive)
		{
			this.runtime.DestroyInstance(this.inst);
			return;
		}
		
		if (this.resizes)
		{
			var randomnumber = (Math.floor(Math.random() * 4) + 1)
			
			if ((Math.floor(Math.random() * 2)) == 0)
				randomnumber *= -1;
			
			var size = this.inst.width + randomnumber;
			
			if (size > 256)
				size = 256;
			
			if (size < 2)
				size = 2;
			
			this.inst.width = size;
			this.inst.height = size;
			
			this.inst.set_bbox_changed();
		}
		
		var randomnumber = (Math.floor(Math.random() * 4) + 1)
			
		if ((Math.floor(Math.random() * 2)) == 0)
			randomnumber *= -1;
		
		var opacity = (this.inst.opacity + (randomnumber / 100));
		
		if (opacity > 0.60)
			opacity = 0.60;
		
		if (opacity < 0.20)
			opacity = 0.20;
		
		this.inst.opacity = opacity;
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

	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;

}());