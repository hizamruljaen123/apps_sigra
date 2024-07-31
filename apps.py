from flask import Flask, render_template, request, jsonify
import mysql.connector
from gensim import corpora, models
from dotenv import load_dotenv
from datetime import datetime
from lda_engine import load_lda_model_and_sentiment_data, calculate_sentiment_score, preprocess_weights,preprocess_words_sentences, train_lda_model, preprocess
import os
import scrapper
import pytz

app = Flask(__name__)
API_KEY = 'AIzaSyArcckSe_uhEUupFCE_Az_vA3sQFKQ4fiY'
db_config = {
    'host': 'localhost',  # Ganti dengan host MySQL Anda
    'user': 'root',   # Ganti dengan username MySQL Anda
    'password': '',  # Ganti dengan password MySQL Anda
    'database': 'yt_sentiment',  # Ganti dengan nama database yang ingin Anda akses
    # 'port': 3300  # Port MySQL yang diinginkan (3300 sesuai permintaan Anda)
}

connection = mysql.connector.connect(**db_config)



def load_sidebar():
    return render_template('sidebar.html')

def load_sentiment_data_from_table(table_name):
    cursor = connection.cursor()
    query = f"SELECT * FROM {table_name}"
    cursor.execute(query)
    data = cursor.fetchall()
    cursor.close()
    return data


# Rute untuk halaman beranda
@app.route('/')
def index():
    sidebar_content = load_sidebar()
    return render_template('index.html')



@app.route('/komentar')
def komentar():
    sidebar_content = load_sidebar()
    return render_template('komentar.html')

@app.route('/get_youtube_comments', methods=['GET'])
def get_youtube_comments():
    try:
        cur = connection.cursor()
        query = "SELECT * FROM youtube_comments"
        cur.execute(query)
        result = cur.fetchall()
        cur.close()

        # Konversi hasil ke format JSON
        comments_list = []
        for row in result:
            comments_list.append({
                'id': row[0],
                'Author': row[1],
                'Comment': row[2],
                'DateTime': row[3].strftime('%Y-%m-%d %H:%M:%S')  # Format datetime untuk JSON
            })

        return jsonify(comments_list)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/delete_youtube_comment/<int:id>', methods=['POST'])  # Atau gunakan 'DELETE' sebagai metode
def delete_youtube_comment(id):
    try:
        cur = connection.cursor()
        query = "DELETE FROM youtube_comments WHERE id = %s"
        cur.execute(query, [id])
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/truncate_youtube_comments', methods=['get'])
def truncate_youtube_comments():
    try:
        cur = connection.cursor()
        query = "TRUNCATE TABLE youtube_comments"
        cur.execute(query)
        connection.commit()
        cur.close()
        return jsonify({'status': 'success', 'message': 'All comments have been cleared successfully.'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



# Rute untuk halaman about
@app.route('/kamus_kalimat')
def kamus_kalimat():
    sidebar_content = load_sidebar()
    return render_template('kamus_kalimat.html')

# Rute untuk halaman about
@app.route('/merek_smartphone')
def tipe_smartphone():
    sidebar_content = load_sidebar()
    return render_template('tipe_smartphone.html')

@app.route('/get_kamus_kalimat', methods=['GET'])
def get_kamus_kalimat():
    try:
        cur = connection.cursor()
        query = "SELECT * FROM kamus_kalimat ORDER BY created DESC"
        cur.execute(query)
        result = cur.fetchall()
        cur.close()

        # Konversi hasil ke format JSON
        kamus_kalimat_list = []
        for row in result:
            kamus_kalimat_list.append({
                'id': row[0],
                'kalimat': row[1],  # Ganti 'kata' menjadi 'kalimat'
                'bobot_kalimat': str(row[2]),  # Konversi decimal ke string untuk keperluan JSON
                'sentimen': row[3]
            })

        return jsonify(kamus_kalimat_list)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Rute untuk halaman kamus kalimat
@app.route('/edit_kamus_kalimat/<int:id>', methods=['POST'])
def edit_kamus_kalimat(id):
    data = request.get_json()
    kalimat = data.get('kata_kalimat')  # Ganti 'kata' menjadi 'kalimat'
    bobot_kalimat = data.get('bobot_kalimat')  # Ganti 'bobot_kata' menjadi 'bobot_kalimat'
    sentimen = data.get('sentimen')

    try:
        cur = connection.cursor()
        query = "UPDATE kamus_kalimat SET kalimat = %s, bobot_kalimat = %s, sentimen = %s WHERE id = %s"
        cur.execute(query, (kalimat, bobot_kalimat, sentimen, id))
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/delete_kamus_kalimat/<int:id>', methods=['POST'])
def delete_kamus_kalimat(id):
    try:
        cur = connection.cursor()
        query = "DELETE FROM kamus_kalimat WHERE id = %s"
        cur.execute(query, [id])
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/simpan_sentimen_kalimat_terbaru', methods=['POST'])
def simpan_sentimen_kalimat_terbaru():
    data = request.get_json()
    kalimat = data.get('kata_kalimat')  # Ganti 'kata' menjadi 'kalimat'
    bobot = data.get('bobot')  # Ganti 'bobot_kata' menjadi 'bobot'
    sentimen = data.get('sentimen')

    table_name = "kamus_kalimat"
    columns = ["kalimat", "bobot_kalimat", "sentimen"]  # Ganti 'kata' menjadi 'kalimat'
    params = (kalimat, bobot, sentimen)

    query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(['%s' for _ in columns])})"

    try:
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



