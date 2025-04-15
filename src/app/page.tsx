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




    return (
        <div>
        </div>
    );
}


export default Page;

