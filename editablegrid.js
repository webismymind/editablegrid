/*
 * EditableGrid.js
 * 
 */

if (typeof $ == 'undefined') {
	function $(elementId) { return document.getElementById(elementId); }
}

/**
 * Column object
 * @param {Object} config
 */
function Column(config)
{
	// default properties
    var props = {
        name: "",
        label: "",
		editable: false,
        datatype: "string",
        cellRenderer: null,
		cellEditor: null,
		cellValidators: [],
		enumProvider: null,
		optionValues: null,
        columnIndex: -1
    };

    // override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];
}

Column.prototype.getOptionValues = function(rowIndex) { 
	return this.enumProvider.getOptionValues(this, rowIndex) 
};

Column.prototype.isValid = function(value) {
	for (var i = 0; i < this.cellValidators.length; i++) if (!this.cellValidators[i].isValid(value)) return false;
	return true;
} 

/**
 * Enum provider object. 
 * @param {Object} config
 */
function EnumProvider(config)
{
	// default properties
    var props = {
        getOptionValues: function(column, rowIndex) {
    		return column.optionValues;
    	}
    };

    // override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];
}

/**
 * EditableGrid constructor
 */
function EditableGrid(config)
{
	// default properties
    var props = 
    {
        containerid: "",
		doubleclick: false,
        columns: [],
        data: [],
        xmlDoc: null,
        className: "editablegrid",
        editmode: "static",
        editorzoneid: "",
		allowSimultaneousEdition: false,
        
        // callback functions
        tableLoaded: function() {},
        modelChanged: function(rowIndex, columnIndex, value) {}
    };
    
	// override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];

    // get container and attach handler on click or double click 
	var element = $(this.containerid);
	if (!element) alert("Unable to get element [" + this.containerid + "]");
	else {
		element.editablegrid = this;
		if (this.doubleclick) element.ondblclick = function(e) { this.editablegrid.mouseClicked(e); };
		else element.onclick = function(e) { this.editablegrid.mouseClicked(e); }; 
	}
}

/**
 * Load the XML metadata and data
 */
EditableGrid.prototype.load = function(url)
{
    with (this) {
    	
    	// IE
        if (window.ActiveXObject) 
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.onreadystatechange = function() {
                if (dom.readyState == 4) {
                    processXML();
                    tableLoaded();
                }
            };
        }
        
        // other browsers
        else if (document.implementation && document.implementation.createDocument) 
        {
        	xmlDoc = document.implementation.createDocument("", "", null);
        	xmlDoc.onload = function() {
        		processXML();
                tableLoaded();
        	}
        }
        
        // should never happen
        else { 
        	alert("Cannot load XML file with this browser!"); 
        	return false;
        }
    
        // load XML file
        xmlDoc.load(url);
        return true;
    }
}

/**
 * Process the XML content
 */
EditableGrid.prototype.processXML = function()
{
    with (this) {
    	
        // load metadata (only one tag <metadata> --> metadata[0])
        var metadata = xmlDoc.getElementsByTagName("metadata");
        var columnDeclarations = metadata[0].getElementsByTagName("column");
        for (var i = 0; i < columnDeclarations.length; i++) {
        	
        	// get column type
            var col = columnDeclarations[i];
            var datatype = col.getAttribute("datatype");
            
            // get enumerated values if any
        	var optionValues = null;
            var enumValues = col.getElementsByTagName("values");
            if (enumValues.length > 0) {
            	optionValues = {};
                enumValues = enumValues[0].getElementsByTagName("value");
                for (var v = 0; v < enumValues.length; v++) {
                	optionValues[enumValues[v].getAttribute("value")] = enumValues[v].firstChild ? enumValues[v].firstChild.nodeValue : "";
                }
            }

            // create new column
            var column = new Column({
            	name: col.getAttribute("name"),
            	label: col.getAttribute("label"),
            	datatype: col.getAttribute("datatype"),
            	editable : col.hasAttribute("editable") ? col.getAttribute("editable") == "true" : false,
            	optionValues: optionValues,
            	enumProvider: (optionValues ? new EnumProvider() : null),
            	columnIndex: i
            });

			// create suited cell renderer
            _createCellRenderer(column);  

			// create suited cell editor
            _createCellEditor(column);  

			// add default cell validators based on the column type
			_addDefaultCellValidators(column);

            // add column 
            columns.push(column);
        }
        
        // load content
        var rows = xmlDoc.getElementsByTagName("row");
        for (var i = 0; i < rows.length; i++) {
            var cellValues = {}
            var cols = rows[i].getElementsByTagName("column");
            for (var j = 0; j < cols.length; j++) {
            	var colname = cols[j].hasAttribute("name") ? cols[j].getAttribute("name") : columns[j].name;
            	cellValues[colname] = cols[j].firstChild ? cols[j].firstChild.nodeValue : "";
            }

            var rowData = [];
            for (var c = 0; c < columns.length; c++) rowData.push(columns[c].name in cellValues ? cellValues[columns[c].name] : null);
       		data.push({id: rows[i].hasAttribute("id") ? rows[i].getAttribute("id") : "", columns: rowData});
        }
    }
}

