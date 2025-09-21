<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection and authentication
require_once 'config/database.php';
require_once 'middleware/AuthMiddleware.php';

// Initialize response array
$response = [
    'success' => false,
    'message' => 'File upload failed',
    'imageUrl' => ''
];

try {
    // Check if the request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get the authorization header
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    // Validate the token
    $auth = new AuthMiddleware($db);
    $user = $auth->validateToken($token);
    
    if (!$user) {
        throw new Exception('Unauthorized');
    }

    // Check if file was uploaded without errors
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred');
    }

    $file = $_FILES['image'];
    
    // Validate file size (5MB max)
    $maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($file['size'] > $maxFileSize) {
        throw new Exception('File size exceeds the 5MB limit');
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($fileInfo, $file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Only JPG, PNG, and GIF files are allowed');
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/uploads/campaigns/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Generate a unique filename
    $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = 'campaign_' . uniqid() . '_' . time() . '.' . $fileExt;
    $filePath = $uploadDir . $fileName;
    
    // Move the uploaded file to the uploads directory
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Generate the URL to access the file
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://$_SERVER[HTTP_HOST]";
        $relativePath = '/php-backend/uploads/campaigns/' . $fileName;
        $imageUrl = $baseUrl . $relativePath;
        
        $response = [
            'success' => true,
            'message' => 'File uploaded successfully',
            'imageUrl' => $imageUrl
        ];
    } else {
        throw new Exception('Failed to move uploaded file');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    $response['message'] = $e->getMessage();
}

// Return the JSON response
echo json_encode($response);
?>
