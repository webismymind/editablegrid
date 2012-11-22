/**
 * Multiselect cell editor
 * 
 * Drop down list based on checkboxes.
 * Uses the jQuery plugin ui.dropdownchecklist
 * 
 * @class Drop down list based on checkboxes.
 * @author Webismymind 
 */

function MultiselectCellEditor(config) { this.init(config); };

// inherits SelectCellEditor functionalities
MultiselectCellEditor.prototype = new SelectCellEditor();

// redefine isValueSelected
MultiselectCellEditor.prototype.isValueSelected = function(htmlInput, optionValue, value) { $(htmlInput).attr('multiple', true); return $.inArray(optionValue, this.valueArray) > -1; };

// redefine getEditor
MultiselectCellEditor.prototype.getEditor = function(element, value)
{
	// keep array of values
	this.valueArray = value.split(",");
	
	// call base method
	return SelectCellEditor.prototype.getEditor.call(this, element, value);
};

// redefine displayEditor to setup drop down checkboxes
MultiselectCellEditor.prototype.displayEditor = function(element, htmlInput) 
{
	// call base method
	SelectCellEditor.prototype.displayEditor.call(this, element, htmlInput);

	// setup setup drop down checkboxes
	$(htmlInput).dropdownchecklist({
		forceMultiple: true,
		width: $(htmlInput).css('width'),
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
};

function MultiselectCellRenderer(config) { this.init(config); }

// inherits EnumCellRenderer functionalities
MultiselectCellRenderer.prototype = new EnumCellRenderer();

MultiselectCellRenderer.prototype.getLabel = function(rowIndex, value)
{
	var label = "";
	var values = value.split(",");
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