const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')
const { FALSE } = require('node-sass')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}


async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token
  console.log("token " + token);
  return token;
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome() {
    addMessage(agent.query, true);
    addMessage('Hello, welcome to WiscShop! How can I help you today?', false);
    //console.log(ENDPOINT_URL);
  }

  function isLoggedIn() {
    if (typeof(token) === typeof undefined || token === '') {
      return false;
    } else {
      return true;
    }
  }

  async function login() {
    if (isLoggedIn()) {
      console.log("username " + username);
      console.log("token " + token);
      addMessage('You are already logged in as ' + username + '.', false);
    } else {
      // You need to set this from `username` entity that you declare in DialogFlow
      username = agent.parameters.username;
      // You need to set this from password entity that you declare in DialogFlow
      password = agent.parameters.password;
      await getToken();

      //agent.add(token)

      if (typeof(token) === typeof undefined) {
        addMessage("Invalid credentials. Please try again", false);
      } else {
        await deleteMessages();
        await addMessage("Welcome back to the WiscShop, " + username + "!", false);
        await addMessage("What are you looking for today?", false);
      }
    }
  }

  async function addMessage(text, isUser) {
    if (!isUser) {
      agent.add(text); // say message if not computer message
    }

    if (isLoggedIn()) {
      const body = JSON.stringify({
        date: new Date(),
        isUser: isUser,
        text: text,
      })
    
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: body,
        redirect: 'follow'
      }
  
      const serverReturn = await fetch(ENDPOINT_URL + '/application/messages', request);
      const serverResponse = await serverReturn.json();

      return serverResponse;
    }
  }

  async function deleteMessages() {
    const request = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application/messages', request);
    const serverResponse = await serverReturn.json();
    return serverResponse;
  }

  async function viewCart() {
    if (!isLoggedIn()) {
      addMessage("Please login to view your cart.", false);
      return;
    }

    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token,
      },
      redirect: 'follow'
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request);
    const serverResponse = await serverReturn.json();

    const cart = serverResponse.products;
    console.log(cart);
    navigate('cart');

    if (cart.length == 0) {
      await addMessage(agent.query, true);
      addMessage("Your cart is currently empty.", false);
    } else {
      let cartStr = "";
      let totalCost = 0;
      let totalItems = 0;
      if (cart.length == 1) {
        totalCost = totalCost + (cart[0].price * cart[0].count);
        totalItems += cart[0].count;

        if (cart.count == 1 || cart[0].name[cart[0].name.length - 1] == 's') {
          cartStr = cart[0].count + ' ' + cart[0].name;
        } else {
          cartStr = cart[0].count + ' ' + cart[0].name + 's';
        }
      } else {
        for (let i = 0; i < cart.length; i++) {
          totalCost = totalCost + (cart[i].price * cart[i].count);
          totalItems += cart[i].count;

          if (i == cart.length - 1) {
            // last item
            if (cart[i].count == 1) {
              cartStr = cartStr + 'and ' + cart[i].count + ' ' + cart[i].name;
            } else {
              cartStr = cartStr + 'and ' +  cart[i].count + ' ' + cart[i].name + 's';
            }
          } else {
            if (cart[i].count == 1 || cart[i].name[cart[i].name.length - 1] == 's') {
              cartStr = cartStr +  cart[i].count + ' ' + cart[i].name + ', ';
            } else {
              cartStr = cartStr +  cart[i].count + ' ' + cart[i].name + 's, ';
            }
          }
        }
      }

      await addMessage(agent.query, true);
      addMessage(`Your cart has ${totalItems} items in it. It contains ${cartStr}. The total is $${totalCost}.`, false);
    }

    return serverResponse;
  }

  async function reviewCart() {
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token,
      },
      redirect: 'follow'
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request);
    const serverResponse = await serverReturn.json();

    const cart = serverResponse.products;
    console.log(cart);
    navigate('cart-review');

    if (cart.length == 0) {
      await addMessage(agent.query, true);
      addMessage("Your cart is currently empty.", false);
    } else {
      let cartStr = "";
      let totalCost = 0;
      let totalItems = 0;
      if (cart.length == 1) {
        totalCost = totalCost + (cart[0].price * cart[0].count);
        totalItems += cart[0].count;

        if (cart.count == 1 || cart[0].name[cart[0].name.length - 1] == 's') {
          cartStr = cart[0].count + ' ' + cart[0].name;
        } else {
          cartStr = cart[0].count + ' ' + cart[0].name + 's';
        }
      } else {
        for (let i = 0; i < cart.length; i++) {
          totalCost = totalCost + (cart[i].price * cart[i].count);
          totalItems += cart[i].count;

          if (i == cart.length - 1) {
            // last item
            if (cart[i].count == 1) {
              cartStr = cartStr + 'and ' + cart[i].count + ' ' + cart[i].name;
            } else {
              cartStr = cartStr + 'and ' +  cart[i].count + ' ' + cart[i].name + 's';
            }
          } else {
            if (cart[i].count == 1 || cart[i].name[cart[i].name.length - 1] == 's') {
              cartStr = cartStr +  cart[i].count + ' ' + cart[i].name + ', ';
            } else {
              cartStr = cartStr +  cart[i].count + ' ' + cart[i].name + 's, ';
            }
          }
        }
      }

      await addMessage(agent.query, true);
      addMessage(`Your cart has ${totalItems} items in it. It contains ${cartStr}. The total is $${totalCost}.`, false);
    }

    return serverResponse;
  }

  async function checkout() {
    if (!isLoggedIn()) {
      addMessage("Please login first.", false);
      return;
    }

    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token,
      },
      redirect: 'follow'
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request);
    const serverResponse = await serverReturn.json();

    const cart = serverResponse.products;
    await addMessage(agent.query, true);

    if (cart.length == 0) {
      addMessage('Unable to checkout. Your cart is currently empty.', false);
    } else {
      addMessage('Do you want to review your cart before checking out?', false);
    }
  }
  
  // Said yes for reviewing cart before checkout
  async function checkoutYes() {
    await reviewCart();
  }

  // Don't review cart before checking out
  async function checkoutNo() {
    await addMessage(agent.query, true);
    navigate('cart-confirmed');
    addMessage('Your order has been confirmed. Thank you for shopping at WiscShop!', false);

    //return serverResponse;
  }

  async function clearCart() {
    await addMessage(agent.query, true);

    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }

    const request = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request);
    const serverResponse = await serverReturn.json();
    addMessage('Your cart has been cleared.', false);
    navigate('cart');
  }

  async function getCategories() {
    await addMessage(agent.query, true);

    const request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/categories', request);
    const serverResponse = await serverReturn.json();

    const categories = serverResponse.categories;

    let categoriesStr = '';
    for (let i = 0; i < categories.length; i++) {
      if (i == categories.length - 1) {
        categoriesStr = categoriesStr + 'and ' + categories[i] + ".";
      } else {
        categoriesStr = categoriesStr + categories[i] + ", ";
      }
    }

    addMessage('You can query for the following categories: ' + categoriesStr + '.', false);
  }

  async function searchByCategory() {
    await addMessage(agent.query, true);
    const category = agent.parameters.category[0].toLowerCase();

    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    let serverReturn = await fetch(ENDPOINT_URL + '/categories', request);
    let serverResponse = await serverReturn.json();

    const categories = serverResponse.categories;
    console.log("category " + category);
    if (categories.includes(category)) {
      navigate(category);

      // Search for products with that category
      let request = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        redirect: 'follow'
      }
  
      let serverReturn = await fetch(ENDPOINT_URL + '/products', request);
      let serverResponse = await serverReturn.json();

      const products = serverResponse.products.filter(productObj => productObj.category == category);
      let productsStr = 'The items in this category include: ';

      if (products.length == 1) {
        productsStr = 'The only item in this category is ' + products[0].name + '.'; 
      } else {
        for (let i = 0; i < products.length; i++) {
          if (i == products.length - 1) {
            productsStr = productsStr + 'and ' + products[i].name + '.';
          } else {
            productsStr = productsStr + products[i].name + ', ';
          }
        }
      }
      agent.context.set({
        'name': 'current-category',
        'lifespan': 5,
        'parameters': {
          'category': category,
          'categoryProducts': products
        }
      });

      addMessage(productsStr, false);
    } else {
      addMessage("Products with the category: " + category + " were not found. Please try again.", false);
    }
  }

  async function getCategoryTags() {
    await addMessage(agent.query, true);
    const category = agent.parameters.category.toLowerCase();

    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    let serverReturn = await fetch(ENDPOINT_URL + '/categories', request);
    let serverResponse = await serverReturn.json();

    const categories = serverResponse.categories;

    if (categories.includes(category)) {
      navigate(category);

      // Search for products with that category
      let request = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        redirect: 'follow'
      }
  
      let serverReturn = await fetch(ENDPOINT_URL + '/categories/' + category + '/tags' , request);
      let serverResponse = await serverReturn.json();

      const tags = serverResponse.tags;
      let tagsStr = 'The tags in this category include: ';

      if (tags.length == 1) {
        tagsStr = 'The only tag in this category is ' + tags[0] + '.'; 
      } else {
        for (let i = 0; i < tags.length; i++) {
          if (i == tags.length - 1) {
            tagsStr = tagsStr + 'and ' + tags[i] + '.';
          } else {
            tagsStr = tagsStr + tags[i] + ', ';
          }
        }
      }
      addMessage(tagsStr, false);
    } else {
      addMessage("The category: " + category + " was not found. Please try again.", false);
    }
  }

  // Will return -1 if no product was found
  async function getProductId(productName) {
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    let serverReturn = await fetch(ENDPOINT_URL + '/products' , request);
    let serverResponse = await serverReturn.json();

    const products = serverResponse.products;
    productName = productName.toLowerCase();
    let foundProductId = -1; // Will return -1 if no product was found

    for (let i = 0; i < products.length; i++) {
      if (productName === products[i].name.toLowerCase()) {
        foundProductId = products[i].id;
        break;
      }
    }
    return foundProductId;
  }

  async function getPluralProducts() {
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    serverReturn = await fetch(ENDPOINT_URL + '/products', request);
    serverResponse = await serverReturn.json();

    // Get all products ending with s
    let pluralProducts = [];
    const products = serverResponse.products;
    for (let i = 0; i < products.length; i++) {
      if (products[i].name[products[i].name.length - 1] == 's') {
        pluralProducts.push(products[i].name.toLowerCase());
      }
    }
    return pluralProducts;
  }

  async function addToCart() {
    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }

    await addMessage(agent.query, true);

    let product = agent.parameters.product;
    let origProductStr = agent.parameters.product;

    let quantity = agent.parameters.number;
    if (quantity == "") {
      quantity = 1;
    }

    const pluralProducts = await getPluralProducts();
    if (quantity > 1 && !pluralProducts.includes(product.toLowerCase())) {
      // remove the 's' frorm the end
      if (product.substring(product.length - 2, product.length) == 'es') {
        product = product.substring(0, product.length - 2);
      } else if (product[product.length - 1] == 's') {
        product = product.substring(0, product.length - 1);
      }
   }

    const productId = await getProductId(product);
    console.log("product id " + productId);
    console.log("quantity " + quantity);

    if (productId == -1) {
      addMessage("Sorry, the product: " + product + " was not found. Please try again.", false);
    } else {
      // Found product
      let request = {
        method: 'POST',
        headers: {'x-access-token': token },
        redirect: 'follow'
      }
      for (let i = 0; i < quantity; i++) {
        const serverReturn = await fetch(ENDPOINT_URL + '/application/products/' + productId, request);
        const serverResponse = await serverReturn.json();
      }
      addMessage(`Successfully added ${quantity} ${origProductStr} to your cart.`);
    }
  }

  async function removeFromCart() {
    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }

    await addMessage(agent.query, true);

    let product = agent.parameters.product;
    let origProductStr = agent.parameters.product;

    let quantity = agent.parameters.number;
    if (quantity == "") {
      quantity = 1;
    }

    const pluralProducts = await getPluralProducts();
    if (quantity > 1 && !pluralProducts.includes(product.toLowerCase())) {
       // remove the 's' frorm the end
      if (product.substring(product.length - 2, product.length) == 'es') {
        product = product.substring(0, product.length - 2);
      } else if (product[product.length - 1] == 's') {
        product = product.substring(0, product.length - 1);
      }
    }

    const productId = await getProductId(product);

    if (productId == -1) {
      addMessage("Sorry, the product: " + product + " was not found. Please try again.", false);
    } else {
      // Found product
      const inCart = await isInCart(productId);
      if (!inCart) {
        addMessage('The product: ' + origProductStr + ' was not found in your cart.');
        return;
      }

      let request = {
        method: 'DELETE',
        headers: {'x-access-token': token },
        redirect: 'follow'
      }
      let deleted = 0;
      for (let i = 0; i < quantity; i++) {
        const serverReturn = await fetch(ENDPOINT_URL + '/application/products/' + productId, request);
        const serverResponse = await serverReturn.json();
        if (serverResponse.Response == "Product not found!") {
          break;
        } else {
          deleted++;
        }
      }
      addMessage(`Successfully removed ${deleted} ${origProductStr} to your cart.`);
    }
  }

  async function isInCart(productId) {
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token,
      },
      redirect: 'follow'
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request);
    const serverResponse = await serverReturn.json();

    const cart = serverResponse.products;

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == productId) {
        return true;
      }
    }

    return false;
  }

  // Reads product description, tags, price, and average rating
  async function getProductInfo() {
    await addMessage(agent.query, true);

    const productId = await getProductId(agent.parameters.product[0]);

    if (productId == -1) {
      addMessage("Sorry, the product: " + agent.parameters.product[0] + " was not found. Please try again.", false);
    } else {
      // Found product
      // Get product info
      let request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token,
        },
        redirect: 'follow'
      }
    
      let serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId, request);
      let serverResponse = await serverReturn.json();
  
      const productInfo = serverResponse;
      const category = productInfo.category;
      navigate(category + "/products/" + productId);

      // Get product reviews
      request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token,
        },
        redirect: 'follow'
      }
    
      serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId + "/reviews", request);
      serverResponse = await serverReturn.json();
      const productReviews = serverResponse.reviews;

      let sumRating = 0;
      for (let i = 0; i < productReviews.length; i++) {
        sumRating += productReviews[i].stars;
      }
  
      let reviewsStr = `This product has been reviewed ${productReviews.length} times for an average of ${(sumRating / productReviews.length).toFixed(1)} stars.`;
      if (productReviews.length == 0) {
        reviewsStr = `This product has no reviews.`;
      }

      // Get product tags
      request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token,
        },
        redirect: 'follow'
      }
    
      serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId + "/tags", request);
      serverResponse = await serverReturn.json();
  
      const tags = serverResponse.tags;
      let tagsStr = `The tags for this product include: ${tags.join(", ")}.`;
      if (tags.length == 0) {
        tagsStr = "";
      }

      // Construct response
      let response = `The description is: "${productInfo.description}". 
       ${tagsStr} 
       The cost is $${productInfo.price}. 
       ${reviewsStr}`;
      if (tags.length == 0) {
        response = `The description is: "${productInfo.description}".
         The cost is $${productInfo.price}.
         ${reviewsStr}`;
      }

      agent.context.set({
        'name': 'current-product',
        'lifespan': 5,
        'parameters': {
          'reviews': productReviews,
          'product': productInfo
        }
      });

      await addMessage(response, false);
    }
  }

  // Gets all reviews for a product given the current-product context
  async function getProductInfoReviews() {
    await addMessage(agent.query, true);
    const reviews = agent.context.get('current-product').parameters.reviews;

    let responseStr = '';
    for (let i = 0; i < reviews.length; i++) {
      responseStr = responseStr + `Review ${i + 1}: The title is "${reviews[i].title}" and the rating is ${reviews[i].stars}. The text is "${reviews[i].text}". `;
    }
    addMessage(responseStr, false);
  }

  // Adds the current item in the context to the cart after getting its info
  async function getProductInfoAddToCart() {
    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }
    await addMessage(agent.query, true);
    const origProductStr = agent.context.get('current-product').parameters.product.name;

    let product = agent.context.get('current-product').parameters.product.name;

    let quantity = agent.parameters.number;
    if (quantity == "") {
      quantity = 1;
    }

    if (quantity > 1) {
      // remove the 's' from the end
     if (product[product.length - 1] == 's') {
       product = product.substring(0, product.length - 1);
     } else if (product[product.length - 2] == 'es') {
       product = product.substring(0, product.length - 2);
     }
   }

    const productId = agent.context.get('current-product').parameters.product.id;
    console.log("product id " + productId);
    console.log("quantity " + quantity);

    
    let request = {
      method: 'POST',
      headers: {'x-access-token': token },
      redirect: 'follow'
    }
    for (let i = 0; i < quantity; i++) {
      const serverReturn = await fetch(ENDPOINT_URL + '/application/products/' + productId, request);
      const serverResponse = await serverReturn.json();
    }
    addMessage(`Successfully added ${quantity} ${origProductStr} to your cart.`);
    
  }

  // Reads all reviews for a product and the average rating
  async function readReviews() {
    await addMessage(agent.query, true);

    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    let serverReturn = await fetch(ENDPOINT_URL + '/products' , request);
    let serverResponse = await serverReturn.json();

    const products = serverResponse.products;
    const productName = agent.parameters.product.toLowerCase();
    let productId = -1; 
    let category = "";

    for (let i = 0; i < products.length; i++) {
      if (productName === products[i].name.toLowerCase()) {
        productId = products[i].id;
        category = products[i].category;
        break;
      }
    }

    if (productId == -1) {
      addMessage("Sorry, the product: " + agent.parameters.product + " was not found. Please try again.", false);
    } else {
      navigate(category + '/products/' + productId);

      // Found product
      // Get product reviews
      request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token,
        },
        redirect: 'follow'
      }
    
      serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId + "/reviews", request);
      serverResponse = await serverReturn.json();
      const productReviews = serverResponse.reviews;

      let sumRating = 0;
      for (let i = 0; i < productReviews.length; i++) {
        sumRating += productReviews[i].stars;
      }
  
      let reviewsStr = `This product has been reviewed ${productReviews.length} times for an average of ${(sumRating / productReviews.length).toFixed(1)} stars. Would you like me to go through all of the reviews?`;
      agent.context.set({
        'name': 'current-product',
        'lifespan': 5,
        'parameters': {
          'reviews': productReviews
        }
      });
      if (productReviews.length == 0) {
        reviewsStr = `This product has no reviews.`;
      }
      addMessage(reviewsStr, false);
    }
  }

  // Do not read all of the reviews for a product
  async function readReviewsNo() {
    await addMessage(agent.query, true);
    addMessage('Okay. What else can I help you with today?', false);
  }

  // Read all of the reviews for a product
  async function readReviewsYes() {
    await addMessage(agent.query, true);
    const reviews = agent.context.get('current-product').parameters.reviews;

    let responseStr = '';
    for (let i = 0; i < reviews.length; i++) {
      responseStr = responseStr + `Review ${i + 1}: The title is "${reviews[i].title}" and the rating is ${reviews[i].stars}. The text is "${reviews[i].text}". `;
    }
    addMessage(responseStr, false);
  }

  // Narrow down a list of products by tags in a category
  async function getProductsByTags() {
    await addMessage(agent.query, true);

    const category = agent.parameters.category.toLowerCase();
    let tags = agent.parameters.tags;
    tags = tags.map(tag => tag.toLowerCase());

    console.log("tags " + tags);
    console.log("category " + category);
    navigate(category);

    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      redirect: 'follow'
    }

    let serverReturn = await fetch(ENDPOINT_URL + '/categories', request);
    let serverResponse = await serverReturn.json();

    const categories = serverResponse.categories;

    if (categories.includes(category)) {
      // Search for products with that category
      let request = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        redirect: 'follow'
      }
  
      serverReturn = await fetch(ENDPOINT_URL + '/products', request);
      serverResponse = await serverReturn.json();

      // Get all products with the specified category
      const products = serverResponse.products.filter(productObj => productObj.category == category);
      let productsWithTags = []; // products with the specified tags

      // Match products in the category with the tags the user provided
      for (let i = 0; i < products.length; i++) {
        const productId = products[i].id;
        // Get tags for product
        request = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
          },
          redirect: 'follow'
        }
    
        serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId + '/tags', request);
        serverResponse = await serverReturn.json();
        const productTags = serverResponse.tags;

        for (let j = 0; j < productTags.length; j++) {
          for (let z = 0; z < tags.length; z++) {
            if (productTags[j] === tags[z]) {
              productsWithTags.push(products[i]);
              break;
            }
          }
        }

      }
      let productsStr = 'I found the following items: ';

      if (productsWithTags.length == 1) {
        productsStr = `The only product found was ${productsWithTags[0].name}.`; 
      } else if (productsWithTags.length > 1) {
        for (let i = 0; i < productsWithTags.length; i++) {
          if (i == productsWithTags.length - 1) {
            productsStr = productsStr + 'and ' + productsWithTags[i].name + '.';
          } else {
            productsStr = productsStr + productsWithTags[i].name + ', ';
          }
        }
      } else {
        productsStr = 'Unfortunately, I did not find any products. Please try again.';
      }
      addMessage(productsStr, false);
    } else {
      addMessage("Products with the category: " + category + " were not found. Please try again.", false);
    }
  }

  // Shows a list of products given context for a category. Can optionally take tags to help filter items
  async function listProductsFromContext() {
    await addMessage(agent.query, true);

    const category = agent.context.get('current-category').parameters.category;
    const products = agent.context.get('current-category').parameters.categoryProducts; // products with the specified category    
    let tags = agent.parameters.tags;
    tags = tags.map(tag => tag.toLowerCase());
    navigate(category);

    let productsWithTags = []; // products with the specified tags

      // Match products in the category with the tags the user provided
      for (let i = 0; i < products.length; i++) {
        const productId = products[i].id;
        // Get tags for product
        request = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
          },
          redirect: 'follow'
        }
    
        serverReturn = await fetch(ENDPOINT_URL + '/products/' + productId + '/tags', request);
        serverResponse = await serverReturn.json();
        const productTags = serverResponse.tags;

        for (let j = 0; j < productTags.length; j++) {
          for (let z = 0; z < tags.length; z++) {
            if (productTags[j] === tags[z]) {
              productsWithTags.push(products[i]);
              break;
            }
          }
        }

      }
      let productsStr = 'I found the following items: ';

      if (productsWithTags.length == 1) {
        productsStr = `The only product found was ${productsWithTags[0].name}.`; 
      } else if (productsWithTags.length > 1) {
        for (let i = 0; i < productsWithTags.length; i++) {
          if (i == productsWithTags.length - 1) {
            productsStr = productsStr + 'and ' + productsWithTags[i].name + '.';
          } else {
            productsStr = productsStr + productsWithTags[i].name + ', ';
          }
        }
      } else {
        productsStr = 'Unfortunately, I did not find any products. Please try again.';
      }
      addMessage(productsStr, false);
  }

  async function navigate(page) {
    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }

    let request = {};

    if (page == 'back') {
      request = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token },
        body: JSON.stringify({ dialogflowUpdated: true,
                               back: true}),
        redirect: 'follow'
      }
    } else {
      request = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token },
        body: JSON.stringify({ page: '/' + username + '/' + page,
                               dialogflowUpdated: true,
                               back: false}),
        redirect: 'follow'
      }
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application', request);
    const serverResponse = await serverReturn.json()
    return serverResponse;
  }

  async function takeUserToPage() {
    await addMessage(agent.query, true);
    const page = agent.parameters.page.toLowerCase();

    if (!isLoggedIn()) {
      await addMessage("Please login first.", false);
      return;
    }

    if (page == 'signin') {
      await addMessage('Navigating to sign in page.', false);
      navigate('signIn');
    } else if (page == 'home' || page == 'welcome') {
      await addMessage(`Navigating to ${page} page.`, false);
      navigate('');
    } else if (page == 'signup') {
      await addMessage('Navigating to sign up page.', false);
      navigate('signUp');
    } else if (page == 'back' || page == 'previous') {
      await addMessage('Navigating to previous page.', false);
      navigate('back');
    } else {
      await addMessage(`Navigating to ${page} page.`, false);
      navigate(page);
    }
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('login', login);
  intentMap.set('View Cart', viewCart);
  intentMap.set('checkout', checkout);
  intentMap.set('checkout - yes', checkoutYes);
  intentMap.set('checkout - no', checkoutNo);
  intentMap.set('get categories', getCategories);
  intentMap.set('get products by category', searchByCategory);
  intentMap.set('get products by category - use tags', listProductsFromContext);
  intentMap.set('clear cart', clearCart);
  intentMap.set('get category tags', getCategoryTags);
  intentMap.set('add to cart', addToCart);
  intentMap.set('remove from cart', removeFromCart);
  intentMap.set('get product info', getProductInfo);
  intentMap.set('get product info - reviews', getProductInfoReviews);
  intentMap.set('get product info - add to cart', getProductInfoAddToCart);
  intentMap.set('read reviews', readReviews);
  intentMap.set('read reviews - no', readReviewsNo);
  intentMap.set('read reviews - yes', readReviewsYes);
  intentMap.set('get products by tags', getProductsByTags);
  intentMap.set('take user to page', takeUserToPage);

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080)
