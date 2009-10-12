
/**
 * Abstract cell renderer
 * Base class for all cell renderers
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
 * Class to render a cell with enum values
 */

EnumCellRenderer.prototype = new CellRenderer();

function EnumCellRenderer()
{
};

EnumCellRenderer.prototype.render = function(element, value)
{
	var optionValues = this.column.getOptionValues(element.rowIndex);
	element.innerHTML = (value ? (value in optionValues ? optionValues[value] : value) : ""); 
};

/**
 * Number cell renderer
 * Class to render a cell with numerical values
 */

NumberCellRenderer.prototype = new CellRenderer();

function NumberCellRenderer()
{
};

NumberCellRenderer.prototype.render = function(element, value)
{
	element.innerHTML = value ? value : "";
	element.setAttribute("class", "number");
};

/**
 * Checkbox cell renderer
 * Class to render a cell with an HTML checkbox
 */

CheckboxCellRenderer.prototype = new CellRenderer();

function CheckboxCellRenderer()
{
};

CheckboxCellRenderer.prototype.render = function(element, value)
{
	// create and initialize checkbox
	var htmlInput = document.createElement("input"); 
	htmlInput.setAttribute("type", "checkbox");
	htmlInput.checked = value ? true : false;
	htmlInput.disabled = !this.column.editable;
	
	// this renderer is a little special because it allows direct edition
	var cellEditor = new CellEditor();
	cellEditor.editablegrid = this.editablegrid;
	cellEditor.column = this.column;
	htmlInput.onclick = function(event) { cellEditor.applyEditing(element, htmlInput.checked ? true : false, false); }

	// give access to the cell editor and element from the editor field
	htmlInput.element = element;
	htmlInput.cellrenderer = this;

	while (element.hasChildNodes()) element.removeChild(element.firstChild);
	element.appendChild(htmlInput);
};
