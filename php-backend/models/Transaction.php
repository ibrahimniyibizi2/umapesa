<?php
class Transaction {
    private $conn;
    private $table_name = "transactions";

    public $id;
    public $sender_id;
    public $recipient_name;
    public $recipient_email;
    public $recipient_phone;
    public $recipient_country;
    public $amount;
    public $currency;
    public $converted_amount;
    public $converted_currency;
    public $exchange_rate;
    public $fee;
    public $total_amount;
    public $status;
    public $type;
    public $reference;
    public $description;
    public $payment_method;
    public $payment_method_fee;
    public $created_at;
    public $completed_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create new transaction
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET sender_id=:sender_id, recipient_name=:recipient_name, 
                      recipient_email=:recipient_email, recipient_phone=:recipient_phone,
                      recipient_country=:recipient_country, amount=:amount, currency=:currency,
                      converted_amount=:converted_amount, converted_currency=:converted_currency,
                      exchange_rate=:exchange_rate, fee=:fee, total_amount=:total_amount,
                      reference=:reference, description=:description, payment_method=:payment_method,
                      payment_method_fee=:payment_method_fee";
        
        $stmt = $this->conn->prepare($query);

        // Generate unique reference
        $this->reference = $this->generateReference();

        // Sanitize data
        $this->sender_id = htmlspecialchars(strip_tags($this->sender_id));
        $this->recipient_name = htmlspecialchars(strip_tags($this->recipient_name));
        $this->recipient_email = htmlspecialchars(strip_tags($this->recipient_email));
        $this->recipient_phone = htmlspecialchars(strip_tags($this->recipient_phone));
        $this->recipient_country = htmlspecialchars(strip_tags($this->recipient_country));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->payment_method = htmlspecialchars(strip_tags($this->payment_method));

        // Bind values
        $stmt->bindParam(":sender_id", $this->sender_id);
        $stmt->bindParam(":recipient_name", $this->recipient_name);
        $stmt->bindParam(":recipient_email", $this->recipient_email);
        $stmt->bindParam(":recipient_phone", $this->recipient_phone);
        $stmt->bindParam(":recipient_country", $this->recipient_country);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":currency", $this->currency);
        $stmt->bindParam(":converted_amount", $this->converted_amount);
        $stmt->bindParam(":converted_currency", $this->converted_currency);
        $stmt->bindParam(":exchange_rate", $this->exchange_rate);
        $stmt->bindParam(":fee", $this->fee);
        $stmt->bindParam(":total_amount", $this->total_amount);
        $stmt->bindParam(":reference", $this->reference);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":payment_method", $this->payment_method);
        $stmt->bindParam(":payment_method_fee", $this->payment_method_fee);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Get transactions by user ID
    public function getByUserId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE sender_id = :sender_id OR recipient_email = :recipient_email 
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":sender_id", $this->sender_id);
        $stmt->bindParam(":recipient_email", $this->recipient_email);
        $stmt->execute();
        
        return $stmt;
    }

    // Get transaction by ID
    public function getById() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapRowToProperties($row);
            return true;
        }
        return false;
    }

    // Update transaction status
    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status, updated_at=CURRENT_TIMESTAMP";
        
        if ($this->status === 'completed') {
            $query .= ", completed_at=CURRENT_TIMESTAMP";
        }
        
        $query .= " WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }

    // Get all transactions (admin only)
    public function getAll() {
        $query = "SELECT t.*, u.first_name as sender_first_name, u.last_name as sender_last_name 
                  FROM " . $this->table_name . " t 
                  LEFT JOIN users u ON t.sender_id = u.id 
                  ORDER BY t.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Generate unique reference number
    private function generateReference() {
        do {
            $date = date('Ymd');
            $number = 'UMP' . $date . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
            $query = "SELECT id FROM " . $this->table_name . " WHERE reference = :reference LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":reference", $number);
            $stmt->execute();
        } while ($stmt->rowCount() > 0);
        
        return $number;
    }

    // Map database row to object properties
    private function mapRowToProperties($row) {
        $this->sender_id = $row['sender_id'];
        $this->recipient_name = $row['recipient_name'];
        $this->recipient_email = $row['recipient_email'];
        $this->recipient_phone = $row['recipient_phone'];
        $this->recipient_country = $row['recipient_country'];
        $this->amount = $row['amount'];
        $this->currency = $row['currency'];
        $this->converted_amount = $row['converted_amount'];
        $this->converted_currency = $row['converted_currency'];
        $this->exchange_rate = $row['exchange_rate'];
        $this->fee = $row['fee'];
        $this->total_amount = $row['total_amount'];
        $this->status = $row['status'];
        $this->type = $row['type'];
        $this->reference = $row['reference'];
        $this->description = $row['description'];
        $this->payment_method = $row['payment_method'];
        $this->payment_method_fee = $row['payment_method_fee'];
        $this->created_at = $row['created_at'];
        $this->completed_at = $row['completed_at'];
        $this->updated_at = $row['updated_at'];
    }
}
?>