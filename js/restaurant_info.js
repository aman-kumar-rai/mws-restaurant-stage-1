let restaurant;
var newMap;

// variables/methods to look for are:
// 1. self
// 2. L
// 3. fillBreadCrumb()

// Initialize the map as soon as the page is loaded...
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

// Initialize leaflet map...
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      // to make sure a particular area's map is loaded, all we need to do is modify the content of this restaurant variable for which the map is loaded as soon as the page finishes loading...
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'sk.eyJ1IjoiYW1hbi1rdW1hciIsImEiOiJjanIwZTR0OXIwa2ViNDJwY2czdm56Nm0xIn0.PDVtkEcM5VNjAWcRBIFYvw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);

      // adding the aria-label for restaurant
      document.querySelector('#map').setAttribute('aria-label', `Map view of ${restaurant.name}`);
    }
  });
}  


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
// using default parameter to load the self.restaurant if a restaurant is not provided when this method is invoked...
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = `<i class='location fa fa-map-marker' aria-hidden='true'></i>${restaurant.address}`;//restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = `./${DBHelper.imageUrlForRestaurant(restaurant)}`;
  image.alt = `${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours only if that data is present in the restaurant object...
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  const docFrag = document.createDocumentFragment();
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    docFrag.appendChild(row);
  }
  hours.append(docFrag);
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);//1st DOM call...

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);//another possible DOM call in case there are no reviews for the current restaurant...
    return;
  }
  const ul = document.getElementById('reviews-list');
  const docFrag = document.createDocumentFragment();
  reviews.forEach(review => {
    docFrag.appendChild(createReviewHTML(review));
  });
  ul.append(docFrag);
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
// this method is called for every review for a restaurant...
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', "0");
  const name = document.createElement('p');
  name.innerHTML = `<i class='fa fa-user person' aria-hidden='true'></i>${review.name}`;//review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  // the code to add star rating...
  const rating = document.createElement('p');
  rating.setAttribute('aria-label', `${review.rating} star rating`);
  var ratingInnerHTML = rating.innerHTML;
  for(let i=1; i<=5; i++){
    if(i<=review.rating){
      ratingInnerHTML += `<i class='fa fa-star orange'></i>`;
    }
    else{
      ratingInnerHTML += `<i class='fa fa-star grey'></i>`;
    }
  }
  rating.innerHTML = ratingInnerHTML;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
