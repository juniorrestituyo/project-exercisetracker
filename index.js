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
const logSubSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
}, { _id : false })
  
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  count: Number,
  log: [logSubSchema]
})

// Models
const User = mongoose.model('User', userSchema)

// Endpoints
app.route('/api/users')
  .post( (req, res) => {
    const username = req.body.username
    
    const newUser = new User({
      username: username
    })
    
    newUser.save(function(err, data) {
      res.json(data)
    })
  })
  .get( (req, res) => {
    User.find({}).exec(function(err, data) {
      res.json(data)
    })
  })

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id
  const description = req.body.description
  const duration = req.body.duration
  
  let dateRaw = new Date(req.body.date)
  
  if(!req.body.date) {
    dateRaw = new Date()
  }
  
  const date = dateRaw.toDateString()
  
  User
    .findById({ _id: id })
    .exec(function(err, user) {
      user.count = user.__v + 1
      user.log.push({
        description: description,
        duration: duration,
        date: date
      })

      user.save(function(err, data) {
        for(let i = 0; data.__v > i; i++) {
          res.json({
            username: data.username,
            description: data.log[i].description,
            duration: data.log[i].duration,
            date: data.log[i].date,
            _id: data._id
          })
        }
      })
    })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id
  const dateFrom = new Date(req.query.from)
  const dateTo = new Date(req.query.to)
  const limit = req.query.limit

  User
    .findById({ _id: id })
    .exec(function(err, user) {
      if(limit) {
        user.count = limit
      }

      if(user.count > 1) {
        res.json({
          username: user.username,
          count: user.count,
          _id: user._id,
          log: user.log
        })
      } else {
        for(let i = 0; user.count > i; i++) {
        res.json({
          username: user.username,
          count: user.count,
          _id: user._id,
          log: [user.log[i]]
        })
      }
    }
  })
})


// App Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
