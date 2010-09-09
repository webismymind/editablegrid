/*
 * EditableGrid_charts.js
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

var EditableGrid_pending_charts = {};
var EditableGrid_check_lib = true;

function EditableGrid_loadChart(divId)
{
	var swf = findSWF(divId);
	if (swf && typeof swf.load == "function") swf.load(JSON.stringify(EditableGrid_pending_charts[divId]));
	else setTimeout("EditableGrid_loadChart('"+divId+"');", 100);
}

function EditableGrid_get_chart_data(divId) 
{
	setTimeout("EditableGrid_loadChart('"+divId+"');", 100);
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
EditableGrid.prototype.renderBarChart = function(divId, title, labelColumnIndexOrName, legend, bgColor, alpha)
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		if (typeof bgColor == 'undefined') bgColor = "#ffffff";
		if (typeof alpha == 'undefined') alpha = 0.9;

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);

		var chart = new ofc_chart();
		chart.bg_colour = bgColor;
		chart.set_title({text: title || '', style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});
	
		var columnCount = getColumnCount();
		var rowCount = getRowCount();
	
		var maxvalue = 0;
		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;
			var bar = new ofc_element("bar_3d");
			bar.alpha = alpha;
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
			text: legend || getColumnLabel(labelColumnIndexOrName),
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
EditableGrid.prototype.renderPieChart = function(divId, title, valueColumnIndexOrName, labelColumnIndexOrName, startAngle, bgColor, alpha, gradientFill) 
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		if (typeof gradientFill == 'undefined') gradientFill = true;
		if (typeof bgColor == 'undefined') bgColor = "#ffffff";
		if (typeof alpha == 'undefined') alpha = 0.5;

		var type = getColumnType(valueColumnIndexOrName);
		if (type != "double" && type != "integer") return;

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		title = (typeof title == 'undefined' || title === null) ? getColumnLabel(valueColumnIndexOrName) : title;
		
		var cValue = getColumnIndex(valueColumnIndexOrName);
		var cLabel = getColumnIndex(labelColumnIndexOrName);
		
		var chart = new ofc_chart();
		chart.bg_colour = bgColor;
		chart.set_title({text: title, style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});
	
		var rowCount = getRowCount();
	
		var pie = new ofc_element("pie");
		pie.colours = smartColors2;
		pie.alpha = alpha;
		pie['gradient-fill'] = gradientFill;
		
		if (typeof startAngle != 'undefined') pie['start-angle'] = startAngle;

		var total = 0; 
		for (var r = 0; r < rowCount - (ignoreLastRow ? 1 : 0); r++) {
			var rowValue = getValueAt(r,cValue);
			total += isNaN(rowValue) ? 0 : rowValue;
		}
		
		for (var r = 0; r < rowCount - (ignoreLastRow ? 1 : 0); r++) {
			var value = getValueAt(r,cValue);
			var label = getValueAt(r,cLabel);
			if (!isNaN(value)) pie.values.push({value : value, label: label + ' (' + (100 * (value / total)).toFixed(1) + '%)'});
		}
		chart.add_element(pie);
		
		if (pie.values.length > 0) updateChart(divId, chart);
		return pie.values.length;
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
			var w = parseInt(getStyle(div, 'width'));
			var h = parseInt(getStyle(div, 'height'));
			w = Math.max(isNaN(w)?0:w, div.offsetWidth);
			h = Math.max(isNaN(h)?0:h, div.offsetHeight);
			
			swfobject.embedSWF(this.ofcSwf, 
					divId, 
					"" + (w || 500), 
					"" + (h || 200), 
					"9.0.0", "expressInstall.swf", { "get-data": "EditableGrid_get_chart_data", "id": divId }, null, 
					{ wmode: "Opaque", salign: "l", AllowScriptAccess:"always"}
			);
		}
		
		chartRendered();
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