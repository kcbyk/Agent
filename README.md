# 🚀 OpenArena Agent OS

> **Arena.ai Agent Mode ve Devin benzeri, %100 ÜCRETSİZ imkanlarla çalışabilen, otonom yapay zeka yazılım mühendisi platformu.**

---

## 🌟 Neden OpenArena Agent OS?

Arena.ai'nin Agent Mode özelliği muazzam bir otonom döngü sunar: Kod yazar, dosyaları düzenler, terminalde komut çalıştırır ve web'de araştırma yapar. Ancak çoğu kullanıcı pahalı API kotalarına takılır.

**OpenArena Agent OS**, tam olarak bu gücü **$0 (Sıfır Dolar)** maliyetle cebinize getirir:
1. **%100 Ücretsiz Modeller**: Groq (Llama 3.3 70B & DeepSeek R1 300+ token/sn), Google Gemini 2.5 Flash (1 Milyon context) ve OpenRouter Free modelleriyle tam uyumlu.
2. **Çevrimdışı / Yerel (Ollama)**: İnternetsiz, tamamen kendi bilgisayarınızda (GPU/CPU) sınırsız çalışabilme.
3. **Ücretsiz Web Arama (Zero-Key)**: Tavily veya Google API gerekmeden yerleşik DuckDuckGo Search motoru.
4. **Ücretsiz Web Sayfası Okuma**: Jina AI Reader (`r.jina.ai`) ile herhangi bir URL'i temiz Markdown olarak içeri alma.
5. **Fuzzy String Editör (Arena Style)**: Dosyaları baştan sona tekrar yazdırmadan, Cursor ve Arena gibi boşluk/girinti toleranslı cerrahi kod değiştirme (`edit_file`).
6. **Canlı Reverse Proxy & Önizleme**: Ajan içeride `npm run dev` veya `python main.py` başlattığında (örn. port 3000), tarayıcıda doğrudan canlı önizleme açılır!
7. **Çift Yönlü Terminal**: Ajan kod çalıştırırken siz de eşzamanlı olarak aynı dizinde manual bash komutları koşturabilirsiniz.
8. **İnteraktif ask_user Desteği**: Ajan kritik kararlarda veya belirsizliklerde durup size butonlu anketler sunar.

---

## 🏗️ Mimari Yapı

```
openarena/
├── backend/
│   ├── main.py                  # FastAPI sunucusu, SSE akışı ve canlı Proxy
│   ├── config.py                # Konfigürasyon ve çalışma alanı ayarları
│   ├── agent/
│   │   ├── react_engine.py      # Otonom ReAct (Düşünce + Eylem) döngüsü
│   │   ├── llm_router.py        # Groq, Gemini, OpenRouter, Ollama yönlendirici
│   │   └── prompt_templates.py  # Sistem istemi ve otonomi kuralları
│   ├── tools/
│   │   ├── file_tools.py        # Okuma, yazma, fuzzy-replace düzenleme, listeleme
│   │   ├── bash_tools.py        # Zaman aşımlı izole kabuk yürütücüsü
│   │   ├── process_tools.py     # Uzun ömürlü dev sunucuları yönetimi (PID, port takip)
│   │   ├── web_tools.py         # DuckDuckGo & Jina Reader (0 maliyetli arama & kazıma)
│   │   └── registry.py          # OpenAI Function Calling şemaları & dağıtıcı
│   └── workspace/               # Ajanın kod yazdığı, derlediği güvenli izole dizin
├── frontend/
│   ├── index.html               # Arena/Cursor benzeri bölünmüş ekran arayüzü
│   ├── css/style.css            # Dark mode, terminal & markdown stilleri
│   └── js/app.js                # SSE veri akışı, dosya ağacı, terminal & iframe yönetimi
├── run.sh                       # Tek tıkla başlatma betiği
└── requirements.txt             # Gerekli minimal Python kütüphaneleri
```

---

## ⚡ Hızlı Başlangıç (1 Dakikada Kurulum)

