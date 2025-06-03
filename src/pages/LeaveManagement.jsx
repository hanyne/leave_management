import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Styled Components
const Container = styled.div`
  padding: 24px;
  background-color: #f4f7fa;
  min-height: 100vh;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  max-width: 1400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
`;

const ErrorMessage = styled.p`
  background-color: #fee2e6;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
`;

const Thead = styled.thead`
  background: linear-gradient(90deg, #2563eb, #4f46e5);
  color: #ffffff;
`;

const Th = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  &:first-child {
    border-top-left-radius: 6px;
  }
  &:last-child {
    border-top-right-radius: 6px;
  }
`;

const Tr = styled.tr`
  background-color: #ffffff;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f9fafb;
  }
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  ${({ status }) =>
    status === 'approved'
      ? `
        background-color: #d1fae5;
        color: #059669;
      `
      : status === 'rejected'
      ? `
        background-color: #fee2e6;
        color: #dc2626;
      `
      : `
        background-color: #fef3c7;
        color: #d97706;
      `}
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  border: none;
  cursor: pointer;
  margin-right: 8px;
  transition: background-color 0.2s ease, transform 0.1s ease;

  ${({ type }) =>
    type === 'approve'
      ? `
        background-color: #10b981;
        &:hover {
          background-color: #059669;
          transform: translateY(-2px);
        }
      `
      : `
        background-color: #ef4444;
        &:hover {
          background-color: #dc2626;
          transform: translateY(-2px);
        }
      `}
`;

const Link = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  &:hover {
    text-decoration: underline;
  }
`;

const BalanceList = styled.ul`
  list-style: none;
  padding: 0;
  font-size: 0.85rem;
  color: #4b5563;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
`;

function Leaves() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          navigate('/');
          return;
        }

        const token = await currentUser.getIdToken();
        const res = await fetch('http://localhost:5000/api/leaves', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
          }
          const data = await res.json();
          throw new Error(data.message || 'Erreur lors de la récupération des congés');
        }

        const data = await res.json();
        const leavesWithBalances = await Promise.all(
          data.map(async (leave) => {
            const balanceRes = await fetch(`http://localhost:5000/api/users/${leave.userId}/leave-balance`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!balanceRes.ok) {
              console.error('Balance fetch error:', await balanceRes.json());
              return { ...leave, balance: null };
            }
            const balance = await balanceRes.json();
            return { ...leave, balance };
          })
        );
        setLeaves(leavesWithBalances);
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleUpdate = async (id, status) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`http://localhost:5000/api/leaves/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
        }
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      setLeaves(leaves.map(leave => leave.id === id ? { ...leave, status } : leave));
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  return (
    <Container>
      <Card>
        <Heading>Gestion des Congés</Heading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Table>
          <Thead>
            <tr>
              <Th>Utilisateur</Th>
              <Th>Rôle</Th>
              <Th>Type</Th>
              <Th>Date de Début</Th>
              <Th>Date de Fin</Th>
              <Th>Raison</Th>
              <Th>Contact d'Urgence</Th>
              <Th>Pièce Jointe</Th>
              <Th>Solde Restant</Th>
              <Th>Statut</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {leaves.map(leave => (
              <Tr key={leave.id}>
                <Td>{leave.displayName || 'Inconnu'}</Td>
                <Td>{leave.role || 'Inconnu'}</Td>
                <Td>{leave.type}</Td>
                <Td>{new Date(leave.startDate).toLocaleDateString('fr-FR')}</Td>
                <Td>{new Date(leave.endDate).toLocaleDateString('fr-FR')}</Td>
                <Td>{leave.reason}</Td>
                <Td>{leave.emergencyContact || 'N/A'}</Td>
                <Td>
                  {leave.attachment ? (
                    <Link href={leave.attachment} target="_blank" rel="noopener noreferrer">
                      Voir
                    </Link>
                  ) : 'N/A'}
                </Td>
                <Td>
                  {leave.balance ? (
                    <BalanceList>
                      <li>Annuel: {leave.balance.annual} jours</li>
                      <li>Maladie: {leave.balance.sick} jours</li>
                      <li>Maternité: {leave.balance.maternity} jours</li>
                      <li>Événement familial: {leave.balance['family-event']} jours</li>
                      <li>Pèlerinage: {leave.balance.pilgrimage} jours</li>
                      <li>Exceptionnel: {leave.balance.exceptional} jours</li>
                    </BalanceList>
                  ) : 'Chargement...'}
                </Td>
                <Td>
                  <StatusBadge status={leave.status}>{leave.status}</StatusBadge>
                </Td>
                <Td>
                  {leave.status === 'pending' && (
                    <div>
                      <Button type="approve" onClick={() => handleUpdate(leave.id, 'approved')}>
                        Approuver
                      </Button>
                      <Button type="reject" onClick={() => handleUpdate(leave.id, 'rejected')}>
                        Rejeter
                      </Button>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
}

export default Leaves;