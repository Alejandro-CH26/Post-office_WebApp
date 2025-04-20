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

  - **Frontend**: React
  - **Backend**: Node.js
  - **Database**: MySQL
  - **Deployment**: Vercel (frontend), Render (backend)

  ---

  ##  Folder Structure

post-office-app/ ├── client/ # React frontend │ 
└── ... # All React components, pages, assets 
├── server/ # Node.js backend 
│ 
└── ... # Express routes, controllers, DB scripts ├── post_office_db.sql # SQL dump of populated database ├── README.md # Project instructions and setup

<pre> ``` post-office-app/ ├── client/ # React frontend │ └── ... # All React components, pages, assets ├── server/ # Node.js backend │ └── ... # Express routes, controllers, DB scripts ├── post_office_db.sql # SQL dump of populated database ├── README.md # Project instructions and setup ``` </pre>

---

## Environment Variables

Create a `.env` file in the `client/` directory with the following (example):

```.env
REACT_APP_API_BASE_URL="put your localhost link (example: http://localhost:5001)"
```

```.env.production
REACT_APP_API_BASE_URL="put your backend deployment link (example: render)"
```

Create a `.env` file in the `server/` directory with the following (example):

```.env
DB_HOST="hostname"
DB_USER="username"
DB_PASSWORD="password"
DB_NAME="name of db"
SSL_CA="file path of ssl certificate"
JWT_SECRET="jwt_secret"
```

## Installation & Setup
1. Clone the Repo
bash
Copy
Edit
git clone https://github.com/yourusername/post-office-app.git
cd post-office-app

3. Install Dependencies
Client
bash

cd client
npm install
Server
bash

cd ../server
npm install
This will install dependencies including:

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

cd client
npm start

## Database Setup
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



