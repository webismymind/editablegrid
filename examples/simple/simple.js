var editableGrid = null;

function loadXML() 
{
	editableGrid = new EditableGrid("DemoGridSimple", {
		
		// called when the XML has been fully loaded 
		tableLoaded: function() { 
		
			// display a message
			_$("message").innerHTML = "<p class='ok'>Ready!</p>";
			
			// renderer for the action column
			this.setCellRenderer("action", new CellRenderer({render: function(cell, value) { 
				cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to delete this person ? ')) editableGrid.remove(" + cell.rowIndex + ");\" style=\"cursor:pointer\">" +
								 "<img src=\"delete.png\" border=\"0\" alt=\"delete\" title=\"delete\"/></a>";
			}})); 

			// render the grid
			this.renderGrid("tablecontent", "testgrid"); 
		},
		
		// called when some value has been modified: we display a message
		modelChanged: function(rowIdx, colIdx, oldValue, newValue, row) { _$("message").innerHTML = "<p class='ok'>New value is '" + newValue + "'</p>"; }
	});

	// load XML file
	editableGrid.loadXML("grid.xml"); 
}

// start when window is loaded
window.onload = loadXML;