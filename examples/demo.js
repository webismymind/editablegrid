function displayMessage(text, style) { 
	$("message").innerHTML = "<p class='" + (style || "ok") + "'>" + text + "</p>"; 
} 

function initializeGrid(grid) 
{
	// show unit when rendering the height
	grid.setCellRenderer(3, new CellRenderer({ 
		render: function(cell, value) { new NumberCellRenderer().render(cell, value ? value + " m" : ""); } 
	})); 

	// the list of allowed countries depend on the selected continent
	grid.setEnumProvider(5, new EnumProvider({ 
		getOptionValues: function (column, rowIndex) {
			var continent = grid.getValueAt(rowIndex, 4);
			if (continent == "eu") return { "be" : "Belgique", "fr" : "France", "uk" : "Great-Britain", "nl": "Nederland"};
			else if (continent == "am") return { "br" : "Brazil", "ca": "Canada", "us" : "USA" };
			else if (continent == "af") return { "ng" : "Nigeria", "za": "South Africa", "zw" : "Zimbabwe" };
			return null;
		}
	}));

	// use a flag image to render the selected country
	grid.setCellRenderer(5, new CellRenderer({
		render: function(cell, value) { cell.innerHTML = value ? "<img src='images/" + value.toLowerCase() + ".png' alt='" + value + "'/>" : ""; }
	})); 

	// add a cell validator to check that the age is in [16, 100[
	grid.addCellValidator(2, new CellValidator({ 
		isValid: function(value) { return parseInt(value) >= 16 && parseInt(value) < 100; }
	}));
	
	// render the grid
	grid.renderGrid();
}				
			
window.onload = function() 
{
	var editableGrid = new EditableGrid({		
		containerid: "tablecontent",
		className: "testgrid",
		editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the default mode
		editorzoneid: "edition",
		
        tableLoaded: function() { 
			displayMessage("Table loaded : " + this.getRowCount() + " row(s)"); 
			initializeGrid(this); 
		},

		modelChanged: function(rowIndex, columnIndex, value) { 
			displayMessage("Cell at " + rowIndex + "," + columnIndex + " has changed: new value = '" + value + "'");
			if (columnIndex == 4) this.setValueAt(rowIndex, 5, ""); // if we changed the continent, reset the country
		}
	 });
				 
	editableGrid.load("demo.xml");
}
