// app/api/ai/process-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Gemini API anahtarı bulunamadı.");
        return NextResponse.json({ error: 'API anahtarı yapılandırılmamış.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const textToProcess = body.text;

        if (!textToProcess || typeof textToProcess !== 'string') {
            return NextResponse.json({ error: 'İşlenecek metin sağlanmadı veya formatı yanlış.' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const generationConfig = {
            temperature: 0.2, // Daha deterministik, daha az yaratıcı yanıtlar için düşük sıcaklık
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048, // Metin uzunluğuna göre ayarlayın
        };

        // Güvenlik ayarları (İsteğe bağlı, hassas içerikleri engellemek için)
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        // --- Dikkatlice Hazırlanmış Prompt ---
        const prompt = `
        Aşağıdaki metni analiz et ve şu görevleri yerine getir:
        1.  Yazım ve noktalama hatalarını düzelt.
        2.  Anlam bütünlüğünü kontrol et (ama ana anlamı ASLA değiştirme).
        3.  Anlamsal olarak yeni bir paragrafa başlanması gereken yerlerde paragraf başı yap (yeni satır ekle).
        4.  Metnin orijinal anlamını, kullanılan kelimeleri ve cümle yapısını KESİNLİKLE değiştirme. Sadece belirtilen düzeltmeleri yap.
        5.  Yanıt olarak SADECE işlenmiş metni döndür, başka hiçbir açıklama ekleme.

        İşlenecek Metin:
        ---
        ${textToProcess}
        ---
        İşlenmiş Metin:
        `;
        // --- Prompt Sonu ---


        const parts = [{ text: prompt }];

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        if (!result.response) {
            console.error("Gemini'den geçerli bir yanıt alınamadı:", result);
            return NextResponse.json({ error: 'AI modelinden yanıt alınamadı.' }, { status: 500 });
        }

        const processedText = result.response.text(); // text() metodunu kullanın

        return NextResponse.json({ processedText });

    } catch (error) {
        console.error("API rotasında hata:", error);
        // Daha detaylı hata loglama veya izleme eklenebilir
        if (error instanceof Error) {
            return NextResponse.json({ error: 'Metin işlenirken bir hata oluştu.', details: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Metin işlenirken bilinmeyen bir hata oluştu.' }, { status: 500 });
    }
}