import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from '../config/consultas';
import { loginUsuario, obtenerUsuarioLogeado, registroUsuario } from '../config/consultas';
import '../styles/App.css';
import DashBoard from './DashBoard';

type FormMode = 'login' | 'register';

interface LoginProps {
    initialMode?: FormMode;
}

const initialForm = {
    nombre: '',
    email: '',
    password: '',
};

const Login = ({ initialMode }: LoginProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const mode: FormMode = location.pathname === '/register'
        ? 'register'
        : location.pathname === '/login'
            ? 'login'
            : initialMode ?? 'login';
    const [formData, setFormData] = useState(initialForm);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '');
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<number | null>(() => {
        const storedUser = localStorage.getItem('userId');
        return storedUser ? Number(storedUser) : null;
    });

    useEffect(() => {
        if (!token) return;

        const fetchUser = async () => {
            try {
                const profile = await obtenerUsuarioLogeado(token);
                setUser(profile);
                setUserId(profile.id);
                localStorage.setItem('userId', String(profile.id));
                setError('');
            } catch (err) {
                const error = err as Error & { status?: number; response?: unknown };
                const statusInfo = error.status ? ` [HTTP ${error.status}]` : '';
                const detail = error.response ? ` - ${JSON.stringify(error.response)}` : '';
                setError(`${error.message}${statusInfo}${detail}`);
                setToken('');
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                setUserId(null);
            }
        };

        void fetchUser();
    }, [token]);

    useEffect(() => {
        if (user && userId !== null) {
            void navigate('/dashboard', { replace: true });
        }
    }, [user, userId, navigate]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const response = await loginUsuario({
                    email: formData.email,
                    password: formData.password,
                });

                if (!response.token) {
                    throw new Error(response.mensaje || 'No se recibio token.');
                }

                localStorage.setItem('token', response.token);
                setToken(response.token);
                setMessage('Login correcto. Bienvenido.');
                setFormData(initialForm);
            } else {
                const response = await registroUsuario({
                    nombre: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                });

                setMessage(response.mensaje || 'Registro completado. Puedes iniciar sesion.');
                setFormData({ ...initialForm, email: formData.email });
                void navigate('/login', { replace: true });
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setToken('');
        setUser(null);
        setUserId(null);
        setMessage('Sesion cerrada.');
        void navigate('/login', { replace: true });
    };

    if (user && userId !== null) {
        return <DashBoard user={user} userId={userId} token={token} onLogout={handleLogout} />;
    }

    return (
        <div className="auth-container">
            <div className="auth-card auth-card--wide">
                <div className="auth-brand">
                    <div className="brand-mark">R</div>
                    <div>
                        <p className="brand-name">Recetas</p>
                        <p className="brand-tag">Cocina creativa y accesible</p>
                    </div>
                </div>

                <h1>{mode === 'login' ? 'Bienvenido de nuevo' : 'Unete a Recetas'}</h1>
                <p className="auth-description">
                    {mode === 'login'
                        ? 'Accede para crear, guardar y compartir tus mejores recetas.'
                        : 'Registrate y comienza a anotar y administrar tus platos favoritos.'}
                </p>

                <div className="auth-switch">
                    <button
                        type="button"
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => {
                            void navigate('/login');
                            setMessage('');
                            setError('');
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={mode === 'register' ? 'active' : ''}
                        onClick={() => {
                            void navigate('/register');
                            setMessage('');
                            setError('');
                        }}
                    >
                        Registro
                    </button>
                </div>

                <form onSubmit={(event) => void handleSubmit(event)} className="auth-form">
                    {mode === 'register' && (
                        <label>
                            Nombre
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Correo electronico
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="usuario@email.com"
                            required
                        />
                    </label>

                    <label>
                        Contrasena
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Contrasena"
                            required
                            minLength={6}
                        />
                    </label>

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
                    </button>
                </form>

                {message && <div className="auth-message success">{message}</div>}
                {error && <div className="auth-message error">{error}</div>}

                <p className="auth-switch-copy">
                    {mode === 'login' ? (
                        <>
                            No tienes cuenta?{' '}
                            <button type="button" className="link-button" onClick={() => void navigate('/register')}>
                                Crear cuenta
                            </button>
                        </>
                    ) : (
                        <>
                            Ya tienes cuenta?{' '}
                            <button type="button" className="link-button" onClick={() => void navigate('/login')}>
                                Iniciar sesion
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default Login;
