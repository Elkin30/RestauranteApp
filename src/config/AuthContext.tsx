import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { obtenerRol, Rol } from './authService';

type AuthState = {
  session: Session | null;
  rol: Rol;
  nombre: string;
  cargando: boolean;
  recargarRol: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  rol: 'desconocido',
  nombre: '',
  cargando: true,
  recargarRol: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [rol, setRol] = useState<Rol>('desconocido');
  const [nombre, setNombre] = useState('');
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [rolDe, setRolDe] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  // 1. Leer la sesión guardada y escuchar cambios (login, logout, refresco)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargandoSesion(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // 2. Cargar el rol cuando cambia el usuario
  //    (sin usuario no se consulta nada: rol y nombre se calculan abajo)
  const recargarRol = useCallback(async () => {
    if (!userId) return;
    await obtenerRol()
      .then((r) => {
        setRol(r.rol);
        setNombre(r.nombre);
      })
      .catch(() => {
        setRol('desconocido');
        setNombre('');
      })
      .finally(() => setRolDe(userId));
  }, [userId]);

  useEffect(() => {
    recargarRol();
  }, [recargarRol]);

  // Cargando mientras se lee la sesión o mientras se averigua el rol del usuario
  const cargando = cargandoSesion || (!!userId && rolDe !== userId);

  // Solo se exponen el rol y el nombre si pertenecen al usuario actual
  const rolListo = !!userId && rolDe === userId;

  return (
    <AuthContext.Provider
      value={{
        session,
        rol: rolListo ? rol : 'desconocido',
        nombre: rolListo ? nombre : '',
        cargando,
        recargarRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};