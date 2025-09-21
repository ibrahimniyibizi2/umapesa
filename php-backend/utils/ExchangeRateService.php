<?php
class ExchangeRateService {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getRate($fromCurrency, $toCurrency) {
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        $query = "SELECT rate FROM exchange_rates 
                  WHERE from_currency = :from_currency 
                  AND to_currency = :to_currency 
                  AND is_active = 1 
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":from_currency", $fromCurrency);
        $stmt->bindParam(":to_currency", $toCurrency);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return floatval($row['rate']);
        }

        // Default rates if not found in database
        if ($fromCurrency === 'MZN' && $toCurrency === 'RWF') {
            return 18.5;
        } elseif ($fromCurrency === 'RWF' && $toCurrency === 'MZN') {
            return 0.054;
        }

        return 1.0;
    }

    public function getAllRates() {
        $query = "SELECT * FROM exchange_rates WHERE is_active = 1 ORDER BY from_currency, to_currency";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $rates = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rates[] = array(
                "id" => $row['id'],
                "fromCurrency" => $row['from_currency'],
                "toCurrency" => $row['to_currency'],
                "rate" => floatval($row['rate']),
                "isActive" => (bool)$row['is_active'],
                "updatedAt" => $row['updated_at']
            );
        }

        return $rates;
    }
}
?>