/**
 * Abstract cell editor
 * @constructor
 * @class Base class for all cell editors
 */

function CellEditor(config) { this.init(config); }

CellEditor.prototype.init = function(config) 
{
	// override default properties with the ones given
	if (config) for (var p in config) this[p] = config[p];
};

CellEditor.prototype.edit = function(rowIndex, columnIndex, element, value) 
{
	// tag element and remember all the things we need to apply/cancel edition
	element.isEditing = true;
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
			this.onblur = null; 
			this.celleditor.applyEditing(this.element, this.celleditor.getEditorValue(this));
			return false;
		}
		
		// ESC: cancel editing
		if (event.keyCode == 27) { 
			this.onblur = null; 
			this.celleditor.cancelEditing(this.element); 
			return false; 
		}
	};

	// if simultaneous edition is not allowed, we cancel edition when focus is lost
	if (!this.editablegrid.allowSimultaneousEdition) editorInput.onblur = this.editablegrid.saveOnBlur ?
			function(event) { this.onblur = null; this.celleditor.applyEditing(this.element, this.celleditor.getEditorValue(this)); } :
			function(event) { this.onblur = null; this.celleditor.cancelEditing(this.element); };

	// display the resulting editor widget
	this.displayEditor(element, editorInput);
	
	// give focus to the created editor
	editorInput.focus();
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

CellEditor.prototype.displayEditor = function(element, editorInput, adjustX, adjustY) 
{
	// use same font in input as in cell content
	editorInput.style.fontFamily = this.editablegrid.getStyle(element, "fontFamily", "font-family"); 
	editorInput.style.fontSize = this.editablegrid.getStyle(element, "fontSize", "font-size"); 
	
	// static mode: add input field in the table cell
	if (this.editablegrid.editmode == "static") {
		while (element.hasChildNodes()) element.removeChild(element.firstChild);
		element.appendChild(editorInput);
	}
	
	// absolute mode: add input field in absolute position over table cell, leaving current content
	if (this.editablegrid.editmode == "absolute") {
		element.appendChild(editorInput);
		editorInput.style.position = "absolute";

		// position editor input on the cell with the same padding as the actual cell content (and center vertically if vertical-align is set to "middle")
		var paddingLeft = this.editablegrid.paddingLeft(element);
		var paddingTop = this.editablegrid.paddingTop(element);
		var offsetScrollX = this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollLeft) : 0;
		var offsetScrollY = this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollTop) : 0;
		var vCenter = this.editablegrid.verticalAlign(element) == "middle" ? (element.offsetHeight - editorInput.offsetHeight) / 2 - paddingTop : 0;
		editorInput.style.left = (this.editablegrid.getCellX(element) - offsetScrollX + paddingLeft + (adjustX ? adjustX : 0)) + "px";
		editorInput.style.top = (this.editablegrid.getCellY(element) - offsetScrollY + paddingTop + vCenter + (adjustY ? adjustY : 0)) + "px";
		
		// if number type: align field and its content to the right
		if (this.column.datatype == 'integer' || this.column.datatype == 'double') {
			var rightPadding = this.editablegrid.getCellX(element) - offsetScrollX + element.offsetWidth - (parseInt(editorInput.style.left) + editorInput.offsetWidth);
			editorInput.style.left = (parseInt(editorInput.style.left) + rightPadding) + "px";
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
			renderer._render(element.rowIndex, element.columnIndex, element, editablegrid.getValueAt(element.rowIndex, element.columnIndex));
		
			_clearEditor(element);
		}
	}
};

CellEditor.prototype.applyEditing = function(element, newValue) 
{
	with (this) {

		// check that the element is still being edited (otherwise onblur will be called on textfields that have been closed when we go to another tab in Firefox) 
		if (element && element.isEditing) {

			// do nothing if the value is rejected by at least one validator
			if (!column.isValid(newValue)) return false;

			// format the value before applying
			var formattedValue = formatValue(newValue);

			// update model and render cell (keeping previous value)
			var previousValue = editablegrid.setValueAt(element.rowIndex, element.columnIndex, formattedValue);

			// if the new value is different than the previous one, let the user handle the model change
			var newValue = editablegrid.getValueAt(element.rowIndex, element.columnIndex);
			if (!this.editablegrid.isSame(newValue, previousValue)) {
				editablegrid.modelChanged(element.rowIndex, element.columnIndex, previousValue, newValue, editablegrid.getRow(element.rowIndex));
			}
		
			_clearEditor(element);	
		}
	}
};

/**
 * Text cell editor
 * @constructor
 * @class Class to edit a cell with an HTML text input 
 */

function TextCellEditor(size, maxlen, config) { 
	if (size) this.fieldSize = size; 
	if (maxlen) this.maxLength = maxlen; 
	if (config) this.init(config); 
};

TextCellEditor.prototype = new CellEditor();
TextCellEditor.prototype.fieldSize = -1;
TextCellEditor.prototype.maxLength = -1;
TextCellEditor.prototype.autoHeight = true;

