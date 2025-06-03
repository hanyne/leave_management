import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

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
  max-width: 1000px;
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

const SubHeading = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  background-color: #fee2e6;
  color: #dc2626;
  padding: 12px 16px;
  font-size: 0.875rem;
  border-radius: 6px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const SuccessMessage = styled.p`
  background-color: #d1fae5;
  color: #059669;
  padding: 12px 16px;
  font-size: 0.875rem;
  border-radius: 6px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const ProfileSection = styled.div`
  margin-bottom: 32px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  font-size: 0.875rem;
  color: #4b5563;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.p`
  margin: 0;
  strong {
    color: #1f2937;
    font-weight: 500;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;

  ${({ secondary }) =>
    secondary
      ? `
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;

        &:hover {
          background-color: #e5e7eb;
          transform: translateY(-2px);
        }
      `
      : `
        background-color: #3b82f6;
        color: #ffffff;
        border: none;

        &:hover {
          background-color: #2563eb;
          transform: translateY(-2px);
        }
      `}
`;

const BalanceSection = styled.div`
  margin-bottom: 32px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

const ChartSection = styled.div`
  margin-bottom: 32px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  max-width: 400px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
  margin-top: 16px;
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

function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            username: data.username || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || ''
          });
        } else {
          setError('Utilisateur non trouvé');
          return;
        }

        const token = await currentUser.getIdToken();
        const [balanceRes, historyRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/${currentUser.uid}/leave-balance`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`http://localhost:5000/api/leaves/user/${currentUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!balanceRes.ok) {
          const contentType = balanceRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await balanceRes.text();
            throw new Error(`Server returned non-JSON response for balance: ${text.slice(0, 100)}`);
          }
          const data = await balanceRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération du solde');
        }

        if (!historyRes.ok) {
          const contentType = historyRes.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await historyRes.text();
            throw new Error(`Server returned non-JSON response for history: ${text.slice(0, 100)}`);
          }
          const data = await historyRes.json();
          throw new Error(data.message || 'Erreur lors de la récupération de l\'historique');
        }

        const balanceData = await balanceRes.json();
        const historyData = await historyRes.json();
        setLeaveBalance(balanceData);
        setLeaveHistory(historyData);
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });
      setUserData({ ...userData, ...formData });
      setSuccess('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  if (!userData || !leaveBalance) {
    return <Container><Card><p>Chargement du profil...</p></Card></Container>;
  }

  const leaveUsageData = {
    labels: ['Congé Annuel', 'Congé Maladie', 'Congé Maternité', 'Événement Familial', 'Pèlerinage', 'Exceptionnel'],
    datasets: [{
      data: [
        24 - (leaveBalance.annual || 0),
        15 - (leaveBalance.sick || 0),
        90 - (leaveBalance.maternity || 0),
        3 - (leaveBalance['family-event'] || 0),
        5 - (leaveBalance.pilgrimage || 0),
        2 - (leaveBalance.exceptional || 0)
      ],
      backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96c93d', '#f7b731', '#ff9f43'],
      borderColor: ['#ffffff'],
      borderWidth: 1
    }]
  };

  return (
    <Container>
      <Card>
        <Heading>Mon Profil</Heading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <ProfileSection>
          <SubHeading>Informations Personnelles</SubHeading>
          {editMode ? (
            <Form onSubmit={handleUpdate}>
              <FormGroup>
                <Label>Nom d'utilisateur</Label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Prénom</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Nom</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Téléphone</Label>
                <Input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormGroup>
              <div>
                <Button type="submit">Enregistrer</Button>
                <Button secondary type="button" onClick={() => setEditMode(false)}>Annuler</Button>
              </div>
            </Form>
          ) : (
            <>
              <InfoGrid>
                <InfoItem><strong>Email:</strong> {userData.email}</InfoItem>
                <InfoItem><strong>Nom d'utilisateur:</strong> {userData.username || 'Non défini'}</InfoItem>
                <InfoItem><strong>Prénom:</strong> {userData.firstName || 'Non défini'}</InfoItem>
                <InfoItem><strong>Nom:</strong> {userData.lastName || 'Non défini'}</InfoItem>
                <InfoItem><strong>Téléphone:</strong> {userData.phone || 'Non défini'}</InfoItem>
                <InfoItem><strong>Rôle:</strong> {userData.role}</InfoItem>
              </InfoGrid>
              <Button onClick={() => setEditMode(true)}>Modifier le Profil</Button>
            </>
          )}
        </ProfileSection>
        <BalanceSection>
          <SubHeading>Solde de Congé</SubHeading>
          <BalanceList>
            <li>Annuel: {leaveBalance.annual || 0} jours</li>
            <li>Maladie: {leaveBalance.sick || 0} jours</li>
            <li>Maternité: {leaveBalance.maternity || 0} jours</li>
            <li>Événement familial: {leaveBalance['family-event'] || 0} jours</li>
            <li>Pèlerinage: {leaveBalance.pilgrimage || 0} jours</li>
            <li>Exceptionnel: {leaveBalance.exceptional || 0} jours</li>
          </BalanceList>
        </BalanceSection>
        <ChartSection>
          <SubHeading>Utilisation des Congés</SubHeading>
          <Pie data={leaveUsageData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Utilisation des Congés' }
            }
          }} />
        </ChartSection>
        <ProfileSection>
          <SubHeading>Historique des Congés</SubHeading>
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
              {leaveHistory.map(leave => (
                <Tr key={leave.id}>
                  <Td>{leave.type}</Td>
                  <Td>{new Date(leave.startDate).toLocaleDateString('fr-FR')}</Td>
                  <Td>{new Date(leave.endDate).toLocaleDateString('fr-FR')}</Td>
                  <Td>{leave.reason}</Td>
                  <Td>{leave.status}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </ProfileSection>
      </Card>
    </Container>
  );
}

export default Profile;