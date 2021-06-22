const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const path = require('path')
const validator = require('validator') // name = validator.escape(name);(!validator.isEmail(email))
const aws = require('aws-sdk')
const multerS3 = require('multer-s3')
const multer = require('multer')
// for .env
require('dotenv').config()
// for password
const { createHash } = require('crypto')
// for images
const s3 = new aws.S3({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key
})
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'kuans3/stylish',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})
// jwt
const jwt = require('jsonwebtoken')
// for fb
const axios = require('axios')
// for node js marketing
const routes = require('./routes/marketing')

const redis = require('redis')
const cache = redis.createClient(6379, process.env.REDIS_HOST, { no_ready_check: true })
cache.on('ready', () => {
  console.log('redis is ready')
})
cache.on('error', () => {

})
//  apply to all requests
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(routes)
app.use(express.static('public'))
app.use(express.static('admin'))

// create connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: 'stylish',
  waitForConnections: true,
  connectionLimit: 5000
})

const promisify = require('util').promisify
const promiseQuery = promisify(db.query).bind(db)

app.post('/user/test', async (req, res) => {
  console.log(req.body.picture)
  const fs = require('fs')
  const path = '/desktop/' + Date.now() + '.png'
  const base64 = req.body.picture
  const dataBuffer = new Buffer.from(base64, 'base64') // 把base64碼轉成buffer物件，
  fs.writeFile(path, dataBuffer, function (err) { // 用fs寫入檔案
    if (err) {
      console.log(err)
    } else {
      console.log('寫入成功！')
    }
  })
})

// home page
app.get('/:id', (req, res, next) => {
  if (req.params.id === 'all' || req.params.id === 'women' || req.params.id === 'men' || req.params.id === 'accessories' || req.params.id === 'search') {
    res.sendFile(path.join(__dirname, '/admin/index.html'), (err) => {
      if (err) res.send(404)
    })
  } else {
    next()
  }
})
// detail page
app.get('/products/details', (req, res) => {
  res.sendFile(path.join(__dirname, '/admin/details.html'), (err) => {
    if (err) res.send(404)
  })
})
// sign up page
app.get('/user/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '/admin/usersignup.html'), (err) => {
    if (err) res.send(404)
  })
})
// sign in page
app.get('/user/signin', (req, res) => {
  res.sendFile(path.join(__dirname, '/admin/usersignin.html'), (err) => {
    if (err) res.send(404)
  })
})
// profile page
app.get('/user/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '/admin/userprofile.html'), (err) => {
    if (err) res.send(404)
  })
})
// product for admin key in
app.get('/admin/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/admin/product.html'), (err) => {
    if (err) res.send(404)
  })
})

const fields = [{ name: 'main_image' }, { name: 'images' }]// for upload files , Format error if not used
app.post('/productinput', verifyToken_admin, upload.fields(fields), async (req, res, next) => {
  try {
    const sql0 = 'insert into ProductObject(id,catagory,title,description,price,texture,wash,place,note,story,sizes,main_image) values(?,?,?,?,?,?,?,?,?,?,?,?)'
    const sql_value0 = [req.body.id, req.body.catagory, req.body.title, req.body.description, req.body.price, req.body.texture, req.body.wash, req.body.place, req.body.note, req.body.story, req.body.sizes, req.files.main_image[0].originalname]
    await promiseQuery(sql0, sql_value0)
    console.log('輸入product ok')
    const name = req.body.color_name.split(',')
    const code = req.body.color_code.split(',')
    for (let i = 0; i < name.length; i++) {
      const sql = 'insert into ColorObject(id,name,code) values(?,?,?)'
      const sql_value = [req.body.id, name[i], code[i]]
      await promiseQuery(sql, sql_value)
      console.log('輸入color ok!')
    }
    if (req.files.images) {
      for (let i = 0; i < req.files.images.length; i++) {
        const sql = 'insert into ImagesObject(id,images) values(?,?)'
        const sql_value = [req.body.id, req.files.images[i].originalname]
        await promiseQuery(sql, sql_value)
        console.log('輸入image ok!')
      }
    }
    const key = `${req.body.id}`
    if (cache.ready) {
      cache.get(key, function (err, value) {
        if (err) {
          console.log('cache err!')
          res.json({ message: 'input data ok' })
        } else if (value) {
          cache.delete(key, function (err) {
            if (err) {
              throw err
            } else {
              console.log('del cache ok!')
            }
          })
        } else {
          console.log('check no cache ok!')
        }
      })
    }
    res.json({ message: 'input data ok' })
  } catch (err) {
    next(err)
  }
})

