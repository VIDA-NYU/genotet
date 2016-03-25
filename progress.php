<?php
  $m = new MongoClient("mongodb://localhost:27017");
  $db = $m->express;
  $progress = $db->uploadProgress;
  $fileName = $_GET['fileName'];
  switch ($_GET["type"]) {
    case "check":
      $fileProgress = array(
        'fileName' => $fileName
      );
      $fileProgress = $progress->findOne($fileProgress);
      echo $fileProgress["percentage"];
      break;
    case "finish":
      $deleteFile = array(
        'fileName' => $fileName
      );
      $progress->remove($deleteFile);
      echo 'deleted';
      break;
  }
?>