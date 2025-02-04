const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const app = express()

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// DB Connection
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
})

const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
})
  

// Models
const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

// Endpoints
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('_id username')

  if(!users) {
    res.send("No users")
    
  } else {
    res.json(users)
  }
})

app.post('/api/users', async (req, res) => {
  const newUser = new User({
    username: req.body.username
  })

  try {
    const user = await newUser.save()
    console.log(user)
    res.json(user)
    
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id
  const { description, duration, date } = req.body

  try {
    const user = await User.findById(id)
    
    if(!user) {
      res.send("Could not find user")
      
    } else {
      const newExercise = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await newExercise.save()

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
    
  } catch (err) {
    console.log(err)
    res.send("There was an error saving the execrise")
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id
  const { from, to, limit } = req.query

  const user = await User.findById(id)

  if(!user) {
    res.send('Could not find user')
    
  } else {
    let dateObj = {}
    
    if (from) {
      dateObj["$gte"] = new Date(from)
    }
    if (to) {
      dateObj["$lte"] = new Date(to)
    }
    
    let filter = {
      user_id: id
    }
    
    if(from || to) {
      filter.date = dateObj
    }
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})


// App Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
