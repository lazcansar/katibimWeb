"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";

const DikteInput = () => {
    const [userEmail, setUserEmail] = useState('');
    const [title, setTitle] = useState('');
    const [inputText, setInputText] = useState('');
    const [interimText, setInterimText] = useState(''); // Ara sonuçlar için yeni state
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const isManualStop = useRef(false);
    const router = useRouter();

    // Bileşen yüklendiğinde kullanıcı oturumunu ve e-postasını kontrol et
    useEffect(() => {
        async function checkSession() {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Oturum bilgisi alınamadı:", error);
                router.push('/login'); // Oturum alınamazsa login'e yönlendir
                return;
            }

            if (!session) {
                router.push('/login'); // Aktif oturum yoksa login'e yönlendir
                return;
            }
            setUserEmail(session.user.email ?? '');
            // fetchData(); // Önceki kodda tanımlı değildi, kaldırıldı
        }
        checkSession();
        // router'ı bağımlılık dizisine ekle
    }, [router]); // setUserEmail bağımlılığı genellikle gereksizdir

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const newRecognition = new SpeechRecognition();
            newRecognition.lang = 'tr-TR';
            newRecognition.interimResults = true; // Ara sonuçlar için true
            newRecognition.continuous = true; // Kesintisiz dinleme için true (onend'de yeniden başlatma daha sağlam)

            newRecognition.onstart = () => {
                console.log('Dikte başladı.');
                setIsListening(true);
                isManualStop.current = false;
                setInterimText(''); // Başlangıçta ara metni temizle
            };

            newRecognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Nihai metni ana metin alanına ekle
                if (finalTranscript) {
                    setInputText((prevText) => prevText + finalTranscript + ' '); // Nihai sonuçtan sonra boşluk ekle
                    setInterimText(''); // Nihai metin alındığında ara metni temizle
                }

                // Ara metni işle ve sadece son 10 kelimeyi göster
                if (interimTranscript) {
                    const words = interimTranscript.split(' '); // Metni kelimelere ayır
                    if (words.length > 10) { // 10 kelime sınırı
                        // Eğer 10'dan fazlaysa, son 10 kelimeyi al ve tekrar birleştir
                        setInterimText(words.slice(-10).join(' '));
                    } else {
                        // 10 veya daha azsa, tamamını göster
                        setInterimText(interimTranscript);
                    }
                } else if (!finalTranscript && isListening) {
                    // Eğer ne nihai ne de ara metin varsa ve hala dinleniyorsa, ara alanı temizle (kısa duraklama veya başlangıç olabilir)
                    setInterimText('');
                }
            };

            newRecognition.onend = () => {
                console.log('Dikte sona erdi.');
                setIsListening(false);
                setInterimText(''); // Bitişte ara metni temizle
                // Manuel olarak durdurulmadıysa, tanımayı yeniden başlat
                if (!isManualStop.current) {
                    console.log('Dikte otomatik olarak yeniden başlatıldı.');
                    // Ortam gürültülüyse anında yeniden bitmesini önlemek için küçük bir gecikme eklenebilir
                    setTimeout(() => startDikte(), 100);
                }
            };

            newRecognition.onerror = (event) => {
                console.error('Dikte hatası:', event.error);
                setIsListening(false);
                setInterimText(''); // Hatada ara metni temizle
                // event.error'a göre özel hata işleme eklenebilir.
                // Örneğin, izin reddedilirse otomatik yeniden başlatma yapma.
                if (!isManualStop.current && event.error !== 'not-allowed') {
                    console.log('Hatadan sonra yeniden başlatılmaya çalışılıyor.');
                    setTimeout(() => startDikte(), 100);
                } else if (event.error === 'not-allowed') {
                    alert("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.");
                }
            };

            setRecognition(newRecognition);

            // Bileşen unmount edildiğinde temizlik yap
            return () => {
                if (newRecognition) {
                    newRecognition.stop();
                }
            };

        } else {
            console.log('Tarayıcınız dikte özelliğini desteklemiyor.');
        }

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []); // Bağımlılık dizisi boş, tanıma kurulumu bir kez çalışmalı

    const startDikte = () => {
        if (recognition && !isListening) {
            recognition.start();
        }
    };

    const stopDikte = () => {
        if (recognition && isListening) {
            isManualStop.current = true; // Manuel durduruldu olarak işaretle
            recognition.stop();
        }
    };

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    // Başlık inputu için işleyici
    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };


    // Bileşen unmount edildiğinde tanımayı durdurmak için temizlik efekti
    useEffect(() => {
        return () => {
            if (recognition && isListening) {
                recognition.stop();
                console.log("Bileşen kaldırılırken tanıma durduruldu.");
            }
        };
        // Bağımlılık dizisi, recognition veya isListening değişirse bu efektin yeniden çalışmasını sağlar
    }, [recognition, isListening]);


    // Veriyi Supabase'e kaydetme fonksiyonu
    const handleSave = async () => {
        if (!userEmail) {
            alert("Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.");
            router.push('/login');
            return;
        }

        if (!title.trim()) {
            alert("Lütfen bir başlık veya dosya numarası girin.");
            return;
        }

        if (!inputText.trim()) {
            alert("Kaydedilecek metin boş olamaz.");
            return;
        }

        // user_email sütununu insert işlemine dahil et
        const { data, error } = await supabase
            .from('doc') // Tablonuzun adı
            .insert([
                { title: title, content: inputText }, // Eklenecek sütunlar
            ]);

        if (error) {
            console.error("Kaydetme hatası:", error);
            alert("Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        } else {
            console.log("Başarıyla kaydedildi:", data);
            alert("Metin başarıyla kaydedildi!");
            // İsteğe bağlı olarak kaydettikten sonra inputları temizle
            setTitle('');
            setInputText('');
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

            <div className="flex flex-col items-center justify-center h-screen rounded-lg px-4 lg:px-0 text-white gap-4">
                <div className="flex flex-col items-center justify-center ">
                    <h1 className="text-white text-2xl font-bold">Dikte Et ve Kaydet!</h1>
                    <h2 className="text-gray-200 text-base font-medium">AI ile işle ve dikte hatalarını düzelt!</h2>
                </div>

                <div className="flex flex-row flex-wrap gap-4">
                    <button
                        className="border border-gray-700 px-6 py-3 bg-blue-600 rounded-md inline-block transition hover:bg-blue-500 cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                        onClick={startDikte}
                        disabled={isListening || !recognition}
                    >
                        {isListening ? 'Dinleniyor...' : 'Dikteyi Başlat'}
                    </button>
                    <button
                        className="border border-gray-700 px-6 py-3 bg-amber-600 rounded-md inline-block transition hover:bg-amber-500 cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
                        onClick={stopDikte}
                        disabled={!isListening || !recognition}
                    >
                        Dikteyi Durdur
                    </button>
                </div>

                {/* Ara sonuçları burada göster */}
                <div className="w-3/4 md:w-1/2 text-gray-400 text-center h-6">
                    {interimText}
                </div>

                <input
                    className="border border-gray-300 rounded-md w-3/4 md:w-1/2 text-white py-2 px-4 bg-gray-800 focus:outline-none focus:border-blue-500"
                    type="text"
                    placeholder="Başlık / Dosya No"
                    value={title} // Değeri state'e bağla
                    onChange={handleTitleChange} // Değişiklik işleyicisini ekle
                />

                <textarea
                    className="border border-gray-300 rounded-md w-3/4 md:w-1/2 text-white p-4 bg-gray-800 focus:outline-none focus:border-blue-500"
                    rows="8"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Buraya dikte edilecek metin gelecek..."
                />

                <button
                    className="border border-gray-700 px-6 py-2 bg-blue-600 rounded-md inline-block transition hover:bg-blue-500 cursor-pointer disabled:bg-gray-600"
                    onClick={handleSave} // Kaydetme fonksiyonunu bağla
                    disabled={!userEmail || !title.trim() || !inputText.trim()} // Gerekli alanlar boşsa devre dışı bırak
                >
                    Kaydet
                </button>

                {!('webkitSpeechRecognition' in window) && (
                    <p className="text-red-500">Tarayıcınız bu özelliği desteklemiyor.</p>
                )}
            </div>
        </>
    );
};

export default DikteInput;