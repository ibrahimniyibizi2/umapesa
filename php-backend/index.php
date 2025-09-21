<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: https://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include required files based on endpoint
require_once 'config/database.php';

// Get database connection (only when needed for non-public endpoints)
$db = null;

// Get the requested URI and method
$request_uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$script_name = explode('/', trim($_SERVER['SCRIPT_NAME'], '/'));
$uri_segments = array_diff($request_uri, $script_name);
$uri_segments = array_values($uri_segments);

$method = $_SERVER['REQUEST_METHOD'];

// Basic routing logic
try {
    if (isset($uri_segments[0]) && $uri_segments[0] === 'api') {
        $resource = $uri_segments[1] ?? null;
        $id = $uri_segments[2] ?? null;
        $action = $uri_segments[3] ?? null;

        switch ($resource) {
            case 'auth':
                // Get database connection for auth endpoints
                try {
                    $database = new Database();
                    $db = $database->getConnection();
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Database connection failed"));
                    exit();
                }
                require_once 'controllers/AuthController.php';
                require_once 'middleware/AuthMiddleware.php';
                require_once 'utils/JWT.php';
                $authController = new AuthController($db);
                
                switch ($action) {
                    case 'register':
                        if ($method === 'POST') {
                            $authController->register();
                        } else {
                            http_response_code(405);
                            echo json_encode(array("success" => false, "message" => "Method not allowed"));
                        }
                        break;
                        
                    case 'login':
                        if ($method === 'POST') {
                            $authController->login();
                        } else {
                            http_response_code(405);
                            echo json_encode(array("success" => false, "message" => "Method not allowed"));
                        }
                        break;
                        
                    case 'profile':
                        $user = AuthMiddleware::authenticate();
                        
                        if ($method === 'GET') {
                            $authController->getProfile($user['user_id']);
                        } elseif ($method === 'PUT') {
                            $authController->updateProfile($user['user_id']);
                        } else {
                            http_response_code(405);
                            echo json_encode(array("success" => false, "message" => "Method not allowed"));
                        }
                        break;
                        
                    default:
                        http_response_code(404);
                        echo json_encode(array("success" => false, "message" => "Auth endpoint not found"));
                        break;
                }
                break;

            case 'transactions':
                // Get database connection for transaction endpoints
                try {
                    $database = new Database();
                    $db = $database->getConnection();
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Database connection failed"));
                    exit();
                }
                require_once 'controllers/TransactionController.php';
                require_once 'middleware/AuthMiddleware.php';
                require_once 'utils/JWT.php';
                $transactionController = new TransactionController($db);
                
                if ($method === 'GET' && !$id) {
                    // Get user transactions
                    $user = AuthMiddleware::authenticate();
                    $transactionController->getUserTransactions($user['user_id'], $user['email']);
                } elseif ($method === 'POST' && !$id) {
                    // Create new transaction
                    $user = AuthMiddleware::authenticate();
                    $transactionController->create($user['user_id']);
                } elseif ($method === 'PUT' && $id && $action === 'status') {
                    // Update transaction status
                    AuthMiddleware::authenticate();
                    $transactionController->updateStatus($id);
                } elseif ($method === 'GET' && $id === 'all') {
                    // Get all transactions (admin only)
                    AuthMiddleware::requireAdmin();
                    $transactionController->getAll();
                } else {
                    http_response_code(404);
                    echo json_encode(array("success" => false, "message" => "Transaction endpoint not found"));
                }
                break;

            case 'campaigns':
                // Get database connection for campaign endpoints
                try {
                    $database = new Database();
                    $db = $database->getConnection();
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(array("success" => false, "message" => "Database connection failed"));
                    exit();
                }
                require_once 'controllers/CampaignController.php';
                require_once 'middleware/AuthMiddleware.php';
                require_once 'utils/JWT.php';
                $campaignController = new CampaignController($db);
                
                if ($method === 'GET' && !$id) {
                    // Get all active campaigns (public)
                    $campaignController->getActive();
                } elseif ($method === 'GET' && $id) {
                    // Get campaign by ID (public)
                    $campaignController->getById($id);
                } elseif ($method === 'POST' && !$id) {
                    // Create new campaign
                    $user = AuthMiddleware::authenticate();
                    $campaignController->create($user['user_id']);
                } elseif ($method === 'POST' && $id && $action === 'contribute') {
                    // Contribute to campaign (public)
                    $campaignController->contribute($id);
                } elseif ($method === 'PUT' && $id) {
                    // Update campaign
                    $user = AuthMiddleware::authenticate();
                    $campaignController->update($id, $user['user_id']);
                } else {
                    http_response_code(404);
                    echo json_encode(array("success" => false, "message" => "Campaign endpoint not found"));
                }
                break;

            case 'exchange-rates':
                require_once 'utils/ExchangeRateService.php';
                if ($method === 'GET') {
                    // For now, return static rates since database might not be available
                    $rates = array(
                        "MZN_to_RWF" => 18.5,
                        "RWF_to_MZN" => 0.054
                    );
                    
                    // Try to get from database if available
                    if ($db) {
                        try {
                            $exchangeService = new ExchangeRateService($db);
                            $dbRates = $exchangeService->getAllRates();
                            if (!empty($dbRates)) {
                                $rates = array(
                                    "MZN_to_RWF" => $exchangeService->getRate('MZN', 'RWF'),
                                    "RWF_to_MZN" => $exchangeService->getRate('RWF', 'MZN')
                                );
                            }
                        } catch (Exception $e) {
                            // Fall back to static rates
                            error_log("Exchange rate service error: " . $e->getMessage());
                        }
                    }
                    
                    http_response_code(200);
                    echo json_encode(array(
                        "success" => true,
                        "rates" => $rates
                    ));
                } else {
                    http_response_code(405);
                    echo json_encode(array("success" => false, "message" => "Method not allowed"));
                }
                break;

            default:
                http_response_code(404);
                echo json_encode(array("success" => false, "message" => "API endpoint not found"));
                break;
        }
    } else {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "API not found"));
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Internal server error"));
}
?>