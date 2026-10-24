import prisma from "./lib/prisma";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import userRoutes from "./routes/userRoutes";
import express from 'express'
import cors from 'cors'
import documentRoutes from "./routes/documentRoutes";
const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/users', userRoutes)
app.use('/api/', documentRoutes)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'ok',
      message: 'PLCM backend and database are connected',
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    })
  }
})

app.listen(PORT, () => {
  console.log(`PLCM backend running on http://localhost:${PORT}`)
})