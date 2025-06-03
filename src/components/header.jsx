import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Styled Components (as provided previously)
const Navbar = styled.header`
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const LogoutButton = styled.button`
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;

  &:hover {
    background-color: #dc2626;
    transform: translateY(-1px);
  }
`;

const UserInfo = styled.div`
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 400;
  margin-right: 1rem;
`;

function Header() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ role: null, displayName: null });

  useEffect(() => {
    if (currentUser) {
      const fetchUserInfo = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const { role, username, email } = userDoc.data();
            setUserInfo({
              role: role || 'Inconnu',
              displayName: username || email || 'Inconnu'
            });
          } else {
            setUserInfo({ role: 'Inconnu', displayName: currentUser.email || 'Inconnu' });
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }
      };
      fetchUserInfo();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserInfo({ role: null, displayName: null });
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <Navbar>
      <Container>
        <Logo>
          <h1>LeaveSync</h1>
        </Logo>
        {currentUser && (
          <NavLinks>
            <UserInfo>{userInfo.displayName} ({userInfo.role})</UserInfo>
            {userInfo.role === 'admin' && (
              <>
                <NavLink to="/">Tableau de Bord</NavLink>
                <NavLink to="/users">Utilisateurs</NavLink>
                <NavLink to="/leaves">Congés</NavLink>
              </>
            )}
            {['agent', 'manager'].includes(userInfo.role) && (
              <>
                <NavLink to="/leave-request">Demander un Congé</NavLink>
                <NavLink to="/leave-history">Historique des Congés</NavLink>
              </>
            )}
            <NavLink to="/profile">Profil</NavLink>
            <LogoutButton onClick={handleLogout}>Déconnexion</LogoutButton>
          </NavLinks>
        )}
      </Container>
    </Navbar>
  );
}

export default Header;