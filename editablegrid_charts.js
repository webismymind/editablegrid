var EditableGrid_check_lib = true;

EditableGrid.prototype.checkChartLib = function()
{
	EditableGrid_check_lib = false;
	try {
		$('dummy').highcharts();
	}
	catch (e) {
		alert('HighCharts library not loaded!');
		return false;
	}

	return true;
};

EditableGrid.prototype.hex2rgba = function(hexColor, alpha)
{
	if (typeof alpha == 'undefined') alpha = 1.0;
	var color = {red: parseInt(hexColor.substr(1,2),16), green: parseInt(hexColor.substr(3,2),16), blue:  parseInt(hexColor.substr(5,2),16)};
	return 'rgba(' + color.red + ',' + color.green + ',' + color.blue + ',' + alpha + ')';
};

EditableGrid.prototype.getFormattedValue = function(rowIndex, columnIndex, value)
{
	try {

		// let the renderer work on a dummy element
		var element = document.createElement('div');
		var renderer = this.getColumn(columnIndex).cellRenderer;
		renderer._render(rowIndex, columnIndex, element, value);
		return element.innerHTML;

	} catch (ex) {
		return value;
	}
};


/**
 * renderBarChart
 * Render open flash bar chart for the data contained in the table model
 * @param divId
 * @param title
 * @param labelColumnIndexOrName
 * @param options: legend (label of labelColumnIndexOrName), bgColor (transparent), alpha (0.9), limit (0), bar3d (true), rotateXLabels (0) 
 * @return
 */

EditableGrid.prototype.renderBarChart = function(divId, title, labelColumnIndexOrName, options)
{
	// default options
	this.legend = null;
	this.bgColor = null; // transparent
	this.alpha = 0.9;
	this.limit = 0;
	this.bar3d = false;
	this.rotateXLabels = 0;

	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		// override default options with the ones given
		if (options) for (var p in options) this[p] = options[p];

		// get useful values
		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);
		var columnCount = getColumnCount();
		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		// base chart
		var chart = {

				chart: {
					type: 'column',
					backgroundColor: bgColor,
					plotBackgroundColor: bgColor,
					options3d: { 
						enabled: bar3d
					}
				},

				plotOptions: {
					column: {
						groupPadding: 0.1,
						pointPadding: 0.1,
						borderWidth: 0
					}
				},

				credits: {
					enabled: false
				},

				title: {
					text: title
				},

				tooltip: {
					pointFormat: '{series.name}: <b>{point.formattedValue}</b>'
				}
		};

		// xaxis with legend and rotation
		chart.xAxis = { 
				title: { text:  legend || getColumnLabel(labelColumnIndexOrName) }, 
				labels: { rotation: rotateXLabels } 
		};

		// on category for each row
		chart.xAxis.categories = []; 
		for (var r = 0; r < rowCount; r++) {
			if (getRowAttribute(r, "skip") == "1") continue;
			var label = getRowAttribute(r, "barlabel"); // if there is a barlabel attribute, use it and ignore labelColumn
			chart.xAxis.categories.push(label ? label : getValueAt(r, cLabel));
		}

		// one serie for each bar column
		chart.series = [];
		var minvalue = 0;
		var maxvalue = 0;
		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;

			// serie's name and color
			var serie = { 
					name: getColumnLabel(c), 
					color: hex2rgba(smartColorsBar[chart.series.length % smartColorsBar.length], alpha), 
					data: []
			};

			// data: one value per row
			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
				var value = getValueAt(r,c);
				if (value > maxvalue) maxvalue = value; 
				if (value < minvalue) minvalue = value; 
				serie.data.push({ y: value, formattedValue: this.getFormattedValue(r, c, value) });
			}

			chart.series.push(serie);
		}

		// y axis with no title and min/max value
		chart.yAxis = {
				min: (minvalue < 0 ? minvalue : 0),
				max: maxvalue,
				title: { text: "" } 
		};

		$('#' + divId).highcharts(chart);
	}
};

/**
 * renderStackedBarChart
 * Render open flash stacked bar chart for the data contained in the table model
 * @param divId
 * @param title
 * @param labelColumnIndexOrName
 * @param options: legend (label of labelColumnIndexOrName), bgColor (#ffffff), alpha (0.9), limit (0), rotateXLabels (0) 
 * @return
 */
EditableGrid.prototype.renderStackedBarChart = function(divId, title, labelColumnIndexOrName, options)
{
	// TODO
};

/**
 * renderPieChart
 * @param divId
 * @param title
 * @param valueColumnIndexOrName
 * @param labelColumnIndexOrName: if same as valueColumnIndexOrName, the chart will display the frequency of values in this column 
 * @param options: startAngle (0), bgColor (transparent), alpha (0.9), limit (0), gradientFill (true) 
 * @return
 */
EditableGrid.prototype.renderPieChart = function(divId, title, valueColumnIndexOrName, labelColumnIndexOrName, options) 
{
	// default options
	this.startAngle = 0;
	this.bgColor = null; // transparent
	this.alpha = 0.9;
	this.limit = 0;
	this.pie3d = false,
	this.gradientFill = true;

	// override default options with the ones given
	if (options) for (var p in options) this[p] = options[p];

	with (this) {

		if (EditableGrid_check_lib && !checkChartLib()) return false;

		// useful values
		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		title = (typeof title == 'undefined' || title === null) ? getColumnLabel(valueColumnIndexOrName) : title;
		var cValue = getColumnIndex(valueColumnIndexOrName);
		var cLabel = getColumnIndex(labelColumnIndexOrName);
		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		// check the column is numerical
		var type = getColumnType(valueColumnIndexOrName);
		if (type != "double" && type != "integer" && cValue != cLabel) return false;

		// base chart
		var chart = {

				chart: {
					type: 'pie',
					backgroundColor: bgColor,
					plotBackgroundColor: bgColor,
					plotBorderWidth: 0,
					options3d: { 
						enabled: pie3d,
						alpha: 45
					}

				},

				credits: {
					enabled: false
				},

				title: {
					text: title
				},

				tooltip: {
					pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
				},

				plotOptions: {
					pie: {
						dataLabels: {
							enabled: true,
							format: '<b>{point.name}</b><br/>{point.formattedValue}'
						},
						startAngle: startAngle
					}
				}
		};

		chart.series = [];
		var serie = { name: title, data: [] };
		chart.series.push(serie);

		if (cValue == cLabel) {

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
				serie.data.push({ 
					y : occurences, 
					name: value,
					formattedValue: value,
					color: hex2rgba(smartColorsBar[serie.data.length % smartColorsPie.length], alpha)
				});
			}
			chart.series.push(serie);
		}
		else {

			for (var r = 0; r < rowCount; r++) {
				if (getRowAttribute(r, "skip") == "1") continue;
				var value = getValueAt(r,cValue);
				if (value !== null && !isNaN(value)) serie.data.push({ 
					y : value, 
					name: getValueAt(r,cLabel),
					formattedValue: this.getFormattedValue(r, cValue, value),
					color: hex2rgba(smartColorsBar[serie.data.length % smartColorsPie.length], alpha)
				});
			}
		}

		$('#' + divId).highcharts(chart);
		return serie.data.length;
	}
};

/**
 * clearChart
 * @param divId
 * @return
 */
EditableGrid.prototype.clearChart = function(divId) 
{
	$('#' + divId).html('');
};