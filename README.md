# UmaPesa - Comprehensive Money Transfer Application

## PHP Backend Integration Documentation

### Overview
This document outlines the comprehensive PHP backend integration for the UmaPesa money transfer application, including database schema, API endpoints, and security implementation.

### Backend Architecture

The application now uses a custom PHP backend with MySQL database instead of Supabase. This provides:
- Custom API endpoints for all operations
- JWT-based authentication
- Direct database control
- Custom business logic implementation

### Setup Instructions

1. **Install XAMPP/WAMP/MAMP**
   - Download and install a local PHP development environment
   - Start Apache and MySQL services

2. **Database Setup**
   - Create a new MySQL database named `umapesa_db`
   - Import the schema from `php-backend/config/database.sql`
   - Verify all tables are created correctly

3. **PHP Backend Setup**
   - Copy the `php-backend` folder to your web server's document root (e.g., `htdocs/php-backend`)
   - Update database credentials in `php-backend/config/database.php` if needed
   - Test the API by visiting `http://localhost/php-backend/api/campaigns`

4. **Frontend Configuration**
   - The React frontend now uses `src/lib/api.ts` instead of Supabase
   - All API calls go to `http://localhost/php-backend/api`
   - JWT tokens are stored in localStorage for authentication

### Database Schema

#### Core Tables

1. **users** - User account management
   - Primary key: `id` (uuid)
   - Unique constraints: `email`, `account_number`
   - Auto-generated account numbers with format: UMP000000001
   - Tracks transaction statistics and KYC status

2. **transactions** - Money transfer records
   - Foreign key: `sender_id` → `users(id)`
   - Auto-generated reference numbers with format: UMP20240125000001
   - Supports cross-currency transfers with exchange rates
   - Tracks fees and payment methods

3. **campaigns** - Fundraising campaigns
   - Foreign key: `creator_id` → `users(id)`
   - Supports goal tracking and meta tags for social sharing
   - Automatic status management based on goals and dates

4. **contributions** - Campaign contributions
   - Foreign key: `campaign_id` → `campaigns(id)`
   - Supports anonymous contributions
   - Auto-updates campaign raised amounts

5. **fee_structures** - Dynamic fee management
   - Supports both percentage and fixed fees
   - Amount range-based fee calculation

6. **exchange_rates** - Currency conversion rates
   - Supports MZN ↔ RWF conversions
   - Real-time rate updates

7. **payment_methods** - Payment processing options
   - Configurable fee percentages
   - Support for cards and mobile money

8. **api_logs** - API transaction logging
   - Comprehensive request/response tracking
   - Error logging and monitoring

### Database Views

1. **user_transaction_summary** - Aggregated user statistics
2. **campaign_summary** - Campaign progress and statistics
3. **admin_dashboard_stats** - Real-time admin metrics

### Database Functions

1. **calculate_fee(amount)** - Dynamic fee calculation
2. **get_exchange_rate(from_curr, to_curr)** - Currency conversion
3. **get_campaign_progress(campaign_uuid)** - Campaign analytics
4. **mask_phone_number(phone_number)** - Privacy protection

### Row Level Security (RLS)

#### Security Policies Implemented:

**Users Table:**
- Users can read/update their own data
- Admins can read/update all users
- Public registration allowed

**Transactions Table:**
- Users can read their sent transactions
- Users can read transactions sent to them
- Users can create new transactions
- Admins have full access

**Campaigns Table:**
- Public read access for active campaigns
- Creators can manage their campaigns
- Admins have full access

**Contributions Table:**
- Public read access for active campaign contributions
- Public contribution creation
- Contributors can read their own contributions
- Campaign creators can read contributions to their campaigns

### PHP Backend Security

1. **JWT Authentication**: Secure token-based authentication
2. **Input Validation**: All user inputs are sanitized and validated
3. **SQL Injection Prevention**: Using prepared statements with PDO
4. **CORS Configuration**: Proper cross-origin resource sharing setup
5. **Error Handling**: Comprehensive error logging and user-friendly messages
6. **Password Security**: Bcrypt hashing for password storage

### Data Relationships

```
users (1) ←→ (many) transactions
users (1) ←→ (many) campaigns
campaigns (1) ←→ (many) contributions
transactions (1) ←→ (many) api_logs
users (1) ←→ (many) api_logs
```

### Triggers and Automation

1. **Auto-generated IDs**: Account numbers and transaction references
2. **Timestamp management**: Automatic `updated_at` timestamps
3. **Statistics updates**: User transaction counts and volumes
4. **Campaign progress**: Automatic raised amount calculations
5. **Goal completion**: Automatic campaign status updates

### Performance Optimizations

#### Indexes Created:
- User email and account number lookups
- Transaction sender and recipient queries
- Campaign and contribution filtering
- API log monitoring queries
- Status and date-based filtering

### Usage Examples

#### Creating a Transaction:
```typescript
const result = await ApiService.createTransaction({
  recipientName: 'John Doe',
  recipientEmail: 'john@example.com',
  recipientPhone: '+250788123456',
  recipientCountry: 'rwanda',
  amount: 1000,
  currency: 'MZN',
  convertedCurrency: 'RWF',
  description: 'Transfer to family'
});
```

#### Campaign Management:
```typescript
const campaigns = await ApiService.getCampaigns();
```

#### User Authentication:
```typescript
const result = await ApiService.login(email, password);
```

### Database Migration

The complete database schema is available in `php-backend/config/database.sql`:
1. Run the SQL script in your MySQL database
2. Verify all tables are created with proper constraints
3. Default data for exchange rates, fees, and payment methods is automatically inserted

### Testing the Database

```sql
-- Test database connection
SELECT * FROM users LIMIT 5;
SELECT * FROM exchange_rates;
SELECT * FROM fee_structures;
```

### API Testing
```bash
# Test campaign endpoint
curl http://localhost/php-backend/api/campaigns

# Test exchange rates
curl http://localhost/php-backend/api/exchange-rates
```

### Development Notes

- **No Real-time Updates**: Unlike Supabase, this PHP backend doesn't include real-time functionality by default
- **Manual Refresh**: Users need to refresh pages to see updated data
- **Local Development**: The backend runs on your local machine at `http://localhost/php-backend`
- **Database Management**: Use phpMyAdmin to manage the MySQL database directly

This PHP backend implementation provides a robust foundation for the UmaPesa money transfer application with custom business logic, security, and full database control.