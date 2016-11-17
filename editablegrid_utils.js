EditableGrid.prototype._convertOptions = function(optionValues)
{
	// option values should be an *ordered* array of value/label pairs, but to stay compatible with existing enum providers 
	if (optionValues !== null && (!(optionValues instanceof Array)) && typeof optionValues == 'object') {
		var _converted = []; 
		for (var value in optionValues) {
			if (typeof optionValues[value] == 'object') _converted.push({ label : value, values: this._convertOptions(optionValues[value])}); // group
			else _converted.push({ value : value, label: optionValues[value]});
		}
		optionValues = _converted;
	}

	return optionValues; 
};

EditableGrid.prototype.setCookie = function(c_name, value, exdays)
{
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
};

EditableGrid.prototype.getCookie = function(c_name)
{
	var _cookies = document.cookie.split(";");
	for (var i = 0; i < _cookies.length; i++) {
		var x = _cookies[i].substr(0, _cookies[i].indexOf("="));
		var y = _cookies[i].substr(_cookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g, "");
		if (x == c_name) return unescape(y);
	}

	return null;
};

EditableGrid.prototype.has_local_storage = function() 
{
	try { return 'localStorage' in window && window['localStorage'] !== null; } catch(e) { return false; }
};

EditableGrid.prototype._localset = function(key, value) 
{
	if (this.has_local_storage()) localStorage.setItem(key, value);
	else this.setCookie(key, value, null);
};

EditableGrid.prototype._localunset = function(key) 
{
	if (this.has_local_storage()) localStorage.removeItem(key);
	else this.setCookie(key, null, null);
};

EditableGrid.prototype._localget = function(key) 
{
	if (this.has_local_storage()) return localStorage.getItem(key);
	return this.getCookie(key);
};

EditableGrid.prototype._localisset = function(key) 
{
	if (this.has_local_storage()) return localStorage.getItem(key) !== null && localStorage.getItem(key) != 'undefined';
	return this.getCookie(key) !== null;
};

EditableGrid.prototype.localset = function(key, value) 
{
	if (this.enableStore) return this._localset(this.name + '_' + key, value);
};

EditableGrid.prototype.localunset = function(key) 
{
	if (this.enableStore) return this._localunset(this.name + '_' + key, value);
};

EditableGrid.prototype.localget = function(key) 
{
	return this.enableStore ? this._localget(this.name + '_' + key) : null;
};

EditableGrid.prototype.localisset = function(key) 
{
	return this.enableStore ? this._localget(this.name + '_' + key) !== null : false;
};

EditableGrid.prototype.unsort = function(a,b) 
{
	// at index 2 we have the originalIndex
	aa = isNaN(a[2]) ? 0 : parseFloat(a[2]);
	bb = isNaN(b[2]) ? 0 : parseFloat(b[2]);
	return aa-bb;
};

/**
 * returns a sort function which further sorts according to the original index
 * this ensures the sort will always be stable
 * used to sort a tree where only the first level is actually sorted
 */
EditableGrid.prototype.sort_stable = function(sort_function, descending) 
{
	return function (a, b) {
		var sort = descending ? sort_function(b, a) : sort_function(a, b);
		if (sort != 0) return sort;
		return EditableGrid.prototype.unsort(a, b);
	};
};

EditableGrid.prototype.sort_numeric = function(a,b) 
{
	aa = isNaN(parseFloat(a[0])) ? 0 : parseFloat(a[0]);
	bb = isNaN(parseFloat(b[0])) ? 0 : parseFloat(b[0]);
	return aa-bb;
};

EditableGrid.prototype.sort_boolean = function(a,b) 
{
	aa = !a[0] || a[0] == "false" ? 0 : 1;
	bb = !b[0] || b[0] == "false" ? 0 : 1;
	return aa-bb;
};

EditableGrid.prototype.sort_alpha = function(a,b) 
{
	if (!a[0] && !b[0]) return 0;
	if (a[0] && !b[0]) return 1;
	if (!a[0] && b[0]) return -1;
	if (a[0].toLowerCase()==b[0].toLowerCase()) return 0;
	return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
};