app.post('/variantinput', verifyToken_admin, upload.fields(fields), async (req, res, next) => {
  try {
    const sql = 'insert into VariantObject(id,color_code,size,stock) values(?,?,?,?)'
    const sql_value = [req.body.id, req.body.color_code, req.body.size, req.body.stock]
    await promiseQuery(sql, sql_value)
    const key = `${req.body.id}`
    if (cache.ready) {
      cache.get(key, function (err, value) {
        if (err) {
          console.log('cache err!')
          res.json({ message: 'input variant ok' })
        } else if (value) {
          cache.delete(key, function (err) {
            if (err) {
              throw err
            } else {
              console.log('del cache ok!')
            }
          })
        } else {
          console.log('check no cache ok!')
        }
      })
    }
    console.log('輸入庫存ok!')
    res.json({ message: 'input variant ok' })
  } catch (err) {
    next(err)
  }
})

const product_data = {}
let page_start = 0
const product_select = function (type) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id,title,description,price,texture,wash,place,note,story,sizes,main_image FROM ProductObject WHERE catagory = ? limit ?,6'
    const sql_value = [type, page_start]
    db.query(sql, sql_value, (err, result) => {
      if (err) { reject(err) } else {
        for (let i = 0; i < result.length; i++) {
          result[i].sizes = result[i].sizes.split(',')
          result[i].main_image = process.env.IP + result[i].main_image
        }
        product_data.data = result
        if ((page_start / 6) < (total_page - 1)) {
          product_data.next_paging = (page_start / 6) + 1
        } else {
          delete product_data.next_paging
        }
        resolve(product_data)
      }
    })
  })
}

const product_selectall = function () {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id,title,description,price,texture,wash,place,note,story,sizes,main_image FROM ProductObject limit ?,6'
    const sql_value = [page_start]
    db.query(sql, sql_value, (err, result) => {
      if (err) { reject(err) } else {
        for (let i = 0; i < result.length; i++) {
          result[i].sizes = result[i].sizes.split(',')
          result[i].main_image = process.env.IP + result[i].main_image
        }
        product_data.data = result
        if ((page_start / 6) < (total_page - 1)) {
          product_data.next_paging = (page_start / 6) + 1
        } else {
          delete product_data.next_paging
        }
        resolve(product_data)
      }
    })
  })
}

const product_searchall = function (title) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id,title,description,price,texture,wash,place,note,story,sizes,main_image FROM ProductObject WHERE title LIKE ? limit ?,6'
    const sql_value = [`%${title}%`, page_start]
    db.query(sql, sql_value, (err, result) => {
      if (err) { reject(err) } else {
        for (let i = 0; i < result.length; i++) {
          result[i].sizes = result[i].sizes.split(',')
          result[i].main_image = process.env.IP + result[i].main_image
        }
        product_data.data = result
        if ((page_start / 6) < (total_page - 1)) {
          product_data.next_paging = (page_start / 6) + 1
        } else {
          delete product_data.next_paging
        }
        resolve(product_data)
      }
    })
  })
}

const product_searchbyid = function (id) { // for details by id
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id,title,description,price,texture,wash,place,note,story,sizes,main_image FROM ProductObject WHERE id = ?'
    const sql_value = [id]
    db.query(sql, sql_value, (err, result) => {
      if (err) { reject(err) } else {
        delete product_data.next_paging
        for (let i = 0; i < result.length; i++) {
          result[i].sizes = result[i].sizes.split(',')
          result[i].main_image = process.env.IP + result[i].main_image
        }
        product_data.data = result
        resolve(product_data)
      }
    })
  })
}

