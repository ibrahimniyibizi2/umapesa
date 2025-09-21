<?php
require_once '../models/User.php';
require_once '../utils/JWT.php';

class AuthController {
    private $db;
    private $user;

    public function __construct($database) {
        $this->db = $database;
        $this->user = new User($this->db);
    }

    // User registration
    public function register() {
        $data = json_decode(file_get_contents("php://input"));

        if (!$this->validateRegistrationData($data)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid registration data"));
            return;
        }

        // Check if email already exists
        $this->user->email = $data->email;
        if ($this->user->emailExists()) {
            http_response_code(409);
            echo json_encode(array("success" => false, "message" => "Email already exists"));
            return;
        }

        // Set user properties
        $this->user->email = $data->email;
        $this->user->password_hash = password_hash($data->password, PASSWORD_DEFAULT);
        $this->user->first_name = $data->firstName;
        $this->user->last_name = $data->lastName;
        $this->user->phone = $data->phone;
        $this->user->country = $data->country;

        if ($this->user->register()) {
            // Generate JWT token
            $token = JWT::encode(array(
                "user_id" => $this->user->id,
                "email" => $this->user->email,
                "role" => $this->user->role,
                "exp" => time() + (24 * 60 * 60) // 24 hours
            ));

            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "User registered successfully",
                "token" => $token,
                "user" => array(
                    "id" => $this->user->id,
                    "email" => $this->user->email,
                    "firstName" => $this->user->first_name,
                    "lastName" => $this->user->last_name,
                    "phone" => $this->user->phone,
                    "country" => $this->user->country,
                    "role" => $this->user->role,
                    "isVerified" => $this->user->is_verified,
                    "kycStatus" => $this->user->kyc_status,
                    "accountNumber" => $this->user->account_number,
                    "createdAt" => $this->user->created_at
                )
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to register user"));
        }
    }

    // User login
    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->email) || !isset($data->password)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Email and password required"));
            return;
        }

        $this->user->email = $data->email;
        $this->user->password_hash = $data->password;

        if ($this->user->login()) {
            // Generate JWT token
            $token = JWT::encode(array(
                "user_id" => $this->user->id,
                "email" => $this->user->email,
                "role" => $this->user->role,
                "exp" => time() + (24 * 60 * 60) // 24 hours
            ));

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Login successful",
                "token" => $token,
                "user" => array(
                    "id" => $this->user->id,
                    "email" => $this->user->email,
                    "firstName" => $this->user->first_name,
                    "lastName" => $this->user->last_name,
                    "phone" => $this->user->phone,
                    "country" => $this->user->country,
                    "role" => $this->user->role,
                    "isVerified" => $this->user->is_verified,
                    "kycStatus" => $this->user->kyc_status,
                    "accountNumber" => $this->user->account_number,
                    "createdAt" => $this->user->created_at
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid email or password"));
        }
    }

    // Get user profile
    public function getProfile($userId) {
        $this->user->id = $userId;
        
        if ($this->user->getById()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "user" => array(
                    "id" => $this->user->id,
                    "email" => $this->user->email,
                    "firstName" => $this->user->first_name,
                    "lastName" => $this->user->last_name,
                    "phone" => $this->user->phone,
                    "country" => $this->user->country,
                    "role" => $this->user->role,
                    "isVerified" => $this->user->is_verified,
                    "kycStatus" => $this->user->kyc_status,
                    "accountNumber" => $this->user->account_number,
                    "totalTransactions" => $this->user->total_transactions,
                    "totalVolume" => $this->user->total_volume,
                    "status" => $this->user->status,
                    "createdAt" => $this->user->created_at
                )
            ));
        } else {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "User not found"));
        }
    }

    // Update user profile
    public function updateProfile($userId) {
        $data = json_decode(file_get_contents("php://input"));

        $this->user->id = $userId;
        $this->user->first_name = $data->firstName;
        $this->user->last_name = $data->lastName;
        $this->user->phone = $data->phone;
        $this->user->country = $data->country;

        if ($this->user->update()) {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Profile updated successfully"));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to update profile"));
        }
    }

    // Validate registration data
    private function validateRegistrationData($data) {
        return isset($data->email) && 
               isset($data->password) && 
               isset($data->firstName) && 
               isset($data->lastName) && 
               isset($data->phone) && 
               isset($data->country) &&
               filter_var($data->email, FILTER_VALIDATE_EMAIL) &&
               strlen($data->password) >= 8 &&
               in_array($data->country, ['mozambique', 'rwanda']);
    }
}
?>