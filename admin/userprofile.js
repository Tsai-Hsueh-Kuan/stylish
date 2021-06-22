const token = localStorage.getItem('token')
fetch('/api/1.0/user/profile', {
  method: 'GET',
  headers: { authorization: `Bearer ${token}` }
}).then(function (response) {
  if (response.status === 200) {
    return response.json() // 內建promise , send type need json
  } else if (response.status === 401) {
    alert('請先登入')
    return window.location.assign('/user/signin')
  } else if (response.status === 403) {
    alert('登入逾期')
    return window.location.assign('/user/signin')
  } else if (response.status === 429) {
    alert('Too Many Requests')
  }
}).then(data => {
  const user_name = document.getElementById('name')
  const user_email = document.getElementById('email')
  const user_picture = document.getElementById('picture')
  user_name.textContent = `${data.data.name}`
  user_email.textContent = `${data.data.email}`
  if (data.data.picture) {
    user_picture.setAttribute('src', `${data.data.picture}`)
  }
})
  .catch(function (err) {
    return err
  })

function signout() { //eslint-disable-line
  alert('登出成功')
  localStorage.removeItem('token')
  return window.location.assign('/user/signin')
}
