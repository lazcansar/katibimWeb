"use client";
import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

interface AccordionItem {
    id: number;
    title: string;
    content: string;
}

interface AccordionProps {
    data: AccordionItem[];
    onDelete: (id: number) => void;
    onUpdateContent: (id: number, newContent: string) => void;
}


function Accordion({ data, onDelete, onUpdateContent }: AccordionProps) {
    const [openItemId, setOpenItemId] = useState<number | null>(null);
    const [copiedItemId, setCopiedItemId] = useState<number | null>(null);
    const [sortedData, setSortedData] = useState<AccordionItem[]>([]);
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredData, setFilteredData] = useState<AccordionItem[]>([]);



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

        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const filtered = sorted.filter(
                item => item.title.toLowerCase().includes(lowercasedSearchTerm)
            );
            setFilteredData(filtered);
        } else {
            setFilteredData(sorted);
        }
    }, [data, searchTerm]);


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


    const handleAiProcess = async (id: number, currentContent: string) => {
        if (processingItemId === id) return; // Zaten işleniyorsa tekrar tetikleme

        setProcessingItemId(id); // İşlem başladı (bu bileşenin state'i)

        try {
            const response = await fetch('/api/ai/process-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: currentContent }),
            });

            if (!response.ok) {
                let errorMsg = `API isteği başarısız: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
	console.warn("Yanıt JSON olarak parse edilemedi, hata yoksayılıyor:", e);
				 }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            const processedText = result.processedText;

            if (typeof processedText === 'string') {
                // <<<=== BAŞARILI OLDUĞUNDA PARENT'TAKİ FONKSİYONU ÇAĞIR ===>>>
                onUpdateContent(id, processedText);
            } else {
                console.error("API'den beklenen formatta metin alınamadı:", result);
                throw new Error("API'den işlenmiş metin formatı alınamadı.");
            }

        } catch (error) {
            console.error("AI işleme hatası:", error);
        } finally {
            setProcessingItemId(null); // İşlem bitti (bu bileşenin state'i)
        }
    };


    const downloadAsPdf = (item: AccordionItem) => {
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.innerHTML = `
            <h1 style="font-size: 24px; margin-bottom: 15px;">${item.title}</h1>
            <p style="font-size: 16px; line-height: 1.5;">${item.content.replace(/\n/g, '<br>')}</p>
        `;

        html2pdf().from(element).set({
            margin: [10, 10, 10, 10], // top, left, bottom, right
            filename: `${item.title.replace(/\s/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
    };



    return (
        <div className="accordion">

            <div className="mb-4 p-4 bg-gray-700 rounded shadow-md">
                <input
                    type="text"
                    placeholder="Başlığa göre ara..."
                    className="w-full p-2 rounded border border-gray-500 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>


            {filteredData.length > 0 ? (
                filteredData.map((item) => ( // filteredData'yı kullanıyoruz
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
                            <p className="whitespace-pre-wrap mb-1">{item.content}</p>

                            <button
                                className={`px-4 py-1 mt-2 cursor-pointer bg-green-600 hover:bg-green-500 text-white rounded me-2 ${processingItemId === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleAiProcess(item.id, item.content)}
                                disabled={processingItemId === item.id}
                            >
                                {processingItemId === item.id ? 'İşleniyor...' : 'AI Kullan'}
                            </button>
                            <button
                                className="px-4 py-1 mt-2 cursor-pointer bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={() => copyToClipboard(item.content, item.id)}>
                                {copiedItemId === item.id ? 'Kopyalandı!' : 'Kopyala'}
                            </button>

                            <button className="px-4 py-1 mt-2 cursor-pointer bg-amber-600 text-white rounded hover:bg-amber-500 ms-2"
                                    onClick={() => downloadAsPdf(item)}>
                                PDF Olarak İndir
                            </button>

                            <button
                                className="px-4 py-1 mt-2 cursor-pointer bg-amber-900 hover:bg-amber-800 text-white rounded ms-2"
                                onClick={() => handleDelete(item.id)}
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-white text-center mt-4">Gösterilecek öğe bulunamadı.</p>
            )}
        </div>
    );
}

export default Accordion;