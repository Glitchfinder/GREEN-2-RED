// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.REDRANDOMWall = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.REDRANDOMWall.prototype;
		
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
		this.initialized = 0;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
		this.players.players = new Array();
		this.initialized = 0;
		
		if(this.initialized == 0)
		{
			var randomnumber = (Math.floor(Math.random() * 96) / 100)
			
			if(randomnumber <= 0.35)
			{
				this.runtime.DestroyInstance(this.inst);
			}
			else
			{
				this.inst.opacity = randomnumber;
			}
			
			this.initialized = 1;
		}
	};

	behinstProto.tick = function ()
	{
		if(this.initialized == 0)
		{
			var randomnumber = (Math.floor(Math.random() * 96) / 100)
			
			if(randomnumber <= 0.35)
			{
				this.runtime.DestroyInstance(this.inst);
			}
			else
			{
				this.inst.opacity = randomnumber;
			}
			
			this.initialized = 1;
		}
		
		if(this.dataArray != null) {
			this.paused = (this.dataArray.instances[0].at(13, 0, 0) == 1);
		}
		
		if (!this.enabled)
			return;
		
		if (this.paused)
			return;
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