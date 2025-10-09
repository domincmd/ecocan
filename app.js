const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { SerialPort, ReadlineParser } = require('serialport');

const adapter = new FileSync('tmp/data.json')
const db = low(adapter)



// Initialize default structure if not exists
db.defaults({ users: [], tokens: [], rcodes: [] }).write() //redeem codes

const COM_PORT = 'COM4'; // define your specific port
const BAUD_RATE = 9600;

// ---- Initialize Serial Port ----
const port = new SerialPort({
    path: COM_PORT,
    baudRate: BAUD_RATE,
    autoOpen: false
});

port.on('open', () => {
    console.log('✅ Serial port opened. Listening...');
});

port.on('error', err => {
    console.error('Serial Port Error:', err.message);
});

// Try to open the port directly
port.open(err => {
    if (err) {
        console.error('Failed to open port:', err.message);
        process.exit(1);
    }
});

// ---- Parser Setup ----
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' })); // or '\n'

parser.on('data', (line) => {
  const text = String(line).trim();        // remove CR/LF, spaces
  const n = Number(text);                  // your Arduino prints a number per line
  if (!Number.isNaN(n)) handleArduinoCode(n);
});

// ---- Custom Handler ----
function handleArduinoCode(codeNumber) {
  console.log('[Parsed code]', codeNumber);
  db.get('rcodes').push({ code: codeNumber }).write();
}

// ---- Graceful Shutdown ----
process.on('SIGINT', () => {
    console.log('\nClosing serial port...');
    try {
        port.close(() => process.exit(0));
    } catch (_) {
        process.exit(0);
    }
});


const app = express()
const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'
const adminPassword = "eco123" //NEEDS TO BE SAFER AFTERWARDS

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

app.get("/quemsomos", (req, res) => {
    res.sendFile(path.join(__dirname, "/html/info/quemsomos.html"))
})

app.get("/backdoor", (req, res) => {
    res.sendFile(path.join(__dirname, "/html/admin/backdoor.html"))
})

function checkValidity(code, email) {
    let codeInt = db.get("tokens").find(email).value();
    codeInt = codeInt[email];
    if (code == codeInt) {return true}
    else {return false}
} 

app.get("/home", (req, res) => {
    const codeInt = parseInt(req.query.code);
    const email = req.query.email;
    if (checkValidity(codeInt, email)) {
        const points = db.get("users").find({email}).value().points // ADD ERROR MANAGEMENT HERE
        res.render('home', { email, points, codeInt })
    }
})

app.get("/shop", (req, res) => {
    const code = parseInt(req.query.code);
    const email = req.query.email;

    if (checkValidity(code, email)) {
        const points = db.get("users").find({email}).value().points // ADD ERROR MANAGEMENT HERE
        res.render('shop', { email, points, code })
    }else{
        res.redirect(`/error?code=${401}&message=Credenciais inválidas`)
    }
})

app.get("/scan", (req, res) => {
    const code = parseInt(req.query.code);
    const email = req.query.email;
    
    if (checkValidity(code, email)) {
        const points = db.get("users").find({email}).value().points // ADD ERROR MANAGEMENT HERE
        res.render('points', { email, points, code })
    }else{
        res.redirect(`/error?code=${401}&message=Credenciais inválidas`)
    }
})

app.get("/check", (req, res) => {
    const sessionCode = parseInt(req.query.code); //session code
    const email = req.query.email;
    const checkCode = parseInt(req.query.checkcode); //code to be removed from points
    
    if (checkValidity(sessionCode, email)) {
        const rcodes = db.get("rcodes")
        const users = db.get("users")
        const codeInt = sessionCode

        rcodes.update() //fix this later ig
        if (rcodes.find({"code":checkCode}).value() != undefined) { //CODE EXISTS

            rcodes.remove({"code":checkCode}).write()

            db.get('users')
                .find({ email })
                .assign({ points: db.get('users').find({ email }).value().points + 10 })
                .write();
            const points = users.find({email}).value().points

            res.redirect(`/home?code=${codeInt}&email=${email}`) //use codeInt here cuz it is referenced in home.ejs
        }else{
            res.redirect(`/error?code=${401}&message=Código inexistente`)
        }
    }else{
        res.redirect(`/error?code=${401}&message=Sessão inválida`)
    }
})

// POST REQUESTS
app.post("/signup", (req, res) => {
    const { email, password, cpassword } = req.body
    const points = 0

    // Optional: Simple validation
    if (!email || !password || password !== cpassword) {
        return res.redirect(`/error?code=${400}&message=Input Inválido.`)
    }

    
    const existingUser = db.get("users").find({email}).value()
    
    if (existingUser) {
        res.redirect(`/error?code=${401}&message=O usuário já existe.`)
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


            res.redirect(`/home?code=${codeInt}&email=${email}`)
        }else{
            const message = encodeURIComponent("Senha Incorreta")
            res.redirect(`/error?code=${401}&message=${message}`)
        }
    }else{
        const message = encodeURIComponent("Email Não Registrado")
        res.redirect(`/error?code=${401}&message=${message}`)
    }
})



app.post("/backdoor", (req, res) => {
    const password = req.body.password

    if (password === adminPassword) {
        res.sendFile(path.join(__dirname, "/html/admin/dashboard.html"))
    }else{
        res.redirect("/error?code=401&message="+encodeURIComponent("Senha Incorreta"))
    }
})


// OTHER FILES' REQUESTS (already handled by static middleware, but this is okay too) // GO FUCK URSELF CHATGPT, MY CODE, MY RULES U MOTHERFUCKER ASKLDHJASLKDHJS
app.get("/static/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/style.css"))
})

app.get("/static/home.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/home.css"))
})

app.get("/static/index.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/index.css"))
})

app.get("/static/error.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/error.css"))
})

app.get("/static/info.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/info.css"))
})

app.get("/static/points.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/points.css"))
})

app.get("/static/shop.css", (req, res) => {
    res.sendFile(path.join(__dirname, "/static/shop.css"))
})

app.listen(PORT, HOST, () => {
    console.log(`Listening on http://${HOST}:${PORT}`)
})