# Kamus Kata

@app.route('/get_kamus_kata', methods=['GET'])
def get_kamus_kata():
    try:
        cur = connection.cursor()
        query = "SELECT * FROM kamus_kata ORDER BY created DESC"
        cur.execute(query)
        result = cur.fetchall()
        cur.close()

        # Konversi hasil ke format JSON
        kamus_kata_list = []
        for row in result:
            kamus_kata_list.append({
                'id': row[0],
                'kata': row[1],
                'bobot_kata': str(row[2]),  # Konversi decimal ke string untuk keperluan JSON
                'sentimen': row[3]
            })

        return jsonify(kamus_kata_list)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Rute untuk halaman contact
@app.route('/kamus_kata')
def kamus_kata():
    sidebar_content = load_sidebar()
    return render_template('kamus_kata.html')

@app.route('/edit_kamus_kata/<int:id>', methods=['POST'])
def edit_kamus_kata(id):
    data = request.get_json()
    kata = data.get('kata_kalimat')
    bobot_kata = data.get('bobot')
    sentimen = data.get('sentimen')

    try:
        cur = connection.cursor()
        query = "UPDATE kamus_kata SET kata = %s, bobot_kata = %s, sentimen = %s WHERE id = %s"
        cur.execute(query, (kata, bobot_kata, sentimen, id))
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route('/delete_kamus_kata/<int:id>', methods=['POST'])
def delete_kamus_kata(id):
    try:
        cur = connection.cursor()
        query = "DELETE FROM kamus_kata WHERE id = %s"
        cur.execute(query, [id])
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/simpan_sentimen_kata_terbaru', methods=['POST'])
def simpan_sentimen_kata_terbaru():
    data = request.get_json()
    kata = data.get('kata_kalimat')
    bobot = data.get('bobot')
    sentimen = data.get('sentimen')

    table_name = "kamus_kata"
    columns = ["kata", "bobot_kata", "sentimen"]
    params = (kata, bobot, sentimen)

    query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(['%s' for _ in columns])})"

    try:
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



# Scraping

# Rute untuk halaman scrapping
@app.route('/scraping', methods=['GET'])
def scraping():
    sidebar_content = load_sidebar()
    return render_template('scraping.html')

@app.route('/scraping-data', methods=['POST'])
def scraping_data():
    sidebar_content = load_sidebar()
    if request.method == 'POST':
        youtube_urls = request.form.getlist('youtube_url[]')
        max_comments = int(request.form['max_comments'])
        
        result_data = []
        for url in youtube_urls:
            result_json = scrapper.get_youtube_comments(url, max_comments, API_KEY)
            result_data.append(result_json)

        return jsonify({'videos': result_data})


@app.route('/save_comment', methods=['POST'])
def save_comment():
    data = request.get_json()
    comments = data['comments']

    try:
        cur = connection.cursor()
        
        # Mengosongkan isi tabel yt_comments sebelum melakukan insert lagi
        cur.execute("TRUNCATE TABLE youtube_comments")

        for comment in comments:
            # Mengurai dan memformat tanggal dan waktu
            dt = datetime.strptime(comment['DateTime'], '%m/%d/%Y, %I:%M:%S %p')
            formatted_dt = dt.strftime('%Y-%m-%d %H:%M:%S')

            query = "INSERT INTO youtube_comments (Author, Comment, DateTime) VALUES (%s, %s, %s)"
            cur.execute(query, (comment['Author'], comment['Comment'], formatted_dt))
        
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



