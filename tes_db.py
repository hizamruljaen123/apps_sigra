import mysql.connector

# Konfigurasi koneksi ke MySQL
db_config = {
    'host': 'localhost',  # Ganti dengan host MySQL Anda
    'user': 'root',   # Ganti dengan username MySQL Anda
    'password': '',  # Ganti dengan password MySQL Anda
    'database': 'yt_sentiment',  # Ganti dengan nama database yang ingin Anda akses
    'port': 3300  # Port MySQL yang diinginkan (3300 sesuai permintaan Anda)
}

# Membuat koneksi ke MySQL
try:
    connection = mysql.connector.connect(**db_config)
    if connection.is_connected():
        print("Koneksi ke MySQL berhasil.")

        # Membuat cursor untuk menjalankan query
        cursor = connection.cursor()

        # Menjalankan query
        query = "SELECT * FROM youtube_comments"  # Ganti dengan nama tabel yang ingin Anda akses
        cursor.execute(query)

        # Mengambil hasil query
        results = cursor.fetchall()
        for row in results:
            # Proses data hasil query di sini
            print(row)

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    # Menutup cursor dan koneksi ketika selesai
    if 'cursor' in locals():
        cursor.close()
    if 'connection' in locals() and connection.is_connected():
        connection.close()
        print("Koneksi ke MySQL ditutup.")
