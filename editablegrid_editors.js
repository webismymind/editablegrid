
/**
 * Abstract cell editor
 * @constructor
 * @class Base class for all cell editors
 */

function CellEditor(config) { this.init(config); }

CellEditor.prototype.init = function(config) 
{
	// override default properties with the ones given
	for (var p in config) this[p] = config[p];
};

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
	// - tab does not work with onkeyup (it's too late)
	// - on Safari escape does not work with onkeypress
	// - with onkeydown everything is fine (but don't forget to return false)
	editorInput.onkeydown = function(event) {

		event = event || window.event;
		
		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) {
			this.celleditor.applyEditing(this.element, this.celleditor.getEditorValue(this));
			return false;
		}
		
		// ESC: cancel editing
		if (event.keyCode == 27) { 
			this.celleditor.cancelEditing(this.element); 
			return false; 
		}
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
};

CellEditor.prototype.formatValue = function(value) {
	return value;
};

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
		editorInput.style.left = (this.editablegrid.getCellX(element) - (this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollLeft) : 0) + 1) + "px";
		editorInput.style.top = (this.editablegrid.getCellY(element) - (this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollTop) : 0) + 2) + "px";

		// if number type: align field and its content to the right
		if (this.column.datatype == 'integer' || this.column.datatype == 'double') {
			editorInput.style.left = (parseInt(editorInput.style.left) + element.offsetWidth - editorInput.offsetWidth) + "px";
			editorInput.style.textAlign = "right";
		}
	}

	// fixed mode: don't show input field in the cell 
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = _$(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
		editorzone.appendChild(editorInput);
	}
};

CellEditor.prototype._clearEditor = function(element) 
{
	// untag element
	element.isEditing = false;

	// clear fixed editor zone if any
	if (this.editablegrid.editmode == "fixed") {
		var editorzone = _$(this.editablegrid.editorzoneid);
		while (editorzone.hasChildNodes()) editorzone.removeChild(editorzone.firstChild);
	}	
};

CellEditor.prototype.cancelEditing = function(element) 
{
	with (this) {
		
		// check that the element is still being edited (otherwise onblur will be called on textfields that have been closed when we go to another tab in Firefox) 
		if (element && element.isEditing) {

			// render value before editon
			var renderer = this == column.headerEditor ? column.headerRenderer : column.cellRenderer;
			renderer._render(element.rowIndex, element.columnIndex, element, element.originalValue);
		
			_clearEditor(element);
		}
	}
};

CellEditor.prototype.applyEditing = function(element, newValue) 
{
	with (this) {
		
		// do nothing if the value is rejected by at least one validator
		if (!column.isValid(newValue)) return false;

		// format the value before applying
		var formattedValue = formatValue(newValue);
		
		// update model
		editablegrid.setValueAt(element.rowIndex, element.columnIndex, formattedValue);

		// let the user handle the model change
		editablegrid.modelChanged(element.rowIndex, element.columnIndex, element.originalValue, formattedValue, this.editablegrid.getRow(element.rowIndex));
		
		_clearEditor(element);	
	}
};

/**
 * Text cell editor
 * @constructor
 * @class Class to edit a cell with an HTML text input 
 */

function TextCellEditor(size, maxlen) { this.fieldSize = size || -1; this.maxLength = maxlen || 255; };
TextCellEditor.prototype = new CellEditor();

TextCellEditor.prototype.updateStyle = function(htmlInput)
{
	// change style for invalid values
	if (this.column.isValid(this.getEditorValue(htmlInput))) this.editablegrid.removeClassName(htmlInput, this.editablegrid.invalidClassName);
	else this.editablegrid.addClassName(htmlInput, this.editablegrid.invalidClassName);
};

TextCellEditor.prototype.getEditor = function(element, value)
{
	// create and initialize text field
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "text");
	if (this.maxLength > 0) htmlInput.setAttribute("maxlength", this.maxLength);
	if (this.fieldSize > 0) htmlInput.setAttribute("size", this.fieldSize);
	else htmlInput.style.width = (element.offsetWidth - 10) + 'px'; // auto-adapt width to cell, if no length specified 
	htmlInput.style.height = (element.offsetHeight - 10) + 'px'; // auto-adapt height to cell, always
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
	
	// select text
	htmlInput.select();
};

/**
 * Number cell editor
 * @constructor
 * @class Class to edit a numeric cell with an HTML text input 
 */

function NumberCellEditor(type) { this.type = type; }
NumberCellEditor.prototype = new TextCellEditor(-1, 32);

NumberCellEditor.prototype.formatValue = function(value)
{
	if (value == "") return "";
	return this.type == 'integer' ? parseInt(value) : parseFloat(value);
};

/**
 * Select cell editor
 * @constructor
 * @class Class to edit a cell with an HTML select input 
 */

function SelectCellEditor() {}
SelectCellEditor.prototype = new CellEditor();

SelectCellEditor.prototype.getEditor = function(element, value)
{
	// create select list
	var htmlInput = document.createElement("select");

	// auto adapt dimensions to cell, with a min width
	htmlInput.style.width = Math.max(100, (element.offsetWidth - 6)) + 'px'; 
	htmlInput.style.height = (element.offsetHeight - 2) + 'px';

	// get column option values for this row 
	var optionValues = this.column.getOptionValuesForEdit(element.rowIndex);
	
	// add these options, selecting the current one
	var index = 0, valueFound = false;
	for (var optionValue in optionValues) {
	    var option = document.createElement('option');
	    option.text = optionValues[optionValue];
	    option.value = optionValue;
	    // add does not work as expected in IE7 (cf. second arg)
		try { htmlInput.add(option, null); } catch (e) { htmlInput.add(option); } 
        if (optionValue == value) { htmlInput.selectedIndex = index; valueFound = true; }
        index++;
	}
	
	// if the current value is not in the list add it to the front
	if (!valueFound) {
	    var option = document.createElement('option');
	    option.text = value ? value : "";
	    option.value = value ? value : "";
	    // add does not work as expected in IE7 (cf. second arg)
		try { htmlInput.add(option, htmlInput.options[0]); } catch (e) { htmlInput.add(option); } 
		htmlInput.selectedIndex = 0;
	}
	                  
	// when a new value is selected we apply it
	htmlInput.onchange = function(event) { this.celleditor.applyEditing(this.element, this.value); };
	
	return htmlInput; 
};