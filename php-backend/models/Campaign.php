<?php
class Campaign {
    private $conn;
    private $table_name = "campaigns";

    public $id;
    public $creator_id;
    public $title;
    public $description;
    public $goal_amount;
    public $raised_amount;
    public $currency;
    public $image_url;
    public $is_active;
    public $end_date;
    public $meta_title;
    public $meta_description;
    public $meta_image;
    public $withdrawal_number;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create new campaign
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET creator_id=:creator_id, title=:title, description=:description,
                      goal_amount=:goal_amount, currency=:currency, image_url=:image_url,
                      is_active=:is_active, end_date=:end_date, meta_title=:meta_title,
                      meta_description=:meta_description, meta_image=:meta_image,
                      withdrawal_number=:withdrawal_number";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize data
        $this->creator_id = htmlspecialchars(strip_tags($this->creator_id));
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->image_url = htmlspecialchars(strip_tags($this->image_url));

        // Generate meta tags
        $this->meta_title = $this->meta_title ?: "Help " . $this->title . " - UmaPesa Crowdfunding";
        $this->meta_description = $this->meta_description ?: substr($this->description, 0, 160) . "...";
        $this->meta_image = $this->meta_image ?: $this->image_url;

        // Bind values
        $stmt->bindParam(":creator_id", $this->creator_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":goal_amount", $this->goal_amount);
        $stmt->bindParam(":currency", $this->currency);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":is_active", $this->is_active);
        $stmt->bindParam(":end_date", $this->end_date);
        $stmt->bindParam(":meta_title", $this->meta_title);
        $stmt->bindParam(":meta_description", $this->meta_description);
        $stmt->bindParam(":meta_image", $this->meta_image);
        $stmt->bindParam(":withdrawal_number", $this->withdrawal_number);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Get all active campaigns
    public function getActive() {
        $query = "SELECT c.*, u.first_name, u.last_name,
                         (SELECT COUNT(*) FROM contributions WHERE campaign_id = c.id AND payment_status = 'completed') as contribution_count
                  FROM " . $this->table_name . " c
                  LEFT JOIN users u ON c.creator_id = u.id
                  WHERE c.is_active = 1
                  ORDER BY c.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Get campaign by ID with contributions
    public function getById() {
        $query = "SELECT c.*, u.first_name, u.last_name,
                         (SELECT COUNT(*) FROM contributions WHERE campaign_id = c.id AND payment_status = 'completed') as contribution_count,
                         (SELECT SUM(amount) FROM contributions WHERE campaign_id = c.id AND payment_status = 'completed') as actual_raised_amount
                  FROM " . $this->table_name . " c
                  LEFT JOIN users u ON c.creator_id = u.id
                  WHERE c.id = :id LIMIT 1";
        
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

    // Get campaigns by creator ID
    public function getByCreatorId() {
        $query = "SELECT c.*,
                         (SELECT COUNT(*) FROM contributions WHERE campaign_id = c.id AND payment_status = 'completed') as contribution_count
                  FROM " . $this->table_name . " c
                  WHERE c.creator_id = :creator_id
                  ORDER BY c.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":creator_id", $this->creator_id);
        $stmt->execute();
        return $stmt;
    }

    // Update campaign
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET title=:title, description=:description, goal_amount=:goal_amount,
                      currency=:currency, image_url=:image_url, is_active=:is_active,
                      end_date=:end_date, withdrawal_number=:withdrawal_number,
                      updated_at=CURRENT_TIMESTAMP
                  WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->image_url = htmlspecialchars(strip_tags($this->image_url));

        // Bind values
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":goal_amount", $this->goal_amount);
        $stmt->bindParam(":currency", $this->currency);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":is_active", $this->is_active);
        $stmt->bindParam(":end_date", $this->end_date);
        $stmt->bindParam(":withdrawal_number", $this->withdrawal_number);

        return $stmt->execute();
    }

    // Map database row to object properties
    private function mapRowToProperties($row) {
        $this->creator_id = $row['creator_id'];
        $this->title = $row['title'];
        $this->description = $row['description'];
        $this->goal_amount = $row['goal_amount'];
        $this->raised_amount = $row['raised_amount'];
        $this->currency = $row['currency'];
        $this->image_url = $row['image_url'];
        $this->is_active = $row['is_active'];
        $this->end_date = $row['end_date'];
        $this->meta_title = $row['meta_title'];
        $this->meta_description = $row['meta_description'];
        $this->meta_image = $row['meta_image'];
        $this->created_at = $row['created_at'];
        $this->updated_at = $row['updated_at'];
    }
}
?>