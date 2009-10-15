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
		editable: true,
        datatype: "string",
        headerRenderer: null,
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
	return this.enumProvider.getOptionValues(this.editablegrid, this, rowIndex) 
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
        getOptionValues: function(grid, column, rowIndex) {
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
   		enableSort: false,
		doubleclick: false,
        className: "editablegrid",
        editmode: "absolute",
        editorzoneid: "",
		allowSimultaneousEdition: false,
   		invalidClassName: "invalid",

        // callback functions
        tableLoaded: function() {},
        modelChanged: function(rowIndex, columnIndex, oldValue, newValue, row) {}
    };
    
	// override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];
    
    this.Browser = {
    		IE:  !!(window.attachEvent && navigator.userAgent.indexOf('Opera') === -1),
    		Opera: navigator.userAgent.indexOf('Opera') > -1,
    		WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    		Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
    		MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
    };
    
    // private data
    this.columns = [];
    this.data = [];
    this.xmlDoc = null;
    this.sortedColumnName = null;
    this.sortDescending = false;
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
            xmlDoc.load(url);
        }
        
        // Safari
        else if (Browser.WebKit && window.XMLHttpRequest) 
        {
           	xmlDoc = new XMLHttpRequest();
           	xmlDoc.onreadystatechange = function () {
       			if (xmlDoc.readyState == 4) {
       				xmlDoc = xmlDoc.responseXML;
       				processXML()
       				tableLoaded();
       			}
       		}
           	xmlDoc.open("GET", url, true);
           	xmlDoc.send("");
        }
        
        // Firefox (and other browsers) 
        else if (document.implementation && document.implementation.createDocument) 
        {
        	xmlDoc = document.implementation.createDocument("", "", null);
        	xmlDoc.onload = function() {
        		processXML();
                tableLoaded();
        	}
            xmlDoc.load(url);
        }
        
        // should never happen
        else { 
        	alert("Cannot load XML file with this browser!"); 
        	return false;
        }
    
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
			_createHeaderRenderer(column);
			
			// create suited cell editor
            _createCellEditor(column);  

			// add default cell validators based on the column type
			_addDefaultCellValidators(column);

            // add column
			column.editablegrid = this;
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
 * Attach to an existing HTML table, using given column definitions
 */
