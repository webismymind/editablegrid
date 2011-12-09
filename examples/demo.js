/*
 * demo.js
 * 
 * Copyright 2010 Webismymind SPRL
 *
 * This file is part of EditableGrid.
 * 
 * EditableGrid is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or 
 * any later version.
 * 
 * EditableGrid is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with EditableGrid. If not, see http://www.gnu.org/licenses.
 * 
 */

// create our editable grid
var editableGrid = new EditableGrid("DemoGrid", {
	enableSort: true, // true is the default, set it to false if you don't want sorting to be enabled
	editmode: "absolute", // change this to "fixed" to test out editorzone, and to "static" to get the old-school mode
	editorzoneid: "edition", // will be used only if editmode is set to "fixed"
	pageSize: 10
});

// helper method to display a message
function displayMessage(text, style) { 
	_$("message").innerHTML = "<p class='" + (style || "ok") + "'>" + text + "</p>"; 
} 

// this will be used to render our table headers
function InfoHeaderRenderer(message) { 
	this.message = message; 
	this.infoImage = new Image();
	this.infoImage.src = "images/information.png";
};

InfoHeaderRenderer.prototype = new CellRenderer();
InfoHeaderRenderer.prototype.render = function(cell, value) 
{
	if (value) {
		// here we don't use cell.innerHTML = "..." in order not to break the sorting header that has been created for us (cf. option enableSort: true)
		var link = document.createElement("a");
		link.href = "javascript:alert('" + this.message + "');";
		link.appendChild(this.infoImage);
		cell.appendChild(document.createTextNode("\u00a0\u00a0"));
		cell.appendChild(link);
	}
};

// this function will initialize our editable grid
function initializeGrid() 
{
	with (editableGrid) {

		// use a special header renderer to show an info icon for some columns
		setHeaderRenderer("age", new InfoHeaderRenderer("The age must be an integer between 16 and 99"));
		setHeaderRenderer("height", new InfoHeaderRenderer("The height is given in meters"));
		if (hasColumn('continent')) setHeaderRenderer("continent", new InfoHeaderRenderer("Note that the list of proposed countries depends on the selected continent"));
		setHeaderRenderer("email", new InfoHeaderRenderer("Note the validator used automatically when you specify your column as being of type email"));
		setHeaderRenderer("freelance", new InfoHeaderRenderer("This column tells if the person works as a freelance or as an employee"));
		
		// the list of allowed countries depend on the selected continent
		if (hasColumn('continent')) {

			setEnumProvider("country", new EnumProvider({ 
			
				// the function getOptionValuesForEdit is called each time the cell is edited
				// here we do only client-side processing, but you could use Ajax here to talk with your server
				// if you do, then don't forget to use Ajax in synchronous mode 
				getOptionValuesForEdit: function (grid, column, rowIndex) {
					var continent = editableGrid.getValueAt(rowIndex, editableGrid.getColumnIndex("continent"));
					if (continent == "eu") return { "be" : "Belgique", "fr" : "France", "uk" : "Great-Britain", "nl": "Nederland"};
					else if (continent == "am") return { "br" : "Brazil", "ca": "Canada", "us" : "USA" };
					else if (continent == "af") return { "ng" : "Nigeria", "za": "South Africa", "zw" : "Zimbabwe" };
					return null;
				}
			}));
		}

		getColumn("country").cellEditor.minWidth = 105;
		
		// use a flag image to render the selected country
		setCellRenderer("country", new CellRenderer({
			render: function(cell, value) { cell.innerHTML = value ? "<img src='images/flags/" + value.toLowerCase() + ".png' alt='" + value + "'/>" : ""; }
		})); 

		// use autocomplete on firstname
		setCellEditor("firstname", new AutocompleteCellEditor({
			suggestions: ['Leonard','Kirsten','Scott','Wayne','Stephanie','Astra','Charissa','Quin','Baxter','Jaime',
			              'Isabella','Slade','Ariana','Mohammad','Candice','Leslie','Jamal','Shay','Duncan','Neil',
			              'Kermit','Yardley','Arden','Lacy','Alisa','Selma','Scott','Natalie','Acton','Yoko','Abel',
			              'Lewis','Kellie','Shad','Joan','Ifeoma','Paloma','Jarrod','Cailin','Risa','Rylee','Giacomo',
			              'Kuame','Samuel','Ariel','Maggy','Dennis','Jocelyn','Joan','Kermit','Zorita','Tanya','Jasmine',
			              'Aquila','Jena','Dorian','Stacy','Bradley','Ulla','Sybil','Barrett','Ursa','Ignatius',
			              'Lenore','Owen','Sage','Tyrone','George','Deacon','Serina','Brian','Alden','Chadwick',
			              'Oleg','Stewart','Cynthia','Coby','Briar','Kasimir','Margaret','Lesley','Kareem','Kirestin',
			              'Zephania','Lee','Vladimir','Daryl','Henry','Amena','Camille','Dorian','Brenna','Anne','Price',
			              'Kelly','Maxine','Joseph','Illiana','Virginia','Reese','Mark', 'Paul', 'Jackie', 'Greg', 
			              'Matthew', 'Anthony', 'Claude', 'Louis', 'Marcello', 'Bernard', 'Betrand', 'Jessica', 'Patrick', 
			              'Robert', 'John', 'Jack', 'Duke', 'Denise', 'Antoine', 'Coby', 'Rana', 'Jasmine', 'André', 
			              'Martin', 'Amédé', 'Wanthus']
		}));

		// add a cell validator to check that the age is in [15, 100[
		addCellValidator("age", new CellValidator({ 
			isValid: function(value) { return value == "" || (parseInt(value) >= 15 && parseInt(value) < 100); }
		}));
		
		// register the function that will handle model changes
		modelChanged = function(rowIndex, columnIndex, oldValue, newValue, row) { 
			displayMessage("Value for '" + this.getColumnName(columnIndex) + "' in row " + this.getRowId(rowIndex) + " has changed from '" + oldValue + "' to '" + newValue + "'");
			if (this.getColumnName(columnIndex) == "continent") this.setValueAt(rowIndex, this.getColumnIndex("country"), ""); // if we changed the continent, reset the country
   	    	this.renderCharts();
		};
		
		// update paginator whenever the table is rendered (after a sort, filter, page change, etc.)
		tableRendered = function() { this.updatePaginator(); };

		// update charts when the table is sorted or filtered
		tableFiltered = function() { this.renderCharts(); };
		tableSorted = function() { this.renderCharts(); };

		rowSelected = function(oldRowIndex, newRowIndex) {
			if (oldRowIndex < 0) displayMessage("Selected row '" + this.getRowId(newRowIndex) + "'");
			else displayMessage("Selected row has changed from '" + this.getRowId(oldRowIndex) + "' to '" + this.getRowId(newRowIndex) + "'");
		};
		
		// render for the action column
		setCellRenderer("action", new CellRenderer({render: function(cell, value) {
			// this action will remove the row, so first find the ID of the row containing this cell 
			var rowId = editableGrid.getRowId(cell.rowIndex);
			cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to delete this person ? ')) editableGrid.removeRow('" + rowId + "'); editableGrid.renderCharts(); editableGrid.updatePaginator();\" style=\"cursor:pointer\">" +
							 "<img src=\"images/delete.png\" border=\"0\" alt=\"delete\" title=\"delete\"/></a>";
		}})); 

		// render the grid (parameters will be ignored if we have attached to an existing HTML table)
		renderGrid("tablecontent", "testgrid", "tableid");
		
		// filter is filter field is already filled in (refresh in some browsers will leave the field at its previous value) 
		if (_$('filter').value != "") filter(_$('filter').value);
		
		// filter when something is typed into filter
		_$('filter').onkeyup = function() { editableGrid.filter(_$('filter').value); };
	}
}

