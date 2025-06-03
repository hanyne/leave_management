import React, { useState } from 'react';
import styled from 'styled-components';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f4f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const Card = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Heading = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin-bottom: 24px;
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

const SubmitButton = styled.button`
  padding: 12px 16px;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
  }
`;

const LoginLink = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-top: 16px;

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('agent');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        username,
        role,
        createdAt: new Date().toISOString(),
        leaveBalance: {
          annual: 24,
          sick: 15,
          maternity: 90,
          'family-event': 3,
          pilgrimage: 5,
          exceptional: 2
        }
      });

      const token = await userCredential.user.getIdToken();
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          username,
          role
        })
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
        }
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la création de l\'utilisateur');
      }

      navigate('/login');
    } catch (err) {
      setError('Échec de l\'inscription: ' + err.message);
    }
  };

  return (
    <Container>
      <Card>
        <Heading>Inscription</Heading>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Nom d'utilisateur</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Mot de Passe</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Rôle</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrateur</option>
            </Select>
          </FormGroup>
          <SubmitButton type="submit">S'inscrire</SubmitButton>
        </Form>
        <LoginLink>
          Déjà un compte ? <Link to="/login">Connectez-vous ici</Link>
        </LoginLink>
      </Card>
    </Container>
  );
}

export default Register;