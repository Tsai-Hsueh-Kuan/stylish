const form = document.forms.namedItem('fileinfo')
form.addEventListener('submit', function (ev) {
  const info_id = document.getElementById('info_id').value
  const info_description = document.getElementById('info_description').value
  const info_price = document.getElementById('info_price').value
  const info_texture = document.getElementById('info_texture').value
  const info_wash = document.getElementById('info_wash').value
  const info_place = document.getElementById('info_place').value
  const info_note = document.getElementById('info_note').value
  const info_story = document.getElementById('info_story').value
  const info_sizes = document.getElementById('info_sizes').value
  const info_mainimage = document.getElementById('info_mainimage').files[0]
  const info_colorname = document.getElementById('info_colorname').value
  const info_colorcode = document.getElementById('info_colorcode').value
  if (info_id && info_description && info_price && info_texture && info_wash && info_place && info_note && info_story && info_sizes && info_mainimage && info_colorname && info_colorcode) {
    const token = localStorage.getItem('token')
    const formData = new FormData(form)
    fetch('/productinput', {
      method: 'POST',
      body: formData,
      headers: { authorization: `Bearer ${token}` }
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
        console.log(response)
      })
      .then(data => {
        const message = JSON.stringify(data)
        if (message === '{"message":"input data ok"}') {
          alert('input ok')
        } else {
          alert('please check input data')
        }
      })
  } else {
    alert('please input 完整資訊')
  }
  ev.preventDefault()
}, false)

const variant_form = document.forms.namedItem('variant_form')
variant_form.addEventListener('submit', function (ev) {
  const id = document.getElementById('id').value
  const code = document.getElementById('code').value
  const size = document.getElementById('size').value
  const stock = document.getElementById('stock').value
  if (id && code && size && stock) {
    const token = localStorage.getItem('token')
    const formData = new FormData(variant_form)
    fetch('/variantinput', {
      method: 'POST',
      body: formData,
      headers: { authorization: `Bearer ${token}` }
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
        const message = JSON.stringify(data)
        if (message === '{"message":"input variant ok"}') {
          alert('input ok')
        } else {
          alert('please check input data')
        }
      })
  } else {
    alert('please input 完整資訊')
  }
  ev.preventDefault()
}, false)
