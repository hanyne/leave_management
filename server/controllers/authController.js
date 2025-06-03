const { admin } = require('../firebaseAdmin');
const User = require('../models/User');

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!['agent', 'manager', 'admin'].includes(role)) {
    return res.status(400).send('Invalid role');
  }
  try {
    const user = await User.create({ email, password, name, role, leaveQuota: { annual: 20, sick: 10 } });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).send('Error registering user: ' + err.message);
  }
};

module.exports = { register };