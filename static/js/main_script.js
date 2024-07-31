// Loading Screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// KAMUS SENTIMEN KATA


// Data komentar

function fetchAndDisplayYoutubeComments() {
  showLoadingScreen();
  fetch('/get_youtube_comments')  // Ganti dengan route yang sesuai
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('youtube_comments_data');  // Sesuaikan dengan ID elemen tbody
      tableBody.innerHTML = '';

      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.id}</td>
          <td>${item.Author}</td>
          <td>${item.Comment}</td>
          <td width="150px;">${item.DateTime}</td>
          <td width="100px;">
            <!-- Sesuaikan tombol sesuai dengan aksi yang diinginkan -->
            <button class="btn btn-danger btn-sm" onclick="hapusKomentar(${item.id})">Hapus</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      hideLoadingScreen();
    })
    .catch(error => {
      hideLoadingScreen();
      console.error('Error fetching data:', error);
    });
}


function hapusKomentar(id) {
  // Mengirim permintaan POST (atau DELETE, sesuai dengan konfigurasi server Anda) ke endpoint Flask API untuk menghapus data
  fetch(`/delete_youtube_comment/${id}`, {
    method: 'POST',  // atau 'DELETE', tergantung konfigurasi server Flask Anda
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        // Data berhasil dihapus, lakukan tindakan yang sesuai seperti memperbarui tampilan
        // Panggil kembali fetchAndDisplayYoutubeComments() untuk memperbarui tampilan data.
        fetchAndDisplayYoutubeComments();
      } else {
        // Menangani kesalahan jika ada
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


function truncateYoutubeComments() {
    if (!confirm("Apakah Anda yakin ingin mengosongkan semua komentar?")) {
        return; // Jika pengguna tidak konfirmasi, hentikan fungsi
    }

    fetch('/truncate_youtube_comments', {
        method: 'GET'  // Menggunakan metode GET
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Semua komentar telah berhasil dihapus.');
            // Opsional: tambahkan logika untuk memperbarui UI atau refresh halaman
            fetchAndDisplayYoutubeComments()
        } else {
            alert('Terjadi kesalahan: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mengosongkan komentar.');
    });
}



// Fungsi untuk mengambil data dari server
function fetchAndDisplayKamusKata() {
  showLoadingScreen()
  fetch('/get_kamus_kata')
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('kamus_data');
      tableBody.innerHTML = ''; // Bersihkan isi tabel terlebih dahulu

      // Tambahkan setiap item data ke tabel
      let no = 1
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td width="10px">${no ++}</td>
          <td>${item.kata}</td>
          <td>${item.bobot_kata}</td>
          <td>${item.sentimen}</td>
          <td width="150px">
            <button class="btn btn-danger btn-sm" onclick="hapusKata(${item.id})">Hapus</button>
            <button class="btn btn-warning btn-sm" data-toggle="modal" data-target="#editModal" onclick="tampilkanKataEdit(${item.id}, '${item.kata}', '${item.bobot_kata}', '${item.sentimen}')">Edit</button>
          </td>
        `;
        tableBody.appendChild(row);
        hideLoadingScreen()
      });
    })
    .catch(error => {
        hideLoadingScreen()
      console.error('Error fetching data:', error);
    });
}

function simpanSentimenKataTerbaru() {
  showLoadingScreen()
  // Mengambil data dari formulir modal
  const kata = document.getElementById('input-kata').value;
  const bobot = document.getElementById('input-bobot').value;
  const sentimen = document.getElementById('input-sentimen').value;

  // Membuat objek data yang akan dikirimkan ke server
  const data = {
    kata: kata,
    bobot: bobot,
    sentimen: sentimen,
  };

  // Mengirim permintaan POST ke endpoint Flask API untuk menyimpan sentimen kata terbaru
  fetch('/simpan_sentimen_kata_terbaru', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {

      if (result.status === 'success') {
        // Data berhasil disimpan, tutup modal dan lakukan tindakan lain yang sesuai
        fetchAndDisplayKamusKata()
        hideLoadingScreen()
        alert("Data Tersimpan !")
        $('#inputSentimenModal').modal('hide');
        // Tambahkan logika lain jika diperlukan, seperti mengaktualisasikan tampilan
      } else {
        // Menangani kesalahan jika ada
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}



// Fungsi untuk menampilkan data yang akan diedit dalam modal
function tampilkanKataEdit(id, kata, bobotKata, sentimen) {
  document.getElementById('edit-kata').value = kata;
  document.getElementById('edit-bobot-kata').value = bobotKata;
  document.getElementById('edit-sentimen').value = sentimen;

  // Simpan ID data yang akan diubah ke atribut data-modal-id pada tombol "Simpan Perubahan"
  document.querySelector('#editModal .modal-footer .btn-primary').setAttribute('data-modal-id', id);
}

// Fungsi untuk menyimpan perubahan data
function simpanEditKata() {
  // Mengambil ID data yang akan diubah dari atribut data-modal-id pada tombol "Simpan Perubahan"
  const id = document.querySelector('#editModal .modal-footer .btn-primary').getAttribute('data-modal-id');

  // Mengambil data yang akan diubah dari formulir atau elemen HTML
  const kata = document.getElementById('edit-kata').value;
  const bobotKata = document.getElementById('edit-bobot-kata').value;
  const sentimen = document.getElementById('edit-sentimen').value;

  // Membuat objek data yang akan dikirimkan ke Flask API
  const data = {
    kata: kata,
    bobot_kata: bobotKata,
    sentimen: sentimen,
  };

  // Mengirim permintaan PUT ke endpoint Flask API untuk mengedit data
  fetch(`/edit_kamus_kata/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        // Data berhasil diubah, tutup modal dan panggil kembali fetchAndDisplayKamusKata() untuk memperbarui tampilan data
        $('#editModal').modal('hide');
        fetchAndDisplayKamusKata();
      } else {
        // Menangani kesalahan jika ada
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


function hapusKata(id) {
  // Mengirim permintaan DELETE ke endpoint Flask API untuk menghapus data
  fetch(`/delete_kamus_kata/${id}`, {
    method: 'POST',
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        // Data berhasil dihapus, lakukan tindakan yang sesuai seperti memperbarui tampilan
        // Panggil kembali fetchAndDisplayKamusKata() untuk memperbarui tampilan data.
        fetchAndDisplayKamusKata();
      } else {
        // Menangani kesalahan jika ada
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}




// Data Kalimat
function fetchAndDisplayKamusKalimat() {
  showLoadingScreen()
  fetch('/get_kamus_kalimat')
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('kamus_data');
      tableBody.innerHTML = '';

      let no = 1
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td width="10px">${no ++}</td>
          <td>${item.kalimat}</td>
          <td>${item.bobot_kalimat}</td>
          <td>${item.sentimen}</td>
          <td width="150px">
            <button class="btn btn-danger btn-sm" onclick="hapusKalimat(${item.id})">Hapus</button>
            <button class="btn btn-warning btn-sm" data-toggle="modal" data-target="#editModal" onclick="tampilkanKalimatEdit(${item.id}, '${item.kalimat}', '${item.bobot_kalimat}', '${item.sentimen_kalimat}')">Edit</button>
          </td>
        `;
        tableBody.appendChild(row);
        hideLoadingScreen()
      });
    })
    .catch(error => {
      hideLoadingScreen()
      console.error('Error fetching data:', error);
    });
}

function simpanSentimenKalimatTerbaru() {
  showLoadingScreen()
  const kalimat = document.getElementById('input-kalimat').value;
  const bobot = document.getElementById('input-bobot-kalimat').value;
  const sentimen = document.getElementById('input-sentimen-kalimat').value;

  const data = {
    kalimat: kalimat,
    bobot_kalimat: bobot,
    sentimen_kalimat: sentimen,
  };

  fetch('/simpan_sentimen_kalimat_terbaru', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {

      if (result.status === 'success') {
        fetchAndDisplayKamusKalimat()
        hideLoadingScreen()
        alert("Data Tersimpan !")
        $('#inputSentimenModal').modal('hide');
      } else {
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function tampilkanKalimatEdit(id, kalimat, bobotKalimat, sentimenKalimat) {
  document.getElementById('edit-kalimat').value = kalimat;
  document.getElementById('edit-bobot-kalimat').value = bobotKalimat;
  document.getElementById('edit-sentimen-kalimat').value = sentimenKalimat;

  document.querySelector('#editModal .modal-footer .btn-primary').setAttribute('data-modal-id', id);
}

function simpanEditKalimat() {
  const id = document.querySelector('#editModal .modal-footer .btn-primary').getAttribute('data-modal-id');

  const kalimat = document.getElementById('edit-kalimat').value;
  const bobotKalimat = document.getElementById('edit-bobot-kalimat').value;
  const sentimenKalimat = document.getElementById('edit-sentimen-kalimat').value;

  const data = {
    kalimat: kalimat,
    bobot_kalimat: bobotKalimat,
    sentimen_kalimat: sentimenKalimat,
  };

  fetch(`/edit_kamus_kalimat/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        $('#editModal').modal('hide');
        fetchAndDisplayKamusKalimat();
      } else {
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function hapusKalimat(id) {
  fetch(`/delete_kamus_kalimat/${id}`, {
    method: 'POST',
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        fetchAndDisplayKamusKalimat();
      } else {
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


// SCRAPING

// Fungsi untuk menampilkan link terakhir dalam local storage
function displayLastYouTubeLink() {
    // Mendapatkan elemen tbody dengan id "latest_link"
    const tableBody = document.getElementById('latest_link');
    const storedLinks = JSON.parse(sessionStorage.getItem('storedLinks')) || [];

    // Menampilkan semua link yang tersimpan dalam session storage
    storedLinks.forEach(storedLink => {
        const link = storedLink.link;
        const title = storedLink.title;

        // Periksa apakah link dan judul sudah ada dalam tabel
        if (!isDuplicateLink(tableBody, link, title)) {
            // Membuat sebuah baris baru untuk tabel
            const row = document.createElement('tr');

            // Menambahkan informasi link dan judul ke dalam baris
            row.innerHTML = `
                <td><a href="#" class="youtube-link">${link}</a></td>
                <td>${title}</td>
                <td>${new Date().toLocaleString()}</td>
            `;

            // Tambahkan event listener untuk setiap link yang dihasilkan
            const linkElement = row.querySelector('.youtube-link');
            linkElement.addEventListener('click', function(event) {
                event.preventDefault();
                // Isi nilai input dengan link YouTube yang diklik
                $('#youtube-link').val(link);
            });

            // Tambahkan baris ke dalam tabel di awal (urutan terbaru)
            tableBody.insertBefore(row, tableBody.firstChild);
        }
    });
}


// Fungsi untuk memeriksa apakah judul dan link sudah ada dalam tabel
function isDuplicateLink(tableBody, link, title) {
    const rows = tableBody.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        const existingLink = cells[0].innerText.trim();
        const existingTitle = cells[1].innerText.trim();
        if (existingLink === link && existingTitle === title) {
            return true; // Return true jika judul dan link sudah ada
        }
    }
    return false; // Return false jika judul dan link belum ada
}

// Panggil fungsi saat halaman dimuat untuk pertama kalinya
window.onload = function() {
    displayLastYouTubeLink();
    getDataComments(); // Memanggil getDataComments() bersamaan dengan displayLastYouTubeLink()
};

// Fungsi untuk mengambil data komentar
function getDataComments() {
    const youtubeLinks = $('#youtube-link').val().trim();
    const maxComments = $('#max-comments').val().trim();

    // Periksa apakah input link atau jumlah maksimal komentar kosong
    if (!youtubeLinks || !maxComments) {
        alert('Isi Form nya');
        return; // Keluar dari fungsi jika validasi gagal
    }

    // Periksa apakah jumlah maksimal komentar adalah angka
    if (isNaN(maxComments) || maxComments <= 0) {
        alert('Jumlah komentar tidak boleh kosong');
        return; // Keluar dari fungsi jika jumlah komentar tidak valid
    }

    showLoadingScreen();

    // Lanjutkan dengan permintaan AJAX jika validasi berhasil
    $.ajax({
        type: 'POST',
        url: '/scraping-data',
        data: {
            youtube_url: youtubeLinks.split('\n'), // Pisahkan link jika lebih dari satu
            max_comments: maxComments
        },
        dataType: 'json',
        success: function (data) {
            hideLoadingScreen();
            // Menampilkan komentar yang diambil
            displayComments(data.videos[0].Comments);

            // Simpan link YouTube terakhir dan judul dalam session storage
            const lastYouTubeLink = localStorage.getItem('lastYouTubeLink');
            let storedLinks = JSON.parse(sessionStorage.getItem('storedLinks')) || [];

            // Hanya tambahkan jika link YouTube terakhir berbeda dengan yang baru
            if (lastYouTubeLink !== youtubeLinks) {
                const title = data.videos[0].VideoTitle;
                storedLinks.push({ link: youtubeLinks, title: title });
                sessionStorage.setItem('storedLinks', JSON.stringify(storedLinks));
            }

            // Simpan link YouTube terakhir dalam local storage
            localStorage.setItem('lastYouTubeLink', youtubeLinks);

            // Tampilkan semua link yang tersimpan bersama dengan link yang baru saja ditambahkan
            storedLinks.forEach(item => {
                displayLastYouTubeLink(item.link, item.title);
            });
        },
        error: function (error) {
            hideLoadingScreen();
            console.error('Error:', error);
        }
    });
}
function removeDuplicateLinks(allLinks, allTitles) {
    const uniqueLinks = [...new Set(allLinks)];
    const tableBody = document.getElementById('latest_link');

    // Menghapus semua baris dari tabel
    tableBody.innerHTML = '';

    // Menambahkan kembali link unik ke dalam tabel
    uniqueLinks.forEach((link, index) => {
        const row = document.createElement('tr');
        console.log(allTitles)
        row.innerHTML = `
            <td><a href="#" class="youtube-link">${link}</a></td>
            <td>${allTitles[index]}</td>
            <td>${new Date().toLocaleString()}</td>
        `;
        tableBody.appendChild(row);

        // Tambahkan event listener untuk setiap link yang dihasilkan
        const linkElement = row.querySelector('.youtube-link');
        linkElement.addEventListener('click', function(event) {
            event.preventDefault();
            // Isi nilai input dengan link YouTube yang diklik
            $('#youtube-link').val(link);
        });
    });
}


// Fungsi untuk menampilkan komentar ke dalam tabel
function displayComments(comments) {
    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = ''; // Hapus isi tabel sebelum menambahkan komentar baru
    
    comments.forEach((comment, index) => {
        const date = new Date(comment.DateTime);
        const formattedDate = date.toLocaleString();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td width="5%"><input type="checkbox" name="commentCheckbox" value="${index}"></td>
            <td width="20%">${comment.Author}</td>
            <td width="65%">${comment.Comment}</td>
            <td width="15%">${formattedDate}</td>
        `;
        commentList.appendChild(row);
    });
}

function deleteSelectedComments() {
    const checkboxes = document.getElementsByName('commentCheckbox');
    for (let i = checkboxes.length - 1; i >= 0; i--) {
        if (checkboxes[i].checked) {
            checkboxes[i].parentNode.parentNode.remove();
        }
    }
}

function collectComments() {
    const commentList = document.getElementById('comment-list');
    const rows = commentList.getElementsByTagName('tr');
    const comments = [];

    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        const comment = {
            Author: cells[1].textContent, // asumsi kolom pertama adalah checkbox
            Comment: cells[2].textContent,
            DateTime: cells[3].textContent
        };
        comments.push(comment);
    }

    return comments;
}
async function saveComments() {
    showLoadingScreen();
    const comments = collectComments();

    try {
        const response = await fetch('/save_comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comments: comments })
        });

        if (!response.ok) {
            throw new Error('Gagal menyimpan komentar');
        }

        const data = await response.json();
        hideLoadingScreen();
        alert("Sudah Tersimpan !");
        console.log('Success:', data);
        // Arahkan ke /lda setelah berhasil menyimpan komentar
        window.location.href = '/lda';
    } catch (error) {
        hideLoadingScreen();
        console.error('Error:', error);
        // Tindakan setelah gagal, misalnya menampilkan pesan error
    }
}


const brands = ['samsung', 'oppo', 'vivo', 'xiaomi', 'redmi', 'realme', 'infinix'];

async function getMerekSmartphone() {
  try {
    const response = await fetch('/get_tipe'); // Gantilah '/get_lda_data' dengan URL yang sesuai
    if (!response.ok) {
      throw new Error('Gagal mengambil data'); // Penanganan kesalahan jika respons tidak OK
    }
    const data = await response.json();
    // console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return null; // Mengembalikan null jika terjadi kesalahan
  }
}



async function fetchAndDisplayLDAData() {
    showLoadingScreen();


    let getDataMerek = await getMerekSmartphone()

    console.log(getDataMerek)



    fetch('/hasil_lda') // Gantilah '/get_lda_data' dengan URL yang sesuai
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const tableBody = document.getElementById('lda_data');
            tableBody.innerHTML = ''; // Bersihkan isi tabel terlebih dahulu

            let no = 1;
            const ldaSentimentData = [];
            const wordCountSentimentData = [];
            const brandSentimentData = {};

            const brandTipeSentimentCounts = {};

            // Inisialisasi objek untuk menghitung jumlah sentimen per merek
            const brandSentimentCounts = {
                samsung: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
                oppo: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
                vivo: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
                xiaomi: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
                redmi: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
                realme: {
                    Positif: 0,
                    Negatif: 0,
                    Netral: 0
                },
            };

            data.results.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
    <td width="10px">${no++}</td>
    <td>${item.Author}</td>
    <td>${item['Combined Score'].toFixed(6)}</td>
    <td>
        ${item['Detected Words'].map(word => `${word.word}, `).join('')}
    </td>
    <td>${item.Komentar}</td>
    <td>${item['LDA Score'].toFixed(6)}</td>
    <td>${item['LDA Sentiment']}</td>
    <td>${item['Word Checking Score'].toFixed(6)}</td>
    <td>${item['Word Count Sentiment']}</td>
  `;

                // Modifikasi baris HTML jika merek atau tipe terdeteksi
                const commentCell = row.querySelector('td:nth-child(5)');
                for (const brandTipe of getDataMerek) {
                    const merekTipeKey = `${brandTipe.merek} ${brandTipe.tipe}`;
                    if (item.Komentar.toLowerCase().includes(merekTipeKey.toLowerCase())) {
                        // Tambahkan tanda tebal dan warna yang berbeda ke teks komentar
                        commentCell.innerHTML = commentCell.innerHTML.replace(
                            new RegExp(merekTipeKey, 'gi'),
                            `<strong style="color: blue;">${merekTipeKey}</strong>`
                        );
                    }
                }

                tableBody.appendChild(row);

                // Hitung jumlah sentimen LDA
                ldaSentimentData.push(item['LDA Sentiment']);

                // Hitung jumlah Word Count Sentimen
                wordCountSentimentData.push(item['Word Count Sentiment']);

                // Deteksi merek dalam komentar dan hitung sentimen per merek
                for (const brand of brands) {
                    if (item.Komentar.toLowerCase().includes(brand)) {
                        if (!brandSentimentData[brand]) {
                            brandSentimentData[brand] = {
                                Positif: 0,
                                Negatif: 0,
                                Netral: 0,
                            };
                        }
                        brandSentimentData[brand][item['LDA Sentiment']]++;
                    }
                }

                for (const brandTipe of getDataMerek) {
                    const merekTipeKey = `${brandTipe.merek} ${brandTipe.tipe}`;

                    if (item.Komentar.toLowerCase().includes(merekTipeKey.toLowerCase())) {
                        if (!brandTipeSentimentCounts[merekTipeKey]) {
                            brandTipeSentimentCounts[merekTipeKey] = {
                                Positif: 0,
                                Negatif: 0,
                                Netral: 0,
                            };
                        }
                        brandTipeSentimentCounts[merekTipeKey][item['LDA Sentiment']]++;
                    }
                }
            });

            // Buat tabel sentimen untuk setiap merek dan tipe
            const tipeSentimenContainer = document.getElementById('tipe_sentimen');
            tipeSentimenContainer.innerHTML = ''; // Bersihkan kontainer tipe sentimen

            for (const brandTipeKey of Object.keys(brandTipeSentimentCounts)) {
                const merekTipeSentimentCountsData = brandTipeSentimentCounts[brandTipeKey];

                tipeSentimenContainer.innerHTML += `
          <div class="col-md-4">
            <table class="merek-tipe-table table table-striped table-bordered">
              
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Positif</th>
                  <th>Negatif</th>
                  <th>Netral</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${brandTipeKey}</td>
                  <td>${merekTipeSentimentCountsData.Positif || 0}</td>
                  <td>${merekTipeSentimentCountsData.Negatif || 0}</td>
                  <td>${merekTipeSentimentCountsData.Netral || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
            }




            hideLoadingScreen();

            // Hitung jumlah sentimen LDA dan Word Count Sentimen
            const ldaSentimentCounts = countSentiments(ldaSentimentData);
            const wordCountSentimentCounts = countSentiments(wordCountSentimentData);

            // Hitung total data
            const totalData = data.results.length;

            // Buat grafik batang dengan Highcharts untuk LDA Sentimen
            createChart('ldaSentimenChart', 'Jumlah Sentimen LDA', ldaSentimentCounts, totalData);

            // Buat grafik batang dengan Highcharts untuk Word Count Sentimen
            createChart('wordCountSentimenChart', 'Jumlah Sentimen Word Count', wordCountSentimentCounts, totalData);

            // Buat grafik batang dengan Highcharts untuk sentimen per merek
            for (const brand of brands) {
                let brandSentimentCountsData = brandSentimentData[brand];
                createMerekChart(brand, brandSentimentCountsData, totalData);
            }

            // Gabungkan data sentimen merek menjadi satu
            const combinedBrandSentimentCounts = {
                Positif: 0,
                Negatif: 0,
                Netral: 0,
            };

            for (const brand of brands) {
                if (brandSentimentData[brand]) {
                    combinedBrandSentimentCounts.Positif += brandSentimentData[brand].Positif;
                    combinedBrandSentimentCounts.Negatif += brandSentimentData[brand].Negatif;
                    combinedBrandSentimentCounts.Netral += brandSentimentData[brand].Netral;
                }
            }

            // Buat grafik batang dengan Highcharts untuk sentimen merek yang digabungkan
            createChart('combinedBrandSentimenChart', 'Sentimen Merek', combinedBrandSentimentCounts, totalData);




        })
        .catch(error => {
            hideLoadingScreen();
            console.error('Error fetching data:', error);
        });
}

// Fungsi untuk membuat grafik merek
function createMerekChart(brand, sentimentCounts, totalData) {
  const chartContainerId = `chart_sentiment_${brand}`;
  if (!sentimentCounts) {
    sentimentCounts = {
        "Positif" : 0,
        "Negatif" : 0,
        "Netral" : 0
    }
  }
  // console.log(brand, sentimentCounts, totalData)
  createChart(chartContainerId, (`Sentimen ${brand}`).toUpperCase(), sentimentCounts, totalData);
}

// Fungsi untuk membuat grafik
// Fungsi untuk menghasilkan warna acak dalam format Highcharts
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function createChart(chartId, chartTitle, sentimentCounts, totalData) {
  Highcharts.chart(chartId, {
    chart: {
      type: 'column',
    },
    title: {
      text: chartTitle
    },
    xAxis: {
      categories: Object.keys(sentimentCounts),
    },
    yAxis: {
      title: {
        text: 'Jumlah (Persen dari Total %)'
      }
    },
    series: [{
      name: 'Jumlah',
      data: Object.keys(sentimentCounts).map(sentiment => {
        const count = sentimentCounts[sentiment];
        const percentage = ((count / totalData) * 100).toFixed(2);
        return {
          y: count,
          color: getRandomColor(), // Gunakan warna acak
          dataLabels: {
            enabled: true,
            format: `${count} (${percentage}%)`,
            inside: true,
          },
        };
      }),
    }],
  });
}


// Panggil fungsi fetchAndDisplayLDAData


function countSentiments(sentimentData) {
  const sentimentCounts = {};
  sentimentData.forEach(sentiment => {
    if (!sentimentCounts[sentiment]) {
      sentimentCounts[sentiment] = 1;
    } else {
      sentimentCounts[sentiment]++;
    }
  });
  return sentimentCounts;
}


function fetchAndDisplaySmartphoneData() {
  fetch('/get_tipe')
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('smartphone_data');
      tbody.innerHTML = '';
      let no = 1;
      data.forEach(smartphone => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${no++}</td>
          <td>${smartphone.merek}</td>
          <td>${smartphone.tipe}</td>
          <td><button onclick="hapusTipe(${smartphone.id_data})" class="btn btn-danger btn-sm">Hapus</button></td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}



function hapusTipe(id) {
  fetch(`/delete_tipe/${id}`, {
    method: 'POST',
  })
    .then(response => response.json())
    .then(result => {
      alert("Tipe Dihapus !")
      if (result.status === 'success') {
        fetchAndDisplaySmartphoneData()
      } else {
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function simpanDataSmartphone() {
  showLoadingScreen();
  const merek = document.getElementById('merek').value;
  const type = document.getElementById('type').value;

  const data = {
    merek: merek,
    type: type
  };

  fetch('/simpan_data_smartphone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        fetchAndDisplaySmartphoneData();
        hideLoadingScreen();
        alert("Data Tersimpan!");
        // Bersihkan input setelah berhasil disimpan
        document.getElementById('merek').value = '';
        document.getElementById('type').value = '';
      } else {
        console.error(result.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

