function GetBehaviorSettings()
{
	return {
		"name":			"Manager",
		"id":			"REDManager",
		"version":		"1.0",
		"description":		"Manages the game.",
		"author":		"Glitchfinder, Scirra",
		"help url":		"",
		"category":		"RED",
		"flags":		0
	};
};

//////////////////////////////////////////////////////////////
// Actions

var name = "Movement Angle";
var desc = "The current angle of the layout. Should be 0, 90, 180, or 270.";
var init = "0";

var listName	= "Set movement angle";
var display	= "Set {my} angle relative to the layout to <i>{0}</i>.";
var desc2	= "Set the object's angle relative to the layout.";

AddNumberParam(name, desc, init);
AddAction(9, 0, listName, "", display, desc2, "SetMovementAngle");

name = "Data Array";
desc = "The data array. Should be an Array object.";

listName	= "Set data array";
display		= "Set {my} data array to <i>{0}</i>.";
desc2		= "Pass in the project's data array.";

AddObjectParam(name, desc);
AddAction(11, 0, listName, "", display, desc2, "SetDataArray");

name = "Player Object";
desc = "Add a player to the object. Should be a sprite with the REDPlayer behavior.";

listName	= "Add a player";
display		= "Added the player <i>{0}</i> to {my}.";
desc2		= "Add a player object.";

AddObjectParam(name, desc);
AddAction(12, 0, listName, "", display, desc2, "AddPlayer");

name = "Exit Tile Object";
desc = "Add the exit tile to the object. Should be a sprite with the REDEXITTile behavior.";

listName	= "Add an exit tile";
display		= "Added the <i>{0}</i> exit tile to {my}.";
desc2		= "Add an exit tile object.";

AddObjectParam(name, desc);
AddAction(13, 0, listName, "", display, desc2, "AddGoal");

name = "Barred Gate Object";
desc = "Add the barred gate tile to the object. Should be a sprite with the Solid behavior.";

listName	= "Add a barred gate tile";
display		= "Added the <i>{0}</i> barred gate tile to {my}.";
desc2		= "Add a barred gate tile object.";

AddObjectParam(name, desc);
AddAction(14, 0, listName, "", display, desc2, "AddBar");

name = "Orange Enemy Object";
desc = "Add the orange enemy sprite to the object. ";
desc += "Should be a sprite with the REDORANGEEnemy behavior.";

listName	= "Add an orange enemy";
display		= "Added the <i>{0}</i> orange enemy to {my}.";
desc2		= "Add an orange enemy object.";

AddObjectParam(name, desc);
AddAction(15, 0, listName, "", display, desc2, "AddOrange");

//////////////////////////////////////////////////////////////
// Expressions

ACESDone();

// Property grid properties for this plugin
var property_list = [];
	
// Called by IDE when a new behavior type is to be created
function CreateIDEBehaviorType()
{
	return new IDEBehaviorType();
}

// Class representing a behavior type in the IDE
function IDEBehaviorType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new behavior instance of this type is to be created
IDEBehaviorType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");

	// Save the constructor parameters
	this.instance = instance;
	this.type = type;

	// Set the default property values from the property table
	this.properties = {};

	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function() {}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name) {}
