const User = require('../models/User');
const { db } = require('../firebaseAdmin');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs: ' + err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { uid, email, role, username } = req.body;
    if (!uid || !email || !role || !username) {
      return res.status(400).json({ message: 'UID, email, rôle et nom d\'utilisateur sont requis' });
    }
    const user = await User.create({ uid, email, role, username });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur: ' + err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { role, username } = req.body;
    const user = await User.update(uid, { role, username });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur: ' + err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;
    await User.delete(uid);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur: ' + err.message });
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const leaveSnapshot = await db.collection('leaveRequests').where('userId', '==', uid).get();
    const leaveRequests = leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const entitlements = {
      annual: 24,
      sick: 15,
      maternity: 90,
      'family-event': 3,
      pilgrimage: 5,
      exceptional: 2
    };

    const usedLeaves = leaveRequests.reduce((acc, leave) => {
      if (leave.status === 'approved') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        acc[leave.type] = (acc[leave.type] || 0) + days;
      }
      return acc;
    }, {});

    const balance = Object.keys(entitlements).reduce((acc, type) => {
      acc[type] = entitlements[type] - (usedLeaves[type] || 0);
      return acc;
    }, {});

    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors du calcul du solde de congé: ' + err.message });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, getLeaveBalance };