/**
 * EditableGrid.js
 *
 */
/**
 * Column object
 * @param {Object} config
 */
function Column(config){
    var props = {
        name: "",
        label: "",
        datatype: "string",
        cellrenderer: null,
		celleditor: null,
    };
    for (var p in props) 
        this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p]
}


function CellRenderer(config){

    var props = {
        datatype: "",
        render: function(element){
        },
    };
    for (var p in props) 
        this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p]
}


function CellEditor(config){ // Default editor

    var props = {
        datatype: "",
        cancelEditing: function(element){},
		applyEditing: function(element){},
		keyHandle: function (element) {
			alert("keyHandle");
			// apply with ENTER or TAB AND col have a callback
             /*   if (event.keyCode == 13 || event.keyCode == 9) {
                    if (typeof(aCol.valueChanged) == 'function') {
						debugprint("APPLY TEST VALUE " + newValue);
						aCol.valueChanged(aCol.name, newValue, srcElem.parentNode.id, objSrcElm, currentValue, srcElem);
					}
					else {
						currentValue = aCol.render(currentValue);
						focusLost();
					}
                }
                // ESC
                if (event.keyCode == 27) {
					currentValue = valueBeforeEditon;
					focusLost();
				}
			*/	
		},
		edit: function(element, value){
			var input = document.createElement("input");
        	input.setAttribute("type", "text");
			input.value = value;
			element.innerHTML = "";
			element.appendChild(input);
		},
    };
    for (var p in props) 
        this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p]
}


function EditableGrid(config){

    var props = {
        containerid: "",
		doubleclick: false,
        columns: new Array(),
        datas: new Array(),
        xmlDoc: null,
    };
    
    for (var p in props) 
        this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p]
}

/**
 * Init EditableGrid object
 */
EditableGrid.prototype.init = function(){
	
	// attache all events 
	with (this) {
		element = document.getElementById(containerid);
		if (element) {
			
			var obj = this;
			doubleclick ? element.ondblclick = function(e) { obj.mouseClicked(e);} : 
				element.onclick = function(e) { obj.mouseClicked(e);} 
		}
		else {
			alert("Unable to get element ["+containerid+"]");
		}
	}
}


/**
 * Loads the datas
 */
EditableGrid.prototype.load = function(url, callback){

    with (this) {
        if (window.ActiveXObject) {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.onreadystatechange = function(){
                if (dom.readyState == 4) {
                    processXML();
                    renderTable();
                    
                    if (typeof callback == 'function') 
                        callback();
                }
            };
        }
        else 
            if (document.implementation && document.implementation.createDocument) {
                xmlDoc = document.implementation.createDocument("", "", null);
                xmlDoc.onload = function(){
                    processXML();
                    renderTable();
                    if (typeof callback == 'function') 
                        callback();
                }
            }
            else {
                alert("load error !");
                return;
            }
        xmlDoc.load(url);
    }
}

/**
 * Process the XML content
 */
EditableGrid.prototype.processXML = function(){

    with (this) {
        // load metadatas
        var metadata = xmlDoc.getElementsByTagName("metadatas");
        // only on tag metadatas --> metadata[0]
        var columnRaws = metadata[0].getElementsByTagName("column");
        for (var i = 0; i < columnRaws.length; i++) {
            var col = columnRaws[i];
            
            // build a renderer
            if (col.getElementsByTagName("datatype")[0].firstChild.nodeValue == "number") {
                cellRenderer = new CellRenderer({
                    datatype: col.getElementsByTagName("datatype")[0].firstChild.nodeValue,
                    render: function render(element){
                        element.setAttribute("class", "number");
                    }
                });
            }
            
            else /* default cell renderer*/ 
                cellRenderer = new CellRenderer({});
				
				
			// build a default editor	  
			 cellEditor = new CellEditor({});          
            
            columns.push(new Column({
                name: col.getElementsByTagName("name")[0].firstChild.nodeValue,
                label: col.getElementsByTagName("label")[0].firstChild.nodeValue,
                datatype: col.getElementsByTagName("datatype")[0].firstChild.nodeValue,
                cellrenderer: cellRenderer,
				celleditor: cellEditor
            }));
        }
        
        // load content
        var rows = xmlDoc.getElementsByTagName("row");
        for (var i = 0; i < rows.length; i++) {
            var rowData = new Array();
            var cols = rows[i].getElementsByTagName("column");
            for (var j = 0; j < cols.length; j++) {
                rowData.push(cols[j].firstChild.nodeValue);
            }
            datas.push(rowData);
        }
    }
}

/**
 * Returns the number of rows
 */
EditableGrid.prototype.getRowCount = function(){
    with (this) {
        return datas.length;
    }
}

/**
 * Returns the number of columns
 */
EditableGrid.prototype.getColumnCount = function(){
    with (this) {
        return columns.length;
    }
}

/**
 * Returns the value at the specified index
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.getValueAt = function(rowIndex, columnIndex){

	with (this) {
		var rowArray = datas[rowIndex];
		return rowArray ? rowArray[columnIndex] : null;
	}
}

/**
 * Sets the value at the specified index
 * @param {Object} value
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.setValueAt = function(value, rowIndex, columnIndex){

	with (this) {
		var rowArray = datas[rowIndex];
		rowArray[columnIndex] = value;
	}
}


/**
 * Renders the table in the document
 */
EditableGrid.prototype.renderTable = function(){
    with (this) {
        var table = document.createElement("table");
        table.setAttribute("class", "editablegrid");
        
        // header
        var trHeader = table.insertRow(0);
        var columnCount = getColumnCount();
        for (i = 0; i < columnCount; i++) {
            var col = columns[i];
            var td = trHeader.insertCell(i);
            td.innerHTML = col.label;
        }
        
        var rowCount = getRowCount();
        for (i = 0; i < rowCount; i++) {
            var row = datas[i];
            var tr = table.insertRow(i + 1); // on line for the header --> +1
            for (j = 0; j < row.length; j++) {
                var td = tr.insertCell(j);
                // the content must be render
                td.innerHTML = row[j];
                columns[j].cellrenderer.render(td);
            }
        }
        document.getElementById(containerid).appendChild(table);
    }
}

EditableGrid.prototype.mouseClicked = function(e) {
	
 with (this) {
	if (!e) 
		var e = window.event;
	var tg = (window.event) ? e.srcElement : e.target;
	
	var rowIndex = tg.parentNode.rowIndex-1;
	var columnIndex = tg.cellIndex;
	
	var column = columns[columnIndex];
	if (column) {
		var editor = column.celleditor;
		editor.edit(tg, getValueAt(rowIndex, columnIndex));
	}
	//alert("MouseClicked ! (row,col) = (" + rowIndex+ "," + columnIndex+"), type = "  +getColumnType(columnIndex) );	
	//getColumnType(columnIndex);
	//alert("MouseClicked ! (row,col) = (" + rowIndex+ "," + columnIndex+")");
	//alert("value = " + getValueAt(rowIndex, columnIndex));
	}
}

EditableGrid.prototype.getColumnType = function( columnIndex){
	 with (this) {
	 	var col = columns[columnIndex];
		return col.datatype;
	 }
}

