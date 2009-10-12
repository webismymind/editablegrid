
/**
 * Abstract cell validator
 * Base class for all cell validators
 */

function CellValidator(config) 
{
	// default properties
    var props = { isValid: null };

    // override default properties with the ones given
    for (var p in props) if (typeof config != 'undefined' && typeof config[p] != 'undefined') this[p] = config[p];
}

CellValidator.prototype.isValid = function(value) 
{
	return true;
}

/**
 * Number cell validator
 * Class to validate a numeric cell
 */

NumberCellValidator.prototype = new CellValidator;
function NumberCellValidator(type) { this.type = type; }

NumberCellValidator.prototype.isValid = function(value) 
{
	// check that it is a valid number
	if (isNaN(value)) return false;
	
	// for integers check that it's not a float
	if (this.type == "integer" && value != "" && parseInt(value) != parseFloat(value)) return false;
	
	// the integer or double is valid
	return true;
}

/**
 * Email cell validator
 * Class to validate a cell containing an email
 */

EmailCellValidator.prototype = new CellValidator;
function EmailCellValidator() {}

EmailCellValidator.prototype.isValid = function(value) 
{
	return value == "" || /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(value);
}