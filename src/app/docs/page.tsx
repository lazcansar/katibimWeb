"use client"
import Accordion from "@/components/Accordion";
import { useState, useEffect } from 'react'
import { supabase } from '@/app/utils/supabase'
import { useRouter } from "next/navigation";

interface AccordionItem {
    id: number;
    title: string;
    content: string;
}


function Page() {
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const [accordionData, setAccordionData] = useState<AccordionItem[]>([]);
    const [loading, setLoading] = useState(false);


    const fetchData = async () => {
        setLoading(true); // Yükleniyor durumunu true yap
        try {
            const { data, error } = await supabase.from('doc').select('id, title, content');

            if (error) {
                console.error('Veri çekme hatası:', error);
                return; // Hata varsa fonksiyondan çık
            }

            if (data) {
                setAccordionData(data as AccordionItem[]);
            }
        } catch (error) {
            console.error('Veri çekme sırasında beklenmeyen hata:', error);
        } finally {
            setLoading(false); // Yükleniyor durumunu false yap (her durumda)
        }
    };


    useEffect(() => {
        async function checkSession() {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Oturum bilgisi alınamadı:", error);
                router.push('/login');
                return;
            }

            if (!session) {
                router.push('/login');
                return;
            }
            setUserEmail(session.user.email);
            fetchData();
        }
        checkSession();
    }, [router]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Çıkış yaparken hata:", error);
        }else {
            router.push('/login');
        }
    };

    const handleDeleteItem = async (id: number) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('doc').delete().eq('id', id);
            if (error) {
                console.error("Silme işlemi sırasında hata oluştu.", error);
            }else {
                setAccordionData(prevData => prevData.filter(item => item.id !== id));
            }
        }catch (error) {
            console.error("Silme işlemi sırasında beklenmeyen hata oluştu.", error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div>
            <div className="bg-teal-800">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center text-white">
                        <span className="block">Sisteme giriş yapan kullanıcı: <strong>{userEmail}</strong></span>
                        <button onClick={handleSignOut} className="cursor-pointer bg-amber-900 transition hover:bg-amber-700 text-white py-1 px-4 text-black">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto my-8 text-white">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4 cursor-pointer"
                    onClick={fetchData}
                    disabled={loading}
                >
                    {loading ? 'Yükleniyor...' : 'Yeni Kayıtları Getir'}
                </button>
                <Accordion data={accordionData} onDelete={handleDeleteItem} />
            </div>

        </div>
    );
}


export default Page;

