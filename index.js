if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js").then(
      function (registration) {
        console.log("Registrasi sw berhasil: ", registration.scope);
      },
      function (err) {
        console.log("Registrasi sw gagal: ", err);
      }
    );
  });
}

var indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;
const dbName = "jadwalAdzanDB";
const obj_n_store_register_kota = "register_kota";
var db_ver = Date.now();

function get_tanggal_sekarang() {
  let currentDate = new Date();
  let year = currentDate.getFullYear();
  let month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  let day = currentDate.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
console.log(get_tanggal_sekarang());

function get_url_jadwal_adzan(kota) {
  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  return `https://raw.githubusercontent.com/lakuapik/jadwalsholatorg/master/adzan/${kota}/${formattedDate}.json`;
}

function add_register_kota(kota) {
  // Open (or create) the database
  var open = indexedDB.open(dbName, ++db_ver);

  // Create the schema
  open.onupgradeneeded = function () {
    var db = open.result;
    if (!db.objectStoreNames.contains(obj_n_store_register_kota)) {
      var store = db.createObjectStore(obj_n_store_register_kota, {
        keyPath: "id",
      });
    }
  };

  open.onsuccess = function () {
    // Start a new transaction
    var db = open.result;
    var tx = db.transaction(obj_n_store_register_kota, "readwrite");
    var store = tx.objectStore(obj_n_store_register_kota);

    console.log("adding", kota);
    store.put({ id: kota });

    // Query the data
    // var getKota = store.getAll();

    // getKota.onsuccess = function () {
    //   console.log(getKota.result); // => "John"
    // };

    // Close the db when the transaction is done
    tx.oncomplete = function () {
      db.close();
    };
  };
}

function fetch_github_jadwal(kota) {
  fetch(get_url_jadwal_adzan(kota))
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      const obj_name_jadwal = "jadwal_" + kota;
      // Open (or create) the database
      var open = indexedDB.open(dbName, ++db_ver);
      open.onsuccess = function () {
        var db = open.result;
        if (!db.objectStoreNames.contains(obj_name_jadwal)) {
          var store = db.createObjectStore(obj_name_jadwal, {
            keyPath: "id",
          });
        }
        var tx = db.transaction(obj_name_jadwal, "readwrite");
        var store = tx.objectStore(obj_name_jadwal);
        data.forEach((e) => {
          store.put({ id: e.tanggal, data: e });
        });
        tx.oncomplete = function () {
          db.close();
          get_jadwal_kota(kota);
        };
      };
    });
}

function get_jadwal_kota(kota) {
  const obj_name_jadwal = "jadwal_" + kota;
  // Open (or create) the database
  var open = indexedDB.open(dbName, ++db_ver);

  // Create the schema
  open.onupgradeneeded = function () {
    var db = open.result;
    if (!db.objectStoreNames.contains(obj_name_jadwal)) {
      var store = db.createObjectStore(obj_name_jadwal, {
        keyPath: "id",
      });
    }
  };

  open.onsuccess = function () {
    // Start a new transaction
    var db = open.result;
    if (!db.objectStoreNames.contains(obj_name_jadwal)) {
      var store = db.createObjectStore(obj_name_jadwal, {
        keyPath: "id",
      });
    }
    var tx = db.transaction(obj_name_jadwal, "readwrite");
    var store = tx.objectStore(obj_name_jadwal);

    // var getJadwal = store.getAll();
    var getJadwal = store.get(get_tanggal_sekarang());
    getJadwal.onsuccess = function () {
      // console.log(getJadwal.result);
      // return;

      // Jika kosong ambil data dari guthib
      if (typeof getJadwal.result != "object") {
        console.log("fetch data", kota);
        fetch_github_jadwal(kota);
      } else {
        // Data ketemu
        console.log(kota, getJadwal.result);
        add_card_jadwal_to(
          "container_list_adzan",
          kota,
          getJadwal.result.id,
          getJadwal.result.data
        );
      }
    };

    // Close the db when the transaction is done
    tx.oncomplete = function () {
      db.close();
    };
  };

  open.onerror = function (err) {
    console.error(err);
  };
}

function proses_registered_kota(list_kota) {
  list_kota.forEach((e) => {
    console.log(e.id);
    get_jadwal_kota(e.id);
  });
}

function get_registered_kota() {
  // Kosongkan container card jadwal
  document.getElementById("container_list_adzan").innerHTML = "";

  // Open (or create) the database
  var open = indexedDB.open(dbName, ++db_ver);

  // Create the schema
  open.onupgradeneeded = function () {
    var db = open.result;
    if (!db.objectStoreNames.contains(obj_n_store_register_kota)) {
      var store = db.createObjectStore(obj_n_store_register_kota, {
        keyPath: "id",
      });
    }
  };

  open.onsuccess = function () {
    // Start a new transaction
    var db = open.result;
    var tx = db.transaction(obj_n_store_register_kota, "readwrite");
    var store = tx.objectStore(obj_n_store_register_kota);

    // Query the data
    var getKota = store.getAll();

    getKota.onsuccess = function () {
      proses_registered_kota(getKota.result);
      // console.log(getKota.result); // => "John"
    };

    // Close the db when the transaction is done
    tx.oncomplete = function () {
      db.close();
    };
  };
}

get_registered_kota();

function prevent_submit(event_form) {
  event_form.preventDefault();
  const selected_new_kota = document.getElementById("select_kota").value;
  console.log("Tambah jadwal kota", selected_new_kota);

  add_register_kota(selected_new_kota);
  get_jadwal_kota(selected_new_kota);
}

function add_card_jadwal_to(containerId, cardTitle, cardSubtitle, schedule) {
  const card = document.createElement("div");
  card.className = "col-lg-4 col-md-6 col-sm-12";
  const cardInner = `
        <div class="card shadow mb-2">
            <div class="card-body">
                <h5 class="card-title">${cardTitle}</h5>
                <h6 class="card-subtitle mb-2 text-body-secondary">${cardSubtitle}</h6>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Jam</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Subuh</td>
                            <td>${schedule.shubuh}</td>
                        </tr>
                        <tr>
                            <td>Dzuhur</td>
                            <td>${schedule.dzuhur}</td>
                        </tr>
                        <tr>
                            <td>Ashr</td>
                            <td>${schedule.ashr}</td>
                        </tr>
                        <tr>
                            <td>Maghrib</td>
                            <td>${schedule.magrib}</td>
                        </tr>
                        <tr>
                            <td>Isya'</td>
                            <td>${schedule.isya}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
  card.innerHTML = cardInner;

  // Append card to the container
  document.getElementById(containerId).appendChild(card);
}
