const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const path = require('path')
const TapPay = require('tappay-nodejs')
const { promisify } = require('util')
const aws = require('aws-sdk')
const multerS3 = require('multer-s3')
const multer = require('multer')

// for .env
require('dotenv').config()
// for file s3
const s3 = new aws.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key
})
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'kuans3/stylish',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    mimetype: 'image/png',
    key: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})
// jwt
const jwt = require('jsonwebtoken')

const redis = require('redis')
const cache = redis.createClient(6379, 'kuanredis.az33mo.ng.0001.use2.cache.amazonaws.com', { no_ready_check: true })
cache.on('ready', () => {
  console.log('redis is ready')
})
cache.on('error', () => {

})
const promisifyget = promisify(cache.get).bind(cache)
const promisifyset = promisify(cache.set).bind(cache)

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(express.urlencoded({ extended: true }))
router.use(express.json())
router.use(express.static('public'))
router.use(express.static('admin'))
router.use(express.static('pup'))

// create connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: 'stylish',
  waitForConnections: true,
  connectionLimit: 5000
})

const promiseQuery = promisify(db.query).bind(db)
// Marketing Campaigns page
router.get('/admin/campaign.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/campaignkeyin.html'), function (err) {
    if (err) res.send(404)
  })
})

// cart page
router.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/cart.html'), path.join(__dirname, '../.env'), function (err) {
    if (err) res.send(404)
  })
})

router.get('/admin/check', verifyToken_admin, (req, res) => {
  console.log('check admin ok')
  res.send('ok')
})
// thankyou page
router.get('/thankyou.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/thankyou.html'), function (err) {
    if (err) res.send(404)
  })
})
// admin checkout api
const fields = [{ name: 'picture' }, { name: 'picture1' }]
router.post('/admin/campaign', verifyToken_admin, upload.fields(fields), async (req, res, next) => {
  try {
    const sql = 'insert into campaigns(product_id,picture,story) values(?,?,?)'
    const sql_value = [req.body.product_id, req.files.picture[0].originalname, req.body.story]
    await promiseQuery(sql, sql_value)
    const key = 'campaign'
    if (cache.ready) {
      cache.get(key, function (err, value) {
        if (err) {
          console.log('cache err , input ok')
        } else if (value) {
          cache.delete(key, function (err) {
            if (err) {
              console.log('del err , input ok')
            } else {
              console.log('input ok')
            }
          })
        } else {
          console.log('input ok')
        }
      })
    }
    res.json({ message: 'input data ok' })
  } catch (err) {
    next(err)
  }
})
// Marketing Campaigns API
router.get('/api/1.0/marketing/campaigns', (req, res) => {
  if (cache.ready) {
    cache.get('campaign', function (err, value) {
      if (err) {
        console.log('campaigns cache err')
        const sql = 'SELECT * FROM campaigns'
        db.query(sql, (err, result) => {
          if (err) { throw err } else {
            for (let i = 0; i < result.length; i++) {
              result[i].picture = process.env.IP + result[i].picture
            }
          }
          const campaign = { data: result }
          res.send(campaign)
        })
      }
      if (value) {
        res.send(JSON.parse(value))
      } else {
        const sql = 'SELECT * FROM campaigns'
        db.query(sql, (err, result) => {
          if (err) { throw err } else {
            for (let i = 0; i < result.length; i++) {
              result[i].picture = process.env.IP + result[i].picture
            }
          }
          const campaign = { data: result }
          const key = 'campaign'
          const value = campaign
          const lifetime = 300
          cache.set(key, JSON.stringify(value), 'EX', lifetime, function (err) {
            if (err) {
              throw err
            }
          })
          res.send(campaign)
        })
      }
    })
  } else {
    const sql = 'SELECT * FROM campaigns'
    db.query(sql, (err, result) => {
      if (err) { throw err } else {
        for (let i = 0; i < result.length; i++) {
          result[i].picture = process.env.IP + result[i].picture
        }
      }
      const campaign = { data: result }
      res.send(campaign)
    })
  }
})

// authorization: Bearer <access_token>
function verifyToken (req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader.split(' ')[1]
  if (token.length === 4) {
    console.log('please登入')
    res.sendStatus(401)
  } else {
    jwt.verify(token, process.env.secret, (err, result) => {
      if (err) {
        console.log('wrong token')
        return res.sendStatus(403)
      };
      req.user = result
      next()
    })
  }
}
// admin check
function verifyToken_admin (req, res, next) {
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization // Get the auth header value
    const token = authHeader.split(' ')[1]
    if (token.length === 4) {
      console.log('please登入')
      res.sendStatus(401)
    } else {
      jwt.verify(token, process.env.secret, (err, result) => {
        if (err) {
          console.log('wrong token')
          return res.sendStatus(403)
        } else if (result) {
          const email = result.email
          const sql = 'SELECT * FROM user where email = ?'
          const sql_value = `${email}`
          db.query(sql, sql_value, (err, result) => {
            if (err) {
              throw err
            } else if (result[0]) {
              if (result[0].roles === 'admin') {
                next()
              } else {
                console.log('not admin')
                return res.sendStatus(403)
              }
            } else {
              console.log('not current email')
              return res.sendStatus(403)
            }
          })
        } else {
          console.log('wrong data')
          return res.sendStatus(403)
        }
      })
    }
  } else {
    console.log('please登入')
    res.sendStatus(401)
  }
}
router.get('/api/1.0/loop/order', async (req, res, next) => {
  await promiseQuery('TRUNCATE TABLE ordertable')
  const sql_array = []
  for (let i = 0; i < 200000; i++) {
    const price = Math.floor(Math.random() * 840) + 101
    const id = Math.floor(Math.random() * 5) + 1
    const sql_value = [`${price + 60}`, `${id}`]
    sql_array.push(sql_value)
  }
  const sql = 'INSERT INTO ordertable(total, user_id) VALUES ?'
  await promiseQuery(sql, [sql_array], (err) => {
    if (err) {
      res.send(err)
    } else {
      res.send('input ok')
    }
  })
})

