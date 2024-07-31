import json
import os
from dotenv import load_dotenv
from googleapiclient.discovery import build

load_dotenv()

def get_youtube_comments(video_url, max_result, api_key=os.getenv('API_KEY')):
    """
    Fungsi untuk mengambil komentar dari video YouTube.

    Args:
    video_url (str): URL dari video YouTube.
    api_key (str): API key untuk YouTube Data API v3.

    Returns:
    str: Komentar dalam format JSON.
    """
    # Membuat resource YouTube
    youtube = build('youtube', 'v3', developerKey=api_key)

    # Mendapatkan ID video dari URL
    video_id = video_url.split('v=')[1]

    # Request untuk mendapatkan komentar
    comment_request = youtube.commentThreads().list(
        part='snippet',
        videoId=video_id,
        maxResults=max_result,  # Jumlah maksimum komentar yang ingin diambil
        textFormat='plainText'
    )
    comment_response = comment_request.execute()

    # Request untuk mendapatkan judul video
    video_request = youtube.videos().list(
        part='snippet',
        id=video_id
    )
    video_response = video_request.execute()

    # Mendapatkan judul video
    video_title = video_response['items'][0]['snippet']['title']

    # Inisialisasi list untuk menyimpan data
    comments_data = []

    # Menyimpan data ke list
    for item in comment_response['items']:
        comment = item['snippet']['topLevelComment']['snippet']
        comments_data.append({
            'Author': comment['authorDisplayName'],
            'Comment': comment['textDisplay'],
            'DateTime': comment['publishedAt']
        })

    # Konversi data ke JSON
    return {
        'VideoTitle': video_title,
        'Comments': comments_data
    }
