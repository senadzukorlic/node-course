const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session) //dodatak koji omogućava čuvanje sesija u MySQL bazi
const csrf = require("csurf") //Paket koji sluzi za zastitu korisnika,koristi se da obezbedi korisnika tako što osigurava da svaka forma ili zahtev koji menja stanje na serveru dolazi iz legitimnog izvora
const flash = require("connect-flash") // paket koji omogućava čuvanje i prikazivanje poruka između različitih HTTP zahteva

const errorController = require("./controllers/error")
const sequelize = require("./util/database")
const Product = require("./models/product")
const User = require("./models/user")
const Cart = require("./models/cart")
const CartItem = require("./models/cart-item")
const Order = require("./models/order")
const OrderItem = require("./models/order-item")

const store = new MySQLStore({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "IslamIman1",
  database: "node-complete",
})
const csrfProtection = csrf()

const app = express()

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

app.use(bodyParser.urlencoded({ extended: false })) //omogućava vašoj aplikaciji da parsira podatke iz formulara i stavlja ih u req.body
app.use(express.static(path.join(__dirname, "public"))) //omogućava vašoj aplikaciji da služi statičke datoteke iz navedenog direktorijuma klijentima.
app.use(
  session({
    secret: "my secret", // tajni ključ koji se koristi za potpisivanje ID-a sesije
    resave: false, // sesija neće biti sačuvana ponovo ako se nije menjala
    saveUninitialized: false, // nečuvanje neinicijalizovanih sesija
    store: store,
  })
)

app.use(csrfProtection)
app.use(flash())

const flagCsrf = require("./middleware/flag-csrf")
const userSession = require("./middleware/user-session")
app.use(flagCsrf)
app.use(userSession)

app.use("/admin", adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)
app.get("/500", errorController.get500)
app.use(errorController.get404)

app.use((error, req, res, next) => {
  //posebna vrsta middlewera koja se koristi za rukovanje greskama,ako se greska javi negde ranije,automtaski se poziva ovaj middlewre,koji za posao ima renderovanje tj preusmeravanje na stranicu sa greskom statusa.
  // res.redirect("/500")
  console.error(error.stack)
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
  })
})

Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" })
User.hasMany(Product)
User.hasOne(Cart)
Cart.belongsTo(User)
Cart.belongsToMany(Product, { through: CartItem })
Product.belongsToMany(Cart, { through: CartItem })
Order.belongsTo(User)
User.hasMany(Order)
Order.belongsToMany(Product, { through: OrderItem })

sequelize
  .sync()
  .then((cart) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })

//VAZNE STVARI ZA NAPOMENU:
//1.Csrf (CsrfProtection) middleware se koristi da kreira csrf token,koji ce se ugraditi da bude sastavni deo fomri koje se renderuju klijentu (frontendu) i u kojima klijent unosi svoje osetljive podatke,kada forme sa korisnickim podacima budu nazad poslate serveru(bekendu),one ce sadrzati csrf token.CsrfProtection midlleware koji je definisan u app,uporedice prvobinto scrfToken koji se nalazio na frontendu pre nego sto je forma poslata,sa scrfToken koji je poslat serveru,ako token ne budu iste vrednosti radnja ce se ponistiti i time ce se korisnik zastitit od potencijalnih napada.
