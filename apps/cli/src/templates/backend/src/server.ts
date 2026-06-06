import { app } from './app.js'
import { env } from './common/env.js'

const port = env.PORT

app.listen(port, () => {
  console.log(`API server running on port ${port}`)
})
