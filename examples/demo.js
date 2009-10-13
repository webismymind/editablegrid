var editableGrid = null;

function InfoHeaderRenderer(message) { this.message = message; };
InfoHeaderRenderer.prototype = new CellRenderer();
InfoHeaderRenderer.prototype.render = function(cell, value) {
	cell.innerHTML = value ? value + "&nbsp;&nbsp;<a href=\"javascript:alert('" + this.message + "')\"><img src='images/information.png'/></a> " : "";
};

function displayMessage(text, style) { 
	$("message").innerHTML = "<p class='" + (style || "ok") + "'>" + text + "</p>"; 
} 

function initializeGrid(grid) 
{
	// use a special renderer for the header of the freelance and age columns
	grid.setHeaderRenderer("freelance", new InfoHeaderRenderer("This column tells if the person works as a freelance or as an employee"));
	grid.setHeaderRenderer("age", new InfoHeaderRenderer("The age must be an integer between 16 and 99"));

	// show unit when rendering the height
	grid.setCellRenderer("height", new CellRenderer({ 
		render: function(cell, value) { new NumberCellRenderer().render(cell, value ? value + " m" : ""); } 
	})); 

	// the list of allowed countries depend on the selected continent
	grid.setEnumProvider("country", new EnumProvider({ 
		getOptionValues: function (column, rowIndex) {
			var continent = grid.getValueAt(rowIndex, 4);
			if (continent == "eu") return { "be" : "Belgique", "fr" : "France", "uk" : "Great-Britain", "nl": "Nederland"};
			else if (continent == "am") return { "br" : "Brazil", "ca": "Canada", "us" : "USA" };
			else if (continent == "af") return { "ng" : "Nigeria", "za": "South Africa", "zw" : "Zimbabwe" };
			return null;
		}
	}));

	// use a flag image to render the selected country
	grid.setCellRenderer("country", new CellRenderer({
		render: function(cell, value) { cell.innerHTML = value ? "<img src='images/" + value.toLowerCase() + ".png' alt='" + value + "'/>" : ""; }
	})); 

	// add a cell validator to check that the age is in [16, 100[
	grid.addCellValidator("age", new CellValidator({ 
		isValid: function(value) { return value == "" || (parseInt(value) >= 16 && parseInt(value) < 100); }
	}));
	
	// render the grid inside div tablecontent
	grid.renderGrid("tablecontent");
}				
			
window.onload = function() 
{
	editableGrid = new EditableGrid({
		className: "testgrid",
		editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the default mode
		editorzoneid: "edition",
		
        tableLoaded: function() { 
			displayMessage("Table loaded : " + this.getRowCount() + " row(s)"); 
			initializeGrid(this); 
		},

		modelChanged: function(rowIndex, columnIndex, oldValue, newValue, row) { 
			displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + row.id + " has changed from '" + oldValue + "' to '" + newValue + "'");
			if (this.getColumnName(columnIndex) == "continent") this.setValueAt(rowIndex, this.getColumnIndex("country"), ""); // if we changed the continent, reset the country
		}
	 });
				 
	// load wml file (we use a trick to avoid problems with the browser's cache)
	editableGrid.load("demo.xml?" + Math.floor(Math.random() * 100000));
}
