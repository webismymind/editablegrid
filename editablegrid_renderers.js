
/**
 * Abstract cell renderer
 * @constructor
 * @class Base class for all cell renderers
 * @param {Object} config
 */

function CellRenderer(config)
{
	// default properties
    var props = { render: null };

    // override default properties with the ones given
    for (var p in props) if (typeof config != 'undefined' && typeof config[p] != 'undefined') this[p] = config[p];
}

CellRenderer.prototype._render = function(rowIndex, columnIndex, element, value) 
{
	// remember all the things we need
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;

	// remove existing content	
	while (element.hasChildNodes()) element.removeChild(element.firstChild);

	// call the specialized render method
	return this.render(element, value);
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

function EnumCellRenderer() {};
EnumCellRenderer.prototype = new CellRenderer();
EnumCellRenderer.prototype.render = function(element, value)
{
	var optionValues = this.column.getOptionValuesForRender(element.rowIndex);
	element.innerHTML = (value ? (value in optionValues ? optionValues[value] : value) : ""); 
};

/**
 * Number cell renderer
 * @constructor
 * @class Class to render a cell with numerical values
 */

function NumberCellRenderer() {};
NumberCellRenderer.prototype = new CellRenderer();
NumberCellRenderer.prototype.render = function(element, value)
{
	element.innerHTML = value ? value : "";
	element.className = "number";
};

/**
 * Checkbox cell renderer
 * @constructor
 * @class Class to render a cell with an HTML checkbox
 */

function CheckboxCellRenderer() {};
CheckboxCellRenderer.prototype = new CellRenderer();
CheckboxCellRenderer.prototype.render = function(element, value)
{
	// create and initialize checkbox
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "checkbox");
	element.originalValue = (value && value != 0 && value != "false") ? true : false;

	// this renderer is a little special because it allows direct edition
	var cellEditor = new CellEditor();
	cellEditor.editablegrid = this.editablegrid;
	cellEditor.column = this.column;
	htmlInput.onclick = function(event) { 
		element.rowIndex = element.parentNode.rowIndex - 1; // in case it has changed due to sorting or remove
		cellEditor.applyEditing(element, htmlInput.checked ? true : false, false); 
		element.originalValue = htmlInput.checked ? true : false; 
	}

	// give access to the cell editor and element from the editor field
	htmlInput.element = element;
	htmlInput.cellrenderer = this;

	while (element.hasChildNodes()) element.removeChild(element.firstChild);
	element.appendChild(htmlInput);
	htmlInput.checked = element.originalValue;
	htmlInput.disabled = !this.column.editable;
};

/**
 * Email cell renderer
 * @constructor
 * @class Class to render a cell with emails
 */

function EmailCellRenderer() {};
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

function WebsiteCellRenderer() {};
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

function DateCellRenderer() {}
DateCellRenderer.prototype = new CellRenderer;

DateCellRenderer.prototype.render = function(cell, value) 
{
	var date = this.editablegrid.checkDate(value);
	if (typeof date == "object") cell.innerHTML = date.formattedDate;
	else cell.innerHTML = value;
}

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
				
				if (sortedColumnName != this.columnName) {
					sortedColumnName = this.columnName;
					sortDescending = false;
				}
				else {
					if (!sortDescending) sortDescending = true;
					else { sortedColumnName = -1; sortDescending = false; }
				} 
				
				sort(sortedColumnName, sortDescending);
				this.editablegrid._renderHeaders();
			}
		};

		// add an arrow to indicate if sort is ascending or descending
		if (this.editablegrid.sortedColumnName == this.columnName) {
			var img = document.createElement("img");
			img.src = this.editablegrid.baseUrl + "/images/bullet_arrow_" +  (this.editablegrid.sortDescending ? "down" : "up") + ".png";
			cell.appendChild(document.createTextNode("\u00a0"));
			cell.appendChild(img);
		}

		// call user renderer if any
		if (this.cellRenderer) this.cellRenderer.render(cell, value);
	}
};
