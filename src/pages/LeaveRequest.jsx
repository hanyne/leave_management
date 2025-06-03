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
  max-width: 800px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
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
  margin-bottom: 8px;
`;

const Subtext = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 24px;
`;

const ErrorMessage = styled.p`
  background-color: #fee2e6;
  color: #dc2626;
  padding: 12px 16px;
  font-size: 0.875rem;
  border-radius: 6px;
  margin-bottom: 24px;
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

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #ffffff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SubmitButton = styled.button`
  padding: 12px 16px;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  margin-top: 16px;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
  }
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

function LeaveRequest() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'annual',
    reason: '',
    attachment: null,
    emergencyContact: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [leaveBalance, setLeaveBalance] = useState(null);
  const currentDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || !['agent', 'manager'].includes(userDoc.data().role)) {
          navigate('/');
          return;
        }

        const token = await currentUser.getIdToken();
        const res = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/leave-balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
          }
          const data = await res.json();
          throw new Error(data.message || 'Erreur lors de la récupération du solde de congé');
        }

        const data = await res.json();
        setLeaveBalance(data);
      } catch (err) {
        setError('Erreur: ' + err.message);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const daysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (start > end) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }
    if (start < new Date()) {
      setError('La date de début ne peut pas être dans le passé');
      return;
    }

    const balance = leaveBalance?.[formData.type] || 0;
    if (daysRequested > balance) {
      setError(`Solde insuffisant pour le type de congé "${formData.type}". Solde restant: ${balance} jours`);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('userId', currentUser.uid);
    formDataToSend.append('startDate', formData.startDate);
    formDataToSend.append('endDate', formData.endDate);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('reason', formData.reason);
    formDataToSend.append('status', 'pending');
    if (formData.attachment) {
      formDataToSend.append('attachment', formData.attachment);
    }
    if (['sick', 'maternity', 'family-event'].includes(formData.type)) {
      formDataToSend.append('emergencyContact', formData.emergencyContact);
    }

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('http://localhost:5000/api/leaves', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
        }
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la soumission');
      }

      setSuccess('Demande de congé soumise avec succès');
      setFormData({ startDate: '', endDate: '', type: 'annual', reason: '', attachment: null, emergencyContact: '' });
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  if (!leaveBalance) {
    return <Container><Card><p>Chargement du solde de congé...</p></Card></Container>;
  }

  return (
    <Container>
      <Card>
        <Heading>Demande de Congé</Heading>
        <Subtext>Date Actuelle: {currentDate}</Subtext>
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Date de Début</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </FormGroup>
          <FormGroup>
            <Label>Date de Fin</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </FormGroup>
          <FormGroup>
            <Label>Type de Congé</Label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="annual">Congé Annuel</option>
              <option value="sick">Congé Maladie</option>
              <option value="maternity">Congé Maternité</option>
              <option value="family-event">Congé pour Événement Familial</option>
              <option value="pilgrimage">Congé pour Pèlerinage</option>
              <option value="exceptional">Congé Exceptionnel</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Raison</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              placeholder="Expliquez la raison de votre demande..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Pièce Jointe (facultatif)</Label>
            <Input
              type="file"
              onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
            />
          </FormGroup>
          {['sick', 'maternity', 'family-event'].includes(formData.type) && (
            <FormGroup>
              <Label>Contact d'Urgence</Label>
              <Input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                required
                placeholder="Nom et numéro de téléphone..."
              />
            </FormGroup>
          )}
          <SubmitButton type="submit">Soumettre la Demande</SubmitButton>
        </Form>
      </Card>
    </Container>
  );
}

export default LeaveRequest;