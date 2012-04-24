<?php

// This PHP script demonstrates how to generate XML grid data "on-the-fly"
// To achieve this, here we use our simple "PHP wrapper class" EditableGrid.php, but this is not mandatory.
// The only thing is that the generated XML must have the expected structure .
// Here we get the data from a CSV file; in real life, these data would probably come from a database.

require_once("../../../php/EditableGrid.php");

// create grid and declare its columns
$grid = new EditableGrid();

// add two "string" columns
// if you wish you can specify the desired length of the text edition field like this: string(24)
$grid->addColumn("name", "NAME", "string");
$grid->addColumn("firstname", "FIRSTNAME", "string");

// add an "integer" and a "double" column
// you can specifiy the unit: double(m), the precision: double(2), or both: double(m,2)
// these will be used in the default renderer NumberCellRenderer
$grid->addColumn("age", "AGE", "integer");
$grid->addColumn("height", "HEIGHT", "double(m,2)", null, true, null, false);

// add column with predefined values, organized in "option groups" (dropdown list)
$grid->addColumn("country", "COUNTRY", "string", array(
	"Europe" => array("be" => "Belgium", "fr" => "France", "uk" => "Great-Britain", "nl" => "Nederland"),
	"America" => array("br" => "Brazil", "ca" => "Canada", "us" => "USA"),
	"Africa" => array("ng" => "Nigeria", "za" => "South-Africa", "zw" => "Zimbabwe")
));

// add some other columns: email, url, boolean, date
$grid->addColumn("email", "EMAIL", "email");
// $grid->addColumn("website", "WEBSITE", "url");
$grid->addColumn("freelance", "FREELANCE", "boolean");
$grid->addColumn("lastvisit", "LAST VISIT", "date");

// action column ("html" type), not editable
$grid->addColumn("action", "", "html", NULL, false);

// load data from csv
$handle = fopen("demo.csv", "r");
$data = array();
while ($row = fgetcsv($handle, 0, ";")) {
	if (count($row) <= 1 || $row[0] == 'id') continue;
	
	$data[] = array(
		"id" => $row[0],
		"name" => $row[1],
		"firstname" => $row[2],
		"age" => $row[3],
		"height" => $row[4],
		"continent" => $row[5],
		"country" => $row[6],
		"email" => str_replace("Nam@quisdiamluctus.org", "Nam@quisdiamluctus." . (isset($_GET['json']) ? "json" : "xml") . ".php.org", $row[7]), // just to check out if json/xml is active!
		"freelance" => $row[8] == '1',
		"lastvisit" => $row[9],
		"website" => $row[10]
	);
}

// render XML or JSON
if (isset($_GET['xml'])) $grid->renderXML($data);
else $grid->renderJSON($data);
