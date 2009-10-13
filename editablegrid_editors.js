
/**
 * Abstract cell editor
 * Base class for all cell editors
 */

function CellEditor() {}

CellEditor.prototype.edit = function(rowIndex, columnIndex, element, value) 
{
	// tag element and remember all the things we need to apply/cancel edition
	element.isEditing = true;
	element.originalValue = value;
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;
	
	// call the specialized getEditor method
	var editorInput = this.getEditor(element, value);
	if (!editorInput) return false;
	
	// give access to the cell editor and element from the editor widget
	editorInput.element = element;
	editorInput.celleditor = this;

	// listen to pressed keys
	editorInput.onkeypress = function(event) {

		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) this.celleditor.applyEditing(this.element, this.celleditor.getEditorValue(this));
		
		// ESC: cancel editing
		if (event.keyCode == 27) { this.celleditor.cancelEditing(this.element); return false; }
	};
	
	// and display the resulting editor widget
	this.displayEditor(element, editorInput);
	
	// give focus to the created editor
	editorInput.focus();

	// is simultaneous edition is not allowed, we cancel edition when focus is lost
	if (!this.editablegrid.allowSimultaneousEdition) editorInput.onblur = function(event) { this.celleditor.cancelEditing(this.element); };
};

CellEditor.prototype.getEditor = function(element, value) {
	return null;
};

CellEditor.prototype.getEditorValue = function(editorInput) {
	return editorInput.value;
}

CellEditor.prototype.formatValue = function(value) {
	return value;
}

CellEditor.prototype.displayEditor = function(element, editorInput) 
{
	// static mode: add input field in the table cell
	if (this.editablegrid.editmode == "static") {
		while (element.hasChildNodes()) element.removeChild(element.firstChild);
		element.appendChild(editorInput);
	}
	
	// absolute mode: add input field in absolute position over table cell, leaving current content
	if (this.editablegrid.editmode == "absolute") {
		element.appendChild(editorInput);
		editorInput.style.position = "absolute";
		editorInput.style.left = (this.editablegrid.getCellX(element) + 1) + "px";
		editorInput.style.top = (this.editablegrid.getCellY(element) + 1) + "px";
	}

	// fixed mode: don't show input field in the cell 
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = $(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		editorzone.appendChild(editorInput);
	}
}

CellEditor.prototype._clearEditor = function(element) 
{
	// untag element
	element.isEditing = false;

	// clear fixed editor zone if any
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = $(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
	}	
}

CellEditor.prototype.cancelEditing = function(element) 
{
	with (this) {
		
		// render value before editon
		if (element) column.cellRenderer._render(element.rowIndex, element.columnIndex, element, element.originalValue);
		
		_clearEditor(element);	
	}
};

CellEditor.prototype.applyEditing = function(element, newValue, render) 
{
	with (this) {
		
		// do nothing if the value is rejected by at least one validator
		if (!column.isValid(newValue)) return false;

		// format the value before applying
		var formattedValue = formatValue(newValue);
		
		// update model
		editablegrid.setValueAt(element.rowIndex, element.columnIndex, formattedValue, render);

		// let the user handle the model change
		editablegrid.modelChanged(element.rowIndex, element.columnIndex, element.originalValue, formattedValue, this.editablegrid.tBody.childNodes[element.rowIndex]);
		
		_clearEditor(element);	
	}
};

/**
 * Text cell editor
 * Class to edit a cell with an HTML text input 
 */

TextCellEditor.prototype = new CellEditor();
function TextCellEditor(size) { this.fieldSize = size || 12; };

TextCellEditor.prototype.updateStyle = function(htmlInput)
{
	// red background for invalid numbers
	htmlInput.style.background = this.column.isValid(this.getEditorValue(htmlInput)) ? htmlInput.background_bkp : "#DD0022";
	htmlInput.style.color = this.column.isValid(this.getEditorValue(htmlInput)) ? "" : "#EEEEEE";
}

TextCellEditor.prototype.getEditor = function(element, value)
{
	// create and initialize text field
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "text");
	htmlInput.setAttribute("size", this.fieldSize)
	htmlInput.value = value;

	// listen to keyup to check validity and update style of input field 
	htmlInput.onkeyup = function(event) { this.celleditor.updateStyle(this); };

	return htmlInput; 
};

TextCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	CellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// update style of input field
	this.updateStyle(htmlInput);
	htmlInput.background_bkp = htmlInput.style.background;
	
	// select text
	htmlInput.select();
}

/**
 * Number cell editor
 * Class to edit a numeric cell with an HTML text input 
 */

NumberCellEditor.prototype = new TextCellEditor(4);
function NumberCellEditor(type) { this.type = type; }

NumberCellEditor.prototype.displayEditor = function(element, editorInput) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, editorInput);

	// align field to the right (in case of absolute positioning)
	editorInput.style.left = (parseInt(editorInput.style.left) + element.offsetWidth - editorInput.offsetWidth) + "px";	
}

NumberCellEditor.prototype.formatValue = function(value)
{
	if (value == "") return "";
	return this.type == 'integer' ? parseInt(value) : parseFloat(value);
}

/**
 * Select cell editor
 * Class to edit a cell with an HTML select input 
 */

SelectCellEditor.prototype = new CellEditor();
function SelectCellEditor() {}

SelectCellEditor.prototype.getEditor = function(element, value)
{
	// create select list
	var htmlInput = document.createElement("select");

	// get column option values for this row 
	var optionValues = this.column.getOptionValues(element.rowIndex);
	
	// add these options, selecting the current one
	var index = 0, valueFound = 0;
	for (var optionValue in optionValues) {
	    var option = document.createElement('option');
	    option.text = optionValues[optionValue];
	    option.value = optionValue;
	    htmlInput.add(option, null);
        if (optionValue == value) { htmlInput.selectedIndex = index; valueFound = true; }
        index++;
	}
	
	// if the current value is not in the list add it to the front
	if (!valueFound) {
	    var option = document.createElement('option');
	    option.text = value ? value : "";
	    option.value = value ? value : "";
		htmlInput.add(option, htmlInput.options[0]);
		htmlInput.selectedIndex = 0;
	}
	                  
	// when a new value is selected we apply it
	htmlInput.onchange = function(event) { this.celleditor.applyEditing(this.element, this.value); };
	
	return htmlInput; 
};