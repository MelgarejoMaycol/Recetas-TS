import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login initialMode="register" />} />
            <Route path="/dashboard" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    </BrowserRouter>
);

export default App;
