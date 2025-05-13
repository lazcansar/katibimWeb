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
    const [error, setError] = useState<string | null>(null);


    const fetchData = async () => {
        setLoading(true);
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
            setUserEmail(session.user.email ?? '');
            fetchData();
        }
        checkSession();
    }, [router, error, setUserEmail]);

    const handleProfile = async () => {
        router.push('/account');
    };

    const handleSpeaking = async () => {
        router.push('/speaking');
    }

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

    const handleUpdateAccordionContent = async (id: number, newContent: string) => {
        const originalData = [...accordionData];
        // Optimistic UI: Önce state'i güncelle
        setAccordionData(prevData =>
            prevData.map(item =>
                item.id === id ? { ...item, content: newContent } : item
            )
        );
        setError(null); // Önceki hatayı temizle

        try {
            setLoading(true); // İşlem başladığında
            const { error: updateError } = await supabase
                .from('doc')
                .update({ content: newContent /*, updated_at: new Date()*/ }) // updated_at eklenebilir
                .eq('id', id);

            if (updateError) {
                console.error("Supabase güncelleme hatası:", updateError);
                setError(`Öğe (ID: ${id}) güncellenirken hata oluştu.`);
                // Hata durumunda state'i geri al
                setAccordionData(originalData);
            }
            // Başarılıysa state zaten güncel
        } catch (catchError) {
            console.error("Supabase güncelleme sırasında beklenmeyen hata:", catchError);
            setError("Beklenmeyen bir güncelleme hatası oluştu.");
            setAccordionData(originalData); // Hata durumunda state'i geri al
        } finally {
            setLoading(false); // İşlem bittiğinde
        }
    };

    return (
        <div>
            <div className="p-4 shadow-lg">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center text-white">
                        <span className="block">Hesap: <strong>{userEmail}</strong></span>
                        <button onClick={handleSpeaking} className="cursor-pointer bg-amber-700 transition hover:bg-amber-600 rounded text-white py-1 px-4 text-black">
                            Dikte ile Yaz
                        </button>
                        <button onClick={handleProfile} className="cursor-pointer bg-blue-700 transition hover:bg-blue-600 rounded text-white py-1 px-4 text-black">
                            Hesabım
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
                <Accordion
                    data={accordionData}
                    onDelete={handleDeleteItem}
                    onUpdateContent={handleUpdateAccordionContent}
                />
            </div>

        </div>
    );
}


export default Page;

