"use client"
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/app/utils/supabase";

const templateText = () => {

    const backDocs = async () => {
        router.push('/');
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
                <h1 className="text-2xl font-semibold dark:text-white text-gray-900">Şablon Oluştur</h1>
                <div className="my-2 flex gap-2">

                </div>


            </div>
        </>
    );
}

export default templateText;