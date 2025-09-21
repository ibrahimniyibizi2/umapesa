<?php
require_once '../utils/JWT.php';

class AuthMiddleware {
    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Authorization header missing"));
            exit();
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid authorization format"));
            exit();
        }

        $jwt = $matches[1];
        $decoded = JWT::decode($jwt);

        if (!$decoded) {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Invalid or expired token"));
            exit();
        }

        return $decoded;
    }

    public static function requireAdmin() {
        $user = self::authenticate();
        
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(array("success" => false, "message" => "Admin access required"));
            exit();
        }

        return $user;
    }

    public static function optionalAuth() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            return null;
        }

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }

        $jwt = $matches[1];
        return JWT::decode($jwt);
    }
}
?>