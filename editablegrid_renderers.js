
/**
 * Abstract cell renderer
 * Base class for all cell renderers
 * @param {Object} config
 */

function CellRenderer(config)
{
}

CellRenderer.prototype._render = function(rowIndex, columnIndex, element, value) 
{
	// remember all the things we need
	element.rowIndex = rowIndex; 
	element.columnIndex = columnIndex;
	
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
	htmlInput.setAttribute("size", this.fieldSize)
	htmlInput.value = value;

	// give access to the cell editor and element from the editor field
	htmlInput.element = element;
	htmlInput.cellrenderer = this;

	while (element.hasChildNodes()) element.removeChild(element.firstChild);
	element.appendChild(htmlInput);
};
