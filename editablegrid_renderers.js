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
	// remember all the things we need
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;

	// remove existing content	
	while (element.hasChildNodes()) element.removeChild(element.firstChild);

	// clear isEditing (in case a currently editeed is being re-rendered by some external call)
	element.isEditing = false;

	// always apply the number class to numerical cells and column headers
	if (this.column.isNumerical()) EditableGrid.prototype.addClassName(element, "number");

	// always apply the boolean class to boolean column headers
	if (this.column.datatype == 'boolean') EditableGrid.prototype.addClassName(element, "boolean");

	// apply a css class corresponding to the column name
	EditableGrid.prototype.addClassName(element, "editablegrid-" + this.column.name);

	// add a data-title attribute used for responsiveness
	element.setAttribute('data-title', this.column.label);

	// call the specialized render method
	return this.render(element, typeof value == 'string' && this.column.datatype != "html" ? (value === null ? null : htmlspecialchars(value, 'ENT_NOQUOTES').replace(/  /g, ' &nbsp;')) : value);
};

CellRenderer.prototype.render = function(element, value, escapehtml) 
{
	var _value = escapehtml ? (typeof value == 'string' && this.column.datatype != "html" ? (value === null ? null : htmlspecialchars(value, 'ENT_NOQUOTES').replace(/  /g, ' &nbsp;')) : value) : value;
	element.innerHTML = _value ? _value : "";
};

CellRenderer.prototype.getDisplayValue = function(rowIndex, value) 
{
	// for html data type, sort and filter after replacing html entities
	if (this.column.datatype == 'html') return html_entity_decode(value);
			
	return value;
};

/**
 * Enum cell renderer
 * @constructor
 * @class Class to render a cell with enum values
 */

function EnumCellRenderer(config) { this.init(config); }
EnumCellRenderer.prototype = new CellRenderer();
EnumCellRenderer.prototype.getLabel = function(rowIndex, value)
{
	var label = null;
	if (typeof value != 'undefined') {
		value = value ? value : '';
		var optionValues = this.column.getOptionValuesForRender(rowIndex);
		if (optionValues && value in optionValues) label = optionValues[value];
		if (label === null) {
			var isNAN = typeof value == 'number' && isNaN(value);
			label = isNAN ? "" : value;
		}
	}
	return label ? label : '';
};

EnumCellRenderer.prototype.render = function(element, value)
{
	var label = this.getLabel(element.rowIndex, value);
	element.innerHTML = label ? (this.column.datatype != "html" ? htmlspecialchars(label, 'ENT_NOQUOTES').replace(/\s\s/g, '&nbsp; ') : label) : ''; 
};

EnumCellRenderer.prototype.getDisplayValue = function(rowIndex, value) 
{
	// if the column has enumerated values, sort and filter on the value label
	return value === null ? null : this.getLabel(rowIndex, value);
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

	var isNAN = value === null || (typeof value == 'number' && isNaN(value));
	var displayValue = isNAN ? (column.nansymbol || "") : value;
	if (typeof displayValue == 'number') {

		if (column.precision !== null) {
			// displayValue = displayValue.toFixed(column.precision);
			displayValue = number_format(displayValue, column.precision, column.decimal_point, column.thousands_separator);
		}

		if (column.unit !== null) {
			if (column.unit_before_number) displayValue = column.unit + ' ' + displayValue;
			else displayValue = displayValue + ' ' + column.unit;
		}
	}

	element.innerHTML = displayValue;
	if (isNAN) EditableGrid.prototype.addClassName(element, "nan");
	else EditableGrid.prototype.removeClassName(element, "nan");
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

	// remember all the things we need
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;

	// apply a css class corresponding to the column name
	EditableGrid.prototype.addClassName(element, "editablegrid-" + this.column.name);

	// add a data-title attribute used for responsiveness
	element.setAttribute('data-title', this.column.label);

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

	// give access to the cell editor and element from the editor field
	htmlInput.element = element;
	htmlInput.cellrenderer = this;

	// this renderer is a little special because it allows direct edition
	var cellEditor = new CellEditor();
	cellEditor.editablegrid = this.editablegrid;
	cellEditor.column = this.column;
	htmlInput.onclick = function(event) {
		element.rowIndex = this.cellrenderer.editablegrid.getRowIndex(element.parentNode); // in case it has changed due to sorting or remove
		element.isEditing = true;
		cellEditor.applyEditing(element, htmlInput.checked ? true : false); 
	};

	element.appendChild(htmlInput);
	htmlInput.checked = value;
	htmlInput.disabled = (!this.column.editable || !this.editablegrid.isEditable(element.rowIndex, element.columnIndex));

	EditableGrid.prototype.addClassName(element, "boolean");
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
	else cell.innerHTML = value ? value : "";
	cell.style.whiteSpace = 'nowrap';
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
		link.columnName = this.columnName;
		link.style.cursor = "pointer";
		link.innerHTML = value;
		link.editablegrid = this.editablegrid;
		link.renderer = this;
		link.onclick = function() {
			with (this.editablegrid) {

				var cols = tHead.rows[0].cells;
				var clearPrevious = -1;
				var backOnFirstPage = false;

				if (sortedColumnName != this.columnName) {
					clearPrevious = sortedColumnName;
					sortedColumnName = this.columnName;
					sortDescending = false;
					backOnFirstPage = true;
				}
				else {
					if (!sortDescending) sortDescending = true;
					else { 					
						clearPrevious = sortedColumnName;
						sortedColumnName = -1; 
						sortDescending = false; 
						backOnFirstPage = true;
					}
				} 

				// render header for previous sort column (not needed anymore since the grid is now fully refreshed after a sort - cf. possible pagination)
				// var j = getColumnIndex(clearPrevious);
				// if (j >= 0) columns[j].headerRenderer._render(-1, j, cols[j], columns[j].label);

				sort(sortedColumnName, sortDescending, backOnFirstPage);

				// render header for new sort column (not needed anymore since the grid is now fully refreshed after a sort - cf. possible pagination)
				// var j = getColumnIndex(sortedColumnName);
				// if (j >= 0) columns[j].headerRenderer._render(-1, j, cols[j], columns[j].label);
			}
		};

		// add an arrow to indicate if sort is ascending or descending
		if (this.editablegrid.sortedColumnName == this.columnName) {
			cell.appendChild(document.createTextNode("\u00a0"));
			cell.appendChild(this.editablegrid.sortDescending ? this.editablegrid.sortDownElement: this.editablegrid.sortUpElement);
		}

		// call user renderer if any
		if (this.cellRenderer) this.cellRenderer.render(cell, value);
	}
};
