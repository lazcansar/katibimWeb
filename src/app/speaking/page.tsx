"use client"
import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";

const DikteInput = () => {
    const [userEmail, setUserEmail] = useState('');
    const [title, setTitle] = useState('');
    const [inputText, setInputText] = useState('');
    const [interimText, setInterimText] = useState(''); // Ara sonuçlar için yeni state
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(isListening);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const isManualStop = useRef(false);
    const router = useRouter();

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);
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
        if (typeof window === 'undefined') {
            return; // Sunucu tarafında veya window tanımlı değilse hiçbir şey yapma
        }
        const BrowserSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (BrowserSpeechRecognition) { // HATA ÇÖZÜMÜ: BrowserSpeechRecognition'ın varlığını kontrol et
            const newRecognitionInstance = new BrowserSpeechRecognition();
            newRecognitionInstance.lang = 'tr-TR';
            newRecognitionInstance.interimResults = true;
            newRecognitionInstance.continuous = true; // Sürekli dinleme için true

            newRecognitionInstance.onstart = () => {
                console.log('Dikte başladı.');
                setIsListening(true);
                isManualStop.current = false;
                setInterimText('');
            };

            newRecognitionInstance.onresult = (event: SpeechRecognitionEvent) => { // Event tipini ekledik
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInputText((prevText) => prevText + finalTranscript + ' ');
                    setInterimText('');
                }

                if (interimTranscript) {
                    const words = interimTranscript.split(' ');
                    setInterimText(words.slice(-10).join(' '));
                } else if (!finalTranscript && isListeningRef.current) {
                    setInterimText('');
                }
            };

            const attemptRestart = () => {
                // newRecognitionInstance'ın hala var olduğundan ve dinlemediğinden emin ol
                if (!isManualStop.current && newRecognitionInstance && !isListeningRef.current) {
                    console.log('Dikte otomatik olarak yeniden başlatılıyor (attemptRestart).');
                    try {
                        if (!isListeningRef.current) { // Ekstra kontrol
                            newRecognitionInstance.start();
                        }
                    } catch (error) {
                        console.error("Yeniden başlatma sırasında hata:", error);
                        // Belki burada setIsListening(false) tekrar çağrılmalı veya kullanıcıya bilgi verilmeli
                    }
                }
            };

            newRecognitionInstance.onend = () => {
                console.log('Dikte sona erdi.');
                setIsListening(false);
                setInterimText('');
                if (!isManualStop.current) {
                    console.log('Dikte otomatik olarak yeniden başlatılacak (onend).');
                    setTimeout(attemptRestart, 100);
                }
            };

            newRecognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => { // Event tipini ekledik
                console.error('Dikte hatası:', event.error);
                setIsListening(false);
                setInterimText('');
                if (!isManualStop.current && event.error !== 'not-allowed' && event.error !== 'aborted') {
                    console.log('Hatadan sonra yeniden başlatılmaya çalışılıyor.');
                    setTimeout(attemptRestart, 100);
                } else if (event.error === 'not-allowed') {
                    // alert yerine daha kullanıcı dostu bir bildirim gösterilebilir
                    console.warn("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.");
                    // Örnek: setNotification("Mikrofon erişimi reddedildi...");
                } else if (event.error === 'aborted') {
                    console.log('Dikte kullanıcı tarafından veya otomatik olarak durduruldu (aborted).');
                    // Manuel durdurma değilse ve sürekli dinleme isteniyorsa yeniden başlatılabilir.
                    // Ancak 'aborted' genellikle stop() çağrıldığında veya bazen ağ sorunlarında tetiklenir.
                    // isManualStop.current kontrolü burada önemli.
                    if (!isManualStop.current) {
                        setTimeout(attemptRestart, 100); // Otomatik durdurulduysa yeniden başlatmayı dene
                    }
                }
            };

            setRecognition(newRecognitionInstance);

            return () => {
                if (newRecognitionInstance) {
                    isManualStop.current = true; // Temizlik sırasında manuel durdurma olarak işaretle
                    newRecognitionInstance.stop();
                    console.log("Ana useEffect temizlenirken tanıma durduruldu.");
                }
            };

        } else {
            console.log('Tarayıcınız dikte özelliğini desteklemiyor.');
            // Kullanıcıya bu durumu bildiren bir UI elemanı gösterilebilir.
            // setNotification("Tarayıcınız dikte özelliğini desteklemiyor.");
        }

    }, []); // Bağımlılık dizisi boş, tanıma kurulumu bir kez çalışmalı

    const startDikte = () => {
        if (recognition && !isListening) {
            isManualStop.current = false; // Yeniden başlatırken manuel durdurma olmadığını belirt
            recognition.start();
        }
    };

    const stopDikte = () => {
        if (recognition && isListening) {
            isManualStop.current = true;
            recognition.stop();
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(event.target.value);
    };

    // Başlık inputu için işleyici
    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
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
                    rows={8}
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

            </div>
        </>
    );
};

export default DikteInput;