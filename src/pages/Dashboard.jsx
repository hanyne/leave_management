import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

// Styled components
const Container = styled.div`
  padding: 24px;
  background-color: #f4f7fa;
  min-height: 100vh;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  max-width: 1280px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatBox = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  text-align: 0 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 8px;
  }

  p {
    font-size: 1.75rem;
    font-weight: 700;
    color: #111827;
  }
`;

const ChartContainer = styled.div`
  margin-bottom: 32px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const ChartHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
`;

const RecentLeaves = styled.div`
  margin-top: 24px;
`;

const RecentLeavesTable = styled.table`
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

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const checkRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          navigate('/leave-request');
        }
      } catch (err) {
        setError('Erreur lors de la vérification du rôle: ' + err.message);
      }
    };

    const fetchData = async () => {
      try {
        const token = await currentUser.getIdToken();
        const [leaveRes, userRes] = await Promise.all([
          fetch('http://localhost:5000/api/leaves', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!leaveRes.ok) {
          const contentType = leaveRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await leaveRes.text();
            throw new Error(`Server returned non-JSON response for leaves: ${text.slice(0, 100)}`);
          }
          const data = await leaveRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération des congés');
        }

        if (!userRes.ok) {
          const contentType = userRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await userRes.text();
            throw new Error(`Server returned non-JSON response for users: ${text.slice(0, 100)}`);
          }
          const data = await userRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
        }

        const leaves = await leaveRes.json();
        const users = await userRes.json();
        setLeaveData(leaves);
        setUserData(users);
      } catch (err) {
        setError('Erreur lors de la récupération des données: ' + err.message);
      }
    };

    checkRole();
    fetchData();
  }, [currentUser, navigate]);

  // Statistics
  const leaveStats = {
    labels: ['En attente', 'Approuvé', 'Rejeté'],
    datasets: [{
      label: 'Demandes de congé',
      data: [
        leaveData.filter(l => l.status === 'pending').length,
        leaveData.filter(l => l.status === 'approved').length,
        leaveData.filter(l => l.status === 'rejected').length
      ],
      backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'],
      borderColor: ['#d97706', '#16a34a', '#dc2626'],
      borderWidth: 1
    }]
  };

  const leaveTypeStats = {
    labels: ['Annuel', 'Maladie', 'Maternité', 'Événement familial', 'Pèlerinage', 'Exceptionnel'],
    datasets: [{
      label: 'Demandes par type',
      data: [
        leaveData.filter(l => l.type === 'annual').length,
        leaveData.filter(l => l.type === 'sick').length,
        leaveData.filter(l => l.type === 'maternity').length,
        leaveData.filter(l => l.type === 'family-event').length,
        leaveData.filter(l => l.type === 'pilgrimage').length,
        leaveData.filter(l => l.type === 'exceptional').length
      ],
      backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6b7280'],
      borderColor: ['#2563eb', '#059669', '#7c3aed', '#d97706', '#db2777', '#4b5563'],
      borderWidth: 1
    }]
  };

  const roleStats = {
    labels: ['Admin', 'Manager', 'Agent'],
    datasets: [{
      label: 'Utilisateurs par rôle',
      data: [
        userData.filter(u => u.role === 'admin').length,
        userData.filter(u => u.role === 'manager').length,
        userData.filter(u => u.role === 'agent').length
      ],
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
      borderColor: ['#4f46e5', '#059669', '#d97706'],
      borderWidth: 1
    }]
  };

  const recentLeaves = leaveData
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <Container>
      <Card>
        <Heading>Tableau de Bord Admin</Heading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <StatsGrid>
          <StatBox>
            <h3>Total Utilisateurs</h3>
            <p>{userData.length}</p>
          </StatBox>
          <StatBox>
            <h3>Total Demandes de Congé</h3>
            <p>{leaveData.length}</p>
          </StatBox>
          <StatBox>
            <h3>Demandes En Attente</h3>
            <p>{leaveData.filter(l => l.status === 'pending').length}</p>
          </StatBox>
          <StatBox>
            <h3>Demandes Approuvées</h3>
            <p>{leaveData.filter(l => l.status === 'approved').length}</p>
          </StatBox>
        </StatsGrid>
        <ChartContainer>
          <ChartHeading>Distribution des Statuts de Congé</ChartHeading>
          <Bar data={leaveStats} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Statuts des demandes de congé' }
            }
          }} />
        </ChartContainer>
        <ChartContainer>
          <ChartHeading>Distribution des Types de Congé</ChartHeading>
          <Bar data={leaveTypeStats} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Types de congé' }
            }
          }} />
        </ChartContainer>
        <ChartContainer>
          <ChartHeading>Distribution des Rôles Utilisateur</ChartHeading>
          <Bar data={roleStats} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Rôles des utilisateurs' }
            }
          }} />
        </ChartContainer>
        <RecentLeaves>
          <ChartHeading>Dernières Demandes de Congé</ChartHeading>
          <RecentLeavesTable>
            <Thead>
              <tr>
                <Th>Utilisateur</Th>
                <Th>Type</Th>
                <Th>Date de Début</Th>
                <Th>Date de Fin</Th>
                <Th>Statut</Th>
              </tr>
            </Thead>
            <tbody>
              {recentLeaves.map(leave => (
                <Tr key={leave.id}>
                  <Td>{leave.displayName || leave.userId}</Td>
                  <Td>{leave.type}</Td>
                  <Td>{new Date(leave.startDate).toLocaleDateString('fr-FR')}</Td>
                  <Td>{new Date(leave.endDate).toLocaleDateString('fr-FR')}</Td>
                  <Td>{leave.status}</Td>
                </Tr>
              ))}
            </tbody>
          </RecentLeavesTable>
        </RecentLeaves>
      </Card>
    </Container>
  );
}

export default Dashboard;