import pandas as pd
from googleapiclient.discovery import build
import json  # Impor modul json

# Membuat resource YouTube
youtube = build('youtube', 'v3', developerKey='AIzaSyArcckSe_uhEUupFCE_Az_vA3sQFKQ4fiY')

# Mendapatkan ID video dari URL
video_url = 'URL_VIDEO_YOUTUBE'
video_id = video_url.split('v=')[1]

# Request untuk mendapatkan komentar
request = youtube.commentThreads().list(
    part='snippet',
    videoId=video_id,
    maxResults=100,  # Jumlah maksimum komentar yang ingin diambil
    textFormat='plainText'
)
response = request.execute()

# Inisialisasi list untuk menyimpan data
comments_data = []

# Menyimpan data ke list
for item in response['items']:
    comment = item['snippet']['topLevelComment']['snippet']
    comments_data.append({
        'Author': comment['authorDisplayName'],
        'Comment': comment['textDisplay'],
        'DateTime': comment['publishedAt']
    })

# Konversi data ke JSON
json_data = json.dumps(comments_data, indent=4)

# Mengembalikan atau menyimpan data JSON
return json_data  # atau simpan ke file dengan open('comments.json', 'w').write(json_data)
