EditableGrid.prototype.unsort = function(a,b) 
{
	aa = isNaN(a[3]) ? 0 : parseFloat(a[3]);
	bb = isNaN(b[3]) ? 0 : parseFloat(b[3]);
	return aa-bb;
}

EditableGrid.prototype.sort_numeric = function(a,b) 
{
	aa = isNaN(a[0]) ? 0 : parseFloat(a[0]);
	bb = isNaN(b[0]) ? 0 : parseFloat(b[0]);
	return aa-bb;
}

EditableGrid.prototype.sort_boolean = function(a,b) 
{
	aa = !a[0] || a[0] == "false" ? 0 : 1;
	bb = !b[0] || b[0] == "false" ? 0 : 1;
	return aa-bb;
}

EditableGrid.prototype.sort_alpha = function(a,b) 
{
	if (a[0]==b[0]) return 0;
	if (a[0]<b[0]) return -1;
	return 1;
}

EditableGrid.prototype.sort_date = function(a,b) 
{
	date = EditableGrid.prototype.checkDate(a[0]);
	aa = typeof date == "object" ? date.sortDate : 0;
	date = EditableGrid.prototype.checkDate(b[0]);
	bb = typeof date == "object" ? date.sortDate : 0;
	return aa-bb;
}

/**
 * Returns computed style property for element
 * @private
 */
EditableGrid.prototype.getStyle = function(element, styleProp)
{
	if (element.currentStyle) return element.currentStyle[styleProp];
	else if (window.getComputedStyle) return document.defaultView.getComputedStyle(element,null).getPropertyValue(styleProp);
	return element.style[styleProp];
}

/**
 * Returns true if the element has a static positioning
 * @private
 */
EditableGrid.prototype.isStatic = function (element) 
{
	var position = this.getStyle(element, 'position');
	return (!position || position == "static");
}

/**
 * Detects the directory when the js sources can be found
 * @private
 */
EditableGrid.prototype.detectDir = function() 
{
	var base = location.href;
	var e = document.getElementsByTagName('base');
	for (var i=0; i<e.length; i++) if(e[i].href) base = e[i].href;

	var e = document.getElementsByTagName('script')
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
},

/**
 * class name manipulation
 * @private
 */
EditableGrid.prototype.strip = function(str) { return str.replace(/^\s+/, '').replace(/\s+$/, ''); },
EditableGrid.prototype.hasClassName = function(element, className) { return (element.className.length > 0 && (element.className == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(element.className))); }
EditableGrid.prototype.addClassName = function(element, className) { if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className; }
EditableGrid.prototype.removeClassName = function(element, className) { element.className = this.strip(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ')); }

/**
 * Useful string methods 
 * @private
 */
String.prototype.trim = function() { return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "")) };
String.prototype.startsWith = function(str) { return (this.match("^"+str)==str) };
String.prototype.endsWith = function(str) { return (this.match(str+"$")==str) };
	
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
		sortDate: Date.parse(intMonth + "/" + intday + "/" + intYear)
	};
}

function LeapYear(intYear) 
{
	if (intYear % 100 == 0) { if (intYear % 400 == 0) return true; }
	else if ((intYear % 4) == 0) return true;
	return false;
}

// See RFC3986
URI = function(uri) 
{ 
	this.scheme = null
	this.authority = null
	this.path = ''
	this.query = null
	this.fragment = null

	this.parse = function(uri) {
		var m = uri.match(/^(([A-Za-z][0-9A-Za-z+.-]*)(:))?((\/\/)([^\/?#]*))?([^?#]*)((\?)([^#]*))?((#)(.*))?/)
		this.scheme = m[3] ? m[2] : null
		this.authority = m[5] ? m[6] : null
		this.path = m[7]
		this.query = m[9] ? m[10] : null
		this.fragment = m[12] ? m[13] : null
		return this
	}

	this.toString = function() {
		var result = ''
		if(this.scheme != null) result = result + this.scheme + ':'
		if(this.authority != null) result = result + '//' + this.authority
		if(this.path != null) result = result + this.path
		if(this.query != null) result = result + '?' + this.query
		if(this.fragment != null) result = result + '#' + this.fragment
		return result
	}

	this.toAbsolute = function(base) {
		var base = new URI(base)
		var r = this
		var t = new URI

		if(base.scheme == null) return false

		if(r.scheme != null && r.scheme.toLowerCase() == base.scheme.toLowerCase()) {
			r.scheme = null
		}

		if(r.scheme != null) {
			t.scheme = r.scheme
			t.authority = r.authority
			t.path = removeDotSegments(r.path)
			t.query = r.query
		} else {
			if(r.authority != null) {
				t.authority = r.authority
				t.path = removeDotSegments(r.path)
				t.query = r.query
			} else {
				if(r.path == '') {
					t.path = base.path
					if(r.query != null) {
						t.query = r.query
					} else {
						t.query = base.query
					}
				} else {
					if(r.path.substr(0,1) == '/') {
						t.path = removeDotSegments(r.path)
					} else {
						if(base.authority != null && base.path == '') {
							t.path = '/'+r.path
						} else {
							t.path = base.path.replace(/[^\/]+$/,'')+r.path
						}
						t.path = removeDotSegments(t.path)
					}
					t.query = r.query
				}
				t.authority = base.authority
			}
			t.scheme = base.scheme
		}
		t.fragment = r.fragment

		return t
	}

	function removeDotSegments(path) {
		var out = ''
		while(path) {
			if(path.substr(0,3)=='../' || path.substr(0,2)=='./') {
				path = path.replace(/^\.+/,'').substr(1)
			} else if(path.substr(0,3)=='/./' || path=='/.') {
				path = '/'+path.substr(3)
			} else if(path.substr(0,4)=='/../' || path=='/..') {
				path = '/'+path.substr(4)
				out = out.replace(/\/?[^\/]*$/, '')
			} else if(path=='.' || path=='..') {
				path = ''
			} else {
				var rm = path.match(/^\/?[^\/]*/)[0]
				path = path.substr(rm.length)
				out = out + rm
			}
		}
		return out
	}

	if(uri) {
		this.parse(uri)
	}

};
