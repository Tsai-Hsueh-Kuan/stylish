let list = {}
if (localStorage.getItem('cart')) {
  const cart_length = (localStorage.getItem('cart').split('///')).length
  if (cart_length === 1) {
    list[0] = JSON.parse(localStorage.getItem('cart'))
  } else {
    for (let i = 0; i < cart_length; i++) {
      list[i] = JSON.parse(localStorage.getItem('cart').split('///')[i])
    }
  }
} else {
  list = {}
}

let ans_price = 0
for (const k in list) {
  const cartdetail_listout = document.getElementById('cartdetail_listout')
  const cartdetail_list = document.createElement('div')
  cartdetail_list.id = `cartdetail_list${k}`
  cartdetail_list.className = 'cartdetail_list'
  cartdetail_listout.appendChild(cartdetail_list)

  const cartdetail_image = document.createElement('img')
  cartdetail_image.className = 'cartdetail_image'
  cartdetail_image.setAttribute('src', `${list[k].main_image}`)
  cartdetail_list.appendChild(cartdetail_image)

  const cartdetail_detail = document.createElement('div')
  cartdetail_detail.className = 'cartdetail_detail'
  cartdetail_list.appendChild(cartdetail_detail)

  const cartdetail_name = document.createElement('div')
  cartdetail_name.className = 'cartdetail_name'
  cartdetail_name.id = `cartdetail_name${k}`
  cartdetail_name.innerHTML = `${list[k].name}`
  cartdetail_detail.appendChild(cartdetail_name)

  const cartdetail_id = document.createElement('div')
  cartdetail_id.className = 'cartdetail_id'
  cartdetail_id.id = `cartdetail_id${k}`
  cartdetail_id.innerHTML = `${list[k].id}`
  cartdetail_detail.appendChild(cartdetail_id)

  const cartdetail_colorname = document.createElement('div')
  cartdetail_colorname.className = 'cartdetail_color.name'
  cartdetail_colorname.id = `cartdetail_color.name${k}`
  cartdetail_colorname.innerHTML = `顏色 ｜ ${list[k].color.name}`
  cartdetail_detail.appendChild(cartdetail_colorname)

  const cartdetail_colorcode = document.createElement('div')
  cartdetail_colorcode.className = 'cartdetail_colorcode'
  cartdetail_colorcode.id = `cartdetail_color.code${k}`
  cartdetail_colorcode.innerHTML = `${list[k].color.code}`
  cartdetail_detail.appendChild(cartdetail_colorcode)

  const cartdetail_size = document.createElement('div')
  cartdetail_size.className = 'cartdetail_size'
  cartdetail_size.id = `cartdetail_size${k}`
  cartdetail_size.innerHTML = `尺寸 ｜ ${list[k].size}`
  cartdetail_detail.appendChild(cartdetail_size)

  const cartdetail_select = document.createElement('select')
  cartdetail_select.className = 'cartdetail_select'
  cartdetail_select.id = `cartdetail_select${k}`
  cartdetail_list.appendChild(cartdetail_select)

  for (let i = 0; i < `${list[k].maxquantity}`; i++) {
    const cartdetail_option = document.createElement('option')
    cartdetail_option.id = `cartdetail_option${k}` + (i + 1)
    cartdetail_option.innerHTML = `${i + 1}`
    cartdetail_select.appendChild(cartdetail_option)
  }
  const finalqty = `${list[k].quantity}`
  document.getElementById(`cartdetail_option${k}${finalqty}`).selected = true

  const cartdetail_price = document.createElement('div')
  cartdetail_price.className = 'cartdetail_price'
  cartdetail_price.id = `cartdetail_price${k}`
  cartdetail_price.innerHTML = `NT.${list[k].price}`
  cartdetail_list.appendChild(cartdetail_price)

  const total_price = list[k].price * finalqty
  ans_price += total_price

  const cartdetail_totalprice = document.createElement('div')
  cartdetail_totalprice.className = 'cartdetail_totalprice'
  cartdetail_totalprice.id = `cartdetail_totalprice${k}`
  cartdetail_totalprice.innerHTML = `NT.${total_price}`
  cartdetail_list.appendChild(cartdetail_totalprice)

  const cartdetail_cancel = document.createElement('img')
  cartdetail_cancel.className = 'cartdetail_cancel'
  cartdetail_cancel.id = `cartdetail_cancel${k}`
  cartdetail_cancel.setAttribute('src', 'images/cart-remove.png')
  cartdetail_list.appendChild(cartdetail_cancel)
}

