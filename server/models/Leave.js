const { db } = require('../firebaseAdmin');

class Leave {
  static async create({ userId, startDate, endDate, type, reason, status, attachment, emergencyContact }) {
    const newLeaveRef = await db.collection('leaveRequests').add({
      userId,
      startDate,
      endDate,
      type,
      reason,
      status,
      createdAt: new Date().toISOString(),
      ...(attachment && { attachment }),
      ...(emergencyContact && { emergencyContact })
    });
    return { id: newLeaveRef.id, ...arguments[0] };
  }

  static async getAll() {
    const snapshot = await db.collection('leaveRequests').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getByUser(userId) {
    const snapshot = await db.collection('leaveRequests').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async update(id, { status, reason }) {
    const updateData = { status };
    if (reason !== undefined) {
      updateData.reason = reason;
    }
    await db.collection('leaveRequests').doc(id).update(updateData);
    return { id, ...updateData };
  }
}

module.exports = Leave;