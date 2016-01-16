<?php
    const FIREBASE_URL = 'https://confapp-data-sync.firebaseio.com/';
    const FILE_FIELD = 'file';
    if(isset($_POST['conferenceID']) && isset($_POST['userToken'])) {
        if(isset($_FILES[FILE_FIELD])) {
            $conferenceID = $_POST['conferenceID'];
            $authToken = $_POST['userToken'];
            $url = FIREBASE_URL.'conferences/'.urlencode($conferenceID).'/.json?auth='.urlencode($authToken);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
            $output = curl_exec($ch);
            $outputObject = json_decode($output, true);
            curl_close($ch);

            if($outputObject['error']) {
                print($output);
            } else {
                $destDirectory = 'uploads/'.$conferenceID.'/';

                if(isset($_POST['folder'])) {
                    $destDirectory .= $_POST['folder'].'/';
                }

                $filenames=array();
                if(!is_dir($destDirectory)) {
                    mkdir($destDirectory, 0777, true);
                }

                foreach($_FILES[FILE_FIELD]['tmp_name'] as $key => $tmp_name) {
                    $file_name = strtolower($_FILES[FILE_FIELD]['name'][$key]);
                    $file_size = $_FILES[FILE_FIELD]['size'][$key];
                    $file_tmp  = $_FILES[FILE_FIELD]['tmp_name'][$key];
                    $file_type = $_FILES[FILE_FIELD]['type'][$key];

                    $dest = $destDirectory.$file_name;
                    move_uploaded_file($file_tmp, $dest);

                    $fileURL = 'http://'.$_SERVER['HTTP_HOST'];
                    $urlSegments = explode('/', $_SERVER['REQUEST_URI']);
                    $fileURL .= join('/', array_slice($urlSegments, 0, -1));
                    $fileURL .= '/'.$dest;

                    array_push($filenames, $fileURL);
                }
                echo json_encode($filenames);

            }
        } else if(isset($_POST['remove'])) {
            $destDirectory = 'uploads/'.$conferenceID.'/';

            echo '{"result":"OK"}';
        }
    } else {
        echo '{"error":"Not enough fields set"}';
    }
?>