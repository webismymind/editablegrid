/*
 * EditableGrid_utils.js
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

EditableGrid.prototype.unsort = function(a,b) 
{
	aa = isNaN(a[3]) ? 0 : parseFloat(a[3]);
	bb = isNaN(b[3]) ? 0 : parseFloat(b[3]);
	return aa-bb;
};

EditableGrid.prototype.sort_numeric = function(a,b) 
{
	aa = isNaN(a[0]) ? 0 : parseFloat(a[0]);
	bb = isNaN(b[0]) ? 0 : parseFloat(b[0]);
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
	if (a[0]==b[0]) return 0;
	if (a[0]<b[0]) return -1;
	return 1;
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

/**
 * Returns auto width for editor
 * @private
 */
EditableGrid.prototype.autoWidth = function (element) 
{
	var paddingLeft = parseInt(this.getStyle(element, "paddingLeft", "padding-left"));
	var paddingRight = parseInt(this.getStyle(element, "paddingRight", "padding-right"));
	var borderLeft = parseInt(this.getStyle(element, "borderLeftWidth", "border-left-width"));
	var borderRight = parseInt(this.getStyle(element, "borderRightWidth", "border-right-width"));

	paddingLeft = isNaN(paddingLeft) ? 0 : paddingLeft;
	paddingRight = isNaN(paddingRight) ? 0 : paddingRight;
	borderLeft = isNaN(borderLeft) ? 0 : borderLeft;
	borderRight = isNaN(borderRight) ? 0 : borderRight;
	
	if (this.Browser.Gecko) paddingLeft += 3; // Firefox: input larger then given size in px!
	return element.offsetWidth - paddingLeft - paddingRight - borderLeft - borderRight;
};

/**
 * Returns auto height for editor
 * @private
 */
EditableGrid.prototype.autoHeight = function (element) 
{
	var paddingTop = parseInt(this.getStyle(element, "paddingTop", "padding-top"));
	var paddingBottom = parseInt(this.getStyle(element, "paddingBottom", "padding-bottom"));
	var borderTop = parseInt(this.getStyle(element, "borderTopWidth", "border-top-width"));
	var borderBottom = parseInt(this.getStyle(element, "borderBottomWidth", "border-bottom-width"));
	
	paddingTop = isNaN(paddingTop) ? 0 : paddingTop;
	paddingBottom = isNaN(paddingBottom) ? 0 : paddingBottom;
	borderTop = isNaN(borderTop) ? 0 : borderTop;
	borderBottom = isNaN(borderBottom) ? 0 : borderBottom;

	return element.offsetHeight - paddingTop - paddingBottom - borderTop - borderBottom;
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

	var e = document.getElementsByTagName('script');
	for (var i=0; i<e.length; i++) {
		if (e[i].src && /(^|\/)editablegrid.*\.js([?#].*)?$/i.test(e[i].src)) {
			var src = new URI(e[i].src);
			var srcAbs = src.toAbsolute(base);
			srcAbs.path = srcAbs.path.replace(/[^\/]+$/, ''); // remove filename
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
	return false;
};

/**
 * class name manipulation
 * @private
 */
EditableGrid.prototype.strip = function(str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); };
EditableGrid.prototype.hasClassName = function(element, className) { return (element.className.length > 0 && (element.className == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className))); };
EditableGrid.prototype.addClassName = function(element, className) { if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className; };
EditableGrid.prototype.removeClassName = function(element, className) { element.className = this.strip(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ')); };

/**
 * Useful string methods 
 * @private
 */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")); };
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str); };
String.prototype.endsWith = function(str) { return (this.match(str+"$")==str); };
	
// Accepted formats: (for EU just switch month and day)
//
// mm-dd-yyyy
// mm/dd/yyyy
// mm.dd.yyyy
// mm dd yyyy
// mmm dd yyyy
// mmddyyyy
//
// m-d-yyyy
// m/d/yyyy
// m.d.yyyy,
// m d yyyy
// mmm d yyyy
//
// // m-d-yy
// // m/d/yy
// // m.d.yy
// // m d yy,
// // mmm d yy (yy is 20yy) 

/**
 * Checks validity of a date string 
 * @private
 */
EditableGrid.prototype.checkDate = function(strDate, strDatestyle) 
{
	strDatestyle = strDatestyle || "EU";
	var strDate;
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
	var strMonthArray = new Array(12);
	
	strMonthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

// See RFC3986
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

    entities['38'] = '&amp;';
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

function htmlentities(string, quote_style) 
{
    var hash_map = {}, symbol = '', tmp_str = '';
    tmp_str = string.toString();
    if (false === (hash_map = get_html_translation_table('HTML_ENTITIES', quote_style))) return false;
    hash_map["'"] = '&#039;';
    for (symbol in hash_map) tmp_str = tmp_str.split(symbol).join(hash_map[symbol]);
    return tmp_str;
}

function htmlspecialchars(string, quote_style) 
{
    var hash_map = {}, symbol = '', tmp_str = '';
    tmp_str = string.toString();
    if (false === (hash_map = get_html_translation_table('HTML_SPECIALCHARS', quote_style))) return false;
    for (symbol in hash_map) tmp_str = tmp_str.split(symbol).join(hash_map[symbol]);
    return tmp_str;
}