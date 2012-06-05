<?php

class EditableGrid {

	protected $columns;
	protected $encoding;
	protected $writeColumnNames; // write column names in XML and JSON (set to false to save bandwidth)
	protected $pageCount;
	protected $totalRowCount;
	protected $unfilteredRowCount;

	function __construct($encoding = "utf-8", $writeColumnNames = false)
	{
		$this->encoding = $encoding;
		$this->columns = array();
		$this->writeColumnNames = $writeColumnNames;
		$this->pageCount = null;
		$this->totalRowCount = null;
		$this->unfilteredRowCount = null;
	}

	public static function escapeXML($str)
	{
		$str = str_replace("&", "&amp;", $str);
		$str = str_replace('"', "&quot;", $str);
		$str = str_replace("'", "&apos;", $str);
		$str = str_replace("<", "&lt;", $str);
		$str = str_replace(">", "&gt;", $str);
		return $str;
	}

	public function getColumnLabels()
	{
		$labels = array();
		foreach ($this->columns as $name => $column) $labels[$name] = $column['label'];
		return $labels;
	}

	public function addColumn($name, $label, $type, $values = NULL, $editable = true, $field = NULL, $bar = true)
	{
		$this->columns[$name] = array("field" => $field ? $field : $name, "label" => $label, "type" => $type, "editable" => $editable, "bar" => $bar, "values" => $values );
	}

	/**
	 * 
	 * Set parameters needed for server-side pagination (supported only with JSON)
	 * @param integer $pageCount number of pages
	 * @param integer $totalRowCount total numer of rows in all pages
	 * @param integer $unfilteredRowCount total number of rows, not taking the filter into account
	 */
	public function setPaginator($pageCount, $totalRowCount, $unfilteredRowCount)
	{
		$this->pageCount = $pageCount;
		$this->totalRowCount = $totalRowCount;
		$this->unfilteredRowCount = $unfilteredRowCount;
	}

	private function _getRowField($row, $field)
	{
		$value = is_array($row) ? (isset($row[$field]) ? $row[$field] : '') : (isset($row->$field) ? $row->$field : '');

		// to avoid any issue with javascript not able to parse XML, ensure data is valid for encoding
		return @iconv($this->encoding, $this->encoding."//IGNORE", $value);
	}

	public function getXML($rows=false, $customRowAttributes=false, $encodeCustomAttributes=false, $includeMetadata=true)
	{
		$xml = '<?xml version="1.0" encoding="'. $this->encoding . '" ?>';
		$xml.= "<table>\n";

		if ($includeMetadata) {

			$xml.= "<metadata>\n";
			foreach ($this->columns as $name => $info) {
				$label = self::escapeXML(@iconv($this->encoding, $this->encoding."//IGNORE", $info['label']));
				$xml.= "<column name='$name' label='$label' datatype='{$info['type']}'". ($info['bar'] ? "" : " bar='false'") . " editable='". ($info['editable'] ? "true" : "false") . "'>\n";
				if (is_array($info['values'])) {
					$xml.= "<values>\n";
					foreach ($info['values'] as $key => $value) {
						if (is_array($value)) {
							$grouplabel = self::escapeXML(@iconv($this->encoding, $this->encoding."//IGNORE", $key));
							$xml.= "<group label='$grouplabel'>\n";
							$values = $value;
							foreach ($values as $key => $value) {
								$clean_value = @iconv($this->encoding, $this->encoding."//IGNORE", $value);
								$xml.= "<value value='{$key}'><![CDATA[{$clean_value}]]></value>\n";
							}
							$xml.= "</group>\n";
						}
						else {
							$clean_value = @iconv($this->encoding, $this->encoding."//IGNORE", $value);
							$xml.= "<value value='{$key}'><![CDATA[{$clean_value}]]></value>\n";
						}
					}
					$xml.= "</values>\n";
				}
				$xml.= "</column>\n";
			}
			$xml.= "</metadata>\n";
		}

		$xml.= "<data>\n";
		if ($rows) {
			$fetchMethod = method_exists($rows, 'fetch') ? 'fetch' : (method_exists($rows, 'fetch_assoc') ? 'fetch_assoc' : (method_exists($rows, 'FetchRow') ? 'FetchRow' : NULL));
			if (!$fetchMethod) foreach ($rows as $row) $xml.= $this->getRowXML($row, $customRowAttributes, $encodeCustomAttributes);
			else while ($row = call_user_func(array($rows, $fetchMethod))) $xml.= $this->getRowXML($row, $customRowAttributes, $encodeCustomAttributes);
		}
		$xml.= "</data>\n";


		$xml.="</table>\n";
		return $xml;
	}

