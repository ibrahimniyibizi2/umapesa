<?php
class Contribution {
    private $conn;
    private $table_name = "contributions";

    public $id;
    public $campaign_id;
    public $contributor_name;
    public $contributor_email;
    public $contributor_phone;
    public $amount;
    public $currency;
    public $is_anonymous;
    public $message;
    public $payment_status;
    public $payment_method;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create new contribution
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET campaign_id=:campaign_id, contributor_name=:contributor_name,
                      contributor_email=:contributor_email, contributor_phone=:contributor_phone,
                      amount=:amount, currency=:currency, is_anonymous=:is_anonymous,
                      message=:message, payment_method=:payment_method";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize data
        $this->campaign_id = htmlspecialchars(strip_tags($this->campaign_id));
        $this->contributor_name = htmlspecialchars(strip_tags($this->contributor_name));
        $this->contributor_email = htmlspecialchars(strip_tags($this->contributor_email));
        $this->contributor_phone = htmlspecialchars(strip_tags($this->contributor_phone));
        $this->message = htmlspecialchars(strip_tags($this->message));
        $this->payment_method = htmlspecialchars(strip_tags($this->payment_method));

        // Bind values
        $stmt->bindParam(":campaign_id", $this->campaign_id);
        $stmt->bindParam(":contributor_name", $this->contributor_name);
        $stmt->bindParam(":contributor_email", $this->contributor_email);
        $stmt->bindParam(":contributor_phone", $this->contributor_phone);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":currency", $this->currency);
        $stmt->bindParam(":is_anonymous", $this->is_anonymous);
        $stmt->bindParam(":message", $this->message);
        $stmt->bindParam(":payment_method", $this->payment_method);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            
            // Update campaign raised amount
            $this->updateCampaignRaisedAmount();
            
            return true;
        }
        return false;
    }

    // Get contributions by campaign ID
    public function getByCampaignId() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE campaign_id = :campaign_id AND payment_status = 'completed'
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":campaign_id", $this->campaign_id);
        $stmt->execute();
        
        return $stmt;
    }

    // Update payment status
    public function updatePaymentStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET payment_status=:payment_status, updated_at=CURRENT_TIMESTAMP 
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":payment_status", $this->payment_status);
        $stmt->bindParam(":id", $this->id);
        
        if ($stmt->execute()) {
            // Update campaign raised amount if payment completed
            if ($this->payment_status === 'completed') {
                $this->updateCampaignRaisedAmount();
            }
            return true;
        }
        return false;
    }

    // Update campaign raised amount
    private function updateCampaignRaisedAmount() {
        $query = "UPDATE campaigns 
                  SET raised_amount = (
                      SELECT COALESCE(SUM(amount), 0) 
                      FROM contributions 
                      WHERE campaign_id = :campaign_id AND payment_status = 'completed'
                  ), updated_at = CURRENT_TIMESTAMP
                  WHERE id = :campaign_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":campaign_id", $this->campaign_id);
        $stmt->execute();
    }
}
?>