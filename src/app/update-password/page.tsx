"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase'; // Supabase client dosyanızın yolunu doğru ayarlayın
import Link from 'next/link'; // Giriş sayfasına geri dönmek için Link kullanabilirsiniz

const UpdatePasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false); // Linkin geçerliliği ve oturumun yüklenmesi için kontrol
    const router = useRouter();

    // Bileşen yüklendiğinde URL'deki tokenları kontrol et ve oturumu yükle
    // Supabase JS client'ı genellikle bu işlemi otomatik yapar.
    // Burada sadece oturumun başarılı yüklenip yüklenmediğini kontrol edip formu görünür yapıyoruz.
    useEffect(() => {
        const checkSession = async () => {
            // Supabase client'ı URL hash'indeki tokenları otomatik olarak okur
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                console.log("Oturum linkten başarıyla yüklendi. Yeni şifre belirlenebilir.");
                setSessionLoaded(true);
            } else {
                console.warn("Oturum bulunamadı. Link geçersiz veya süresi dolmuş olabilir.");
                setError('Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama talebinde bulunun.');
                setSessionLoaded(false); // Formu gizle
                // Geçersiz link durumunda otomatik yönlendirme yapabilirsiniz
                // setTimeout(() => router.push('/login'), 5000); // 5 saniye sonra login'e git
            }
        };

        // Sadece client tarafında çalıştığından emin olmak için
        if (typeof window !== 'undefined') {
            checkSession();
        }
    }, []); // Component mount edildiğinde bir kere çalıştır


    const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor.');
            return;
        }

        if (newPassword.length < 6) { // Supabase varsayılan minimum şifre uzunluğu
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);

        try {
            // updateUser metodu, URL'den yüklenen geçici oturumu kullanarak şifreyi günceller
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Şifre güncelleme hatası:', error);
                setError(error.message);
                setMessage(null); // Hata varsa başarı mesajını temizle
            } else {
                console.log('Şifre başarıyla güncellendi:', data);
                setMessage('Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
                setError(null); // Başarı varsa hata mesajını temizle
                setNewPassword('');
                setConfirmPassword('');

                // Başarılı olunca login sayfasına yönlendir
                setTimeout(() => {
                    router.push('/login');
                }, 3000); // 3 saniye sonra giriş sayfasına yönlendir
            }
        } catch (err) {
            console.error('Şifre güncelleme sırasında beklenmeyen hata:', err);
            setError('Şifre güncelleme sırasında beklenmeyen bir hata oluştu.');
            setMessage(null); // Hata varsa başarı mesajını temizle
        } finally {
            setLoading(false);
        }
    };

    // Eğer oturum henüz yüklenmediyse ve hata yoksa bir yükleme/kontrol mesajı göster
    if (!sessionLoaded && !error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="dark:text-white text-gray-900">Link kontrol ediliyor ve oturum yükleniyor...</p>
            </div>
        );
    }


    return (
        <div className="flex flex-col items-center justify-center h-screen rounded-lg px-4 lg:px-0">
            <h1 className="text-2xl font-semibold dark:text-white text-gray-900">Yeni Şifre Belirle</h1>

            {/* Mesaj ve Hata Alanları */}
            {loading && <p className="text-blue-500">İşlem yapılıyor...</p>}
            {message && <p className="text-green-500">{message}</p>}
            {error && <p className="text-red-500">{error}</p>}

            {/* Sadece oturum yüklendiyse ve hata yoksa formu göster */}
            { sessionLoaded && !error && (
                <form onSubmit={handlePasswordUpdate}>
                    <div className="flex flex-col items-center justify-center border border-teal-900 rounded-lg px-4 py-2 my-4">
                        <p className="dark:text-gray-300 text-gray-700 mb-4 text-center">Hesabınız için yeni bir şifre belirleyin.</p>
                        <input
                            type="password"
                            className="py-2 px-4 border rounded-lg my-2 outline-0 focus:outline-0 w-full focus:text-white"
                            placeholder='Yeni Şifre'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading} // İşlem sürerken inputları devre dışı bırak
                        />
                        <input
                            type="password"
                            className="py-2 px-4 border rounded-lg my-2 outline-0 focus:outline-0 w-full focus:text-white"
                            placeholder='Yeni Şifreyi Onayla'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading} // İşlem sürerken inputları devre dışı bırak
                        />

                        <button
                            className="py-2 px-4 dark:bg-teal-950 dark:text-white bg-white text-teal-950 rounded-lg my-2 uppercase transition hover:bg-teal-700 cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading} // İşlem sürerken butonu devre dışı bırak
                        >
                            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>

                        {/* Giriş sayfasına geri dön linki */}
                        <div className="mt-4 text-center">
                            <Link href="/login" className="dark:text-teal-400 text-teal-700 hover:underline">
                                Giriş Sayfasına Geri Dön
                            </Link>
                        </div>
                    </div>
                </form>
            )}

            {/* Hata mesajı varsa veya oturum yüklenemediyse gösterilecek geri dön linki */}
            { (error || !sessionLoaded) && (
                <div className="mt-4 text-center">
                    <Link href="/login" className="dark:text-teal-400 text-teal-700 hover:underline">
                        Giriş Sayfasına Geri Dön
                    </Link>
                </div>
            )}
        </div>
    );
};

export default UpdatePasswordPage;