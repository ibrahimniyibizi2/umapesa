<?php
require_once '../models/Campaign.php';
require_once '../models/Contribution.php';

class CampaignController {
    private $db;
    private $campaign;
    private $contribution;

    public function __construct($database) {
        $this->db = $database;
        $this->campaign = new Campaign($this->db);
        $this->contribution = new Contribution($this->db);
    }

    // Create new campaign
    public function create($userId) {
        $data = json_decode(file_get_contents("php://input"));

        if (!$this->validateCampaignData($data)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid campaign data"));
            return;
        }

        // Set campaign properties
        $this->campaign->creator_id = $userId;
        $this->campaign->title = $data->title;
        $this->campaign->description = $data->description;
        $this->campaign->goal_amount = $data->goalAmount;
        $this->campaign->currency = $data->currency;
        $this->campaign->image_url = $data->imageUrl ?? null;
        $this->campaign->is_active = $data->isActive ?? true;
        $this->campaign->end_date = $data->endDate ?? null;
        $this->campaign->withdrawal_number = $data->withdrawalNumber ?? '';

        if ($this->campaign->create()) {
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Campaign created successfully",
                "campaignId" => $this->campaign->id
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to create campaign"));
        }
    }

    // Get all active campaigns
    public function getActive() {
        $stmt = $this->campaign->getActive();
        $campaigns = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $campaigns[] = array(
                "id" => $row['id'],
                "title" => $row['title'],
                "description" => $row['description'],
                "goalAmount" => floatval($row['goal_amount']),
                "raisedAmount" => floatval($row['raised_amount']),
                "currency" => $row['currency'],
                "imageUrl" => $row['image_url'],
                "isActive" => (bool)$row['is_active'],
                "endDate" => $row['end_date'],
                "creatorId" => $row['creator_id'],
                "creatorName" => $row['first_name'] . ' ' . $row['last_name'],
                "contributionCount" => intval($row['contribution_count']),
                "createdAt" => $row['created_at'],
                "contributions" => array()
            );
        }

        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "campaigns" => $campaigns
        ));
    }

    // Get campaign by ID
    public function getById($campaignId) {
        $this->campaign->id = $campaignId;
        
        if ($this->campaign->getById()) {
            // Get contributions for this campaign
            $this->contribution->campaign_id = $campaignId;
            $contributionStmt = $this->contribution->getByCampaignId();
            $contributions = array();

            while ($contribRow = $contributionStmt->fetch(PDO::FETCH_ASSOC)) {
                $contributions[] = array(
                    "id" => $contribRow['id'],
                    "campaignId" => $contribRow['campaign_id'],
                    "contributorName" => $contribRow['contributor_name'],
                    "contributorEmail" => $contribRow['contributor_email'],
                    "contributorPhone" => $contribRow['contributor_phone'],
                    "amount" => floatval($contribRow['amount']),
                    "currency" => $contribRow['currency'],
                    "isAnonymous" => (bool)$contribRow['is_anonymous'],
                    "message" => $contribRow['message'],
                    "paymentStatus" => $contribRow['payment_status'],
                    "paymentMethod" => $contribRow['payment_method'],
                    "createdAt" => $contribRow['created_at']
                );
            }

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "campaign" => array(
                    "id" => $this->campaign->id,
                    "title" => $this->campaign->title,
                    "description" => $this->campaign->description,
                    "goalAmount" => floatval($this->campaign->goal_amount),
                    "raisedAmount" => floatval($this->campaign->raised_amount),
                    "currency" => $this->campaign->currency,
                    "imageUrl" => $this->campaign->image_url,
                    "isActive" => (bool)$this->campaign->is_active,
                    "endDate" => $this->campaign->end_date,
                    "creatorId" => $this->campaign->creator_id,
                    "createdAt" => $this->campaign->created_at,
                    "contributions" => $contributions
                )
            ));
        } else {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Campaign not found"));
        }
    }

    // Update campaign
    public function update($campaignId, $userId) {
        $data = json_decode(file_get_contents("php://input"));

        // Check if campaign exists and user is the creator
        $this->campaign->id = $campaignId;
        if (!$this->campaign->getById()) {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Campaign not found"));
            return;
        }

        if ($this->campaign->creator_id != $userId) {
            http_response_code(403);
            echo json_encode(array("success" => false, "message" => "You can only update your own campaigns"));
            return;
        }

        // Update campaign properties
        if (isset($data->title)) $this->campaign->title = $data->title;
        if (isset($data->description)) $this->campaign->description = $data->description;
        if (isset($data->goalAmount)) $this->campaign->goal_amount = $data->goalAmount;
        if (isset($data->currency)) $this->campaign->currency = $data->currency;
        if (isset($data->imageUrl)) $this->campaign->image_url = $data->imageUrl;
        if (isset($data->isActive)) $this->campaign->is_active = $data->isActive;
        if (isset($data->endDate)) $this->campaign->end_date = $data->endDate;
        if (isset($data->withdrawalNumber)) $this->campaign->withdrawal_number = $data->withdrawalNumber;

        if ($this->campaign->update()) {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Campaign updated successfully"
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to update campaign"));
        }
    }

    // Contribute to campaign
    public function contribute($campaignId) {
        $data = json_decode(file_get_contents("php://input"));

        if (!$this->validateContributionData($data)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid contribution data"));
            return;
        }

        // Check if campaign exists and is active
        $this->campaign->id = $campaignId;
        if (!$this->campaign->getById() || !$this->campaign->is_active) {
            http_response_code(404);
            echo json_encode(array("success" => false, "message" => "Campaign not found or inactive"));
            return;
        }

        // Set contribution properties
        $this->contribution->campaign_id = $campaignId;
        $this->contribution->contributor_name = $data->contributorName;
        $this->contribution->contributor_email = $data->contributorEmail ?? '';
        $this->contribution->contributor_phone = $data->contributorPhone;
        $this->contribution->amount = $data->amount;
        $this->contribution->currency = $data->currency;
        $this->contribution->is_anonymous = $data->isAnonymous ?? false;
        $this->contribution->message = $data->message ?? '';
        $this->contribution->payment_method = $data->paymentMethod ?? 'nhonga';
        $this->contribution->payment_status = 'pending'; // Will be updated after payment processing

        if ($this->contribution->create()) {
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Contribution created successfully",
                "contributionId" => $this->contribution->id
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to create contribution"));
        }
    }

    // Validate contribution data
    private function validateContributionData($data) {
        return isset($data->contributorName) && 
               isset($data->contributorPhone) && 
               isset($data->amount) && 
               isset($data->currency) &&
               $data->amount > 0 &&
               in_array($data->currency, ['MZN', 'RWF']);
    }

    // Validate transaction data
    private function validateTransactionData($data) {
        return isset($data->recipientName) && 
               isset($data->recipientEmail) && 
               isset($data->recipientPhone) && 
               isset($data->recipientCountry) && 
               isset($data->amount) && 
               isset($data->currency) && 
               isset($data->convertedCurrency) &&
               filter_var($data->recipientEmail, FILTER_VALIDATE_EMAIL) &&
               $data->amount >= 100 &&
               in_array($data->currency, ['MZN', 'RWF']) &&
               in_array($data->convertedCurrency, ['MZN', 'RWF']) &&
               in_array($data->recipientCountry, ['mozambique', 'rwanda']);
    }

        // Validate campaign data
    private function validateCampaignData($data) {
        if (empty($data->title) || strlen($data->title) < 10) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Campaign title must be at least 10 characters long"));
            return false;
        }
        
        if (empty($data->description) || strlen($data->description) < 50) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Campaign description must be at least 50 characters long"));
            return false;
        }
        
        if (!isset($data->goalAmount) || $data->goalAmount <= 0) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Goal amount must be greater than 0"));
            return false;
        }
        
        if (empty($data->currency) || !in_array($data->currency, ['MZN', 'RWF'])) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid currency"));
            return false;
        }
        
        // Validate withdrawal number if provided
        if (!empty($data->withdrawalNumber) && !preg_match('/^\d{8,15}$/', $data->withdrawalNumber)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid withdrawal number format. Please enter a valid phone number (8-15 digits)."));
            return false;
        }
        
        return true;
    }
}
?>