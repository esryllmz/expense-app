import React, { useState, ChangeEvent, FormEvent } from 'react';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { ApiResponse, AuthResponse } from '../types/auth';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const { data } = await api.post<ApiResponse<AuthResponse>>(endpoint, formData);
            
            if (isLogin && data.data) {
                localStorage.setItem('token', data.data.accessToken);
                // window.location.href yerine bunu kullanıyoruz:
                navigate('/dashboard'); 
            } else {
                alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
                setIsLogin(true);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Hata oluştu";
            alert(errorMsg);
        }
    };

    return (
        <div style={styles.container}>
            <form style={styles.card} onSubmit={handleSubmit}>
                <h2 style={styles.title}>{isLogin ? 'Giriş Yap' : 'Yeni Hesap Oluştur'}</h2>
                
                {!isLogin && (
                    <div style={styles.row}>
                        <input name="firstName" placeholder="Ad" style={styles.input} onChange={handleChange} required />
                        <input name="lastName" placeholder="Soyad" style={styles.input} onChange={handleChange} required />
                    </div>
                )}
                
                <input name="email" type="email" placeholder="E-posta Adresi" style={styles.input} onChange={handleChange} required />
                <input name="password" type="password" placeholder="Şifre" style={styles.input} onChange={handleChange} required />
                
                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
                </button>

                <p onClick={() => setIsLogin(!isLogin)} style={styles.toggle}>
                    {isLogin ? "Henüz hesabınız yok mu? Kaydolun" : "Zaten üye misiniz? Giriş yapın"}
                </p>
            </form>
        </div>
    );
};

// Google "Stitch" mantığında temiz bir tasarım
const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '40px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '400px' },
    title: { textAlign: 'center', color: '#1a73e8', marginBottom: '24px', fontWeight: '600' },
    row: { display: 'flex', gap: '10px' },
    input: { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #dadce0', fontSize: '14px', outline: 'none' },
    button: { width: '100%', padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'background 0.3s' },
    toggle: { textAlign: 'center', marginTop: '20px', color: '#1a73e8', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }
};

export default AuthPage;