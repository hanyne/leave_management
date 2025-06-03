const Leave = require('../models/Leave');
const { db } = require('../firebaseAdmin');

const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.getAll();
    const leavesWithUserDetails = await Promise.all(
      leaves.map(async (leave) => {
        const userDoc = await db.collection('users').doc(leave.userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const displayName = userData.username || userData.email || 'Inconnu';
        const role = userData.role || 'Inconnu';
        return { ...leave, displayName, role };
      })
    );
    res.json(leavesWithUserDetails);
  } catch (err) {
    console.error('Error in getAllLeaves:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des congés: ' + err.message });
  }
};

// ... (rest of the file remains as previously provided)