function loadXML() 
{
	// register the function that will be called when the XML has been fully loaded
	editableGrid.tableLoaded = function() { 
		displayMessage("Grid loaded from XML: " + this.getRowCount() + " row(s)"); 
		initializeGrid();
	};

	// load XML file
	editableGrid.loadXML("demo.xml"); // use "demo.xml.php" if you have PHP installed, to get live data from the demo.xml.csv file
}

function loadHTML() 
{
	// we attach our grid to an existing table: we give for each column a name and a type
	editableGrid.attachToHTMLTable(_$('htmlgrid'), 
		[ new Column({ name: "name", datatype: "string(24)" }),
		  new Column({ name: "firstname", datatype: "string" }),
		  new Column({ name: "age", datatype: "integer" }),
		  new Column({ name: "height", datatype: "double(m, 2)" }),
		  new Column({ name: "continent", datatype: "string", optionValues: {"eu": "Europa", "am": "America", "af": "Africa" }}),
		  new Column({ name: "country", datatype: "string" }),
		  new Column({ name: "email", datatype: "email(26)" }),
		  new Column({ name: "freelance", datatype: "boolean" }),
		  new Column({ name: "action", datatype: "html", editable: false }) ]);

	displayMessage("Grid attached to HTML table: " + editableGrid.getRowCount() + " row(s)"); 
	initializeGrid();
}

// function to render our two demo charts
EditableGrid.prototype.renderCharts = function() 
{
	this.renderBarChart("barchartcontent", 'Age per person' + (this.getRowCount() <= 15 ? '' : ' (first 15 rows out of ' + this.getRowCount() + ')'), 'name', null, null, null, 15);
	this.renderPieChart("piechartcontent", 'Country distribution', 'country', 'country');
};

// function to render the paginator control
EditableGrid.prototype.updatePaginator = function()
{
	var paginator = $("#paginator").empty();
	var nbPages = editableGrid.getPageCount();

	// get interval
	var interval = editableGrid.getSlidingPageInterval(20);
	if (interval == null) return;
	
	// get pages in interval (with links except for the current page)
	var pages = editableGrid.getPagesInInterval(interval, function(pageIndex, isCurrent) {
		if (isCurrent) return "" + (pageIndex + 1);
		return $("<a>").css("cursor", "pointer").html(pageIndex + 1).click(function(event) { editableGrid.setPageIndex(parseInt($(this).html()) - 1); });
	});
		
	// "first" link
	var link = $("<a>").html("<img src='images/gofirst.png'/>&nbsp;");
	if (!editableGrid.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.firstPage(); });
	paginator.append(link);

	// "prev" link
	link = $("<a>").html("<img src='images/prev.png'/>&nbsp;");
	if (!editableGrid.canGoBack()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.prevPage(); });
	paginator.append(link);

	// pages
	for (p = 0; p < pages.length; p++) paginator.append(pages[p]).append(" | ");
	
	// "next" link
	link = $("<a>").html("<img src='images/next.png'/>&nbsp;");
	if (!editableGrid.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.nextPage(); });
	paginator.append(link);

	// "last" link
	link = $("<a>").html("<img src='images/golast.png'/>&nbsp;");
	if (!editableGrid.canGoForward()) link.css({ opacity : 0.4, filter: "alpha(opacity=40)" });
	else link.css("cursor", "pointer").click(function(event) { editableGrid.lastPage(); });
	paginator.append(link);
}
