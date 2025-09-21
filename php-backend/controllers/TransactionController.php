<?php
require_once '../models/Transaction.php';
require_once '../utils/FeeCalculator.php';
require_once '../utils/ExchangeRateService.php';

class TransactionController {
    private $db;
    private $transaction;

    public function __construct($database) {
        $this->db = $database;
        $this->transaction = new Transaction($this->db);
    }

    // Create new transaction
    public function create($userId) {
        $data = json_decode(file_get_contents("php://input"));

        if (!$this->validateTransactionData($data)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Invalid transaction data"));
            return;
        }

        // Calculate fees and exchange rates
        $feeCalculator = new FeeCalculator($this->db);
        $exchangeService = new ExchangeRateService($this->db);

        $fee = $feeCalculator->calculate($data->amount);
        $exchangeRate = $exchangeService->getRate($data->currency, $data->convertedCurrency);
        $convertedAmount = $data->amount * $exchangeRate;

        // Set transaction properties
        $this->transaction->sender_id = $userId;
        $this->transaction->recipient_name = $data->recipientName;
        $this->transaction->recipient_email = $data->recipientEmail;
        $this->transaction->recipient_phone = $data->recipientPhone;
        $this->transaction->recipient_country = $data->recipientCountry;
        $this->transaction->amount = $data->amount;
        $this->transaction->currency = $data->currency;
        $this->transaction->converted_amount = $convertedAmount;
        $this->transaction->converted_currency = $data->convertedCurrency;
        $this->transaction->exchange_rate = $exchangeRate;
        $this->transaction->fee = $fee;
        $this->transaction->total_amount = $data->amount + $fee;
        $this->transaction->description = $data->description;
        $this->transaction->payment_method = $data->paymentMethod;
        $this->transaction->payment_method_fee = $data->paymentMethodFee ?? 0;

        if ($this->transaction->create()) {
            http_response_code(201);
            echo json_encode(array(
                "success" => true,
                "message" => "Transaction created successfully",
                "transaction" => array(
                    "id" => $this->transaction->id,
                    "reference" => $this->transaction->reference,
                    "amount" => $this->transaction->amount,
                    "currency" => $this->transaction->currency,
                    "convertedAmount" => $this->transaction->converted_amount,
                    "convertedCurrency" => $this->transaction->converted_currency,
                    "fee" => $this->transaction->fee,
                    "totalAmount" => $this->transaction->total_amount,
                    "status" => "pending"
                )
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to create transaction"));
        }
    }

    // Get user transactions
    public function getUserTransactions($userId, $userEmail) {
        $this->transaction->sender_id = $userId;
        $this->transaction->recipient_email = $userEmail;
        
        $stmt = $this->transaction->getByUserId();
        $transactions = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $transactions[] = array(
                "id" => $row['id'],
                "senderId" => $row['sender_id'],
                "recipientName" => $row['recipient_name'],
                "recipientEmail" => $row['recipient_email'],
                "recipientPhone" => $row['recipient_phone'],
                "recipientCountry" => $row['recipient_country'],
                "amount" => floatval($row['amount']),
                "currency" => $row['currency'],
                "convertedAmount" => floatval($row['converted_amount']),
                "convertedCurrency" => $row['converted_currency'],
                "exchangeRate" => floatval($row['exchange_rate']),
                "fee" => floatval($row['fee']),
                "totalAmount" => floatval($row['total_amount']),
                "status" => $row['status'],
                "type" => $row['type'],
                "reference" => $row['reference'],
                "description" => $row['description'],
                "paymentMethod" => $row['payment_method'],
                "paymentMethodFee" => floatval($row['payment_method_fee']),
                "createdAt" => $row['created_at'],
                "completedAt" => $row['completed_at'],
                "updatedAt" => $row['updated_at']
            );
        }

        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "transactions" => $transactions
        ));
    }

    // Update transaction status
    public function updateStatus($transactionId) {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->status)) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Status is required"));
            return;
        }

        $this->transaction->id = $transactionId;
        $this->transaction->status = $data->status;

        if ($this->transaction->updateStatus()) {
            http_response_code(200);
            echo json_encode(array("success" => true, "message" => "Transaction status updated"));
        } else {
            http_response_code(503);
            echo json_encode(array("success" => false, "message" => "Unable to update transaction status"));
        }
    }

    // Get all transactions (admin only)
    public function getAll() {
        $stmt = $this->transaction->getAll();
        $transactions = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $transactions[] = array(
                "id" => $row['id'],
                "senderId" => $row['sender_id'],
                "senderName" => $row['sender_first_name'] . ' ' . $row['sender_last_name'],
                "recipientName" => $row['recipient_name'],
                "recipientEmail" => $row['recipient_email'],
                "amount" => floatval($row['amount']),
                "currency" => $row['currency'],
                "status" => $row['status'],
                "reference" => $row['reference'],
                "createdAt" => $row['created_at']
            );
        }

        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "transactions" => $transactions
        ));
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
               $data->amount > 0 &&
               in_array($data->currency, ['MZN', 'RWF']) &&
               in_array($data->convertedCurrency, ['MZN', 'RWF']) &&
               in_array($data->recipientCountry, ['mozambique', 'rwanda']);
    }
}
?>