for (const k in list) {
  document.getElementById(`cartdetail_cancel${k}`).onclick = function () {
    localStorage.removeItem('cart')
    for (const j in list) {
      if ((`${list[j].id}` === document.getElementById(`cartdetail_id${k}`).innerHTML) && (`尺寸 ｜ ${list[j].size}` === document.getElementById(`cartdetail_size${k}`).innerHTML) && (`顏色 ｜ ${list[j].color.name}` === document.getElementById(`cartdetail_color.name${k}`).innerHTML)) {
        delete list[j]

        document.getElementById(`cartdetail_list${k}`).remove()
        for (const t in list) {
          if (list[t]) {
            const cart = localStorage.getItem('cart')
            if (cart) {
              localStorage.setItem('cart', cart + '///' + JSON.stringify(list[t]))
            } else {
              localStorage.setItem('cart', JSON.stringify(list[t]))
            }
          }
        }
        break
      }
    }
    ans_price = 0
    document.getElementById('subtotal').innerHTML = 0
    document.getElementById('total').innerHTML = 60

    for (const p in list) {
      if (document.getElementById(`cartdetail_totalprice${p}`)) {
        ans_price += parseInt((document.getElementById(`cartdetail_totalprice${p}`).innerHTML.split('.')[1]))
      }
      document.getElementById('subtotal').innerHTML = ans_price
      document.getElementById('total').innerHTML = `${ans_price + 60}`
    }
    if (!(localStorage.getItem('cart'))) {
      document.getElementById('subtotal').innerHTML = '0'
      document.getElementById('total').innerHTML = '60'
    }

    if (localStorage.getItem('cart')) {
      const cartlength1 = (localStorage.getItem('cart').split('///')).length
      document.getElementById('count').textContent = `${cartlength1}`
      document.getElementById('cart_title').textContent = `購物車(${cartlength1})`
    } else {
      document.getElementById('count').textContent = '0'
      document.getElementById('cart_title').textContent = '購物車(0)'
    }
  }
}

for (const k in list) {
  document.getElementById(`cartdetail_select${k}`).onchange = function () {
    localStorage.removeItem('cart')
    let finalqty
    if (document.getElementById(`cartdetail_select${k}`).value) {
      finalqty = document.getElementById(`cartdetail_select${k}`).value
      list[k].quantity = `${finalqty}`
    }
    for (const t in list) {
      const cart = localStorage.getItem('cart')
      if (cart) {
        localStorage.setItem('cart', cart + '///' + JSON.stringify(list[t]))
      } else {
        localStorage.setItem('cart', JSON.stringify(list[t]))
      }
    }
    const ans = list[k].price * finalqty
    document.getElementById(`cartdetail_totalprice${k}`).innerHTML = `NT.${ans}`

    ans_price = 0
    document.getElementById('subtotal').innerHTML = 0
    document.getElementById('total').innerHTML = 60

    for (const p in list) {
      if (document.getElementById(`cartdetail_totalprice${p}`)) {
        ans_price += parseInt((document.getElementById(`cartdetail_totalprice${p}`).innerHTML.split('.')[1]))
      }
      document.getElementById('subtotal').innerHTML = ans_price
      document.getElementById('total').innerHTML = `${ans_price + 60}`
    }
    if (!(localStorage.getItem('cart'))) {
      document.getElementById('subtotal').innerHTML = '0'
      document.getElementById('total').innerHTML = '60'
    }
  }
}

document.getElementById('subtotal').innerHTML = ans_price
document.getElementById('total').innerHTML = `${ans_price + 60}`

TPDirect.setupSDK(12348, 'app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF', 'sandbox') //eslint-disable-line
TPDirect.card.setup('#cardview-container') //eslint-disable-line
document.getElementById('submit-button').onclick = function () {
  TPDirect.card.getPrime(function (result) { //eslint-disable-line
    if (result.status !== 0) {
      alert('getPrime 錯誤 , 請重新輸入信用卡資料')
      return
    }
    if (result.card.prime) {
      const token = localStorage.getItem('token')
      const checkcart = localStorage.getItem('cart')
      if ((!(document.getElementById('name').value)) || (!(document.getElementById('cellphonenumber').value)) || (!(document.getElementById('email').value)) || (!(document.getElementById('address').value)) || (!(document.getElementById('time').value))) {
        alert('請填寫完整訂購者資料！')
      } else if (!checkcart) {
        alert('購物車是空的！')
      } else {
        const data = {
          prime: `${result.card.prime}`,
          order: {
            shipping: document.getElementById('shipping').value,
            payment: document.getElementById('payment').value,
            subtotal: `${ans_price}`,
            freight: `${60}`,
            total: `${ans_price + 60}`,
            recipient: { name: document.getElementById('name').value, phone: document.getElementById('cellphonenumber').value, email: document.getElementById('email').value, address: document.getElementById('address').value, time: document.getElementById('time').value },
            list: list
          }
        }
        fetch('/api/1.0/order/checkout', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
        })
          .then(function (response) {
            if (response.status === 200) {
              return response.json()
            } else if (response.status === 401) {
              alert('請先登入')
              return window.location.assign('/user/signin')
            } else if (response.status === 403) {
              alert('登入逾期')
              return window.location.assign('/user/signin')
            } else if (response.status === 429) {
              alert('Too Many Requests')
            }
          })
          .then(data => {
            if (data) {
              window.location.assign(`/thankyou.html?${data}`)
            }
          })
      }
    }
  })
}
