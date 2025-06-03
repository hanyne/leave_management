const { db } = require('../firebaseAdmin');

class User {
  static async create({ uid, email, role, username }) {
    const initialBalance = {
      annual: 24,
      sick: 15,
      maternity: 90,
      'family-event': 3,
      pilgrimage: 5,
      exceptional: 2
    };
    await db.collection('users').doc(uid).set({
      email,
      role,
      username,
      leaveBalance: initialBalance
    });
    return { uid, email, role, username, leaveBalance: initialBalance };
  }

  static async getAll() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  static async update(uid, { role, username }) {
    const updateData = {};
    if (role) updateData.role = role;
    if (username) updateData.username = username;
    await db.collection('users').doc(uid).update(updateData);
    return { uid, ...updateData };
  }

  static async delete(uid) {
    await db.collection('users').doc(uid).delete();
  }
}

module.exports = User;