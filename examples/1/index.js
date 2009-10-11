function displayMessage(text, style) 
{ 
	$("message").innerHTML = "<p class='" + (style || "ok") + "'>" + text + "</p>"; 
} 

function initializeGrid(grid) 
{
	// use a flag image to render the selected country
	grid.setCellRenderer(5, new CellRenderer({ 
		render: function (cell, value) { 
			cell.innerHTML = value ? "<img src='flags/" + value.toLowerCase() + ".png' alt='" + value + "'/>" : ""; 
		}
	}));

	// render the grid
	grid.renderGrid();
}				
			
window.onload = function() 
{
	var editableGrid = new EditableGrid( { 
		containerid: "tablecontent",
		className: "testgrid",
		editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the default mode
		editorzoneid: "edition",
        modelChanged: function(rowIndex, columnIndex, value) { displayMessage("Cell at " + rowIndex + "," + columnIndex + " has changed: new value = '" + value + "'"); },
       	tableLoaded: function() { displayMessage("Table loaded : " + this.getRowCount() + " row(s)"); initializeGrid(this); }
	 });
				 
	editableGrid.load("grid.xml");
}