EditableGrid.prototype.sort_date = function(a,b) 
{
	date = EditableGrid.prototype.checkDate(a[0]);
	aa = typeof date == "object" ? date.sortDate : 0;
	date = EditableGrid.prototype.checkDate(b[0]);
	bb = typeof date == "object" ? date.sortDate : 0;
	return aa-bb;
};

/**
 * Returns computed style property for element
 * @private
 */
EditableGrid.prototype.getStyle = function(element, stylePropCamelStyle, stylePropCSSStyle)
{
	stylePropCSSStyle = stylePropCSSStyle || stylePropCamelStyle;
	if (element.currentStyle) return element.currentStyle[stylePropCamelStyle];
	else if (window.getComputedStyle) return document.defaultView.getComputedStyle(element,null).getPropertyValue(stylePropCSSStyle);
	return element.style[stylePropCamelStyle];
};

/**
 * Returns true if the element has a static positioning
 * @private
 */
EditableGrid.prototype.isStatic = function (element) 
{
	var position = this.getStyle(element, 'position');
	return (!position || position == "static");
};

EditableGrid.prototype.verticalAlign = function (element) 
{
	return this.getStyle(element, "verticalAlign", "vertical-align");
};

EditableGrid.prototype.paddingLeft = function (element) 
{
	var padding = parseInt(this.getStyle(element, "paddingLeft", "padding-left"));
	return isNaN(padding) ? 0 : Math.max(0, padding);
};

EditableGrid.prototype.paddingRight = function (element) 
{
	var padding = parseInt(this.getStyle(element, "paddingRight", "padding-right"));
	return isNaN(padding) ? 0 : Math.max(0, padding);
};

EditableGrid.prototype.paddingTop = function (element) 
{
	var padding = parseInt(this.getStyle(element, "paddingTop", "padding-top"));
	return isNaN(padding) ? 0 : Math.max(0, padding);
};

EditableGrid.prototype.paddingBottom = function (element) 
{
	var padding = parseInt(this.getStyle(element, "paddingBottom", "padding-bottom"));
	return isNaN(padding) ? 0 : Math.max(0, padding);
};

EditableGrid.prototype.borderLeft = function (element) 
{
	var border_l = parseInt(this.getStyle(element, "borderRightWidth", "border-right-width"));
	var border_r = parseInt(this.getStyle(element, "borderLeftWidth", "border-left-width"));
	border_l = isNaN(border_l) ? 0 : border_l;
	border_r = isNaN(border_r) ? 0 : border_r;
	return Math.max(border_l, border_r);
};

EditableGrid.prototype.borderRight = function (element) 
{
	return this.borderLeft(element);
};

EditableGrid.prototype.borderTop = function (element) 
{
	var border_t = parseInt(this.getStyle(element, "borderTopWidth", "border-top-width"));
	var border_b = parseInt(this.getStyle(element, "borderBottomWidth", "border-bottom-width"));
	border_t = isNaN(border_t) ? 0 : border_t;
	border_b = isNaN(border_b) ? 0 : border_b;
	return Math.max(border_t, border_b);
};

EditableGrid.prototype.borderBottom = function (element) 
{
	return this.borderTop(element);
};

/**
 * Returns auto width for editor
 * @private
 */
EditableGrid.prototype.autoWidth = function (element) 
{
	return element.offsetWidth - this.paddingLeft(element) - this.paddingRight(element) - this.borderLeft(element) - this.borderRight(element);
};

/**
 * Returns auto height for editor
 * @private
 */
EditableGrid.prototype.autoHeight = function (element) 
{
	return element.offsetHeight - this.paddingTop(element) - this.paddingBottom(element) - this.borderTop(element) - this.borderBottom(element);
};

/**
 * Detects the directory when the js sources can be found
 * @private
 */
