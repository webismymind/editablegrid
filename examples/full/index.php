<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>EditableGrid Demo - Grid with pagination</title>
		
		<!-- include javascript and css files for the EditableGrid library -->
		<script src="../../editablegrid.js"></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_renderers.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_editors.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_validators.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_utils.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_charts.js" ></script>
		<link rel="stylesheet" href="../../editablegrid.css" type="text/css" media="screen">

		<!-- include javascript and css files for jQuery, needed for the datepicker and autocomplete extensions -->
		<script src="../../extensions/jquery/jquery-1.6.4.min.js" ></script>
		<script src="../../extensions/jquery/jquery-ui-1.8.16.custom.min.js" ></script>
		<link rel="stylesheet" href="../../extensions/jquery/jquery-ui-1.8.16.custom.css" type="text/css" media="screen">
		
		<!-- include javascript and css files for the autocomplete extension -->
		<script src="../../extensions/autocomplete/autocomplete.js" ></script>
		<link rel="stylesheet" href="../../extensions/autocomplete/autocomplete.css" type="text/css" media="screen">

		<!-- Uncomment this if you want to use the first variant of the autocomplete instead of the official one from jQuery UI -->
		<!--
		<script src="../../extensions/autocomplete_variant_1/jquery.autocomplete.min.js" ></script>
		<script src="../../extensions/autocomplete_variant_1/autocomplete.js" ></script>
		<link rel="stylesheet" href="../../extensions/autocomplete_variant_1/jquery.autocomplete.css" type="text/css" media="screen">
		!-->

		<!-- Uncomment this if you want to use the second variant of the autocomplete instead of the official one from jQuery UI -->
		<!--
		<script src="../../extensions/autocomplete_variant_2/jquery.autocomplete.min.js" ></script>
		<script src="../../extensions/autocomplete_variant_2/autocomplete.js" ></script>
		<link rel="stylesheet" href="../../extensions/autocomplete_variant_2/jquery.autocomplete.css" type="text/css" media="screen">
		!-->

		<!-- include javascript file for the Highcharts library -->
		<script src="../../extensions/Highcharts-4.0.4/js/highcharts.js"></script>

		<!-- include javascript and css files for this demo -->
		<script src="javascript/demo.js" ></script>
		<link rel="stylesheet" type="text/css" href="css/demo.css" media="screen"/>
		<script type="text/javascript">
			window.onload = function() { 
				// you can use "datasource/demo.php" if you have PHP installed, to get live data from the demo.csv file
				editableGrid.onloadJSON("datasource/demo.json"); 
			}; 
		</script>
		
		<!-- [DO NOT DEPLOY] --> <?php if (isset($_GET['php'])) { ?><script type="text/javascript">window.onload = function() { editableGrid.onloadJSON("datasource/demo.php"); } </script> <?php } ?>	
		<!-- [DO NOT DEPLOY] --> <?php if (isset($_GET['xml'])) { ?><script type="text/javascript">window.onload = function() { editableGrid.onloadXML("datasource/<?php echo isset($_GET['php']) ? "demo.php?xml" : "demo.xml" ?>"); } </script> <?php } ?>	
		<!-- [DO NOT DEPLOY] --> <?php if (isset($_GET['attach'])) { ?><script type="text/javascript">window.onload = function() { editableGrid.onloadHTML("htmlgrid"); } </script> <?php } ?>	
	</head>
	
	<body>
		<div id="wrap">
		<h1>EditableGrid Demo - Grid with pagination<a href="../index.html">Back to menu</a></h1> 
		
			<!-- Feedback message zone -->
			<div id="message"></div>

			<!--  Number of rows per page and bars in chart -->
			<div id="pagecontrol">
				<label for="pagecontrol">Rows per page: </label>
				<select id="pagesize" name="pagesize">
					<option value="5">5</option>
					<option value="10">10</option>
					<option value="15">15</option>
					<option value="20">20</option>
					<option value="25">25</option>
					<option value="30">30</option>
					<option value="40">40</option>
					<option value="50">50</option>
				</select>
				&nbsp;&nbsp;
				<label for="barcount">Bars in chart: </label>
				<select id="barcount" name="barcount">
					<option value="5">5</option>
					<option value="10">10</option>
					<option value="15">15</option>
					<option value="20">20</option>
					<option value="25">25</option>
					<option value="30">30</option>
					<option value="40">40</option>
					<option value="50">50</option>
				</select>	
			</div>
		
			<!-- Grid filter -->
			<label for="filter">Filter :</label>
			<input type="text" id="filter"/>
		
			<!-- Grid contents -->
			<div id="tablecontent"></div>
			<!-- [DO NOT DEPLOY] --> <?php if (isset($_GET['attach'])) include("htmlgrid.html"); ?>	
		
			<!-- Paginator control -->
			<div id="paginator"></div>
		
			<!-- Edition zone (to demonstrate the "fixed" editor mode) -->
			<div id="edition"></div>
			
			<!-- Charts zone -->
			<div id="barchartcontent"></div>
			<div id="piechartcontent"></div>
			
		</div>
	</body>

</html>
