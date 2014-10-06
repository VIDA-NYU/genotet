<?php
$method = $_SERVER['REQUEST_METHOD'];
if($method == "GET"){
	$data = file_get_contents('http://localhost:3000/?' . $_GET['args'] );
	echo $_GET['callback']. '(' .json_encode( $data ) . ');';
}else if($method == "POST"){
	$opts = array('http' =>
		array(
			'method'  => 'POST',
			'header'  => 'Content-type: application/json',
			'content' => json_encode($_POST['args'])
		)
	);
	$context = stream_context_create($opts);
	$data = file_get_contents('http://localhost:3000/', false, $context);
	echo $_GET['callback']. '(' .json_encode( $data ) . ');'; 
}
?>