EditableGrid.prototype.attachToHTMLTable = function(_table, _columns)
{
    with (this) {

    	// we have our new columns
        columns = _columns;
        for (var c = 0; c < columns.length; c++) {
        	
        	// set column index and back pointer
        	var column = columns[c];
			column.editablegrid = this;
        	column.columnIndex = c;

			// create suited enum provider, renderer and editor if none given
        	if (!column.enumProvider) column.enumProvider = column.optionValues ? new EnumProvider() : null;
            if (!column.cellRenderer) _createCellRenderer(column);
            if (!column.headerRenderer) _createHeaderRenderer(column);
            if (!column.cellEditor) _createCellEditor(column);  

			// add default cell validators based on the column type
			_addDefaultCellValidators(column);
        }

        // get pointers to table components
        this.table = _table;
        this.tHead = _table.tHead;
        this.tBody = _table.tBodies[0];
        
        // create table body if needed
        if (!tBody) {
        	tBody = document.createElement("TBODY");
        	table.insertBefore(tBody, table.firstChild);
        }

        // create table header if needed
        if (!tHead) {
        	tHead = document.createElement("THEAD");
        	table.insertBefore(tHead, tBody);
        }

        // if header is empty use first body row as header
        if (tHead.rows.length == 0 && tBody.rows.length > 0) 
        	tHead.appendChild(tBody.rows[0]);

        // check that header has exactly one row
        if (tHead.rows.length != 1) {
        	alert("You table header must have exactly row!");
        	return false;
        }

        // load header labels
       	var rows = tHead.rows;
       	for (var i = 0; i < rows.length; i++) {
       		var cols = rows[i].cells;
       		for (var j = 0; j < cols.length && j < columns.length; j++) {
       			if (!columns[j].label) columns[j].label = cols[j].innerHTML;
       		}
       	}

        // load content
        var rows = tBody.rows;
        for (var i = 0; i < rows.length; i++) {
            var rowData = [];
            var cols = rows[i].cells;
            for (var j = 0; j < cols.length && j < columns.length; j++) rowData.push(cols[j].innerHTML);
       		data.push({id: rows[i].id, columns: rowData});
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
 * Creates a suitable header cell renderer for the column
 */
EditableGrid.prototype._createHeaderRenderer = function(column)
{
	column.headerRenderer = this.enableSort ? new SortHeaderRenderer(column.name) : new CellRenderer();

	// give access to the column from the header cell renderer
	if (column.headerRenderer) {
		column.headerRenderer.editablegrid = this;
		column.headerRenderer.column = column;
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

/**
 * Find column index
 * @param {Object} name or index of the column
 */
EditableGrid.prototype.getColumnIndex = function(columnIndexOrName)
{
	if (typeof columnIndexOrName == "undefined" || columnIndexOrName === "") return -1;
	if (!isNaN(columnIndexOrName)) return (columnIndexOrName < 0 || columnIndexOrName >= this.columns.length) ? -1 : columnIndexOrName;
	for (var c = 0; c < this.columns.length; c++) if (this.columns[c].name == columnIndexOrName) return c;
	return -1;
}

/**
 * Remove row with given id
 * @param {Integer} rowId
 */
EditableGrid.prototype.removeRow = function(rowId)
{
	var rowIndex = $(rowId).rowIndex - 1; // remove 1 for the header
	this.tBody.removeChild($(rowId));
	this.data.splice(rowIndex, 1);
} 

/**
 * Sets the column header cell renderer for the specified column index
 * @param {Integer} columnIndex
 * @param {Object} cellRenderer
 */
EditableGrid.prototype.setHeaderRenderer = function(columnIndexOrName, cellRenderer)
{
	var columnIndex = this.getColumnIndex(columnIndexOrName);
	if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
	else {
		var column = this.columns[columnIndex];
		column.headerRenderer = this.enableSort ? new SortHeaderRenderer(column.name, cellRenderer) : cellRenderer;

		// give access to the column from the cell renderer
		if (cellRenderer) {
			if (this.enableSort) {
				column.headerRenderer.editablegrid = this;
				column.headerRenderer.column = column;
			}
			cellRenderer.editablegrid = this;
			cellRenderer.column = column;
		}
	}
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
	else {
		var column = this.columns[columnIndex];
		column.cellRenderer = cellRenderer;
	
		// give access to the column from the cell renderer
		if (cellRenderer) {
			cellRenderer.editablegrid = this;
			cellRenderer.column = column;
		}
	}
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
	var row = this.tBody.rows[rowIndex];
	return row.cells[columnIndex];
}

/**
 * Get cell X position relative to the first non static offset parent
 */
EditableGrid.prototype.getCellX = function(oElement)
{
	var iReturnValue = 0;
	while (oElement != null && this.isStatic(oElement)) try {
		iReturnValue += oElement.offsetLeft;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
}

/**
 * Get cell Y position relative to the first non static offset parent
 */
EditableGrid.prototype.getCellY = function(oElement)
{
	var iReturnValue = 0;
	while (oElement != null && this.isStatic(oElement)) try {
		iReturnValue += oElement.offsetTop;
		oElement = oElement.offsetParent;
	} catch(err) { oElement = null; }
	return iReturnValue;
}

/**
 * Renders the table in the document
 */
EditableGrid.prototype.renderGrid = function(containerid)
{
    with (this) {

    	// if we are already attached to an existing table, just update the cell contents
    	if (typeof table != "undefined" && table) {
    		
           	var rows = tHead.rows;
           	for (var i = 0; i < rows.length; i++) {
           		var rowData = [];
           		var cols = rows[i].cells;
           		for (var j = 0; j < cols.length && j < columns.length; j++) 
           			columns[j].headerRenderer._render(-1, j, cols[j], columns[j].label);
           	}

            var rows = tBody.rows;
            for (var i = 0; i < rows.length; i++) {
                var rowData = [];
                var cols = rows[i].cells;
                for (var j = 0; j < cols.length && j < columns.length; j++) 
                	columns[j].cellRenderer._render(i, j, cols[j], getValueAt(i,j));
            }

            // attach handler on click or double click 
            table.editablegrid = this;
        	if (doubleclick) table.ondblclick = function(e) { this.editablegrid.mouseClicked(e); };
        	else table.onclick = function(e) { this.editablegrid.mouseClicked(e); }; 
    	}
    	
    	// we must render a whole new table
    	else {
    		
    		if (!$(containerid)) return alert("Unable to get element [" + this.containerid + "]");

    		// create editablegrid table and add it to our container 
    		this.table = document.createElement("table");
    		table.setAttribute("class", this.className);
    		while ($(containerid).hasChildNodes()) $(containerid).removeChild($(containerid).firstChild);
    		$(containerid).appendChild(table);
        
    		// create header
    		this.tHead = document.createElement("THEAD");
    		table.appendChild(tHead);
    		var trHeader = tHead.insertRow(0);
    		var columnCount = getColumnCount();
    		for (var c = 0; c < columnCount; c++) {
    			var headerCell = document.createElement("TH");
    			var td = trHeader.appendChild(headerCell);
        		columns[c].headerRenderer._render(-1, c, td, columns[c].label);
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

    		// attach handler on click or double click 
            $(containerid).editablegrid = this;
        	if (doubleclick) $(containerid).ondblclick = function(e) { this.editablegrid.mouseClicked(e); };
        	else $(containerid).onclick = function(e) { this.editablegrid.mouseClicked(e); }; 
    	}    	
    }
}

/**
 * Mouse click handler
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
		if (!target || !target.parentNode || !target.parentNode.parentNode || target.parentNode.parentNode.tagName != "TBODY" || target.isEditing) return;

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

EditableGrid.prototype.sort = function(columnIndexOrName, descending)
{
	with (this) {

		var columnIndex = this.getColumnIndex(columnIndexOrName);
		if (columnIndex < 0) alert("Invalid column: " + columnIndexOrName);
		else {
			var type = getColumnType(columnIndex);
			var row_array = [];
			var rows = tBody.rows;
			for (var i = 0; i < rows.length; i++) row_array.push([getValueAt(i, columnIndex), i, rows[i]]);
			row_array.sort(type == "integer" || type == "double" ? sort_numeric :
						   type == "boolean" ? sort_boolean :
						   sort_alpha);
			var _data = data;
			data = [];
			if (descending) row_array = row_array.reverse();
			for (var i = 0; i < row_array.length; i++) {
				data.push(_data[row_array[i][1]]);
				tBody.appendChild(row_array[i][2]);
			}
			delete row_array;
		}
	}
}

EditableGrid.prototype.sort_numeric = function(a,b) 
{
  aa = isNaN(a[0]) ? 0 : parseFloat(a[0]);
  bb = isNaN(b[0]) ? 0 : parseFloat(b[0]);
  return aa-bb;
}

EditableGrid.prototype.sort_boolean = function(a,b) 
{
  aa = !a[0] || a[0] == "false" ? 0 : 1;
  bb = !b[0] || b[0] == "false" ? 0 : 1;
  return aa-bb;
}

EditableGrid.prototype.sort_alpha = function(a,b) 
{
  if (a[0]==b[0]) return 0;
  if (a[0]<b[0]) return -1;
  return 1;
}

/**
 * Returns computed style property for element
 */
EditableGrid.prototype.getStyle = function(element, styleProp)
{
	if (element.currentStyle) return element.currentStyle[styleProp];
	else if (window.getComputedStyle) return document.defaultView.getComputedStyle(element,null).getPropertyValue(styleProp);
	return element.style[styleProp];
}

/**
 * Returns true if the element has a static positioning
 */
EditableGrid.prototype.isStatic = function (element) 
{
	var position = this.getStyle(element, 'position');
	return (!position || position == "static");
}

/**
 * class name manipulation
 */
EditableGrid.prototype.strip = function(str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); },
EditableGrid.prototype.hasClassName = function(element, className) { return (element.className.length > 0 && (element.className == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className))); }
EditableGrid.prototype.addClassName = function(element, className) { if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className; }
EditableGrid.prototype.removeClassName = function(element, className) { element.className = this.strip(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ')); }

/**
 * Useful string methods 
 */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")) };
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str) };
String.prototype.endsWith = function(str) { return (this.match(str+"$")==str) };
