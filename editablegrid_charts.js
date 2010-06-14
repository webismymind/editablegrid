var EditableGrid_pending_charts = {};
var EditableGrid_check_lib = true;

function EditableGrid_get_chart_data(divId) 
{
	return JSON.stringify(EditableGrid_pending_charts[divId]);
}

var smartColors1 = ["#dc243c","#4040f6","#00f629","#efe100","#f93fb1","#6f8183","#111111"];
var smartColors2 = ["#FF0000","#00FF00","#0000FF","#FFD700","#FF00FF","#00FFFF","#800080"];

EditableGrid.prototype.checkChartLib = function()
{
	EditableGrid_check_lib = false;
	if (typeof JSON.stringify == 'undefined') { alert('This method needs the JSON javascript library'); return false; }
	else if (typeof findSWF == 'undefined') { alert('This method needs the open flash chart javascript library (findSWF)'); return false; }
	else if (typeof ofc_chart == 'undefined') { alert('This method needs the open flash chart javascript library (ofc_chart)'); return false; }
	else if (typeof swfobject == 'undefined') { alert('This method needs the swfobject javascript library'); return false; }
	else return true;
};

/**
 * renderBarChart
 * Render open flash bar chart for the data contained in the table model
 * @param divId
 * @return
 */
EditableGrid.prototype.renderBarChart = function(divId, title, labelColumnIndexOrName)
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);

		var chart = new ofc_chart();
		chart.bg_colour = "#ffffff";
		chart.set_title({text: title || '', style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});
	
		var columnCount = getColumnCount();
		var rowCount = getRowCount();
	
		var maxvalue = 0;
		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;
			var bar = new ofc_element("bar_3d");
			bar.alpha = 0.9;
			bar.colour = smartColors1[chart.elements.length % smartColors1.length];
			bar.fill = "transparent";
			bar.text = getColumnLabel(c);
			for (var r = 0; r < rowCount - (ignoreLastRow ? 1 : 0); r++) {
				var value = getValueAt(r,c);
				if (value > maxvalue) maxvalue = value; 
				bar.values.push(value);
			}
			chart.add_element(bar);
		}
		
		// round the y max value
		var ymax = 10;
		while (ymax < maxvalue) ymax *= 10;
		var dec_step = ymax / 10;
		while (ymax - dec_step > maxvalue) ymax -= dec_step;
		
		var xLabels = [];
		for (var r = 0; r < rowCount - (ignoreLastRow ? 1 : 0); r++) xLabels.push(getValueAt(r,cLabel));
	
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
			 steps: ymax / 10.0,
			 max: ymax
		};
			
		// chart.num_decimals = 0;
		
		chart.x_legend = {
			text: getColumnLabel(labelColumnIndexOrName),
			style: "{font-size: 11px; color: #000033}"
		};

		chart.y_legend = {
			text: "",
			style: "{font-size: 11px; color: #000033}"
		};

		updateChart(divId, chart);
	}
};

/**
 * renderPieChart
 * @param columnIndexOrName
 * @param divId
 * @return
 */
EditableGrid.prototype.renderPieChart = function(divId, title, valueColumnIndexOrName, labelColumnIndexOrName, startAngle) 
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		var type = getColumnType(valueColumnIndexOrName);
		if (type != "double" && type != "integer") return;

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		title = title || getColumnLabel(valueColumnIndexOrName);
		
		var cValue = getColumnIndex(valueColumnIndexOrName);
		var cLabel = getColumnIndex(labelColumnIndexOrName);
		
		var chart = new ofc_chart();
		chart.bg_colour = "#ffffff";
		chart.set_title({text: title, style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});
	
		var rowCount = getRowCount();
	
		var pie = new ofc_element("pie");
		pie.colours = smartColors2;
		pie.alpha = 0.5;
		pie['gradient-fill'] = true;
		
		if (typeof startAngle != 'undefined') pie['start-angle'] = startAngle;

		for (var r = 0; r < rowCount - (ignoreLastRow ? 1 : 0); r++) {
			var value = getValueAt(r,cValue);
			var label = getValueAt(r,cLabel);
			if (!isNaN(value)) pie.values.push({value : value, label: label + ' (' + value + ')'});
		}
		chart.add_element(pie);
		
		updateChart(divId, chart);
	}
};

/**
 * updateChart
 * @param divId
 * @param chart
 * @return
 */
EditableGrid.prototype.updateChart = function(divId, chart) 
{
	if (typeof this.ofcSwf == 'undefined' || !this.ofcSwf) {

		// detect openflashchart swf location
		this.ofcSwf = 'open-flash-chart.swf'; // defaults to current directory
		var e = document.getElementsByTagName('script');
		for (var i = 0; i < e.length; i++) {
			var index = e[i].src.indexOf('openflashchart');
			if (index != -1) {
				this.ofcSwf = e[i].src.substr(0, index + 15) + this.ofcSwf;
				break;
			}
		};
	}
	
	with (this) {

		// reload or create new swf chart
		var swf = findSWF(divId);
		if (swf && typeof swf.load == "function") swf.load(JSON.stringify(chart));
		else {
			var div = _$(divId);
			EditableGrid_pending_charts[divId] = chart;
			
			// get chart dimensions
			var w = Math.max(parseInt(getStyle(div, 'width')), div.offsetWidth);
			var h = Math.max(parseInt(getStyle(div, 'height')), div.offsetHeight);

			swfobject.embedSWF(this.ofcSwf, 
					divId, 
					"" + (w || 500), 
					"" + (h || 200), 
					"9.0.0", "expressInstall.swf", { "get-data": "EditableGrid_get_chart_data", "id": divId }, null, 
					{ wmode: "Opaque", salign: "l", AllowScriptAccess:"always"}
			);
		}
	}
};

/**
 * clearChart
 * @param divId
 * @return
 */
EditableGrid.prototype.clearChart = function(divId) 
{
	// how ?
};