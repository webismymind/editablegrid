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


function EditableGrid(config){

    var props = {
        id: "",
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
            
            
            columns.push(new Column({
                name: col.getElementsByTagName("name")[0].firstChild.nodeValue,
                label: col.getElementsByTagName("label")[0].firstChild.nodeValue,
                datatype: col.getElementsByTagName("datatype")[0].firstChild.nodeValue,
                cellrenderer: cellRenderer
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

    var rowArray = datas[rowIndex];
    return rowArray[columnIndex];
}

/**
 * Sets the value at the specified index
 * @param {Object} value
 * @param {Object} rowIndex
 * @param {Object} columnIndex
 */
EditableGrid.prototype.setValueAt = function(value, rowIndex, columnIndex){

    var rowArray = datas[rowIndex];
    rowArray[columnIndex] = value;
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
        // TODO Change body by a valid container
        document.body.appendChild(table);
    }
}

