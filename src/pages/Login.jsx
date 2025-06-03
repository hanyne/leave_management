import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
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

const RegisterLink = styled.p`
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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'admin') {
          navigate('/');
        } else if (['agent', 'manager'].includes(role)) {
          navigate('/leave-request');
        } else {
          setError('Rôle invalide');
          await auth.signOut();
        }
      } else {
        setError('Données utilisateur non trouvées');
        await auth.signOut();
      }
    } catch (err) {
      setError('Échec de la connexion: ' + err.message);
    }
  };

  return (
    <Container>
      <Card>
        <Heading>Connexion</Heading>
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
            <Label>Mot de Passe</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          <SubmitButton type="submit">Se Connecter</SubmitButton>
        </Form>
        <RegisterLink>
          Pas de compte ? <Link to="/register">Inscrivez-vous ici</Link>
        </RegisterLink>
      </Card>
    </Container>
  );
}

export default Login;