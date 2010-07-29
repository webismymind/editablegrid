<?php

class EditableGrid {
	
	protected $columns;
	protected $encoding;
	
	function __construct($encoding = "utf-8") 
	{
		$this->encoding = $encoding;
		$this->columns = array();
	}
	
	public static function escapeXML($str) 
	{
		$str = str_replace('"', "&quot;", $str);
		$str = str_replace("'", "&apos;", $str);
		$str = str_replace("&", "&amp;", $str);
		$str = str_replace("<", "&lt;", $str);
		$str = str_replace(">", "&gt;", $str);
		return $str;
	}
	
	public function addColumn($name, $label, $type, $values = NULL, $editable = true, $field = NULL, $bar = true) 
	{
		$this->columns[$name] = array("field" => $field ? $field : $name, "label" => $label, "type" => $type, "editable" => $editable, "bar" => $bar, "values" => $values );
	}
	
	private function _getRowField($row, $field) 
	{
		return is_array($row) ? $row[$field] : $row->$field;
	}
	
	public function getXML($rows, $customRowAttributes=array(), $encodeCustomAttributes=false) 
	{
		$xml = '<?xml version="1.0" encoding="'. $this->encoding . '" ?>';
		
		$xml.= "<table><metadata>\n";

		foreach ($this->columns as $name => $info) {
			$label = self::escapeXML($info['label']);
			$xml.= "<column name='$name' label='$label' datatype='{$info['type']}'". ($info['bar'] ? "" : " bar='false'") . " editable='". ($info['editable'] ? "true" : "false") . "'>\n";
			if (is_array($info['values'])) {
				$xml.= "<values>\n";
				foreach ($info['values'] as $key => $value) $xml.= "<value value='{$key}'><![CDATA[{$value}]]></value>\n"; 
				$xml.= "</values>\n";
			}
			$xml.= "</column>\n";
		}  

  
		$xml.= "</metadata><data>\n";
	
		foreach ($rows as $row) { 
	
			$xml.= "<row id='" . $this->_getRowField($row, 'id') . "'";
			foreach ($customRowAttributes as $name => $field) $xml.= " {$name}='" . ($encodeCustomAttributes ? base64_encode($this->_getRowField($row, $field)) : $this->_getRowField($row, $field)) . "'";
			$xml.= ">\n";
			
			foreach ($this->columns as $name => $info) {
				$field = $info['field'];
				$xml.= "<column name='{$name}'><![CDATA[" . $this->_getRowField($row, $field) . "]]></column>\n";
			}
			$xml.= "</row>\n";
		}
		
		$xml.= "</data></table>\n";

		return $xml;
	} 
	
	public function renderXML($rows, $customRowAttributes=array(), $encodeCustomAttributes=false) 
	{
		header('Content-Type: text/xml');
		echo $this->getXML($rows, $customRowAttributes, $encodeCustomAttributes);
	} 
}