<?php
  $m = new MongoClient('mongodb://localhost:27017');
  $db = $m->express;
  $progress = $db->uploadProgress;
  $fileName = $_GET['fileName'];
  $username = $_GET['username'];
  switch ($_GET["type"]) {
    case 'check':
      $fileProgress = array(
        'fileName' => $fileName,
        'user' => $username
      );
      $fileProgress = $progress->findOne($fileProgress);
      echo $fileProgress["percentage"];
      break;
    case 'finish':
      $deleteFile = array(
        'fileName' => $fileName,
        'user' => $username
      );
      $progress->remove($deleteFile);
      echo 'deleted';
      break;
  }
?>
