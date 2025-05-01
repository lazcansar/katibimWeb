"use client";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '@/app/utils/supabase';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);


    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email, password
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/docs');
            }
        } catch (err) {
          console.error('Giriş Hatası:', err);
          setError('Beklenmeyen bir hata oluştu.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen rounded-lg px-4 lg:px-0">
            <h1 className="text-2xl font-semibold dark:text-white text-gray-900">Giriş Paneli</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div className="flex flex-col items-center justify-center border border-teal-900 rounded-lg px-4 py-2 my-4">
                    <input type="email" className="py-2 px-4 border rounded-lg my-2 outline-0 focus:outline-0 w-full focus:text-white" placeholder='E-Posta' value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" className="py-2 px-4 border rounded-lg my-2 outline-0 focus:outline-0 w-full focus:text-white" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button className="py-2 px-4 dark:bg-teal-950 dark:text-white bg-white text-teal-950 rounded-lg my-2 uppercase transition hover:bg-teal-700 cursor-pointer" type="submit">Giriş Yap</button>
                    <p className="dark:text-gray-200 my-2 text-center">Kayıt olmak için lütfen <strong>Katibim Uygulaması</strong> kullanın!</p>
                    <p className="my-2 flex flex-col md:flex-row flex-wrap gap-4">
                        <span className="border border-teal-900 rounded-lg px-2 py-1 inline-block transition hover:text-white"><a href="">Google Play Store</a></span>
                        <span className="border border-teal-900 rounded-lg px-2 py-1 inline-block transition hover:text-white"><a href="">App Store</a></span>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;