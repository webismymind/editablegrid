
/**
 * Abstract cell editor
 * Base class for all cell editors
 */

function CellEditor() 
{
}

CellEditor.prototype.edit = function(rowIndex, columnIndex, element, value) 
{
	// remember all the things we need to apply/cancel edition
	element.originalValue = value;
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;
	
	// call the specialized getEditor method
	var editorNode = this.getEditor(element, value);
	if (!editorNode) return false;
	
	// give access to the cell editor and element from the editor widget
	editorNode.element = element;
	editorNode.celleditor = this;

	// listen to pressed keys
	editorNode.onkeypress = function(event) {

		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) this.celleditor.applyEditing(this.element, this.value);
		
		// ESC: cancel editing
		// TODO: on FF3.5, using ESC on select has a side effect that the flag image is not displayed: check in FF3.0, IE7 and Safari4
		if (event.keyCode == 27) this.celleditor.cancelEditing(this.element);
	};
	
	// and display the resulting editor widget
	this.displayEditor(element, editorNode);
	
	// give focus to the created editor
	editorNode.focus();

	// is simultaneous edition is not allowed, we cancel edition when focus is lost
	if (!this.editablegrid.allowSimultaneousEdition) editorNode.onblur = function(event) { this.celleditor.cancelEditing(this.element); };
};

CellEditor.prototype.getEditor = function(element, value) {
	return null;
};

CellEditor.prototype.displayEditor = function(element, editorNode) 
{
	// static mode: add input field in the table cell
	if (this.editablegrid.editmode == "static") {
		while (element.hasChildNodes()) element.removeChild(element.firstChild);
		element.appendChild(editorNode);
	}
	
	// absolute mode: add input field in absolute position over table cell, leaving current content
	if (this.editablegrid.editmode == "absolute") {
		element.appendChild(editorNode);
		editorNode.style.position = "absolute";
		editorNode.style.left = (this.editablegrid.getCellX(element) + 1) + "px";
		editorNode.style.top = (this.editablegrid.getCellY(element) + 1) + "px";
	}

	// fixed mode: don't show input field in the cell 
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = $(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		editorzone.appendChild(editorNode);
	}
}

CellEditor.prototype.cancelEditing = function(element) 
{
	with (this) {
		
		// render value before editon
		if (element) column.cellRenderer._render(element.rowIndex, element.columnIndex, element, element.originalValue);
	
		// clear fixed editor zone if any
		if (editablegrid.editmode == "fixed") {
			var editorzone = $(this.editablegrid.editorzoneid);
			while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		}
	}
};

CellEditor.prototype.applyEditing = function(element, newValue, render) 
{
	with (this) {
		
		// update model
		editablegrid.setValueAt(element.rowIndex, element.columnIndex, newValue, render);

		// let the user handle the model change
		editablegrid.modelChanged(element.rowIndex, element.columnIndex, newValue);
		
		// clear fixed editor zone if any
		if (editablegrid.editmode == "fixed") {
			var editorzone = $(this.editablegrid.editorzoneid);
			while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		}
	}
};

/**
 * Text cell editor
 * Class to edit a cell with an HTML text input 
 */

TextCellEditor.prototype = new CellEditor();

function TextCellEditor(size)
{
	this.fieldSize = size || 16;
};

TextCellEditor.prototype.getEditor = function(element, value)
{
	// create and initialize text field
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "text");
	htmlInput.setAttribute("size", this.fieldSize)
	htmlInput.value = value;

	return htmlInput; 
};

TextCellEditor.prototype.displayEditor = function(element, textInput) 
{
	// call base method
	CellEditor.prototype.displayEditor.call(this, element, textInput);

	// select text
	textInput.select();
}

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

NumberCellEditor.prototype.getEditor = function(element, value)
{
	// call base edit method to create text input field
	var htmlInput = TextCellEditor.prototype.getEditor.call(this, element, value);
	
	// listen to keyup to check number validity and update style of input field 
	htmlInput.onkeyup = function(event) { this.celleditor.updateStyle(this); };

	return htmlInput;
};

NumberCellEditor.prototype.displayEditor = function(element, editorNode) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, editorNode);

	// update style of input field
	this.updateStyle(editorNode);
	
	// align field to the right (in case of absolute positioning)
	editorNode.style.left = (parseInt(editorNode.style.left) + element.offsetWidth - editorNode.offsetWidth) + "px";	
}

NumberCellEditor.prototype.applyEditing = function(element, newValue) 
{
	// apply only if valid
	return this.isValidNumber(newValue) ? TextCellEditor.prototype.applyEditing.call(this, element, newValue) : false;
};

/**
 * Select cell editor
 * Class to edit a cell with an HTML select input 
 */

SelectCellEditor.prototype = new CellEditor();

function SelectCellEditor()
{
};

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
