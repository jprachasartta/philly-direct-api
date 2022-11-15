mapboxgl.accessToken =
"pk.eyJ1IjoianByYWMiLCJhIjoiY2t2aXRzOGx6Y3BldzJvbW50NGxyMDUwbSJ9.xPknrw_XSeNgZ5w7SxkOIg";
const map = new mapboxgl.Map({
  container: "map", // Container ID
  style: "mapbox://styles/jprac/cl9vriycd000314o80svl28s1", // Map style to use
  center: [-71.09561, 42.3638], // Starting position [lng, lat]
  zoom: 12, // Starting zoom level
  projection: "globe",
});
 
// stylize the globe effect
map.on("style.load", () => {
  map.setFog({
    range: [1, 7],
    color: "#d6fffc",
    "horizon-blend": 0.03,
    "high-color": "#000000",
    "space-color": "#000000",
    "star-intensity": 0,
  });
});

// limit the search engine boundary extent to greater Boston
const bostonBounds = [-71.191247, 42.227911, -70.648072, 42.450118];
 
// Initialize the geocoder aka the search engine
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  placeholder: "Search Boston", //placeholer text for the search bar
  bbox: bostonBounds, //limit search results to Philadelphia bounds
});
 
// Add the geocoder to the map
map.addControl(geocoder);

// map.on("load", () => {
//   console.log(map.getStyle());
// });

// // instantiate a popup for the basemap
// const basemapPopup = new mapboxgl.Popup({
//   closeButton: false,
//   closeOnClick: false,
// });
 
// // create a map.on mouse enter event for "road-simple" and "building" layers
// map.on("mousemove", "land-use", (e) => {
//   console.log(e.features[0].properties.class);
//   // string together a number of methods to create a popup
//   basemapPopup
//   .setLngLat(e.lngLat)
//   .setHTML(`${e.features[0].properties.class}`)
//   .addTo(map);
// });

// map.on("mouseleave", "land-use", () => {
//   basemapPopup.remove();
// });

//ENTER YOUR JOTFORM API KEY HERE
JF.initialize({ apiKey: "f91bbeb58da3771327d2396a5469a757" });
 
// Create a function to access the jotform submissions . Format: (formID, callback)
function getSubmissions() {
// ENTER YOUR NEW FORM SUBMISSION ID HERE
  JF.getFormSubmissions("223176459420052", function (responses) {
    // array to store all the submissions: we will use this to create the map
    const submissions = [];
    // for each responses
    for (var i = 0; i < responses.length; i++) {
      // create an object to store the submissions and structure as a json
      const submissionProps = {};
 
      submissionProps["type"] = "Feature";
      submissionProps["geometry"] = {
        type: "Point",
      };
      submissionProps["properties"] = {};
 
      // add all fields of responses.answers to our object
      const keys = Object.keys(responses[i].answers);
      keys.forEach((answer) => {
        let currentAnswer = responses[i].answers[answer].answer;
        if (!currentAnswer) {
          // delete the key if the answer is empty, such as the submit button
          delete responses[i].answers[answer];
          return;
        }
        const lookup = "name";
        const entry = responses[i].answers[answer].name;
 
      // convert lat and long to numbers from strings
        if (entry === "latitude" || entry === "longitude") {
          currentAnswer = parseFloat(currentAnswer);
        }
 
        submissionProps.properties[responses[i].answers[answer][lookup]] =
          currentAnswer;
      });
 
      submissionProps.geometry["coordinates"] = [
        submissionProps.properties.longitude,
        submissionProps.properties.latitude,
      ];
 
      // add submission to submissions array
      submissions.push(submissionProps);
    }

    // see if the source exists
    if (map.getSource("submissions")) {
      // update the source
      map.getSource("submissions").setData({
        type: "FeatureCollection",
        features: submissions,
      });
    }
 
    // add source after map load
    map.on("load", () => {
      map.addSource("submissions", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: submissions,
        },
      });
 
      map.addLayer({
        id: "submissions",
        type: "circle",
        source: "submissions",
        paint: {
          "circle-radius": 10,
          "circle-color": "#9198e5",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#000000",
        },
      });
    });
  });
}
 
// immediately call the function to get the submissions
getSubmissions();

// create a popup on hover
const hoverPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});
 
// add a hover event that shows a hoverPopup with the description
map.on("mouseenter", "submissions", (e) => {
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = "pointer";
 
  const coordinates = e.features[0].geometry.coordinates.slice();
 
  // create some HTML objects to render in the popup
  const htmlContainer = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = e.features[0].properties.placeName;
  const description = document.createElement("p");
  description.innerHTML = e.features[0].properties.description;
 
  // append the HTML objects to the container
  htmlContainer.appendChild(title);
  htmlContainer.appendChild(description);
 
  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the hoverPopup appears
  // over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }
 
  // Populate the hoverPopup and set its coordinates
  hoverPopup.setLngLat(coordinates).setHTML(htmlContainer.outerHTML).addTo(map);
});
 
// hide the hoverPopup when the mouse leaves the layer
map.on("mouseleave", "submissions", () => {
  // set the cursor back to default
  map.getCanvas().style.cursor = "";
  // remove the hoverPopup
  hoverPopup.remove();
});
