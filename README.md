  #  Post Office Web Application

  This is a full-stack Post Office Management System that allows **customers** to track packages and order inventory, **employees** to manage deliveries and inventory, and **administrators** to oversee operations across multiple post office locations.

  **Hosted Web App:** [https://post-office-web-app.vercel.app](https://post-office-web-app.vercel.app)

  ---

  ##  Features

  - Customer registration/login, order inventory, and view tracking history
  - Package creation by employees with route assignment and delivery
  - Driver dashboard for delivery status updates and shift tracking
  - Admin dashboard with full control over:
    - Employees
    - Post office locations
    - Delivery vehicles
    - Reports (sales, inventory, packages, employee hours)
  - Semantic database triggers for notifications and vehicle limits

  ---

  ##  Technologies Used

  - **Frontend**: React (Vite)
  - **Backend**: Node.js with Express
  - **Database**: MySQL
  - **Emailing**: Nodemailer
  - **Styling**: Tailwind CSS
  - **Deployment**: Vercel (frontend), Render/other (backend, if hosted)

  ---

  ##  Folder Structure

post-office-app/ ├── client/ # React frontend │ └── ... # All React components, pages, assets ├── server/ # Node.js backend │ └── ... # Express routes, controllers, DB scripts ├── post_office_db.sql # SQL dump of populated database ├── README.md # Project instructions and setup


---

## Environment Variables

Create a `.env` file in the `server/` directory with the following (example):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=post_office
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

## Installation & Setup
1. Clone the Repo
bash
Copy
Edit
git clone https://github.com/yourusername/post-office-app.git
cd post-office-app
2. Install Dependencies
Client
bash
Copy
Edit
cd client
npm install
Server
bash
Copy
Edit
cd ../server
npm install
This will install dependencies including:

express

mysql2

cors

dotenv

nodemailer

body-parser

3. Start the App
Backend
bash
Copy
Edit
cd server
node server.js
Frontend
bash
Copy
Edit
cd client
npm start
Database Setup
Ensure MySQL is installed and running

Import the SQL dump:

bash
Copy
Edit
mysql -u root -p < post_office_db.sql
Make sure your .env matches your local database credentials

## User Roles & Logins

Role	Username	Password
Admin	admin1	admin123
Driver	driver1	drive123
Warehouse	warehouse1	ware123
Customer	customer1	cust123

## Screenshots
Add screenshots of dashboard, tracking history, reports, etc.