EditableGrid.prototype.detectDir = function() 
{
	var base = location.href;
	var e = document.getElementsByTagName('base');
	for (var i=0; i<e.length; i++) if(e[i].href) base = e[i].href;

	e = document.getElementsByTagName('script');
	for (var i=0; i<e.length; i++) {
		if (e[i].src && /(^|\/)editablegrid[^\/]*\.js([?#].*)?$/i.test(e[i].src)) {
			var src = new URI(e[i].src);
			var srcAbs = src.toAbsolute(base);
			srcAbs.path = srcAbs.path.replace(/[^\/]+$/, ''); // remove filename
			srcAbs.path = srcAbs.path.replace(/\/$/, ''); // remove trailing slash
			delete srcAbs.query;
			delete srcAbs.fragment;
			return srcAbs.toString();
		}
	}

	return false;
};

/**
 * Detect is 2 values are exactly the same (type and value). Numeric NaN are considered the same.
 * @param v1
 * @param v2
 * @return boolean
 */
EditableGrid.prototype.isSame = function(v1, v2) 
{ 
	if (v1 === v2) return true;
	if (typeof v1 == 'number' && isNaN(v1) && typeof v2 == 'number' && isNaN(v2)) return true;
	if (v1 === '' && v2 === null) return true;
	if (v2 === '' && v1 === null) return true;
	return false;
};

/**
 * class name manipulation
 * @private
 */
EditableGrid.prototype.strip = function(str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); };
EditableGrid.prototype.hasClassName = function(element, className) { return (element.className.length > 0 && (element.className == className || new RegExp("(^|\\s)" + className.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "(\\s|$)").test(element.className))); };
EditableGrid.prototype.addClassName = function(element, className) { if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className; };
EditableGrid.prototype.removeClassName = function(element, className) { element.className = this.strip(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ')); };

/**
 * Useful string methods 
 * @private
 */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")); };
String.prototype.contains = function(str) { return (this.match(str)==str); };
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str); };
String.prototype.endsWith = function(str) { return (this.match(str+"$")==str); };

//Accepted formats: (for EU just switch month and day)

//mm-dd-yyyy
//mm/dd/yyyy
//mm.dd.yyyy
//mm dd yyyy
//mmm dd yyyy
//mmddyyyy

//m-d-yyyy
//m/d/yyyy
//m.d.yyyy,
//m d yyyy
//mmm d yyyy

////m-d-yy
////m/d/yy
////m.d.yy
////m d yy,
////mmm d yy (yy is 20yy) 

/**
 * Checks validity of a date string 
 * @private
 */
EditableGrid.prototype.checkDate = function(strDate, strDatestyle) 
{
	strDatestyle = strDatestyle || this.dateFormat;
	strDatestyle = strDatestyle || "EU";

	var strDateArray;
	var strDay;
	var strMonth;
	var strYear;
	var intday;
	var intMonth;
	var intYear;
	var booFound = false;
	var strSeparatorArray = new Array("-"," ","/",".");
	var intElementNr;
	var err = 0;

	var strMonthArray = this.shortMonthNames;
	strMonthArray = strMonthArray || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	if (!strDate || strDate.length < 1) return 0;

	for (intElementNr = 0; intElementNr < strSeparatorArray.length; intElementNr++) {
		if (strDate.indexOf(strSeparatorArray[intElementNr]) != -1) {
			strDateArray = strDate.split(strSeparatorArray[intElementNr]);
			if (strDateArray.length != 3) return 1;
			else {
				strDay = strDateArray[0];
				strMonth = strDateArray[1];
				strYear = strDateArray[2];
			}
			booFound = true;
		}
	}

	if (booFound == false) {
		if (strDate.length <= 5) return 1;
		strDay = strDate.substr(0, 2);
		strMonth = strDate.substr(2, 2);
		strYear = strDate.substr(4);
	}

	// if (strYear.length == 2) strYear = '20' + strYear;

	// US style
	if (strDatestyle == "US") {
		strTemp = strDay;
		strDay = strMonth;
		strMonth = strTemp;
	}

	// get and check day
	intday = parseInt(strDay, 10);
	if (isNaN(intday)) return 2;

	// get and check month
	intMonth = parseInt(strMonth, 10);
	if (isNaN(intMonth)) {
		for (i = 0;i<12;i++) {
			if (strMonth.toUpperCase() == strMonthArray[i].toUpperCase()) {
				intMonth = i+1;
				strMonth = strMonthArray[i];
				i = 12;
			}
		}
		if (isNaN(intMonth)) return 3;
	}
	if (intMonth>12 || intMonth<1) return 5;

	// get and check year
	intYear = parseInt(strYear, 10);
	if (isNaN(intYear)) return 4;
	if (intYear < 70) { intYear = 2000 + intYear; strYear = '' + intYear; } // 70 become 1970, 69 becomes 1969, as with PHP's date_parse_from_format
	if (intYear < 100) { intYear = 1900 + intYear; strYear = '' + intYear; }
	if (intYear < 1900 || intYear > 2100) return 11;

	// check day in month
	if ((intMonth == 1 || intMonth == 3 || intMonth == 5 || intMonth == 7 || intMonth == 8 || intMonth == 10 || intMonth == 12) && (intday > 31 || intday < 1)) return 6;
	if ((intMonth == 4 || intMonth == 6 || intMonth == 9 || intMonth == 11) && (intday > 30 || intday < 1)) return 7;
	if (intMonth == 2) {
		if (intday < 1) return 8;
		if (LeapYear(intYear) == true) { if (intday > 29) return 9; }
		else if (intday > 28) return 10;
	}

	// return formatted date
	return { 
		formattedDate: (strDatestyle == "US" ? strMonthArray[intMonth-1] + " " + intday+" " + strYear : intday + " " + strMonthArray[intMonth-1]/*.toLowerCase()*/ + " " + strYear),
		sortDate: Date.parse(intMonth + "/" + intday + "/" + intYear),
		dbDate: intYear + "-" + intMonth + "-" + intday 
	};
};

function LeapYear(intYear) 
{
	if (intYear % 100 == 0) { if (intYear % 400 == 0) return true; }
	else if ((intYear % 4) == 0) return true;
	return false;
}

//See RFC3986
URI = function(uri) 
{ 
	this.scheme = null;
	this.authority = null;
	this.path = '';
	this.query = null;
	this.fragment = null;

	this.parse = function(uri) {
		var m = uri.match(/^(([A-Za-z][0-9A-Za-z+.-]*)(:))?((\/\/)([^\/?#]*))?([^?#]*)((\?)([^#]*))?((#)(.*))?/);
		this.scheme = m[3] ? m[2] : null;
		this.authority = m[5] ? m[6] : null;
		this.path = m[7];
		this.query = m[9] ? m[10] : null;
		this.fragment = m[12] ? m[13] : null;
		return this;
	};

	this.toString = function() {
		var result = '';
		if(this.scheme != null) result = result + this.scheme + ':';
		if(this.authority != null) result = result + '//' + this.authority;
		if(this.path != null) result = result + this.path;
		if(this.query != null) result = result + '?' + this.query;
		if(this.fragment != null) result = result + '#' + this.fragment;
		return result;
	};

	this.toAbsolute = function(base) {
		var base = new URI(base);
		var r = this;
		var t = new URI;

		if(base.scheme == null) return false;

		if(r.scheme != null && r.scheme.toLowerCase() == base.scheme.toLowerCase()) {
			r.scheme = null;
		}

		if(r.scheme != null) {
			t.scheme = r.scheme;
			t.authority = r.authority;
			t.path = removeDotSegments(r.path);
			t.query = r.query;
		} else {
			if(r.authority != null) {
				t.authority = r.authority;
				t.path = removeDotSegments(r.path);
				t.query = r.query;
			} else {
				if(r.path == '') {
					t.path = base.path;
					if(r.query != null) {
						t.query = r.query;
					} else {
						t.query = base.query;
					}
				} else {
					if(r.path.substr(0,1) == '/') {
						t.path = removeDotSegments(r.path);
					} else {
						if(base.authority != null && base.path == '') {
							t.path = '/'+r.path;
						} else {
							t.path = base.path.replace(/[^\/]+$/,'')+r.path;
						}
						t.path = removeDotSegments(t.path);
					}
					t.query = r.query;
				}
				t.authority = base.authority;
			}
			t.scheme = base.scheme;
		}
		t.fragment = r.fragment;

		return t;
	};

	function removeDotSegments(path) {
		var out = '';
		while(path) {
			if(path.substr(0,3)=='../' || path.substr(0,2)=='./') {
				path = path.replace(/^\.+/,'').substr(1);
			} else if(path.substr(0,3)=='/./' || path=='/.') {
				path = '/'+path.substr(3);
			} else if(path.substr(0,4)=='/../' || path=='/..') {
				path = '/'+path.substr(4);
				out = out.replace(/\/?[^\/]*$/, '');
			} else if(path=='.' || path=='..') {
				path = '';
			} else {
				var rm = path.match(/^\/?[^\/]*/)[0];
				path = path.substr(rm.length);
				out = out + rm;
			}
		}
		return out;
	}

	if(uri) {
		this.parse(uri);
	}
};

function get_html_translation_table (table, quote_style) {
	// http://kevin.vanzonneveld.net
	// +   original by: Philip Peterson
	// +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: noname
	// +   bugfixed by: Alex
	// +   bugfixed by: Marco
	// +   bugfixed by: madipta
	// +   improved by: KELAN
	// +   improved by: Brett Zamir (http://brett-zamir.me)
	// +   bugfixed by: Brett Zamir (http://brett-zamir.me)
	// +      input by: Frank Forte
	// +   bugfixed by: T.Wild
	// +      input by: Ratheous
	// %          note: It has been decided that we're not going to add global
	// %          note: dependencies to php.js, meaning the constants are not
	// %          note: real constants, but strings instead. Integers are also supported if someone
	// %          note: chooses to create the constants themselves.
	// *     example 1: get_html_translation_table('HTML_SPECIALCHARS');
	// *     returns 1: {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}

	var entities = {}, hash_map = {}, decimal = 0, symbol = '';
	var constMappingTable = {}, constMappingQuoteStyle = {};
	var useTable = {}, useQuoteStyle = {};

	// Translate arguments
	constMappingTable[0]      = 'HTML_SPECIALCHARS';
	constMappingTable[1]      = 'HTML_ENTITIES';
	constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
	constMappingQuoteStyle[2] = 'ENT_COMPAT';
	constMappingQuoteStyle[3] = 'ENT_QUOTES';

	useTable       = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
	useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() : 'ENT_COMPAT';

	if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
		throw new Error("Table: "+useTable+' not supported');
		// return false;
	}

	if (useTable === 'HTML_ENTITIES') {
		entities['160'] = '&nbsp;';
		entities['161'] = '&iexcl;';
		entities['162'] = '&cent;';
		entities['163'] = '&pound;';
		entities['164'] = '&curren;';
		entities['165'] = '&yen;';
		entities['166'] = '&brvbar;';
		entities['167'] = '&sect;';
		entities['168'] = '&uml;';
		entities['169'] = '&copy;';
		entities['170'] = '&ordf;';
		entities['171'] = '&laquo;';
		entities['172'] = '&not;';
		entities['173'] = '&shy;';
		entities['174'] = '&reg;';
		entities['175'] = '&macr;';
		entities['176'] = '&deg;';
		entities['177'] = '&plusmn;';
		entities['178'] = '&sup2;';
		entities['179'] = '&sup3;';
		entities['180'] = '&acute;';
		entities['181'] = '&micro;';
		entities['182'] = '&para;';
		entities['183'] = '&middot;';
		entities['184'] = '&cedil;';
		entities['185'] = '&sup1;';
		entities['186'] = '&ordm;';
		entities['187'] = '&raquo;';
		entities['188'] = '&frac14;';
		entities['189'] = '&frac12;';
		entities['190'] = '&frac34;';
		entities['191'] = '&iquest;';
		entities['192'] = '&Agrave;';
		entities['193'] = '&Aacute;';
		entities['194'] = '&Acirc;';
		entities['195'] = '&Atilde;';
		entities['196'] = '&Auml;';
		entities['197'] = '&Aring;';
		entities['198'] = '&AElig;';
		entities['199'] = '&Ccedil;';
		entities['200'] = '&Egrave;';
		entities['201'] = '&Eacute;';
		entities['202'] = '&Ecirc;';
		entities['203'] = '&Euml;';
		entities['204'] = '&Igrave;';
		entities['205'] = '&Iacute;';
		entities['206'] = '&Icirc;';
		entities['207'] = '&Iuml;';
		entities['208'] = '&ETH;';
		entities['209'] = '&Ntilde;';
		entities['210'] = '&Ograve;';
		entities['211'] = '&Oacute;';
		entities['212'] = '&Ocirc;';
		entities['213'] = '&Otilde;';
		entities['214'] = '&Ouml;';
		entities['215'] = '&times;';
		entities['216'] = '&Oslash;';
		entities['217'] = '&Ugrave;';
		entities['218'] = '&Uacute;';
		entities['219'] = '&Ucirc;';
		entities['220'] = '&Uuml;';
		entities['221'] = '&Yacute;';
		entities['222'] = '&THORN;';
		entities['223'] = '&szlig;';
		entities['224'] = '&agrave;';
		entities['225'] = '&aacute;';
		entities['226'] = '&acirc;';
		entities['227'] = '&atilde;';
		entities['228'] = '&auml;';
		entities['229'] = '&aring;';
		entities['230'] = '&aelig;';
		entities['231'] = '&ccedil;';
		entities['232'] = '&egrave;';
		entities['233'] = '&eacute;';
		entities['234'] = '&ecirc;';
		entities['235'] = '&euml;';
		entities['236'] = '&igrave;';
		entities['237'] = '&iacute;';
		entities['238'] = '&icirc;';
		entities['239'] = '&iuml;';
		entities['240'] = '&eth;';
		entities['241'] = '&ntilde;';
		entities['242'] = '&ograve;';
		entities['243'] = '&oacute;';
		entities['244'] = '&ocirc;';
		entities['245'] = '&otilde;';
		entities['246'] = '&ouml;';
		entities['247'] = '&divide;';
		entities['248'] = '&oslash;';
		entities['249'] = '&ugrave;';
		entities['250'] = '&uacute;';
		entities['251'] = '&ucirc;';
		entities['252'] = '&uuml;';
		entities['253'] = '&yacute;';
		entities['254'] = '&thorn;';
		entities['255'] = '&yuml;';
	}

	if (useQuoteStyle !== 'ENT_NOQUOTES') {
		entities['34'] = '&quot;';
	}
	if (useQuoteStyle === 'ENT_QUOTES') {
		entities['39'] = '&#39;';
	}
	entities['60'] = '&lt;';
	entities['62'] = '&gt;';


	// ascii decimals to real symbols
	for (decimal in entities) {
		symbol = String.fromCharCode(decimal);
		hash_map[symbol] = entities[decimal];
	}

	return hash_map;
}

function html_entity_decode(string, quote_style)
{
	var hash_map = {}, symbol = '', tmp_str = '';
	tmp_str = string.toString();
	if (false === (hash_map = get_html_translation_table('HTML_ENTITIES', quote_style))) return false;
	hash_map["'"] = '&#039;';
	for (symbol in hash_map) tmp_str = tmp_str.split(hash_map[symbol]).join(symbol);
	return tmp_str;
}

function htmlentities(string, quote_style) 
{
	var hash_map = {}, symbol = '', tmp_str = '';
	tmp_str = string.toString();
	if (false === (hash_map = get_html_translation_table('HTML_ENTITIES', quote_style))) return false;
	tmp_str = tmp_str.split('&').join('&amp;'); // replace & first, otherwise & in htlm codes will be replaced too!
	hash_map["'"] = '&#039;';
	for (symbol in hash_map) tmp_str = tmp_str.split(symbol).join(hash_map[symbol]);
	return tmp_str;
}

function htmlspecialchars(string, quote_style) 
{
	var hash_map = {}, symbol = '', tmp_str = '';
	tmp_str = string.toString();
	if (false === (hash_map = get_html_translation_table('HTML_SPECIALCHARS', quote_style))) return false;
	tmp_str = tmp_str.split('&').join('&amp;'); // replace & first, otherwise & in htlm codes will be replaced too!
	for (symbol in hash_map) tmp_str = tmp_str.split(symbol).join(hash_map[symbol]);
	return tmp_str;
}

function number_format (number, decimals, dec_point, thousands_sep) {
	// http://kevin.vanzonneveld.net
	// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +     bugfix by: Michael White (http://getsprink.com)
	// +     bugfix by: Benjamin Lupton
	// +     bugfix by: Allan Jensen (http://www.winternet.no)
	// +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// +     bugfix by: Howard Yeend
	// +    revised by: Luke Smith (http://lucassmith.name)
	// +     bugfix by: Diogo Resende
	// +     bugfix by: Rival
	// +      input by: Kheang Hok Chin (http://www.distantia.ca/)
	// +   improved by: davook
	// +   improved by: Brett Zamir (http://brett-zamir.me)
	// +      input by: Jay Klehr
	// +   improved by: Brett Zamir (http://brett-zamir.me)
	// +      input by: Amir Habibi (http://www.residence-mixte.com/)
	// +     bugfix by: Brett Zamir (http://brett-zamir.me)
	// +   improved by: Theriault
	// +      input by: Amirouche
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// *     example 1: number_format(1234.56);
	// *     returns 1: '1,235'
	// *     example 2: number_format(1234.56, 2, ',', ' ');
	// *     returns 2: '1 234,56'
	// *     example 3: number_format(1234.5678, 2, '.', '');
	// *     returns 3: '1234.57'
	// *     example 4: number_format(67, 2, ',', '.');
	// *     returns 4: '67,00'
	// *     example 5: number_format(1000);
	// *     returns 5: '1,000'
	// *     example 6: number_format(67.311, 2);
	// *     returns 6: '67.31'
	// *     example 7: number_format(1000.55, 1);
	// *     returns 7: '1,000.6'
	// *     example 8: number_format(67000, 5, ',', '.');
	// *     returns 8: '67.000,00000'
	// *     example 9: number_format(0.9, 0);
	// *     returns 9: '1'
	// *    example 10: number_format('1.20', 2);
	// *    returns 10: '1.20'
	// *    example 11: number_format('1.20', 4);
	// *    returns 11: '1.2000'
	// *    example 12: number_format('1.2000', 3);
	// *    returns 12: '1.200'
	// *    example 13: number_format('1 000,50', 2, '.', ' ');
	// *    returns 13: '100 050.00'
	// Strip all characters but numerical ones.
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : /*Math.abs(*/decimals/*)*/,
					sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
							dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
									s = '',
									toFixedFix = function (n, prec) {
								var k = Math.pow(10, prec);
								return '' + Math.round(n * k) / k;
							};
							// Fix for IE parseFloat(0.55).toFixed(0) = 0;
							s = (prec < 0 ? ('' + n) : (prec ? toFixedFix(n, prec) : '' + Math.round(n))).split('.');
							if (s[0].length > 3) {
								s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
							}
							if ((s[1] || '').length < prec) {
								s[1] = s[1] || '';
								s[1] += new Array(prec - s[1].length + 1).join('0');
							}
							return s.join(dec);
}