const colorselect = function () {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ColorObject.id,ColorObject.name,ColorObject.code FROM ColorObject left JOIN ProductObject on ProductObject.id = ColorObject.id '
    db.query(sql, (err, result) => {
      if (err) { reject(err) } else {
        for (let j = 0; j < product_data.data.length; j++) {
          product_data.data[j].colors = []
          for (let i = 0; i < result.length; i++) {
            if (result[i].id === product_data.data[j].id) {
              const color = {}
              color.name = (result[i].name)
              color.code = (result[i].code)
              product_data.data[j].colors.push(color)
            }
          }
        }
      }
      resolve(product_data)
    })
  })
}

const variantselect = function () {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT VariantObject.id,VariantObject.color_code,VariantObject.size,VariantObject.stock FROM VariantObject left JOIN ProductObject on ProductObject.id = VariantObject.id '
    db.query(sql, (err, result) => {
      if (err) { reject(err) } else {
        for (let j = 0; j < product_data.data.length; j++) {
          product_data.data[j].variants = []
          for (let i = 0; i < result.length; i++) {
            if (result[i].id === product_data.data[j].id) {
              const color = {}
              color.color_code = (result[i].color_code)
              color.size = (result[i].size)
              color.stock = (result[i].stock)
              product_data.data[j].variants.push(color)
            }
          }
        }
      }
      resolve(product_data)
    })
  })
}

const imagesselect = function () {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ImagesObject.id,ImagesObject.images FROM ImagesObject left JOIN ProductObject on ProductObject.id = ImagesObject.id '
    db.query(sql, (err, result) => {
      if (err) { reject(err) } else {
        for (let j = 0; j < product_data.data.length; j++) {
          product_data.data[j].images = []
          for (let i = 0; i < result.length; i++) {
            if (result[i].id === product_data.data[j].id) {
              const color = process.env.IP + (result[i].images)
              product_data.data[j].images.push(color)
            }
          }
        }
      }
      resolve(product_data)
    })
  })
}

let total_page
const pagecheck = function (x) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM ProductObject WHERE catagory = ?'
    const sql_value = [x]
    db.query(sql, sql_value, (err, result) => {
      if (err) { reject(err) } else {
        total_page = Math.ceil(result.length / 6)
      } resolve(total_page)
    })
  })
}

