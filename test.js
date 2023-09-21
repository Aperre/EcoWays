// Import required modules
const express = require('express');
const { Client } = require('@googlemaps/google-maps-services-js');

// Set up authentication
const client = new Client({});
const API_KEY = 'YOUR_API_KEY';

// Define routes
const app = express();
app.get('/', async (req, res) => {
  const origin = 'Seattle, WA';
  const destination = 'San Francisco, CA';
  const response = await client.directions({
    params: {
      origin: origin,
      destination: destination,
      key: API_KEY,
    },
  });
  res.send(response.data);
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