/**
 * Creates a suitable cell renderer for the column
 */
EditableGrid.prototype._createCellRenderer = function(column)
{
	column.cellRenderer = 
		column.enumProvider ? new EnumCellRenderer() :
		column.datatype == "integer" || column.datatype == "double" ? new NumberCellRenderer() :
    	column.datatype == "boolean" ? new CheckboxCellRenderer() : 
    	column.datatype.startsWith("email") ? new EmailCellRenderer() : 
    	new CellRenderer();
		
	// give access to the column from the cell renderer
	if (column.cellRenderer) {
		column.cellRenderer.editablegrid = this;
		column.cellRenderer.column = column;
	}
}

/**
 * Creates a suitable cell editor for the column
 */
EditableGrid.prototype._createCellEditor = function(column)
{
	var length = column.datatype.startsWith("string") ? column.datatype.substr(7, column.datatype.length - 8) : 
				 column.datatype.startsWith("email") ? column.datatype.substr(6, column.datatype.length - 7) : null;
	
	column.cellEditor = 
		column.enumProvider ? new SelectCellEditor() :
		column.datatype == "integer" || column.datatype == "double" ? new NumberCellEditor(column.datatype) :
		column.datatype == "boolean" ? null :
		column.datatype.startsWith("email") ? new TextCellEditor(length ? length : 32) :
		new TextCellEditor(length);  
		
	// give access to the column from the cell editor
	if (column.cellEditor) {
		column.cellEditor.editablegrid = this;
		column.cellEditor.column = column;
	}
}

/**
 * Returns the number of rows
 */
EditableGrid.prototype.getRowCount = function()
{
	return this.data.length;
}

/**
 * Returns the number of columns
 */
EditableGrid.prototype.getColumnCount = function()
{
	return this.columns.length;
}

/**
 * Returns the name of a column
 * @param {Integer} columnIndex
 */
EditableGrid.prototype.getColumnName = function(columnIndex)
{
	return this.columns[columnIndex].name;
}

/**
 * Returns the type of a column
 * @param {Integer} columnIndex
 */
EditableGrid.prototype.getColumnType = function(columnIndex)
{
	return this.columns[columnIndex].datatype;
}

/**
 * Returns the value at the specified index
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.getValueAt = function(rowIndex, columnIndex)
{
	var rows = this.data[rowIndex]['columns'];
	return rows ? rows[columnIndex] : null;
}

/**
 * Sets the value at the specified index
 * @param {Integer} rowIndex
 * @param {Integer} columnIndex
 * @param {Object} value
 * @param {Boolean} render
 */
EditableGrid.prototype.setValueAt = function(rowIndex, columnIndex, value, render)
{
	if (typeof render == "undefined") render = true;
	
	// set new value in model
	var rows = this.data[rowIndex]['columns'];
	if (rows) rows[columnIndex] = value;
	
	// render new value
	if (render) {
		if (columnIndex < 0 || columnIndex >= this.columns.length) alert("Invalid column index " + columnIndex);
		this.columns[columnIndex].cellRenderer._render(rowIndex, columnIndex, this.getCell(rowIndex, columnIndex), value);
	}
}

EditableGrid.prototype.getColumnIndex = function(columnIndexOrName)
{
	if (!isNaN(columnIndexOrName)) return (columnIndexOrName < 0 || columnIndexOrName >= this.columns.length) ? -1 : columnIndexOrName;
	for (var c = 0; c < this.columns.length; c++) if (this.columns[c].name == columnIndexOrName) return c;
	return -1;
}

/**
 * Sets the cell renderer for the specified column index
 * @param {Integer} columnIndex
 * @param {Object} cellRenderer
 */
EditableGrid.prototype.setCellRenderer = function(columnIndexOrName, cellRenderer)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].cellRenderer = cellRenderer;
}

/**
 * Sets the enum provider for the specified column index
 * @param {Integer} columnIndex
 * @param {Object} enumProvider
 */
