function onloadXML() 
{
	var editableGrid = new EditableGrid({
		
		// called when the XML has been fully loaded: we display a message and render the grid
		tableLoaded: function() { $("message").innerHTML = "<p class='ok'>Ready!</p>"; this.renderGrid("tablecontent", "testgrid"); },
		
		// called when some value has been modified: we display a message
		modelChanged: function(rowIdx, colIdx, oldValue, newValue, row) { $("message").innerHTML = "<p class='ok'>New value is '" + newValue + "'</p>"; }
	});

	// load XML file
	editableGrid.load("demo.xml"); 
}