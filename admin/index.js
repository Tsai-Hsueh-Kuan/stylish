let url = window.location.pathname
const b = window.location.search
if (url === '/') {
  url = '/all'
}
fetch(`/api/1.0/products${url}${b}`, {
  method: 'GET'
}).then(function (response) {
  if (response.status === 200) {
    return response.json()
  } else if (response.status === 429) {
    alert('Too Many Requests')
  }
}).then(data => {
  const products = document.getElementById('products')
  for (let i = 0; i < data.data.length; i++) {
    const product = document.createElement('a')
    const href = data.data[i].id
    product.setAttribute('href', `/products/details?id=${href}`)
    product.className = 'product'
    products.appendChild(product)

    const main_image = data.data[i].main_image
    const img = document.createElement('img')
    img.setAttribute('src', `${main_image}`)
    product.appendChild(img)

    const product_colors = document.createElement('div')
    product_colors.className = 'product_colors'
    product.appendChild(product_colors)

    for (let j = 0; j < data.data[i].colors.length; j++) {
      const color = data.data[i].colors[j].code
      const product_color = document.createElement('div')
      product_color.setAttribute('style', `background-color: #${color};`)
      product_color.className = 'product_color'
      product_colors.appendChild(product_color)
    }

    const title = data.data[i].title
    const product_title = document.createElement('div')
    product_title.textContent = `${title}`
    product_title.className = 'product_title'
    product.appendChild(product_title)

    const price = data.data[i].price
    const product_price = document.createElement('div')
    product_price.textContent = `TWD.${price}`
    product_price.className = 'product_price'
    product.appendChild(product_price)
  }
})
  .catch(function (err) {
    throw (err)
  })
// for campaigns
fetch('/api/1.0/marketing/campaigns', {
  method: 'GET'
}).then(function (response) {
  if (response.status === 200) {
    return response.json() // 內建promise , send type need json
  }
}).then(data => {
  function getRandomInt (max) {
    return Math.floor(Math.random() * max)
  }
  const campaign_number = getRandomInt(3)
  const campaigns = document.getElementById('campaigns')
  const id = data.data[campaign_number].product_id
  const picture = data.data[campaign_number].picture
  const campaign = document.createElement('a')
  campaign.setAttribute('href', `/products/details?id=${id}`)
  campaign.setAttribute('style', `background-image: url("${picture}")`)
  campaign.className = 'campaign'
  campaigns.appendChild(campaign)
  const story = data.data[campaign_number].story
  const campaign_story = document.createElement('div')
  campaign_story.textContent = `${story}`
  campaign_story.className = 'campaign_story'
  campaign.appendChild(campaign_story)
})
  .catch(function (err) {
    throw (err)
  })