EditableGrid.prototype.setEnumProvider = function(columnIndexOrName, enumProvider)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].enumProvider = enumProvider;
	
	// we must recreate the cell renderer and editor for this column
	this._createCellRenderer(this.columns[columnIndex]);
	this._createCellEditor(this.columns[columnIndex]);
}

/**
 * Clear all cell validators for the specified column index
 * @param {Integer} columnIndex
 */
EditableGrid.prototype.clearCellValidators = function(columnIndexOrName)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].cellValidators = [];
}

/**
 * Adds default cell validators for the specified column index (according to the column type)
 * @param {Integer} columnIndex
 */
EditableGrid.prototype.addDefaultCellValidators = function(columnIndexOrName)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	return this._addDefaultCellValidators(this.columns[columnIndex]);
}

EditableGrid.prototype._addDefaultCellValidators = function(column)
{
	if (column.datatype == "integer" || column.datatype == "double") column.cellValidators.push(new NumberCellValidator(column.datatype));
	else if (column.datatype.startsWith("email")) column.cellValidators.push(new EmailCellValidator());
}

/**
 * Adds a cell validator for the specified column index
 * @param {Integer} columnIndex
 * @param {Object} cellValidator
 */
EditableGrid.prototype.addCellValidator = function(columnIndexOrName, cellValidator)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	else this.columns[columnIndex].cellValidators.push(cellValidator);
}

/**
 * Get cell at given row and column
 */
EditableGrid.prototype.getCell = function(rowIndex, columnIndex)
{
	var row = this.tBody.childNodes[rowIndex];
	return row.childNodes[columnIndex];
}

/**
 * Get cell X position
 */
EditableGrid.prototype.getCellX = function(oElement)
{
	parent = $(this.containerid);
	var iReturnValue = 0;
	while(oElement != null && oElement != parent) try {
		iReturnValue += oElement.offsetLeft;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
}

/**
 * Get cell Y position
 */
EditableGrid.prototype.getCellY = function(oElement)
{
	parent = $(this.containerid);
	var iReturnValue = 0;
	while(oElement != null && oElement != parent) try {
		iReturnValue += oElement.offsetTop;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
}

/**
 * Renders the table in the document
 */
EditableGrid.prototype.renderGrid = function()
{
    with (this) {

    	// create editablegrid table and add it to our container 
    	this.table = document.createElement("table");
        table.setAttribute("class", this.className);
        $(containerid).appendChild(table);
    	$(containerid).style.position = "relative";
        
        // create header
        this.tHead = document.createElement("THEAD");
        table.appendChild(tHead);
        var trHeader = tHead.insertRow(0);
        var columnCount = getColumnCount();
        for (var c = 0; c < columnCount; c++) {
            var headerCell = document.createElement("TH");
        	var td = trHeader.appendChild(headerCell);
        	td.innerHTML = columns[c].label;
        }
        
        // create body and rows
        this.tBody = document.createElement("TBODY");
        table.appendChild(tBody);
        var rowCount = getRowCount();
        for (i = 0; i < rowCount; i++) {
        	var tr = tBody.insertRow(i);
        	tr.id = data[i]['id'];
        	for (j = 0; j < columnCount; j++) {
        		
        		// create cell and render its content
        		var td = tr.insertCell(j);
        		columns[j].cellRenderer._render(i, j, td, getValueAt(i,j));
        	}
        }
    }
}

/**
 * Mouse click handle
 * @param {Object} e
 */
EditableGrid.prototype.mouseClicked = function(e) 
{
	e = e || window.event;
	with (this) {
		
		// get row and column index from the clicked cell
		var target = e.target || e.srcElement;
		
		// go up parents to find a cell under the clicked position
		while (target) if (target.tagName == "TD") break; else target = target.parentNode;
		if (!target || target.parentNode.parentNode.tagName != "TBODY" || target.isEditing) return;

		// get cell position in table
		var rowIndex = target.parentNode.rowIndex - 1; // remove 1 for the header
		var columnIndex = target.cellIndex;
		
		// edit current cell value
		var column = columns[columnIndex];
		if (column) {
			if (!column.editable) { /* alert("Column " + columnIndex + " is not editable"); */ }
			else if (column.cellEditor) column.cellEditor.edit(rowIndex, columnIndex, target, getValueAt(rowIndex, columnIndex));
		}
	}
}

/**
 * Useful string methods 
 */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")) };
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str) };
String.prototype.endsWith = function(str) { return (this.match(str+"$")==str) };
