const app = require('./app');
const {PORT} = process.env; // same as process.env.PORT

app.listen(PORT, ()=> console.log(`Server is running at port ${PORT}...`));