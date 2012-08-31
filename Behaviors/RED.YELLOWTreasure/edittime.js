function GetBehaviorSettings()
{
	return {
		"name":			"YELLOWTreasure",
		"id":			"REDYELLOWTreasure",
		"version":		"1.0",
		"description":	"Controls YELLOWTreasure",
		"author":		"Glitchfinder, Scirra",
		"help url":		"",
		"category":		"RED",
		"flags":		0
	};
};

//////////////////////////////////////////////////////////////
// Conditions


//////////////////////////////////////////////////////////////
// Actions

AddObjectParam("Set data array.", "Set the behavior's data array.");
AddAction(0, 0, "Set data array", "", "Set {my} data array to <i>{0}</i>.", "Set the data array.", "SetDataArray");

AddObjectParam("Add player.", "Add a player to the behavior's player array.");
AddAction(1, 0, "Add player", "", "Added player <i>{0}</i> to {my}.", "Add a aplayer object.", "AddPlayer");

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
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}
