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

/* 
 * Test suite:
 * - quit with escape with match (IE/FF: OK)
 * - quit with escape without match (IE/FF: OK)
 * - save with click on suggestion (IE/FF: OK)
 * - save with enter with match (IE/FF: OK)
 * - save with enter without match (IE/FF: OK)
 * - save with enter with match, but very quickly before suggestion appears (IE/FF: OK)
 * - type to have a suggestion then continue to have no match and have the list disappear (IE/FF: OK)
 * - save with blur (click elsewhere) with match (FF: OK/IE: KO)
 * - save with blur (click elsewhere) without match (FF: OK/IE: KO)
 */

function AutocompleteCellEditor(config) 
{
	// default options
	this.suggestions = [("no suggestions")];

	// erase defaults with given options
	this.init(config); 
};

//inherits TextCellEditor functionalities
AutocompleteCellEditor.prototype = new TextCellEditor();

//redefine displayEditor to setup autocomplete
AutocompleteCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// setup autocomplete
	$(htmlInput).autocomplete({
		source: this.suggestions,

		open: function() {
			// the field cannot be blurred until the autocomplete list has gone away
			// otherwise the text field disappears before passing in 'select' when clicking on a suggestion
			this.onblur_backup = this.onblur;
			this.onblur = null;
		},

		select: function(event, ui) {
			// apply value when it has been selected either with a click or with ENTER
			this.celleditor.applyEditing(this.element, ui.item.value); 
		},

		close: function(event, ui) {
			// call original onblur event, only if this close is due to a blurring of the suggestion list
			// indeed, close can be called if there is no matching proposal anymore, it does not necessarily mean that edition is done
			// on FF eventPhase is 2 only when close is called due to a blurring
			// on IE not, and so on IE we cannot blur the text field, unless I find something else to distinguish between the two types of close
			if (event.eventPhase == 2 && this.onblur_backup != null) this.onblur_backup();
		}
	});	

	// when pressing ENTER we need to destroy the autocomplete
	// otherwise it would stay visible if appearing after the text field was removed
	var onkeydown = htmlInput.onkeydown;
	htmlInput.onkeydown = function(event) {
		event = event || window.event;
		var ret = onkeydown.call(this, event);
		if (event.keyCode == 13) $(htmlInput).autocomplete('destroy');
		return ret;
	};
};