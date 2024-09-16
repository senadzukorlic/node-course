const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session)

const errorController = require("./controllers/error")
const sequelize = require("./util/database")
const Product = require("./models/product")
const User = require("./models/user")
const Cart = require("./models/cart")
const CartItem = require("./models/cart-item")
const Order = require("./models/order")
const OrderItem = require("./models/order-item")

const app = express()
const store = new MySQLStore({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "IslamIman1",
  database: "node-complete",
})

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
)

app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user //Nacin za definisanje globalnog middleware,pomocu ovoga user i njegove instance iz baze podataka ce biti vidljive svuda u kodu
      next()
    })
    .catch((err) => console.log(err))
})

app.use("/admin", adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)
app.use(errorController.get404)

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
  // .sync({ force: true })
  .sync()
  // .then((result) => {
  //   return User.findByPk(1)
  // })
  // .then((user) => {
  //   if (!user) {                 Nacin za kreiranje laznog korisnika
  //     return User.create({
  //       email: "dakaaa01@gmail.com",
  //       password: "IslamIman1",
  //     })
  //   }
  //   return user
  // })
  // .then((user) => {
  //   return user.createCart()
  // })
  .then((cart) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
