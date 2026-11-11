// default shopping is US
let selectedStore = "traderjoes";
let currency = "USD";

// Separate carts for each country
let carts = {
    traderjoes: [],
    londongroceries: [],
    ffc: []
};

let cart = carts[selectedStore];

// the possible messages shown on the results card
let defaultMess = "Use the search bar to look up an item. Search 'e' to list all items in the selected store";
let notFoundMess = "Not found in the database. Try searching a different item.";
let errorMess = "Something went wrong. Try again please."

function showMessage(text) {
    let divResults = document.querySelector("#results");
    divResults.innerHTML = "";

    let message = document.createElement("p");
    message.className = "message";
    message.textContent = text;
    divResults.appendChild(message);
}

// the theme names used for css
const themes = {
    traderjoes: "us",
    londongroceries: "uk",
    ffc: "qa"
};

// capital cities for each store's country for the weather card
const capitals = {
    traderjoes: {city: "Washington D.C", lat: 38.9072, lon: -77.0369},
    londongroceries: {city: "London", lat: 51.5072, lon: -0.1276},
    ffc: {city: "Doha", lat: 25.2854, lon: 51.5310}
}

function getWeather() {
    let place = capitals[selectedStore];
    const apiURL = "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat + "&longitude=" 
    + place.lon + "&current=temperature_2m";

    document.querySelector("#weather-place").textContent = "Weather in " + place.city + ":";

    fetch(apiURL)
        .then((response) => response.json())
        .then((data) => {
            if (place !== capitals[selectedStore]) { //ignore if the user switched countries
                return;
            }
            let temp = Math.round(data.current.temperature_2m);
            document.querySelector("#weather-temp").textContent = temp + "°C";
        })
        .catch((error) => {
            console.log("error:", error);
            document.querySelector("#weather-temp").textContent = "--"
        });
}

// Format the price in the correct currency
function formatPrice(price) {
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: currency
    }).format(price);
}

function navbarstatus(btn) {
        btn.classList.toggle("active", btn.dataset.store == selectedStore)
};

function changeStore(store) {

    selectedStore = store;

    // Switch currency based on country
    if (store === "traderjoes") {
        currency = "USD";
    } else if (store === "londongroceries") {
        currency = "GBP";
    } else if (store === "ffc") {
        currency = "QAR";
    }

    // Switch to that country's cart
    cart = carts[store];

    // Update the shopping cart
    updateCart();

    // css adjustments
    document.body.dataset.country = themes[store];
    document.querySelectorAll(".navbar button").forEach(navbarstatus);

    getWeather();

    showMessage(defaultMess);

    // Search again if the search bar isn't empty
    if (document.getElementById("product").value.trim() !== "") {
        searchProduct();
    }
}

// Adds an item to the cart
function addToCart(name, price) {

    // Check if the item is already in the cart
    let item = cart.find(item => item.name === name);

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();
}

// Removes one quantity of an item
function removeFromCart(index) {

    cart[index].quantity--;

    if (cart[index].quantity === 0) {
        cart.splice(index, 1);
    }

    updateCart();
}

// Updates the shopping cart display
function updateCart() {

    let cartDiv = document.getElementById("cart");

    cartDiv.innerHTML = "";

    let total = 0;

    if (cart.length === 0) {
        let empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "Your cart is empty."
        cartDiv.appendChild(empty);
    }

    cart.forEach(function(item, index) {

        total += item.price * item.quantity;

        let row = document.createElement("div");
        row.className = "item-row";

        let button = document.createElement("button");
        button.textContent = "-";
        button.onclick = function() {
            removeFromCart(index);
        };

        let description = document.createElement("span");
        description.className = "name";
        description.textContent =
            " " + formatPrice(item.price) +
            " × " + item.quantity +
            " ➔ " + item.name;

        row.appendChild(button);
        row.appendChild(description);

        cartDiv.appendChild(row);
    });

    document.getElementById("total").textContent = formatPrice(total);
}

updateCart()
getWeather()
showMessage(defaultMess)

    // API key
    const apiKey = "6fca1e2f-efbe-46d0-bcb2-a25cfab96497";

    async function searchProduct() {

        let product = document.getElementById("product").value;
        if (product.trim() === "") {
            showMessage(defaultMess);
            return; 
        }

        let url = "https://openpricengine.com/api/v1/"
            + encodeURIComponent(selectedStore)
            + "/products/prices/today?productname="
            + encodeURIComponent(product)
            + "&currency=Default";
        try {
            let response = await fetch(url, {
                headers: {
                    "accept": "application/json",
                    "Authorization": apiKey
                }
            });

            // API answers when it has no match
            if (response.status == 404) {
                showMessage(notFoundMess);
                return;
            }
            if (!response.ok) {
                showMessage(errorMess);
                return;
            }

            let data = await response.json();

            let resultsDiv = document.getElementById("results");

            resultsDiv.innerHTML = "";

            //treat non-list items that api sent back as empty
            let items = Array.isArray(data) ? data : [];
            let found = 0;

            items.forEach(function(item) {

                let name = item["Product Name"];
                let price = item["Price over time"]?.[0]?.["Price"];

                if (typeof name !== "string" || typeof price !== "number") {
                    return;
                }

                // Creates a row for each product
                let row = document.createElement("div");
                row.className = "item-row";

                // Creates the + button
                let button = document.createElement("button");
                button.textContent = "+";

                button.onclick = function() {
                    addToCart(name, price);
                };

                // Make price bold
                let priceText = document.createElement("b");
                priceText.textContent = formatPrice(price);

                // displays product name
                let nameText = document.createElement("span");
                nameText.className = "name";
                nameText.textContent = " ➔ " + name;

                row.appendChild(button);
                row.appendChild(priceText);
                row.appendChild(nameText);

                resultsDiv.appendChild(row);
                found++;
            });
            if (found === 0) {
                showMessage(notFoundMess);
            }

        } catch (error) {
            console.log("error:", error);
            showMessage(errorMess);
        }
    }