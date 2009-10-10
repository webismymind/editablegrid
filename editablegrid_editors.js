
/**
 * Abstract cell editor
 * Base class for all cell editors
 */

function CellEditor() 
{
}

CellEditor.prototype._edit = function(editablegrid, rowIndex, columnIndex, element, value) 
{
	// remember all the things we need to apply/cancel edition
	element.originalValue = value;
	element.editablegrid = editablegrid;
	element.column = editablegrid.columns[columnIndex];
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;
	
	// call the specialized edit method
	return this.edit(element, value);
};

CellEditor.prototype.cancelEditing = function(element) 
{
	// render value before editon
	with (this) element.column.cellrenderer.render(element, element.originalValue);
};

CellEditor.prototype.applyEditing = function(element, newValue) 
{
	with (this) {
		
		// update model
		element.editablegrid.setValueAt(element.rowIndex, element.columnIndex, newValue);

		// let the user handle the model change
		element.editablegrid.modelChanged(element.rowIndex, element.columnIndex, newValue);
		
		// render new value
		element.column.cellrenderer.render(element, newValue);
	}
};

CellEditor.prototype.edit = function(element, value) {};

/**
 * Input cell editor.
 * Base class for cell editors based on HTML form inputs 
 */

InputCellEditor.prototype = new CellEditor;

function InputCellEditor(inputType)
{
	CellEditor();
   	this.super = CellEditor.prototype;
   	this.inputType = inputType;
};

InputCellEditor.prototype.edit = function(element, value)
{
	// create input field
	var htmlInput = document.createElement("input");
	htmlInput.setAttribute("type", this.inputType);
	htmlInput.value = value;
	htmlInput.celleditor = this;
	
	// clear cell and add input field
	while (element.hasChildNodes()) element.removeChild(element.firstChild);
	element.appendChild(htmlInput);
	
	// give focus to the created text field
	htmlInput.select();
	htmlInput.focus();

	return htmlInput; 
};

/**
 * Text cell editor
 * Class to edit a cell with an HTML text input 
 */

TextCellEditor.prototype = new InputCellEditor;

function TextCellEditor()
{
	InputCellEditor("text");
	this.super = InputCellEditor.prototype; 
};

TextCellEditor.prototype.edit = function(element, value)
{
	// call base edit method to create html input
	var htmlInput = this.super.edit.call(this, element, value);
	
	// listen to pressed keys
	htmlInput.onkeypress = function(event) {

		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) this.celleditor.applyEditing(this.parentNode, this.value);
		
		// ESC: cancel editing
		if (event.keyCode == 27) this.celleditor.cancelEditing(this.parentNode);
	};
};
