/**
 * Abstract cell validator
 * @constructor
 * @class Base class for all cell validators
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
};

/**
 * Number cell validator
 * @constructor
 * @class Class to validate a numeric cell
 */

function NumberCellValidator(type) { this.type = type; }
NumberCellValidator.prototype = new CellValidator;
NumberCellValidator.prototype.isValid = function(value) 
{
	// check that it is a valid number
	if (isNaN(value)) return false;
	
	// for integers check that it's not a float
	if (this.type == "integer" && value != "" && parseInt(value) != parseFloat(value)) return false;
	
	// the integer or double is valid
	return true;
};

/**
 * Email cell validator
 * @constructor
 * @class Class to validate a cell containing an email
 */

function EmailCellValidator() {}
EmailCellValidator.prototype = new CellValidator;
EmailCellValidator.prototype.isValid = function(value) { return value == "" || /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(value); };

/**
 * Website cell validator
 * @constructor
 * @class Class to validate a cell containing a website
 */

function WebsiteCellValidator() {}
WebsiteCellValidator.prototype = new CellValidator;
WebsiteCellValidator.prototype.isValid = function(value) { return value == "" || (value.indexOf(".") > 0 && value.indexOf(".") < (value.length - 2)); };

/**
 * Date cell validator
 * @constructor
 * @augments CellValidator
 * @class Class to validate a cell containing a date
 */

function DateCellValidator(grid) { this.grid = grid; }
DateCellValidator.prototype = new CellValidator;

DateCellValidator.prototype.isValid = function(value) 
{
	return value == "" || typeof this.grid.checkDate(value) == "object";
};