	private function getRowXML($row, $customRowAttributes, $encodeCustomAttributes)
	{
		$xml = "<row id='" . self::escapeXML($this->_getRowField($row, 'id')) . "'";
		if ($customRowAttributes) foreach ($customRowAttributes as $name => $field) $xml.= " {$name}='" . ($encodeCustomAttributes ? base64_encode($this->_getRowField($row, $field)) : self::escapeXML($this->_getRowField($row, $field))) . "'";
		$xml.= ">\n";
			
		foreach ($this->columns as $name => $info) {
			$field = $info['field'];
			$name_attr = $this->writeColumnNames ? " name='{$name}'" : "";
			$xml.= "<column{$name_attr}><![CDATA[" . $this->_getRowField($row, $field) . "]]></column>\n";
		}

		$xml.= "</row>\n";
		return $xml;
	}

	public function renderXML($rows=false, $customRowAttributes=false, $encodeCustomAttributes=false, $includeMetadata=true)
	{
		header('Content-Type: text/xml');
		echo $this->getXML($rows, $customRowAttributes, $encodeCustomAttributes, $includeMetadata);
	}

	public function getJSON($rows=false, $customRowAttributes=false, $encodeCustomAttributes=false, $includeMetadata=true)
	{
		$results = array();

		if ($includeMetadata) {

			$results['metadata'] = array();
			foreach ($this->columns as $name => $info) {
				$results['metadata'][] = array(
				"name" => $name,
				"label" => @iconv($this->encoding, $this->encoding."//IGNORE", $info['label']),
				"datatype" => $info['type'],
				"bar" => $info['bar'],
				"editable" => $info['editable'],
				"values" => $info['values']
				);
			}
		}

		if ($this->pageCount !== null) $results['paginator'] = array(
			"pagecount" => $this->pageCount,
			"totalrowcount" => $this->totalRowCount,
			"unfilteredrowcount" => $this->unfilteredRowCount
		);

		$results['data'] = array();
		if ($rows) {
			$fetchMethod = method_exists($rows, 'fetch') ? 'fetch' : (method_exists($rows, 'fetch_assoc') ? 'fetch_assoc' : (method_exists($rows, 'FetchRow') ? 'FetchRow' : NULL));
			if (!$fetchMethod) foreach ($rows as $row) $results['data'][] = $this->getRowJSON($row, $customRowAttributes, $encodeCustomAttributes);
			else while ($row = call_user_func(array($rows, $fetchMethod))) $results['data'][] = $this->getRowJSON($row, $customRowAttributes, $encodeCustomAttributes);
		}

		return json_encode($results);
	}

	private function getRowJSON($row, $customRowAttributes, $encodeCustomAttributes)
	{
		$data = array("id" => $this->_getRowField($row, 'id'), "values" => array());
		if ($customRowAttributes) foreach ($customRowAttributes as $name => $field) $data[$name] = $encodeCustomAttributes ? base64_encode($this->_getRowField($row, $field)) : $this->_getRowField($row, $field);
			
		foreach ($this->columns as $name => $info) {
			$field = $info['field'];
			if ($this->writeColumnNames) $data["values"][$name] = $this->_getRowField($row, $field);
			else $data["values"][] = $this->_getRowField($row, $field);
		}

		return $data;
	}

	public function renderJSON($rows=false, $customRowAttributes=false, $encodeCustomAttributes=false, $includeMetadata=true)
	{
		header('Content-Type: text/json');
		echo $this->getJSON($rows, $customRowAttributes, $encodeCustomAttributes, $includeMetadata);
	}

	public static function parseInt($string) {
		return preg_match('/[-+]{0,1}(\d+)/', $string, $array) ? intval($array[0]) : NULL;
	}

	public static function parseFloat($string) {
		return preg_match('/[-+]{0,1}([\d\.]+)/', $string, $array) ? floatval($array[0]) : NULL;
	}

	public static function repeat($len, $pattern=" ")
	{
		$str = "";
		for ($i=0; $i<$len; $i++) $str.=$pattern;
		return $str;
	}

