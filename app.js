const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('users.json')
const db = low(adapter)



// Initialize default structure if not exists
db.defaults({ users: [], tokens: [] }).write()


const app = express()
const PORT = 5000

// MIDDLEWARE
app.use("/static", express.static(path.join(__dirname, "static")))
app.use('/images', express.static(path.join(__dirname, "images")));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views')

// GET REQUESTS
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "index.html"))
})

app.get("/error", (req, res) => {
    res.sendFile(path.join(__dirname, "html/error.html"))
})

// POST REQUESTS
app.post("/signup", (req, res) => {
    const { email, password, cpassword } = req.body
    const points = 0

    // Optional: Simple validation
    if (!email || !password || password !== cpassword) {
        return res.status(400).send("Invalid input")
    }

    
    const existingUser = db.get("users").find({email}).value()
    
    if (existingUser) {
        res.status(409).send("user already exists")
    }

    // Save to db
    db.get('users')
      .push({ email, password, points }) // Don't store passwords like this in real apps // fuck u chatgpt
      .write()

    res.send("User signed up successfully!")
})

app.post("/login", (req, res) => {
    const { email, password } = req.body

    const emailExists = db.get("users").find({email}).value()

    if (emailExists) {
        const correctPassword = emailExists.password
        const points = emailExists.points

        if (password === correctPassword) {
                        
            let code = db.get("tokens")
            .find(obj => Object.keys(obj).includes(email))
            .value();

            let codeInt;

            console.log(code)

            if (code) { //if there is a code, remove it
                db.get("tokens")
                .remove(obj => Object.keys(obj)[0] === email)
                .write()
            }

            //add a code

            codeInt = Math.round(Math.random() * 100000000)
            db.get("tokens").push({[email]: codeInt}).write() 


            res.render('home', { email, points, codeInt })
        }else{
            const message = encodeURIComponent("Incorrect Password")
            res.redirect(`/error?code=${401}&message=${message}`)
        }
    }else{
        const message = encodeURIComponent("Email not registered")
        res.redirect(`/error?code=${401}&message=${message}`)
    }

    

})

// OTHER FILES' REQUESTS (already handled by static middleware, but this is okay too) // GO FUCK URSELF CHATGPT, MY CODE, MY RULES U MOTHERFUCKER ASKLDHJASLKDHJ
app.get("/static/styles.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/styles.css"))
})

app.listen(PORT, () => {
    console.log("Listening at port: " + PORT)
})
