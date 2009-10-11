
/**
 * Abstract cell editor
 * Base class for all cell editors
 */

function CellEditor() 
{
}

CellEditor.prototype._edit = function(rowIndex, columnIndex, element, value) 
{
	// remember all the things we need to apply/cancel edition
	element.originalValue = value;
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;
	
	// call the specialized edit method
	return this.edit(element, value);
};

CellEditor.prototype.cancelEditing = function(element) 
{
	with (this) {
		
		// render value before editon
		if (element) column.cellrenderer.render(element, element.originalValue);
	
		// clear fixed editor zone if any
		if (editablegrid.editmode == "fixed") {
			var editorzone = $(this.editablegrid.editorzoneid);
			while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		}
	}
};

CellEditor.prototype.applyEditing = function(element, newValue) 
{
	with (this) {
		
		// update model
		editablegrid.setValueAt(element.rowIndex, element.columnIndex, newValue);

		// let the user handle the model change
		editablegrid.modelChanged(element.rowIndex, element.columnIndex, newValue);
		
		// render new value
		column.cellrenderer.render(element, newValue);

		// clear fixed editor zone if any
		if (editablegrid.editmode == "fixed") {
			var editorzone = $(this.editablegrid.editorzoneid);
			while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		}
	}
};

CellEditor.prototype.edit = function(element, value) {};

/**
 * Input cell editor.
 * Base class for cell editors based on HTML form inputs 
 */

InputCellEditor.prototype = new CellEditor;

function InputCellEditor()
{
	CellEditor();
};

InputCellEditor.prototype.edit = function(element, value, htmlInput)
{
	// give access to the cell editor and element from the editor field
	htmlInput.element = element;
	htmlInput.celleditor = this;

	// when focus is lost we cancel edition
	htmlInput.onblur = function(event) { this.celleditor.cancelEditing(this.element); };

	// listen to pressed keys
	htmlInput.onkeypress = function(event) {

		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) this.celleditor.applyEditing(this.element, this.value);
		
		// ESC: cancel editing
		if (event.keyCode == 27) this.celleditor.cancelEditing(this.element);
	};

	// static mode: add input field in the table cell
	if (this.editablegrid.editmode == "static") {
		while (element.hasChildNodes()) element.removeChild(element.firstChild);
		element.appendChild(htmlInput);
	}
	
	// absolute mode: add input field in absolute position over table cell, leaving current content
	if (this.editablegrid.editmode == "absolute") {
		element.appendChild(htmlInput);
		htmlInput.style.position = "absolute";
		htmlInput.style.left = (this.editablegrid.getCellX(element) + 1) + "px";
		htmlInput.style.top = (this.editablegrid.getCellY(element) + 1) + "px";
	}

	// fixed mode: don't show input field in the cell 
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = $(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		editorzone.appendChild(htmlInput);
	}
	
	// give focus to the created text field
	htmlInput.focus();
};

/**
 * Text cell editor
 * Class to edit a cell with an HTML text input 
 */

TextCellEditor.prototype = new InputCellEditor();

function TextCellEditor(size)
{
	this.fieldSize = size || 16;
};

TextCellEditor.prototype.edit = function(element, value)
{
	// create and initialize text field
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "text");
	htmlInput.setAttribute("size", this.fieldSize)
	htmlInput.value = value;

	// call base edit method to display text field
	InputCellEditor.prototype.edit.call(this, element, value, htmlInput);

	// select text
	htmlInput.select();
	
	return htmlInput; 
};

/**
 * Number cell editor
 * Class to edit a numeric cell with an HTML text input 
 */

NumberCellEditor.prototype = new TextCellEditor(4);

function NumberCellEditor(type)
{
	this.type = type;
};

NumberCellEditor.prototype.isValidNumber = function(value) 
{
	// check that it is a valid number
	if (isNaN(value)) return false;
	
	// for integers check that it's not a float
	if (this.type == "integer" && parseInt(value) != parseFloat(value)) return false;
	
	// the integer or double is valid
	return true;
}

NumberCellEditor.prototype.updateStyle = function(htmlInput)
{
	// red background for invalid numbers
	htmlInput.style.backgroundColor = this.isValidNumber(htmlInput.value) ? "" : "#DD0022";
}

NumberCellEditor.prototype.edit = function(element, value)
{
	// call base edit method to create text input field
	var htmlInput = TextCellEditor.prototype.edit.call(this, element, value);
	
	// update style of input field
	this.updateStyle(htmlInput);
	
	// align field to the right
	if (this.editablegrid.editmode == "absolute") htmlInput.style.left = (parseInt(htmlInput.style.left) + element.offsetWidth - htmlInput.offsetWidth) + "px";
	
	// listen to keyup to check number validity and update style of input field 
	htmlInput.onkeyup = function(event) { this.celleditor.updateStyle(this); };

	return htmlInput;
};

NumberCellEditor.prototype.applyEditing = function(element, newValue) 
{
	// apply only if valid
	return this.isValidNumber(newValue) ? TextCellEditor.prototype.applyEditing.call(this, element, newValue) : false;
};

/**
 * Select cell editor
 * Class to edit a cell with an HTML select input 
 */

SelectCellEditor.prototype = new InputCellEditor();

function SelectCellEditor()
{
};

SelectCellEditor.prototype.edit = function(element, value)
{
	// create select list
	var htmlInput = document.createElement("select");

	// add options, selecting the current one
	var index = 0, valueFound = 0;
	for (var optionValue in this.column.optionValues) {
	    var option = document.createElement('option');
	    option.text = this.column.optionValues[optionValue];
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
	
	// call base edit method to display list
	InputCellEditor.prototype.edit.call(this, element, value, htmlInput);
	
	return htmlInput; 
};
