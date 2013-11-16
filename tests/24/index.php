<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>EditableGrid - Issue 24</title>
		
		<script src="../../editablegrid.js"></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_renderers.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_editors.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_validators.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_utils.js" ></script>
		<!-- [DO NOT DEPLOY] --> <script src="../../editablegrid_charts.js" ></script>
		<link rel="stylesheet" href="../../editablegrid.css" type="text/css" media="screen">
		
		<style>
			body { font-family:'lucida grande', tahoma, verdana, arial, sans-serif; font-size:11px; }
			h1 { font-size: 15px; }
			a { color: #548dc4; text-decoration: none; }
			a:hover { text-decoration: underline; }
			table.testgrid { border-collapse: collapse; border: 1px solid #CCB; width: 800px; }
			table.testgrid td, table.testgrid th { padding: 5px; border: 1px solid #E0E0E0; }
			table.testgrid th { background: #E5E5E5; text-align: left; }
			input.invalid { background: red; color: #FDFDFD; }
		</style>
		
		<script>
			window.onload = function() {
				<? for ($g = 1; $g <= 3; $g++) { ?>
					editableGrid<?= $g ?> = new EditableGrid("DemoGridAttach<?= $g ?>"); 
					editableGrid<?= $g ?>.load({ metadata: [ 
						<? for ($c = 1; $c <= 10; $c++) { ?>
						{ name: "COL<?= $c ?>", datatype: "string", editable: true } <?= $c == 10 ? "" : ",\n" ?>
						<? } ?>
					]});
					editableGrid<?= $g ?>.attachToHTMLTable('htmlgrid<?= $g ?>');
					editableGrid<?= $g ?>.renderGrid();
				<? } ?>
			};
		</script>
		
	</head>
	
	<body>

		<div style="height: 260px; width: 400px; margin-left: auto; margin-right: auto; overflow: auto">
			<p>My table:</p>
			<div style="height: 640px; width: 800px; overflow: auto">
				<table id="htmlgrid1">
					<tr><th>NAME</th></tr>
					<? 
						for ($r = 1; $r <= 100; $r++) {
							echo "<tr id='rowA{$r}'>\n";
							for ($c = 1; $c <= 10; $c++) echo "<td>CELL {$c}x{$r}</td>\n";
							echo "</tr>\n"; 
						}
					?>
				</table>
			</div>
		</div>

		<p><hr/></p>
		<div style="height: 260px; width: 400px; margin-left: auto; margin-right: auto; overflow: auto">
			<p>My table:</p>
			<div style="height: 640px; width: 800px; overflow: auto; position: relative">
				<table id="htmlgrid2">
					<tr><th>NAME</th></tr>
					<? 
						for ($r = 1; $r <= 100; $r++) {
							echo "<tr id='rowB{$r}'>\n";
							for ($c = 1; $c <= 10; $c++) echo "<td>CELL {$c}x{$r}</td>\n";
							echo "</tr>\n"; 
						}
					?>
				</table>
			</div>
		</div>

		<p><hr/></p>
		<div style="height: 260px; width: 400px; margin-left: auto; margin-right: auto; overflow: auto; position: relative">
			<p>My table:</p>
			<div style="height: 640px; width: 800px; overflow: auto">
				<table id="htmlgrid3">
					<tr><th>NAME</th></tr>
					<? 
						for ($r = 1; $r <= 100; $r++) {
							echo "<tr id='rowC{$r}'>\n";
							for ($c = 1; $c <= 10; $c++) echo "<td>CELL {$c}x{$r}</td>\n";
							echo "</tr>\n"; 
						}
					?>
				</table>
			</div>
		</div>

	</body>
	
</html>