TextCellEditor.prototype.editorValue = function(value) {
	return value;
};

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
	else htmlInput.style.width = this.editablegrid.autoWidth(element) + 'px'; // auto-adapt width to cell, if no length specified 
	
	var autoHeight = this.editablegrid.autoHeight(element);
	if (this.autoHeight) htmlInput.style.height = autoHeight + 'px'; // auto-adapt height to cell
	htmlInput.value = this.editorValue(value);

	// listen to keyup to check validity and update style of input field 
	htmlInput.onkeyup = function(event) { this.celleditor.updateStyle(this); };

	return htmlInput; 
};

TextCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	CellEditor.prototype.displayEditor.call(this, element, htmlInput, -1 * this.editablegrid.borderLeft(htmlInput), -1 * (this.editablegrid.borderTop(htmlInput) + 1));

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

// editorValue is called in getEditor to initialize field
NumberCellEditor.prototype.editorValue = function(value) {
	return isNaN(value) ? "" : (value + '').replace('.', this.column.decimal_point);
};

// getEditorValue is called before passing to isValid and applyEditing
NumberCellEditor.prototype.getEditorValue = function(editorInput) {
	return editorInput.value.replace(',', '.');
};

// formatValue is called in applyEditing
NumberCellEditor.prototype.formatValue = function(value)
{
	return this.type == 'integer' ? parseInt(value) : parseFloat(value);
};

/**
 * Select cell editor
 * @constructor
 * @class Class to edit a cell with an HTML select input 
 */

function SelectCellEditor(config) { 
	this.minWidth = 75; 
	this.minHeight = 22; 
	this.adaptHeight = true; 
	this.adaptWidth = true;
	this.init(config); 
}

SelectCellEditor.prototype = new CellEditor();
SelectCellEditor.prototype.getEditor = function(element, value)
{
	// create select list
	var htmlInput = document.createElement("select");

	// auto adapt dimensions to cell, with a min width
	if (this.adaptWidth) htmlInput.style.width = Math.max(this.minWidth, this.editablegrid.autoWidth(element)) + 'px'; 
	if (this.adaptHeight) htmlInput.style.height = Math.max(this.minHeight, this.editablegrid.autoHeight(element)) + 'px';

	// get column option values for this row 
	var optionValues = this.column.getOptionValuesForEdit(element.rowIndex);
	
	// add these options, selecting the current one
	var index = 0, valueFound = false;
	for (var optionValue in optionValues) {
		
		// if values are grouped
		if (typeof optionValues[optionValue] == 'object') {

			var optgroup = document.createElement('optgroup');
			optgroup.label = optionValue; 
			htmlInput.appendChild(optgroup); 

			var groupOptionValues = optionValues[optionValue];
			for (var optionValue in groupOptionValues) {

				var option = document.createElement('option');
			    option.text = groupOptionValues[optionValue];
			    option.value = optionValue;
			    optgroup.appendChild(option); 
		        if (optionValue == value) { htmlInput.selectedIndex = index; valueFound = true; }
		        index++;
			}
		}
		else {

			var option = document.createElement('option');
			option.text = optionValues[optionValue];
			option.value = optionValue;
			// add does not work as expected in IE7 (cf. second arg)
			try { htmlInput.add(option, null); } catch (e) { htmlInput.add(option); } 
			if (optionValue == value) { htmlInput.selectedIndex = index; valueFound = true; }
			index++;
		}
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
	htmlInput.onchange = function(event) { this.onblur = null; this.celleditor.applyEditing(this.element, this.value); };
	
	return htmlInput; 
};

/**
 * Datepicker cell editor
 * 
 * Text field editor with date picker capabilities.
 * Uses the jQuery UI's datepicker.
 * This editor is used automatically for date columns if we detect that the jQuery UI's datepicker is present. 
 * 
 * @constructor Accepts an option object containing the following properties: 
 * - fieldSize: integer (default=auto-adapt)
 * - maxLength: integer (default=255)
 * 
 * @class Class to edit a cell with a datepicker linked to the HTML text input
 */

function DateCellEditor(config) 
{
	// erase defaults with given options
	this.init(config); 
};

// inherits TextCellEditor functionalities
DateCellEditor.prototype = new TextCellEditor();

// redefine displayEditor to setup datepicker
DateCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	TextCellEditor.prototype.displayEditor.call(this, element, htmlInput);

	$(htmlInput).datepicker({ 
		dateFormat: this.editablegrid.dateFormat == "EU" ? "dd/mm/yy" : "mm/dd/yy",
		beforeShow: function() {
			// the field cannot be blurred until the datepicker has gone away
			// otherwise we get the "missing instance data" exception
			this.onblur_backup = this.onblur;
			this.onblur = null;
		},
		onClose: function(dateText) {
			// apply date if any, otherwise call original onblur event
			if (dateText != '') this.celleditor.applyEditing(htmlInput.element, dateText);
			else if (this.onblur_backup != null) this.onblur_backup();
			
		}
	}).datepicker('show');
};