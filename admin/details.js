const url = location.search
fetch(`/api/1.0/products/details${url}`, {
  method: 'GET'
}).then(function (response) {
  if (response.status === 200) {
    return response.json() // 內建promise , send type need json
  } else if (response.status === 429) {
    alert('Too Many Requests')
  }
}).then(data => {
  const { id, title, description, price, texture, wash, place, note, story, main_image, images, colors, sizes, variants } = data.data
  const description_br = (`${description}`).replace(' ', '<br>')
  document.getElementsByClassName('product_main_image')[0].setAttribute('src', `${main_image}`)
  document.getElementsByClassName('product_title')[0].textContent = title
  document.getElementsByClassName('product_id')[0].textContent = id
  document.getElementsByClassName('product_price')[0].textContent = 'TWD.' + price
  document.getElementsByClassName('product_note')[0].textContent = note
  document.getElementsByClassName('product_texture')[0].textContent = texture
  document.getElementsByClassName('product_description')[0].innerHTML = description_br
  document.getElementsByClassName('product_wash')[0].textContent = wash
  document.getElementsByClassName('product_place')[0].textContent = place
  document.getElementsByClassName('product_story')[0].textContent = story
  const images_div = document.getElementsByClassName('images')[0]
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < images.length; i++) {
      const other_images = document.createElement('img')
      other_images.className = 'otherimages'
      other_images.setAttribute('src', `${images[i]}`)
      images_div.appendChild(other_images)
    }
  }
  let variant_colorcode
  let variant_colorname
  const product_colors = document.getElementById('colors')
  for (let j = 0; j < colors.length; j++) {
    const color = colors[j].code
    const color_block = document.createElement('button')
    color_block.setAttribute('style', `background-color: #${color};`)
    color_block.className = 'color'
    color_block.id = 'color' + j
    product_colors.appendChild(color_block)
    document.getElementById(`color${j}`).onclick = function () {
      document.getElementById(`color${j}`).className = 'color colorselect'
      variant_colorcode = colors[j].code
      variant_colorname = colors[j].name
      for (let i = 0; i < colors.length; i++) {
        if (i !== j) {
          document.getElementById(`color${i}`).className = 'color'
          document.getElementById('quantity').innerHTML = 0
          quantity = 0
        }
      }
    }
  }
  let variant_size
  const product_sizes = document.getElementById('sizes')
  for (let j = 0; j < sizes.length; j++) {
    const size = sizes[j]
    const size_block = document.createElement('button')
    size_block.textContent = size
    size_block.className = 'size'
    size_block.id = 'size' + j
    product_sizes.appendChild(size_block)
    document.getElementById(`size${j}`).onclick = function () {
      document.getElementById(`size${j}`).className = 'size sizeselect'
      variant_size = sizes[j]
      for (let i = 0; i < sizes.length; i++) {
        if (i !== j) {
          document.getElementById(`size${i}`).className = 'size'
          document.getElementById('quantity').innerHTML = 0
          quantity = 0
        }
      }
    }
  }

  let variant = 0
  let quantity = document.getElementById('quantity').innerHTML
  document.getElementById('decrement').onclick = function () {
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].color_code === variant_colorcode && variants[i].size === variant_size) {
        variant = variants[i].stock
      }
    }
    if (quantity > 0) {
      quantity--
      document.getElementById('quantity').innerHTML = quantity
    }
  }
  document.getElementById('increment').onclick = function () {
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].color_code === variant_colorcode && variants[i].size === variant_size) {
        variant = variants[i].stock
      }
    }
    if (`${variant}` === '0') {
      alert('該款式無庫存')
    } else if (quantity < variant) {
      quantity++
      document.getElementById('quantity').innerHTML = quantity
    }
  }

  document.getElementById('add-to-cart').onclick = function () {
    const quantitynumber = parseInt(quantity)
    if (quantitynumber === 0) {
      alert('請選擇需要款式')
    } else {
      const data = {
        id: `${id}`,
        name: `${title}`,
        price: `${price}`,
        color: {
          name: `${variant_colorname}`,
          code: `${variant_colorcode}`
        },
        size: `${variant_size}`,
        quantity: `${quantity}`,
        main_image: `${main_image}`,
        maxquantity: `${variant}`
      }
      const cart = localStorage.getItem('cart')
      if (cart) {
        localStorage.setItem('cart', cart + '///' + JSON.stringify(data))
      } else {
        localStorage.setItem('cart', JSON.stringify(data))
      }
      const cart_length = (localStorage.getItem('cart').split('///')).length
      document.getElementById('count').textContent = `${cart_length}`
      alert('加入購物車ok')
    }
  }
}).catch(function (err) {
  throw (err)
})
