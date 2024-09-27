const express = require('express');
const bcrypt = require('bcryptjs');
const joi = require('joi');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors');

import { Request, Response } from 'express';

interface UserDto {
  username: string;
  email: string;
  type: 'user' | 'admin';
  password: string;
}

interface UserEntry {
  email: string;
  type: 'user' | 'admin';
  salt: string;
  passwordhash: string;
}

// Database mock where the username is the primary key of a user.
const MEMORY_DB: Record<string, UserEntry> = {};

// Function to save the in-memory database to a file
function saveDatabase() {
  const filePath = path.join(__dirname, 'database.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(MEMORY_DB, null, 2), 'utf-8');
    console.log('Database saved to file.');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Function to load the in-memory database from a file
function loadDatabase() {
  const filePath = path.join(__dirname, 'database.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      Object.assign(MEMORY_DB, JSON.parse(data));
      console.log('Database loaded from file.');
    } catch (error) {
      console.error('Error loading database:', error);
    }
  } else {
    console.log('No existing database file found. Starting with an empty database.');
  }
}

loadDatabase();

process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit();
});

app.use(cors());
app.use(express.json());

function getUserByUsername(username: string): UserEntry | undefined {
  return MEMORY_DB[username];
}

function getUserByEmail(email: string): UserEntry | undefined {
  return Object.values(MEMORY_DB).find(user => user.email === email);
}

// Get all users
app.get('/users', (req: Request, res: Response) => {
  console.log("Entered");
  // Convert the MEMORY_DB object to an array of users
  const users = Object.entries(MEMORY_DB).map(([username, userEntry]) => ({
    username,
    email: userEntry.email,
    type: userEntry.type,
  }));

  // Send the array of users as the response
  res.status(200).json(users);
});

// Register the user
app.post('/register', (req: Request, res: Response) => {
  const userSchema = joi.object({
    username: joi.string().min(3).max(24).required(),
    email: joi.string().email().required(),
    type: joi.string().valid('user', 'admin').required(),
    password: joi.string().min(5).max(24).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$')).required(),
  });

  try{
      const { error, value } = userSchema.validate(req.body);
    
      if (error) {
        return res.status(400).send({
          statusCode: 400, 
          message: error.details[0].message.includes("password") ? 'Password format is incorrect' : error.details[0].message.includes("type") ? 'Selected type is incorrect' : "Incorrect data format",
          data: null,
          success: false
        });
      }

      const { username, email, type, password } = value;

      if (getUserByUsername(username)) {
        return res.status(409).send({
          statusCode: 409,
          message: 'Username already exists',
          data: null, 
          success: false
        });
      }

      if (getUserByEmail(email)) {
        return res.status(409).send({
          statusCode: 409, 
          message: 'Email already registered',
          data: null,
          success: false
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordhash = bcrypt.hashSync(password, salt);

      MEMORY_DB[username] = { email, type, salt, passwordhash };

      return res.status(201).send({
        statusCode: 201, 
        message: 'User registered successfully',
        data: {
          username: username, 
          email: MEMORY_DB[username].email,
          type: MEMORY_DB[username].type,
          passwordhash: MEMORY_DB[username].passwordhash
        },
        success: true
      });
  } catch(error){
    return res.status(400).send({
      statusCode: 400, 
      message: "Something went wrong. Please try again",
      data: null,
      success: false
    })
  }
});

// Login user
app.post('/login', (req: Request, res: Response) => {
  const loginSchema = joi.object({
    username: joi.string().min(3).max(24).required(),
    password: joi.string().min(5).max(24).required(),
  });

  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).send({
        statusCode: 400,
        message: error.details[0].message.includes("username") ? 'Username format is incorrect' : "Incorrect data format",
        data: null,
        success: false
      });
    }

    const { username, password } = value;

    const user = getUserByUsername(username);

    if (!user) {
      return res.status(400).send({
        statusCode: 400,
        message: 'Invalid username or password',
        data: null,
        success: false
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.passwordhash);

    if (!isPasswordValid) {
      return res.status(401).send({
        statusCode: 401,
        message: 'Invalid username or password',
        data: null,
        success: false
      });
    }

    return res.status(200).send({
      statusCode: 200,
      message: 'Login successful',
      data: {
        username: username,
        email: user.email,
        type: user.type
      },
      success: true
    });
  } catch (error) {
    return res.status(500).send({
      statusCode: 500,
      message: "Something went wrong. Please try again",
      data: null,
      success: false
    });
  }
});

// Delete a user by username
app.delete('/users/:username', (req: Request, res: Response) => {
  const { username } = req.params;

  // Check if the user exists in the MEMORY_DB
  if (!MEMORY_DB[username]) {
    return res.status(404).send('User not found');
  }

  // Delete the user from the MEMORY_DB
  delete MEMORY_DB[username];

  // Send a success response
  res.status(200).send(`User ${username} deleted successfully`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
