	
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

function checkDate(strDate, strDatestyle) 
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
	if (strDate.length < 1) return 0;

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
		if (intMonth>12 || intMonth<1) return 5;
	}

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
	return strDatestyle == "US" ? strMonthArray[intMonth-1] + " " + intday+" " + strYear : intday + " " + strMonthArray[intMonth-1]/*.toLowerCase()*/ + " " + strYear;
}

function LeapYear(intYear) 
{
	if (intYear % 100 == 0) { if (intYear % 400 == 0) return true; }
	else if ((intYear % 4) == 0) return true;
	return false;
}