	protected function parseColumnType($type, $unitTranslations = FALSE)
	{
		$info = array(
			'unit' => '',
			'precision' => -1,
			'decimal_point' => ',',
			'thousands_separator' => '.',
			'unit_before_number' => false,
			'nansymbol' => ''
			);

			$parts = array();

			if (preg_match("/(.*)\((.*),(.*),(.*),(.*),(.*),(.*)\)$/", $type, $parts)) {
				$parts = array_map('trim', $parts);
				$info['datatype'] = $parts[1];
				$info['unit'] = $parts[2];
				$info['precision'] = self::parseInt($parts[3]);
				$info['decimal_point'] = $parts[4];
				$info['thousands_separator'] = $parts[5];
				$info['unit_before_number'] = $parts[6] == '1';
				$info['nansymbol'] = $parts[7];
			}

			else if (preg_match("/(.*)\((.*),(.*),(.*),(.*),(.*)\)$/", $type, $parts)) {
				$parts = array_map('trim', $parts);
				$info['datatype'] = $parts[1];
				$info['unit'] = $parts[2];
				$info['precision'] = self::parseInt($parts[3]);
				$info['decimal_point'] = $parts[4];
				$info['thousands_separator'] = $parts[5];
				$info['unit_before_number'] = $parts[6] == '1';
			}

			else if (preg_match("/(.*)\((.*),(.*),(.*)\)$/", $type, $parts)) {
				$parts = array_map('trim', $parts);
				$info['datatype'] = $parts[1];
				$info['unit'] = $parts[2];
				$info['precision'] = self::parseInt($parts[3]);
				$info['nansymbol'] = $parts[4];
			}

			else if (preg_match("/(.*)\((.*),(.*)\)$/", $type, $parts)) {
				$parts = array_map('trim', $parts);
				$info['datatype'] = $parts[1];
				$info['unit'] = $parts[2];
				$info['precision'] = self::parseInt($parts[3]);
			}

			else if (preg_match("/(.*)\((.*)\)$/", $type, $parts)) {
				$parts = array_map('trim', $parts);
				$info['datatype'] = $parts[1];
				$precision = self::parseInt($parts[2]);
				if ($precision === NULL) $info['unit'] = $parts[2];
				else $info['precision'] = $precision;
			}

			if ($info['decimal_point'] == 'comma') $info['decimal_point'] = ',';
			if ($info['decimal_point'] == 'dot') $info['decimal_point'] = '.';
			if ($info['thousands_separator'] == 'comma') $info['thousands_separator'] = ',';
			if ($info['thousands_separator'] == 'dot') $info['thousands_separator'] = '.';

			if ($info['unit'] && isset($unitTranslations[$info['unit']])) $info['unit'] = $unitTranslations[$info['unit']];

			return $info;
	}

	/**
	 * This method formats a number according to the given EditableGrid type description.
	 * It will give the same result as the Javascript code used by EditableGrid.
	 * You can use this method for example to export your grid to PDF etc.
	 *
	 * @param numeric $value
	 * @param string $columnType such as double($, 2, dot, comma, 1, n/a)
	 */
	public static function format($value, $columnType, $unitTranslations = FALSE)
	{
		$info = self::parseColumnType($columnType, $unitTranslations);
		if (!isset($info['datatype']) || !in_array($info['datatype'], array('double', 'integer'))) return $value;

		$floatValue = self::parseFloat($value);
		if ($floatValue === NULL) return $info['nansymbol'];

		$displayValue = $floatValue;

		if ($info['precision'] === -1) $displayValue = trim(number_format($displayValue, 8, $info['decimal_point'], $info['thousands_separator']), "0");
		else if ($info['precision'] !== NULL) $displayValue = number_format($displayValue, $info['precision'], $info['decimal_point'], $info['thousands_separator']);
		if ($displayValue[strlen($displayValue) - 1] == '.') $displayValue = substr($displayValue, 0, strlen($displayValue) - 1);

		if ($info['unit']) $displayValue = $info['unit_before_number'] ? ($info['unit'] . ' ' . $displayValue) : ($displayValue . ' ' . $info['unit']);

		return $displayValue;
	}

	/**
	 * This method returns the Excel number format for the given EditableGrid type description.
	 *
	 * @param string $columnType such as double($, 2, dot, comma, 1, n/a)
	 * @param string $encoding, optional (utf-8 by default)
	 */
	public static function getXlsFormat($columnType, $encoding = "utf-8", $unitTranslations = FALSE)
	{
		$info = self::parseColumnType($columnType, $unitTranslations);
		if (!isset($info['datatype']) || !in_array($info['datatype'], array('double', 'integer'))) return '';

		$precision = $info['precision'];
		$pattern = "0";
		if ($precision < 0) {
			$precision = 8;
			$pattern = "#";
		}

		// TODO: can't find how to use UTF8 into XLS number formats (for chinese currency symbol etc.)
		$unit = $info['unit'] ? ($info['unit'] == '€' ? chr(128) : str_replace('?', '', @iconv($encoding, "latin1//TRANSLIT", $info['unit']))) : '';
		$before =  $unit && $info['unit_before_number'] ? "\"$unit \"" : '';
		$after = $unit && $info['unit_before_number'] ? '' : "\" $unit\"";

		if ($precision == 0) return $before . '#,##0' . $after;
		return $before . '#,##0.0' . self::repeat($precision - 1, $pattern) . $after;
	}
}