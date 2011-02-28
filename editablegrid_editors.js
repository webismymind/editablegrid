/*
 * EditableGrid_editors.js
 * 
 * Copyright 2010 Webismymind SPRL
 *
 * This file is part of EditableGrid.
 * 
 * EditableGrid is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or 
 * any later version.
 * 
 * EditableGrid is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with EditableGrid. If not, see http://www.gnu.org/licenses.
 * 
 */

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
	element.setAttribute('isEditing','true');
	
	// call the specialized getEditor method
	var editorInput = this.getEditor(element, value);
	this.editorInput=editorInput;
	if (!editorInput) return false;
	
	var _this=this;
	
	// listen to pressed keys
	// - tab does not work with onkeyup (it's too late)
	// - on Safari escape does not work with onkeypress
	// - with onkeydown everything is fine (but don't forget to return false)
	var keydownListener = function(event) {

		event = event || window.event;
		
		// ENTER or TAB: apply value
		if (event.keyCode == 13 || event.keyCode == 9) {
			if(blurListener) editorInput.removeEventListener('blur',blurListener,false);
			editorInput.removeEventListener('keydown',keydownListener,false);
			_this.applyEditing(element, _this.getEditorValue(editorInput));
			event.preventDefault();
		}
		
		// ESC: cancel editing
		if (event.keyCode == 27) { 
			if(blurListener) editorInput.removeEventListener('blur',blurListener,false);
			editorInput.removeEventListener('keydown',keydownListener,false);
			_this.cancelEditing(element); 
			event.preventDefault();
		}
	};
	editorInput.addEventListener('keydown',keydownListener,false);

	// if simultaneous edition is not allowed, we cancel edition when focus is lost
	var blurListener = null;
	
	if (!this.editablegrid.allowSimultaneousEdition) {
		if (this.editablegrid.saveOnBlur) {
			blurListener=function(event) {
				editorInput.removeEventListener('blur',blurListener,false);
				_this.applyEditing(element, _this.getEditorValue(editorInput));
			}
		}else{
			blurListener=function(event) {
				editorInput.removeEventListener('blur',blurListener,false);
				_this.cancelEditing(element);
			}
		}
		editorInput.addEventListener('blur',blurListener,false);
	}
	this.blurListener=blurListener;

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

CellEditor.prototype.displayEditor = function(element, editorInput) 
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

		// position editor input on the cell with the same padding as the actual cell content
		var paddingLeft = parseInt(this.editablegrid.getStyle(element, "paddingLeft", "padding-left"));
		var paddingTop = parseInt(this.editablegrid.getStyle(element, "paddingTop", "padding-top"));
		if (isNaN(paddingLeft)) paddingLeft = 0; else paddingLeft = Math.max(0, paddingLeft - 3);
		if (isNaN(paddingTop)) paddingTop = 0; else paddingTop = Math.max(0, paddingTop - 3);
		
		var offsetScrollX = this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollLeft) : 0;
		var offsetScrollY = this.editablegrid.table.parentNode ? parseInt(this.editablegrid.table.parentNode.scrollTop) : 0;
		
		editorInput.style.left = (this.editablegrid.getCellX(element) - offsetScrollX + paddingLeft) + "px";
		editorInput.style.top = (this.editablegrid.getCellY(element) - offsetScrollY + paddingTop) + "px";

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
	element.removeAttribute('isEditing');

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
		if (element && element.hasAttribute('isEditing')) {

			// render value before editon
			var renderer = this == column.headerEditor ? column.headerRenderer : column.cellRenderer;
			var rowIndex=element.parentNode.rowIndex - this.editableGrid.nbHeaderRows;
			var columnIndex=element.cellIndex;
			renderer._render(rowIndex, columnIndex, element, editablegrid.getValueAt(rowIndex, columnIndex));
		
			_clearEditor(element);
		}
	}
};

