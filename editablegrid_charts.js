var EditableGrid_pending_chart;

function EditableGrid_get_chart_data() 
{
	return JSON.stringify(EditableGrid_pending_chart);
}

var smartColors1 = ["#dc243c","#4040f6","#00f629","#efe100","#f93fb1","#6f8183","#111111"];

/**
 * Render open flash chart for the data contained in the table model
 */
EditableGrid.prototype.renderChart = function(divId, chartType) 
{
	with (this) {

		var chart = new ofc_chart();
		chart.bg_colour = "#ffffff";
		chart.set_title({text: "Report", style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});
	
		var columnCount = getColumnCount();
		var rowCount = getRowCount();
	
		var maxvalue = 0;
		for (var c = 0; c < columnCount; c++) {
			var type = getColumnType(c);
			if (type != "double" && type != "integer") continue;
			var bar = new ofc_element("bar_3d");
			bar.alpha = 0.9;
			bar.colour = smartColors1[chart.elements.length % smartColors1.length];
			bar.fill = "transparent";
			bar.text = getColumnLabel(c);
			for (var r = 0; r < rowCount; r++) {
				var value = getValueAt(r,c);
				if (value > maxvalue) maxvalue = value; 
				bar.values.push(value);
			}
			chart.add_element(bar);
		}
		
		var xLabels = [];
		for (var r = 0; r < rowCount; r++) xLabels.push(getValueAt(r,0));
	}
	
	chart.x_axis = {
		    stroke: 1,
		    tick_height:  10,
			 colour: "#E2E2E2",
			 "grid-colour": "#E2E2E2",
		    labels: { labels: xLabels },
		    "3d": 5
	};

	chart.y_axis = {
			 stroke: 4,
			 tick_length: 3,
			 colour: "#428BC7",
			 "grid-colour": "#E2E2E2",
			 offset: 0,
			 max: maxvalue * 1.1
	};
	
	chart.x_legend = {
	    text: "Country",
	    style: "{font-size: 11px; color: #000033}"
	 };

	chart.y_legend = {
		text: "Value",
		style: "{font-size: 11px; color: #000033}"
	};

	// reload or create new swf chart
	var swf = findSWF(divId);
	if (swf) swf.load(JSON.stringify(chart));
	else {
		EditableGrid_pending_chart = chart;
		swfobject.embedSWF("openflashchart/open-flash-chart.swf", 
			divId, "900", "300", 
			"9.0.0", "expressInstall.swf", { "get-data": "EditableGrid_get_chart_data" }, null, 
			{ wmode: "Opaque", salign: "l", AllowScriptAccess:"always"}
		);
	}
};