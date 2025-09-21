<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $email;
    public $password_hash;
    public $first_name;
    public $last_name;
    public $phone;
    public $country;
    public $role;
    public $is_verified;
    public $kyc_status;
    public $account_number;
    public $total_transactions;
    public $total_volume;
    public $status;
    public $last_login;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Register new user
    public function register() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET email=:email, password_hash=:password_hash, first_name=:first_name, 
                      last_name=:last_name, phone=:phone, country=:country, 
                      account_number=:account_number";
        
        $stmt = $this->conn->prepare($query);

        // Generate account number
        $this->account_number = $this->generateAccountNumber();

        // Sanitize and bind values
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->country = htmlspecialchars(strip_tags($this->country));

        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":country", $this->country);
        $stmt->bindParam(":account_number", $this->account_number);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Login user
    public function login() {
        $query = "SELECT id, email, password_hash, first_name, last_name, phone, country, 
                         role, is_verified, kyc_status, account_number, total_transactions, 
                         total_volume, status, created_at 
                  FROM " . $this->table_name . " 
                  WHERE email = :email AND status = 'active' LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($this->password_hash, $row['password_hash'])) {
                // Update last login
                $this->updateLastLogin($row['id']);
                
                // Set user properties
                $this->id = $row['id'];
                $this->first_name = $row['first_name'];
                $this->last_name = $row['last_name'];
                $this->phone = $row['phone'];
                $this->country = $row['country'];
                $this->role = $row['role'];
                $this->is_verified = $row['is_verified'];
                $this->kyc_status = $row['kyc_status'];
                $this->account_number = $row['account_number'];
                $this->total_transactions = $row['total_transactions'];
                $this->total_volume = $row['total_volume'];
                $this->status = $row['status'];
                $this->created_at = $row['created_at'];
                
                return true;
            }
        }
        return false;
    }

    // Get user by ID
    public function getById() {
        $query = "SELECT id, email, first_name, last_name, phone, country, role, 
                         is_verified, kyc_status, account_number, total_transactions, 
                         total_volume, status, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->email = $row['email'];
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->phone = $row['phone'];
            $this->country = $row['country'];
            $this->role = $row['role'];
            $this->is_verified = $row['is_verified'];
            $this->kyc_status = $row['kyc_status'];
            $this->account_number = $row['account_number'];
            $this->total_transactions = $row['total_transactions'];
            $this->total_volume = $row['total_volume'];
            $this->status = $row['status'];
            $this->created_at = $row['created_at'];
            return true;
        }
        return false;
    }

    // Update user profile
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET first_name=:first_name, last_name=:last_name, phone=:phone, 
                      country=:country, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);

        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->country = htmlspecialchars(strip_tags($this->country));

        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":country", $this->country);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Get all users (admin only)
    public function getAll() {
        $query = "SELECT id, email, first_name, last_name, phone, country, role, 
                         is_verified, kyc_status, account_number, total_transactions, 
                         total_volume, status, created_at, last_login 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Update user status (admin only)
    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    // Update KYC status (admin only)
    public function updateKycStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET kyc_status=:kyc_status, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":kyc_status", $this->kyc_status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    // Check if email exists
    public function emailExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    // Generate unique account number
    private function generateAccountNumber() {
        do {
            $number = 'UMP' . str_pad(mt_rand(1, 999999999), 9, '0', STR_PAD_LEFT);
            $query = "SELECT id FROM " . $this->table_name . " WHERE account_number = :account_number LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":account_number", $number);
            $stmt->execute();
        } while ($stmt->rowCount() > 0);
        
        return $number;
    }

    // Update last login timestamp
    private function updateLastLogin($userId) {
        $query = "UPDATE " . $this->table_name . " 
                  SET last_login=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $userId);
        $stmt->execute();
    }
}
?>