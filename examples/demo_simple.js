/*
 * demo_simple.js
 * 
 * Copyright 2010 Webismymind SPRL

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

var editableGrid = null;

function onloadXML() 
{
	editableGrid = new EditableGrid("DemoGrid", {
		
		// called when the XML has been fully loaded 
		tableLoaded: function() { 
		
			// display a message
			_$("message").innerHTML = "<p class='ok'>Ready!</p>";
			
			// renderer for the action column
			this.setCellRenderer("action", new CellRenderer({render: function(cell, value) { 
				cell.innerHTML = "<a onclick=\"if (confirm('Are you sure you want to delete this person ? ')) editableGrid.removeRow(" + value + ");\" style=\"cursor:pointer\"" +
								 "<img src=\"images/delete.png\" border=\"0\" alt=\"delete\" title=\"delete\"/></a>";
			}})); 

			// render the grid
			this.renderGrid("tablecontent", "testgrid"); 
		},
		
		// called when some value has been modified: we display a message
		modelChanged: function(rowIdx, colIdx, oldValue, newValue, row) { _$("message").innerHTML = "<p class='ok'>New value is '" + newValue + "'</p>"; }
	});

	// load XML file
	editableGrid.loadXML("demo.xml"); 
}