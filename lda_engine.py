from gensim import corpora, models
import os
import re

# Preprocessing Teks
def preprocess(text):
    # Tambahkan logika preprocessing sesuai kebutuhan
    # Contoh sederhana: ubah teks menjadi huruf kecil dan hapus karakter non-alfanumerik
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    words = text.split()
    return words

# Modifikasi struktur data bobot untuk analisis perkata
def preprocess_words_sentences(kalimat_weights, kata_weights):
    word_weights = {}

    # Memproses bobot kalimat
    for kalimat, weight in kalimat_weights.items():
        words_in_kalimat = preprocess(kalimat)
        for word in words_in_kalimat:
            if word in word_weights:
                word_weights[word].append(weight)
            else:
                word_weights[word] = [weight]

    # Memproses bobot kata
    for kata, weight in kata_weights.items():
        if kata in word_weights:
            word_weights[kata].append(weight)
        else:
            word_weights[kata] = [weight]

    for word, weight_list in word_weights.items():
        word_weights[word] = sum(weight_list) / len(weight_list)

    return word_weights

# Train the LDA model
def train_lda_model(documents, num_topics=5, passes=25, iterations=25):
    dictionary = corpora.Dictionary(documents)
    corpus = [dictionary.doc2bow(doc) for doc in documents]

    print("Melatih model LDA...")
    lda_model = models.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=passes, iterations=iterations)

    print("Model berhasil dilatih!")
    return lda_model, dictionary

import re

def preprocess_weights(weights_data):
    word_weights = {}

    for data in weights_data:
        if len(data) < 3:
            continue  # Skip data yang tidak memiliki format yang diharapkan

        phrase = data[1]
        weight = data[2]

        # Cek apakah weight adalah angka valid
        if not isinstance(weight, (int, float)):
            continue  # Skip data yang tidak valid

        # Preprocess phrase
        phrase = phrase.lower()  # Ubah ke huruf kecil
        phrase = re.sub(r'[^a-zA-Z\s]', '', phrase)  # Hapus karakter non-alfanumerik
        words = phrase.split()  # Pisahkan menjadi kata-kata

        for word in words:
            if word in word_weights:
                word_weights[word].append(weight)
            else:
                word_weights[word] = [weight]

    # Hitung rata-rata bobot kata
    for word, weight_list in word_weights.items():
        word_weights[word] = sum(weight_list) / len(weight_list)

    return word_weights


# Fungsi untuk menghitung skor sentimen dengan kombinasi LDA dan bobot per kata
def calculate_sentiment_score(sentence, lda_model, dictionary):
    doc_bow = dictionary.doc2bow(preprocess(sentence))
    topic_scores = lda_model[doc_bow]
    lda_score = max(topic_scores, key=lambda item: item[1])[1] - 0.5

    return lda_score


# Fungsi untuk memuat model LDA dan data sentimen
def load_lda_model_and_sentiment_data(sentiment_dictionary):
    if not os.path.exists("model"):
        os.makedirs("model")

    MODEL_PATH = "model/lda_model"

    documents = [preprocess(phrase) for phrase, _ in sentiment_dictionary]

    if os.path.exists(MODEL_PATH):
        lda_model = models.LdaModel.load(MODEL_PATH)
        dictionary = corpora.Dictionary(documents)
    else:
        lda_model, dictionary = train_lda_model(documents)
        lda_model.save(MODEL_PATH)

    word_weights = preprocess_weights(sentiment_dictionary)

    return lda_model, dictionary, word_weights