const pagecheckall = function () {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM ProductObject'
    db.query(sql, (err, result) => {
      if (err) { reject(err) } else {
        total_page = Math.ceil(result.length / 6)
      }
      resolve(total_page)
    })
  })
}
//
app.get('/api/1.0/products/all', ip_limit, async (req, res) => {
  await pagecheckall()
  if (!(req.query.paging)) {
    page_start = 0
    await product_selectall()
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else if (Number(req.query.paging) < total_page) {
    page_start = Number(req.query.paging) * 6
    await product_selectall()
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else {
    res.send(404)
  }
})

app.get('/api/1.0/products/men', ip_limit, async (req, res) => {
  await pagecheck('men')
  if (!(req.query.paging)) {
    page_start = 0
    await product_select('men')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else if (Number(req.query.paging) < total_page) {
    page_start = Number(req.query.paging) * 6
    await product_select('men')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else {
    res.send(404)
  }
})

app.get('/api/1.0/products/women', ip_limit, async (req, res) => {
  await pagecheck('women')
  if (!(req.query.paging)) {
    page_start = 0
    await product_select('women')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else if (Number(req.query.paging) < total_page) {
    page_start = Number(req.query.paging) * 6
    await product_select('women')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else {
    res.send(404)
  }
})

app.get('/api/1.0/products/accessories', ip_limit, async (req, res) => {
  await pagecheck('accessories')
  if (!(req.query.paging)) {
    page_start = 0
    await product_select('accessories')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else if (Number(req.query.paging) < total_page) {
    page_start = Number(req.query.paging) * 6
    await product_select('accessories')
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else {
    res.send(404)
  }
})

const pagesearchall = function (x) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM ProductObject WHERE title LIKE '%${x}%'`
    db.query(sql, (err, result) => {
      if (err) { reject(err) } else {
        total_page = Math.ceil(result.length / 6)
      }
      resolve(total_page)
    })
  })
}

app.get('/api/1.0/products/search', ip_limit, async (req, res) => {
  const searchkeyword = req.query.keyword
  await pagesearchall(searchkeyword)
  if (!(req.query.paging)) {
    page_start = 0
    await product_searchall(searchkeyword)
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else if (Number(req.query.paging) < total_page) {
    page_start = Number(req.query.paging) * 6
    await product_searchall(searchkeyword)
    await colorselect()
    await variantselect()
    await imagesselect()
    res.send(product_data)
  } else {
    res.send(404)
  }
})

app.get('/api/1.0/products/details', ip_limit, async (req, res) => {
  const { id } = req.query

  const details_function = async function () {
    await product_searchbyid(id)
    await colorselect()
    await variantselect()
    await imagesselect()
    const key = `${id}`
    const value = product_data.data[0]
    const lifetime = 300 // seconds
    const detail_data = {}
    detail_data.data = value
    if (cache.ready) {
      cache.set(key, JSON.stringify(detail_data), 'EX', lifetime, function (err, next) {
        if (err) {
          throw err
        }
      })
    }
    res.send(detail_data)
  }
  const err_function = async function () {
    await product_searchbyid(id)
    await colorselect()
    await variantselect()
    await imagesselect()
    const value = product_data.data[0]
    const detail_data = {}
    detail_data.data = value
    res.send(detail_data)
  }

  if (cache.ready) {
    cache.get(id, function (err, value) {
      if (err) {
        console.log('details cache err')
        err_function()
      }
      if (value) {
        res.send(value)
      } else {
        details_function()
      }
    })
  } else {
    details_function()
  }
})
// ip limit
function ip_limit (req, res, next) {
  const key = `${req.socket.remoteAddress}`
  if (!cache.ready) {
    return next()
  }
  return new Promise((resolve, reject) => {
    cache.get(key, function (err, value) {
      if (err) {
        resolve(next())
      }
      if (value) {
        let ip_count = parseInt(value)
        if (ip_count < 10) {
          ip_count++
          cache.set(key, ip_count, 'EX', 10, function (err) {
            if (err) {
              resolve(next())
            }
            resolve(next())
          })
        } else {
          res.sendStatus(429)
        }
      } else {
        cache.set(key, 1, 'EX', 10, function (err) {
          if (err) {
            resolve(next())
          }
          resolve(next())
        })
      }
    })
  })
}
// authorization: Bearer <access_token>
function verifyToken (req, res, next) {
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
      }
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
// profile api
app.get('/api/1.0/user/profile', ip_limit, verifyToken, (req, res) => {
  const sql = 'SELECT * FROM user WHERE email =?'
  const sql_value = [req.user.email]
  db.query(sql, sql_value, (err, result) => {
    if (err) {
      res.sendStatus(403) // "input err!!!"
    } else if (result[0]) {
      const user_data = {
        data: {
          provider: result[0].provider, name: result[0].name, email: result[0].email, picture: result[0].picture
        }
      }
      res.send(user_data)
    } else {
      res.json({ message: 'no data' })
    }
  })
})

// for password encryption
const passwordencryption = function (x) {
  const hash = createHash('sha256')
  hash.update(x)
  return (hash.digest('hex'))
}
// sign up api
app.post('/api/1.0/user/signup', ip_limit, (req, res) => {
  if ((req.body.email.split('@').length === 2) && (req.body.name) && (req.body.password) && (req.body.email.split('@')[0]) && (req.body.email.split('@')[1])) {
    const sql = 'SELECT * FROM user WHERE email =?' //  確認沒註冊過
    const sql_value = [req.body.email]
    db.query(sql, sql_value, (err, result) => {
      if (err) {
        res.sendStatus(403) // "input err
      } else if (result[0]) {
        const api_data = { message: {} }
        api_data.message.message = 'email 重複'
        res.json(api_data) // "email Duplicate input!!!"
      } else {
        req.body.name = validator.escape(req.body.name)
        const sql = 'insert into user(provider,name,email,password,roles) values(?,?,?,?,?)'
        const password_sql = passwordencryption(req.body.password)
        const sql_value = ['native', req.body.name, req.body.email, password_sql, 'user']
        db.query(sql, sql_value, (err, result) => {
          if (err) {
            res.sendStatus(403) // "input err!!!"
          } else {
            const useremail = req.body.email
            const sql = 'SELECT provider,name,email,picture,roles FROM user WHERE email = ?'
            const sql_value = useremail
            db.query(sql, sql_value, (err, result) => {
              if (err) {
                res.sendStatus(403)
              } else if (result[0]) {
                const api_data = { data: {} }
                const user = { name: result[0].name, email: result[0].email, roles: result[0].roles }
                const token = jwt.sign(user, process.env.secret, { expiresIn: '3600s' })
                api_data.data.access_token = token
                api_data.data.access_expired = 3600
                api_data.data.user = result[0]
                res.json(api_data)
              }
            })
          }
        })
      }
    })
  } else {
    res.json({ message: 'input data format err!!!' })// for .catch
  }
})

// sign in api
app.post('/api/1.0/user/signin', ip_limit, async (req, res) => {
  if (req.body.provider === 'native') {
    const sql = 'SELECT * FROM user WHERE email =? AND password = ?'
    const password_sql = passwordencryption(req.body.password)
    const sql_value = [req.body.email, password_sql]
    db.query(sql, sql_value, (err, result) => {
      if (err) {
        res.sendStatus(500) // "input err!!!
      } else if (result[0]) {
        const user_email = result[0].email
        const sql = 'SELECT provider,name,email,picture,roles FROM user WHERE email = ?'
        const sql_value = user_email
        db.query(sql, sql_value, (err, result) => {
          if (err) {
            res.sendStatus(400)
          } else if (result[0]) {
            const api_data = { data: {} }
            const user = { name: result[0].name, email: result[0].email, roles: result[0].roles }
            const token = jwt.sign(user, process.env.secret, { expiresIn: '3600s' })
            api_data.data.access_token = token
            api_data.data.access_expired = 3600
            api_data.data.user = result[0]
            res.json(api_data)
          }
        })
      } else {
        res.sendStatus(403) // "input err!!!"
      }
    })
  } else if (req.body.provider === 'facebook') {
    const fb_token = req.body.access_token
    const result = await getFacebookUserData(fb_token)
    const user = { name: result.first_name, email: result.email, picture: result.picture.data.url }
    const fbpassword_sql = passwordencryption(result.email)
    const sql = 'insert into user (provider,name,email,password,picture,roles) values(?,?,?,?,?,?)'
    const sql_value = ['facebook', user.name, user.email, fbpassword_sql, user.picture, 'user']
    const sql1 = 'SELECT provider,name,email,picture,roles FROM user WHERE email = ?'
    const sql_value1 = user.email
    db.query(sql1, sql_value1, (err, result) => {
      if (err) throw err
      if (result[0]) {
        const api_data = { data: {} }
        const user = { name: result[0].name, email: result[0].email, roles: result[0].roles }
        const token = jwt.sign(user, process.env.secret, { expiresIn: '3600s' })
        api_data.data.access_token = token
        api_data.data.access_expired = 3600
        api_data.data.user = result[0]
        res.json(api_data)
      } else {
        db.query(sql, sql_value, (err, result) => {
          if (err) {
            res.sendStatus(403)
          } else {
            const sql = 'SELECT provider,name,email,picture,roles FROM user WHERE email = ?'
            const sql_value = user.email
            db.query(sql, sql_value, (err, result) => {
              if (err) {
                res.sendStatus(400)
              } else if (result[0]) {
                const api_data = { data: {} }
                const user = { name: result[0].name, email: result[0].email, roles: result[0].roles }
                const token = jwt.sign(user, process.env.secret, { expiresIn: '3600s' })
                api_data.data.access_token = token
                api_data.data.access_expired = 3600
                api_data.data.user = result[0]
                res.json(api_data)
              }
            })
          }
        })
      }
    })
  } else {
    res.send('provide err')
  }
})

// fb signin function
async function getFacebookUserData (access_token) {
  const { data } = await axios({
    url: 'https://graph.facebook.com/me',
    method: 'get',
    params: {
      fields: ['email', 'first_name', 'picture'].join(','),
      access_token
    }
  })
  return data
}

app.use(function (req, res, next) {
  res.status(404).send('page not found')
})

app.use(function (err, req, res, next) {
  res.status(500).send(err)
})

// listen
app.listen('3001', () => {
  console.log('server started on port 3001')
})
