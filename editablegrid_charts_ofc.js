var EditableGrid_pending_charts = {};

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

EditableGrid.prototype.checkChartLib_OFC = function()
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
 * @param title
 * @param labelColumnIndexOrName
 * @param options: legend (label of labelColumnIndexOrName), bgColor (#ffffff), alpha (0.9), limit (0), bar3d (true), rotateXLabels (0) 
 * @return
 */
EditableGrid.prototype.renderBarChart_OFC = function(divId, title, labelColumnIndexOrName, options)
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib_OFC()) return false;

		// default options
		this.legend = null;
		this.bgColor = "#ffffff";
		this.alpha = 0.9;
		this.limit = 0;
		this.bar3d = true;
		this.rotateXLabels = 0;

		// override default options with the ones given
		if (options) for (var p in options) this[p] = options[p];

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);

		var chart = new ofc_chart();
		chart.bg_colour = bgColor;
		chart.set_title({text: title || '', style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});

		var columnCount = getColumnCount();
		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		var maxvalue = 0;
		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;
			var bar = new ofc_element(bar3d ? "bar_3d" : "bar");
			bar.alpha = alpha;
			bar.colour = smartColorsBar[chart.elements.length % smartColorsBar.length];
			bar.fill = "transparent";
			bar.text = getColumnLabel(c);
			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
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
		for (var r = 0; r < rowCount; r++) {
			if (getRowAttribute(r, "skip") == "1") continue;
			var label = getRowAttribute(r, "barlabel"); // if there is a barlabel attribute, use it and ignore labelColumn
			xLabels.push(label ? label : getValueAt(r,cLabel));
		}

		chart.x_axis = {
				stroke: 1,
				tick_height:  10,
				colour: "#E2E2E2",
				"grid-colour": "#E2E2E2",
				labels: { rotate: rotateXLabels, labels: xLabels },
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
 * renderStackedBarChart
 * Render open flash stacked bar chart for the data contained in the table model
 * @param divId
 * @param title
 * @param labelColumnIndexOrName
 * @param options: legend (label of labelColumnIndexOrName), bgColor (#ffffff), alpha (0.8), limit (0), rotateXLabels (0) 
 * @return
 */
EditableGrid.prototype.renderStackedBarChart_OFC = function(divId, title, labelColumnIndexOrName, options)
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib_OFC()) return false;

		// default options
		this.legend = null;
		this.bgColor = "#ffffff";
		this.alpha = 0.8;
		this.limit = 0;
		this.rotateXLabels = 0;

		// override default options with the ones given
		if (options) for (var p in options) this[p] = options[p];

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);

		var chart = new ofc_chart();
		chart.bg_colour = bgColor;
		chart.set_title({text: title || '', style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});

		var columnCount = getColumnCount();
		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		var maxvalue = 0;
		var bar = new ofc_element("bar_stack");
		bar.alpha = alpha;
		bar.colours = smartColorsBar;
		bar.fill = "transparent";
		bar.keys = [];

		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;
			bar.keys.push({ colour: smartColorsBar[bar.keys.length % smartColorsBar.length], text: getColumnLabel(c), "font-size": '13' });
		}

		for (var r = 0; r < rowCount; r++) {
			if (getRowAttribute(r, "skip") == "1") continue;
			var valueRow = [];
			var valueStack = 0;
			for (var c = 0; c < columnCount; c++) {
				if (!isColumnBar(c)) continue;
				var value = getValueAt(r,c);
				value = isNaN(value) ? 0 : value;
				valueStack += value;
				valueRow.push(value);
			}
			if (valueStack > maxvalue) maxvalue = valueStack; 
			bar.values.push(valueRow);
		}

		chart.add_element(bar);

		// round the y max value
		var ymax = 10;
		while (ymax < maxvalue) ymax *= 10;
		var dec_step = ymax / 10;
		while (ymax - dec_step > maxvalue) ymax -= dec_step;

		var xLabels = [];
		for (var r = 0; r < rowCount; r++) {
			if (getRowAttribute(r, "skip") == "1") continue;
			xLabels.push("aa " + getValueAt(r,cLabel));
		}

		chart.x_axis = {
				stroke: 1,
				tick_height:  10,
				colour: "#E2E2E2",
				"grid-colour": "#E2E2E2",
				labels: { rotate: rotateXLabels, labels: xLabels },
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
 * @param divId
 * @param title
 * @param valueColumnIndexOrName
 * @param labelColumnIndexOrName: if same as valueColumnIndexOrName, the chart will display the frequency of values in this column 
 * @param options: startAngle (0), bgColor (#ffffff), alpha (0.5), limit (0), gradientFill (true) 
 * @return
 */
EditableGrid.prototype.renderPieChart_OFC = function(divId, title, valueColumnIndexOrName, labelColumnIndexOrName, options) 
{
	with (this) {

		if (EditableGrid_check_lib && !checkChartLib_OFC()) return false;

		// default options
		this.startAngle = 0;
		this.bgColor = "#ffffff";
		this.alpha = 0.5;
		this.limit = 0;
		this.gradientFill = true;

		// override default options with the ones given
		if (options) for (var p in options) this[p] = options[p];

		var type = getColumnType(valueColumnIndexOrName);
		if (type != "double" && type != "integer" && valueColumnIndexOrName != labelColumnIndexOrName) return;

		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		title = (typeof title == 'undefined' || title === null) ? getColumnLabel(valueColumnIndexOrName) : title;

		var cValue = getColumnIndex(valueColumnIndexOrName);
		var cLabel = getColumnIndex(labelColumnIndexOrName);

		var chart = new ofc_chart();
		chart.bg_colour = bgColor;
		chart.set_title({text: title, style: "{font-size: 20px; color:#0000ff; font-family: Verdana; text-align: center;}"});

		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		var pie = new ofc_element("pie");
		pie.colours = smartColorsPie;
		pie.alpha = alpha;
		pie['gradient-fill'] = gradientFill;

		if (typeof startAngle != 'undefined' && startAngle !== null) pie['start-angle'] = startAngle;

		if (valueColumnIndexOrName == labelColumnIndexOrName) {

			// frequency pie chart
			var distinctValues = {}; 
			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
				var rowValue = getValueAt(r,cValue);
				if (rowValue in distinctValues) distinctValues[rowValue]++;
				else distinctValues[rowValue] = 1;
			}

			for (var value in distinctValues) {
				var occurences = distinctValues[value];
				pie.values.push({value : occurences, label: value + ' (' + (100 * (occurences / rowCount)).toFixed(1) + '%)'});
			}
		}
		else {

			var total = 0; 
			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
				var rowValue = getValueAt(r,cValue);
				total += isNaN(rowValue) ? 0 : rowValue;
			}

			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
				var value = getValueAt(r,cValue);
				var label = getValueAt(r,cLabel);
				if (!isNaN(value)) pie.values.push({value : value, label: label + ' (' + (100 * (value / total)).toFixed(1) + '%)'});
			}
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
		if (swf && typeof swf.load == "function") {
			try { swf.load(JSON.stringify(chart)); }
			catch (ex) { console.error(ex); }
		}
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