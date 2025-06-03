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
  max-width: 1280px;
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

const BalanceSummary = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const BalanceHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
`;

const BalanceList = styled.ul`
  list-style: none;
  padding: 0;
  font-size: 0.875rem;
  color: #4b5563;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
`;

function LeaveHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || !['agent', 'manager'].includes(userDoc.data().role)) {
          navigate('/');
          return;
        }

        const token = await currentUser.getIdToken();
        const [leavesRes, balanceRes] = await Promise.all([
          fetch(`http://localhost:5000/api/leaves/user/${currentUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`http://localhost:5000/api/users/${currentUser.uid}/leave-balance`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!leavesRes.ok) {
          const contentType = leavesRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await leavesRes.text();
            throw new Error(`Server returned non-JSON response for leaves: ${text.slice(0, 100)}`);
          }
          const data = await leavesRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération de l\'historique des congés');
        }

        if (!balanceRes.ok) {
          const contentType = balanceRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await balanceRes.text();
            throw new Error(`Server returned non-JSON response for balance: ${text.slice(0, 100)}`);
          }
          const data = await balanceRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération du solde de congé');
        }

        const leavesData = await leavesRes.json();
        const balanceData = await balanceRes.json();
        setLeaves(leavesData);
        setLeaveBalance(balanceData);
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  if (!leaveBalance) {
    return <Container><Card><p>Chargement...</p></Card></Container>;
  }

  return (
    <Container>
      <Card>
        <Heading>Historique des Congés</Heading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <BalanceSummary>
          <BalanceHeading>Votre Solde de Congé</BalanceHeading>
          <BalanceList>
            <li>Annuel: {leaveBalance.annual} jours</li>
            <li>Maladie: {leaveBalance.sick} jours</li>
            <li>Maternité: {leaveBalance.maternity} jours</li>
            <li>Événement familial: {leaveBalance['family-event']} jours</li>
            <li>Pèlerinage: {leaveBalance.pilgrimage} jours</li>
            <li>Exceptionnel: {leaveBalance.exceptional} jours</li>
          </BalanceList>
        </BalanceSummary>
        <Table>
          <Thead>
            <tr>
              <Th>Type</Th>
              <Th>Date de Début</Th>
              <Th>Date de Fin</Th>
              <Th>Raison</Th>
              <Th>Statut</Th>
            </tr>
          </Thead>
          <tbody>
            {leaves.map(leave => (
              <Tr key={leave.id}>
                <Td>{leave.type}</Td>
                <Td>{new Date(leave.startDate).toLocaleDateString('fr-FR')}</Td>
                <Td>{new Date(leave.endDate).toLocaleDateString('fr-FR')}</Td>
                <Td>{leave.reason}</Td>
                <Td><StatusBadge status={leave.status}>{leave.status}</StatusBadge></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
}

export default LeaveHistory;