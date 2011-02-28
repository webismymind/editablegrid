/*
 * EditableGrid_renderers.js
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
 * Abstract cell renderer
 * @constructor
 * @class Base class for all cell renderers
 * @param {Object} config
 */

function CellRenderer(config) { this.init(config); }

CellRenderer.prototype.init = function(config) 
{
	// override default properties with the ones given
	for (var p in config) this[p] = config[p];
};

CellRenderer.prototype._render = function(rowIndex, columnIndex, element, value) 
{
	// remove existing content	
	while (element.hasChildNodes()) element.removeChild(element.firstChild);

	// always apply the number style to numerical cells and column headers
	if (this.column.isNumerical()) EditableGrid.prototype.addClassName(element, "number");

	// call the specialized render method
	return this.render(element, typeof value == 'string' ? htmlspecialchars(value, 'ENT_NOQUOTES').replace(/\s\s/g, '&nbsp; ') : value);
};

CellRenderer.prototype.render = function(element, value) 
{
	element.innerHTML = value ? value : "";
};

/**
 * Enum cell renderer
 * @constructor
 * @class Class to render a cell with enum values
 */

function EnumCellRenderer(config) { this.init(config); }
EnumCellRenderer.prototype = new CellRenderer();
EnumCellRenderer.prototype.render = function(element, value)
{
	var optionValues = this.column.getOptionValuesForRender(element.parentNode.rowIndex - this.editablegrid.nbHeaderRows);
	element.innerHTML = (typeof value != 'undefined' ? (value in optionValues ? optionValues[value] : value) : "");
};

/**
 * Number cell renderer
 * @constructor
 * @class Class to render a cell with numerical values
 */

function NumberCellRenderer(config) { this.init(config); }
NumberCellRenderer.prototype = new CellRenderer();
NumberCellRenderer.prototype.render = function(element, value)
{
	var column = this.column || {}; // in case somebody calls new NumberCellRenderer().render(..)

	var isNAN = typeof value == 'number' && isNaN(value);
	var displayValue = isNAN ? (column.nansymbol || "") : value;
	if (typeof displayValue == 'number') {
		if (column.precision !== null) displayValue = displayValue.toFixed(column.precision);
		if (column.unit !== null) displayValue += ' ' + column.unit;
	}
	
	element.innerHTML = displayValue;
	element.style.fontWeight = isNAN ? "normal" : "";
};

/**
 * Checkbox cell renderer
 * @constructor
 * @class Class to render a cell with an HTML checkbox
 */

function CheckboxCellRenderer(config) { this.init(config); }
CheckboxCellRenderer.prototype = new CellRenderer();

CheckboxCellRenderer.prototype._render = function(rowIndex, columnIndex, element, value) 
{
	// if a checkbox already exists keep it, otherwise clear current content
	if (element.firstChild && (typeof element.firstChild.getAttribute != "function" || element.firstChild.getAttribute("type") != "checkbox"))
		while (element.hasChildNodes()) element.removeChild(element.firstChild);

	// call the specialized render method
	return this.render(element, value);
};

CheckboxCellRenderer.prototype.render = function(element, value)
{
	// convert value to boolean just in case
	value = (value && value != 0 && value != "false") ? true : false;

	// if check box already created, just update its state
	if (element.firstChild) { element.firstChild.checked = value; return; }
	
	// create and initialize checkbox
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "checkbox");

	// this renderer is a little special because it allows direct edition
	var cellEditor = new CellEditor();
	cellEditor.editablegrid = this.editablegrid;
	cellEditor.column = this.column;
	var _this=this;
	var clickListener=function(event) { 
		// in case it has changed due to sorting or remove
		element.setAttribute('isEditing','true');
		cellEditor.applyEditing(element, htmlInput.checked ? true : false); 
	};
	htmlInput.addEventListener('click',clickListener,false);
	
	element.appendChild(htmlInput);
	htmlInput.checked = value;
	htmlInput.disabled = (!this.column.editable || !this.editablegrid.isEditable(element.parentNode.rowIndex - this.editablegrid.nbHeaderRows, element.cellIndex));

	element.className = "boolean";
};

/**
 * Email cell renderer
 * @constructor
 * @class Class to render a cell with emails
 */

function EmailCellRenderer(config) { this.init(config); }
EmailCellRenderer.prototype = new CellRenderer();
EmailCellRenderer.prototype.render = function(element, value)
{
	element.innerHTML = value ? "<a href='mailto:" + value + "'>" + value + "</a>" : "";
};

/**
 * Website cell renderer
 * @constructor
 * @class Class to render a cell with websites
 */

function WebsiteCellRenderer(config) { this.init(config); }
WebsiteCellRenderer.prototype = new CellRenderer();
WebsiteCellRenderer.prototype.render = function(element, value)
{
	element.innerHTML = value ? "<a href='" + (value.indexOf("//") == -1 ? "http://" + value : value) + "'>" + value + "</a>" : "";
};

/**
 * Date cell renderer
 * @constructor
 * @class Class to render a cell containing a date
 */

function DateCellRenderer(config) { this.init(config); }
DateCellRenderer.prototype = new CellRenderer;

DateCellRenderer.prototype.render = function(cell, value) 
{
	var date = this.editablegrid.checkDate(value);
	if (typeof date == "object") cell.innerHTML = date.formattedDate;
	else cell.innerHTML = value;
};

/**
 * Sort header renderer
 * @constructor
 * @class Class to add sorting functionalities to headers
 */

function SortHeaderRenderer(columnName, cellRenderer) { this.columnName = columnName; this.cellRenderer = cellRenderer; };
SortHeaderRenderer.prototype = new CellRenderer();
SortHeaderRenderer.prototype.render = function(cell, value) 
{
	if (!value) { if (this.cellRenderer) this.cellRenderer.render(cell, value); }
	else {
						
		// create a link that will sort (alternatively ascending/descending)
		var link = document.createElement("a");
		cell.appendChild(link);
		link.style.cursor = "pointer";
		link.innerHTML = value;
		var _this=this;
		var clickListener=function() {
			with (_this.editablegrid) {

				var cols = tHead.rows[0].cells;
				var clearPrevious = -1;
				
				if (sortedColumnName != _this.columnName) {
					clearPrevious = sortedColumnName;
					sortedColumnName = _this.columnName;
					sortDescending = false;
				}
				else {
					if (!sortDescending) sortDescending = true;
					else { 					
						clearPrevious = sortedColumnName;
						sortedColumnName = -1; 
						sortDescending = false; 
					}
				} 
				
				// render header for previous sort column
				var j = getColumnIndex(clearPrevious);
				if (j >= 0) columns[j].headerRenderer._render(-1, j, cols[j], columns[j].label);

				sort(sortedColumnName, sortDescending);

				// render header for new sort column
				var j = getColumnIndex(sortedColumnName);
				if (j >= 0) columns[j].headerRenderer._render(-1, j, cols[j], columns[j].label);
			}
		};
		link.addEventListener('click',clickListener,false);

		// add an arrow to indicate if sort is ascending or descending
		if (this.editablegrid.sortedColumnName == this.columnName) {
			cell.appendChild(document.createTextNode("\u00a0"));
			cell.appendChild(this.editablegrid.sortDescending ? this.editablegrid.sortDownImage: this.editablegrid.sortUpImage);
		}

		// call user renderer if any
		if (this.cellRenderer) this.cellRenderer.render(cell, value);
	}
};
