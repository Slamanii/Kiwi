import cors from "cors"
import "dotenv/config"
import express from "express"
import { config } from "./config.js"
import { createSocketServer } from './utils/socket.js'
import authRouter from './routes/auth.js'
import profileRouter from './routes/profile.js'
import seekRouter from './routes/seek.js'
import bidRouter from './routes/bid.js'
import threadRouter from './routes/thread.js'
import uploadRouter from './utils/upload.js'

const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => { 
        console.log(`${req.method} ${req.path}`); 
          next(); });


const router = express.Router();

app.use("/api", router);
app.use('api/auth', authRouter)
app.use('api/profile', profileRouter)
app.use('/api/seek', seekRouter)
app.use('/api/bid', bidRouter)
app.use('/api/thread', threadRouter)
app.use('api/upload', uploadRouter)

const httpServer: any = createSocketServer(app)


app.get('/', (req, res) => {res.send('Server is running on Port 3001')});

httpServer.listen(PORT, () => {console.log(`server is listening on port ${PORT}`)});