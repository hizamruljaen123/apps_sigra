<?php

function transposeCSV($inputFilename, $outputFilename, $delimiter = ';') {
    if (!file_exists($inputFilename) || !is_readable($inputFilename)) {
        echo "File not readable.";
        return;
    }

    $header = null;
    $uniqueQuestions = [];
    $data = [];

    if (($handle = fopen($inputFilename, 'r')) !== false) {
        while (($row = fgetcsv($handle, 1000, $delimiter)) !== false) {
            if (!$header) {
                $header = $row;
            } else {
                $rowData = array_combine($header, $row);
                $question = $rowData['question'];
                $questionNumber = intval($rowData['question_number']);

                // Avoid adding duplicate questions
                if (!array_key_exists($questionNumber, $uniqueQuestions)) {
                    $uniqueQuestions[$questionNumber] = $question;  
                }
            }
        }
        fclose($handle);
    }

    ksort($uniqueQuestions);  // Sort questions by question_number

    // Re-scan the CSV to structure the data
    if (($handle = fopen($inputFilename, 'r')) !== false) {
        $header = fgetcsv($handle, 1000, $delimiter);  // Read the header row

        while (($row = fgetcsv($handle, 1000, $delimiter)) !== false) {
            $rowData = array_combine($header, $row);
            $storeCode = $rowData['store_code'];
            $storeName = $rowData['store_name'];
            $kota = $rowData['kota'];
            $date = $rowData['date'];
            $question = $rowData['question'];
            $questionerType = $rowData['questioner_type'];
            $answer = $rowData['answer'];

            // Handling questioner type == "Multiple Choice"
            if ($questionerType == 'multiple_choice') {
                $answer = $CI->db->select('answer_column')
                                 ->where('some_condition', $some_value)
                                 ->get('your_table_name')
                                 ->row_array()['answer_column'] ?? '-';
            }

            // Handling hyperlinks
            if (strpos($answer, '=HYPERLINK') !== false) {
                preg_match('/"(.*?)"/', $answer, $matches);
                $answer = $matches[1] ?? '-';
            } else {
                $answer = !empty($answer) ? $answer : '-'; // Use '-' if answer is empty
            }

            $key = $kota.'-'.$storeCode . '-' .$storeName.'-'. $date;  // Create a unique key based on kota, store_code, store_name, and date

            if (!isset($data[$key])) {
                $data[$key] = [
                    'store_code' => $rowData['store_code'],
                    'store_name' => $rowData['store_name'],
                    'latitude' => $rowData['latitude'],
                    'longitude' => $rowData['longitude'],
                    'kota' => $rowData['kota'],
                    'provinsi' => $rowData['provinsi'],
                    'region' => $rowData['region'],
                    'account_name' => $rowData['account_name'],
                    'channel_name' => $rowData['channel_name'],
                    'role_name' => $rowData['role_name'],
                    'ba_username' => $rowData['ba_username'],
                    'ba_name' => $rowData['ba_name'],
                    'aoo_username' => $rowData['aoo_username'],
                    'aoo_name' => $rowData['aoo_name'],
                    'aom_username' => $rowData['aom_username'],
                    'aom_name' => $rowData['aom_name'],
                    'survey_code' => $rowData['survey_code'],
                    'question_name' => $rowData['question_name'],
                    'date' => $rowData['date'],
                ];

                // Initialize all questions with '-' as the default answer
                foreach ($uniqueQuestions as $questionText) {
                    $data[$key][$questionText] = '-';
                }
            }

            $data[$key][$question] = $answer;  // Assign answers to the corresponding question
        }
        fclose($handle);
    }

    // Save the transformed data to a new CSV file with semicolon as the delimiter
    $handle = fopen($outputFilename, 'w');

    // Print headers with underscores replaced by spaces
    $headers = [
        'store_code', 'store_name', 'latitude', 'longitude', 'kota', 'provinsi', 'region',
        'account_name', 'channel_name', 'role_name', 'ba_username', 'ba_name', 
        'aoo_username', 'aoo_name', 'aom_username', 'aom_name', 'survey_code', 'question_name', 'date'
    ];
    $headers = array_merge($headers, array_values($uniqueQuestions));  // Add questions to headers

    $headers = array_map(function($header) {
        return ucwords(str_replace('_', ' ', $header));  // Replace underscores with spaces in headers and capitalize the first letter of each word
    }, $headers);
    
    fputcsv($handle, $headers, $delimiter);

    // Print data
    foreach ($data as $key => $rowData) {
        fputcsv($handle, $rowData, $delimiter);
    }

    fclose($handle);

    echo "Data has been transposed, grouped by store and date, and sorted by question number. Hyperlink formulas are converted to URLs. Saved to $outputFilename.";
}

// Usage
transposeCSV('test.csv', 'csvfile_output.csv');
?>
