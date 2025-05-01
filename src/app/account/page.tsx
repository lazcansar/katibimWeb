"use client"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {supabase} from "@/app/utils/supabase";


const AccountPage = () => {
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            const {data: {session}, error } = await supabase.auth.getSession();


            if (!session) {
                router.push('/login');
                return;
            }

            setUserEmail(session.user.email);
        }
        checkSession();
    }, [router]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Çıkış yaparken hata:", error);
        } else {
            router.push('/login');
        }
    };

    const backDocs = async () => {
        router.push('/docs');
    }

    return (
        <>
        <div className="p-4 shadow-lg">
            <div className="container mx-auto">
                <button
                    className="cursor-pointer text-white border rounded px-4 py-1 transition hover:bg-gray-100 hover:text-gray-900"
                    onClick={backDocs}>
                    Geri
                </button>
            </div>
        </div>
            <div className="flex flex-col items-center justify-center py-16 rounded-lg px-4 lg:px-0">
                <h1 className="text-2xl font-semibold dark:text-white text-gray-900">Profilim</h1>
            <div className="my-2 text-xl font-medium dark:text-white text-gray-900">
                E-Mail Adresiniz: {userEmail}
            </div>
            <div className="my-2 flex gap-2">
                <button onClick={handleSignOut}
                        className="cursor-pointer bg-blue-700 transition hover:bg-blue-800 text-white py-2 px-4 rounded inline-block">
                    Şifre Değiştir
                </button>
                <button onClick={handleSignOut}
                        className="cursor-pointer bg-green-700 transition hover:bg-green-800 text-white py-2 px-4 rounded inline-block">
                    Çıkış Yap
                </button>
            </div>


        </div>
        </>
    );
};

export default AccountPage;