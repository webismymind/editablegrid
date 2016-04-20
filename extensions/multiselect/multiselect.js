/**
 * Multiselect cell editor
 * 
 * Drop down list based on checkboxes.
 * Uses the jQuery plugin ui.dropdownchecklist
 * 
 * @constructor Accepts an option object containing the following properties: 
 * - closeText: string
 * - autoOpen: boolean
 * 
 * @class Drop down list based on checkboxes.
 * @author Webismymind 
 */

function MultiselectCellEditor(config)
{ 
	// default options
	this.closeText = "Close";
	this.autoOpen = true;
	this.maxHeight = 215; 
	this.maxWidth = 300;
	this.titleIfEmpty = "Information";
	this.messageIfEmpty = "There are no possible values to choose from!";

	// erase defaults with given options
	this.init(config); 
};

//inherits SelectCellEditor functionalities
MultiselectCellEditor.prototype = new SelectCellEditor();

//redefine isValueSelected
MultiselectCellEditor.prototype.isValueSelected = function(htmlInput, optionValue, value) { $(htmlInput).attr('multiple', true); return $.inArray(''+optionValue, this.valueArray) > -1; };

//redefine getEditor
MultiselectCellEditor.prototype.getEditor = function(element, value)
{
	// keep array of values
	this.valueArray = value ? value.split(",") : [];

	// call base method
	return SelectCellEditor.prototype.getEditor.call(this, element, value);
};

//redefine displayEditor to setup drop down checkboxes
MultiselectCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// check that we have values to choose from
	var optionValues = this.column.getOptionValuesForEdit(element.rowIndex);
	if (!optionValues || optionValues.length == 0) {

		$("<div class='jalert'>").html("<center>" + this.messageIfEmpty + "<center>").css('padding-top', '10px').dialog({
			width: 350,
			modal: !jQuery.browser.msie,
			autoOpen : true,
			buttons: { "OK": function() { $(this).dialog("close"); } },
			title: this.titleIfEmpty 
		});

		return true;
	}

	// call base method (not the one from SelectCellEditor since it would use select2)
	CellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// setup setup drop down checkboxes
	$(htmlInput).dropdownchecklist({
		forceMultiple: true,
		maxDropHeight: this.maxHeight + 'px',
		width: Math.min(this.maxWidth, parseInt($(htmlInput).css('width'))) + 'px',
		explicitClose: this.closeText,
		onComplete: function(selector) {

			// when new values have been selected we apply them
			var values = "";
			for (i=0; i < selector.options.length; i++) {
				if (selector.options[i].selected && (selector.options[i].value != "")) {
					if (values != "") values += ",";
					values += selector.options[i].value;
				}
			}

			htmlInput.celleditor.applyEditing(htmlInput.element, values);
		}
	});

	// cancel input events
	htmlInput.onchange = null;
	htmlInput.onblur = null;

	// correctly position created span
	$(htmlInput).siblings('span').css({
		'position': 'absolute', 
		'left': $(htmlInput).css('left'), 
		'top': $(htmlInput).css('top')
	});

	// so that the dropdown does not cause a scrollbar in active accordion content
	$('div.ui-accordion-content-active').css('overflow', 'visible');

	if (this.autoOpen) {
		htmlInput_multiselect_ = htmlInput;
		setTimeout("$(htmlInput_multiselect_).siblings('span').trigger('click');", 0);
	}
};

MultiselectCellEditor.prototype.cancelEditing = function(element) 
{
	// call base method (not the one from SelectCellEditor since it would use select2)
	CellEditor.prototype.cancelEditing.call(this, element);
};

function MultiselectCellRenderer(config)
{ 
	// default options
	this.noneText = "(none)";
	this.noneColor = "ddd";
	this.minWidth = 100;
	this.maxWidth = 150;

	// erase defaults with given options
	this.init(config); 
}

//inherits EnumCellRenderer functionalities
MultiselectCellRenderer.prototype = new EnumCellRenderer();

MultiselectCellRenderer.prototype.render = function(element, value)
{
	EnumCellRenderer.prototype.render.call(this, element, value);
	if ($(element).html() == '') $(element).html(this.noneText.replace(' ', '&nbsp;')).css('color', '#' + this.noneColor);
	else $(element).css('color', '');
	$(element).css('min-width', this.minWidth + 'px').css('max-width', this.maxWidth + 'px');
};

MultiselectCellRenderer.prototype.getLabel = function(rowIndex, value)
{
	var label = "";
	var values = value ? value.split(",") : [];
	for (var i = 0; i < values.length; i++) {
		if (label != "") label += ", ";
		label += EnumCellRenderer.prototype.getLabel.call(this, rowIndex, values[i]);
	}
	return label;
};

MultiselectCellRenderer.prototype.getDisplayValue = function(rowIndex, value) 
{
	// if the column has enumerated values, sort and filter on the value label
	return this.getLabel(rowIndex, value);
};