CellEditor.prototype.applyEditing = function(element, newValue) 
{
	with (this) {

		// check that the element is still being edited (otherwise onblur will be called on textfields that have been closed when we go to another tab in Firefox) 
		if (element && element.hasAttribute('isEditing')) {

			// do nothing if the value is rejected by at least one validator
			if (!column.isValid(newValue)) return false;

			// format the value before applying
			var formattedValue = formatValue(newValue);

			var rowIndex=element.parentNode.rowIndex - this.editablegrid.nbHeaderRows;
			var columnIndex=element.cellIndex;
			
			// update model and render cell (keeping previous value)
			var previousValue = editablegrid.setValueAt(rowIndex, columnIndex, formattedValue);

			// if the new value is different than the previous one, let the user handle the model change
			var newValue = editablegrid.getValueAt(rowIndex, columnIndex);
			if (!this.editablegrid.isSame(newValue, previousValue)) {
				editablegrid.modelChanged(rowIndex, columnIndex, previousValue, newValue, editablegrid.getRow(rowIndex));
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

function TextCellEditor(size, maxlen, config) { this.fieldSize = size || -1; this.maxLength = maxlen || 255; if (config) this.init(config); };
TextCellEditor.prototype = new CellEditor();

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
	if (this.editablegrid.Browser.Gecko) autoHeight -= 2; // Firefox: input higher then given size in px!
	htmlInput.style.height = autoHeight + 'px'; // auto-adapt height to cell
	htmlInput.value = this.editorValue(value);

	// listen to keyup to check validity and update style of input field 
	var _this=this;
	this.keyUpListener=function(event) {
		_this.updateStyle(this);
	};
	htmlInput.addEventListener('keyup',this.keyUpListener,false);
	
	this.htmlInput=htmlInput;
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

TextCellEditor.prototype._cancelEditing=TextCellEditor.prototype.cancelEditing;
TextCellEditor.prototype._applyEditing=TextCellEditor.prototype.applyEditing;

TextCellEditor.prototype.cancelEditing = function() {
	this.htmlInput.removeEventListener('keyup',this.keyUpListener,false);
	this._cancelEditing.apply(this,arguments);
};

TextCellEditor.prototype.applyEditing = function() {
	this.htmlInput.removeEventListener('keyup',this.keyUpListener,false);
	this._applyEditing.apply(this,arguments);
};

/**
 * Number cell editor
 * @constructor
 * @class Class to edit a numeric cell with an HTML text input 
 */

function NumberCellEditor(type) { this.type = type; }
NumberCellEditor.prototype = new TextCellEditor(-1, 32);

NumberCellEditor.prototype.editorValue = function(value) {
	return isNaN(value) ? "" : value;
};

NumberCellEditor.prototype.formatValue = function(value)
{
	return this.type == 'integer' ? parseInt(value) : parseFloat(value);
};

/**
 * Select cell editor
 * @constructor
 * @class Class to edit a cell with an HTML select input 
 */

function SelectCellEditor() { this.minWidth = 100; this.minHeight = 22; this.adaptHeight = true; this.adaptWidth = true;}
SelectCellEditor.prototype = new CellEditor();

SelectCellEditor.prototype.getEditor = function(element, value)
{
	// create select list
	var htmlInput = document.createElement("select");

	// auto adapt dimensions to cell, with a min width
	if (this.adaptWidth) htmlInput.style.width = Math.max(this.minWidth, this.editablegrid.autoWidth(element)) + 'px'; 
	if (this.adaptHeight) htmlInput.style.height = Math.max(this.minHeight, this.editablegrid.autoHeight(element)) + 'px';

	// get column option values for this row 
	var optionValues = this.column.getOptionValuesForEdit(element.parentNode.rowIndex - this.editablegrid.nbHeaderRows);
	
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
	var _this=this;
	this.changeListener=function(event) {
		_this.editorInput.removeEventListener('blur',_this.blurListener,false);
		_this.applyEditing(element, this.value);
	};
	htmlInput.addEventListener('change',this.changeListener,false);
	
	this.htmlInput=htmlInput;
	return htmlInput; 
};

SelectCellEditor.prototype._cancelEditing=SelectCellEditor.prototype.cancelEditing;
SelectCellEditor.prototype._applyEditing=SelectCellEditor.prototype.applyEditing;

SelectCellEditor.prototype.cancelEditing = function() {
	this.htmlInput.removeEventListener('change',this.changeListener,false);
	this._cancelEditing.apply(this,arguments);
};

SelectCellEditor.prototype.applyEditing = function() {
	this.htmlInput.removeEventListener('change',this.changeListener,false);
	this._applyEditing.apply(this,arguments);
};