router.get('/api/1.0/order/payments', async (req, res, next) => {
  // let orders = await promiseQuery('SELECT user_id,total FROM ordertable');
  // let result = []
  // orders.map( o => {
  //     if (!result[o.user_id - 1]) {
  //         result[o.user_id - 1] = {}
  //         result[o.user_id - 1].user_id = o.user_id;
  //         result[o.user_id - 1].total_payment = o.total;
  //     } else {
  //         result[o.user_id - 1].total_payment = result[o.user_id - 1].total_payment + o.total;
  //     }
  // })
  // res.send ({data : result});

  // let orders = await promiseQuery('SELECT user_id, sum(total) FROM ordertable group by user_id');
  // res.send({data : orders})

  let redis_orders
  const a = await promisifyget(123)
  redis_orders = JSON.parse(a)
  if (!redis_orders) {
    const orders = await promiseQuery('SELECT user_id, sum(total) FROM ordertable group by user_id')
    await promisifyset(123, JSON.stringify(orders), 'EX', 180)
    console.log('set')
    res.send({ data: orders })
  } else {
    res.send({ data: (redis_orders) })
  }
})

router.post('/api/1.0/order/checkout', ip_limit, verifyToken, (req, res, next) => {
  let orderid
  const sql = 'INSERT INTO ordertable(shipping, payment, subtotal, freight, total, user_id, recipient_phone, recipient_email, recipient_address, recipient_time,prime,ispaid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  const sql_value = [req.body.order.shipping, req.body.order.payment, req.body.order.subtotal, req.body.order.freight, req.body.order.total, req.body.order.recipient.name, req.body.order.recipient.phone, req.body.order.recipient.email, req.body.order.recipient.address, req.body.order.recipient.time, req.body.prime, 0]
  db.query(sql, sql_value, (err) => {
    if (err) {
      res.send(err)
    }
  })
  const sql_orderid = 'SELECT order_id FROM ordertable WHERE prime =?'
  const sql_orderidvalue = req.body.prime
  db.query(sql_orderid, sql_orderidvalue, (err, result) => {
    if (err) {
      res.send(err)
    }
    orderid = result[0].order_id // 理論上不用[0],prime不該重複
    for (const i in req.body.order.list) {
      const sql1 = 'INSERT INTO orderlist(listid,listname,listprice,listcolorcode,listcolorname,listsize,listqty,order_id) VALUES (?,?,?,?,?,?,?,?)'
      const sql_value1 = [req.body.order.list[i].id, req.body.order.list[i].name, req.body.order.list[i].price, req.body.order.list[i].color.code, req.body.order.list[i].color.name, req.body.order.list[i].size, req.body.order.list[i].quantity, orderid]
      db.query(sql1, sql_value1, (err) => {
        if (err) {
          res.send(err)
        }
      })
    }
  })
  let details
  for (const i in req.body.order.list) {
    details += (req.body.order.list[i].name)
  }
  const post_data = {
    partner_key: process.env.parter_key,
    prime: req.body.prime,
    amount: req.body.order.total,
    merchant_id: 'AppWorksSchool_CTBC',
    details: details,
    cardholder: {
      phone_number: req.body.order.recipient.phone,
      name: req.body.order.recipient.name,
      email: req.body.order.recipient.email,
      address: req.body.order.recipient.address
    },
    remember: false
  }
  TapPay.initialize({
    partner_key: process.env.parter_key,
    env: 'sandbox'
  })
  TapPay.payByPrime(post_data, (error, result) => {
    if (error) {
      res.send(error)
    } else if (result.status === 0) {
      const sql_ispaid = 'UPDATE ordertable SET ispaid = 1 WHERE order_id = ?'
      db.query(sql_ispaid, orderid, (err) => {
        if (err) {
          res.send(err)
        }
        res.send(`${orderid}`)
        console.log('付款 ok')
      })
    } else {
      res.send(result)
      console.log('付款失敗')
    }
  })
})
// ip limit
function ip_limit (req, res, next) {
  const key = `${req.socket.remoteAddress}`
  if (!cache.ready) {
    return next()
  }
  cache.get(key, function (err, value) {
    if (err) {
      console.log('limit cache err')
      throw err
    }
    if (value) {
      let ip_count = parseInt(value)
      if (ip_count < 5) {
        ip_count++
        cache.set(key, ip_count, 'Ex', 5, function (err) {
          if (err) {
            throw err
          }
          next()
        })
      } else {
        console.log('please稍後再試')
        res.sendStatus(429)
      }
    } else {
      cache.set(key, 1, 'Ex', 5, function (err) {
        if (err) {
          throw err
        }
        next()
      })
    }
  })
}

module.exports = router
