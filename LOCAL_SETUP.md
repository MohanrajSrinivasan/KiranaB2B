# KiranaConnect - Local Development Setup

## Prerequisites

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (version 12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Create a database named `kiranaconnect`

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd kiranaconnect

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/kiranaconnect
PGHOST=localhost
PGPORT=5432
PGUSER=your_postgres_username
PGPASSWORD=your_postgres_password
PGDATABASE=kiranaconnect

# Session Security
SESSION_SECRET=your-super-secret-session-key-here

# Optional: WhatsApp Integration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Optional: Stripe Payment Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Environment
NODE_ENV=development
```

### 3. Database Setup

```bash
# Push database schema to PostgreSQL
npm run db:push

# Start the application (this will automatically seed the database)
npm run dev
```

### 4. Access the Application

- **Application URL**: http://localhost:5000
- **Demo Login Credentials**:
  - Admin: admin@kiranaconnect.com / admin123
  - Kirana Store: vendor@example.com / vendor123
  - Retail Customer: retail@example.com / retail123

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database

## Features

✅ **Multi-Role Authentication System**
- Admin, Kirana Store Owner, Retail Customer dashboards

✅ **Product Management**
- Bulk and retail pricing
- Category-based organization
- Inventory tracking

✅ **Order Management**
- Real-time order processing
- Status tracking and updates
- WhatsApp notifications (when configured)

✅ **Analytics Dashboard**
- Revenue metrics
- Customer insights
- Order analytics

✅ **Real-Time Features**
- Live order updates via WebSocket
- Instant notifications

✅ **Multilingual Support**
- Tamil and English language toggle

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Check database exists: `createdb kiranaconnect`

2. **Port Already in Use**
   - Kill process on port 5000: `lsof -ti:5000 | xargs kill -9`
   - Or change port in server/index.js

3. **Dependencies Installation Error**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

4. **Database Schema Issues**
   - Drop and recreate database
   - Run: `npm run db:push`

## Project Structure

```
kiranaconnect/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Application pages
│       └── lib/          # Utilities and configurations
├── server/               # Express backend
│   ├── index.js          # Server entry point
│   ├── routes.js         # API routes
│   ├── storage.js        # Data storage layer
│   └── db.js             # Database connection
├── shared/               # Shared schemas and types
└── package.json          # Dependencies and scripts
```

## Support

For local development issues:
1. Check console logs for error messages
2. Verify all environment variables are set
3. Ensure PostgreSQL is running and accessible
4. Check port availability (default: 5000)

The application uses in-memory storage by default for quick setup, but can be configured to use PostgreSQL for persistent data.