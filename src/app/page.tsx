"use client"
import { useEffect } from 'react'
import { supabase } from '@/app/utils/supabase'
import { useRouter } from "next/navigation";


function Page() {
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
            } else {
                router.push('/docs');
            }
        }
        checkSession();
    }, [router]);




    return (
        <div>
        </div>
    );
}


export default Page;

