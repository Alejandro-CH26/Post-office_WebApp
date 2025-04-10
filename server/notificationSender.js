const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const connection = require("./db");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send email notifications
function sendEmailNotification(notification) {
    // Fetch customer email
    connection.query(
        'SELECT customer_email FROM customers WHERE customer_ID = ?',
        [notification.customer_ID],
        function (err, results) {
            if (err || results.length === 0) {
                console.error('Error fetching customer email:', err);
                return;
            }

            const customerEmail = results[0].customer_email;

            // Fetch Package_ID and Status from notifications table
            connection.query(
                'SELECT package_ID, status FROM notifications WHERE notification_ID = ?',
                [notification.notification_ID],
                function (err, notifResults) {
                    if (err || notifResults.length === 0) {
                        console.error('Error fetching package details:', err);
                        return;
                    }

                    const packageID = notifResults[0].package_ID;
                    const packageStatus = notifResults[0].status;

                    // Compose email message
                    const emailMessage = {
                        from: `"Post Office" <${process.env.EMAIL_USER}>`,
                        to: customerEmail,
                        subject: "Package Notification",
                        text: `Greetings,\n\nYour Package #${packageID} has been ${packageStatus}.\nPlease log into your account for more information.\n\nThanks,\nThe Computer Science Post Office Team`
                    };

                    // Send email
                    transporter.sendMail(emailMessage, function (error, info) {
                        if (error) {
                            console.error("Error sending email:", error);
                            return;
                        }
                        console.log("Email sent:", info.response);

                        // Update notification as sent
                        connection.query(
                            'UPDATE notifications SET email_sent = TRUE WHERE notification_ID = ?',
                            [notification.notification_ID],
                            function (err) {
                                if (err) {
                                    console.error("Error updating notification status:", err);
                                } else {
                                    console.log("Notification status updated.");
                                }
                            }
                        );
                    });
                }
            );
        }
    );
}

// Function to check for new notifications
function checkForNewNotifications() {
    connection.query(
        'SELECT * FROM notifications WHERE email_sent = FALSE or email_sent = NULL',
        function (err, results) {
            if (!err && results.length > 0) {
                results.forEach(sendEmailNotification);
            }
        }
    );
}

// Run check every 5 seconds
setInterval(checkForNewNotifications, 5000);
