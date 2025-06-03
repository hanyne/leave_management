const { admin } = require('../firebaseAdmin');

const verifyUser = (allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;

      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return res.status(403).json({ message: 'Utilisateur non trouvé dans la base de données' });
      }

      const userRole = userDoc.data().role;
      if (Array.isArray(allowedRoles)) {
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: 'Accès non autorisé pour ce rôle' });
        }
      } else if (userRole !== allowedRoles) {
        return res.status(403).json({ message: 'Accès non autorisé pour ce rôle' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token invalide: ' + err.message });
    }
  };
};

module.exports = { verifyUser };