<?php
class FeeCalculator {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function calculate($amount) {
        $query = "SELECT fee_type, fee_value FROM fee_structures 
                  WHERE :amount BETWEEN min_amount AND max_amount 
                  AND is_active = 1 
                  ORDER BY min_amount ASC 
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":amount", $amount);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row['fee_type'] === 'percentage') {
                return $amount * ($row['fee_value'] / 100);
            } else {
                return $row['fee_value'];
            }
        }

        // Default fee if no structure found
        if ($amount >= 100 && $amount < 1000) {
            return 150;
        } elseif ($amount >= 1000) {
            return $amount * 0.10;
        }
        
        return 0;
    }
}
?>