@app.route('/get_tipe', methods=['GET'])
def get_tipe():
    try:
        cur = connection.cursor()
        query = "SELECT * FROM tipe_smartphone ORDER BY id_data DESC"
        cur.execute(query)
        result = cur.fetchall()
        cur.close()

        # Konversi hasil ke format JSON
        merek_tipe = []
        for row in result:
            merek_tipe.append({
                'id_data': row[0],
                'merek': row[1],
                'tipe': row[2],  # Ganti 'kata' menjadi 'kalimat'
            })

        return jsonify(merek_tipe)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/delete_tipe/<int:id>', methods=['POST'])
def delete_tipe(id):
    try:
        cur = connection.cursor()
        query = "DELETE FROM tipe_smartphone WHERE id_data = %s"
        cur.execute(query, [id])
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/simpan_data_smartphone', methods=['POST'])
def simpan_data_smartphone():
    data = request.get_json()
    merek = data.get('merek')
    tipe = data.get('type')

    table_name = "tipe_smartphone"
    columns = ["Merek", "Tipe"]
    params = (merek, tipe)

    query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({', '.join(['%s' for _ in columns])})"

    try:
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/lda', methods=['GET'])
def lda():
    sidebar_content = load_sidebar()
    return render_template('hasil_lda.html')

@app.route('/hasil_lda', methods=['GET'])
def hasil_lda():
    # Load sentiment dictionary data from 'kamus_kalimat' and 'kamus_kata' tables
    kamus_kalimat_data = load_sentiment_data_from_table("kamus_kalimat")
    kamus_kata_data = load_sentiment_data_from_table("kamus_kata")

    kalimat_weights = {}
    kata_weights = {}

    # Mengambil bobot kalimat dari 'kamus_kalimat' table
    for data in kamus_kalimat_data:
        kalimat = data[1]
        bobot_kalimat = float(data[2])
        kalimat_weights[kalimat] = bobot_kalimat

    # Mengambil bobot kata dari 'kamus_kata' table
    for data in kamus_kata_data:
        kata = data[1]
        bobot_kata = float(data[2])
        kata_weights[kata] = bobot_kata

    # Gabungkan sentimen data dari kedua tabel ke dalam satu kamus bobot
    weights = {**kalimat_weights, **kata_weights}

    # Load test data from the 'youtube_comments' table
    comment_data = load_sentiment_data_from_table("youtube_comments")

    if not comment_data:
        # Handle the case where there are no comments
        return jsonify({"error": "No Comment Data"})

    documents = [preprocess_words_sentences(kalimat_weights, kata_weights)]

    lda_model, dictionary = train_lda_model(documents)

    # Memastikan documents dapat diakses di luar percabangan if-else
    if not documents:
        # Handle the case where there are no valid documents
        return jsonify({"error": "No valid documents found"})

    # print(weights)
    word_weights = preprocess_weights(weights)

    # Analyze sentiment using a combination of models
    results = []
    for row in comment_data:
        komentar = row[2]
        author = row[1]
        lda_score = calculate_sentiment_score(komentar, lda_model, dictionary)

        # Hitung word_checking_score

        words_in_comment = set(preprocess(komentar))
        word_checking_words = {word: weights[word] for word in words_in_comment if word in weights}
        
        if word_checking_words:
            word_checking_score = sum(word_checking_words.values()) / len(word_checking_words)
        else:
            word_checking_score = 0.0

        combined_score = lda_score + word_checking_score
        # Menambahkan kata-kata yang terdeteksi beserta bobotnya ke dalam respons JSON
        detected_words = [{"word": word, "weight": weight} for word, weight in word_checking_words.items()]

        # Menentukan status sentimen LDA
        lda_sentiment = "Positif" if lda_score > 0 else "Negatif" if lda_score < 0 else "Netral"

        # Menentukan status sentimen Word Count
        word_count_sentiment = "Positif" if word_checking_score > 0 else "Negatif" if word_checking_score < 0 else "Netral"

        results.append({
            "Author": author,
            "Komentar": komentar,
            "LDA Score": lda_score,
            "LDA Sentiment": lda_sentiment,  # Menambahkan status sentimen LDA
            "Word Checking Score": word_checking_score,
            "Word Count Sentiment": word_count_sentiment,  # Menambahkan status sentimen Word Count
            "Combined Score": combined_score,
            "Detected Words": detected_words
        })

    # Create a JSON response
    response_data = {
        "results": results
    }

    # print(response_data)

    return jsonify(response_data)

if __name__ == "__main__":
    app.run(debug=True, port=5001)