// // controllers/authController.js
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const UserModel = require("../models/userModel");
// require("dotenv").config();

// const JWT_SECRET = process.env.JWT_SECRET || "change_this";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// function safeUser(u) {
//   if (!u) return null;
//   const copy = { ...u };
//   delete copy.password;
//   return copy;
// }

// async function login(req, res) {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ error: "Email and password required" });

//     const user = await UserModel.findByEmailWithPassword(email);
//     if (!user) return res.status(401).json({ error: "Invalid credentials" });
//     if (!user.is_active) return res.status(401).json({ error: "user is inactive" });


//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(401).json({ error: "Invalid credentials" });

//     const payload = { sub: user.id, role: user.role, email: user.email };
//     const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

//     res.json({ token, user: safeUser(user) });
//   } catch (err) {
//     console.error("login error", err);
//     res.status(500).json({ error: "Login failed" });
//   }
// }

// async function me(req, res) {
//   // request should have user attached by auth middleware
//   const user = req.user;
//   if (!user) return res.status(401).json({ error: "Not authenticated" });
//   // fetch fresh user data (without password)
//   const fresh = await UserModel.findById(user.sub || user.id);
//   res.json({ user: safeUser(fresh) });
// }

// module.exports = { login, me };


// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

function safeUser(u) {
  if (!u) return null;
  const copy = { ...u };
  delete copy.password;
  return copy;
}

async function login(req, res) {
  try {
    const { identifier, email, password } = req.body;
    
    // Support both old (email) and new (identifier) parameter names
    const loginIdentifier = identifier || email;
    
    if (!loginIdentifier || !password)
      return res.status(400).json({ error: "Email/Phone and password required" });

    // Try to find user by email or phone
    let user = await UserModel.findByEmailWithPassword(loginIdentifier);
    
    // If not found by email, try by phone
    if (!user) {
      user = await UserModel.findByPhoneWithPassword(loginIdentifier);
    }
    
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.is_active) return res.status(403).json({ error: "Account is deactivated" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Login failed" });
  }
}

async function me(req, res) {
  // request should have user attached by auth middleware
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  // fetch fresh user data (without password)
  const fresh = await UserModel.findById(user.sub || user.id);
  res.json({ user: safeUser(fresh) });
}

module.exports = { login, me };