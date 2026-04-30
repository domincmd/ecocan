const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const low = require('lowdb')
const fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')
const { SerialPort, ReadlineParser } = require('serialport');
const Database = require('better-sqlite3');
const db = new Database('database.db');
const session = require('express-session');



//predefine sqlite actions
const insertUser = db.prepare(`
  INSERT INTO users (username, password, points)
  VALUES (?, ?, ?)
`);

const getUser = db.prepare(`
  SELECT * FROM users WHERE username = ?
`);

const updateUser = db.prepare(`
  UPDATE users SET points = ? WHERE username = ?
`);

const getAll = db.prepare(`SELECT * FROM users`);

const delUser = db.prepare(`
  DELETE FROM users WHERE username = ?
`);

const addCode = db.prepare(`
    INSERT INTO codes (code)
    VALUES (?)
`)

const getCodes = db.prepare(`SELECT * FROM codes`);

const delCode = db.prepare(`
    DELETE FROM codes WHERE code = ?
`)

const priceTable = {
    "Iniciante": 20,
    "Experiente": 50,
    "Lendário": 100,
}

const COM_PORT = 'COM3'; // defines the arduino port
const BAUD_RATE = 9600;

// initialize serial port
const port = new SerialPort({
    path: COM_PORT,
    baudRate: BAUD_RATE,
    autoOpen: false
});

port.on('open', () => {
    console.log('[STARTUP] Serial port opened. Listening...');
});

port.on('error', err => {
    console.error('[ERROR] Serial Port Error:', err.message);
});

// try to open the port
/*port.open(err => {
    if (err) {
        console.error('[ERROR] Failed to open port:', err.message);
        process.exit(1);
    }
});*/

// parser
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

/*parser.on('data', (line) => {
  const text = String(line).trim();        
  const n = Number(text);                  
  if (!Number.isNaN(n)) handleArduinoCode(n);
});*/

// add arduino code to the db
function handleArduinoCode(codeNumber) {
  console.log('[ACTION] Code parsed and added:', codeNumber);
  fs.writeFile("tmp/codes.txt", codeNumber, (err) => {
    if (err) {
        console.log("[ERROR] Writing file codes.txt")
    }
  })
  db.get('rcodes').push({ code: codeNumber }).write();
}

/*// shutdown and cleanup
process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Closing serial port...');
    try {
        port.close(() => process.exit(0));
    } catch (_) {
        process.exit(0);
    }
});*/


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
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// GET REQUESTS
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "html", "index.html"))
})

app.get("/error", (req, res) => {
    res.sendFile(path.join(__dirname, "html/error.html"))
})

app.get("/success", (req, res) => {
    res.sendFile(path.join(__dirname, "html/success.html"))
})

app.get("/quemsomos", (req, res) => {
    res.sendFile(path.join(__dirname, "/html/info/quemsomos.html"))
})

app.get("/comooperamos", (req, res) => {
    res.sendFile(path.join(__dirname, "/html/info/comooperamos.html"))
})

app.get("/detalhestecnicos", (req, res) => {
    res.sendFile(path.join(__dirname, "/html/info/detalhestecnicos.html"))
})


function checkValidity(code, email) {
    let codeInt = db.get("tokens").find(email).value();
    codeInt = codeInt[email];
    if (code == codeInt) {return true}
    else {return false}
} 

app.get("/home", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const user = getUser.get(req.session.user.username)
    const username = user.username
    const points = user.points

    res.render('home', { username, points })
    
})

app.get("/shop", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const user = getUser.get(req.session.user.username)
    const username = user.username
    const points = user.points

    res.render('shop', { username, points })
    
})

app.get("/buy", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const user = getUser.get(req.session.user.username)
    const username = user.username
    const points = user.points
    const buyId = req.query.buyId

    
    const price = priceTable[buyId]
    if (price == undefined) {
        res.redirect(`/error?code=${401}&message=Id de compra inválido`)
    }
    if (points >= price) {
            updateUser.run(points-price, user.username)
            
            console.log(`[ACTION] Purchase: ${username} bought for the price of ${price}ep. a(n) ${buyId}`)
            fs.appendFile('tmp/compras.txt', `\n[COMPRA]: ${username} comprou por ${price}ep. um ${buyId}`, (err) => { //adiciona na db pros admins verem
                if (err) throw err;
            });
            res.redirect(`/success?message=Compra Efetuada!&page=home`)
    }else{
        res.redirect(`/error?code=${401}&message=Você tem ${points} e está tentando efetuar uma compra no valor de ${price}.`)
    }
})

app.get("/scan", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const user = getUser.get(req.session.user.username)
    const username = user.username
    const points = user.points

    res.render('points', { username, points })
})

app.get("/check", (req, res) => { //NEEDS REFACTORING
    if (!req.session.user) {
        return res.redirect('/');
    }

    const user = getUser.get(req.session.user.username)
    const username = user.username
    const points = user.points
    
    
    const codes = getCodes.all() //this works
    const recievedCode = parseInt(req.query.code) //this is the issue here

    let codeExists = false

    for (const code of codes) {
        if (code.code === recievedCode) {
            codeExists = true
            break
        }
    }

    if (codeExists) { //CODE EXISTS

        delCode.run(recievedCode)

        updateUser.run(points+10, user.username)

        res.redirect(`/home`) //use codeInt here cuz it is referenced in home.ejs
    }else{
        res.redirect(`/error?code=${401}&message=Código inexistente`)
    }
})

// POST REQUESTS
app.post("/signup", (req, res) => {
    const { username, password, cpassword } = req.body
    const points = 0

    // Optional: Simple validation
    if (!username || !password || password !== cpassword) {
        return res.redirect(`/error?code=${400}&message=Input Inválido.`)
    }

    
    const existingUser = getAll.all().includes(username)
    
    if (existingUser) {
        res.redirect(`/error?code=${401}&message=O usuário já existe.`)
    }

    // Save to db
    insertUser.run(username, password, 0)

    console.log(`[ACTION] User successfully created account, username ${username}`)

    res.redirect(`/success?message=Conta criada!&page=`)
})

app.post("/login", (req, res) => {
    const { username, password } = req.body
    const user = getUser.get(username)

    console.log({username, password})
    console.log(user)

    if (user) {
        const correctPassword = user.password
        const points = user.points

        if (password === correctPassword) {  
            req.session.user = {
                username: user.username
            };

            console.log(`[ACTION] User successfully logged in, email ${user.username}`)


            res.redirect(`/home`)
        }else{
            const message = encodeURIComponent("Senha Incorreta")
            res.redirect(`/error?code=${401}&message=${message}`)
        }
    }else{
        const message = encodeURIComponent("Email Não Registrado")
        res.redirect(`/error?code=${401}&message=${message}`)
    }
})


app.listen(PORT, HOST, () => {
    console.log(`[STARTUP] Listening on http://${HOST}:${PORT}`)
})

