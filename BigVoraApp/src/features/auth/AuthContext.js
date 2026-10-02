// @refresh reset
import React, {createContext, useContext, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {login, logout, register as registerAccount} from '../../services/auth/auth.service';
import {clearSession, readSession, saveSession} from '../../services/auth/session.storage';
import {getProfile, updateProfile as updateProfileRequest, changePassword as changePasswordRequest} from '../../services/profile/profile.service';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    let active = true;
    readSession().then(async saved => {
      if (!saved || !active) return;
      try {
        const data = await getProfile(saved.token);
        const user = normalizeUser(data.user);
        const refreshed = {...saved, user};
        await saveSession(refreshed);
        if (active) setSession(refreshed);
      } catch (error) {
        if (error.status === 401) await clearSession();
        else if (active) setSession(saved);
      }
    })
      .catch(() => {
        if (active) Alert.alert('Login recovery', 'Unable to restore your saved login. Please sign in again.');
      })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const signIn = async credentials => {
    const nextSession = await login(credentials);
    await saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  };

  const register = async credentials => {
    const nextSession = await registerAccount(credentials);
    await saveSession(nextSession);
    setSession(nextSession);
    return nextSession.user;
  };

  const signOut = async () => {
    if (session?.token) {
      try { await logout(session.token); }
      catch {}
    }
    try { await clearSession(); }
    catch {
      Alert.alert('Unable to log out', 'Your saved login could not be removed. Please try again.');
      return false;
    }
    setSession(null);
    return true;
  };

  const user = session?.user || null;
  const token = session?.token || null;
  const replaceUser = async rawUser => {
    const nextSession = {...session, user: normalizeUser(rawUser)};
    await saveSession(nextSession); setSession(nextSession); return nextSession.user;
  };
  const updateProfile = async values => replaceUser((await updateProfileRequest(token, values)).user);
  const changePassword = values => changePasswordRequest(token, values);
  const syncUser = rawUser => replaceUser(rawUser);
  return (
    <AuthContext.Provider value={{user, token, authLoading, isAuthenticated: Boolean(user), signIn, register, signOut, updateProfile, changePassword, syncUser}}>
      {children}
    </AuthContext.Provider>
  );
}
function normalizeUser(user) {
  return {...user, name: user.fullName || user.name, phone: user.mobile || user.phone, addresses: user.addresses || []};
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
