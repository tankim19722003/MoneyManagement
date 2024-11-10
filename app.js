
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  const firebaseConfig = {
    apiKey: "AIzaSyD1qmjKUiJJTrIrzFHBUl1IkVNHoNxpARI",
    authDomain: "accountmanagement-138b7.firebaseapp.com",
    databaseURL: "https://moneymana-b0d40-default-rtdb.firebaseio.com", // E
    projectId: "accountmanagement-138b7",
    storageBucket: "accountmanagement-138b7.appspot.com",
    messagingSenderId: "340211540580",
    appId: "1:340211540580:web:234fac6df89143c8163571",
    measurementId: "G-DP3RP0P1DG"
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const expenseUrl = "/money_mg/expense_list/";
  const totalMoneyUrl =  "/money_mg/total_money/";

  import {getDatabase, ref, set, update, remove, get, child, onValue}
  from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
  // method to 

  let db = getDatabase();
//--------------------------------END CONNECT DT-------------------------

document.querySelector("#modify-total-money").onclick = function showEnteringTotalMoneyForm() {
    document.querySelector("#total-money-form").style.display = "flex";
}

document.querySelector("#overlay").onclick = function closeEnteringTotalMoneyForm() {
    document.querySelector("#total-money-form").style.display = "none";
}

document.querySelector("#close-btn").onclick = function closeEnteringTotalMoneyForm() {
  document.querySelector("#total-money-form").style.display = "none";
}


window.onload = async function() {

  // set default value date for input 
  const today = new Date(Date.now()).toISOString().split('T')[0];
  document.getElementById("date").value = today;

  // load data
  let data = await getData("/money_mg");

  if (data.length > 1) {
    // display total money
    let totalMoney = Object.values(data[1]);
    document.getElementById("total-money").textContent = formatNumberHasDot(totalMoney[0].total_money);
  
    // display expense list
    let expenseList = Object.values(data[0]);
    console.log(expenseList);
    let html = '';
    for (let expenseItem of expenseList) {
      let date = getStringDate(expenseItem.date)
      html += `
          <tr class="account-item" data-row-id=${expenseItem.id}>
                  <td class="account-item_info">${date}</td>
                  <td class="account-item_info">${formatNumberHasDot(expenseItem.money)}</td>
                  <td class="account-item_info delete-expense" style="padding:0px 8px" data-id=${expenseItem.id}>
                      <img src="./delete.png" alt="" class="expense-item-delete-btn">
                  </td>  
              </tr>
      `
    }

    document.getElementById("account-body").innerHTML = html;

  } else {
     // display total money
     let totalMoney = Object.values(data[0]);
     document.getElementById("total-money").textContent = formatNumberHasDot(totalMoney[0].total_money);
  }


  // add event remove expense item 
 addEventForDeleteExpenseIcon();


}

function addEventForDeleteExpenseIcon() {
  let deleteExpenseItemsIcon = document.querySelectorAll(".delete-expense");

  for (let deleteExpenseItemIcon of deleteExpenseItemsIcon) {
    deleteExpenseItemIcon.onclick = async function (e) {
      let currentTarget = e.currentTarget;
      let id = currentTarget.getAttribute("data-id");


      removeExpenseItemFromdb(id);
    }
  }
}

async function removeExpenseItemFromdb(id) {
  let wantedExpenseItemDeleting = await getExpenseItemById(id);

  remove(ref(db, expenseUrl + id))
      .then(async () => {
          alert(`Delete successfully`);
          removeExpenseItemOutOfExpenseListUI(id);
          
          // plus money from delete item
          let totalMoney = await getData(totalMoneyUrl);
          totalMoney[0].total_money += parseInt(wantedExpenseItemDeleting.money); 

          updateData(totalMoneyUrl + totalMoney[0].id, totalMoney[0]);

          // update total in ui
          document.getElementById("total-money").textContent = formatNumberHasDot(totalMoney[0].total_money);

      })
      .catch((error) => {
           alert("Error deleting data: ", error);
      });
}

function removeExpenseItemOutOfExpenseListUI(id) {
  let expenseItems = document.querySelectorAll(".account-item");

  for (let expenseItem of expenseItems) {
    let rowId = expenseItem.getAttribute("data-row-id");
    if (rowId == id) {
      expenseItem.remove();
    }
  }
}

function getStringDate(timestamp) {
  const date = new Date(timestamp);

  // Get the day, month, and year
  const day = date.getDate();        // Day of the month (1-31)
  const month = date.getMonth() + 1; // Month (0-11, so we add 1)
  const year = date.getFullYear();   // Full year (e.g., 2024)

  return day + "-" + month + "-" + year
}

function formatNumberHasDot(number) {
  return new Intl.NumberFormat('de-DE').format(number);
}


/* save total money */
document.querySelector("#save-expense").onclick = function() {

  // get data input 
  let expenseValue = document.getElementById("enter-money_input").value;
  let dateString = document.getElementById("date").value;
  let dateValue;
  if (expenseValue == "") {
    alert("Vui Lòng nhập đầy đủ thông tin!!");
    return;
  }

  if (dateString == '') {
    dateValue = Date.now();
  } else {
    let date = new Date(dateString);
    dateValue = date.getTime();
  }

  let id = Date.now();
  let expenseObj = {
    "id" : id,
    "date" : dateValue,
    "money" : expenseValue
  };
  let url = expenseUrl + id;

  set(ref(db, url), expenseObj)
  .then(async() => {
      alert("Save expense successfully");
      
      // get total money 
      let totalMoney = await getData(totalMoneyUrl);
      totalMoney[0].total_money -= parseInt(expenseValue);

      // update total money
      updateData(totalMoneyUrl +  totalMoney[0].id, totalMoney[0])


      // add new item to table expense list
      let date = getStringDate(dateValue);
      let html = `<tr class="account-item" data-row-id=${id}>
                <td class="account-item_info">${date}</td>
                <td class="account-item_info">${formatNumberHasDot(expenseValue)}</td>
                <td class="account-item_info delete-expense" style="padding:0px 8px">
                   <img src="./delete.png" alt="" class="expense-item-delete-btn">
                </td>  
            </tr>`

      document.getElementById("account-body").innerHTML += html;

      //update total money on ui
      document.getElementById("total-money").textContent = formatNumberHasDot(totalMoney[0].total_money);

      // // add event to new item 
      // document.getElementById("row-" + id).onclick = function() {
      //   removeExpenseItemFromdb(id);
      // }

      addEventForDeleteExpenseIcon()


      // window.location.reload();
  })
  .catch((e) => {
      alert("create fail! " + e)
  }); 

}


// async function getTotalMoney(path) {
//     try {
//         // Create a reference to the specified path
//         const dataRef = ref(db, path);

//         // Use get() to fetch data from the reference
//         const snapshot = await get(dataRef);

//         // Check if data exists at the reference
//         if (snapshot.exists()) {
//             return snapshot.val(); // Return the data
//         } else {
//             console.log("No data available at this path:", path);
//             return null; // Return null if no data is found
//         }
//     } catch (error) {
//         console.error("Error retrieving data:", error);
//         throw error; // Re-throw the error for further handling
//     }
// }

async function getData(url) {
  const dbRef = ref(db);
  try {
    const snapshot = await get(child(dbRef, url));
    if (snapshot.exists()) {
      let data = snapshot.val();
      const accountsArray = Object.values(data); // Convert object to an array of accounts
      return accountsArray;
    } else {
      // console.log("No data available");
      return [];
    }
  } catch (error) {
  //   console.error("Error fetching data:", error);
    throw error;
  }
}


function saveData(url, data) {
    set(ref(db, url), data)
    .then(async() => {
        alert("Save expense successfully");
        

        // display device 
        window.location.reload();
    })
    .catch((e) => {
        alert("create fail! " + e)
    }); 
}


function updateData(url, data) {
  update(ref(db, url), data)
  .then(() => {
  })
  .catch((error) => {
    alert("Error updating data: ", error);
  });
}

// save total money
document.querySelector("#total-month-money").onclick = async function () {

  // get input value 
  let totalMoneyValue = document.getElementById("money-form-body_input").value;

  if (totalMoneyValue == '') {
    alert("Vui lòng nhập đầy đủ thông tin!!");
    return;
  }

  // get total money 
  let totalMoney = await getData(totalMoneyUrl);

  if (totalMoney.length == 0) {
    saveData(totalMoneyUrl + id, {
      "id" : id,
      "total_money": totalMoney
    })
  } else {
    totalMoney[0].total_money = totalMoneyValue;
    updateData(totalMoneyUrl + totalMoney[0].id, totalMoney[0])
  }
 
  window.location.reload();
}

async function getExpenseItemById(expenseId) {
 
  let expenseList = await getData(expenseUrl);

  for (let i = 0; i < expenseList.length; i++) {
    let expenseItem = expenseList[i];
    if (expenseItem.id == expenseId) {
      return expenseItem;
    }
  }

  return null;

}

// getExpenseItemById("1731234610636");

