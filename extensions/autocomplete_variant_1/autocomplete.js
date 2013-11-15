/**
 * Autocomplete cell editor
 * 
 * Text field editor with autocomplete capabilities.
 * Uses the "autocomplete" jQuery plugin.
 * 
 * @constructor Accepts an option object containing the following properties: 
 * - suggestions: array of possible values
 * - autoFill: boolean (default=false)
 * - width: integer (default=300)
 * - fieldSize: integer (default=auto-adapt)
 * - maxLength: integer (default=255)
 * 
 * @class Class to edit a cell with an autocomplete HTML text input
 * @author Original idea by Jasper Visser, integrated by Webismymind 
 */

function AutocompleteCellEditor(config) 
{
	// default options
	this.autoFill = false; 
	this.width = 300; 
	this.suggestions = [("no suggestions")];
	
	// erase defaults with given options
	this.init(config); 
};

// inherits TextCellEditor functionalities
AutocompleteCellEditor.prototype = new TextCellEditor();

// redefine displayEditor to setup autocomplete
AutocompleteCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// disable default blur event handling which interfer when clicking on a suggestion in the autocomplete
	htmlInput.onblur = null;

	// disable default ENTER event wich interfer when pressing ENTER on a suggestion in the autocomplete
	// indeed, our handling on ENTER would happen when the text field value has not been updated yet
	var onkeydown = htmlInput.onkeydown;
	htmlInput.onkeydown = function(event) {
		event = event || window.event;
		if (event.keyCode != 13) onkeydown.call(this, event);
	};
	
	// setup autocomplete
	$(htmlInput).autocomplete(this.suggestions, { 
		autoFill: this.autoFill, 
		width: this.width 
	});
	
	// apply value when it has been selected either with a click or with ENTER
	$(htmlInput).result(function(event, item) {
		this.celleditor.applyEditing(this.element, this.value); 
	});
};