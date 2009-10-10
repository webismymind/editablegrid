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
        datatype: "",
        render: function(element, value) { 
    		element.innerHTML = value ? value : "";
    	},
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
        columns: new Array(),
        data: new Array(),
        xmlDoc: null,
        className: "editablegrid",
        
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
                    renderTable();
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
        		renderTable();
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
            var col = columnDeclarations[i];
            
            // build a specific renderer for numeric types
            var datatype = col.getAttribute("datatype");
            if (datatype == "integer" || datatype == "double") {
                cellRenderer = new CellRenderer({
                    datatype: col.getAttribute("datatype"),
                    render: function(element, value) { 
                		element.innerHTML = value ? value : "";
                		element.setAttribute("class", "number");
                	}
                });
            }
            
            // otehrwise use the default cell renderer
            else cellRenderer = new CellRenderer({});
				
			// build a default editor	  
            cellEditor = datatype == "integer" || datatype == "double" ? new NumberCellEditor(datatype) : new TextCellEditor();          
            isEditable = col.hasAttribute("editable") ? col.getAttribute("editable") : false;
            
            columns.push(new Column({
            	name: col.getAttribute("name"),
            	label: col.getAttribute("label"),
            	editable : isEditable,
            	datatype: col.getAttribute("datatype"),
            	cellrenderer: cellRenderer,
            	celleditor: cellEditor
            }));
        }
        
        // load content
        var rows = xmlDoc.getElementsByTagName("row");
        for (var i = 0; i < rows.length; i++) {
            var rowData = new Array();
            var cols = rows[i].getElementsByTagName("column");
            for (var j = 0; j < cols.length; j++) rowData.push(cols[j].firstChild.nodeValue);
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
 * Renders the table in the document
 */
EditableGrid.prototype.renderTable = function()
{
    with (this) {

    	// create editablegrid table and add it to our container 
    	var table = document.createElement("table");
        table.setAttribute("class", this.className);
        $(containerid).appendChild(table);
        
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
			else column.celleditor._edit(this, rowIndex, columnIndex, target, getValueAt(rowIndex, columnIndex));
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
