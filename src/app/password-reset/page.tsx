"use client";

import { useState } from 'react';
import { supabase } from '@/app/utils/supabase';
import Link from 'next/link'; // Giriş sayfasına geri dönmek için


const PasswordResetPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Yükleme durumu için

    const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // Kullanıcı e-postadaki linke tıkladığında yönlendirilecek sayfa
                // Bu sayfa, kullanıcının yeni şifresini belirleyeceği yer olacak.
                // Genellikle /update-password veya /reset-password gibi bir rota kullanılır.
                // Buradaki '/update-password' rotasını kendiniz oluşturmanız gerekecek.
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) {
                setError(error.message);
                setMessage(null); // Hata varsa başarı mesajını temizle
            } else {
                // Güvenlik gereği, e-postanın var olup olmadığını açıkça belirtmeyiz.
                // Her durumda aynı mesajı göstermek daha güvenlidir.
                setMessage('Şifre sıfırlama bağlantısı, eğer sistemimizde kayıtlıysa, e-posta adresinize gönderildi.');
                setError(null); // Başarı varsa hata mesajını temizle
                setEmail(''); // E-posta alanını temizle
            }
        } catch (err) {
            console.error('Şifre Sıfırlama İsteği Hatası:', err);
            setError('Şifre sıfırlama isteği sırasında beklenmeyen bir hata oluştu.');
            setMessage(null); // Hata varsa başarı mesajını temizle
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen rounded-lg px-4 lg:px-0">
            <h1 className="text-2xl font-semibold dark:text-white text-gray-900">Şifre Sıfırlama</h1>

            {/* Mesaj ve Hata Alanları */}
            {loading && <p className="text-blue-500">İşlem yapılıyor...</p>}
            {message && <p className="text-green-500">{message}</p>}
            {error && <p className="text-red-500">{error}</p>}


            <form onSubmit={handlePasswordReset}>
                <div className="flex flex-col items-center justify-center border border-teal-900 rounded-lg px-4 py-2 my-4">
                    <p className="dark:text-gray-300 text-gray-700 mb-4 text-center">Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.</p>
                    <input
                        type="email"
                        className="py-2 px-4 border rounded-lg my-2 outline-0 focus:outline-0 w-full focus:text-white"
                        placeholder='E-Posta Adresiniz'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading} // İşlem sürerken alanı devre dışı bırak
                    />

                    <button
                        className="py-2 px-4 dark:bg-amber-700 dark:text-white bg-amber-700 text-white rounded-lg my-2 uppercase transition hover:bg-amber-600 cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading} // İşlem sürerken butonu devre dışı bırak
                    >
                        {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                    </button>

                    {/* Giriş sayfasına geri dön linki */}
                    <div className="mt-4 text-center">
                        <Link href="/login" className="dark:text-teal-400 text-teal-700 hover:underline">
                            Giriş Sayfasına Geri Dön
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PasswordResetPage;