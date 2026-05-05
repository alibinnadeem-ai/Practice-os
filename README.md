# PracticeOS - Healthcare Revenue Management System

A Next.js application for managing healthcare revenue cycle operations, converted from a static HTML dashboard.

## Features

- **Dashboard**: Real-time revenue metrics, KPI tracking, and operational insights
- **Claims Management**: Submit, track, and reconcile insurance claims
- **Patient Registry**: Manage patient demographics and account balances
- **Scheduling**: Appointment management with insurance verification
- **Revenue Cycle**: Denial management, payments, write-offs, and AR aging
- **Insurance Management**: Payer mix analysis, VOB, prior authorizations, and credentialing

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Custom CSS (adapted from original design)
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma
- **Deployment**: Vercel

## Database Schema

The application uses the following main entities:

- **Practice**: Healthcare practice information
- **Patient**: Patient demographics and insurance
- **Provider**: Healthcare providers and staff
- **Claim**: Insurance claims with status tracking
- **Appointment**: Scheduled patient visits
- **Payment**: Payment and adjustment records
- **Payer**: Insurance companies and contracts

## Setup Instructions

### 1. Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### 2. Database Setup

1. Create a Neon DB account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

4. Update the `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### 3. Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Neon DB connection string
4. Deploy

## Database Schema Details

The Prisma schema includes comprehensive tables for:

- Practice management
- Patient and provider data
- Claims lifecycle (submission → payment)
- Appointment scheduling
- Insurance verification and authorizations
- Payment processing and reconciliation
- Reporting and analytics

## API Routes

The application includes API routes for:
- CRUD operations on all entities
- Data import/export
- Report generation
- Integration with clearinghouses

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Maintain the original design aesthetics
4. Add proper error handling and validation

## License

This project is for educational and demonstration purposes.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
