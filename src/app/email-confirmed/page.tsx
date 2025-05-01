"use client"
import { useRouter } from "next/navigation";

const EmailConfirmedPage = () => {
    const router = useRouter();

    const handleLoginPage = async () => {
        router.push('/login');
    }
    return (
        <div>
            <div className="flex flex-col items-center justify-center py-16 rounded-lg px-4 lg:px-0 h-screen">
                <h1 className="text-2xl font-semibold text-center text-white">
                    E-Mail Adresiniz Başarılıyla Onaylandı!
                </h1>
                <p className="text-xl text-gray-100 my-2">
                    Artık başlamaya hazırsınız...
                </p>
                <p className="text-gray-100">
                    Uygulamayı kullanmaya başlamak için <button onClick={handleLoginPage} className="font-semibold underline">giriş sayfasını</button> ziyaret edin.
                </p>

            </div>
        </div>
    );
};

export default EmailConfirmedPage;