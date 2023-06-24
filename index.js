/*const express = require('express');
const bodyParser = require('body-parser');
const { zod } = require('zod'); // or const Joi = require('joi');

// Create an instance of Express
const app = express();

// Middleware for parsing JSON
app.use(bodyParser.json());

// Define a validation schema using Zod or Joi
// Example using Zod
const userSchema = zod.object({
  name: zod.string().min(3).max(50).required(),
  age: zod.number().min(18).max(99).required(),
  email: zod.string().email().required(),
});



// Define your API endpoints
app.post('/users', (req, res) => {
  try {
    const { name, age, email } = req.body;

    // Validate the input against the defined schema
    const validatedUser = userSchema.parse({ name, age, email });

    // Process the validated user data
    // ...

    res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
*/

const express = require('express');
const Joi = require('joi');

const app = express();
app.use(express.json());

// In-memory database
let accounts = [];
let transactions = [];

// Helper function to find an account by account number
function findAccount(accountNumber) {
  return accounts.find(account => account.accountNumber === accountNumber);
}

// Helper function to update account balance
function updateBalance(accountNumber, amount) {
  const account = findAccount(accountNumber);
  account.balance += amount;
  account.updatedAt = new Date().toISOString();
}

// Joi schema for request validation
const transferSchema = Joi.object({
  from: Joi.number().required(),
  to: Joi.number().required(),
  amount: Joi.number().positive().required()
});

// Endpoint to create an account
app.post('/create-account', (req, res) => {
  const { accountNumber } = req.body;

  // Check if account already exists
  if (findAccount(accountNumber)) {
    return res.status(400).json({ error: 'Account already exists' });
  }

  const newAccount = {
    accountNumber,
    balance: 0,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  res.status(201).json(newAccount);
});

// Endpoint to get balance for a particular account number
app.get('/balance/:accountNumber', (req, res) => {
  const { accountNumber } = req.params;

  const account = findAccount(accountNumber);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({ balance: account.balance });
});

// Endpoint to get all accounts and their balances
app.get('/balance', (req, res) => {
  res.json(accounts);
});

// Endpoint to make a transaction
app.post('/transfer', (req, res) => {
  const { error, value } = transferSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { from, to, amount } = value;

  const senderAccount = findAccount(from);
  if (!senderAccount) {
    return res.status(404).json({ error: 'Sender account not found' });
  }

  const receiverAccount = findAccount(to);
  if (!receiverAccount) {
    return res.status(404).json({ error: 'Receiver account not found' });
  }

  if (senderAccount.balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  // Update balances
  updateBalance(from, -amount);
  updateBalance(to, amount);

  // Create transaction record
  const transaction = {
    reference: Date.now().toString(),
    senderAccount: from,
    amount,
    receiverAccount: to,
    transferDescription: 'Money transfer',
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);

  res.status(201).json(transaction);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
