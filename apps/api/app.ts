import cors from "cors"
import "dotenv/config"
import express from "express"
import { config } from "./config.js"


const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });


const router = express.Router();

app.use("/api", router);

app.get('/', (req, res) => {res.send('Server is running on Port 3001')});

app.listen(PORT, () => {console.log(`server is listening on port ${PORT}`)});