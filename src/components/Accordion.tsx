
"use client";
import { useState, useEffect } from 'react';

interface AccordionItem {
    id: number;
    title: string;
    content: string;
}

interface AccordionProps {
    data: AccordionItem[];
    onDelete: (id: number) => void;
}


function Accordion({ data, onDelete }: AccordionProps) {
    const [openItemId, setOpenItemId] = useState<number | null>(null);
    const [copiedItemId, setCopiedItemId] = useState<number | null>(null);
    const [sortedData, setSortedData] = useState<AccordionItem[]>([]);

    useEffect(() => {
        if (copiedItemId !== null) {
            const timer = setTimeout(() => {
               setCopiedItemId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedItemId]);

    useEffect(() => {
        const sorted = [...data].sort((a,b) => b.id - a.id);
        setSortedData(sorted);
    }, [data]);


    const toggleAccordion = (id: number) => {
        setOpenItemId(openItemId === id ? null : id);
    };

    const handleDelete = async (id: number) => {
        onDelete(id);
    }


    const copyToClipboard = async (text: string, id: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItemId(id);
        } catch (err) {
            console.error("Panoya kopyalama başarısız:", err);
        }
    };


    return (
        <div className="accordion">
            {sortedData.map((item) => (
                <div key={item.id} className="accordion-item border rounded mb-2 overflow-hidden">
                    <button
                        className="accordion-button flex justify-between items-center w-full py-2 px-4 text-left focus:outline-none"
                        onClick={() => toggleAccordion(item.id)}
                    >
                        <span className="font-medium">{item.title}</span>
                        <svg
                            className={`w-5 h-5 transition-transform ${openItemId === item.id ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    <div
                        className={`accordion-content py-2 px-4 bg-gray-600 ${openItemId === item.id ? '' : 'hidden'}`}>
                        <p>{item.content}</p>
                        <button
                            className="px-4 py-1 mt-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => copyToClipboard(item.content, item.id)}>
                            {copiedItemId === item.id ? 'Kopyalandı!' : 'Kopyala'}
                        </button>

                        <button
                            className="px-4 py-1 mt-2 cursor-pointer bg-amber-900 hover:bg-amber-800 text-white rounded ms-2"
                            onClick={() => handleDelete(item.id)}
                        >
                            Sil
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Accordion;