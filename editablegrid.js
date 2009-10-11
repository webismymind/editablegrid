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
        cellrenderer: null,
		celleditor: null,
		optionValues: null
    };

    // override default properties with the ones given
    for (var p in props) this[p] = (typeof config == 'undefined' || typeof config[p] == 'undefined') ? props[p] : config[p];
}

/**
 * Renderer object. 
 * @param {Object} config
 */
function CellRenderer(config)
{
	// default properties
    var props = {
        render: function(element, value) { 
    		element.innerHTML = value ? value : "";
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
            var enumValues = col.getElementsByTagName("values");
            if (enumValues.length > 0) {
            	var optionValues = {};
                enumValues = enumValues[0].getElementsByTagName("value");
                for (var v = 0; v < enumValues.length; v++) {
                	optionValues[enumValues[v].getAttribute("value")] = enumValues[v].getAttribute("label");
                }
            }

            // create a specific renderer for enumerated columns
            if (optionValues) {
            	cellRenderer = new CellRenderer({ 
            		render: function(element, value) { 
            			element.innerHTML = (value ? (value in this.optionValues ? this.optionValues[value] : value) : ""); 
            		} 
            	});
            	cellRenderer.optionValues = optionValues;
            }

            // create a specific renderer for numeric types
            else if (datatype == "integer" || datatype == "double") {
                cellRenderer = new CellRenderer({
                    render: function(element, value) { 
                		element.innerHTML = value ? value : "";
                		element.setAttribute("class", "number");
                	}
                });
            }

            // otherwise use the default cell renderer
            else cellRenderer = new CellRenderer({});

			// create suited cell editor	  
            cellEditor = optionValues ? new SelectCellEditor() : 
            			 datatype == "integer" || datatype == "double" ? new NumberCellEditor(datatype) :
            			 new TextCellEditor();  

            // create new column
            var column = new Column({
            	name: col.getAttribute("name"),
            	label: col.getAttribute("label"),
            	datatype: col.getAttribute("datatype"),
            	editable : col.hasAttribute("editable") ? col.getAttribute("editable") : false,
            	cellrenderer: cellRenderer,
            	celleditor: cellEditor,
            	optionValues: optionValues 
            });
            
            // add column and give access to the column from the cell editor
            columns.push(column);
            cellEditor.editablegrid = this;
            cellEditor.column = column;
        }
        
        // load content
        var rows = xmlDoc.getElementsByTagName("row");
        for (var i = 0; i < rows.length; i++) {
            var cellValues = {}
            var cols = rows[i].getElementsByTagName("column");
            for (var j = 0; j < cols.length; j++) {
            	var colname = cols[j].hasAttribute("name") ? cols[j].getAttribute("name") : columns[j].name;
            	cellValues[colname] = cols[j].firstChild.nodeValue;
            }

            var rowData = [];
            for (var c = 0; c < columns.length; c++) rowData.push(columns[c].name in cellValues ? cellValues[columns[c].name] : null);
       		data.push(rowData);
        }
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
 * Returns the value at the specified index
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.getValueAt = function(rowIndex, columnIndex)
{
	var rows = this.data[rowIndex];
	return rows ? rows[columnIndex] : null;
}

/**
 * Sets the value at the specified index
 * @param {Object} value
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.setValueAt = function(rowIndex, columnIndex, value)
{
	var rows = this.data[rowIndex];
	if (rows) rows[columnIndex] = value;
}

/**
 * Sets the cell renderer for the specified column index
 * @param {Object} columnIndex
 * @param {Object} cellrenderer
 */
EditableGrid.prototype.setCellRenderer = function(columnIndex, cellrenderer)
{
	if (columnIndex < 0 || columnIndex >= this.columns.length) alert("Invalid column index " + columnIndex);
	else this.columns[columnIndex].cellrenderer = cellrenderer;
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
    	var table = document.createElement("table");
        table.setAttribute("class", this.className);
        $(containerid).appendChild(table);
    	$(containerid).style.position = "relative";
        
        // create header
        var tHead = document.createElement("THEAD");
        table.appendChild(tHead);
        var trHeader = tHead.insertRow(0);
        var columnCount = getColumnCount();
        for (var c = 0; c < columnCount; c++) {
            var headerCell = document.createElement("TH");
        	var td = trHeader.appendChild(headerCell);
        	td.innerHTML = columns[c].label;
        }
        
        // create bodt and rows
        var tBody = document.createElement("TBODY");
        table.appendChild(tBody);
        var rowCount = getRowCount();
        for (i = 0; i < rowCount; i++) {
        	var tr = tBody.insertRow(i);
        	for (j = 0; j < columnCount; j++) {
        		
        		// create cell and render its content
        		var td = tr.insertCell(j);
        		columns[j].cellrenderer.render(td, getValueAt(i,j));
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
		var rowIndex = target.parentNode.rowIndex - 1; // remove 1 for the header
		var columnIndex = target.cellIndex;
		
		// edit current cell value
		var column = columns[columnIndex];
		if (column) {
			if (!column.editable) { /* alert("Column " + columnIndex + " is not editable"); */ }
			else column.celleditor._edit(rowIndex, columnIndex, target, getValueAt(rowIndex, columnIndex));
		}
	}
}

/**
 * Returns the type of a column
 * @param {Object} columnIndex
 */
EditableGrid.prototype.getColumnType = function( columnIndex)
{
	return this.columns[columnIndex].datatype;
}