### 1. Depoyu İndirin ve Bağımlılıkları Yükleyin:
```bash
git clone https://github.com/your-username/openarena.git
cd openarena
pip install -r requirements.txt
```

### 2. Platformu Başlatın:
```bash
./run.sh
# veya
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Tarayıcıda Açın:
Tarayıcınızda `http://localhost:8000` adresine gidin.

---

## 🔑 %100 ÜCRETSİZ API Anahtarları Nasıl Alınır?

OpenArena hiçbir ücret ödemeden en güçlü yapay zekaları kullanmanızı sağlar:

### 1. Groq Cloud (En Hızlısı - Tavsiye Edilen)
- **Hız:** 300+ token/saniye (anında yanıt)
- **Model:** `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`
- **Maliyet:** 100% ÜCRETSİZ
- **Nasıl Alınır:** [console.groq.com/keys](https://console.groq.com/keys) adresine gidin, Google hesabınızla giriş yapın ve 1 tıkla API Key oluşturun.

### 2. Google Gemini API (Geniş Context & Zeki)
- **Kapasite:** 1.000.000 token context penceresi (koca projeleri tek seferde okur)
- **Model:** `gemini-2.5-flash`, `gemini-2.0-flash`
- **Maliyet:** Günlük 1.500 istek ücretsiz
- **Nasıl Alınır:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey) adresinden ücretsiz anahtarınızı alın.

### 3. OpenRouter Free Katmanı
- **Modeller:** `deepseek/deepseek-r1:free`, `meta-llama/llama-3.3-70b-instruct:free`
- **Nasıl Alınır:** [openrouter.ai/keys](https://openrouter.ai/keys) adresinden ücretsiz anahtarınızı alın.

### 4. Ollama (Tamamen Offline & Yerel)
- Bilgisayarınızda `ollama run llama3.2` veya `ollama run qwen2.5-coder` komutunu çalıştırın.
- OpenArena UI'da "Ollama: Llama 3.2" seçeneğini seçin. İnternet bile gerekmez!

---

## 🛠️ Ajan Yetenekleri & Araç Seti

| Araç Adı | Açıklama | Maliyet |
| :--- | :--- | :--- |
| `bash` | Workspace içinde terminal komutları, testler ve kurulumlar çalıştırır. | $0 (Yerel) |
| `write_file` | Yeni dosyalar oluşturur, dizinleri otomatik açar. | $0 (Yerel) |
| `edit_file` | Boşluk ve girintiye duyarlı akıllı fuzzy replacement yapar. | $0 (Yerel) |
| `read_file` | Dosya içeriklerini ve satır aralıklarını okur. | $0 (Yerel) |
| `list_directory`| Klasör yapısını keşfeder. | $0 (Yerel) |
| `web_search` | DuckDuckGo üzerinden güncel kütüphane ve dokümantasyon arar. | **$0 (API key gerekmez)** |
| `fetch_page` | Web sitelerini temiz Markdown olarak çeker. | **$0 (API key gerekmez)** |
| `start_process`| React, Vite, Node veya Python web sunucularını arka planda ayağa kaldırır. | $0 (Yerel) |
| `ask_user` | Gereksinimler belirsiz olduğunda kullanıcıya seçenekli anket sorar. | $0 (Yerel) |

---

## 🌐 Canlı Önizleme (Built-in Reverse Proxy)
Ajan bir web projesi hazırlayıp `start_process` ile örneğin `python -m http.server 3000` veya `npm run dev` başlattığında:
- OpenArena'nın yerleşik ters vekil sunucusu (`/proxy/{port}/`) devreye girer.
- Sağdaki "Canlı Önizleme" sekmesinde web sitesi anında görünür ve tıklanabilir hale gelir!

---

## 📜 Lisans
MIT License - Dilediğiniz gibi geliştirebilir, ticarileştirebilir veya açık kaynak olarak dağıtabilirsiniz.
