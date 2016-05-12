var EditableGrid_check_lib = null;

EditableGrid.prototype.checkChartLib = function()
{
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

EditableGrid.prototype.getFormattedValue = function(columnIndex, value)
{
	try {

		// let the renderer work on a dummy element
		var element = document.createElement('div');
		var renderer = this.getColumn(columnIndex).cellRenderer;
		renderer._render(0, columnIndex, element, value);
		return element.innerHTML;

	} catch (ex) {
		return value;
	}
};

EditableGrid.prototype.skipRow = function(rowIndex)
{
	// skip if set as an attribute
	if (this.getRowAttribute(rowIndex, "skip") == "1") return true;

	// skip if hidden or expanded
	var row = this.getRow(rowIndex);
	if (row && row.style && row.style.display == 'none') return true;
	if (row && typeof row.expanded != 'undefined' && row.expanded !== null) return row.expanded;

	return false;
};

/**
 * renderBarChart
 * Render Highcharts column chart for the data contained in the table model
 * @param divId
 * @param title
 * @param labelColumnIndexOrName
 * @param options: legend (label of labelColumnIndexOrName), bgColor (transparent), alpha (0.9), limit (0), bar3d (true), rotateXLabels (0) 
 * @return
 */

EditableGrid.prototype.renderBarChart = function(divId, title, labelColumnIndexOrName, options)
{
	var self = this;

	// default options
	this.legend = null;
	this.bgColor = null; // transparent
	this.alpha = 0.9;
	this.limit = 0;
	this.bar3d = false;
	this.rotateXLabels = 0;

	// used to find the rowindex from the pointIndex for drawing horizontal reference lines
	var rowIndexByPoint = {};

	with (this) {

		if (EditableGrid_check_lib === null) EditableGrid_check_lib = checkChartLib();
		if (!EditableGrid_check_lib) return false;

		// override default options with the ones given
		if (options) for (var p in options) this[p] = options[p];

		// get useful values
		labelColumnIndexOrName = labelColumnIndexOrName || 0;
		var cLabel = getColumnIndex(labelColumnIndexOrName);
		var columnCount = getColumnCount();
		var rowCount = getRowCount() - (ignoreLastRow ? 1 : 0);
		if (limit > 0 && rowCount > limit) rowCount = limit;

		// base chart
		var type = options['type'] || 'column';
		var chart = {

				chart: {
					type: type,
					backgroundColor: bgColor,
					plotBackgroundColor: bgColor,
					height: null, // auto
					options3d: { 
						enabled: bar3d
					}
				},

				plotOptions: {
					column: {
						stacking: options['stacking'] || '',
						groupPadding: 0.1,
						pointPadding: 0.1,
						borderWidth: 0
					},
					bar: {
						stacking: options['stacking'] || '',
						groupPadding: 0.1,
						pointPadding: 0.1,
						borderWidth: 0
					},
					line: {
						step: 'center',
						lineWidth: 4,
						zIndex: 1000,
						marker: { enabled: false, states: { hover: { enabled: false } } }
					},
					scatter: {
						zIndex: 1000,
						marker: { symbol: 'diamond', lineColor: null, lineWidth: 4, states: { hover: { enabled: false } } }
					}
				},

				legend: {
					align: 'center',
					verticalAlign: (type == 'bar' ? 'top' : 'bottom'),
					margin: (type == 'bar' ? 40 : 12),
					floating: false
				},

				credits: {
					enabled: false
				},

				title: {
					text: title
				},

				tooltip: {
					pointFormatter: function() { return this.series.name + '<b>: ' + self.getFormattedValue(this.series.options.colIndex, this.y) + '</b>'; }
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
			if (skipRow(r)) continue;
			var label = getRowAttribute(r, "barlabel"); // if there is a barlabel attribute, use it and ignore labelColumn
			chart.xAxis.categories.push(label ? label : getValueAt(r, cLabel));
		}

		// one serie for each bar column
		chart.series = [];
		chart.yAxis = [];

		for (var c = 0; c < columnCount; c++) {
			if (!isColumnBar(c)) continue;

			// get/create axis for column unit
			var yAxisIndex = -1;
			var unit = getColumnUnit(c);
			for (var cy = 0; cy < chart.yAxis.length; cy++) if (chart.yAxis[cy].unit == unit) yAxisIndex = cy;
			if (yAxisIndex < 0) {

				// not found: create new axis with no title and unit
				yAxisIndex = chart.yAxis.length;
				chart.yAxis.push({ 
					unit: unit, 
					title: { text: "" },
					labels: { format: '{value} ' + (unit ? unit : '') },
					reversedStacks: (typeof options['reversedStacks'] == 'undefined' ? false : (!!options['reversedStacks']))
				});
			}

			// serie's name, stack and color
			var serie = { 
					name: getColumnLabel(c), 
					stack: getColumnStack(c),
					yAxis: yAxisIndex, 
					colIndex: c, // for pointFormatter
					// let Highcharts handle smart colors
					// color: hex2rgba(smartColorsBar[chart.series.length % smartColorsBar.length], alpha), 
					data: []
			};

			/*
			// test line serie combined with the bars or columns
			if (turn_this_column_into_a_line_serie) {
				serie.type = 'line';
				serie.dashStyle= "ShortDot";
				serie.color = 'gray';
			}
			 */

			// data: one value per row
			var maxValue = null;
			for (var r = 0; r < rowCount; r++) {
				if (skipRow(r)) continue;
				var value = getValueAt(r,c);
				rowIndexByPoint[serie.data.length] = r;
				serie.data.push(value);
			}

			chart.series.push(serie);
		}

		// auto height based on number of bars
		if (type == 'bar') {
			var stacks = {};
			chart.chart.height = 100; // margin
			for (var s = 0; s < chart.series.length; s++) {
				if (chart.series[s].stack in stacks) continue; // count height only once per stack
				stacks[chart.series[s].stack] = true;
				chart.chart.height += serie.data.length * 40;
			}
		}

		// render chart
		$('#' + divId).highcharts(chart, function (chart) {

			var widthColumn = null;
			if (chart.series[0]) $.each(chart.series[0].points, function(pointIndex, p) {

				// check if reference_columns attribute is set on rows, otherwise break loop here
				var rowIndex = rowIndexByPoint[pointIndex];
				var reference_columns = self.getRowAttribute(rowIndex, 'reference_columns');
				if (!reference_columns) return false;

				// update y axis max in case some reference value exceeds it
				$.each(reference_columns, function(i, reference) {
					var reference_value = self.getValueAt(rowIndex, self.getColumnIndex(reference.column));
					if (chart.yAxis[0].max < reference_value) chart.yAxis[0].setExtremes(null,reference_value);
				});

			});

			if (chart.series[0]) $.each(chart.series[0].points, function(pointIndex, p) {

				// check if reference_columns attribute is set on rows, otherwise break loop here
				var rowIndex = rowIndexByPoint[pointIndex];
				var reference_columns = self.getRowAttribute(rowIndex, 'reference_columns');
				if (!reference_columns) return false;

				// determine width of columns (only once)
				if (widthColumn === null) {
					var lastX = null;
					widthColumn = 0;
					$.each(chart.series[0].points, function(i, p) {
						if (lastX) widthColumn = p.plotX - lastX;
						lastX = p.plotX;
					});
					if (widthColumn == 0) widthColumn = chart.plotWidth;
				}

				// for each reference column
				$.each(reference_columns, function(i, reference) {

					// get reference value
					var reference_value = self.getValueAt(rowIndex, self.getColumnIndex(reference.column));

					// get line style
					var attributes = { 'stroke-width': 2, stroke: 'black', zIndex: 3 };
					if (reference.style) for (var attr in reference.style) attributes[attr] = reference.style[attr];

					// draw a line at Y = reference value
					var yPosition = chart.yAxis[0].toPixels(reference_value);
					var xPosition = chart.plotLeft + p.plotX - widthColumn / 2;
					chart.renderer.path(['M', xPosition, yPosition, 'L', xPosition + widthColumn, yPosition]).attr(attributes).add();

				});
			});
		});

		if (options.noDataMessage) {
			var container = $('#' + divId).highcharts();
			if (chart.series.length == 0) container.showLoading(options.noDataMessage);
		}
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
	options = options || {};
	options.stacking = 'normal';
	return this.renderBarChart(divId, title, labelColumnIndexOrName, options);
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
	this.pie3d = false;
	this.gradientFill = true;

	// override default options with the ones given
	if (options) for (var p in options) this[p] = options[p];

	with (this) {

		if (EditableGrid_check_lib === null) EditableGrid_check_lib = checkChartLib();
		if (!EditableGrid_check_lib) return false;

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
							format: cValue == cLabel ? '<b>{point.name}</b>' : '<b>{point.name}</b><br/>{point.formattedValue}'
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
				if (skipRow(r)) continue;
				var rowValue = getValueAt(r,cValue);
				if (rowValue in distinctValues) distinctValues[rowValue]++;
				else distinctValues[rowValue] = 1;
			}

			for (var value in distinctValues) {
				var occurences = distinctValues[value];
				serie.data.push({ 
					y : occurences, 
					name: value,
					formattedValue: value
					// let Highcharts handle smart colors
					// color: hex2rgba(smartColorsBar[serie.data.length % smartColorsPie.length], alpha)
				});
			}
			chart.series.push(serie);
		}
		else {

			for (var r = 0; r < rowCount; r++) {
				if (skipRow(r)) continue;
				var value = getValueAt(r,cValue);
				var label = getRowAttribute(r, "barlabel"); // if there is a barlabel attribute, use it and ignore labelColumn
				if (value !== null && !isNaN(value)) serie.data.push({ 
					y : value, 
					name: (label ? label : getValueAt(r,cLabel)),
					formattedValue: this.getFormattedValue(cValue, value)
					// let Highcharts handle smart colors
					// color: hex2rgba(smartColorsBar[serie.data.length % smartColorsPie.length], alpha)
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
