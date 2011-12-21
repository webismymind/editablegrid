/**
 * Autocomplete cell editor
 * 
 * Text field editor with autocomplete capabilities.
 * Uses the jQuery UI's autocomplete.
 * 
 * @constructor Accepts an option object containing the following properties: 
 * - suggestions: array of possible values, a string specifying a URL or a callback function (see jQuery UI documentation for more information)
 * - fieldSize: integer (default=auto-adapt)
 * - maxLength: integer (default=255)
 * 
 * You may also adapt autocomplete.css to your needs.
 *  
 * @class Class to edit a cell with an autocomplete HTML text input
 * @author Webismymind 
 */

function AutocompleteCellEditor(config) 
{
	// default options
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

	// setup autocomplete
	$(htmlInput).autocomplete({
		source: this.suggestions,

		open: function() {
			// the field cannot be blurred until the autocomplete list has gone away
			// otherwise the text field disappears before passing in 'select'
			this.onblur_backup = this.onblur;
			this.onblur = null;
		},
		
		select: function(event, ui) { 
			// apply value when it has been selected either with a click or with ENTER
			this.celleditor.applyEditing(this.element, ui.item.value); 
		},

		close: function() {
			// call original onblur event
			if (this.onblur_backup != null) this.onblur_backup();
		}
	});	

	// when pressing ENTER we need to close the autocomplete (otherwise it stays visible)
	var onkeydown = htmlInput.onkeydown;
	htmlInput.onkeydown = function(event) {
		event = event || window.event;
		onkeydown.call(this, event);
		if (event.keyCode == 13) $(htmlInput).autocomplete('close');
	};

};