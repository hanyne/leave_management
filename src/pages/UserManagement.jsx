import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Users() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        navigate('/');
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(data);
        } else {
          setError(data.message || 'Erreur lors de la récupération des utilisateurs');
        }
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleDelete = async (uid) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`http://localhost:5000/api/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(user => user.uid !== uid));
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  return (
    <div className="container modern-container">
      <div className="modern-card animate-card">
        <h2>Gestion des Utilisateurs</h2>
        {error && <p className="error animate-error">{error}</p>}
        <table className="user-table modern-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => handleDelete(user.uid)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;