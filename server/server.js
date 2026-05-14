require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
   res.send("Backend is running successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
