"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";

const DikteInput = () => {
    const [userEmail, setUserEmail] = useState('');
    const [title, setTitle] = useState('');
    const [inputText, setInputText] = useState('');
    const [interimText, setInterimText] = useState(''); // New state for interim results
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const isManualStop = useRef(false);
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
            setUserEmail(session.user.email ?? '');
            fetchData();
        }
        checkSession();
    }, [setUserEmail, router]);


    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const newRecognition = new SpeechRecognition();
            newRecognition.lang = 'tr-TR';
            newRecognition.interimResults = true; // Crucial for getting interim results
            newRecognition.continuous = true;

            newRecognition.onstart = () => {
                console.log('Dikte başladı.');
                setIsListening(true);
                isManualStop.current = false;
                setInterimText(''); // Clear interim text on start
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

                // Append final transcript to the main text area
                if (finalTranscript) {
                    setInputText((prevText) => prevText + finalTranscript + ' '); // Add a space after final results
                }

                // Display interim transcript separately
                setInterimText(interimTranscript);
            };

            newRecognition.onend = () => {
                console.log('Dikte sona erdi.');
                setIsListening(false);
                setInterimText(''); // Clear interim text on end
                // If not manually stopped, restart the recognition
                if (!isManualStop.current) {
                    console.log('Automatically restarted dictation.');
                    startDikte(); // Restart listening
                }
            };

            newRecognition.onerror = (event) => {
                console.error('Dikte hatası:', event.error);
                setIsListening(false);
                setInterimText(''); // Clear interim text on error
                if (!isManualStop.current) {
                    console.log('Automatically restarting after error.');
                    startDikte(); // Attempt to restart after error
                }
            };

            setRecognition(newRecognition);

            // Clean up on unmount
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
    }, []);

    const startDikte = () => {
        if (recognition && !isListening) {
            recognition.start();
        }
    };

    const stopDikte = () => {
        if (recognition && isListening) {
            isManualStop.current = true;
            recognition.stop();
        }
    };

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };

    useEffect(() => {
        return () => {
            if (recognition && isListening) {
                recognition.stop();
                console.log("Recognition stopped on unmount.");
            }
        };
    }, [recognition, isListening]);


    const backDocs = async () => {
        router.push('/docs');
    }




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

        const { data, error } = await supabase
            .from('doc') // Your table name
            .insert([
                { title: title, content: inputText },
            ]);

        if (error) {
            console.error("Kaydetme hatası:", error);
            alert("Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        } else {
            console.log("Başarıyla kaydedildi:", data);
            alert("Metin başarıyla kaydedildi!");
            // Optionally clear the inputs after saving
            setTitle('');
            setInputText('');
        }
    };


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

                {/* Display interim results here */}
                <div className="w-3/4 md:w-1/2 text-gray-400 text-center h-6">
                    {interimText}
                </div>

                <input
                    className="border border-gray-300 rounded-md w-3/4 md:w-1/2 text-white p-2 bg-gray-800 focus:outline-none focus:border-blue-500"
                    type="text"
                    placeholder="Başlık / Dosya No"
                    value={title} // Bind value to the state
                    onChange={handleTitleChange} // Add the change handler
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
                    onClick={handleSave} // Attach the save function
                    disabled={!userEmail || !title.trim() || !inputText.trim()} // Disable if required fields are empty
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