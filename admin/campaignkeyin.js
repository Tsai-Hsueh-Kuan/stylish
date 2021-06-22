const form = document.forms.namedItem('fileinfo')

form.addEventListener('submit', function (ev) {
  const token = localStorage.getItem('token')
  const formData = new FormData(form)
  fetch('/admin/campaign', {
    method: 'POST',
    body: formData
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
      console.log(data)
      alert('input ok')
    })
  ev.preventDefault()
}, false)
